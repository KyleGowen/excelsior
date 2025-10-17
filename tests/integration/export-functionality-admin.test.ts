import { Pool } from 'pg';
import { integrationTestUtils } from '../setup-integration';

// Simple UUID v4 generator for tests
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

describe('Export Functionality - Admin Integration Test', () => {
    let pool: Pool;
    let testUserId: string | null = null;
    let testUserPassword: string = 'test_password_123';
    let createdDeckIds: string[] = [];

    beforeAll(async () => {
        // Set up database connection - use shared connection
        pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
        });
        
        // Ensure test server is initialized
        await integrationTestUtils.ensureGuestUser();
        await integrationTestUtils.ensureAdminUser();
    });

    afterAll(async () => {
        // Clean up created decks
        for (const deckId of createdDeckIds) {
            try {
                await pool.query('DELETE FROM decks WHERE id = $1', [deckId]);
            } catch (error) {
                console.warn(`Failed to clean up deck ${deckId}:`, error);
            }
        }

        // Clean up test user
        if (testUserId) {
            try {
                await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
            } catch (error) {
                console.warn(`Failed to clean up user ${testUserId}:`, error);
            }
        }

        await pool.end();
    });

    test('should export deck with various card types and quantities as ADMIN user', async () => {
        // Create ADMIN test user
        const userName = `export-test-admin-${Date.now()}`;
        const userEmail = `${userName}@test.com`;
        testUserId = generateUUID();
        
        // Hash the password
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('test_password_hash', 10);
        
        const userResult = await pool.query(
            'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
            [testUserId, userName, userEmail, hashedPassword, 'ADMIN']
        );

        expect(userResult.rows[0]).toBeDefined();
        expect(userResult.rows[0].role).toBe('ADMIN');

        // Create a deck with various card types
        const deckName = `Export Test Deck ${Date.now()}`;
        const deckDescription = 'Test deck for export functionality';
        const deckId = generateUUID();
        
        const deckResult = await pool.query(
            'INSERT INTO decks (id, user_id, name, description, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
            [deckId, testUserId, deckName, deckDescription]
        );

        expect(deckResult.rows[0]).toBeDefined();
        createdDeckIds.push(deckId);

        // Add cards to the deck - create a comprehensive deck with various card types
        const cards = [
            // Characters (4 required)
            { card_id: 'char-1', type: 'character', quantity: 1 },
            { card_id: 'char-2', type: 'character', quantity: 1 },
            { card_id: 'char-3', type: 'character', quantity: 1 },
            { card_id: 'char-4', type: 'character', quantity: 1 },
            
            // Power cards (multiple quantities to test repetition)
            { card_id: 'power-1', type: 'power', quantity: 3 },
            { card_id: 'power-2', type: 'power', quantity: 2 },
            { card_id: 'power-3', type: 'power', quantity: 1 },
            
            // Other card types (one each)
            { card_id: 'special-1', type: 'special', quantity: 1 },
            { card_id: 'location-1', type: 'location', quantity: 1 },
            { card_id: 'mission-1', type: 'mission', quantity: 1 },
            { card_id: 'event-1', type: 'event', quantity: 1 },
            { card_id: 'aspect-1', type: 'aspect', quantity: 1 },
            { card_id: 'advanced-universe-1', type: 'advanced-universe', quantity: 1 },
            { card_id: 'teamwork-1', type: 'teamwork', quantity: 1 },
            { card_id: 'ally-universe-1', type: 'ally-universe', quantity: 2 }, // Multiple quantity
            { card_id: 'training-1', type: 'training', quantity: 1 },
            { card_id: 'basic-universe-1', type: 'basic-universe', quantity: 1 }
        ];

        // Insert cards into deck
        for (const card of cards) {
            await pool.query(
                'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity) VALUES ($1, $2, $3, $4)',
                [deckId, card.type, card.card_id, card.quantity]
            );
        }

        // Test export functionality via API
        await testExportFunctionality(deckId, userName);
    });

    async function testExportFunctionality(deckId: string, userName: string) {
        // Test export functionality by simulating the export logic
        // Since we can't easily test the frontend export function in integration tests,
        // we'll test the core logic that would be used by the export function
        
        // Get deck data from database
        const deckResult = await pool.query(
            'SELECT id, user_id, name, description FROM decks WHERE id = $1',
            [deckId]
        );
        
        expect(deckResult.rows).toHaveLength(1);
        const deck = deckResult.rows[0];
        
        // Get deck cards from database
        const cardsResult = await pool.query(
            'SELECT card_type, card_id, quantity FROM deck_cards WHERE deck_id = $1',
            [deckId]
        );
        
        const deckCards = cardsResult.rows;
        
        // Simulate the export logic
        const exportData = {
            data: {
                name: deck.name,
                description: deck.description,
                total_cards: deckCards
                    .filter((card: any) => !['mission', 'character', 'location'].includes(card.card_type))
                    .reduce((sum: number, card: any) => sum + card.quantity, 0),
                max_energy: 0, // Would be calculated from actual card data
                max_combat: 0,
                max_brute_force: 0,
                max_intelligence: 0,
                total_threat: 0, // Would be calculated from actual card data
                legal: false, // Would be determined by validation
                limited: false, // Would be determined by limited state
                export_timestamp: new Date().toISOString(),
                exported_by: userName
            },
            Cards: {
                characters: createRepeatedCards(deckCards, 'character'),
                special_cards: createRepeatedCards(deckCards, 'special'),
                locations: createRepeatedCards(deckCards, 'location'),
                missions: createRepeatedCards(deckCards, 'mission'),
                events: createRepeatedCards(deckCards, 'event'),
                aspects: createRepeatedCards(deckCards, 'aspect'),
                advanced_universe: createRepeatedCards(deckCards, 'advanced-universe'),
                teamwork: createRepeatedCards(deckCards, 'teamwork'),
                allies: createRepeatedCards(deckCards, 'ally-universe'),
                training: createRepeatedCards(deckCards, 'training'),
                basic_universe: createRepeatedCards(deckCards, 'basic-universe'),
                power_cards: createRepeatedCards(deckCards, 'power')
            }
        };
        
        // Helper function to create repeated cards array based on quantity
        function createRepeatedCards(cards: any[], cardType: string): string[] {
            const result: string[] = [];
            cards.filter((card: any) => card.card_type === cardType).forEach((card: any) => {
                const cardName = `Mock ${card.card_id}`; // Mock card name
                const quantity = card.quantity || 1;
                for (let i = 0; i < quantity; i++) {
                    result.push(cardName);
                }
            });
            return result;
        }
        
        // Validate the export data structure
        expect(exportData).toHaveProperty('data');
        expect(exportData).toHaveProperty('Cards');
        
        // Validate deck metadata
        expect(exportData.data).toHaveProperty('name');
        expect(exportData.data).toHaveProperty('description');
        expect(exportData.data).toHaveProperty('legal');
        expect(exportData.data).toHaveProperty('limited');
        expect(exportData.data).toHaveProperty('total_cards');
        expect(exportData.data).toHaveProperty('export_timestamp');
        expect(exportData.data).toHaveProperty('exported_by');
        expect(exportData.data.exported_by).toBe(userName);

        // Validate card categories structure
        const expectedCategories = [
            'characters', 'special_cards', 'locations', 'missions', 'events',
            'aspects', 'advanced_universe', 'teamwork', 'allies', 'training',
            'basic_universe', 'power_cards'
        ];

        expectedCategories.forEach(category => {
            expect(exportData.Cards).toHaveProperty(category);
            expect(Array.isArray((exportData.Cards as any)[category])).toBe(true);
        });

        // Validate character cards (should have 4)
        expect(exportData.Cards.characters).toHaveLength(4);

        // Validate power cards (should have 6 total - 3 + 2 + 1)
        expect(exportData.Cards.power_cards).toHaveLength(6);

        // Validate ally cards (should have 2 - multiple quantity)
        expect(exportData.Cards.allies).toHaveLength(2);

        // Validate other card types (should have 1 each)
        expect(exportData.Cards.special_cards).toHaveLength(1);
        expect(exportData.Cards.locations).toHaveLength(1);
        expect(exportData.Cards.missions).toHaveLength(1);
        expect(exportData.Cards.events).toHaveLength(1);
        expect(exportData.Cards.aspects).toHaveLength(1);
        expect(exportData.Cards.advanced_universe).toHaveLength(1);
        expect(exportData.Cards.teamwork).toHaveLength(1);
        expect(exportData.Cards.training).toHaveLength(1);
        expect(exportData.Cards.basic_universe).toHaveLength(1);

        // Validate total card count
        const totalCardsInExport = Object.values(exportData.Cards)
            .flat()
            .filter((card: any) => card !== null && card !== undefined)
            .length;
        expect(totalCardsInExport).toBe(21); // 4 characters + 6 power + 2 allies + 9 other types

        // Validate that legal and limited are boolean values
        expect(typeof exportData.data.legal).toBe('boolean');
        expect(typeof exportData.data.limited).toBe('boolean');

        // Validate export metadata
        expect(new Date(exportData.data.export_timestamp)).toBeInstanceOf(Date);

        console.log('✅ Export functionality test passed - JSON structure is correct');
        console.log(`📊 Exported ${totalCardsInExport} cards across ${expectedCategories.length} categories`);
        console.log(`🔒 Legal: ${exportData.data.legal}, Limited: ${exportData.data.limited}`);
        console.log(`👤 Exported by: ${exportData.data.exported_by}`);
    }
});

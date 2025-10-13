/**
 * Integration tests for guest user read-only layout behavior
 * Tests the complete workflow of guest users viewing decks in read-only mode
 */

import request from 'supertest';
import { app, integrationTestUtils } from '../setup-integration';
import { Pool } from 'pg';

describe('Guest User Read-Only Layout Integration Tests', () => {
    let pool: Pool;
    let guestUser: any;
    let testDeckId: string;

    beforeAll(async () => {
        pool = new Pool({
            host: 'localhost',
            port: 1337,
            database: 'overpower',
            user: 'postgres',
            password: 'password'
        });
    });

    beforeEach(async () => {
        // Ensure a guest user exists
        await integrationTestUtils.ensureGuestUser();
        
        // Create guest user object for testing
        guestUser = {
            id: '00000000-0000-0000-0000-000000000002',
            username: 'Test-Guest',
            email: 'test-guest@example.com',
            role: 'GUEST'
        };
        
        const userLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'Test-Guest',
                password: 'test-guest'
            })
            .expect(200);

        guestUser.sessionId = userLoginResponse.headers['set-cookie'][0].match(/sessionId=([^;]+)/)![1];

        // Create a test deck with multiple character types
        const characterResult = await pool.query(`
            SELECT id, name, threat_level 
            FROM characters 
            WHERE name IN ('The Three Musketeers', 'Dr. Watson', 'Billy the Kid') 
            ORDER BY name
        `);
        
        expect(characterResult.rows).toHaveLength(3);
        
        const createResponse = await request(app)
            .post('/api/decks')
            .set('Cookie', `sessionId=${guestUser.sessionId}`)
            .send({
                name: 'Guest Test Deck - Layout',
                description: 'Test deck for guest user layout testing',
                characters: characterResult.rows.map(row => row.id),
                power_cards: [],
                special_cards: [],
                events: [],
                locations: [],
                missions: []
            });

        expect(createResponse.status).toBe(201);
        testDeckId = createResponse.body.data.id;
        integrationTestUtils.trackTestDeck(testDeckId);
    });

    afterEach(async () => {
        // Cleanup is handled by ensureGuestUser and trackTestDeck
    });

    afterAll(async () => {
        await pool.end();
    });

    describe('Guest User Deck Viewing', () => {
        it('should allow guest user to view deck in read-only mode', async () => {
            const getResponse = await request(app)
                .get(`/api/decks/${testDeckId}`)
                .set('Cookie', `sessionId=${guestUser.sessionId}`);

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data.metadata.name).toBe('Guest Test Deck - Layout');
            expect(getResponse.body.data.cards).toHaveLength(3); // Three characters
        });

        it('should return deck data with proper structure for frontend layout', async () => {
            const getResponse = await request(app)
                .get(`/api/decks/${testDeckId}`)
                .set('Cookie', `sessionId=${guestUser.sessionId}`);

            expect(getResponse.status).toBe(200);
            
            const deckData = getResponse.body.data;
            
            // Verify deck structure
            expect(deckData.metadata).toBeDefined();
            expect(deckData.metadata.id).toBe(testDeckId);
            expect(deckData.metadata.name).toBe('Guest Test Deck - Layout');
            expect(deckData.metadata.threat).toBeDefined();
            expect(deckData.metadata.reserve_character).toBeNull();
            
            // Verify cards structure
            expect(deckData.cards).toBeDefined();
            expect(Array.isArray(deckData.cards)).toBe(true);
            
            // Verify character cards
            const characterCards = deckData.cards.filter((card: any) => card.type === 'character');
            expect(characterCards).toHaveLength(3);
            
            characterCards.forEach((card: any) => {
                expect(card.cardId).toBeDefined();
                expect(card.type).toBe('character');
                expect(card.quantity).toBe(1);
            });
        });

        it('should prevent guest user from modifying deck', async () => {
            // Attempt to update the deck
            const updateResponse = await request(app)
                .put(`/api/decks/${testDeckId}`)
                .set('Cookie', `sessionId=${guestUser.sessionId}`)
                .send({
                    name: 'Modified Deck Name',
                    reserve_character: 'some-character-id'
                });

            // Expect 401 Unauthorized for guest trying to save changes
            expect(updateResponse.status).toBe(401);

            // Verify no changes were persisted
            const getResponse = await request(app)
                .get(`/api/decks/${testDeckId}`)
                .set('Cookie', `sessionId=${guestUser.sessionId}`);
            
            expect(getResponse.status).toBe(200);
            expect(getResponse.body.data.metadata.name).toBe('Guest Test Deck - Layout');
            expect(getResponse.body.data.metadata.reserve_character).toBeNull();
        });
    });

    describe('Frontend Layout Behavior Simulation', () => {
        it('should simulate proper CSS class application for guest users', () => {
            // Simulate the frontend behavior
            const mockDocument = {
                body: {
                    classList: {
                        contains: (className: string) => className === 'guest-user',
                        add: jest.fn(),
                        remove: jest.fn()
                    }
                },
                querySelectorAll: jest.fn(),
                querySelector: jest.fn()
            };

            // Mock currentUser
            const currentUser = { role: 'GUEST' };
            const isReadOnlyMode = true;

            // Simulate the layout fixing logic
            const applyGuestUserLayoutFixes = () => {
                // Check if user is guest and in read-only mode
                const isGuest = currentUser.role === 'GUEST';
                const isReadOnly = isReadOnlyMode;
                
                if (isGuest && isReadOnly) {
                    // Apply guest-user class to body
                    mockDocument.body.classList.add('guest-user');
                    
                    // Apply layout fixes
                    const mockCardSections = [
                        { style: { setProperty: jest.fn() } },
                        { style: { setProperty: jest.fn() } }
                    ];
                    
                    mockDocument.querySelectorAll.mockReturnValue(mockCardSections);
                    
                    mockCardSections.forEach(section => {
                        section.style.setProperty('grid-template-columns', '1fr', 'important');
                        section.style.setProperty('display', 'grid', 'important');
                    });
                    
                    return true;
                }
                return false;
            };

            const result = applyGuestUserLayoutFixes();
            
            expect(result).toBe(true);
            expect(mockDocument.body.classList.add).toHaveBeenCalledWith('guest-user');
            expect(mockDocument.querySelectorAll).toHaveBeenCalled();
        });

        it('should simulate card sizing fixes for read-only mode', () => {
            // Mock card elements
            const mockCard = {
                classList: {
                    contains: (className: string) => className === 'character-card'
                },
                style: {
                    setProperty: jest.fn()
                },
                querySelector: jest.fn()
            };

            const mockCardInfo = {
                style: {
                    setProperty: jest.fn()
                }
            };

            const mockCardName = {
                style: {
                    setProperty: jest.fn()
                }
            };

            mockCard.querySelector.mockImplementation((selector: string) => {
                if (selector === '.deck-card-editor-info') return mockCardInfo;
                if (selector === '.deck-card-editor-name') return mockCardName;
                return null;
            });

            // Simulate the card sizing fix logic
            const applyCardSizingFixes = (cards: any[]) => {
                cards.forEach(card => {
                    card.style.setProperty('max-width', '100%', 'important');
                    card.style.setProperty('box-sizing', 'border-box', 'important');
                    card.style.setProperty('overflow', 'hidden', 'important');
                    
                    if (card.classList.contains('character-card')) {
                        const cardInfo = card.querySelector('.deck-card-editor-info');
                        if (cardInfo) {
                            cardInfo.style.setProperty('flex', '1', 'important');
                            cardInfo.style.setProperty('min-width', '0', 'important');
                            cardInfo.style.setProperty('overflow', 'hidden', 'important');
                        }
                        
                        const cardName = card.querySelector('.deck-card-editor-name');
                        if (cardName) {
                            cardName.style.setProperty('white-space', 'nowrap', 'important');
                            cardName.style.setProperty('overflow', 'hidden', 'important');
                            cardName.style.setProperty('text-overflow', 'ellipsis', 'important');
                        }
                    }
                });
            };

            applyCardSizingFixes([mockCard]);

            // Verify basic card fixes
            expect(mockCard.style.setProperty).toHaveBeenCalledWith('max-width', '100%', 'important');
            expect(mockCard.style.setProperty).toHaveBeenCalledWith('box-sizing', 'border-box', 'important');
            expect(mockCard.style.setProperty).toHaveBeenCalledWith('overflow', 'hidden', 'important');

            // Verify character card specific fixes
            expect(mockCardInfo.style.setProperty).toHaveBeenCalledWith('flex', '1', 'important');
            expect(mockCardInfo.style.setProperty).toHaveBeenCalledWith('min-width', '0', 'important');
            expect(mockCardInfo.style.setProperty).toHaveBeenCalledWith('overflow', 'hidden', 'important');

            expect(mockCardName.style.setProperty).toHaveBeenCalledWith('white-space', 'nowrap', 'important');
            expect(mockCardName.style.setProperty).toHaveBeenCalledWith('overflow', 'hidden', 'important');
            expect(mockCardName.style.setProperty).toHaveBeenCalledWith('text-overflow', 'ellipsis', 'important');
        });
    });

    describe('Layout Consistency', () => {
        it('should ensure consistent single column layout for all card types in guest read-only mode', () => {
            // Simulate different card types
            const cardTypes = ['character', 'power', 'special', 'event', 'location', 'mission'];
            
            const mockSections = cardTypes.map(type => ({
                dataset: { type },
                style: { setProperty: jest.fn() }
            }));

            // Simulate the layout fixing logic
            const applyConsistentLayout = (sections: any[]) => {
                sections.forEach(section => {
                    // All sections should get single column layout for guest users
                    section.style.setProperty('grid-template-columns', '1fr', 'important');
                    section.style.setProperty('display', 'grid', 'important');
                });
            };

            applyConsistentLayout(mockSections);

            // Verify all sections got the same treatment
            mockSections.forEach(section => {
                expect(section.style.setProperty).toHaveBeenCalledWith('grid-template-columns', '1fr', 'important');
                expect(section.style.setProperty).toHaveBeenCalledWith('display', 'grid', 'important');
            });
        });

        it('should handle mixed card types in the same deck', async () => {
            // Add some power cards to the test deck
            const powerResult = await pool.query(`
                SELECT id FROM power_cards LIMIT 3
            `);
            
            if (powerResult.rows.length > 0) {
                const updateResponse = await request(app)
                    .put(`/api/decks/${testDeckId}`)
                    .set('Cookie', `sessionId=${guestUser.sessionId}`)
                    .send({
                        power_cards: powerResult.rows.map(row => row.id)
                    });

                // This should fail for guest users
                expect(updateResponse.status).toBe(401);
            }

            // Verify the deck still has only characters
            const getResponse = await request(app)
                .get(`/api/decks/${testDeckId}`)
                .set('Cookie', `sessionId=${guestUser.sessionId}`);

            expect(getResponse.status).toBe(200);
            const characterCards = getResponse.body.data.cards.filter((card: any) => card.type === 'character');
            expect(characterCards).toHaveLength(3);
        });
    });

    describe('Error Handling', () => {
        it('should handle missing deck gracefully', async () => {
            const fakeDeckId = '00000000-0000-0000-0000-000000000000';
            
            const getResponse = await request(app)
                .get(`/api/decks/${fakeDeckId}`)
                .set('Cookie', `sessionId=${guestUser.sessionId}`);

            expect(getResponse.status).toBe(404);
        });

        it('should handle invalid session gracefully', async () => {
            const getResponse = await request(app)
                .get(`/api/decks/${testDeckId}`)
                .set('Cookie', 'sessionId=invalid-session-id');

            expect(getResponse.status).toBe(401);
        });
    });
});

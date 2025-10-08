import request from 'supertest';
import { Pool } from 'pg';
import { app } from '../setup-integration';
import { integrationTestUtils } from '../setup-integration';

describe('Reserve Character Simple Integration Tests', () => {
    let pool: Pool;
    let testUser: any;
    let testDeck: any;
    let testCharacterIds: string[] = [];

    beforeAll(async () => {
        // Set up database connection
        pool = new Pool({
            connectionString: 'postgresql://postgres:password@localhost:1337/overpower'
        });

        // Get some test character IDs from the database
        const characterResult = await pool.query('SELECT id FROM characters LIMIT 4');
        testCharacterIds = characterResult.rows.map((row: any) => row.id);
        
        if (testCharacterIds.length < 4) {
            throw new Error('Not enough characters in database for testing');
        }
    });

    beforeEach(async () => {
        // Create test user
        testUser = await integrationTestUtils.createTestUser({
            name: `reservetest_${Date.now()}`,
            email: `reservetest_${Date.now()}@test.com`,
            password: 'testpassword123',
            role: 'USER'
        });

        // Login test user to get session cookie
        const userLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: testUser.username,
                password: 'testpassword123'
            })
            .expect(200);

        testUser.sessionId = userLoginResponse.headers['set-cookie'][0].match(/sessionId=([^;]+)/)![1];

        // Create test deck with 4 characters
        const deckData = {
            name: 'Reserve Test Deck',
            description: 'Test deck for reserve character functionality',
            is_limited: false,
            characters: testCharacterIds.slice(0, 4),
            power_cards: [],
            special_cards: [],
            events: [],
            locations: [],
            missions: []
        };

        const createResponse = await request(app)
            .post('/api/decks')
            .send(deckData)
            .set('Cookie', `sessionId=${testUser.sessionId}`)
            .expect(201);

        testDeck = createResponse.body.data;
        integrationTestUtils.trackTestDeck(testDeck.id);
    });

    afterEach(async () => {
        // Clean up test user
        if (testUser?.id) {
            await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
        }
    });

    afterAll(async () => {
        await integrationTestUtils.cleanupAllTestData();
    });

    describe('Basic Reserve Character Functionality', () => {
        it('should create a deck with no reserve character initially', async () => {
            const response = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.metadata.reserve_character).toBeNull();
        });

        it('should allow setting a reserve character', async () => {
            const updateResponse = await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .send({
                    name: 'Reserve Test Deck',
                    description: 'Test deck for reserve character functionality',
                    is_limited: false,
                    characters: testCharacterIds.slice(0, 4),
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: [],
                    reserve_character: testCharacterIds[0]
                })
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.data.reserve_character).toBe(testCharacterIds[0]);

            // Verify the updated deck has the reserve character set
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(getResponse.body.data.metadata.reserve_character).toBe(testCharacterIds[0]);
        });

        it('should allow changing the reserve character', async () => {
            // First set a reserve character
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .send({
                    name: 'Reserve Test Deck',
                    description: 'Test deck for reserve character functionality',
                    is_limited: false,
                    characters: testCharacterIds.slice(0, 4),
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: [],
                    reserve_character: testCharacterIds[0]
                })
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            // Then change it to a different character
            const updateResponse = await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .send({
                    name: 'Reserve Test Deck',
                    description: 'Test deck for reserve character functionality',
                    is_limited: false,
                    characters: testCharacterIds.slice(0, 4),
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: [],
                    reserve_character: testCharacterIds[1]
                })
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.data.reserve_character).toBe(testCharacterIds[1]);
        });

        it('should allow removing the reserve character', async () => {
            // First set a reserve character
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .send({
                    name: 'Reserve Test Deck',
                    description: 'Test deck for reserve character functionality',
                    is_limited: false,
                    characters: testCharacterIds.slice(0, 4),
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: [],
                    reserve_character: testCharacterIds[0]
                })
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            // Then remove it
            const updateResponse = await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .send({
                    name: 'Reserve Test Deck',
                    description: 'Test deck for reserve character functionality',
                    is_limited: false,
                    characters: testCharacterIds.slice(0, 4),
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: [],
                    reserve_character: null
                })
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.data.reserve_character).toBeNull();
        });

        it('should handle undefined reserve character as null', async () => {
            const updateResponse = await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .send({
                    name: 'Reserve Test Deck',
                    description: 'Test deck for reserve character functionality',
                    is_limited: false,
                    characters: testCharacterIds.slice(0, 4),
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: []
                    // reserve_character is undefined
                })
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.data.reserve_character).toBeNull();
        });
    });

    describe('Reserve Character with Different Deck Sizes', () => {
        it('should work with a deck containing 1 character', async () => {
            const deckData = {
                name: 'Single Character Deck',
                description: 'Deck with only one character',
                is_limited: false,
                characters: [testCharacterIds[0]],
                power_cards: [],
                special_cards: [],
                events: [],
                locations: [],
                missions: []
            };

            const createResponse = await request(app)
                .post('/api/decks')
                .send(deckData)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(201);

            const singleCharDeck = createResponse.body.data;
            integrationTestUtils.trackTestDeck(singleCharDeck.id);

            // Should be able to select the single character as reserve
            const updateResponse = await request(app)
                .put(`/api/decks/${singleCharDeck.id}`)
                .send({
                    name: 'Single Character Deck',
                    description: 'Deck with only one character',
                    is_limited: false,
                    characters: [testCharacterIds[0]],
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: [],
                    reserve_character: testCharacterIds[0]
                })
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.data.reserve_character).toBe(testCharacterIds[0]);
        });

        it('should work with a deck containing 2 characters', async () => {
            const deckData = {
                name: 'Two Character Deck',
                description: 'Deck with two characters',
                is_limited: false,
                characters: testCharacterIds.slice(0, 2),
                power_cards: [],
                special_cards: [],
                events: [],
                locations: [],
                missions: []
            };

            const createResponse = await request(app)
                .post('/api/decks')
                .send(deckData)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(201);

            const twoCharDeck = createResponse.body.data;
            integrationTestUtils.trackTestDeck(twoCharDeck.id);

            // Should be able to select first character as reserve
            const updateResponse = await request(app)
                .put(`/api/decks/${twoCharDeck.id}`)
                .send({
                    name: 'Two Character Deck',
                    description: 'Deck with two characters',
                    is_limited: false,
                    characters: testCharacterIds.slice(0, 2),
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: [],
                    reserve_character: testCharacterIds[0]
                })
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.data.reserve_character).toBe(testCharacterIds[0]);

            // Should be able to switch to second character
            const switchResponse = await request(app)
                .put(`/api/decks/${twoCharDeck.id}`)
                .send({
                    name: 'Two Character Deck',
                    description: 'Deck with two characters',
                    is_limited: false,
                    characters: testCharacterIds.slice(0, 2),
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: [],
                    reserve_character: testCharacterIds[1]
                })
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(switchResponse.body.success).toBe(true);
            expect(switchResponse.body.data.reserve_character).toBe(testCharacterIds[1]);
        });
    });
});

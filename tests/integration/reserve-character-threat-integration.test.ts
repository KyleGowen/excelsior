/**
 * Integration tests for reserve character threat calculation
 * Tests all special characters that have reserve character threat adjustments
 * 
 * Current special characters with reserve threat adjustments:
 * 1. Carson of Venus: 18 -> 19 when reserve (+1)
 * 2. Morgan le Fay: 19 -> 20 when reserve (+1)
 * 3. Victory Harben: 18 -> 20 when reserve (+2)
 */

import request from 'supertest';
import { app, integrationTestUtils } from '../setup-integration';
import { Pool } from 'pg';

describe('Reserve Character Threat Integration Tests', () => {
    let pool: Pool;
    let testUser: any;
    let specialCharacterIds: { [key: string]: string };
    let specialCharacterData: { [key: string]: any };

    beforeAll(async () => {
        pool = new Pool({
            host: 'localhost',
            port: 1337,
            database: 'overpower',
            user: 'postgres',
            password: 'password'
        });

        // Get character IDs and data for the special characters
        const characterResult = await pool.query(`
            SELECT id, name, threat_level, special_abilities
            FROM characters 
            WHERE name IN ('Carson of Venus', 'Morgan le Fay', 'Victory Harben') 
            ORDER BY name
        `);
        
        expect(characterResult.rows).toHaveLength(3);
        
        // Map character names to their IDs and data
        specialCharacterIds = {};
        specialCharacterData = {};
        characterResult.rows.forEach(row => {
            specialCharacterIds[row.name] = row.id;
            specialCharacterData[row.name] = {
                id: row.id,
                name: row.name,
                threat_level: row.threat_level,
                special_abilities: row.special_abilities
            };
        });

        // Verify we have the expected characters
        expect(specialCharacterIds['Carson of Venus']).toBeDefined();
        expect(specialCharacterIds['Morgan le Fay']).toBeDefined();
        expect(specialCharacterIds['Victory Harben']).toBeDefined();
    });

    beforeEach(async () => {
        // Create test user
        testUser = await integrationTestUtils.createTestUser({
            name: `threattest_${Date.now()}`,
            email: `threattest_${Date.now()}@test.com`,
            role: 'USER',
            password: 'testpassword123'
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
    });

    afterEach(async () => {
        // Clean up test user
        if (testUser?.id) {
            await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
        }
    });

    afterAll(async () => {
        await pool.end();
    });

    describe('Carson of Venus Reserve Character Threat', () => {
        it('should calculate normal threat (18) when Carson of Venus is not reserve', async () => {
            // Create deck with Carson of Venus but not as reserve
            const createResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Carson Normal',
                    description: 'Test deck with Carson of Venus not as reserve',
                    characters: [specialCharacterIds['Carson of Venus']],
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: []
                });

            expect(createResponse.status).toBe(201);
            expect(createResponse.body.success).toBe(true);
            const deckId = createResponse.body.data.id;
            integrationTestUtils.trackTestDeck(deckId);

            // Get deck data to verify threat calculation
            const getResponse = await request(app)
                .get(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`);

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.success).toBe(true);
            
            // Carson of Venus should have normal threat level (18)
            expect(getResponse.body.data.metadata.threat).toBe(18);
            expect(getResponse.body.data.metadata.reserve_character).toBeNull();
        });

        it('should calculate adjusted threat (19) when Carson of Venus is reserve', async () => {
            // Create deck with Carson of Venus first
            const createResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Carson Reserve',
                    description: 'Test deck with Carson of Venus as reserve',
                    characters: [specialCharacterIds['Carson of Venus']],
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: []
                });

            expect(createResponse.status).toBe(201);
            expect(createResponse.body.success).toBe(true);
            const deckId = createResponse.body.data.id;
            integrationTestUtils.trackTestDeck(deckId);

            // Set Carson of Venus as reserve
            const updateResponse = await request(app)
                .put(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Carson Reserve',
                    description: 'Test deck with Carson of Venus as reserve',
                    reserve_character: specialCharacterIds['Carson of Venus']
                });

            expect(updateResponse.status).toBe(200);

            // Get deck data to verify threat calculation
            const getResponse = await request(app)
                .get(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`);

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.success).toBe(true);
            
            // Carson of Venus should have adjusted threat level (19) when reserve
            expect(getResponse.body.data.metadata.threat).toBe(19);
            expect(getResponse.body.data.metadata.reserve_character).toBe(specialCharacterIds['Carson of Venus']);
        });

        it('should update threat when Carson of Venus reserve status changes', async () => {
            // Create deck with Carson of Venus initially not as reserve
            const createResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Carson Change',
                    description: 'Test deck with Carson of Venus reserve status change',
                    characters: [specialCharacterIds['Carson of Venus']],
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: []
                });

            expect(createResponse.status).toBe(201);
            const deckId = createResponse.body.data.id;
            integrationTestUtils.trackTestDeck(deckId);

            // Verify initial threat (18)
            let getResponse = await request(app)
                .get(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`);

            expect(getResponse.body.data.metadata.threat).toBe(18);

            // Set Carson of Venus as reserve
            const updateResponse = await request(app)
                .put(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Carson Change',
                    description: 'Test deck with Carson of Venus reserve status change',
                    reserve_character: specialCharacterIds['Carson of Venus']
                });

            expect(updateResponse.status).toBe(200);

            // Verify threat increased to 19
            getResponse = await request(app)
                .get(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`);

            expect(getResponse.body.data.metadata.threat).toBe(19);
            expect(getResponse.body.data.metadata.reserve_character).toBe(specialCharacterIds['Carson of Venus']);
        });
    });

    describe('Morgan le Fay Reserve Character Threat', () => {
        it('should calculate normal threat (19) when Morgan le Fay is not reserve', async () => {
            // Create deck with Morgan le Fay but not as reserve
            const createResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Morgan Normal',
                    description: 'Test deck with Morgan le Fay not as reserve',
                    characters: [specialCharacterIds['Morgan le Fay']],
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: []
                });

            expect(createResponse.status).toBe(201);
            expect(createResponse.body.success).toBe(true);
            const deckId = createResponse.body.data.id;
            integrationTestUtils.trackTestDeck(deckId);

            // Get deck data to verify threat calculation
            const getResponse = await request(app)
                .get(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`);

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.success).toBe(true);
            
            // Morgan le Fay should have normal threat level (19)
            expect(getResponse.body.data.metadata.threat).toBe(19);
            expect(getResponse.body.data.metadata.reserve_character).toBeNull();
        });

        it('should calculate adjusted threat (20) when Morgan le Fay is reserve', async () => {
            // Create deck with Morgan le Fay first
            const createResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Morgan Reserve',
                    description: 'Test deck with Morgan le Fay as reserve',
                    characters: [specialCharacterIds['Morgan le Fay']],
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: []
                });

            expect(createResponse.status).toBe(201);
            expect(createResponse.body.success).toBe(true);
            const deckId = createResponse.body.data.id;
            integrationTestUtils.trackTestDeck(deckId);

            // Set Morgan le Fay as reserve
            const updateResponse = await request(app)
                .put(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Morgan Reserve',
                    description: 'Test deck with Morgan le Fay as reserve',
                    reserve_character: specialCharacterIds['Morgan le Fay']
                });

            expect(updateResponse.status).toBe(200);

            // Get deck data to verify threat calculation
            const getResponse = await request(app)
                .get(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`);

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.success).toBe(true);
            
            // Morgan le Fay should have adjusted threat level (20) when reserve
            expect(getResponse.body.data.metadata.threat).toBe(20);
            expect(getResponse.body.data.metadata.reserve_character).toBe(specialCharacterIds['Morgan le Fay']);
        });

        it('should update threat when Morgan le Fay reserve status changes', async () => {
            // Create deck with Morgan le Fay initially not as reserve
            const createResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Morgan Change',
                    description: 'Test deck with Morgan le Fay reserve status change',
                    characters: [specialCharacterIds['Morgan le Fay']],
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: []
                });

            expect(createResponse.status).toBe(201);
            const deckId = createResponse.body.data.id;
            integrationTestUtils.trackTestDeck(deckId);

            // Verify initial threat (19)
            let getResponse = await request(app)
                .get(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`);

            expect(getResponse.body.data.metadata.threat).toBe(19);

            // Set Morgan le Fay as reserve
            const updateResponse = await request(app)
                .put(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Morgan Change',
                    description: 'Test deck with Morgan le Fay reserve status change',
                    reserve_character: specialCharacterIds['Morgan le Fay']
                });

            expect(updateResponse.status).toBe(200);

            // Verify threat increased to 20
            getResponse = await request(app)
                .get(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`);

            expect(getResponse.body.data.metadata.threat).toBe(20);
            expect(getResponse.body.data.metadata.reserve_character).toBe(specialCharacterIds['Morgan le Fay']);
        });
    });

    describe('Victory Harben Reserve Character Threat', () => {
        it('should calculate normal threat (18) when Victory Harben is not reserve', async () => {
            // Create deck with Victory Harben but not as reserve
            const createResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Victory Normal',
                    description: 'Test deck with Victory Harben not as reserve',
                    characters: [specialCharacterIds['Victory Harben']],
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: []
                });

            expect(createResponse.status).toBe(201);
            expect(createResponse.body.success).toBe(true);
            const deckId = createResponse.body.data.id;
            integrationTestUtils.trackTestDeck(deckId);

            // Get deck data to verify threat calculation
            const getResponse = await request(app)
                .get(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`);

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.success).toBe(true);
            
            // Victory Harben should have normal threat level (18)
            expect(getResponse.body.data.metadata.threat).toBe(18);
            expect(getResponse.body.data.metadata.reserve_character).toBeNull();
        });

        it('should calculate adjusted threat (20) when Victory Harben is reserve', async () => {
            // Create deck with Victory Harben first
            const createResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Victory Reserve',
                    description: 'Test deck with Victory Harben as reserve',
                    characters: [specialCharacterIds['Victory Harben']],
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: []
                });

            expect(createResponse.status).toBe(201);
            expect(createResponse.body.success).toBe(true);
            const deckId = createResponse.body.data.id;
            integrationTestUtils.trackTestDeck(deckId);

            // Set Victory Harben as reserve
            const updateResponse = await request(app)
                .put(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Victory Reserve',
                    description: 'Test deck with Victory Harben as reserve',
                    reserve_character: specialCharacterIds['Victory Harben']
                });

            expect(updateResponse.status).toBe(200);

            // Get deck data to verify threat calculation
            const getResponse = await request(app)
                .get(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`);

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.success).toBe(true);
            
            // Victory Harben should have adjusted threat level (20) when reserve
            expect(getResponse.body.data.metadata.threat).toBe(20);
            expect(getResponse.body.data.metadata.reserve_character).toBe(specialCharacterIds['Victory Harben']);
        });

        it('should update threat when Victory Harben reserve status changes', async () => {
            // Create deck with Victory Harben initially not as reserve
            const createResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Victory Change',
                    description: 'Test deck with Victory Harben reserve status change',
                    characters: [specialCharacterIds['Victory Harben']],
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: []
                });

            expect(createResponse.status).toBe(201);
            const deckId = createResponse.body.data.id;
            integrationTestUtils.trackTestDeck(deckId);

            // Verify initial threat (18)
            let getResponse = await request(app)
                .get(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`);

            expect(getResponse.body.data.metadata.threat).toBe(18);

            // Set Victory Harben as reserve
            const updateResponse = await request(app)
                .put(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Victory Change',
                    description: 'Test deck with Victory Harben reserve status change',
                    reserve_character: specialCharacterIds['Victory Harben']
                });

            expect(updateResponse.status).toBe(200);

            // Verify threat increased to 20
            getResponse = await request(app)
                .get(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`);

            expect(getResponse.body.data.metadata.threat).toBe(20);
            expect(getResponse.body.data.metadata.reserve_character).toBe(specialCharacterIds['Victory Harben']);
        });
    });

    describe('Multiple Special Characters in Same Deck', () => {
        it('should only adjust threat for the character that is reserve', async () => {
            // Create deck with all three special characters first
            const createResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Multiple Special',
                    description: 'Test deck with multiple special characters',
                    characters: [
                        specialCharacterIds['Carson of Venus'],
                        specialCharacterIds['Morgan le Fay'],
                        specialCharacterIds['Victory Harben']
                    ],
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: []
                });

            expect(createResponse.status).toBe(201);
            expect(createResponse.body.success).toBe(true);
            const deckId = createResponse.body.data.id;
            integrationTestUtils.trackTestDeck(deckId);

            // Set Carson as reserve
            const updateResponse = await request(app)
                .put(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Multiple Special',
                    description: 'Test deck with multiple special characters',
                    reserve_character: specialCharacterIds['Carson of Venus']
                });

            expect(updateResponse.status).toBe(200);

            // Get deck data to verify threat calculation
            const getResponse = await request(app)
                .get(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`);

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.success).toBe(true);
            
            // Only Carson should have adjusted threat: 19 (Carson) + 19 (Morgan) + 18 (Victory) = 56
            expect(getResponse.body.data.metadata.threat).toBe(56);
            expect(getResponse.body.data.metadata.reserve_character).toBe(specialCharacterIds['Carson of Venus']);
        });

        it('should recalculate threat when switching reserve character', async () => {
            // Create deck with Carson and Victory first
            const createResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Switch Reserve',
                    description: 'Test deck with reserve character switching',
                    characters: [
                        specialCharacterIds['Carson of Venus'],
                        specialCharacterIds['Victory Harben']
                    ],
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: []
                });

            expect(createResponse.status).toBe(201);
            const deckId = createResponse.body.data.id;
            integrationTestUtils.trackTestDeck(deckId);

            // Set Carson as initial reserve
            let updateResponse = await request(app)
                .put(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Switch Reserve',
                    description: 'Test deck with reserve character switching',
                    reserve_character: specialCharacterIds['Carson of Venus']
                });

            expect(updateResponse.status).toBe(200);

            // Verify initial threat: 19 (Carson) + 18 (Victory) = 37
            let getResponse = await request(app)
                .get(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`);

            expect(getResponse.body.data.metadata.threat).toBe(37);

            // Switch to Victory Harben as reserve
            updateResponse = await request(app)
                .put(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Switch Reserve',
                    description: 'Test deck with reserve character switching',
                    reserve_character: specialCharacterIds['Victory Harben']
                });

            expect(updateResponse.status).toBe(200);

            // Verify threat recalculated: 18 (Carson) + 20 (Victory) = 38
            getResponse = await request(app)
                .get(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`);

            expect(getResponse.body.data.metadata.threat).toBe(38);
            expect(getResponse.body.data.metadata.reserve_character).toBe(specialCharacterIds['Victory Harben']);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle removing reserve character', async () => {
            // Create deck with Carson first
            const createResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Remove Reserve',
                    description: 'Test deck with reserve character removal',
                    characters: [specialCharacterIds['Carson of Venus']],
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: []
                });

            expect(createResponse.status).toBe(201);
            const deckId = createResponse.body.data.id;
            integrationTestUtils.trackTestDeck(deckId);

            // Set Carson as reserve
            let updateResponse = await request(app)
                .put(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Remove Reserve',
                    description: 'Test deck with reserve character removal',
                    reserve_character: specialCharacterIds['Carson of Venus']
                });

            expect(updateResponse.status).toBe(200);

            // Verify initial threat (19)
            let getResponse = await request(app)
                .get(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`);

            expect(getResponse.body.data.metadata.threat).toBe(19);

            // Remove reserve character
            updateResponse = await request(app)
                .put(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Remove Reserve',
                    description: 'Test deck with reserve character removal',
                    reserve_character: null
                });

            expect(updateResponse.status).toBe(200);

            // Verify threat returned to normal (18)
            getResponse = await request(app)
                .get(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`);

            expect(getResponse.body.data.metadata.threat).toBe(18);
            expect(getResponse.body.data.metadata.reserve_character).toBeNull();
        });

        it('should handle invalid reserve character ID gracefully', async () => {
            // Create deck with Carson first
            const createResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Invalid Reserve',
                    description: 'Test deck with invalid reserve character',
                    characters: [specialCharacterIds['Carson of Venus']],
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: []
                });

            expect(createResponse.status).toBe(201);
            const deckId = createResponse.body.data.id;
            integrationTestUtils.trackTestDeck(deckId);

            // Try to set invalid reserve character ID
            const updateResponse = await request(app)
                .put(`/api/decks/${deckId}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Test Deck - Invalid Reserve',
                    description: 'Test deck with invalid reserve character',
                    reserve_character: 'invalid-character-id'
                });

            expect(updateResponse.status).toBe(400);
            expect(updateResponse.body.success).toBe(false);
        });
    });
});

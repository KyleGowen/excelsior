import request from 'supertest';
import { app, integrationTestUtils } from '../setup-integration';
import { Pool } from 'pg';

describe('Reserve Character Threat Persistence Integration Tests', () => {
    let pool: Pool;
    let testUser: any;
    let testDeck: any;
    let testCharacterIds: string[];

    beforeAll(async () => {
        pool = new Pool({
            host: 'localhost',
            port: 1337,
            database: 'overpower',
            user: 'postgres',
            password: 'password'
        });

        // Get character IDs for the three special characters
        const characterResult = await pool.query(`
            SELECT id, name, threat_level 
            FROM characters 
            WHERE name IN ('Carson of Venus', 'Morgan le Fay', 'Victory Harben') 
            ORDER BY name
        `);
        
        testCharacterIds = characterResult.rows.map(row => row.id);
        expect(testCharacterIds).toHaveLength(3);
    });

    beforeEach(async () => {
        // Create test user
        testUser = await integrationTestUtils.createTestUser({
            name: 'Threat Test User',
            email: 'threattest@example.com',
            role: 'USER',
            password: 'password123'
        });

        // Login to get session
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: testUser.username,
                password: 'password123'
            })
            .expect(200);

        testUser.sessionId = loginResponse.headers['set-cookie'][0].match(/sessionId=([^;]+)/)![1];

        // Create test deck
        const createResponse = await request(app)
            .post('/api/decks')
            .set('Cookie', `sessionId=${testUser.sessionId}`)
            .send({
                name: 'Threat Test Deck',
                description: 'Testing reserve character threat adjustments'
            })
            .expect(201);

        testDeck = createResponse.body.data;
        integrationTestUtils.trackTestDeck(testDeck.id);
    });

    afterEach(async () => {
        // Clean up test user
        if (testUser && testUser.id) {
            await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
        }
    });

    afterAll(async () => {
        await integrationTestUtils.cleanupAllTestData();
        await pool.end();
    });

    describe('Carson of Venus threat adjustment', () => {
        it('should persist threat level 19 when Carson of Venus is reserve character', async () => {
            const carsonId = testCharacterIds.find(id => {
                const result = pool.query('SELECT name FROM characters WHERE id = $1', [id]);
                return result.then(res => res.rows[0]?.name === 'Carson of Venus');
            });

            // Add Carson of Venus to deck
            await request(app)
                .post(`/api/decks/${testDeck.id}/cards`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    cardType: 'character',
                    cardId: testCharacterIds[0], // Carson of Venus
                    quantity: 1
                })
                .expect([200, 201]);

            // Set Carson as reserve character
            const updateResponse = await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Threat Test Deck',
                    description: 'Testing reserve character threat adjustments',
                    reserve_character: testCharacterIds[0] // Carson of Venus
                })
                .expect(200);

            expect(updateResponse.body.success).toBe(true);

            // Verify the deck threat level is 19 (adjusted from 18)
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data.threat).toBe(19);
        });

        it('should persist threat level 18 when Carson of Venus is not reserve character', async () => {
            // Add Carson of Venus to deck
            await request(app)
                .post(`/api/decks/${testDeck.id}/cards`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    cardType: 'character',
                    cardId: testCharacterIds[0], // Carson of Venus
                    quantity: 1
                })
                .expect([200, 201]);

            // Don't set any reserve character
            const updateResponse = await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Threat Test Deck',
                    description: 'Testing reserve character threat adjustments',
                    reserve_character: null
                })
                .expect(200);

            expect(updateResponse.body.success).toBe(true);

            // Verify the deck threat level is 18 (normal)
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data.threat).toBe(18);
        });
    });

    describe('Morgan le Fay threat adjustment', () => {
        it('should persist threat level 20 when Morgan le Fay is reserve character', async () => {
            // Add Morgan le Fay to deck
            await request(app)
                .post(`/api/decks/${testDeck.id}/cards`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    cardType: 'character',
                    cardId: testCharacterIds[1], // Morgan le Fay
                    quantity: 1
                })
                .expect([200, 201]);

            // Set Morgan as reserve character
            const updateResponse = await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Threat Test Deck',
                    description: 'Testing reserve character threat adjustments',
                    reserve_character: testCharacterIds[1] // Morgan le Fay
                })
                .expect(200);

            expect(updateResponse.body.success).toBe(true);

            // Verify the deck threat level is 20 (adjusted from 19)
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data.threat).toBe(20);
        });

        it('should persist threat level 19 when Morgan le Fay is not reserve character', async () => {
            // Add Morgan le Fay to deck
            await request(app)
                .post(`/api/decks/${testDeck.id}/cards`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    cardType: 'character',
                    cardId: testCharacterIds[1], // Morgan le Fay
                    quantity: 1
                })
                .expect([200, 201]);

            // Don't set any reserve character
            const updateResponse = await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Threat Test Deck',
                    description: 'Testing reserve character threat adjustments',
                    reserve_character: null
                })
                .expect(200);

            expect(updateResponse.body.success).toBe(true);

            // Verify the deck threat level is 19 (normal)
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data.threat).toBe(19);
        });
    });

    describe('Victory Harben threat adjustment', () => {
        it('should persist threat level 20 when Victory Harben is reserve character', async () => {
            // Add Victory Harben to deck
            await request(app)
                .post(`/api/decks/${testDeck.id}/cards`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    cardType: 'character',
                    cardId: testCharacterIds[2], // Victory Harben
                    quantity: 1
                })
                .expect([200, 201]);

            // Set Victory as reserve character
            const updateResponse = await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Threat Test Deck',
                    description: 'Testing reserve character threat adjustments',
                    reserve_character: testCharacterIds[2] // Victory Harben
                })
                .expect(200);

            expect(updateResponse.body.success).toBe(true);

            // Verify the deck threat level is 20 (adjusted from 18)
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data.threat).toBe(20);
        });

        it('should persist threat level 18 when Victory Harben is not reserve character', async () => {
            // Add Victory Harben to deck
            await request(app)
                .post(`/api/decks/${testDeck.id}/cards`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    cardType: 'character',
                    cardId: testCharacterIds[2], // Victory Harben
                    quantity: 1
                })
                .expect([200, 201]);

            // Don't set any reserve character
            const updateResponse = await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Threat Test Deck',
                    description: 'Testing reserve character threat adjustments',
                    reserve_character: null
                })
                .expect(200);

            expect(updateResponse.body.success).toBe(true);

            // Verify the deck threat level is 18 (normal)
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data.threat).toBe(18);
        });
    });

    describe('Multiple characters with reserve', () => {
        it('should only adjust the reserve character threat, not others', async () => {
            // Add all three special characters to deck
            for (const characterId of testCharacterIds) {
                await request(app)
                    .post(`/api/decks/${testDeck.id}/cards`)
                    .set('Cookie', `sessionId=${testUser.sessionId}`)
                    .send({
                        cardType: 'character',
                        cardId: characterId,
                        quantity: 1
                    })
                    .expect([200, 201]);
            }

            // Set Carson of Venus as reserve character
            const updateResponse = await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Threat Test Deck',
                    description: 'Testing reserve character threat adjustments',
                    reserve_character: testCharacterIds[0] // Carson of Venus
                })
                .expect(200);

            expect(updateResponse.body.success).toBe(true);

            // Verify the deck threat level is 19 + 19 + 18 = 56
            // (Carson adjusted to 19, Morgan normal 19, Victory normal 18)
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data.threat).toBe(56);
        });

        it('should recalculate threat when reserve character changes', async () => {
            // Add all three special characters to deck
            for (const characterId of testCharacterIds) {
                await request(app)
                    .post(`/api/decks/${testDeck.id}/cards`)
                    .set('Cookie', `sessionId=${testUser.sessionId}`)
                    .send({
                        cardType: 'character',
                        cardId: characterId,
                        quantity: 1
                    })
                    .expect([200, 201]);
            }

            // First set Carson as reserve (19 + 19 + 18 = 56)
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Threat Test Deck',
                    description: 'Testing reserve character threat adjustments',
                    reserve_character: testCharacterIds[0] // Carson of Venus
                })
                .expect(200);

            let getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(getResponse.body.data.threat).toBe(56);

            // Then change to Morgan as reserve (18 + 20 + 18 = 56)
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Threat Test Deck',
                    description: 'Testing reserve character threat adjustments',
                    reserve_character: testCharacterIds[1] // Morgan le Fay
                })
                .expect(200);

            getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(getResponse.body.data.threat).toBe(56);

            // Finally change to Victory as reserve (18 + 19 + 20 = 57)
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Threat Test Deck',
                    description: 'Testing reserve character threat adjustments',
                    reserve_character: testCharacterIds[2] // Victory Harben
                })
                .expect(200);

            getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(getResponse.body.data.threat).toBe(57);
        });
    });
});

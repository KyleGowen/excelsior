/**
 * Integration tests for special character threat calculation display
 * Tests threat values shown in deck editor and deck summary card
 * for Carson of Venus, Morgan le Fay, and Victory Harben
 * in both reserve and non-reserve scenarios
 */

import request from 'supertest';
import { app, integrationTestUtils } from '../setup-integration';
import { Pool } from 'pg';

describe('Special Character Threat Display Integration Tests', () => {
    let pool: Pool;
    let testUser: any;
    let testDeck: any;
    let specialCharacterIds: { [key: string]: string };

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
        
        expect(characterResult.rows).toHaveLength(3);
        
        // Map character names to their IDs
        specialCharacterIds = {};
        characterResult.rows.forEach(row => {
            specialCharacterIds[row.name] = row.id;
        });
    });

    beforeEach(async () => {
        // Create test user
        testUser = await integrationTestUtils.createTestUser({
            name: 'Threat Display Test User',
            email: 'threatdisplay@example.com',
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
                name: 'Threat Display Test Deck',
                description: 'Testing special character threat display'
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

    describe('Carson of Venus threat display', () => {
        it('should display threat level 19 in deck editor and summary when Carson of Venus IS reserve character', async () => {
            // Add Carson of Venus to deck
            await request(app)
                .post(`/api/decks/${testDeck.id}/cards`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    cardType: 'character',
                    cardId: specialCharacterIds['Carson of Venus'],
                    quantity: 1
                })
                .expect([200, 201]);

            // Set Carson as reserve character
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Threat Display Test Deck',
                    description: 'Testing special character threat display',
                    reserve_character: specialCharacterIds['Carson of Venus']
                })
                .expect(200);

            // Get deck data to verify threat calculation
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data.threat).toBe(19); // Carson adjusted from 18 to 19 when reserve

            // Verify the deck has the correct reserve character
            expect(getResponse.body.data.metadata.reserve_character).toBe(specialCharacterIds['Carson of Venus']);

            // Test deck summary display by getting deck list
            const deckListResponse = await request(app)
                .get('/api/decks')
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(deckListResponse.body.success).toBe(true);
            const deckInList = deckListResponse.body.data.find((deck: any) => deck.metadata.id === testDeck.id);
            expect(deckInList).toBeDefined();
            expect(deckInList.metadata.threat).toBe(19); // Should show adjusted threat in summary
        });

        it('should display threat level 18 in deck editor and summary when Carson of Venus is NOT reserve character', async () => {
            // Add Carson of Venus to deck
            await request(app)
                .post(`/api/decks/${testDeck.id}/cards`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    cardType: 'character',
                    cardId: specialCharacterIds['Carson of Venus'],
                    quantity: 1
                })
                .expect([200, 201]);

            // Don't set any reserve character (leave as null)
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Threat Display Test Deck',
                    description: 'Testing special character threat display',
                    reserve_character: null
                })
                .expect(200);

            // Get deck data to verify threat calculation
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data.threat).toBe(18); // Carson normal threat level

            // Verify no reserve character is set
            expect(getResponse.body.data.metadata.reserve_character).toBeNull();

            // Test deck summary display by getting deck list
            const deckListResponse = await request(app)
                .get('/api/decks')
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(deckListResponse.body.success).toBe(true);
            const deckInList = deckListResponse.body.data.find((deck: any) => deck.metadata.id === testDeck.id);
            expect(deckInList).toBeDefined();
            expect(deckInList.metadata.threat).toBe(18); // Should show normal threat in summary
        });
    });

    describe('Morgan le Fay threat display', () => {
        it('should display threat level 20 in deck editor and summary when Morgan le Fay IS reserve character', async () => {
            // Add Morgan le Fay to deck
            await request(app)
                .post(`/api/decks/${testDeck.id}/cards`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    cardType: 'character',
                    cardId: specialCharacterIds['Morgan le Fay'],
                    quantity: 1
                })
                .expect([200, 201]);

            // Set Morgan as reserve character
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Threat Display Test Deck',
                    description: 'Testing special character threat display',
                    reserve_character: specialCharacterIds['Morgan le Fay']
                })
                .expect(200);

            // Get deck data to verify threat calculation
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data.threat).toBe(20); // Morgan adjusted from 19 to 20 when reserve

            // Verify the deck has the correct reserve character
            expect(getResponse.body.data.metadata.reserve_character).toBe(specialCharacterIds['Morgan le Fay']);

            // Test deck summary display by getting deck list
            const deckListResponse = await request(app)
                .get('/api/decks')
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(deckListResponse.body.success).toBe(true);
            const deckInList = deckListResponse.body.data.find((deck: any) => deck.metadata.id === testDeck.id);
            expect(deckInList).toBeDefined();
            expect(deckInList.metadata.threat).toBe(20); // Should show adjusted threat in summary
        });

        it('should display threat level 19 in deck editor and summary when Morgan le Fay is NOT reserve character', async () => {
            // Add Morgan le Fay to deck
            await request(app)
                .post(`/api/decks/${testDeck.id}/cards`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    cardType: 'character',
                    cardId: specialCharacterIds['Morgan le Fay'],
                    quantity: 1
                })
                .expect([200, 201]);

            // Don't set any reserve character (leave as null)
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Threat Display Test Deck',
                    description: 'Testing special character threat display',
                    reserve_character: null
                })
                .expect(200);

            // Get deck data to verify threat calculation
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data.threat).toBe(19); // Morgan normal threat level

            // Verify no reserve character is set
            expect(getResponse.body.data.metadata.reserve_character).toBeNull();

            // Test deck summary display by getting deck list
            const deckListResponse = await request(app)
                .get('/api/decks')
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(deckListResponse.body.success).toBe(true);
            const deckInList = deckListResponse.body.data.find((deck: any) => deck.metadata.id === testDeck.id);
            expect(deckInList).toBeDefined();
            expect(deckInList.metadata.threat).toBe(19); // Should show normal threat in summary
        });
    });

    describe('Victory Harben threat display', () => {
        it('should display threat level 20 in deck editor and summary when Victory Harben IS reserve character', async () => {
            // Add Victory Harben to deck
            await request(app)
                .post(`/api/decks/${testDeck.id}/cards`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    cardType: 'character',
                    cardId: specialCharacterIds['Victory Harben'],
                    quantity: 1
                })
                .expect([200, 201]);

            // Set Victory as reserve character
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Threat Display Test Deck',
                    description: 'Testing special character threat display',
                    reserve_character: specialCharacterIds['Victory Harben']
                })
                .expect(200);

            // Get deck data to verify threat calculation
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data.threat).toBe(20); // Victory adjusted from 18 to 20 when reserve

            // Verify the deck has the correct reserve character
            expect(getResponse.body.data.metadata.reserve_character).toBe(specialCharacterIds['Victory Harben']);

            // Test deck summary display by getting deck list
            const deckListResponse = await request(app)
                .get('/api/decks')
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(deckListResponse.body.success).toBe(true);
            const deckInList = deckListResponse.body.data.find((deck: any) => deck.metadata.id === testDeck.id);
            expect(deckInList).toBeDefined();
            expect(deckInList.metadata.threat).toBe(20); // Should show adjusted threat in summary
        });

        it('should display threat level 18 in deck editor and summary when Victory Harben is NOT reserve character', async () => {
            // Add Victory Harben to deck
            await request(app)
                .post(`/api/decks/${testDeck.id}/cards`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    cardType: 'character',
                    cardId: specialCharacterIds['Victory Harben'],
                    quantity: 1
                })
                .expect([200, 201]);

            // Don't set any reserve character (leave as null)
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Threat Display Test Deck',
                    description: 'Testing special character threat display',
                    reserve_character: null
                })
                .expect(200);

            // Get deck data to verify threat calculation
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data.threat).toBe(18); // Victory normal threat level

            // Verify no reserve character is set
            expect(getResponse.body.data.metadata.reserve_character).toBeNull();

            // Test deck summary display by getting deck list
            const deckListResponse = await request(app)
                .get('/api/decks')
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(deckListResponse.body.success).toBe(true);
            const deckInList = deckListResponse.body.data.find((deck: any) => deck.metadata.id === testDeck.id);
            expect(deckInList).toBeDefined();
            expect(deckInList.metadata.threat).toBe(18); // Should show normal threat in summary
        });
    });

    describe('Threat display consistency verification', () => {
        it('should show consistent threat values between deck editor and deck summary for all scenarios', async () => {
            // Test all three characters in both reserve and non-reserve scenarios
            const testScenarios = [
                { character: 'Carson of Venus', reserve: true, expectedThreat: 19 },
                { character: 'Carson of Venus', reserve: false, expectedThreat: 18 },
                { character: 'Morgan le Fay', reserve: true, expectedThreat: 20 },
                { character: 'Morgan le Fay', reserve: false, expectedThreat: 19 },
                { character: 'Victory Harben', reserve: true, expectedThreat: 20 },
                { character: 'Victory Harben', reserve: false, expectedThreat: 18 }
            ];

            for (const scenario of testScenarios) {
                // Create a new deck for each scenario
                const createResponse = await request(app)
                    .post('/api/decks')
                    .set('Cookie', `sessionId=${testUser.sessionId}`)
                    .send({
                        name: `Test Deck - ${scenario.character} ${scenario.reserve ? 'Reserve' : 'Normal'}`,
                        description: `Testing ${scenario.character} threat display`
                    })
                    .expect(201);

                const testDeckId = createResponse.body.data.id;
                integrationTestUtils.trackTestDeck(testDeckId);

                // Add the character to deck
                await request(app)
                    .post(`/api/decks/${testDeckId}/cards`)
                    .set('Cookie', `sessionId=${testUser.sessionId}`)
                    .send({
                        cardType: 'character',
                        cardId: specialCharacterIds[scenario.character],
                        quantity: 1
                    })
                    .expect([200, 201]);

                // Set or don't set reserve character
                await request(app)
                    .put(`/api/decks/${testDeckId}`)
                    .set('Cookie', `sessionId=${testUser.sessionId}`)
                    .send({
                        name: `Test Deck - ${scenario.character} ${scenario.reserve ? 'Reserve' : 'Normal'}`,
                        description: `Testing ${scenario.character} threat display`,
                        reserve_character: scenario.reserve ? specialCharacterIds[scenario.character] : null
                    })
                    .expect(200);

                // Verify deck editor threat (via individual deck API)
                const deckResponse = await request(app)
                    .get(`/api/decks/${testDeckId}`)
                    .set('Cookie', `sessionId=${testUser.sessionId}`)
                    .expect(200);

                expect(deckResponse.body.data.threat).toBe(scenario.expectedThreat);

                // Verify deck summary threat (via deck list API)
                const deckListResponse = await request(app)
                    .get('/api/decks')
                    .set('Cookie', `sessionId=${testUser.sessionId}`)
                    .expect(200);

                const deckInList = deckListResponse.body.data.find((deck: any) => deck.metadata.id === testDeckId);
                expect(deckInList).toBeDefined();
                expect(deckInList.metadata.threat).toBe(scenario.expectedThreat);

                // Verify consistency between both displays
                expect(deckResponse.body.data.threat).toBe(deckInList.metadata.threat);
            }
        });
    });
});

import request from 'supertest';
import { Pool } from 'pg';
import { app } from '../setup-integration';
import { integrationTestUtils } from '../setup-integration';

describe('Reserve Character Integration Tests', () => {
    let pool: Pool;
    let testUser: any;
    let testAdmin: any;
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

        // Create test admin
        testAdmin = await integrationTestUtils.createTestUser({
            name: `reserveadmin_${Date.now()}`,
            email: `reserveadmin_${Date.now()}@test.com`,
            password: 'testpassword123',
            role: 'ADMIN'
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

        // Login test admin to get session cookie
        const adminLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: testAdmin.username,
                password: 'testpassword123'
            })
            .expect(200);

        testAdmin.sessionId = adminLoginResponse.headers['set-cookie'][0].match(/sessionId=([^;]+)/)![1];

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
        // Clean up test users
        if (testUser?.id) {
            await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
        }
        if (testAdmin?.id) {
            await pool.query('DELETE FROM users WHERE id = $1', [testAdmin.id]);
        }
    });

    afterAll(async () => {
        await integrationTestUtils.cleanupAllTestData();
    });

    describe('Guest User Reserve Character Functionality', () => {
        it('should show "Select Reserve" buttons on all characters when no reserve is selected', async () => {
            const response = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.reserve_character).toBeNull();

            // Verify deck editor HTML contains "Select Reserve" buttons
            const deckEditorResponse = await request(app)
                .get(`/deck-editor/${testDeck.id}`)
                .expect(200);

            const html = deckEditorResponse.text;
            
            // Should have 4 "Select Reserve" buttons (one for each character)
            const selectReserveMatches = html.match(/Select Reserve/g);
            expect(selectReserveMatches).toHaveLength(4);
            
            // Should not have any "Reserve" buttons
            const reserveMatches = html.match(/class="reserve-btn active"/g);
            expect(reserveMatches).toBeNull();
        });

        it('should allow selecting a reserve character and update button states', async () => {
            // First, get the deck editor page
            const deckEditorResponse = await request(app)
                .get(`/deck-editor/${testDeck.id}`)
                .expect(200);

            // Simulate selecting a reserve character by updating the deck
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
                    reserve_character: testCharacterIds[0] // Select first character as reserve
                })
                .expect(200);

            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.data.reserve_character).toBe(testCharacterIds[0]);

            // Verify the updated deck has the reserve character set
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .expect(200);

            expect(getResponse.body.data.reserve_character).toBe(testCharacterIds[0]);
        });

        it('should allow deselecting a reserve character', async () => {
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
                .expect(200);

            // Then deselect it
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
                .expect(200);

            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.data.reserve_character).toBeNull();

            // Verify the updated deck has no reserve character
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .expect(200);

            expect(getResponse.body.data.reserve_character).toBeNull();
        });
    });

    describe('Regular User Reserve Character Functionality', () => {
        it('should show "Select Reserve" buttons on all characters when no reserve is selected', async () => {
            const response = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.reserve_character).toBeNull();

            // Verify deck editor HTML contains "Select Reserve" buttons
            const deckEditorResponse = await request(app)
                .get(`/deck-editor/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            const html = deckEditorResponse.text;
            
            // Should have 4 "Select Reserve" buttons (one for each character)
            const selectReserveMatches = html.match(/Select Reserve/g);
            expect(selectReserveMatches).toHaveLength(4);
            
            // Should not have any "Reserve" buttons
            const reserveMatches = html.match(/class="reserve-btn active"/g);
            expect(reserveMatches).toBeNull();
        });

        it('should allow selecting a reserve character and update button states', async () => {
            // Select first character as reserve
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

            expect(getResponse.body.data.reserve_character).toBe(testCharacterIds[0]);
        });

        it('should allow switching reserve character to a different character', async () => {
            // First select first character as reserve
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

            // Then switch to second character
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

            // Verify the updated deck has the new reserve character
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(getResponse.body.data.reserve_character).toBe(testCharacterIds[1]);
        });

        it('should allow deselecting a reserve character', async () => {
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

            // Then deselect it
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

            // Verify the updated deck has no reserve character
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(getResponse.body.data.reserve_character).toBeNull();
        });
    });

    describe('Admin User Reserve Character Functionality', () => {
        it('should show "Select Reserve" buttons on all characters when no reserve is selected', async () => {
            const response = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testAdmin.sessionId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.reserve_character).toBeNull();

            // Verify deck editor HTML contains "Select Reserve" buttons
            const deckEditorResponse = await request(app)
                .get(`/deck-editor/${testDeck.id}`)
                .set('Cookie', `sessionId=${testAdmin.sessionId}`)
                .expect(200);

            const html = deckEditorResponse.text;
            
            // Should have 4 "Select Reserve" buttons (one for each character)
            const selectReserveMatches = html.match(/Select Reserve/g);
            expect(selectReserveMatches).toHaveLength(4);
            
            // Should not have any "Reserve" buttons
            const reserveMatches = html.match(/class="reserve-btn active"/g);
            expect(reserveMatches).toBeNull();
        });

        it('should allow selecting a reserve character and update button states', async () => {
            // Select first character as reserve
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
                .set('Cookie', `sessionId=${testAdmin.sessionId}`)
                .expect(200);

            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.data.reserve_character).toBe(testCharacterIds[0]);

            // Verify the updated deck has the reserve character set
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testAdmin.sessionId}`)
                .expect(200);

            expect(getResponse.body.data.reserve_character).toBe(testCharacterIds[0]);
        });

        it('should allow switching reserve character to a different character', async () => {
            // First select first character as reserve
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
                .set('Cookie', `sessionId=${testAdmin.sessionId}`)
                .expect(200);

            // Then switch to second character
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
                .set('Cookie', `sessionId=${testAdmin.sessionId}`)
                .expect(200);

            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.data.reserve_character).toBe(testCharacterIds[1]);

            // Verify the updated deck has the new reserve character
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testAdmin.sessionId}`)
                .expect(200);

            expect(getResponse.body.data.reserve_character).toBe(testCharacterIds[1]);
        });

        it('should allow deselecting a reserve character', async () => {
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
                .set('Cookie', `sessionId=${testAdmin.sessionId}`)
                .expect(200);

            // Then deselect it
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
                .set('Cookie', `sessionId=${testAdmin.sessionId}`)
                .expect(200);

            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.data.reserve_character).toBeNull();

            // Verify the updated deck has no reserve character
            const getResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testAdmin.sessionId}`)
                .expect(200);

            expect(getResponse.body.data.reserve_character).toBeNull();
        });
    });

    describe('Read-Only Mode Reserve Character Functionality', () => {
        it('should not allow modifying reserve character when viewing another user\'s deck', async () => {
            // Create a deck as testUser
            const deckData = {
                name: 'Other User Deck',
                description: 'Deck owned by another user',
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

            const otherUserDeck = createResponse.body.data;
            integrationTestUtils.trackTestDeck(otherUserDeck.id);

            // Try to modify the deck as testAdmin (should be read-only)
            const updateResponse = await request(app)
                .put(`/api/decks/${otherUserDeck.id}`)
                .send({
                    name: 'Other User Deck',
                    description: 'Deck owned by another user',
                    is_limited: false,
                    characters: testCharacterIds.slice(0, 4),
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: [],
                    reserve_character: testCharacterIds[0]
                })
                .set('Cookie', `sessionId=${testAdmin.sessionId}`)
                .expect(403);

            expect(updateResponse.body.success).toBe(false);
            expect(updateResponse.body.error).toContain('not authorized');
        });

        it('should show deck editor in read-only mode for another user\'s deck', async () => {
            // Create a deck as testUser
            const deckData = {
                name: 'Other User Deck',
                description: 'Deck owned by another user',
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

            const otherUserDeck = createResponse.body.data;
            integrationTestUtils.trackTestDeck(otherUserDeck.id);

            // Access the deck editor as testAdmin (should be read-only)
            const deckEditorResponse = await request(app)
                .get(`/deck-editor/${otherUserDeck.id}`)
                .set('Cookie', `sessionId=${testAdmin.sessionId}`)
                .expect(200);

            const html = deckEditorResponse.text;
            
            // Should not have any "Select Reserve" buttons in read-only mode
            const selectReserveMatches = html.match(/Select Reserve/g);
            expect(selectReserveMatches).toBeNull();
            
            // Should not have any "Reserve" buttons in read-only mode
            const reserveMatches = html.match(/class="reserve-btn"/g);
            expect(reserveMatches).toBeNull();
        });
    });

    describe('Deck with Different Character Counts', () => {
        it('should handle deck with 1 character', async () => {
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

        it('should handle deck with 2 characters', async () => {
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

        it('should handle deck with 3 characters', async () => {
            const deckData = {
                name: 'Three Character Deck',
                description: 'Deck with three characters',
                is_limited: false,
                characters: testCharacterIds.slice(0, 3),
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

            const threeCharDeck = createResponse.body.data;
            integrationTestUtils.trackTestDeck(threeCharDeck.id);

            // Should be able to select any of the three characters as reserve
            const updateResponse = await request(app)
                .put(`/api/decks/${threeCharDeck.id}`)
                .send({
                    name: 'Three Character Deck',
                    description: 'Deck with three characters',
                    is_limited: false,
                    characters: testCharacterIds.slice(0, 3),
                    power_cards: [],
                    special_cards: [],
                    events: [],
                    locations: [],
                    missions: [],
                    reserve_character: testCharacterIds[2]
                })
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.data.reserve_character).toBe(testCharacterIds[2]);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle invalid character ID as reserve character', async () => {
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
                    reserve_character: 'invalid-character-id'
                })
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(400);

            expect(updateResponse.body.success).toBe(false);
            expect(updateResponse.body.error).toContain('foreign key constraint');
        });

        it('should handle character not in deck as reserve character', async () => {
            // Get a character ID that's not in our test deck
            const characterResult = await pool.query('SELECT id FROM characters WHERE id NOT IN ($1, $2, $3, $4) LIMIT 1', 
                testCharacterIds.slice(0, 4));
            
            if (characterResult.rows.length > 0) {
                const invalidCharacterId = characterResult.rows[0].id;
                
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
                        reserve_character: invalidCharacterId
                    })
                    .set('Cookie', `sessionId=${testUser.sessionId}`)
                    .expect(400);

                expect(updateResponse.body.success).toBe(false);
                expect(updateResponse.body.error).toContain('foreign key constraint');
            }
        });

        it('should handle empty string as reserve character', async () => {
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
                    reserve_character: ''
                })
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(400);

            expect(updateResponse.body.success).toBe(false);
            expect(updateResponse.body.error).toContain('invalid input syntax');
        });

        it('should handle undefined reserve character (should be treated as null)', async () => {
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
});

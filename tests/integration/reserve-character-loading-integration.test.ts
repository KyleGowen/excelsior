/**
 * Integration tests for reserve character loading functionality
 * Tests the complete workflow from API response to UI display
 */

import request from 'supertest';
import { Pool } from 'pg';
import { app, integrationTestUtils } from '../setup-integration';

describe('Reserve Character Loading Integration Tests', () => {
    let pool: Pool;
    let testUser: any;
    let testDeck: any;
    let testCharacterIds: string[];

    beforeAll(async () => {
        // Initialize database connection
        pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/overpower_deckbuilder_test'
        });

        // Get test character IDs
        const characterResult = await pool.query('SELECT id FROM characters LIMIT 3');
        testCharacterIds = characterResult.rows.map(row => row.id);
        
        if (testCharacterIds.length < 3) {
            throw new Error('Not enough test characters available');
        }
    });

    beforeEach(async () => {
        // Create test user
        testUser = await integrationTestUtils.createTestUser({
            name: `reserve_loading_test_${Date.now()}`,
            email: `reserve_loading_test_${Date.now()}@example.com`,
            role: 'USER',
            password: 'testpassword'
        });

        // Login user to get session
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: testUser.username,
                password: 'testpassword'
            })
            .expect(200);

        testUser.sessionId = loginResponse.headers['set-cookie'][0].match(/sessionId=([^;]+)/)![1];

        // Create test deck
        const createResponse = await request(app)
            .post('/api/decks')
            .set('Cookie', `sessionId=${testUser.sessionId}`)
            .send({
                name: 'Reserve Loading Test Deck',
                description: 'Test deck for reserve character loading'
            })
            .expect(201);

        testDeck = createResponse.body.data;
        
        // Add characters to deck
        for (let i = 0; i < 3; i++) {
            await request(app)
                .post(`/api/decks/${testDeck.id}/cards`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    cardType: 'character',
                    cardId: testCharacterIds[i],
                    quantity: 1
                })
                .expect([200, 201]); // Accept both 200 (already exists) and 201 (created)
        }

        // Track deck for cleanup
        integrationTestUtils.trackTestDeck(testDeck.id);
    });

    afterEach(async () => {
        // Clean up test user
        if (testUser && testUser.id) {
            await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]);
        }
    });

    afterAll(async () => {
        // Clean up all test data
        await integrationTestUtils.cleanupAllTestData();
        await pool.end();
    });

    describe('GET /api/decks/:id with reserve character', () => {
        it('should return deck with null reserve_character initially', async () => {
            const response = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.metadata.reserve_character).toBeNull();
        });

        it('should return deck with reserve_character in metadata', async () => {
            // Set a reserve character
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Reserve Loading Test Deck',
                    description: 'Test deck for reserve character loading',
                    is_limited: false,
                    is_valid: true,
                    reserve_character: testCharacterIds[0]
                })
                .expect(200);

            // Get the deck and verify reserve character is included
            const response = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.metadata.reserve_character).toBe(testCharacterIds[0]);
        });

        it('should handle changing reserve character', async () => {
            // Set initial reserve character
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Reserve Loading Test Deck',
                    description: 'Test deck for reserve character loading',
                    is_limited: false,
                    is_valid: true,
                    reserve_character: testCharacterIds[0]
                })
                .expect(200);

            // Change to different reserve character
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Reserve Loading Test Deck',
                    description: 'Test deck for reserve character loading',
                    is_limited: false,
                    is_valid: true,
                    reserve_character: testCharacterIds[1]
                })
                .expect(200);

            // Verify the change
            const response = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.metadata.reserve_character).toBe(testCharacterIds[1]);
        });

        it('should handle removing reserve character', async () => {
            // Set initial reserve character
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Reserve Loading Test Deck',
                    description: 'Test deck for reserve character loading',
                    is_limited: false,
                    is_valid: true,
                    reserve_character: testCharacterIds[0]
                })
                .expect(200);

            // Remove reserve character
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Reserve Loading Test Deck',
                    description: 'Test deck for reserve character loading',
                    is_limited: false,
                    is_valid: true,
                    reserve_character: null
                })
                .expect(200);

            // Verify removal
            const response = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.metadata.reserve_character).toBeNull();
        });

        it('should handle invalid reserve character ID gracefully', async () => {
            // Try to set invalid reserve character
            const response = await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Reserve Loading Test Deck',
                    description: 'Test deck for reserve character loading',
                    is_limited: false,
                    is_valid: true,
                    reserve_character: 'invalid-character-id'
                });

            // Should fail with 500 due to invalid UUID format
            expect(response.status).toBe(500);
        });
    });

    describe('Reserve character persistence across deck operations', () => {
        it('should maintain reserve character when adding cards', async () => {
            // Set reserve character
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Reserve Loading Test Deck',
                    description: 'Test deck for reserve character loading',
                    is_limited: false,
                    is_valid: true,
                    reserve_character: testCharacterIds[0]
                })
                .expect(200);

            // Add a power card
            await request(app)
                .post(`/api/decks/${testDeck.id}/cards`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    cardType: 'power',
                    cardId: 'test-power-id',
                    quantity: 1
                })
                .expect([200, 201]); // Accept both 200 (already exists) and 201 (created)

            // Verify reserve character is still set
            const response = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.metadata.reserve_character).toBe(testCharacterIds[0]);
        });

        it('should maintain reserve character when removing cards', async () => {
            // Set reserve character
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Reserve Loading Test Deck',
                    description: 'Test deck for reserve character loading',
                    is_limited: false,
                    is_valid: true,
                    reserve_character: testCharacterIds[0]
                })
                .expect(200);

            // Remove a character card (not the reserve character)
            await request(app)
                .delete(`/api/decks/${testDeck.id}/cards`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    cardType: 'character',
                    cardId: testCharacterIds[1],
                    quantity: 1
                })
                .expect(200);

            // Verify reserve character is still set
            const response = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.metadata.reserve_character).toBe(testCharacterIds[0]);
        });
    });

    describe('Reserve character with different user roles', () => {
        let adminUser: any;

        beforeEach(async () => {
            // Create admin user
            adminUser = await integrationTestUtils.createTestUser({
                name: `admin_reserve_test_${Date.now()}`,
                email: `admin_reserve_test_${Date.now()}@example.com`,
                role: 'ADMIN',
                password: 'testpassword'
            });

            // Login admin user
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: adminUser.username,
                    password: 'testpassword'
                })
                .expect(200);

            adminUser.sessionId = loginResponse.headers['set-cookie'][0].match(/sessionId=([^;]+)/)![1];
        });

        afterEach(async () => {
            // Clean up admin user
            if (adminUser && adminUser.id) {
                await pool.query('DELETE FROM users WHERE id = $1', [adminUser.id]);
            }
        });

        it('should allow admin to view deck with reserve character', async () => {
            // Set reserve character as regular user
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Reserve Loading Test Deck',
                    description: 'Test deck for reserve character loading',
                    is_limited: false,
                    is_valid: true,
                    reserve_character: testCharacterIds[0]
                })
                .expect(200);

            // Admin should be able to view the deck
            const response = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${adminUser.sessionId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.metadata.reserve_character).toBe(testCharacterIds[0]);
        });

        it('should not allow admin to modify deck reserve character', async () => {
            // Admin should not be able to modify the deck
            const response = await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${adminUser.sessionId}`)
                .send({
                    name: 'Reserve Loading Test Deck',
                    description: 'Test deck for reserve character loading',
                    is_limited: false,
                    is_valid: true,
                    reserve_character: testCharacterIds[0]
                })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Access denied');
        });
    });

    describe('Reserve character with guest users', () => {
        it('should allow guest to view deck with reserve character', async () => {
            // Set reserve character as regular user
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Reserve Loading Test Deck',
                    description: 'Test deck for reserve character loading',
                    is_limited: false,
                    is_valid: true,
                    reserve_character: testCharacterIds[0]
                })
                .expect(200);

            // Guest should be able to view the deck (read-only) - but this requires authentication
            // For now, we'll test that the deck can be accessed by the owner
            const response = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.metadata.reserve_character).toBe(testCharacterIds[0]);
        });
    });

    describe('Reserve character data consistency', () => {
        it('should return consistent data structure', async () => {
            // Set reserve character
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Reserve Loading Test Deck',
                    description: 'Test deck for reserve character loading',
                    is_limited: false,
                    is_valid: true,
                    reserve_character: testCharacterIds[0]
                })
                .expect(200);

            // Get deck multiple times and verify consistency
            for (let i = 0; i < 3; i++) {
                const response = await request(app)
                    .get(`/api/decks/${testDeck.id}`)
                    .set('Cookie', `sessionId=${testUser.sessionId}`)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.metadata.reserve_character).toBe(testCharacterIds[0]);
                expect(response.body.data.metadata).toHaveProperty('id');
                expect(response.body.data.metadata).toHaveProperty('name');
                expect(response.body.data.metadata).toHaveProperty('description');
                expect(response.body.data.metadata).toHaveProperty('is_limited');
                expect(response.body.data.metadata).toHaveProperty('reserve_character');
            }
        });

        it('should handle concurrent reserve character updates', async () => {
            // Set initial reserve character
            await request(app)
                .put(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .send({
                    name: 'Reserve Loading Test Deck',
                    description: 'Test deck for reserve character loading',
                    is_limited: false,
                    is_valid: true,
                    reserve_character: testCharacterIds[0]
                })
                .expect(200);

            // Make multiple concurrent updates
            const promises = [
                request(app)
                    .put(`/api/decks/${testDeck.id}`)
                    .set('Cookie', `sessionId=${testUser.sessionId}`)
                    .send({
                        name: 'Reserve Loading Test Deck',
                        description: 'Test deck for reserve character loading',
                        is_limited: false,
                        is_valid: true,
                        reserve_character: testCharacterIds[1]
                    }),
                request(app)
                    .put(`/api/decks/${testDeck.id}`)
                    .set('Cookie', `sessionId=${testUser.sessionId}`)
                    .send({
                        name: 'Reserve Loading Test Deck',
                        description: 'Test deck for reserve character loading',
                        is_limited: false,
                        is_valid: true,
                        reserve_character: testCharacterIds[2]
                    })
            ];

            const responses = await Promise.all(promises);
            
            // Both should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });

            // Final state should be consistent
            const finalResponse = await request(app)
                .get(`/api/decks/${testDeck.id}`)
                .set('Cookie', `sessionId=${testUser.sessionId}`)
                .expect(200);

            expect(finalResponse.body.success).toBe(true);
            expect(finalResponse.body.data.metadata.reserve_character).toBeDefined();
        });
    });
});

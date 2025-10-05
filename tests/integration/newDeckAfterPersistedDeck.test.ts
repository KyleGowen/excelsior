/**
 * Integration test for new deck creation after viewing persisted deck
 * Proves that opening a persisted deck first, then opening the new deck editor,
 * results in a truly empty deck
 */

import request from 'supertest';
import { app } from '../setup-integration';
import { integrationTestUtils } from '../setup-integration';

describe('New Deck Creation After Persisted Deck Integration', () => {
    let adminUser: any;
    let regularUser: any;
    let adminAuthToken: string;
    let userAuthToken: string;
    let testDeckId: string;

    beforeAll(async () => {
        // Create test users
        adminUser = await integrationTestUtils.createTestUser({
            name: 'admin',
            email: 'admin@test.com',
            password: 'password123',
            role: 'ADMIN'
        });
        regularUser = await integrationTestUtils.createTestUser({
            name: 'testuser',
            email: 'user@test.com',
            password: 'password123',
            role: 'USER'
        });
    });

    beforeEach(async () => {
        console.log('🔍 DEBUG: Admin user:', adminUser);
        console.log('🔍 DEBUG: Regular user:', regularUser);
        
        // Login as admin and regular user to get auth tokens
        const adminLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({ username: adminUser.username, password: 'password123' });
        
        console.log('🔍 DEBUG: Admin login response:', adminLoginResponse.status, adminLoginResponse.body);
        console.log('🔍 DEBUG: Admin login headers:', adminLoginResponse.headers);
        
        if (adminLoginResponse.status !== 200) {
            console.error('Admin login failed:', adminLoginResponse.body);
            throw new Error(`Admin login failed: ${adminLoginResponse.status}`);
        }
        // Extract session cookie from login response
        const adminSetCookie = adminLoginResponse.headers['set-cookie'];
        console.log('🔍 DEBUG: Admin set-cookie header:', adminSetCookie);
        const adminSessionCookie = Array.isArray(adminSetCookie) 
            ? adminSetCookie.find((cookie: string) => cookie.startsWith('sessionId='))
            : adminSetCookie?.startsWith('sessionId=') ? adminSetCookie : null;
        adminAuthToken = adminSessionCookie || '';
        console.log('🔍 DEBUG: Admin auth token:', adminAuthToken);

        const userLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({ username: regularUser.username, password: 'password123' });
        
        console.log('🔍 DEBUG: User login response:', userLoginResponse.status, userLoginResponse.body);
        console.log('🔍 DEBUG: User login headers:', userLoginResponse.headers);
        
        if (userLoginResponse.status !== 200) {
            console.error('User login failed:', userLoginResponse.body);
            throw new Error(`User login failed: ${userLoginResponse.status}`);
        }
        // Extract session cookie from login response
        const userSetCookie = userLoginResponse.headers['set-cookie'];
        console.log('🔍 DEBUG: User set-cookie header:', userSetCookie);
        const userSessionCookie = Array.isArray(userSetCookie) 
            ? userSetCookie.find((cookie: string) => cookie.startsWith('sessionId='))
            : userSetCookie?.startsWith('sessionId=') ? userSetCookie : null;
        userAuthToken = userSessionCookie || '';
        console.log('🔍 DEBUG: User auth token:', userAuthToken);

        // Create a test deck with cards for the regular user
        const deckData = {
            name: 'Test Persisted Deck',
            description: 'A deck with cards to test new deck creation',
            characterIds: [
                'character-1',
                'character-2'
            ]
        };

        const createResponse = await request(app)
            .post('/api/decks')
            .set('Cookie', userAuthToken)
            .send(deckData);

        expect(createResponse.status).toBe(201);
        testDeckId = createResponse.body.data.id;
    });

    afterEach(async () => {
        // Clean up test deck
        if (testDeckId) {
            await request(app)
                .delete(`/api/decks/${testDeckId}`)
                .set('Cookie', userAuthToken);
        }
    });

    afterAll(async () => {
        // Clean up test users
        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: 'postgresql://postgres:password@localhost:1337/overpower'
        });
        
        try {
            if (adminUser && adminUser.id) {
                await pool.query('DELETE FROM users WHERE id = $1', [adminUser.id]);
            }
            if (regularUser && regularUser.id) {
                await pool.query('DELETE FROM users WHERE id = $1', [regularUser.id]);
            }
        } finally {
            await pool.end();
        }
    });

    describe('New Deck Creation After Viewing Persisted Deck', () => {
        test('should create truly empty deck after viewing persisted deck', async () => {
            // Step 1: Get the persisted deck to simulate viewing it
            const getDeckResponse = await request(app)
                .get(`/api/decks/${testDeckId}`)
                .set('Cookie', userAuthToken);

            expect(getDeckResponse.status).toBe(200);
            expect(getDeckResponse.body.data.metadata.name).toBe('Test Persisted Deck');

            // Step 2: Create a new deck (simulating clicking "+ Create Deck" after viewing the persisted deck)
            const newDeckData = {
                name: 'New Empty Deck',
                description: 'This should be completely empty',
                characterIds: [] // Explicitly empty
            };

            const createNewDeckResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', userAuthToken)
                .send(newDeckData);

            expect(createNewDeckResponse.status).toBe(201);
            const newDeckId = createNewDeckResponse.body.data.id;

            // Step 3: Verify the new deck is truly empty
            const getNewDeckResponse = await request(app)
                .get(`/api/decks/${newDeckId}`)
                .set('Cookie', userAuthToken);

            expect(getNewDeckResponse.status).toBe(200);
            expect(getNewDeckResponse.body.data.metadata.name).toBe('New Empty Deck');
            expect(getNewDeckResponse.body.data.metadata.description).toBe('This should be completely empty');

            // Step 4: Verify the persisted deck is unchanged
            const getPersistedDeckAgainResponse = await request(app)
                .get(`/api/decks/${testDeckId}`)
                .set('Cookie', userAuthToken);

            expect(getPersistedDeckAgainResponse.status).toBe(200);
            expect(getPersistedDeckAgainResponse.body.data.metadata.name).toBe('Test Persisted Deck');

            // Clean up the new deck
            await request(app)
                .delete(`/api/decks/${newDeckId}`)
                .set('Cookie', userAuthToken);
        });

        test('should handle multiple deck operations without interference', async () => {
            // Step 1: Get the persisted deck
            const getDeckResponse = await request(app)
                .get(`/api/decks/${testDeckId}`)
                .set('Cookie', userAuthToken);

            expect(getDeckResponse.status).toBe(200);
            const originalCardCount = getDeckResponse.body.data.cards.length;

            // Step 2: Create multiple new empty decks
            const newDeckIds: string[] = [];
            
            for (let i = 0; i < 3; i++) {
                const newDeckData = {
                    name: `New Empty Deck ${i + 1}`,
                    description: `Empty deck number ${i + 1}`,
                    characterIds: []
                };

                const createResponse = await request(app)
                    .post('/api/decks')
                    .set('Cookie', userAuthToken)
                    .send(newDeckData);

                expect(createResponse.status).toBe(201);
                newDeckIds.push(createResponse.body.data.id);

                // Verify each new deck is empty
                const getNewDeckResponse = await request(app)
                    .get(`/api/decks/${createResponse.body.data.id}`)
                    .set('Cookie', userAuthToken);

                expect(getNewDeckResponse.status).toBe(200);
                expect(getNewDeckResponse.body.data.cards).toHaveLength(0);
                expect(getNewDeckResponse.body.data.metadata.cardCount).toBe(0);
            }

            // Step 3: Verify the original persisted deck is still unchanged
            const getPersistedDeckAgainResponse = await request(app)
                .get(`/api/decks/${testDeckId}`)
                .set('Cookie', userAuthToken);

            expect(getPersistedDeckAgainResponse.status).toBe(200);
            expect(getPersistedDeckAgainResponse.body.data.cards).toHaveLength(originalCardCount);
            expect(getPersistedDeckAgainResponse.body.data.metadata.name).toBe('Test Persisted Deck');

            // Clean up the new decks
            for (const deckId of newDeckIds) {
                await request(app)
                    .delete(`/api/decks/${deckId}`)
                    .set('Cookie', userAuthToken);
            }
        });

        test('should maintain deck isolation between users', async () => {
            // Step 1: Admin user gets the persisted deck (should fail - different user)
            const adminGetDeckResponse = await request(app)
                .get(`/api/decks/${testDeckId}`)
                .set('Cookie', adminAuthToken);

            expect(adminGetDeckResponse.status).toBe(403); // Should be forbidden

            // Step 2: Admin user creates their own deck
            const adminDeckData = {
                name: 'Admin Empty Deck',
                description: 'Admin deck should be separate',
                characterIds: []
            };

            const adminCreateResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', adminAuthToken)
                .send(adminDeckData);

            expect(adminCreateResponse.status).toBe(201);
            const adminDeckId = adminCreateResponse.body.data.id;

            // Step 3: Regular user creates their own new deck
            const userDeckData = {
                name: 'User Empty Deck',
                description: 'User deck should be separate',
                characterIds: []
            };

            const userCreateResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', userAuthToken)
                .send(userDeckData);

            expect(userCreateResponse.status).toBe(201);
            const userDeckId = userCreateResponse.body.data.id;

            // Step 4: Verify both decks are empty and separate
            const adminGetNewDeckResponse = await request(app)
                .get(`/api/decks/${adminDeckId}`)
                .set('Cookie', adminAuthToken);

            expect(adminGetNewDeckResponse.status).toBe(200);
            expect(adminGetNewDeckResponse.body.data.cards).toHaveLength(0);
            expect(adminGetNewDeckResponse.body.data.metadata.name).toBe('Admin Empty Deck');

            const userGetNewDeckResponse = await request(app)
                .get(`/api/decks/${userDeckId}`)
                .set('Cookie', userAuthToken);

            expect(userGetNewDeckResponse.status).toBe(200);
            expect(userGetNewDeckResponse.body.data.cards).toHaveLength(0);
            expect(userGetNewDeckResponse.body.data.metadata.name).toBe('User Empty Deck');

            // Step 5: Verify users cannot access each other's decks
            const adminAccessUserDeckResponse = await request(app)
                .get(`/api/decks/${userDeckId}`)
                .set('Cookie', adminAuthToken);

            expect(adminAccessUserDeckResponse.status).toBe(403);

            const userAccessAdminDeckResponse = await request(app)
                .get(`/api/decks/${adminDeckId}`)
                .set('Cookie', userAuthToken);

            expect(userAccessAdminDeckResponse.status).toBe(403);

            // Clean up
            await request(app)
                .delete(`/api/decks/${adminDeckId}`)
                .set('Cookie', adminAuthToken);

            await request(app)
                .delete(`/api/decks/${userDeckId}`)
                .set('Cookie', userAuthToken);
        });

        test('should handle deck creation with different UI preferences', async () => {
            // Step 1: Get the persisted deck with its UI preferences
            const getDeckResponse = await request(app)
                .get(`/api/decks/${testDeckId}`)
                .set('Cookie', userAuthToken);

            expect(getDeckResponse.status).toBe(200);

            // Step 2: Create new deck with different UI preferences
            const newDeckData = {
                name: 'New Deck with Different UI',
                description: 'Testing UI preference isolation',
                characterIds: []
            };

            const createResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', userAuthToken)
                .send(newDeckData);

            expect(createResponse.status).toBe(201);
            const newDeckId = createResponse.body.data.id;

            // Step 3: Verify new deck is empty and has default UI preferences
            const getNewDeckResponse = await request(app)
                .get(`/api/decks/${newDeckId}`)
                .set('Cookie', userAuthToken);

            expect(getNewDeckResponse.status).toBe(200);
            expect(getNewDeckResponse.body.data.metadata.name).toBe('New Deck with Different UI');
            expect(getNewDeckResponse.body.data.cards).toHaveLength(0);

            // Step 4: Verify original deck is unchanged
            const getOriginalDeckAgainResponse = await request(app)
                .get(`/api/decks/${testDeckId}`)
                .set('Cookie', userAuthToken);

            expect(getOriginalDeckAgainResponse.status).toBe(200);
            expect(getOriginalDeckAgainResponse.body.data.metadata.name).toBe('Test Persisted Deck');

            // Clean up
            await request(app)
                .delete(`/api/decks/${newDeckId}`)
                .set('Cookie', userAuthToken);
        });
    });
});

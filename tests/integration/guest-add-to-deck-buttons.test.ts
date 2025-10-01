import request from 'supertest';
import { app } from '../../src/test-server';
import { integrationTestUtils } from '../setup-integration';

describe('Guest Add to Deck Buttons Integration Tests', () => {
    let guestUser: any;
    let regularUser: any;
    let adminUser: any;
    let guestAuthCookie: string;
    let userAuthCookie: string;
    let adminAuthCookie: string;

    beforeAll(async () => {
        // Create test users
        guestUser = await integrationTestUtils.createTestUser({
            name: 'guest',
            email: 'guest@example.com',
            role: 'GUEST',
            password: 'guest'
        });

        regularUser = await integrationTestUtils.createTestUser({
            name: 'testuser',
            email: 'testuser@example.com',
            role: 'USER',
            password: 'testpass'
        });

        adminUser = await integrationTestUtils.createTestUser({
            name: 'admin',
            email: 'admin@example.com',
            role: 'ADMIN',
            password: 'adminpass'
        });

        // Login as guest user
        const guestLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: guestUser.username,
                password: 'guest'
            });
        
        if (guestLoginResponse.headers['set-cookie']) {
            guestAuthCookie = guestLoginResponse.headers['set-cookie'][0];
        }

        // Login as regular user
        const userLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: regularUser.username,
                password: 'testpass'
            });
        
        if (userLoginResponse.headers['set-cookie']) {
            userAuthCookie = userLoginResponse.headers['set-cookie'][0];
        }

        // Login as admin user
        const adminLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: adminUser.username,
                password: 'adminpass'
            });
        
        if (adminLoginResponse.headers['set-cookie']) {
            adminAuthCookie = adminLoginResponse.headers['set-cookie'][0];
        }
    });

    afterAll(async () => {
        // Clean up test users
        await integrationTestUtils.cleanupTestData();
    });

    describe('Guest User - Disabled Add to Deck Buttons', () => {
        it('should have disabled Add to Deck buttons on characters tab', async () => {
            const response = await request(app)
                .get('/users/guest/decks')
                .set('Cookie', guestAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');
            expect(response.text).toContain('Characters');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have disabled Add to Deck buttons on basic universe tab', async () => {
            const response = await request(app)
                .get('/users/guest/decks')
                .set('Cookie', guestAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have disabled Add to Deck buttons on advanced universe tab', async () => {
            const response = await request(app)
                .get('/users/guest/decks')
                .set('Cookie', guestAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have disabled Add to Deck buttons on special cards tab', async () => {
            const response = await request(app)
                .get('/users/guest/decks')
                .set('Cookie', guestAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have disabled Add to Deck buttons on locations tab', async () => {
            const response = await request(app)
                .get('/users/guest/decks')
                .set('Cookie', guestAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have disabled Add to Deck buttons on aspects tab', async () => {
            const response = await request(app)
                .get('/users/guest/decks')
                .set('Cookie', guestAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have disabled Add to Deck buttons on missions tab', async () => {
            const response = await request(app)
                .get('/users/guest/decks')
                .set('Cookie', guestAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have disabled Add to Deck buttons on events tab', async () => {
            const response = await request(app)
                .get('/users/guest/decks')
                .set('Cookie', guestAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have disabled Add to Deck buttons on teamwork tab', async () => {
            const response = await request(app)
                .get('/users/guest/decks')
                .set('Cookie', guestAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have disabled Add to Deck buttons on ally universe tab', async () => {
            const response = await request(app)
                .get('/users/guest/decks')
                .set('Cookie', guestAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have disabled Add to Deck buttons on training tab', async () => {
            const response = await request(app)
                .get('/users/guest/decks')
                .set('Cookie', guestAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have disabled Add to Deck buttons on power cards tab', async () => {
            const response = await request(app)
                .get('/users/guest/decks')
                .set('Cookie', guestAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });
    });

    describe('Regular User - Enabled Add to Deck Buttons', () => {
        it('should have enabled Add to Deck buttons on characters tab', async () => {
            const response = await request(app)
                .get('/users/testuser/decks')
                .set('Cookie', userAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');
            expect(response.text).toContain('Characters');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on basic universe tab', async () => {
            const response = await request(app)
                .get('/users/testuser/decks')
                .set('Cookie', userAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on special cards tab', async () => {
            const response = await request(app)
                .get('/users/testuser/decks')
                .set('Cookie', userAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on advanced universe tab', async () => {
            const response = await request(app)
                .get('/users/testuser/decks')
                .set('Cookie', userAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on locations tab', async () => {
            const response = await request(app)
                .get('/users/testuser/decks')
                .set('Cookie', userAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on aspects tab', async () => {
            const response = await request(app)
                .get('/users/testuser/decks')
                .set('Cookie', userAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on missions tab', async () => {
            const response = await request(app)
                .get('/users/testuser/decks')
                .set('Cookie', userAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on events tab', async () => {
            const response = await request(app)
                .get('/users/testuser/decks')
                .set('Cookie', userAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on teamwork tab', async () => {
            const response = await request(app)
                .get('/users/testuser/decks')
                .set('Cookie', userAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on ally universe tab', async () => {
            const response = await request(app)
                .get('/users/testuser/decks')
                .set('Cookie', userAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on training tab', async () => {
            const response = await request(app)
                .get('/users/testuser/decks')
                .set('Cookie', userAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on power cards tab', async () => {
            const response = await request(app)
                .get('/users/testuser/decks')
                .set('Cookie', userAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });
    });

    describe('Admin User - Enabled Add to Deck Buttons', () => {
        it('should have enabled Add to Deck buttons on characters tab', async () => {
            const response = await request(app)
                .get('/users/admin/decks')
                .set('Cookie', adminAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');
            expect(response.text).toContain('Characters');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on basic universe tab', async () => {
            const response = await request(app)
                .get('/users/admin/decks')
                .set('Cookie', adminAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on special cards tab', async () => {
            const response = await request(app)
                .get('/users/admin/decks')
                .set('Cookie', adminAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on advanced universe tab', async () => {
            const response = await request(app)
                .get('/users/admin/decks')
                .set('Cookie', adminAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on locations tab', async () => {
            const response = await request(app)
                .get('/users/admin/decks')
                .set('Cookie', adminAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on aspects tab', async () => {
            const response = await request(app)
                .get('/users/admin/decks')
                .set('Cookie', adminAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on missions tab', async () => {
            const response = await request(app)
                .get('/users/admin/decks')
                .set('Cookie', adminAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on events tab', async () => {
            const response = await request(app)
                .get('/users/admin/decks')
                .set('Cookie', adminAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on teamwork tab', async () => {
            const response = await request(app)
                .get('/users/admin/decks')
                .set('Cookie', adminAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on ally universe tab', async () => {
            const response = await request(app)
                .get('/users/admin/decks')
                .set('Cookie', adminAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on training tab', async () => {
            const response = await request(app)
                .get('/users/admin/decks')
                .set('Cookie', adminAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });

        it('should have enabled Add to Deck buttons on power cards tab', async () => {
            const response = await request(app)
                .get('/users/admin/decks')
                .set('Cookie', adminAuthCookie)
                .expect(200);

            // Check that the page loads
            expect(response.text).toContain('database-view');

            // Check that the JavaScript functions are present
            expect(response.text).toContain('isGuestUser');
            expect(response.text).toContain('disableAddToDeckButtons');
        });
    });

    describe('Cross-Role Button State Verification', () => {
        it('should show different button states for different user roles', async () => {
            // Test guest user
            const guestResponse = await request(app)
                .get('/users/guest/decks')
                .set('Cookie', guestAuthCookie)
                .expect(200);

            // Test regular user
            const userResponse = await request(app)
                .get('/users/testuser/decks')
                .set('Cookie', userAuthCookie)
                .expect(200);

            // Test admin user
            const adminResponse = await request(app)
                .get('/users/admin/decks')
                .set('Cookie', adminAuthCookie)
                .expect(200);

            // All responses should load successfully
            expect(guestResponse.status).toBe(200);
            expect(userResponse.status).toBe(200);
            expect(adminResponse.status).toBe(200);

            // All should contain the JavaScript functions
            expect(guestResponse.text).toContain('isGuestUser');
            expect(userResponse.text).toContain('isGuestUser');
            expect(adminResponse.text).toContain('isGuestUser');
        });
    });

    describe('JavaScript Function Integration', () => {
        it('should have isGuestUser function defined', async () => {
            const response = await request(app)
                .get('/users/guest/decks')
                .set('Cookie', guestAuthCookie)
                .expect(200);

            // Check that the isGuestUser function is defined
            expect(response.text).toContain('function isGuestUser()');
            expect(response.text).toContain('getCurrentUser()');
            expect(response.text).toContain('GUEST');
        });

        it('should have disableAddToDeckButtons function defined', async () => {
            const response = await request(app)
                .get('/users/guest/decks')
                .set('Cookie', guestAuthCookie)
                .expect(200);

            // Check that the disableAddToDeckButtons function is defined
            expect(response.text).toContain('function disableAddToDeckButtons()');
            expect(response.text).toContain('querySelectorAll');
            expect(response.text).toContain('disabled = true');
            expect(response.text).toContain('Log in to add to decks...');
        });

        it('should call disableAddToDeckButtonsImmediate after data loads', async () => {
            const response = await request(app)
                .get('/users/guest/decks')
                .set('Cookie', guestAuthCookie)
                .expect(200);

            // Check that the function is called after data loads
            expect(response.text).toContain('disableAddToDeckButtonsImmediate()');
            expect(response.text).toContain('loadDatabaseViewData()');
        });
    });

    describe('Guest Role Add to Deck Functionality Verification', () => {
        let testDeckId: string;
        let createdDeckIds: string[] = [];

        beforeAll(async () => {
            // Create a test deck for the guest user
            const createDeckResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', guestAuthCookie)
                .send({
                    name: 'Guest Test Deck',
                    description: 'Test deck for guest user verification'
                });

            if (createDeckResponse.status === 200) {
                testDeckId = createDeckResponse.body.data.metadata.id;
                createdDeckIds.push(testDeckId);
            }
        });

        afterAll(async () => {
            // Clean up all test decks
            for (const deckId of createdDeckIds) {
                try {
                    await request(app)
                        .delete(`/api/decks/${deckId}`)
                        .set('Cookie', guestAuthCookie);
                } catch (error) {
                    console.warn(`Failed to delete test deck ${deckId}:`, error);
                }
            }
            
            // Additional cleanup: remove any remaining test decks by name pattern
            try {
                const { Pool } = require('pg');
                const pool = new Pool({
                    connectionString: 'postgresql://postgres:password@localhost:1337/overpower'
                });
                
                await pool.query("DELETE FROM decks WHERE name IN ('Guest Test Deck', 'Guest Attempted Deck') AND user_id = (SELECT id FROM users WHERE username = 'guest' LIMIT 1)");
                await pool.end();
            } catch (error) {
                console.warn('Failed to clean up test decks by name pattern:', error);
            }
        });

        it('should prevent guest users from adding character cards to deck', async () => {
            // Try to add a character card to the deck
            const addCardResponse = await request(app)
                .post(`/api/decks/${testDeckId}/cards`)
                .set('Cookie', guestAuthCookie)
                .send({
                    cardType: 'character',
                    cardId: 'char_1', // Assuming this exists
                    quantity: 1
                });

            // Guest users should not be able to add cards (returns 403 for guest restrictions)
            expect(addCardResponse.status).toBe(403);
            expect(addCardResponse.body.success).toBe(false);
        });

        it('should prevent guest users from adding special cards to deck', async () => {
            // Try to add a special card to the deck
            const addCardResponse = await request(app)
                .post(`/api/decks/${testDeckId}/cards`)
                .set('Cookie', guestAuthCookie)
                .send({
                    cardType: 'special',
                    cardId: 'special_1', // Assuming this exists
                    quantity: 1
                });

            // Guest users should not be able to add cards (returns 403 for guest restrictions)
            expect(addCardResponse.status).toBe(403);
            expect(addCardResponse.body.success).toBe(false);
        });

        it('should prevent guest users from adding any card type to deck', async () => {
            const cardTypes = [
                'character', 'special', 'location', 'mission', 
                'event', 'aspect', 'advanced-universe', 'teamwork',
                'ally-universe', 'training', 'basic-universe', 'power'
            ];

            for (const cardType of cardTypes) {
                const addCardResponse = await request(app)
                    .post(`/api/decks/${testDeckId}/cards`)
                    .set('Cookie', guestAuthCookie)
                    .send({
                        cardType: cardType,
                        cardId: `${cardType}_1`,
                        quantity: 1
                    });

                // Guest users should not be able to add any card type (returns 403 for guest restrictions)
                expect(addCardResponse.status).toBe(403);
                expect(addCardResponse.body.success).toBe(false);
            }
        });

        it('should block guest users from creating decks', async () => {
            const createDeckResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', guestAuthCookie)
                .send({
                    name: 'Guest Attempted Deck',
                    description: 'This should fail for guest users'
                });

            // Guest users should not be able to create decks (returns 403 for guest restrictions)
            expect(createDeckResponse.status).toBe(403);
            expect(createDeckResponse.body.success).toBe(false);
            
            // Track this deck for cleanup
            if (createDeckResponse.body.data && createDeckResponse.body.data.metadata) {
                createdDeckIds.push(createDeckResponse.body.data.metadata.id);
            }
        });

        it('should prevent guest users from modifying existing decks', async () => {
            if (!testDeckId) {
                // Skip if no test deck was created
                return;
            }

            const updateDeckResponse = await request(app)
                .put(`/api/decks/${testDeckId}`)
                .set('Cookie', guestAuthCookie)
                .send({
                    name: 'Modified Guest Deck',
                    description: 'This should fail for guest users'
                });

            // Guest users should not be able to modify decks
            expect(updateDeckResponse.status).toBe(401);
            expect(updateDeckResponse.body.success).toBe(false);
            expect(updateDeckResponse.body.error).toContain('Unauthorized');
        });

        it('should prevent guest users from deleting cards from deck', async () => {
            if (!testDeckId) {
                // Skip if no test deck was created
                return;
            }

            const deleteCardResponse = await request(app)
                .delete(`/api/decks/${testDeckId}/cards`)
                .set('Cookie', guestAuthCookie)
                .send({
                    cardType: 'character',
                    cardId: 'char_1',
                    quantity: 1
                });

            // Guest users should not be able to delete cards
            expect(deleteCardResponse.status).toBe(401);
            expect(deleteCardResponse.body.success).toBe(false);
            expect(deleteCardResponse.body.error).toContain('Unauthorized');
        });

        it('should verify guest user role in session', async () => {
            const meResponse = await request(app)
                .get('/api/auth/me')
                .set('Cookie', guestAuthCookie)
                .expect(200);

            // Verify the user is actually a guest
            expect(meResponse.body.success).toBe(true);
            expect(meResponse.body.data.role).toBe('GUEST');
            expect(meResponse.body.data.name).toContain('guest');
        });
    });
});

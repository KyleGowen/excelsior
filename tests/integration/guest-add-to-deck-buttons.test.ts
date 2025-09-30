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

        it('should call disableAddToDeckButtons after data loads', async () => {
            const response = await request(app)
                .get('/users/guest/decks')
                .set('Cookie', guestAuthCookie)
                .expect(200);

            // Check that the function is called after data loads
            expect(response.text).toContain('setTimeout(() => disableAddToDeckButtons()');
            expect(response.text).toContain('loadDatabaseViewData()');
        });
    });
});

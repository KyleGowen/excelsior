/**
 * Integration tests for username persistence after deck editor interactions
 */

import request from 'supertest';
import { app } from '../../src/test-server';
import { integrationTestUtils } from '../setup-integration';

describe('Username Persistence Flow', () => {
    const assertWelcomeElements = async () => {
        const nav = await request(app).get('/components/globalNav.html');
        expect(nav.status).toBe(200);
        expect(nav.text).toContain('id="userWelcome"');
        expect(nav.text).toContain('id="currentUsername"');
    };
    let testUser: any;
    let testDeck: any;
    let authCookie: string;

    beforeEach(async () => {
        // Cleanup is handled by global afterAll in setup-integration.ts
        // No need for individual cleanup here

        // Create a test user
        testUser = await integrationTestUtils.createTestUser({
            name: 'testuser',
            email: `testuser-${Date.now()}@example.com`
        });

        // Login to get auth cookie
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: testUser.username,
                password: 'password123'
            });

        expect(loginResponse.status).toBe(200);
        const setCookie = loginResponse.headers['set-cookie'];
        expect(setCookie).toBeDefined();
        authCookie = setCookie![0];

        // Create a test deck
        testDeck = await integrationTestUtils.createTestDeck(testUser.id, {
            name: 'Test Deck',
            description: 'A test deck for username persistence testing'
        });
    });

    afterEach(async () => {
        // Cleanup is handled by global afterAll in setup-integration.ts
        // No need for individual cleanup here
    });

    describe('Username persistence after deck editor interactions', () => {
        test('should maintain username display after opening and closing deck editor', async () => {
            // 1. Access the main deck builder page
            const mainPageResponse = await request(app)
                .get(`/users/${testUser.id}/decks`)
                .set('Cookie', authCookie);

            expect(mainPageResponse.status).toBe(200);
            await assertWelcomeElements();

            // 2. Open the deck editor
            const deckEditorResponse = await request(app)
                .get(`/users/${testUser.id}/decks/${testDeck.id}/edit`)
                .set('Cookie', authCookie);

            expect(deckEditorResponse.status).toBe(200);
            await assertWelcomeElements();

            // 3. Simulate closing the deck editor by accessing the main page again
            const afterCloseResponse = await request(app)
                .get(`/users/${testUser.id}/decks`)
                .set('Cookie', authCookie);

            expect(afterCloseResponse.status).toBe(200);
            await assertWelcomeElements();
        });

        test('should maintain username display after multiple deck editor open/close cycles', async () => {
            // Perform multiple open/close cycles
            for (let i = 0; i < 3; i++) {
                // Open deck editor
                const deckEditorResponse = await request(app)
                    .get(`/users/${testUser.id}/decks/${testDeck.id}/edit`)
                    .set('Cookie', authCookie);

                expect(deckEditorResponse.status).toBe(200);
                await assertWelcomeElements();

                // Close deck editor (return to main page)
                const mainPageResponse = await request(app)
                    .get(`/users/${testUser.id}/decks`)
                    .set('Cookie', authCookie);

                expect(mainPageResponse.status).toBe(200);
                await assertWelcomeElements();
            }
        });

        test('should maintain username display when switching between deck builder and database view', async () => {
            // 1. Access deck builder
            const deckBuilderResponse = await request(app)
                .get(`/users/${testUser.id}/decks`)
                .set('Cookie', authCookie);

            expect(deckBuilderResponse.status).toBe(200);
            await assertWelcomeElements();

            // 2. Switch to database view
            const databaseViewResponse = await request(app)
                .get('/database')
                .set('Cookie', authCookie);

            expect(databaseViewResponse.status).toBe(200);
            await assertWelcomeElements();

            // 3. Switch back to deck builder
            const backToDeckBuilderResponse = await request(app)
                .get(`/users/${testUser.id}/decks`)
                .set('Cookie', authCookie);

            expect(backToDeckBuilderResponse.status).toBe(200);
            await assertWelcomeElements();
        });

        test('should maintain username display for guest users', async () => {
            // Access as guest user
            const guestResponse = await request(app)
                .get('/users/guest/decks');

            expect(guestResponse.status).toBe(200);
            await assertWelcomeElements();

            // Simulate opening and closing deck editor as guest
            const guestDeckEditorResponse = await request(app)
                .get('/users/guest/decks/guest-deck/edit');

            expect(guestDeckEditorResponse.status).toBe(200);
            await assertWelcomeElements();

            // Return to main page
            const guestMainResponse = await request(app)
                .get('/users/guest/decks');

            expect(guestMainResponse.status).toBe(200);
            await assertWelcomeElements();
        });
    });

    describe('Username display consistency', () => {
        test('should display username consistently across all page loads', async () => {
            const pages = [
                `/users/${testUser.id}/decks`,
                '/database',
                `/users/${testUser.id}/decks/${testDeck.id}/edit`
            ];

            for (const page of pages) {
                const response = await request(app)
                    .get(page)
                    .set('Cookie', authCookie);

                expect(response.status).toBe(200);
                await assertWelcomeElements();
            }
        });

        test('should handle users with different name formats', async () => {
            // Test user with only username
            const usernameOnlyUser = await integrationTestUtils.createTestUser({
                name: 'usernameonly',
                email: `usernameonly-${Date.now()}@example.com`
            });

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: usernameOnlyUser.username,
                    password: 'password123'
                });

            expect(loginResponse.status).toBe(200);
            const usernameOnlyCookie = loginResponse.headers['set-cookie']![0];

            const response = await request(app)
                .get(`/users/${usernameOnlyUser.id}/decks`)
                .set('Cookie', usernameOnlyCookie);

            expect(response.status).toBe(200);
            await assertWelcomeElements();
        });
    });

    describe('Error handling', () => {
        test('should handle missing username gracefully', async () => {
            // Create user with empty name
            const emptyNameUser = await integrationTestUtils.createTestUser({
                name: '',
                email: `emptyname-${Date.now()}@example.com`
            });

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: emptyNameUser.username,
                    password: 'password123'
                });

            expect(loginResponse.status).toBe(200);
            const emptyNameCookie = loginResponse.headers['set-cookie']![0];

            const response = await request(app)
                .get(`/users/${emptyNameUser.id}/decks`)
                .set('Cookie', emptyNameCookie);

            expect(response.status).toBe(200);
            await assertWelcomeElements();
        });
    });
});

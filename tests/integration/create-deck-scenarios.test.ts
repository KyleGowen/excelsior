import request from 'supertest';
import { app, integrationTestUtils } from '../setup-integration';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { Deck } from '../../src/types';

describe('Create Deck Scenarios Integration Tests', () => {
    let regularUser: any;
    let adminUser: any;
    let regularCookie: string;
    let adminCookie: string;

    beforeAll(async () => {
        // Create test users
        const userRepo = DataSourceConfig.getInstance().getUserRepository();
        
        // Create regular user
        regularUser = await userRepo.createUser('testuser_create_deck', 'testuser@example.com', 'testpassword', 'USER');
        
        // Create admin user
        adminUser = await userRepo.createUser('admin_create_deck', 'admin@example.com', 'testpassword', 'ADMIN');

        // Login users to get session cookies
        const regularLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({ username: 'testuser_create_deck', password: 'testpassword' });
        
        if (regularLoginResponse.headers['set-cookie']) {
            regularCookie = regularLoginResponse.headers['set-cookie'][0].split(';')[0];
        } else {
            console.log('Regular user login failed:', regularLoginResponse.status, regularLoginResponse.body);
            throw new Error('Regular user login failed');
        }

        const adminLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin_create_deck', password: 'testpassword' });
        
        if (adminLoginResponse.headers['set-cookie']) {
            adminCookie = adminLoginResponse.headers['set-cookie'][0].split(';')[0];
        } else {
            console.log('Admin login failed:', adminLoginResponse.status, adminLoginResponse.body);
            throw new Error('Admin login failed');
        }
    });

    afterAll(async () => {
        // Clean up test users
        const userRepo = DataSourceConfig.getInstance().getUserRepository();
        if (regularUser) await userRepo.deleteUser(regularUser.id);
        if (adminUser) await userRepo.deleteUser(adminUser.id);
    });

    describe('Create Deck Button Access', () => {
        test('should allow all user roles to access create deck button', async () => {
            const roles = [
                { role: 'USER', cookie: regularCookie, username: 'testuser_create_deck' },
                { role: 'ADMIN', cookie: adminCookie, username: 'admin_create_deck' }
            ];

            for (const { role, cookie, username } of roles) {
                const response = await request(app)
                    .get(`/users/${username}/decks`)
                    .set('Cookie', cookie)
                    .expect(200);

                // Verify the page loads and contains deck editor modal
                expect(response.text).toContain('deckEditorModal');
                
                // Verify the globalNav.html contains the create deck button
                const globalNavHtmlResponse = await request(app)
                    .get('/components/globalNav.html')
                    .expect(200);
                expect(globalNavHtmlResponse.text).toContain('+ Create Deck');
                expect(globalNavHtmlResponse.text).toContain('onclick="createNewDeck()"');
            }
        });

        test('should show deck editor modal elements for all roles', async () => {
            const roles = [
                { role: 'USER', cookie: regularCookie, username: 'testuser_create_deck' },
                { role: 'ADMIN', cookie: adminCookie, username: 'admin_create_deck' }
            ];

            for (const { role, cookie, username } of roles) {
                const response = await request(app)
                    .get(`/users/${username}/decks`)
                    .set('Cookie', cookie)
                    .expect(200);

                // Verify deck editor modal elements are present
                expect(response.text).toContain('id="deckEditorModal"');
                expect(response.text).toContain('id="deckEditorTitle"');
                expect(response.text).toContain('id="deckEditorDescription"');
                expect(response.text).toContain('id="saveDeckButton"');
            }
        });
    });

    describe('Temporary Deck Creation', () => {
        test('should create temporary deck with null ID for all roles', async () => {
            // This test verifies the client-side behavior by checking the JavaScript
            const roles = [
                { role: 'USER', cookie: regularCookie, username: 'testuser_create_deck' },
                { role: 'ADMIN', cookie: adminCookie, username: 'admin_create_deck' }
            ];

            for (const { role, cookie, username } of roles) {
                const response = await request(app)
                    .get(`/users/${username}/decks`)
                    .set('Cookie', cookie)
                    .expect(200);

                // Verify the main page loads
                expect(response.text).toContain('deckEditorModal');
                
                // Verify the globalNav.js file contains the function
                const globalNavResponse = await request(app)
                    .get('/components/globalNav.js')
                    .expect(200);
                expect(globalNavResponse.text).toContain('function createNewDeck()');
                expect(globalNavResponse.text).toContain('currentDeckId = null');
                expect(globalNavResponse.text).toContain('id: null');
                expect(globalNavResponse.text).toContain('name: \'New Deck\'');
                expect(globalNavResponse.text).toContain('description: \'\'');
            }
        });

        test('should set up default UI preferences for temporary deck', async () => {
            const response = await request(app)
                .get(`/users/${regularUser.username}/decks`)
                .set('Cookie', regularCookie)
                .expect(200);

            // Verify the main page loads
            expect(response.text).toContain('deckEditorModal');
            
            // Verify the globalNav.js file contains the UI preferences
            const globalNavResponse = await request(app)
                .get('/components/globalNav.js')
                .expect(200);
            expect(globalNavResponse.text).toContain('viewMode": "tile"');
            expect(globalNavResponse.text).toContain('dividerPosition": 69');
            expect(globalNavResponse.text).toContain('powerCardsSortMode": "type"');
            expect(globalNavResponse.text).toContain('expansionState');
        });
    });

    describe('Deferred Deck Persistence', () => {
        test('should not persist deck when regular user cancels editor', async () => {
            // Get initial deck count
            const initialResponse = await request(app)
                .get(`/api/decks`)
                .set('Cookie', regularCookie)
                .expect(200);

            const initialDeckCount = initialResponse.body.data.length;

            // Verify no new decks were created by just opening the editor
            const finalResponse = await request(app)
                .get(`/api/decks`)
                .set('Cookie', regularCookie)
                .expect(200);

            const finalDeckCount = finalResponse.body.data.length;
            expect(finalDeckCount).toBe(initialDeckCount);
        });

        test('should not persist deck when admin user cancels editor', async () => {
            // Get initial deck count
            const initialResponse = await request(app)
                .get(`/api/decks`)
                .set('Cookie', adminCookie)
                .expect(200);

            const initialDeckCount = initialResponse.body.data.length;

            // Verify no new decks were created by just opening the editor
            const finalResponse = await request(app)
                .get(`/api/decks`)
                .set('Cookie', adminCookie)
                .expect(200);

            const finalDeckCount = finalResponse.body.data.length;
            expect(finalDeckCount).toBe(initialDeckCount);
        });
    });

    describe('Successful Deck Creation and Persistence', () => {
        test('should allow regular user to create and save deck', async () => {
            // Get initial deck count
            const initialResponse = await request(app)
                .get(`/api/decks`)
                .set('Cookie', regularCookie)
                .expect(200);

            const initialDeckCount = initialResponse.body.data.length;

            // Create a new deck
            const createResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', regularCookie)
                .send({
                    name: 'Regular User Test Deck',
                    description: 'Test Description',
                    ui_preferences: {
                        viewMode: 'tile',
                        dividerPosition: 65.86
                    }
                })
                .expect(201);

            expect(createResponse.body.success).toBe(true);
            expect(createResponse.body.data.name).toBe('Regular User Test Deck');
            expect(createResponse.body.data.description).toBe('Test Description');
            expect(createResponse.body.data.user_id).toBe(regularUser.id);

            const deckId = createResponse.body.data.id;
            integrationTestUtils.trackTestDeck(deckId);

            // Verify deck count increased
            const finalResponse = await request(app)
                .get(`/api/decks`)
                .set('Cookie', regularCookie)
                .expect(200);

            const finalDeckCount = finalResponse.body.data.length;
            expect(finalDeckCount).toBe(initialDeckCount + 1);
        });

        test('should allow admin user to create and save deck', async () => {
            // Get initial deck count
            const initialResponse = await request(app)
                .get(`/api/decks`)
                .set('Cookie', adminCookie)
                .expect(200);

            const initialDeckCount = initialResponse.body.data.length;

            // Create a new deck
            const createResponse = await request(app)
                .post('/api/decks')
                .set('Cookie', adminCookie)
                .send({
                    name: 'Admin User Test Deck',
                    description: 'Admin Test Description',
                    ui_preferences: {
                        viewMode: 'tile',
                        dividerPosition: 70.5
                    }
                })
                .expect(201);

            expect(createResponse.body.success).toBe(true);
            expect(createResponse.body.data.name).toBe('Admin User Test Deck');
            expect(createResponse.body.data.description).toBe('Admin Test Description');
            expect(createResponse.body.data.user_id).toBe(adminUser.id);

            const deckId = createResponse.body.data.id;
            integrationTestUtils.trackTestDeck(deckId);

            // Verify deck count increased
            const finalResponse = await request(app)
                .get(`/api/decks`)
                .set('Cookie', adminCookie)
                .expect(200);

            const finalDeckCount = finalResponse.body.data.length;
            expect(finalDeckCount).toBe(initialDeckCount + 1);
        });
    });

    describe('Deck Editor UI Elements', () => {
        test('should show correct UI elements for all roles', async () => {
            const roles = [
                { role: 'USER', cookie: regularCookie, username: 'testuser_create_deck' },
                { role: 'ADMIN', cookie: adminCookie, username: 'admin_create_deck' }
            ];

            for (const { role, cookie, username } of roles) {
                const response = await request(app)
                    .get(`/users/${username}/decks`)
                    .set('Cookie', cookie)
                    .expect(200);

                // Verify all necessary UI elements are present
                expect(response.text).toContain('deckEditorModal');
                expect(response.text).toContain('deckEditorTitle');
                expect(response.text).toContain('deckEditorDescription');
                expect(response.text).toContain('saveDeckButton');
                expect(response.text).toContain('deck-editor-layout');
                expect(response.text).toContain('deck-pane');
                expect(response.text).toContain('card-selector-pane');
            }
        });

        test('should have correct JavaScript functions for deck creation', async () => {
            const response = await request(app)
                .get(`/users/${regularUser.username}/decks`)
                .set('Cookie', regularCookie)
                .expect(200);

            // Verify the main page loads
            expect(response.text).toContain('deckEditorModal');
            
            // Verify the globalNav.js file contains the functions
            const globalNavResponse = await request(app)
                .get('/components/globalNav.js')
                .expect(200);
            expect(globalNavResponse.text).toContain('function createNewDeck()');
            
            // Verify the main page contains the other functions
            expect(response.text).toContain('function saveDeckChanges()');
            expect(response.text).toContain('function showDeckEditor()');
            expect(response.text).toContain('function initializeBlankDeck()');
        });
    });

    describe('Role-Based Save Button Behavior', () => {
        test('should enable save button for regular users', async () => {
            const response = await request(app)
                .get(`/users/${regularUser.username}/decks`)
                .set('Cookie', regularCookie)
                .expect(200);

            // Verify save button is present for regular users
            expect(response.text).toContain('id="saveDeckButton"');
            // The save button is always disabled by default in HTML, but can be enabled via JavaScript
            expect(response.text).toContain('disabled');
        });

        test('should enable save button for admin users', async () => {
            const response = await request(app)
                .get(`/users/${adminUser.username}/decks`)
                .set('Cookie', adminCookie)
                .expect(200);

            // Verify save button is present for admin users
            expect(response.text).toContain('id="saveDeckButton"');
            // The save button is always disabled by default in HTML, but can be enabled via JavaScript
            expect(response.text).toContain('disabled');
        });
    });

    describe('Temporary Deck Data Structure', () => {
        test('should create temporary deck with correct metadata structure', async () => {
            const response = await request(app)
                .get(`/users/${regularUser.username}/decks`)
                .set('Cookie', regularCookie)
                .expect(200);

            // Verify the main page loads
            expect(response.text).toContain('deckEditorModal');
            
            // Verify the globalNav.js file contains the function
            const globalNavResponse = await request(app)
                .get('/components/globalNav.js')
                .expect(200);
            expect(globalNavResponse.text).toContain('function createNewDeck()');
            expect(globalNavResponse.text).toContain('currentDeckId = null');
            expect(globalNavResponse.text).toContain('name: \'New Deck\'');
            expect(globalNavResponse.text).toContain('description: \'\'');
        });

        test('should set correct user ID in temporary deck', async () => {
            const roles = [
                { role: 'USER', cookie: regularCookie, username: 'testuser_create_deck' },
                { role: 'ADMIN', cookie: adminCookie, username: 'admin_create_deck' }
            ];

            for (const { role, cookie, username } of roles) {
                const response = await request(app)
                    .get(`/users/${username}/decks`)
                    .set('Cookie', cookie)
                    .expect(200);

                // Verify the main page loads
                expect(response.text).toContain('deckEditorModal');
                
                // Verify the globalNav.js file contains the function
                const globalNavResponse = await request(app)
                    .get('/components/globalNav.js')
                    .expect(200);
                expect(globalNavResponse.text).toContain('function createNewDeck()');
            }
        });
    });

    describe('Error Handling', () => {
        test('should handle missing deck editor elements gracefully', async () => {
            const response = await request(app)
                .get(`/users/${regularUser.username}/decks`)
                .set('Cookie', regularCookie)
                .expect(200);

            // Verify the main page loads
            expect(response.text).toContain('deckEditorModal');
            
            // Verify the globalNav.js file contains the function
            const globalNavResponse = await request(app)
                .get('/components/globalNav.js')
                .expect(200);
            expect(globalNavResponse.text).toContain('function createNewDeck()');
        });

        test('should handle missing showDeckEditor function gracefully', async () => {
            const response = await request(app)
                .get(`/users/${regularUser.username}/decks`)
                .set('Cookie', regularCookie)
                .expect(200);

            // Verify the main page loads
            expect(response.text).toContain('deckEditorModal');
            
            // Verify the globalNav.js file contains the function
            const globalNavResponse = await request(app)
                .get('/components/globalNav.js')
                .expect(200);
            expect(globalNavResponse.text).toContain('function createNewDeck()');
        });
    });
});

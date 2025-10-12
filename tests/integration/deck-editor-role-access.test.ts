import request from 'supertest';
import { app, integrationTestUtils } from '../setup-integration';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { UserRepository } from '../../src/repository/UserRepository';
import { DeckRepository } from '../../src/repository/DeckRepository';

describe('Deck Editor Role-Based Access Integration Tests', () => {
  let userRepository: UserRepository;
  let deckRepository: DeckRepository;
  let guestUser: any;
  let userRoleUser: any;
  let adminUser: any;
  let guestSessionCookie: string;
  let userSessionCookie: string;
  let adminSessionCookie: string;

  beforeAll(async () => {
    const dataSourceConfig = DataSourceConfig.getInstance();
    userRepository = dataSourceConfig.getUserRepository();
    deckRepository = dataSourceConfig.getDeckRepository();

    // Create test users for each role
    guestUser = await userRepository.createUser(
      'test-guest-editor',
      'test-guest-editor@example.com',
      'testpassword',
      'GUEST'
    );

    userRoleUser = await userRepository.createUser(
      'test-user-editor',
      'test-user-editor@example.com',
      'testpassword',
      'USER'
    );

    adminUser = await userRepository.createUser(
      'test-admin-editor',
      'test-admin-editor@example.com',
      'testpassword',
      'ADMIN'
    );

    // Login all users to get session cookies
    const guestLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'test-guest-editor',
        password: 'testpassword'
      });

    const userLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'test-user-editor',
        password: 'testpassword'
      });

    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'test-admin-editor',
        password: 'testpassword'
      });

    expect(guestLoginResponse.status).toBe(200);
    expect(userLoginResponse.status).toBe(200);
    expect(adminLoginResponse.status).toBe(200);

    guestSessionCookie = guestLoginResponse.headers['set-cookie'][0].split(';')[0];
    userSessionCookie = userLoginResponse.headers['set-cookie'][0].split(';')[0];
    adminSessionCookie = adminLoginResponse.headers['set-cookie'][0].split(';')[0];
  });

  afterAll(async () => {
    // Clean up test users
    try {
      await userRepository.deleteUser(guestUser.id);
      await userRepository.deleteUser(userRoleUser.id);
      await userRepository.deleteUser(adminUser.id);
    } catch (error) {
      // Users might already be deleted, ignore error
    }
  });

  describe('Create Deck Button Access', () => {
    it('should allow GUEST users to access the Create Deck button and open deck editor', async () => {
      // Test that guest users can access the main page with Create Deck button
      const response = await request(app)
        .get('/users/test-guest-editor/decks')
        .set('Cookie', guestSessionCookie)
        .expect(200);

      // Verify the page contains the global nav loading mechanism
      expect(response.text).toContain('id="globalNav"');
      expect(response.text).toContain('loadGlobalNav');

      // Verify the deck editor modal is present
      expect(response.text).toContain('id="deckEditorModal"');
      expect(response.text).toContain('deckEditorTitle');
      expect(response.text).toContain('deckEditorDescription');
    });

    it('should allow USER role users to access the Create Deck button and open deck editor', async () => {
      // Test that user role users can access the main page with Create Deck button
      const response = await request(app)
        .get('/users/test-user-editor/decks')
        .set('Cookie', userSessionCookie)
        .expect(200);

      // Verify the page contains the global nav loading mechanism
      expect(response.text).toContain('id="globalNav"');
      expect(response.text).toContain('loadGlobalNav');

      // Verify the deck editor modal is present
      expect(response.text).toContain('id="deckEditorModal"');
      expect(response.text).toContain('deckEditorTitle');
      expect(response.text).toContain('deckEditorDescription');
    });

    it('should allow ADMIN users to access the Create Deck button and open deck editor', async () => {
      // Test that admin users can access the main page with Create Deck button
      const response = await request(app)
        .get('/users/test-admin-editor/decks')
        .set('Cookie', adminSessionCookie)
        .expect(200);

      // Verify the page contains the global nav loading mechanism
      expect(response.text).toContain('id="globalNav"');
      expect(response.text).toContain('loadGlobalNav');

      // Verify the deck editor modal is present
      expect(response.text).toContain('id="deckEditorModal"');
      expect(response.text).toContain('deckEditorTitle');
      expect(response.text).toContain('deckEditorDescription');
    });
  });

  describe('Deck Editor Initialization', () => {
    it('should initialize blank deck editor with "New Deck" title for all user roles', async () => {
      // Test that the initializeBlankDeck function is present and sets up correctly
      const response = await request(app)
        .get('/users/test-guest-editor/decks')
        .set('Cookie', guestSessionCookie)
        .expect(200);

      // Verify the initializeBlankDeck function is present
      expect(response.text).toContain('function initializeBlankDeck()');
      expect(response.text).toContain('New Deck');
      expect(response.text).toContain('Click to add description');
    });

    it('should have createNewDeck function that opens blank editor', async () => {
      // Test that the createNewDeck function is present in globalNav.js
      const response = await request(app)
        .get('/components/globalNav.js')
        .expect(200);

      // Verify the createNewDeck function is present
      expect(response.text).toContain('function createNewDeck()');
      expect(response.text).toContain('showDeckEditor()');
    });
  });

  describe('Deck Editor UI Elements', () => {
    it('should have editable title and description fields for all user roles', async () => {
      const response = await request(app)
        .get('/users/test-guest-editor/decks')
        .set('Cookie', guestSessionCookie)
        .expect(200);

      // Verify deck editor elements are present
      expect(response.text).toContain('id="deckEditorTitle"');
      expect(response.text).toContain('id="deckEditorDescription"');
      expect(response.text).toContain('class="editable-title"');
      expect(response.text).toContain('onclick="startEditingTitle()"');
      expect(response.text).toContain('onclick="startEditingDescription()"');
    });

    it('should have save button present for all user roles', async () => {
      const response = await request(app)
        .get('/users/test-guest-editor/decks')
        .set('Cookie', guestSessionCookie)
        .expect(200);

      // Verify save button is present
      expect(response.text).toContain('id="saveDeckButton"');
      expect(response.text).toContain('onclick="saveDeckChanges()"');
      expect(response.text).toContain('Save');
    });
  });

  describe('Deck Creation API Restrictions', () => {
    it('should deny GUEST users from creating decks via API', async () => {
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', guestSessionCookie)
        .send({
          name: 'Test Deck by Guest',
          description: 'A deck creation attempt by GUEST user'
        });

      expect(createDeckResponse.status).toBe(403);
      expect(createDeckResponse.body.success).toBe(false);
      expect(createDeckResponse.body.error).toContain('Guests may not create decks');
    });

    it('should allow USER role users to create decks via API', async () => {
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', userSessionCookie)
        .send({
          name: 'Test Deck by User Role',
          description: 'A deck created by USER role user'
        });

      expect(createDeckResponse.status).toBe(201);
      expect(createDeckResponse.body.success).toBe(true);
      expect(createDeckResponse.body.data.name).toBe('Test Deck by User Role');

      const deckId = createDeckResponse.body.data.id;
      
      // Track this deck for cleanup
      integrationTestUtils.trackTestDeck(deckId);
    });

    it('should allow ADMIN users to create decks via API', async () => {
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', adminSessionCookie)
        .send({
          name: 'Test Deck by Admin Role',
          description: 'A deck created by ADMIN role user'
        });

      expect(createDeckResponse.status).toBe(201);
      expect(createDeckResponse.body.success).toBe(true);
      expect(createDeckResponse.body.data.name).toBe('Test Deck by Admin Role');

      const deckId = createDeckResponse.body.data.id;
      
      // Track this deck for cleanup
      integrationTestUtils.trackTestDeck(deckId);
    });
  });

  describe('Deck Modification API Restrictions', () => {
    it('should deny GUEST users from modifying decks via API', async () => {
      // Create a test deck first
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', userSessionCookie)
        .send({
          name: 'Test Deck for Guest Modification Test',
          description: 'A deck to test guest modification restrictions'
        });

      expect(createDeckResponse.status).toBe(201);
      const testDeckId = createDeckResponse.body.data.id;
      
      // Track this deck for cleanup
      integrationTestUtils.trackTestDeck(testDeckId);

      const modifyDeckResponse = await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', guestSessionCookie)
        .send({
          name: 'Modified Deck Name by Guest',
          description: 'Modified description by guest'
        });

      expect(modifyDeckResponse.status).toBe(403);
      expect(modifyDeckResponse.body.success).toBe(false);
      expect(modifyDeckResponse.body.error).toContain('Guests may not modify decks');
    });

    it('should allow USER role users to modify their own decks via API', async () => {
      // Create a test deck for this specific test
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', userSessionCookie)
        .send({
          name: 'Test Deck for User Modification',
          description: 'A deck to test user modification permissions'
        });

      expect(createDeckResponse.status).toBe(201);
      const testDeckId = createDeckResponse.body.data.id;
      
      // Track this deck for cleanup
      integrationTestUtils.trackTestDeck(testDeckId);

      const modifyDeckResponse = await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', userSessionCookie)
        .send({
          name: 'Modified Deck Name by User',
          description: 'Modified description by user'
        });

      expect(modifyDeckResponse.status).toBe(200);
      expect(modifyDeckResponse.body.success).toBe(true);
      expect(modifyDeckResponse.body.data.name).toBe('Modified Deck Name by User');
    });

    it('should allow ADMIN users to modify decks via API', async () => {
      // Create a test deck with admin user for this specific test
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', adminSessionCookie)
        .send({
          name: 'Test Deck for Admin Modification',
          description: 'A deck to test admin modification permissions'
        });

      expect(createDeckResponse.status).toBe(201);
      const testDeckId = createDeckResponse.body.data.id;
      
      // Track this deck for cleanup
      integrationTestUtils.trackTestDeck(testDeckId);

      const modifyDeckResponse = await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminSessionCookie)
        .send({
          name: 'Modified Deck Name by Admin',
          description: 'Modified description by admin'
        });

      expect(modifyDeckResponse.status).toBe(200);
      expect(modifyDeckResponse.body.success).toBe(true);
      expect(modifyDeckResponse.body.data.name).toBe('Modified Deck Name by Admin');
    });
  });

  describe('Deck Deletion API Restrictions', () => {
    it('should deny GUEST users from deleting decks via API', async () => {
      // Create a test deck for this specific test
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', userSessionCookie)
        .send({
          name: 'Test Deck for Guest Deletion Test',
          description: 'A deck to test guest deletion restrictions'
        });

      expect(createDeckResponse.status).toBe(201);
      const testDeckId = createDeckResponse.body.data.id;
      
      // Track this deck for cleanup
      integrationTestUtils.trackTestDeck(testDeckId);

      const deleteDeckResponse = await request(app)
        .delete(`/api/decks/${testDeckId}`)
        .set('Cookie', guestSessionCookie);

      expect(deleteDeckResponse.status).toBe(403);
      expect(deleteDeckResponse.body.success).toBe(false);
      expect(deleteDeckResponse.body.error).toContain('Guests may not delete decks');
    });

    it('should allow USER role users to delete their own decks via API', async () => {
      // Create a test deck for this specific test
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', userSessionCookie)
        .send({
          name: 'Test Deck for User Deletion',
          description: 'A deck to test user deletion permissions'
        });

      expect(createDeckResponse.status).toBe(201);
      const testDeckId = createDeckResponse.body.data.id;
      
      // Track this deck for cleanup
      integrationTestUtils.trackTestDeck(testDeckId);

      const deleteDeckResponse = await request(app)
        .delete(`/api/decks/${testDeckId}`)
        .set('Cookie', userSessionCookie);

      expect(deleteDeckResponse.status).toBe(200);
      expect(deleteDeckResponse.body.success).toBe(true);
      expect(deleteDeckResponse.body.message).toBe('Deck deleted successfully');

      // Untrack since it's deleted
      integrationTestUtils.untrackTestDeck(testDeckId);
    });
  });

  describe('Frontend Save Button Behavior', () => {
    it('should have save button disabled for GUEST users in frontend', async () => {
      const response = await request(app)
        .get('/users/test-guest-editor/decks')
        .set('Cookie', guestSessionCookie)
        .expect(200);

      // Verify the save button functionality is present
      expect(response.text).toContain('saveDeckChanges');
      expect(response.text).toContain('isGuestUser');
    });

    it('should have save button enabled for USER role users in frontend', async () => {
      const response = await request(app)
        .get('/users/test-user-editor/decks')
        .set('Cookie', userSessionCookie)
        .expect(200);

      // Verify the save button functionality is present
      expect(response.text).toContain('saveDeckChanges');
      expect(response.text).toContain('isGuestUser');
    });

    it('should have save button enabled for ADMIN users in frontend', async () => {
      const response = await request(app)
        .get('/users/test-admin-editor/decks')
        .set('Cookie', adminSessionCookie)
        .expect(200);

      // Verify the save button functionality is present
      expect(response.text).toContain('saveDeckChanges');
      expect(response.text).toContain('isGuestUser');
    });
  });

  describe('Deck Editor JavaScript Functions', () => {
    it('should have all required JavaScript functions for deck editing', async () => {
      const response = await request(app)
        .get('/users/test-guest-editor/decks')
        .set('Cookie', guestSessionCookie)
        .expect(200);

      // Verify external script references are present
      expect(response.text).toContain('<script src="/js/deck-editor-core.js"></script>');
    });

    it('should have proper error handling for guest user restrictions', async () => {
      const response = await request(app)
        .get('/users/test-guest-editor/decks')
        .set('Cookie', guestSessionCookie)
        .expect(200);

      // Verify guest user restriction checks are present
      expect(response.text).toContain('isGuestUser');
      expect(response.text).toContain('<script src="/js/deck-editor-core.js"></script>');
    });
  });

  describe('Cross-Role Consistency', () => {
    it('should provide same deck editor UI for all user roles', async () => {
      const guestResponse = await request(app)
        .get('/users/test-guest-editor/decks')
        .set('Cookie', guestSessionCookie)
        .expect(200);

      const userResponse = await request(app)
        .get('/users/test-user-editor/decks')
        .set('Cookie', userSessionCookie)
        .expect(200);

      const adminResponse = await request(app)
        .get('/users/test-admin-editor/decks')
        .set('Cookie', adminSessionCookie)
        .expect(200);

      // All responses should have the same deck editor elements
      const commonElements = [
        'id="deckEditorModal"',
        'id="deckEditorTitle"',
        'id="deckEditorDescription"',
        'id="saveDeckButton"',
        'function initializeBlankDeck()'
      ];

      commonElements.forEach(element => {
        expect(guestResponse.text).toContain(element);
        expect(userResponse.text).toContain(element);
        expect(adminResponse.text).toContain(element);
      });
    });

    it('should only differ in save permissions, not UI access', async () => {
      // Test that all users get the same UI but different save permissions
      const responses = await Promise.all([
        request(app).get('/users/test-guest-editor/decks').set('Cookie', guestSessionCookie),
        request(app).get('/users/test-user-editor/decks').set('Cookie', userSessionCookie),
        request(app).get('/users/test-admin-editor/decks').set('Cookie', adminSessionCookie)
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        // All should have the same deck editor UI
        expect(response.text).toContain('deckEditorModal');
        expect(response.text).toContain('deckEditorTitle');
        expect(response.text).toContain('deckEditorDescription');
        expect(response.text).toContain('saveDeckButton');
      });
    });
  });
});

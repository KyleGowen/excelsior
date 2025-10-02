import request from 'supertest';
import { app, initializeTestServer } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';

describe('Cross-User Deck Viewing Integration Tests', () => {
  let userRepository: any;
  let deckRepository: any;
  let testUserA: any;
  let testUserB: any;
  let createdDeck: any;
  let testUserASessionId: string;
  let testUserBSessionId: string;

  beforeAll(async () => {
    // Initialize test server
    await initializeTestServer();
    
    // Initialize repositories using DataSourceConfig
    const dataSource = DataSourceConfig.getInstance();
    userRepository = dataSource.getUserRepository();
    deckRepository = dataSource.getDeckRepository();
  });

  afterAll(async () => {
    // Clean up test users and deck
    if (testUserA) {
      try {
        await userRepository.deleteUser(testUserA.id);
      } catch (error) {
        console.log('Error cleaning up testUserA:', error);
      }
    }
    if (testUserB) {
      try {
        await userRepository.deleteUser(testUserB.id);
      } catch (error) {
        console.log('Error cleaning up testUserB:', error);
      }
    }
    if (createdDeck) {
      try {
        await deckRepository.deleteDeck(createdDeck.id);
      } catch (error) {
        console.log('Error cleaning up createdDeck:', error);
      }
    }
  });

  describe('Cross-User Deck Viewing Flow', () => {
    it('should allow user B to view user A\'s deck in read-only mode', async () => {
      // Step 1: Create test-user-A
      testUserA = await userRepository.createUser(
        'test-user-A',
        'test-user-a@example.com',
        'password123',
        'USER'
      );
      expect(testUserA).toBeDefined();
      expect(testUserA.name || testUserA.username).toBe('test-user-A');

      // Step 2: Create test-user-B
      testUserB = await userRepository.createUser(
        'test-user-B',
        'test-user-b@example.com',
        'password123',
        'USER'
      );
      expect(testUserB).toBeDefined();
      expect(testUserB.name || testUserB.username).toBe('test-user-B');

      // Step 3: User A logs in
      const loginAResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'test-user-A',
          password: 'password123'
        });

      expect(loginAResponse.status).toBe(200);
      expect(loginAResponse.body.success).toBe(true);
      expect(loginAResponse.body.data.userId).toBe(testUserA.id);

      // Extract session ID for user A
      const cookieHeaderA = loginAResponse.headers['set-cookie'][0];
      const sessionMatchA = cookieHeaderA.match(/sessionId=([^;]+)/);
      expect(sessionMatchA).toBeDefined();
      testUserASessionId = sessionMatchA![1];

      // Step 4: User A creates a deck
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', `sessionId=${testUserASessionId}`)
        .send({
          name: 'User A\'s Test Deck',
          description: 'A deck created by user A for testing cross-user viewing',
          cards: []
        });

      expect(createDeckResponse.status).toBe(201);
      expect(createDeckResponse.body.success).toBe(true);
      expect(createDeckResponse.body.data.id).toBeDefined();
      createdDeck = createDeckResponse.body.data;

      // Step 5: User A logs out
      const logoutAResponse = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', `sessionId=${testUserASessionId}`);

      expect(logoutAResponse.status).toBe(200);
      expect(logoutAResponse.body.success).toBe(true);

      // Step 6: User B logs in
      const loginBResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'test-user-B',
          password: 'password123'
        });

      expect(loginBResponse.status).toBe(200);
      expect(loginBResponse.body.success).toBe(true);
      expect(loginBResponse.body.data.userId).toBe(testUserB.id);

      // Extract session ID for user B
      const cookieHeaderB = loginBResponse.headers['set-cookie'][0];
      const sessionMatchB = cookieHeaderB.match(/sessionId=([^;]+)/);
      expect(sessionMatchB).toBeDefined();
      testUserBSessionId = sessionMatchB![1];

      // Step 7: User B views User A's deck (should be read-only)
      const viewDeckResponse = await request(app)
        .get(`/api/decks/${createdDeck.id}`)
        .set('Cookie', `sessionId=${testUserBSessionId}`);

      expect(viewDeckResponse.status).toBe(200);
      expect(viewDeckResponse.body.success).toBe(true);
      
      // Verify the deck view response structure
      
      // The deck view response has metadata nested structure
      expect(viewDeckResponse.body.data.metadata.id).toBe(createdDeck.id);
      expect(viewDeckResponse.body.data.metadata.name).toBe('User A\'s Test Deck');
      expect(viewDeckResponse.body.data.metadata.description).toBe('A deck created by user A for testing cross-user viewing');
      expect(viewDeckResponse.body.data.metadata.userId).toBe(testUserA.id); // Should be user A's deck

      // Step 8: Verify User B cannot modify User A's deck
      const modifyDeckResponse = await request(app)
        .put(`/api/decks/${createdDeck.id}`)
        .set('Cookie', `sessionId=${testUserBSessionId}`)
        .send({
          name: 'Hacked Deck Name',
          description: 'This should not work',
          cards: []
        });

      expect(modifyDeckResponse.status).toBe(403);
      expect(modifyDeckResponse.body.success).toBe(false);
      expect(modifyDeckResponse.body.error).toContain('Access denied');

      // Step 9: Verify User B cannot delete User A's deck
      const deleteDeckResponse = await request(app)
        .delete(`/api/decks/${createdDeck.id}`)
        .set('Cookie', `sessionId=${testUserBSessionId}`);

      expect(deleteDeckResponse.status).toBe(403);
      expect(deleteDeckResponse.body.success).toBe(false);
      expect(deleteDeckResponse.body.error).toContain('Access denied');

      // Step 10: Verify User B can still view the deck after failed modification attempts
      const viewDeckAgainResponse = await request(app)
        .get(`/api/decks/${createdDeck.id}`)
        .set('Cookie', `sessionId=${testUserBSessionId}`);

      expect(viewDeckAgainResponse.status).toBe(200);
      expect(viewDeckAgainResponse.body.data.metadata.name).toBe('User A\'s Test Deck'); // Original name preserved
      expect(viewDeckAgainResponse.body.data.metadata.description).toBe('A deck created by user A for testing cross-user viewing'); // Original description preserved
    });

    it('should allow user A to edit their own deck after user B viewed it', async () => {
      // User A logs back in
      const loginAResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'test-user-A',
          password: 'password123'
        });

      expect(loginAResponse.status).toBe(200);
      testUserASessionId = loginAResponse.headers['set-cookie'][0].match(/sessionId=([^;]+)/)![1];

      // User A should be able to modify their own deck
      const modifyDeckResponse = await request(app)
        .put(`/api/decks/${createdDeck.id}`)
        .set('Cookie', `sessionId=${testUserASessionId}`)
        .send({
          name: 'User A\'s Updated Deck',
          description: 'Updated by user A after user B viewed it',
          cards: []
        });

      expect(modifyDeckResponse.status).toBe(200);
      expect(modifyDeckResponse.body.success).toBe(true);
      expect(modifyDeckResponse.body.data.name).toBe('User A\'s Updated Deck');
    });
  });
});
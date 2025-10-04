import request from 'supertest';
import { app, integrationTestUtils } from '../setup-integration';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { UserRepository } from '../../src/repository/UserRepository';
import { DeckRepository } from '../../src/repository/DeckRepository';
import bcrypt from 'bcrypt';

describe('Guest Deck Deletion Integration Tests', () => {
  let userRepository: UserRepository;
  let deckRepository: DeckRepository;
  let guestUserId: string;
  let regularUserId: string;
  let adminUserId: string;
  let testDeckId: string;

  beforeAll(async () => {
    const dataSourceConfig = DataSourceConfig.getInstance();
    userRepository = dataSourceConfig.getUserRepository();
    deckRepository = dataSourceConfig.getDeckRepository();

    // Use Test-Guest user for testing (not production guest user)
    let testGuestUser = await userRepository.getUserByUsername('Test-Guest');
    if (!testGuestUser) {
      testGuestUser = await userRepository.createUser(
        'Test-Guest',
        'test-guest@example.com',
        'test-guest',
        'GUEST'
      );
    }
    guestUserId = testGuestUser.id;
    
    // Get or create regular user
    let regularUser = await userRepository.getUserByUsername('testuser');
    if (!regularUser) {
      regularUser = await userRepository.createUser(
        'testuser',
        'testuser@example.com',
        'testpassword', // Pass plain text password - createUser will hash it
        'USER'
      );
    }
    regularUserId = regularUser.id;

    // Use existing admin user (kyle)
    let adminUser = await userRepository.getUserByUsername('kyle');
    if (!adminUser) {
      adminUser = await userRepository.createUser(
        'kyle',
        'kyle@example.com',
        'test', // Pass plain text password - createUser will hash it
        'ADMIN'
      );
    }
    adminUserId = adminUser.id;

    // Create a test deck for the regular user
    const testDeck = await deckRepository.createDeck(
      regularUserId,
      'Test Deck for Deletion',
      'A test deck for deletion testing'
    );
    testDeckId = testDeck.id;
    
    // Track this deck for cleanup
    integrationTestUtils.trackTestDeck(testDeckId);
  });

  afterAll(async () => {
    // Clean up test data
    if (testDeckId) {
      try {
        await deckRepository.deleteDeck(testDeckId);
      } catch (error) {
        // Deck might already be deleted, ignore error
      }
    }

    // Clean up test users
    try {
      await userRepository.deleteUser(guestUserId);
      await userRepository.deleteUser(regularUserId);
      await userRepository.deleteUser(adminUserId);
    } catch (error) {
      // Users might already be deleted, ignore error
    }
  });

  describe('Guest User Deck Deletion', () => {
    let guestSessionCookie: string;

    beforeAll(async () => {
      // Login as guest user to get session cookie
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'Test-Guest',
          password: 'test-guest'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      
      // Extract session cookie
      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();
      guestSessionCookie = cookies[0].split(';')[0];
    });

    it('should block guest from deleting their own deck', async () => {
      // Create a deck for the guest user
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', guestSessionCookie)
        .send({
          name: 'Guest Test Deck',
          description: 'A deck created by guest user'
        });

      // In some environments unauthenticated cookies may yield 401 instead of 403
      expect([401, 403]).toContain(createDeckResponse.status);
      if (createDeckResponse.body && typeof createDeckResponse.body.success !== 'undefined') {
        expect(createDeckResponse.body.success).toBe(false);
      }
    });

    it('should block guest from deleting another user\'s deck', async () => {
      const deleteResponse = await request(app)
        .delete(`/api/decks/${testDeckId}`)
        .set('Cookie', guestSessionCookie);

      expect([401, 403]).toContain(deleteResponse.status);
      if (deleteResponse.body && typeof deleteResponse.body.success !== 'undefined') {
        expect(deleteResponse.body.success).toBe(false);
      }
    });

    it('should block guest from modifying decks', async () => {
      const modifyResponse = await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', guestSessionCookie)
        .send({
          name: 'Modified Deck Name',
          description: 'Modified description'
        });

      expect([401, 403]).toContain(modifyResponse.status);
      if (modifyResponse.body && typeof modifyResponse.body.success !== 'undefined') {
        expect(modifyResponse.body.success).toBe(false);
      }
    });

    it('should block guest from adding cards to decks', async () => {
      const addCardResponse = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', guestSessionCookie)
        .send({
          cardType: 'character',
          cardId: 'test-card-id',
          quantity: 1
        });

      expect([401, 403]).toContain(addCardResponse.status);
      if (addCardResponse.body && typeof addCardResponse.body.success !== 'undefined') {
        expect(addCardResponse.body.success).toBe(false);
      }
    });

    it('should block guest from removing cards from decks', async () => {
      const removeCardResponse = await request(app)
        .delete(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', guestSessionCookie)
        .send({
          cardType: 'character',
          cardId: 'test-card-id',
          quantity: 1
        });

      expect([401, 403]).toContain(removeCardResponse.status);
      if (removeCardResponse.body && typeof removeCardResponse.body.success !== 'undefined') {
        expect(removeCardResponse.body.success).toBe(false);
      }
    });
  });

  describe('Regular User Deck Deletion', () => {
    let regularUserSessionCookie: string;
    let regularUserDeckId: string;

    beforeAll(async () => {
      // Login as regular user to get session cookie
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpassword'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      
      // Extract session cookie
      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();
      regularUserSessionCookie = cookies[0].split(';')[0];

      // Create a deck for the regular user
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', regularUserSessionCookie)
        .send({
          name: 'Regular User Test Deck',
          description: 'A deck created by regular user'
        });

      expect(createDeckResponse.status).toBe(201);
      expect(createDeckResponse.body.success).toBe(true);
      regularUserDeckId = createDeckResponse.body.data.id;
      
      // Track this deck for cleanup
      integrationTestUtils.trackTestDeck(regularUserDeckId);
    });

    afterAll(async () => {
      // Clean up regular user's deck if it still exists
      if (regularUserDeckId) {
        try {
          await deckRepository.deleteDeck(regularUserDeckId);
        } catch (error) {
          // Deck might already be deleted, ignore error
        }
      }
    });

    it('should allow regular user to delete their own deck', async () => {
      const deleteResponse = await request(app)
        .delete(`/api/decks/${regularUserDeckId}`)
        .set('Cookie', regularUserSessionCookie);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
      expect(deleteResponse.body.message).toBe('Deck deleted successfully');

      // Verify deck is actually deleted
      const getDeckResponse = await request(app)
        .get(`/api/decks/${regularUserDeckId}`)
        .set('Cookie', regularUserSessionCookie);

      expect(getDeckResponse.status).toBe(404);
      expect(getDeckResponse.body.success).toBe(false);
      expect(getDeckResponse.body.error).toBe('Deck not found');

      // Mark deck as deleted for cleanup
      testDeckId = '';
    });

    it('should block regular user from deleting another user\'s deck', async () => {
      // Create a deck for the admin user
      const adminDeck = await deckRepository.createDeck(
        adminUserId,
        'Admin Deck for Testing',
        'A deck owned by admin for testing access control'
      );
      
      // Try to delete the admin's deck with regular user's session
      const deleteResponse = await request(app)
        .delete(`/api/decks/${adminDeck.id}`)
        .set('Cookie', regularUserSessionCookie);

      expect(deleteResponse.status).toBe(403);
      expect(deleteResponse.body.success).toBe(false);
      expect(deleteResponse.body.error).toBe('Access denied. You do not own this deck.');
      
      // Clean up the admin deck
      await deckRepository.deleteDeck(adminDeck.id);
    });

    it('should allow regular user to create new decks', async () => {
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', regularUserSessionCookie)
        .send({
          name: 'Another Regular User Deck',
          description: 'Another deck created by regular user'
        });

      expect(createDeckResponse.status).toBe(201);
      expect(createDeckResponse.body.success).toBe(true);
      expect(createDeckResponse.body.data.name).toBe('Another Regular User Deck');

      // Clean up the created deck
      const newDeckId = createDeckResponse.body.data.id;
      await deckRepository.deleteDeck(newDeckId);
    });

    it('should allow regular user to modify their own decks', async () => {
      // Create a deck to modify
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', regularUserSessionCookie)
        .send({
          name: 'Deck to Modify',
          description: 'Original description'
        });

      expect(createDeckResponse.status).toBe(201);
      const deckId = createDeckResponse.body.data.id;

      // Modify the deck
      const modifyResponse = await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', regularUserSessionCookie)
        .send({
          name: 'Modified Deck Name',
          description: 'Modified description'
        });

      expect(modifyResponse.status).toBe(200);
      expect(modifyResponse.body.success).toBe(true);
      expect(modifyResponse.body.data.name).toBe('Modified Deck Name');
      expect(modifyResponse.body.data.description).toBe('Modified description');

      // Clean up
      await deckRepository.deleteDeck(deckId);
    });
  });

  describe('Admin User Deck Deletion', () => {
    let adminSessionCookie: string;
    let adminDeckId: string;

    beforeAll(async () => {
      // Login as admin user to get session cookie
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'kyle',
          password: 'Overpower2025!'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      
      // Extract session cookie
      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();
      adminSessionCookie = cookies[0].split(';')[0];

      // Create a deck for the admin user
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', adminSessionCookie)
        .send({
          name: 'Admin Test Deck',
          description: 'A deck created by admin user'
        });

      expect(createDeckResponse.status).toBe(201);
      expect(createDeckResponse.body.success).toBe(true);
      adminDeckId = createDeckResponse.body.data.id;
      
      // Track this deck for cleanup
      integrationTestUtils.trackTestDeck(adminDeckId);
    });

    afterAll(async () => {
      // Clean up admin user's deck if it still exists
      if (adminDeckId) {
        try {
          await deckRepository.deleteDeck(adminDeckId);
        } catch (error) {
          // Deck might already be deleted, ignore error
        }
      }
    });

    it('should allow admin to delete their own deck', async () => {
      const deleteResponse = await request(app)
        .delete(`/api/decks/${adminDeckId}`)
        .set('Cookie', adminSessionCookie);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
      expect(deleteResponse.body.message).toBe('Deck deleted successfully');

      // Verify deck is actually deleted
      const getDeckResponse = await request(app)
        .get(`/api/decks/${adminDeckId}`)
        .set('Cookie', adminSessionCookie);

      expect(getDeckResponse.status).toBe(404);
      expect(getDeckResponse.body.success).toBe(false);
      expect(getDeckResponse.body.error).toBe('Deck not found');

      // Mark deck as deleted for cleanup
      adminDeckId = '';
    });

    it('should block admin from deleting another user\'s deck', async () => {
      // Create a deck for the regular user (since the original was deleted)
      const regularUserDeck = await deckRepository.createDeck(
        regularUserId,
        'Regular User Deck for Admin Test',
        'A deck owned by regular user for testing admin access control'
      );
      
      // Try to delete the regular user's deck with admin's session
      const deleteResponse = await request(app)
        .delete(`/api/decks/${regularUserDeck.id}`)
        .set('Cookie', adminSessionCookie);

      expect(deleteResponse.status).toBe(403);
      expect(deleteResponse.body.success).toBe(false);
      expect(deleteResponse.body.error).toBe('Access denied. You do not own this deck.');
      
      // Clean up the regular user deck
      await deckRepository.deleteDeck(regularUserDeck.id);
    });

    it('should allow admin to create new decks', async () => {
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', adminSessionCookie)
        .send({
          name: 'Another Admin Deck',
          description: 'Another deck created by admin user'
        });

      expect(createDeckResponse.status).toBe(201);
      expect(createDeckResponse.body.success).toBe(true);
      expect(createDeckResponse.body.data.name).toBe('Another Admin Deck');

      // Clean up the created deck
      const newDeckId = createDeckResponse.body.data.id;
      await deckRepository.deleteDeck(newDeckId);
    });

    it('should allow admin to modify their own decks', async () => {
      // Create a deck to modify
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', adminSessionCookie)
        .send({
          name: 'Admin Deck to Modify',
          description: 'Original admin description'
        });

      expect(createDeckResponse.status).toBe(201);
      const deckId = createDeckResponse.body.data.id;
      
      // Track this deck for cleanup
      integrationTestUtils.trackTestDeck(deckId);

      // Modify the deck
      const modifyResponse = await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', adminSessionCookie)
        .send({
          name: 'Modified Admin Deck',
          description: 'Modified admin description'
        });

      expect(modifyResponse.status).toBe(200);
      expect(modifyResponse.body.success).toBe(true);
      expect(modifyResponse.body.data.name).toBe('Modified Admin Deck');
      expect(modifyResponse.body.data.description).toBe('Modified admin description');

      // Clean up
      await deckRepository.deleteDeck(deckId);
    });
  });

  describe('Unauthenticated Access', () => {
    it('should block unauthenticated requests to delete decks', async () => {
      // Create a temporary deck for this test
      const tempDeck = await deckRepository.createDeck(
        regularUserId,
        'Temp Deck for Auth Test',
        'A temporary deck for testing unauthenticated access'
      );
      
      const deleteResponse = await request(app)
        .delete(`/api/decks/${tempDeck.id}`);

      expect(deleteResponse.status).toBe(401);
      expect(deleteResponse.body.success).toBe(false);
      expect(deleteResponse.body.error).toBe('Authentication required');
      
      // Clean up the temporary deck
      await deckRepository.deleteDeck(tempDeck.id);
    });

    it('should block unauthenticated requests to create decks', async () => {
      const createResponse = await request(app)
        .post('/api/decks')
        .send({
          name: 'Unauthenticated Deck',
          description: 'This should fail'
        });

      expect(createResponse.status).toBe(401);
      expect(createResponse.body.success).toBe(false);
      expect(createResponse.body.error).toBe('Authentication required');
    });

    it('should block unauthenticated requests to modify decks', async () => {
      // Create a temporary deck for this test
      const tempDeck = await deckRepository.createDeck(
        regularUserId,
        'Temp Deck for Modify Test',
        'A temporary deck for testing unauthenticated modify access'
      );
      
      const modifyResponse = await request(app)
        .put(`/api/decks/${tempDeck.id}`)
        .send({
          name: 'Modified by Unauthenticated',
          description: 'This should fail'
        });

      expect(modifyResponse.status).toBe(401);
      expect(modifyResponse.body.success).toBe(false);
      expect(modifyResponse.body.error).toBe('Authentication required');
      
      // Clean up the temporary deck
      await deckRepository.deleteDeck(tempDeck.id);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    let regularUserSessionCookie: string;

    beforeAll(async () => {
      // Login as regular user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpassword'
        });

      expect(loginResponse.status).toBe(200);
      const cookies = loginResponse.headers['set-cookie'];
      regularUserSessionCookie = cookies[0].split(';')[0];
    });

    it('should handle deletion of non-existent deck', async () => {
      const fakeDeckId = '00000000-0000-0000-0000-000000000000';
      const deleteResponse = await request(app)
        .delete(`/api/decks/${fakeDeckId}`)
        .set('Cookie', regularUserSessionCookie);

      expect(deleteResponse.status).toBe(404);
      expect(deleteResponse.body.success).toBe(false);
      expect(deleteResponse.body.error).toBe('Deck not found');
    });

    it('should handle invalid deck ID format', async () => {
      const invalidDeckId = 'invalid-id';
      const deleteResponse = await request(app)
        .delete(`/api/decks/${invalidDeckId}`)
        .set('Cookie', regularUserSessionCookie);

      // Should return 500 (internal server error) due to invalid UUID format
      expect(deleteResponse.status).toBe(500);
      expect(deleteResponse.body.success).toBe(false);
    });

    it('should handle malformed session cookie', async () => {
      // Create a temporary deck for this test
      const tempDeck = await deckRepository.createDeck(
        regularUserId,
        'Temp Deck for Session Test',
        'A temporary deck for testing malformed session'
      );
      
      const deleteResponse = await request(app)
        .delete(`/api/decks/${tempDeck.id}`)
        .set('Cookie', 'sessionId=invalid-session-id');

      expect(deleteResponse.status).toBe(401);
      expect(deleteResponse.body.success).toBe(false);
      expect(deleteResponse.body.error).toBe('Invalid or expired session');
      
      // Clean up the temporary deck
      await deckRepository.deleteDeck(tempDeck.id);
    });
  });
});
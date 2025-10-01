import request from 'supertest';
import { app } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../setup-integration';

describe('Guest Deck Editing Restrictions Integration Tests', () => {
  let guestCookie: string;
  let userCookie: string;
  let adminCookie: string;
  let testDeckId: string;
  let testUser: any;
  let testAdmin: any;

  beforeAll(async () => {
    // Database initialization is handled by the test setup
  });

  beforeEach(async () => {
    // Create fresh test users for each test
    testUser = await integrationTestUtils.createTestUser({
      name: `testuser_${Date.now()}`,
      email: `testuser_${Date.now()}@example.com`,
      password: 'testpassword'
    });

    testAdmin = await integrationTestUtils.createTestUser({
      name: `admin_${Date.now()}`,
      email: `admin_${Date.now()}@example.com`,
      password: 'adminpassword',
      role: 'ADMIN'
    });

    // Login to get cookies
    const guestResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'Test-Guest', password: 'test-guest' });
    
    if (guestResponse.headers['set-cookie']) {
      guestCookie = guestResponse.headers['set-cookie'][0].split(';')[0];
    }

    const userResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: 'testpassword'
      });
    
    if (userResponse.headers['set-cookie']) {
      userCookie = userResponse.headers['set-cookie'][0].split(';')[0];
    }

    const adminResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: testAdmin.username,
        password: 'adminpassword'
      });
    
    if (adminResponse.headers['set-cookie']) {
      adminCookie = adminResponse.headers['set-cookie'][0].split(';')[0];
    }

    // Verify cookies are set
    expect(guestCookie).toBeDefined();
    expect(userCookie).toBeDefined();
    expect(adminCookie).toBeDefined();

    // Create a fresh test deck for each test
    const createDeckResponse = await request(app)
      .post('/api/decks')
      .set('Cookie', userCookie)
      .send({
        name: `Test Deck for Guest Restrictions ${Date.now()}`,
        description: 'A deck to test guest editing restrictions'
      });
    
    expect(createDeckResponse.status).toBe(201);
    expect(createDeckResponse.body.success).toBe(true);
    testDeckId = createDeckResponse.body.data.id;
    expect(testDeckId).toBeDefined();
    
    // Track this deck for cleanup
    integrationTestUtils.trackTestDeck(testDeckId);
    
    console.log('🔍 Created test deck with ID:', testDeckId);
  });

  afterAll(async () => {
    // Clean up test deck at the end of all tests
    if (testDeckId) {
      try {
        await request(app)
          .delete(`/api/decks/${testDeckId}`)
          .set('Cookie', userCookie);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Deck Creation Restrictions', () => {
    it('should block guest from creating decks', async () => {
      const response = await request(app)
        .post('/api/decks')
        .set('Cookie', guestCookie)
        .send({
          name: 'Guest Attempted Deck',
          description: 'This should fail'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Guests may not create decks');
    });

    it('should allow regular user to create decks', async () => {
      const response = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookie)
        .send({
          name: 'User Deck',
          description: 'This should succeed'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('User Deck');
    });

    it('should allow admin to create decks', async () => {
      const response = await request(app)
        .post('/api/decks')
        .set('Cookie', adminCookie)
        .send({
          name: 'Admin Deck',
          description: 'This should succeed'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Admin Deck');
      
      // Track this deck for cleanup
      integrationTestUtils.trackTestDeck(response.body.data.id);
    });
  });

  describe('Deck Modification Restrictions', () => {
    it('should block guest from updating deck metadata', async () => {
      const response = await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', guestCookie)
        .send({
          name: 'Guest Modified Deck',
          description: 'This should fail'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Guests may not modify decks');
    });

    it('should allow deck owner to update deck metadata', async () => {
      const response = await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', userCookie)
        .send({
          name: 'Updated Deck Name',
          description: 'Updated description'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Deck Name');
    });

    it('should block non-owner from updating deck metadata', async () => {
      const response = await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminCookie)
        .send({
          name: 'Admin Modified Deck',
          description: 'This should fail'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied. You do not own this deck.');
    });
  });

  describe('Card Addition Restrictions', () => {
    it('should block guest from adding cards to deck', async () => {
      const response = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', guestCookie)
        .send({
          cardType: 'character',
          cardId: 'leonidas',
          quantity: 1
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Guests may not modify decks');
    });

    it('should allow deck owner to add cards', async () => {
      const response = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', userCookie)
        .send({
          cardType: 'character',
          cardId: 'leonidas',
          quantity: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should block non-owner from adding cards', async () => {
      const response = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', adminCookie)
        .send({
          cardType: 'character',
          cardId: 'leonidas',
          quantity: 1
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied. You do not own this deck.');
    });
  });

  describe('Card Removal Restrictions', () => {
    beforeEach(async () => {
      // Add a card to the deck first
      await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', userCookie)
        .send({
          cardType: 'character',
          cardId: 'leonidas',
          quantity: 1
        });
    });

    it('should block guest from removing cards from deck', async () => {
      const response = await request(app)
        .delete(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', guestCookie)
        .send({
          cardType: 'character',
          cardId: 'leonidas',
          quantity: 1
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Guests may not modify decks');
    });

    it('should allow deck owner to remove cards', async () => {
      const response = await request(app)
        .delete(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', userCookie)
        .send({
          cardType: 'character',
          cardId: 'leonidas',
          quantity: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should block non-owner from removing cards', async () => {
      const response = await request(app)
        .delete(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', adminCookie)
        .send({
          cardType: 'character',
          cardId: 'leonidas',
          quantity: 1
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied. You do not own this deck.');
    });
  });

  describe('UI Preferences Restrictions', () => {
    it('should block guest from updating UI preferences', async () => {
      const response = await request(app)
        .put(`/api/decks/${testDeckId}/ui-preferences`)
        .set('Cookie', guestCookie)
        .send({
          expansionState: { characters: true }
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Guests may not modify decks');
    });

    it('should allow deck owner to update UI preferences', async () => {
      const response = await request(app)
        .put(`/api/decks/${testDeckId}/ui-preferences`)
        .set('Cookie', userCookie)
        .send({
          expansionState: { characters: true }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should block non-owner from updating UI preferences', async () => {
      const response = await request(app)
        .put(`/api/decks/${testDeckId}/ui-preferences`)
        .set('Cookie', adminCookie)
        .send({
          expansionState: { characters: true }
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied. You do not own this deck.');
    });
  });

  describe('Deck Deletion Restrictions', () => {
    it('should block guest from deleting decks', async () => {
      const response = await request(app)
        .delete(`/api/decks/${testDeckId}`)
        .set('Cookie', guestCookie);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Guests may not delete decks');
    });

    it('should block non-owner from deleting deck', async () => {
      const response = await request(app)
        .delete(`/api/decks/${testDeckId}`)
        .set('Cookie', adminCookie);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied. You do not own this deck.');
    });

    // Note: We don't test actual deletion here to avoid breaking subsequent tests
    // The deck deletion is tested in the comprehensive test below
  });

  describe('Read-Only Access Verification', () => {
    it('should allow guest to view deck details', async () => {
      console.log('🔍 Attempting to view deck with ID:', testDeckId);
      const response = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', guestCookie);

      console.log('🔍 Deck details response:', response.status, response.body);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.metadata.name).toContain('Test Deck for Guest Restrictions');
    });

    it('should allow guest to view deck cards', async () => {
      const response = await request(app)
        .get(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', guestCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow guest to view UI preferences', async () => {
      const response = await request(app)
        .get(`/api/decks/${testDeckId}/ui-preferences`)
        .set('Cookie', guestCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Comprehensive Guest Restrictions', () => {
    it('should verify all modification endpoints are blocked for guests', async () => {
      const modificationEndpoints = [
        { method: 'POST', path: '/api/decks', data: { name: 'Test Deck' } },
        { method: 'PUT', path: `/api/decks/${testDeckId}`, data: { name: 'Updated Deck' } },
        { method: 'POST', path: `/api/decks/${testDeckId}/cards`, data: { cardType: 'character', cardId: 'leonidas' } },
        { method: 'DELETE', path: `/api/decks/${testDeckId}/cards`, data: { cardType: 'character', cardId: 'leonidas' } },
        { method: 'PUT', path: `/api/decks/${testDeckId}/ui-preferences`, data: { expansionState: {} } }
      ];

      for (const endpoint of modificationEndpoints) {
        let response: any;
        if (endpoint.method === 'POST') {
          response = await request(app)
            .post(endpoint.path)
            .set('Cookie', guestCookie)
            .send(endpoint.data || {});
        } else if (endpoint.method === 'PUT') {
          response = await request(app)
            .put(endpoint.path)
            .set('Cookie', guestCookie)
            .send(endpoint.data || {});
        } else if (endpoint.method === 'DELETE') {
          response = await request(app)
            .delete(endpoint.path)
            .set('Cookie', guestCookie)
            .send(endpoint.data || {});
        }

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/Guests may not/);
      }
    });

    it('should verify all read endpoints are allowed for guests', async () => {
      const readEndpoints = [
        { method: 'GET', path: '/api/decks' },
        { method: 'GET', path: `/api/decks/${testDeckId}` },
        { method: 'GET', path: `/api/decks/${testDeckId}/cards` },
        { method: 'GET', path: `/api/decks/${testDeckId}/ui-preferences` }
      ];

      for (const endpoint of readEndpoints) {
        const response = await request(app)
          .get(endpoint.path)
          .set('Cookie', guestCookie);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });

    it('should test deck deletion with a separate deck', async () => {
      // Create a separate deck for deletion testing
      const createDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', userCookie)
        .send({
          name: 'Deletion Test Deck',
          description: 'A deck specifically for testing deletion'
        });
      
      expect(createDeckResponse.status).toBe(201);
      const deletionTestDeckId = createDeckResponse.body.data.id;

      // Test that guest cannot delete
      const guestDeleteResponse = await request(app)
        .delete(`/api/decks/${deletionTestDeckId}`)
        .set('Cookie', guestCookie);

      expect(guestDeleteResponse.status).toBe(403);
      expect(guestDeleteResponse.body.success).toBe(false);
      expect(guestDeleteResponse.body.error).toBe('Guests may not delete decks');

      // Test that owner can delete
      const ownerDeleteResponse = await request(app)
        .delete(`/api/decks/${deletionTestDeckId}`)
        .set('Cookie', userCookie);

      expect(ownerDeleteResponse.status).toBe(200);
      expect(ownerDeleteResponse.body.success).toBe(true);
    });
  });
});

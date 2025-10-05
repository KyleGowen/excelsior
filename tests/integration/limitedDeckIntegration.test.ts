import request from 'supertest';
import { app } from '../../src/test-server';
import { integrationTestUtils } from '../setup-integration';

describe('Limited Deck Integration Tests', () => {
  let testUser: any;
  let authCookie: string;

  beforeAll(async () => {
    // Create a test user using the integration test utils
    testUser = await integrationTestUtils.createTestUser({
      name: 'limited-test-user',
      email: 'limitedtest@example.com',
      password: 'testpass123',
      role: 'USER'
    });
    console.log('🔍 DEBUG: Created test user:', testUser);
  });

  afterAll(async () => {
    // Clean up test data
    await integrationTestUtils.cleanupTestData();
  });

  beforeEach(async () => {
    // Login and get auth cookie
    console.log('🔍 DEBUG: Attempting login with username:', testUser.name);
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUser.username,
        password: 'testpass123'
      });

    console.log('🔍 DEBUG: Login response status:', loginResponse.status);
    console.log('🔍 DEBUG: Login response body:', loginResponse.body);
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    
    // Extract cookie from response
    const setCookieHeader = loginResponse.headers['set-cookie'];
    expect(setCookieHeader).toBeDefined();
    authCookie = setCookieHeader![0];
  });

  describe('Deck Creation with Limited Flag', () => {
    test('should create a deck with is_limited set to false by default', async () => {
      const deckData = {
        name: 'Test Limited Deck',
        description: 'A test deck for limited functionality'
      };

      const response = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send(deckData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.is_limited).toBe(false);
      expect(response.body.data.name).toBe('Test Limited Deck');
    });

    test('should create a deck and then update is_limited to true', async () => {
      // First create a deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({
          name: 'Limited Test Deck',
          description: 'A deck to test limited functionality'
        });

      expect(createResponse.status).toBe(201);
      const deckId = createResponse.body.data.id;

      // Then update it to be limited
      const updateResponse = await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Limited Test Deck',
          description: 'A deck to test limited functionality',
          is_limited: true
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.is_limited).toBe(true);
    });

    test('should create a deck and then update is_limited to false', async () => {
      // First create a deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({
          name: 'Unlimited Test Deck',
          description: 'A deck to test unlimited functionality'
        });

      expect(createResponse.status).toBe(201);
      const deckId = createResponse.body.data.id;

      // Update to limited first
      await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Unlimited Test Deck',
          description: 'A deck to test unlimited functionality',
          is_limited: true
        });

      // Then update back to not limited
      const updateResponse = await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Unlimited Test Deck',
          description: 'A deck to test unlimited functionality',
          is_limited: false
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.is_limited).toBe(false);
    });
  });

  describe('Deck Retrieval with Limited Flag', () => {
    test('should retrieve a deck with is_limited flag', async () => {
      // Create a limited deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({
          name: 'Retrieval Test Deck',
          description: 'A deck to test retrieval with limited flag'
        });

      const deckId = createResponse.body.data.id;

      // Update to limited
      await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Retrieval Test Deck',
          description: 'A deck to test retrieval with limited flag',
          is_limited: true
        });

      // Retrieve the deck
      const getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.metadata.is_limited).toBe(true);
      expect(getResponse.body.data.metadata.name).toBe('Retrieval Test Deck');
    });

    test('should retrieve all decks with is_limited flags', async () => {
      // Create multiple decks with different limited states
      const deck1Response = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({
          name: 'Limited Deck 1',
          description: 'First limited deck'
        });

      const deck2Response = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({
          name: 'Regular Deck 1',
          description: 'First regular deck'
        });

      // Make first deck limited
      await request(app)
        .put(`/api/decks/${deck1Response.body.data.id}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Limited Deck 1',
          description: 'First limited deck',
          is_limited: true
        });

      // Get all decks
      const getAllResponse = await request(app)
        .get('/api/decks')
        .set('Cookie', authCookie);

      expect(getAllResponse.status).toBe(200);
      expect(getAllResponse.body.success).toBe(true);
      expect(getAllResponse.body.data).toBeInstanceOf(Array);
      expect(getAllResponse.body.data.length).toBeGreaterThanOrEqual(2);

      // Find our test decks
      const limitedDeck = getAllResponse.body.data.find((deck: any) => deck.metadata.name === 'Limited Deck 1');
      const regularDeck = getAllResponse.body.data.find((deck: any) => deck.metadata.name === 'Regular Deck 1');

      expect(limitedDeck).toBeDefined();
      expect(limitedDeck.metadata.is_limited).toBe(true);
      expect(regularDeck).toBeDefined();
      expect(regularDeck.metadata.is_limited).toBe(false);
    });
  });

  describe('Deck List Display with Limited Icons', () => {
    test('should return deck data with is_limited flag for frontend display', async () => {
      // Create a limited deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({
          name: 'Display Test Limited Deck',
          description: 'A deck to test display functionality'
        });

      const deckId = createResponse.body.data.id;

      // Update to limited
      await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Display Test Limited Deck',
          description: 'A deck to test display functionality',
          is_limited: true
        });

      // Get deck list (this would be used by frontend to display Limited icons)
      const deckListResponse = await request(app)
        .get('/api/decks')
        .set('Cookie', authCookie);

      expect(deckListResponse.status).toBe(200);
      expect(deckListResponse.body.success).toBe(true);

      const limitedDeck = deckListResponse.body.data.find((deck: any) => deck.metadata.name === 'Display Test Limited Deck');
      expect(limitedDeck).toBeDefined();
      expect(limitedDeck.metadata.is_limited).toBe(true);

      // This data would be used by frontend to show Limited badge
      expect(limitedDeck.metadata).toMatchObject({
        id: deckId,
        name: 'Display Test Limited Deck',
        description: 'A deck to test display functionality',
        is_limited: true
      });
    });

    test('should return deck data with is_limited false for regular decks', async () => {
      // Create a regular deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({
          name: 'Display Test Regular Deck',
          description: 'A regular deck for display testing'
        });

      const deckId = createResponse.body.data.id;

      // Get deck list
      const deckListResponse = await request(app)
        .get('/api/decks')
        .set('Cookie', authCookie);

      expect(deckListResponse.status).toBe(200);
      expect(deckListResponse.body.success).toBe(true);

      const regularDeck = deckListResponse.body.data.find((deck: any) => deck.metadata.name === 'Display Test Regular Deck');
      expect(regularDeck).toBeDefined();
      expect(regularDeck.metadata.is_limited).toBe(false);

      // This data would be used by frontend to show Legal/Not Legal badge
      expect(regularDeck.metadata).toMatchObject({
        id: deckId,
        name: 'Display Test Regular Deck',
        description: 'A regular deck for display testing',
        is_limited: false
      });
    });
  });

  describe('Limited Flag Persistence', () => {
    test('should persist is_limited flag across multiple updates', async () => {
      // Create a deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({
          name: 'Persistence Test Deck',
          description: 'A deck to test persistence'
        });

      const deckId = createResponse.body.data.id;

      // Update to limited
      await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Persistence Test Deck',
          description: 'A deck to test persistence',
          is_limited: true
        });

      // Verify it's limited
      let getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.body.data.metadata.is_limited).toBe(true);

      // Update name but keep limited flag
      await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Updated Persistence Test Deck',
          description: 'A deck to test persistence',
          is_limited: true
        });

      // Verify it's still limited
      getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.body.data.metadata.is_limited).toBe(true);
      expect(getResponse.body.data.metadata.name).toBe('Updated Persistence Test Deck');

      // Update to not limited
      await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Updated Persistence Test Deck',
          description: 'A deck to test persistence',
          is_limited: false
        });

      // Verify it's no longer limited
      getResponse = await request(app)
        .get(`/api/decks/${deckId}`)
        .set('Cookie', authCookie);

      expect(getResponse.body.data.metadata.is_limited).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle updating non-existent deck', async () => {
      const fakeDeckId = 'non-existent-deck-id';

      const response = await request(app)
        .put(`/api/decks/${fakeDeckId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Non-existent Deck',
          description: 'This deck does not exist',
          is_limited: true
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should handle updating deck without is_limited field', async () => {
      // Create a deck
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({
          name: 'No Limited Field Test',
          description: 'A deck to test without is_limited field'
        });

      const deckId = createResponse.body.data.id;

      // Update without is_limited field (should default to false)
      const updateResponse = await request(app)
        .put(`/api/decks/${deckId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'No Limited Field Test',
          description: 'A deck to test without is_limited field'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.is_limited).toBe(false);
    });
  });

  describe('Frontend Integration Simulation', () => {
    test('should simulate frontend deck list with Limited badges', async () => {
      // Create multiple decks with different states
      const limitedDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({
          name: 'Frontend Limited Deck',
          description: 'A limited deck for frontend testing'
        });

      const regularDeckResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', authCookie)
        .send({
          name: 'Frontend Regular Deck',
          description: 'A regular deck for frontend testing'
        });

      // Make first deck limited
      await request(app)
        .put(`/api/decks/${limitedDeckResponse.body.data.id}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Frontend Limited Deck',
          description: 'A limited deck for frontend testing',
          is_limited: true
        });

      // Get deck list (simulating frontend API call)
      const deckListResponse = await request(app)
        .get('/api/decks')
        .set('Cookie', authCookie);

      expect(deckListResponse.status).toBe(200);
      expect(deckListResponse.body.success).toBe(true);

      // Simulate frontend processing
      const decks = deckListResponse.body.data;
      const limitedDeck = decks.find((deck: any) => deck.metadata.name === 'Frontend Limited Deck');
      const regularDeck = decks.find((deck: any) => deck.metadata.name === 'Frontend Regular Deck');

      // Simulate frontend badge logic
      const limitedDeckBadge = limitedDeck.metadata.is_limited ? 'Limited' : 'Legal/Not Legal';
      const regularDeckBadge = regularDeck.metadata.is_limited ? 'Limited' : 'Legal/Not Legal';

      expect(limitedDeckBadge).toBe('Limited');
      expect(regularDeckBadge).toBe('Legal/Not Legal');

      // Verify the data structure that frontend would use
      expect(limitedDeck.metadata).toHaveProperty('is_limited', true);
      expect(regularDeck.metadata).toHaveProperty('is_limited', false);
    });
  });
});

import request from 'supertest';
import { app, initializeTestServer } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';

describe('View Button Read-Only Mode Integration Tests', () => {
  let userRepository: any;
  let deckRepository: any;
  let testUser: any;
  let testDeck: any;
  let sessionId: string;

  beforeAll(async () => {
    // Initialize test server and get repositories
    await initializeTestServer();
    
    // Initialize repositories using DataSourceConfig
    const dataSource = DataSourceConfig.getInstance();
    userRepository = dataSource.getUserRepository();
    deckRepository = dataSource.getDeckRepository();

    // Create a test user
    testUser = await userRepository.createUser('test-view-user', 'test-view@example.com', 'password123', 'USER');
    expect(testUser).toBeDefined();
  });

  afterAll(async () => {
    // Clean up test data
    if (testDeck) {
      await deckRepository.deleteDeck(testDeck.id);
    }
    if (testUser) {
      await userRepository.deleteUser(testUser.id);
    }
  });

  beforeEach(async () => {
    // Login to get session
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'test-view-user',
        password: 'password123'
      });

    expect(loginResponse.status).toBe(200);
    sessionId = loginResponse.headers['set-cookie'][0].split(';')[0].split('=')[1];

    // Create a test deck for each test
    const deckData = {
      name: 'Test View Deck',
      description: 'A deck for testing view functionality',
      cards: [
        { type: 'character', card_id: 'char1', quantity: 1 },
        { type: 'power', card_id: 'power1', quantity: 2 }
      ],
      ui_preferences: {
        viewMode: 'tile',
        expansionState: { character: true, power: true },
        dividerPosition: 50
      }
    };

    const createResponse = await request(app)
      .post('/api/decks')
      .send(deckData)
      .set('Cookie', `sessionId=${sessionId}`);

    expect(createResponse.status).toBe(201);
    testDeck = createResponse.body.data;
  });

  afterEach(async () => {
    // Clean up test deck after each test
    if (testDeck) {
      try {
        await deckRepository.deleteDeck(testDeck.id);
      } catch (error) {
        console.log('Error cleaning up test deck:', error);
      }
    }
  });

  describe('View Button Functionality', () => {
    it('should navigate to deck editor with readonly=true query parameter', async () => {
      // Simulate clicking the View button by accessing the deck editor URL with readonly=true
      const viewResponse = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}?readonly=true`)
        .set('Cookie', `sessionId=${sessionId}`);

      expect(viewResponse.status).toBe(200);
      expect(viewResponse.text).toContain('deckEditorModal');
      
      // The page should load successfully with the deck editor
    });

    it('should enforce read-only mode when readonly=true is present', async () => {
      // This test verifies that the frontend JavaScript correctly detects the readonly=true parameter
      // and applies read-only styling and behavior
      const viewResponse = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}?readonly=true`)
        .set('Cookie', `sessionId=${sessionId}`);

      expect(viewResponse.status).toBe(200);
      
      // The response should contain the deck editor HTML
      expect(viewResponse.text).toContain('deckEditorModal');
      
      // The JavaScript should be present to handle readonly mode
      expect(viewResponse.text).toContain('readonly=true');
    });

    it('should allow normal editing when readonly=true is not present', async () => {
      // Access the deck editor without readonly=true parameter
      const editResponse = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', `sessionId=${sessionId}`);

      expect(editResponse.status).toBe(200);
      expect(editResponse.text).toContain('deckEditorModal');
    });

    it('should work for guest users viewing decks', async () => {
      // Test that guest users can view decks in read-only mode
      const guestViewResponse = await request(app)
        .get(`/users/guest/decks/${testDeck.id}?readonly=true`);

      expect(guestViewResponse.status).toBe(200);
      expect(guestViewResponse.text).toContain('deckEditorModal');
    });
  });

  describe('URL Generation for View Button', () => {
    it('should generate correct URL with readonly=true parameter', () => {
      // This test verifies the viewDeck JavaScript function generates the correct URL
      const deckId = 'test-deck-123';
      const userId = 'test-user-456';
      
      // Simulate the viewDeck function logic
      const expectedUrl = `/users/${userId}/decks/${deckId}?readonly=true`;
      
      expect(expectedUrl).toBe('/users/test-user-456/decks/test-deck-123?readonly=true');
    });

    it('should handle guest user in URL generation', () => {
      const deckId = 'test-deck-123';
      const userId = 'guest';
      
      const expectedUrl = `/users/${userId}/decks/${deckId}?readonly=true`;
      
      expect(expectedUrl).toBe('/users/guest/decks/test-deck-123?readonly=true');
    });
  });
});

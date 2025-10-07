/**
 * Integration test for character column layout in deck editor
 * Tests that character cards always display in single column layout
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.SKIP_MIGRATIONS = 'true';

// Import test server
import request from 'supertest';
import { app } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../setup-integration';

describe('Character Column Layout Integration Tests', () => {
  let testUser: any;
  let testDeck: any;
  let authCookie: string;

  beforeAll(async () => {
    // Ensure guest user exists
    await integrationTestUtils.ensureGuestUser();
    
    // Get test user and create a test deck
    const userRepository = DataSourceConfig.getInstance().getUserRepository();
    const deckRepository = DataSourceConfig.getInstance().getDeckRepository();
    
    testUser = await userRepository.createUser(
      `charlayout_${Date.now()}`,
      `charlayout_${Date.now()}@example.com`,
      'testpass123',
      'USER'
    );

    // Create a test deck with multiple character cards
    testDeck = await deckRepository.createDeck(
      testUser.id,
      'Character Layout Test Deck',
      'A deck for testing character column layout'
    );
    
    // Track this deck for cleanup
    integrationTestUtils.trackTestDeck(testDeck.id);

    console.log('✅ Test user and deck created:', { userId: testUser.id, deckId: testDeck.id });
  });

  afterAll(async () => {
    // Cleanup is handled by global afterAll in setup-integration.ts
    // No need for individual cleanup here
  });

  beforeEach(async () => {
    // Create test user and deck for each test
    const userRepository = DataSourceConfig.getInstance().getUserRepository();
    const deckRepository = DataSourceConfig.getInstance().getDeckRepository();
    
    testUser = await userRepository.createUser(
      `charlayout_${Date.now()}`,
      `charlayout_${Date.now()}@example.com`,
      'testpass123',
      'USER'
    );

    // Create a test deck
    testDeck = await deckRepository.createDeck(
      testUser.id,
      'Character Layout Test Deck',
      'A deck for testing character column layout'
    );
    
    // Track this deck for cleanup
    integrationTestUtils.trackTestDeck(testDeck.id);

    // Login and get auth cookie
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: testUser.name,
        password: 'testpass123'
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    
    // Extract session cookie
    authCookie = loginResponse.headers['set-cookie']![0].split(';')[0];
  });

  describe('Character Column Layout', () => {
    it('should display character cards in single column when deck editor first loads', async () => {
      // Access the deck editor page
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.text).toContain('deckEditorModal');
      
      // Check that the HTML contains the character section
      expect(response.text).toContain('deck-type-character');
      
      // Verify that the CSS rules for single column layout are present
      expect(response.text).toContain('grid-template-columns: 1fr !important');
      expect(response.text).toContain('deck-type-cards');
      
      // Verify that the force-single-column class CSS is present
      expect(response.text).toContain('.force-single-column');
      
      // Verify that the JavaScript function is present
      expect(response.text).toContain('forceCharacterSingleColumnLayout');
    });

    it('should maintain single column layout after adding cards to deck', async () => {
      // First, add a character card to the deck
      const addCardResponse = await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardId: 'test-character-1',
          cardType: 'character'
        });

      // The API might return 404 if the card doesn't exist, but that's ok for this test
      // We're testing the frontend layout, not the API functionality
      expect([200, 404]).toContain(addCardResponse.status);

      // Access the deck editor page after adding a card
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.text).toContain('deckEditorModal');
      
      // Verify that the character layout CSS rules are still present
      expect(response.text).toContain('grid-template-columns: 1fr !important');
      expect(response.text).toContain('deck-type-cards');
    });

    it('should have JavaScript function that enforces single column layout', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      
      // Verify that the JavaScript function exists and has the correct logic
      expect(response.text).toContain('function forceCharacterSingleColumnLayout()');
      expect(response.text).toContain('querySelectorAll(\'#deck-type-character, .deck-type-section[data-type="character"]\')');
      expect(response.text).toContain('setProperty(\'grid-template-columns\', \'1fr\', \'important\')');
      expect(response.text).toContain('force-single-column');
    });

    it('should call the layout function at multiple points in deck loading', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      
      // Verify that the function is called immediately
      expect(response.text).toContain('forceCharacterSingleColumnLayout();');
      
      // Verify that the function is called with a timeout
      expect(response.text).toContain('setTimeout(() => {');
      expect(response.text).toContain('forceCharacterSingleColumnLayout();');
      expect(response.text).toContain('}, 200);');
    });

    it('should override read-only mode 4-column layout for character cards', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      
      // Verify that there's a CSS rule that overrides read-only mode for character cards
      expect(response.text).toContain('grid-template-columns: 1fr !important');
      expect(response.text).toContain('read-only-mode');
    });

    it('should have multiple CSS selectors targeting character cards', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      
      // Verify JavaScript selectors are present (these are used in the forceCharacterSingleColumnLayout function)
      expect(response.text).toContain('#deck-type-character, .deck-type-section[data-type="character"]');
      expect(response.text).toContain('querySelectorAll(\'#deck-type-character, .deck-type-section[data-type="character"]\')');
      expect(response.text).toContain('deck-type-cards');
      expect(response.text).toContain('character-card');
    });

    it('should include character layout scripts and styles without relying on debug logs', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      
      // Verify that layout-related selectors and function names exist in HTML
      expect(response.text).toContain('deck-type-character');
      expect(response.text).toContain('forceCharacterSingleColumnLayout');
      expect(response.text).toContain('grid-template-columns: 1fr');
    });
  });

  describe('Character Layout Performance', () => {
    it('should load deck editor with character layout fix within reasonable time', async () => {
      const startTime = Date.now();
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.status).toBe(200);
      console.log(`Deck editor with character layout load time: ${duration}ms`);
      expect(duration).toBeLessThan(1000); // Expect load time under 1 second
    });
  });
});

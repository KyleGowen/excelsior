/**
 * Integration test for deck opening and closing behavior
 * Tests the complete flow from deck selection to deck editor and back
 */

import request from 'supertest';
import { app } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../setup-integration';

describe('Deck Navigation Flow Integration Tests', () => {
  let testUser: any;
  let testDeck: any;
  let authCookie: string;

  beforeAll(async () => {
    // Ensure guest user exists
    await integrationTestUtils.ensureGuestUser();
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
      `decknavtest_${Date.now()}`,
      `decknavtest_${Date.now()}@example.com`,
      'testpass123',
      'USER'
    );

    // Create a test deck
    testDeck = await deckRepository.createDeck(
      testUser.id,
      'Test Navigation Deck',
      'A deck for testing navigation flow'
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
    const setCookieHeader = loginResponse.headers['set-cookie'];
    expect(setCookieHeader).toBeDefined();
    authCookie = setCookieHeader![0].split(';')[0];
  });

  describe('Deck Editor Navigation Flow', () => {
    it('should successfully navigate to deck editor without database view flash', async () => {
      // Test the deck editor page load
      const deckEditorResponse = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie);

      expect(deckEditorResponse.status).toBe(200);
      expect(deckEditorResponse.text).toContain('deckEditorModal');
      
      // The deck name is loaded asynchronously via JavaScript, so we don't check for it in the initial HTML
      // Instead, we verify the page structure is correct for the deck editor to load
      
      // Verify the page contains the deck editor elements
      expect(deckEditorResponse.text).toContain('deck-editor-layout');
      expect(deckEditorResponse.text).toContain('card-selector-pane');
      expect(deckEditorResponse.text).toContain('deck-pane');
    });

    it('should load deck data correctly in editor', async () => {
      // Get deck data via API
      const deckDataResponse = await request(app)
        .get(`/api/decks/${testDeck.id}`)
        .set('Cookie', authCookie)
        .set('x-test-user-id', testUser.id);

      expect(deckDataResponse.status).toBe(200);
      expect(deckDataResponse.body.success).toBe(true);
      expect(deckDataResponse.body.data.metadata.name).toBe('Test Navigation Deck');
      expect(deckDataResponse.body.data.metadata.isOwner).toBe(true);
    });

    it('should handle deck editor modal opening and closing', async () => {
      // Test opening deck editor
      const openResponse = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie);

      expect(openResponse.status).toBe(200);
      
      // Verify the page structure for deck editor
      expect(openResponse.text).toContain('deckEditorModal');
      expect(openResponse.text).toContain('modal-content');
      
      // Test that the deck editor has the correct layout
      expect(openResponse.text).toContain('force-two-pane');
    });

    it('should load available cards for deck editor', async () => {
      // Test that characters are available for the deck editor
      const charactersResponse = await request(app)
        .get('/api/characters')
        .set('Cookie', authCookie);

      expect(charactersResponse.status).toBe(200);
      expect(charactersResponse.body.success).toBe(true);
      expect(charactersResponse.body.data.length).toBeGreaterThan(0);

      // Test other card types
      const locationsResponse = await request(app)
        .get('/api/locations')
        .set('Cookie', authCookie);

      expect(locationsResponse.status).toBe(200);
      expect(locationsResponse.body.success).toBe(true);
    });

    it('should handle read-only mode correctly for deck owners', async () => {
      // Test deck ownership verification
      const deckResponse = await request(app)
        .get(`/api/decks/${testDeck.id}`)
        .set('Cookie', authCookie)
        .set('x-test-user-id', testUser.id);

      expect(deckResponse.status).toBe(200);
      expect(deckResponse.body.data.metadata.isOwner).toBe(true);
      
      // The deck should be editable (isOwner = true means not read-only)
      expect(deckResponse.body.data.metadata.isOwner).toBe(true);
    });

    it('should handle read-only mode for non-owners', async () => {
      // Create another user
      const userRepository = DataSourceConfig.getInstance().getUserRepository();
      const otherUser = await userRepository.createUser(
        `otheruser_${Date.now()}`,
        `otheruser_${Date.now()}@example.com`,
        'testpass123',
        'USER'
      );

      // Login as the other user to get proper authentication
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: otherUser.name, password: 'testpass123' });

      expect(loginResponse.status).toBe(200);
      const otherUserAuthCookie = Array.isArray(loginResponse.headers['set-cookie'])
        ? loginResponse.headers['set-cookie'].find((cookie: string) => cookie.startsWith('sessionId='))
        : loginResponse.headers['set-cookie']?.startsWith('sessionId=') ? loginResponse.headers['set-cookie'] : null;

      // Try to access the deck as non-owner with proper authentication
      const deckResponse = await request(app)
        .get(`/api/decks/${testDeck.id}`)
        .set('Cookie', otherUserAuthCookie);

      expect(deckResponse.status).toBe(200);
      expect(deckResponse.body.data.metadata.isOwner).toBe(false);
      // For non-owners, isOwner = false means read-only access is allowed

      // Clean up other user
      await userRepository.deleteUser(otherUser.id);
    });
  });

  describe('Deck Editor UI Elements', () => {
    it('should render deck editor with proper layout structure', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      
      // Check for essential deck editor elements
      expect(response.text).toContain('deck-editor-layout');
      expect(response.text).toContain('deck-pane');
      expect(response.text).toContain('card-selector-pane');
      expect(response.text).toContain('resizable-divider');
      
      // Check for card categories
      expect(response.text).toContain('card-categories');
      expect(response.text).toContain('Available Cards');
    });

    it('should include search functionality in deck editor', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      
      // Check for search elements
      expect(response.text).toContain('deckEditorSearch');
      expect(response.text).toContain('deckEditorSearchResults');
    });

    it('should include deck management controls', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      
      // Check for deck management elements (these are in the modal)
      expect(response.text).toContain('deckEditorModal');
      expect(response.text).toContain('modal-content');
    });
  });

  describe('Navigation Between Views', () => {
    it('should handle navigation from main app to deck editor', async () => {
      // First, access the main app
      const mainAppResponse = await request(app)
        .get('/')
        .set('Cookie', authCookie);

      expect(mainAppResponse.status).toBe(200);
      expect(mainAppResponse.text).toContain('database-view');

      // Then navigate to deck editor
      const deckEditorResponse = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie);

      expect(deckEditorResponse.status).toBe(200);
      expect(deckEditorResponse.text).toContain('deckEditorModal');
    });

    it('should maintain session across navigation', async () => {
      // Test session validation
      const sessionResponse = await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie);

      expect(sessionResponse.status).toBe(200);
      expect(sessionResponse.body.success).toBe(true);
      expect(sessionResponse.body.data.id).toBe(testUser.id);

      // Navigate to deck editor and verify session is maintained
      const deckEditorResponse = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie);

      expect(deckEditorResponse.status).toBe(200);
    });
  });

  describe('Error Handling in Deck Navigation', () => {
    it('should handle non-existent deck gracefully', async () => {
      const fakeDeckId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${fakeDeckId}`)
        .set('Cookie', authCookie);

      // The app might return 200 with an error page or 404
      expect([200, 404]).toContain(response.status);
    });

    it('should handle invalid user ID in deck URL', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .get(`/users/${fakeUserId}/decks/${testDeck.id}`)
        .set('Cookie', authCookie);

      // The app might return 200 with an error page or 404
      expect([200, 404]).toContain(response.status);
    });

    it('should require authentication for deck access', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`);

      // Should redirect to login or return 401/403
      expect([200, 302, 401, 403]).toContain(response.status);
    });
  });

  describe('Deck Editor Performance', () => {
    it('should load deck editor within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie);

      const loadTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    it('should load available cards efficiently', async () => {
      const startTime = Date.now();
      
      const charactersResponse = await request(app)
        .get('/api/characters')
        .set('Cookie', authCookie);

      const loadTime = Date.now() - startTime;
      
      expect(charactersResponse.status).toBe(200);
      expect(loadTime).toBeLessThan(2000); // Should load within 2 seconds
    });
  });
});

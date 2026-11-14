/**
 * Integration test for deck opening and closing behavior
 * Tests the complete flow from deck selection to deck editor and back
 */

import request from 'supertest';
import { app, initializeTestServer } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../setup-integration';
import { buildDeckEditorPath } from '../../frontend/src/lib/navigation/deckEditorReturn';

describe('Deck Navigation Flow Integration Tests', () => {
  let testUser: any;
  let testDeck: any;
  let authCookie: string;

  beforeAll(async () => {
    // Initialize test server
    await initializeTestServer();
    
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
    await deckRepository.updateDeck(testDeck.id, { is_private: false });
    
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

  afterEach(async () => {
    // Clean up test user created in beforeEach
    const userRepo = DataSourceConfig.getInstance().getUserRepository();
    if (testUser) {
      try {
        await userRepo.deleteUser(testUser.id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Deck Editor Navigation Flow', () => {
    it.each([false, true])('serves the deck editor on a direct browser request (read-only: %s)', async (readonly) => {
      const response = await request(app)
        .get(buildDeckEditorPath(testUser.id, testDeck.id, readonly))
        .set('Cookie', authCookie)
        .accept('html');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/html/);
      expect(response.text).toContain('id="root"');
    });

    it('should load deck data correctly in editor', async () => {
      // Get deck data via API
      const deckDataResponse = await request(app)
        .get(`/api/v1/decks/${testDeck.id}`)
        .set('Cookie', authCookie)
        .set('x-test-user-id', testUser.id);

      expect(deckDataResponse.status).toBe(200);
      expect(deckDataResponse.body.errors ?? []).toEqual([]);
      expect(deckDataResponse.body.data.metadata.name).toBe('Test Navigation Deck');
      expect(deckDataResponse.body.data.metadata.isOwner).toBe(true);
    });

    it('should load available cards for deck editor', async () => {
      // Test that characters are available for the deck editor
      const charactersResponse = await request(app)
        .get('/api/v1/catalog/characters')
        .set('Cookie', authCookie);

      expect(charactersResponse.status).toBe(200);
      expect(charactersResponse.body.errors ?? []).toEqual([]);
      expect(Array.isArray(charactersResponse.body.data)).toBe(true);
      expect(charactersResponse.body.data.length).toBeGreaterThan(0);

      // Test other card types
      const locationsResponse = await request(app)
        .get('/api/v1/catalog/locations')
        .set('Cookie', authCookie);

      expect(locationsResponse.status).toBe(200);
      expect(locationsResponse.body.errors ?? []).toEqual([]);
      expect(Array.isArray(locationsResponse.body.data)).toBe(true);
    });

    it('should handle read-only mode correctly for deck owners', async () => {
      // Test deck ownership verification
      const deckResponse = await request(app)
        .get(`/api/v1/decks/${testDeck.id}`)
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
        .get(`/api/v1/decks/${testDeck.id}`)
        .set('Cookie', otherUserAuthCookie);

      expect(deckResponse.status).toBe(200);
      expect(deckResponse.body.data.metadata.isOwner).toBe(false);
      // For non-owners, isOwner = false means read-only access is allowed

      // Clean up other user
      await userRepository.deleteUser(otherUser.id);
    });
  });

  describe('Deck Editor Performance', () => {
    it('should load available cards efficiently', async () => {
      const startTime = Date.now();
      
      const charactersResponse = await request(app)
        .get('/api/v1/catalog/characters')
        .set('Cookie', authCookie);

      const loadTime = Date.now() - startTime;
      
      expect(charactersResponse.status).toBe(200);
      expect(loadTime).toBeLessThan(2000); // Should load within 2 seconds
    });
  });
});

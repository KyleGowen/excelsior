/**
 * Basic integration tests for deck editor search bar responsive behavior
 * Tests that the page loads and contains the necessary elements
 */

import { app } from '../../src/test-server';
import { integrationTestUtils } from '../setup-integration';
import request from 'supertest';

describe('Deck Editor Search Bar Basic Integration', () => {
  let testUser: any;
  let testDeck: any;
  let authCookie: string;

  beforeAll(async () => {
    // Create test user
    testUser = await integrationTestUtils.createTestUser({
      name: 'SearchBarBasicTestUser',
      email: 'searchbarbasic@example.com',
      role: 'USER'
    });

    // Login to get auth cookie
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: 'password123' });
    
    authCookie = loginResponse.headers['set-cookie'][0];

    // Create test deck
    const deckResponse = await request(app)
      .post('/api/decks')
      .set('Cookie', authCookie)
      .send({
        name: 'Search Bar Basic Test Deck',
        description: 'A deck for testing search bar basic functionality'
      });

    testDeck = deckResponse.body.data;
    integrationTestUtils.trackTestDeck(testDeck.id);
  });

  afterAll(async () => {
    // Cleanup is handled by integrationTestUtils
  });

  describe('Deck Editor Page Load', () => {
    it('should load deck editor page successfully', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.text).toContain('deck-editor-modal');
      expect(response.text).toContain('deckEditorSearchInput');
      expect(response.text).toContain('card-selector-pane');
    });

    it('should include search bar elements', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie)
        .expect(200);

      // Check for search bar HTML structure
      expect(response.text).toContain('deck-editor-search-container');
      expect(response.text).toContain('deck-editor-search-input');
      expect(response.text).toContain('Search by card name, character, or type...');
    });
  });

  describe('Layout Structure', () => {
    it('should have proper layout structure', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie)
        .expect(200);

      // Check for layout structure
      expect(response.text).toContain('deck-editor-layout');
      expect(response.text).toContain('deck-pane');
      expect(response.text).toContain('card-selector-pane');
      expect(response.text).toContain('resizable-divider');
    });

    it('should have search bar in card selector pane', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie)
        .expect(200);

      // Verify search bar is in card selector pane
      const searchContainerIndex = response.text.indexOf('deck-editor-search-container');
      const cardSelectorIndex = response.text.indexOf('card-selector-pane');
      expect(searchContainerIndex).toBeGreaterThan(cardSelectorIndex);
    });
  });

  describe('Search Functionality', () => {
    it('should include search-related JavaScript', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie)
        .expect(200);

      // Check for search-related JavaScript (handleDeckEditorSearch lives in deck-editor-search-inline.js)
      expect(response.text).toContain('deckEditorSearchInput');
      expect(response.text).toContain('deck-editor-search-inline.js');
    });

    it('should include search results container', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.text).toContain('deckEditorSearchResults');
      expect(response.text).toContain('deck-editor-search-results');
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility attributes', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}/decks/${testDeck.id}`)
        .set('Cookie', authCookie)
        .expect(200);

      // Check for accessibility attributes
      expect(response.text).toContain('placeholder="Search by card name, character, or type..."');
      expect(response.text).toContain('id="deckEditorSearchInput"');
      expect(response.text).toContain('type="text"');
    });
  });
});

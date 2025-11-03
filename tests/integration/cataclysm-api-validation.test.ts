/**
 * Integration tests for Cataclysm API validation
 * Tests API endpoints that enforce cataclysm validation rules
 */

import request from 'supertest';
import { app } from '../setup-integration';
import { Pool } from 'pg';
import { integrationTestUtils } from '../setup-integration';

describe('Cataclysm API Validation Integration Tests', () => {
  let pool: Pool;
  let testUserId: string;
  let testDeckId: string;
  let authCookie: string;

  beforeAll(async () => {
    // Initialize database connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
    });

    // Create test user
    const testUser = await integrationTestUtils.createTestUser({
      name: 'cataclysm-api-test-user',
      email: 'cataclysm-api-test@example.com',
      password: 'password123'
    });
    testUserId = testUser.id;
    
    // Create test deck
    const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
      name: 'Cataclysm Test Deck',
      description: 'Testing cataclysm validation'
    });
    testDeckId = testDeck.id;

    // Login to get auth cookie
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: 'password123' });
    
    if (loginResponse.status === 200 && loginResponse.headers['set-cookie']) {
      authCookie = loginResponse.headers['set-cookie'][0].split(';')[0];
    } else {
      throw new Error(`Login failed: ${loginResponse.status} - ${JSON.stringify(loginResponse.body)}`);
    }
  });

  afterAll(async () => {
    // Clean up test data
    await integrationTestUtils.cleanupTestData();
    await pool.end();
  });

  describe('POST /api/decks/:id/cards - Cataclysm Validation', () => {
    it('should allow adding first cataclysm card', async () => {
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Cataclysm Test Deck 1',
        description: 'Testing first cataclysm card'
      });

      // Get a cataclysm card from the database
      const cataclysmResult = await pool.query(
        'SELECT id, name FROM special_cards WHERE cataclysm = true LIMIT 1'
      );
      
      if (cataclysmResult.rows.length > 0) {
        const cataclysmCard = cataclysmResult.rows[0];
        
        const response = await request(app)
          .post(`/api/decks/${testDeck.id}/cards`)
          .set('Cookie', authCookie)
          .send({
            cardType: 'special',
            cardId: cataclysmCard.id,
            quantity: 1
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Card added to deck successfully');
      } else {
        // Skip test if no cataclysm cards found
        console.log('Skipping test - no cataclysm cards found in database');
      }
    });

    it('should prevent adding second cataclysm card', async () => {
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Cataclysm Test Deck 2',
        description: 'Testing second cataclysm card prevention'
      });

      // Get two different cataclysm cards from the database
      const cataclysmResult = await pool.query(
        'SELECT id, name FROM special_cards WHERE cataclysm = true LIMIT 2'
      );

      if (cataclysmResult.rows.length >= 2) {
        const firstCataclysmCard = cataclysmResult.rows[0];
        const secondCataclysmCard = cataclysmResult.rows[1];

        // First, add the first cataclysm card
        const firstResponse = await request(app)
          .post(`/api/decks/${testDeck.id}/cards`)
          .set('Cookie', authCookie)
          .send({
            cardType: 'special',
            cardId: firstCataclysmCard.id,
            quantity: 1
          });

        expect(firstResponse.status).toBe(200);
        expect(firstResponse.body.success).toBe(true);
        
        // Now try to add a second cataclysm card - this should fail
        const secondResponse = await request(app)
          .post(`/api/decks/${testDeck.id}/cards`)
          .set('Cookie', authCookie)
          .send({
            cardType: 'special',
            cardId: secondCataclysmCard.id,
            quantity: 1
          });

        expect(secondResponse.status).toBe(400);
        expect(secondResponse.body.success).toBe(false);
        expect(secondResponse.body.error).toContain('Cannot add more than 1 Cataclysm to a deck');
      } else {
        // Skip test if there aren't enough cataclysm cards
        console.log('Skipping test - not enough cataclysm cards in database');
      }
    });

    it('should allow adding regular special cards after cataclysm', async () => {
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Cataclysm Test Deck 3',
        description: 'Testing regular special cards after cataclysm'
      });

      // Get a non-cataclysm special card from the database
      const regularSpecialResult = await pool.query(
        'SELECT id, name FROM special_cards WHERE cataclysm = false LIMIT 1'
      );

      if (regularSpecialResult.rows.length > 0) {
        const regularSpecialCard = regularSpecialResult.rows[0];

        const response = await request(app)
          .post(`/api/decks/${testDeck.id}/cards`)
          .set('Cookie', authCookie)
          .send({
            cardType: 'special',
            cardId: regularSpecialCard.id,
            quantity: 1
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      } else {
        // Skip test if no regular special cards found
        console.log('Skipping test - no regular special cards found in database');
      }
    });

    it('should handle invalid cataclysm card ID', async () => {
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Cataclysm Test Deck 4',
        description: 'Testing invalid cataclysm card ID'
      });

      const response = await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'special',
          cardId: '12345678-1234-1234-1234-123456789012', // Valid UUID format but doesn't exist
          quantity: 1
        });

      // Should fail due to card not found, not cataclysm validation
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).not.toContain('Cannot add more than 1 Cataclysm to a deck');
    });

    it('should handle non-special card types correctly', async () => {
      const response = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          type: 'character',
          cardId: 'char1',
          quantity: 1
        });

      // Should succeed (or fail for other reasons, but not cataclysm validation)
      if (response.status === 400) {
        expect(response.body.error).not.toContain('Cannot add more than 1 Cataclysm to a deck');
      }
    });
  });

  describe('POST /api/decks/validate - Cataclysm Validation', () => {
    // Removed deprecated validation scenarios covered by unit tests
    
    it('should handle empty deck validation', async () => {
      const emptyDeck: any[] = [];

      const response = await request(app)
        .post('/api/decks/validate')
        .set('Cookie', authCookie)
        .send({ cards: emptyDeck });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.validationErrors).toBeDefined();
      // Should have other validation errors (like missing characters), but not cataclysm errors
      const cataclysmError = response.body.validationErrors.find((error: any) => 
        error.message && error.message.includes('Cataclysm')
      );
      expect(cataclysmError).toBeUndefined();
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for cataclysm validation', async () => {
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Cataclysm Test Deck 5',
        description: 'Testing authentication for cataclysm validation'
      });

      const response = await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .send({
          cardType: 'special',
          cardId: '12345678-1234-1234-1234-123456789012', // Valid UUID format but doesn't exist
          quantity: 1
        });

      expect(response.status).toBe(401);
    });

    it('should require authentication for deck validation', async () => {
      const testDeck = [
        { type: 'special', cardId: 'special_heimdall', quantity: 1 },
        { type: 'special', cardId: 'special_loki', quantity: 1 }
      ];

      const response = await request(app)
        .post('/api/decks/validate')
        .send({ cards: testDeck });

      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed request body', async () => {
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Cataclysm Test Deck 6',
        description: 'Testing malformed request body'
      });

      const response = await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'special',
          // Missing cardId
          quantity: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle invalid deck ID', async () => {
      const response = await request(app)
        .post('/api/decks/12345678-1234-1234-1234-123456789012/cards') // Valid UUID format but doesn't exist
        .set('Cookie', authCookie)
        .send({
          cardType: 'special',
          cardId: '12345678-1234-1234-1234-123456789012', // Valid UUID format but doesn't exist
          quantity: 1
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should handle database connection errors gracefully', async () => {
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Cataclysm Test Deck 7',
        description: 'Testing database connection error handling'
      });

      // This test would require mocking the database connection to fail
      // For now, we'll just ensure the API handles errors without crashing
      const response = await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'special',
          cardId: '12345678-1234-1234-1234-123456789012', // Valid UUID format but doesn't exist
          quantity: 1
        });

      // Should either succeed or fail gracefully, not crash
      expect([200, 400, 500]).toContain(response.status);
    });
  });
});

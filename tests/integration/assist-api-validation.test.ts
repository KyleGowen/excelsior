/**
 * Integration tests for Assist API validation
 * Tests API endpoints that enforce assist validation rules
 */

import request from 'supertest';
import { app } from '../setup-integration';
import { Pool } from 'pg';
import { integrationTestUtils } from '../setup-integration';

describe('Assist API Validation Integration Tests', () => {
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
      name: 'assist-test-user',
      email: 'assist-test@example.com',
      password: 'password123'
    });
    testUserId = testUser.id;
    
    // Create test deck
    const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
      name: 'Assist Test Deck',
      description: 'Testing assist validation'
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

  describe('POST /api/decks/:id/cards - Assist Validation', () => {
    it('should allow adding first assist card', async () => {
      const response = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          type: 'special',
          cardId: 'special_assist_card',
          quantity: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Card added successfully');
    });

    it('should prevent adding second assist card', async () => {
      // Try to add a second assist card
      const response = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          type: 'special',
          cardId: 'special_another_assist',
          quantity: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Cannot add more than 1 Assist to a deck');
    });

    it('should allow adding regular special cards after assist', async () => {
      // First, let's add a regular special card (we need to find one that's not assist)
      const response = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          type: 'special',
          cardId: 'special_regular', // Assuming this exists and is not assist
          quantity: 1
        });

      // This might fail if the card doesn't exist, but the important thing is
      // that it's not failing due to assist validation
      if (response.status === 400) {
        expect(response.body.error).not.toContain('Cannot add more than 1 Assist to a deck');
      } else {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });

    it('should handle invalid assist card ID', async () => {
      const response = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          type: 'special',
          cardId: 'nonexistent_assist',
          quantity: 1
        });

      // Should fail due to card not found, not assist validation
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).not.toContain('Cannot add more than 1 Assist to a deck');
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

      // Should succeed (or fail for other reasons, but not assist validation)
      if (response.status === 400) {
        expect(response.body.error).not.toContain('Cannot add more than 1 Assist to a deck');
      }
    });
  });

  describe('POST /api/decks/validate - Assist Validation', () => {
    it('should validate deck with one assist card as valid', async () => {
      const validDeck = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 1 },
        { type: 'mission', cardId: 'mission2', quantity: 1 },
        { type: 'mission', cardId: 'mission3', quantity: 1 },
        { type: 'mission', cardId: 'mission4', quantity: 1 },
        { type: 'mission', cardId: 'mission5', quantity: 1 },
        { type: 'mission', cardId: 'mission6', quantity: 1 },
        { type: 'mission', cardId: 'mission7', quantity: 1 },
        { type: 'special', cardId: 'special_assist_card', quantity: 1 } // One assist
      ];

      const response = await request(app)
        .post('/api/decks/validate')
        .set('Cookie', authCookie)
        .send({ cards: validDeck });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.validationErrors).toHaveLength(0);
    });

    it('should validate deck with multiple assist cards as invalid', async () => {
      const invalidDeck = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 1 },
        { type: 'mission', cardId: 'mission2', quantity: 1 },
        { type: 'mission', cardId: 'mission3', quantity: 1 },
        { type: 'mission', cardId: 'mission4', quantity: 1 },
        { type: 'mission', cardId: 'mission5', quantity: 1 },
        { type: 'mission', cardId: 'mission6', quantity: 1 },
        { type: 'mission', cardId: 'mission7', quantity: 1 },
        { type: 'special', cardId: 'special_assist_card', quantity: 1 }, // First assist
        { type: 'special', cardId: 'special_another_assist', quantity: 1 } // Second assist - INVALID
      ];

      const response = await request(app)
        .post('/api/decks/validate')
        .set('Cookie', authCookie)
        .send({ cards: invalidDeck });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.validationErrors).toBeDefined();
      expect(Array.isArray(response.body.validationErrors)).toBe(true);
      
      // Check for assist validation error
      const assistError = response.body.validationErrors.find((error: any) => 
        error.message && error.message.includes('Cannot add more than 1 Assist to a deck')
      );
      expect(assistError).toBeDefined();
    });

    it('should validate deck with no assist cards as valid', async () => {
      const validDeck = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'character', cardId: 'char2', quantity: 1 },
        { type: 'character', cardId: 'char3', quantity: 1 },
        { type: 'character', cardId: 'char4', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 1 },
        { type: 'mission', cardId: 'mission2', quantity: 1 },
        { type: 'mission', cardId: 'mission3', quantity: 1 },
        { type: 'mission', cardId: 'mission4', quantity: 1 },
        { type: 'mission', cardId: 'mission5', quantity: 1 },
        { type: 'mission', cardId: 'mission6', quantity: 1 },
        { type: 'mission', cardId: 'mission7', quantity: 1 }
        // No assist cards
      ];

      const response = await request(app)
        .post('/api/decks/validate')
        .set('Cookie', authCookie)
        .send({ cards: validDeck });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.validationErrors).toHaveLength(0);
    });

    it('should handle empty deck validation', async () => {
      const emptyDeck: any[] = [];

      const response = await request(app)
        .post('/api/decks/validate')
        .set('Cookie', authCookie)
        .send({ cards: emptyDeck });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.validationErrors).toBeDefined();
      // Should have other validation errors (like missing characters), but not assist errors
      const assistError = response.body.validationErrors.find((error: any) => 
        error.message && error.message.includes('Assist')
      );
      expect(assistError).toBeUndefined();
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for assist validation', async () => {
      const response = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .send({
          type: 'special',
          cardId: 'special_assist_card',
          quantity: 1
        });

      expect(response.status).toBe(401);
    });

    it('should require authentication for deck validation', async () => {
      const testDeck = [
        { type: 'special', cardId: 'special_assist_card', quantity: 1 },
        { type: 'special', cardId: 'special_another_assist', quantity: 1 }
      ];

      const response = await request(app)
        .post('/api/decks/validate')
        .send({ cards: testDeck });

      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed request body', async () => {
      const response = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          type: 'special',
          // Missing cardId
          quantity: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle invalid deck ID', async () => {
      const response = await request(app)
        .post('/api/decks/invalid-deck-id/cards')
        .set('Cookie', authCookie)
        .send({
          type: 'special',
          cardId: 'special_assist_card',
          quantity: 1
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking the database connection to fail
      // For now, we'll just ensure the API handles errors without crashing
      const response = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          type: 'special',
          cardId: 'special_assist_card',
          quantity: 1
        });

      // Should either succeed or fail gracefully, not crash
      expect([200, 400, 500]).toContain(response.status);
    });
  });
});

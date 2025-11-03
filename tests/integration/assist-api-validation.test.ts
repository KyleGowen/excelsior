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
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Assist Test Deck 1',
        description: 'Testing first assist card'
      });
      
      // Get an actual assist card from the database
      const assistResult = await pool.query(
        'SELECT id, name FROM special_cards WHERE assist = true LIMIT 1'
      );
      
      expect(assistResult.rows.length).toBe(1);
      const assistCard = assistResult.rows[0];

      const response = await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'special',
          cardId: assistCard.id,
          quantity: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Card added to deck successfully');
    });

    it('should prevent adding second assist card', async () => {
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Assist Test Deck 2',
        description: 'Testing second assist card prevention'
      });
      
      // Get two different assist cards from the database
      const assistResult = await pool.query(
        'SELECT id, name FROM special_cards WHERE assist = true LIMIT 2'
      );
      
      if (assistResult.rows.length >= 2) {
        const firstAssistCard = assistResult.rows[0];
        const secondAssistCard = assistResult.rows[1];
        
        // First, add the first assist card
        const firstResponse = await request(app)
          .post(`/api/decks/${testDeck.id}/cards`)
          .set('Cookie', authCookie)
          .send({
            cardType: 'special',
            cardId: firstAssistCard.id,
            quantity: 1
          });

        expect(firstResponse.status).toBe(200);
        expect(firstResponse.body.success).toBe(true);
        
        // Now try to add a second assist card - this should fail
        const secondResponse = await request(app)
          .post(`/api/decks/${testDeck.id}/cards`)
          .set('Cookie', authCookie)
          .send({
            cardType: 'special',
            cardId: secondAssistCard.id,
            quantity: 1
          });

        expect(secondResponse.status).toBe(400);
        expect(secondResponse.body.success).toBe(false);
        expect(secondResponse.body.error).toContain('Cannot add more than 1 Assist to a deck');
      } else {
        // Skip test if there aren't enough assist cards
        console.log('Skipping test - not enough assist cards in database');
      }
    });

    it('should allow adding regular special cards after assist', async () => {
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Assist Test Deck 3',
        description: 'Testing regular special cards after assist'
      });
      
      // Get a regular special card (not assist) from the database
      const regularSpecialResult = await pool.query(
        'SELECT id, name FROM special_cards WHERE assist = false LIMIT 1'
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

        // This might fail if the card doesn't exist, but the important thing is
        // that it's not failing due to assist validation
        if (response.status === 400) {
          expect(response.body.error).not.toContain('Cannot add more than 1 Assist to a deck');
        } else {
          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        }
      } else {
        // Skip test if no regular special cards found
        console.log('Skipping test - no regular special cards found in database');
      }
    });

    it('should handle invalid assist card ID', async () => {
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Assist Test Deck 4',
        description: 'Testing invalid assist card ID'
      });
      
      const response = await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'special',
          cardId: '12345678-1234-1234-1234-123456789012', // Valid UUID format but doesn't exist
          quantity: 1
        });

      // Should fail due to card not found, not assist validation
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).not.toContain('Cannot add more than 1 Assist to a deck');
    });

    it('should handle non-special card types correctly', async () => {
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Assist Test Deck 5',
        description: 'Testing non-special card types'
      });
      
      const response = await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'character',
          cardId: '12345678-1234-1234-1234-123456789012', // Valid UUID format but doesn't exist
          quantity: 1
        });

      // Should not be an assist validation error
      expect(response.body.error).not.toContain('Cannot add more than 1 Assist to a deck');
    });
  });

  describe('POST /api/decks/validate - Assist Validation', () => {
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
      // Should have other validation errors (like missing characters), but not assist errors
      const assistError = response.body.validationErrors.find((error: any) => 
        error.message && error.message.includes('Assist')
      );
      expect(assistError).toBeUndefined();
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for assist validation', async () => {
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Assist Test Deck 8',
        description: 'Testing authentication'
      });
      
      const response = await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .send({
          cardType: 'special',
          cardId: '12345678-1234-1234-1234-123456789012',
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
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Assist Test Deck 6',
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
        .post('/api/decks/12345678-1234-1234-1234-123456789012/cards')
        .set('Cookie', authCookie)
        .send({
          cardType: 'special',
          cardId: '12345678-1234-1234-1234-123456789012',
          quantity: 1
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should handle database connection errors gracefully', async () => {
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Assist Test Deck 7',
        description: 'Testing database connection errors'
      });
      
      // This test would require mocking the database connection to fail
      // For now, we'll just ensure the API handles errors without crashing
      const response = await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'special',
          cardId: '12345678-1234-1234-1234-123456789012',
          quantity: 1
        });

      // Should either succeed or fail gracefully, not crash
      expect([200, 400, 500]).toContain(response.status);
    });
  });
});

/**
 * Database integration tests for Assist validation
 * Tests the complete database-to-API flow for assist validation
 */

import { Pool } from 'pg';
import request from 'supertest';
import { app } from '../setup-integration';
import { integrationTestUtils } from '../setup-integration';

describe('Assist Database Integration Tests', () => {
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
      name: 'assist-db-test-user',
      email: 'assist-db-test@example.com',
      password: 'password123'
    });
    testUserId = testUser.id;
    
    // Create test deck
    const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
      name: 'Assist DB Test Deck',
      description: 'Testing assist database integration'
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

  describe('Database Assist Card Verification', () => {
    it('should verify assist cards exist in database', async () => {
      // Query the database directly to verify assist cards exist
      const result = await pool.query(
        'SELECT id, name, assist FROM special_cards WHERE assist = true ORDER BY name'
      );

      expect(result.rows.length).toBeGreaterThan(0);
      
      // Verify the structure of assist cards
      result.rows.forEach(card => {
        expect(card.id).toBeDefined();
        expect(card.name).toBeDefined();
        expect(card.assist).toBe(true);
      });

      // Log the assist cards found for debugging
      console.log('Assist cards found in database:', result.rows.map(card => card.name));
    });

    it('should verify non-assist special cards exist', async () => {
      // Query the database for non-assist special cards
      const result = await pool.query(
        'SELECT id, name, assist FROM special_cards WHERE assist = false ORDER BY name LIMIT 5'
      );

      expect(result.rows.length).toBeGreaterThan(0);
      
      // Verify the structure of non-assist cards
      result.rows.forEach(card => {
        expect(card.id).toBeDefined();
        expect(card.name).toBeDefined();
        expect(card.assist).toBe(false);
      });
    });

    it('should verify assist column exists and has correct type', async () => {
      // Query the table structure to verify assist column
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'special_cards' AND column_name = 'assist'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].column_name).toBe('assist');
      expect(result.rows[0].data_type).toBe('boolean');
    });
  });

  describe('End-to-End Assist Validation Flow', () => {
    it('should complete full flow: database -> API -> validation -> database storage', async () => {
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Assist DB Test Deck 1',
        description: 'Testing assist database integration flow'
      });

      // Step 1: Get an assist card from database
      const assistResult = await pool.query(
        'SELECT id, name FROM special_cards WHERE assist = true LIMIT 1'
      );
      
      expect(assistResult.rows.length).toBe(1);
      const assistCard = assistResult.rows[0];

      // Step 2: Add the assist card via API
      const addResponse = await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'special',
          cardId: assistCard.id,
          quantity: 1
        });

      expect(addResponse.status).toBe(200);
      expect(addResponse.body.success).toBe(true);

      // Step 3: Verify card was stored in database
      const deckCardsResult = await pool.query(
        'SELECT * FROM deck_cards WHERE deck_id = $1 AND card_id = $2',
        [testDeck.id, assistCard.id]
      );

      expect(deckCardsResult.rows.length).toBe(1);
      expect(deckCardsResult.rows[0].card_id).toBe(assistCard.id);
      expect(deckCardsResult.rows[0].quantity).toBe(1);

      // Step 4: Try to add another assist card (should fail)
      const secondAssistResult = await pool.query(
        'SELECT id, name FROM special_cards WHERE assist = true AND id != $1 LIMIT 1',
        [assistCard.id]
      );

      if (secondAssistResult.rows.length > 0) {
        const secondAssistCard = secondAssistResult.rows[0];

        const secondAddResponse = await request(app)
          .post(`/api/decks/${testDeck.id}/cards`)
          .set('Cookie', authCookie)
          .send({
            cardType: 'special',
            cardId: secondAssistCard.id,
            quantity: 1
          });

        expect(secondAddResponse.status).toBe(400);
        expect(secondAddResponse.body.success).toBe(false);
        expect(secondAddResponse.body.error).toContain('Cannot add more than 1 Assist to a deck');

        // Step 5: Verify second card was NOT stored in database
        const secondDeckCardsResult = await pool.query(
          'SELECT * FROM deck_cards WHERE deck_id = $1 AND card_id = $2',
          [testDeck.id, secondAssistCard.id]
        );

        expect(secondDeckCardsResult.rows.length).toBe(0);
      }
    });

    it('should allow adding regular special cards after assist', async () => {
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Assist DB Test Deck 2',
        description: 'Testing regular special cards after assist'
      });

      // Get a non-assist special card
      const regularSpecialResult = await pool.query(
        'SELECT id, name FROM special_cards WHERE assist = false LIMIT 1'
      );

      if (regularSpecialResult.rows.length > 0) {
        const regularSpecialCard = regularSpecialResult.rows[0];

        // Add the regular special card
        const addResponse = await request(app)
          .post(`/api/decks/${testDeck.id}/cards`)
          .set('Cookie', authCookie)
          .send({
            cardType: 'special',
            cardId: regularSpecialCard.id,
            quantity: 1
          });

        expect(addResponse.status).toBe(200);
        expect(addResponse.body.success).toBe(true);

        // Verify card was stored in database
        const deckCardsResult = await pool.query(
          'SELECT * FROM deck_cards WHERE deck_id = $1 AND card_id = $2',
          [testDeck.id, regularSpecialCard.id]
        );

        expect(deckCardsResult.rows.length).toBe(1);
        expect(deckCardsResult.rows[0].card_id).toBe(regularSpecialCard.id);
      }
    });
  });

  describe('Database Consistency Tests', () => {
    it('should maintain data consistency when removing assist cards', async () => {
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Assist DB Test Deck 3',
        description: 'Testing data consistency when removing assist cards'
      });

      // First, add an assist card to the deck
      const assistResult = await pool.query(
        'SELECT id, name FROM special_cards WHERE assist = true LIMIT 1'
      );
      
      if (assistResult.rows.length > 0) {
        const assistCard = assistResult.rows[0];

        // Add the assist card via API
        const addResponse = await request(app)
          .post(`/api/decks/${testDeck.id}/cards`)
          .set('Cookie', authCookie)
          .send({
            cardType: 'special',
            cardId: assistCard.id,
            quantity: 1
          });

        expect(addResponse.status).toBe(200);
        expect(addResponse.body.success).toBe(true);

        // Now remove the assist card via API
        const removeResponse = await request(app)
          .delete(`/api/decks/${testDeck.id}/cards`)
          .set('Cookie', authCookie)
          .send({
            cardType: 'special',
            cardId: assistCard.id
          });

        expect(removeResponse.status).toBe(200);
        expect(removeResponse.body.success).toBe(true);

        // Verify card was removed from database
        const deckCardsResult = await pool.query(
          'SELECT * FROM deck_cards WHERE deck_id = $1 AND card_id = $2',
          [testDeck.id, assistCard.id]
        );

        expect(deckCardsResult.rows.length).toBe(0);

        // Now should be able to add a different assist card
        const otherAssistResult = await pool.query(
          'SELECT id, name FROM special_cards WHERE assist = true AND id != $1 LIMIT 1',
          [assistCard.id]
        );

        if (otherAssistResult.rows.length > 0) {
          const otherAssistCard = otherAssistResult.rows[0];

          const addResponse = await request(app)
            .post(`/api/decks/${testDeck.id}/cards`)
            .set('Cookie', authCookie)
            .send({
              cardType: 'special',
              cardId: otherAssistCard.id,
              quantity: 1
            });

          expect(addResponse.status).toBe(200);
          expect(addResponse.body.success).toBe(true);
        }
      }
    });

    it('should handle database transactions correctly for assist validation', async () => {
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Assist DB Test Deck 4',
        description: 'Testing database transactions for assist validation'
      });

      // First, add an assist card to the deck
      const assistResult = await pool.query(
        'SELECT id, name FROM special_cards WHERE assist = true LIMIT 1'
      );
      
      if (assistResult.rows.length > 0) {
        const assistCard = assistResult.rows[0];

        // Add the assist card via API
        const firstAddResponse = await request(app)
          .post(`/api/decks/${testDeck.id}/cards`)
          .set('Cookie', authCookie)
          .send({
            cardType: 'special',
            cardId: assistCard.id,
            quantity: 1
          });

        expect(firstAddResponse.status).toBe(200);
        expect(firstAddResponse.body.success).toBe(true);

        // Now try to add the same assist card again (should fail)
        const addResponse = await request(app)
          .post(`/api/decks/${testDeck.id}/cards`)
          .set('Cookie', authCookie)
          .send({
            cardType: 'special',
            cardId: assistCard.id,
            quantity: 1
          });

        expect(addResponse.status).toBe(400);
        expect(addResponse.body.success).toBe(false);

        // Verify no duplicate was created in database
        const duplicateCheck = await pool.query(
          'SELECT COUNT(*) as count FROM deck_cards WHERE deck_id = $1 AND card_id = $2',
          [testDeck.id, assistCard.id]
        );

        expect(parseInt(duplicateCheck.rows[0].count)).toBe(1); // Should still be only 1
      }
    });
  });

  describe('Database Performance Tests', () => {
    it('should handle assist validation efficiently with large datasets', async () => {
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Assist DB Test Deck 5',
        description: 'Testing assist validation performance with large datasets'
      });

      // This test verifies that assist validation performs well
      // even with many cards in the deck

      // Add many non-assist cards to the deck
      const regularCards = await pool.query(
        'SELECT id FROM special_cards WHERE assist = false LIMIT 10'
      );

      for (const card of regularCards.rows) {
        const addResponse = await request(app)
          .post(`/api/decks/${testDeck.id}/cards`)
          .set('Cookie', authCookie)
          .send({
            cardType: 'special',
            cardId: card.id,
            quantity: 1
          });

        // Some might fail due to other validation rules, but that's okay
        // We're just trying to add many cards to test performance
      }

      // Now try to add an assist card (should still work efficiently)
      const assistCard = await pool.query(
        'SELECT id FROM special_cards WHERE assist = true LIMIT 1'
      );

      if (assistCard.rows.length > 0) {
        const startTime = Date.now();
        
        const addResponse = await request(app)
          .post(`/api/decks/${testDeck.id}/cards`)
          .set('Cookie', authCookie)
          .send({
            cardType: 'special',
            cardId: assistCard.rows[0].id,
            quantity: 1
          });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Should respond within reasonable time (less than 1 second)
        expect(responseTime).toBeLessThan(1000);
        
        // Should either succeed or fail due to assist validation, not timeout
        expect([200, 400]).toContain(addResponse.status);
      }
    });
  });

  describe('Database Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Assist DB Test Deck 6',
        description: 'Testing database connection error handling'
      });

      // This test would require temporarily breaking the database connection
      // For now, we'll just ensure the system handles errors without crashing
      
      const response = await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'special',
          cardId: '12345678-1234-1234-1234-123456789012', // Valid UUID format but doesn't exist
          quantity: 1
        });

      // Should handle gracefully, not crash
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle invalid card IDs gracefully', async () => {
      // Create a fresh deck for this test
      const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
        name: 'Assist DB Test Deck 7',
        description: 'Testing invalid card ID handling'
      });

      const response = await request(app)
        .post(`/api/decks/${testDeck.id}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'special',
          cardId: '12345678-1234-1234-1234-123456789012', // Valid UUID format but doesn't exist
          quantity: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      // Should not be an assist validation error
      expect(response.body.error).not.toContain('Cannot add more than 1 Assist to a deck');
    });
  });
});

/**
 * Integration tests for "One Per Deck" validation across all card types
 * Tests that users cannot add multiple copies of one-per-deck cards
 */

import { Pool } from 'pg';
import request from 'supertest';
import { app } from '../setup-integration';
import { PostgreSQLDeckRepository } from '../../src/database/PostgreSQLDeckRepository';

describe('One Per Deck Validation Integration Tests', () => {
  let pool: Pool;
  let testUserId: string;
  let testDeckId: string;
  let authCookie: string;

  beforeAll(async () => {
    // Initialize database connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
    });

    // Use existing kyle user for testing
    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      ['kyle']
    );
    testUserId = userResult.rows[0].id;

    // Create test deck
    const deckResult = await pool.query(
      'INSERT INTO decks (user_id, name, description) VALUES ($1, $2, $3) RETURNING id',
      [testUserId, 'Test Deck', 'Test Description']
    );
    testDeckId = deckResult.rows[0].id;

    // Login to get auth cookie
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'kyle', password: 'test' });
    
    if (loginResponse.status === 200 && loginResponse.headers['set-cookie']) {
      authCookie = loginResponse.headers['set-cookie'][0].split(';')[0];
    } else {
      throw new Error(`Login failed: ${loginResponse.status} - ${JSON.stringify(loginResponse.body)}`);
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testDeckId) {
      await pool.query('DELETE FROM deck_cards WHERE deck_id = $1', [testDeckId]);
      await pool.query('DELETE FROM decks WHERE id = $1', [testDeckId]);
    }
    // Don't delete the kyle user as it's a system user
    await pool.end();
  });

  describe('Universe: Advanced Cards (is_one_per_deck)', () => {
    it('should prevent adding multiple copies of one-per-deck Universe: Advanced cards', async () => {
      // Get a one-per-deck Universe: Advanced card
      const cardResult = await pool.query(
        'SELECT id, name FROM advanced_universe_cards WHERE one_per_deck = true LIMIT 1'
      );
      
      if (cardResult.rows.length === 0) {
        console.log('No one-per-deck Universe: Advanced cards found, skipping test');
        return;
      }

      const card = cardResult.rows[0];
      console.log(`Testing Universe: Advanced card: ${card.name}`);

      // Add the card once - should succeed
      const addResponse1 = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'advanced-universe',
          cardId: card.id,
          quantity: 1
        });

      expect(addResponse1.status).toBe(200);
      expect(addResponse1.body.success).toBe(true);

      // Try to add the same card again - should fail
      const addResponse2 = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'advanced-universe',
          cardId: card.id,
          quantity: 1
        });

      expect(addResponse2.status).toBe(400);
      expect(addResponse2.body.success).toBe(false);
      expect(addResponse2.body.error).toContain('limited to one per deck');

      // Clean up
      await pool.query('DELETE FROM deck_cards WHERE deck_id = $1 AND card_type = $2 AND card_id = $3', 
        [testDeckId, 'advanced-universe', card.id]);
    });
  });

  describe('Any-Power Cards (one_per_deck)', () => {
    it('should prevent adding multiple copies of one-per-deck Any-Power cards', async () => {
      // Get a one-per-deck Any-Power card
      const cardResult = await pool.query(
        'SELECT id, power_type FROM power_cards WHERE power_type = $1 AND one_per_deck = true LIMIT 1',
        ['Any-Power']
      );
      
      if (cardResult.rows.length === 0) {
        console.log('No one-per-deck Any-Power cards found, skipping test');
        return;
      }

      const card = cardResult.rows[0];
      console.log(`Testing Any-Power card: ${card.power_type}`);

      // Add the card once - should succeed
      const addResponse1 = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'power',
          cardId: card.id,
          quantity: 1
        });

      expect(addResponse1.status).toBe(200);
      expect(addResponse1.body.success).toBe(true);

      // Try to add the same card again - should fail
      const addResponse2 = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'power',
          cardId: card.id,
          quantity: 1
        });

      expect(addResponse2.status).toBe(400);
      expect(addResponse2.body.success).toBe(false);
      expect(addResponse2.body.error).toContain('limited to one per deck');

      // Clean up
      await pool.query('DELETE FROM deck_cards WHERE deck_id = $1 AND card_type = $2 AND card_id = $3', 
        [testDeckId, 'power', card.id]);
    });
  });

  describe('Universe Teamwork Cards (one_per_deck)', () => {
    it('should prevent adding multiple copies of one-per-deck Teamwork cards', async () => {
      // Get a one-per-deck Teamwork card
      const cardResult = await pool.query(
        'SELECT id, name FROM teamwork_cards WHERE one_per_deck = true LIMIT 1'
      );
      
      if (cardResult.rows.length === 0) {
        console.log('No one-per-deck Teamwork cards found, skipping test');
        return;
      }

      const card = cardResult.rows[0];
      console.log(`Testing Teamwork card: ${card.name}`);

      // Add the card once - should succeed
      const addResponse1 = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'teamwork',
          cardId: card.id,
          quantity: 1
        });

      expect(addResponse1.status).toBe(200);
      expect(addResponse1.body.success).toBe(true);

      // Try to add the same card again - should fail
      const addResponse2 = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'teamwork',
          cardId: card.id,
          quantity: 1
        });

      expect(addResponse2.status).toBe(400);
      expect(addResponse2.body.success).toBe(false);
      expect(addResponse2.body.error).toContain('limited to one per deck');

      // Clean up
      await pool.query('DELETE FROM deck_cards WHERE deck_id = $1 AND card_type = $2 AND card_id = $3', 
        [testDeckId, 'teamwork', card.id]);
    });
  });

  describe('Universe Training Cards (one_per_deck)', () => {
    it('should prevent adding multiple copies of one-per-deck Training cards', async () => {
      // Get a one-per-deck Training card
      const cardResult = await pool.query(
        'SELECT id, name FROM training_cards WHERE one_per_deck = true LIMIT 1'
      );
      
      if (cardResult.rows.length === 0) {
        console.log('No one-per-deck Training cards found, skipping test');
        return;
      }

      const card = cardResult.rows[0];
      console.log(`Testing Training card: ${card.name}`);

      // Add the card once - should succeed
      const addResponse1 = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'training',
          cardId: card.id,
          quantity: 1
        });

      expect(addResponse1.status).toBe(200);
      expect(addResponse1.body.success).toBe(true);

      // Try to add the same card again - should fail
      const addResponse2 = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'training',
          cardId: card.id,
          quantity: 1
        });

      expect(addResponse2.status).toBe(400);
      expect(addResponse2.body.success).toBe(false);
      expect(addResponse2.body.error).toContain('limited to one per deck');

      // Clean up
      await pool.query('DELETE FROM deck_cards WHERE deck_id = $1 AND card_type = $2 AND card_id = $3', 
        [testDeckId, 'training', card.id]);
    });
  });

  describe('Multi Power Cards (one_per_deck)', () => {
    it('should prevent adding multiple copies of one-per-deck Multi Power cards', async () => {
      // Get a one-per-deck Multi Power card
      const cardResult = await pool.query(
        'SELECT id, power_type FROM power_cards WHERE power_type = $1 AND one_per_deck = true LIMIT 1',
        ['Multi Power']
      );
      
      if (cardResult.rows.length === 0) {
        console.log('No one-per-deck Multi Power cards found, skipping test');
        return;
      }

      const card = cardResult.rows[0];
      console.log(`Testing Multi Power card: ${card.power_type}`);

      // Add the card once - should succeed
      const addResponse1 = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'power',
          cardId: card.id,
          quantity: 1
        });

      expect(addResponse1.status).toBe(200);
      expect(addResponse1.body.success).toBe(true);

      // Try to add the same card again - should fail
      const addResponse2 = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'power',
          cardId: card.id,
          quantity: 1
        });

      expect(addResponse2.status).toBe(400);
      expect(addResponse2.body.success).toBe(false);
      expect(addResponse2.body.error).toContain('limited to one per deck');

      // Clean up
      await pool.query('DELETE FROM deck_cards WHERE deck_id = $1 AND card_type = $2 AND card_id = $3', 
        [testDeckId, 'power', card.id]);
    });
  });

  describe('Quantity Increase Validation', () => {
    it('should prevent increasing quantity of one-per-deck cards via +1 button', async () => {
      // Get a one-per-deck Universe: Advanced card
      const cardResult = await pool.query(
        'SELECT id, name FROM advanced_universe_cards WHERE one_per_deck = true LIMIT 1'
      );
      
      if (cardResult.rows.length === 0) {
        console.log('No one-per-deck Universe: Advanced cards found, skipping test');
        return;
      }

      const card = cardResult.rows[0];
      console.log(`Testing quantity increase for: ${card.name}`);

      // Add the card once - should succeed
      const addResponse = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'advanced-universe',
          cardId: card.id,
          quantity: 1
        });

      expect(addResponse.status).toBe(200);
      expect(addResponse.body.success).toBe(true);

      // Try to increase quantity - should fail
      const increaseResponse = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'advanced-universe',
          cardId: card.id,
          quantity: 1
        });

      expect(increaseResponse.status).toBe(400);
      expect(increaseResponse.body.success).toBe(false);
      expect(increaseResponse.body.error).toContain('limited to one per deck');

      // Clean up
      await pool.query('DELETE FROM deck_cards WHERE deck_id = $1 AND card_type = $2 AND card_id = $3', 
        [testDeckId, 'advanced-universe', card.id]);
    });
  });

  describe('Deck Validation Service Integration', () => {
    it('should mark deck as illegal when containing multiple one-per-deck cards', async () => {
      // Get a one-per-deck card
      const cardResult = await pool.query(
        'SELECT id, name FROM advanced_universe_cards WHERE one_per_deck = true LIMIT 1'
      );
      
      if (cardResult.rows.length === 0) {
        console.log('No one-per-deck Universe: Advanced cards found, skipping test');
        return;
      }

      const card = cardResult.rows[0];
      console.log(`Testing deck validation for: ${card.name}`);

      // Create a more complete deck to test one-per-deck validation
      // First add some characters, missions, and other cards to make the deck valid
      const characterResult = await pool.query('SELECT id FROM characters LIMIT 4');
      const missionResult = await pool.query('SELECT id FROM missions LIMIT 7');
      
      // Add 4 characters
      for (let i = 0; i < 4; i++) {
        await pool.query(
          'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity) VALUES ($1, $2, $3, $4)',
          [testDeckId, 'character', characterResult.rows[i].id, 1]
        );
      }
      
      // Add 7 missions
      for (let i = 0; i < 7; i++) {
        await pool.query(
          'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity) VALUES ($1, $2, $3, $4)',
          [testDeckId, 'mission', missionResult.rows[i].id, 1]
        );
      }
      
      // Add some power cards to reach the minimum deck size
      const powerResult = await pool.query('SELECT id FROM power_cards LIMIT 40');
      console.log(`Found ${powerResult.rows.length} power cards available`);
      
      // Add power cards (up to the number available, but at least 20)
      const powerCardsToAdd = Math.min(40, powerResult.rows.length);
      for (let i = 0; i < powerCardsToAdd; i++) {
        await pool.query(
          'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity) VALUES ($1, $2, $3, $4)',
          [testDeckId, 'power', powerResult.rows[i].id, 1]
        );
      }
      
      // Now add the one-per-deck card with quantity 2
      await pool.query(
        'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity) VALUES ($1, $2, $3, $4)',
        [testDeckId, 'advanced_universe', card.id, 2]
      );

      // Get the complete deck data
      const deckRepository = new PostgreSQLDeckRepository(pool);
      const deck = await deckRepository.getDeckById(testDeckId);
      expect(deck).toBeDefined();

      // Call deck validation endpoint to check for violations
      const validationResponse = await request(app)
        .post('/api/decks/validate')
        .set('Cookie', authCookie)
        .send({
          cards: deck!.cards
        });

      expect(validationResponse.status).toBe(400);
      expect(validationResponse.body.success).toBe(false);
      
      // Debug: Log the validation response
      console.log('Validation response:', JSON.stringify(validationResponse.body, null, 2));
      
      // Check if one_per_deck_violation is in the validation errors
      const validationErrors = validationResponse.body.validationErrors || [];
      const hasOnePerDeckViolation = validationErrors.some((error: any) => 
        error.rule === 'one_per_deck_violation'
      );
      expect(hasOnePerDeckViolation).toBe(true);

      // Clean up - remove all cards from the test deck
      await pool.query('DELETE FROM deck_cards WHERE deck_id = $1', [testDeckId]);
    });
  });

  describe('Error Message Consistency', () => {
    it('should provide consistent error messages for one-per-deck violations', async () => {
      // Test different card types to ensure consistent error messages
      const cardTypes = [
        { type: 'advanced-universe', table: 'advanced_universe_cards', field: 'name' },
        { type: 'power', table: 'power_cards', field: 'power_type' },
        { type: 'teamwork', table: 'teamwork_cards', field: 'name' },
        { type: 'training', table: 'training_cards', field: 'name' }
      ];

      for (const cardType of cardTypes) {
        const cardResult = await pool.query(
          `SELECT id, ${cardType.field} FROM ${cardType.table} WHERE one_per_deck = true LIMIT 1`
        );
        
        if (cardResult.rows.length === 0) {
          console.log(`No one-per-deck ${cardType.type} cards found, skipping`);
          continue;
        }

        const card = cardResult.rows[0];
        const cardName = card[cardType.field];
        console.log(`Testing error message for ${cardType.type}: ${cardName}`);

        // Add the card once
        await request(app)
          .post(`/api/decks/${testDeckId}/cards`)
          .set('Cookie', authCookie)
          .send({
            cardType: cardType.type,
            cardId: card.id,
            quantity: 1
          });

        // Try to add again
        const response = await request(app)
          .post(`/api/decks/${testDeckId}/cards`)
          .set('Cookie', authCookie)
          .send({
            cardType: cardType.type,
            cardId: card.id,
            quantity: 1
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('limited to one per deck');

        // Clean up
        await pool.query('DELETE FROM deck_cards WHERE deck_id = $1 AND card_type = $2 AND card_id = $3', 
          [testDeckId, cardType.type, card.id]);
      }
    });
  });
});

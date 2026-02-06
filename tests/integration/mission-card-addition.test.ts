/**
 * Mission Card Addition Integration Tests
 * 
 * Tests to verify that mission cards can be added to decks correctly.
 * This specifically tests the fix where mission cards were failing due to
 * incorrect table name (mission_objectives vs missions).
 */

import { Pool } from 'pg';
import request from 'supertest';
import { app, integrationTestUtils } from '../setup-integration';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { PostgreSQLDeckRepository } from '../../src/database/PostgreSQLDeckRepository';

describe('Mission Card Addition Integration Tests', () => {
  let pool: Pool;
  let testUserId: string;
  let testDeckId: string;
  let authCookie: string;
  let deckRepository: PostgreSQLDeckRepository;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
    });

    // Get deck repository
    const dataSource = DataSourceConfig.getInstance();
    deckRepository = dataSource.getDeckRepository() as PostgreSQLDeckRepository;

    // Ensure test users exist
    await integrationTestUtils.ensureAdminUser();
  });

  beforeEach(async () => {
    // Create a test user for each test
    const testUser = await integrationTestUtils.createTestUser({
      name: 'mission-test-user',
      email: 'mission-test@example.com',
      password: 'password123'
    });
    testUserId = testUser.id;

    // Create a test deck
    const testDeck = await integrationTestUtils.createTestDeck(testUserId, {
      name: 'Mission Card Test Deck',
      description: 'Testing mission card addition'
    });
    testDeckId = testDeck.id;

    // Get authentication cookie
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: 'password123' });
    
    if (loginResponse.status === 200 && loginResponse.headers['set-cookie']) {
      authCookie = loginResponse.headers['set-cookie'][0].split(';')[0];
    } else {
      throw new Error(`Login failed: ${loginResponse.status} - ${JSON.stringify(loginResponse.body)}`);
    }
  });

  afterEach(async () => {
    // Clean up test data
    if (testDeckId) {
      integrationTestUtils.trackTestDeck(testDeckId);
    }
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Database Table Verification', () => {
    it('should verify missions table exists and has data', async () => {
      const result = await pool.query('SELECT COUNT(*) as count FROM missions');
      
      expect(result.rows.length).toBe(1);
      expect(parseInt(result.rows[0].count)).toBeGreaterThan(0);
    });

    it('should verify mission_objectives table does not exist', async () => {
      // This should throw an error if the table doesn't exist
      await expect(
        pool.query('SELECT COUNT(*) FROM mission_objectives')
      ).rejects.toThrow();
    });

    it('should retrieve a mission card from the missions table', async () => {
      const result = await pool.query('SELECT id, name FROM missions LIMIT 1');
      
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].id).toBeDefined();
      expect(result.rows[0].name).toBeDefined();
    });
  });

  describe('Repository Level - addCardToDeck', () => {
    it('should successfully add a mission card to a deck using the correct table', async () => {
      // Get a mission card from the database
      const missionResult = await pool.query('SELECT id, name FROM missions LIMIT 1');
      expect(missionResult.rows.length).toBe(1);
      const missionCard = missionResult.rows[0];

      // Add the mission card to the deck
      const success = await deckRepository.addCardToDeck(
        testDeckId,
        'mission',
        missionCard.id,
        1
      );

      expect(success).toBe(true);

      // Verify the card was added to the deck_cards table
      const deckCardsResult = await pool.query(
        'SELECT * FROM deck_cards WHERE deck_id = $1 AND card_type = $2 AND card_id = $3',
        [testDeckId, 'mission', missionCard.id]
      );

      expect(deckCardsResult.rows.length).toBe(1);
      expect(deckCardsResult.rows[0].card_id).toBe(missionCard.id);
      expect(deckCardsResult.rows[0].card_type).toBe('mission');
      expect(deckCardsResult.rows[0].quantity).toBe(1);
    });

    it('should fail when trying to add a non-existent mission card', async () => {
      const success = await deckRepository.addCardToDeck(
        testDeckId,
        'mission',
        'non-existent-mission-id',
        1
      );

      expect(success).toBe(false);
    });

    it('should increment quantity when adding the same mission card twice', async () => {
      // Get a mission card from the database
      const missionResult = await pool.query('SELECT id FROM missions LIMIT 1');
      const missionCardId = missionResult.rows[0].id;

      // Add the mission card twice
      const success1 = await deckRepository.addCardToDeck(
        testDeckId,
        'mission',
        missionCardId,
        1
      );
      expect(success1).toBe(true);

      const success2 = await deckRepository.addCardToDeck(
        testDeckId,
        'mission',
        missionCardId,
        1
      );
      expect(success2).toBe(true);

      // Verify the quantity was incremented
      const deckCardsResult = await pool.query(
        'SELECT quantity FROM deck_cards WHERE deck_id = $1 AND card_type = $2 AND card_id = $3',
        [testDeckId, 'mission', missionCardId]
      );

      expect(deckCardsResult.rows.length).toBe(1);
      expect(deckCardsResult.rows[0].quantity).toBe(2);
    });
  });

  describe('API Endpoint - POST /api/decks/:id/cards', () => {
    it('should successfully add a mission card via API endpoint', async () => {
      // Get a mission card from the database
      const missionResult = await pool.query('SELECT id, name FROM missions LIMIT 1');
      expect(missionResult.rows.length).toBe(1);
      const missionCard = missionResult.rows[0];

      // Add the mission card via API
      const response = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'mission',
          cardId: missionCard.id,
          quantity: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify the card was stored in the database
      const deckCardsResult = await pool.query(
        'SELECT * FROM deck_cards WHERE deck_id = $1 AND card_type = $2 AND card_id = $3',
        [testDeckId, 'mission', missionCard.id]
      );

      expect(deckCardsResult.rows.length).toBe(1);
      expect(deckCardsResult.rows[0].card_id).toBe(missionCard.id);
      expect(deckCardsResult.rows[0].card_type).toBe('mission');
      expect(deckCardsResult.rows[0].quantity).toBe(1);
    });

    it('should return 400 when trying to add a non-existent mission card via API', async () => {
      const response = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'mission',
          cardId: 'non-existent-mission-id',
          quantity: 1
        });

      // Should return 400 because the deck repository returns false when card doesn't exist
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should add multiple different mission cards to a deck', async () => {
      // Get multiple mission cards from the database
      const missionsResult = await pool.query('SELECT id FROM missions LIMIT 3');
      expect(missionsResult.rows.length).toBeGreaterThanOrEqual(1);

      // Add each mission card
      for (const mission of missionsResult.rows) {
        const response = await request(app)
          .post(`/api/decks/${testDeckId}/cards`)
          .set('Cookie', authCookie)
          .send({
            cardType: 'mission',
            cardId: mission.id,
            quantity: 1
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }

      // Verify all mission cards are in the deck
      const deckCardsResult = await pool.query(
        'SELECT COUNT(*) as count FROM deck_cards WHERE deck_id = $1 AND card_type = $2',
        [testDeckId, 'mission']
      );

      expect(parseInt(deckCardsResult.rows[0].count)).toBe(missionsResult.rows.length);
    });

    it('should handle mission card addition with quantity > 1', async () => {
      // Get a mission card from the database
      const missionResult = await pool.query('SELECT id FROM missions LIMIT 1');
      const missionCardId = missionResult.rows[0].id;

      // Add the mission card with quantity 2
      const response = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'mission',
          cardId: missionCardId,
          quantity: 2
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify the quantity was set correctly
      const deckCardsResult = await pool.query(
        'SELECT quantity FROM deck_cards WHERE deck_id = $1 AND card_type = $2 AND card_id = $3',
        [testDeckId, 'mission', missionCardId]
      );

      expect(deckCardsResult.rows.length).toBe(1);
      expect(deckCardsResult.rows[0].quantity).toBe(2);
    });
  });

  describe('End-to-End Flow - Database View to Deck', () => {
    it('should complete full flow: get mission from database -> add to deck via API -> verify in deck', async () => {
      // Step 1: Get a mission card from the database (simulating database view)
      const missionResult = await pool.query(
        'SELECT id, name, mission_set FROM missions LIMIT 1'
      );
      expect(missionResult.rows.length).toBe(1);
      const missionCard = missionResult.rows[0];

      // Step 2: Add the mission card to deck via API (simulating "Add to Deck" button click)
      const response = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'mission',
          cardId: missionCard.id,
          quantity: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Step 3: Verify the mission card is in the deck
      const deck = await deckRepository.getDeckById(testDeckId);
      expect(deck).toBeDefined();
      expect(deck?.cards).toBeDefined();

      const missionInDeck = deck?.cards?.find(
        card => card.type === 'mission' && card.cardId === missionCard.id
      );

      expect(missionInDeck).toBeDefined();
      expect(missionInDeck?.quantity).toBe(1);
    });

    it('should handle the scenario that was previously failing (404 error)', async () => {
      // This test specifically verifies the fix for the bug where mission cards
      // were returning 404 because the code was querying mission_objectives instead of missions

      // Get a mission card
      const missionResult = await pool.query('SELECT id, name FROM missions LIMIT 1');
      expect(missionResult.rows.length).toBe(1);
      const missionCard = missionResult.rows[0];

      // Verify the mission exists in the missions table (not mission_objectives)
      const verifyResult = await pool.query(
        'SELECT id FROM missions WHERE id = $1',
        [missionCard.id]
      );
      expect(verifyResult.rows.length).toBe(1);

      // Add the mission card - this should NOT return 404
      const response = await request(app)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cardType: 'mission',
          cardId: missionCard.id,
          quantity: 1
        });

      // Should succeed, not return 404
      expect(response.status).not.toBe(404);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});


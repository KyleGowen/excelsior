/**
 * Integration test: Location alternate art persistence
 *
 * Verifies that:
 * 1. Alternate location rows exist (migration V218)
 * 2. Adding alternate location to deck persists card_id to deck_cards
 * 3. Trigger updates decks.location_id
 * 4. Deck load returns correct location cardId and image path
 * 5. Deck list (getDecksByUserId) returns correct defaultImage for alternate
 */

import request from 'supertest';
import { Pool } from 'pg';
import { app, initializeTestServer } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../setup-integration';

describe('Location Alternate Art Persistence Integration Tests', () => {
  let server: any;
  let pool: Pool;

  beforeAll(async () => {
    const { server: initializedServer } = await initializeTestServer();
    server = initializedServer;
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('V218 Migration - Alternate location rows', () => {
    it('should have alternate location rows for 221-B Baker St.', async () => {
      const result = await pool.query(
        "SELECT id, name, image_path FROM locations WHERE name = '221-B Baker St.' ORDER BY image_path"
      );
      expect(result.rows.length).toBeGreaterThanOrEqual(2);
      const alternateRow = result.rows.find((r: any) => r.image_path && r.image_path.includes('alternate/'));
      expect(alternateRow).toBeTruthy();
      expect(alternateRow!.image_path).toContain('alternate/221_b_baker_st');
    });

    it('should have alternate location rows for Asclepieion', async () => {
      const result = await pool.query(
        "SELECT id, name, image_path FROM locations WHERE name = 'Asclepieion'"
      );
      expect(result.rows.length).toBeGreaterThanOrEqual(2);
      const alternateRow = result.rows.find((r: any) => r.image_path && r.image_path.includes('alternate/'));
      expect(alternateRow).toBeTruthy();
    });
  });

  describe('Location alternate art persistence flow', () => {
    let testUser: any;
    let testDeckId: string;
    let authCookie: string;
    let alternateLocationId: string;

    beforeAll(async () => {
      await integrationTestUtils.ensureGuestUser();
    });

    beforeEach(async () => {
      testUser = await integrationTestUtils.createTestUser({
        name: 'loc_alt_test',
        email: 'loc_alt_test@example.com',
        password: 'password123',
        role: 'USER'
      });

      const userRepository = DataSourceConfig.getInstance().getUserRepository();
      const deckRepository = DataSourceConfig.getInstance().getDeckRepository();

      const deck = await deckRepository.createDeck(
        testUser.id,
        'Location Alternate Art Test Deck',
        'Deck for testing location alternate art persistence'
      );
      testDeckId = deck.id;
      integrationTestUtils.trackTestDeck(testDeckId);

      const locationsResult = await pool.query(
        "SELECT id, name, image_path FROM locations WHERE name = '221-B Baker St.' AND image_path LIKE '%alternate%' LIMIT 1"
      );
      expect(locationsResult.rows.length).toBeGreaterThan(0);
      alternateLocationId = locationsResult.rows[0].id;

      const loginResponse = await request(server)
        .post('/api/auth/login')
        .send({ username: testUser.username, password: 'password123' });
      expect(loginResponse.status).toBe(200);
      authCookie = loginResponse.headers['set-cookie']![0].split(';')[0];
    });

    afterEach(async () => {
      const userRepo = DataSourceConfig.getInstance().getUserRepository();
      if (testUser) {
        try {
          await userRepo.deleteUser(testUser.id);
        } catch {
          // Ignore
        }
      }
    });

    it('should persist alternate location and load correct cardId from deck', async () => {
      const addResponse = await request(server)
        .post(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({ cardId: alternateLocationId, cardType: 'location', quantity: 1 });

      expect(addResponse.status).toBe(200);
      expect(addResponse.body.success).toBe(true);

      const deckResponse = await request(server)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', authCookie);

      expect(deckResponse.status).toBe(200);
      expect(deckResponse.body.success).toBe(true);

      const locationCard = deckResponse.body.data.cards.find((c: any) => c.type === 'location');
      expect(locationCard).toBeTruthy();
      expect(locationCard.cardId).toBe(alternateLocationId);
    });

    it('should persist alternate location via PUT cards and load correct cardId', async () => {
      const putResponse = await request(server)
        .put(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cards: [{ cardType: 'location', cardId: alternateLocationId, quantity: 1 }]
        });

      expect(putResponse.status).toBe(200);
      expect(putResponse.body.success).toBe(true);

      const deckResponse = await request(server)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', authCookie);

      expect(deckResponse.status).toBe(200);
      const locationCard = deckResponse.body.data.cards.find((c: any) => c.type === 'location');
      expect(locationCard).toBeTruthy();
      expect(locationCard.cardId).toBe(alternateLocationId);
    });

    it('should have decks.location_id updated by trigger for alternate location', async () => {
      await request(server)
        .put(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cards: [{ cardType: 'location', cardId: alternateLocationId, quantity: 1 }]
        });

      const decksResult = await pool.query(
        'SELECT location_id FROM decks WHERE id = $1',
        [testDeckId]
      );
      expect(decksResult.rows.length).toBe(1);
      expect(decksResult.rows[0].location_id).toBe(alternateLocationId);
    });

    it('should return correct defaultImage for alternate in deck list', async () => {
      await request(server)
        .put(`/api/decks/${testDeckId}/cards`)
        .set('Cookie', authCookie)
        .send({
          cards: [{ cardType: 'location', cardId: alternateLocationId, quantity: 1 }]
        });

      const decksResponse = await request(server)
        .get('/api/decks')
        .set('Cookie', authCookie);

      expect(decksResponse.status).toBe(200);
      const deck = decksResponse.body.data?.find((d: any) => d.metadata?.id === testDeckId);
      expect(deck).toBeTruthy();

      const locationCard = deck.cards?.find((c: any) => c.type === 'location');
      expect(locationCard).toBeTruthy();
      expect(locationCard.defaultImage).toContain('alternate/');
      expect(locationCard.defaultImage).toContain('221_b_baker_st');
    });
  });
});

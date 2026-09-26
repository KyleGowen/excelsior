/**
 * Simple integration tests for deck save security (PUT /api/v1/decks/:id/cards).
 * Uses the test server from setup-integration (x-test-user-id auth) and the v1 JSON envelope.
 */

import request from 'supertest';
import { app, integrationTestUtils } from '../setup-integration';
import { getKyleSessionCookieHeader } from './helpers/integrationSessionAuth';

const TEST_GUEST_ID = '00000000-0000-0000-0000-000000000004';

function asUser(userId: string): { 'x-test-user-id': string } {
  return { 'x-test-user-id': userId };
}

describe('Deck Save Security - Simple Integration Tests', () => {
  let adminUserId: string;
  let regularUserId: string;
  let adminDeckId: string;
  let regularUserDeckId: string;
  const nonExistentDeckId = 'c026de98-11d8-40a2-aa23-674611111111';
  let charId: string;
  let powerId: string;
  let catalogAuthCookie: string;

  beforeAll(async () => {
    catalogAuthCookie = await getKyleSessionCookieHeader(app);
    const adminUser = await integrationTestUtils.createTestUser({
      name: 'dss-admin',
      email: 'dss-admin@test.com',
      password: 'password123',
      role: 'ADMIN'
    });
    const regularUser = await integrationTestUtils.createTestUser({
      name: 'dss-regular',
      email: 'dss-regular@test.com',
      password: 'password123',
      role: 'USER'
    });
    adminUserId = adminUser.id;
    regularUserId = regularUser.id;

    const chars = await request(app).get('/api/v1/catalog/characters').set('Cookie', catalogAuthCookie).expect(200);
    expect(chars.body.errors).toEqual([]);
    const charList = chars.body.data as Array<{ id: string }>;
    expect(charList.length).toBeGreaterThan(0);
    charId = charList[0].id;

    const powers = await request(app).get('/api/v1/catalog/power-cards').set('Cookie', catalogAuthCookie).expect(200);
    expect(powers.body.errors).toEqual([]);
    const powerList = powers.body.data as Array<{ id: string }>;
    expect(powerList.length).toBeGreaterThan(0);
    powerId = powerList[0].id;
  });

  // setup-integration deletes tracked decks after each test; recreate so every test has rows.
  beforeEach(async () => {
    const ts = Date.now();
    const adminDeck = await integrationTestUtils.createTestDeck(adminUserId, {
      name: `Admin Test Deck ${ts}`,
      description: 'Test deck for admin user'
    });
    const regularDeck = await integrationTestUtils.createTestDeck(regularUserId, {
      name: `Regular Test Deck ${ts}`,
      description: 'Test deck for regular user'
    });
    adminDeckId = adminDeck.id;
    regularUserDeckId = regularDeck.id;
  });

  describe('Admin User Deck Save Scenarios', () => {
    it('should allow admin to save their own deck', async () => {
      const testCards = [
        { cardType: 'character', cardId: charId, quantity: 1 },
        { cardType: 'power', cardId: powerId, quantity: 2 }
      ];

      const response = await request(app)
        .put(`/api/v1/decks/${adminDeckId}/cards`)
        .set(asUser(adminUserId))
        .send({ cards: testCards })
        .expect(200);

      expect(response.body.errors).toEqual([]);
      expect(response.body.data.metadata.id).toBe(adminDeckId);
    });

    it('should allow admin to save deck with empty card list', async () => {
      const response = await request(app)
        .put(`/api/v1/decks/${adminDeckId}/cards`)
        .set(asUser(adminUserId))
        .send({ cards: [] })
        .expect(200);

      expect(response.body.errors).toEqual([]);
    });
  });

  describe('Regular User Deck Save Scenarios', () => {
    it('should allow regular user to save their own deck', async () => {
      const testCards = [
        { cardType: 'character', cardId: charId, quantity: 1 },
        { cardType: 'power', cardId: powerId, quantity: 2 }
      ];

      const response = await request(app)
        .put(`/api/v1/decks/${regularUserDeckId}/cards`)
        .set(asUser(regularUserId))
        .send({ cards: testCards })
        .expect(200);

      expect(response.body.errors).toEqual([]);
      expect(response.body.data.metadata.id).toBe(regularUserDeckId);
    });

    it('should prevent regular user from saving admin deck (403 Forbidden)', async () => {
      const testCards = [{ cardType: 'character', cardId: charId, quantity: 1 }];

      const response = await request(app)
        .put(`/api/v1/decks/${adminDeckId}/cards`)
        .set(asUser(regularUserId))
        .send({ cards: testCards })
        .expect(403);

      expect(response.body.errors.length).toBeGreaterThan(0);
      expect(response.body.errors[0].message).toContain('Access denied');
      expect(response.body.errors[0].message).toContain('do not own this deck');
    });
  });

  describe('Guest User Restrictions', () => {
    it('should prevent guest user from modifying decks (403 Forbidden)', async () => {
      const testCards = [{ cardType: 'character', cardId: charId, quantity: 1 }];

      const response = await request(app)
        .put(`/api/v1/decks/${regularUserDeckId}/cards`)
        .set(asUser(TEST_GUEST_ID))
        .send({ cards: testCards })
        .expect(403);

      expect(response.body.errors.length).toBeGreaterThan(0);
      expect(response.body.errors[0].message).toContain('Guests may not modify decks');
    });

    it('should prevent guest user from saving another user deck (403 Forbidden)', async () => {
      const testCards = [{ cardType: 'character', cardId: charId, quantity: 1 }];

      const response = await request(app)
        .put(`/api/v1/decks/${adminDeckId}/cards`)
        .set(asUser(TEST_GUEST_ID))
        .send({ cards: testCards })
        .expect(403);

      expect(response.body.errors[0].message).toContain('Guests may not modify decks');
    });
  });

  describe('Non-existent or inaccessible deck', () => {
    it('rejects replacement of a missing deck with the documented 400 response', async () => {
      const testCards = [{ cardType: 'character', cardId: charId, quantity: 1 }];

      const response = await request(app)
        .put(`/api/v1/decks/${nonExistentDeckId}/cards`)
        .set(asUser(adminUserId))
        .send({ cards: testCards })
        .expect(400);

      expect(response.body.errors[0]).toEqual({ code: 'DECK_CARDS_REPLACE_FAILED', message: 'Deck not found' });
    });

    it('should reject non-UUID deck id with an error response', async () => {
      const testCards = [{ cardType: 'character', cardId: charId, quantity: 1 }];

      const response = await request(app)
        .put('/api/v1/decks/invalid-deck-id/cards')
        .set(asUser(adminUserId))
        .send({ cards: testCards });

      expect(response.status).toBeGreaterThanOrEqual(400);
      const hasV1Errors = Array.isArray(response.body.errors) && response.body.errors.length > 0;
      expect(hasV1Errors || response.body.success === false).toBe(true);
    });
  });

  describe('Authentication and Authorization Edge Cases', () => {
    it('should require authentication for deck save operations', async () => {
      const testCards = [{ cardType: 'character', cardId: charId, quantity: 1 }];

      const response = await request(app)
        .put(`/api/v1/decks/${adminDeckId}/cards`)
        .send({ cards: testCards })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Authentication required');
    });

    it('should handle invalid session cookies', async () => {
      const testCards = [{ cardType: 'character', cardId: charId, quantity: 1 }];

      const response = await request(app)
        .put(`/api/v1/decks/${adminDeckId}/cards`)
        .set('Cookie', 'session=invalid-session-id')
        .send({ cards: testCards })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Input Validation and Data Integrity', () => {
    it('should validate card data structure', async () => {
      const invalidCards = [{ invalidField: 'test' }];

      const response = await request(app)
        .put(`/api/v1/decks/${adminDeckId}/cards`)
        .set(asUser(adminUserId))
        .send({ cards: invalidCards })
        .expect(400);

      expect(response.body.errors[0].message).toContain('cardType');
    });

    it('should validate card type field', async () => {
      const invalidCards = [{ cardType: '', cardId: charId, quantity: 1 }];

      const response = await request(app)
        .put(`/api/v1/decks/${adminDeckId}/cards`)
        .set(asUser(adminUserId))
        .send({ cards: invalidCards })
        .expect(400);

      expect(response.body.errors[0].message).toContain('cardType');
    });

    it('should validate card ID field', async () => {
      const invalidCards = [{ cardType: 'character', cardId: '', quantity: 1 }];

      const response = await request(app)
        .put(`/api/v1/decks/${adminDeckId}/cards`)
        .set(asUser(adminUserId))
        .send({ cards: invalidCards })
        .expect(400);

      expect(response.body.errors[0].message).toContain('cardId');
    });

    it('should validate quantity field', async () => {
      const invalidCards = [{ cardType: 'character', cardId: charId, quantity: 0 }];

      const response = await request(app)
        .put(`/api/v1/decks/${adminDeckId}/cards`)
        .set(asUser(adminUserId))
        .send({ cards: invalidCards })
        .expect(400);

      expect(response.body.errors[0].message).toContain('quantity');
    });

    it('should validate cards array is provided', async () => {
      const response = await request(app)
        .put(`/api/v1/decks/${adminDeckId}/cards`)
        .set(asUser(adminUserId))
        .send({})
        .expect(400);

      expect(response.body.errors[0].message).toContain('Cards must be an array');
    });

    it('should validate cards is an array', async () => {
      const response = await request(app)
        .put(`/api/v1/decks/${adminDeckId}/cards`)
        .set(asUser(adminUserId))
        .send({ cards: 'not-an-array' })
        .expect(400);

      expect(response.body.errors[0].message).toContain('Cards must be an array');
    });
  });

  describe('API Response Consistency', () => {
    it('should return consistent response format for successful saves', async () => {
      const testCards = [{ cardType: 'character', cardId: charId, quantity: 1 }];

      const response = await request(app)
        .put(`/api/v1/decks/${adminDeckId}/cards`)
        .set(asUser(adminUserId))
        .send({ cards: testCards })
        .expect(200);

      expect(response.body.errors).toEqual([]);
      expect(response.body.data.metadata.id).toBe(adminDeckId);
      expect(response.body.data.metadata).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('cards');
    });

    it('should return consistent error format for 403 errors', async () => {
      const testCards = [{ cardType: 'character', cardId: charId, quantity: 1 }];

      const response = await request(app)
        .put(`/api/v1/decks/${adminDeckId}/cards`)
        .set(asUser(regularUserId))
        .send({ cards: testCards })
        .expect(403);

      expect(response.body.errors.length).toBeGreaterThan(0);
      expect(response.body.errors[0].message).toContain('Access denied');
    });

    it('returns the replacement error envelope for a missing deck', async () => {
      const testCards = [{ cardType: 'character', cardId: charId, quantity: 1 }];

      const response = await request(app)
        .put(`/api/v1/decks/${nonExistentDeckId}/cards`)
        .set(asUser(adminUserId))
        .send({ cards: testCards })
        .expect(400);

      expect(response.body.errors[0]).toEqual({ code: 'DECK_CARDS_REPLACE_FAILED', message: 'Deck not found' });
    });
  });
});

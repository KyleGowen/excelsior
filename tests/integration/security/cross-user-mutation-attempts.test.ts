import request from 'supertest';
import { Pool } from 'pg';
import { app } from '../../../src/test-server';
import { integrationTestUtils } from '../../setup-integration';

describe('Cross-User Mutation Attempts Integration Tests', () => {
  let pool: Pool;
  let testCharacterId: string;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
    });

    const result = await pool.query('SELECT id FROM characters LIMIT 1');
    if (result.rows.length < 1) {
      throw new Error('Not enough test cards available in database');
    }
    testCharacterId = result.rows[0].id;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('blocks non-owners from mutating another user’s deck (403)', async () => {
    const userA = await integrationTestUtils.createTestUser({
      name: 'cross-user-owner',
      email: 'cross-user-owner@example.com',
      role: 'USER',
      password: 'password123'
    });
    const userB = await integrationTestUtils.createTestUser({
      name: 'cross-user-attacker',
      email: 'cross-user-attacker@example.com',
      role: 'USER',
      password: 'password123'
    });

    const loginA = await request(app)
      .post('/api/auth/login')
      .send({ username: userA.username, password: 'password123' });
    expect(loginA.status).toBe(200);
    const cookieA = loginA.headers['set-cookie'][0].split(';')[0];

    const loginB = await request(app)
      .post('/api/auth/login')
      .send({ username: userB.username, password: 'password123' });
    expect(loginB.status).toBe(200);
    const cookieB = loginB.headers['set-cookie'][0].split(';')[0];

    // Create a deck owned by user A
    const createDeck = await request(app)
      .post('/api/decks')
      .set('Cookie', cookieA)
      .send({ name: 'Owned Deck', description: 'Owned by A', cards: [] });

    expect(createDeck.status).toBe(201);
    expect(createDeck.body.success).toBe(true);
    const deckId = createDeck.body.data.id;
    integrationTestUtils.trackTestDeck(deckId);

    // Attempt to update metadata as user B
    const updateMeta = await request(app)
      .put(`/api/decks/${deckId}`)
      .set('Cookie', cookieB)
      .send({ name: 'Hacked Name' });
    expect(updateMeta.status).toBe(403);

    // Attempt to add a card as user B
    const addCard = await request(app)
      .post(`/api/decks/${deckId}/cards`)
      .set('Cookie', cookieB)
      .send({ cardType: 'character', cardId: testCharacterId, quantity: 1 });
    expect(addCard.status).toBe(403);

    // Attempt to bulk replace cards as user B
    const replaceCards = await request(app)
      .put(`/api/decks/${deckId}/cards`)
      .set('Cookie', cookieB)
      .send({ cards: [{ cardType: 'character', cardId: testCharacterId, quantity: 1 }] });
    expect(replaceCards.status).toBe(403);

    // Attempt to update UI preferences as user B
    const updatePrefs = await request(app)
      .put(`/api/decks/${deckId}/ui-preferences`)
      .set('Cookie', cookieB)
      .send({ viewMode: 'tile' });
    expect(updatePrefs.status).toBe(403);

    // Attempt to delete deck as user B
    const deleteDeck = await request(app)
      .delete(`/api/decks/${deckId}`)
      .set('Cookie', cookieB);
    expect(deleteDeck.status).toBe(403);
  });
});


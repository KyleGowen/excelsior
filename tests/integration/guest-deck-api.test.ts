/**
 * Integration tests for guest deck API (`/api/v1/guest/decks`).
 * GUEST users can create/list/get/update/delete session-scoped decks (not persisted to DB).
 * Non-GUEST users receive 403 on guest deck endpoints.
 */
import request from 'supertest';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { app, initializeTestServer } from '../../src/test-server';
import { integrationTestUtils } from '../setup-integration';

const v1 = '/api/v1/guest/decks';

describe('Guest deck API integration tests', () => {
  let guestSessionCookie: string;
  let userSessionCookie: string;
  let characterId: string;
  let powerId: string;
  const guestPassword = 'GuestDeckApiPw1';
  const userPassword = 'UserDeckApiPw1';

  beforeAll(async () => {
    await initializeTestServer();
    const pool = DataSourceConfig.getInstance().getPool();
    characterId = (await pool.query('SELECT id FROM characters ORDER BY id LIMIT 1')).rows[0].id;
    powerId = (await pool.query('SELECT id FROM power_cards ORDER BY id LIMIT 1')).rows[0].id;

    const guestUser = await integrationTestUtils.createTestUser({
      name: 'test-guest-deck-api',
      email: 'test-guest-deck-api@example.com',
      role: 'GUEST',
      password: guestPassword
    });
    const regularUser = await integrationTestUtils.createTestUser({
      name: 'test-regular-deck-api',
      email: 'test-regular-deck-api@example.com',
      role: 'USER',
      password: userPassword
    });

    const guestLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: guestUser.username, password: guestPassword });
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: regularUser.username, password: userPassword });
    expect(guestLogin.status).toBe(200);
    expect(userLogin.status).toBe(200);
    guestSessionCookie = guestLogin.headers['set-cookie'][0].split(';')[0];
    userSessionCookie = userLogin.headers['set-cookie'][0].split(';')[0];
  });

  describe('GUEST session', () => {
    it('should create a guest deck and return 201 with id', async () => {
      const res = await request(app)
        .post(v1)
        .set('Cookie', guestSessionCookie)
        .send({ name: 'My Guest Deck', description: 'Session only' });
      expect(res.status).toBe(201);
      expect(res.body.errors).toEqual([]);
      expect(res.body.data.id).toMatch(/^guest_/);
      expect(res.body.data.name).toBe('My Guest Deck');
    });

    it('should list guest decks for session', async () => {
      const createRes = await request(app)
        .post(v1)
        .set('Cookie', guestSessionCookie)
        .send({ name: 'List Test Deck', description: '' });
      expect(createRes.status).toBe(201);
      const deckId = createRes.body.data.id;

      const listRes = await request(app).get(v1).set('Cookie', guestSessionCookie);
      expect(listRes.status).toBe(200);
      expect(listRes.body.errors).toEqual([]);
      expect(Array.isArray(listRes.body.data)).toBe(true);
      const found = listRes.body.data.find(
        (d: { metadata?: { id: string }; id?: string }) => (d.metadata && d.metadata.id === deckId) || d.id === deckId
      );
      expect(found).toBeDefined();
    });

    it('should get a guest deck by id', async () => {
      const createRes = await request(app)
        .post(v1)
        .set('Cookie', guestSessionCookie)
        .send({ name: 'Get Test Deck', description: '' });
      expect(createRes.status).toBe(201);
      const deckId = createRes.body.data.id;

      const getRes = await request(app).get(`${v1}/${deckId}`).set('Cookie', guestSessionCookie);
      expect(getRes.status).toBe(200);
      expect(getRes.body.errors).toEqual([]);
      expect(getRes.body.data.metadata.id).toBe(deckId);
      expect(getRes.body.data.metadata.name).toBe('Get Test Deck');
      expect(getRes.body.data.cards).toEqual([]);
    });

    it('should PUT guest deck metadata', async () => {
      const createRes = await request(app)
        .post(v1)
        .set('Cookie', guestSessionCookie)
        .send({ name: 'Meta Before', description: 'old' });
      expect(createRes.status).toBe(201);
      const deckId = createRes.body.data.id;

      const putRes = await request(app)
        .put(`${v1}/${deckId}`)
        .set('Cookie', guestSessionCookie)
        .send({ name: 'Meta After', description: 'new desc' });
      expect(putRes.status).toBe(200);
      expect(putRes.body.errors).toEqual([]);
      expect(putRes.body.data.metadata.name).toBe('Meta After');
      expect(putRes.body.data.metadata.description).toBe('new desc');
    });

    it('should POST append a card to guest deck', async () => {
      const createRes = await request(app)
        .post(v1)
        .set('Cookie', guestSessionCookie)
        .send({ name: 'Post Card Deck', description: '' });
      expect(createRes.status).toBe(201);
      const deckId = createRes.body.data.id;

      const postRes = await request(app)
        .post(`${v1}/${deckId}/cards`)
        .set('Cookie', guestSessionCookie)
        .send({
          cardType: 'character',
          cardId: characterId,
          quantity: 2
        });
      expect(postRes.status).toBe(200);
      expect(postRes.body.errors).toEqual([]);
      expect(postRes.body.data.cards.length).toBe(1);
      expect(postRes.body.data.cards[0].quantity).toBe(2);
    });

    it('should update guest deck cards via PUT replace', async () => {
      const createRes = await request(app)
        .post(v1)
        .set('Cookie', guestSessionCookie)
        .send({ name: 'Cards Test Deck', description: '' });
      expect(createRes.status).toBe(201);
      const deckId = createRes.body.data.id;

      const putRes = await request(app)
        .put(`${v1}/${deckId}/cards`)
        .set('Cookie', guestSessionCookie)
        .send({
          cards: [
            { cardType: 'character', cardId: characterId, quantity: 1 },
            { cardType: 'power', cardId: powerId, quantity: 2 }
          ]
        });
      expect(putRes.status).toBe(200);
      expect(putRes.body.errors).toEqual([]);
      expect(putRes.body.data.cards.length).toBe(2);
      expect(putRes.body.data.cards.map((card: { quantity: number }) => card.quantity)).toEqual([1, 2]);
      expect(putRes.body.data.metadata.is_valid).toBe(false);
    });

    it('rejects an unknown typed identity without replacing existing Guest cards', async () => {
      const created = await request(app).post(v1).set('Cookie', guestSessionCookie)
        .send({ name: 'Unknown card boundary' }).expect(201);
      const url = `${v1}/${created.body.data.id}`;
      await request(app).put(`${url}/cards`).set('Cookie', guestSessionCookie)
        .send({ cards: [{ cardType: 'power', cardId: powerId, quantity: 2 }] }).expect(200);
      const before = await request(app).get(url).set('Cookie', guestSessionCookie).expect(200);
      for (const method of ['post', 'put'] as const) {
        const invalid = { cardType: 'power', cardId: 'nonexistent-fictional-card', quantity: 1 };
        await request(app)[method](`${url}/cards`).set('Cookie', guestSessionCookie)
          .send(method === 'put' ? { cards: [invalid] } : invalid).expect(400);
        const after = await request(app).get(url).set('Cookie', guestSessionCookie).expect(200);
        expect(after.body.data.cards).toEqual(before.body.data.cards);
        expect(after.body.data.metadata.is_valid).toBe(false);
      }
    });

    it('should delete a guest deck', async () => {
      const createRes = await request(app)
        .post(v1)
        .set('Cookie', guestSessionCookie)
        .send({ name: 'Delete Test Deck', description: '' });
      expect(createRes.status).toBe(201);
      const deckId = createRes.body.data.id;

      const delRes = await request(app).delete(`${v1}/${deckId}`).set('Cookie', guestSessionCookie);
      expect(delRes.status).toBe(200);
      expect(delRes.body.errors).toEqual([]);

      const getRes = await request(app).get(`${v1}/${deckId}`).set('Cookie', guestSessionCookie);
      expect(getRes.status).toBe(404);
    });
  });

  describe('Non-GUEST cannot use guest deck API', () => {
    it('should return 403 when USER calls POST /api/v1/guest/decks', async () => {
      const res = await request(app)
        .post(v1)
        .set('Cookie', userSessionCookie)
        .send({ name: 'Not Allowed', description: '' });
      expect(res.status).toBe(403);
      expect(res.body.errors?.[0]?.code).toBe('GUEST_ONLY');
    });

    it('should return 403 when USER calls GET /api/v1/guest/decks', async () => {
      const res = await request(app).get(v1).set('Cookie', userSessionCookie);
      expect(res.status).toBe(403);
      expect(res.body.errors?.[0]?.code).toBe('GUEST_ONLY');
    });
  });

  describe('GUEST still cannot use main deck API', () => {
    it('should return 403 when GUEST calls POST /api/v1/decks', async () => {
      const res = await request(app)
        .post('/api/v1/decks')
        .set('Cookie', guestSessionCookie)
        .send({ name: 'Guest Main Deck', description: '' });
      expect(res.status).toBe(403);
      expect(res.body.errors?.length).toBeGreaterThan(0);
    });
  });
});

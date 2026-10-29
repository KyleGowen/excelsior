import request from 'supertest';
import { Pool } from 'pg';
import { app } from '../../../src/test-server';
import { integrationTestUtils } from '../../setup-integration';
import type { UserRole } from '../../../src/types';
import { api } from '../../../frontend/src/lib/api/client';
import { clonePreloadedGuestDeck, guestNeedsCloneOnOpen } from '../../../frontend/src/lib/decks/guestCloneOnOpen';

type Write = { method: 'post' | 'put' | 'delete'; path: string; body: object };
type Credentials = { cookie: string; bearer: string };

describe('Guest persistence boundary with real session and Bearer authentication', () => {
  const password = 'GuestBoundaryTest1';
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
  });
  let guestId: string;
  let guestAuth: Credentials;
  let userAuth: Credentials;
  let adminAuth: Credentials;
  let deckId: string;
  let powerId: string;

  async function login(username: string): Promise<Credentials> {
    const session = await request(app).post('/api/auth/login').send({ username, password }).expect(200);
    const bearer = await request(app).post('/api/v1/auth/login').send({ username, password }).expect(200);
    return {
      cookie: session.headers['set-cookie'][0].split(';')[0],
      bearer: `Bearer ${bearer.body.data.accessToken}`
    };
  }

  function writes(): Write[] {
    const card = { cardType: 'power', cardId: powerId, quantity: 1 };
    return [
      { method: 'post', path: '/api/v1/decks', body: { name: 'Forbidden guest creation' } },
      { method: 'put', path: `/api/v1/decks/${deckId}`, body: { name: 'Forbidden rename' } },
      { method: 'post', path: `/api/v1/decks/${deckId}/cards`, body: card },
      { method: 'put', path: `/api/v1/decks/${deckId}/cards`, body: { cards: [] } },
      { method: 'delete', path: `/api/v1/decks/${deckId}/cards`, body: card },
      { method: 'put', path: `/api/v1/decks/${deckId}/ui-preferences`, body: { viewMode: 'list' } },
      { method: 'delete', path: `/api/v1/decks/${deckId}`, body: {} }
    ];
  }

  async function snapshot() {
    const decks = await pool.query('SELECT * FROM decks WHERE user_id = $1 ORDER BY id', [guestId]);
    const cards = await pool.query('SELECT * FROM deck_cards WHERE deck_id = $1 ORDER BY id', [deckId]);
    return { decks: decks.rows, cards: cards.rows };
  }

  beforeAll(async () => {
    for (const role of ['GUEST', 'USER', 'ADMIN'] as const) {
      const user = await integrationTestUtils.createTestUser({
        name: `guest-boundary-${role.toLowerCase()}`,
        email: `guest-boundary-${role.toLowerCase()}@example.com`,
        password,
        role
      });
      const credentials = await login(user.username);
      if (role === 'GUEST') {
        guestId = user.id;
        guestAuth = credentials;
      } else if (role === 'USER') {
        userAuth = credentials;
      } else {
        adminAuth = credentials;
      }
    }
    const powers = await pool.query<{ id: string }>('SELECT id FROM power_cards LIMIT 1');
    expect(powers.rows).toHaveLength(1);
    powerId = powers.rows[0].id;
  });

  beforeEach(async () => {
    // Ownership must match the guest, so an ownership check cannot mask a missing role guard.
    const deck = await integrationTestUtils.createTestDeck(guestId, { name: 'Guest-owned DB fixture' });
    deckId = deck.id;
    await pool.query(
      'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity) VALUES ($1, $2, $3, $4)',
      [deckId, 'power', powerId, 2]
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  describe.each(['anonymous', 'session', 'bearer'] as const)('%s requests', (mode) => {
    it.each([0, 1, 2, 3, 4, 5, 6])('rejects persistent write operation %i without changing DB rows', async (index) => {
      const before = await snapshot();
      const write = writes()[index];
      let pending = request(app)[write.method](write.path).send(write.body);
      if (mode === 'session') pending = pending.set('Cookie', guestAuth.cookie);
      if (mode === 'bearer') pending = pending.set('Authorization', guestAuth.bearer);
      const response = await pending.expect(mode === 'anonymous' ? 401 : 403);
      expect(response.body.errors[0].code).toBe(mode === 'anonymous' ? 'UNAUTHORIZED' : 'GUEST_FORBIDDEN');
      expect(await snapshot()).toEqual(before);
    });
  });

  it('uses the current DB role after a USER session and JWT were issued', async () => {
    const user = await integrationTestUtils.createTestUser({
      name: 'guest-boundary-demoted', email: 'guest-boundary-demoted@example.com', password, role: 'USER'
    });
    const credentials = await login(user.username);
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['GUEST', user.id]);
    await pool.query('UPDATE decks SET user_id = $1 WHERE id = $2', [user.id, deckId]);
    const beforeDeck = await pool.query('SELECT * FROM decks WHERE id = $1', [deckId]);
    const beforeCards = await pool.query('SELECT * FROM deck_cards WHERE deck_id = $1 ORDER BY id', [deckId]);
    for (const mode of ['session', 'bearer'] as const) {
      for (const write of writes()) {
        const response = await request(app)[write.method](write.path)
          .set(mode === 'session' ? 'Cookie' : 'Authorization', credentials[mode === 'session' ? 'cookie' : 'bearer'])
          .send(write.body).expect(403);
        expect(response.body.errors[0].code).toBe('GUEST_FORBIDDEN');
      }
    }
    expect((await pool.query('SELECT * FROM decks WHERE id = $1', [deckId])).rows).toEqual(beforeDeck.rows);
    expect((await pool.query('SELECT * FROM deck_cards WHERE deck_id = $1 ORDER BY id', [deckId])).rows).toEqual(beforeCards.rows);
    expect((await pool.query('SELECT COUNT(*)::int AS count FROM decks WHERE user_id = $1', [user.id])).rows[0].count).toBe(1);
  });

  it.each(['USER', 'ADMIN'] as UserRole[])('preserves all seven owner writes for %s', async (role) => {
    const auth = role === 'USER' ? userAuth : adminAuth;
    const header = role === 'USER' ? 'Cookie' : 'Authorization';
    const value = role === 'USER' ? auth.cookie : auth.bearer;
    const created = await request(app).post('/api/v1/decks').set(header, value)
      .send({ name: 'Registered owner control' }).expect(201);
    const id: string = created.body.data.id;
    integrationTestUtils.trackTestDeck(id);
    await request(app).put(`/api/v1/decks/${id}`).set(header, value).send({ name: 'Updated owner deck' }).expect(200);
    await request(app).post(`/api/v1/decks/${id}/cards`).set(header, value)
      .send({ cardType: 'power', cardId: powerId, quantity: 1 }).expect(200);
    await request(app).put(`/api/v1/decks/${id}/cards`).set(header, value)
      .send({ cards: [{ cardType: 'power', cardId: powerId, quantity: 2 }] }).expect(200);
    await request(app).delete(`/api/v1/decks/${id}/cards`).set(header, value)
      .send({ cardType: 'power', cardId: powerId, quantity: 1 }).expect(200);
    await request(app).put(`/api/v1/decks/${id}/ui-preferences`).set(header, value)
      .send({ viewMode: 'list' }).expect(200);
    expect((await pool.query('SELECT name FROM decks WHERE id = $1', [id])).rows[0].name).toBe('Updated owner deck');
    expect((await pool.query('SELECT quantity FROM deck_cards WHERE deck_id = $1', [id])).rows[0].quantity).toBe(1);
    await request(app).delete(`/api/v1/decks/${id}`).set(header, value).expect(200);
    expect((await pool.query('SELECT id FROM decks WHERE id = $1', [id])).rows).toEqual([]);
  });

  it('saves guest edits across reloads only in the owning session, leaving PostgreSQL unchanged', async () => {
    const before = await snapshot();
    const created = await request(app).post('/api/v1/guest/decks').set('Cookie', guestAuth.cookie)
      .send({ name: 'Session save before', description: '' }).expect(201);
    const id: string = created.body.data.id;
    expect(id).toMatch(/^guest_/);
    await request(app).put(`/api/v1/guest/decks/${id}`).set('Cookie', guestAuth.cookie)
      .send({ name: 'Session save after' }).expect(200);
    await request(app).put(`/api/v1/guest/decks/${id}/cards`).set('Cookie', guestAuth.cookie)
      .send({ cards: [{ cardType: 'power', cardId: powerId, quantity: 3 }] }).expect(200);
    const reloaded = await request(app).get(`/api/v1/guest/decks/${id}`).set('Cookie', guestAuth.cookie).expect(200);
    expect(reloaded.body.data.metadata.name).toBe('Session save after');
    expect(reloaded.body.data.cards[0].quantity).toBe(3);
    expect(await snapshot()).toEqual(before);
    const otherSession = await request(app).post('/api/auth/login')
      .send({ username: (await pool.query('SELECT username FROM users WHERE id = $1', [guestId])).rows[0].username, password })
      .expect(200);
    await request(app).get(`/api/v1/guest/decks/${id}`).set('Cookie', otherSession.headers['set-cookie']).expect(404);
    await request(app).delete(`/api/v1/guest/decks/${id}`).set('Cookie', guestAuth.cookie).expect(200);
  });

  it('keeps another owner\'s shared deck read-only without adding it to either guest session', async () => {
    const source = await request(app).post('/api/v1/decks').set('Cookie', userAuth.cookie)
      .send({ name: 'Shared registered-owner deck', is_private: false }).expect(201);
    const sourceId: string = source.body.data.id;
    integrationTestUtils.trackTestDeck(sourceId);
    await request(app).put(`/api/v1/decks/${sourceId}/cards`).set('Cookie', userAuth.cookie)
      .send({ cards: [{ cardType: 'power', cardId: powerId, quantity: 2 }] }).expect(200);
    const sourceBefore = await pool.query('SELECT * FROM decks WHERE id = $1', [sourceId]);
    const cardsBefore = await pool.query('SELECT * FROM deck_cards WHERE deck_id = $1 ORDER BY id', [sourceId]);
    const otherLogin = await request(app).post('/api/auth/login')
      .send({ username: (await pool.query('SELECT username FROM users WHERE id = $1', [guestId])).rows[0].username, password })
      .expect(200);
    const otherCookie: string = otherLogin.headers['set-cookie'][0].split(';')[0];
    let activeCookie = guestAuth.cookie;

    // Run the real frontend clone helper through real HTTP handlers and auth;
    // only adapt its browser transport to this disposable integration app.
    const get = jest.spyOn(api, 'get').mockImplementation(async <T>(path: string): Promise<T> => {
      const response = await request(app).get(path).set('Cookie', activeCookie).expect(200);
      return response.body.data as T;
    });
    const post = jest.spyOn(api, 'post');
    const put = jest.spyOn(api, 'put');
    try {
      for (const cookie of [guestAuth.cookie, otherCookie]) {
        activeCookie = cookie;
        const beforeList = await request(app).get('/api/v1/guest/decks').set('Cookie', cookie).expect(200);
        const shared = await request(app).get(`/api/v1/decks/${sourceId}/full`).set('Cookie', cookie).expect(200);
        expect(shared.body.data.metadata.isOwner).toBe(false);
        expect(guestNeedsCloneOnOpen(sourceId, true, false, shared.body.data.metadata.userId, guestId)).toBe(false);
        await expect(clonePreloadedGuestDeck(sourceId, guestId)).rejects.toThrow('Only guest sample decks can be copied');
        const afterList = await request(app).get('/api/v1/guest/decks').set('Cookie', cookie).expect(200);
        expect(afterList.body.data).toEqual(beforeList.body.data);
      }
      expect(post).not.toHaveBeenCalled();
      expect(put).not.toHaveBeenCalled();
      expect((await pool.query('SELECT * FROM decks WHERE id = $1', [sourceId])).rows).toEqual(sourceBefore.rows);
      expect((await pool.query('SELECT * FROM deck_cards WHERE deck_id = $1 ORDER BY id', [sourceId])).rows).toEqual(cardsBefore.rows);
    } finally {
      get.mockRestore();
      post.mockRestore();
      put.mockRestore();
    }
  });
});

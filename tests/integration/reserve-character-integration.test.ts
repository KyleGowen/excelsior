/** Current v1 reserve persistence and ownership; HTML is rendered by React. */
import request from 'supertest';
import { Pool } from 'pg';
import { app, integrationTestUtils } from '../setup-integration';
import { getSessionCookieHeader } from './helpers/integrationSessionAuth';

describe('Reserve character API integration', () => {
  let pool: Pool;
  let characters: string[];
  let owner: string;
  let other: string;
  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    characters = (await pool.query('SELECT DISTINCT ON (name) id, name FROM characters ORDER BY name, id LIMIT 4')).rows.map(row => row.id);
    expect(characters).toHaveLength(4);
    const user = await integrationTestUtils.createTestUser({ name: 'reserve-owner', email: 'reserve-owner@example.com', password: 'reserve-test' });
    const peer = await integrationTestUtils.createTestUser({ name: 'reserve-peer', email: 'reserve-peer@example.com', password: 'reserve-test' });
    owner = await getSessionCookieHeader(app, user.username, 'reserve-test');
    other = await getSessionCookieHeader(app, peer.username, 'reserve-test');
  });
  afterAll(async () => { await pool.end(); });

  it.each([1, 2, 3, 4])('selects, switches, and clears the reserve in a %i-character deck', async count => {
    const created = await request(app).post('/api/v1/decks').set('Cookie', owner)
      .send({ name: 'Reserve workflow', cards: characters.slice(0, count).map(cardId => ({ cardType: 'character', cardId, quantity: 1 })) }).expect(201);
    const id = created.body.data.id;
    integrationTestUtils.trackTestDeck(id);
    for (const reserve of [characters[0], characters[count - 1], null]) {
      await request(app).put(`/api/v1/decks/${id}`).set('Cookie', owner).send({ reserve_character: reserve }).expect(200);
      const saved = await request(app).get(`/api/v1/decks/${id}`).set('Cookie', owner).expect(200);
      expect(saved.body.data.metadata.reserve_character).toBe(reserve);
    }
    await request(app).put(`/api/v1/decks/${id}`).set('Cookie', other)
      .send({ reserve_character: characters[0] }).expect(403);
    const unchanged = await request(app).get(`/api/v1/decks/${id}`).set('Cookie', owner).expect(200);
    expect(unchanged.body.data.metadata.reserve_character).toBeNull();
  });
});

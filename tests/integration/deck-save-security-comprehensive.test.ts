/** Real production authorization for replacement saves, including state preservation. */
import request from 'supertest';
import { app } from '../../src/index';
import { integrationTestUtils } from '../setup-integration';
import { getSessionCookieHeader } from './helpers/integrationSessionAuth';

describe('Deck replacement save authorization', () => {
  let characterId: string;
  const actors: Record<string, { id: string; cookie: string; bearer: string }> = {};
  beforeAll(async () => {
    const catalog = await request(app).get('/api/v1/catalog/characters').expect(200);
    characterId = catalog.body.data[0].id;
    for (const role of ['USER', 'ADMIN', 'GUEST']) {
      const user = await integrationTestUtils.createTestUser({ name: `save-${role}`, email: `save-${role}@example.com`, password: 'save-test', role });
      const cookie = await getSessionCookieHeader(app, user.username, 'save-test');
      const login = await request(app).post('/api/v1/auth/login').send({ username: user.username, password: 'save-test' }).expect(200);
      actors[role] = { id: user.id, cookie, bearer: login.body.data.accessToken };
    }
  });

  it.each(['USER', 'ADMIN'])('%s saves their own deck with session and Bearer authentication', async role => {
    const actor = actors[role];
    const deck = await integrationTestUtils.createTestDeck(actor.id, { name: 'Owner save' });
    for (const headers of [{ Cookie: actor.cookie }, { Authorization: `Bearer ${actor.bearer}` }]) {
      const response = await request(app).put(`/api/v1/decks/${deck.id}/cards`).set(headers).send({ cards: [{ cardType: 'character', cardId: characterId, quantity: 1 }] }).expect(200);
      expect(response.body.errors).toEqual([]);
      expect(response.body.data.metadata.id).toBe(deck.id);
      expect(response.body.data.cards).toHaveLength(1);
    }
  });

  it.each(['USER', 'ADMIN', 'GUEST'])('%s cannot replace another user’s cards, even with readonly=false', async role => {
    const owner = await integrationTestUtils.createTestUser({ name: 'save-owner', email: 'save-owner@example.com', password: 'owner-test' });
    const deck = await integrationTestUtils.createTestDeck(owner.id, { name: 'Must remain unchanged' });
    const ownerCookie = await getSessionCookieHeader(app, owner.username, 'owner-test');
    await request(app).put(`/api/v1/decks/${deck.id}/cards`).set('Cookie', ownerCookie)
      .send({ cards: [{ cardType: 'character', cardId: characterId, quantity: 1 }] }).expect(200);
    const before = await request(app).get(`/api/v1/decks/${deck.id}/full`).expect(200);
    expect(before.body.data.cards).toHaveLength(1);
    for (const headers of [{ Cookie: actors[role].cookie }, { Authorization: `Bearer ${actors[role].bearer}` }]) {
      await request(app).put(`/api/v1/decks/${deck.id}/cards?readonly=false`).set(headers).send({ cards: [] }).expect(403);
    }
    const after = await request(app).get(`/api/v1/decks/${deck.id}/full`).expect(200);
    expect(after.body.data.cards).toEqual(before.body.data.cards);
    expect(after.body.data.metadata.name).toBe('Must remain unchanged');
  });
});

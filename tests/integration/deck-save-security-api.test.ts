import request from 'supertest';
import { app } from '../../src/index';
import { integrationTestUtils } from '../setup-integration';
import { getSessionCookieHeader } from './helpers/integrationSessionAuth';

describe('Production deck save input validation', () => {
  let cookie: string;
  let userId: string;
  beforeAll(async () => {
    const user = await integrationTestUtils.createTestUser({ name: 'save-validation', email: 'save-validation@example.com', password: 'validation-test' });
    userId = user.id;
    cookie = await getSessionCookieHeader(app, user.username, 'validation-test');
  });
  it.each([
    {}, { cards: 'not-an-array' }, { cards: [{}] },
    { cards: [{ cardType: 'character', cardId: '', quantity: 1 }] },
    { cards: [{ cardType: 'power', cardId: 'bad-id', quantity: 0 }] },
    { cards: [{ cardType: 'power', cardId: 'bad-id', quantity: -1 }] }
  ])('rejects malformed save body %j without changing the deck', async body => {
    const deck = await integrationTestUtils.createTestDeck(userId, { name: 'Validation test' });
    const response = await request(app).put(`/api/v1/decks/${deck.id}/cards`).set('Cookie', cookie).send(body).expect(400);
    expect(response.body.errors.length).toBeGreaterThan(0);
    const saved = await request(app).get(`/api/v1/decks/${deck.id}/full`).expect(200);
    expect(saved.body.data.cards).toEqual([]);
  });
  it.each(['sessionId=invalid', 'sessionId=', 'session=forged-user-id'])('rejects invalid authentication %s', async invalidCookie => {
    const deck = await integrationTestUtils.createTestDeck(userId, { name: 'Protected deck' });
    await request(app).put(`/api/v1/decks/${deck.id}/cards`).set('Cookie', invalidCookie).send({ cards: [] }).expect(401);
  });
});

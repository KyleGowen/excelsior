import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { app } from '../../../src/test-server';
import { DataSourceConfig } from '../../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../../setup-integration';

describe('personal deck search card names', () => {
  const password = randomUUID();

  async function session(role: 'USER' | 'GUEST') {
    const user = await integrationTestUtils.createTestUser({
      name: 'personal-search',
      email: 'personal-search@example.com',
      role,
      password,
    });
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ username: user.username, password }).expect(200);
    return { user, agent };
  }

  async function findWarWoman(): Promise<string> {
    const { rows } = await DataSourceConfig.getInstance().getPool()!.query<{ id: string }>(
      'SELECT id FROM special_cards WHERE name = $1 ORDER BY set_number LIMIT 1',
      ['War Woman'],
    );
    return rows[0]!.id;
  }

  it('loads non-preview card names on the signed-in account only and reflects a saved edit', async () => {
    const owner = await session('USER');
    const other = await session('USER');
    const warWoman = await findWarWoman();
    const created = await owner.agent.post('/api/v1/decks').send({ name: 'Paris at Dawn', is_private: true }).expect(201);
    const id: string = created.body.data.id;
    integrationTestUtils.trackTestDeck(id);
    const cards = [{ cardType: 'special', cardId: warWoman, quantity: 1 }];
    await owner.agent.put(`/api/v1/decks/${id}/cards`).send({ cards }).expect(200);

    const plain = await owner.agent.get('/api/v1/decks').expect(200);
    expect(plain.body.data.find((deck: any) => deck.metadata.id === id).metadata).not.toHaveProperty('cardNames');
    const path = '/api/v1/decks?include=cardNames';
    const searchList = await owner.agent.get(path).expect(200);
    const result = searchList.body.data.find((deck: any) => deck.metadata.id === id);
    expect(result.metadata.cardNames).toEqual(['War Woman']);
    expect(result.cards).not.toEqual(expect.arrayContaining([expect.objectContaining({ cardId: warWoman })]));
    expect((await other.agent.get(path).expect(200)).body.data).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ metadata: expect.objectContaining({ id }) }),
    ]));
    await request(app).get(path).expect(401);

    await owner.agent.put(`/api/v1/decks/${id}/cards`).send({ cards: [] }).expect(200);
    const updated = await owner.agent.get(path).expect(200);
    expect(updated.body.data.find((deck: any) => deck.metadata.id === id).metadata.cardNames).toEqual([]);
  });

  it('loads temporary deck names only for the originating Guest session', async () => {
    const owner = await session('GUEST');
    const other = request.agent(app);
    await other.post('/api/auth/login').send({ username: owner.user.username, password }).expect(200);
    const guestPath = '/api/v1/guest/decks';
    const created = await owner.agent.post(guestPath).send({ name: 'Shield Wall' }).expect(201);
    const id: string = created.body.data.id;
    try {
      await owner.agent.put(`${guestPath}/${id}/cards`).send({
        cards: [{ cardType: 'special', cardId: await findWarWoman(), quantity: 1 }],
      }).expect(200);
      const path = `${guestPath}?include=cardNames`;
      const list = await owner.agent.get(path).expect(200);
      expect(list.headers['cache-control']).toBe('no-store');
      expect(list.body.data.find((deck: any) => deck.metadata.id === id).metadata.cardNames).toEqual(['War Woman']);
      expect((await other.get(path).expect(200)).body.data).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ metadata: expect.objectContaining({ id }) }),
      ]));
    } finally {
      await owner.agent.delete(`${guestPath}/${id}`).expect(200);
    }
  });
});

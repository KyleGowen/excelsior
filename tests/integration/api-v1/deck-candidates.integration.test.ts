import request from 'supertest';
import { app } from '../../../src/index';
import { DataSourceConfig } from '../../../src/config/DataSourceConfig';
describe('Real stateless Add Cards composition', () => {
  it('resolves current catalog values without creating players, decks, or collections', async () => {
    const pool = DataSourceConfig.getInstance().getPool();
    const counts = () => pool.query('SELECT (SELECT count(*) FROM decks) AS decks, (SELECT count(*) FROM users) AS users, (SELECT count(*) FROM collection_cards) AS cards');
    const before = await counts();
    const character = (await pool.query("SELECT id FROM characters WHERE name = 'Lancelot' ORDER BY id LIMIT 1")).rows[0];
    const power = (await pool.query("SELECT id FROM power_cards WHERE value = 8 AND power_type = 'Energy' AND COALESCE(one_per_deck, false) = false ORDER BY id LIMIT 1")).rows[0];
    const input = { schemaVersion: 1, revision: 9, cards: [{ type: 'character', cardId: character.id, quantity: 1 }], candidates: [{ catalogType: 'power-cards', cardId: power.id }] };
    const r = await request(app).post('/api/v1/decks/candidates/evaluate').send(input).expect(200);
    expect(r.headers['cache-control']).toBe('no-store');
    expect(r.body.data.candidates[0]).toMatchObject({ cardId: power.id, usable: false, maxCopies: 99, reasons: [{ code: 'POWER_GRID' }] });
    expect(r.body.data.versions.catalog).toMatch(/^[0-9a-f]{64}$/);
    await request(app).post('/api/v1/decks/candidates/evaluate').send({ ...input, candidates: [{ catalogType: 'characters', cardId: power.id }] }).expect(400);
    await request(app).post('/api/v1/decks/candidates/evaluate').send({ ...input, role: 'ADMIN' }).expect(400);
    expect((await counts()).rows).toEqual(before.rows);
  });
});

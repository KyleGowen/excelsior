import request from 'supertest';
import { app } from '../../../src/index';
import { DataSourceConfig } from '../../../src/config/DataSourceConfig';

describe('M4 catalog presentation through production composition', () => {
  it('preserves actual row IDs and data while attaching authoritative domain metadata without record writes', async () => {
    const pool = DataSourceConfig.getInstance().getPool();
    const before = await pool.query('SELECT (SELECT count(*) FROM decks) AS decks, (SELECT count(*) FROM users) AS users');
    const raw = await request(app).get('/api/v1/catalog/characters').expect(200);
    const response = await request(app).get('/api/v1/catalog/presentation/characters').expect(200);
    expect(response.body.data.map(({ presentation: _presentation, ...row }: Record<string, unknown>) => row)).toEqual(raw.body.data);
    expect(response.body.data.length).toBeGreaterThan(0);
    for (const row of response.body.data) {
      expect(row.presentation.printingId).toBe(row.id);
      expect(row.presentation.printingIds).toContain(row.id);
      expect(row.presentation.logicalCardId).toMatch(/^[a-f0-9]{64}$/);
      expect(row.presentation.catalogVersion).toMatch(/^[a-f0-9]{64}$/);
    }
    await request(app).get('/api/v1/catalog/presentation/characters').set('If-None-Match', response.headers.etag).expect(304);
    const after = await pool.query('SELECT (SELECT count(*) FROM decks) AS decks, (SELECT count(*) FROM users) AS users');
    expect(after.rows).toEqual(before.rows);
  });
});

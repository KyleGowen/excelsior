import request from 'supertest';
import { app } from '../../../src/index';
import { DataSourceConfig } from '../../../src/config/DataSourceConfig';
import { CATALOG_PRESENTATION_TYPES } from '../../../src/services/catalog-presentation/presentCatalog';
import { presentCatalog as baseline } from '../../helpers/baselineCatalogPresentation';
import { decodeCatalogPresentation } from '../../../frontend/src/lib/api/catalogPresentation';

describe('M4 catalog presentation through production composition', () => {
  it('preserves every printing in all 13 real catalogs and losslessly expands the compact response', async () => {
    const characters=await request(app).get('/api/v1/catalog/characters').expect(200);
    const foils=await request(app).get('/api/v1/catalog/foil-card-map').expect(200);
    for(const type of CATALOG_PRESENTATION_TYPES){
      const raw=await request(app).get('/api/v1/catalog/'+type).expect(200);
      const full=await request(app).get('/api/v1/catalog/presentation/'+type).expect(200);
      const compact=await request(app).get('/api/v1/catalog/presentation/'+type+'?compact=1').expect(200);
      const linked=type==='special-cards'||type==='advanced-universe'?characters.body.data:[];
      expect(full.body.data).toEqual(baseline(raw.body.data,type,foils.body.data,linked));
      expect(decodeCatalogPresentation(compact.body.data)).toEqual(full.body.data);
      expect(compact.headers.etag).not.toBe(full.headers.etag);
    }
  });
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
    const repeated = await request(app).get('/api/v1/catalog/presentation/characters').expect(200);
    expect(repeated.body.data).toEqual(response.body.data);
    expect(repeated.headers.etag).toBe(response.headers.etag);
    await request(app).get('/api/v1/catalog/presentation/characters').set('If-None-Match', response.headers.etag).expect(304);
    const after = await pool.query('SELECT (SELECT count(*) FROM decks) AS decks, (SELECT count(*) FROM users) AS users');
    expect(after.rows).toEqual(before.rows);
  });
});

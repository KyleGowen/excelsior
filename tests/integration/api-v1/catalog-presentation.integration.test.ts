import request from 'supertest';
import { app } from '../../../src/index';
import { DataSourceConfig } from '../../../src/config/DataSourceConfig';
import { CATALOG_PRESENTATION_TYPES } from '../../../src/services/catalog-presentation/presentCatalog';
import { catalogPresentationVersion, presentCatalog as baseline, type PresentedCatalogCard } from '../../helpers/baselineCatalogPresentation';
import { decodeCatalogPresentation } from '../../../frontend/src/lib/api/catalogPresentation';
import { cardMatchesSearchQuery } from '../../../frontend/src/lib/catalog/catalogTypeMap';
import { gzipSync } from 'zlib';
import type { CatalogCard, CatalogType, FoilMapEntry } from '../../../src/services/catalog-presentation/types';

function expectedPresentation(cards: CatalogCard[], type: CatalogType, foils: FoilMapEntry[], linked: CatalogCard[]) {
  const prizePackIds = new Set(cards.filter(card => card.set === 'SKY'
    && /^PP\d{3}$/.test(card.set_number ?? '')).map(card => card.id));
  const prizePackLinks = foils.filter(link => prizePackIds.has(link.foilCardId));
  if (!prizePackLinks.length) return baseline(cards, type, foils, linked);

  // The singular foil stays compatible with the old API. Each mapped Prize
  // Pack row is additionally listed for any member of the same printing group.
  const orderedLinks = [...prizePackLinks, ...foils.filter(link => !prizePackIds.has(link.foilCardId))];
  const rows = baseline(cards, type, orderedLinks, linked);
  const byId = new Map(rows.map(row => [row.id, row]));
  const catalogVersion = catalogPresentationVersion(cards, type, foils, linked);
  const extraIdsByGroup = new Map<string, string[]>();
  for (const { foilCardId, baseCardId } of prizePackLinks) {
    const group = byId.get(baseCardId)?.presentation.groupKey;
    if (!group) throw new Error('Prize Pack printing has no base group');
    extraIdsByGroup.set(group, [...(extraIdsByGroup.get(group) ?? []), foilCardId]);
  }
  return rows.map(row => ({
    ...row,
    presentation: {
      ...row.presentation,
      catalogVersion,
      printingIds: [...new Set([
        ...row.presentation.printingIds,
        ...(extraIdsByGroup.get(row.presentation.groupKey ?? '') ?? []),
      ])],
    },
  }));
}

function withUnorderedPrintingIds(rows: PresentedCatalogCard[]) {
  return rows.map(row => ({
    ...row,
    presentation: { ...row.presentation, printingIds: [...row.presentation.printingIds].sort() },
  }));
}

describe('M4 catalog presentation through production composition', () => {
  it('finds an aspect by its linked location in full and compact catalog responses', async () => {
    for (const suffix of ['', '?compact=1']) {
      const response = await request(app).get('/api/v1/catalog/presentation/aspects' + suffix).expect(200);
      const cards = suffix ? decodeCatalogPresentation(response.body.data) : response.body.data;
      const card = cards.find((row: { set: string; set_number: string }) => row.set === 'SKY' && row.set_number === '376');
      expect(card).toBeDefined();
      expect(card.location).toBe('Streets of Chicago');
      expect(card.presentation.searchText).toContain('streets of chicago');
      for (const query of ['street', 'Chicago', 'Streets of Chicago', 'fragile']) {
        expect(cardMatchesSearchQuery(card, query)).toBe(true);
      }
      expect(cardMatchesSearchQuery(card, 'The Greene Farm')).toBe(false);
    }
  });

  it('preserves every printing in all 13 real catalogs and losslessly expands the compact response', async () => {
    const characters=await request(app).get('/api/v1/catalog/characters').expect(200);
    const foils=await request(app).get('/api/v1/catalog/foil-card-map').expect(200);
    for(const type of CATALOG_PRESENTATION_TYPES){
      const raw=await request(app).get('/api/v1/catalog/'+type).expect(200);
      const full=await request(app).get('/api/v1/catalog/presentation/'+type).expect(200);
      const compact=await request(app).get('/api/v1/catalog/presentation/'+type+'?compact=1').expect(200);
      const linked=type==='special-cards'||type==='advanced-universe'?characters.body.data:[];
      expect(withUnorderedPrintingIds(full.body.data)).toEqual(
        withUnorderedPrintingIds(expectedPresentation(raw.body.data, type, foils.body.data, linked))
      );
      expect(decodeCatalogPresentation(compact.body.data)).toEqual(full.body.data);
      expect(compact.headers.etag).not.toBe(full.headers.etag);
      if(type==='characters'||type==='special-cards') {
        // Guard the actual compressed download, not just decoded JSON length.
        expect(gzipSync(JSON.stringify(compact.body)).length).toBeLessThan(gzipSync(JSON.stringify(full.body)).length);
      }
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

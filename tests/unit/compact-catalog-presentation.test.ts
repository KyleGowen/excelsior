import { compactCatalogPresentation } from '../../src/services/catalog-presentation/compactPresentation';
import { CATALOG_PRESENTATION_TYPES, presentCatalog } from '../../src/services/catalog-presentation/presentCatalog';
import { decodeCatalogPresentation } from '../../frontend/src/lib/api/catalogPresentation';

describe('compact catalog wire contract', () => {
  it.each(CATALOG_PRESENTATION_TYPES)('round-trips %s without changing metadata, IDs, errata or ordering', type => {
    const rows = presentCatalog([{ id: 'a', name: 'Hero', set: 'SKY', errata: [{ entry_text: 'Ruling' }] },
      { id: 'b', name: 'Hero', set: 'SKY', is_foil: true }], type,
    [{ baseCardId: 'a', foilCardId: 'b', cardType: type }], [{ id: 'h', name: 'Hero' }]);
    const compact = compactCatalogPresentation(rows);
    expect(decodeCatalogPresentation(JSON.parse(JSON.stringify(compact)))).toEqual(rows);
    expect(decodeCatalogPresentation(rows)).toBe(rows);
    expect(compact.cards[0].presentation).not.toHaveProperty('catalogVersion');
    expect(JSON.stringify(compact).length).toBeLessThan(JSON.stringify(rows).length);
  });
  it('supports empty catalogs and gives expanded rows independent picker arrays', () => {
    expect(decodeCatalogPresentation(compactCatalogPresentation([]))).toEqual([]);
    const rows = presentCatalog([{ id: 'a', name: 'Hero' }, { id: 'b', name: 'Hero' }], 'characters', [], []);
    const expanded = decodeCatalogPresentation(compactCatalogPresentation(rows));
    expect(expanded[0].presentation?.printingIds).not.toBe(expanded[1].presentation?.printingIds);
  });
  it.each(['format','schema','version','group','negative group','printing identity','missing group','missing printingIds','raw rows'])('rejects malformed %s instead of using client rule fallbacks', error => {
    const compact = compactCatalogPresentation(presentCatalog([{ id: 'a', name: 'Hero' }], 'characters', [], []));
    const bad = JSON.parse(JSON.stringify(compact));
    if(error==='format') bad.format='unknown';
    if(error==='schema') bad.schemaVersion=2;
    if(error==='version') bad.catalogVersion=null;
    if(error==='group') bad.cards[0].presentation.group=999;
    if(error==='negative group') bad.cards[0].presentation.group=-1;
    if(error==='printing identity') bad.cards[0].presentation.printingId='wrong';
    if(error==='missing group') bad.groups=[];
    if(error==='missing printingIds') delete bad.groups[0].printingIds;
    if(error==='raw rows') { expect(() => decodeCatalogPresentation([{id:'a'}])).toThrow('metadata is unavailable'); return; }
    expect(() => decodeCatalogPresentation(bad)).toThrow('metadata is unavailable');
  });
});

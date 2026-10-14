import { createModuleApi } from '../../../frontend/src/modules/api';
import { presentCatalog } from '../../../src/services/catalog-presentation/presentCatalog';
import { compactCatalogPresentation } from '../../../src/services/catalog-presentation/compactPresentation';
function response(data: unknown) { return { ok: true, status: 200, text: async () => JSON.stringify({ data }), json: async () => ({ data }) } as Response; }
it('expands compact data through the host transport and preserves forced-fresh cancellation/cache policy', async () => {
 const rows=presentCatalog([{id:'fictional',name:'Hero',set:'SKY'}],'characters',[],[]);
 const fetcher=jest.fn(async()=>response(compactCatalogPresentation(rows)));
 const client=createModuleApi({fetcher,apiBase:'https://host.example',credentials:'omit'});
 const signal=new AbortController().signal;
 expect(await client.fetchCatalog('characters',signal)).toEqual(rows);
 expect(await client.fetchCatalogFresh('characters',signal)).toEqual(rows);
 expect(fetcher).toHaveBeenCalledTimes(2);
 expect((fetcher.mock.calls[1] as unknown as [string,RequestInit])).toEqual([
  'https://host.example/api/v1/catalog/presentation/characters?compact=1',
  expect.objectContaining({cache:'no-store',credentials:'omit',signal}),
 ]);
});
it('binds catalog, Collection and favorites to its own host transport without changing another host', async () => {
 const a = jest.fn(async () => response([])); const b = jest.fn(async () => response([]));
 const first = createModuleApi({ apiBase: 'https://first.example', pathPrefix: '/api/host', fetcher: a, credentials: 'omit', getHeaders: () => ({ Authorization: 'Bearer fictional-player-a' }) });
 const second = createModuleApi({ apiBase: 'https://second.example', fetcher: b });
 await first.fetchCatalog('characters'); await second.fetchCollectionCards(); await first.fetchFavoriteDecks();
 expect(a.mock.calls.map(call => (call as unknown as [string])[0])).toEqual(['https://first.example/api/host/api/v1/catalog/presentation/characters?compact=1', 'https://first.example/api/host/api/v1/decks/favorites']);
 expect((a.mock.calls[0] as unknown as [string, RequestInit])[1]).toMatchObject({ credentials: 'omit', headers: { Authorization: 'Bearer fictional-player-a' } });
 expect((b.mock.calls[0] as unknown as [string, RequestInit])[0]).toBe('https://second.example/api/v1/collections/me/cards');
 expect((b.mock.calls[0] as unknown as [string, RequestInit])[1]).toMatchObject({ credentials: 'include' });
});
it('routes only Database catalog reads through native service attribution and preserves player operations', async () => {
 const catalog = jest.fn(async () => response([])); const player = jest.fn(async () => response([]));
 const client = createModuleApi({ fetcher: player }, { fetcher: catalog, pathPrefix: '/api/apps/excelsior' });
 await client.fetchCatalog('characters'); await client.fetchCatalogFresh('characters'); await client.fetchSets(); await client.fetchFoilCardMap();
 await client.fetchCollectionCards(); await client.fetchFavoriteDecks();
 expect(catalog.mock.calls.map(call => (call as unknown as [string])[0])).toEqual([
 '/api/apps/excelsior/api/v1/catalog/presentation/characters?compact=1', '/api/apps/excelsior/api/v1/catalog/presentation/characters?compact=1',
 '/api/apps/excelsior/api/v1/dbv/sets', '/api/apps/excelsior/api/v1/catalog/foil-card-map']);
 expect(player.mock.calls.map(call => (call as unknown as [string])[0])).toEqual(['/api/v1/collections/me/cards', '/api/v1/decks/favorites']);
 expect((catalog.mock.calls[0] as unknown as [string, RequestInit])[1]).toMatchObject({ credentials: 'include' });
});
it('attributes builder calls separately while preserving catalog and other player transports', async () => {
 const builder=jest.fn(async()=>response([])),catalog=jest.fn(async()=>response([])),player=jest.fn(async()=>response([]));
 const client=createModuleApi({fetcher:player},{fetcher:catalog,pathPrefix:'/api/apps/excelsior'},{fetcher:builder,pathPrefix:'/api/apps/excelsior-deckbuilder'});
 await client.fetchFavoriteDecks();await client.fetchDeckFull('fictional', false);await client.fetchSets();await client.fetchCollectionCards();
 expect(builder.mock.calls.map(c=>(c as unknown as [string])[0])).toEqual(['/api/apps/excelsior-deckbuilder/api/v1/decks/favorites','/api/apps/excelsior-deckbuilder/api/v1/decks/fictional/full']);
 expect(catalog.mock.calls.map(c=>(c as unknown as [string])[0])).toEqual(['/api/apps/excelsior/api/v1/dbv/sets']);expect(player.mock.calls.map(c=>(c as unknown as [string])[0])).toEqual(['/api/v1/collections/me/cards']);
 expect((builder.mock.calls[0] as unknown as [string,RequestInit])[1]).toMatchObject({credentials:'include'});
});

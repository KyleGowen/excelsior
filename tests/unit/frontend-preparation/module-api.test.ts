import { createModuleApi } from '../../../frontend/src/modules/api';
function response(data: unknown) { return { ok: true, status: 200, text: async () => JSON.stringify({ data }), json: async () => ({ data }) } as Response; }
it('binds catalog, Collection and favorites to its own host transport without changing another host', async () => {
 const a = jest.fn(async () => response([])); const b = jest.fn(async () => response([]));
 const first = createModuleApi({ apiBase: 'https://first.example', pathPrefix: '/api/host', fetcher: a, credentials: 'omit', getHeaders: () => ({ Authorization: 'Bearer fictional-player-a' }) });
 const second = createModuleApi({ apiBase: 'https://second.example', fetcher: b });
 await first.fetchCatalog('characters'); await second.fetchCollectionCards(); await first.fetchFavoriteDecks();
 expect(a.mock.calls.map(call => (call as unknown as [string])[0])).toEqual(['https://first.example/api/host/api/v1/catalog/presentation/characters', 'https://first.example/api/host/api/v1/decks/favorites']);
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
 '/api/apps/excelsior/api/v1/catalog/presentation/characters', '/api/apps/excelsior/api/v1/catalog/presentation/characters',
 '/api/apps/excelsior/api/v1/dbv/sets', '/api/apps/excelsior/api/v1/catalog/foil-card-map']);
 expect(player.mock.calls.map(call => (call as unknown as [string])[0])).toEqual(['/api/v1/collections/me/cards', '/api/v1/decks/favorites']);
 expect((catalog.mock.calls[0] as unknown as [string, RequestInit])[1]).toMatchObject({ credentials: 'include' });
});

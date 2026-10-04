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

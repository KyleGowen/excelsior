import { createApiClient, type ApiTransportOptions } from '../lib/api/client';
import { createCatalogApi } from '../lib/api/catalog';
import { createDeckApi } from '../lib/api/decks';
import { createCollectionApi } from '../lib/api/collection';
import { createFavoritesApi } from '../lib/api/favorites';
import { createSavedViewsApi } from '../lib/api/savedDatabaseViews';
import { createCandidateApi } from '../lib/api/deckCandidates';
/** One immutable, typed client per host. Private service credentials remain server-side. */
export function createModuleApi(transport: ApiTransportOptions = {}, catalogTransport?: ApiTransportOptions, deckbuilderTransport?: ApiTransportOptions) {
 const client = createApiClient(transport);
 const catalog = catalogTransport ? createApiClient(catalogTransport).api : client.api;
 const builder = deckbuilderTransport ? createApiClient(deckbuilderTransport) : client;
 return { ...createCatalogApi(catalog), ...createDeckApi(builder.api, builder.request),
 ...createCollectionApi(client.api), ...createFavoritesApi(builder.api),
 ...createSavedViewsApi(client.api), ...createCandidateApi(builder.request) };
}
export type ModuleApi = ReturnType<typeof createModuleApi>;

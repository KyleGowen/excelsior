import { createApiClient, type ApiTransportOptions } from '../lib/api/client';
import { createCatalogApi } from '../lib/api/catalog';
import { createDeckApi } from '../lib/api/decks';
import { createCollectionApi } from '../lib/api/collection';
import { createFavoritesApi } from '../lib/api/favorites';
import { createSavedViewsApi } from '../lib/api/savedDatabaseViews';
import { createCandidateApi } from '../lib/api/deckCandidates';
/** One immutable, typed client per host. Private service credentials remain server-side. */
export function createModuleApi(transport: ApiTransportOptions = {}, catalogTransport?: ApiTransportOptions) {
 const client = createApiClient(transport);
 const catalog = catalogTransport ? createApiClient(catalogTransport).api : client.api;
 return { ...createCatalogApi(catalog), ...createDeckApi(client.api, client.request),
 ...createCollectionApi(client.api), ...createFavoritesApi(client.api),
 ...createSavedViewsApi(client.api), ...createCandidateApi(client.request) };
}
export type ModuleApi = ReturnType<typeof createModuleApi>;

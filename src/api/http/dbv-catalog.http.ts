import { CATALOG_PRESENTATION_TYPES } from '../../services/catalog-presentation/presentCatalog';
import type { Request, RequestHandler, Response, Router } from 'express';
import { CatalogService } from '../services/catalogService';
import {
  parseSinceVersionQuery,
  getCatalogDataVersion,
  sendCachedCatalogResponse
} from './catalogCache';
import { sendV1Json } from './v1Envelope';

export interface DbvCatalogV1HttpDeps {
  catalogService: CatalogService;
  /** Session cookie and/or Bearer JWT (see `createV1SessionOrBearerAuthMiddleware`). */
  catalogAuth: RequestHandler;
}

/**
 * Wrap a catalog loader with conditional-GET + cache headers + `?since_version`.
 * Keeps the per-route handler readable (no try/catch duplication).
 */
function registerCachedCatalogGet<T>(
  router: Router,
  path: string,
  catalogAuth: RequestHandler,
  loader: () => Promise<T[]>,
  errorCode = 'CATALOG_ERROR',
  errorMessage = 'Failed to fetch catalog data'
): void {
  router.get(path, catalogAuth, async (req: Request, res: Response) => {
    try {
      const sinceVersion = parseSinceVersionQuery(req);
      const currentVersion = getCatalogDataVersion();
      const payload =
        sinceVersion !== null && sinceVersion >= currentVersion
          ? ([] as T[])
          : await loader();
      sendCachedCatalogResponse(req, res, payload);
    } catch (error) {
      console.error(`v1 ${path} error:`, error);
      sendV1Json(res, 500, null, [{ code: errorCode, message: errorMessage }]);
    }
  });
}

export function registerDbvCatalogV1HttpRoutes(router: Router, deps: DbvCatalogV1HttpDeps): void {
  for (const type of CATALOG_PRESENTATION_TYPES) {
    registerCachedCatalogGet(router, '/catalog/presentation/' + type, deps.catalogAuth,
      () => deps.catalogService.getPresentation(type));
  }
  registerCachedCatalogGet(
    router,
    '/catalog/characters',
    deps.catalogAuth,
    () => deps.catalogService.getAllCharacters(),
    'CATALOG_ERROR',
    'Failed to fetch characters'
  );

  registerCachedCatalogGet(
    router,
    '/catalog/locations',
    deps.catalogAuth,
    () => deps.catalogService.getAllLocations(),
    'CATALOG_ERROR',
    'Failed to fetch locations'
  );

  registerCachedCatalogGet(
    router,
    '/catalog/battlegrounds',
    deps.catalogAuth,
    () => deps.catalogService.getAllBattlegrounds(),
    'CATALOG_ERROR',
    'Failed to fetch battlegrounds'
  );

  registerCachedCatalogGet(
    router,
    '/catalog/special-cards',
    deps.catalogAuth,
    () => deps.catalogService.getAllSpecialCards(),
    'CATALOG_ERROR',
    'Failed to fetch special cards'
  );

  registerCachedCatalogGet(
    router,
    '/catalog/missions',
    deps.catalogAuth,
    () => deps.catalogService.getAllMissions(),
    'CATALOG_ERROR',
    'Failed to fetch missions'
  );

  registerCachedCatalogGet(
    router,
    '/catalog/events',
    deps.catalogAuth,
    () => deps.catalogService.getAllEvents(),
    'CATALOG_ERROR',
    'Failed to fetch events'
  );

  registerCachedCatalogGet(
    router,
    '/catalog/aspects',
    deps.catalogAuth,
    () => deps.catalogService.getAllAspects(),
    'CATALOG_ERROR',
    'Failed to fetch aspects'
  );

  registerCachedCatalogGet(
    router,
    '/catalog/advanced-universe',
    deps.catalogAuth,
    () => deps.catalogService.getAllAdvancedUniverse(),
    'CATALOG_ERROR',
    'Failed to fetch advanced universe'
  );

  registerCachedCatalogGet(
    router,
    '/catalog/teamwork',
    deps.catalogAuth,
    () => deps.catalogService.getAllTeamwork(),
    'CATALOG_ERROR',
    'Failed to fetch teamwork'
  );

  registerCachedCatalogGet(
    router,
    '/catalog/ally-universe',
    deps.catalogAuth,
    () => deps.catalogService.getAllAllyUniverse(),
    'CATALOG_ERROR',
    'Failed to fetch ally universe'
  );

  registerCachedCatalogGet(
    router,
    '/catalog/training',
    deps.catalogAuth,
    () => deps.catalogService.getAllTraining(),
    'CATALOG_ERROR',
    'Failed to fetch training cards'
  );

  registerCachedCatalogGet(
    router,
    '/catalog/basic-universe',
    deps.catalogAuth,
    () => deps.catalogService.getAllBasicUniverse(),
    'CATALOG_ERROR',
    'Failed to fetch basic universe cards'
  );

  registerCachedCatalogGet(
    router,
    '/catalog/power-cards',
    deps.catalogAuth,
    () => deps.catalogService.getAllPowerCards(),
    'CATALOG_ERROR',
    'Failed to fetch power cards'
  );

  router.get('/catalog/foil-card-map', deps.catalogAuth, async (req, res) => {
    try {
      const data = await deps.catalogService.getFoilCardMap();
      sendCachedCatalogResponse(req, res, data);
    } catch (error) {
      console.error('v1 /catalog/foil-card-map error:', error);
      sendV1Json(res, 500, null, [
        { code: 'CATALOG_ERROR', message: 'Failed to fetch foil card map' }
      ]);
    }
  });
}

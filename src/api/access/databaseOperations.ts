import { CATALOG_PRESENTATION_TYPES } from '../../services/catalog-presentation/presentCatalog';

export const DATABASE_SERVICE_PREFIX = '/api/service/v1';
export const NATIVE_DATABASE_PREFIX = '/api/apps/excelsior';
const reads = new Set([
  ...CATALOG_PRESENTATION_TYPES.map(type => '/api/v1/catalog/presentation/' + type),
  '/api/v1/catalog/foil-card-map', '/api/v1/dbv/sets', '/api/v1/config/app',
]);

/** Literal paths only: no record IDs, encoded separators, traversal or arbitrary upstream URLs. */
export function isDatabaseRead(method: string, path: string): boolean {
  return method === 'GET' && reads.has(path);
}
export function databaseCanonicalPath(path: string): string {
  if (path.startsWith(DATABASE_SERVICE_PREFIX + '/')) return '/api/v1' + path.slice(DATABASE_SERVICE_PREFIX.length);
  if (path.startsWith(NATIVE_DATABASE_PREFIX + '/')) return path.slice(NATIVE_DATABASE_PREFIX.length);
  return path;
}

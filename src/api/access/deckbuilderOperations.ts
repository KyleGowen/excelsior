import type { ServiceScope } from './serviceAccessConfig';

export const DECKBUILDER_SERVICE_PREFIX = '/api/service/deckbuilder/v1';
export const NATIVE_DECKBUILDER_PREFIX = '/api/apps/excelsior-deckbuilder';
export const DECKBUILDER_BODY_LIMIT = 256 * 1024;
export const DECKBUILDER_PREVIEWS = [
  '/api/v1/decks/evaluate', '/api/v1/decks/candidates/evaluate',
  '/api/v1/decks/draw', '/api/v1/decks/export',
] as const;

export function isDeckbuilderPreview(method: string, path: string): boolean {
  return method === 'POST' && (DECKBUILDER_PREVIEWS as readonly string[]).includes(path);
}
export function deckbuilderCanonicalPath(path: string): string {
  if (path.startsWith(DECKBUILDER_SERVICE_PREFIX + '/')) return '/api/v1' + path.slice(DECKBUILDER_SERVICE_PREFIX.length);
  if (path.startsWith(NATIVE_DECKBUILDER_PREFIX + '/')) return path.slice(NATIVE_DECKBUILDER_PREFIX.length);
  return path;
}
/** Native attribution preserves existing player checks; these operations are never exposed to BMG. */
export function nativeDeckbuilderScope(method: string, path: string): ServiceScope | null {
  if (isDeckbuilderPreview(method, path) || (method === 'POST' && path === '/api/v1/admin/decks/hand-analysis')) return 'decks:read';
  const id = '[a-zA-Z0-9_-]{1,100}';
  if (method === 'GET' && (path === '/api/v1/decks/favorites' || new RegExp('^/api/v1/decks/' + id + '/full$').test(path))) return 'decks:read';
  if (new RegExp('^/api/v1/decks/' + id + '/favorite$').test(path) && ['POST', 'DELETE'].includes(method)) return 'decks:write';
  if (method === 'PUT' && new RegExp('^/api/v1/decks/' + id + '(?:/cards)?$').test(path)) return 'decks:write';
  if ((method === 'POST' && path === '/api/v1/guest/decks') ||
    (method === 'GET' && new RegExp('^/api/v1/guest/decks/' + id + '$').test(path)) ||
    (method === 'PUT' && new RegExp('^/api/v1/guest/decks/' + id + '(?:/cards)?$').test(path))) return 'guest:decks';
  return null;
}
/** Safe templates for telemetry; caller-supplied IDs never become metric dimensions. */
export function deckbuilderRouteKey(method: string, path: string): string {
  if (!nativeDeckbuilderScope(method, path)) return method + ' /api/v1/deckbuilder/unsupported';
  if (isDeckbuilderPreview(method, path) || path === '/api/v1/admin/decks/hand-analysis' || path === '/api/v1/decks/favorites' || path === '/api/v1/guest/decks') return method + ' ' + path;
  return method + ' ' + path.replace(/(\/api\/v1\/(?:guest\/)?decks)\/[^/]+/, '$1/:id');
}

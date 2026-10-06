import type { ServiceScope } from './serviceAccessConfig';

/** Explicit ordinary-frontend operations; administration and unknown routes are denied. */
export function serviceScopeForOperation(method: string, apiPath: string): ServiceScope | null {
  const path = apiPath.replace(/\/+$/, '');
  if (method === 'POST' && ['/api/v1/decks/evaluate', '/api/v1/decks/candidates/evaluate', '/api/v1/decks/draw', '/api/v1/decks/export', '/api/v1/decks/summaries'].includes(path)) return 'decks:read';
  if (method === 'GET' && ['/api/v1/auth/me', '/api/auth/me', '/api/config/firebase'].includes(path)) return 'auth:session';
  if (method === 'POST' && /^\/api\/(?:v1\/auth\/(?:login|refresh|logout)|auth\/(?:login|signup|google(?:\/preview)?|logout))$/.test(path)) return 'auth:session';
  if (method === 'GET' && (/^\/api\/v1\/catalog\/[a-z-]+$/.test(path) || ['/api/v1/dbv/sets', '/api/v1/dbv/deck-backgrounds', '/api/v1/config/app', '/api/v1/recent-updates'].includes(path))) return 'catalog:read';
  if (/^\/api\/v1\/guest\/decks(?:\/[a-zA-Z0-9_-]+(?:\/(cards|ui-preferences))?(?:\/[a-zA-Z0-9_-]+)?)?$/.test(path)) return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? 'guest:decks' : null;
  if (/^\/api\/v1\/collections\/me(?:\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)*)?$/.test(path)) return method === 'GET' ? 'collections:read' : ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? 'collections:write' : null;
  if (/^\/api\/v1\/decks(?:\/[a-zA-Z0-9_-]+(?:\/(full|cards|ui-preferences))?(?:\/[a-zA-Z0-9_-]+)?)?$/.test(path)) return method === 'GET' ? 'decks:read' : ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? 'decks:write' : null;
  if (path === '/api/decks/validate' && method === 'POST') return 'decks:read';
  return null;
}

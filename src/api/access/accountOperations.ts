export const ACCOUNT_SERVICE_PREFIX = '/api/service/account/v1';
export const ACCOUNT_SESSION_HEADER = 'x-excelsior-account-session';

// Explicit aliases reuse the current account handlers; no native routing changes.
const operations: Readonly<Record<string, string>> = {
  'POST /auth/login': '/api/auth/login',
  'POST /auth/signup': '/api/auth/signup',
  'POST /auth/google/preview': '/api/auth/google/preview',
  'POST /auth/google': '/api/auth/google',
  'POST /auth/logout': '/api/auth/logout',
  'GET /auth/me': '/api/auth/me',
  'GET /config/firebase': '/api/config/firebase',
  'POST /users/change-email': '/api/v1/users/change-email',
  'POST /users/change-password': '/api/v1/users/change-password',
  'POST /users/topdeck': '/api/v1/users/topdeck',
  'POST /users/display-name': '/api/v1/users/display-name',
  'GET /decks': '/api/account-decks',
  'POST /decks/import': '/api/account-decks/import',
  'POST /decks/delete': '/api/account-decks/delete',
  'POST /decks/metadata': '/api/account-decks/metadata',
  'POST /decks/save': '/api/account-decks/save',
};

/** Exact account aliases and strict deck UUIDs only. No decoding, actor selectors, administration or arbitrary forwarding. */
export function accountCanonicalPath(method: string, path: string): string | null {
  if (!path.startsWith(ACCOUNT_SERVICE_PREFIX + '/')) return null;
  const full = /^\/decks\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\/full$/i.exec(path.slice(ACCOUNT_SERVICE_PREFIX.length));
  if (method === 'GET' && full) return '/api/account-decks/' + full[1] + '/full';
  return operations[method + ' ' + path.slice(ACCOUNT_SERVICE_PREFIX.length)] ?? null;
}

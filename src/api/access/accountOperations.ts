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
  'POST /users/display-name': '/api/v1/users/display-name',
};

/** Literal paths only. No decoding, normalization, user IDs, admin, or deck access. */
export function accountCanonicalPath(method: string, path: string): string | null {
  if (!path.startsWith(ACCOUNT_SERVICE_PREFIX + '/')) return null;
  return operations[method + ' ' + path.slice(ACCOUNT_SERVICE_PREFIX.length)] ?? null;
}

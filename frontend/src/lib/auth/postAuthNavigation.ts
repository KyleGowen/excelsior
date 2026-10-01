import type { AppUser } from '../api/types';

export const GOOGLE_AUTH_RETURN_KEY = 'excelsior:google-auth-return';

interface AuthReturnLocation {
  path: string;
  previousUserId: string;
}

const INTERNAL_ORIGIN = 'http://excelsior.local';

function parseInternalPath(path: string): URL | null {
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  try {
    const url = new URL(path, INTERNAL_ORIGIN);
    return url.origin === INTERNAL_ORIGIN ? url : null;
  } catch {
    return null;
  }
}

/** Preserve the current view while changing account-specific paths and access. */
export function postAuthPath(path: string, previousUserId: string, nextUser: Pick<AppUser, 'id' | 'role'>): string {
  const url = parseInternalPath(path);
  if (!url) return '/home';

  const { pathname, search, hash } = url;
  const suffix = `${search}${hash}`;
  if (pathname.startsWith('/admin/') && nextUser.role !== 'ADMIN') return '/home';

  const collection = pathname.match(/^\/users\/[^/]+\/collection\/?$/);
  if (collection) return `/users/${nextUser.id}/collection${suffix}`;

  const decks = pathname.match(/^\/users\/([^/]+)\/decks\/?$/);
  if (decks && decks[1] === previousUserId) {
    return `/users/${nextUser.id}/decks${suffix}`;
  }

  const deck = pathname.match(/^\/users\/([^/]+)\/decks\/([^/]+)\/?$/);
  if (deck) {
    const [, ownerId, deckId] = deck;
    // Session decks belong only to the previous Guest session.
    if (deckId.startsWith('guest_')) return `/users/${nextUser.id}/decks`;

    // Persistent deck links remain readable after logout. Keep the deck open
    // without cloning it into the new Guest session.
    if (nextUser.role === 'GUEST') {
      url.searchParams.set('readonly', 'true');
      return `${pathname}${url.search}${hash}`;
    }
    if (ownerId === nextUser.id && url.searchParams.get('readonly') === 'true') {
      url.searchParams.delete('readonly');
      return `${pathname}${url.search}${hash}`;
    }
  }

  return `${pathname}${suffix}`;
}

/** Keep a deck editor's Back action aligned with the new account. */
export function postAuthState(state: unknown, previousUserId: string, nextUser: Pick<AppUser, 'id' | 'role'>): unknown {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return state;
  const returnTo = (state as { returnTo?: unknown }).returnTo;
  if (typeof returnTo !== 'string' || !parseInternalPath(returnTo)) return state;
  const nextReturnTo = postAuthPath(returnTo, previousUserId, nextUser);
  return nextReturnTo === returnTo ? state : { ...state, returnTo: nextReturnTo };
}

export function parseGoogleAuthReturn(raw: string | null): AuthReturnLocation | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    const { path, previousUserId } = value as Partial<AuthReturnLocation>;
    if (typeof path !== 'string' || !parseInternalPath(path) || typeof previousUserId !== 'string') return null;
    return { path, previousUserId };
  } catch {
    return null;
  }
}

export function saveGoogleAuthReturn(path: string, previousUserId: string): void {
  try {
    window.sessionStorage.setItem(GOOGLE_AUTH_RETURN_KEY, JSON.stringify({ path, previousUserId }));
  } catch {
    // Google can still return to the current URL if session storage is unavailable.
  }
}

export function takeGoogleAuthReturn(): AuthReturnLocation | null {
  try {
    const saved = parseGoogleAuthReturn(window.sessionStorage.getItem(GOOGLE_AUTH_RETURN_KEY));
    window.sessionStorage.removeItem(GOOGLE_AUTH_RETURN_KEY);
    return saved;
  } catch {
    return null;
  }
}

export function clearGoogleAuthReturn(): void {
  try {
    window.sessionStorage.removeItem(GOOGLE_AUTH_RETURN_KEY);
  } catch {
    // An unavailable session store does not affect authentication.
  }
}

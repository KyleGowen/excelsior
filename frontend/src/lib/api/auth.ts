/** Auth + app-config API calls (session-cookie based). */
import { api, apiRequest, ApiError } from './client';
import { setCdnBase } from '../../app/legacyImageAssets';
import type { AppUser, AppConfig, UserRole } from './types';

interface RawMe {
  // `/api/auth/me` returns `id`/`name`; `/api/auth/login` returns `userId`/`username`.
  id?: string;
  userId?: string;
  username?: string;
  name?: string;
  email?: string | null;
  role: UserRole;
  lastLoginAt?: string | null;
  authProvider?: string | null;
  auth_provider?: string | null;
  displayName?: string | null;
  display_name?: string | null;
}

import { resolveAuthProvider } from '../auth/resolveAuthProvider';

function normaliseUser(raw: RawMe | null | undefined): AppUser | null {
  const id = raw?.id || raw?.userId;
  if (!raw || !id) return null;
  return {
    id,
    username: raw.username || raw.name || 'User',
    email: raw.email ?? null,
    role: raw.role,
    lastLoginAt: raw.lastLoginAt ?? null,
    authProvider: resolveAuthProvider(raw),
    displayName: raw.displayName ?? raw.display_name ?? null,
  };
}

export async function fetchCurrentUser(request: typeof apiRequest = apiRequest): Promise<AppUser | null> {
  try {
    const raw = await request<RawMe>('/api/auth/me', { raw: false });
    const user = normaliseUser(raw);
    if (!user) throw new Error('Invalid session response. Please try again.');
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

/** Establish a Guest session only when there is no valid session. */
export async function loadCurrentUserOrGuest(): Promise<AppUser> {
  const user = await fetchCurrentUser();
  if (user) return user;
  const guest = await loginAsGuest();
  if (!guest) throw new Error('Could not start Guest mode. Please try again.');
  return guest;
}

export async function login(username: string, password: string): Promise<AppUser | null> {
  const raw = await apiRequest<RawMe>('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  });
  return normaliseUser(raw);
}

export async function signUp(
  username: string,
  email: string,
  password: string,
): Promise<AppUser | null> {
  const raw = await apiRequest<RawMe>('/api/auth/signup', {
    method: 'POST',
    body: { username, email, password },
  });
  return normaliseUser(raw);
}

export async function loginAsGuest(): Promise<AppUser | null> {
  const raw = await apiRequest<RawMe>('/api/auth/login', {
    method: 'POST',
    body: { username: 'guest', password: 'guest' },
  });
  return normaliseUser(raw);
}

export async function logout(): Promise<void> {
  await api.post('/api/auth/logout');
}

export async function fetchAppConfig(client: typeof api = api): Promise<AppConfig> {
  try {
    const cfg = await client.get<AppConfig>('/api/v1/config/app');
    setCdnBase(cfg?.cdnBase);
    return {
      cdnBase: cfg?.cdnBase ?? '',
      communityDecksUserId: cfg?.communityDecksUserId ?? null,
      tournamentDecksUserId: cfg?.tournamentDecksUserId ?? null,
      databaseServiceAdapter: cfg?.databaseServiceAdapter === true,
    };
  } catch {
    setCdnBase('');
    return { cdnBase: '', communityDecksUserId: null, tournamentDecksUserId: null };
  }
}

/* ---- Google sign-in (Firebase) ---- */

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  [key: string]: unknown;
}

export async function fetchFirebaseConfig(): Promise<FirebaseClientConfig | null> {
  try {
    return await apiRequest<FirebaseClientConfig>('/api/config/firebase', { raw: true });
  } catch {
    return null;
  }
}

export async function completeGoogleSignIn(idToken: string): Promise<AppUser | null> {
  const raw = await apiRequest<RawMe>('/api/auth/google', {
    method: 'POST',
    body: { idToken, confirmRegistration: true },
  });
  return normaliseUser(raw);
}

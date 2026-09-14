/** Auth + app-config API calls (session-cookie based). */
import { api, apiRequest } from './client';
import { setCdnBase } from '../images/cardImages';
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
  isSupporter?: boolean;
  is_supporter?: boolean;
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
    isSupporter: raw.isSupporter ?? raw.is_supporter ?? false,
  };
}

export async function fetchCurrentUser(): Promise<AppUser | null> {
  try {
    const raw = await apiRequest<RawMe>('/api/auth/me', { raw: false });
    return normaliseUser(raw);
  } catch {
    return null;
  }
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
  try {
    await api.post('/api/auth/logout');
  } catch {
    /* best-effort */
  }
}

export async function fetchAppConfig(): Promise<AppConfig> {
  try {
    const cfg = await api.get<AppConfig>('/api/v1/config/app');
    setCdnBase(cfg?.cdnBase);
    return {
      cdnBase: cfg?.cdnBase ?? '',
      communityDecksUserId: cfg?.communityDecksUserId ?? null,
      tournamentDecksUserId: cfg?.tournamentDecksUserId ?? null,
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

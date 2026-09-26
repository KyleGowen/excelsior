/**
 * Auth context. Session-cookie based; loads the current user and app config
 * (CDN base + pool user ids) via TanStack Query. Exposes login, signup,
 * guest login, Google sign-in and logout to the rest of the app.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchCurrentUser,
  fetchAppConfig,
  login as apiLogin,
  signUp as apiSignUp,
  loginAsGuest as apiLoginAsGuest,
  logout as apiLogout,
  completeGoogleSignIn,
} from '../lib/api/auth';
import { preloadGoogleAuthClient } from '../lib/auth/googleAuthClient';
import { describeGoogleSignInError } from '../lib/auth/googleSignInErrors';
import type { AppUser } from '../lib/api/types';

export interface AuthContextValue {
  user: AppUser | null;
  isLoading: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  isSupporter: boolean;
  communityDecksUserId: string | null;
  tournamentDecksUserId: string | null;
  login: (username: string, password: string) => Promise<AppUser | null>;
  signUp: (username: string, email: string, password: string) => Promise<AppUser | null>;
  loginAsGuest: () => Promise<AppUser | null>;
  signInWithGoogle: () => Promise<AppUser | null>;
  signInWithGoogleRedirect: () => Promise<void>;
  isGoogleSignInReady: boolean;
  googleRedirectError: string | null;
  clearGoogleRedirectError: () => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [googleRedirectError, setGoogleRedirectError] = useState<string | null>(null);

  const userQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => fetchCurrentUser(),
    staleTime: 2 * 60 * 1000,
  });

  const configQuery = useQuery({
    queryKey: ['app-config'],
    queryFn: () => fetchAppConfig(),
    staleTime: 30 * 60 * 1000,
  });

  const googleAuthQuery = useQuery({
    queryKey: ['auth', 'google-client'],
    queryFn: preloadGoogleAuthClient,
    staleTime: Infinity,
    retry: false,
  });

  const user = userQuery.data ?? null;

  const setUser = useCallback(
    (next: AppUser | null) => {
      queryClient.setQueryData(['auth', 'me'], next);
    },
    [queryClient],
  );

  const login = useCallback(
    async (username: string, password: string) => {
      const u = await apiLogin(username, password);
      setUser(u);
      return u;
    },
    [setUser],
  );

  const signUp = useCallback(
    async (username: string, email: string, password: string) => {
      const u = await apiSignUp(username, email, password);
      setUser(u);
      return u;
    },
    [setUser],
  );

  const loginAsGuest = useCallback(async () => {
    const u = await apiLoginAsGuest();
    setUser(u);
    return u;
  }, [setUser]);

  const signInWithGoogle = useCallback(async () => {
    const googleAuth = googleAuthQuery.data;
    if (!googleAuth) throw new Error('Google sign-in is still loading. Please try again.');
    setGoogleRedirectError(null);
    const result = await googleAuth.signInWithPopup();
    const idToken = await result.user.getIdToken();
    const u = await completeGoogleSignIn(idToken);
    setUser(u);
    return u;
  }, [googleAuthQuery.data, setUser]);

  const signInWithGoogleRedirect = useCallback(async () => {
    const googleAuth = googleAuthQuery.data;
    if (!googleAuth) throw new Error('Google sign-in is still loading. Please try again.');
    setGoogleRedirectError(null);
    await googleAuth.signInWithRedirect();
  }, [googleAuthQuery.data]);

  const clearGoogleRedirectError = useCallback(() => setGoogleRedirectError(null), []);

  useEffect(() => {
    const googleAuth = googleAuthQuery.data;
    if (!googleAuth) return;

    let active = true;
    void googleAuth
      .getRedirectResult()
      .then(async (result) => {
        if (!result || !active) return;
        const idToken = await result.user.getIdToken();
        const u = await completeGoogleSignIn(idToken);
        if (active) setUser(u);
      })
      .catch((error: unknown) => {
        if (active) setGoogleRedirectError(describeGoogleSignInError(error).message);
      });

    return () => {
      active = false;
    };
  }, [googleAuthQuery.data, setUser]);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    queryClient.clear();
  }, [setUser, queryClient]);

  const refresh = useCallback(async () => {
    await userQuery.refetch();
  }, [userQuery]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading: userQuery.isLoading || configQuery.isLoading,
      isGuest: user?.role === 'GUEST',
      isAdmin: user?.role === 'ADMIN',
      isSupporter: user?.isSupporter === true,
      communityDecksUserId: configQuery.data?.communityDecksUserId ?? null,
      tournamentDecksUserId: configQuery.data?.tournamentDecksUserId ?? null,
      login,
      signUp,
      loginAsGuest,
      signInWithGoogle,
      signInWithGoogleRedirect,
      isGoogleSignInReady: googleAuthQuery.isSuccess,
      googleRedirectError,
      clearGoogleRedirectError,
      logout,
      refresh,
    }),
    [
      user,
      userQuery.isLoading,
      configQuery.isLoading,
      configQuery.data,
      login,
      signUp,
      loginAsGuest,
      signInWithGoogle,
      signInWithGoogleRedirect,
      googleAuthQuery.isSuccess,
      googleRedirectError,
      clearGoogleRedirectError,
      logout,
      refresh,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

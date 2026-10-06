import { ImageAssetsContext } from '../lib/images/useImageAssets';
import * as legacyAssets from './legacyImageAssets';
/**
 * Auth context. Session-cookie based; loads the current user and app config
 * (CDN base + pool user ids) via TanStack Query. Exposes login, signup,
 * default Guest entry, account sign-in, Google sign-in and logout.
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
  loadCurrentUserOrGuest,
  fetchAppConfig,
  login as apiLogin,
  signUp as apiSignUp,
  loginAsGuest as apiLoginAsGuest,
  logout as apiLogout,
  completeGoogleSignIn,
} from '../lib/api/auth';
import { preloadGoogleAuthClient } from '../lib/auth/googleAuthClient';
import { describeGoogleSignInError } from '../lib/auth/googleSignInErrors';
import { clearGoogleAuthReturn, postAuthPath, takeGoogleAuthReturn } from '../lib/auth/postAuthNavigation';
import type { AppUser } from '../lib/api/types';

export interface AuthContextValue {
  user: AppUser | null;
  isLoading: boolean;
  authError: string | null;
  retryAuth: () => Promise<void>;
  isGuest: boolean;
  isAdmin: boolean;
  communityDecksUserId: string | null;
  tournamentDecksUserId: string | null;
  login: (username: string, password: string) => Promise<AppUser | null>;
  signUp: (username: string, email: string, password: string) => Promise<AppUser | null>;
  signInWithGoogle: () => Promise<AppUser | null>;
  signInWithGoogleRedirect: () => Promise<void>;
  isGoogleSignInReady: boolean;
  googleRedirectError: string | null;
  clearGoogleRedirectError: () => void;
  logout: () => Promise<AppUser>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [googleRedirectError, setGoogleRedirectError] = useState<string | null>(null);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);

  const userQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: loadCurrentUserOrGuest,
    staleTime: 2 * 60 * 1000,
    retry: false,
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
      queryClient.removeQueries({
        predicate: ({ queryKey }) => queryKey[0] !== 'auth' && queryKey[0] !== 'app-config',
      });
      queryClient.setQueryData(['auth', 'me'], next);
    },
    [queryClient],
  );

  const login = useCallback(
    async (username: string, password: string) => {
      const u = await apiLogin(username, password);
      if (!u) throw new Error('Could not sign in. Please try again.');
      setUser(u);
      return u;
    },
    [setUser],
  );

  const signUp = useCallback(
    async (username: string, email: string, password: string) => {
      const u = await apiSignUp(username, email, password);
      if (!u) throw new Error('Could not create account. Please try again.');
      setUser(u);
      return u;
    },
    [setUser],
  );

  const signInWithGoogle = useCallback(async () => {
    const googleAuth = googleAuthQuery.data;
    if (!googleAuth) throw new Error('Google sign-in is still loading. Please try again.');
    setGoogleRedirectError(null);
    const result = await googleAuth.signInWithPopup();
    const idToken = await result.user.getIdToken();
    const u = await completeGoogleSignIn(idToken);
    if (!u) throw new Error('Could not sign in with Google. Please try again.');
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
        if (!u) throw new Error('Could not sign in with Google. Please try again.');
        if (active) {
          const saved = takeGoogleAuthReturn();
          const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
          const nextPath = postAuthPath(saved?.path ?? currentPath, saved?.previousUserId ?? '', u);
          setUser(u);
          if (nextPath !== currentPath) window.location.replace(nextPath);
        }
      })
      .catch((error: unknown) => {
        clearGoogleAuthReturn();
        if (active) setGoogleRedirectError(describeGoogleSignInError(error).message);
      });

    return () => {
      active = false;
    };
  }, [googleAuthQuery.data, setUser]);

  const logout = useCallback(async () => {
    await apiLogout();
    setIsSwitchingAccount(true);
    try {
      const guest = await apiLoginAsGuest();
      if (!guest) throw new Error('Could not start Guest mode. Please try again.');
      setUser(guest);
      return guest;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsSwitchingAccount(false);
    }
  }, [setUser]);

  const refetchUser = userQuery.refetch;
  const retryAuth = useCallback(async () => {
    await refetchUser();
  }, [refetchUser]);
  const refresh = retryAuth;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading: userQuery.isLoading || (!user && userQuery.isFetching) || configQuery.isLoading || isSwitchingAccount,
      authError: userQuery.isError ? 'Could not connect to Excelsior. Please try again.' : null,
      retryAuth,
      isGuest: user?.role === 'GUEST',
      isAdmin: user?.role === 'ADMIN',
      communityDecksUserId: configQuery.data?.communityDecksUserId ?? null,
      tournamentDecksUserId: configQuery.data?.tournamentDecksUserId ?? null,
      login,
      signUp,
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
      userQuery.isFetching,
      userQuery.isError,
      retryAuth,
      configQuery.isLoading,
      isSwitchingAccount,
      configQuery.data,
      login,
      signUp,
      signInWithGoogle,
      signInWithGoogleRedirect,
      googleAuthQuery.isSuccess,
      googleRedirectError,
      clearGoogleRedirectError,
      logout,
      refresh,
    ],
  );

  return <ImageAssetsContext.Provider value={legacyAssets}><AuthContext.Provider value={value}>{children}</AuthContext.Provider></ImageAssetsContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

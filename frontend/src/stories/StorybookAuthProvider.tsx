import type { ReactNode } from 'react';
import { AuthContext, type AuthContextValue } from '../app/AuthProvider';
import type { AppUser } from '../lib/api/types';

export const exampleUser: AppUser = {
  id: 'storybook-user',
  username: 'Example player',
  role: 'USER',
};

const unavailable = async (): Promise<never> => {
  throw new Error('Sign-in is unavailable in the Storybook example.');
};

/** Provides screen stories with an invented user and no account network calls. */
export function StorybookAuthProvider({ children, user = exampleUser }: {
  children: ReactNode;
  user?: AppUser | null;
}) {
  const value: AuthContextValue = {
    user,
    isLoading: false,
    isGuest: user?.role === 'GUEST',
    isAdmin: user?.role === 'ADMIN',
    isSupporter: false,
    communityDecksUserId: null,
    tournamentDecksUserId: null,
    login: unavailable,
    signUp: unavailable,
    loginAsGuest: unavailable,
    signInWithGoogle: unavailable,
    signInWithGoogleRedirect: unavailable,
    isGoogleSignInReady: false,
    googleRedirectError: null,
    clearGoogleRedirectError: () => {},
    logout: async () => {},
    refresh: async () => {},
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

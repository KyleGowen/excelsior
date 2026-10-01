import { useState, type ReactNode } from 'react';
import { AuthContext, type AuthContextValue } from '../app/AuthProvider';
import type { AppUser } from '../lib/api/types';

export const exampleUser: AppUser = {
  id: 'storybook-user',
  username: 'Example player',
  role: 'USER',
};

const guestUser: AppUser = { id: 'storybook-guest', username: 'guest', role: 'GUEST' };

const unavailable = async (): Promise<never> => {
  throw new Error('Sign-in is unavailable in the Storybook example.');
};

/** Provides screen stories with an invented user and no account network calls. */
export function StorybookAuthProvider({ children, user = exampleUser, interactiveAuth = false }: {
  children: ReactNode;
  user?: AppUser | null;
  interactiveAuth?: boolean;
}) {
  const [activeUser, setActiveUser] = useState(user);
  const memberUser: AppUser = { ...exampleUser, id: 'storybook-member' };
  const signIn = async (): Promise<AppUser> => {
    setActiveUser(memberUser);
    return memberUser;
  };
  const signOut = async (): Promise<AppUser> => {
    setActiveUser(guestUser);
    return guestUser;
  };
  const value: AuthContextValue = {
    user: activeUser,
    isLoading: false,
    authError: null,
    retryAuth: async () => {},
    isGuest: activeUser?.role === 'GUEST',
    isAdmin: activeUser?.role === 'ADMIN',
    isSupporter: false,
    communityDecksUserId: null,
    tournamentDecksUserId: null,
    login: interactiveAuth ? signIn : unavailable,
    signUp: interactiveAuth ? signIn : unavailable,
    signInWithGoogle: unavailable,
    signInWithGoogleRedirect: unavailable,
    isGoogleSignInReady: false,
    googleRedirectError: null,
    clearGoogleRedirectError: () => {},
    logout: interactiveAuth ? signOut : async () => guestUser,
    refresh: async () => {},
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

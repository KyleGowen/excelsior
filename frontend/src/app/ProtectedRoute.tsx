/** Waits for an existing session or the default Guest session. */
import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { LoadingState } from '../components/LoadingState';
import './ProtectedRoute.css';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, authError, retryAuth } = useAuth();

  if (isLoading) {
    return <LoadingState fullscreen label="Loading Excelsior..." />;
  }
  if (!user) {
    return (
      <main className="auth-recovery" role="alert">
        <h1>Guest mode is unavailable</h1>
        <p>{authError ?? 'Could not start Guest mode. Please try again.'}</p>
        <button type="button" className="btn btn-primary" onClick={() => void retryAuth()}>Try again</button>
      </main>
    );
  }
  return <>{children}</>;
}

import { useRouteError } from 'react-router-dom';
import { isModuleLoadError } from './isModuleLoadError';
import './RouteErrorScreen.css';

/** Root route fallback, including React.lazy failures after a new deployment. */
export function RouteErrorScreen({ error }: { error?: unknown }) {
  const routeError = useRouteError();
  const moduleFailed = isModuleLoadError(error ?? routeError);

  return (
    <main className="route-error" role="alert">
      <div className="route-error__card">
        <span className="route-error__eyebrow">Excelsior</span>
        <h1>{moduleFailed ? 'This page needs a refresh' : 'Something went wrong'}</h1>
        <p>
          {moduleFailed
            ? 'The app could not load this page. A newer version may be available. Refresh to continue.'
            : 'The app ran into a problem. Refresh the page to try again.'}
        </p>
        <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
          Refresh page
        </button>
      </div>
    </main>
  );
}

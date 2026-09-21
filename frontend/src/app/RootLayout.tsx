import { Outlet, useLocation } from 'react-router-dom';
import { AppBackground } from '../components/AppBackground';
import { SupporterFlowProvider } from '../features/supporter-flow';

export function RootLayout() {
  const { pathname } = useLocation();
  const showSubtleBg = pathname !== '/login';

  return (
    <SupporterFlowProvider>
      <div className="app-root">
        {showSubtleBg ? <AppBackground variant="subtle" /> : null}
        <div className="app-root__content">
          <Outlet />
        </div>
      </div>
    </SupporterFlowProvider>
  );
}

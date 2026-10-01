import { Outlet } from 'react-router-dom';
import { AppBackground } from '../components/AppBackground';
import { SupporterFlowProvider } from '../features/supporter-flow';

export function RootLayout() {
  return (
    <SupporterFlowProvider>
      <div className="app-root">
        <AppBackground variant="subtle" />
        <div className="app-root__content">
          <Outlet />
        </div>
      </div>
    </SupporterFlowProvider>
  );
}

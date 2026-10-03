import { Outlet } from 'react-router-dom';
import { AppBackground } from '../components/AppBackground';

export function RootLayout() {
  return (
    <div className="app-root">
      <AppBackground variant="subtle" />
      <div className="app-root__content">
        <Outlet />
      </div>
    </div>
  );
}

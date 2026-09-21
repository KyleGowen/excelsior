import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/AuthProvider';
import { useLayoutMode } from '../../lib/layout/LayoutModeProvider';
import { Logo } from '../Logo';
import { UserMenu } from '../UserMenu';
import { MobileBottomNav } from '../MobileBottomNav';
import { NAV_ITEMS } from '../MobileBottomNav/navConfig';
import './AppShell.css';

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isMobile } = useLayoutMode();
  const location = useLocation();

  const userId = user?.id ?? '';

  if (isMobile) {
    return (
      <div className="app-shell app-shell--mobile">
        <main className="app-shell__content">{children}</main>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="app-shell app-shell--desktop">
      <header className="top-nav">
        <div className="top-nav__inner">
          <NavLink to="/home" className="top-nav__brand" aria-label="Excelsior home">
            <Logo variant="emblem" height={30} />
          </NavLink>

          <nav className="top-nav__tabs" aria-label="Primary">
            {NAV_ITEMS.map((item) => {
              const active = item.match(location.pathname, userId);
              return (
                <NavLink
                  key={item.key}
                  to={item.to(userId)}
                  className={`top-nav__tab ${active ? 'is-active' : ''}`}
                >
                  <span className="top-nav__tab-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="top-nav__right">
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="app-shell__content">{children}</main>
    </div>
  );
}

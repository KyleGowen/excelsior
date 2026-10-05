/**
 * Layout mode (desktop vs mobile). Re-uses the FOUC globals set up in
 * index.html so detection stays consistent: viewport <= 900px is mobile,
 * unless `localStorage.preferDesktopLayout === '1'`. Never branches on
 * user-agent. Components read this via `useLayoutMode()`.
 */
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { LayoutModeContext, type LayoutModeValue } from './layoutModeContext';

const MOBILE_MAX_PX = 900;

function computeIsMobile(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.isLayoutMobile === 'function') return window.isLayoutMobile();
  return window.matchMedia(`(max-width: ${MOBILE_MAX_PX}px)`).matches;
}

function computePreferDesktop(): boolean {
  try {
    return localStorage.getItem('preferDesktopLayout') === '1';
  } catch {
    return false;
  }
}

// The container host and ordinary viewport host share only the typed context.


export function LayoutModeProvider({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState<boolean>(computeIsMobile);
  const [preferDesktop, setPreferDesktopState] = useState<boolean>(computePreferDesktop);

  useEffect(() => {
    const sync = () => {
      if (typeof window.applyLayoutMode === 'function') window.applyLayoutMode();
      setIsMobile(computeIsMobile());
      setPreferDesktopState(computePreferDesktop());
    };
    const mql = window.matchMedia(`(max-width: ${MOBILE_MAX_PX}px)`);
    mql.addEventListener('change', sync);
    window.addEventListener('resize', sync);
    window.addEventListener('layout-mode-change', sync);
    return () => {
      mql.removeEventListener('change', sync);
      window.removeEventListener('resize', sync);
      window.removeEventListener('layout-mode-change', sync);
    };
  }, []);

  const setPreferDesktop = useCallback((on: boolean) => {
    if (typeof window.setPreferDesktopLayout === 'function') {
      window.setPreferDesktopLayout(on);
    } else {
      try {
        if (on) localStorage.setItem('preferDesktopLayout', '1');
        else localStorage.removeItem('preferDesktopLayout');
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new CustomEvent('layout-mode-change'));
    }
  }, []);

  const value = useMemo<LayoutModeValue>(
    () => ({
      isMobile,
      isDesktop: !isMobile,
      preferDesktop,
      setPreferDesktop,
    }),
    [isMobile, preferDesktop, setPreferDesktop],
  );

  return <LayoutModeContext.Provider value={value}>{children}</LayoutModeContext.Provider>;
}

export function useLayoutMode(): LayoutModeValue {
  const ctx = useContext(LayoutModeContext);
  if (!ctx) {
    throw new Error('useLayoutMode must be used within a LayoutModeProvider');
  }
  return ctx;
}

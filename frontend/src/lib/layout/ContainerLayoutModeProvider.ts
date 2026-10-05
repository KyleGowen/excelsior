import { createElement, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { LayoutModeContext } from './layoutModeContext';
export interface ContainerLayoutOptions {
 mode: 'container';
 /** Measured container width at or below this threshold uses mobile behavior. */
 mobileMaxWidth?: number;
}
/** Container-owned layout; never reads/writes global layout classes or preferences. */
export function ContainerLayoutModeProvider({ options, children }: { options: ContainerLayoutOptions; children: ReactNode }) {
 const threshold = options.mobileMaxWidth ?? 900;
 if (!Number.isFinite(threshold) || threshold <= 0) throw new Error('Container mobileMaxWidth must be a positive finite width');
 const element = useRef<HTMLDivElement>(null);
 const [width, setWidth] = useState(0);
 const [preferDesktop, setPreferDesktop] = useState(false);
 useLayoutEffect(() => {
  const target = element.current;
  if (!target) return;
  let active = true;
  const measure = () => { if (active) setWidth(target.getBoundingClientRect().width); };
  measure();
  const ownerWindow = target.ownerDocument.defaultView;
  const Observer = ownerWindow?.ResizeObserver;
  const observer = Observer ? new Observer(measure) : undefined;
  observer?.observe(target);
  // Older hosts without ResizeObserver retain a documented viewport-resize fallback.
  if (!observer) ownerWindow?.addEventListener('resize', measure);
  return () => { active = false; observer?.disconnect(); if (!observer) ownerWindow?.removeEventListener('resize', measure); };
 }, []);
 const isMobile = !preferDesktop && width <= threshold;
 const value = useMemo(() => ({ isMobile, isDesktop: !isMobile, preferDesktop, setPreferDesktop }), [isMobile, preferDesktop]);
 return createElement('div', { ref: element, className: `module-layout-container layout-${isMobile ? 'mobile' : 'desktop'}`, 'data-layout-mode': isMobile ? 'mobile' : 'desktop',
  style: { position: 'relative', width: '100%', maxWidth: '100%', minWidth: 0, minHeight: 'inherit' } }, createElement(LayoutModeContext.Provider, { value }, children));
}

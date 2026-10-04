import { createElement, createContext, useContext, type ReactNode } from 'react';

/** Placement is owned by the embedding host. No document/body styles are changed. */
export interface OverlayHostOptions {
  root: HTMLElement;
  position?: 'fixed' | 'absolute';
  /** Nonmodal panels allow keyboard focus to leave the panel. Defaults to modal. */
  modal?: boolean;
}
const OverlayHostContext = createContext<OverlayHostOptions | null>(null);
export function OverlayHostProvider({ options, children }: { options?: OverlayHostOptions; children: ReactNode }) {
  return createElement(OverlayHostContext.Provider, { value: options ?? null }, children);
}
export function useOverlayHost() { return useContext(OverlayHostContext); }

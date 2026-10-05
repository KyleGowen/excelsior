import { Fragment, createElement, createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { AppUser } from '../lib/api/types';
import type { ModuleApi } from './api';
import type { ModuleCardActions } from './cardActions';
import { UIIconOverridesContext, type ModuleIconOptions } from '../lib/icons/uiIconOverrides';
import { ModuleAppearanceBoundary, type ModuleAppearanceOptions } from './ModuleAppearanceBoundary';
import { ContainerLayoutModeProvider, type ContainerLayoutOptions } from '../lib/layout/ContainerLayoutModeProvider';
import { OverlayHostProvider, type OverlayHostOptions } from '../lib/layout/OverlayHostProvider';
import { createCardDetailHistoryController, CARD_DETAIL_STATE_KEY, type CardDetailNavigation } from '../lib/layout/cardDetailHistoryController';
/** The host owns identity, routing and chrome; no authentication bootstrap happens here. */
export interface ModuleHost {
 api: ModuleApi;
 identity: { user: AppUser | null; isGuest: boolean; isAdmin: boolean };
 onOpenDeck: (deckId: string, options?: { replace?: boolean }) => void;
 onBack: () => void;
 onHome: () => void;
 backLabel?: string;
 /** Opt-in replacement for the card-detail action area; ordinary hosts omit it. */
 cardActions?: ModuleCardActions;
 /** Decorative UI controls only; omitted preserves ordinary Excelsior SVGs. */
 icons?: ModuleIconOptions;
 /** Explicit portal placement; absent preserves existing inline overlays. */
 overlays?: OverlayHostOptions;
 /** Omit to retain the ordinary host's viewport layout. */
 layout?: ContainerLayoutOptions;
 /** Opt-in visual tokens scoped to this module instance. Configure the boundary at mount. */
 appearance?: ModuleAppearanceOptions;
 history?: { navigate: CardDetailNavigation; state: object | null };
 chrome?: { brand?: ReactNode; desktopRail?: ReactNode; mobileNavigation?: ReactNode };
}
const Context = createContext<ModuleHost | null>(null);
export function ModuleHostProvider({ host, children }: { host: ModuleHost; children: ReactNode }) {
 const content = createElement(OverlayHostProvider, { ...(host.overlays ? { options: host.overlays } : {}), children });
 const themed = host.appearance ? createElement(ModuleAppearanceBoundary, { options: host.appearance, children: content }) : content;
 const layout = host.layout ? createElement(ContainerLayoutModeProvider, { options: host.layout, children: themed }) : themed;
 return createElement(Context.Provider, { value: host }, createElement(UIIconOverridesContext.Provider, { value: host.icons ?? null }, createElement(Fragment, null, host.chrome?.brand, layout)));
}
export function useOptionalModuleHost() { return useContext(Context); }
export function useModuleHost() {
 const host = useOptionalModuleHost();
 if (!host) throw new Error('ModuleHostProvider is required; supply a typed API client and host identity/callbacks.');
 return host;
}
export function useModuleDetailHistory(open: boolean, onClose: () => void, stateKey = CARD_DETAIL_STATE_KEY) {
 const host = useModuleHost(); const closeRef = useRef(onClose); closeRef.current = onClose;
 const stateRef = useRef(host.history?.state); stateRef.current = host.history?.state;
 const navigate = host.history?.navigate;
 const controller = useMemo(() => navigate ? createCardDetailHistoryController(navigate, () => closeRef.current(), stateKey) : undefined, [navigate, stateKey]);
 useEffect(() => {
  if (!controller) return;
  if (!open) { controller.reset(); return; }
  controller.attach(stateRef.current ?? null);
  return () => controller.detach();
 }, [controller, open]);
 return { close: () => controller ? controller.close() : closeRef.current() };
}

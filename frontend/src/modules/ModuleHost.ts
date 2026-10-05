import { Fragment, Suspense, lazy, createElement, createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import type { AppUser } from '../lib/api/types';
import type { ModuleApi } from './api';
import type { ModuleCardActions } from './cardActions';
import type { ModuleSaveFeedback } from './saveFeedback';
import type { ModuleStyleOptions } from './ModuleStyleBoundary';
import { NativeOverlaySurface } from './NativeOverlaySurface';
const ModuleStyleBoundary = lazy(() => import('./ModuleStyleBoundary'));
import type { ModuleEditingPort } from './unsavedNavigation';
import { UIIconOverridesContext, type ModuleIconOptions } from '../lib/icons/uiIconOverrides';
import { ModuleAppearanceBoundary, type ModuleAppearanceOptions } from './ModuleAppearanceBoundary';
import { ContainerLayoutModeProvider, type ContainerLayoutOptions } from '../lib/layout/ContainerLayoutModeProvider';
import { OverlayHostProvider, type OverlayHostOptions } from '../lib/layout/OverlayHostProvider';
import { createCardDetailHistoryController, CARD_DETAIL_STATE_KEY, type CardDetailNavigation } from '../lib/layout/cardDetailHistoryController';
/** The host owns identity, routing and chrome; no authentication bootstrap happens here. */
export interface ModuleHost {
 api: ModuleApi;
 /** Opt-in stylesheet isolation; ordinary Excelsior omits it. Configure at mount. */
 styles?: ModuleStyleOptions;
 /** Availability restrictions only; true never grants backend permission. */
 features?: { drawHand?: boolean; simulateKo?: boolean; exportDeck?: boolean; addCards?: boolean };
 identity: { user: AppUser | null; isGuest: boolean; isAdmin: boolean };
 onOpenDeck: (deckId: string, options?: { replace?: boolean }) => void;
 onBack: () => void;
 onHome: () => void;
 backLabel?: string;
 /** Opt-in replacement for the card-detail action area; ordinary hosts omit it. */
 cardActions?: ModuleCardActions;
 /** Optional result/pending presentation; never controls persistence or permissions. */
 saveFeedback?: ModuleSaveFeedback;
 /** Optional lifecycle signal. The host guards every navigation path and owns discard UI. */
 editing?: ModuleEditingPort;
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
 if (host.styles && host.overlays) throw new Error('An isolated module owns its internal overlay root; omit an external overlay root');
 const isolated = Boolean(host.styles);
 const content = isolated ? createElement(NativeOverlaySurface, { children: createElement(Fragment, null, host.chrome?.brand, children) }) : createElement(OverlayHostProvider, { ...(host.overlays ? { options: host.overlays } : {}), children });
 const themed = host.appearance ? createElement(ModuleAppearanceBoundary, { options: host.appearance, native:isolated, children: content }) : content;
 const layoutOptions = host.layout ?? (isolated ? { mode: 'container' as const } : undefined);
 const layout = layoutOptions ? createElement(ContainerLayoutModeProvider, { options: layoutOptions, children: themed }) : themed;
 const surface = host.styles ? createElement(Suspense, { fallback:null }, createElement(ModuleStyleBoundary, { options: host.styles, children: layout })) : createElement(Fragment, null, host.chrome?.brand, layout);
 return createElement(Context.Provider, { value: host }, createElement(UIIconOverridesContext.Provider, { value: host.icons ?? null }, surface));
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

/** Publish only editable dirty/pending state; independent mounts register and dispose independently. */
export function useModuleEditingState(editable: boolean, dirty: boolean, saving: boolean) {
 const register = useModuleHost().editing?.register;
 useLayoutEffect(() => {
  if (register && editable && (dirty || saving)) return register({ dirty, saving });
 }, [register, editable, dirty, saving]);
}

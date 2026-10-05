import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ModuleCardActions } from './cardActions';
import type { AppUser } from '../lib/api/types';
import { CardDatabaseModule, DeckBuilderModule, CollectionModule, ModuleHostProvider, createModuleApi } from './index';
import './ModuleHarness.css';
import { harnessAppearance, type HarnessAppearance } from './harnessAppearance';
import { fetchCurrentUser, fetchAppConfig } from '../lib/api/auth';
import { useLayoutMode } from '../lib/layout/LayoutModeProvider';
type Selection = 'database' | 'deck' | 'collection' | 'together' | 'unmounted';
/** Local fixture host: neither Excelsior's router nor AuthProvider is mounted. */
export function ModuleHarness({ user, initialDeckId = '', initialHostOverlay = false, initialContainerLayout = false, initialContainerWidth = 'available', initialAppearance = 'default', initialHostActions = false }: { user: AppUser | null; initialDeckId?: string; initialHostOverlay?: boolean; initialContainerLayout?: boolean; initialContainerWidth?: string; initialAppearance?: HarnessAppearance; initialHostActions?: boolean }) {
 const { isMobile } = useLayoutMode();
 const [useContainerLayout, setUseContainerLayout] = useState(initialContainerLayout);
 const [containerWidth, setContainerWidth] = useState(initialContainerWidth);
 const [appearance, setAppearance] = useState(initialAppearance);
 const [selection, setSelection] = useState<Selection>('database');
 const [deckId, setDeckId] = useState(initialDeckId);
 const [readonly, setReadonly] = useState(true);
 const [feedback, setFeedback] = useState('');
 const [useHostActions, setUseHostActions] = useState(initialHostActions);
 const cardActions = useMemo<ModuleCardActions>(() => ({
  render: context => <div className="db__detail-actions-row" aria-label="Host card actions">
   <button type="button" className="btn btn-ghost" onClick={() => setFeedback(`Host received card: ${context.source}/${context.catalogType}/${context.card.id}`)}>Host card action</button>
   {context.isGuest && context.requestAuthentication ? <button type="button" className="btn btn-ghost" onClick={context.requestAuthentication}>Sign in through host</button> : null}
   <button type="button" className="btn btn-ghost" onClick={context.close}>Close through host</button>
  </div>,
  requestAuthentication: request => setFeedback(`Host received sign-in request: ${request.source}/${request.catalogType}/${request.cardId}`),
 }), []);
 const [useHostOverlay, setUseHostOverlay] = useState(initialHostOverlay);
 const [overlayRoot, setOverlayRoot] = useState<HTMLDivElement | null>(null);
 const api = useMemo(() => createModuleApi(), []);
 const onOpenDeck = useCallback((id: string) => { setDeckId(id); setSelection('deck'); setFeedback('Host opened deck'); }, []);
 const onBack = useCallback(() => setFeedback('Host received Back'), []);
 const onHome = useCallback(() => setFeedback('Host received Home'), []);
 const host = useMemo(() => ({ api, identity: { user, isGuest: !user || user.role === 'GUEST', isAdmin: user?.role === 'ADMIN' }, onOpenDeck, onBack, onHome, backLabel: 'Back to host', ...(useHostActions ? { cardActions } : {}), appearance: harnessAppearance[appearance], ...(useContainerLayout ? { layout: { mode: 'container' as const } } : {}), ...(useHostOverlay && overlayRoot ? { overlays: { root: overlayRoot, position: 'absolute' as const } } : {}) }), [api, user, onOpenDeck, onBack, onHome, useHostOverlay, overlayRoot, useContainerLayout, appearance, useHostActions, cardActions]);
 return <div className={`module-harness${useContainerLayout ? '' : isMobile ? ' layout-mobile' : ' layout-desktop'}`}>
  <header className="module-harness__controls">
   <h1>Independent module harness</h1>
   <p>Host identity: {host.identity.isGuest ? 'Guest' : 'Account'}. Local session and catalog. Decks start read-only; enable editing only for your disposable fixture.</p>
   <nav aria-label="Module selection">
    <button aria-pressed={selection === 'database'} onClick={() => setSelection('database')}>Card Database module</button>
    <button aria-pressed={selection === 'deck'} onClick={() => setSelection('deck')}>Deck Builder module</button>
    <button aria-pressed={selection === 'collection'} onClick={() => setSelection('collection')}>Collection module</button>
    <button aria-pressed={selection === 'together'} onClick={() => setSelection('together')}>All three modules</button>
    <button aria-pressed={selection === 'unmounted'} onClick={() => setSelection('unmounted')}>Unmount modules</button>
   </nav>
   <label>Local deck ID <input value={deckId} onChange={e => setDeckId(e.target.value)} /></label>
   <label><input type="checkbox" checked={readonly} onChange={e => setReadonly(e.target.checked)} />Read-only deck</label>
   <label><input type="checkbox" checked={useHostOverlay} onChange={e => setUseHostOverlay(e.target.checked)} />Use host overlay root</label>
   <label><input type="checkbox" checked={useContainerLayout} onChange={e => setUseContainerLayout(e.target.checked)} />Use container layout</label>
   <label className="module-harness__width">Host container width <select aria-label="Host container width" value={containerWidth} onChange={e => setContainerWidth(e.target.value)}><option value="available">Available space</option><option value="390">390 pixels</option><option value="720">720 pixels</option><option value="1120">1120 pixels</option></select></label>
   <label className="module-harness__width">Host appearance <select aria-label="Host appearance" value={appearance} onChange={e => setAppearance(e.target.value as HarnessAppearance)}><option value="default">Excelsior defaults</option><option value="paper">Paper fixture</option><option value="contrast">High contrast fixture</option></select></label>
   <label><input type="checkbox" checked={useHostActions} onChange={e => setUseHostActions(e.target.checked)} />Use host card actions</label>
   <output aria-label="Host callback result">{feedback}</output>
  </header>
  <div className={`module-harness__surface${useHostOverlay ? ' module-harness__surface--host-overlay' : ''}`} style={{ width: containerWidth === 'available' ? '100%' : `${containerWidth}px`, maxWidth: '100%' }}>
  <ModuleHostProvider host={host}>
  <div ref={setOverlayRoot} className="module-harness__overlay-root" role="region" aria-label="Host overlay root" />
   {(selection === 'database' || selection === 'together') && <section aria-label="Independent Card Database"><CardDatabaseModule /></section>}
   {(selection === 'deck' || selection === 'together') && <section aria-label="Independent Deck Builder">{deckId ? <DeckBuilderModule deckId={deckId} readonly={readonly} /> : <p>Supply a valid local fixture deck ID.</p>}</section>}
   {(selection === 'collection' || selection === 'together') && <section aria-label="Independent Collection"><CollectionModule /></section>}
  </ModuleHostProvider>
  </div>
 </div>;
}

const defaultSession = async () => { const [user] = await Promise.all([fetchCurrentUser(), fetchAppConfig()]); return user; };
/** Development host bootstrap; modules themselves never create or authenticate sessions. */
export function LocalModuleHarness({ loadSession = defaultSession }: { loadSession?: () => Promise<AppUser | null> }) {
 const [user, setUser] = useState<AppUser | null>(null);
 const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
 const active = useRef(false);
 const load = useCallback(async () => { setStatus('loading'); try { const current = await loadSession(); if (active.current) { setUser(current); setStatus('ready'); } } catch { if (active.current) setStatus('error'); } }, [loadSession]);
 useEffect(() => { active.current = true; void load(); return () => { active.current = false; }; }, [load]);
 if (status === 'loading') return <p>Loading local host…</p>;
 if (status === 'error') return <div role="alert">Local API unavailable. Start Excelsior and retry.<button onClick={() => void load()}>Retry</button></div>;
 return <ModuleHarness user={user} />;
}

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { ModuleCardActions } from './cardActions';
import type { ModuleSaveFeedback } from './saveFeedback';
import type { ModuleIconOptions } from '../lib/icons/uiIconOverrides';
import type { AppUser } from '../lib/api/types';
import { CardDatabaseModule, DeckBuilderModule, CollectionModule, ModuleHostProvider, createModuleApi } from './index';
import './ModuleHarness.css';
import { SlideOutPanel } from '../components/SlideOutPanel';
import { OverlayHostProvider } from '../lib/layout/OverlayHostProvider';
import { createUnsavedNavigation } from './unsavedNavigation';
import { harnessAppearance, type HarnessAppearance } from './harnessAppearance';
import { fetchCurrentUser, fetchAppConfig } from '../lib/api/auth';
import { useLayoutMode } from '../lib/layout/LayoutModeProvider';
type SaveFixtureMode = 'api' | 'delayed' | 'rejected';
type Selection = 'database' | 'deck' | 'collection' | 'together' | 'unmounted';
/** Local fixture host: neither Excelsior's router nor AuthProvider is mounted. */
export function ModuleHarness({ user, initialDeckId = '', initialHostOverlay = false, initialContainerLayout = false, initialContainerWidth = 'available', initialAppearance = 'default', initialHostActions = false, initialHostIcons = false, initialHostSaveFeedback = false, initialReadonly = true, initialSaveFixtureMode = 'api', initialUnsavedPolicy = false }: { user: AppUser | null; initialDeckId?: string; initialHostOverlay?: boolean; initialContainerLayout?: boolean; initialContainerWidth?: string; initialAppearance?: HarnessAppearance; initialHostActions?: boolean; initialHostIcons?: boolean; initialHostSaveFeedback?: boolean; initialReadonly?: boolean; initialSaveFixtureMode?: SaveFixtureMode; initialUnsavedPolicy?: boolean }) {
 const { isMobile } = useLayoutMode();
 const [useContainerLayout, setUseContainerLayout] = useState(initialContainerLayout);
 const [containerWidth, setContainerWidth] = useState(initialContainerWidth);
 const [appearance, setAppearance] = useState(initialAppearance);
 const [selection, setSelection] = useState<Selection>('database');
 const [deckId, setDeckId] = useState(initialDeckId);
 const [readonly, setReadonly] = useState(initialReadonly);
 const [useUnsavedPolicy, setUseUnsavedPolicy] = useState(initialUnsavedPolicy);
 const [unsavedRoot, setUnsavedRoot] = useState<HTMLDivElement | null>(null);
 const [deckGeneration, setDeckGeneration] = useState(0);
 const guard = useMemo(() => createUnsavedNavigation(), []);
 const navigation = useSyncExternalStore(guard.subscribe, guard.getSnapshot, guard.getSnapshot);
 const editing = useMemo(() => ({ register: guard.register }), [guard]);
 const request = useCallback((action: () => void) => { if (useUnsavedPolicy) guard.request(action); else action(); }, [guard, useUnsavedPolicy]);
 const discard = () => { if (!navigation.saving) { setDeckGeneration(n => n + 1); guard.discard(); } };
 const [feedback, setFeedback] = useState('');
 const [useHostActions, setUseHostActions] = useState(initialHostActions);
 const [useHostIcons, setUseHostIcons] = useState(initialHostIcons);
 const [useHostSaveFeedback, setUseHostSaveFeedback] = useState(initialHostSaveFeedback);
 const [saveFixtureMode, setSaveFixtureMode] = useState<SaveFixtureMode>(initialSaveFixtureMode);
 const saveFeedback = useMemo<ModuleSaveFeedback>(() => ({ render: context => <span className="module-harness__save-feedback" role={context.status === 'error' ? 'alert' : 'status'} aria-label="Host save feedback" data-save-status={context.status}>Fictional host: {context.message}</span> }), []);
 const icons = useMemo<ModuleIconOptions>(() => ({ render: context => <span data-fixture-icon={context.name}>◇</span> }), []);
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
 const baseApi = useMemo(() => createModuleApi(), []);
 // Explicit local fixture behavior; never changes the shared client or production host.
 const api = useMemo(() => ({ ...baseApi,
  updateDeckMeta: async (...args: Parameters<typeof baseApi.updateDeckMeta>) => {
   if (saveFixtureMode === 'rejected') throw new Error('Fictional host save failure');
   if (saveFixtureMode === 'delayed') await new Promise(resolve => setTimeout(resolve, 1500));
   return baseApi.updateDeckMeta(...args);
  },
  replaceDeckCards: async (...args: Parameters<typeof baseApi.replaceDeckCards>) => {
   if (saveFixtureMode === 'rejected') throw new Error('Fictional host save failure');
   return baseApi.replaceDeckCards(...args);
  },
 }), [baseApi, saveFixtureMode]);
 const onOpenDeck = useCallback((id: string) => request(() => { setDeckId(id); setSelection('deck'); setFeedback('Host opened deck'); }), [request]);
 const onBack = useCallback(() => request(() => { setFeedback('Host received Back'); if (useUnsavedPolicy) setSelection('database'); }), [request, useUnsavedPolicy]);
 const onHome = useCallback(() => request(() => { setFeedback('Host received Home'); if (useUnsavedPolicy) setSelection('unmounted'); }), [request, useUnsavedPolicy]);
 const host = useMemo(() => ({ api, identity: { user, isGuest: !user || user.role === 'GUEST', isAdmin: user?.role === 'ADMIN' }, onOpenDeck, onBack, onHome, backLabel: 'Back to host', ...(useUnsavedPolicy ? { editing } : {}), ...(useHostActions ? { cardActions } : {}), ...(useHostSaveFeedback ? { saveFeedback } : {}), ...(useHostIcons ? { icons, chrome: { brand: <div className="module-harness__brand" role="note" aria-label="Fictional host brand">◇ Fictional host</div> } } : {}), appearance: harnessAppearance[appearance], ...(useContainerLayout ? { layout: { mode: 'container' as const } } : {}), ...(useHostOverlay && overlayRoot ? { overlays: { root: overlayRoot, position: 'absolute' as const } } : {}) }), [api, user, onOpenDeck, onBack, onHome, useHostOverlay, overlayRoot, useContainerLayout, appearance, useHostActions, cardActions, useHostIcons, icons, useHostSaveFeedback, saveFeedback, useUnsavedPolicy, editing]);
 return <div className={`module-harness${useContainerLayout ? '' : isMobile ? ' layout-mobile' : ' layout-desktop'}`}>
  <div ref={setUnsavedRoot} className="module-harness__unsaved-root" />
  {unsavedRoot && <OverlayHostProvider options={{ root: unsavedRoot, position: 'fixed' }}><SlideOutPanel open={navigation.pending} onClose={guard.stay} ariaLabel="Unsaved deck changes" title="Unsaved deck changes"><p>{navigation.saving ? 'A save is still running. Stay here until it finishes.' : 'Leaving will discard your unsaved deck edits.'}</p><button type="button" className="btn btn-secondary" onClick={guard.stay}>Stay</button><button type="button" className="btn btn-danger" disabled={navigation.saving > 0} onClick={discard}>Discard and continue</button></SlideOutPanel></OverlayHostProvider>}
  <header className="module-harness__controls">
   <h1>Independent module harness</h1>
   <p>Host identity: {host.identity.isGuest ? 'Guest' : 'Account'}. Local session and catalog. Decks start read-only; enable editing only for your disposable fixture.</p>
   <nav aria-label="Module selection">
    <button aria-pressed={selection === 'database'} onClick={() => { if (selection !== 'database') request(() => setSelection('database')); }}>Card Database module</button>
    <button aria-pressed={selection === 'deck'} onClick={() => { if (selection !== 'deck') request(() => setSelection('deck')); }}>Deck Builder module</button>
    <button aria-pressed={selection === 'collection'} onClick={() => { if (selection !== 'collection') request(() => setSelection('collection')); }}>Collection module</button>
    <button aria-pressed={selection === 'together'} onClick={() => { if (selection !== 'together') request(() => setSelection('together')); }}>All three modules</button>
    <button aria-pressed={selection === 'unmounted'} onClick={() => { if (selection !== 'unmounted') request(() => setSelection('unmounted')); }}>Unmount modules</button>
   </nav>
   <label>Local deck ID <input type={deckId.startsWith('guest_') ? 'password' : 'text'} value={deckId} onChange={e => { const value = e.target.value; request(() => setDeckId(value)); }} /></label>
   <label><input type="checkbox" checked={readonly} onChange={e => { const value = e.target.checked; request(() => setReadonly(value)); }} />Read-only deck</label>
   <label><input type="checkbox" checked={useHostOverlay} onChange={e => setUseHostOverlay(e.target.checked)} />Use host overlay root</label>
   <label><input type="checkbox" checked={useContainerLayout} onChange={e => { const value = e.target.checked; request(() => setUseContainerLayout(value)); }} />Use container layout</label>
   <label className="module-harness__width">Host container width <select aria-label="Host container width" value={containerWidth} onChange={e => setContainerWidth(e.target.value)}><option value="available">Available space</option><option value="390">390 pixels</option><option value="720">720 pixels</option><option value="1120">1120 pixels</option></select></label>
   <label className="module-harness__width">Host appearance <select aria-label="Host appearance" value={appearance} onChange={e => { const value = e.target.value as HarnessAppearance; request(() => setAppearance(value)); }}><option value="default">Excelsior defaults</option><option value="paper">Paper fixture</option><option value="contrast">High contrast fixture</option></select></label>
   <label><input type="checkbox" checked={useHostActions} onChange={e => setUseHostActions(e.target.checked)} />Use host card actions</label>
   <label><input type="checkbox" checked={useHostIcons} onChange={e => setUseHostIcons(e.target.checked)} />Use host brand and icons</label>
   <label><input type="checkbox" checked={useHostSaveFeedback} onChange={e => setUseHostSaveFeedback(e.target.checked)} />Use host save feedback</label>
   <label className="module-harness__width">Save fixture mode <select aria-label="Save fixture mode" value={saveFixtureMode} onChange={e => setSaveFixtureMode(e.target.value as SaveFixtureMode)}><option value="api">Real local API</option><option value="delayed">Delay metadata save by 1.5 seconds</option><option value="rejected">Reject save locally</option></select></label>
   <label><input type="checkbox" checked={useUnsavedPolicy} onChange={e => { const value = e.target.checked; request(() => setUseUnsavedPolicy(value)); }} />Use host unsaved policy</label>
   <output aria-label="Host edit state">{useUnsavedPolicy ? `${navigation.dirty} dirty editor(s); ${navigation.saving} save(s) pending` : 'Host unsaved policy off'}</output>
   <output aria-label="Host callback result">{feedback}</output>
  </header>
  <div className={`module-harness__surface${useHostOverlay ? ' module-harness__surface--host-overlay' : ''}`} style={{ width: containerWidth === 'available' ? '100%' : `${containerWidth}px`, maxWidth: '100%' }}>
  <ModuleHostProvider host={host}>
  <div ref={setOverlayRoot} className="module-harness__overlay-root" role="region" aria-label="Host overlay root" />
   {(selection === 'database' || selection === 'together') && <section aria-label="Independent Card Database"><CardDatabaseModule /></section>}
   {(selection === 'deck' || selection === 'together') && <section aria-label="Independent Deck Builder">{deckId ? <DeckBuilderModule key={deckGeneration} deckId={deckId} readonly={readonly} /> : <p>Supply a valid local fixture deck ID.</p>}</section>}
   {(selection === 'collection' || selection === 'together') && <section aria-label="Independent Collection"><CollectionModule /></section>}
  </ModuleHostProvider>
  </div>
 </div>;
}

const defaultSession = async () => { const [user] = await Promise.all([fetchCurrentUser(), fetchAppConfig()]); return user; };
/** Development host bootstrap; modules themselves never create or authenticate sessions. */
export function LocalModuleHarness({ loadSession = defaultSession, renderHost }: { loadSession?: () => Promise<AppUser | null>; renderHost?: (user: AppUser | null) => ReactNode }) {
 const [user, setUser] = useState<AppUser | null>(null);
 const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
 const active = useRef(false);
 const load = useCallback(async () => { setStatus('loading'); try { const current = await loadSession(); if (active.current) { setUser(current); setStatus('ready'); } } catch { if (active.current) setStatus('error'); } }, [loadSession]);
 useEffect(() => { active.current = true; void load(); return () => { active.current = false; }; }, [load]);
 if (status === 'loading') return <p>Loading local host…</p>;
 if (status === 'error') return <div role="alert">Local API unavailable. Start Excelsior and retry.<button onClick={() => void load()}>Retry</button></div>;
 return renderHost ? renderHost(user) : <ModuleHarness user={user} />;
}

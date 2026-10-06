import { noRequestEvidence, noRequestSubscription, type LocalRequestEvidence, type LocalRequestMode } from './localRequestEvidence';
import * as legacyImageAssets from '../app/legacyImageAssets';
import { useCallback, useEffect, useMemo, useState, useRef, useSyncExternalStore } from 'react';
import { Link, Route, Routes, useLocation, useNavigate, useParams, useBlocker } from 'react-router-dom';
import type { AppUser } from '../lib/api/types';
import { CardDatabaseModule, CollectionModule, DeckBuilderModule, ModuleHostProvider, createModuleApi } from './index';
import type { ModuleApi } from './api';
import type { ModuleHost } from './ModuleHost';
import type { CardDetailNavigation } from '../lib/layout/cardDetailHistoryController';
import { nativeDeckPath, PUBLIC_FIXTURE_DECK } from './nativeHostRoutes';
import { createUnsavedNavigation } from './unsavedNavigation';
import { saveFixtureApi, type SaveFixtureMode } from './saveFixtureApi';
import { SlideOutPanel } from '../components/SlideOutPanel';
import { harnessAppearance, type HarnessAppearance } from './harnessAppearance';

/** Fictional development host. Every navigation/discard/auth decision belongs here. */
export function NativeRouteHarness({ user, api: suppliedApi, requestEvidence, initialDeckId = PUBLIC_FIXTURE_DECK, isolated = false, initialReadonly = true }: { user: AppUser | null; api?: ModuleApi; requestEvidence?: LocalRequestEvidence; initialDeckId?: string; isolated?: boolean; initialReadonly?: boolean }) {
 const requestSnapshot = useSyncExternalStore(requestEvidence?.subscribe ?? noRequestSubscription, requestEvidence?.getSnapshot ?? noRequestEvidence, noRequestEvidence);
 const baseApi = useMemo(() => suppliedApi ?? createModuleApi(), [suppliedApi]);
 const [saveMode, setSaveMode] = useState<SaveFixtureMode>('api');
 const api = useMemo(() => saveFixtureApi(baseApi, saveMode), [baseApi, saveMode]);
 const navigate = useNavigate(); const location = useLocation();
 const navigationRef = useRef({ navigate, pathname: location.pathname });
 navigationRef.current = { navigate, pathname: location.pathname };
 const detailNavigate = useCallback<CardDetailNavigation>((to: number | '.', options?: { state: Record<string, unknown>; replace: boolean }) => {
  if (typeof to === 'number') navigationRef.current.navigate(to);
  else navigationRef.current.navigate(navigationRef.current.pathname, options);
 }, []);
 const guard = useMemo(() => createUnsavedNavigation(), []);
 const state = useSyncExternalStore(guard.subscribe, guard.getSnapshot, guard.getSnapshot);
 const blocker = useBlocker(({ currentLocation, nextLocation }) => currentLocation.pathname !== nextLocation.pathname && Boolean(state.dirty || state.saving));
 const [deckId, setDeckId] = useState(initialDeckId);
 const [privateDeckId, setPrivateDeckId] = useState('');
 const [readonly, setReadonly] = useState(initialReadonly);
 const [generation, setGeneration] = useState(0);
 const [continueExplicit, setContinueExplicit] = useState(false);
 const [width, setWidth] = useState('available');
 const [appearance, setAppearance] = useState<HarnessAppearance>('default');
 const [restrictions, setRestrictions] = useState(false);
 const [callbacks, setCallbacks] = useState(false);
 const [second, setSecond] = useState(false);
 const [rootFont, setRootFont] = useState('24');
 const [receipt, setReceipt] = useState('');
 const deckPath = nativeDeckPath(deckId);
 const onOpenDeck = useCallback<ModuleHost['onOpenDeck']>((id, options) => {
  // Guest identifiers carry session identity. Keep the owned clone in memory, never its URL.
  const path = nativeDeckPath(id);
  if (path) navigate(path, { replace: options?.replace ?? false });
  else if (id.startsWith('guest_')) { setPrivateDeckId(id); navigate('/tools/decks/local-copy', { replace: options?.replace ?? false }); }
 }, [navigate]);
 const onBack = useCallback(() => navigate(-1), [navigate]);
 const onHome = useCallback(() => navigate('/'), [navigate]);
 const host = useMemo<ModuleHost>(() => ({ api, assets:legacyImageAssets, identity: { user, isGuest: !user || user.role === 'GUEST', isAdmin: user?.role === 'ADMIN' },
  onOpenDeck, onBack, onHome, backLabel: 'Back to fictional host', layout: { mode:'container' }, editing: { register:guard.register },
  ...(isolated ? { styles: { mode:'isolated', height:680 }, appearance: harnessAppearance[appearance] ?? {} } : {}),
  ...(restrictions ? { features: { drawHand:false, simulateKo:false, exportDeck:false, addCards:false } } : {}),
  ...(callbacks ? { cardActions: { render: context => <div className="db__detail-actions-row"><button type="button" className="btn btn-ghost" onClick={() => setReceipt('Host opened card: ' + context.source + '/' + context.catalogType)}>Open card through host</button><button type="button" className="btn btn-ghost" onClick={context.requestAuthentication}>Sign in through host</button><button type="button" className="btn btn-ghost" onClick={context.close}>Close through host</button></div>, requestAuthentication: request => setReceipt('Host sign-in requested: ' + request.source) }, icons: { render:()=> <span>◇</span> }, chrome: {brand:<div role="note">◇ Fictional host brand</div>} } : {}),
  history: { navigate:detailNavigate, state:location.state as object | null },
 }), [api, user, onOpenDeck, onBack, onHome, detailNavigate, location.state, guard, isolated, appearance, restrictions, callbacks]);
 const blocked = blocker.state === 'blocked' || state.pending;
 const stay = useCallback(() => { guard.stay(); if (blocker.state === 'blocked') blocker.reset(); }, [guard, blocker]);
 const discard = () => { if (state.saving) return; setGeneration(n => n + 1); if (blocker.state === 'blocked') blocker.proceed(); else setContinueExplicit(true); };
 useEffect(() => {
  if (!state.dirty && !state.saving) return;
  const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
  window.addEventListener('beforeunload', beforeUnload);
  return () => window.removeEventListener('beforeunload', beforeUnload);
 }, [state.dirty, state.saving]);
 // Wait for the discarded editor and unload listener to dispose before full-document navigation.
 useEffect(() => {
  if (!continueExplicit || state.dirty || state.saving) return;
  setContinueExplicit(false); guard.discard();
 }, [continueExplicit, state.dirty, state.saving, guard]);
 const configure = (action:()=>void) => { if (blocker.state !== 'blocked') guard.request(action); };
 return <div className={isolated ? 'native-integration-fixture host-font-' + rootFont : 'module-harness module-route-harness'}>
  <header className={isolated ? 'fixture-chrome' : 'module-harness__controls'}>
   {requestEvidence && requestSnapshot ? <><label>Local Collection request mode <select aria-label="Local Collection request mode" value={requestSnapshot.mode} onChange={e=>requestEvidence.setMode(e.target.value as LocalRequestMode)}><option value="online">Real local API</option><option value="slow-collection">Delay Collection requests by 750 ms</option><option value="offline-collection">Reject Collection requests locally</option></select></label><output aria-label="Local request evidence" data-request-evidence={JSON.stringify(requestSnapshot)}>{requestSnapshot.requests.length} recent API requests; bodies and identities are not recorded</output></> : null}
   <h1>{isolated ? 'Native integration preparation' : 'Fictional nested host'}</h1>
   <p>Host identity: {host.identity.isGuest ? 'Guest' : 'Account'}. Local data. Editing creates a disposable Guest copy; Collection quantities stay unchanged.</p>
   <nav aria-label="Fictional host navigation"><Link to="/">Host Home</Link><Link to="/tools/cards">Host Cards</Link><Link to="/tools/collection">Host Collection</Link>{deckPath ? <Link to={privateDeckId ? '/tools/decks/local-copy' : deckPath}>Host Deck</Link> : <span role="status">Use a public fixture UUID.</span>}</nav>
   <label>Public fixture deck ID <input value={deckId} onChange={e => { const value=e.target.value; configure(()=>setDeckId(value)); }} /></label>
   <label><input type="checkbox" checked={readonly} onChange={e => { const value=e.target.checked; configure(()=>setReadonly(value)); }} />Read-only routed deck</label>
   {isolated ? <><button className="btn" type="button">Host sentinel button</button><label>Host root font <select aria-label="Host root font" value={rootFont} onChange={e=>setRootFont(e.target.value)}><option value="16">16 pixels</option><option value="24">24 pixels</option><option value="32">32 pixels</option></select></label><label>Host surface width <select aria-label="Host surface width" value={width} onChange={e=>setWidth(e.target.value)}><option value="available">Available space</option><option value="390">390 pixels</option><option value="720">720 pixels</option><option value="1120">1120 pixels</option></select></label><label>Native appearance <select aria-label="Native appearance" value={appearance} onChange={e=>setAppearance(e.target.value as HarnessAppearance)}><option value="default">Excelsior defaults</option><option value="paper">Paper fixture</option><option value="contrast">High contrast fixture</option></select></label><label>Native save fixture <select aria-label="Native save fixture" value={saveMode} onChange={e=>setSaveMode(e.target.value as SaveFixtureMode)}><option value="api">Real local API</option><option value="delayed">Delay metadata save by 1.5 seconds</option><option value="rejected">Reject save locally</option></select></label><label><input type="checkbox" checked={restrictions} onChange={e=>setRestrictions(e.target.checked)} />Restrict host deck features</label><label><input type="checkbox" checked={callbacks} onChange={e=>setCallbacks(e.target.checked)} />Use native host callbacks</label><label><input type="checkbox" checked={second} onChange={e=>setSecond(e.target.checked)} />Second independent module</label><a href="/home" style={{display:'inline-block'}} onClick={e=>{e.preventDefault(); configure(()=>window.location.assign('/home'));}}>Leave fixture through host</a></> : null}
   <output aria-label="Host route">{location.pathname}</output><output aria-label="Host detail history">{location.state?.cardDetailOpen ? 'Detail entry' : 'Route entry'}</output><output aria-label="Host edit state">{state.dirty} dirty editor(s); {state.saving} save(s) pending</output><output aria-label="Host callback result">{receipt}</output>
  </header>
  <div className={isolated ? 'fixture-surface' : undefined} style={{ width:width==='available' ? '100%' : width+'px', maxWidth:'100%' }}>
  <ModuleHostProvider host={host}>
   <SlideOutPanel open={blocked} onClose={stay} title="Unsaved deck changes" ariaLabel="Unsaved deck changes"><p>{state.saving ? 'A save is running. Stay until it finishes.' : 'Leaving will discard your unsaved edits.'}</p><button type="button" className="btn btn-secondary" onClick={stay}>Stay</button><button type="button" className="btn btn-danger" disabled={state.saving > 0} onClick={discard}>Discard and continue</button></SlideOutPanel>
   <Routes><Route path="/" element={<p>Choose a module using the fictional host links. Browser Back/Forward belongs to this host.</p>} /><Route path="/tools/cards" element={<section aria-label="Nested Card Database"><CardDatabaseModule /></section>} /><Route path="/tools/collection" element={<section aria-label="Nested Collection"><CollectionModule /></section>} /><Route path="/tools/decks/:deckId" element={<RouteDeck key={generation} readonly={readonly} privateDeckId={privateDeckId} />} /><Route path="*" element={<p role="status">Unknown fictional host route. Use Host Home.</p>} /></Routes>
  </ModuleHostProvider>
  </div>
  {isolated && second ? <section aria-label="Second native module" className="fixture-surface" style={{width:720,maxWidth:'100%',marginTop:16}}><ModuleHostProvider host={{...host,appearance:harnessAppearance.paper}}><CardDatabaseModule /></ModuleHostProvider></section> : null}
 </div>;
}
/** Private parent variants exercise public readonly and privately mapped Guest copies. */
function RouteDeck({ readonly, privateDeckId }: { readonly:boolean; privateDeckId:string }) {
 const { deckId='' }=useParams(); const id=deckId==='local-copy' ? privateDeckId : nativeDeckPath(deckId) ? deckId : '';
 return id ? <section aria-label="Nested Deck Builder"><DeckBuilderModule deckId={id} readonly={readonly} /></section> : <p role="status">Use a public fixture UUID. Disposable local copies are held only in this tab; reload returns to the public fixture.</p>;
}

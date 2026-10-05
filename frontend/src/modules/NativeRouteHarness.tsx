import { useCallback, useMemo, useState, useRef } from 'react';
import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import type { AppUser } from '../lib/api/types';
import { CardDatabaseModule, CollectionModule, DeckBuilderModule, ModuleHostProvider, createModuleApi } from './index';
import type { ModuleApi } from './api';
import type { ModuleHost } from './ModuleHost';
import type { CardDetailNavigation } from '../lib/layout/cardDetailHistoryController';
import { nativeDeckPath, PUBLIC_FIXTURE_DECK } from './nativeHostRoutes';
import './ModuleHarness.css';

/** Development-only native host example; all routing is outside the three modules. */
export function NativeRouteHarness({ user, api: suppliedApi, initialDeckId = PUBLIC_FIXTURE_DECK }: { user: AppUser | null; api?: ModuleApi; initialDeckId?: string }) {
 const api = useMemo(() => suppliedApi ?? createModuleApi(), [suppliedApi]);
 const navigate = useNavigate(); const location = useLocation();
 // The provider sits outside Routes: router-relative '.' would resolve to Home.
 // Keep detail history on the current host path with a stable callback lifecycle.
 const navigationRef = useRef({ navigate, pathname: location.pathname });
 navigationRef.current = { navigate, pathname: location.pathname };
 const detailNavigate = useCallback<CardDetailNavigation>((to: number | '.', options?: { state: Record<string, unknown>; replace: boolean }) => {
  if (typeof to === 'number') navigationRef.current.navigate(to);
  else navigationRef.current.navigate(navigationRef.current.pathname, options);
 }, []);
 const [deckId, setDeckId] = useState(initialDeckId);
 const deckPath = nativeDeckPath(deckId);
 const onOpenDeck = useCallback<ModuleHost['onOpenDeck']>((id, options) => {
  const path = nativeDeckPath(id); if (!path) return;
  navigate(path, { replace: options?.replace ?? false });
 }, [navigate]);
 const onBack = useCallback(() => navigate(-1), [navigate]);
 const onHome = useCallback(() => navigate('/'), [navigate]);
 const host = useMemo<ModuleHost>(() => ({ api, identity: { user, isGuest: !user || user.role === 'GUEST', isAdmin: user?.role === 'ADMIN' },
  onOpenDeck, onBack, onHome, backLabel: 'Back to fictional host', layout: { mode: 'container' },
  history: { navigate: detailNavigate, state: location.state as object | null },
 }), [api, user, onOpenDeck, onBack, onHome, detailNavigate, location.state]);
 return <div className="module-harness module-route-harness">
  <header className="module-harness__controls">
   <h1>Fictional nested host</h1>
   <p>Host identity: {host.identity.isGuest ? 'Guest' : 'Account'}. Local data. Deck fixture is read-only; leave Collection quantities unchanged.</p>
   <nav aria-label="Fictional host navigation">
    <Link to="/">Host Home</Link><Link to="/tools/cards">Host Cards</Link>
    <Link to="/tools/collection">Host Collection</Link>
    {deckPath ? <Link to={deckPath}>Host Deck</Link> : <span role="status">Use a public fixture UUID.</span>}
   </nav>
   <label>Public fixture deck ID <input type={deckId.startsWith('guest_') ? 'password' : 'text'} value={deckId} onChange={e => setDeckId(e.target.value)} /></label>
   <output aria-label="Host route">{location.pathname}</output>
   <output aria-label="Host detail history">{location.state?.cardDetailOpen ? 'Detail entry' : 'Route entry'}</output>
  </header>
  <ModuleHostProvider host={host}>
   <Routes>
    <Route path="/" element={<p>Choose a module using the fictional host links. Browser Back/Forward belongs to this host.</p>} />
    <Route path="/tools/cards" element={<section aria-label="Nested Card Database"><CardDatabaseModule /></section>} />
    <Route path="/tools/collection" element={<section aria-label="Nested Collection"><CollectionModule /></section>} />
    <Route path="/tools/decks/:deckId" element={<ReadonlyRouteDeck />} />
    <Route path="*" element={<p role="status">Unknown fictional host route. Use Host Home.</p>} />
   </Routes>
  </ModuleHostProvider>
 </div>;
}

/** Private route adapter, covered by the parent's named deck Storybook example. */
function ReadonlyRouteDeck() {
 const { deckId = '' } = useParams();
 return nativeDeckPath(deckId) ? <section aria-label="Nested Deck Builder"><DeckBuilderModule deckId={deckId} readonly /></section> : <p role="status">Use a public fixture UUID.</p>;
}

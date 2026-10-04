import { useCallback, useMemo, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { createModuleApi } from '../modules/api';
import { ModuleHostProvider, type ModuleHost } from '../modules/ModuleHost';
import { getDeckEditorReturnTo, getDeckEditorBackAriaLabel } from '../lib/navigation/deckEditorReturn';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { Logo } from '../components/Logo';
import { IconHome, IconDatabase, IconDecks, IconCollection, IconUsers } from '../components/icons';
/** Excelsior alone owns account bootstrap, URLs and branded navigation. */
export function ExcelsiorModuleHost({ children }: { children: ReactNode }) {
 const { user, isGuest, isAdmin } = useAuth();
 const { userId = '' } = useParams();
 const navigate = useNavigate(); const location = useLocation();
 const returnTo = getDeckEditorReturnTo(location.state);
 const api = useMemo(() => createModuleApi(), []);
 const onOpenDeck = useCallback((deckId: string, options?: { replace?: boolean }) => navigate('/users/' + (user?.id ?? userId) + '/decks/' + deckId, options), [navigate, user?.id, userId]);
 const onBack = useCallback(() => navigate(returnTo ?? '/users/' + (user?.id ?? userId) + '/decks'), [navigate, returnTo, user?.id, userId]);
 const onHome = useCallback(() => navigate('/home'), [navigate]);
 const host: ModuleHost = {
  api, identity: { user, isGuest, isAdmin }, onOpenDeck, onBack, onHome,
  backLabel: getDeckEditorBackAriaLabel(returnTo),
  history: { navigate, state: location.state as object | null },
  chrome: { desktopRail: (
    <aside className="deck-editor__rail">
     <button type="button" className="deck-editor__rail-logo" onClick={onHome} aria-label="Home"><Logo variant="emblem" height={26} /></button>
     <nav className="deck-editor__rail-nav">
      <button type="button" onClick={onHome} title="Home"><IconHome /></button>
      <button type="button" onClick={() => navigate('/data')} title="Card Database"><IconDatabase /></button>
      <button type="button" onClick={() => navigate('/users/' + (user?.id ?? userId) + '/decks')} title="Decks"><IconDecks /></button>
      <button type="button" onClick={() => navigate('/users/' + (user?.id ?? userId) + '/collection')} title="Collection"><IconCollection /></button>
      <button type="button" onClick={() => navigate('/community')} title="Community"><IconUsers /></button>
     </nav>
    </aside>
  ), mobileNavigation: <MobileBottomNav /> },
 };
 return <ModuleHostProvider host={host}>{children}</ModuleHostProvider>;
}

import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { DeckBuilderModule } from './DeckBuilderModule';
import { useAuth } from '../../app/AuthProvider';
import { ExcelsiorModuleHost } from '../../app/ExcelsiorModuleHost';
import { LoadingState } from '../../components/LoadingState';
import { isGuestDeckId } from '../../lib/api/decks';
/** Route-only adapter. The same module is used by independent hosts. */
export default function DeckEditorPage() {
 const { deckId = '' } = useParams();
 const [params] = useSearchParams();
 const { isLoading } = useAuth();
 const isSessionDeck = isGuestDeckId(deckId);
 const home = <Navigate to="/home" replace />;

 if (isSessionDeck && isLoading) return <LoadingState fullscreen label="Loading deck..." />;

 return (
  <ExcelsiorModuleHost deckbuilder>
   <DeckBuilderModule
    deckId={deckId}
    readonly={params.get('readonly') === 'true'}
    missingGuestDeckFallback={isSessionDeck ? home : undefined}
   />
  </ExcelsiorModuleHost>
 );
}

import { useParams, useSearchParams } from 'react-router-dom';
import { DeckBuilderModule } from './DeckBuilderModule';
import { ExcelsiorModuleHost } from '../../app/ExcelsiorModuleHost';
/** Route-only adapter. The same module is used by independent hosts. */
export default function DeckEditorPage() {
 const { deckId = '' } = useParams();
 const [params] = useSearchParams();
 return <ExcelsiorModuleHost><DeckBuilderModule deckId={deckId} readonly={params.get('readonly') === 'true'} /></ExcelsiorModuleHost>;
}

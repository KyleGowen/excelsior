import { useQuery } from '@tanstack/react-query';
import { useOptionalModuleHost } from '../../modules/ModuleHost';
import { fetchDeckFull, exportDraft } from '../../lib/api/decks';
import type { AppUser } from '../../lib/api/types';
import type { BuildDeckExportJsonInput } from '../../lib/decks/buildDeckExportJson';
export function createStubDeckExportInput(_exportedBy:string):BuildDeckExportJsonInput { return { deck:null }; }
export interface UseDeckExportInputResult { input:BuildDeckExportJsonInput | null; loading:boolean; }
export function useDeckExportInputController(deckId:string|null,isGuest:boolean,enabled:boolean,user:AppUser|null) {
 const api = useOptionalModuleHost()?.api;
 const deck = useQuery({queryKey:['deck',deckId],queryFn:({signal}) => (api?.fetchDeckFull ?? fetchDeckFull)(deckId!,isGuest,signal),enabled:enabled && Boolean(deckId)});
 const data = deck.data;
 const result = useQuery({ queryKey:['deck-export',api, data,user?.username], enabled:enabled && Boolean(data), queryFn:async ({signal}) => {
  const d = data!;
  const response = await (api?.exportDraft ?? exportDraft)({schemaVersion:1,draftId:d.metadata.id,revision:0,cards:d.cards.map(c => ({type:c.type,cardId:c.cardId,quantity:c.quantity,exclude_from_draw:c.exclude_from_draw === true})),reserveCharacterId:d.metadata.reserve_character ?? null,limited:d.metadata.is_limited ?? false,format:'venture',koCharacterIds:[]}, {name:d.metadata.name,description:d.metadata.description ?? '',exportedBy:user?.username ?? 'Guest',surface:'selection'},signal);
  return {deck:response.deck,topDeck:response.topDeck};
 }});
 return {input:result.data ?? null, loading:deck.isLoading || deck.isFetching || result.isLoading, error:deck.error ?? result.error, retry:() => {void deck.refetch();void result.refetch();}};
}

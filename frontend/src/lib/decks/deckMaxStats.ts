import { useQueries } from '@tanstack/react-query';
import { api } from '../api/client';
import { evaluationInputKey } from '../../contracts/draftInput';
import type { DeckListItem } from '../api/types';
import type { DeckMetricGrid } from '../../contracts/DeckDraftEvaluationDto';
/** Display server summaries; this hook contains no effective-grid or deck-rule calculations. */
export function useDeckGridStats(decks:DeckListItem[]) {
 const drafts = decks.map(d => ({schemaVersion:1 as const,draftId:d.metadata.id,revision:0,cards:d.cards.map(c => ({type:c.type,cardId:c.cardId,quantity:c.quantity,exclude_from_draw:c.exclude_from_draw === true})),reserveCharacterId:d.metadata.reserve_character ?? null,limited:d.metadata.is_limited ?? false,format:'venture' as const,koCharacterIds:[]}));
 const batches = Array.from({length:Math.ceil(drafts.length/20)},(_,i) => drafts.slice(i*20,i*20+20));
 const queries = useQueries({queries:batches.map(batch => ({queryKey:['deck-grid-summaries',batch.map(evaluationInputKey)],queryFn:async () => {
  const result = await api.post<Array<{draftId:string;inputKey:string;grid:DeckMetricGrid|null}>>('/api/v1/decks/summaries',{drafts:batch});
  if(result.length !== batch.length || result.some((row,i) => row.draftId !== batch[i].draftId || row.inputKey !== evaluationInputKey(batch[i]))) throw new Error('Summary does not match the requested deck list');
  return result;
 },staleTime:0}))});
 return new Map(queries.flatMap(q => q.data ?? []).map(row => [row.draftId,row.grid]));
}

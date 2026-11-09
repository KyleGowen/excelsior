import type {AccountDeckView} from '../../services/accountDeckService';
import type {DeckDraftEvaluationDto,DeckMetricGrid} from './DeckDraftEvaluationDto';
/** Additive owner summary: legacy aliases remain alongside authoritative presentation. */
export interface AccountDeckLibraryDto extends AccountDeckView {
 id:string;name:string;cardCount:number;
 evaluation:{legality:Pick<DeckDraftEvaluationDto['legality'],'valid'|'rawValid'>;versions:DeckDraftEvaluationDto['versions']}|null;grid:DeckMetricGrid|null;missionSetName:string|null;
}

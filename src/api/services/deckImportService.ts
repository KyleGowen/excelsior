import type { DeckImportDto } from '../dto/v1/DeckImportDto';
import type { DeckRepository } from '../../repository/DeckRepository';
import type { DeckData } from '../../types';
import type { GuestDeckPersistencePort } from './guestDeckService';
import type { DeckDraftEvaluationService } from './deckDraftEvaluationService';
import type { ImportDeckRequest } from '../http/models/decks/ImportDeckRequestBody';
export class DeckImportService {
 constructor(private readonly evaluator:DeckDraftEvaluationService,private readonly repository:Pick<DeckRepository,'createImportedDeck'>,private readonly guest:Pick<GuestDeckPersistencePort,'createDeck'>) {}
 async import(input:ImportDeckRequest, actor:{userId:string;guestSessionId?:string}):Promise<DeckImportDto> {
  const prepared=await this.evaluator.prepareImport(input.exportData,input.name);
  if (!prepared.ok) return prepared;
  const p=prepared;
  let deckId:string;
  const userId=actor.guestSessionId ?? actor.userId;
  if (actor.guestSessionId) {
   const now=new Date().toISOString();
   const data:DeckData={metadata:{id:'',name:p.name,description:p.description,created:now,lastModified:now,cardCount:p.evaluation.counts.drawPile,is_valid:p.evaluation.legality.rawValid,is_limited:p.limited,reserve_character:p.reserveCharacterId,userId},cards:p.cards.map((c,i) => ({...c,id:`import-${i}`}))};
   // One insertion after every resolution/validation step succeeds.
   deckId=this.guest.createDeck(actor.guestSessionId,data);
  } else {
   if (!this.repository.createImportedDeck) throw new Error('Atomic import persistence is unavailable');
   deckId=(await this.repository.createImportedDeck(userId,{name:p.name,description:p.description,cards:p.cards,isValid:p.evaluation.legality.rawValid,limited:p.limited,reserveCharacterId:p.reserveCharacterId,cardCount:p.evaluation.counts.drawPile,threat:p.evaluation.threat.editor})).id;
  }
  return {ok:true as const,deckId,userId,cardsAdded:p.cards.reduce((n,c) => n+c.quantity,0)};
 }
}

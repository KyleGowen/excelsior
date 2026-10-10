import {DeckDraftEvaluationService,DraftStructureError} from '../../../src/api/services/deckDraftEvaluationService';
import {DeckImportService} from '../../../src/api/services/deckImportService';
import {EvaluateDraftRequestBody} from '../../../src/api/http/models/decks/EvaluateDraftRequestBody';
import {evaluationInputKey} from '../../../src/services/deck-evaluation/draftInput';
import {buildImportCatalogMap,resolveImportCardIds} from '../../../src/services/deck-preview/resolveImportCardIds';
import {extractCardsFromImportJson} from '../../../src/services/deck-preview/extractCardsFromImportJson';
const catalog=new Map<string,Record<string,unknown>>([
 ['character_lancelot',{id:'lancelot',name:'Lancelot',type:'character',energy:2,combat:7,brute_force:5,intelligence:4,threat_level:18}],
 ['special_sword',{id:'sword',name:'Sword and Shield',character:'Lancelot',type:'special',icons:['Combat']}],
 ['power_combat',{id:'combat',name:'5 - Combat',type:'power',value:5,power_type:'Combat'}],
]);
const resolveCatalog=jest.fn(async()=>new Map(catalog));
const evaluator=new DeckDraftEvaluationService({resolveCatalog,validateResolvedDeck:jest.fn(()=>[])});
const draft=()=>EvaluateDraftRequestBody.parse({schemaVersion:1,draftId:'fictional',revision:4,cards:[{type:'character',cardId:'lancelot',quantity:1},{type:'special',cardId:'sword',quantity:3},{type:'power',cardId:'combat',quantity:5}]});
describe('Server preview operations',()=>{
 beforeEach(()=>resolveCatalog.mockClear());
 it('resolves JSON universe skill requirements independently of the catalog category',()=>{
  const c=buildImportCatalogMap({'basic-universe':[
   {id:'energy-ray',card_name:'Ray Gun',type:'Energy',value_to_use:'6 or greater',bonus:'+2'},
   {id:'combat-ray',card_name:'Ray Gun',type:'Combat',value_to_use:'6 or greater',bonus:'+2'},
  ]});
  const result=resolveImportCardIds(c,extractCardsFromImportJson({basic_universe:['Ray Gun - Energy 6 or greater +2','Ray Gun - Energy 6 or greater +2']}));
  expect(result.unresolved).toEqual([]);expect(result.resolved).toEqual([{cardId:'energy-ray',cardType:'basic-universe',quantity:2}]);
  expect(resolveImportCardIds(c,extractCardsFromImportJson({basic_universe:['Ray Gun - Intelligence 6 or greater +2']})).unresolved).toHaveLength(1);
 });
 it('returns matching hand copies and never structural or excluded copies',async()=>{const input=draft();input.cards[1].exclude_from_draw=true;const r=await evaluator.draw(input);expect(r.inputKey).toBe(evaluationInputKey(input));expect(r.revision).toBe(4);expect(r.cards).toHaveLength(7);expect(r.cards.filter(c=>c.cardId==='sword')).toHaveLength(2);expect(r.cards.every(c=>c.quantity===1&&c.type!=='character')).toBe(true);expect(resolveCatalog).toHaveBeenCalledTimes(1);});
 it('rejects insufficient physical playable counts',async()=>{const input=draft();input.cards=input.cards.slice(0,1);await expect(evaluator.draw(input)).rejects.toBeInstanceOf(DraftStructureError);});
 it('applies KO and pre-placed rules to typed identities using server catalog',async()=>{const input=draft();input.koCharacterIds=['lancelot'];const r=await evaluator.evaluate(input);expect(r.koDimming?.['power:combat']).toBe(true);expect(r.koDimming?.['special:sword']).toBe(true);expect(r.prePlacedEligible?.['special:sword']).toBe(true);expect(r.addCardsTeam?.[0]).toMatchObject({cardId:'lancelot',combat:7});});
 it('returns unchanged export conventions from one snapshot',async()=>{const r=await evaluator.exportDraft(draft(),{name:'Fixture',description:'Notes',exportedBy:'Fixture',surface:'selection'});expect(r.inputKey).toBe(evaluationInputKey(draft()));expect(r.deck).toMatchObject({name:'Fixture',total_cards:8,total_threat:18,max_combat:7});expect(r.topDeck).toContain('Cards: 8/51 | Threat: 18/76');expect(r.topDeck).toContain('3x LANCELOT: Sword and Shield');expect(r.deck.cards.special_cards.Lancelot).toHaveLength(3);expect(r.deck.cards.power_cards).toHaveLength(5);expect(resolveCatalog).toHaveBeenCalledTimes(1);});
 it('imports TopDeck from the same catalog snapshot before persistence',async()=>{const r=await evaluator.prepareImport('-- Characters --\n1x Lancelot [Reserve]\n\n-- Power Cards --\n2x 5 Combat','Text deck');expect(r).toMatchObject({ok:true,reserveCharacterId:'lancelot',limited:false,cards:expect.arrayContaining([{type:'power',cardId:'combat',quantity:2}])});expect(resolveCatalog).toHaveBeenCalledTimes(1);});
 it('returns unresolved text without creating any owned or Guest deck',async()=>{const owned=jest.fn();const guest=jest.fn();const importer=new DeckImportService(evaluator,{createImportedDeck:owned} as never,{createDeck:guest});expect(await importer.import({name:'Text',exportData:'-- Power Cards --\n1x Fictional missing power'},{userId:'fictional'})).toMatchObject({ok:false,code:'unresolved'});expect(owned).not.toHaveBeenCalled();expect(guest).not.toHaveBeenCalled();});
 it('returns serializable hand analysis and rejects impossible copies',async()=>{const r=await evaluator.analyzeHand(draft(),[{type:'power',cardId:'combat'},{type:'power',cardId:'combat'}]);expect(r.duplicateCardIndexes).toEqual([0,1]);expect(r.duplicateCount).toBe(1);await expect(evaluator.analyzeHand(draft(),Array(6).fill({type:'power',cardId:'combat'}))).rejects.toBeInstanceOf(DraftStructureError);await expect(evaluator.analyzeHand(draft(),[{type:'character',cardId:'lancelot'}])).rejects.toBeInstanceOf(DraftStructureError);});
 it('returns identity-bound list summaries with one catalog resolution',async()=>{const r=await evaluator.summaries([draft(),{...draft(),draftId:'empty',cards:[]}]);expect(r[0]).toMatchObject({draftId:'fictional',grid:{combat:7}});expect(r[1].grid).toBeNull();expect(resolveCatalog).toHaveBeenCalledTimes(1);});
});
describe('Atomic import orchestration',()=>{
 const owned=jest.fn(async()=>({id:'fictional-deck'}));const guest=jest.fn(()=>'fictional-guest-deck');
 const service=new DeckImportService(evaluator,{createImportedDeck:owned} as never,{createDeck:guest});
 const input={name:'Fixture import',exportData:{limited:true,reserve_character:'Lancelot',cards:{characters:['Lancelot'],special_cards:{Lancelot:['Sword and Shield']},power_cards:['5 - Combat']}}};
 beforeEach(()=>{owned.mockClear();guest.mockClear();});
 it('resolves everything before a single owned transaction call',async()=>{expect(await service.import(input,{userId:'fictional-user'})).toEqual({ok:true,deckId:'fictional-deck',userId:'fictional-user',cardsAdded:3});expect(owned).toHaveBeenCalledTimes(1);expect(owned).toHaveBeenCalledWith('fictional-user',expect.objectContaining({limited:true,reserveCharacterId:'lancelot',cards:expect.arrayContaining([{type:'character',cardId:'lancelot',quantity:1}])}));expect(guest).not.toHaveBeenCalled();});
 it('creates one complete Guest snapshot with bound session ownership',async()=>{const r=await service.import(input,{userId:'guest-user',guestSessionId:'fictional-session'});expect(r).toMatchObject({ok:true,deckId:'fictional-guest-deck',userId:'fictional-session'});expect(guest).toHaveBeenCalledTimes(1);expect(owned).not.toHaveBeenCalled();});
 it('leaves both persistence stores unchanged for unresolved identities',async()=>{const r=await service.import({name:'Fixture',exportData:{cards:{characters:['Absent']}}},{userId:'fictional'});expect(r).toMatchObject({ok:false,code:'unresolved'});expect(owned).not.toHaveBeenCalled();expect(guest).not.toHaveBeenCalled();});
 it('refuses partial fallback when an atomic repository is unavailable',async()=>{await expect(new DeckImportService(evaluator,{}, {createDeck:guest}).import(input,{userId:'fictional'})).rejects.toThrow('Atomic import persistence is unavailable');expect(guest).not.toHaveBeenCalled();});
});

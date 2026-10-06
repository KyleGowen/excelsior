/** Shape adapters for retained grid characterization tests. Game rules live in the server core. */
import { effectiveTeamCharacterStats } from '../../src/services/deck-candidates/deckUsabilityUtils';
import type { CatalogCard } from '../../src/services/catalog-presentation/types';
import { maximumGrid } from '../../src/services/deck-preview/teamGrid';
export function buildCharStatsById(characters:Array<Partial<CatalogCard> & {id:string}> | undefined) {
 return new Map((characters ?? []).map(c => [c.id,{name:String(c.name ?? 'Unknown'),energy:Number(c.energy)||0,combat:Number(c.combat)||0,brute_force:Number(c.brute_force)||0,intelligence:Number(c.intelligence)||0}]));
}
export function deckMaxStats(deck:{cards:Array<{type:string;cardId:string}>},index:ReturnType<typeof buildCharStatsById>) {
 const stats=deck.cards.filter(c=>c.type==='character').flatMap(c=>{const row=index.get(c.cardId);return row?[row]:[];});
 return stats.length ? maximumGrid(effectiveTeamCharacterStats(stats)) : null;
}
export function buildAddCardsEffectiveCharacterStats(cards:Array<{type:string;cardId:string}>,index?:Map<string,CatalogCard>) {
 const chars=cards.filter(c=>c.type==='character').slice(0,4).flatMap(c=>{const row=index?.get(`character:${c.cardId}`);return row?[{...row,id:c.cardId}]:[];});
 const stats=effectiveTeamCharacterStats([...buildCharStatsById(chars).values()]);
 return new Map(chars.map((c,i)=>[c.id,stats[i]]));
}

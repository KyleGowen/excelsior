import type { CatalogCard } from '../catalog-presentation/types';
import type { DeckUsabilityContext } from './types';
import { effectiveTeamCharacterStats, isGdaAnyCharacterSpecial, specialLinkedCharacterName } from './deckUsabilityUtils';
export interface CandidateDraftCard { type: string; cardId: string; quantity: number }
export const candidateCatalogKey = (type: string, id: string) => `${type.replace(/-/g, '_')}_${id}`;
/** Context uses the starting team, including reserve and KO characters, matching Add Cards compatibility. */
export function candidateContext(cards: CandidateDraftCard[], catalog: Map<string, Record<string, unknown>>): DeckUsabilityContext {
  const resolve = (c: CandidateDraftCard) => catalog.get(candidateCatalogKey(c.type, c.cardId)) as CatalogCard;
  const characters = cards.filter(c => c.type === 'character').map(resolve);
  const characterNames = characters.map(c => String(c.name ?? 'Unknown'));
  const characterStats = effectiveTeamCharacterStats(characters.map(c => ({ name: String(c.name ?? 'Unknown'), energy: Number(c.energy) || 0, combat: Number(c.combat) || 0, brute_force: Number(c.brute_force) || 0, intelligence: Number(c.intelligence) || 0 })));
  const first = (type: string) => { const c = cards.find(c => c.type === type); return c ? resolve(c) : undefined; };
  const specials = cards.filter(c => c.type === 'special').map(resolve).filter(c => specialLinkedCharacterName(c).toLowerCase() === 'any character');
  return { characterNames, characterStats, angryMobCharacterNames: characterNames.filter(n => n.startsWith('Angry Mob')),
    missionSets: new Set(cards.filter(c => c.type === 'mission').map(resolve).map(c => String(c.mission_set ?? '').trim()).filter(Boolean)),
    homebaseName: String(first('location')?.name ?? first('location')?.card_name ?? '').trim(),
    battlegroundName: String(first('battleground')?.name ?? first('battleground')?.card_name ?? '').trim(),
    hasGdaAnyCharacterSpecial: specials.some(isGdaAnyCharacterSpecial), hasNonGdaAnyCharacterSpecial: specials.some(c => !isGdaAnyCharacterSpecial(c)), characterCount: characters.length };
}

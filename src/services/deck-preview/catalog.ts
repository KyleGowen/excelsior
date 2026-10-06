import type { CatalogCard, CatalogType, DeckCardEntry } from './types';
export { cardDisplayName, cardCharacterName } from '../catalog-presentation/displayFields';
import { cardCharacterName } from '../catalog-presentation/displayFields';
import { normalizeAngryMobVariant } from '../deck-candidates/deckUsabilityUtils';
export type DeckCardIndex = Map<string, CatalogCard>;
export type DeckCardLookup = Pick<DeckCardEntry, 'cardId'> & { type: string };
export function normalizeDeckCardType(type: string): string { return type.replace(/_/g, '-'); }
const types: Record<string, CatalogType> = { character:'characters',special:'special-cards',power:'power-cards',location:'locations',battleground:'battlegrounds',mission:'missions',event:'events',aspect:'aspects', 'advanced-universe':'advanced-universe',teamwork:'teamwork','ally-universe':'ally-universe',training:'training','basic-universe':'basic-universe' };
export function catalogSlugForDeckType(type: string): CatalogType | undefined { return types[normalizeDeckCardType(type)]; }
export function resolveDeckCatalogCard(entry: DeckCardLookup, index: DeckCardIndex): CatalogCard | undefined { return index.get(`${normalizeDeckCardType(entry.type)}:${entry.cardId}`) ?? index.get(`${entry.type}:${entry.cardId}`) ?? index.get(entry.cardId); }
export function specialCardMatchesCharacter(
  special: CatalogCard,
  characterName: string,
): boolean {
  const specialCharacter = cardCharacterName(special);
  if (specialCharacter === 'Any Character') {
    return false;
  }

  if (specialCharacter.startsWith('Angry Mob') && characterName.startsWith('Angry Mob')) {
    if (specialCharacter === 'Angry Mob') {
      return true;
    }

    const hasVariantQualifier =
      specialCharacter.includes(':') || specialCharacter.includes(' - ');
    if (hasVariantQualifier) {
      const separator = specialCharacter.includes(':') ? ':' : ' - ';
      const specialVariant = specialCharacter.split(separator)[1]?.trim() ?? '';
      const charVariantMatch = characterName.match(/\(([^)]+)\)/);
      if (!charVariantMatch) return false;
      const charVariant = charVariantMatch[1].trim();
      return normalizeAngryMobVariant(specialVariant) === normalizeAngryMobVariant(charVariant);
    }

    return false;
  }

  return specialCharacter === characterName;
}

export const CATALOG_TYPES = Object.entries(types).map(([deckType,type]) => ({deckType,type}));

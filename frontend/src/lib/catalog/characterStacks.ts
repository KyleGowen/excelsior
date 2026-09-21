import type { CatalogCard, CatalogType } from '../api/types';
import {
  cardCharacterName,
  cardDisplayName,
  cardMatchesSearchQuery,
  compareCatalogCards,
  compareCharacterNames,
} from './catalogTypeMap';
import { isAlternateArtCard } from './defaultCatalogCards';
import { compareAlphabetically } from '../sort/alphabetical';

export const ADD_CARDS_STACKS_PAGE_SIZE = 6;

export interface CharacterStack {
  characterName: string;
  character: CatalogCard;
  specials: CatalogCard[];
  advancedUniverse: CatalogCard[];
}

export interface StackCardEntry {
  catalogType: CatalogType;
  card: CatalogCard;
}

function isAnyCharacterName(name: string): boolean {
  return name.trim().toLowerCase() === 'any character';
}

function normalizeAngryMobVariant(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim().replace(/s$/, '');
}

/** Port of legacy `specialCardMatchesCharacter` (deck-card-operations / load-available-cards). */
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

function advancedUniverseMatchesCharacter(card: CatalogCard, characterName: string): boolean {
  const linked = cardCharacterName(card);
  return linked !== '' && linked !== 'Any Character' && linked === characterName;
}

function pickPreferredCharacterRepresentative(group: CatalogCard[]): CatalogCard {
  return group.slice().sort((a, b) => {
    const aIsAlternate = isAlternateArtCard(a);
    const bIsAlternate = isAlternateArtCard(b);
    if (aIsAlternate !== bIsAlternate) return aIsAlternate ? 1 : -1;
    return compareAlphabetically(cardDisplayName(a), cardDisplayName(b));
  })[0];
}

export function buildCharacterStacks(input: {
  characters: CatalogCard[];
  specials: CatalogCard[];
  advancedUniverse: CatalogCard[];
}): CharacterStack[] {
  const byName = new Map<string, CatalogCard[]>();

  for (const card of input.characters) {
    const name = cardDisplayName(card).trim();
    if (!name || isAnyCharacterName(name)) continue;
    const list = byName.get(name) ?? [];
    list.push(card);
    byName.set(name, list);
  }

  const stacks: CharacterStack[] = [];

  for (const [characterName, group] of byName) {
    const character = pickPreferredCharacterRepresentative(group);
    const matchedSpecials = input.specials
      .filter((s) => specialCardMatchesCharacter(s, characterName))
      .slice()
      .sort((a, b) => compareCatalogCards(a, b, 'special-cards'));
    const matchedUa = input.advancedUniverse
      .filter((c) => advancedUniverseMatchesCharacter(c, characterName))
      .slice()
      .sort((a, b) => compareAlphabetically(cardDisplayName(a), cardDisplayName(b)));

    stacks.push({
      characterName,
      character,
      specials: matchedSpecials,
      advancedUniverse: matchedUa,
    });
  }

  stacks.sort((a, b) => compareCharacterNames(a.characterName, b.characterName));
  return stacks;
}

export function stackCardsInAddOrder(stack: CharacterStack): StackCardEntry[] {
  return [
    { catalogType: 'characters', card: stack.character },
    ...stack.specials.map((card) => ({ catalogType: 'special-cards' as const, card })),
    ...stack.advancedUniverse.map((card) => ({
      catalogType: 'advanced-universe' as const,
      card,
    })),
  ];
}

export function stackTotalCardCount(stack: CharacterStack): number {
  return stackCardsInAddOrder(stack).length;
}

export function filterCharacterStacks(
  stacks: CharacterStack[],
  searchQuery: string,
): CharacterStack[] {
  const q = searchQuery.trim();
  if (!q) return stacks;

  return stacks.filter((stack) =>
    cardMatchesSearchQuery({ name: stack.characterName }, q),
  );
}

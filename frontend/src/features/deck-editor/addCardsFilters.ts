import type { CatalogCard, CatalogType } from '../../lib/api/types';
import {
  cardMatchesSearchQuery,
  compareCatalogCards,
  CATALOG_TYPES,
  isAnyCharacterSpecialCard,
  type CatalogTypeMeta,
} from '../../lib/catalog/catalogTypeMap';
import { compareSetThenSetNumber } from '../../lib/catalog/catalogSetSort';
import type { CharacterStack } from '../../lib/catalog/characterStacks';
import { stackCardsInAddOrder } from '../../lib/catalog/characterStacks';
import type { MissionSet } from '../../lib/catalog/missionSets';
import type { DbvFilterState } from '../database/filters/dbvFilterTypes';
import { cardMatchesDbvFilters } from '../database/filters/dbvFilterPredicates';
import {
  catalogTypeSupportsHideUnusables,
  isCatalogCardUsable,
  type DeckUsabilityContext,
} from '../../lib/deck-usability';
import type { AddCardsSection } from './addCardsCatalog';

export interface AddCardsFilterOptions {
  searchQuery: string;
  setFilter: string;
  hideUnusables: boolean;
  usabilityCtx: DeckUsabilityContext;
  dynamicFilters?: DbvFilterState;
  specialScope?: 'character-specific' | 'any-character';
}

export function matchesSetFilter(card: CatalogCard, setFilter: string): boolean {
  if (!setFilter) return true;
  return String(card.set ?? '') === setFilter;
}

export function isCharacterSpecificSpecialCard(card: CatalogCard): boolean {
  return !isAnyCharacterSpecialCard(card);
}

function cardPassesSpecialScope(
  card: CatalogCard,
  catalogType: CatalogType,
  options: AddCardsFilterOptions,
): boolean {
  if (catalogType !== 'special-cards' || !options.specialScope) return true;
  return options.specialScope === 'any-character'
    ? isAnyCharacterSpecialCard(card)
    : isCharacterSpecificSpecialCard(card);
}

function truthyFlag(card: CatalogCard, ...keys: string[]): boolean {
  return keys.some((key) => {
    const value = card[key];
    return value === true || value === 'true' || value === 1 || value === '1';
  });
}

function specialFunctionSortIndex(card: CatalogCard): number {
  if (truthyFlag(card, 'is_cataclysm', 'cataclysm')) return 0;
  if (truthyFlag(card, 'is_ambush', 'ambush')) return 1;
  if (truthyFlag(card, 'is_assist', 'assist')) return 2;
  return 3;
}

function compareAnyCharacterSpecialCards(a: CatalogCard, b: CatalogCard): number {
  const setNumberCmp = compareSetThenSetNumber(a, b);
  if (setNumberCmp !== 0) return setNumberCmp;

  const functionCmp = specialFunctionSortIndex(a) - specialFunctionSortIndex(b);
  if (functionCmp !== 0) return functionCmp;

  return compareCatalogCards(a, b, 'special-cards');
}

export function cardPassesAddCardsFilters(
  card: CatalogCard,
  catalogType: CatalogType,
  options: AddCardsFilterOptions,
): boolean {
  if (!cardPassesSpecialScope(card, catalogType, options)) return false;

  const q = options.searchQuery.trim();
  if (q && !cardMatchesSearchQuery(card, q)) return false;
  if (!matchesSetFilter(card, options.setFilter)) return false;
  if (options.dynamicFilters && !cardMatchesDbvFilters(card, catalogType, options.dynamicFilters)) {
    return false;
  }

  if (
    options.hideUnusables &&
    catalogTypeSupportsHideUnusables(catalogType) &&
    !isCatalogCardUsable(card, catalogType, options.usabilityCtx)
  ) {
    return false;
  }

  return true;
}

/** Filter and sort cards for a single catalog type tab. */
export function filterAndSortTypeCardsWithOptions(
  cards: CatalogCard[],
  catalogType: CatalogType,
  options: AddCardsFilterOptions,
): CatalogCard[] {
  const result = cards.filter((c) => cardPassesAddCardsFilters(c, catalogType, options));
  result.sort((a, b) =>
    catalogType === 'special-cards' && options.specialScope === 'any-character'
      ? compareAnyCharacterSpecialCards(a, b)
      : compareCatalogCards(a, b, catalogType),
  );
  return result;
}

/**
 * Build non-empty type sections in catalog order for the All tab.
 */
export function buildAddCardsSectionsWithOptions(
  cardsByType: Partial<Record<CatalogType, CatalogCard[]>>,
  options: AddCardsFilterOptions,
): AddCardsSection[] {
  const sections: AddCardsSection[] = [];

  for (const meta of CATALOG_TYPES) {
    const raw = cardsByType[meta.type] ?? [];
    const filtered = raw.filter((c) => cardPassesAddCardsFilters(c, meta.type, options));
    if (filtered.length === 0) continue;
    filtered.sort((a, b) => compareCatalogCards(a, b, meta.type));
    sections.push({ meta, cards: filtered });
  }

  return sections;
}

export function filterCharacterStackForDisplay(
  stack: CharacterStack,
  options: AddCardsFilterOptions,
): CharacterStack | null {
  const characterVisible = cardPassesAddCardsFilters(stack.character, 'characters', options);
  const specials = stack.specials.filter((c) =>
    cardPassesAddCardsFilters(c, 'special-cards', options),
  );
  const advancedUniverse = stack.advancedUniverse.filter((c) =>
    cardPassesAddCardsFilters(c, 'advanced-universe', options),
  );

  const anyVisible = characterVisible || specials.length > 0 || advancedUniverse.length > 0;
  if (!anyVisible) return null;

  return {
    ...stack,
    specials,
    advancedUniverse,
  };
}

export function filterCharacterStacksWithOptions(
  stacks: CharacterStack[],
  options: AddCardsFilterOptions,
  opts?: { characterNameSearchOnly?: boolean },
): CharacterStack[] {
  const q = options.searchQuery.trim();
  let working = stacks;

  if (q && opts?.characterNameSearchOnly) {
    working = stacks.filter((stack) =>
      cardMatchesSearchQuery({ name: stack.characterName }, q),
    );
  }

  const cardOptions =
    q && opts?.characterNameSearchOnly ? { ...options, searchQuery: '' } : options;

  const result: CharacterStack[] = [];
  for (const stack of working) {
    const filtered = filterCharacterStackForDisplay(stack, cardOptions);
    if (filtered) result.push(filtered);
  }
  return result;
}

export function filterMissionSetForDisplay(
  set: MissionSet,
  options: AddCardsFilterOptions,
): MissionSet | null {
  const missions = set.missions.filter((c) => cardPassesAddCardsFilters(c, 'missions', options));
  if (missions.length === 0) return null;
  return { ...set, missions };
}

export function filterMissionSetsWithOptions(
  sets: MissionSet[],
  options: AddCardsFilterOptions,
  opts?: { missionSetNameSearch?: boolean },
): MissionSet[] {
  const q = options.searchQuery.trim().toLowerCase();
  let working = sets;

  if (q && opts?.missionSetNameSearch) {
    working = sets.filter((set) => {
      if (set.missionSetName.toLowerCase().includes(q)) return true;
      return set.missions.some((card) => cardPassesAddCardsFilters(card, 'missions', options));
    });
  }

  const cardOptions =
    q && opts?.missionSetNameSearch ? { ...options, searchQuery: '' } : options;

  const result: MissionSet[] = [];
  for (const set of working) {
    const filtered = filterMissionSetForDisplay(set, cardOptions);
    if (filtered) result.push(filtered);
  }
  return result;
}

/** Whether a stack has any card matching current filters (for counts). */
export function stackMatchesFilters(stack: CharacterStack, options: AddCardsFilterOptions): boolean {
  return stackCardsInAddOrder(stack).some(({ card, catalogType }) =>
    cardPassesAddCardsFilters(card, catalogType, options),
  );
}

export type { CatalogTypeMeta };

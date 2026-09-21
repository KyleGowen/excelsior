import type { CatalogCard } from '../api/types';
import { cardDisplayName } from './catalogTypeMap';
import { parseSetNumber, setCodeForCard } from './catalogSetSort';
import { isFoilCard } from './foilCatalog';
import { compareAlphabetically } from '../sort/alphabetical';

/** Checklist sort for All-tab lists: set code, non-foil before foil, set_number, then name. */
export function compareAllCatalogCards(a: CatalogCard, b: CatalogCard): number {
  const setCmp = setCodeForCard(a).localeCompare(setCodeForCard(b), undefined, { sensitivity: 'base' });
  if (setCmp !== 0) return setCmp;

  const aFoil = isFoilCard(a);
  const bFoil = isFoilCard(b);
  if (aFoil !== bFoil) return aFoil ? 1 : -1;

  const numA = parseSetNumber(a);
  const numB = parseSetNumber(b);
  if (numA !== null && numB !== null && numA !== numB) return numA - numB;
  if (numA !== null && numB === null) return -1;
  if (numA === null && numB !== null) return 1;

  return compareAlphabetically(cardDisplayName(a), cardDisplayName(b));
}

export function sortAllCatalogCards(cards: CatalogCard[]): CatalogCard[] {
  return [...cards].sort(compareAllCatalogCards);
}

/**
 * Checklist sort for Collection (All + per-type tabs): set code, non-foil before foil,
 * set_number, then name only when both cards lack a set_number.
 */
export function compareCollectionCatalogCards(a: CatalogCard, b: CatalogCard): number {
  const setCmp = setCodeForCard(a).localeCompare(setCodeForCard(b), undefined, { sensitivity: 'base' });
  if (setCmp !== 0) return setCmp;

  const aFoil = isFoilCard(a);
  const bFoil = isFoilCard(b);
  if (aFoil !== bFoil) return aFoil ? 1 : -1;

  const numA = parseSetNumber(a);
  const numB = parseSetNumber(b);
  if (numA !== null && numB !== null && numA !== numB) return numA - numB;
  if (numA !== null && numB === null) return -1;
  if (numA === null && numB !== null) return 1;

  if (numA === null && numB === null) {
    return compareAlphabetically(cardDisplayName(a), cardDisplayName(b));
  }

  return 0;
}

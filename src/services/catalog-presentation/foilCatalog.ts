import type { FoilMapEntry, CatalogCard } from './types';

export interface FoilCardMapLookup {
  baseToFoil: Map<string, string>;
  foilToBase: Map<string, string>;
}

export function isFoilCard(card: Partial<CatalogCard> | null | undefined): boolean {
  if (!card) return false;
  const v = card.is_foil as unknown;
  return v === true || v === 'true' || v === 1;
}

export function buildFoilCardMapLookup(entries: FoilMapEntry[]): FoilCardMapLookup {
  const baseToFoil = new Map<string, string>();
  const foilToBase = new Map<string, string>();
  for (const { foilCardId, baseCardId } of entries) {
    foilToBase.set(foilCardId, baseCardId);
    baseToFoil.set(baseCardId, foilCardId);
  }
  return { baseToFoil, foilToBase };
}

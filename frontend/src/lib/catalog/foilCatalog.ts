import type { FoilMapEntry } from '../api/catalog';
import type { CatalogCard } from '../api/types';

export interface FoilCardMapLookup {
  baseToFoil: Map<string, string>;
  foilToBase: Map<string, string>;
}

export function isFoilCard(card: Partial<CatalogCard> | null | undefined): boolean {
  if (!card) return false;
  if (card.presentation) return card.presentation.isFoil;
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

/**
 * One row per logical card: hide foil duplicates when the mapped base row is in the
 * same catalog list **and the same set** (e.g. ERB base + ERB foil in one view).
 * Cross-set foil promos (TFCP foil → ERB base via foil_card_map) stay visible as
 * their own tile — e.g. TFCP 7 - Combat foil art alongside 7_combat_2.jpg.
 */
export function dedupeFoilCatalogCards(cards: CatalogCard[], foilToBase: Map<string, string>): CatalogCard[] {
  const baseById = new Map(
    cards.filter((c) => !isFoilCard(c)).map((c) => [c.id, c] as const),
  );
  return cards.filter((card) => {
    if (!isFoilCard(card)) return true;
    const baseId = foilToBase.get(card.id);
    if (!baseId) return true;
    const base = baseById.get(baseId);
    if (!base) return true;
    if (String(base.set ?? '') !== String(card.set ?? '')) return true;
    return false;
  });
}

/** True when the displayed row has a foil variant (base with foil counterpart, or foil-only row). */
export function cardHasFoilVersion(card: CatalogCard, baseToFoil: Map<string, string>): boolean {
  if (isFoilCard(card)) return true;
  return baseToFoil.has(card.id);
}

/** DBV "Has Foil" filter: pass all cards when disabled; foil-capable only when enabled. */
export function matchesHasFoilFilter(
  card: CatalogCard,
  baseToFoil: Map<string, string>,
  enabled: boolean,
): boolean {
  return !enabled || cardHasFoilVersion(card, baseToFoil);
}

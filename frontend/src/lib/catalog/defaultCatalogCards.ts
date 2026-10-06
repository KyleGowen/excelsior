import type { CatalogCard, CatalogType } from '../api/types';
import { dedupeFoilCatalogCards, type FoilCardMapLookup } from './foilCatalog';

export interface DefaultCatalogCardsResult {
  cards: CatalogCard[];
  /** Representative card id → all variant ids in the group (including representative). */
  variantIdsByRepresentative: Map<string, string[]>;
}

/** Domain classifications and default ranks come from the presentation API. */
export function isAlternateArtCard(card:CatalogCard):boolean { return card.presentation?.isAlternateArt === true; }
export function variantGroupKey(card:CatalogCard,_catalogType:CatalogType):string|null { return card.presentation?.groupKey ?? null; }
function pickDefaultRepresentative(group:CatalogCard[],_catalogType:CatalogType,preferredSet?:string):CatalogCard {
 const preferred = preferredSet ? group.filter(c => c.set === preferredSet || c.presentation?.normalizedSet === preferredSet) : [];
 return (preferred.length ? preferred : group).slice().sort((a,b) => (a.presentation?.defaultRank ?? 0)-(b.presentation?.defaultRank ?? 0))[0];
}
export function resolveDefaultCardForDeckAdd(card:CatalogCard,_catalogType:CatalogType,allCatalogCards:CatalogCard[],_foilLookup?:Pick<FoilCardMapLookup,'foilToBase'|'baseToFoil'>):CatalogCard {
 return allCatalogCards.find(c => c.id === card.presentation?.addDefaultPrintingId) ?? card;
}

/**
 * One row per logical card: keep the default (non-alternate) representative per variant group.
 */
export function dedupeToDefaultCatalogCards(
  cards: CatalogCard[],
  catalogType: CatalogType,
  preferredSet?: string,
): DefaultCatalogCardsResult {
  const groups = new Map<string, CatalogCard[]>();

  for (const card of cards) {
    const key = variantGroupKey(card, catalogType);
    if (!key) continue;
    const list = groups.get(key);
    if (list) {
      list.push(card);
    } else {
      groups.set(key, [card]);
    }
  }

  const result: CatalogCard[] = [];
  const variantIdsByRepresentative = new Map<string, string[]>();

  for (const group of groups.values()) {
    const representative = pickDefaultRepresentative(group, catalogType, preferredSet);
    const variantIds = group.map((c) => c.id);
    result.push(representative);
    variantIdsByRepresentative.set(representative.id, variantIds);
  }

  return { cards: result, variantIdsByRepresentative };
}

/**
 * Foil dedup then alternate-art dedup for Add Cards catalog lists.
 */
export function prepareAddCardsCatalogList(
  cards: CatalogCard[],
  catalogType: CatalogType,
  foilToBase: Map<string, string>,
  preferredSet?: string,
): DefaultCatalogCardsResult {
  const foilDeduped = dedupeFoilCatalogCards(cards, foilToBase);
  return dedupeToDefaultCatalogCards(foilDeduped, catalogType, preferredSet);
}

/** Sum deck quantities for any variant id in the representative's group. */
export function qtyInDeckForRepresentative(
  representative: CatalogCard,
  _catalogType: CatalogType,
  deckCards: { type: string; cardId: string; quantity: number }[],
  deckType: string,
  variantIdsByRepresentative: Map<string, string[]>,
): number {
  const variantIds = variantIdsByRepresentative.get(representative.id) ?? [representative.id];
  const variantSet = new Set(variantIds);
  return deckCards
    .filter((c) => c.type === deckType && variantSet.has(c.cardId))
    .reduce((sum, c) => sum + c.quantity, 0);
}

/** Last-added deck instance id for any variant in the representative's group (LIFO). */
export function findLastInstanceIdForRepresentative(
  representative: CatalogCard,
  deckCards: { type: string; cardId: string; instanceId?: string }[],
  deckType: string,
  variantIdsByRepresentative: Map<string, string[]>,
): string | null {
  const variantIds = variantIdsByRepresentative.get(representative.id) ?? [representative.id];
  const variantSet = new Set(variantIds);
  for (let i = deckCards.length - 1; i >= 0; i--) {
    const entry = deckCards[i];
    if (entry.type === deckType && variantSet.has(entry.cardId) && entry.instanceId) {
      return entry.instanceId;
    }
  }
  return null;
}

import {
  cardCharacterName,
  cardDisplayName,
  compareDeckPowerCatalogCards,
  compareCharacterNames,
  isAnyCharacterName,
  metaForDeckType,
} from '../catalog/catalogTypeMap';
import type { CatalogCard, CatalogType, DeckCardEntry } from '../api/types';
import { compareAlphabetically } from '../sort/alphabetical';

export type DeckCardIndex = Map<string, CatalogCard>;

const UNDERSCORE_DECK_TYPES: Record<string, string> = {
  advanced_universe: 'advanced-universe',
  basic_universe: 'basic-universe',
  ally_universe: 'ally-universe',
};

/** Normalize legacy underscore deck types to hyphenated API form. */
export function normalizeDeckCardType(deckType: string): string {
  return UNDERSCORE_DECK_TYPES[deckType] ?? deckType;
}

export function catalogSlugForDeckType(deckType: string): CatalogType | undefined {
  return metaForDeckType(normalizeDeckCardType(deckType))?.type;
}

export function deckCardIndexKey(deckType: string, cardId: string): string {
  return `${normalizeDeckCardType(deckType)}:${cardId}`;
}

export type DeckCardLookup = Pick<DeckCardEntry, 'cardId'> & { type: string };

/** Resolve catalog row for a deck entry (type aliases + id-only fallback). */
export function resolveDeckCatalogCard(
  entry: DeckCardLookup,
  cardIndex: DeckCardIndex,
): CatalogCard | undefined {
  const normalizedType = normalizeDeckCardType(entry.type);
  return (
    cardIndex.get(`${normalizedType}:${entry.cardId}`) ??
    cardIndex.get(`${entry.type}:${entry.cardId}`) ??
    cardIndex.get(entry.cardId)
  );
}

/** User-facing label when catalog name is unavailable. */
export function deckCardDisplayName(
  entry: DeckCardLookup & Pick<DeckCardEntry, 'name'>,
  cardIndex: DeckCardIndex,
): string {
  const savedName = entry.name?.trim();
  if (savedName) return savedName;

  const catalogCard = resolveDeckCatalogCard(entry, cardIndex);
  if (catalogCard) return cardDisplayName(catalogCard);

  const meta = metaForDeckType(normalizeDeckCardType(entry.type));
  const typeLabel = meta?.shortLabel ?? normalizeDeckCardType(entry.type);
  return `Unknown ${typeLabel} card`;
}

/** Deck editor power section: ascending value, then OP type order. */
export function sortDeckPowerEntries(
  entries: DeckCardEntry[],
  cardIndex: DeckCardIndex,
): DeckCardEntry[] {
  if (entries.length <= 1) return entries;
  return [...entries].sort((a, b) => {
    const cardA = resolveDeckCatalogCard(a, cardIndex);
    const cardB = resolveDeckCatalogCard(b, cardIndex);
    if (!cardA || !cardB) return 0;
    return compareDeckPowerCatalogCards(cardA, cardB);
  });
}

/** Compare special deck entries: character name A→Z (Any Character last), then special name. */
export function compareDeckSpecialEntries(
  a: DeckCardEntry,
  b: DeckCardEntry,
  cardIndex: DeckCardIndex,
): number {
  const cardA = resolveDeckCatalogCard(a, cardIndex);
  const cardB = resolveDeckCatalogCard(b, cardIndex);
  const charCmp = compareCharacterNames(cardCharacterName(cardA), cardCharacterName(cardB));
  if (charCmp !== 0) return charCmp;
  return compareAlphabetically(cardDisplayName(cardA), cardDisplayName(cardB));
}

/** Deck editor special section: character name then special card name (Any Character last). */
export function sortDeckSpecialEntries(
  entries: DeckCardEntry[],
  cardIndex: DeckCardIndex,
): DeckCardEntry[] {
  if (entries.length <= 1) return entries;
  return [...entries].sort((a, b) => compareDeckSpecialEntries(a, b, cardIndex));
}

/** True when a special is linked to the shared Any Character card pool. */
export function isAnyCharacterSpecialEntry(
  entry: DeckCardEntry,
  cardIndex: DeckCardIndex,
): boolean {
  return isAnyCharacterName(cardCharacterName(resolveDeckCatalogCard(entry, cardIndex)));
}

/** A visual divider is useful only when both special-card categories are present. */
export function hasMixedSpecialCardCategories(
  entries: DeckCardEntry[],
  cardIndex: DeckCardIndex,
): boolean {
  let hasCharacterSpecial = false;
  let hasAnyCharacterSpecial = false;

  for (const entry of entries) {
    const characterName = cardCharacterName(resolveDeckCatalogCard(entry, cardIndex));
    if (!characterName) continue;
    if (isAnyCharacterName(characterName)) {
      hasAnyCharacterSpecial = true;
    } else {
      hasCharacterSpecial = true;
    }
    if (hasCharacterSpecial && hasAnyCharacterSpecial) return true;
  }

  return false;
}

/** Build lookup map for deck editor / draw hand (normalized keys + id-only). */
export function buildDeckCardIndex(
  deckTypes: string[],
  catalogRowsByType: (CatalogCard[] | undefined)[],
): DeckCardIndex {
  const index: DeckCardIndex = new Map();

  deckTypes.forEach((deckType, i) => {
    const normalizedType = normalizeDeckCardType(deckType);
    for (const card of catalogRowsByType[i] ?? []) {
      index.set(`${normalizedType}:${card.id}`, card);
      if (deckType !== normalizedType) {
        index.set(`${deckType}:${card.id}`, card);
      }
      index.set(card.id, card);
    }
  });

  return index;
}

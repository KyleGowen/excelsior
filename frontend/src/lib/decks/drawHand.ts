import type { DeckCardEntry } from '../api/types';
import { cardDisplayName, compareDeckPowerCatalogCards } from '../catalog/catalogTypeMap';
import {
  compareDeckSpecialEntries,
  resolveDeckCatalogCard,
  type DeckCardIndex,
} from './deckCardCatalog';
import { deckEditorSectionIndex } from './deckEditorSectionOrder';

const NON_PLAYABLE_TYPES = new Set(['character', 'location', 'battleground', 'mission']);

function isPlayableType(type: string): boolean {
  return !NON_PLAYABLE_TYPES.has(type);
}

function cardQuantity(card: DeckCardEntry): number {
  return Math.max(1, card.quantity ?? 1);
}

function drawPileQuantity(card: DeckCardEntry): number {
  return Math.max(0, cardQuantity(card) - (card.exclude_from_draw === true ? 1 : 0));
}

/** Count playable cards for button enable (includes exclude_from_draw rows). */
export function countPlayableCards(cards: DeckCardEntry[]): number {
  return cards
    .filter((card) => isPlayableType(card.type))
    .reduce((sum, card) => sum + cardQuantity(card), 0);
}

/**
 * Count cards that belong in the deck-size metric. Pre-placed cards are
 * intentionally excluded here, while countPlayableCards still includes them
 * for the Draw Hand eligibility threshold.
 */
export function countCardsInDeck(cards: DeckCardEntry[]): number {
  return cards
    .filter((card) => isPlayableType(card.type))
    .reduce((sum, card) => sum + drawPileQuantity(card), 0);
}

export function canDrawHand(cards: DeckCardEntry[]): boolean {
  return countPlayableCards(cards) >= 8;
}

/** Build the random draw pile (excludes non-playable types and exclude_from_draw). */
export function buildDrawPile(cards: DeckCardEntry[]): DeckCardEntry[] {
  const drawPile: DeckCardEntry[] = [];
  for (const card of cards) {
    if (!isPlayableType(card.type)) continue;
    const qty = drawPileQuantity(card);
    for (let i = 0; i < qty; i++) {
      drawPile.push(card);
    }
  }
  return drawPile;
}

export interface DrawRandomHandOptions {
  /** Injectable RNG for tests. Defaults to Math.random. */
  random?: () => number;
}

/**
 * Draw 8 random unique pile slots; 9th when an event is in the first 8 and pile has >8 cards.
 * Ports legacy draw-hand.js logic.
 */
export function drawRandomHand(
  cards: DeckCardEntry[],
  options: DrawRandomHandOptions = {},
): DeckCardEntry[] {
  const random = options.random ?? Math.random;
  const drawPile = buildDrawPile(cards);
  if (drawPile.length === 0) return [];

  const newDrawnCards: DeckCardEntry[] = [];
  const usedIndices = new Set<number>();
  const targetHandSize = 8;
  const maxCardsToDraw = Math.min(targetHandSize, drawPile.length);

  let attempts = 0;
  const maxAttempts = drawPile.length * 10;

  while (newDrawnCards.length < maxCardsToDraw && attempts < maxAttempts) {
    attempts++;
    const randomIndex = Math.floor(random() * drawPile.length);
    if (!usedIndices.has(randomIndex)) {
      usedIndices.add(randomIndex);
      newDrawnCards.push(drawPile[randomIndex]);
    }
  }

  const hasEventCards = newDrawnCards.some((card) => card.type === 'event');
  if (
    hasEventCards &&
    drawPile.length > 8 &&
    newDrawnCards.length < 9 &&
    newDrawnCards.length < drawPile.length
  ) {
    let eventAttempts = 0;
    const maxEventAttempts = drawPile.length * 2;
    while (newDrawnCards.length < 9 && eventAttempts < maxEventAttempts) {
      eventAttempts++;
      const ri = Math.floor(random() * drawPile.length);
      if (!usedIndices.has(ri)) {
        usedIndices.add(ri);
        newDrawnCards.push(drawPile[ri]);
        break;
      }
    }
  }

  return newDrawnCards;
}

function compareDrawnHandEntries(
  a: DeckCardEntry,
  b: DeckCardEntry,
  cardIndex: DeckCardIndex,
): number {
  const sectionCmp = deckEditorSectionIndex(a.type) - deckEditorSectionIndex(b.type);
  if (sectionCmp !== 0) return sectionCmp;

  if (a.type === 'power') {
    const cardA = resolveDeckCatalogCard(a, cardIndex);
    const cardB = resolveDeckCatalogCard(b, cardIndex);
    if (cardA && cardB) {
      const powerCmp = compareDeckPowerCatalogCards(cardA, cardB);
      if (powerCmp !== 0) return powerCmp;
    }
  } else if (a.type === 'special') {
    const specialCmp = compareDeckSpecialEntries(a, b, cardIndex);
    if (specialCmp !== 0) return specialCmp;
  } else {
    const nameA = cardDisplayName(resolveDeckCatalogCard(a, cardIndex));
    const nameB = cardDisplayName(resolveDeckCatalogCard(b, cardIndex));
    const nameCmp = nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    if (nameCmp !== 0) return nameCmp;
  }

  const idA = a.instanceId ?? a.cardId;
  const idB = b.instanceId ?? b.cardId;
  return idA.localeCompare(idB);
}

/** Sort drawn hand for display: deck section order, then per-type deck-editor sort. */
export function sortDrawnHandCards(
  drawn: DeckCardEntry[],
  cardIndex: DeckCardIndex,
): DeckCardEntry[] {
  if (drawn.length <= 1) return drawn;
  return [...drawn].sort((a, b) => compareDrawnHandEntries(a, b, cardIndex));
}

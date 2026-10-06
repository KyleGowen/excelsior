import type { DeckCardEntry } from './types';
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

export { countPlayableCards, countCardsInDeck, canDrawHand } from '../deck-evaluation/deckCounts';

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

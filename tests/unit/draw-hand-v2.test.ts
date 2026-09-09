import type { CatalogCard, DeckCardEntry } from '../../frontend/src/lib/api/types';
import {
  buildDrawPile,
  canDrawHand,
  countCardsInDeck,
  countPlayableCards,
  drawRandomHand,
  sortDrawnHandCards,
} from '../../frontend/src/lib/decks/drawHand';
import { buildDeckCardIndex } from '../../frontend/src/lib/decks/deckCardCatalog';

function entry(
  type: DeckCardEntry['type'],
  cardId: string,
  overrides: Partial<DeckCardEntry> = {},
): DeckCardEntry {
  return { type, cardId, quantity: 1, ...overrides };
}

function power(id: string, overrides: Partial<DeckCardEntry> = {}): DeckCardEntry {
  return entry('power', id, overrides);
}

describe('drawHand (v2)', () => {
  describe('countPlayableCards / canDrawHand', () => {
    it('counts playable types only', () => {
      const cards = [
        entry('character', 'c1'),
        entry('location', 'l1'),
        entry('mission', 'm1'),
        power('p1'),
        power('p2'),
      ];
      expect(countPlayableCards(cards)).toBe(2);
    });

    it('sums quantity for enable threshold', () => {
      const cards = Array.from({ length: 7 }, (_, i) => power(`p${i}`));
      expect(canDrawHand(cards)).toBe(false);
      cards.push(power('p7'));
      expect(canDrawHand(cards)).toBe(true);
    });

    it('includes exclude_from_draw cards in enable count', () => {
      const cards = Array.from({ length: 7 }, (_, i) => power(`p${i}`));
      cards.push(power('excluded', { exclude_from_draw: true }));
      expect(countPlayableCards(cards)).toBe(8);
      expect(canDrawHand(cards)).toBe(true);
    });

    it('excludes one pre-placed copy from an aggregated row', () => {
      const cards = [
        power('p1', { quantity: 2 }),
        power('pre-placed', { quantity: 3, exclude_from_draw: true }),
        entry('location', 'l1'),
      ];

      expect(countCardsInDeck(cards)).toBe(4);
    });
  });

  describe('buildDrawPile', () => {
    it('excludes character, location, mission', () => {
      const cards = [
        entry('character', 'c1'),
        entry('location', 'l1'),
        entry('mission', 'm1'),
        power('p1'),
      ];
      expect(buildDrawPile(cards)).toHaveLength(1);
      expect(buildDrawPile(cards)[0].cardId).toBe('p1');
    });

    it('omits exclude_from_draw from pile', () => {
      const cards = [power('p1'), power('p2', { exclude_from_draw: true })];
      const pile = buildDrawPile(cards);
      expect(pile).toHaveLength(1);
      expect(pile[0].cardId).toBe('p1');
    });

    it('expands quantity into separate pile slots', () => {
      const cards = [power('p1', { quantity: 3 })];
      expect(buildDrawPile(cards)).toHaveLength(3);
    });

    it('omits only the pre-placed copy from an aggregated duplicate row', () => {
      const cards = [power('p1', { quantity: 3, exclude_from_draw: true })];
      expect(buildDrawPile(cards)).toHaveLength(2);
    });
  });

  describe('drawRandomHand', () => {
    it('returns empty array when pile is empty', () => {
      expect(drawRandomHand([entry('character', 'c1')])).toEqual([]);
    });

    it('draws at most pile size when fewer than 8 cards', () => {
      const cards = Array.from({ length: 5 }, (_, i) => power(`p${i}`));
      let call = 0;
      const hand = drawRandomHand(cards, {
        random: () => (call++ + 0.01) / 5,
      });
      expect(hand).toHaveLength(5);
    });

    it('draws exactly 8 from pile of 8+', () => {
      const cards = Array.from({ length: 12 }, (_, i) => power(`p${i}`));
      const sequence = [0, 0.09, 0.18, 0.27, 0.36, 0.45, 0.54, 0.63];
      let i = 0;
      const hand = drawRandomHand(cards, {
        random: () => sequence[i++ % sequence.length],
      });
      expect(hand).toHaveLength(8);
      const ids = new Set(hand.map((c) => c.cardId));
      expect(ids.size).toBe(8);
    });

    it('draws 9th card when event in first 8 and pile > 8', () => {
      const cards = [
        entry('event', 'e1'),
        ...Array.from({ length: 10 }, (_, i) => power(`p${i}`)),
      ];
      const pileLen = 11;
      const picks = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      let i = 0;
      const hand = drawRandomHand(cards, {
        random: () => (picks[i++] + 0.01) / pileLen,
      });
      expect(hand.some((c) => c.type === 'event')).toBe(true);
      expect(hand).toHaveLength(9);
    });

    it('does not infinite loop on small piles', () => {
      const cards = [power('only')];
      expect(() => drawRandomHand(cards)).not.toThrow();
      expect(drawRandomHand(cards)).toHaveLength(1);
    });
  });

  describe('sortDrawnHandCards', () => {
    const catalogByType: CatalogCard[][] = [
      [{ id: 'sp1', name: 'Zap', character: 'Zatanna' } as CatalogCard],
      [{ id: 'pw1', name: '3 - Energy', value: 3, power_type: 'Energy' } as CatalogCard],
      [{ id: 'ev1', name: 'Big Event' } as CatalogCard],
    ];
    const index = buildDeckCardIndex(['special', 'power', 'event'], catalogByType);

    it('orders by deck section index (special before power before event)', () => {
      const drawn = [
        entry('event', 'ev1', { instanceId: 'e1' }),
        entry('power', 'pw1', { instanceId: 'p1' }),
        entry('special', 'sp1', { instanceId: 's1' }),
      ];
      const sorted = sortDrawnHandCards(drawn, index);
      expect(sorted.map((c) => c.type)).toEqual(['special', 'power', 'event']);
    });

    it('groups duplicate instances of the same card adjacent', () => {
      const drawn = [
        power('pw1', { instanceId: 'p2' }),
        power('pw1', { instanceId: 'p1' }),
      ];
      const sorted = sortDrawnHandCards(drawn, index);
      expect(sorted.map((c) => c.instanceId)).toEqual(['p1', 'p2']);
    });
  });
});

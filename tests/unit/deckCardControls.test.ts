import type { CatalogCard } from '../../frontend/src/lib/api/types';
import {
  deckCardQuantityMax,
  deckCardUsesTrashOnlyRemoval,
} from '../../frontend/src/lib/decks/deckCardControls';

describe('deckCardControls', () => {
  describe('deckCardUsesTrashOnlyRemoval', () => {
    it('returns true for all deck types (one tile per instance)', () => {
      expect(deckCardUsesTrashOnlyRemoval('character')).toBe(true);
      expect(deckCardUsesTrashOnlyRemoval('location')).toBe(true);
      expect(deckCardUsesTrashOnlyRemoval('mission')).toBe(true);
      expect(deckCardUsesTrashOnlyRemoval('power')).toBe(true);
      expect(deckCardUsesTrashOnlyRemoval('special')).toBe(true);
      expect(deckCardUsesTrashOnlyRemoval('event')).toBe(true);
    });
  });

  describe('deckCardQuantityMax', () => {
    it('returns 1 for all types (one tile per instance)', () => {
      const opdSpecial = { id: 's1', one_per_deck: true } as CatalogCard;
      const power = { id: 'p1', one_per_deck: false } as CatalogCard;
      expect(deckCardQuantityMax('special', opdSpecial)).toBe(1);
      expect(deckCardQuantityMax('power', power)).toBe(1);
      expect(deckCardQuantityMax('character', { id: 'c1' } as CatalogCard)).toBe(1);
    });
  });
});

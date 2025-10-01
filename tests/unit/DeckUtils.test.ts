import { DeckUtils } from '../../src/utils/deckUtils';
import { DeckCard } from '../../src/types';

describe('DeckUtils', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID v4 string', () => {
      const uuid = DeckUtils.generateUUID();
      
      expect(typeof uuid).toBe('string');
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = DeckUtils.generateUUID();
      const uuid2 = DeckUtils.generateUUID();
      
      expect(uuid1).not.toBe(uuid2);
    });

    it('should generate multiple unique UUIDs', () => {
      const uuids = Array.from({ length: 100 }, () => DeckUtils.generateUUID());
      const uniqueUuids = new Set(uuids);
      
      expect(uniqueUuids.size).toBe(100);
    });
  });

  describe('calculateCardCount', () => {
    const mockCards: DeckCard[] = [
      { id: '1', type: 'character', cardId: 'char1', quantity: 1 },
      { id: '2', type: 'mission', cardId: 'miss1', quantity: 2 },
      { id: '3', type: 'location', cardId: 'loc1', quantity: 1 },
      { id: '4', type: 'power', cardId: 'pow1', quantity: 3 },
      { id: '5', type: 'special', cardId: 'spec1', quantity: 2 },
      { id: '6', type: 'event', cardId: 'evt1', quantity: 1 }
    ];

    it('should calculate correct card count excluding mission, character, and location cards', () => {
      const count = DeckUtils.calculateCardCount(mockCards);
      
      expect(count).toBe(6); // power(3) + special(2) + event(1)
    });

    it('should return 0 for empty array', () => {
      const count = DeckUtils.calculateCardCount([]);
      
      expect(count).toBe(0);
    });

    it('should return 0 for null input', () => {
      const count = DeckUtils.calculateCardCount(null as any);
      
      expect(count).toBe(0);
    });

    it('should return 0 for undefined input', () => {
      const count = DeckUtils.calculateCardCount(undefined as any);
      
      expect(count).toBe(0);
    });

    it('should return 0 for non-array input', () => {
      const count = DeckUtils.calculateCardCount('not an array' as any);
      
      expect(count).toBe(0);
    });

    it('should handle cards with zero quantity', () => {
      const cardsWithZero: DeckCard[] = [
        { id: '1', type: 'power', cardId: 'pow1', quantity: 0 },
        { id: '2', type: 'special', cardId: 'spec1', quantity: 2 }
      ];
      
      const count = DeckUtils.calculateCardCount(cardsWithZero);
      
      expect(count).toBe(2);
    });

    it('should handle cards with missing quantity', () => {
      const cardsWithMissingQuantity: DeckCard[] = [
        { id: '1', type: 'power', cardId: 'pow1', quantity: 3 },
        { id: '2', type: 'special', cardId: 'spec1' } as any
      ];
      
      const count = DeckUtils.calculateCardCount(cardsWithMissingQuantity);
      
      expect(count).toBe(3);
    });
  });

  describe('calculateTotalCardCount', () => {
    const mockCards: DeckCard[] = [
      { id: '1', type: 'character', cardId: 'char1', quantity: 1 },
      { id: '2', type: 'mission', cardId: 'miss1', quantity: 2 },
      { id: '3', type: 'power', cardId: 'pow1', quantity: 3 }
    ];

    it('should calculate total card count including all types', () => {
      const count = DeckUtils.calculateTotalCardCount(mockCards);
      
      expect(count).toBe(6); // 1 + 2 + 3
    });

    it('should return 0 for empty array', () => {
      const count = DeckUtils.calculateTotalCardCount([]);
      
      expect(count).toBe(0);
    });

    it('should return 0 for null input', () => {
      const count = DeckUtils.calculateTotalCardCount(null as any);
      
      expect(count).toBe(0);
    });

    it('should handle cards with zero quantity', () => {
      const cardsWithZero: DeckCard[] = [
        { id: '1', type: 'power', cardId: 'pow1', quantity: 0 },
        { id: '2', type: 'special', cardId: 'spec1', quantity: 2 }
      ];
      
      const count = DeckUtils.calculateTotalCardCount(cardsWithZero);
      
      expect(count).toBe(2);
    });
  });

  describe('calculateCardCountByType', () => {
    const mockCards: DeckCard[] = [
      { id: '1', type: 'character', cardId: 'char1', quantity: 1 },
      { id: '2', type: 'power', cardId: 'pow1', quantity: 3 },
      { id: '3', type: 'power', cardId: 'pow2', quantity: 2 },
      { id: '4', type: 'special', cardId: 'spec1', quantity: 1 }
    ];

    it('should calculate count for specific card types', () => {
      const count = DeckUtils.calculateCardCountByType(mockCards, ['power']);
      
      expect(count).toBe(5); // 3 + 2
    });

    it('should calculate count for multiple card types', () => {
      const count = DeckUtils.calculateCardCountByType(mockCards, ['power', 'special']);
      
      expect(count).toBe(6); // 3 + 2 + 1
    });

    it('should return 0 for non-existent card types', () => {
      const count = DeckUtils.calculateCardCountByType(mockCards, ['nonexistent']);
      
      expect(count).toBe(0);
    });

    it('should return 0 for empty types array', () => {
      const count = DeckUtils.calculateCardCountByType(mockCards, []);
      
      expect(count).toBe(0);
    });

    it('should return 0 for null cards input', () => {
      const count = DeckUtils.calculateCardCountByType(null as any, ['power']);
      
      expect(count).toBe(0);
    });

    it('should return 0 for null types input', () => {
      const count = DeckUtils.calculateCardCountByType(mockCards, null as any);
      
      expect(count).toBe(0);
    });
  });

  describe('getUniqueCardTypes', () => {
    const mockCards: DeckCard[] = [
      { id: '1', type: 'character', cardId: 'char1', quantity: 1 },
      { id: '2', type: 'power', cardId: 'pow1', quantity: 3 },
      { id: '3', type: 'power', cardId: 'pow2', quantity: 2 },
      { id: '4', type: 'special', cardId: 'spec1', quantity: 1 }
    ];

    it('should return unique card types', () => {
      const types = DeckUtils.getUniqueCardTypes(mockCards);
      
      expect(types).toEqual(['character', 'power', 'special']);
    });

    it('should return empty array for empty input', () => {
      const types = DeckUtils.getUniqueCardTypes([]);
      
      expect(types).toEqual([]);
    });

    it('should return empty array for null input', () => {
      const types = DeckUtils.getUniqueCardTypes(null as any);
      
      expect(types).toEqual([]);
    });

    it('should handle single card type', () => {
      const singleTypeCards: DeckCard[] = [
        { id: '1', type: 'power', cardId: 'pow1', quantity: 1 },
        { id: '2', type: 'power', cardId: 'pow2', quantity: 2 }
      ];
      
      const types = DeckUtils.getUniqueCardTypes(singleTypeCards);
      
      expect(types).toEqual(['power']);
    });
  });

  describe('hasCardType', () => {
    const mockCards: DeckCard[] = [
      { id: '1', type: 'character', cardId: 'char1', quantity: 1 },
      { id: '2', type: 'power', cardId: 'pow1', quantity: 3 }
    ];

    it('should return true if deck has cards of specified type', () => {
      const hasPower = DeckUtils.hasCardType(mockCards, 'power');
      
      expect(hasPower).toBe(true);
    });

    it('should return false if deck does not have cards of specified type', () => {
      const hasSpecial = DeckUtils.hasCardType(mockCards, 'special');
      
      expect(hasSpecial).toBe(false);
    });

    it('should return false for null cards input', () => {
      const hasPower = DeckUtils.hasCardType(null as any, 'power');
      
      expect(hasPower).toBe(false);
    });

    it('should return false for null type input', () => {
      const hasPower = DeckUtils.hasCardType(mockCards, null as any);
      
      expect(hasPower).toBe(false);
    });

    it('should return false for empty type input', () => {
      const hasPower = DeckUtils.hasCardType(mockCards, '');
      
      expect(hasPower).toBe(false);
    });
  });

  describe('getCardsByType', () => {
    const mockCards: DeckCard[] = [
      { id: '1', type: 'character', cardId: 'char1', quantity: 1 },
      { id: '2', type: 'power', cardId: 'pow1', quantity: 3 },
      { id: '3', type: 'power', cardId: 'pow2', quantity: 2 }
    ];

    it('should return cards of specified type', () => {
      const powerCards = DeckUtils.getCardsByType(mockCards, 'power');
      
      expect(powerCards).toHaveLength(2);
      expect(powerCards[0].type).toBe('power');
      expect(powerCards[1].type).toBe('power');
    });

    it('should return empty array for non-existent type', () => {
      const specialCards = DeckUtils.getCardsByType(mockCards, 'special');
      
      expect(specialCards).toEqual([]);
    });

    it('should return empty array for null cards input', () => {
      const powerCards = DeckUtils.getCardsByType(null as any, 'power');
      
      expect(powerCards).toEqual([]);
    });

    it('should return empty array for null type input', () => {
      const powerCards = DeckUtils.getCardsByType(mockCards, null as any);
      
      expect(powerCards).toEqual([]);
    });
  });

  describe('isValidDeckCard', () => {
    it('should return true for valid deck card', () => {
      const validCard: DeckCard = {
        id: '1',
        type: 'power',
        cardId: 'pow1',
        quantity: 3
      };
      
      const isValid = DeckUtils.isValidDeckCard(validCard);
      
      expect(isValid).toBe(true);
    });

    it('should return false for null input', () => {
      const isValid = DeckUtils.isValidDeckCard(null);
      
      expect(isValid).toBe(false);
    });

    it('should return false for undefined input', () => {
      const isValid = DeckUtils.isValidDeckCard(undefined);
      
      expect(isValid).toBe(false);
    });

    it('should return false for non-object input', () => {
      const isValid = DeckUtils.isValidDeckCard('not an object');
      
      expect(isValid).toBe(false);
    });

    it('should return false for missing id', () => {
      const invalidCard = {
        type: 'power',
        cardId: 'pow1',
        quantity: 3
      };
      
      const isValid = DeckUtils.isValidDeckCard(invalidCard);
      
      expect(isValid).toBe(false);
    });

    it('should return false for missing type', () => {
      const invalidCard = {
        id: '1',
        cardId: 'pow1',
        quantity: 3
      };
      
      const isValid = DeckUtils.isValidDeckCard(invalidCard);
      
      expect(isValid).toBe(false);
    });

    it('should return false for missing cardId', () => {
      const invalidCard = {
        id: '1',
        type: 'power',
        quantity: 3
      };
      
      const isValid = DeckUtils.isValidDeckCard(invalidCard);
      
      expect(isValid).toBe(false);
    });

    it('should return false for invalid quantity', () => {
      const invalidCard = {
        id: '1',
        type: 'power',
        cardId: 'pow1',
        quantity: 'not a number'
      };
      
      const isValid = DeckUtils.isValidDeckCard(invalidCard);
      
      expect(isValid).toBe(false);
    });

    it('should return false for zero quantity', () => {
      const invalidCard = {
        id: '1',
        type: 'power',
        cardId: 'pow1',
        quantity: 0
      };
      
      const isValid = DeckUtils.isValidDeckCard(invalidCard);
      
      expect(isValid).toBe(false);
    });

    it('should return false for negative quantity', () => {
      const invalidCard = {
        id: '1',
        type: 'power',
        cardId: 'pow1',
        quantity: -1
      };
      
      const isValid = DeckUtils.isValidDeckCard(invalidCard);
      
      expect(isValid).toBe(false);
    });
  });

  describe('isValidDeckCardsArray', () => {
    it('should return true for valid deck cards array', () => {
      const validCards: DeckCard[] = [
        { id: '1', type: 'power', cardId: 'pow1', quantity: 3 },
        { id: '2', type: 'special', cardId: 'spec1', quantity: 1 }
      ];
      
      const isValid = DeckUtils.isValidDeckCardsArray(validCards);
      
      expect(isValid).toBe(true);
    });

    it('should return false for null input', () => {
      const isValid = DeckUtils.isValidDeckCardsArray(null);
      
      expect(isValid).toBe(false);
    });

    it('should return false for undefined input', () => {
      const isValid = DeckUtils.isValidDeckCardsArray(undefined);
      
      expect(isValid).toBe(false);
    });

    it('should return false for non-array input', () => {
      const isValid = DeckUtils.isValidDeckCardsArray('not an array');
      
      expect(isValid).toBe(false);
    });

    it('should return false for array with invalid cards', () => {
      const invalidCards = [
        { id: '1', type: 'power', cardId: 'pow1', quantity: 3 },
        { id: '2', type: 'special', cardId: 'spec1', quantity: 0 } // invalid quantity
      ];
      
      const isValid = DeckUtils.isValidDeckCardsArray(invalidCards);
      
      expect(isValid).toBe(false);
    });

    it('should return true for empty array', () => {
      const isValid = DeckUtils.isValidDeckCardsArray([]);
      
      expect(isValid).toBe(true);
    });
  });

  describe('generateCardId', () => {
    it('should generate unique card IDs', async () => {
      const cardId1 = DeckUtils.generateCardId('power', 'pow1');
      await new Promise(resolve => setTimeout(resolve, 1)); // Small delay to ensure different timestamps
      const cardId2 = DeckUtils.generateCardId('power', 'pow1');
      
      expect(cardId1).not.toBe(cardId2);
      expect(cardId1).toMatch(/^power_pow1_\d+$/);
      expect(cardId2).toMatch(/^power_pow1_\d+$/);
    });

    it('should include card type and base ID in generated ID', () => {
      const cardId = DeckUtils.generateCardId('special', 'spec1');
      
      expect(cardId).toContain('special');
      expect(cardId).toContain('spec1');
    });

    it('should handle empty strings', () => {
      const cardId = DeckUtils.generateCardId('', '');
      
      expect(cardId).toMatch(/^__\d+$/);
    });
  });

  describe('sortCardsByTypeAndId', () => {
    const mockCards: DeckCard[] = [
      { id: '3', type: 'power', cardId: 'pow2', quantity: 2 },
      { id: '1', type: 'character', cardId: 'char1', quantity: 1 },
      { id: '2', type: 'power', cardId: 'pow1', quantity: 3 },
      { id: '4', type: 'special', cardId: 'spec1', quantity: 1 }
    ];

    it('should sort cards by type first, then by cardId', () => {
      const sortedCards = DeckUtils.sortCardsByTypeAndId(mockCards);
      
      expect(sortedCards[0].type).toBe('character');
      expect(sortedCards[0].cardId).toBe('char1');
      expect(sortedCards[1].type).toBe('power');
      expect(sortedCards[1].cardId).toBe('pow1');
      expect(sortedCards[2].type).toBe('power');
      expect(sortedCards[2].cardId).toBe('pow2');
      expect(sortedCards[3].type).toBe('special');
      expect(sortedCards[3].cardId).toBe('spec1');
    });

    it('should not modify original array', () => {
      const originalCards = [...mockCards];
      DeckUtils.sortCardsByTypeAndId(mockCards);
      
      expect(mockCards).toEqual(originalCards);
    });

    it('should return empty array for null input', () => {
      const sortedCards = DeckUtils.sortCardsByTypeAndId(null as any);
      
      expect(sortedCards).toEqual([]);
    });

    it('should return empty array for empty input', () => {
      const sortedCards = DeckUtils.sortCardsByTypeAndId([]);
      
      expect(sortedCards).toEqual([]);
    });
  });

  describe('getDeckStatistics', () => {
    const mockCards: DeckCard[] = [
      { id: '1', type: 'character', cardId: 'char1', quantity: 1 },
      { id: '2', type: 'mission', cardId: 'miss1', quantity: 2 },
      { id: '3', type: 'location', cardId: 'loc1', quantity: 1 },
      { id: '4', type: 'power', cardId: 'pow1', quantity: 3 },
      { id: '5', type: 'power', cardId: 'pow2', quantity: 2 },
      { id: '6', type: 'special', cardId: 'spec1', quantity: 1 }
    ];

    it('should return correct deck statistics', () => {
      const stats = DeckUtils.getDeckStatistics(mockCards);
      
      expect(stats.totalCards).toBe(10); // 1 + 2 + 1 + 3 + 2 + 1
      expect(stats.cardCount).toBe(6); // power(3+2) + special(1)
      expect(stats.characterCount).toBe(1);
      expect(stats.missionCount).toBe(2);
      expect(stats.locationCount).toBe(1);
      expect(stats.otherCount).toBe(6);
      expect(stats.uniqueTypes).toEqual(['character', 'mission', 'location', 'power', 'special']);
      expect(stats.typeBreakdown).toEqual({
        character: 1,
        mission: 2,
        location: 1,
        power: 5,
        special: 1
      });
    });

    it('should return empty statistics for null input', () => {
      const stats = DeckUtils.getDeckStatistics(null as any);
      
      expect(stats.totalCards).toBe(0);
      expect(stats.cardCount).toBe(0);
      expect(stats.characterCount).toBe(0);
      expect(stats.missionCount).toBe(0);
      expect(stats.locationCount).toBe(0);
      expect(stats.otherCount).toBe(0);
      expect(stats.uniqueTypes).toEqual([]);
      expect(stats.typeBreakdown).toEqual({});
    });

    it('should return empty statistics for empty input', () => {
      const stats = DeckUtils.getDeckStatistics([]);
      
      expect(stats.totalCards).toBe(0);
      expect(stats.cardCount).toBe(0);
      expect(stats.characterCount).toBe(0);
      expect(stats.missionCount).toBe(0);
      expect(stats.locationCount).toBe(0);
      expect(stats.otherCount).toBe(0);
      expect(stats.uniqueTypes).toEqual([]);
      expect(stats.typeBreakdown).toEqual({});
    });

    it('should handle single card type', () => {
      const singleTypeCards: DeckCard[] = [
        { id: '1', type: 'power', cardId: 'pow1', quantity: 3 },
        { id: '2', type: 'power', cardId: 'pow2', quantity: 2 }
      ];
      
      const stats = DeckUtils.getDeckStatistics(singleTypeCards);
      
      expect(stats.totalCards).toBe(5);
      expect(stats.cardCount).toBe(5);
      expect(stats.characterCount).toBe(0);
      expect(stats.missionCount).toBe(0);
      expect(stats.locationCount).toBe(0);
      expect(stats.otherCount).toBe(5);
      expect(stats.uniqueTypes).toEqual(['power']);
      expect(stats.typeBreakdown).toEqual({ power: 5 });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle cards with missing properties gracefully', () => {
      const cardsWithMissingProps = [
        { id: '1', type: 'power', cardId: 'pow1', quantity: 3 },
        { id: '2', type: 'special' } as any, // missing cardId and quantity
        { id: '3', type: 'power', cardId: 'pow2', quantity: 2 }
      ];
      
      const count = DeckUtils.calculateCardCount(cardsWithMissingProps);
      expect(count).toBe(5); // 3 + 2, missing props handled gracefully
    });

    it('should handle very large card arrays', () => {
      const largeCardArray: DeckCard[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `card_${i}`,
        type: 'power' as const,
        cardId: `pow_${i}`,
        quantity: 1
      }));
      
      const count = DeckUtils.calculateCardCount(largeCardArray);
      expect(count).toBe(1000);
    });

    it('should handle cards with very large quantities', () => {
      const cardsWithLargeQuantities: DeckCard[] = [
        { id: '1', type: 'power', cardId: 'pow1', quantity: 999999 },
        { id: '2', type: 'special', cardId: 'spec1', quantity: 1 }
      ];
      
      const count = DeckUtils.calculateCardCount(cardsWithLargeQuantities);
      expect(count).toBe(1000000);
    });

    it('should handle valid card types', () => {
      const cardsWithValidTypes: DeckCard[] = [
        { id: '1', type: 'power', cardId: 'pow1', quantity: 1 },
        { id: '2', type: 'special', cardId: 'spec1', quantity: 2 },
        { id: '3', type: 'event', cardId: 'evt1', quantity: 1 }
      ];
      
      const types = DeckUtils.getUniqueCardTypes(cardsWithValidTypes);
      expect(types).toEqual(['power', 'special', 'event']);
    });
  });
});

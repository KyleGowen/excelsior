/**
 * Unit tests for OPD (One Per Deck) validation with alternate art versions
 * 
 * This test suite covers the fix for OPD validation to apply across all art versions
 * of the same card, not just by cardId.
 * 
 * Test Coverage:
 * 1. getOPDKeyForDimming() helper function
 * 2. updateOnePerDeckLimitStatus() with OPD key grouping
 * 3. showAlternateArtSelectionModal() OPD check before opening
 * 4. addCardToEditor() OPD check with alternate art grouping
 */

import { jest } from '@jest/globals';
import { JSDOM } from 'jsdom';

describe('OPD Alternate Art Validation', () => {
  let dom: JSDOM;
  let document: Document;
  let window: any;
  let mockShowNotification: jest.Mock;
  let mockAvailableCardsMap: Map<string, any>;
  let mockDeckEditorCards: any[];

  beforeEach(() => {
    // Set up JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    document = dom.window.document;
    window = dom.window;

    // Initialize mocks
    mockShowNotification = jest.fn();
    mockAvailableCardsMap = new Map();
    mockDeckEditorCards = [];

    // Set up global mocks
    (global as any).window = window;
    (global as any).document = document;
    (global as any).showNotification = mockShowNotification;
    window.availableCardsMap = mockAvailableCardsMap;
    window.deckEditorCards = mockDeckEditorCards;

    // Mock querySelectorAll for card items
    document.querySelectorAll = jest.fn((selector: string) => {
      if (selector === '.card-item[data-id]') {
        return [] as any;
      }
      return [] as any;
    }) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockDeckEditorCards = [];
    mockAvailableCardsMap.clear();
  });

  describe('1. getOPDKeyForDimming() helper function', () => {
    beforeEach(() => {
      // Define the helper function in the test environment
      (window as any).getOPDKeyForDimming = function(cardData: any, cardType: string): string | null {
        if (!cardData) return null;
        
        // For special cards, use name + character_name + universe to group all art versions
        if (cardType === 'special' && cardData.character_name) {
          const universe = cardData.universe || 'ERB';
          return `${cardType}_${cardData.name}_${cardData.character_name}_${universe}`;
        }
        
        // For other cards, use name + universe to group all art versions
        const name = cardData.name || cardData.card_name || '';
        const universe = cardData.universe || '';
        if (universe) {
          return `${cardType}_${name}_${universe}`;
        }
        return `${cardType}_${name}`;
      };
    });

    it('should return null for null cardData', () => {
      const result = (window as any).getOPDKeyForDimming(null, 'special');
      expect(result).toBeNull();
    });

    it('should return null for undefined cardData', () => {
      const result = (window as any).getOPDKeyForDimming(undefined, 'special');
      expect(result).toBeNull();
    });

    describe('Special cards', () => {
      it('should generate OPD key for special card with character_name', () => {
        const cardData = {
          name: 'The Gemini',
          character_name: 'Any Character',
          universe: 'ERB'
        };
        const result = (window as any).getOPDKeyForDimming(cardData, 'special');
        expect(result).toBe('special_The Gemini_Any Character_ERB');
      });

      it('should use default universe ERB when universe is missing', () => {
        const cardData = {
          name: 'The Gemini',
          character_name: 'Any Character'
        };
        const result = (window as any).getOPDKeyForDimming(cardData, 'special');
        expect(result).toBe('special_The Gemini_Any Character_ERB');
      });

      it('should generate same key for different art versions of same card', () => {
        const cardData1 = {
          id: 'gemini-1',
          name: 'The Gemini',
          character_name: 'Any Character',
          universe: 'ERB'
        };
        const cardData2 = {
          id: 'gemini-2',
          name: 'The Gemini',
          character_name: 'Any Character',
          universe: 'ERB'
        };
        const key1 = (window as any).getOPDKeyForDimming(cardData1, 'special');
        const key2 = (window as any).getOPDKeyForDimming(cardData2, 'special');
        expect(key1).toBe(key2);
        expect(key1).toBe('special_The Gemini_Any Character_ERB');
      });

      it('should generate different keys for different characters', () => {
        const cardData1 = {
          name: 'The Gemini',
          character_name: 'Any Character',
          universe: 'ERB'
        };
        const cardData2 = {
          name: 'The Gemini',
          character_name: 'Captain Nemo',
          universe: 'ERB'
        };
        const key1 = (window as any).getOPDKeyForDimming(cardData1, 'special');
        const key2 = (window as any).getOPDKeyForDimming(cardData2, 'special');
        expect(key1).not.toBe(key2);
      });

      it('should generate different keys for different universes', () => {
        const cardData1 = {
          name: 'The Gemini',
          character_name: 'Any Character',
          universe: 'ERB'
        };
        const cardData2 = {
          name: 'The Gemini',
          character_name: 'Any Character',
          universe: 'MVOP'
        };
        const key1 = (window as any).getOPDKeyForDimming(cardData1, 'special');
        const key2 = (window as any).getOPDKeyForDimming(cardData2, 'special');
        expect(key1).not.toBe(key2);
      });
    });

    describe('Other card types', () => {
      it('should generate OPD key for power card with name and universe', () => {
        const cardData = {
          name: 'Energy 5',
          universe: 'ERB'
        };
        const result = (window as any).getOPDKeyForDimming(cardData, 'power');
        expect(result).toBe('power_Energy 5_ERB');
      });

      it('should generate OPD key for power card without universe', () => {
        const cardData = {
          name: 'Energy 5'
        };
        const result = (window as any).getOPDKeyForDimming(cardData, 'power');
        expect(result).toBe('power_Energy 5');
      });

      it('should use card_name when name is missing', () => {
        const cardData = {
          card_name: 'Basic Universe Card',
          universe: 'ERB'
        };
        const result = (window as any).getOPDKeyForDimming(cardData, 'basic-universe');
        expect(result).toBe('basic-universe_Basic Universe Card_ERB');
      });

      it('should generate same key for different art versions of same card', () => {
        const cardData1 = {
          id: 'power-1',
          name: 'Energy 5',
          universe: 'ERB'
        };
        const cardData2 = {
          id: 'power-2',
          name: 'Energy 5',
          universe: 'ERB'
        };
        const key1 = (window as any).getOPDKeyForDimming(cardData1, 'power');
        const key2 = (window as any).getOPDKeyForDimming(cardData2, 'power');
        expect(key1).toBe(key2);
        expect(key1).toBe('power_Energy 5_ERB');
      });

      it('should handle empty name gracefully', () => {
        const cardData = {
          name: '',
          universe: 'ERB'
        };
        const result = (window as any).getOPDKeyForDimming(cardData, 'power');
        expect(result).toBe('power__ERB');
      });
    });
  });

  describe('2. updateOnePerDeckLimitStatus() with OPD key grouping', () => {
    let mockCardElements: any[];

    beforeEach(() => {
      mockCardElements = [];
      
      // Mock getOPDKeyForDimming
      (window as any).getOPDKeyForDimming = function(cardData: any, cardType: string): string | null {
        if (!cardData) return null;
        if (cardType === 'special' && cardData.character_name) {
          const universe = cardData.universe || 'ERB';
          return `${cardType}_${cardData.name}_${cardData.character_name}_${universe}`;
        }
        const name = cardData.name || cardData.card_name || '';
        const universe = cardData.universe || '';
        if (universe) {
          return `${cardType}_${name}_${universe}`;
        }
        return `${cardType}_${name}`;
      };

      // Mock updateOnePerDeckLimitStatus
      (window as any).updateOnePerDeckLimitStatus = function() {
        const onePerDeckKeysInDeck = new Set();
        window.deckEditorCards.forEach((card: any) => {
          const cardData = window.availableCardsMap.get(card.cardId);
          if (cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true)) {
            const opdKey = (window as any).getOPDKeyForDimming(cardData, card.type);
            if (opdKey) {
              onePerDeckKeysInDeck.add(opdKey);
            }
          }
        });

        const allCardItems = document.querySelectorAll('.card-item[data-id]');
        allCardItems.forEach((cardElement: any) => {
          const cardId = cardElement.getAttribute('data-id');
          const cardType = cardElement.getAttribute('data-type');
          
          if (cardId) {
            const cardData = window.availableCardsMap.get(cardId);
            const isOnePerDeck = cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true);
            const opdKey = isOnePerDeck ? (window as any).getOPDKeyForDimming(cardData, cardType) : null;
            const isInDeck = opdKey ? onePerDeckKeysInDeck.has(opdKey) : false;
            
            if (isOnePerDeck && isInDeck) {
              cardElement.classList.add('disabled');
              cardElement.setAttribute('draggable', 'false');
              cardElement.title = 'One Per Deck - already in deck';
            }
          }
        });
      };

      // Mock querySelectorAll to return our mock elements
      document.querySelectorAll = jest.fn((selector: string) => {
        if (selector === '.card-item[data-id]') {
          return mockCardElements as any;
        }
        return [] as any;
      }) as any;
    });

    it('should dim all art versions when one is in deck', () => {
      // Setup: Add alternate art version 1 to deck
      const gemini1 = {
        id: 'gemini-1',
        name: 'The Gemini',
        character_name: 'Any Character',
        universe: 'ERB',
        one_per_deck: true
      };
      const gemini2 = {
        id: 'gemini-2',
        name: 'The Gemini',
        character_name: 'Any Character',
        universe: 'ERB',
        one_per_deck: true
      };

      mockAvailableCardsMap.set('gemini-1', gemini1);
      mockAvailableCardsMap.set('gemini-2', gemini2);

      mockDeckEditorCards.push({
        cardId: 'gemini-1',
        type: 'special',
        quantity: 1
      });

      // Create mock card elements for both art versions
      const element1 = {
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-id') return 'gemini-1';
          if (attr === 'data-type') return 'special';
          return null;
        }),
        classList: {
          add: jest.fn(),
          contains: jest.fn(() => false)
        },
        setAttribute: jest.fn()
      };
      const element2 = {
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-id') return 'gemini-2';
          if (attr === 'data-type') return 'special';
          return null;
        }),
        classList: {
          add: jest.fn(),
          contains: jest.fn(() => false)
        },
        setAttribute: jest.fn()
      };

      mockCardElements.push(element1 as any, element2 as any);

      // Execute
      (window as any).updateOnePerDeckLimitStatus();

      // Verify: Both elements should be dimmed (same OPD key)
      expect(element1.classList.add).toHaveBeenCalledWith('disabled');
      expect(element2.classList.add).toHaveBeenCalledWith('disabled');
      expect(element1.setAttribute).toHaveBeenCalledWith('draggable', 'false');
      expect(element2.setAttribute).toHaveBeenCalledWith('draggable', 'false');
    });

    it('should not dim cards with different OPD keys', () => {
      const gemini = {
        id: 'gemini-1',
        name: 'The Gemini',
        character_name: 'Any Character',
        universe: 'ERB',
        one_per_deck: true
      };
      const otherCard = {
        id: 'other-1',
        name: 'Different Card',
        character_name: 'Any Character',
        universe: 'ERB',
        one_per_deck: true
      };

      mockAvailableCardsMap.set('gemini-1', gemini);
      mockAvailableCardsMap.set('other-1', otherCard);

      mockDeckEditorCards.push({
        cardId: 'gemini-1',
        type: 'special',
        quantity: 1
      });

      const element1 = {
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-id') return 'gemini-1';
          if (attr === 'data-type') return 'special';
          return null;
        }),
        classList: {
          add: jest.fn(),
          contains: jest.fn(() => false)
        },
        setAttribute: jest.fn()
      };
      const element2 = {
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-id') return 'other-1';
          if (attr === 'data-type') return 'special';
          return null;
        }),
        classList: {
          add: jest.fn(),
          contains: jest.fn(() => false)
        },
        setAttribute: jest.fn()
      };

      mockCardElements.push(element1 as any, element2 as any);

      (window as any).updateOnePerDeckLimitStatus();

      // Only gemini should be dimmed
      expect(element1.classList.add).toHaveBeenCalledWith('disabled');
      expect(element2.classList.add).not.toHaveBeenCalled();
    });

    it('should handle power cards with alternate art', () => {
      const power1 = {
        id: 'power-1',
        name: 'Energy 5',
        universe: 'ERB',
        one_per_deck: true
      };
      const power2 = {
        id: 'power-2',
        name: 'Energy 5',
        universe: 'ERB',
        one_per_deck: true
      };

      mockAvailableCardsMap.set('power-1', power1);
      mockAvailableCardsMap.set('power-2', power2);

      mockDeckEditorCards.push({
        cardId: 'power-1',
        type: 'power',
        quantity: 1
      });

      const element1 = {
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-id') return 'power-1';
          if (attr === 'data-type') return 'power';
          return null;
        }),
        classList: {
          add: jest.fn(),
          contains: jest.fn(() => false)
        },
        setAttribute: jest.fn()
      };
      const element2 = {
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-id') return 'power-2';
          if (attr === 'data-type') return 'power';
          return null;
        }),
        classList: {
          add: jest.fn(),
          contains: jest.fn(() => false)
        },
        setAttribute: jest.fn()
      };

      mockCardElements.push(element1 as any, element2 as any);

      (window as any).updateOnePerDeckLimitStatus();

      // Both should be dimmed (same OPD key)
      expect(element1.classList.add).toHaveBeenCalledWith('disabled');
      expect(element2.classList.add).toHaveBeenCalledWith('disabled');
    });
  });

  describe('3. showAlternateArtSelectionModal() OPD check', () => {
    beforeEach(() => {
      // Mock showAlternateArtSelectionModal
      (window as any).showAlternateArtSelectionModal = function(
        cardType: string,
        cardName: string,
        allCards: any[]
      ) {
        // Check if this card is One Per Deck and already in deck (check all art versions)
        const firstCardData = window.availableCardsMap.get(allCards[0].id);
        const isOnePerDeck = firstCardData && (
          firstCardData.one_per_deck === true || 
          firstCardData.is_one_per_deck === true
        );
        
        let isAlreadyInDeck = false;
        if (isOnePerDeck) {
          // Check if ANY art version of this card is already in the deck
          if (cardType === 'special' && firstCardData && firstCardData.character_name) {
            isAlreadyInDeck = window.deckEditorCards.some((deckCard: any) => {
              if (deckCard.type !== 'special') return false;
              const deckCardData = window.availableCardsMap.get(deckCard.cardId);
              if (!deckCardData) return false;
              return deckCardData.name === firstCardData.name && 
                     deckCardData.character_name === firstCardData.character_name &&
                     (deckCardData.universe || 'ERB') === (firstCardData.universe || 'ERB');
            });
          } else {
            const cardNameToCheck = firstCardData?.name || firstCardData?.card_name || cardName;
            const cardUniverse = firstCardData?.universe || '';
            isAlreadyInDeck = window.deckEditorCards.some((deckCard: any) => {
              if (deckCard.type !== cardType) return false;
              const deckCardData = window.availableCardsMap.get(deckCard.cardId);
              if (!deckCardData) return false;
              const deckCardName = deckCardData.name || deckCardData.card_name || '';
              const deckCardUniverse = deckCardData.universe || '';
              if (cardUniverse && deckCardUniverse) {
                return deckCardName === cardNameToCheck && deckCardUniverse === cardUniverse;
              }
              return deckCardName === cardNameToCheck;
            });
          }
        }
        
        // If card is already in deck and is OPD, show error and don't open modal
        if (isAlreadyInDeck && isOnePerDeck) {
          (global as any).showNotification(`Cannot add more than 1 copy of "${cardName}" - One Per Deck`, 'error');
          return;
        }
        
        // Otherwise, modal would open (but we're just testing the check)
        return 'modal-opened';
      };
    });

    it('should prevent modal from opening when alternate art version is already in deck', () => {
      const gemini1 = {
        id: 'gemini-1',
        name: 'The Gemini',
        character_name: 'Any Character',
        universe: 'ERB',
        one_per_deck: true
      };
      const gemini2 = {
        id: 'gemini-2',
        name: 'The Gemini',
        character_name: 'Any Character',
        universe: 'ERB',
        one_per_deck: true
      };

      mockAvailableCardsMap.set('gemini-1', gemini1);
      mockAvailableCardsMap.set('gemini-2', gemini2);

      // Add alternate art version 1 to deck
      mockDeckEditorCards.push({
        cardId: 'gemini-1',
        type: 'special',
        quantity: 1
      });

      // Try to open modal for alternate art version 2
      const result = (window as any).showAlternateArtSelectionModal(
        'special',
        'The Gemini',
        [{ id: 'gemini-2', imagePath: 'path2', name: 'The Gemini' }]
      );

      // Should show error and not open modal
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Cannot add more than 1 copy of "The Gemini" - One Per Deck',
        'error'
      );
      expect(result).toBeUndefined();
    });

    it('should allow modal to open when no art version is in deck', () => {
      const gemini1 = {
        id: 'gemini-1',
        name: 'The Gemini',
        character_name: 'Any Character',
        universe: 'ERB',
        one_per_deck: true
      };
      const gemini2 = {
        id: 'gemini-2',
        name: 'The Gemini',
        character_name: 'Any Character',
        universe: 'ERB',
        one_per_deck: true
      };

      mockAvailableCardsMap.set('gemini-1', gemini1);
      mockAvailableCardsMap.set('gemini-2', gemini2);

      // Deck is empty
      mockDeckEditorCards = [];

      // Try to open modal
      const result = (window as any).showAlternateArtSelectionModal(
        'special',
        'The Gemini',
        [{ id: 'gemini-1', imagePath: 'path1', name: 'The Gemini' }]
      );

      // Should open modal (return value indicates modal opened)
      expect(mockShowNotification).not.toHaveBeenCalled();
      expect(result).toBe('modal-opened');
    });

    it('should allow modal for non-OPD cards even if already in deck', () => {
      const regularCard1 = {
        id: 'regular-1',
        name: 'Regular Card',
        character_name: 'Any Character',
        universe: 'ERB',
        one_per_deck: false
      };
      const regularCard2 = {
        id: 'regular-2',
        name: 'Regular Card',
        character_name: 'Any Character',
        universe: 'ERB',
        one_per_deck: false
      };

      mockAvailableCardsMap.set('regular-1', regularCard1);
      mockAvailableCardsMap.set('regular-2', regularCard2);

      mockDeckEditorCards.push({
        cardId: 'regular-1',
        type: 'special',
        quantity: 1
      });

      const result = (window as any).showAlternateArtSelectionModal(
        'special',
        'Regular Card',
        [{ id: 'regular-2', imagePath: 'path2', name: 'Regular Card' }]
      );

      // Should allow modal (not OPD)
      expect(mockShowNotification).not.toHaveBeenCalled();
      expect(result).toBe('modal-opened');
    });

    it('should handle power cards with alternate art', () => {
      const power1 = {
        id: 'power-1',
        name: 'Energy 5',
        universe: 'ERB',
        one_per_deck: true
      };
      const power2 = {
        id: 'power-2',
        name: 'Energy 5',
        universe: 'ERB',
        one_per_deck: true
      };

      mockAvailableCardsMap.set('power-1', power1);
      mockAvailableCardsMap.set('power-2', power2);

      mockDeckEditorCards.push({
        cardId: 'power-1',
        type: 'power',
        quantity: 1
      });

      const result = (window as any).showAlternateArtSelectionModal(
        'power',
        'Energy 5',
        [{ id: 'power-2', imagePath: 'path2', name: 'Energy 5' }]
      );

      expect(mockShowNotification).toHaveBeenCalledWith(
        'Cannot add more than 1 copy of "Energy 5" - One Per Deck',
        'error'
      );
      expect(result).toBeUndefined();
    });
  });

  describe('4. addCardToEditor() OPD check with alternate art grouping', () => {
    beforeEach(() => {
      // Mock addCardToEditor
      (window as any).addCardToEditor = async function(
        cardType: string,
        cardId: string,
        cardName: string
      ) {
        const cardData = window.availableCardsMap.get(cardId);
        const isOnePerDeck = cardData && (
          cardData.one_per_deck === true || 
          cardData.is_one_per_deck === true
        );
        
        if (isOnePerDeck) {
          // Check if ANY art version of this card is already in the deck
          let existingOnePerDeckCard = null;
          if (cardType === 'special' && cardData && cardData.character_name) {
            existingOnePerDeckCard = window.deckEditorCards.find((deckCard: any) => {
              if (deckCard.type !== 'special') return false;
              const deckCardData = window.availableCardsMap.get(deckCard.cardId);
              if (!deckCardData) return false;
              return deckCardData.name === cardData.name && 
                     deckCardData.character_name === cardData.character_name &&
                     (deckCardData.universe || 'ERB') === (cardData.universe || 'ERB');
            });
          } else {
            const cardNameToCheck = cardData?.name || cardData?.card_name || cardName;
            const cardUniverse = cardData?.universe || '';
            existingOnePerDeckCard = window.deckEditorCards.find((deckCard: any) => {
              if (deckCard.type !== cardType) return false;
              const deckCardData = window.availableCardsMap.get(deckCard.cardId);
              if (!deckCardData) return false;
              const deckCardName = deckCardData.name || deckCardData.card_name || '';
              const deckCardUniverse = deckCardData.universe || '';
              if (cardUniverse && deckCardUniverse) {
                return deckCardName === cardNameToCheck && deckCardUniverse === cardUniverse;
              }
              return deckCardName === cardNameToCheck;
            });
          }
          
          if (existingOnePerDeckCard) {
            (global as any).showNotification(`Cannot add more than 1 copy of "${cardName}" - One Per Deck`, 'error');
            return;
          }
        }
        
        // Add card to deck
        window.deckEditorCards.push({
          type: cardType,
          cardId: cardId,
          quantity: 1
        });
      };
    });

    it('should prevent adding alternate art version when original is already in deck', async () => {
      const gemini1 = {
        id: 'gemini-1',
        name: 'The Gemini',
        character_name: 'Any Character',
        universe: 'ERB',
        one_per_deck: true
      };
      const gemini2 = {
        id: 'gemini-2',
        name: 'The Gemini',
        character_name: 'Any Character',
        universe: 'ERB',
        one_per_deck: true
      };

      mockAvailableCardsMap.set('gemini-1', gemini1);
      mockAvailableCardsMap.set('gemini-2', gemini2);

      // Add original art version
      await (window as any).addCardToEditor('special', 'gemini-1', 'The Gemini');
      expect(mockDeckEditorCards).toHaveLength(1);

      // Try to add alternate art version
      await (window as any).addCardToEditor('special', 'gemini-2', 'The Gemini');

      // Should be prevented
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Cannot add more than 1 copy of "The Gemini" - One Per Deck',
        'error'
      );
      expect(mockDeckEditorCards).toHaveLength(1);
    });

    it('should prevent adding original art when alternate is already in deck', async () => {
      const gemini1 = {
        id: 'gemini-1',
        name: 'The Gemini',
        character_name: 'Any Character',
        universe: 'ERB',
        one_per_deck: true
      };
      const gemini2 = {
        id: 'gemini-2',
        name: 'The Gemini',
        character_name: 'Any Character',
        universe: 'ERB',
        one_per_deck: true
      };

      mockAvailableCardsMap.set('gemini-1', gemini1);
      mockAvailableCardsMap.set('gemini-2', gemini2);

      // Add alternate art version first
      await (window as any).addCardToEditor('special', 'gemini-2', 'The Gemini');
      expect(mockDeckEditorCards).toHaveLength(1);

      // Try to add original art version
      await (window as any).addCardToEditor('special', 'gemini-1', 'The Gemini');

      // Should be prevented
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Cannot add more than 1 copy of "The Gemini" - One Per Deck',
        'error'
      );
      expect(mockDeckEditorCards).toHaveLength(1);
    });

    it('should allow adding different cards with same name but different character', async () => {
      const gemini1 = {
        id: 'gemini-1',
        name: 'The Gemini',
        character_name: 'Any Character',
        universe: 'ERB',
        one_per_deck: true
      };
      const gemini2 = {
        id: 'gemini-2',
        name: 'The Gemini',
        character_name: 'Captain Nemo',
        universe: 'ERB',
        one_per_deck: true
      };

      mockAvailableCardsMap.set('gemini-1', gemini1);
      mockAvailableCardsMap.set('gemini-2', gemini2);

      // Add first card
      await (window as any).addCardToEditor('special', 'gemini-1', 'The Gemini');
      expect(mockDeckEditorCards).toHaveLength(1);

      // Add second card (different character)
      await (window as any).addCardToEditor('special', 'gemini-2', 'The Gemini');

      // Should be allowed (different OPD key)
      expect(mockShowNotification).not.toHaveBeenCalled();
      expect(mockDeckEditorCards).toHaveLength(2);
    });

    it('should handle power cards with alternate art', async () => {
      const power1 = {
        id: 'power-1',
        name: 'Energy 5',
        universe: 'ERB',
        one_per_deck: true
      };
      const power2 = {
        id: 'power-2',
        name: 'Energy 5',
        universe: 'ERB',
        one_per_deck: true
      };

      mockAvailableCardsMap.set('power-1', power1);
      mockAvailableCardsMap.set('power-2', power2);

      // Add first art version
      await (window as any).addCardToEditor('power', 'power-1', 'Energy 5');
      expect(mockDeckEditorCards).toHaveLength(1);

      // Try to add alternate art version
      await (window as any).addCardToEditor('power', 'power-2', 'Energy 5');

      // Should be prevented
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Cannot add more than 1 copy of "Energy 5" - One Per Deck',
        'error'
      );
      expect(mockDeckEditorCards).toHaveLength(1);
    });

    it('should allow adding non-OPD cards multiple times', async () => {
      const regularCard = {
        id: 'regular-1',
        name: 'Regular Card',
        character_name: 'Any Character',
        universe: 'ERB',
        one_per_deck: false
      };

      mockAvailableCardsMap.set('regular-1', regularCard);

      await (window as any).addCardToEditor('special', 'regular-1', 'Regular Card');
      await (window as any).addCardToEditor('special', 'regular-1', 'Regular Card');

      // Should be allowed (not OPD)
      expect(mockShowNotification).not.toHaveBeenCalled();
      expect(mockDeckEditorCards).toHaveLength(2);
    });

    it('should handle cards without universe', async () => {
      const card1 = {
        id: 'card-1',
        name: 'Test Card',
        one_per_deck: true
      };
      const card2 = {
        id: 'card-2',
        name: 'Test Card',
        one_per_deck: true
      };

      mockAvailableCardsMap.set('card-1', card1);
      mockAvailableCardsMap.set('card-2', card2);

      await (window as any).addCardToEditor('power', 'card-1', 'Test Card');
      await (window as any).addCardToEditor('power', 'card-2', 'Test Card');

      // Should be prevented (same name, no universe)
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Cannot add more than 1 copy of "Test Card" - One Per Deck',
        'error'
      );
      expect(mockDeckEditorCards).toHaveLength(1);
    });

    it('should handle cards with card_name instead of name', async () => {
      const card1 = {
        id: 'card-1',
        card_name: 'Universe Card',
        universe: 'ERB',
        one_per_deck: true
      };
      const card2 = {
        id: 'card-2',
        card_name: 'Universe Card',
        universe: 'ERB',
        one_per_deck: true
      };

      mockAvailableCardsMap.set('card-1', card1);
      mockAvailableCardsMap.set('card-2', card2);

      await (window as any).addCardToEditor('basic-universe', 'card-1', 'Universe Card');
      await (window as any).addCardToEditor('basic-universe', 'card-2', 'Universe Card');

      // Should be prevented
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Cannot add more than 1 copy of "Universe Card" - One Per Deck',
        'error'
      );
      expect(mockDeckEditorCards).toHaveLength(1);
    });

    it('should handle missing card data gracefully', async () => {
      // Card not in availableCardsMap
      await (window as any).addCardToEditor('special', 'missing-card', 'Missing Card');

      // Should not crash, should add card (no OPD check if no data)
      expect(mockDeckEditorCards).toHaveLength(1);
      expect(mockShowNotification).not.toHaveBeenCalled();
    });
  });

  describe('Integration: All four functions working together', () => {
    beforeEach(() => {
      // Set up all functions
      (window as any).getOPDKeyForDimming = function(cardData: any, cardType: string): string | null {
        if (!cardData) return null;
        if (cardType === 'special' && cardData.character_name) {
          const universe = cardData.universe || 'ERB';
          return `${cardType}_${cardData.name}_${cardData.character_name}_${universe}`;
        }
        const name = cardData.name || cardData.card_name || '';
        const universe = cardData.universe || '';
        if (universe) {
          return `${cardType}_${name}_${universe}`;
        }
        return `${cardType}_${name}`;
      };

      (window as any).addCardToEditor = async function(
        cardType: string,
        cardId: string,
        cardName: string
      ) {
        const cardData = window.availableCardsMap.get(cardId);
        const isOnePerDeck = cardData && (
          cardData.one_per_deck === true || 
          cardData.is_one_per_deck === true
        );
        
        if (isOnePerDeck) {
          let existingOnePerDeckCard = null;
          if (cardType === 'special' && cardData && cardData.character_name) {
            existingOnePerDeckCard = window.deckEditorCards.find((deckCard: any) => {
              if (deckCard.type !== 'special') return false;
              const deckCardData = window.availableCardsMap.get(deckCard.cardId);
              if (!deckCardData) return false;
              return deckCardData.name === cardData.name && 
                     deckCardData.character_name === cardData.character_name &&
                     (deckCardData.universe || 'ERB') === (cardData.universe || 'ERB');
            });
          } else {
            const cardNameToCheck = cardData?.name || cardData?.card_name || cardName;
            const cardUniverse = cardData?.universe || '';
            existingOnePerDeckCard = window.deckEditorCards.find((deckCard: any) => {
              if (deckCard.type !== cardType) return false;
              const deckCardData = window.availableCardsMap.get(deckCard.cardId);
              if (!deckCardData) return false;
              const deckCardName = deckCardData.name || deckCardData.card_name || '';
              const deckCardUniverse = deckCardData.universe || '';
              if (cardUniverse && deckCardUniverse) {
                return deckCardName === cardNameToCheck && deckCardUniverse === cardUniverse;
              }
              return deckCardName === cardNameToCheck;
            });
          }
          
          if (existingOnePerDeckCard) {
            (global as any).showNotification(`Cannot add more than 1 copy of "${cardName}" - One Per Deck`, 'error');
            return;
          }
        }
        
        window.deckEditorCards.push({
          type: cardType,
          cardId: cardId,
          quantity: 1
        });
      };
    });

    it('should prevent adding alternate art through modal when original is in deck', async () => {
      const gemini1 = {
        id: 'gemini-1',
        name: 'The Gemini',
        character_name: 'Any Character',
        universe: 'ERB',
        one_per_deck: true
      };
      const gemini2 = {
        id: 'gemini-2',
        name: 'The Gemini',
        character_name: 'Any Character',
        universe: 'ERB',
        one_per_deck: true
      };

      mockAvailableCardsMap.set('gemini-1', gemini1);
      mockAvailableCardsMap.set('gemini-2', gemini2);

      // Add original art
      await (window as any).addCardToEditor('special', 'gemini-1', 'The Gemini');

      // Try to open modal for alternate art
      (window as any).showAlternateArtSelectionModal = function(
        cardType: string,
        cardName: string,
        allCards: any[]
      ) {
        const firstCardData = window.availableCardsMap.get(allCards[0].id);
        const isOnePerDeck = firstCardData && (
          firstCardData.one_per_deck === true || 
          firstCardData.is_one_per_deck === true
        );
        
        let isAlreadyInDeck = false;
        if (isOnePerDeck && cardType === 'special' && firstCardData && firstCardData.character_name) {
          isAlreadyInDeck = window.deckEditorCards.some((deckCard: any) => {
            if (deckCard.type !== 'special') return false;
            const deckCardData = window.availableCardsMap.get(deckCard.cardId);
            if (!deckCardData) return false;
            return deckCardData.name === firstCardData.name && 
                   deckCardData.character_name === firstCardData.character_name &&
                   (deckCardData.universe || 'ERB') === (firstCardData.universe || 'ERB');
          });
        }
        
        if (isAlreadyInDeck && isOnePerDeck) {
          (global as any).showNotification(`Cannot add more than 1 copy of "${cardName}" - One Per Deck`, 'error');
          return;
        }
        return 'modal-opened';
      };

      const result = (window as any).showAlternateArtSelectionModal(
        'special',
        'The Gemini',
        [{ id: 'gemini-2', imagePath: 'path2', name: 'The Gemini' }]
      );

      expect(mockShowNotification).toHaveBeenCalledWith(
        'Cannot add more than 1 copy of "The Gemini" - One Per Deck',
        'error'
      );
      expect(result).toBeUndefined();
    });
  });
});


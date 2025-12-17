/**
 * @jest-environment jsdom
 * 
 * Unit tests for alternate art persistence in deck editor
 * Tests cover:
 * - Detecting alternate art cards when loading decks
 * - Finding base cards for alternate arts
 * - Consolidating multiple entries with different alternate arts
 * - Saving cards with alternate art selections
 * - Edge cases and error handling
 */

describe('Deck Editor - Alternate Art Persistence', () => {
  let mockAvailableCardsMap: Map<string, any>;
  let mockDeckEditorCards: any[];
  let processAlternateArtDetection: any;
  let prepareCardsForSave: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Initialize mock available cards map
    mockAvailableCardsMap = new Map();
    
    // Mock console methods
    global.console.log = jest.fn();
    global.console.warn = jest.fn();
    global.console.error = jest.fn();
  });

  describe('Alternate Art Detection During Load', () => {
    beforeEach(() => {
      // Setup mock available cards map with base and alternate art cards
      mockAvailableCardsMap.set('char_base_wicked_witch', {
        id: 'char_base_wicked_witch',
        name: 'Wicked Witch',
        set: 'ERB',
        cardType: 'character',
        type: 'character',
        image_path: '/images/cards/characters/wicked_witch.jpg',
        image: '/images/cards/characters/wicked_witch.jpg'
      });

      mockAvailableCardsMap.set('char_alt1_wicked_witch', {
        id: 'char_alt1_wicked_witch',
        name: 'Wicked Witch',
        set: 'ERB',
        cardType: 'character',
        type: 'character',
        image_path: '/images/cards/characters/alternate/wicked_witch_alt1.jpg',
        image: '/images/cards/characters/alternate/wicked_witch_alt1.jpg'
      });

      mockAvailableCardsMap.set('char_alt2_wicked_witch', {
        id: 'char_alt2_wicked_witch',
        name: 'Wicked Witch',
        set: 'ERB',
        cardType: 'character',
        type: 'character',
        image_path: '/images/cards/characters/alternate/wicked_witch_alt2.jpg',
        image: '/images/cards/characters/alternate/wicked_witch_alt2.jpg'
      });

      // Mock the alternate art detection logic
      processAlternateArtDetection = (cards: any[], availableCardsMap: Map<string, any>) => {
        return cards.map(card => {
          const cardData = availableCardsMap.get(card.cardId);
          if (!cardData) {
            console.warn('[DeckEditor] Card not found in availableCardsMap:', card.cardId);
            return card;
          }

          const imagePath = cardData.image_path || cardData.image || '';
          const isAlternateArt = imagePath && imagePath.includes('/alternate/');

          if (isAlternateArt) {
            let baseCardId = null;
            let baseCard = null;

            if (card.type === 'character') {
              const name = (cardData.name || '').trim();
              const set = (cardData.set || 'ERB').trim() || 'ERB';

              availableCardsMap.forEach((candidateCard, candidateId) => {
                const candidateType = candidateCard.cardType || candidateCard.type || '';
                if ((candidateType === 'character' || candidateId.startsWith('char_')) &&
                    (candidateCard.name || '').trim() === name &&
                    (candidateCard.set || 'ERB').trim() === set) {
                  const candidateImagePath = candidateCard.image_path || candidateCard.image || '';
                  if (!candidateImagePath.includes('/alternate/')) {
                    baseCardId = candidateId;
                    baseCard = candidateCard;
                  }
                }
              });
            }

            if (baseCardId && baseCard) {
              return {
                ...card,
                cardId: baseCardId,
                selectedAlternateCardId: card.quantity > 1 ? undefined : card.cardId,
                selectedAlternateCardIds: card.quantity > 1 ? Array(card.quantity).fill(card.cardId) : undefined
              };
            } else {
              return {
                ...card,
                selectedAlternateCardId: card.quantity > 1 ? undefined : card.cardId,
                selectedAlternateCardIds: card.quantity > 1 ? Array(card.quantity).fill(card.cardId) : undefined
              };
            }
          }

          return card;
        });
      };
    });

    it('should detect alternate art card and find base card for character', () => {
      // Arrange
      const loadedCards = [
        {
          cardId: 'char_alt1_wicked_witch',
          type: 'character',
          quantity: 1
        }
      ];

      // Act
      const processed = processAlternateArtDetection(loadedCards, mockAvailableCardsMap);

      // Assert
      expect(processed).toHaveLength(1);
      expect(processed[0].cardId).toBe('char_base_wicked_witch');
      expect(processed[0].selectedAlternateCardId).toBe('char_alt1_wicked_witch');
    });

    it('should preserve base card when cardId is already base card', () => {
      // Arrange
      const loadedCards = [
        {
          cardId: 'char_base_wicked_witch',
          type: 'character',
          quantity: 1
        }
      ];

      // Act
      const processed = processAlternateArtDetection(loadedCards, mockAvailableCardsMap);

      // Assert
      expect(processed).toHaveLength(1);
      expect(processed[0].cardId).toBe('char_base_wicked_witch');
      expect(processed[0].selectedAlternateCardId).toBeUndefined();
    });

    it('should handle alternate art when base card cannot be found', () => {
      // Arrange
      const loadedCards = [
        {
          cardId: 'char_unknown_alt',
          type: 'character',
          quantity: 1
        }
      ];

      // Add card without base card
      mockAvailableCardsMap.set('char_unknown_alt', {
        id: 'char_unknown_alt',
        name: 'Unknown Character',
        set: 'ERB',
        cardType: 'character',
        type: 'character',
        image_path: '/images/cards/characters/alternate/unknown_alt.jpg',
        image: '/images/cards/characters/alternate/unknown_alt.jpg'
      });

      // Act
      const processed = processAlternateArtDetection(loadedCards, mockAvailableCardsMap);

      // Assert
      expect(processed).toHaveLength(1);
      expect(processed[0].cardId).toBe('char_unknown_alt');
      expect(processed[0].selectedAlternateCardId).toBe('char_unknown_alt');
    });

    it('should initialize selectedAlternateCardIds array for quantity > 1', () => {
      // Arrange
      const loadedCards = [
        {
          cardId: 'char_alt1_wicked_witch',
          type: 'character',
          quantity: 3
        }
      ];

      // Act
      const processed = processAlternateArtDetection(loadedCards, mockAvailableCardsMap);

      // Assert
      expect(processed).toHaveLength(1);
      expect(processed[0].cardId).toBe('char_base_wicked_witch');
      expect(processed[0].selectedAlternateCardId).toBeUndefined();
      expect(processed[0].selectedAlternateCardIds).toEqual([
        'char_alt1_wicked_witch',
        'char_alt1_wicked_witch',
        'char_alt1_wicked_witch'
      ]);
    });

    it('should handle card not found in availableCardsMap', () => {
      // Arrange
      const loadedCards = [
        {
          cardId: 'char_nonexistent',
          type: 'character',
          quantity: 1
        }
      ];

      // Act
      const processed = processAlternateArtDetection(loadedCards, mockAvailableCardsMap);

      // Assert
      expect(processed).toHaveLength(1);
      expect(processed[0]).toEqual(loadedCards[0]);
      expect(console.warn).toHaveBeenCalledWith(
        '[DeckEditor] Card not found in availableCardsMap:',
        'char_nonexistent'
      );
    });
  });

  describe('Card Consolidation Logic', () => {
    beforeEach(() => {
      // Mock consolidation logic
      const consolidateCards = (cards: any[]) => {
        const cardGroups = new Map();

        cards.forEach(card => {
          const key = `${card.type}_${card.cardId}`;
          if (!cardGroups.has(key)) {
            cardGroups.set(key, []);
          }
          cardGroups.get(key).push(card);
        });

        const consolidatedCards = new Map();

        cardGroups.forEach((group, key) => {
          if (group.length === 1) {
            const card = group[0];
            const alternateId = card.selectedAlternateCardId || card.cardId;

            if (card.quantity > 1 && !card.selectedAlternateCardIds) {
              card.selectedAlternateCardIds = Array(card.quantity).fill(alternateId);
              card.selectedAlternateCardId = undefined;
            } else if (card.quantity === 1 && !card.selectedAlternateCardId && alternateId !== card.cardId) {
              card.selectedAlternateCardId = alternateId;
            }

            consolidatedCards.set(key, card);
          } else {
            const firstCard = group[0];
            const consolidated = {
              ...firstCard,
              quantity: 0,
              selectedAlternateCardIds: []
            };

            group.forEach((entry: any) => {
              consolidated.quantity += entry.quantity;
              const alternateId = entry.selectedAlternateCardId || entry.cardId;

              for (let i = 0; i < entry.quantity; i++) {
                consolidated.selectedAlternateCardIds.push(alternateId);
              }
            });

            if (consolidated.quantity === 1 && consolidated.selectedAlternateCardIds.length > 0) {
              consolidated.selectedAlternateCardId = consolidated.selectedAlternateCardIds[0];
            } else {
              consolidated.selectedAlternateCardId = undefined;
            }

            consolidatedCards.set(key, consolidated);
          }
        });

        return Array.from(consolidatedCards.values());
      };

      // Expose for tests
      (global as any).consolidateCards = consolidateCards;
    });

    it('should not consolidate single entries', () => {
      // Arrange
      const cards = [
        {
          cardId: 'char_base_wicked_witch',
          type: 'character',
          quantity: 1,
          selectedAlternateCardId: 'char_alt1_wicked_witch'
        }
      ];

      // Act
      const consolidated = (global as any).consolidateCards(cards);

      // Assert
      expect(consolidated).toHaveLength(1);
      expect(consolidated[0].quantity).toBe(1);
      expect(consolidated[0].selectedAlternateCardId).toBe('char_alt1_wicked_witch');
    });

    it('should consolidate multiple entries for same base card', () => {
      // Arrange
      const cards = [
        {
          cardId: 'char_base_wicked_witch',
          type: 'character',
          quantity: 1,
          selectedAlternateCardId: 'char_alt1_wicked_witch'
        },
        {
          cardId: 'char_base_wicked_witch',
          type: 'character',
          quantity: 1,
          selectedAlternateCardId: 'char_alt2_wicked_witch'
        }
      ];

      // Act
      const consolidated = (global as any).consolidateCards(cards);

      // Assert
      expect(consolidated).toHaveLength(1);
      expect(consolidated[0].quantity).toBe(2);
      expect(consolidated[0].selectedAlternateCardId).toBeUndefined();
      expect(consolidated[0].selectedAlternateCardIds).toEqual([
        'char_alt1_wicked_witch',
        'char_alt2_wicked_witch'
      ]);
    });

    it('should initialize selectedAlternateCardIds for quantity > 1', () => {
      // Arrange
      const cards = [
        {
          cardId: 'char_base_wicked_witch',
          type: 'character',
          quantity: 3,
          selectedAlternateCardId: 'char_alt1_wicked_witch'
        }
      ];

      // Act
      const consolidated = (global as any).consolidateCards(cards);

      // Assert
      expect(consolidated).toHaveLength(1);
      expect(consolidated[0].quantity).toBe(3);
      expect(consolidated[0].selectedAlternateCardId).toBeUndefined();
      expect(consolidated[0].selectedAlternateCardIds).toEqual([
        'char_alt1_wicked_witch',
        'char_alt1_wicked_witch',
        'char_alt1_wicked_witch'
      ]);
    });

    it('should preserve selectedAlternateCardId for quantity = 1', () => {
      // Arrange
      const cards = [
        {
          cardId: 'char_base_wicked_witch',
          type: 'character',
          quantity: 1,
          selectedAlternateCardId: 'char_alt1_wicked_witch'
        }
      ];

      // Act
      const consolidated = (global as any).consolidateCards(cards);

      // Assert
      expect(consolidated).toHaveLength(1);
      expect(consolidated[0].quantity).toBe(1);
      expect(consolidated[0].selectedAlternateCardId).toBe('char_alt1_wicked_witch');
      expect(consolidated[0].selectedAlternateCardIds).toBeUndefined();
    });
  });

  describe('Save Function - Alternate Art Handling', () => {
    beforeEach(() => {
      // Mock the save preparation logic
      prepareCardsForSave = (cards: any[]) => {
        const cardsData: any[] = [];

        cards.forEach(card => {
          const hasPerInstanceSelections = card.selectedAlternateCardIds &&
            Array.isArray(card.selectedAlternateCardIds) &&
            card.selectedAlternateCardIds.length > 0 &&
            card.selectedAlternateCardIds.some((id: any) => id !== undefined && id !== null);

          if (hasPerInstanceSelections && card.quantity > 1) {
            for (let i = 0; i < card.quantity; i++) {
              const cardIdForInstance = (card.selectedAlternateCardIds[i] !== undefined && card.selectedAlternateCardIds[i] !== null)
                ? card.selectedAlternateCardIds[i]
                : (card.selectedAlternateCardId || card.cardId);

              const instanceData: any = {
                cardType: card.type,
                cardId: cardIdForInstance,
                quantity: 1
              };
              
              if (card.exclude_from_draw !== undefined) {
                instanceData.exclude_from_draw = card.exclude_from_draw;
              }
              
              cardsData.push(instanceData);
            }
          } else {
            const cardIdToSave = card.selectedAlternateCardId || card.cardId;

            const cardData: any = {
              cardType: card.type,
              cardId: cardIdToSave,
              quantity: card.quantity
            };
            
            if (card.exclude_from_draw !== undefined) {
              cardData.exclude_from_draw = card.exclude_from_draw;
            }
            
            cardsData.push(cardData);
          }
        });

        return cardsData;
      };
    });

    it('should save selectedAlternateCardId when present', () => {
      // Arrange
      const cards = [
        {
          cardId: 'char_base_wicked_witch',
          type: 'character',
          quantity: 1,
          selectedAlternateCardId: 'char_alt1_wicked_witch'
        }
      ];

      // Act
      const saved = prepareCardsForSave(cards);

      // Assert
      expect(saved).toHaveLength(1);
      expect(saved[0].cardId).toBe('char_alt1_wicked_witch');
      expect(saved[0].quantity).toBe(1);
    });

    it('should save base cardId when selectedAlternateCardId is not present', () => {
      // Arrange
      const cards = [
        {
          cardId: 'char_base_wicked_witch',
          type: 'character',
          quantity: 1
        }
      ];

      // Act
      const saved = prepareCardsForSave(cards);

      // Assert
      expect(saved).toHaveLength(1);
      expect(saved[0].cardId).toBe('char_base_wicked_witch');
      expect(saved[0].quantity).toBe(1);
    });

    it('should create separate entries for per-instance alternate selections', () => {
      // Arrange
      const cards = [
        {
          cardId: 'char_base_wicked_witch',
          type: 'character',
          quantity: 3,
          selectedAlternateCardIds: [
            'char_alt1_wicked_witch',
            'char_alt2_wicked_witch',
            'char_alt1_wicked_witch'
          ]
        }
      ];

      // Act
      const saved = prepareCardsForSave(cards);

      // Assert
      expect(saved).toHaveLength(3);
      expect(saved[0].cardId).toBe('char_alt1_wicked_witch');
      expect(saved[0].quantity).toBe(1);
      expect(saved[1].cardId).toBe('char_alt2_wicked_witch');
      expect(saved[1].quantity).toBe(1);
      expect(saved[2].cardId).toBe('char_alt1_wicked_witch');
      expect(saved[2].quantity).toBe(1);
    });

    it('should fallback to selectedAlternateCardId for per-instance selections when array value is null', () => {
      // Arrange
      const cards = [
        {
          cardId: 'char_base_wicked_witch',
          type: 'character',
          quantity: 2,
          selectedAlternateCardId: 'char_alt1_wicked_witch',
          selectedAlternateCardIds: [
            'char_alt1_wicked_witch',
            null
          ]
        }
      ];

      // Act
      const saved = prepareCardsForSave(cards);

      // Assert
      expect(saved).toHaveLength(2);
      expect(saved[0].cardId).toBe('char_alt1_wicked_witch');
      expect(saved[1].cardId).toBe('char_alt1_wicked_witch'); // Falls back to selectedAlternateCardId
    });

    it('should handle cards with exclude_from_draw flag', () => {
      // Arrange
      const cards = [
        {
          cardId: 'char_base_wicked_witch',
          type: 'character',
          quantity: 1,
          selectedAlternateCardId: 'char_alt1_wicked_witch',
          exclude_from_draw: true
        }
      ];

      // Act
      const saved = prepareCardsForSave(cards);

      // Assert
      expect(saved).toHaveLength(1);
      expect(saved[0].exclude_from_draw).toBe(true);
    });

    it('should handle mixed cards with and without alternate art', () => {
      // Arrange
      const cards = [
        {
          cardId: 'char_base_wicked_witch',
          type: 'character',
          quantity: 1,
          selectedAlternateCardId: 'char_alt1_wicked_witch'
        },
        {
          cardId: 'char_base_hercules',
          type: 'character',
          quantity: 1
        }
      ];

      // Act
      const saved = prepareCardsForSave(cards);

      // Assert
      expect(saved).toHaveLength(2);
      expect(saved[0].cardId).toBe('char_alt1_wicked_witch');
      expect(saved[1].cardId).toBe('char_base_hercules');
    });
  });

  describe('Special Card Alternate Art Detection', () => {
    beforeEach(() => {
      mockAvailableCardsMap.set('special_base_fireball', {
        id: 'special_base_fireball',
        name: 'Fireball',
        character_name: 'Wicked Witch',
        universe: 'ERB',
        cardType: 'special',
        type: 'special',
        image_path: '/images/cards/specials/fireball.jpg',
        image: '/images/cards/specials/fireball.jpg'
      });

      mockAvailableCardsMap.set('special_alt1_fireball', {
        id: 'special_alt1_fireball',
        name: 'Fireball',
        character_name: 'Wicked Witch',
        universe: 'ERB',
        cardType: 'special',
        type: 'special',
        image_path: '/images/cards/specials/alternate/fireball_alt1.jpg',
        image: '/images/cards/specials/alternate/fireball_alt1.jpg'
      });

      // Mock special card detection
      (global as any).processSpecialCardAlternateArt = (cards: any[], availableCardsMap: Map<string, any>) => {
        return cards.map(card => {
          const cardData = availableCardsMap.get(card.cardId);
          if (!cardData) return card;

          const imagePath = cardData.image_path || cardData.image || '';
          const isAlternateArt = imagePath && imagePath.includes('/alternate/');

          if (isAlternateArt && card.type === 'special') {
            const name = (cardData.name || '').trim();
            const characterName = (cardData.character_name || '').trim();
            const universe = (cardData.universe || 'ERB').trim() || 'ERB';

            let baseCardId = null;

            availableCardsMap.forEach((candidateCard, candidateId) => {
              const candidateType = candidateCard.cardType || candidateCard.type || '';
              if ((candidateType === 'special' || candidateId.startsWith('special_')) &&
                  (candidateCard.name || '').trim() === name &&
                  (candidateCard.character_name || '').trim() === characterName &&
                  (candidateCard.universe || 'ERB').trim() === universe) {
                const candidateImagePath = candidateCard.image_path || candidateCard.image || '';
                if (!candidateImagePath.includes('/alternate/')) {
                  baseCardId = candidateId;
                }
              }
            });

            if (baseCardId) {
              return {
                ...card,
                cardId: baseCardId,
                selectedAlternateCardId: card.cardId
              };
            }
          }

          return card;
        });
      };
    });

    it('should detect alternate art for special cards', () => {
      // Arrange
      const loadedCards = [
        {
          cardId: 'special_alt1_fireball',
          type: 'special',
          quantity: 1
        }
      ];

      // Act
      const processed = (global as any).processSpecialCardAlternateArt(loadedCards, mockAvailableCardsMap);

      // Assert
      expect(processed).toHaveLength(1);
      expect(processed[0].cardId).toBe('special_base_fireball');
      expect(processed[0].selectedAlternateCardId).toBe('special_alt1_fireball');
    });
  });

  describe('Power Card Alternate Art Detection', () => {
    beforeEach(() => {
      mockAvailableCardsMap.set('power_base_5_energy', {
        id: 'power_base_5_energy',
        value: '5',
        power_type: 'Energy',
        cardType: 'power',
        type: 'power',
        image_path: '/images/cards/powers/5_energy.jpg',
        image: '/images/cards/powers/5_energy.jpg'
      });

      mockAvailableCardsMap.set('power_alt1_5_energy', {
        id: 'power_alt1_5_energy',
        value: '5',
        power_type: 'Energy',
        cardType: 'power',
        type: 'power',
        image_path: '/images/cards/powers/alternate/5_energy_alt1.jpg',
        image: '/images/cards/powers/alternate/5_energy_alt1.jpg'
      });

      // Mock power card detection
      (global as any).processPowerCardAlternateArt = (cards: any[], availableCardsMap: Map<string, any>) => {
        return cards.map(card => {
          const cardData = availableCardsMap.get(card.cardId);
          if (!cardData) return card;

          const imagePath = cardData.image_path || cardData.image || '';
          const isAlternateArt = imagePath && imagePath.includes('/alternate/');

          if (isAlternateArt && card.type === 'power') {
            const value = String(cardData.value || '').trim();
            const powerType = (cardData.power_type || '').trim();

            let baseCardId = null;

            availableCardsMap.forEach((candidateCard, candidateId) => {
              const candidateType = candidateCard.cardType || candidateCard.type || '';
              if ((candidateType === 'power' || candidateId.startsWith('power_')) &&
                  String(candidateCard.value || '').trim() === value &&
                  (candidateCard.power_type || '').trim() === powerType) {
                const candidateImagePath = candidateCard.image_path || candidateCard.image || '';
                if (!candidateImagePath.includes('/alternate/')) {
                  baseCardId = candidateId;
                }
              }
            });

            if (baseCardId) {
              return {
                ...card,
                cardId: baseCardId,
                selectedAlternateCardId: card.cardId
              };
            }
          }

          return card;
        });
      };
    });

    it('should detect alternate art for power cards', () => {
      // Arrange
      const loadedCards = [
        {
          cardId: 'power_alt1_5_energy',
          type: 'power',
          quantity: 1
        }
      ];

      // Act
      const processed = (global as any).processPowerCardAlternateArt(loadedCards, mockAvailableCardsMap);

      // Assert
      expect(processed).toHaveLength(1);
      expect(processed[0].cardId).toBe('power_base_5_energy');
      expect(processed[0].selectedAlternateCardId).toBe('power_alt1_5_energy');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty cards array', () => {
      // Arrange
      const cards: any[] = [];

      // Act
      const saved = prepareCardsForSave(cards);

      // Assert
      expect(saved).toHaveLength(0);
    });

    it('should handle card with undefined selectedAlternateCardIds', () => {
      // Arrange
      const cards = [
        {
          cardId: 'char_base_wicked_witch',
          type: 'character',
          quantity: 2,
          selectedAlternateCardIds: undefined
        }
      ];

      // Act
      const saved = prepareCardsForSave(cards);

      // Assert
      expect(saved).toHaveLength(1);
      expect(saved[0].cardId).toBe('char_base_wicked_witch');
      expect(saved[0].quantity).toBe(2);
    });

    it('should handle card with empty selectedAlternateCardIds array', () => {
      // Arrange
      const cards = [
        {
          cardId: 'char_base_wicked_witch',
          type: 'character',
          quantity: 2,
          selectedAlternateCardIds: []
        }
      ];

      // Act
      const saved = prepareCardsForSave(cards);

      // Assert
      expect(saved).toHaveLength(1);
      expect(saved[0].cardId).toBe('char_base_wicked_witch');
      expect(saved[0].quantity).toBe(2);
    });

    it('should handle card with all null values in selectedAlternateCardIds', () => {
      // Arrange
      const cards = [
        {
          cardId: 'char_base_wicked_witch',
          type: 'character',
          quantity: 2,
          selectedAlternateCardId: 'char_alt1_wicked_witch',
          selectedAlternateCardIds: [null, null]
        }
      ];

      // Act
      const saved = prepareCardsForSave(cards);

      // Assert
      expect(saved).toHaveLength(1);
      expect(saved[0].cardId).toBe('char_alt1_wicked_witch');
      expect(saved[0].quantity).toBe(2);
    });

    it('should handle image path with only image field (no image_path)', () => {
      // Arrange
      mockAvailableCardsMap.set('char_alt_image_only', {
        id: 'char_alt_image_only',
        name: 'Test Character',
        set: 'ERB',
        cardType: 'character',
        type: 'character',
        image: '/images/cards/characters/alternate/test_alt.jpg'
      });

      const loadedCards = [
        {
          cardId: 'char_alt_image_only',
          type: 'character',
          quantity: 1
        }
      ];

      // Act
      const processed = processAlternateArtDetection(loadedCards, mockAvailableCardsMap);

      // Assert
      expect(processed[0].selectedAlternateCardId).toBe('char_alt_image_only');
    });

    it('should handle image path with only image_path field (no image)', () => {
      // Arrange
      mockAvailableCardsMap.set('char_alt_path_only', {
        id: 'char_alt_path_only',
        name: 'Test Character',
        set: 'ERB',
        cardType: 'character',
        type: 'character',
        image_path: '/images/cards/characters/alternate/test_alt.jpg'
      });

      const loadedCards = [
        {
          cardId: 'char_alt_path_only',
          type: 'character',
          quantity: 1
        }
      ];

      // Act
      const processed = processAlternateArtDetection(loadedCards, mockAvailableCardsMap);

      // Assert
      expect(processed[0].selectedAlternateCardId).toBe('char_alt_path_only');
    });
  });

  describe('Reserve Character with Alternate Art', () => {
    beforeEach(() => {
      // Mock the reserve character update logic
      (global as any).updateReserveCharacterForAlternateArt = (
        reserveCharacterId: string | null,
        deckEditorCards: any[]
      ): string | null => {
        if (!reserveCharacterId) {
          return null;
        }

        // Find the character card that matches the reserve_character ID
        const reservedCharacterCard = deckEditorCards.find(
          (card: any) => card.type === 'character' && card.cardId === reserveCharacterId
        );

        if (reservedCharacterCard) {
          // If this character has alternate art selected, use the alternate card ID
          const alternateCardId = reservedCharacterCard.selectedAlternateCardId ||
            (reservedCharacterCard.selectedAlternateCardIds && reservedCharacterCard.selectedAlternateCardIds[0]) ||
            null;

          if (alternateCardId && alternateCardId !== reserveCharacterId) {
            return alternateCardId;
          }
        } else {
          // Reserve character not found in deck - check if it matches any alternate card IDs
          for (const card of deckEditorCards) {
            if (card.type === 'character') {
              if (card.selectedAlternateCardId === reserveCharacterId ||
                (card.selectedAlternateCardIds && card.selectedAlternateCardIds.includes(reserveCharacterId))) {
                // Reserve character matches an alternate card ID, keep it as-is
                return reserveCharacterId;
              }
            }
          }
        }

        return reserveCharacterId;
      };
    });

    it('should update reserve_character to use alternate card ID when character has alternate art', () => {
      // Arrange
      const deckEditorCards = [
        {
          cardId: 'char_base_wicked_witch',
          type: 'character',
          quantity: 1,
          selectedAlternateCardId: 'char_alt1_wicked_witch'
        },
        {
          cardId: 'char_base_hercules',
          type: 'character',
          quantity: 1
        }
      ];
      const reserveCharacterId = 'char_base_wicked_witch'; // Base card ID

      // Act
      const updatedReserveId = (global as any).updateReserveCharacterForAlternateArt(
        reserveCharacterId,
        deckEditorCards
      );

      // Assert
      expect(updatedReserveId).toBe('char_alt1_wicked_witch');
    });

    it('should keep reserve_character unchanged when character has no alternate art', () => {
      // Arrange
      const deckEditorCards = [
        {
          cardId: 'char_base_wicked_witch',
          type: 'character',
          quantity: 1
        },
        {
          cardId: 'char_base_hercules',
          type: 'character',
          quantity: 1
        }
      ];
      const reserveCharacterId = 'char_base_wicked_witch';

      // Act
      const updatedReserveId = (global as any).updateReserveCharacterForAlternateArt(
        reserveCharacterId,
        deckEditorCards
      );

      // Assert
      expect(updatedReserveId).toBe('char_base_wicked_witch');
    });

    it('should keep reserve_character unchanged when it already matches alternate card ID', () => {
      // Arrange
      const deckEditorCards = [
        {
          cardId: 'char_base_wicked_witch',
          type: 'character',
          quantity: 1,
          selectedAlternateCardId: 'char_alt1_wicked_witch'
        }
      ];
      const reserveCharacterId = 'char_alt1_wicked_witch'; // Already alternate card ID

      // Act
      const updatedReserveId = (global as any).updateReserveCharacterForAlternateArt(
        reserveCharacterId,
        deckEditorCards
      );

      // Assert
      expect(updatedReserveId).toBe('char_alt1_wicked_witch');
    });

    it('should return null when reserve_character is null', () => {
      // Arrange
      const deckEditorCards = [
        {
          cardId: 'char_base_wicked_witch',
          type: 'character',
          quantity: 1,
          selectedAlternateCardId: 'char_alt1_wicked_witch'
        }
      ];

      // Act
      const updatedReserveId = (global as any).updateReserveCharacterForAlternateArt(
        null,
        deckEditorCards
      );

      // Assert
      expect(updatedReserveId).toBeNull();
    });

    it('should handle reserve character with per-instance alternate selections', () => {
      // Arrange
      const deckEditorCards = [
        {
          cardId: 'char_base_wicked_witch',
          type: 'character',
          quantity: 2,
          selectedAlternateCardIds: ['char_alt1_wicked_witch', 'char_alt2_wicked_witch']
        }
      ];
      const reserveCharacterId = 'char_base_wicked_witch';

      // Act
      const updatedReserveId = (global as any).updateReserveCharacterForAlternateArt(
        reserveCharacterId,
        deckEditorCards
      );

      // Assert - should use first instance's alternate art
      expect(updatedReserveId).toBe('char_alt1_wicked_witch');
    });
  });
});

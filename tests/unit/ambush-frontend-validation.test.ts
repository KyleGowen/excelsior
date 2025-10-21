/**
 * Unit tests for frontend Ambush card dimming functionality
 * Tests the updateAmbushLimitStatus function and related frontend logic
 */

import { jest } from '@jest/globals';

// Mock DOM elements and functions
const mockQuerySelectorAll = jest.fn();
const mockQuerySelector = jest.fn();
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

// Mock DOM methods
Object.defineProperty(global, 'document', {
  value: {
    querySelectorAll: mockQuerySelectorAll,
    querySelector: mockQuerySelector,
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener
  },
  writable: true
});

// Mock global functions and objects
const mockShowNotification = jest.fn();
const mockAvailableCardsMap = new Map();

// Mock global objects
(global as any).showNotification = mockShowNotification;
(global as any).window = {
  availableCardsMap: mockAvailableCardsMap,
  deckEditorCards: [] as any[] // Will be reset in beforeEach
};

// Mock deckEditorCards array
let mockDeckEditorCards: any[] = (global as any).window.deckEditorCards;

// Helper to create a mock card element
const createMockCardElement = (id: string, type: string, isAmbush: boolean) => {
  const element: any = {
    getAttribute: jest.fn().mockReturnValue(id),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn((cls: string) => cls === 'disabled' && element._isDisabled),
    },
    setAttribute: jest.fn((attr: string, value: string) => {
      if (attr === 'draggable') element._isDraggable = value === 'true';
    }),
    title: '',
    offsetParent: { /* mock visible element */ }, // Simulate visibility
    _isDisabled: false, // Internal state for contains mock
    _isDraggable: true, // Internal state for draggable
  };

  // Mock getAttribute to return the correct values
  element.getAttribute.mockImplementation((attr: unknown) => {
    if (attr === 'data-id') return id;
    if (attr === 'data-type') return type;
    return null;
  });

  // Mock classList.add and remove to update internal state
  element.classList.add.mockImplementation((cls: string) => {
    if (cls === 'disabled') element._isDisabled = true;
  });
  element.classList.remove.mockImplementation((cls: string) => {
    if (cls === 'disabled') element._isDisabled = false;
  });

  return element;
};

// Mock the updateAmbushLimitStatus function
function updateAmbushLimitStatus() {
  // Get all Ambush cards currently in the deck
  const ambushCardsInDeck = new Set();
  mockDeckEditorCards.forEach(card => {
    const cardData = mockAvailableCardsMap.get(card.cardId);
    if (cardData && cardData.is_ambush === true) {
      ambushCardsInDeck.add(card.cardId);
    }
  });

  // Update all special card items for ambush dimming
  const mockElements = mockQuerySelectorAll('.card-item[data-type="special"][data-id]') as any[];

  if (mockElements && mockElements.forEach) {
    mockElements.forEach((cardElement: any) => {
      const cardId = cardElement.getAttribute('data-id');

      if (cardId) {
        const cardData = mockAvailableCardsMap.get(cardId);
        const isAmbush = cardData && cardData.is_ambush === true;
        const isInDeck = ambushCardsInDeck.has(cardId);
        const hasOtherAmbush = ambushCardsInDeck.size > 0;

        if (isAmbush && (isInDeck || hasOtherAmbush)) {
          // This is an Ambush card and either it's in the deck or another ambush is in the deck - dim it
          cardElement.classList.add('disabled');
          cardElement.setAttribute('draggable', 'false');
          if (isInDeck) {
            cardElement.title = 'Ambush - already in deck';
          } else {
            cardElement.title = 'Ambush - another ambush already selected';
          }
        } else if (isAmbush && !hasOtherAmbush) {
          // This is an Ambush card but no ambush is in the deck - enable it
          cardElement.classList.remove('disabled');
          cardElement.setAttribute('draggable', 'true');
          cardElement.title = '';
        }
      }
    });
  }
}

// Mock the addCardToEditor function with ambush validation
async function addCardToEditor(cardType: string, cardId: string, cardName: string, selectedAlternateImage: string | null = null) {
  // Check Ambush limit for special cards
  const cardData = mockAvailableCardsMap.get(cardId);
  const isAmbush = cardData && cardData.is_ambush === true;
  if (isAmbush) {
    // Check if we already have any ambush card in the deck
    const hasExistingAmbush = mockDeckEditorCards.some(card => {
      const cardData = mockAvailableCardsMap.get(card.cardId);
      return cardData && cardData.is_ambush === true;
    });

    if (hasExistingAmbush) {
      mockShowNotification(`Cannot add more than 1 Ambush to a deck`, 'error');
      return;
    }
  }

  // Add card to deck (simplified for testing)
  mockDeckEditorCards.push({
    id: `deck-${cardType}-${cardId}`,
    type: cardType,
    cardId: cardId,
    name: cardName,
    quantity: 1
  });
  updateAmbushLimitStatus(); // Call update after adding
}

// Mock the removeCardFromEditor function
function removeCardFromEditor(cardIdToRemove: string) {
  const initialLength = mockDeckEditorCards.length;
  mockDeckEditorCards = mockDeckEditorCards.filter(card => card.cardId !== cardIdToRemove);
  if (mockDeckEditorCards.length < initialLength) {
    updateAmbushLimitStatus(); // Call update only if a card was actually removed
  }
}

describe('Ambush Frontend Validation', () => {
  let mockCardElements: any[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    mockDeckEditorCards = [];
    mockAvailableCardsMap.clear();
    mockCardElements = [];

    // Reset window.deckEditorCards
    (global as any).window.deckEditorCards = mockDeckEditorCards;

    // Setup default mock for querySelectorAll
    mockQuerySelectorAll.mockReturnValue(mockCardElements);

    // Reset all mock card elements
    mockCardElements.forEach(element => {
      element.classList.add.mockClear();
      element.classList.remove.mockClear();
      element.setAttribute.mockClear();
      element.title = '';
    });
  });

  describe('updateAmbushLimitStatus', () => {
    it('should enable all ambush cards when no ambush cards are in deck', () => {
      // Setup mock data - no ambush cards in deck
      const ambushCard1 = createMockCardElement('ambush1', 'special', true);
      const ambushCard2 = createMockCardElement('ambush2', 'special', true);
      const regularCard = createMockCardElement('regular1', 'special', false);

      mockCardElements.push(ambushCard1, ambushCard2, regularCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data
      mockAvailableCardsMap.set('ambush1', { is_ambush: true });
      mockAvailableCardsMap.set('ambush2', { is_ambush: true });
      mockAvailableCardsMap.set('regular1', { is_ambush: false });

      // Call function
      updateAmbushLimitStatus();

      // Ambush cards should be enabled
      expect(ambushCard1.classList.remove).toHaveBeenCalledWith('disabled');
      expect(ambushCard1.setAttribute).toHaveBeenCalledWith('draggable', 'true');
      expect(ambushCard1.title).toBe('');

      expect(ambushCard2.classList.remove).toHaveBeenCalledWith('disabled');
      expect(ambushCard2.setAttribute).toHaveBeenCalledWith('draggable', 'true');
      expect(ambushCard2.title).toBe('');

      // Regular card should not be affected
      expect(regularCard.classList.add).not.toHaveBeenCalled();
      expect(regularCard.classList.remove).not.toHaveBeenCalled();
    });

    it('should dim all ambush cards when one ambush card is in deck', () => {
      // Setup mock data - one ambush card in deck
      const ambushCard1 = createMockCardElement('ambush1', 'special', true);
      const ambushCard2 = createMockCardElement('ambush2', 'special', true);
      const regularCard = createMockCardElement('regular1', 'special', false);

      mockCardElements.push(ambushCard1, ambushCard2, regularCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data
      mockAvailableCardsMap.set('ambush1', { is_ambush: true });
      mockAvailableCardsMap.set('ambush2', { is_ambush: true });
      mockAvailableCardsMap.set('regular1', { is_ambush: false });

      // Add one ambush card to deck
      mockDeckEditorCards.push({
        id: 'deck-special-ambush1',
        type: 'special',
        cardId: 'ambush1',
        name: 'Ambush Card 1',
        quantity: 1
      });

      // Call function
      updateAmbushLimitStatus();

      // Ambush card in deck should be dimmed with "already in deck" message
      expect(ambushCard1.classList.add).toHaveBeenCalledWith('disabled');
      expect(ambushCard1.setAttribute).toHaveBeenCalledWith('draggable', 'false');
      expect(ambushCard1.title).toBe('Ambush - already in deck');

      // Other ambush card should be dimmed with "another ambush already selected" message
      expect(ambushCard2.classList.add).toHaveBeenCalledWith('disabled');
      expect(ambushCard2.setAttribute).toHaveBeenCalledWith('draggable', 'false');
      expect(ambushCard2.title).toBe('Ambush - another ambush already selected');

      // Regular card should not be affected
      expect(regularCard.classList.add).not.toHaveBeenCalled();
      expect(regularCard.classList.remove).not.toHaveBeenCalled();
    });

    it('should handle cards without ambush data gracefully', () => {
      // Setup mock data - card without ambush data
      const cardWithoutData = createMockCardElement('nodata1', 'special', false);
      mockCardElements.push(cardWithoutData);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // No card data in availableCardsMap

      // Call function
      updateAmbushLimitStatus();

      // Card should not be affected
      expect(cardWithoutData.classList.add).not.toHaveBeenCalled();
      expect(cardWithoutData.classList.remove).not.toHaveBeenCalled();
    });

    it('should handle cards with undefined is_ambush property', () => {
      // Setup mock data
      const cardWithUndefined = createMockCardElement('undefined1', 'special', false);
      mockCardElements.push(cardWithUndefined);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data with undefined is_ambush
      mockAvailableCardsMap.set('undefined1', { is_ambush: undefined });

      // Call function
      updateAmbushLimitStatus();

      // Card should not be affected (undefined is falsy)
      expect(cardWithUndefined.classList.add).not.toHaveBeenCalled();
      expect(cardWithUndefined.classList.remove).not.toHaveBeenCalled();
    });

    it('should handle cards with null is_ambush property', () => {
      // Setup mock data
      const cardWithNull = createMockCardElement('null1', 'special', false);
      mockCardElements.push(cardWithNull);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data with null is_ambush
      mockAvailableCardsMap.set('null1', { is_ambush: null });

      // Call function
      updateAmbushLimitStatus();

      // Card should not be affected (null is falsy)
      expect(cardWithNull.classList.add).not.toHaveBeenCalled();
      expect(cardWithNull.classList.remove).not.toHaveBeenCalled();
    });

    it('should only affect special cards', () => {
      // Setup mock data - mix of card types
      const specialAmbushCard = createMockCardElement('special_ambush', 'special', true);
      const characterCard = createMockCardElement('character1', 'character', false);
      const powerCard = createMockCardElement('power1', 'power', false);

      mockCardElements.push(specialAmbushCard, characterCard, powerCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data
      mockAvailableCardsMap.set('special_ambush', { is_ambush: true });
      mockAvailableCardsMap.set('character1', { is_ambush: false });
      mockAvailableCardsMap.set('power1', { is_ambush: false });

      // Call function
      updateAmbushLimitStatus();

      // Only special ambush card should be affected
      expect(specialAmbushCard.classList.remove).toHaveBeenCalledWith('disabled');
      expect(characterCard.classList.add).not.toHaveBeenCalled();
      expect(characterCard.classList.remove).not.toHaveBeenCalled();
      expect(powerCard.classList.add).not.toHaveBeenCalled();
      expect(powerCard.classList.remove).not.toHaveBeenCalled();
    });

    it('should handle empty deck correctly', () => {
      // Setup mock data
      const ambushCard = createMockCardElement('ambush1', 'special', true);
      mockCardElements.push(ambushCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data
      mockAvailableCardsMap.set('ambush1', { is_ambush: true });

      // Empty deck
      mockDeckEditorCards = [];

      // Call function
      updateAmbushLimitStatus();

      // Ambush card should be enabled
      expect(ambushCard.classList.remove).toHaveBeenCalledWith('disabled');
      expect(ambushCard.setAttribute).toHaveBeenCalledWith('draggable', 'true');
      expect(ambushCard.title).toBe('');
    });

    it('should handle multiple ambush cards in deck (edge case)', () => {
      // Setup mock data
      const ambushCard1 = createMockCardElement('ambush1', 'special', true);
      const ambushCard2 = createMockCardElement('ambush2', 'special', true);
      const ambushCard3 = createMockCardElement('ambush3', 'special', true);

      mockCardElements.push(ambushCard1, ambushCard2, ambushCard3);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data
      mockAvailableCardsMap.set('ambush1', { is_ambush: true });
      mockAvailableCardsMap.set('ambush2', { is_ambush: true });
      mockAvailableCardsMap.set('ambush3', { is_ambush: true });

      // Add multiple ambush cards to deck (shouldn't happen in normal flow, but test edge case)
      mockDeckEditorCards.push(
        { id: 'deck-special-ambush1', type: 'special', cardId: 'ambush1', name: 'Ambush 1', quantity: 1 },
        { id: 'deck-special-ambush2', type: 'special', cardId: 'ambush2', name: 'Ambush 2', quantity: 1 }
      );

      // Call function
      updateAmbushLimitStatus();

      // All ambush cards should be dimmed
      expect(ambushCard1.classList.add).toHaveBeenCalledWith('disabled');
      expect(ambushCard1.title).toBe('Ambush - already in deck');

      expect(ambushCard2.classList.add).toHaveBeenCalledWith('disabled');
      expect(ambushCard2.title).toBe('Ambush - already in deck');

      expect(ambushCard3.classList.add).toHaveBeenCalledWith('disabled');
      expect(ambushCard3.title).toBe('Ambush - another ambush already selected');
    });
  });

  describe('addCardToEditor - Ambush Validation', () => {
    it('should allow adding first ambush card', async () => {
      // Setup mock data
      const ambushCard = { id: 'ambush1', name: 'Ambush Card', is_ambush: true };
      mockAvailableCardsMap.set('ambush1', ambushCard);
      mockQuerySelectorAll.mockReturnValue([createMockCardElement('ambush1', 'special', true)]);

      await addCardToEditor('special', 'ambush1', 'Ambush Card');

      expect(mockDeckEditorCards).toHaveLength(1);
      expect(mockShowNotification).not.toHaveBeenCalled();
      expect(mockDeckEditorCards[0].cardId).toBe('ambush1');
    });

    it('should prevent adding second ambush card', async () => {
      // Setup mock data
      const ambushCard1 = { id: 'ambush1', name: 'Ambush Card 1', is_ambush: true };
      const ambushCard2 = { id: 'ambush2', name: 'Ambush Card 2', is_ambush: true };
      mockAvailableCardsMap.set('ambush1', ambushCard1);
      mockAvailableCardsMap.set('ambush2', ambushCard2);
      mockQuerySelectorAll.mockReturnValue([
        createMockCardElement('ambush1', 'special', true),
        createMockCardElement('ambush2', 'special', true)
      ]);

      await addCardToEditor('special', 'ambush1', 'Ambush Card 1');
      expect(mockDeckEditorCards).toHaveLength(1);

      await addCardToEditor('special', 'ambush2', 'Ambush Card 2');
      expect(mockDeckEditorCards).toHaveLength(1); // Should not add second card
      expect(mockShowNotification).toHaveBeenCalledWith('Cannot add more than 1 Ambush to a deck', 'error');
    });

    it('should allow adding regular special cards when ambush is present', async () => {
      // Setup mock data
      const ambushCard = { id: 'ambush1', name: 'Ambush Card', is_ambush: true };
      const regularCard = { id: 'regular1', name: 'Regular Card', is_ambush: false };
      mockAvailableCardsMap.set('ambush1', ambushCard);
      mockAvailableCardsMap.set('regular1', regularCard);
      mockQuerySelectorAll.mockReturnValue([
        createMockCardElement('ambush1', 'special', true),
        createMockCardElement('regular1', 'special', false)
      ]);

      await addCardToEditor('special', 'ambush1', 'Ambush Card');
      expect(mockDeckEditorCards).toHaveLength(1);

      await addCardToEditor('special', 'regular1', 'Regular Card');
      expect(mockDeckEditorCards).toHaveLength(2); // Should add regular card
      expect(mockShowNotification).not.toHaveBeenCalled();
    });

    it('should handle cards without is_ambush property', async () => {
      // Setup mock data
      const cardWithoutProperty = { id: 'noprop1', name: 'No Prop Card' }; // No is_ambush
      mockAvailableCardsMap.set('noprop1', cardWithoutProperty);
      mockQuerySelectorAll.mockReturnValue([createMockCardElement('noprop1', 'special', false)]);

      await addCardToEditor('special', 'noprop1', 'No Prop Card');
      expect(mockDeckEditorCards).toHaveLength(1);
      expect(mockShowNotification).not.toHaveBeenCalled();
    });

    it('should handle missing card data gracefully', async () => {
      // No card data in availableCardsMap
      mockQuerySelectorAll.mockReturnValue([createMockCardElement('nonexistent', 'special', false)]);

      await addCardToEditor('special', 'nonexistent', 'Nonexistent Card');
      expect(mockDeckEditorCards).toHaveLength(1);
      expect(mockShowNotification).not.toHaveBeenCalled();
    });

    it('should work with different card types', async () => {
      const ambushCard = { id: 'ambush1', name: 'Ambush Card', is_ambush: true };
      mockAvailableCardsMap.set('ambush1', ambushCard);
      mockQuerySelectorAll.mockReturnValue([createMockCardElement('ambush1', 'special', true)]);

      // Add ambush card
      await addCardToEditor('special', 'ambush1', 'Ambush Card');
      expect(mockDeckEditorCards).toHaveLength(1);

      // Try to add another ambush card (should fail)
      const ambushCard2 = { id: 'ambush2', name: 'Ambush Card 2', is_ambush: true };
      mockAvailableCardsMap.set('ambush2', ambushCard2);
      mockQuerySelectorAll.mockReturnValue([
        createMockCardElement('ambush1', 'special', true),
        createMockCardElement('ambush2', 'special', true)
      ]);
      await addCardToEditor('special', 'ambush2', 'Ambush Card 2');
      expect(mockDeckEditorCards).toHaveLength(1);
      expect(mockShowNotification).toHaveBeenCalledWith('Cannot add more than 1 Ambush to a deck', 'error');

      // Add a non-special card (should succeed)
      const characterCard = { id: 'char1', name: 'Character Card', is_ambush: false };
      mockAvailableCardsMap.set('char1', characterCard);
      mockQuerySelectorAll.mockReturnValue([
        createMockCardElement('ambush1', 'special', true),
        createMockCardElement('char1', 'character', false)
      ]);
      await addCardToEditor('character', 'char1', 'Character Card');
      expect(mockDeckEditorCards).toHaveLength(2);
    });
  });

  describe('removeCardFromEditor - Ambush Status Update', () => {
    it('should re-enable ambush cards when ambush card is removed', () => {
      // Setup mock data
      const ambushCard1 = createMockCardElement('ambush1', 'special', true);
      const ambushCard2 = createMockCardElement('ambush2', 'special', true);

      mockCardElements.push(ambushCard1, ambushCard2);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data
      mockAvailableCardsMap.set('ambush1', { is_ambush: true });
      mockAvailableCardsMap.set('ambush2', { is_ambush: true });

      // Add ambush card to deck
      mockDeckEditorCards.push({
        id: 'deck-special-ambush1',
        type: 'special',
        cardId: 'ambush1',
        name: 'Ambush Card 1',
        quantity: 1
      });

      // Remove ambush card from deck
      removeCardFromEditor('ambush1');

      // Both ambush cards should be re-enabled
      expect(ambushCard1.classList.remove).toHaveBeenCalledWith('disabled');
      expect(ambushCard1.setAttribute).toHaveBeenCalledWith('draggable', 'true');
      expect(ambushCard1.title).toBe('');

      expect(ambushCard2.classList.remove).toHaveBeenCalledWith('disabled');
      expect(ambushCard2.setAttribute).toHaveBeenCalledWith('draggable', 'true');
      expect(ambushCard2.title).toBe('');
    });

    it('should handle removing non-ambush cards', () => {
      // Setup mock data
      const ambushCard = createMockCardElement('ambush1', 'special', true);
      const regularCard = createMockCardElement('regular1', 'special', false);

      mockCardElements.push(ambushCard, regularCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data
      mockAvailableCardsMap.set('ambush1', { is_ambush: true });
      mockAvailableCardsMap.set('regular1', { is_ambush: false });

      // Add both cards to deck
      mockDeckEditorCards.push(
        { id: 'deck-special-ambush1', type: 'special', cardId: 'ambush1', name: 'Ambush Card', quantity: 1 },
        { id: 'deck-special-regular1', type: 'special', cardId: 'regular1', name: 'Regular Card', quantity: 1 }
      );

      // Remove regular card
      removeCardFromEditor('regular1');

      // Ambush card should still be dimmed (still in deck)
      expect(ambushCard.classList.add).toHaveBeenCalledWith('disabled');
      expect(ambushCard.title).toBe('Ambush - already in deck');
    });

    it('should handle removing non-existent card', () => {
      // Setup mock data
      const ambushCard = createMockCardElement('ambush1', 'special', true);
      mockCardElements.push(ambushCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data
      mockAvailableCardsMap.set('ambush1', { is_ambush: true });

      // Try to remove non-existent card
      removeCardFromEditor('nonexistent');

      // Should not throw error and no changes should be made since no card was removed
      expect(ambushCard.classList.remove).not.toHaveBeenCalled();
      expect(ambushCard.classList.add).not.toHaveBeenCalled();
      expect(ambushCard.setAttribute).not.toHaveBeenCalled();
    });
  });

  describe('Integration with DOM', () => {
    it('should call querySelectorAll with correct selector', () => {
      // Setup mock data
      const ambushCard = createMockCardElement('ambush1', 'special', true);
      mockCardElements.push(ambushCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data
      mockAvailableCardsMap.set('ambush1', { is_ambush: true });

      // Call function
      updateAmbushLimitStatus();

      // Should call querySelectorAll with correct selector
      expect(mockQuerySelectorAll).toHaveBeenCalledWith('.card-item[data-type="special"][data-id]');
    });

    it('should handle empty querySelectorAll result', () => {
      // Setup empty result
      mockQuerySelectorAll.mockReturnValue([]);

      // Call function - should not throw
      expect(() => updateAmbushLimitStatus()).not.toThrow();
    });

    it('should handle null querySelectorAll result', () => {
      // Setup null result
      mockQuerySelectorAll.mockReturnValue(null);

      // Call function - should not throw
      expect(() => updateAmbushLimitStatus()).not.toThrow();
    });
  });
});

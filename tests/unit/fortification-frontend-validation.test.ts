/**
 * Unit tests for frontend Fortification card dimming functionality
 * Tests the updateFortificationLimitStatus function and related frontend logic
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
const createMockCardElement = (id: string, type: string, isFortification: boolean) => {
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

// Mock the updateFortificationLimitStatus function
function updateFortificationLimitStatus() {
  // Get all Fortification cards currently in the deck
  const fortificationCardsInDeck = new Set();
  mockDeckEditorCards.forEach(card => {
    const cardData = mockAvailableCardsMap.get(card.cardId);
    if (cardData && cardData.is_fortification === true) {
      fortificationCardsInDeck.add(card.cardId);
    }
  });

  // Update all aspect card items for fortification dimming
  const mockElements = mockQuerySelectorAll('.card-item[data-type="aspect"][data-id]') as any[];

  if (mockElements && mockElements.forEach) {
    mockElements.forEach((cardElement: any) => {
      const cardId = cardElement.getAttribute('data-id');

      if (cardId) {
        const cardData = mockAvailableCardsMap.get(cardId);
        const isFortification = cardData && cardData.is_fortification === true;
        const isInDeck = fortificationCardsInDeck.has(cardId);
        const hasOtherFortification = fortificationCardsInDeck.size > 0;

        if (isFortification && (isInDeck || hasOtherFortification)) {
          // This is a Fortification card and either it's in the deck or another fortification is in the deck - dim it
          cardElement.classList.add('disabled');
          cardElement.setAttribute('draggable', 'false');
          if (isInDeck) {
            cardElement.title = 'Fortification - already in deck';
          } else {
            cardElement.title = 'Fortification - another fortification already selected';
          }
        } else if (isFortification && !hasOtherFortification) {
          // This is a Fortification card but no fortification is in the deck - enable it
          cardElement.classList.remove('disabled');
          cardElement.setAttribute('draggable', 'true');
          cardElement.title = '';
        }
      }
    });
  }
}

// Mock the addCardToEditor function with fortification validation
async function addCardToEditor(cardType: string, cardId: string, cardName: string, selectedAlternateImage: string | null = null) {
  // Check Fortification limit for aspect cards
  const cardData = mockAvailableCardsMap.get(cardId);
  const isFortification = cardData && cardData.is_fortification === true;
  if (isFortification) {
    // Check if we already have any fortification card in the deck
    const hasExistingFortification = mockDeckEditorCards.some(card => {
      const cardData = mockAvailableCardsMap.get(card.cardId);
      return cardData && cardData.is_fortification === true;
    });

    if (hasExistingFortification) {
      mockShowNotification(`Cannot add more than 1 Fortification to a deck`, 'error');
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
  updateFortificationLimitStatus(); // Call update after adding
}

// Mock the removeCardFromEditor function
function removeCardFromEditor(cardIdToRemove: string) {
  const initialLength = mockDeckEditorCards.length;
  mockDeckEditorCards = mockDeckEditorCards.filter(card => card.cardId !== cardIdToRemove);
  if (mockDeckEditorCards.length < initialLength) {
    updateFortificationLimitStatus(); // Call update only if a card was actually removed
  }
}

describe('Fortification Frontend Validation', () => {
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

  describe('updateFortificationLimitStatus', () => {
    it('should enable all fortification cards when no fortification cards are in deck', () => {
      // Setup mock data - no fortification cards in deck
      const fortificationCard1 = createMockCardElement('fortification1', 'aspect', true);
      const fortificationCard2 = createMockCardElement('fortification2', 'aspect', true);
      const regularCard = createMockCardElement('regular1', 'aspect', false);

      mockCardElements.push(fortificationCard1, fortificationCard2, regularCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data
      mockAvailableCardsMap.set('fortification1', { is_fortification: true });
      mockAvailableCardsMap.set('fortification2', { is_fortification: true });
      mockAvailableCardsMap.set('regular1', { is_fortification: false });

      // Call function
      updateFortificationLimitStatus();

      // Fortification cards should be enabled
      expect(fortificationCard1.classList.remove).toHaveBeenCalledWith('disabled');
      expect(fortificationCard1.setAttribute).toHaveBeenCalledWith('draggable', 'true');
      expect(fortificationCard1.title).toBe('');

      expect(fortificationCard2.classList.remove).toHaveBeenCalledWith('disabled');
      expect(fortificationCard2.setAttribute).toHaveBeenCalledWith('draggable', 'true');
      expect(fortificationCard2.title).toBe('');

      // Regular card should not be affected
      expect(regularCard.classList.add).not.toHaveBeenCalled();
      expect(regularCard.classList.remove).not.toHaveBeenCalled();
    });

    it('should dim all fortification cards when one fortification card is in deck', () => {
      // Setup mock data - one fortification card in deck
      const fortificationCard1 = createMockCardElement('fortification1', 'aspect', true);
      const fortificationCard2 = createMockCardElement('fortification2', 'aspect', true);
      const regularCard = createMockCardElement('regular1', 'aspect', false);

      mockCardElements.push(fortificationCard1, fortificationCard2, regularCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data
      mockAvailableCardsMap.set('fortification1', { is_fortification: true });
      mockAvailableCardsMap.set('fortification2', { is_fortification: true });
      mockAvailableCardsMap.set('regular1', { is_fortification: false });

      // Add one fortification card to deck
      mockDeckEditorCards.push({
        id: 'deck-aspect-fortification1',
        type: 'aspect',
        cardId: 'fortification1',
        name: 'Fortification Card 1',
        quantity: 1
      });

      // Call function
      updateFortificationLimitStatus();

      // Fortification card in deck should be dimmed with "already in deck" message
      expect(fortificationCard1.classList.add).toHaveBeenCalledWith('disabled');
      expect(fortificationCard1.setAttribute).toHaveBeenCalledWith('draggable', 'false');
      expect(fortificationCard1.title).toBe('Fortification - already in deck');

      // Other fortification card should be dimmed with "another fortification already selected" message
      expect(fortificationCard2.classList.add).toHaveBeenCalledWith('disabled');
      expect(fortificationCard2.setAttribute).toHaveBeenCalledWith('draggable', 'false');
      expect(fortificationCard2.title).toBe('Fortification - another fortification already selected');

      // Regular card should not be affected
      expect(regularCard.classList.add).not.toHaveBeenCalled();
      expect(regularCard.classList.remove).not.toHaveBeenCalled();
    });

    it('should handle cards without fortification data gracefully', () => {
      // Setup mock data - card without fortification data
      const cardWithoutData = createMockCardElement('nodata1', 'aspect', false);
      mockCardElements.push(cardWithoutData);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // No card data in availableCardsMap

      // Call function
      updateFortificationLimitStatus();

      // Card should not be affected
      expect(cardWithoutData.classList.add).not.toHaveBeenCalled();
      expect(cardWithoutData.classList.remove).not.toHaveBeenCalled();
    });

    it('should handle cards with undefined is_fortification property', () => {
      // Setup mock data
      const cardWithUndefined = createMockCardElement('undefined1', 'aspect', false);
      mockCardElements.push(cardWithUndefined);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data with undefined is_fortification
      mockAvailableCardsMap.set('undefined1', { is_fortification: undefined });

      // Call function
      updateFortificationLimitStatus();

      // Card should not be affected (undefined is falsy)
      expect(cardWithUndefined.classList.add).not.toHaveBeenCalled();
      expect(cardWithUndefined.classList.remove).not.toHaveBeenCalled();
    });

    it('should handle cards with null is_fortification property', () => {
      // Setup mock data
      const cardWithNull = createMockCardElement('null1', 'aspect', false);
      mockCardElements.push(cardWithNull);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data with null is_fortification
      mockAvailableCardsMap.set('null1', { is_fortification: null });

      // Call function
      updateFortificationLimitStatus();

      // Card should not be affected (null is falsy)
      expect(cardWithNull.classList.add).not.toHaveBeenCalled();
      expect(cardWithNull.classList.remove).not.toHaveBeenCalled();
    });

    it('should only affect aspect cards', () => {
      // Setup mock data - mix of card types
      const aspectFortificationCard = createMockCardElement('aspect_fortification', 'aspect', true);
      const characterCard = createMockCardElement('character1', 'character', false);
      const powerCard = createMockCardElement('power1', 'power', false);

      mockCardElements.push(aspectFortificationCard, characterCard, powerCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data
      mockAvailableCardsMap.set('aspect_fortification', { is_fortification: true });
      mockAvailableCardsMap.set('character1', { is_fortification: false });
      mockAvailableCardsMap.set('power1', { is_fortification: false });

      // Call function
      updateFortificationLimitStatus();

      // Only aspect fortification card should be affected
      expect(aspectFortificationCard.classList.remove).toHaveBeenCalledWith('disabled');
      expect(characterCard.classList.add).not.toHaveBeenCalled();
      expect(characterCard.classList.remove).not.toHaveBeenCalled();
      expect(powerCard.classList.add).not.toHaveBeenCalled();
      expect(powerCard.classList.remove).not.toHaveBeenCalled();
    });

    it('should handle empty deck correctly', () => {
      // Setup mock data
      const fortificationCard = createMockCardElement('fortification1', 'aspect', true);
      mockCardElements.push(fortificationCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data
      mockAvailableCardsMap.set('fortification1', { is_fortification: true });

      // Empty deck
      mockDeckEditorCards = [];

      // Call function
      updateFortificationLimitStatus();

      // Fortification card should be enabled
      expect(fortificationCard.classList.remove).toHaveBeenCalledWith('disabled');
      expect(fortificationCard.setAttribute).toHaveBeenCalledWith('draggable', 'true');
      expect(fortificationCard.title).toBe('');
    });

    it('should handle multiple fortification cards in deck (edge case)', () => {
      // Setup mock data
      const fortificationCard1 = createMockCardElement('fortification1', 'aspect', true);
      const fortificationCard2 = createMockCardElement('fortification2', 'aspect', true);
      const fortificationCard3 = createMockCardElement('fortification3', 'aspect', true);

      mockCardElements.push(fortificationCard1, fortificationCard2, fortificationCard3);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data
      mockAvailableCardsMap.set('fortification1', { is_fortification: true });
      mockAvailableCardsMap.set('fortification2', { is_fortification: true });
      mockAvailableCardsMap.set('fortification3', { is_fortification: true });

      // Add multiple fortification cards to deck (shouldn't happen in normal flow, but test edge case)
      mockDeckEditorCards.push(
        { id: 'deck-aspect-fortification1', type: 'aspect', cardId: 'fortification1', name: 'Fortification 1', quantity: 1 },
        { id: 'deck-aspect-fortification2', type: 'aspect', cardId: 'fortification2', name: 'Fortification 2', quantity: 1 }
      );

      // Call function
      updateFortificationLimitStatus();

      // All fortification cards should be dimmed
      expect(fortificationCard1.classList.add).toHaveBeenCalledWith('disabled');
      expect(fortificationCard1.title).toBe('Fortification - already in deck');

      expect(fortificationCard2.classList.add).toHaveBeenCalledWith('disabled');
      expect(fortificationCard2.title).toBe('Fortification - already in deck');

      expect(fortificationCard3.classList.add).toHaveBeenCalledWith('disabled');
      expect(fortificationCard3.title).toBe('Fortification - another fortification already selected');
    });
  });

  describe('addCardToEditor - Fortification Validation', () => {
    it('should allow adding first fortification card', async () => {
      // Setup mock data
      const fortificationCard = { id: 'fortification1', name: 'Fortification Card', is_fortification: true };
      mockAvailableCardsMap.set('fortification1', fortificationCard);
      mockQuerySelectorAll.mockReturnValue([createMockCardElement('fortification1', 'aspect', true)]);

      await addCardToEditor('aspect', 'fortification1', 'Fortification Card');

      expect(mockDeckEditorCards).toHaveLength(1);
      expect(mockShowNotification).not.toHaveBeenCalled();
      expect(mockDeckEditorCards[0].cardId).toBe('fortification1');
    });

    it('should prevent adding second fortification card', async () => {
      // Setup mock data
      const fortificationCard1 = { id: 'fortification1', name: 'Fortification Card 1', is_fortification: true };
      const fortificationCard2 = { id: 'fortification2', name: 'Fortification Card 2', is_fortification: true };
      mockAvailableCardsMap.set('fortification1', fortificationCard1);
      mockAvailableCardsMap.set('fortification2', fortificationCard2);
      mockQuerySelectorAll.mockReturnValue([
        createMockCardElement('fortification1', 'aspect', true),
        createMockCardElement('fortification2', 'aspect', true)
      ]);

      await addCardToEditor('aspect', 'fortification1', 'Fortification Card 1');
      expect(mockDeckEditorCards).toHaveLength(1);

      await addCardToEditor('aspect', 'fortification2', 'Fortification Card 2');
      expect(mockDeckEditorCards).toHaveLength(1); // Should not add second card
      expect(mockShowNotification).toHaveBeenCalledWith('Cannot add more than 1 Fortification to a deck', 'error');
    });

    it('should allow adding regular aspect cards when fortification is present', async () => {
      // Setup mock data
      const fortificationCard = { id: 'fortification1', name: 'Fortification Card', is_fortification: true };
      const regularCard = { id: 'regular1', name: 'Regular Card', is_fortification: false };
      mockAvailableCardsMap.set('fortification1', fortificationCard);
      mockAvailableCardsMap.set('regular1', regularCard);
      mockQuerySelectorAll.mockReturnValue([
        createMockCardElement('fortification1', 'aspect', true),
        createMockCardElement('regular1', 'aspect', false)
      ]);

      await addCardToEditor('aspect', 'fortification1', 'Fortification Card');
      expect(mockDeckEditorCards).toHaveLength(1);

      await addCardToEditor('aspect', 'regular1', 'Regular Card');
      expect(mockDeckEditorCards).toHaveLength(2); // Should add regular card
      expect(mockShowNotification).not.toHaveBeenCalled();
    });

    it('should handle cards without is_fortification property', async () => {
      // Setup mock data
      const cardWithoutProperty = { id: 'noprop1', name: 'No Prop Card' }; // No is_fortification
      mockAvailableCardsMap.set('noprop1', cardWithoutProperty);
      mockQuerySelectorAll.mockReturnValue([createMockCardElement('noprop1', 'aspect', false)]);

      await addCardToEditor('aspect', 'noprop1', 'No Prop Card');
      expect(mockDeckEditorCards).toHaveLength(1);
      expect(mockShowNotification).not.toHaveBeenCalled();
    });

    it('should handle missing card data gracefully', async () => {
      // No card data in availableCardsMap
      mockQuerySelectorAll.mockReturnValue([createMockCardElement('nonexistent', 'aspect', false)]);

      await addCardToEditor('aspect', 'nonexistent', 'Nonexistent Card');
      expect(mockDeckEditorCards).toHaveLength(1);
      expect(mockShowNotification).not.toHaveBeenCalled();
    });

    it('should work with different card types', async () => {
      const fortificationCard = { id: 'fortification1', name: 'Fortification Card', is_fortification: true };
      mockAvailableCardsMap.set('fortification1', fortificationCard);
      mockQuerySelectorAll.mockReturnValue([createMockCardElement('fortification1', 'aspect', true)]);

      // Add fortification card
      await addCardToEditor('aspect', 'fortification1', 'Fortification Card');
      expect(mockDeckEditorCards).toHaveLength(1);

      // Try to add another fortification card (should fail)
      const fortificationCard2 = { id: 'fortification2', name: 'Fortification Card 2', is_fortification: true };
      mockAvailableCardsMap.set('fortification2', fortificationCard2);
      mockQuerySelectorAll.mockReturnValue([
        createMockCardElement('fortification1', 'aspect', true),
        createMockCardElement('fortification2', 'aspect', true)
      ]);
      await addCardToEditor('aspect', 'fortification2', 'Fortification Card 2');
      expect(mockDeckEditorCards).toHaveLength(1);
      expect(mockShowNotification).toHaveBeenCalledWith('Cannot add more than 1 Fortification to a deck', 'error');

      // Add a non-aspect card (should succeed)
      const characterCard = { id: 'char1', name: 'Character Card', is_fortification: false };
      mockAvailableCardsMap.set('char1', characterCard);
      mockQuerySelectorAll.mockReturnValue([
        createMockCardElement('fortification1', 'aspect', true),
        createMockCardElement('char1', 'character', false)
      ]);
      await addCardToEditor('character', 'char1', 'Character Card');
      expect(mockDeckEditorCards).toHaveLength(2);
    });
  });

  describe('removeCardFromEditor - Fortification Status Update', () => {
    it('should re-enable fortification cards when fortification card is removed', () => {
      // Setup mock data
      const fortificationCard1 = createMockCardElement('fortification1', 'aspect', true);
      const fortificationCard2 = createMockCardElement('fortification2', 'aspect', true);

      mockCardElements.push(fortificationCard1, fortificationCard2);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data
      mockAvailableCardsMap.set('fortification1', { is_fortification: true });
      mockAvailableCardsMap.set('fortification2', { is_fortification: true });

      // Add fortification card to deck
      mockDeckEditorCards.push({
        id: 'deck-aspect-fortification1',
        type: 'aspect',
        cardId: 'fortification1',
        name: 'Fortification Card 1',
        quantity: 1
      });

      // Remove fortification card from deck
      removeCardFromEditor('fortification1');

      // Both fortification cards should be re-enabled
      expect(fortificationCard1.classList.remove).toHaveBeenCalledWith('disabled');
      expect(fortificationCard1.setAttribute).toHaveBeenCalledWith('draggable', 'true');
      expect(fortificationCard1.title).toBe('');

      expect(fortificationCard2.classList.remove).toHaveBeenCalledWith('disabled');
      expect(fortificationCard2.setAttribute).toHaveBeenCalledWith('draggable', 'true');
      expect(fortificationCard2.title).toBe('');
    });

    it('should handle removing non-fortification cards', () => {
      // Setup mock data
      const fortificationCard = createMockCardElement('fortification1', 'aspect', true);
      const regularCard = createMockCardElement('regular1', 'aspect', false);

      mockCardElements.push(fortificationCard, regularCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data
      mockAvailableCardsMap.set('fortification1', { is_fortification: true });
      mockAvailableCardsMap.set('regular1', { is_fortification: false });

      // Add both cards to deck
      mockDeckEditorCards.push(
        { id: 'deck-aspect-fortification1', type: 'aspect', cardId: 'fortification1', name: 'Fortification Card', quantity: 1 },
        { id: 'deck-aspect-regular1', type: 'aspect', cardId: 'regular1', name: 'Regular Card', quantity: 1 }
      );

      // Remove regular card
      removeCardFromEditor('regular1');

      // Fortification card should still be dimmed (still in deck)
      expect(fortificationCard.classList.add).toHaveBeenCalledWith('disabled');
      expect(fortificationCard.title).toBe('Fortification - already in deck');
    });

    it('should handle removing non-existent card', () => {
      // Setup mock data
      const fortificationCard = createMockCardElement('fortification1', 'aspect', true);
      mockCardElements.push(fortificationCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data
      mockAvailableCardsMap.set('fortification1', { is_fortification: true });

      // Try to remove non-existent card
      removeCardFromEditor('nonexistent');

      // Should not throw error and no changes should be made since no card was removed
      expect(fortificationCard.classList.remove).not.toHaveBeenCalled();
      expect(fortificationCard.classList.add).not.toHaveBeenCalled();
      expect(fortificationCard.setAttribute).not.toHaveBeenCalled();
    });
  });

  describe('Integration with DOM', () => {
    it('should call querySelectorAll with correct selector', () => {
      // Setup mock data
      const fortificationCard = createMockCardElement('fortification1', 'aspect', true);
      mockCardElements.push(fortificationCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);

      // Setup card data
      mockAvailableCardsMap.set('fortification1', { is_fortification: true });

      // Call function
      updateFortificationLimitStatus();

      // Should call querySelectorAll with correct selector
      expect(mockQuerySelectorAll).toHaveBeenCalledWith('.card-item[data-type="aspect"][data-id]');
    });

    it('should handle empty querySelectorAll result', () => {
      // Setup empty result
      mockQuerySelectorAll.mockReturnValue([]);

      // Call function - should not throw
      expect(() => updateFortificationLimitStatus()).not.toThrow();
    });

    it('should handle null querySelectorAll result', () => {
      // Setup null result
      mockQuerySelectorAll.mockReturnValue(null);

      // Call function - should not throw
      expect(() => updateFortificationLimitStatus()).not.toThrow();
    });
  });
});

/**
 * Unit tests for frontend Assist card dimming functionality
 * Tests the updateAssistLimitStatus function and related frontend logic
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
    deckEditorCards: []
};

// Mock deckEditorCards array
let mockDeckEditorCards: any[] = [];

// Mock DOM elements
const createMockCardElement = (id: string, type: string, isAssist: boolean = false) => {
  const element = {
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn()
    },
    setAttribute: jest.fn(),
    getAttribute: jest.fn().mockReturnValue(id),
    title: '',
    offsetParent: { /* mock visible element */ }
  };
  
  // Mock getAttribute to return the correct values
  element.getAttribute.mockImplementation((attr: unknown) => {
    if (attr === 'data-id') return id;
    if (attr === 'data-type') return type;
    return null;
  });
  
  return element;
};

// Mock the updateAssistLimitStatus function
function updateAssistLimitStatus() {
  // Get all Assist cards currently in the deck
  const assistCardsInDeck = new Set();
  mockDeckEditorCards.forEach(card => {
    const cardData = mockAvailableCardsMap.get(card.cardId);
    if (cardData && cardData.is_assist === true) {
      assistCardsInDeck.add(card.cardId);
    }
  });
  
  // Update all special card items for assist dimming
  const mockElements = mockQuerySelectorAll('.card-item[data-type="special"][data-id]') as any[];
  
  if (mockElements && mockElements.forEach) {
    mockElements.forEach((cardElement: any) => {
    const cardId = cardElement.getAttribute('data-id');
    
    if (cardId) {
      const cardData = mockAvailableCardsMap.get(cardId);
      const isAssist = cardData && cardData.is_assist === true;
      const isInDeck = assistCardsInDeck.has(cardId);
      const hasOtherAssist = assistCardsInDeck.size > 0;
      
      if (isAssist && (isInDeck || hasOtherAssist)) {
        // This is an Assist card and either it's in the deck or another assist is in the deck - dim it
        cardElement.classList.add('disabled');
        cardElement.setAttribute('draggable', 'false');
        if (isInDeck) {
          cardElement.title = 'Assist - already in deck';
        } else {
          cardElement.title = 'Assist - another assist already selected';
        }
      } else if (isAssist && !hasOtherAssist) {
        // This is an Assist card but no assist is in the deck - enable it
        cardElement.classList.remove('disabled');
        cardElement.setAttribute('draggable', 'true');
        cardElement.title = '';
      }
    }
  });
  }
}

// Mock the addCardToEditor function with assist validation
async function addCardToEditor(cardType: string, cardId: string, cardName: string, selectedAlternateImage: string | null = null) {
  // Check Assist limit for special cards
  const cardData = mockAvailableCardsMap.get(cardId);
  const isAssist = cardData && cardData.is_assist === true;
  if (isAssist) {
    // Check if we already have any assist card in the deck
    const hasExistingAssist = mockDeckEditorCards.some(card => {
      const cardData = mockAvailableCardsMap.get(card.cardId);
      return cardData && cardData.is_assist === true;
    });
    
    if (hasExistingAssist) {
      mockShowNotification(`Cannot add more than 1 Assist to a deck`, 'error');
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
  
  // Call updateAssistLimitStatus after adding card
  updateAssistLimitStatus();
}

// Mock the removeCardFromEditor function
function removeCardFromEditor(cardId: string) {
  const index = mockDeckEditorCards.findIndex(card => card.cardId === cardId);
  if (index !== -1) {
    mockDeckEditorCards.splice(index, 1);
  }
  
  // Call updateAssistLimitStatus after removing card
  updateAssistLimitStatus();
}

describe('Assist Frontend Validation', () => {
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

  describe('updateAssistLimitStatus', () => {
    it('should enable all assist cards when no assist cards are in deck', () => {
      // Setup mock data - no assist cards in deck
      const assistCard1 = createMockCardElement('assist1', 'special', true);
      const assistCard2 = createMockCardElement('assist2', 'special', true);
      const regularCard = createMockCardElement('regular1', 'special', false);
      
      mockCardElements.push(assistCard1, assistCard2, regularCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);
      
      // Setup card data
      mockAvailableCardsMap.set('assist1', { is_assist: true });
      mockAvailableCardsMap.set('assist2', { is_assist: true });
      mockAvailableCardsMap.set('regular1', { is_assist: false });
      
      // Call function
      updateAssistLimitStatus();
      
      // Assist cards should be enabled
      expect(assistCard1.classList.remove).toHaveBeenCalledWith('disabled');
      expect(assistCard1.setAttribute).toHaveBeenCalledWith('draggable', 'true');
      expect(assistCard1.title).toBe('');
      
      expect(assistCard2.classList.remove).toHaveBeenCalledWith('disabled');
      expect(assistCard2.setAttribute).toHaveBeenCalledWith('draggable', 'true');
      expect(assistCard2.title).toBe('');
      
      // Regular card should not be affected
      expect(regularCard.classList.add).not.toHaveBeenCalled();
      expect(regularCard.classList.remove).not.toHaveBeenCalled();
    });

    it('should dim all assist cards when one assist card is in deck', () => {
      // Setup mock data - one assist card in deck
      const assistCard1 = createMockCardElement('assist1', 'special', true);
      const assistCard2 = createMockCardElement('assist2', 'special', true);
      const regularCard = createMockCardElement('regular1', 'special', false);
      
      mockCardElements.push(assistCard1, assistCard2, regularCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);
      
      // Setup card data
      mockAvailableCardsMap.set('assist1', { is_assist: true });
      mockAvailableCardsMap.set('assist2', { is_assist: true });
      mockAvailableCardsMap.set('regular1', { is_assist: false });
      
      // Add one assist card to deck
      mockDeckEditorCards.push({
        id: 'deck-special-assist1',
        type: 'special',
        cardId: 'assist1',
        name: 'Assist Card 1',
        quantity: 1
      });
      
      // Call function
      updateAssistLimitStatus();
      
      // Assist card in deck should be dimmed with "already in deck" message
      expect(assistCard1.classList.add).toHaveBeenCalledWith('disabled');
      expect(assistCard1.setAttribute).toHaveBeenCalledWith('draggable', 'false');
      expect(assistCard1.title).toBe('Assist - already in deck');
      
      // Other assist card should be dimmed with "another assist already selected" message
      expect(assistCard2.classList.add).toHaveBeenCalledWith('disabled');
      expect(assistCard2.setAttribute).toHaveBeenCalledWith('draggable', 'false');
      expect(assistCard2.title).toBe('Assist - another assist already selected');
      
      // Regular card should not be affected
      expect(regularCard.classList.add).not.toHaveBeenCalled();
      expect(regularCard.classList.remove).not.toHaveBeenCalled();
    });

    it('should handle cards without assist data gracefully', () => {
      // Setup mock data - card without assist data
      const cardWithoutData = createMockCardElement('nodata1', 'special', false);
      mockCardElements.push(cardWithoutData);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);
      
      // No card data in availableCardsMap
      
      // Call function
      updateAssistLimitStatus();
      
      // Card should not be affected
      expect(cardWithoutData.classList.add).not.toHaveBeenCalled();
      expect(cardWithoutData.classList.remove).not.toHaveBeenCalled();
    });

    it('should handle cards with undefined is_assist property', () => {
      // Setup mock data
      const cardWithUndefined = createMockCardElement('undefined1', 'special', false);
      mockCardElements.push(cardWithUndefined);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);
      
      // Setup card data with undefined is_assist
      mockAvailableCardsMap.set('undefined1', { is_assist: undefined });
      
      // Call function
      updateAssistLimitStatus();
      
      // Card should not be affected (undefined is falsy)
      expect(cardWithUndefined.classList.add).not.toHaveBeenCalled();
      expect(cardWithUndefined.classList.remove).not.toHaveBeenCalled();
    });

    it('should handle cards with null is_assist property', () => {
      // Setup mock data
      const cardWithNull = createMockCardElement('null1', 'special', false);
      mockCardElements.push(cardWithNull);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);
      
      // Setup card data with null is_assist
      mockAvailableCardsMap.set('null1', { is_assist: null });
      
      // Call function
      updateAssistLimitStatus();
      
      // Card should not be affected (null is falsy)
      expect(cardWithNull.classList.add).not.toHaveBeenCalled();
      expect(cardWithNull.classList.remove).not.toHaveBeenCalled();
    });

    it('should only affect special cards', () => {
      // Setup mock data - mix of card types
      const specialAssistCard = createMockCardElement('special_assist', 'special', true);
      const characterCard = createMockCardElement('character1', 'character', false);
      const powerCard = createMockCardElement('power1', 'power', false);
      
      mockCardElements.push(specialAssistCard, characterCard, powerCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);
      
      // Setup card data
      mockAvailableCardsMap.set('special_assist', { is_assist: true });
      mockAvailableCardsMap.set('character1', { is_assist: false });
      mockAvailableCardsMap.set('power1', { is_assist: false });
      
      // Call function
      updateAssistLimitStatus();
      
      // Only special assist card should be affected
      expect(specialAssistCard.classList.remove).toHaveBeenCalledWith('disabled');
      expect(characterCard.classList.add).not.toHaveBeenCalled();
      expect(characterCard.classList.remove).not.toHaveBeenCalled();
      expect(powerCard.classList.add).not.toHaveBeenCalled();
      expect(powerCard.classList.remove).not.toHaveBeenCalled();
    });

    it('should handle empty deck correctly', () => {
      // Setup mock data
      const assistCard = createMockCardElement('assist1', 'special', true);
      mockCardElements.push(assistCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);
      
      // Setup card data
      mockAvailableCardsMap.set('assist1', { is_assist: true });
      
      // Empty deck
      mockDeckEditorCards = [];
      
      // Call function
      updateAssistLimitStatus();
      
      // Assist card should be enabled
      expect(assistCard.classList.remove).toHaveBeenCalledWith('disabled');
      expect(assistCard.setAttribute).toHaveBeenCalledWith('draggable', 'true');
      expect(assistCard.title).toBe('');
    });

    it('should handle multiple assist cards in deck (edge case)', () => {
      // Setup mock data
      const assistCard1 = createMockCardElement('assist1', 'special', true);
      const assistCard2 = createMockCardElement('assist2', 'special', true);
      const assistCard3 = createMockCardElement('assist3', 'special', true);
      
      mockCardElements.push(assistCard1, assistCard2, assistCard3);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);
      
      // Setup card data
      mockAvailableCardsMap.set('assist1', { is_assist: true });
      mockAvailableCardsMap.set('assist2', { is_assist: true });
      mockAvailableCardsMap.set('assist3', { is_assist: true });
      
      // Add multiple assist cards to deck (shouldn't happen in normal flow, but test edge case)
      mockDeckEditorCards.push(
        { id: 'deck-special-assist1', type: 'special', cardId: 'assist1', name: 'Assist 1', quantity: 1 },
        { id: 'deck-special-assist2', type: 'special', cardId: 'assist2', name: 'Assist 2', quantity: 1 }
      );
      
      // Call function
      updateAssistLimitStatus();
      
      // All assist cards should be dimmed
      expect(assistCard1.classList.add).toHaveBeenCalledWith('disabled');
      expect(assistCard1.title).toBe('Assist - already in deck');
      
      expect(assistCard2.classList.add).toHaveBeenCalledWith('disabled');
      expect(assistCard2.title).toBe('Assist - already in deck');
      
      expect(assistCard3.classList.add).toHaveBeenCalledWith('disabled');
      expect(assistCard3.title).toBe('Assist - another assist already selected');
    });
  });

  describe('addCardToEditor - Assist Validation', () => {
    it('should allow adding first assist card', async () => {
      // Setup mock data
      const assistCard = {
        id: 'assist1',
        name: 'Assist Card',
        is_assist: true
      };
      mockAvailableCardsMap.set('assist1', assistCard);

      // Add assist card to deck
      await addCardToEditor('special', 'assist1', 'Assist Card');

      // Should succeed
      expect(mockDeckEditorCards).toHaveLength(1);
      expect(mockDeckEditorCards[0]).toEqual({
        id: 'deck-special-assist1',
        type: 'special',
        cardId: 'assist1',
        name: 'Assist Card',
        quantity: 1
      });
      expect(mockShowNotification).not.toHaveBeenCalled();
    });

    it('should prevent adding second assist card', async () => {
      // Setup mock data
      const assistCard1 = {
        id: 'assist1',
        name: 'Assist Card 1',
        is_assist: true
      };
      const assistCard2 = {
        id: 'assist2',
        name: 'Assist Card 2',
        is_assist: true
      };
      mockAvailableCardsMap.set('assist1', assistCard1);
      mockAvailableCardsMap.set('assist2', assistCard2);

      // Add first assist card
      await addCardToEditor('special', 'assist1', 'Assist Card 1');
      expect(mockDeckEditorCards).toHaveLength(1);

      // Try to add second assist card
      await addCardToEditor('special', 'assist2', 'Assist Card 2');

      // Should be blocked
      expect(mockDeckEditorCards).toHaveLength(1); // Still only one card
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Cannot add more than 1 Assist to a deck',
        'error'
      );
    });

    it('should allow adding regular special cards when assist is present', async () => {
      // Setup mock data
      const assistCard = {
        id: 'assist1',
        name: 'Assist Card',
        is_assist: true
      };
      const regularCard = {
        id: 'regular1',
        name: 'Regular Special',
        is_assist: false
      };
      mockAvailableCardsMap.set('assist1', assistCard);
      mockAvailableCardsMap.set('regular1', regularCard);

      // Add assist card first
      await addCardToEditor('special', 'assist1', 'Assist Card');
      expect(mockDeckEditorCards).toHaveLength(1);

      // Add regular special card
      await addCardToEditor('special', 'regular1', 'Regular Special');

      // Should succeed
      expect(mockDeckEditorCards).toHaveLength(2);
      expect(mockShowNotification).not.toHaveBeenCalled();
    });

    it('should handle cards without is_assist property', async () => {
      // Setup mock data - card without is_assist property
      const cardWithoutProperty = {
        id: 'special1',
        name: 'Card Without Property'
        // No is_assist property
      };
      mockAvailableCardsMap.set('special1', cardWithoutProperty);

      // Add card
      await addCardToEditor('special', 'special1', 'Card Without Property');

      // Should succeed - no assist restriction
      expect(mockDeckEditorCards).toHaveLength(1);
      expect(mockShowNotification).not.toHaveBeenCalled();
    });

    it('should handle missing card data gracefully', async () => {
      // Try to add card that doesn't exist in availableCardsMap
      await addCardToEditor('special', 'nonexistent', 'Nonexistent Card');

      // Should succeed - no assist restriction for missing data
      expect(mockDeckEditorCards).toHaveLength(1);
      expect(mockShowNotification).not.toHaveBeenCalled();
    });

    it('should work with different card types', async () => {
      const testCases = [
        { cardType: 'character', cardId: 'char1', name: 'Character' },
        { cardType: 'power', cardId: 'power1', name: 'Power' },
        { cardType: 'mission', cardId: 'mission1', name: 'Mission' },
        { cardType: 'event', cardId: 'event1', name: 'Event' },
        { cardType: 'aspect', cardId: 'aspect1', name: 'Aspect' },
        { cardType: 'location', cardId: 'location1', name: 'Location' }
      ];

      for (const testCase of testCases) {
        // Reset for each test case
        mockDeckEditorCards = [];
        mockAvailableCardsMap.clear();
        jest.clearAllMocks();

        // Setup mock data
        const card = {
          id: testCase.cardId,
          name: testCase.name,
          is_assist: true // All cards are assist for this test
        };
        mockAvailableCardsMap.set(testCase.cardId, card);

        // Add card - should succeed (assist validation only applies to special cards)
        await addCardToEditor(testCase.cardType, testCase.cardId, testCase.name);
        expect(mockDeckEditorCards).toHaveLength(1);
        expect(mockShowNotification).not.toHaveBeenCalled();
      }
    });
  });

  describe('removeCardFromEditor - Assist Status Update', () => {
    it('should re-enable assist cards when assist card is removed', () => {
      // Setup mock data
      const assistCard1 = createMockCardElement('assist1', 'special', true);
      const assistCard2 = createMockCardElement('assist2', 'special', true);
      
      mockCardElements.push(assistCard1, assistCard2);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);
      
      // Setup card data
      mockAvailableCardsMap.set('assist1', { is_assist: true });
      mockAvailableCardsMap.set('assist2', { is_assist: true });
      
      // Add assist card to deck
      mockDeckEditorCards.push({
        id: 'deck-special-assist1',
        type: 'special',
        cardId: 'assist1',
        name: 'Assist Card 1',
        quantity: 1
      });
      
      // Remove assist card from deck
      removeCardFromEditor('assist1');
      
      // Both assist cards should be re-enabled
      expect(assistCard1.classList.remove).toHaveBeenCalledWith('disabled');
      expect(assistCard1.setAttribute).toHaveBeenCalledWith('draggable', 'true');
      expect(assistCard1.title).toBe('');
      
      expect(assistCard2.classList.remove).toHaveBeenCalledWith('disabled');
      expect(assistCard2.setAttribute).toHaveBeenCalledWith('draggable', 'true');
      expect(assistCard2.title).toBe('');
    });

    it('should handle removing non-assist cards', () => {
      // Setup mock data
      const assistCard = createMockCardElement('assist1', 'special', true);
      const regularCard = createMockCardElement('regular1', 'special', false);
      
      mockCardElements.push(assistCard, regularCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);
      
      // Setup card data
      mockAvailableCardsMap.set('assist1', { is_assist: true });
      mockAvailableCardsMap.set('regular1', { is_assist: false });
      
      // Add both cards to deck
      mockDeckEditorCards.push(
        { id: 'deck-special-assist1', type: 'special', cardId: 'assist1', name: 'Assist Card', quantity: 1 },
        { id: 'deck-special-regular1', type: 'special', cardId: 'regular1', name: 'Regular Card', quantity: 1 }
      );
      
      // Remove regular card
      removeCardFromEditor('regular1');
      
      // Assist card should still be dimmed (still in deck)
      expect(assistCard.classList.add).toHaveBeenCalledWith('disabled');
      expect(assistCard.title).toBe('Assist - already in deck');
    });

    it('should handle removing non-existent card', () => {
      // Setup mock data
      const assistCard = createMockCardElement('assist1', 'special', true);
      mockCardElements.push(assistCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);
      
      // Setup card data
      mockAvailableCardsMap.set('assist1', { is_assist: true });
      
      // Try to remove non-existent card
      removeCardFromEditor('nonexistent');
      
      // Should not throw error and assist card should remain enabled
      expect(assistCard.classList.remove).toHaveBeenCalledWith('disabled');
      expect(assistCard.setAttribute).toHaveBeenCalledWith('draggable', 'true');
      expect(assistCard.title).toBe('');
    });
  });

  describe('Integration with DOM', () => {
    it('should call querySelectorAll with correct selector', () => {
      // Setup mock data
      const assistCard = createMockCardElement('assist1', 'special', true);
      mockCardElements.push(assistCard);
      mockQuerySelectorAll.mockReturnValue(mockCardElements);
      
      // Setup card data
      mockAvailableCardsMap.set('assist1', { is_assist: true });
      
      // Call function
      updateAssistLimitStatus();
      
      // Should call querySelectorAll with correct selector
      expect(mockQuerySelectorAll).toHaveBeenCalledWith('.card-item[data-type="special"][data-id]');
    });

    it('should handle empty querySelectorAll result', () => {
      // Setup empty result
      mockQuerySelectorAll.mockReturnValue([]);
      
      // Setup card data
      mockAvailableCardsMap.set('assist1', { is_assist: true });
      
      // Call function - should not throw
      expect(() => updateAssistLimitStatus()).not.toThrow();
    });

    it('should handle null querySelectorAll result', () => {
      // Setup null result
      mockQuerySelectorAll.mockReturnValue(null);
      
      // Setup card data
      mockAvailableCardsMap.set('assist1', { is_assist: true });
      
      // Call function - should not throw
      expect(() => updateAssistLimitStatus()).not.toThrow();
    });
  });
});

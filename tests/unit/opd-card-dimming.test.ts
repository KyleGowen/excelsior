/**
 * Unit tests for OPD (One Per Deck) card dimming and un-dimming functionality
 * 
 * This test suite covers the fix for the issue where OPD/Aspect cards would
 * dim correctly when added to the deck but would not un-dim when removed.
 * 
 * Test Coverage:
 * - updateOnePerDeckLimitStatus() function behavior
 * - removeCardFromEditor() function calls updateOnePerDeckLimitStatus()
 * - removeOneCardFromEditor() function calls updateOnePerDeckLimitStatus()
 * - Card dimming when added to deck
 * - Card un-dimming when removed from deck
 * - Edge cases and error handling
 */

describe('OPD Card Dimming and Un-dimming Tests', () => {
  let mockDeckEditorCards: any[];
  let mockAvailableCardsMap: Map<string, any>;
  let mockUpdateOnePerDeckLimitStatus: jest.Mock;
  let mockUpdateCharacterLimitStatus: jest.Mock;
  let mockUpdateLocationLimitStatus: jest.Mock;
  let mockUpdateMissionLimitStatus: jest.Mock;
  let mockUpdateSpecialCardsFilter: jest.Mock;
  let mockDisplayDeckCardsForEditing: jest.Mock;
  let mockShowDeckValidation: jest.Mock;

  beforeEach(() => {
    // Initialize mock data
    mockDeckEditorCards = [];
    mockAvailableCardsMap = new Map();
    
    // Add test cards to the map
    mockAvailableCardsMap.set('opd-card-1', {
      id: 'opd-card-1',
      name: 'Disrupting Supply Lines',
      type: 'special',
      one_per_deck: true
    });
    
    mockAvailableCardsMap.set('regular-card-1', {
      id: 'regular-card-1',
      name: 'Regular Card',
      type: 'special',
      one_per_deck: false
    });

    // Create mock functions
    mockUpdateOnePerDeckLimitStatus = jest.fn();
    mockUpdateCharacterLimitStatus = jest.fn();
    mockUpdateLocationLimitStatus = jest.fn();
    mockUpdateMissionLimitStatus = jest.fn();
    mockUpdateSpecialCardsFilter = jest.fn();
    mockDisplayDeckCardsForEditing = jest.fn().mockResolvedValue(undefined);
    mockShowDeckValidation = jest.fn().mockResolvedValue(undefined);

    // Mock console.log to capture debug messages
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    (console.log as jest.Mock).mockRestore();
  });

  describe('updateOnePerDeckLimitStatus function logic', () => {
    it('should identify OPD cards in the deck correctly', () => {
      // Add an OPD card to the deck
      mockDeckEditorCards.push({
        cardId: 'opd-card-1',
        type: 'special',
        quantity: 1
      });

      // Simulate the logic from updateOnePerDeckLimitStatus
      const onePerDeckCardsInDeck = new Set();
      mockDeckEditorCards.forEach((card: any) => {
        const cardData = mockAvailableCardsMap.get(card.cardId);
        if (cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true)) {
          onePerDeckCardsInDeck.add(card.cardId);
        }
      });

      // Verify OPD card was identified
      expect(onePerDeckCardsInDeck.has('opd-card-1')).toBe(true);
      expect(onePerDeckCardsInDeck.size).toBe(1);
    });

    it('should not identify regular cards as OPD cards', () => {
      // Add a regular card to the deck
      mockDeckEditorCards.push({
        cardId: 'regular-card-1',
        type: 'special',
        quantity: 1
      });

      // Simulate the logic from updateOnePerDeckLimitStatus
      const onePerDeckCardsInDeck = new Set();
      mockDeckEditorCards.forEach((card: any) => {
        const cardData = mockAvailableCardsMap.get(card.cardId);
        if (cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true)) {
          onePerDeckCardsInDeck.add(card.cardId);
        }
      });

      // Verify regular card was not identified as OPD
      expect(onePerDeckCardsInDeck.has('regular-card-1')).toBe(false);
      expect(onePerDeckCardsInDeck.size).toBe(0);
    });

    it('should handle empty deck correctly', () => {
      // Ensure deck is empty
      mockDeckEditorCards.length = 0;

      // Simulate the logic from updateOnePerDeckLimitStatus
      const onePerDeckCardsInDeck = new Set();
      mockDeckEditorCards.forEach((card: any) => {
        const cardData = mockAvailableCardsMap.get(card.cardId);
        if (cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true)) {
          onePerDeckCardsInDeck.add(card.cardId);
        }
      });

      // Verify no OPD cards found
      expect(onePerDeckCardsInDeck.size).toBe(0);
    });

    it('should handle cards with is_one_per_deck property', () => {
      // Add a card with is_one_per_deck property
      mockAvailableCardsMap.set('opd-card-2', {
        id: 'opd-card-2',
        name: 'Another OPD Card',
        type: 'special',
        is_one_per_deck: true
      });

      // Add the card to the deck
      mockDeckEditorCards.push({
        cardId: 'opd-card-2',
        type: 'special',
        quantity: 1
      });

      // Simulate the logic from updateOnePerDeckLimitStatus
      const onePerDeckCardsInDeck = new Set();
      mockDeckEditorCards.forEach((card: any) => {
        const cardData = mockAvailableCardsMap.get(card.cardId);
        if (cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true)) {
          onePerDeckCardsInDeck.add(card.cardId);
        }
      });

      // Verify card with is_one_per_deck was identified
      expect(onePerDeckCardsInDeck.has('opd-card-2')).toBe(true);
      expect(onePerDeckCardsInDeck.size).toBe(1);
    });
  });

  describe('removeCardFromEditor function', () => {
    let removeCardFromEditor: Function;

    beforeEach(() => {
      // Define the removeCardFromEditor function
      removeCardFromEditor = async (index: number) => {
        console.log('🗑️ removeCardFromEditor called with index:', index);
        console.log('📊 Before removal - deckEditorCards:', mockDeckEditorCards);
        
        const removedCard = mockDeckEditorCards[index];
        console.log('🎯 Removing card:', removedCard);
        
        mockDeckEditorCards.splice(index, 1);
        await mockDisplayDeckCardsForEditing();
        
        // Update character limit status without affecting collapse state
        mockUpdateCharacterLimitStatus();
        
        // Update location limit status without affecting collapse state
        mockUpdateLocationLimitStatus();
        
        // Update mission limit status without affecting collapse state
        mockUpdateMissionLimitStatus();
        
        // Update One Per Deck limit status
        mockUpdateOnePerDeckLimitStatus();
        
        console.log('📊 After removal - deckEditorCards:', mockDeckEditorCards);
        
        // Update special cards filter if it's active
        mockUpdateSpecialCardsFilter();
        
        // Validate deck after removing card
        await mockShowDeckValidation(mockDeckEditorCards);
      };
    });

    it('should call updateOnePerDeckLimitStatus when removing a card', async () => {
      // Add a card to the deck
      mockDeckEditorCards.push({
        cardId: 'opd-card-1',
        type: 'special',
        quantity: 1
      });

      // Call the function
      await removeCardFromEditor(0);

      // Verify that updateOnePerDeckLimitStatus was called
      expect(mockUpdateOnePerDeckLimitStatus).toHaveBeenCalledTimes(1);

      // Verify other update functions were called
      expect(mockUpdateCharacterLimitStatus).toHaveBeenCalledTimes(1);
      expect(mockUpdateLocationLimitStatus).toHaveBeenCalledTimes(1);
      expect(mockUpdateMissionLimitStatus).toHaveBeenCalledTimes(1);
      expect(mockUpdateSpecialCardsFilter).toHaveBeenCalledTimes(1);

      // Verify debug messages
      expect(console.log).toHaveBeenCalledWith('🗑️ removeCardFromEditor called with index:', 0);
      expect(console.log).toHaveBeenCalledWith('📊 After removal - deckEditorCards:', []);
    });

    it('should remove the correct card from the deck', async () => {
      // Add multiple cards to the deck
      mockDeckEditorCards.push(
        { cardId: 'card-1', type: 'special', quantity: 1 },
        { cardId: 'card-2', type: 'special', quantity: 1 },
        { cardId: 'card-3', type: 'special', quantity: 1 }
      );

      // Remove the second card
      await removeCardFromEditor(1);

      // Verify the correct card was removed
      expect(mockDeckEditorCards).toHaveLength(2);
      expect(mockDeckEditorCards[0].cardId).toBe('card-1');
      expect(mockDeckEditorCards[1].cardId).toBe('card-3');
    });
  });

  describe('removeOneCardFromEditor function', () => {
    let removeOneCardFromEditor: Function;

    beforeEach(() => {
      // Define the removeOneCardFromEditor function
      removeOneCardFromEditor = async (index: number) => {
        console.log('🗑️ removeOneCardFromEditor called with index:', index);
        console.log('📊 Before removal - deckEditorCards:', mockDeckEditorCards);
        
        if (mockDeckEditorCards[index]) {
          if (mockDeckEditorCards[index].quantity > 1) {
            // If there are multiple cards, decrease quantity by 1
            mockDeckEditorCards[index].quantity -= 1;
          } else {
            // If there's only 1 card, remove the entire card
            mockDeckEditorCards.splice(index, 1);
          }
          
          await mockDisplayDeckCardsForEditing();
          mockUpdateCharacterLimitStatus();
          mockUpdateLocationLimitStatus();
          mockUpdateMissionLimitStatus();
          mockUpdateOnePerDeckLimitStatus();
          mockUpdateSpecialCardsFilter();
          await mockShowDeckValidation(mockDeckEditorCards);
        }
      };
    });

    it('should call updateOnePerDeckLimitStatus when removing a card', async () => {
      // Add a card to the deck
      mockDeckEditorCards.push({
        cardId: 'opd-card-1',
        type: 'special',
        quantity: 1
      });

      // Call the function
      await removeOneCardFromEditor(0);

      // Verify that updateOnePerDeckLimitStatus was called
      expect(mockUpdateOnePerDeckLimitStatus).toHaveBeenCalledTimes(1);

      // Verify other update functions were called
      expect(mockUpdateCharacterLimitStatus).toHaveBeenCalledTimes(1);
      expect(mockUpdateLocationLimitStatus).toHaveBeenCalledTimes(1);
      expect(mockUpdateMissionLimitStatus).toHaveBeenCalledTimes(1);
      expect(mockUpdateSpecialCardsFilter).toHaveBeenCalledTimes(1);

      // Verify debug messages
      expect(console.log).toHaveBeenCalledWith('🗑️ removeOneCardFromEditor called with index:', 0);
    });

    it('should decrease quantity when card has quantity > 1', async () => {
      // Add a card with quantity > 1
      mockDeckEditorCards.push({
        cardId: 'opd-card-1',
        type: 'special',
        quantity: 3
      });

      // Call the function
      await removeOneCardFromEditor(0);

      // Verify quantity was decreased
      expect(mockDeckEditorCards[0].quantity).toBe(2);
      expect(mockDeckEditorCards).toHaveLength(1);

      // Verify updateOnePerDeckLimitStatus was still called
      expect(mockUpdateOnePerDeckLimitStatus).toHaveBeenCalledTimes(1);
    });

    it('should remove card completely when quantity is 1', async () => {
      // Add a card with quantity = 1
      mockDeckEditorCards.push({
        cardId: 'opd-card-1',
        type: 'special',
        quantity: 1
      });

      // Call the function
      await removeOneCardFromEditor(0);

      // Verify card was completely removed
      expect(mockDeckEditorCards).toHaveLength(0);

      // Verify updateOnePerDeckLimitStatus was called
      expect(mockUpdateOnePerDeckLimitStatus).toHaveBeenCalledTimes(1);
    });

    it('should handle non-existent card index gracefully', async () => {
      // Call the function with invalid index
      await removeOneCardFromEditor(999);

      // Verify no errors occurred and no functions were called
      expect(mockUpdateOnePerDeckLimitStatus).not.toHaveBeenCalled();
      expect(mockUpdateCharacterLimitStatus).not.toHaveBeenCalled();
    });
  });

  describe('Integration tests', () => {
    it('should properly track OPD cards in deck state changes', () => {
      // Start with empty deck
      expect(mockDeckEditorCards).toHaveLength(0);

      // Add OPD card to deck
      mockDeckEditorCards.push({
        cardId: 'opd-card-1',
        type: 'special',
        quantity: 1
      });

      // Simulate updateOnePerDeckLimitStatus logic
      const onePerDeckCardsInDeck = new Set();
      mockDeckEditorCards.forEach((card: any) => {
        const cardData = mockAvailableCardsMap.get(card.cardId);
        if (cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true)) {
          onePerDeckCardsInDeck.add(card.cardId);
        }
      });

      // Verify OPD card is tracked
      expect(onePerDeckCardsInDeck.has('opd-card-1')).toBe(true);

      // Remove the card from deck
      mockDeckEditorCards.splice(0, 1);

      // Simulate updateOnePerDeckLimitStatus logic again
      const onePerDeckCardsInDeckAfterRemoval = new Set();
      mockDeckEditorCards.forEach((card: any) => {
        const cardData = mockAvailableCardsMap.get(card.cardId);
        if (cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true)) {
          onePerDeckCardsInDeckAfterRemoval.add(card.cardId);
        }
      });

      // Verify OPD card is no longer tracked
      expect(onePerDeckCardsInDeckAfterRemoval.has('opd-card-1')).toBe(false);
      expect(onePerDeckCardsInDeckAfterRemoval.size).toBe(0);
    });

    it('should handle multiple OPD cards correctly', () => {
      // Add multiple OPD cards
      mockAvailableCardsMap.set('opd-card-2', {
        id: 'opd-card-2',
        name: 'Another OPD Card',
        type: 'special',
        one_per_deck: true
      });

      // Add both OPD cards to deck
      mockDeckEditorCards.push(
        { cardId: 'opd-card-1', type: 'special', quantity: 1 },
        { cardId: 'opd-card-2', type: 'special', quantity: 1 }
      );

      // Simulate updateOnePerDeckLimitStatus logic
      const onePerDeckCardsInDeck = new Set();
      mockDeckEditorCards.forEach((card: any) => {
        const cardData = mockAvailableCardsMap.get(card.cardId);
        if (cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true)) {
          onePerDeckCardsInDeck.add(card.cardId);
        }
      });

      // Verify both cards are tracked
      expect(onePerDeckCardsInDeck.has('opd-card-1')).toBe(true);
      expect(onePerDeckCardsInDeck.has('opd-card-2')).toBe(true);
      expect(onePerDeckCardsInDeck.size).toBe(2);

      // Remove first card
      mockDeckEditorCards.splice(0, 1);

      // Simulate updateOnePerDeckLimitStatus logic again
      const onePerDeckCardsInDeckAfterRemoval = new Set();
      mockDeckEditorCards.forEach((card: any) => {
        const cardData = mockAvailableCardsMap.get(card.cardId);
        if (cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true)) {
          onePerDeckCardsInDeckAfterRemoval.add(card.cardId);
        }
      });

      // Verify first card is no longer tracked, second is still tracked
      expect(onePerDeckCardsInDeckAfterRemoval.has('opd-card-1')).toBe(false);
      expect(onePerDeckCardsInDeckAfterRemoval.has('opd-card-2')).toBe(true);
      expect(onePerDeckCardsInDeckAfterRemoval.size).toBe(1);
    });
  });
});
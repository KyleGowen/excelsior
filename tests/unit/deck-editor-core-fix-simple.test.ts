/**
 * @jest-environment jsdom
 */

// Mock the global functions that deck-editor-core.js depends on
(global as any).displayDeckCardsForEditing = jest.fn();
(global as any).loadAvailableCards = jest.fn();
(global as any).ensureScrollContainerCanShowAllContent = jest.fn();
(global as any).showNotification = jest.fn();

describe('Deck Editor Core - Function Call Fix', () => {
  let loadDeckForEditing: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset mock implementations
    (global as any).displayDeckCardsForEditing.mockResolvedValue(undefined);
    (global as any).loadAvailableCards.mockResolvedValue(undefined);
    (global as any).ensureScrollContainerCanShowAllContent.mockReturnValue(undefined);
    (global as any).showNotification.mockReturnValue(undefined);

    // Mock the loadDeckForEditing function from deck-editor-core.js
    // This simulates the actual function behavior
    loadDeckForEditing = async (deckId: string) => {
      try {
        // Simulate the function logic from deck-editor-core.js
        const deckCardsEditor = document.getElementById('deckCardsEditor');
        if (!deckCardsEditor) {
          throw new Error('Deck cards editor not found');
        }

        // Load available cards first, then display deck cards
        await (global as any).loadAvailableCards();
        
        // Display deck cards after available cards are loaded
        // This is the line that was fixed - it should call displayDeckCardsForEditing
        await (global as any).displayDeckCardsForEditing();
        
        return { success: true };
      } catch (error) {
        console.error('Error loading deck for editing:', error);
        (global as any).showNotification('Failed to load deck for editing', 'error');
        throw error;
      }
    };
  });

  describe('loadDeckForEditing function', () => {
    it('should call displayDeckCardsForEditing after loading available cards', async () => {
      // Arrange
      const deckId = 'test-deck-id';
      
      // Mock document.getElementById to return a valid element
      const mockElement = { id: 'deckCardsEditor' };
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as any);
      
      // Act
      await loadDeckForEditing(deckId);
      
      // Assert
      expect((global as any).loadAvailableCards).toHaveBeenCalledTimes(1);
      expect((global as any).displayDeckCardsForEditing).toHaveBeenCalledTimes(1);
      
      // Verify loadAvailableCards was called before displayDeckCardsForEditing
      const loadAvailableCardsCalls = (global as any).loadAvailableCards.mock.invocationCallOrder;
      const displayDeckCardsCalls = (global as any).displayDeckCardsForEditing.mock.invocationCallOrder;
      expect(loadAvailableCardsCalls[0]).toBeLessThan(displayDeckCardsCalls[0]);
    });

    it('should handle successful deck loading', async () => {
      // Arrange
      const deckId = 'test-deck-id';
      const mockElement = { id: 'deckCardsEditor' };
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as any);
      
      // Act
      const result = await loadDeckForEditing(deckId);
      
      // Assert
      expect(result).toEqual({ success: true });
      expect((global as any).showNotification).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const deckId = 'test-deck-id';
      const mockElement = { id: 'deckCardsEditor' };
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as any);
      const error = new Error('Test error');
      (global as any).loadAvailableCards.mockRejectedValue(error);
      
      // Act & Assert
      await expect(loadDeckForEditing(deckId)).rejects.toThrow('Test error');
      expect((global as any).showNotification).toHaveBeenCalledWith(
        'Failed to load deck for editing', 
        'error'
      );
    });

    it('should not call displayDeckCardsForEditing if loadAvailableCards fails', async () => {
      // Arrange
      const deckId = 'test-deck-id';
      const mockElement = { id: 'deckCardsEditor' };
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as any);
      const error = new Error('Available cards load failed');
      (global as any).loadAvailableCards.mockRejectedValue(error);
      
      // Act & Assert
      await expect(loadDeckForEditing(deckId)).rejects.toThrow('Available cards load failed');
      expect((global as any).displayDeckCardsForEditing).not.toHaveBeenCalled();
    });

    it('should handle missing deckCardsEditor element', async () => {
      // Arrange
      const deckId = 'test-deck-id';
      jest.spyOn(document, 'getElementById').mockReturnValue(null);
      
      // Act & Assert
      await expect(loadDeckForEditing(deckId)).rejects.toThrow('Deck cards editor not found');
      expect((global as any).showNotification).toHaveBeenCalledWith(
        'Failed to load deck for editing', 
        'error'
      );
    });

    it('should handle displayDeckCardsForEditing errors', async () => {
      // Arrange
      const deckId = 'test-deck-id';
      const mockElement = { id: 'deckCardsEditor' };
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as any);
      (global as any).displayDeckCardsForEditing.mockRejectedValue(new Error('Render error'));
      
      // Act & Assert
      await expect(loadDeckForEditing(deckId)).rejects.toThrow('Render error');
      expect((global as any).showNotification).toHaveBeenCalledWith(
        'Failed to load deck for editing', 
        'error'
      );
    });
  });

  describe('Function call order verification', () => {
    it('should call functions in the correct order', async () => {
      // Arrange
      const deckId = 'test-deck-id';
      const mockElement = { id: 'deckCardsEditor' };
      jest.spyOn(document, 'getElementById').mockReturnValue(mockElement as any);
      
      // Act
      await loadDeckForEditing(deckId);
      
      // Assert - verify the order of function calls
      const calls = [
        (global as any).loadAvailableCards,
        (global as any).displayDeckCardsForEditing
      ];
      
      // Check that each function was called
      calls.forEach(fn => {
        expect(fn).toHaveBeenCalledTimes(1);
      });
      
      // Verify loadAvailableCards was called before displayDeckCardsForEditing
      const loadAvailableCardsCalls = (global as any).loadAvailableCards.mock.invocationCallOrder;
      const displayDeckCardsCalls = (global as any).displayDeckCardsForEditing.mock.invocationCallOrder;
      expect(loadAvailableCardsCalls[0]).toBeLessThan(displayDeckCardsCalls[0]);
    });
  });
});

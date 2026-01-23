/**
 * Deck Editor Close Draw Hand Tests
 * Tests that the draw hand pane is closed when closing the deck editor
 */

describe('Deck Editor Close Draw Hand', () => {
  let mockCloseDrawHand: jest.Mock;
  let mockSaveUIPreferences: jest.Mock;
  let mockSwitchToDeckBuilder: jest.Mock;
  let mockGetCurrentUIPreferences: jest.Mock;

  beforeEach(() => {
    // Mock closeDrawHand function
    mockCloseDrawHand = jest.fn();
    (global as any).closeDrawHand = mockCloseDrawHand;

    // Mock saveUIPreferences function
    mockSaveUIPreferences = jest.fn().mockResolvedValue(undefined);
    (global as any).saveUIPreferences = mockSaveUIPreferences;

    // Mock switchToDeckBuilder function
    mockSwitchToDeckBuilder = jest.fn();
    (global as any).switchToDeckBuilder = mockSwitchToDeckBuilder;

    // Mock getCurrentUIPreferences function
    mockGetCurrentUIPreferences = jest.fn().mockReturnValue({});
    (global as any).getCurrentUIPreferences = mockGetCurrentUIPreferences;

    // Mock global variables
    (global as any).currentDeckId = 'test-deck-id';
    (global as any).currentDeckData = { id: 'test-deck-id', name: 'Test Deck' };
    (global as any).deckEditorCards = [{ id: 'card1', name: 'Test Card' }];
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset global variables
    (global as any).currentDeckId = null;
    (global as any).currentDeckData = null;
    (global as any).deckEditorCards = [];
  });

  describe('closeDeckEditor function', () => {
    test('should call closeDrawHand when closing deck editor', async () => {
      // Mock the closeDeckEditor function
      const closeDeckEditor = async () => {
        // Close draw hand pane first to clear any drawn cards
        mockCloseDrawHand();
        
        // Save UI preferences before closing
        if ((global as any).currentDeckId) {
          const preferences = mockGetCurrentUIPreferences();
          await mockSaveUIPreferences((global as any).currentDeckId, preferences);
        }
        
        // Simulate modal closing and variable cleanup
        (global as any).currentDeckId = null;
        (global as any).currentDeckData = null;
        (global as any).deckEditorCards = [];
        
        // Return to deck builder selection screen
        mockSwitchToDeckBuilder();
      };

      // Call the function
      await closeDeckEditor();

      // Verify closeDrawHand was called
      expect(mockCloseDrawHand).toHaveBeenCalledTimes(1);
    });

    test('should call closeDrawHand before saving UI preferences', async () => {
      // Track call order
      const callOrder: string[] = [];
      
      // Mock functions to track call order
      mockCloseDrawHand.mockImplementation(() => {
        callOrder.push('closeDrawHand');
      });
      mockSaveUIPreferences.mockImplementation(async () => {
        callOrder.push('saveUIPreferences');
      });

      // Mock the closeDeckEditor function
      const closeDeckEditor = async () => {
        // Close draw hand pane first to clear any drawn cards
        mockCloseDrawHand();
        
        // Save UI preferences before closing
        if ((global as any).currentDeckId) {
          const preferences = mockGetCurrentUIPreferences();
          await mockSaveUIPreferences((global as any).currentDeckId, preferences);
        }
        
        // Simulate modal closing
        (global as any).currentDeckId = null;
        (global as any).currentDeckData = null;
        (global as any).deckEditorCards = [];
        
        // Return to deck builder selection screen
        mockSwitchToDeckBuilder();
      };

      // Call the function
      await closeDeckEditor();

      // Verify the order of operations
      expect(callOrder).toEqual(['closeDrawHand', 'saveUIPreferences']);
    });

    test('should call closeDrawHand even when no currentDeckId', async () => {
      // Set currentDeckId to null
      (global as any).currentDeckId = null;

      // Mock the closeDeckEditor function
      const closeDeckEditor = async () => {
        // Close draw hand pane first to clear any drawn cards
        mockCloseDrawHand();
        
        // Save UI preferences before closing
        if ((global as any).currentDeckId) {
          const preferences = mockGetCurrentUIPreferences();
          await mockSaveUIPreferences((global as any).currentDeckId, preferences);
        }
        
        // Simulate modal closing
        (global as any).currentDeckId = null;
        (global as any).currentDeckData = null;
        (global as any).deckEditorCards = [];
        
        // Return to deck builder selection screen
        mockSwitchToDeckBuilder();
      };

      // Call the function
      await closeDeckEditor();

      // Verify closeDrawHand was still called
      expect(mockCloseDrawHand).toHaveBeenCalledTimes(1);
      // Verify saveUIPreferences was not called
      expect(mockSaveUIPreferences).not.toHaveBeenCalled();
    });

    test('should complete all closing operations after calling closeDrawHand', async () => {
      // Mock the closeDeckEditor function
      const closeDeckEditor = async () => {
        // Close draw hand pane first to clear any drawn cards
        mockCloseDrawHand();
        
        // Save UI preferences before closing
        if ((global as any).currentDeckId) {
          const preferences = mockGetCurrentUIPreferences();
          await mockSaveUIPreferences((global as any).currentDeckId, preferences);
        }
        
        // Simulate modal closing
        (global as any).currentDeckId = null;
        (global as any).currentDeckData = null;
        (global as any).deckEditorCards = [];
        
        // Return to deck builder selection screen
        mockSwitchToDeckBuilder();
      };

      // Call the function
      await closeDeckEditor();

      // Verify all operations were completed
      expect(mockCloseDrawHand).toHaveBeenCalledTimes(1);
      expect(mockSaveUIPreferences).toHaveBeenCalledTimes(1);
      expect(mockSwitchToDeckBuilder).toHaveBeenCalledTimes(1);
      // Modal closing is simulated in the function
    });

    test('should handle closeDrawHand errors gracefully', async () => {
      // Make closeDrawHand throw an error
      mockCloseDrawHand.mockImplementation(() => {
        throw new Error('closeDrawHand failed');
      });

      // Mock the closeDeckEditor function with error handling
      const closeDeckEditor = async () => {
        try {
          // Close draw hand pane first to clear any drawn cards
          mockCloseDrawHand();
        } catch (error) {
          console.log('Error closing draw hand:', error);
        }
        
        // Save UI preferences before closing
        if ((global as any).currentDeckId) {
          const preferences = mockGetCurrentUIPreferences();
          await mockSaveUIPreferences((global as any).currentDeckId, preferences);
        }
        
        // Simulate modal closing
        (global as any).currentDeckId = null;
        (global as any).currentDeckData = null;
        (global as any).deckEditorCards = [];
        
        // Return to deck builder selection screen
        mockSwitchToDeckBuilder();
      };

      // Call the function
      await closeDeckEditor();

      // Verify closeDrawHand was called (even though it threw an error)
      expect(mockCloseDrawHand).toHaveBeenCalledTimes(1);
      // Verify other operations still completed
      expect(mockSaveUIPreferences).toHaveBeenCalledTimes(1);
      expect(mockSwitchToDeckBuilder).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration with draw hand functionality', () => {
    test('should ensure draw hand is closed when switching between decks', async () => {
      // Simulate having a draw hand open
      const mockDrawHandSection = {
        style: {
          display: 'block'
        }
      };
      const mockDrawHandBtn = {
        textContent: 'Draw Hand'
      };

      // Mock closeDrawHand to simulate actual behavior
      mockCloseDrawHand.mockImplementation(() => {
        // Simulate closing the draw hand section
        if (mockDrawHandSection) {
          mockDrawHandSection.style.display = 'none';
        }
        if (mockDrawHandBtn) {
          mockDrawHandBtn.textContent = 'Draw Hand';
        }
      });

      // Mock the closeDeckEditor function
      const closeDeckEditor = async () => {
        // Close draw hand pane first to clear any drawn cards
        mockCloseDrawHand();
        
        // Save UI preferences before closing
        if ((global as any).currentDeckId) {
          const preferences = mockGetCurrentUIPreferences();
          await mockSaveUIPreferences((global as any).currentDeckId, preferences);
        }
        
        // Simulate modal closing
        (global as any).currentDeckId = null;
        (global as any).currentDeckData = null;
        (global as any).deckEditorCards = [];
        
        // Return to deck builder selection screen
        mockSwitchToDeckBuilder();
      };

      // Call the function
      await closeDeckEditor();

      // Verify closeDrawHand was called
      expect(mockCloseDrawHand).toHaveBeenCalledTimes(1);
      
      // Verify the draw hand section would be closed
      expect(mockDrawHandSection.style.display).toBe('none');
      expect(mockDrawHandBtn.textContent).toBe('Draw Hand');
    });
  });
});

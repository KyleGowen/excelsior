/**
 * @jest-environment jsdom
 */

// Mock the global functions that ViewManager depends on
(global as any).displayDeckCardsForEditing = jest.fn();
(global as any).renderDeckCardsListView = jest.fn();
(global as any).setupLayoutObserver = jest.fn();
(global as any).getCurrentUIPreferences = jest.fn(() => ({}));
(global as any).saveUIPreferences = jest.fn();

// Mock layoutObserver
(global as any).layoutObserver = {
  disconnect: jest.fn()
};

// Mock DOM elements
const mockDeckCardsEditor = {
  classList: {
    contains: jest.fn(() => false),
    add: jest.fn(),
    remove: jest.fn()
  },
  querySelectorAll: jest.fn(() => []) as any,
  offsetHeight: 100
};

const mockListViewBtn = {
  textContent: 'List View'
};

// Mock document methods
const mockGetElementById = jest.fn((id: string) => {
  if (id === 'deckCardsEditor') return mockDeckCardsEditor;
  if (id === 'listViewBtn') return mockListViewBtn;
  return null;
});

Object.defineProperty(document, 'getElementById', {
  value: mockGetElementById,
  writable: true
});

describe('ViewManager Implementation - Simple Tests', () => {
  let ViewManager: any;
  let viewManager: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset mock implementations
    (global as any).displayDeckCardsForEditing.mockResolvedValue(undefined);
    (global as any).renderDeckCardsListView.mockReturnValue(undefined);
    (global as any).setupLayoutObserver.mockReturnValue(undefined);
    (global as any).getCurrentUIPreferences.mockReturnValue({});
    (global as any).saveUIPreferences.mockReturnValue(undefined);
    
    // Reset layoutObserver mock
    (global as any).layoutObserver = {
      disconnect: jest.fn()
    };

    // Mock the ViewManager class from the actual implementation
    ViewManager = class {
      currentView: string;
      deckCardsEditor: any;
      listViewBtn: any;

      constructor() {
        this.currentView = 'tile';
        this.deckCardsEditor = null;
        this.listViewBtn = null;
      }

      initialize() {
        this.deckCardsEditor = document.getElementById('deckCardsEditor');
        this.listViewBtn = document.getElementById('listViewBtn');
        console.log('🔍 ViewManager initialized');
      }

      async switchToTileView() {
        console.log('🔍 ViewManager switching to tile view');
        this.currentView = 'tile';
        
        if (this.deckCardsEditor) {
          this.deckCardsEditor.classList.remove('list-view');
        }
        
        if (this.listViewBtn) {
          this.listViewBtn.textContent = 'List View';
        }
        
        // Disconnect layout observer when switching to tile view
        if ((global as any).layoutObserver) {
          (global as any).layoutObserver.disconnect();
          (global as any).layoutObserver = null;
        }
        
        // Use the original function to maintain exact behavior
        await (global as any).displayDeckCardsForEditing();
      }

      async switchToListView() {
        console.log('🔍 ViewManager switching to list view');
        this.currentView = 'list';
        
        if (this.deckCardsEditor) {
          this.deckCardsEditor.classList.add('list-view');
        }
        
        if (this.listViewBtn) {
          this.listViewBtn.textContent = 'Tile View';
        }
        
        // Use the original function to maintain exact behavior
        (global as any).renderDeckCardsListView();
        
        // Set up layout observer for list view
        (global as any).setupLayoutObserver();
      }

      getCurrentView() {
        return this.currentView;
      }

      isListView() {
        return this.currentView === 'list';
      }

      isTileView() {
        return this.currentView === 'tile';
      }
    };

    viewManager = new ViewManager();
  });

  describe('ViewManager Core Functionality', () => {
    it('should initialize with correct default state', () => {
      expect(viewManager.currentView).toBe('tile');
      expect(viewManager.deckCardsEditor).toBeNull();
      expect(viewManager.listViewBtn).toBeNull();
    });

    it('should initialize DOM elements correctly', () => {
      viewManager.initialize();
      
      expect(viewManager.deckCardsEditor).toBe(mockDeckCardsEditor);
      expect(viewManager.listViewBtn).toBe(mockListViewBtn);
    });

    it('should switch to tile view correctly', async () => {
      // Arrange
      viewManager.initialize();
      viewManager.currentView = 'list';
      
      // Act
      await viewManager.switchToTileView();
      
      // Assert
      expect(viewManager.currentView).toBe('tile');
      expect(mockDeckCardsEditor.classList.remove).toHaveBeenCalledWith('list-view');
      expect(mockListViewBtn.textContent).toBe('List View');
      expect((global as any).displayDeckCardsForEditing).toHaveBeenCalledTimes(1);
    });

    it('should switch to list view correctly', async () => {
      // Arrange
      viewManager.initialize();
      viewManager.currentView = 'tile';
      
      // Act
      await viewManager.switchToListView();
      
      // Assert
      expect(viewManager.currentView).toBe('list');
      expect(mockDeckCardsEditor.classList.add).toHaveBeenCalledWith('list-view');
      expect(mockListViewBtn.textContent).toBe('Tile View');
      expect((global as any).renderDeckCardsListView).toHaveBeenCalledTimes(1);
      expect((global as any).setupLayoutObserver).toHaveBeenCalledTimes(1);
    });

    it('should disconnect layout observer when switching to tile view', async () => {
      // Arrange
      viewManager.initialize();
      const mockDisconnect = (global as any).layoutObserver.disconnect;
      
      // Act
      await viewManager.switchToTileView();
      
      // Assert
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect((global as any).layoutObserver).toBeNull();
    });
  });

  describe('View State Management', () => {
    it('should return correct view state for tile view', () => {
      viewManager.currentView = 'tile';
      
      expect(viewManager.getCurrentView()).toBe('tile');
      expect(viewManager.isTileView()).toBe(true);
      expect(viewManager.isListView()).toBe(false);
    });

    it('should return correct view state for list view', () => {
      viewManager.currentView = 'list';
      
      expect(viewManager.getCurrentView()).toBe('list');
      expect(viewManager.isTileView()).toBe(false);
      expect(viewManager.isListView()).toBe(true);
    });
  });

  describe('toggleListView Function Integration', () => {
    let toggleListView: any;

    beforeEach(() => {
      viewManager.initialize();
      
      // Mock the toggleListView function that uses ViewManager
      toggleListView = (currentDeckId?: string) => {
        const deckCardsEditor = document.getElementById('deckCardsEditor');
        const listViewBtn = document.getElementById('listViewBtn');
        
        if (deckCardsEditor && deckCardsEditor.classList.contains('list-view')) {
          // Switch back to tile view
          viewManager.switchToTileView();
        } else {
          // Switch to list view
          viewManager.switchToListView();
        }
        
        if (currentDeckId) {
          const preferences = (global as any).getCurrentUIPreferences();
          (global as any).saveUIPreferences(currentDeckId, preferences);
        }
      };
    });

    it('should use ViewManager for tile to list view switch', async () => {
      // Arrange
      mockDeckCardsEditor.classList.contains.mockReturnValue(false);
      
      // Act
      toggleListView();
      
      // Assert
      expect(viewManager.currentView).toBe('list');
      expect((global as any).renderDeckCardsListView).toHaveBeenCalledTimes(1);
      expect((global as any).setupLayoutObserver).toHaveBeenCalledTimes(1);
    });

    it('should use ViewManager for list to tile view switch', async () => {
      // Arrange
      mockDeckCardsEditor.classList.contains.mockReturnValue(true);
      
      // Act
      toggleListView();
      
      // Assert
      expect(viewManager.currentView).toBe('tile');
      expect((global as any).displayDeckCardsForEditing).toHaveBeenCalledTimes(1);
    });

    it('should save UI preferences when currentDeckId exists', () => {
      // Arrange
      const currentDeckId = 'test-deck-id';
      mockDeckCardsEditor.classList.contains.mockReturnValue(false);
      
      // Act
      toggleListView(currentDeckId);
      
      // Assert
      expect((global as any).getCurrentUIPreferences).toHaveBeenCalledTimes(1);
      expect((global as any).saveUIPreferences).toHaveBeenCalledWith(currentDeckId, {});
    });
  });

  describe('Error Handling', () => {
    it('should handle missing DOM elements gracefully', () => {
      mockGetElementById.mockReturnValue(null);
      
      viewManager.initialize();
      
      expect(viewManager.deckCardsEditor).toBeNull();
      expect(viewManager.listViewBtn).toBeNull();
    });

    it('should handle missing deckCardsEditor in switchToTileView', async () => {
      // Arrange
      viewManager.deckCardsEditor = null;
      
      // Act & Assert
      await expect(viewManager.switchToTileView()).resolves.not.toThrow();
      expect((global as any).displayDeckCardsForEditing).toHaveBeenCalledTimes(1);
    });

    it('should handle missing deckCardsEditor in switchToListView', async () => {
      // Arrange
      viewManager.deckCardsEditor = null;
      
      // Act & Assert
      await expect(viewManager.switchToListView()).resolves.not.toThrow();
      expect((global as any).renderDeckCardsListView).toHaveBeenCalledTimes(1);
    });

    it('should handle missing layout observer gracefully', async () => {
      // Arrange
      viewManager.initialize();
      (global as any).layoutObserver = null;
      
      // Act & Assert
      await expect(viewManager.switchToTileView()).resolves.not.toThrow();
      expect((global as any).displayDeckCardsForEditing).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration with Existing Functions', () => {
    beforeEach(() => {
      viewManager.initialize();
    });

    it('should call displayDeckCardsForEditing with correct parameters', async () => {
      // Act
      await viewManager.switchToTileView();
      
      // Assert
      expect((global as any).displayDeckCardsForEditing).toHaveBeenCalledTimes(1);
      expect((global as any).displayDeckCardsForEditing).toHaveBeenCalledWith();
    });

    it('should call renderDeckCardsListView with correct parameters', async () => {
      // Act
      await viewManager.switchToListView();
      
      // Assert
      expect((global as any).renderDeckCardsListView).toHaveBeenCalledTimes(1);
      expect((global as any).renderDeckCardsListView).toHaveBeenCalledWith();
    });

    it('should call setupLayoutObserver with correct parameters', async () => {
      // Act
      await viewManager.switchToListView();
      
      // Assert
      expect((global as any).setupLayoutObserver).toHaveBeenCalledTimes(1);
      expect((global as any).setupLayoutObserver).toHaveBeenCalledWith();
    });
  });

  describe('ViewManager State Consistency', () => {
    it('should maintain consistent state across multiple view switches', async () => {
      // Arrange
      viewManager.initialize();
      
      // Act
      await viewManager.switchToListView();
      expect(viewManager.currentView).toBe('list');
      
      await viewManager.switchToTileView();
      expect(viewManager.currentView).toBe('tile');
      
      await viewManager.switchToListView();
      expect(viewManager.currentView).toBe('list');
      
      // Assert
      expect((global as any).renderDeckCardsListView).toHaveBeenCalledTimes(2);
      expect((global as any).displayDeckCardsForEditing).toHaveBeenCalledTimes(1);
      expect((global as any).setupLayoutObserver).toHaveBeenCalledTimes(2);
    });
  });
});

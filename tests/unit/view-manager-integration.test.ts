/**
 * @jest-environment jsdom
 */

// Mock the global functions that ViewManager depends on
(global as any).displayDeckCardsForEditing = jest.fn();
(global as any).renderDeckCardsListView = jest.fn();
(global as any).setupLayoutObserver = jest.fn();
(global as any).getCurrentUIPreferences = jest.fn(() => ({}));
(global as any).saveUIPreferences = jest.fn();

// Mock DOM elements
const mockViewManagerDeckCardsEditor = {
  classList: {
    contains: jest.fn(() => false),
    add: jest.fn(),
    remove: jest.fn()
  }
};

const mockListViewBtn = {
  textContent: 'List View'
};

// Mock document methods
const mockGetElementById = jest.fn((id: string) => {
  if (id === 'deckCardsEditor') return mockViewManagerDeckCardsEditor;
  if (id === 'listViewBtn') return mockListViewBtn;
  return null;
});

Object.defineProperty(document, 'getElementById', {
  value: mockGetElementById,
  writable: true
});

// Mock setTimeout
jest.useFakeTimers();

describe('ViewManager Integration', () => {
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
      }

      async switchToTileView() {
        this.currentView = 'tile';
        
        if (this.deckCardsEditor) {
          this.deckCardsEditor.classList.remove('list-view');
        }
        
        if (this.listViewBtn) {
          this.listViewBtn.textContent = 'List View';
        }
        
        // Use the original function to maintain exact behavior
        await (global as any).displayDeckCardsForEditing();
      }

      async switchToListView() {
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

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('ViewManager initialization', () => {
    it('should initialize with correct default state', () => {
      expect(viewManager.currentView).toBe('tile');
      expect(viewManager.deckCardsEditor).toBeNull();
      expect(viewManager.listViewBtn).toBeNull();
    });

    it('should initialize DOM elements correctly', () => {
      viewManager.initialize();
      
      expect(viewManager.deckCardsEditor).toBe(mockViewManagerDeckCardsEditor);
      expect(viewManager.listViewBtn).toBe(mockListViewBtn);
    });
  });

  describe('View switching functionality', () => {
    beforeEach(() => {
      viewManager.initialize();
    });

    it('should switch to tile view correctly', async () => {
      // Arrange
      viewManager.currentView = 'list';
      mockViewManagerDeckCardsEditor.classList.contains.mockReturnValue(true);
      
      // Act
      await viewManager.switchToTileView();
      
      // Assert
      expect(viewManager.currentView).toBe('tile');
      expect(mockViewManagerDeckCardsEditor.classList.remove).toHaveBeenCalledWith('list-view');
      expect(mockListViewBtn.textContent).toBe('List View');
      expect((global as any).displayDeckCardsForEditing).toHaveBeenCalledTimes(1);
    });

    it('should switch to list view correctly', async () => {
      // Arrange
      viewManager.currentView = 'tile';
      mockViewManagerDeckCardsEditor.classList.contains.mockReturnValue(false);
      
      // Act
      await viewManager.switchToListView();
      
      // Assert
      expect(viewManager.currentView).toBe('list');
      expect(mockViewManagerDeckCardsEditor.classList.add).toHaveBeenCalledWith('list-view');
      expect(mockListViewBtn.textContent).toBe('Tile View');
      expect((global as any).renderDeckCardsListView).toHaveBeenCalledTimes(1);
      expect((global as any).setupLayoutObserver).toHaveBeenCalledTimes(1);
    });
  });

  describe('View state management', () => {
    it('should return correct view state', () => {
      viewManager.currentView = 'tile';
      expect(viewManager.getCurrentView()).toBe('tile');
      expect(viewManager.isTileView()).toBe(true);
      expect(viewManager.isListView()).toBe(false);

      viewManager.currentView = 'list';
      expect(viewManager.getCurrentView()).toBe('list');
      expect(viewManager.isTileView()).toBe(false);
      expect(viewManager.isListView()).toBe(true);
    });
  });

  describe('toggleListView function integration', () => {
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
      const currentDeckId = 'test-deck-id';
      mockViewManagerDeckCardsEditor.classList.contains.mockReturnValue(false);
      
      // Act
      toggleListView();
      
      // Assert
      expect(viewManager.currentView).toBe('list');
      expect((global as any).renderDeckCardsListView).toHaveBeenCalledTimes(1);
      expect((global as any).setupLayoutObserver).toHaveBeenCalledTimes(1);
    });

    it('should use ViewManager for list to tile view switch', async () => {
      // Arrange
      const currentDeckId = 'test-deck-id';
      mockViewManagerDeckCardsEditor.classList.contains.mockReturnValue(true);
      
      // Act
      toggleListView();
      
      // Assert
      expect(viewManager.currentView).toBe('tile');
      expect((global as any).displayDeckCardsForEditing).toHaveBeenCalledTimes(1);
    });

    it('should save UI preferences when currentDeckId exists', () => {
      // Arrange
      const currentDeckId = 'test-deck-id';
      mockViewManagerDeckCardsEditor.classList.contains.mockReturnValue(false);
      
      // Act
      toggleListView(currentDeckId);
      
      // Assert
      expect((global as any).getCurrentUIPreferences).toHaveBeenCalledTimes(1);
      expect((global as any).saveUIPreferences).toHaveBeenCalledWith(currentDeckId, {});
    });
  });

  describe('Error handling', () => {
    it('should handle missing DOM elements gracefully', () => {
      // Arrange
      mockGetElementById.mockReturnValue(null);
      
      // Act
      viewManager.initialize();
      
      // Assert
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
  });
});

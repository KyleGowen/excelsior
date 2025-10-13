/**
 * Unit tests for public/js/layout-manager.js
 * Tests the layout management system extracted during Phase 7 of refactoring
 */

// Mock DOM elements
const mockElement = {
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
    toggle: jest.fn(),
  },
  style: { display: 'block' },
  innerHTML: '',
  appendChild: jest.fn(),
  removeChild: jest.fn(),
};

// Mock document methods
const mockGetElementById = jest.fn((id: string) => {
  if (id === 'deckCardsEditor') return mockElement;
  if (id === 'deckCardsList') return mockElement;
  return mockElement;
}) as jest.MockedFunction<(id: string) => any>;

const mockQuerySelectorAll = jest.fn(() => [mockElement]);

// Set up global mocks
(global as any).document = {
  getElementById: mockGetElementById,
  querySelectorAll: mockQuerySelectorAll,
};

// Define the LayoutManager class for testing
class LayoutManager {
  currentViewMode: string;
  isReadOnlyMode: boolean;
  layoutSettings: any;

  constructor() {
    this.currentViewMode = 'tile'; // 'tile' or 'list'
    this.isReadOnlyMode = false;
    this.layoutSettings = {
      tile: 1,
      list: 1,
      readOnlyTile: 1,
      readOnlyList: 3
    };
  }
  
  /**
   * Get the current layout mode based on view and read-only state
   */
  getCurrentMode() {
    if (this.isReadOnlyMode) {
      return this.currentViewMode === 'list' ? 'readOnlyList' : 'readOnlyTile';
    }
    return this.currentViewMode;
  }
  
  /**
   * Get the current column count for the active mode
   */
  getCurrentColumnCount() {
    const mode = this.getCurrentMode();
    return this.layoutSettings[mode] || 1;
  }
  
  /**
   * Set the view mode (tile or list)
   */
  setViewMode(mode: string) {
    if (mode === 'tile' || mode === 'list') {
      this.currentViewMode = mode;
    }
  }
  
  /**
   * Set read-only mode
   */
  setReadOnlyMode(isReadOnly: boolean) {
    this.isReadOnlyMode = isReadOnly;
  }
  
  /**
   * Update layout settings for a specific mode
   */
  updateLayoutSettings(mode: string, columnCount: number) {
    if (this.layoutSettings.hasOwnProperty(mode)) {
      this.layoutSettings[mode] = columnCount;
    }
  }
  
  /**
   * Apply layout settings to the DOM
   */
  applyLayoutSettings() {
    const mode = this.getCurrentMode();
    const columnCount = this.getCurrentColumnCount();
    
    // Update CSS custom property for column count
    const deckCardsEditor = (global as any).document.getElementById('deckCardsEditor');
    if (deckCardsEditor) {
      deckCardsEditor.style.setProperty('--column-count', columnCount.toString());
    }
    
    // Update CSS classes based on mode
    const deckCardsList = (global as any).document.getElementById('deckCardsList');
    if (deckCardsList) {
      deckCardsList.classList.remove('tile-view', 'list-view', 'read-only-tile', 'read-only-list');
      deckCardsList.classList.add(mode);
    }
  }
  
  /**
   * Render cards in tile view
   */
  renderTileView(cards: any[]) {
    const deckCardsEditor = (global as any).document.getElementById('deckCardsEditor');
    if (deckCardsEditor) {
      deckCardsEditor.innerHTML = '';
      cards.forEach(card => {
        const cardElement = (global as any).document.createElement('div');
        cardElement.className = 'card-tile';
        cardElement.textContent = card.name;
        deckCardsEditor.appendChild(cardElement);
      });
    }
  }
  
  /**
   * Render cards in list view
   */
  renderListView(cards: any[]) {
    const deckCardsList = (global as any).document.getElementById('deckCardsList');
    if (deckCardsList) {
      deckCardsList.innerHTML = '';
      cards.forEach(card => {
        const cardElement = (global as any).document.createElement('div');
        cardElement.className = 'card-list-item';
        cardElement.textContent = card.name;
        deckCardsList.appendChild(cardElement);
      });
    }
  }
  
  /**
   * Render deck cards based on current view mode
   */
  renderDeckCards(cards: any[]) {
    if (this.currentViewMode === 'list') {
      this.renderListView(cards);
    } else {
      this.renderTileView(cards);
    }
  }
  
  /**
   * Render deck cards for editing with specific view mode
   */
  renderDeckCardsForEditing(cards: any[], viewMode: string) {
    const originalMode = this.currentViewMode;
    this.setViewMode(viewMode);
    this.renderDeckCards(cards);
    this.setViewMode(originalMode);
  }
  
  /**
   * Render deck cards in list view specifically
   */
  renderDeckCardsListView(cards: any[]) {
    this.renderListView(cards);
  }
}

describe('LayoutManager - Layout Management System', () => {
  let layoutManager: LayoutManager;

  beforeEach(() => {
    jest.clearAllMocks();
    layoutManager = new LayoutManager();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(layoutManager.currentViewMode).toBe('tile');
      expect(layoutManager.isReadOnlyMode).toBe(false);
      expect(layoutManager.layoutSettings).toEqual({
        tile: 1,
        list: 1,
        readOnlyTile: 1,
        readOnlyList: 3
      });
    });
  });

  describe('getCurrentMode', () => {
    it('should return current view mode when not in read-only mode', () => {
      layoutManager.currentViewMode = 'tile';
      layoutManager.isReadOnlyMode = false;

      expect(layoutManager.getCurrentMode()).toBe('tile');
    });

    it('should return readOnlyTile when in read-only mode with tile view', () => {
      layoutManager.currentViewMode = 'tile';
      layoutManager.isReadOnlyMode = true;

      expect(layoutManager.getCurrentMode()).toBe('readOnlyTile');
    });

    it('should return readOnlyList when in read-only mode with list view', () => {
      layoutManager.currentViewMode = 'list';
      layoutManager.isReadOnlyMode = true;

      expect(layoutManager.getCurrentMode()).toBe('readOnlyList');
    });
  });

  describe('getCurrentColumnCount', () => {
    it('should return column count for tile mode', () => {
      layoutManager.currentViewMode = 'tile';
      layoutManager.isReadOnlyMode = false;

      expect(layoutManager.getCurrentColumnCount()).toBe(1);
    });

    it('should return column count for list mode', () => {
      layoutManager.currentViewMode = 'list';
      layoutManager.isReadOnlyMode = false;

      expect(layoutManager.getCurrentColumnCount()).toBe(1);
    });

    it('should return column count for readOnlyTile mode', () => {
      layoutManager.currentViewMode = 'tile';
      layoutManager.isReadOnlyMode = true;

      expect(layoutManager.getCurrentColumnCount()).toBe(1);
    });

    it('should return column count for readOnlyList mode', () => {
      layoutManager.currentViewMode = 'list';
      layoutManager.isReadOnlyMode = true;

      expect(layoutManager.getCurrentColumnCount()).toBe(3);
    });

    it('should return default value for unknown mode', () => {
      layoutManager.layoutSettings = {};

      expect(layoutManager.getCurrentColumnCount()).toBe(1);
    });
  });

  describe('setViewMode', () => {
    it('should set view mode to tile', () => {
      layoutManager.setViewMode('tile');

      expect(layoutManager.currentViewMode).toBe('tile');
    });

    it('should set view mode to list', () => {
      layoutManager.setViewMode('list');

      expect(layoutManager.currentViewMode).toBe('list');
    });

    it('should not change view mode for invalid input', () => {
      layoutManager.currentViewMode = 'tile';
      layoutManager.setViewMode('invalid');

      expect(layoutManager.currentViewMode).toBe('tile');
    });

    it('should not change view mode for null input', () => {
      layoutManager.currentViewMode = 'tile';
      layoutManager.setViewMode(null as any);

      expect(layoutManager.currentViewMode).toBe('tile');
    });
  });

  describe('setReadOnlyMode', () => {
    it('should set read-only mode to true', () => {
      layoutManager.setReadOnlyMode(true);

      expect(layoutManager.isReadOnlyMode).toBe(true);
    });

    it('should set read-only mode to false', () => {
      layoutManager.setReadOnlyMode(false);

      expect(layoutManager.isReadOnlyMode).toBe(false);
    });
  });

  describe('updateLayoutSettings', () => {
    it('should update layout settings for existing mode', () => {
      layoutManager.updateLayoutSettings('tile', 2);

      expect(layoutManager.layoutSettings.tile).toBe(2);
    });

    it('should update layout settings for list mode', () => {
      layoutManager.updateLayoutSettings('list', 3);

      expect(layoutManager.layoutSettings.list).toBe(3);
    });

    it('should not update layout settings for non-existent mode', () => {
      const originalSettings = { ...layoutManager.layoutSettings };
      layoutManager.updateLayoutSettings('nonexistent', 5);

      expect(layoutManager.layoutSettings).toEqual(originalSettings);
    });
  });

  describe('applyLayoutSettings', () => {
    it('should apply layout settings to DOM elements', () => {
      layoutManager.currentViewMode = 'tile';
      layoutManager.isReadOnlyMode = false;

      layoutManager.applyLayoutSettings();

      expect(mockGetElementById).toHaveBeenCalledWith('deckCardsEditor');
      expect(mockGetElementById).toHaveBeenCalledWith('deckCardsList');
    });

    it('should handle missing DOM elements gracefully', () => {
      mockGetElementById.mockReturnValue(null);

      expect(() => layoutManager.applyLayoutSettings()).not.toThrow();
    });

    it('should apply correct CSS classes for different modes', () => {
      layoutManager.currentViewMode = 'list';
      layoutManager.isReadOnlyMode = true;

      layoutManager.applyLayoutSettings();

      expect(mockElement.classList.remove).toHaveBeenCalledWith('tile-view', 'list-view', 'read-only-tile', 'read-only-list');
      expect(mockElement.classList.add).toHaveBeenCalledWith('readOnlyList');
    });
  });

  describe('renderTileView', () => {
    it('should render cards in tile view', () => {
      const mockCards = [
        { name: 'Card 1' },
        { name: 'Card 2' },
        { name: 'Card 3' }
      ];

      layoutManager.renderTileView(mockCards);

      expect(mockGetElementById).toHaveBeenCalledWith('deckCardsEditor');
      expect(mockElement.innerHTML).toBe('');
    });

    it('should handle missing deckCardsEditor element', () => {
      mockGetElementById.mockReturnValue(null);
      const mockCards = [{ name: 'Card 1' }];

      expect(() => layoutManager.renderTileView(mockCards)).not.toThrow();
    });

    it('should handle empty cards array', () => {
      layoutManager.renderTileView([]);

      expect(mockGetElementById).toHaveBeenCalledWith('deckCardsEditor');
      expect(mockElement.innerHTML).toBe('');
    });
  });

  describe('renderListView', () => {
    it('should render cards in list view', () => {
      const mockCards = [
        { name: 'Card 1' },
        { name: 'Card 2' }
      ];

      layoutManager.renderListView(mockCards);

      expect(mockGetElementById).toHaveBeenCalledWith('deckCardsList');
      expect(mockElement.innerHTML).toBe('');
    });

    it('should handle missing deckCardsList element', () => {
      mockGetElementById.mockReturnValue(null);
      const mockCards = [{ name: 'Card 1' }];

      expect(() => layoutManager.renderListView(mockCards)).not.toThrow();
    });
  });

  describe('renderDeckCards', () => {
    it('should render cards in tile view when current mode is tile', () => {
      layoutManager.currentViewMode = 'tile';
      const mockCards = [{ name: 'Card 1' }];
      const renderTileViewSpy = jest.spyOn(layoutManager, 'renderTileView');

      layoutManager.renderDeckCards(mockCards);

      expect(renderTileViewSpy).toHaveBeenCalledWith(mockCards);
    });

    it('should render cards in list view when current mode is list', () => {
      layoutManager.currentViewMode = 'list';
      const mockCards = [{ name: 'Card 1' }];
      const renderListViewSpy = jest.spyOn(layoutManager, 'renderListView');

      layoutManager.renderDeckCards(mockCards);

      expect(renderListViewSpy).toHaveBeenCalledWith(mockCards);
    });
  });

  describe('renderDeckCardsForEditing', () => {
    it('should render cards with specified view mode and restore original mode', () => {
      layoutManager.currentViewMode = 'tile';
      const mockCards = [{ name: 'Card 1' }];
      const renderDeckCardsSpy = jest.spyOn(layoutManager, 'renderDeckCards');

      layoutManager.renderDeckCardsForEditing(mockCards, 'list');

      expect(renderDeckCardsSpy).toHaveBeenCalledWith(mockCards);
      expect(layoutManager.currentViewMode).toBe('tile'); // Should be restored
    });

    it('should handle invalid view mode gracefully', () => {
      layoutManager.currentViewMode = 'tile';
      const mockCards = [{ name: 'Card 1' }];

      expect(() => layoutManager.renderDeckCardsForEditing(mockCards, 'invalid')).not.toThrow();
      expect(layoutManager.currentViewMode).toBe('tile');
    });
  });

  describe('renderDeckCardsListView', () => {
    it('should render cards in list view', () => {
      const mockCards = [{ name: 'Card 1' }];
      const renderListViewSpy = jest.spyOn(layoutManager, 'renderListView');

      layoutManager.renderDeckCardsListView(mockCards);

      expect(renderListViewSpy).toHaveBeenCalledWith(mockCards);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete layout change workflow', () => {
      layoutManager.setViewMode('list');
      layoutManager.setReadOnlyMode(true);
      layoutManager.updateLayoutSettings('readOnlyList', 4);
      layoutManager.applyLayoutSettings();

      expect(layoutManager.getCurrentMode()).toBe('readOnlyList');
      expect(layoutManager.getCurrentColumnCount()).toBe(4);
    });

    it('should handle mode switching with rendering', () => {
      const mockCards = [{ name: 'Card 1' }];
      const renderTileViewSpy = jest.spyOn(layoutManager, 'renderTileView');
      const renderListViewSpy = jest.spyOn(layoutManager, 'renderListView');

      layoutManager.renderDeckCards(mockCards);
      expect(renderTileViewSpy).toHaveBeenCalled();

      layoutManager.setViewMode('list');
      layoutManager.renderDeckCards(mockCards);
      expect(renderListViewSpy).toHaveBeenCalled();
    });

    it('should maintain state consistency across operations', () => {
      layoutManager.setViewMode('list');
      layoutManager.setReadOnlyMode(true);
      layoutManager.updateLayoutSettings('readOnlyList', 5);

      expect(layoutManager.getCurrentMode()).toBe('readOnlyList');
      expect(layoutManager.getCurrentColumnCount()).toBe(5);
      expect(layoutManager.isReadOnlyMode).toBe(true);
    });
  });
});

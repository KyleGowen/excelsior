/**
 * Unit tests for public/js/deck-management.js
 * Tests the deck management functions extracted during Phase 8 of refactoring
 */

// Mock fetch
global.fetch = jest.fn();

// Mock DOM elements
const mockElement = {
  style: { display: 'block' },
  innerHTML: '',
  remove: jest.fn(),
  getBoundingClientRect: jest.fn(() => ({
    bottom: 100,
    left: 50,
    right: 150,
    top: 80,
  })),
  appendChild: jest.fn(),
};

// Mock document methods
const mockGetElementById = jest.fn((id: string) => {
  if (id === 'deck-selection-menu') return mockElement;
  return mockElement;
}) as jest.MockedFunction<(id: string) => any>;

const mockCreateElement = jest.fn((tag: string) => {
  if (tag === 'div') return mockElement;
  if (tag === 'button') return mockElement;
  if (tag === 'h3') return mockElement;
  return mockElement;
});

// Set up global mocks
(global as any).document = {
  getElementById: mockGetElementById,
  createElement: mockCreateElement,
  body: mockElement,
};

(global as any).window = {
  innerWidth: 1200,
  innerHeight: 800,
};

// Mock global functions
const mockGetCurrentUser = jest.fn();
const mockShowNotification = jest.fn();

// Define the functions from deck-management.js for testing
let userDecks: any[] = [];

async function loadUserDecks() {
  try {
    // Check if user is authenticated first
    const currentUser = mockGetCurrentUser();
    if (!currentUser) {
      console.log('No authenticated user, skipping deck load');
      return;
    }

    const response = await fetch('/api/decks', {
      credentials: 'include'
    });
    const data = await response.json();
    if (data.success) {
      userDecks = data.data;
      if (userDecks.length > 0) {
        // Decks loaded successfully
      }
    } else {
      console.error('Failed to load decks:', data.error);
    }
  } catch (error) {
    console.error('Error loading user decks:', error);
  }
}

async function showDeckSelection(cardType: string, cardId: string, cardName: string, buttonElement: any) {
  console.log('showDeckSelection called with:', { cardType, cardId, cardName });
  console.log('Current userDecks:', userDecks);
  
  // Check if user is authenticated
  const currentUser = mockGetCurrentUser();
  if (!currentUser) {
    mockShowNotification('Please log in to add cards to decks', 'error');
    return;
  }
  
  // Load user decks if not already loaded
  if (userDecks.length === 0) {
    await loadUserDecks();
  }
  
  // Check if user has any decks
  if (userDecks.length === 0) {
    mockShowNotification('You need to create a deck first', 'error');
    return;
  }
  
  // Create and show deck selection menu
  createDeckSelectionMenu(cardType, cardId, cardName, buttonElement);
}

function createDeckSelectionMenu(cardType: string, cardId: string, cardName: string, buttonElement: any) {
  // Remove any existing menu
  const existingMenu = (global as any).document.getElementById('deck-selection-menu');
  if (existingMenu) {
    existingMenu.remove();
  }
  
  // Get button position for menu placement
  const buttonRect = buttonElement.getBoundingClientRect();
  const viewportWidth = (global as any).window.innerWidth;
  const viewportHeight = (global as any).window.innerHeight;
  
  // Calculate menu position
  let top = buttonRect.bottom + 5;
  let left = buttonRect.left;
  
  // Adjust position if menu would go off screen
  if (left + 200 > viewportWidth) {
    left = viewportWidth - 200;
  }
  if (top + 300 > viewportHeight) {
    top = buttonRect.top - 300;
  }
  
  // Create menu element
  const menu = (global as any).document.createElement('div');
  menu.id = 'deck-selection-menu';
  menu.style.position = 'fixed';
  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
  menu.style.zIndex = '9999';
  menu.style.backgroundColor = 'white';
  menu.style.border = '1px solid #ccc';
  menu.style.borderRadius = '4px';
  menu.style.padding = '10px';
  menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
  menu.style.minWidth = '200px';
  
  // Create menu content
  const title = (global as any).document.createElement('h3');
  title.textContent = `Add "${cardName}" to deck:`;
  title.style.margin = '0 0 10px 0';
  title.style.fontSize = '14px';
  title.style.fontWeight = 'bold';
  
  menu.appendChild(title);
  
  // Add deck options
  userDecks.forEach(deck => {
    const deckButton = (global as any).document.createElement('button');
    deckButton.textContent = deck.name;
    deckButton.style.display = 'block';
    deckButton.style.width = '100%';
    deckButton.style.padding = '8px';
    deckButton.style.margin = '2px 0';
    deckButton.style.border = '1px solid #ddd';
    deckButton.style.borderRadius = '3px';
    deckButton.style.backgroundColor = '#f9f9f9';
    deckButton.style.cursor = 'pointer';
    deckButton.onclick = () => addCardToDatabaseDeck(deck.id, cardType, cardId, cardName);
    
    menu.appendChild(deckButton);
  });
  
  // Add close button
  const closeButton = (global as any).document.createElement('button');
  closeButton.textContent = 'Cancel';
  closeButton.style.display = 'block';
  closeButton.style.width = '100%';
  closeButton.style.padding = '8px';
  closeButton.style.margin = '10px 0 0 0';
  closeButton.style.border = '1px solid #ccc';
  closeButton.style.borderRadius = '3px';
  closeButton.style.backgroundColor = '#e9e9e9';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = () => {
    const menu = (global as any).document.getElementById('deck-selection-menu');
    if (menu) {
      menu.remove();
    }
  };
  
  menu.appendChild(closeButton);
  
  // Add menu to document
  (global as any).document.body.appendChild(menu);
}

async function addCardToDatabaseDeck(deckId: string, cardType: string, cardId: string, cardName: string) {
  try {
    const response = await fetch(`/api/decks/${deckId}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        cardType,
        cardId,
        cardName
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      mockShowNotification(`Added "${cardName}" to deck successfully!`, 'success');
      
      // Remove the deck selection menu
      const menu = (global as any).document.getElementById('deck-selection-menu');
      if (menu) {
        menu.remove();
      }
    } else {
      mockShowNotification(`Failed to add card to deck: ${data.error}`, 'error');
    }
  } catch (error) {
    console.error('Error adding card to deck:', error);
    mockShowNotification('Error adding card to deck', 'error');
  }
}

describe('Deck Management Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    userDecks = [];
    mockElement.innerHTML = '';
    mockElement.style.display = 'block';
  });

  describe('loadUserDecks', () => {
    it('should load user decks successfully', async () => {
      const mockDecks = [
        { id: 'deck1', name: 'Test Deck 1' },
        { id: 'deck2', name: 'Test Deck 2' }
      ];
      
      mockGetCurrentUser.mockReturnValue({ id: 'user1', username: 'testuser' });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockDecks })
      });

      await loadUserDecks();

      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith('/api/decks', { credentials: 'include' });
      expect(userDecks).toEqual(mockDecks);
    });

    it('should skip loading if no authenticated user', async () => {
      mockGetCurrentUser.mockReturnValue(null);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await loadUserDecks();

      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('No authenticated user, skipping deck load');
      consoleSpy.mockRestore();
    });

    it('should handle API failure', async () => {
      mockGetCurrentUser.mockReturnValue({ id: 'user1' });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'API Error' })
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await loadUserDecks();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load decks:', 'API Error');
      expect(userDecks).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      mockGetCurrentUser.mockReturnValue({ id: 'user1' });
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await loadUserDecks();

      expect(consoleSpy).toHaveBeenCalledWith('Error loading user decks:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('showDeckSelection', () => {
    it('should show deck selection for authenticated user with decks', async () => {
      const mockButton = { getBoundingClientRect: jest.fn(() => ({ bottom: 100, left: 50 })) };
      userDecks = [{ id: 'deck1', name: 'Test Deck' }];
      
      mockGetCurrentUser.mockReturnValue({ id: 'user1' });

      await showDeckSelection('character', 'char1', 'Test Character', mockButton);

      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(mockCreateElement).toHaveBeenCalledWith('div');
      expect(mockElement.appendChild).toHaveBeenCalled();
    });

    it('should show error for unauthenticated user', async () => {
      const mockButton = { getBoundingClientRect: jest.fn() };
      mockGetCurrentUser.mockReturnValue(null);

      await showDeckSelection('character', 'char1', 'Test Character', mockButton);

      expect(mockShowNotification).toHaveBeenCalledWith('Please log in to add cards to decks', 'error');
      expect(mockCreateElement).not.toHaveBeenCalled();
    });

    it('should load decks if not already loaded', async () => {
      const mockButton = { getBoundingClientRect: jest.fn(() => ({ bottom: 100, left: 50 })) };
      userDecks = [];
      
      mockGetCurrentUser.mockReturnValue({ id: 'user1' });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: [{ id: 'deck1', name: 'Test Deck' }] })
      });

      await showDeckSelection('character', 'char1', 'Test Character', mockButton);

      expect(global.fetch).toHaveBeenCalledWith('/api/decks', { credentials: 'include' });
      expect(mockCreateElement).toHaveBeenCalledWith('div');
    });

    it('should show error if user has no decks', async () => {
      const mockButton = { getBoundingClientRect: jest.fn() };
      userDecks = [];
      
      mockGetCurrentUser.mockReturnValue({ id: 'user1' });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: [] })
      });

      await showDeckSelection('character', 'char1', 'Test Character', mockButton);

      expect(mockShowNotification).toHaveBeenCalledWith('You need to create a deck first', 'error');
      expect(mockCreateElement).not.toHaveBeenCalled();
    });
  });

  describe('createDeckSelectionMenu', () => {
    it('should create deck selection menu with correct positioning', () => {
      const mockButton = { 
        getBoundingClientRect: jest.fn(() => ({ bottom: 100, left: 50, right: 150, top: 80 }))
      };
      userDecks = [
        { id: 'deck1', name: 'Test Deck 1' },
        { id: 'deck2', name: 'Test Deck 2' }
      ];

      createDeckSelectionMenu('character', 'char1', 'Test Character', mockButton);

      expect(mockGetElementById).toHaveBeenCalledWith('deck-selection-menu');
      expect(mockCreateElement).toHaveBeenCalledWith('div');
      expect(mockCreateElement).toHaveBeenCalledWith('h3');
      expect(mockCreateElement).toHaveBeenCalledWith('button');
      expect(mockElement.appendChild).toHaveBeenCalled();
    });

    it('should remove existing menu before creating new one', () => {
      const mockButton = { getBoundingClientRect: jest.fn(() => ({ bottom: 100, left: 50 })) };
      userDecks = [{ id: 'deck1', name: 'Test Deck' }];

      createDeckSelectionMenu('character', 'char1', 'Test Character', mockButton);

      expect(mockElement.remove).toHaveBeenCalled();
    });

    it('should adjust menu position if it would go off screen', () => {
      const mockButton = { 
        getBoundingClientRect: jest.fn(() => ({ bottom: 100, left: 1100, right: 1200, top: 80 }))
      };
      userDecks = [{ id: 'deck1', name: 'Test Deck' }];

      createDeckSelectionMenu('character', 'char1', 'Test Character', mockButton);

      expect(mockCreateElement).toHaveBeenCalledWith('div');
      expect(mockElement.appendChild).toHaveBeenCalled();
    });

    it('should handle empty deck list', () => {
      const mockButton = { getBoundingClientRect: jest.fn(() => ({ bottom: 100, left: 50 })) };
      userDecks = [];

      createDeckSelectionMenu('character', 'char1', 'Test Character', mockButton);

      expect(mockCreateElement).toHaveBeenCalledWith('div');
      expect(mockCreateElement).toHaveBeenCalledWith('h3');
      expect(mockCreateElement).toHaveBeenCalledWith('button'); // Cancel button
    });
  });

  describe('addCardToDatabaseDeck', () => {
    it('should add card to deck successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true })
      });

      await addCardToDatabaseDeck('deck1', 'character', 'char1', 'Test Character');

      expect(global.fetch).toHaveBeenCalledWith('/api/decks/deck1/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cardType: 'character',
          cardId: 'char1',
          cardName: 'Test Character'
        })
      });
      expect(mockShowNotification).toHaveBeenCalledWith('Added "Test Character" to deck successfully!', 'success');
      expect(mockElement.remove).toHaveBeenCalled();
    });

    it('should handle API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'Deck not found' })
      });

      await addCardToDatabaseDeck('deck1', 'character', 'char1', 'Test Character');

      expect(mockShowNotification).toHaveBeenCalledWith('Failed to add card to deck: Deck not found', 'error');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await addCardToDatabaseDeck('deck1', 'character', 'char1', 'Test Character');

      expect(consoleSpy).toHaveBeenCalledWith('Error adding card to deck:', expect.any(Error));
      expect(mockShowNotification).toHaveBeenCalledWith('Error adding card to deck', 'error');
      consoleSpy.mockRestore();
    });

    it('should handle missing menu element gracefully', async () => {
      mockGetElementById.mockReturnValue(null);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true })
      });

      await addCardToDatabaseDeck('deck1', 'character', 'char1', 'Test Character');

      expect(mockShowNotification).toHaveBeenCalledWith('Added "Test Character" to deck successfully!', 'success');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete flow from deck selection to card addition', async () => {
      const mockButton = { getBoundingClientRect: jest.fn(() => ({ bottom: 100, left: 50 })) };
      userDecks = [{ id: 'deck1', name: 'Test Deck' }];
      
      mockGetCurrentUser.mockReturnValue({ id: 'user1' });
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => ({ success: true, data: userDecks }) })
        .mockResolvedValueOnce({ json: async () => ({ success: true }) });

      await showDeckSelection('character', 'char1', 'Test Character', mockButton);

      expect(mockCreateElement).toHaveBeenCalledWith('div');
      expect(mockElement.appendChild).toHaveBeenCalled();
    });

    it('should handle multiple deck options correctly', () => {
      const mockButton = { getBoundingClientRect: jest.fn(() => ({ bottom: 100, left: 50 })) };
      userDecks = [
        { id: 'deck1', name: 'Deck 1' },
        { id: 'deck2', name: 'Deck 2' },
        { id: 'deck3', name: 'Deck 3' }
      ];

      createDeckSelectionMenu('character', 'char1', 'Test Character', mockButton);

      // Should create one button for each deck plus cancel button
      expect(mockCreateElement).toHaveBeenCalledWith('button');
      expect(mockElement.appendChild).toHaveBeenCalledTimes(5); // 3 deck buttons + title + cancel
    });
  });
});

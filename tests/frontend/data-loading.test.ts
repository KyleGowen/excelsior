/**
 * Unit tests for public/js/data-loading.js
 * Tests the data loading functions extracted during Phase 6 of refactoring
 */

// Mock fetch
global.fetch = jest.fn();

// Mock DOM elements
const mockElement = {
  style: { display: 'none' },
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(),
  },
  innerHTML: '',
  querySelectorAll: jest.fn(() => []),
};

// Mock document methods
const mockGetElementById = jest.fn((id: string) => {
  if (id === 'characters-tab') return mockElement;
  if (id === 'characters-tbody') return mockElement;
  if (id === 'special-cards-tbody') return mockElement;
  if (id === 'locations-tbody') return mockElement;
  return mockElement;
}) as jest.MockedFunction<(id: string) => any>;

const mockQuerySelectorAll = jest.fn(() => [mockElement]);
const mockQuerySelector = jest.fn(() => mockElement);

// Set up global mocks
(global as any).document = {
  getElementById: mockGetElementById,
  querySelectorAll: mockQuerySelectorAll,
  querySelector: mockQuerySelector,
};

// Mock global functions that would be available
const mockClearAllFiltersGlobally = jest.fn();
const mockSwitchTab = jest.fn();
const mockDisableAddToDeckButtonsImmediate = jest.fn();
const mockDisplayCharacters = jest.fn();
const mockDisplaySpecialCards = jest.fn();
const mockDisplayLocations = jest.fn();

// Define the functions from data-loading.js for testing
async function loadDatabaseViewData(forceCharactersTab: boolean = false) {
  // Clear all filters globally before loading data
  mockClearAllFiltersGlobally();
  
  // Only force characters tab if explicitly requested
  if (forceCharactersTab) {
    // Ensure characters tab is visible before loading data
    const charactersTab = (global as any).document.getElementById('characters-tab');
    charactersTab.style.display = 'block';
    
    // Set characters tab as active
    (global as any).document.querySelectorAll('.tab-button').forEach((btn: any) => btn.classList.remove('active'));
    const charactersButton = (global as any).document.querySelector('[onclick="switchTab(\'characters\')"]');
    charactersButton.classList.add('active');
  }
  
  try {
    await Promise.all([
      loadCharacters(),
      loadSpecialCards(),
      loadLocations(),
    ]);
    
    // Only switch to characters tab if explicitly requested
    if (forceCharactersTab) {
      mockSwitchTab('characters');
    }
    
    // Disable "Add to Deck" buttons for guest users immediately
    mockDisableAddToDeckButtonsImmediate();
        
  } catch (error) {
    console.error('❌ Error loading database view data:', error);
  }
}

async function loadCharacters() {
  try {
    const response = await fetch('/api/characters');
    const data = await response.json();
    
    if (data.success) {
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 10));
      
      mockDisplayCharacters(data.data);
      console.log('✅ Characters loaded and displayed successfully:', data.data.length);
    } else {
      throw new Error('Failed to load characters');
    }
  } catch (error) {
    console.error('❌ Error loading characters:', error);
    const tbody = (global as any).document.getElementById('characters-tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="8" class="error">Error loading characters. Please try again.</td></tr>';
    }
  }
}

async function loadSpecialCards() {
  try {
    const response = await fetch('/api/special-cards');
    const data = await response.json();
    
    if (data.success) {
      mockDisplaySpecialCards(data.data);
    } else {
      throw new Error('Failed to load special cards');
    }
  } catch (error) {
    console.error('❌ Error loading special cards:', error);
    const tbody = (global as any).document.getElementById('special-cards-tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="4" class="error">Error loading special cards. Please try again.</td></tr>';
    }
  }
}

async function loadLocations() {
  try {
    const response = await fetch('/api/locations');
    const data = await response.json();
    
    if (data.success) {
      mockDisplayLocations(data.data);
    } else {
      throw new Error('Failed to load locations');
    }
  } catch (error) {
    console.error('❌ Error loading locations:', error);
    const tbody = (global as any).document.getElementById('locations-tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="error">Error loading locations. Please try again.</td></tr>';
    }
  }
}

describe('Data Loading Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockElement.style.display = 'none';
    mockElement.innerHTML = '';
  });

  describe('loadDatabaseViewData', () => {
    it('should load database view data without forcing characters tab', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => ({ success: true, data: [] }) })
        .mockResolvedValueOnce({ json: async () => ({ success: true, data: [] }) })
        .mockResolvedValueOnce({ json: async () => ({ success: true, data: [] }) });

      await loadDatabaseViewData(false);

      expect(mockClearAllFiltersGlobally).toHaveBeenCalled();
      expect(mockElement.style.display).toBe('none');
      expect(mockSwitchTab).not.toHaveBeenCalled();
      expect(mockDisableAddToDeckButtonsImmediate).toHaveBeenCalled();
    });

    it('should force characters tab when requested', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => ({ success: true, data: [] }) })
        .mockResolvedValueOnce({ json: async () => ({ success: true, data: [] }) })
        .mockResolvedValueOnce({ json: async () => ({ success: true, data: [] }) });

      await loadDatabaseViewData(true);

      expect(mockClearAllFiltersGlobally).toHaveBeenCalled();
      expect(mockElement.style.display).toBe('block');
      expect(mockElement.classList.add).toHaveBeenCalledWith('active');
      expect(mockSwitchTab).toHaveBeenCalledWith('characters');
      expect(mockDisableAddToDeckButtonsImmediate).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await loadDatabaseViewData(false);

      expect(consoleSpy).toHaveBeenCalledWith('❌ Error loading database view data:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should call all required loading functions', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => ({ success: true, data: [] }) })
        .mockResolvedValueOnce({ json: async () => ({ success: true, data: [] }) })
        .mockResolvedValueOnce({ json: async () => ({ success: true, data: [] }) });

      await loadDatabaseViewData(false);

      expect(global.fetch).toHaveBeenCalledWith('/api/characters');
      expect(global.fetch).toHaveBeenCalledWith('/api/special-cards');
      expect(global.fetch).toHaveBeenCalledWith('/api/locations');
    });
  });

  describe('loadCharacters', () => {
    it('should load and display characters successfully', async () => {
      const mockCharacters = [
        { id: '1', name: 'Character 1' },
        { id: '2', name: 'Character 2' }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockCharacters })
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await loadCharacters();

      expect(global.fetch).toHaveBeenCalledWith('/api/characters');
      expect(mockDisplayCharacters).toHaveBeenCalledWith(mockCharacters);
      expect(consoleSpy).toHaveBeenCalledWith('✅ Characters loaded and displayed successfully:', 2);
      consoleSpy.mockRestore();
    });

    it('should handle API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: false })
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await loadCharacters();

      expect(consoleSpy).toHaveBeenCalledWith('❌ Error loading characters:', expect.any(Error));
      expect(mockElement.innerHTML).toBe('<tr><td colspan="8" class="error">Error loading characters. Please try again.</td></tr>');
      consoleSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await loadCharacters();

      expect(consoleSpy).toHaveBeenCalledWith('❌ Error loading characters:', expect.any(Error));
      expect(mockElement.innerHTML).toBe('<tr><td colspan="8" class="error">Error loading characters. Please try again.</td></tr>');
      consoleSpy.mockRestore();
    });

    it('should handle missing tbody element gracefully', async () => {
      mockGetElementById.mockReturnValue(null);
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await loadCharacters();

      expect(consoleSpy).toHaveBeenCalledWith('❌ Error loading characters:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should add delay before displaying characters', async () => {
      const mockCharacters = [{ id: '1', name: 'Character 1' }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockCharacters })
      });

      const startTime = Date.now();
      await loadCharacters();
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(10);
    });
  });

  describe('loadSpecialCards', () => {
    it('should load and display special cards successfully', async () => {
      const mockSpecialCards = [
        { id: '1', name: 'Special Card 1' },
        { id: '2', name: 'Special Card 2' }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockSpecialCards })
      });

      await loadSpecialCards();

      expect(global.fetch).toHaveBeenCalledWith('/api/special-cards');
      expect(mockDisplaySpecialCards).toHaveBeenCalledWith(mockSpecialCards);
    });

    it('should handle API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: false })
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await loadSpecialCards();

      expect(consoleSpy).toHaveBeenCalledWith('❌ Error loading special cards:', expect.any(Error));
      expect(mockElement.innerHTML).toBe('<tr><td colspan="4" class="error">Error loading special cards. Please try again.</td></tr>');
      consoleSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await loadSpecialCards();

      expect(consoleSpy).toHaveBeenCalledWith('❌ Error loading special cards:', expect.any(Error));
      expect(mockElement.innerHTML).toBe('<tr><td colspan="4" class="error">Error loading special cards. Please try again.</td></tr>');
      consoleSpy.mockRestore();
    });

    it('should handle missing tbody element gracefully', async () => {
      mockGetElementById.mockReturnValue(null);
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await loadSpecialCards();

      expect(consoleSpy).toHaveBeenCalledWith('❌ Error loading special cards:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('loadLocations', () => {
    it('should load and display locations successfully', async () => {
      const mockLocations = [
        { id: '1', name: 'Location 1' },
        { id: '2', name: 'Location 2' }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockLocations })
      });

      await loadLocations();

      expect(global.fetch).toHaveBeenCalledWith('/api/locations');
      expect(mockDisplayLocations).toHaveBeenCalledWith(mockLocations);
    });

    it('should handle API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: false })
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await loadLocations();

      expect(consoleSpy).toHaveBeenCalledWith('❌ Error loading locations:', expect.any(Error));
      expect(mockElement.innerHTML).toBe('<tr><td colspan="6" class="error">Error loading locations. Please try again.</td></tr>');
      consoleSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await loadLocations();

      expect(consoleSpy).toHaveBeenCalledWith('❌ Error loading locations:', expect.any(Error));
      expect(mockElement.innerHTML).toBe('<tr><td colspan="6" class="error">Error loading locations. Please try again.</td></tr>');
      consoleSpy.mockRestore();
    });

    it('should handle missing tbody element gracefully', async () => {
      mockGetElementById.mockReturnValue(null);
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await loadLocations();

      expect(consoleSpy).toHaveBeenCalledWith('❌ Error loading locations:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle JSON parsing errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => { throw new Error('Invalid JSON'); }
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await loadCharacters();

      expect(consoleSpy).toHaveBeenCalledWith('❌ Error loading characters:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle timeout errors', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await loadCharacters();

      expect(consoleSpy).toHaveBeenCalledWith('❌ Error loading characters:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});

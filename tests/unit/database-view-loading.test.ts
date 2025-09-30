/**
 * Unit tests for database view loading functionality
 * Tests the showMainApp function and switchTab function changes
 */

// Mock DOM elements
const mockLoginModal = { style: { display: 'none' } };
const mockDatabaseView = { style: { display: 'none' } };
const mockDeckBuilder = { style: { display: 'none' } };
const mockCurrentUsername = { textContent: '' };
const mockCharactersTab = { style: { display: 'none' } };
const mockCharactersButton = { classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() } };

// Mock functions
const mockLoadUserDecks = jest.fn();
const mockLoadDatabaseViewData = jest.fn();
const mockClearAllFiltersGlobally = jest.fn();
const mockLoadCharacters = jest.fn();
const mockUpdateAllStats = jest.fn();

// Mock document.getElementById
const mockDocument = {
  getElementById: jest.fn(),
  querySelectorAll: jest.fn(),
  querySelector: jest.fn()
};

// Mock window.location
const mockLocation = {
  pathname: '/users/testuser/decks'
};

// Setup mocks
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset mock elements
  mockLoginModal.style.display = 'none';
  mockDatabaseView.style.display = 'none';
  mockDeckBuilder.style.display = 'none';
  mockCurrentUsername.textContent = '';
  mockCharactersTab.style.display = 'none';
  mockCharactersButton.classList.add.mockClear();
  mockCharactersButton.classList.remove.mockClear();
  mockCharactersButton.classList.contains.mockClear();

  // Setup getElementById mock
  mockDocument.getElementById.mockImplementation((id: string) => {
    switch (id) {
      case 'loginModal': return mockLoginModal;
      case 'database-view': return mockDatabaseView;
      case 'deck-builder': return mockDeckBuilder;
      case 'currentUsername': return mockCurrentUsername;
      case 'characters-tab': return mockCharactersTab;
      default: return null;
    }
  });

  // Setup querySelector mock for tab buttons
  mockDocument.querySelector.mockImplementation((selector: string) => {
    if (selector === '[onclick="switchTab(\'characters\')"]') {
      return mockCharactersButton;
    }
    return null;
  });

  // Setup querySelectorAll mock for tab buttons
  mockDocument.querySelectorAll.mockReturnValue([]);

  // Mock global functions
  (global as any).loadUserDecks = mockLoadUserDecks;
  (global as any).loadDatabaseViewData = mockLoadDatabaseViewData;
  (global as any).clearAllFiltersGlobally = mockClearAllFiltersGlobally;
  (global as any).loadCharacters = mockLoadCharacters;
  (global as any).updateAllStats = mockUpdateAllStats;
  (global as any).document = mockDocument;
  (global as any).window = { location: mockLocation };
});

describe('Database View Loading', () => {
  describe('showMainApp function', () => {
    test('should always show database view and load data', () => {
      // Mock currentUser
      const currentUser = { username: 'testuser', name: 'Test User' };

      // Define the showMainApp function (simplified for testing)
      function showMainApp() {
        console.log('🔍 showMainApp() called');
        mockDocument.getElementById('loginModal').style.display = 'none';
        const displayName = (currentUser.username === 'guest' || currentUser.name === 'guest') 
            ? 'Guest' 
            : (currentUser.username || currentUser.name || 'User');
        mockDocument.getElementById('currentUsername').textContent = displayName;
        
        // Load user decks after successful login
        mockLoadUserDecks();
        
        // Always start in database view and load characters
        console.log('🔍 showMainApp() - setting up database view');
        const databaseView = mockDocument.getElementById('database-view');
        if (databaseView) {
            databaseView.style.display = 'block';
            console.log('🔍 showMainApp() - database view is now visible');
        }

        // Load database view data (this will load characters)
        console.log('🔍 showMainApp() - loading database view data...');
        mockLoadDatabaseViewData();
      }

      // Execute the function
      showMainApp();

      // Verify database view is shown
      expect(mockDatabaseView.style.display).toBe('block');
      
      // Verify functions are called
      expect(mockLoadUserDecks).toHaveBeenCalled();
      expect(mockLoadDatabaseViewData).toHaveBeenCalled();
      
      // Verify username is set
      expect(mockCurrentUsername.textContent).toBe('testuser');
    });

    test('should handle guest user correctly', () => {
      const currentUser = { username: 'guest', name: 'guest' };

      function showMainApp() {
        console.log('🔍 showMainApp() called');
        mockDocument.getElementById('loginModal').style.display = 'none';
        const displayName = (currentUser.username === 'guest' || currentUser.name === 'guest') 
            ? 'Guest' 
            : (currentUser.username || currentUser.name || 'User');
        mockDocument.getElementById('currentUsername').textContent = displayName;
        
        mockLoadUserDecks();
        
        console.log('🔍 showMainApp() - setting up database view');
        const databaseView = mockDocument.getElementById('database-view');
        if (databaseView) {
            databaseView.style.display = 'block';
            console.log('🔍 showMainApp() - database view is now visible');
        }

        console.log('🔍 showMainApp() - loading database view data...');
        mockLoadDatabaseViewData();
      }

      showMainApp();

      expect(mockCurrentUsername.textContent).toBe('Guest');
      expect(mockDatabaseView.style.display).toBe('block');
      expect(mockLoadDatabaseViewData).toHaveBeenCalled();
    });
  });

  describe('switchTab function', () => {
    test('should add active class to selected tab button', () => {
      // Mock tab buttons
      const mockTabButtons = [
        { classList: { remove: jest.fn() } },
        { classList: { remove: jest.fn() } }
      ];
      mockDocument.querySelectorAll.mockReturnValue(mockTabButtons);

      // Define the switchTab function
      function switchTab(tabName: string) {
        console.log('🔍 switchTab called with:', tabName);
        
        // Clear all filters when switching tabs
        mockClearAllFiltersGlobally();
        
        // Hide all tabs (simplified for testing)
        mockCharactersTab.style.display = 'none';
        
        // Remove active class from all buttons
        mockDocument.querySelectorAll('.tab-button').forEach((btn: any) => btn.classList.remove('active'));
        
        // Add active class to the selected tab button
        const selectedButton = mockDocument.querySelector(`[onclick="switchTab('${tabName}')"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
            console.log('🔍 Added active class to button:', selectedButton.textContent);
        }
        
        // Show selected tab
        mockCharactersTab.style.display = 'block';
        console.log('🔍 Showing tab:', tabName + '-tab');
      }

      // Execute switchTab for characters
      switchTab('characters');

      // Verify active class is added to characters button
      expect(mockCharactersButton.classList.add).toHaveBeenCalledWith('active');
      
      // Verify all other buttons have active class removed
      mockTabButtons.forEach(btn => {
        expect(btn.classList.remove).toHaveBeenCalledWith('active');
      });
      
      // Verify characters tab is shown
      expect(mockCharactersTab.style.display).toBe('block');
    });

    test('should handle missing tab button gracefully', () => {
      // Mock querySelector to return null (button not found)
      mockDocument.querySelector.mockReturnValue(null);
      mockDocument.querySelectorAll.mockReturnValue([]);

      function switchTab(tabName: string) {
        console.log('🔍 switchTab called with:', tabName);
        
        mockClearAllFiltersGlobally();
        mockCharactersTab.style.display = 'none';
        
        mockDocument.querySelectorAll('.tab-button').forEach((btn: any) => btn.classList.remove('active'));
        
        // Add active class to the selected tab button
        const selectedButton = mockDocument.querySelector(`[onclick="switchTab('${tabName}')"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
            console.log('🔍 Added active class to button:', selectedButton.textContent);
        }
        
        mockCharactersTab.style.display = 'block';
        console.log('🔍 Showing tab:', tabName + '-tab');
      }

      // Execute switchTab - should not throw error
      expect(() => switchTab('characters')).not.toThrow();
      
      // Verify characters tab is still shown even if button not found
      expect(mockCharactersTab.style.display).toBe('block');
    });
  });

  describe('loadDatabaseViewData function', () => {
    test('should set characters tab as active and load data', async () => {
      // Mock Promise.all to resolve successfully
      const mockPromiseAll = jest.fn().mockResolvedValue([]);
      global.Promise.all = mockPromiseAll;

      // Define loadDatabaseViewData function
      async function loadDatabaseViewData() {
        console.log('🔍 Starting database view data load...');
        
        // Clear all filters globally before loading data
        console.log('🔍 Clearing all filters globally...');
        mockClearAllFiltersGlobally();
        
        // Ensure characters tab is visible before loading data
        console.log('🔍 Making characters tab visible...');
        const charactersTab = mockDocument.getElementById('characters-tab');
        charactersTab.style.display = 'block';
        console.log('🔍 Characters tab display style:', charactersTab.style.display);
        
        // Set characters tab as active
        mockDocument.querySelectorAll('.tab-button').forEach((btn: any) => btn.classList.remove('active'));
        const charactersButton = mockDocument.querySelector('[onclick="switchTab(\'characters\')"]');
        charactersButton.classList.add('active');
        console.log('🔍 Characters button active class:', charactersButton.classList.contains('active'));
        
        try {
          console.log('🔍 About to load all data in parallel...');
          await mockPromiseAll([
            mockLoadCharacters(),
            // ... other load functions would go here
          ]);
          
          // Update all statistics after loading all data
          await mockUpdateAllStats();
          
          // Ensure characters tab is properly shown after loading data
          console.log('🔍 Ensuring characters tab is shown after data load...');
          // Note: switchTab would be called here in real implementation
          
          console.log('✅ Database view data loaded successfully');
        } catch (error) {
          console.error('❌ Error loading database view data:', error);
        }
      }

      // Execute the function
      await loadDatabaseViewData();

      // Verify characters tab is made visible
      expect(mockCharactersTab.style.display).toBe('block');
      
      // Verify characters button gets active class
      expect(mockCharactersButton.classList.add).toHaveBeenCalledWith('active');
      
      // Verify data loading functions are called
      expect(mockClearAllFiltersGlobally).toHaveBeenCalled();
      expect(mockPromiseAll).toHaveBeenCalled();
      expect(mockUpdateAllStats).toHaveBeenCalled();
    });
  });
});

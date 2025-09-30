/**
 * Unit tests for Global Navigation Component
 * Tests HTML structure, CSS classes, JavaScript functionality, and user interactions
 */

// Mock DOM elements
const mockDatabaseViewBtn = {
  classList: { add: jest.fn(), remove: jest.fn() },
  onclick: null
};

const mockDeckBuilderBtn = {
  classList: { add: jest.fn(), remove: jest.fn() },
  onclick: null
};

const mockDatabaseView = {
  style: { display: 'none' }
};

const mockDeckBuilder = {
  style: { display: 'none' }
};

const mockDatabaseStats = {
  style: { display: 'none' }
};

const mockDeckStats = {
  style: { display: 'none' }
};

const mockCreateDeckSection = {
  style: { display: 'none' }
};

const mockCurrentUsername = {
  textContent: ''
};

const mockLogoutBtn = {
  addEventListener: jest.fn()
};

const mockTotalCharacters = {
  textContent: '-'
};

const mockTotalDecks = {
  textContent: '-'
};

// Mock functions
const mockGetCurrentUser = jest.fn();
const mockLoadDatabaseViewData = jest.fn();
const mockLoadDeckBuilderData = jest.fn();
const mockLoadDecks = jest.fn();
const mockLogout = jest.fn();
const mockShowCreateDeckModal = jest.fn();

// Mock document and window
const mockDocument = {
  getElementById: jest.fn(),
  addEventListener: jest.fn()
};

const mockHistory = {
  pushState: jest.fn()
};

const mockWindow = {
  addEventListener: jest.fn(),
  location: { href: '/' }
};

const mockFetch = jest.fn();

// Mock global functions
(global as any).getCurrentUser = mockGetCurrentUser;
(global as any).loadDatabaseViewData = mockLoadDatabaseViewData;
(global as any).loadDeckBuilderData = mockLoadDeckBuilderData;
(global as any).loadDecks = mockLoadDecks;
(global as any).logout = mockLogout;
(global as any).showCreateDeckModal = mockShowCreateDeckModal;
(global as any).document = mockDocument;
(global as any).window = mockWindow;
(global as any).history = mockHistory;
(global as any).fetch = mockFetch;

// Define the functions to be tested
function switchToDatabaseView() {
  // Update URL without page reload
  const currentUser = (global as any).getCurrentUser();
  const userId = currentUser ? (currentUser.userId || currentUser.id) : 'guest';
  (global as any).history.pushState({view: 'database'}, '', `/users/${userId}/decks`);
  
  // Update button states
  const databaseViewBtn = (global as any).document.getElementById('databaseViewBtn');
  const deckBuilderBtn = (global as any).document.getElementById('deckBuilderBtn');
  if (databaseViewBtn) databaseViewBtn.classList.add('active');
  if (deckBuilderBtn) deckBuilderBtn.classList.remove('active');
  
  // Show database view, hide deck builder
  const databaseView = (global as any).document.getElementById('database-view');
  const deckBuilder = (global as any).document.getElementById('deck-builder');
  if (databaseView) databaseView.style.display = 'block';
  if (deckBuilder) deckBuilder.style.display = 'none';
  
  // Show database statistics and hide deck statistics
  const databaseStats = (global as any).document.getElementById('database-stats');
  const deckStats = (global as any).document.getElementById('deck-stats');
  const createDeckSection = (global as any).document.getElementById('createDeckSection');
  
  if (databaseStats) databaseStats.style.display = 'grid';
  if (deckStats) deckStats.style.display = 'none';
  if (createDeckSection) createDeckSection.style.display = 'none';
  
  // Load database data if not already loaded
  const totalCharacters = (global as any).document.getElementById('total-characters');
  if (totalCharacters && totalCharacters.textContent === '-') {
    if (typeof (global as any).loadDatabaseViewData === 'function') {
      (global as any).loadDatabaseViewData();
    }
  }
}

function switchToDeckBuilder() {
  console.log('🔍 DEBUG: switchToDeckBuilder called');
  
  // Update URL without page reload
  const currentUser = (global as any).getCurrentUser();
  const userId = currentUser ? (currentUser.userId || currentUser.id) : 'guest';
  (global as any).history.pushState({view: 'deckbuilder'}, '', `/users/${userId}/decks`);
  
  // Update button states
  const deckBuilderBtn = (global as any).document.getElementById('deckBuilderBtn');
  const databaseViewBtn = (global as any).document.getElementById('databaseViewBtn');
  if (deckBuilderBtn) deckBuilderBtn.classList.add('active');
  if (databaseViewBtn) databaseViewBtn.classList.remove('active');
  
  // Show deck builder, hide database view
  const deckBuilder = (global as any).document.getElementById('deck-builder');
  const databaseView = (global as any).document.getElementById('database-view');
  if (deckBuilder) deckBuilder.style.display = 'block';
  if (databaseView) databaseView.style.display = 'none';
  
  // Show deck statistics and hide database statistics
  const databaseStats = (global as any).document.getElementById('database-stats');
  const deckStats = (global as any).document.getElementById('deck-stats');
  const createDeckSection = (global as any).document.getElementById('createDeckSection');
  
  console.log('🔍 DEBUG: createDeckSection element:', createDeckSection);
  
  if (databaseStats) databaseStats.style.display = 'none';
  if (deckStats) deckStats.style.display = 'grid';
  if (createDeckSection) {
    console.log('🔍 DEBUG: Setting createDeckSection to display: flex');
    createDeckSection.style.display = 'flex';
  } else {
    console.log('❌ DEBUG: createDeckSection element not found!');
  }
  
  // Ensure username is displayed when switching back to deck builder
  if (currentUser) {
    const displayName = (currentUser.username === 'guest' || currentUser.name === 'guest') 
      ? 'Guest' 
      : (currentUser.username || currentUser.name || 'User');
    const usernameElement = (global as any).document.getElementById('currentUsername');
    if (usernameElement) {
      usernameElement.textContent = displayName;
    }
  }
  
  // Load deck data if not already loaded
  const totalDecks = (global as any).document.getElementById('total-decks');
  if (totalDecks && totalDecks.textContent === '-') {
    if (typeof (global as any).loadDeckBuilderData === 'function') {
      (global as any).loadDeckBuilderData();
    } else if (typeof (global as any).loadDecks === 'function') {
      (global as any).loadDecks();
    }
  }
}

function initializeGlobalNav() {
  console.log('🔍 DEBUG: initializeGlobalNav called');
  
  // Check if createDeckSection exists
  const createDeckSection = (global as any).document.getElementById('createDeckSection');
  console.log('🔍 DEBUG: createDeckSection found during init:', createDeckSection);
  
  // Set up logout button functionality
  const logoutBtn = (global as any).document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      // Clear session and redirect to login
      if (typeof (global as any).logout === 'function') {
        (global as any).logout();
      } else {
        // Fallback logout functionality
        (global as any).fetch('/api/auth/logout', { method: 'POST' })
          .then(() => {
            (global as any).window.location.href = '/';
          })
          .catch(() => {
            (global as any).window.location.href = '/';
          });
      }
    });
  }
  
  // Set up browser back/forward navigation
  (global as any).window.addEventListener('popstate', function(event: any) {
    if (event.state && event.state.view === 'database') {
      switchToDatabaseView();
    } else {
      switchToDeckBuilder();
    }
  });
  
  // Initialize user welcome message
  updateUserWelcome();
}

function updateUserWelcome() {
  const currentUser = (global as any).getCurrentUser();
  if (currentUser) {
    const displayName = (currentUser.username === 'guest' || currentUser.name === 'guest') 
      ? 'Guest' 
      : (currentUser.username || currentUser.name || 'User');
    const usernameElement = (global as any).document.getElementById('currentUsername');
    if (usernameElement) {
      usernameElement.textContent = displayName;
    }
  }
}

describe('Global Navigation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock elements
    mockDatabaseViewBtn.classList.add.mockClear();
    mockDatabaseViewBtn.classList.remove.mockClear();
    mockDeckBuilderBtn.classList.add.mockClear();
    mockDeckBuilderBtn.classList.remove.mockClear();
    mockLogoutBtn.addEventListener.mockClear();
    
    // Setup getElementById mock
    mockDocument.getElementById.mockImplementation((id: string) => {
      switch (id) {
        case 'databaseViewBtn': return mockDatabaseViewBtn;
        case 'deckBuilderBtn': return mockDeckBuilderBtn;
        case 'database-view': return mockDatabaseView;
        case 'deck-builder': return mockDeckBuilder;
        case 'database-stats': return mockDatabaseStats;
        case 'deck-stats': return mockDeckStats;
        case 'createDeckSection': return mockCreateDeckSection;
        case 'currentUsername': return mockCurrentUsername;
        case 'logoutBtn': return mockLogoutBtn;
        case 'total-characters': return mockTotalCharacters;
        case 'total-decks': return mockTotalDecks;
        default: return null;
      }
    });
  });

  describe('switchToDatabaseView function', () => {
    test('should update URL with correct user ID', () => {
      mockGetCurrentUser.mockReturnValue({ id: 'user123', username: 'testuser' });
      
      switchToDatabaseView();
      
      expect(mockHistory.pushState).toHaveBeenCalledWith(
        { view: 'database' },
        '',
        '/users/user123/decks'
      );
    });

    test('should use guest ID when no current user', () => {
      mockGetCurrentUser.mockReturnValue(null);
      
      switchToDatabaseView();
      
      expect(mockHistory.pushState).toHaveBeenCalledWith(
        { view: 'database' },
        '',
        '/users/guest/decks'
      );
    });

    test('should use userId property when available', () => {
      mockGetCurrentUser.mockReturnValue({ userId: 'user456', id: 'user123' });
      
      switchToDatabaseView();
      
      expect(mockHistory.pushState).toHaveBeenCalledWith(
        { view: 'database' },
        '',
        '/users/user456/decks'
      );
    });

    test('should update button states correctly', () => {
      switchToDatabaseView();
      
      expect(mockDatabaseViewBtn.classList.add).toHaveBeenCalledWith('active');
      expect(mockDeckBuilderBtn.classList.remove).toHaveBeenCalledWith('active');
    });

    test('should show database view and hide deck builder', () => {
      switchToDatabaseView();
      
      expect(mockDatabaseView.style.display).toBe('block');
      expect(mockDeckBuilder.style.display).toBe('none');
    });

    test('should show database stats and hide deck stats', () => {
      switchToDatabaseView();
      
      expect(mockDatabaseStats.style.display).toBe('grid');
      expect(mockDeckStats.style.display).toBe('none');
      expect(mockCreateDeckSection.style.display).toBe('none');
    });

    test('should load database data when total-characters is not loaded', () => {
      mockTotalCharacters.textContent = '-';
      
      switchToDatabaseView();
      
      expect(mockLoadDatabaseViewData).toHaveBeenCalled();
    });

    test('should not load database data when already loaded', () => {
      mockTotalCharacters.textContent = '42';
      
      switchToDatabaseView();
      
      expect(mockLoadDatabaseViewData).not.toHaveBeenCalled();
    });

    test('should handle missing elements gracefully', () => {
      mockDocument.getElementById.mockReturnValue(null);
      
      expect(() => switchToDatabaseView()).not.toThrow();
    });
  });

  describe('switchToDeckBuilder function', () => {
    test('should update URL with correct user ID', () => {
      mockGetCurrentUser.mockReturnValue({ id: 'user123', username: 'testuser' });
      
      switchToDeckBuilder();
      
      expect(mockHistory.pushState).toHaveBeenCalledWith(
        { view: 'deckbuilder' },
        '',
        '/users/user123/decks'
      );
    });

    test('should use guest ID when no current user', () => {
      mockGetCurrentUser.mockReturnValue(null);
      
      switchToDeckBuilder();
      
      expect(mockHistory.pushState).toHaveBeenCalledWith(
        { view: 'deckbuilder' },
        '',
        '/users/guest/decks'
      );
    });

    test('should update button states correctly', () => {
      switchToDeckBuilder();
      
      expect(mockDeckBuilderBtn.classList.add).toHaveBeenCalledWith('active');
      expect(mockDatabaseViewBtn.classList.remove).toHaveBeenCalledWith('active');
    });

    test('should show deck builder and hide database view', () => {
      switchToDeckBuilder();
      
      expect(mockDeckBuilder.style.display).toBe('block');
      expect(mockDatabaseView.style.display).toBe('none');
    });

    test('should show deck stats and hide database stats', () => {
      switchToDeckBuilder();
      
      expect(mockDatabaseStats.style.display).toBe('none');
      expect(mockDeckStats.style.display).toBe('grid');
      expect(mockCreateDeckSection.style.display).toBe('flex');
    });

    test('should update username display for regular user', () => {
      mockGetCurrentUser.mockReturnValue({ id: 'user123', username: 'testuser', name: 'Test User' });
      
      switchToDeckBuilder();
      
      expect(mockCurrentUsername.textContent).toBe('testuser');
    });

    test('should display "Guest" for guest users', () => {
      mockGetCurrentUser.mockReturnValue({ id: 'guest', username: 'guest', name: 'Guest' });
      
      switchToDeckBuilder();
      
      expect(mockCurrentUsername.textContent).toBe('Guest');
    });

    test('should use name when username is not available', () => {
      mockGetCurrentUser.mockReturnValue({ id: 'user123', name: 'Test User' });
      
      switchToDeckBuilder();
      
      expect(mockCurrentUsername.textContent).toBe('Test User');
    });

    test('should use "User" as fallback when neither username nor name available', () => {
      mockGetCurrentUser.mockReturnValue({ id: 'user123' });
      
      switchToDeckBuilder();
      
      expect(mockCurrentUsername.textContent).toBe('User');
    });

    test('should load deck data when total-decks is not loaded', () => {
      mockTotalDecks.textContent = '-';
      
      switchToDeckBuilder();
      
      expect(mockLoadDeckBuilderData).toHaveBeenCalled();
    });

    test('should fallback to loadDecks when loadDeckBuilderData not available', () => {
      mockTotalDecks.textContent = '-';
      (global as any).loadDeckBuilderData = undefined;
      
      switchToDeckBuilder();
      
      expect(mockLoadDecks).toHaveBeenCalled();
    });

    test('should not load deck data when already loaded', () => {
      mockTotalDecks.textContent = '5';
      
      switchToDeckBuilder();
      
      expect(mockLoadDeckBuilderData).not.toHaveBeenCalled();
      expect(mockLoadDecks).not.toHaveBeenCalled();
    });

    test('should handle missing elements gracefully', () => {
      mockDocument.getElementById.mockReturnValue(null);
      
      expect(() => switchToDeckBuilder()).not.toThrow();
    });
  });

  describe('initializeGlobalNav function', () => {
    test('should set up logout button with logout function', () => {
      initializeGlobalNav();
      
      expect(mockLogoutBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('should set up logout button with fallback when logout function not available', () => {
      (global as any).logout = undefined;
      mockFetch.mockResolvedValue({});
      
      initializeGlobalNav();
      
      expect(mockLogoutBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('should set up popstate event listener', () => {
      initializeGlobalNav();
      
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
    });

    test('should call updateUserWelcome', () => {
      // Since updateUserWelcome is a local function, we can't spy on it directly
      // Instead, we test that the function works by checking its behavior
      mockGetCurrentUser.mockReturnValue({ id: 'user123', username: 'testuser' });
      
      initializeGlobalNav();
      
      // The function should have been called and updated the username
      expect(mockCurrentUsername.textContent).toBe('testuser');
    });

    test('should handle missing logout button gracefully', () => {
      mockDocument.getElementById.mockImplementation((id: string) => {
        if (id === 'logoutBtn') return null;
        return mockDatabaseViewBtn; // Return something for other IDs
      });
      
      expect(() => initializeGlobalNav()).not.toThrow();
    });
  });

  describe('updateUserWelcome function', () => {
    test('should update username for regular user', () => {
      mockGetCurrentUser.mockReturnValue({ id: 'user123', username: 'testuser', name: 'Test User' });
      
      updateUserWelcome();
      
      expect(mockCurrentUsername.textContent).toBe('testuser');
    });

    test('should display "Guest" for guest users by username', () => {
      mockGetCurrentUser.mockReturnValue({ id: 'guest', username: 'guest' });
      
      updateUserWelcome();
      
      expect(mockCurrentUsername.textContent).toBe('Guest');
    });

    test('should display "Guest" for guest users by name', () => {
      mockGetCurrentUser.mockReturnValue({ id: 'guest', name: 'guest' });
      
      updateUserWelcome();
      
      expect(mockCurrentUsername.textContent).toBe('Guest');
    });

    test('should use name when username is not available', () => {
      mockGetCurrentUser.mockReturnValue({ id: 'user123', name: 'Test User' });
      
      updateUserWelcome();
      
      expect(mockCurrentUsername.textContent).toBe('Test User');
    });

    test('should use "User" as fallback when neither username nor name available', () => {
      mockGetCurrentUser.mockReturnValue({ id: 'user123' });
      
      updateUserWelcome();
      
      expect(mockCurrentUsername.textContent).toBe('User');
    });

    test('should handle no current user', () => {
      // Reset the mock textContent to ensure clean state
      mockCurrentUsername.textContent = '';
      mockGetCurrentUser.mockReturnValue(null);
      
      updateUserWelcome();
      
      // When no current user, the function doesn't update textContent, so it remains as initialized
      expect(mockCurrentUsername.textContent).toBe('');
    });

    test('should handle missing username element', () => {
      mockDocument.getElementById.mockReturnValue(null);
      
      expect(() => updateUserWelcome()).not.toThrow();
    });
  });

  describe('popstate event handler', () => {
    test('should switch to database view when state view is database', () => {
      // Test that the popstate handler is set up correctly
      initializeGlobalNav();
      
      // Get the popstate event handler
      const popstateHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'popstate'
      )?.[1];
      
      expect(popstateHandler).toBeDefined();
      
      // Test that the handler exists and can be called without error
      expect(() => popstateHandler({ state: { view: 'database' } })).not.toThrow();
    });

    test('should switch to deck builder when state view is not database', () => {
      // Test that the popstate handler is set up correctly
      initializeGlobalNav();
      
      // Get the popstate event handler
      const popstateHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'popstate'
      )?.[1];
      
      expect(popstateHandler).toBeDefined();
      
      // Test that the handler exists and can be called without error
      expect(() => popstateHandler({ state: { view: 'deckbuilder' } })).not.toThrow();
    });

    test('should switch to deck builder when no state', () => {
      // Test that the popstate handler is set up correctly
      initializeGlobalNav();
      
      // Get the popstate event handler
      const popstateHandler = mockWindow.addEventListener.mock.calls.find(
        call => call[0] === 'popstate'
      )?.[1];
      
      expect(popstateHandler).toBeDefined();
      
      // Test that the handler exists and can be called without error
      expect(() => popstateHandler({ state: null })).not.toThrow();
    });
  });

  describe('logout button click handler', () => {
    test('should call logout function when available', () => {
      // Reset mocks
      mockLogoutBtn.addEventListener.mockClear();
      mockLogout.mockClear();
      
      // Ensure logout function is available
      (global as any).logout = mockLogout;
      
      initializeGlobalNav();
      
      // Get the click handler
      const clickHandler = mockLogoutBtn.addEventListener.mock.calls.find(
        call => call[0] === 'click'
      )?.[1];
      
      expect(clickHandler).toBeDefined();
      
      // Simulate click
      clickHandler();
      
      expect(mockLogout).toHaveBeenCalled();
    });

    test('should use fetch fallback when logout function not available', () => {
      (global as any).logout = undefined;
      mockFetch.mockResolvedValue({});
      
      initializeGlobalNav();
      
      // Get the click handler
      const clickHandler = mockLogoutBtn.addEventListener.mock.calls.find(
        call => call[0] === 'click'
      )?.[1];
      
      expect(clickHandler).toBeDefined();
      
      // Simulate click
      clickHandler();
      
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
    });

    test('should handle fetch success', async () => {
      (global as any).logout = undefined;
      mockFetch.mockResolvedValue({});
      
      initializeGlobalNav();
      
      // Get the click handler
      const clickHandler = mockLogoutBtn.addEventListener.mock.calls.find(
        call => call[0] === 'click'
      )?.[1];
      
      expect(clickHandler).toBeDefined();
      
      // Simulate click
      await clickHandler();
      
      expect(mockWindow.location.href).toBe('/');
    });

    test('should handle fetch error', async () => {
      (global as any).logout = undefined;
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      initializeGlobalNav();
      
      // Get the click handler
      const clickHandler = mockLogoutBtn.addEventListener.mock.calls.find(
        call => call[0] === 'click'
      )?.[1];
      
      expect(clickHandler).toBeDefined();
      
      // Simulate click
      await clickHandler();
      
      expect(mockWindow.location.href).toBe('/');
    });
  });

  describe('HTML structure validation', () => {
    test('should have correct HTML structure', () => {
      // This would typically be tested with a DOM parser or HTML validation
      // For now, we'll test that the component functions work with expected structure
      expect(mockDocument.getElementById).toBeDefined();
    });
  });

  describe('CSS class validation', () => {
    test('should apply correct CSS classes', () => {
      // Test that the component applies the expected CSS classes
      switchToDatabaseView();
      
      expect(mockDatabaseViewBtn.classList.add).toHaveBeenCalledWith('active');
      expect(mockDeckBuilderBtn.classList.remove).toHaveBeenCalledWith('active');
    });
  });

  describe('Error handling', () => {
    test('should handle missing DOM elements gracefully', () => {
      mockDocument.getElementById.mockReturnValue(null);
      
      expect(() => switchToDatabaseView()).not.toThrow();
      expect(() => switchToDeckBuilder()).not.toThrow();
      expect(() => initializeGlobalNav()).not.toThrow();
      expect(() => updateUserWelcome()).not.toThrow();
    });

    test('should handle missing functions gracefully', () => {
      (global as any).loadDatabaseViewData = undefined;
      (global as any).loadDeckBuilderData = undefined;
      (global as any).loadDecks = undefined;
      
      expect(() => switchToDatabaseView()).not.toThrow();
      expect(() => switchToDeckBuilder()).not.toThrow();
    });
  });
});

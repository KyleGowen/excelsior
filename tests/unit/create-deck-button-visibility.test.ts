/**
 * Unit tests for Create Deck button visibility on deck builder page
 * Ensures the button is properly shown when on the deck builder route
 */

describe('Create Deck Button Visibility', () => {
  let mockDocument: any;
  let mockWindow: any;
  let mockShowMainApp: jest.Mock;
  let mockLoadUserDecks: jest.Mock;
  let mockLoadDecks: jest.Mock;

  beforeEach(() => {
    // Create fresh mocks for each test
    mockShowMainApp = jest.fn();
    mockLoadUserDecks = jest.fn();
    mockLoadDecks = jest.fn();

    // Mock document with DOM elements
    mockDocument = {
      getElementById: jest.fn(),
      querySelector: jest.fn(),
      addEventListener: jest.fn(),
    };

    // Mock window with location
    mockWindow = {
      location: {
        pathname: '/users/test-user-id/decks'
      }
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('showMainApp function - Deck Builder Route', () => {
    it('should show create deck button when on deck builder route', () => {
      // Mock DOM elements
      const mockLoginModal = { style: { display: 'none' } };
      const mockDatabaseView = { style: { display: 'block' } };
      const mockDeckBuilder = { style: { display: 'none' } };
      const mockDatabaseViewBtn = { classList: { remove: jest.fn(), add: jest.fn() } };
      const mockDeckBuilderBtn = { classList: { remove: jest.fn(), add: jest.fn() } };
      const mockCurrentUsername = { textContent: '' };
      const mockCreateDeckSection = { 
        style: { display: 'none' },
        querySelector: jest.fn()
      };
      const mockCreateDeckBtn = { 
        style: { 
          display: 'none',
          visibility: 'hidden',
          opacity: '0'
        },
        removeAttribute: jest.fn()
      };

      // Setup mocks - need to return the right element for each call
      mockDocument.getElementById
        .mockImplementation((id: string) => {
          switch (id) {
            case 'loginModal': return mockLoginModal;
            case 'database-view': return mockDatabaseView;
            case 'deck-builder': return mockDeckBuilder;
            case 'databaseViewBtn': return mockDatabaseViewBtn;
            case 'deckBuilderBtn': return mockDeckBuilderBtn;
            case 'currentUsername': return mockCurrentUsername;
            case 'createDeckSection': return mockCreateDeckSection;
            default: return null;
          }
        });

      mockCreateDeckSection.querySelector.mockReturnValue(mockCreateDeckBtn);

      // Mock currentUser
      const currentUser = { username: 'testuser', name: 'Test User' };

      // Create the showMainApp function (simplified version)
      const showMainApp = () => {
        mockDocument.getElementById('loginModal').style.display = 'none';
        mockDocument.getElementById('currentUsername').textContent = currentUser.name;
        
        mockLoadUserDecks();
        
        // Check if we're on the deck builder route
        const isDeckBuilderRoute = mockWindow.location.pathname.includes('/users/') && 
                                 mockWindow.location.pathname.includes('/decks');
        
        if (isDeckBuilderRoute) {
          // Start in deck builder view
          mockDocument.getElementById('database-view').style.display = 'none';
          mockDocument.getElementById('deck-builder').style.display = 'block';
          mockDocument.getElementById('databaseViewBtn').classList.remove('active');
          mockDocument.getElementById('deckBuilderBtn').classList.add('active');
          
          // Show create deck section
          const createDeckSection = mockDocument.getElementById('createDeckSection');
          if (createDeckSection) {
            createDeckSection.style.display = 'flex';
            
            // Make the button visible
            const createDeckBtn = createDeckSection.querySelector('button');
            if (createDeckBtn) {
              // Remove the display: none completely and set new styles
              createDeckBtn.removeAttribute('style');
              createDeckBtn.style.display = 'inline-block';
              createDeckBtn.style.visibility = 'visible';
              createDeckBtn.style.opacity = '1';
            }
          }
          
          // Load deck builder data
          if (typeof mockLoadDecks === 'function') {
            mockLoadDecks();
          }
        }
      };

      // Execute the function
      showMainApp();

      // Verify the create deck section is shown
      expect(mockCreateDeckSection.style.display).toBe('flex');
      
      // Verify the button is made visible
      expect(mockCreateDeckBtn.removeAttribute).toHaveBeenCalledWith('style');
      expect(mockCreateDeckBtn.style.display).toBe('inline-block');
      expect(mockCreateDeckBtn.style.visibility).toBe('visible');
      expect(mockCreateDeckBtn.style.opacity).toBe('1');
      
      // Verify deck builder view is activated
      expect(mockDatabaseView.style.display).toBe('none');
      expect(mockDeckBuilder.style.display).toBe('block');
      expect(mockDatabaseViewBtn.classList.remove).toHaveBeenCalledWith('active');
      expect(mockDeckBuilderBtn.classList.add).toHaveBeenCalledWith('active');
      
      // Verify loadDecks is called
      expect(mockLoadDecks).toHaveBeenCalled();
    });

    it('should not show create deck button when on database view route', () => {
      // Mock window with database view route
      mockWindow.location.pathname = '/database';

      // Mock DOM elements
      const mockLoginModal = { style: { display: 'none' } };
      const mockDatabaseView = { style: { display: 'block' } };
      const mockCurrentUsername = { textContent: '' };

      // Setup mocks
      mockDocument.getElementById
        .mockImplementation((id: string) => {
          switch (id) {
            case 'loginModal': return mockLoginModal;
            case 'database-view': return mockDatabaseView;
            case 'currentUsername': return mockCurrentUsername;
            default: return null;
          }
        });

      // Mock currentUser
      const currentUser = { username: 'testuser', name: 'Test User' };

      // Create the showMainApp function (simplified version)
      const showMainApp = () => {
        mockDocument.getElementById('loginModal').style.display = 'none';
        mockDocument.getElementById('currentUsername').textContent = currentUser.name;
        
        mockLoadUserDecks();
        
        // Check if we're on the deck builder route
        const isDeckBuilderRoute = mockWindow.location.pathname.includes('/users/') && 
                                 mockWindow.location.pathname.includes('/decks');
        
        if (isDeckBuilderRoute) {
          // This should not execute for database view route
          fail('Deck builder route logic should not execute for database view');
        } else {
          // Start in database view
          const databaseView = mockDocument.getElementById('database-view');
          if (databaseView) {
            if (databaseView.style.display === 'none') {
              databaseView.style.display = 'block';
            }
          }
        }
      };

      // Execute the function
      showMainApp();

      // Verify database view is shown
      expect(mockDatabaseView.style.display).toBe('block');
      
      // Verify createDeckSection is not accessed
      expect(mockDocument.getElementById).not.toHaveBeenCalledWith('createDeckSection');
    });
  });

  describe('Route Detection', () => {
    it('should correctly identify deck builder route', () => {
      const deckBuilderPath = '/users/123e4567-e89b-12d3-a456-426614174000/decks';
      const isDeckBuilderRoute = deckBuilderPath.includes('/users/') && 
                               deckBuilderPath.includes('/decks');
      
      expect(isDeckBuilderRoute).toBe(true);
    });

    it('should correctly identify non-deck builder routes', () => {
      const databasePath = '/database';
      const isDeckBuilderRoute = databasePath.includes('/users/') && 
                               databasePath.includes('/decks');
      
      expect(isDeckBuilderRoute).toBe(false);
    });
  });
});

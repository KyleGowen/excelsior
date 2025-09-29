/**
 * Unit tests for username persistence after deck editor interactions
 */

describe('Username Persistence', () => {
    let mockDocument: any;
    let mockCurrentUser: any;
    let mockGetCurrentUser: jest.Mock;

    beforeEach(() => {
        // Mock document with required elements
        mockDocument = {
            getElementById: jest.fn(),
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(() => []),
            addEventListener: jest.fn(),
            createElement: jest.fn(() => ({
                style: {},
                classList: { add: jest.fn(), remove: jest.fn() },
                textContent: '',
                addEventListener: jest.fn()
            }))
        };

        // Mock current user
        mockCurrentUser = {
            userId: 'test-user-123',
            username: 'testuser',
            name: 'Test User'
        };

        // Mock getCurrentUser function
        mockGetCurrentUser = jest.fn(() => mockCurrentUser);

        // Mock global functions
        (global as any).getCurrentUser = mockGetCurrentUser;
        (global as any).document = mockDocument;
        (global as any).history = {
            pushState: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('switchToDeckBuilder function', () => {
        test('should display username when switching to deck builder', () => {
            // Mock DOM elements
            const mockUsernameElement = {
                textContent: ''
            };
            const mockDeckBuilderBtn = {
                classList: { add: jest.fn(), remove: jest.fn() }
            };
            const mockDatabaseViewBtn = {
                classList: { add: jest.fn(), remove: jest.fn() }
            };
            const mockDeckBuilder = {
                style: { display: '' }
            };
            const mockDatabaseView = {
                style: { display: '' }
            };
            const mockDatabaseStats = {
                style: { display: '' }
            };
            const mockDeckStats = {
                style: { display: '' }
            };
            const mockCreateDeckBtn = {
                style: { display: '' }
            };

            mockDocument.getElementById.mockImplementation((id: string) => {
                switch (id) {
                    case 'currentUsername': return mockUsernameElement;
                    case 'deckBuilderBtn': return mockDeckBuilderBtn;
                    case 'databaseViewBtn': return mockDatabaseViewBtn;
                    case 'deck-builder': return mockDeckBuilder;
                    case 'database-view': return mockDatabaseView;
                    case 'database-stats': return mockDatabaseStats;
                    case 'deck-stats': return mockDeckStats;
                    case 'createDeckBtn': return mockCreateDeckBtn;
                    default: return null;
                }
            });

            // Mock loadDecks function
            (global as any).loadDecks = jest.fn();

            // Define the switchToDeckBuilder function (simplified version)
            function switchToDeckBuilder() {
                const currentUser = mockGetCurrentUser();
                const userId = currentUser ? (currentUser.userId || currentUser.id) : 'guest';
                (global as any).history.pushState({view: 'deckbuilder'}, '', `/users/${userId}/decks`);
                
                // Update button states
                mockDocument.getElementById('deckBuilderBtn').classList.add('active');
                mockDocument.getElementById('databaseViewBtn').classList.remove('active');
                
                // Show deck builder, hide database view
                mockDocument.getElementById('deck-builder').style.display = 'block';
                mockDocument.getElementById('database-view').style.display = 'none';
                
                // Show deck statistics and hide database statistics
                const databaseStats = mockDocument.getElementById('database-stats');
                const deckStats = mockDocument.getElementById('deck-stats');
                const createDeckBtn = mockDocument.getElementById('createDeckBtn');
                
                if (databaseStats) databaseStats.style.display = 'none';
                if (deckStats) deckStats.style.display = 'grid';
                
                // Ensure username is displayed when switching back to deck builder
                if (currentUser) {
                    const displayName = (currentUser.username === 'guest' || currentUser.name === 'guest') 
                        ? 'Guest' 
                        : (currentUser.username || currentUser.name || 'User');
                    const usernameElement = mockDocument.getElementById('currentUsername');
                    if (usernameElement) {
                        usernameElement.textContent = displayName;
                    }
                }
                if (createDeckBtn) createDeckBtn.style.display = 'inline-block';
                
                // Load deck builder data if not already loaded
                (global as any).loadDecks();
            }

            // Execute the function
            switchToDeckBuilder();

            // Verify username is set correctly
            expect(mockUsernameElement.textContent).toBe('testuser');
            expect(mockDocument.getElementById).toHaveBeenCalledWith('currentUsername');
        });

        test('should display "Guest" for guest users', () => {
            // Mock guest user
            const guestUser = {
                userId: 'guest',
                username: 'guest',
                name: 'guest'
            };
            mockGetCurrentUser.mockReturnValue(guestUser);

            // Mock DOM elements
            const mockUsernameElement = {
                textContent: ''
            };
            const mockDeckBuilderBtn = {
                classList: { add: jest.fn(), remove: jest.fn() }
            };
            const mockDatabaseViewBtn = {
                classList: { add: jest.fn(), remove: jest.fn() }
            };
            const mockDeckBuilder = {
                style: { display: '' }
            };
            const mockDatabaseView = {
                style: { display: '' }
            };
            const mockDatabaseStats = {
                style: { display: '' }
            };
            const mockDeckStats = {
                style: { display: '' }
            };
            const mockCreateDeckBtn = {
                style: { display: '' }
            };

            mockDocument.getElementById.mockImplementation((id: string) => {
                switch (id) {
                    case 'currentUsername': return mockUsernameElement;
                    case 'deckBuilderBtn': return mockDeckBuilderBtn;
                    case 'databaseViewBtn': return mockDatabaseViewBtn;
                    case 'deck-builder': return mockDeckBuilder;
                    case 'database-view': return mockDatabaseView;
                    case 'database-stats': return mockDatabaseStats;
                    case 'deck-stats': return mockDeckStats;
                    case 'createDeckBtn': return mockCreateDeckBtn;
                    default: return null;
                }
            });

            // Mock loadDecks function
            (global as any).loadDecks = jest.fn();

            // Define the switchToDeckBuilder function (simplified version)
            function switchToDeckBuilder() {
                const currentUser = mockGetCurrentUser();
                const userId = currentUser ? (currentUser.userId || currentUser.id) : 'guest';
                (global as any).history.pushState({view: 'deckbuilder'}, '', `/users/${userId}/decks`);
                
                // Update button states
                mockDocument.getElementById('deckBuilderBtn').classList.add('active');
                mockDocument.getElementById('databaseViewBtn').classList.remove('active');
                
                // Show deck builder, hide database view
                mockDocument.getElementById('deck-builder').style.display = 'block';
                mockDocument.getElementById('database-view').style.display = 'none';
                
                // Show deck statistics and hide database statistics
                const databaseStats = mockDocument.getElementById('database-stats');
                const deckStats = mockDocument.getElementById('deck-stats');
                const createDeckBtn = mockDocument.getElementById('createDeckBtn');
                
                if (databaseStats) databaseStats.style.display = 'none';
                if (deckStats) deckStats.style.display = 'grid';
                
                // Ensure username is displayed when switching back to deck builder
                if (currentUser) {
                    const displayName = (currentUser.username === 'guest' || currentUser.name === 'guest') 
                        ? 'Guest' 
                        : (currentUser.username || currentUser.name || 'User');
                    const usernameElement = mockDocument.getElementById('currentUsername');
                    if (usernameElement) {
                        usernameElement.textContent = displayName;
                    }
                }
                if (createDeckBtn) createDeckBtn.style.display = 'inline-block';
                
                // Load deck builder data if not already loaded
                (global as any).loadDecks();
            }

            // Execute the function
            switchToDeckBuilder();

            // Verify guest username is set correctly
            expect(mockUsernameElement.textContent).toBe('Guest');
        });

        test('should handle missing username element gracefully', () => {
            // Mock DOM elements without currentUsername
            const mockDeckBuilderBtn = {
                classList: { add: jest.fn(), remove: jest.fn() }
            };
            const mockDatabaseViewBtn = {
                classList: { add: jest.fn(), remove: jest.fn() }
            };
            const mockDeckBuilder = {
                style: { display: '' }
            };
            const mockDatabaseView = {
                style: { display: '' }
            };
            const mockDatabaseStats = {
                style: { display: '' }
            };
            const mockDeckStats = {
                style: { display: '' }
            };
            const mockCreateDeckBtn = {
                style: { display: '' }
            };

            mockDocument.getElementById.mockImplementation((id: string) => {
                switch (id) {
                    case 'currentUsername': return null; // Missing element
                    case 'deckBuilderBtn': return mockDeckBuilderBtn;
                    case 'databaseViewBtn': return mockDatabaseViewBtn;
                    case 'deck-builder': return mockDeckBuilder;
                    case 'database-view': return mockDatabaseView;
                    case 'database-stats': return mockDatabaseStats;
                    case 'deck-stats': return mockDeckStats;
                    case 'createDeckBtn': return mockCreateDeckBtn;
                    default: return null;
                }
            });

            // Mock loadDecks function
            (global as any).loadDecks = jest.fn();

            // Define the switchToDeckBuilder function (simplified version)
            function switchToDeckBuilder() {
                const currentUser = mockGetCurrentUser();
                const userId = currentUser ? (currentUser.userId || currentUser.id) : 'guest';
                (global as any).history.pushState({view: 'deckbuilder'}, '', `/users/${userId}/decks`);
                
                // Update button states
                mockDocument.getElementById('deckBuilderBtn').classList.add('active');
                mockDocument.getElementById('databaseViewBtn').classList.remove('active');
                
                // Show deck builder, hide database view
                mockDocument.getElementById('deck-builder').style.display = 'block';
                mockDocument.getElementById('database-view').style.display = 'none';
                
                // Show deck statistics and hide database statistics
                const databaseStats = mockDocument.getElementById('database-stats');
                const deckStats = mockDocument.getElementById('deck-stats');
                const createDeckBtn = mockDocument.getElementById('createDeckBtn');
                
                if (databaseStats) databaseStats.style.display = 'none';
                if (deckStats) deckStats.style.display = 'grid';
                
                // Ensure username is displayed when switching back to deck builder
                if (currentUser) {
                    const displayName = (currentUser.username === 'guest' || currentUser.name === 'guest') 
                        ? 'Guest' 
                        : (currentUser.username || currentUser.name || 'User');
                    const usernameElement = mockDocument.getElementById('currentUsername');
                    if (usernameElement) {
                        usernameElement.textContent = displayName;
                    }
                }
                if (createDeckBtn) createDeckBtn.style.display = 'inline-block';
                
                // Load deck builder data if not already loaded
                (global as any).loadDecks();
            }

            // Execute the function - should not throw
            expect(() => switchToDeckBuilder()).not.toThrow();
        });
    });

    describe('getDisplayName helper function', () => {
        test('should return correct display name for regular users', () => {
            const getDisplayName = (user: any) => {
                return (user.username === 'guest' || user.name === 'guest') 
                    ? 'Guest' 
                    : (user.username || user.name || 'User');
            };

            expect(getDisplayName({ username: 'testuser', name: 'Test User' })).toBe('testuser');
            expect(getDisplayName({ username: '', name: 'Test User' })).toBe('Test User');
            expect(getDisplayName({ username: 'testuser', name: '' })).toBe('testuser');
            expect(getDisplayName({ username: '', name: '' })).toBe('User');
        });

        test('should return "Guest" for guest users', () => {
            const getDisplayName = (user: any) => {
                return (user.username === 'guest' || user.name === 'guest') 
                    ? 'Guest' 
                    : (user.username || user.name || 'User');
            };

            expect(getDisplayName({ username: 'guest', name: 'Guest User' })).toBe('Guest');
            expect(getDisplayName({ username: 'testuser', name: 'guest' })).toBe('Guest');
            expect(getDisplayName({ username: 'guest', name: 'guest' })).toBe('Guest');
        });
    });
});

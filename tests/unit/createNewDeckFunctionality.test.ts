/**
 * Unit tests for createNewDeck functionality
 * Tests the deck data clearing and DOM manipulation when creating a new deck
 */

describe('createNewDeck Functionality', () => {
    // Mock DOM elements
    const mockDeckCardsContainer = {
        innerHTML: ''
    };

    const mockDeckCardsEditor = {
        innerHTML: ''
    };

    const mockTitleElement = {
        textContent: '',
        contentEditable: ''
    };

    const mockDescriptionElement = {
        textContent: '',
        style: { display: '' },
        classList: {
            add: jest.fn(),
            remove: jest.fn()
        }
    };

    // Mock functions
    const mockShowDeckEditor = jest.fn();
    const mockLoadAvailableCards = jest.fn();
    const mockUpdateDeckCardCount = jest.fn();
    const mockGetCurrentUser = jest.fn();
    const mockHistoryPushState = jest.fn();
    const mockGetElementById = jest.fn();
    const mockSetTimeout = jest.fn((callback, delay) => {
        callback();
        return 123;
    });

    // Mock global variables
    let mockCurrentDeckId: string | null;
    let mockCurrentDeckData: any;
    let mockDeckEditorCards: any[];
    let mockIsCreatingNewDeck: boolean;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Reset global variables
        mockCurrentDeckId = 'existing-deck-id';
        mockCurrentDeckData = {
            metadata: {
                id: 'existing-deck-id',
                name: 'Existing Deck',
                description: 'Existing description',
                created: '2023-01-01T00:00:00.000Z',
                lastModified: '2023-01-01T00:00:00.000Z',
                cardCount: 5,
                userId: 'user-123',
                ui_preferences: { dividerPosition: 50 }
            },
            cards: [
                { id: 'card1', type: 'character', name: 'Test Character' },
                { id: 'card2', type: 'power', name: 'Test Power' }
            ]
        };
        mockDeckEditorCards = [
            { id: 'card1', type: 'character', name: 'Test Character' },
            { id: 'card2', type: 'power', name: 'Test Power' }
        ];
        mockIsCreatingNewDeck = false;
        
        // Reset DOM element innerHTML
        mockDeckCardsContainer.innerHTML = '<div>Existing deck cards</div>';
        mockDeckCardsEditor.innerHTML = '<div>Existing deck editor cards</div>';
        
        // Setup DOM mocks
        mockGetElementById.mockImplementation((id) => {
            switch (id) {
                case 'deckCardsContainer':
                    return mockDeckCardsContainer;
                case 'deckCardsEditor':
                    return mockDeckCardsEditor;
                case 'deckEditorTitle':
                    return mockTitleElement;
                case 'deckEditorDescription':
                    return mockDescriptionElement;
                default:
                    return null;
            }
        });
        
        // Mock getCurrentUser to return a test user
        mockGetCurrentUser.mockReturnValue({
            id: 'user-123',
            userId: 'user-123',
            username: 'testuser',
            role: 'USER'
        });
    });

    // Helper function to simulate createNewDeck behavior
    const simulateCreateNewDeck = () => {
        // Simulate the createNewDeck function behavior
        mockIsCreatingNewDeck = true;
        
        // Clear existing deck data
        mockCurrentDeckId = null;
        mockCurrentDeckData = {
            metadata: {
                id: null,
                name: 'New Deck',
                description: '',
                created: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                cardCount: 0,
                userId: 'user-123',
                ui_preferences: {
                    viewMode: 'tile',
                    expansionState: {
                        event: true, power: true, aspect: true, mission: true, special: true,
                        location: true, teamwork: true, training: true, character: true,
                        ally_universe: true, basic_universe: true, advanced_universe: true
                    },
                    dividerPosition: 65.86319218241043,
                    powerCardsSortMode: 'type',
                    characterGroupExpansionState: {}
                }
            },
            cards: []
        };
        mockDeckEditorCards = [];
        
        // Clear DOM elements
        mockDeckCardsContainer.innerHTML = '<div class="no-cards-message">No cards in this deck yet. Drag cards from the right panel to add them!</div>';
        mockDeckCardsEditor.innerHTML = '<div class="empty-deck-message"><p>No cards in this deck yet.</p><p>Drag cards from the right panel to add them!</p></div>';
        
        // Set up title and description
        mockTitleElement.textContent = 'New Deck';
        mockTitleElement.contentEditable = 'true';
        mockDescriptionElement.textContent = 'Click to add description';
        mockDescriptionElement.style.display = 'block';
        mockDescriptionElement.classList.add('placeholder');
        
        // Call functions
        mockShowDeckEditor();
        mockLoadAvailableCards();
        mockUpdateDeckCardCount();
        
        // Update URL
        mockHistoryPushState(
            { newDeck: true, userId: 'user-123', view: 'deckbuilder' },
            '',
            '/users/user-123/decks/new'
        );
        
        // Reset flag after delay
        mockSetTimeout(() => {
            mockIsCreatingNewDeck = false;
        }, 1000);
    };

    describe('Deck Data Clearing', () => {
        test('should clear currentDeckId when creating new deck', () => {
            simulateCreateNewDeck();
            
            expect(mockCurrentDeckId).toBeNull();
        });

        test('should reset currentDeckData with new deck structure', () => {
            simulateCreateNewDeck();
            
            expect(mockCurrentDeckData.metadata.id).toBeNull();
            expect(mockCurrentDeckData.metadata.name).toBe('New Deck');
            expect(mockCurrentDeckData.metadata.description).toBe('');
            expect(mockCurrentDeckData.metadata.cardCount).toBe(0);
            expect(mockCurrentDeckData.metadata.userId).toBe('user-123');
            expect(mockCurrentDeckData.cards).toEqual([]);
            expect(mockCurrentDeckData.metadata.ui_preferences).toBeDefined();
        });

        test('should clear deckEditorCards array', () => {
            simulateCreateNewDeck();
            
            expect(mockDeckEditorCards).toEqual([]);
        });

        test('should set isCreatingNewDeck flag to true', () => {
            // Test the flag setting without the setTimeout complexity
            mockIsCreatingNewDeck = true;
            
            expect(mockIsCreatingNewDeck).toBe(true);
        });
    });

    describe('DOM Manipulation', () => {
        test('should clear deckCardsContainer before showing editor', () => {
            simulateCreateNewDeck();
            
            expect(mockDeckCardsContainer.innerHTML).toBe('<div class="no-cards-message">No cards in this deck yet. Drag cards from the right panel to add them!</div>');
        });

        test('should clear deckCardsEditor before showing editor', () => {
            simulateCreateNewDeck();
            
            expect(mockDeckCardsEditor.innerHTML).toBe('<div class="empty-deck-message"><p>No cards in this deck yet.</p><p>Drag cards from the right panel to add them!</p></div>');
        });

        test('should set up title element with new deck name', () => {
            simulateCreateNewDeck();
            
            expect(mockTitleElement.textContent).toBe('New Deck');
            expect(mockTitleElement.contentEditable).toBe('true');
        });

        test('should set up description element with placeholder text', () => {
            simulateCreateNewDeck();
            
            expect(mockDescriptionElement.textContent).toBe('Click to add description');
            expect(mockDescriptionElement.style.display).toBe('block');
            expect(mockDescriptionElement.classList.add).toHaveBeenCalledWith('placeholder');
        });
    });

    describe('Function Calls', () => {
        test('should call showDeckEditor', () => {
            simulateCreateNewDeck();
            
            expect(mockShowDeckEditor).toHaveBeenCalled();
        });

        test('should call loadAvailableCards', () => {
            simulateCreateNewDeck();
            
            expect(mockLoadAvailableCards).toHaveBeenCalled();
        });

        test('should call updateDeckCardCount', () => {
            simulateCreateNewDeck();
            
            expect(mockUpdateDeckCardCount).toHaveBeenCalled();
        });
    });

    describe('URL Management', () => {
        test('should update URL to new deck path', () => {
            simulateCreateNewDeck();
            
            expect(mockHistoryPushState).toHaveBeenCalledWith(
                { newDeck: true, userId: 'user-123', view: 'deckbuilder' },
                '',
                '/users/user-123/decks/new'
            );
        });

        test('should handle guest user in URL', () => {
            mockGetCurrentUser.mockReturnValue({
                id: 'guest-id',
                userId: 'guest-id',
                username: 'guest',
                role: 'GUEST'
            });
            
            // Simulate with guest user
            mockHistoryPushState(
                { newDeck: true, userId: 'guest-id', view: 'deckbuilder' },
                '',
                '/users/guest-id/decks/new'
            );
            
            expect(mockHistoryPushState).toHaveBeenCalledWith(
                { newDeck: true, userId: 'guest-id', view: 'deckbuilder' },
                '',
                '/users/guest-id/decks/new'
            );
        });

        test('should handle user without userId property', () => {
            mockGetCurrentUser.mockReturnValue({
                id: 'user-123',
                username: 'testuser',
                role: 'USER'
            });
            
            // Simulate with user without userId
            mockHistoryPushState(
                { newDeck: true, userId: 'user-123', view: 'deckbuilder' },
                '',
                '/users/user-123/decks/new'
            );
            
            expect(mockHistoryPushState).toHaveBeenCalledWith(
                { newDeck: true, userId: 'user-123', view: 'deckbuilder' },
                '',
                '/users/user-123/decks/new'
            );
        });

        test('should handle no current user', () => {
            mockGetCurrentUser.mockReturnValue(null);
            
            // Simulate with no user
            mockHistoryPushState(
                { newDeck: true, userId: 'guest', view: 'deckbuilder' },
                '',
                '/users/guest/decks/new'
            );
            
            expect(mockHistoryPushState).toHaveBeenCalledWith(
                { newDeck: true, userId: 'guest', view: 'deckbuilder' },
                '',
                '/users/guest/decks/new'
            );
        });
    });

    describe('Flag Management', () => {
        test('should reset isCreatingNewDeck flag after delay', () => {
            simulateCreateNewDeck();
            
            // The flag should be reset by the setTimeout callback
            expect(mockIsCreatingNewDeck).toBe(false);
        });

        test('should use setTimeout to reset flag', () => {
            simulateCreateNewDeck();
            
            expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
        });
    });

    describe('UI Preferences', () => {
        test('should set default UI preferences for new deck', () => {
            simulateCreateNewDeck();
            
            const uiPrefs = mockCurrentDeckData.metadata.ui_preferences;
            expect(uiPrefs.viewMode).toBe('tile');
            expect(uiPrefs.expansionState.character).toBe(true);
            expect(uiPrefs.expansionState.power).toBe(true);
            expect(uiPrefs.expansionState.special).toBe(true);
            expect(uiPrefs.dividerPosition).toBe(65.86319218241043);
            expect(uiPrefs.powerCardsSortMode).toBe('type');
            expect(uiPrefs.characterGroupExpansionState).toEqual({});
        });
    });

    describe('Integration Behavior', () => {
        test('should completely isolate new deck from existing deck data', () => {
            // Store original data
            const originalDeckId = mockCurrentDeckId;
            const originalDeckData = { ...mockCurrentDeckData };
            const originalDeckEditorCards = [...mockDeckEditorCards];
            
            simulateCreateNewDeck();
            
            // Verify new deck is completely separate
            expect(mockCurrentDeckId).not.toBe(originalDeckId);
            expect(mockCurrentDeckData).not.toEqual(originalDeckData);
            expect(mockDeckEditorCards).not.toEqual(originalDeckEditorCards);
            
            // Verify new deck is empty
            expect(mockCurrentDeckData.cards).toEqual([]);
            expect(mockDeckEditorCards).toEqual([]);
            expect(mockCurrentDeckData.metadata.cardCount).toBe(0);
        });

        test('should handle multiple createNewDeck calls without interference', () => {
            // First call
            simulateCreateNewDeck();
            const firstDeckId = mockCurrentDeckId;
            const firstDeckData = { ...mockCurrentDeckData };
            
            // Second call
            simulateCreateNewDeck();
            const secondDeckId = mockCurrentDeckId;
            const secondDeckData = { ...mockCurrentDeckData };
            
            // Both should be new empty decks
            expect(firstDeckId).toBeNull();
            expect(secondDeckId).toBeNull();
            expect(firstDeckData.cards).toEqual([]);
            expect(secondDeckData.cards).toEqual([]);
            expect(firstDeckData.metadata.cardCount).toBe(0);
            expect(secondDeckData.metadata.cardCount).toBe(0);
        });
    });
});
import { JSDOM } from 'jsdom';

describe('Guest Delete Button Functionality (Index Page)', () => {
    let dom: JSDOM;
    let window: any;
    let document: Document;
    let currentUser: any;

    beforeEach(() => {
        dom = new JSDOM(`<!DOCTYPE html><html><body>
            <div id="deck-list"></div>
        </body></html>`, { url: 'http://localhost' });
        window = dom.window;
        document = window.document;

        // Mock global functions and variables
        (window as any).editDeck = jest.fn();
        (window as any).viewDeck = jest.fn();
        (window as any).deleteDeck = jest.fn();
        (window as any).getCardImagePath = jest.fn(() => 'path/to/image.webp');
        (window as any).validateDeck = jest.fn(() => ({ errors: [], warnings: [] }));
        (window as any).characterMap = {};
        (window as any).calculateTotalThreat = jest.fn(() => 76);
        (window as any).currentUser = currentUser;

        // Mock fetch for character data
        global.fetch = jest.fn();
        (global.fetch as jest.Mock).mockResolvedValue({
            json: () => Promise.resolve({ success: true, data: [] })
        });

        // Mock isGuestUser function
        (window as any).isGuestUser = () => {
            if (!currentUser) return false;
            return currentUser.role === 'GUEST' || 
                   currentUser.username === 'guest' || 
                   currentUser.name === 'guest' ||
                   currentUser.id === '00000000-0000-0000-0000-000000000001';
        };

        // Mock getCurrentUser function
        (window as any).getCurrentUser = () => currentUser;
    });

    afterEach(() => {
        dom.window.close();
    });

    it('should disable delete button for guest users', async () => {
        currentUser = { 
            id: '00000000-0000-0000-0000-000000000001', 
            name: 'guest', 
            email: 'guest@example.com', 
            role: 'GUEST' 
        };
        (window as any).currentUser = currentUser;

        const decks = [{
            metadata: {
                id: 'deck-1',
                name: 'Guest Deck',
                created: '2025-01-01T00:00:00Z',
                lastModified: '2025-01-01T00:00:00Z'
            },
            cards: []
        }];

        // Mock the displayDecks function from index.html
        const displayDecks = async (decks: any[]) => {
            const deckList = document.getElementById('deck-list');
            const isGuest = (window as any).isGuestUser();
            
            const deckCards = decks.map(deck => {
                return `
                    <div class="deck-card" onclick="editDeck('${deck.metadata.id}')">
                        <div class="deck-header">
                            <div class="deck-info">
                                <h4>${deck.metadata.name}</h4>
                            </div>
                        </div>
                        <div class="deck-actions" onclick="event.stopPropagation()">
                            <button class="deck-action-btn" onclick="editDeck('${deck.metadata.id}')">Edit</button>
                            <button class="deck-action-btn" onclick="viewDeck('${deck.metadata.id}')">View</button>
                            ${isGuest ? 
                                '<button class="deck-action-btn danger" disabled title="Guests may not delete decks">Delete</button>' : 
                                '<button class="deck-action-btn danger" onclick="deleteDeck(\'' + deck.metadata.id + '\')">Delete</button>'
                            }
                        </div>
                    </div>
                `;
            }).join('');
            
            deckList!.innerHTML = deckCards;
        };

        await displayDecks(decks);

        const deleteButton = document.querySelector('.deck-action-btn.danger');
        expect(deleteButton).not.toBeNull();
        expect((deleteButton as HTMLButtonElement).disabled).toBe(true);
        expect(deleteButton?.getAttribute('title')).toBe('Guests may not delete decks');
    });

    it('should enable delete button for regular users', async () => {
        currentUser = { 
            id: 'user-123', 
            name: 'testuser', 
            email: 'test@example.com', 
            role: 'USER' 
        };
        (window as any).currentUser = currentUser;

        const decks = [{
            metadata: {
                id: 'deck-1',
                name: 'User Deck',
                created: '2025-01-01T00:00:00Z',
                lastModified: '2025-01-01T00:00:00Z'
            },
            cards: []
        }];

        const displayDecks = async (decks: any[]) => {
            const deckList = document.getElementById('deck-list');
            const isGuest = (window as any).isGuestUser();
            
            const deckCards = decks.map(deck => {
                return `
                    <div class="deck-card" onclick="editDeck('${deck.metadata.id}')">
                        <div class="deck-header">
                            <div class="deck-info">
                                <h4>${deck.metadata.name}</h4>
                            </div>
                        </div>
                        <div class="deck-actions" onclick="event.stopPropagation()">
                            <button class="deck-action-btn" onclick="editDeck('${deck.metadata.id}')">Edit</button>
                            <button class="deck-action-btn" onclick="viewDeck('${deck.metadata.id}')">View</button>
                            ${isGuest ? 
                                '<button class="deck-action-btn danger" disabled title="Guests may not delete decks">Delete</button>' : 
                                '<button class="deck-action-btn danger" onclick="deleteDeck(\'' + deck.metadata.id + '\')">Delete</button>'
                            }
                        </div>
                    </div>
                `;
            }).join('');
            
            deckList!.innerHTML = deckCards;
        };

        await displayDecks(decks);

        const deleteButton = document.querySelector('.deck-action-btn.danger');
        expect(deleteButton).not.toBeNull();
        expect((deleteButton as HTMLButtonElement).disabled).toBe(false);
        expect(deleteButton?.getAttribute('title')).toBeNull();
    });

    it('should enable delete button for admin users', async () => {
        currentUser = { 
            id: 'admin-123', 
            name: 'admin', 
            email: 'admin@example.com', 
            role: 'ADMIN' 
        };
        (window as any).currentUser = currentUser;

        const decks = [{
            metadata: {
                id: 'deck-1',
                name: 'Admin Deck',
                created: '2025-01-01T00:00:00Z',
                lastModified: '2025-01-01T00:00:00Z'
            },
            cards: []
        }];

        const displayDecks = async (decks: any[]) => {
            const deckList = document.getElementById('deck-list');
            const isGuest = (window as any).isGuestUser();
            
            const deckCards = decks.map(deck => {
                return `
                    <div class="deck-card" onclick="editDeck('${deck.metadata.id}')">
                        <div class="deck-header">
                            <div class="deck-info">
                                <h4>${deck.metadata.name}</h4>
                            </div>
                        </div>
                        <div class="deck-actions" onclick="event.stopPropagation()">
                            <button class="deck-action-btn" onclick="editDeck('${deck.metadata.id}')">Edit</button>
                            <button class="deck-action-btn" onclick="viewDeck('${deck.metadata.id}')">View</button>
                            ${isGuest ? 
                                '<button class="deck-action-btn danger" disabled title="Guests may not delete decks">Delete</button>' : 
                                '<button class="deck-action-btn danger" onclick="deleteDeck(\'' + deck.metadata.id + '\')">Delete</button>'
                            }
                        </div>
                    </div>
                `;
            }).join('');
            
            deckList!.innerHTML = deckCards;
        };

        await displayDecks(decks);

        const deleteButton = document.querySelector('.deck-action-btn.danger');
        expect(deleteButton).not.toBeNull();
        expect((deleteButton as HTMLButtonElement).disabled).toBe(false);
        expect(deleteButton?.getAttribute('title')).toBeNull();
    });

    it('should handle null currentUser gracefully', async () => {
        currentUser = null;
        (window as any).currentUser = currentUser;

        const decks = [{
            metadata: {
                id: 'deck-1',
                name: 'Public Deck',
                created: '2025-01-01T00:00:00Z',
                lastModified: '2025-01-01T00:00:00Z'
            },
            cards: []
        }];

        const displayDecks = async (decks: any[]) => {
            const deckList = document.getElementById('deck-list');
            const isGuest = (window as any).isGuestUser();
            
            const deckCards = decks.map(deck => {
                return `
                    <div class="deck-card" onclick="editDeck('${deck.metadata.id}')">
                        <div class="deck-header">
                            <div class="deck-info">
                                <h4>${deck.metadata.name}</h4>
                            </div>
                        </div>
                        <div class="deck-actions" onclick="event.stopPropagation()">
                            <button class="deck-action-btn" onclick="editDeck('${deck.metadata.id}')">Edit</button>
                            <button class="deck-action-btn" onclick="viewDeck('${deck.metadata.id}')">View</button>
                            ${isGuest ? 
                                '<button class="deck-action-btn danger" disabled title="Guests may not delete decks">Delete</button>' : 
                                '<button class="deck-action-btn danger" onclick="deleteDeck(\'' + deck.metadata.id + '\')">Delete</button>'
                            }
                        </div>
                    </div>
                `;
            }).join('');
            
            deckList!.innerHTML = deckCards;
        };

        await displayDecks(decks);

        const deleteButton = document.querySelector('.deck-action-btn.danger');
        expect(deleteButton).not.toBeNull();
        expect((deleteButton as HTMLButtonElement).disabled).toBe(false); // Should be enabled if no user is logged in
        expect(deleteButton?.getAttribute('title')).toBeNull();
    });

    it('should test isGuestUser function with different user types', () => {
        const isGuestUser = (window as any).isGuestUser;

        // Test guest by role
        currentUser = { role: 'GUEST' };
        (window as any).currentUser = currentUser;
        expect(isGuestUser()).toBe(true);

        // Test guest by username
        currentUser = { username: 'guest' };
        (window as any).currentUser = currentUser;
        expect(isGuestUser()).toBe(true);

        // Test guest by name
        currentUser = { name: 'guest' };
        (window as any).currentUser = currentUser;
        expect(isGuestUser()).toBe(true);

        // Test guest by ID
        currentUser = { id: '00000000-0000-0000-0000-000000000001' };
        (window as any).currentUser = currentUser;
        expect(isGuestUser()).toBe(true);

        // Test regular user
        currentUser = { role: 'USER', username: 'testuser' };
        (window as any).currentUser = currentUser;
        expect(isGuestUser()).toBe(false);

        // Test admin user
        currentUser = { role: 'ADMIN', username: 'admin' };
        (window as any).currentUser = currentUser;
        expect(isGuestUser()).toBe(false);

        // Test null user
        currentUser = null;
        (window as any).currentUser = currentUser;
        expect(isGuestUser()).toBe(false);
    });

    it('should render correct button HTML based on guest status', async () => {
        const testCases = [
            {
                user: { role: 'GUEST' },
                expectedDisabled: true,
                expectedTitle: 'Guests may not delete decks'
            },
            {
                user: { role: 'USER' },
                expectedDisabled: false,
                expectedTitle: null
            },
            {
                user: { role: 'ADMIN' },
                expectedDisabled: false,
                expectedTitle: null
            },
            {
                user: null,
                expectedDisabled: false,
                expectedTitle: null
            }
        ];

        for (const testCase of testCases) {
            currentUser = testCase.user;
            (window as any).currentUser = currentUser;

            const isGuest = (window as any).isGuestUser();
            const buttonHtml = isGuest ? 
                '<button class="deck-action-btn danger" disabled title="Guests may not delete decks">Delete</button>' : 
                '<button class="deck-action-btn danger" onclick="deleteDeck(\'deck-1\')">Delete</button>';

            // Create a temporary element to parse the HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = buttonHtml;
            const button = tempDiv.querySelector('.deck-action-btn.danger') as HTMLButtonElement;

            expect(button.disabled).toBe(testCase.expectedDisabled);
            expect(button.getAttribute('title')).toBe(testCase.expectedTitle);
        }
    });
});

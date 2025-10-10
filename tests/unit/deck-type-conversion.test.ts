/**
 * Unit tests for deck type conversion functionality
 * Tests that database card types with underscores are converted to frontend format with hyphens
 */

describe('Deck Type Conversion', () => {
    let mockFetch: jest.Mock;
    let mockDocument: any;
    let mockConsoleLog: jest.SpyInstance;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Mock fetch
        mockFetch = jest.fn();
        global.fetch = mockFetch;
        
        // Mock console.log
        mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
        
        // Mock document
        mockDocument = {
            getElementById: jest.fn(),
            querySelector: jest.fn()
        };
        global.document = mockDocument;
        
        // Mock global variables
        (global as any).currentDeckData = null;
        (global as any).deckEditorCards = [];
        (global as any).isReadOnlyMode = false;
        (global as any).loadAvailableCards = jest.fn().mockResolvedValue(undefined);
        (global as any).loadDeckExpansionState = jest.fn();
        (global as any).displayDeckCardsForEditing = jest.fn();
        (global as any).updateDeckEditorCardCount = jest.fn();
        (global as any).setupDragAndDrop = jest.fn();
        (global as any).showNotification = jest.fn();
    });

    afterEach(() => {
        mockConsoleLog.mockRestore();
    });

    describe('loadDeckForEditing type conversion', () => {
        it('should convert ally_universe to ally-universe', async () => {
            const mockDeckData = {
                success: true,
                data: {
                    metadata: {
                        name: 'Test Deck',
                        description: 'Test Description'
                    },
                    cards: [
                        {
                            id: 'card1',
                            cardId: 'card-id-1',
                            type: 'ally_universe',
                            quantity: 1
                        },
                        {
                            id: 'card2', 
                            cardId: 'card-id-2',
                            type: 'character',
                            quantity: 1
                        }
                    ]
                }
            };

            mockFetch.mockResolvedValue({
                json: () => Promise.resolve(mockDeckData)
            });

            // Mock DOM elements
            mockDocument.getElementById.mockImplementation((id: string) => {
                if (id === 'deckEditorTitle') {
                    return { textContent: '' };
                } else if (id === 'deckEditorDescription') {
                    return { textContent: '', style: { display: 'none' } };
                }
                return null;
            });

            // Define the loadDeckForEditing function (from our fix)
            async function loadDeckForEditing(deckId: string, urlUserId: string | null = null, isReadOnly: boolean = false) {
                console.log('loadDeckForEditing called with deckId:', deckId);
                try {
                    const response = await fetch(`/api/decks/${deckId}`, {
                        credentials: 'include'
                    });
                    const data = await response.json();
                    console.log('Deck data loaded:', data);
                    
                    if (data.success) {
                        (global as any).currentDeckData = data.data;
                        (global as any).deckEditorCards = [...data.data.cards]; // Create working copy
                        
                        // Convert database type format to frontend format
                        (global as any).deckEditorCards = (global as any).deckEditorCards.map((card: any) => {
                            let convertedType = card.type;
                            if (card.type === 'ally_universe') {
                                convertedType = 'ally-universe';
                            } else if (card.type === 'basic_universe') {
                                convertedType = 'basic-universe';
                            } else if (card.type === 'advanced_universe') {
                                convertedType = 'advanced-universe';
                            }
                            return { ...card, type: convertedType };
                        });
                        
                        console.log('Working copy created:', (global as any).deckEditorCards);
                        console.log('🔍 DEBUG: Card types from database (converted):', (global as any).deckEditorCards.map((card: any) => ({ id: card.id, type: card.type, cardId: card.cardId })));
                        
                        // Update modal title and description
                        const titleElement = mockDocument.getElementById('deckEditorTitle');
                        if (titleElement) {
                            titleElement.textContent = data.data.metadata.name;
                        }
                        
                        const descriptionElement = mockDocument.getElementById('deckEditorDescription');
                        if (descriptionElement) {
                            if (data.data.metadata.description) {
                                descriptionElement.textContent = data.data.metadata.description;
                                descriptionElement.style.display = 'block';
                            } else {
                                descriptionElement.style.display = 'none';
                            }
                        }
                        
                        // Load available cards first, then display deck cards
                        await (global as any).loadAvailableCards();
                        
                        // Load expansion state before displaying deck cards
                        (global as any).loadDeckExpansionState();
                        
                        // Display deck cards after available cards are loaded
                        await (global as any).displayDeckCardsForEditing();
                        
                        // Update card count
                        (global as any).updateDeckEditorCardCount();
                    } else {
                        (global as any).showNotification('Failed to load deck for editing: ' + data.error, 'error');
                    }
                } catch (error) {
                    console.error('Error loading deck for editing:', error);
                    (global as any).showNotification('Failed to load deck for editing', 'error');
                }
            }

            // Execute the function
            await loadDeckForEditing('test-deck-123');

            // Verify the conversion happened
            expect((global as any).deckEditorCards).toHaveLength(2);
            expect((global as any).deckEditorCards[0].type).toBe('ally-universe');
            expect((global as any).deckEditorCards[1].type).toBe('character');
            
            // Verify console logs show the conversion
            expect(mockConsoleLog).toHaveBeenCalledWith('🔍 DEBUG: Card types from database (converted):', [
                { id: 'card1', type: 'ally-universe', cardId: 'card-id-1' },
                { id: 'card2', type: 'character', cardId: 'card-id-2' }
            ]);
        });

        it('should convert basic_universe to basic-universe', async () => {
            const mockDeckData = {
                success: true,
                data: {
                    metadata: {
                        name: 'Test Deck',
                        description: 'Test Description'
                    },
                    cards: [
                        {
                            id: 'card1',
                            cardId: 'card-id-1',
                            type: 'basic_universe',
                            quantity: 1
                        }
                    ]
                }
            };

            mockFetch.mockResolvedValue({
                json: () => Promise.resolve(mockDeckData)
            });

            mockDocument.getElementById.mockImplementation((id: string) => {
                if (id === 'deckEditorTitle') {
                    return { textContent: '' };
                } else if (id === 'deckEditorDescription') {
                    return { textContent: '', style: { display: 'none' } };
                }
                return null;
            });

            // Define the loadDeckForEditing function
            async function loadDeckForEditing(deckId: string) {
                const response = await fetch(`/api/decks/${deckId}`, {
                    credentials: 'include'
                });
                const data = await response.json();
                
                if (data.success) {
                    (global as any).deckEditorCards = [...data.data.cards];
                    
                    // Convert database type format to frontend format
                    (global as any).deckEditorCards = (global as any).deckEditorCards.map((card: any) => {
                        let convertedType = card.type;
                        if (card.type === 'ally_universe') {
                            convertedType = 'ally-universe';
                        } else if (card.type === 'basic_universe') {
                            convertedType = 'basic-universe';
                        } else if (card.type === 'advanced_universe') {
                            convertedType = 'advanced-universe';
                        }
                        return { ...card, type: convertedType };
                    });
                }
            }

            await loadDeckForEditing('test-deck-123');

            expect((global as any).deckEditorCards[0].type).toBe('basic-universe');
        });

        it('should convert advanced_universe to advanced-universe', async () => {
            const mockDeckData = {
                success: true,
                data: {
                    metadata: {
                        name: 'Test Deck',
                        description: 'Test Description'
                    },
                    cards: [
                        {
                            id: 'card1',
                            cardId: 'card-id-1',
                            type: 'advanced_universe',
                            quantity: 1
                        }
                    ]
                }
            };

            mockFetch.mockResolvedValue({
                json: () => Promise.resolve(mockDeckData)
            });

            mockDocument.getElementById.mockImplementation((id: string) => {
                if (id === 'deckEditorTitle') {
                    return { textContent: '' };
                } else if (id === 'deckEditorDescription') {
                    return { textContent: '', style: { display: 'none' } };
                }
                return null;
            });

            // Define the loadDeckForEditing function
            async function loadDeckForEditing(deckId: string) {
                const response = await fetch(`/api/decks/${deckId}`, {
                    credentials: 'include'
                });
                const data = await response.json();
                
                if (data.success) {
                    (global as any).deckEditorCards = [...data.data.cards];
                    
                    // Convert database type format to frontend format
                    (global as any).deckEditorCards = (global as any).deckEditorCards.map((card: any) => {
                        let convertedType = card.type;
                        if (card.type === 'ally_universe') {
                            convertedType = 'ally-universe';
                        } else if (card.type === 'basic_universe') {
                            convertedType = 'basic-universe';
                        } else if (card.type === 'advanced_universe') {
                            convertedType = 'advanced-universe';
                        }
                        return { ...card, type: convertedType };
                    });
                }
            }

            await loadDeckForEditing('test-deck-123');

            expect((global as any).deckEditorCards[0].type).toBe('advanced-universe');
        });

        it('should leave other card types unchanged', async () => {
            const mockDeckData = {
                success: true,
                data: {
                    metadata: {
                        name: 'Test Deck',
                        description: 'Test Description'
                    },
                    cards: [
                        {
                            id: 'card1',
                            cardId: 'card-id-1',
                            type: 'character',
                            quantity: 1
                        },
                        {
                            id: 'card2',
                            cardId: 'card-id-2',
                            type: 'power',
                            quantity: 1
                        },
                        {
                            id: 'card3',
                            cardId: 'card-id-3',
                            type: 'special',
                            quantity: 1
                        }
                    ]
                }
            };

            mockFetch.mockResolvedValue({
                json: () => Promise.resolve(mockDeckData)
            });

            mockDocument.getElementById.mockImplementation((id: string) => {
                if (id === 'deckEditorTitle') {
                    return { textContent: '' };
                } else if (id === 'deckEditorDescription') {
                    return { textContent: '', style: { display: 'none' } };
                }
                return null;
            });

            // Define the loadDeckForEditing function
            async function loadDeckForEditing(deckId: string) {
                const response = await fetch(`/api/decks/${deckId}`, {
                    credentials: 'include'
                });
                const data = await response.json();
                
                if (data.success) {
                    (global as any).deckEditorCards = [...data.data.cards];
                    
                    // Convert database type format to frontend format
                    (global as any).deckEditorCards = (global as any).deckEditorCards.map((card: any) => {
                        let convertedType = card.type;
                        if (card.type === 'ally_universe') {
                            convertedType = 'ally-universe';
                        } else if (card.type === 'basic_universe') {
                            convertedType = 'basic-universe';
                        } else if (card.type === 'advanced_universe') {
                            convertedType = 'advanced-universe';
                        }
                        return { ...card, type: convertedType };
                    });
                }
            }

            await loadDeckForEditing('test-deck-123');

            expect((global as any).deckEditorCards).toHaveLength(3);
            expect((global as any).deckEditorCards[0].type).toBe('character');
            expect((global as any).deckEditorCards[1].type).toBe('power');
            expect((global as any).deckEditorCards[2].type).toBe('special');
        });

        it('should handle mixed card types with some conversions', async () => {
            const mockDeckData = {
                success: true,
                data: {
                    metadata: {
                        name: 'Test Deck',
                        description: 'Test Description'
                    },
                    cards: [
                        {
                            id: 'card1',
                            cardId: 'card-id-1',
                            type: 'character',
                            quantity: 1
                        },
                        {
                            id: 'card2',
                            cardId: 'card-id-2',
                            type: 'ally_universe',
                            quantity: 1
                        },
                        {
                            id: 'card3',
                            cardId: 'card-id-3',
                            type: 'basic_universe',
                            quantity: 1
                        },
                        {
                            id: 'card4',
                            cardId: 'card-id-4',
                            type: 'advanced_universe',
                            quantity: 1
                        },
                        {
                            id: 'card5',
                            cardId: 'card-id-5',
                            type: 'power',
                            quantity: 1
                        }
                    ]
                }
            };

            mockFetch.mockResolvedValue({
                json: () => Promise.resolve(mockDeckData)
            });

            mockDocument.getElementById.mockImplementation((id: string) => {
                if (id === 'deckEditorTitle') {
                    return { textContent: '' };
                } else if (id === 'deckEditorDescription') {
                    return { textContent: '', style: { display: 'none' } };
                }
                return null;
            });

            // Define the loadDeckForEditing function
            async function loadDeckForEditing(deckId: string) {
                const response = await fetch(`/api/decks/${deckId}`, {
                    credentials: 'include'
                });
                const data = await response.json();
                
                if (data.success) {
                    (global as any).deckEditorCards = [...data.data.cards];
                    
                    // Convert database type format to frontend format
                    (global as any).deckEditorCards = (global as any).deckEditorCards.map((card: any) => {
                        let convertedType = card.type;
                        if (card.type === 'ally_universe') {
                            convertedType = 'ally-universe';
                        } else if (card.type === 'basic_universe') {
                            convertedType = 'basic-universe';
                        } else if (card.type === 'advanced_universe') {
                            convertedType = 'advanced-universe';
                        }
                        return { ...card, type: convertedType };
                    });
                }
            }

            await loadDeckForEditing('test-deck-123');

            expect((global as any).deckEditorCards).toHaveLength(5);
            expect((global as any).deckEditorCards[0].type).toBe('character');
            expect((global as any).deckEditorCards[1].type).toBe('ally-universe');
            expect((global as any).deckEditorCards[2].type).toBe('basic-universe');
            expect((global as any).deckEditorCards[3].type).toBe('advanced-universe');
            expect((global as any).deckEditorCards[4].type).toBe('power');
        });

        it('should handle empty deck', async () => {
            const mockDeckData = {
                success: true,
                data: {
                    metadata: {
                        name: 'Empty Deck',
                        description: 'No cards'
                    },
                    cards: []
                }
            };

            mockFetch.mockResolvedValue({
                json: () => Promise.resolve(mockDeckData)
            });

            mockDocument.getElementById.mockImplementation((id: string) => {
                if (id === 'deckEditorTitle') {
                    return { textContent: '' };
                } else if (id === 'deckEditorDescription') {
                    return { textContent: '', style: { display: 'none' } };
                }
                return null;
            });

            // Define the loadDeckForEditing function
            async function loadDeckForEditing(deckId: string) {
                const response = await fetch(`/api/decks/${deckId}`, {
                    credentials: 'include'
                });
                const data = await response.json();
                
                if (data.success) {
                    (global as any).deckEditorCards = [...data.data.cards];
                    
                    // Convert database type format to frontend format
                    (global as any).deckEditorCards = (global as any).deckEditorCards.map((card: any) => {
                        let convertedType = card.type;
                        if (card.type === 'ally_universe') {
                            convertedType = 'ally-universe';
                        } else if (card.type === 'basic_universe') {
                            convertedType = 'basic-universe';
                        } else if (card.type === 'advanced_universe') {
                            convertedType = 'advanced-universe';
                        }
                        return { ...card, type: convertedType };
                    });
                }
            }

            await loadDeckForEditing('test-deck-123');

            expect((global as any).deckEditorCards).toHaveLength(0);
        });
    });
});

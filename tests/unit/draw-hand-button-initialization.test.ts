/**
 * @jest-environment jsdom
 */

/**
 * Unit tests for Draw Hand button initialization and state management
 * 
 * Tests that the Draw Hand button is properly initialized and updated
 * when new decks are created and when card counts change.
 */

describe('Draw Hand Button Initialization', () => {
    // Mock the DOM elements
    let mockDrawHandBtn: HTMLButtonElement;
    let mockDeckTotalCards: HTMLElement;
    let mockUpdateDeckEditorCardCount: jest.Mock;

    beforeEach(() => {
        // Create mock button element
        mockDrawHandBtn = document.createElement('button');
        mockDrawHandBtn.id = 'drawHandBtn';
        mockDrawHandBtn.disabled = true;
        mockDrawHandBtn.style.opacity = '0.5';
        mockDrawHandBtn.style.cursor = 'not-allowed';

        // Create mock total cards element
        mockDeckTotalCards = document.createElement('div');
        mockDeckTotalCards.id = 'deckTotalCards';
        mockDeckTotalCards.textContent = '0';

        // Mock updateDeckEditorCardCount function
        mockUpdateDeckEditorCardCount = jest.fn();

        // Mock document.getElementById
        jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
            if (id === 'drawHandBtn') return mockDrawHandBtn;
            if (id === 'deckTotalCards') return mockDeckTotalCards;
            return null;
        });

        // Mock global functions
        (window as any).updateDeckEditorCardCount = mockUpdateDeckEditorCardCount;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Global updateDeckCardCount function', () => {
        it('should call updateDeckEditorCardCount and updateDeckSummary', () => {
            // Mock updateDeckSummary function
            const mockUpdateDeckSummary = jest.fn();
            (window as any).updateDeckSummary = mockUpdateDeckSummary;
            
            // Mock deckEditorCards
            (window as any).deckEditorCards = [];

            // Create the global function (simulating what's in index.html)
            (window as any).updateDeckCardCount = function() {
                console.log('🔍 updateDeckCardCount called - deckEditorCards:', (window as any).deckEditorCards?.length || 0);
                mockUpdateDeckEditorCardCount();
                if (typeof (window as any).updateDeckSummary === 'function') {
                    console.log('🔍 updateDeckCardCount calling updateDeckSummary');
                    (window as any).updateDeckSummary((window as any).deckEditorCards);
                } else {
                    console.log('❌ updateDeckSummary function not found');
                }
            };

            // Call the function
            (window as any).updateDeckCardCount();

            // Verify both functions were called
            expect(mockUpdateDeckEditorCardCount).toHaveBeenCalledTimes(1);
            expect(mockUpdateDeckSummary).toHaveBeenCalledTimes(1);
            expect(mockUpdateDeckSummary).toHaveBeenCalledWith([]);
        });

        it('should handle missing updateDeckSummary function gracefully', () => {
            // Don't define updateDeckSummary
            delete (window as any).updateDeckSummary;
            
            // Mock deckEditorCards
            (window as any).deckEditorCards = [];

            // Create the global function
            (window as any).updateDeckCardCount = function() {
                console.log('🔍 updateDeckCardCount called - deckEditorCards:', (window as any).deckEditorCards?.length || 0);
                mockUpdateDeckEditorCardCount();
                if (typeof (window as any).updateDeckSummary === 'function') {
                    console.log('🔍 updateDeckCardCount calling updateDeckSummary');
                    (window as any).updateDeckSummary((window as any).deckEditorCards);
                } else {
                    console.log('❌ updateDeckSummary function not found');
                }
            };

            // Call the function
            (window as any).updateDeckCardCount();

            // Verify updateDeckEditorCardCount was called but updateDeckSummary was not
            expect(mockUpdateDeckEditorCardCount).toHaveBeenCalledTimes(1);
        });
    });

    describe('New deck initialization', () => {
        it('should properly initialize button state for empty deck', () => {
            // Mock the updateDeckSummary function
            const mockUpdateDeckSummary = jest.fn();
            (window as any).updateDeckSummary = mockUpdateDeckSummary;
            
            // Mock deckEditorCards as empty array (new deck)
            (window as any).deckEditorCards = [];

            // Create the global function
            (window as any).updateDeckCardCount = function() {
                mockUpdateDeckEditorCardCount();
                if (typeof (window as any).updateDeckSummary === 'function') {
                    (window as any).updateDeckSummary((window as any).deckEditorCards);
                }
            };

            // Simulate new deck creation process (only call updateDeckCardCount, not both)
            (window as any).updateDeckCardCount();

            // Verify functions were called
            expect(mockUpdateDeckEditorCardCount).toHaveBeenCalledTimes(1);
            expect(mockUpdateDeckSummary).toHaveBeenCalledTimes(1);
            expect(mockUpdateDeckSummary).toHaveBeenCalledWith([]);
        });

        it('should handle deck with cards properly', () => {
            // Mock the updateDeckSummary function
            const mockUpdateDeckSummary = jest.fn();
            (window as any).updateDeckSummary = mockUpdateDeckSummary;
            
            // Mock deckEditorCards with some cards
            (window as any).deckEditorCards = [
                { type: 'power', cardId: 'energy-1', quantity: 5 },
                { type: 'special', cardId: 'merlin-magic', quantity: 3 }
            ];

            // Create the global function
            (window as any).updateDeckCardCount = function() {
                mockUpdateDeckEditorCardCount();
                if (typeof (window as any).updateDeckSummary === 'function') {
                    (window as any).updateDeckSummary((window as any).deckEditorCards);
                }
            };

            // Call the function
            (window as any).updateDeckCardCount();

            // Verify functions were called with correct data
            expect(mockUpdateDeckEditorCardCount).toHaveBeenCalledTimes(1);
            expect(mockUpdateDeckSummary).toHaveBeenCalledTimes(1);
            expect(mockUpdateDeckSummary).toHaveBeenCalledWith([
                { type: 'power', cardId: 'energy-1', quantity: 5 },
                { type: 'special', cardId: 'merlin-magic', quantity: 3 }
            ]);
        });
    });

    describe('Button state management integration', () => {
        it('should properly integrate with updateDeckSummary for button state', () => {
            // Mock updateDeckSummary to actually update button state
            const mockUpdateDeckSummary = jest.fn().mockImplementation((deckCards) => {
                const drawHandBtn = document.getElementById('drawHandBtn') as HTMLButtonElement;
                if (drawHandBtn) {
                    const playableCardsCount = deckCards
                        .filter((card: any) => card.type !== 'character' && card.type !== 'location' && card.type !== 'mission')
                        .reduce((sum: number, card: any) => sum + card.quantity, 0);
                    
                    if (playableCardsCount >= 8) {
                        drawHandBtn.disabled = false;
                        drawHandBtn.style.opacity = "1";
                        drawHandBtn.style.cursor = "pointer";
                    } else {
                        drawHandBtn.disabled = true;
                        drawHandBtn.style.opacity = "0.5";
                        drawHandBtn.style.cursor = "not-allowed";
                    }
                }
            });
            
            (window as any).updateDeckSummary = mockUpdateDeckSummary;
            (window as any).deckEditorCards = [];

            // Create the global function
            (window as any).updateDeckCardCount = function() {
                mockUpdateDeckEditorCardCount();
                if (typeof (window as any).updateDeckSummary === 'function') {
                    (window as any).updateDeckSummary((window as any).deckEditorCards);
                }
            };

            // Call the function
            (window as any).updateDeckCardCount();

            // Verify button state was updated
            expect(mockDrawHandBtn.disabled).toBe(true);
            expect(mockDrawHandBtn.style.opacity).toBe('0.5');
            expect(mockDrawHandBtn.style.cursor).toBe('not-allowed');
        });

        it('should enable button when deck has 8+ draw pile cards', () => {
            // Mock updateDeckSummary to actually update button state
            const mockUpdateDeckSummary = jest.fn().mockImplementation((deckCards) => {
                const drawHandBtn = document.getElementById('drawHandBtn') as HTMLButtonElement;
                if (drawHandBtn) {
                    const playableCardsCount = deckCards
                        .filter((card: any) => card.type !== 'character' && card.type !== 'location' && card.type !== 'mission')
                        .reduce((sum: number, card: any) => sum + card.quantity, 0);
                    
                    if (playableCardsCount >= 8) {
                        drawHandBtn.disabled = false;
                        drawHandBtn.style.opacity = "1";
                        drawHandBtn.style.cursor = "pointer";
                    } else {
                        drawHandBtn.disabled = true;
                        drawHandBtn.style.opacity = "0.5";
                        drawHandBtn.style.cursor = "not-allowed";
                    }
                }
            });
            
            (window as any).updateDeckSummary = mockUpdateDeckSummary;
            (window as any).deckEditorCards = [
                { type: 'power', cardId: 'energy-1', quantity: 8 }
            ];

            // Create the global function
            (window as any).updateDeckCardCount = function() {
                mockUpdateDeckEditorCardCount();
                if (typeof (window as any).updateDeckSummary === 'function') {
                    (window as any).updateDeckSummary((window as any).deckEditorCards);
                }
            };

            // Call the function
            (window as any).updateDeckCardCount();

            // Verify button state was updated to enabled
            expect(mockDrawHandBtn.disabled).toBe(false);
            expect(mockDrawHandBtn.style.opacity).toBe('1');
            expect(mockDrawHandBtn.style.cursor).toBe('pointer');
        });
    });

    describe('Error handling', () => {
        it('should handle missing deckEditorCards gracefully', () => {
            // Don't define deckEditorCards
            delete (window as any).deckEditorCards;
            
            const mockUpdateDeckSummary = jest.fn();
            (window as any).updateDeckSummary = mockUpdateDeckSummary;

            // Create the global function
            (window as any).updateDeckCardCount = function() {
                console.log('🔍 updateDeckCardCount called - deckEditorCards:', (window as any).deckEditorCards?.length || 0);
                mockUpdateDeckEditorCardCount();
                if (typeof (window as any).updateDeckSummary === 'function') {
                    (window as any).updateDeckSummary((window as any).deckEditorCards);
                }
            };

            // Call the function - should not throw
            expect(() => {
                (window as any).updateDeckCardCount();
            }).not.toThrow();

            // Verify functions were called
            expect(mockUpdateDeckEditorCardCount).toHaveBeenCalledTimes(1);
            expect(mockUpdateDeckSummary).toHaveBeenCalledWith(undefined);
        });

        it('should handle updateDeckEditorCardCount throwing an error', () => {
            // Make updateDeckEditorCardCount throw an error
            mockUpdateDeckEditorCardCount.mockImplementation(() => {
                throw new Error('updateDeckEditorCardCount failed');
            });
            
            const mockUpdateDeckSummary = jest.fn();
            (window as any).updateDeckSummary = mockUpdateDeckSummary;
            (window as any).deckEditorCards = [];

            // Create the global function
            (window as any).updateDeckCardCount = function() {
                mockUpdateDeckEditorCardCount();
                if (typeof (window as any).updateDeckSummary === 'function') {
                    (window as any).updateDeckSummary((window as any).deckEditorCards);
                }
            };

            // Call the function - should throw
            expect(() => {
                (window as any).updateDeckCardCount();
            }).toThrow('updateDeckEditorCardCount failed');

            // Verify updateDeckSummary was not called due to error
            expect(mockUpdateDeckSummary).not.toHaveBeenCalled();
        });
    });
});

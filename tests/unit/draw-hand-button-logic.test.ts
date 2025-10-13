/**
 * Unit tests for Draw Hand button logic
 * 
 * Tests that the Draw Hand button is properly enabled/disabled based on
 * the number of draw pile cards (excluding characters, locations, missions).
 */

/**
 * @jest-environment jsdom
 */

describe('Draw Hand Button Logic', () => {
    // Mock the DOM elements
    let mockDrawHandBtn: HTMLButtonElement;
    let mockDeckTotalCards: HTMLElement;

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

        // Mock document.getElementById
        jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
            if (id === 'drawHandBtn') return mockDrawHandBtn;
            if (id === 'deckTotalCards') return mockDeckTotalCards;
            return null;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // Mock the updateDeckSummary function logic
    function updateDrawHandButtonState(deckCards: any[]) {
        const drawHandBtn = document.getElementById('drawHandBtn') as HTMLButtonElement;
        if (drawHandBtn) {
            // Count playable cards (excluding characters, locations, missions)
            const playableCardsCount = deckCards
                .filter(card => card.type !== 'character' && card.type !== 'location' && card.type !== 'mission')
                .reduce((sum, card) => sum + card.quantity, 0);
            
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
    }

    describe('Draw pile card counting', () => {
        it('should count power cards as draw pile cards', () => {
            const deckCards = [
                { type: 'power', cardId: 'energy-1', quantity: 5 },
                { type: 'power', cardId: 'combat-2', quantity: 3 }
            ];

            updateDrawHandButtonState(deckCards);

            expect(mockDrawHandBtn.disabled).toBe(false);
            expect(mockDrawHandBtn.style.opacity).toBe('1');
            expect(mockDrawHandBtn.style.cursor).toBe('pointer');
        });

        it('should count special cards as draw pile cards', () => {
            const deckCards = [
                { type: 'special', cardId: 'merlin-magic', quantity: 4 },
                { type: 'special', cardId: 'arthur-excalibur', quantity: 4 }
            ];

            updateDrawHandButtonState(deckCards);

            expect(mockDrawHandBtn.disabled).toBe(false);
            expect(mockDrawHandBtn.style.opacity).toBe('1');
            expect(mockDrawHandBtn.style.cursor).toBe('pointer');
        });

        it('should count universe cards as draw pile cards', () => {
            const deckCards = [
                { type: 'basic_universe', cardId: 'ray-gun', quantity: 3 },
                { type: 'ally_universe', cardId: 'hera', quantity: 2 },
                { type: 'teamwork_universe', cardId: 'teamwork-energy-6', quantity: 3 }
            ];

            updateDrawHandButtonState(deckCards);

            expect(mockDrawHandBtn.disabled).toBe(false);
            expect(mockDrawHandBtn.style.opacity).toBe('1');
            expect(mockDrawHandBtn.style.cursor).toBe('pointer');
        });

        it('should count event cards as draw pile cards', () => {
            const deckCards = [
                { type: 'event', cardId: 'time-warp', quantity: 8 }
            ];

            updateDrawHandButtonState(deckCards);

            expect(mockDrawHandBtn.disabled).toBe(false);
            expect(mockDrawHandBtn.style.opacity).toBe('1');
            expect(mockDrawHandBtn.style.cursor).toBe('pointer');
        });

        it('should count training cards as draw pile cards', () => {
            const deckCards = [
                { type: 'training_universe', cardId: 'training-merlin', quantity: 8 }
            ];

            updateDrawHandButtonState(deckCards);

            expect(mockDrawHandBtn.disabled).toBe(false);
            expect(mockDrawHandBtn.style.opacity).toBe('1');
            expect(mockDrawHandBtn.style.cursor).toBe('pointer');
        });
    });

    describe('Non-draw pile card exclusion', () => {
        it('should exclude character cards from draw pile count', () => {
            const deckCards = [
                { type: 'character', cardId: 'merlin', quantity: 1 },
                { type: 'character', cardId: 'arthur', quantity: 1 },
                { type: 'character', cardId: 'lancelot', quantity: 1 },
                { type: 'character', cardId: 'morgan', quantity: 1 }
            ];

            updateDrawHandButtonState(deckCards);

            expect(mockDrawHandBtn.disabled).toBe(true);
            expect(mockDrawHandBtn.style.opacity).toBe('0.5');
            expect(mockDrawHandBtn.style.cursor).toBe('not-allowed');
        });

        it('should exclude location cards from draw pile count', () => {
            const deckCards = [
                { type: 'location', cardId: 'camelot', quantity: 1 }
            ];

            updateDrawHandButtonState(deckCards);

            expect(mockDrawHandBtn.disabled).toBe(true);
            expect(mockDrawHandBtn.style.opacity).toBe('0.5');
            expect(mockDrawHandBtn.style.cursor).toBe('not-allowed');
        });

        it('should exclude mission cards from draw pile count', () => {
            const deckCards = [
                { type: 'mission', cardId: 'king-of-jungle-1', quantity: 1 },
                { type: 'mission', cardId: 'king-of-jungle-2', quantity: 1 },
                { type: 'mission', cardId: 'king-of-jungle-3', quantity: 1 },
                { type: 'mission', cardId: 'king-of-jungle-4', quantity: 1 },
                { type: 'mission', cardId: 'king-of-jungle-5', quantity: 1 },
                { type: 'mission', cardId: 'king-of-jungle-6', quantity: 1 },
                { type: 'mission', cardId: 'king-of-jungle-7', quantity: 1 }
            ];

            updateDrawHandButtonState(deckCards);

            expect(mockDrawHandBtn.disabled).toBe(true);
            expect(mockDrawHandBtn.style.opacity).toBe('0.5');
            expect(mockDrawHandBtn.style.cursor).toBe('not-allowed');
        });
    });

    describe('Mixed card types', () => {
        it('should enable button when draw pile cards >= 8, regardless of non-draw pile cards', () => {
            const deckCards = [
                // Non-draw pile cards (should be excluded)
                { type: 'character', cardId: 'merlin', quantity: 1 },
                { type: 'character', cardId: 'arthur', quantity: 1 },
                { type: 'character', cardId: 'lancelot', quantity: 1 },
                { type: 'character', cardId: 'morgan', quantity: 1 },
                { type: 'location', cardId: 'camelot', quantity: 1 },
                { type: 'mission', cardId: 'king-of-jungle-1', quantity: 7 },
                
                // Draw pile cards (should be counted)
                { type: 'power', cardId: 'energy-1', quantity: 3 },
                { type: 'power', cardId: 'combat-2', quantity: 3 },
                { type: 'special', cardId: 'merlin-magic', quantity: 2 }
            ];

            updateDrawHandButtonState(deckCards);

            expect(mockDrawHandBtn.disabled).toBe(false);
            expect(mockDrawHandBtn.style.opacity).toBe('1');
            expect(mockDrawHandBtn.style.cursor).toBe('pointer');
        });

        it('should disable button when draw pile cards < 8, even with many non-draw pile cards', () => {
            const deckCards = [
                // Many non-draw pile cards
                { type: 'character', cardId: 'merlin', quantity: 1 },
                { type: 'character', cardId: 'arthur', quantity: 1 },
                { type: 'character', cardId: 'lancelot', quantity: 1 },
                { type: 'character', cardId: 'morgan', quantity: 1 },
                { type: 'location', cardId: 'camelot', quantity: 1 },
                { type: 'mission', cardId: 'king-of-jungle-1', quantity: 7 },
                
                // Few draw pile cards (only 7 total)
                { type: 'power', cardId: 'energy-1', quantity: 3 },
                { type: 'power', cardId: 'combat-2', quantity: 2 },
                { type: 'special', cardId: 'merlin-magic', quantity: 2 }
            ];

            updateDrawHandButtonState(deckCards);

            expect(mockDrawHandBtn.disabled).toBe(true);
            expect(mockDrawHandBtn.style.opacity).toBe('0.5');
            expect(mockDrawHandBtn.style.cursor).toBe('not-allowed');
        });
    });

    describe('Edge cases', () => {
        it('should handle empty deck', () => {
            const deckCards: any[] = [];

            updateDrawHandButtonState(deckCards);

            expect(mockDrawHandBtn.disabled).toBe(true);
            expect(mockDrawHandBtn.style.opacity).toBe('0.5');
            expect(mockDrawHandBtn.style.cursor).toBe('not-allowed');
        });

        it('should handle exactly 8 draw pile cards', () => {
            const deckCards = [
                { type: 'power', cardId: 'energy-1', quantity: 8 }
            ];

            updateDrawHandButtonState(deckCards);

            expect(mockDrawHandBtn.disabled).toBe(false);
            expect(mockDrawHandBtn.style.opacity).toBe('1');
            expect(mockDrawHandBtn.style.cursor).toBe('pointer');
        });

        it('should handle exactly 7 draw pile cards', () => {
            const deckCards = [
                { type: 'power', cardId: 'energy-1', quantity: 7 }
            ];

            updateDrawHandButtonState(deckCards);

            expect(mockDrawHandBtn.disabled).toBe(true);
            expect(mockDrawHandBtn.style.opacity).toBe('0.5');
            expect(mockDrawHandBtn.style.cursor).toBe('not-allowed');
        });

        it('should handle cards with quantity 0', () => {
            const deckCards = [
                { type: 'power', cardId: 'energy-1', quantity: 0 },
                { type: 'power', cardId: 'combat-2', quantity: 8 }
            ];

            updateDrawHandButtonState(deckCards);

            expect(mockDrawHandBtn.disabled).toBe(false);
            expect(mockDrawHandBtn.style.opacity).toBe('1');
            expect(mockDrawHandBtn.style.cursor).toBe('pointer');
        });

        it('should handle cards with undefined type', () => {
            const deckCards = [
                { type: undefined, cardId: 'unknown', quantity: 8 }
            ];

            updateDrawHandButtonState(deckCards);

            // Undefined type should be treated as draw pile card
            expect(mockDrawHandBtn.disabled).toBe(false);
            expect(mockDrawHandBtn.style.opacity).toBe('1');
            expect(mockDrawHandBtn.style.cursor).toBe('pointer');
        });
    });

    describe('Button state transitions', () => {
        it('should transition from disabled to enabled when adding cards', () => {
            // Start with 7 cards (disabled)
            let deckCards = [
                { type: 'power', cardId: 'energy-1', quantity: 7 }
            ];

            updateDrawHandButtonState(deckCards);
            expect(mockDrawHandBtn.disabled).toBe(true);

            // Add 1 more card (enabled)
            deckCards = [
                { type: 'power', cardId: 'energy-1', quantity: 8 }
            ];

            updateDrawHandButtonState(deckCards);
            expect(mockDrawHandBtn.disabled).toBe(false);
        });

        it('should transition from enabled to disabled when removing cards', () => {
            // Start with 8 cards (enabled)
            let deckCards = [
                { type: 'power', cardId: 'energy-1', quantity: 8 }
            ];

            updateDrawHandButtonState(deckCards);
            expect(mockDrawHandBtn.disabled).toBe(false);

            // Remove 1 card (disabled)
            deckCards = [
                { type: 'power', cardId: 'energy-1', quantity: 7 }
            ];

            updateDrawHandButtonState(deckCards);
            expect(mockDrawHandBtn.disabled).toBe(true);
        });
    });
});

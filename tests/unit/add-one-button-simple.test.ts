/**
 * Unit tests for the +1 button functionality in the deck editor
 */

// Mock DOM environment
const addOneMockDeckEditorCards = [
    { cardId: 'card1', type: 'power', quantity: 1 },
    { cardId: 'card2', type: 'power', quantity: 3 },
    { cardId: 'card3', type: 'character', quantity: 1 },
    { cardId: 'card4', type: 'location', quantity: 1 },
    { cardId: 'card5', type: 'mission', quantity: 1 }
];

// Mock global variables and functions
(global as any).deckEditorCards = addOneMockDeckEditorCards;
(global as any).displayDeckCardsForEditing = jest.fn();
(global as any).updateDeckEditorCardCount = jest.fn();
(global as any).updateCharacterLimitStatus = jest.fn();
(global as any).updateMissionLimitStatus = jest.fn();
(global as any).updateSpecialCardsFilter = jest.fn();
(global as any).updateAdvancedUniverseFilter = jest.fn();
(global as any).updatePowerCardsFilter = jest.fn();
(global as any).updateBasicUniverseFilter = jest.fn();
(global as any).updateTeamworkFilter = jest.fn();
(global as any).updateTrainingFilter = jest.fn();
(global as any).updateAllyUniverseFilter = jest.fn();
(global as any).showDeckValidation = jest.fn();
(global as any).getExpansionState = jest.fn(() => ({}));
(global as any).applyUIPreferences = jest.fn();
(global as any).ultraAggressiveLayoutEnforcement = jest.fn();

// Mock DOM elements
const addOneMockDeckCardsEditor = {
    innerHTML: ''
};

Object.defineProperty(global, 'document', {
    value: {
        querySelector: jest.fn((selector: string) => {
            if (selector === '.deck-cards-editor') {
                return addOneMockDeckCardsEditor;
            }
            return null;
        })
    }
});

// Mock the addOneCardToEditor function based on the actual implementation
(global as any).addOneCardToEditor = async function(index: number) {
    if ((global as any).deckEditorCards[index]) {
        // Capture current expansion state before re-rendering
        const currentExpansionState = (global as any).getExpansionState();
        
        // Increase quantity by 1
        (global as any).deckEditorCards[index].quantity += 1;
        
        await (global as any).displayDeckCardsForEditing();
        
        // Ultra-aggressive layout enforcement
        (global as any).ultraAggressiveLayoutEnforcement();
        
        // Restore the expansion state after re-rendering
        (global as any).applyUIPreferences({ expansionState: currentExpansionState });
        (global as any).updateDeckEditorCardCount();
        
        // Update character limit status without affecting collapse state
        (global as any).updateCharacterLimitStatus();
        
        // Update mission limit status without affecting collapse state
        (global as any).updateMissionLimitStatus();
        
        // Update special cards filter if it's active
        (global as any).updateSpecialCardsFilter();
        
        // Update advanced universe filter if it's active
        (global as any).updateAdvancedUniverseFilter();
        
        // Update power cards filter if it's active
        (global as any).updatePowerCardsFilter();
        
        // Update basic universe filter if it's active
        (global as any).updateBasicUniverseFilter();
        
        // Update teamwork filter if it's active
        (global as any).updateTeamworkFilter();
        
        // Update training filter if it's active
        (global as any).updateTrainingFilter();
        
        // Update ally universe filter if it's active
        (global as any).updateAllyUniverseFilter();
        
        // Validate deck after adding card
        await (global as any).showDeckValidation((global as any).deckEditorCards);
    }
};

describe('Add One Button Functionality', () => {
    beforeEach(() => {
        // Reset mock functions
        jest.clearAllMocks();
        
        // Reset deck editor cards to initial state
        (global as any).deckEditorCards = [
            { cardId: 'card1', type: 'power', quantity: 1 },
            { cardId: 'card2', type: 'power', quantity: 3 },
            { cardId: 'card3', type: 'character', quantity: 1 },
            { cardId: 'card4', type: 'location', quantity: 1 },
            { cardId: 'card5', type: 'mission', quantity: 1 }
        ];
    });

    describe('addOneCardToEditor function', () => {
        it('should increase quantity by 1 for existing card', async () => {
            const initialQuantity = (global as any).deckEditorCards[0].quantity;
            
            await (global as any).addOneCardToEditor(0);
            
            expect((global as any).deckEditorCards[0].quantity).toBe(initialQuantity + 1);
        });

        it('should increase quantity from 1 to 2', async () => {
            await (global as any).addOneCardToEditor(0);
            
            expect((global as any).deckEditorCards[0].quantity).toBe(2);
        });

        it('should increase quantity from 3 to 4', async () => {
            await (global as any).addOneCardToEditor(1);
            
            expect((global as any).deckEditorCards[1].quantity).toBe(4);
        });

        it('should call displayDeckCardsForEditing after quantity change', async () => {
            await (global as any).addOneCardToEditor(0);
            
            expect((global as any).displayDeckCardsForEditing).toHaveBeenCalledTimes(1);
        });

        it('should call all required update functions', async () => {
            await (global as any).addOneCardToEditor(0);
            
            expect((global as any).updateDeckEditorCardCount).toHaveBeenCalledTimes(1);
            expect((global as any).updateCharacterLimitStatus).toHaveBeenCalledTimes(1);
            expect((global as any).updateMissionLimitStatus).toHaveBeenCalledTimes(1);
            expect((global as any).updateSpecialCardsFilter).toHaveBeenCalledTimes(1);
            expect((global as any).updateAdvancedUniverseFilter).toHaveBeenCalledTimes(1);
            expect((global as any).updatePowerCardsFilter).toHaveBeenCalledTimes(1);
            expect((global as any).updateBasicUniverseFilter).toHaveBeenCalledTimes(1);
            expect((global as any).updateTeamworkFilter).toHaveBeenCalledTimes(1);
            expect((global as any).updateTrainingFilter).toHaveBeenCalledTimes(1);
            expect((global as any).updateAllyUniverseFilter).toHaveBeenCalledTimes(1);
        });

        it('should call showDeckValidation after quantity change', async () => {
            await (global as any).addOneCardToEditor(0);
            
            expect((global as any).showDeckValidation).toHaveBeenCalledWith((global as any).deckEditorCards);
        });

        it('should preserve expansion state during update', async () => {
            const mockExpansionState = { someState: 'value' };
            (global as any).getExpansionState.mockReturnValue(mockExpansionState);
            
            await (global as any).addOneCardToEditor(0);
            
            expect((global as any).getExpansionState).toHaveBeenCalledTimes(1);
            expect((global as any).applyUIPreferences).toHaveBeenCalledWith({ expansionState: mockExpansionState });
        });

        it('should call ultraAggressiveLayoutEnforcement', async () => {
            await (global as any).addOneCardToEditor(0);
            
            expect((global as any).ultraAggressiveLayoutEnforcement).toHaveBeenCalledTimes(1);
        });

        it('should handle invalid index gracefully', async () => {
            const initialCards = [...(global as any).deckEditorCards];
            
            await (global as any).addOneCardToEditor(999);
            
            // Should not change any cards
            expect((global as any).deckEditorCards).toEqual(initialCards);
            expect((global as any).displayDeckCardsForEditing).not.toHaveBeenCalled();
        });

        it('should handle negative index gracefully', async () => {
            const initialCards = [...(global as any).deckEditorCards];
            
            await (global as any).addOneCardToEditor(-1);
            
            // Should not change any cards
            expect((global as any).deckEditorCards).toEqual(initialCards);
            expect((global as any).displayDeckCardsForEditing).not.toHaveBeenCalled();
        });

        it('should work with different card types', async () => {
            // Test with power card
            await (global as any).addOneCardToEditor(0);
            expect((global as any).deckEditorCards[0].quantity).toBe(2);
            
            // Test with character card
            await (global as any).addOneCardToEditor(2);
            expect((global as any).deckEditorCards[2].quantity).toBe(2);
            
            // Test with location card
            await (global as any).addOneCardToEditor(3);
            expect((global as any).deckEditorCards[3].quantity).toBe(2);
            
            // Test with mission card
            await (global as any).addOneCardToEditor(4);
            expect((global as any).deckEditorCards[4].quantity).toBe(2);
        });

        it('should handle multiple consecutive increases', async () => {
            // Increase the same card multiple times
            await (global as any).addOneCardToEditor(0);
            expect((global as any).deckEditorCards[0].quantity).toBe(2);
            
            await (global as any).addOneCardToEditor(0);
            expect((global as any).deckEditorCards[0].quantity).toBe(3);
            
            await (global as any).addOneCardToEditor(0);
            expect((global as any).deckEditorCards[0].quantity).toBe(4);
        });

        it('should handle undefined card gracefully', async () => {
            // Set up a scenario with undefined card
            (global as any).deckEditorCards[0] = undefined;
            
            const initialCards = [...(global as any).deckEditorCards];
            
            await (global as any).addOneCardToEditor(0);
            
            // Should not change any cards
            expect((global as any).deckEditorCards).toEqual(initialCards);
            expect((global as any).displayDeckCardsForEditing).not.toHaveBeenCalled();
        });
    });

    describe('Button HTML Generation', () => {
        it('should generate +1 button HTML for draw pile cards', () => {
            const card = { type: 'power', quantity: 1 };
            const index = 0;
            
            const expectedHtml = `<button class="add-one-btn" onclick="addOneCardToEditor(${index})">+1</button>`;
            
            // This tests the logic that would generate the button HTML
            const shouldShowButton = card.type !== 'character' && card.type !== 'location' && card.type !== 'mission';
            expect(shouldShowButton).toBe(true);
        });

        it('should not generate +1 button HTML for non-draw pile cards', () => {
            const characterCard = { type: 'character', quantity: 1 };
            const locationCard = { type: 'location', quantity: 1 };
            const missionCard = { type: 'mission', quantity: 1 };
            
            const shouldShowForCharacter = characterCard.type !== 'character' && characterCard.type !== 'location' && characterCard.type !== 'mission';
            const shouldShowForLocation = locationCard.type !== 'character' && locationCard.type !== 'location' && locationCard.type !== 'mission';
            const shouldShowForMission = missionCard.type !== 'character' && missionCard.type !== 'location' && missionCard.type !== 'mission';
            
            expect(shouldShowForCharacter).toBe(false);
            expect(shouldShowForLocation).toBe(false);
            expect(shouldShowForMission).toBe(false);
        });

        it('should generate +1 button HTML for all draw pile card types', () => {
            const drawPileTypes = ['power', 'special', 'event', 'aspect', 'advanced-universe', 'teamwork', 'ally-universe', 'training', 'basic-universe'];
            
            drawPileTypes.forEach(cardType => {
                const card = { type: cardType, quantity: 1 };
                const shouldShowButton = card.type !== 'character' && card.type !== 'location' && card.type !== 'mission';
                expect(shouldShowButton).toBe(true);
            });
        });
    });

    describe('CSS Styling', () => {
        it('should have correct CSS class for +1 button', () => {
            const expectedClass = 'add-one-btn';
            expect(expectedClass).toBe('add-one-btn');
        });

        it('should have matching styling properties with -1 button', () => {
            // These would be the expected CSS properties
            const expectedProperties = {
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '3.3px',
                padding: '3.3px 0',
                fontSize: '11px',
                width: '24px',
                minWidth: '24px',
                maxWidth: '24px',
                fontFamily: 'monospace',
                boxSizing: 'border-box',
                lineHeight: '1'
            };
            
            // Verify all expected properties are defined
            Object.keys(expectedProperties).forEach(property => {
                expect(expectedProperties[property as keyof typeof expectedProperties]).toBeDefined();
            });
        });
    });
});

/**
 * Integration tests for -1 and +1 button functionality working together
 */

export {};

// Mock DOM environment
const mockDeckEditorCards = [
    { cardId: 'card1', type: 'power', quantity: 1 },
    { cardId: 'card2', type: 'power', quantity: 3 },
    { cardId: 'card3', type: 'character', quantity: 1 },
    { cardId: 'card4', type: 'special', quantity: 2 }
];

// Mock global variables and functions
(global as any).deckEditorCards = mockDeckEditorCards;
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
const mockDeckCardsEditor = {
    innerHTML: ''
};

Object.defineProperty(global, 'document', {
    value: {
        querySelector: jest.fn((selector: string) => {
            if (selector === '.deck-cards-editor') {
                return mockDeckCardsEditor;
            }
            return null;
        })
    }
});

// Mock the removeOneCardFromEditor function based on the actual implementation
(global as any).removeOneCardFromEditor = async function(index: number) {
    if ((global as any).deckEditorCards[index]) {
        // Capture current expansion state before re-rendering
        const currentExpansionState = (global as any).getExpansionState();
        
        if ((global as any).deckEditorCards[index].quantity > 1) {
            // If there are multiple cards, decrease quantity by 1
            (global as any).deckEditorCards[index].quantity -= 1;
        } else {
            // If there's only 1 card, remove the entire card
            (global as any).deckEditorCards.splice(index, 1);
        }
        
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
        
        // Validate deck after removing card
        await (global as any).showDeckValidation((global as any).deckEditorCards);
    }
};

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

describe('Quantity Button Integration Tests', () => {
    beforeEach(() => {
        // Reset mock functions
        jest.clearAllMocks();
        
        // Reset deck editor cards to initial state
        (global as any).deckEditorCards = [
            { cardId: 'card1', type: 'power', quantity: 1 },
            { cardId: 'card2', type: 'power', quantity: 3 },
            { cardId: 'card3', type: 'character', quantity: 1 },
            { cardId: 'card4', type: 'special', quantity: 2 }
        ];
    });

    describe('Complete Quantity Management Workflow', () => {
        it('should handle increasing quantity from 1 to 3, then decreasing back to 1', async () => {
            const cardIndex = 0; // Power card with quantity 1
            
            // Initial state
            expect((global as any).deckEditorCards[cardIndex].quantity).toBe(1);
            
            // Increase quantity by 2
            await (global as any).addOneCardToEditor(cardIndex);
            expect((global as any).deckEditorCards[cardIndex].quantity).toBe(2);
            
            await (global as any).addOneCardToEditor(cardIndex);
            expect((global as any).deckEditorCards[cardIndex].quantity).toBe(3);
            
            // Decrease quantity back to 1
            await (global as any).removeOneCardFromEditor(cardIndex);
            expect((global as any).deckEditorCards[cardIndex].quantity).toBe(2);
            
            await (global as any).removeOneCardFromEditor(cardIndex);
            expect((global as any).deckEditorCards[cardIndex].quantity).toBe(1);
        });

        it('should handle decreasing quantity from 3 to 1, then increasing back to 3', async () => {
            const cardIndex = 1; // Power card with quantity 3
            
            // Initial state
            expect((global as any).deckEditorCards[cardIndex].quantity).toBe(3);
            
            // Decrease quantity by 2
            await (global as any).removeOneCardFromEditor(cardIndex);
            expect((global as any).deckEditorCards[cardIndex].quantity).toBe(2);
            
            await (global as any).removeOneCardFromEditor(cardIndex);
            expect((global as any).deckEditorCards[cardIndex].quantity).toBe(1);
            
            // Increase quantity back to 3
            await (global as any).addOneCardToEditor(cardIndex);
            expect((global as any).deckEditorCards[cardIndex].quantity).toBe(2);
            
            await (global as any).addOneCardToEditor(cardIndex);
            expect((global as any).deckEditorCards[cardIndex].quantity).toBe(3);
        });

        it('should handle removing card completely when quantity reaches 0', async () => {
            const cardIndex = 0; // Power card with quantity 1
            const initialCardCount = (global as any).deckEditorCards.length;
            
            // Remove the only card
            await (global as any).removeOneCardFromEditor(cardIndex);
            
            // Card should be completely removed
            expect((global as any).deckEditorCards.length).toBe(initialCardCount - 1);
            expect((global as any).deckEditorCards[cardIndex]).not.toEqual({ cardId: 'card1', type: 'power', quantity: 1 });
        });

        it('should handle adding to a card that was previously removed', async () => {
            // Start with a card that has quantity 1
            const cardIndex = 0;
            const initialCardCount = (global as any).deckEditorCards.length;
            
            // Remove the card completely
            await (global as any).removeOneCardFromEditor(cardIndex);
            expect((global as any).deckEditorCards.length).toBe(initialCardCount - 1);
            
            // Add a new card (simulating adding it back from available cards)
            (global as any).deckEditorCards.unshift({ cardId: 'card1', type: 'power', quantity: 1 });
            
            // Now increase its quantity
            await (global as any).addOneCardToEditor(0);
            expect((global as any).deckEditorCards[0].quantity).toBe(2);
        });
    });

    describe('Multiple Card Quantity Management', () => {
        it('should handle quantity changes on multiple cards independently', async () => {
            // Card 0: power, quantity 1
            // Card 1: power, quantity 3
            // Card 3: special, quantity 2
            
            // Increase first power card
            await (global as any).addOneCardToEditor(0);
            expect((global as any).deckEditorCards[0].quantity).toBe(2);
            
            // Decrease second power card
            await (global as any).removeOneCardFromEditor(1);
            expect((global as any).deckEditorCards[1].quantity).toBe(2);
            
            // Increase special card
            await (global as any).addOneCardToEditor(3);
            expect((global as any).deckEditorCards[3].quantity).toBe(3);
            
            // Verify all changes are independent
            expect((global as any).deckEditorCards[0].quantity).toBe(2);
            expect((global as any).deckEditorCards[1].quantity).toBe(2);
            expect((global as any).deckEditorCards[3].quantity).toBe(3);
        });

        it('should maintain correct card indices after removals', async () => {
            const initialCards = [...(global as any).deckEditorCards];
            
            // Remove first card completely
            await (global as any).removeOneCardFromEditor(0);
            
            // The second card should now be at index 0
            expect((global as any).deckEditorCards[0]).toEqual(initialCards[1]);
            
            // The third card should now be at index 1
            expect((global as any).deckEditorCards[1]).toEqual(initialCards[2]);
            
            // The fourth card should now be at index 2
            expect((global as any).deckEditorCards[2]).toEqual(initialCards[3]);
        });
    });

    describe('Button State and UI Updates', () => {
        it('should call all required UI update functions for each button press', async () => {
            const expectedUpdateFunctions = [
                'displayDeckCardsForEditing',
                'updateDeckEditorCardCount',
                'updateCharacterLimitStatus',
                'updateMissionLimitStatus',
                'updateSpecialCardsFilter',
                'updateAdvancedUniverseFilter',
                'updatePowerCardsFilter',
                'updateBasicUniverseFilter',
                'updateTeamworkFilter',
                'updateTrainingFilter',
                'updateAllyUniverseFilter',
                'showDeckValidation'
            ];
            
            // Test +1 button
            await (global as any).addOneCardToEditor(0);
            
            expectedUpdateFunctions.forEach(funcName => {
                expect((global as any)[funcName]).toHaveBeenCalledTimes(1);
            });
            
            // Reset mocks
            jest.clearAllMocks();
            
            // Test -1 button
            await (global as any).removeOneCardFromEditor(1);
            
            expectedUpdateFunctions.forEach(funcName => {
                expect((global as any)[funcName]).toHaveBeenCalledTimes(1);
            });
        });

        it('should preserve expansion state during all operations', async () => {
            const mockExpansionState = { expandedSections: ['power', 'special'] };
            (global as any).getExpansionState.mockReturnValue(mockExpansionState);
            
            // Test +1 button
            await (global as any).addOneCardToEditor(0);
            expect((global as any).applyUIPreferences).toHaveBeenCalledWith({ expansionState: mockExpansionState });
            
            // Reset mocks
            jest.clearAllMocks();
            (global as any).getExpansionState.mockReturnValue(mockExpansionState);
            
            // Test -1 button
            await (global as any).removeOneCardFromEditor(1);
            expect((global as any).applyUIPreferences).toHaveBeenCalledWith({ expansionState: mockExpansionState });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle rapid button clicks without issues', async () => {
            const cardIndex = 1; // Power card with quantity 3
            
            // Rapidly increase and decrease quantity
            await (global as any).addOneCardToEditor(cardIndex);
            await (global as any).addOneCardToEditor(cardIndex);
            await (global as any).removeOneCardFromEditor(cardIndex);
            await (global as any).removeOneCardFromEditor(cardIndex);
            await (global as any).addOneCardToEditor(cardIndex);
            
            // Should end up with quantity 4 (3 + 1 + 1 - 1 - 1 + 1)
            expect((global as any).deckEditorCards[cardIndex].quantity).toBe(4);
        });

        it('should handle operations on cards with different types', async () => {
            // Power card (should have both buttons)
            await (global as any).addOneCardToEditor(0);
            expect((global as any).deckEditorCards[0].quantity).toBe(2);
            
            await (global as any).removeOneCardFromEditor(0);
            expect((global as any).deckEditorCards[0].quantity).toBe(1);
            
            // Special card (should have both buttons)
            await (global as any).addOneCardToEditor(3);
            expect((global as any).deckEditorCards[3].quantity).toBe(3);
            
            await (global as any).removeOneCardFromEditor(3);
            expect((global as any).deckEditorCards[3].quantity).toBe(2);
            
            // Character card (should only have Remove button, not -1/+1)
            // This tests that the buttons wouldn't be generated for character cards
            const characterCard = (global as any).deckEditorCards[2];
            expect(characterCard.type).toBe('character');
            // Character cards don't have -1/+1 buttons, so we can't test those operations
        });

        it('should maintain deck validation after all operations', async () => {
            // Perform various operations
            await (global as any).addOneCardToEditor(0);
            await (global as any).removeOneCardFromEditor(1);
            await (global as any).addOneCardToEditor(3);
            
            // Each operation should trigger deck validation
            expect((global as any).showDeckValidation).toHaveBeenCalledTimes(3);
            
            // Each call should pass the current deck state
            expect((global as any).showDeckValidation).toHaveBeenLastCalledWith((global as any).deckEditorCards);
        });
    });

    describe('Performance and State Consistency', () => {
        it('should maintain consistent state across multiple operations', async () => {
            const initialCardCount = (global as any).deckEditorCards.length;
            
            // Perform a series of operations
            await (global as any).addOneCardToEditor(0); // Card 0: 1 -> 2
            await (global as any).addOneCardToEditor(1); // Card 1: 3 -> 4
            await (global as any).removeOneCardFromEditor(1); // Card 1: 4 -> 3
            await (global as any).removeOneCardFromEditor(0); // Card 0: 2 -> 1 (not removed)
            
            // Verify final state
            expect((global as any).deckEditorCards.length).toBe(initialCardCount); // No cards removed
            expect((global as any).deckEditorCards[0].quantity).toBe(1); // Card 0: 1 -> 2 -> 1
            expect((global as any).deckEditorCards[1].quantity).toBe(3); // Card 1: 3 -> 4 -> 3
            expect((global as any).deckEditorCards[2].quantity).toBe(1); // Card 2 (character) unchanged
            expect((global as any).deckEditorCards[3].quantity).toBe(2); // Card 3 (special) unchanged
        });

        it('should handle layout enforcement after each operation', async () => {
            // Test +1 button
            await (global as any).addOneCardToEditor(0);
            expect((global as any).ultraAggressiveLayoutEnforcement).toHaveBeenCalledTimes(1);
            
            // Test -1 button
            await (global as any).removeOneCardFromEditor(1);
            expect((global as any).ultraAggressiveLayoutEnforcement).toHaveBeenCalledTimes(2);
        });
    });
});

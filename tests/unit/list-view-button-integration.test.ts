/**
 * Integration tests for list view button functionality
 * Tests the complete workflow of list view buttons affecting card quantities
 */

describe('List View Button Integration Tests', () => {
    let mockDeckEditorCards: any[];
    let mockDisplayDeckCardsForEditing: jest.Mock;
    let mockUltraAggressiveLayoutEnforcement: jest.Mock;
    let mockApplyUIPreferences: jest.Mock;
    let mockUpdateDeckEditorCardCount: jest.Mock;
    let mockUpdateCharacterLimitStatus: jest.Mock;
    let mockUpdateMissionLimitStatus: jest.Mock;
    let mockUpdateSpecialCardsFilter: jest.Mock;
    let mockUpdateAdvancedUniverseFilter: jest.Mock;
    let mockUpdatePowerCardsFilter: jest.Mock;
    let mockUpdateBasicUniverseFilter: jest.Mock;
    let mockUpdateTeamworkFilter: jest.Mock;
    let mockUpdateTrainingFilter: jest.Mock;
    let mockUpdateAllyUniverseFilter: jest.Mock;
    let mockShowDeckValidation: jest.Mock;
    let mockGetExpansionState: jest.Mock;

    beforeEach(() => {
        // Mock global variables and functions
        (global as any).deckEditorCards = [];
        (global as any).displayDeckCardsForEditing = jest.fn();
        (global as any).ultraAggressiveLayoutEnforcement = jest.fn();
        (global as any).applyUIPreferences = jest.fn();
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
        (global as any).getExpansionState = jest.fn();

        mockDeckEditorCards = (global as any).deckEditorCards;
        mockDisplayDeckCardsForEditing = (global as any).displayDeckCardsForEditing;
        mockUltraAggressiveLayoutEnforcement = (global as any).ultraAggressiveLayoutEnforcement;
        mockApplyUIPreferences = (global as any).applyUIPreferences;
        mockUpdateDeckEditorCardCount = (global as any).updateDeckEditorCardCount;
        mockUpdateCharacterLimitStatus = (global as any).updateCharacterLimitStatus;
        mockUpdateMissionLimitStatus = (global as any).updateMissionLimitStatus;
        mockUpdateSpecialCardsFilter = (global as any).updateSpecialCardsFilter;
        mockUpdateAdvancedUniverseFilter = (global as any).updateAdvancedUniverseFilter;
        mockUpdatePowerCardsFilter = (global as any).updatePowerCardsFilter;
        mockUpdateBasicUniverseFilter = (global as any).updateBasicUniverseFilter;
        mockUpdateTeamworkFilter = (global as any).updateTeamworkFilter;
        mockUpdateTrainingFilter = (global as any).updateTrainingFilter;
        mockUpdateAllyUniverseFilter = (global as any).updateAllyUniverseFilter;
        mockShowDeckValidation = (global as any).showDeckValidation;
        mockGetExpansionState = (global as any).getExpansionState;

        // Setup mock implementations
        mockDisplayDeckCardsForEditing.mockResolvedValue(undefined);
        mockGetExpansionState.mockReturnValue({ someState: 'test' });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Draw Pile Card Quantity Management', () => {
        test('should handle complete -1/+1 workflow for power cards', async () => {
            // Setup initial card
            const powerCard = {
                id: 'power-1',
                cardId: 'power-1',
                type: 'power',
                quantity: 3,
                selectedAlternateImage: null
            };

            mockDeckEditorCards.push(powerCard);
            const initialCardCount = mockDeckEditorCards.length;

            // Simulate -1 button click (decrease quantity)
            const cardIndex = mockDeckEditorCards.indexOf(powerCard);
            if (mockDeckEditorCards[cardIndex]) {
                const currentExpansionState = mockGetExpansionState();
                if (mockDeckEditorCards[cardIndex].quantity > 1) {
                    mockDeckEditorCards[cardIndex].quantity -= 1;
                } else {
                    mockDeckEditorCards.splice(cardIndex, 1);
                }
                await mockDisplayDeckCardsForEditing();
                mockUltraAggressiveLayoutEnforcement();
                mockApplyUIPreferences({ expansionState: currentExpansionState });
                mockUpdateDeckEditorCardCount();
                mockUpdateCharacterLimitStatus();
                mockUpdateMissionLimitStatus();
                mockUpdateSpecialCardsFilter();
                mockUpdateAdvancedUniverseFilter();
                mockUpdatePowerCardsFilter();
                mockUpdateBasicUniverseFilter();
                mockUpdateTeamworkFilter();
                mockUpdateTrainingFilter();
                mockUpdateAllyUniverseFilter();
                await mockShowDeckValidation(mockDeckEditorCards);
            }

            // Verify quantity decreased
            expect(mockDeckEditorCards[cardIndex].quantity).toBe(2);
            expect(mockDeckEditorCards.length).toBe(initialCardCount);

            // Simulate +1 button click (increase quantity)
            if (mockDeckEditorCards[cardIndex]) {
                const currentExpansionState = mockGetExpansionState();
                mockDeckEditorCards[cardIndex].quantity += 1;
                await mockDisplayDeckCardsForEditing();
                mockUltraAggressiveLayoutEnforcement();
                mockApplyUIPreferences({ expansionState: currentExpansionState });
                mockUpdateDeckEditorCardCount();
                mockUpdateCharacterLimitStatus();
                mockUpdateMissionLimitStatus();
                mockUpdateSpecialCardsFilter();
                mockUpdateAdvancedUniverseFilter();
                mockUpdatePowerCardsFilter();
                mockUpdateBasicUniverseFilter();
                mockUpdateTeamworkFilter();
                mockUpdateTrainingFilter();
                mockUpdateAllyUniverseFilter();
                await mockShowDeckValidation(mockDeckEditorCards);
            }

            // Verify quantity increased back
            expect(mockDeckEditorCards[cardIndex].quantity).toBe(3);
            expect(mockDeckEditorCards.length).toBe(initialCardCount);

            // Verify all UI update functions were called
            expect(mockDisplayDeckCardsForEditing).toHaveBeenCalledTimes(2);
            expect(mockUltraAggressiveLayoutEnforcement).toHaveBeenCalledTimes(2);
            expect(mockApplyUIPreferences).toHaveBeenCalledTimes(2);
            expect(mockUpdateDeckEditorCardCount).toHaveBeenCalledTimes(2);
            expect(mockShowDeckValidation).toHaveBeenCalledTimes(2);
        });

        test('should handle removing card completely when quantity reaches 0', async () => {
            // Setup card with quantity 1
            const powerCard = {
                id: 'power-1',
                cardId: 'power-1',
                type: 'power',
                quantity: 1,
                selectedAlternateImage: null
            };

            mockDeckEditorCards.push(powerCard);
            const initialCardCount = mockDeckEditorCards.length;

            // Simulate -1 button click (should remove card completely)
            const cardIndex = mockDeckEditorCards.indexOf(powerCard);
            if (mockDeckEditorCards[cardIndex]) {
                const currentExpansionState = mockGetExpansionState();
                if (mockDeckEditorCards[cardIndex].quantity > 1) {
                    mockDeckEditorCards[cardIndex].quantity -= 1;
                } else {
                    mockDeckEditorCards.splice(cardIndex, 1);
                }
                await mockDisplayDeckCardsForEditing();
                mockUltraAggressiveLayoutEnforcement();
                mockApplyUIPreferences({ expansionState: currentExpansionState });
                mockUpdateDeckEditorCardCount();
                mockUpdateCharacterLimitStatus();
                mockUpdateMissionLimitStatus();
                mockUpdateSpecialCardsFilter();
                mockUpdateAdvancedUniverseFilter();
                mockUpdatePowerCardsFilter();
                mockUpdateBasicUniverseFilter();
                mockUpdateTeamworkFilter();
                mockUpdateTrainingFilter();
                mockUpdateAllyUniverseFilter();
                await mockShowDeckValidation(mockDeckEditorCards);
            }

            // Verify card was removed completely
            expect(mockDeckEditorCards.length).toBe(initialCardCount - 1);
            expect(mockDeckEditorCards.find(card => card.id === 'power-1')).toBeUndefined();

            // Verify UI update functions were called
            expect(mockDisplayDeckCardsForEditing).toHaveBeenCalledTimes(1);
            expect(mockShowDeckValidation).toHaveBeenCalledTimes(1);
        });

        test('should handle adding to a card that was previously removed', async () => {
            // Start with empty deck
            expect(mockDeckEditorCards.length).toBe(0);

            // Add a new card (simulating +1 on a previously removed card)
            const powerCard = {
                id: 'power-1',
                cardId: 'power-1',
                type: 'power',
                quantity: 1,
                selectedAlternateImage: null
            };

            mockDeckEditorCards.push(powerCard);
            const cardIndex = mockDeckEditorCards.indexOf(powerCard);

            // Simulate +1 button click
            if (mockDeckEditorCards[cardIndex]) {
                const currentExpansionState = mockGetExpansionState();
                mockDeckEditorCards[cardIndex].quantity += 1;
                await mockDisplayDeckCardsForEditing();
                mockUltraAggressiveLayoutEnforcement();
                mockApplyUIPreferences({ expansionState: currentExpansionState });
                mockUpdateDeckEditorCardCount();
                mockUpdateCharacterLimitStatus();
                mockUpdateMissionLimitStatus();
                mockUpdateSpecialCardsFilter();
                mockUpdateAdvancedUniverseFilter();
                mockUpdatePowerCardsFilter();
                mockUpdateBasicUniverseFilter();
                mockUpdateTeamworkFilter();
                mockUpdateTrainingFilter();
                mockUpdateAllyUniverseFilter();
                await mockShowDeckValidation(mockDeckEditorCards);
            }

            // Verify card was added with correct quantity
            expect(mockDeckEditorCards.length).toBe(1);
            expect(mockDeckEditorCards[0].quantity).toBe(2);
            expect(mockDeckEditorCards[0].id).toBe('power-1');

            // Verify UI update functions were called
            expect(mockDisplayDeckCardsForEditing).toHaveBeenCalledTimes(1);
            expect(mockShowDeckValidation).toHaveBeenCalledTimes(1);
        });
    });

    describe('Non-Draw Pile Card Management', () => {
        test('should handle Remove button for character cards', async () => {
            // Setup character card
            const characterCard = {
                id: 'character-1',
                cardId: 'character-1',
                type: 'character',
                quantity: 1,
                selectedAlternateImage: null
            };

            mockDeckEditorCards.push(characterCard);
            const initialCardCount = mockDeckEditorCards.length;

            // Simulate Remove button click
            const cardIndex = mockDeckEditorCards.indexOf(characterCard);
            if (mockDeckEditorCards[cardIndex]) {
                const currentExpansionState = mockGetExpansionState();
                mockDeckEditorCards.splice(cardIndex, 1);
                await mockDisplayDeckCardsForEditing();
                mockUltraAggressiveLayoutEnforcement();
                mockApplyUIPreferences({ expansionState: currentExpansionState });
                mockUpdateDeckEditorCardCount();
                mockUpdateCharacterLimitStatus();
                mockUpdateMissionLimitStatus();
                mockUpdateSpecialCardsFilter();
                mockUpdateAdvancedUniverseFilter();
                mockUpdatePowerCardsFilter();
                mockUpdateBasicUniverseFilter();
                mockUpdateTeamworkFilter();
                mockUpdateTrainingFilter();
                mockUpdateAllyUniverseFilter();
                await mockShowDeckValidation(mockDeckEditorCards);
            }

            // Verify card was removed completely
            expect(mockDeckEditorCards.length).toBe(initialCardCount - 1);
            expect(mockDeckEditorCards.find(card => card.id === 'character-1')).toBeUndefined();

            // Verify UI update functions were called
            expect(mockDisplayDeckCardsForEditing).toHaveBeenCalledTimes(1);
            expect(mockShowDeckValidation).toHaveBeenCalledTimes(1);
        });

        test('should handle Remove button for location cards', async () => {
            // Setup location card
            const locationCard = {
                id: 'location-1',
                cardId: 'location-1',
                type: 'location',
                quantity: 1,
                selectedAlternateImage: null
            };

            mockDeckEditorCards.push(locationCard);
            const initialCardCount = mockDeckEditorCards.length;

            // Simulate Remove button click
            const cardIndex = mockDeckEditorCards.indexOf(locationCard);
            if (mockDeckEditorCards[cardIndex]) {
                const currentExpansionState = mockGetExpansionState();
                mockDeckEditorCards.splice(cardIndex, 1);
                await mockDisplayDeckCardsForEditing();
                mockUltraAggressiveLayoutEnforcement();
                mockApplyUIPreferences({ expansionState: currentExpansionState });
                mockUpdateDeckEditorCardCount();
                mockUpdateCharacterLimitStatus();
                mockUpdateMissionLimitStatus();
                mockUpdateSpecialCardsFilter();
                mockUpdateAdvancedUniverseFilter();
                mockUpdatePowerCardsFilter();
                mockUpdateBasicUniverseFilter();
                mockUpdateTeamworkFilter();
                mockUpdateTrainingFilter();
                mockUpdateAllyUniverseFilter();
                await mockShowDeckValidation(mockDeckEditorCards);
            }

            // Verify card was removed completely
            expect(mockDeckEditorCards.length).toBe(initialCardCount - 1);
            expect(mockDeckEditorCards.find(card => card.id === 'location-1')).toBeUndefined();
        });

        test('should handle Remove button for mission cards', async () => {
            // Setup mission card
            const missionCard = {
                id: 'mission-1',
                cardId: 'mission-1',
                type: 'mission',
                quantity: 1,
                selectedAlternateImage: null
            };

            mockDeckEditorCards.push(missionCard);
            const initialCardCount = mockDeckEditorCards.length;

            // Simulate Remove button click
            const cardIndex = mockDeckEditorCards.indexOf(missionCard);
            if (mockDeckEditorCards[cardIndex]) {
                const currentExpansionState = mockGetExpansionState();
                mockDeckEditorCards.splice(cardIndex, 1);
                await mockDisplayDeckCardsForEditing();
                mockUltraAggressiveLayoutEnforcement();
                mockApplyUIPreferences({ expansionState: currentExpansionState });
                mockUpdateDeckEditorCardCount();
                mockUpdateCharacterLimitStatus();
                mockUpdateMissionLimitStatus();
                mockUpdateSpecialCardsFilter();
                mockUpdateAdvancedUniverseFilter();
                mockUpdatePowerCardsFilter();
                mockUpdateBasicUniverseFilter();
                mockUpdateTeamworkFilter();
                mockUpdateTrainingFilter();
                mockUpdateAllyUniverseFilter();
                await mockShowDeckValidation(mockDeckEditorCards);
            }

            // Verify card was removed completely
            expect(mockDeckEditorCards.length).toBe(initialCardCount - 1);
            expect(mockDeckEditorCards.find(card => card.id === 'mission-1')).toBeUndefined();
        });
    });

    describe('Mixed Card Type Management', () => {
        test('should handle different button types for mixed card types', async () => {
            // Setup mixed deck
            const powerCard = {
                id: 'power-1',
                cardId: 'power-1',
                type: 'power',
                quantity: 2,
                selectedAlternateImage: null
            };

            const characterCard = {
                id: 'character-1',
                cardId: 'character-1',
                type: 'character',
                quantity: 1,
                selectedAlternateImage: null
            };

            const trainingCard = {
                id: 'training-1',
                cardId: 'training-1',
                type: 'training',
                quantity: 3,
                selectedAlternateImage: null
            };

            mockDeckEditorCards.push(powerCard, characterCard, trainingCard);
            const initialCardCount = mockDeckEditorCards.length;

            // Test -1 button on power card (draw pile)
            const powerIndex = mockDeckEditorCards.indexOf(powerCard);
            if (mockDeckEditorCards[powerIndex]) {
                const currentExpansionState = mockGetExpansionState();
                if (mockDeckEditorCards[powerIndex].quantity > 1) {
                    mockDeckEditorCards[powerIndex].quantity -= 1;
                } else {
                    mockDeckEditorCards.splice(powerIndex, 1);
                }
                await mockDisplayDeckCardsForEditing();
                mockUltraAggressiveLayoutEnforcement();
                mockApplyUIPreferences({ expansionState: currentExpansionState });
                mockUpdateDeckEditorCardCount();
                mockUpdateCharacterLimitStatus();
                mockUpdateMissionLimitStatus();
                mockUpdateSpecialCardsFilter();
                mockUpdateAdvancedUniverseFilter();
                mockUpdatePowerCardsFilter();
                mockUpdateBasicUniverseFilter();
                mockUpdateTeamworkFilter();
                mockUpdateTrainingFilter();
                mockUpdateAllyUniverseFilter();
                await mockShowDeckValidation(mockDeckEditorCards);
            }

            // Test Remove button on character card (non-draw pile)
            const characterIndex = mockDeckEditorCards.indexOf(characterCard);
            if (mockDeckEditorCards[characterIndex]) {
                const currentExpansionState = mockGetExpansionState();
                mockDeckEditorCards.splice(characterIndex, 1);
                await mockDisplayDeckCardsForEditing();
                mockUltraAggressiveLayoutEnforcement();
                mockApplyUIPreferences({ expansionState: currentExpansionState });
                mockUpdateDeckEditorCardCount();
                mockUpdateCharacterLimitStatus();
                mockUpdateMissionLimitStatus();
                mockUpdateSpecialCardsFilter();
                mockUpdateAdvancedUniverseFilter();
                mockUpdatePowerCardsFilter();
                mockUpdateBasicUniverseFilter();
                mockUpdateTeamworkFilter();
                mockUpdateTrainingFilter();
                mockUpdateAllyUniverseFilter();
                await mockShowDeckValidation(mockDeckEditorCards);
            }

            // Test +1 button on training card (draw pile)
            const trainingIndex = mockDeckEditorCards.indexOf(trainingCard);
            if (mockDeckEditorCards[trainingIndex]) {
                const currentExpansionState = mockGetExpansionState();
                mockDeckEditorCards[trainingIndex].quantity += 1;
                await mockDisplayDeckCardsForEditing();
                mockUltraAggressiveLayoutEnforcement();
                mockApplyUIPreferences({ expansionState: currentExpansionState });
                mockUpdateDeckEditorCardCount();
                mockUpdateCharacterLimitStatus();
                mockUpdateMissionLimitStatus();
                mockUpdateSpecialCardsFilter();
                mockUpdateAdvancedUniverseFilter();
                mockUpdatePowerCardsFilter();
                mockUpdateBasicUniverseFilter();
                mockUpdateTeamworkFilter();
                mockUpdateTrainingFilter();
                mockUpdateAllyUniverseFilter();
                await mockShowDeckValidation(mockDeckEditorCards);
            }

            // Verify results
            expect(mockDeckEditorCards.length).toBe(initialCardCount - 1); // Character removed
            expect(mockDeckEditorCards.find(card => card.id === 'power-1')?.quantity).toBe(1); // Power decreased
            expect(mockDeckEditorCards.find(card => card.id === 'training-1')?.quantity).toBe(4); // Training increased
            expect(mockDeckEditorCards.find(card => card.id === 'character-1')).toBeUndefined(); // Character removed

            // Verify UI update functions were called for each operation
            expect(mockDisplayDeckCardsForEditing).toHaveBeenCalledTimes(3);
            expect(mockShowDeckValidation).toHaveBeenCalledTimes(3);
        });
    });

    describe('State Consistency and Performance', () => {
        test('should maintain consistent state across multiple operations', async () => {
            // Setup initial deck
            const powerCard = {
                id: 'power-1',
                cardId: 'power-1',
                type: 'power',
                quantity: 2,
                selectedAlternateImage: null
            };

            const trainingCard = {
                id: 'training-1',
                cardId: 'training-1',
                type: 'training',
                quantity: 1,
                selectedAlternateImage: null
            };

            mockDeckEditorCards.push(powerCard, trainingCard);
            const initialCardCount = mockDeckEditorCards.length;

            // Perform multiple operations
            const operations = [
                { type: 'decrease', cardId: 'power-1' },
                { type: 'increase', cardId: 'power-1' },
                { type: 'increase', cardId: 'training-1' },
                { type: 'decrease', cardId: 'training-1' },
                { type: 'decrease', cardId: 'training-1' } // This should remove the card
            ];

            for (const operation of operations) {
                const cardIndex = mockDeckEditorCards.findIndex(card => card.id === operation.cardId);
                if (cardIndex !== -1 && mockDeckEditorCards[cardIndex]) {
                    const currentExpansionState = mockGetExpansionState();
                    
                    if (operation.type === 'decrease') {
                        if (mockDeckEditorCards[cardIndex].quantity > 1) {
                            mockDeckEditorCards[cardIndex].quantity -= 1;
                        } else {
                            mockDeckEditorCards.splice(cardIndex, 1);
                        }
                    } else if (operation.type === 'increase') {
                        mockDeckEditorCards[cardIndex].quantity += 1;
                    }

                    await mockDisplayDeckCardsForEditing();
                    mockUltraAggressiveLayoutEnforcement();
                    mockApplyUIPreferences({ expansionState: currentExpansionState });
                    mockUpdateDeckEditorCardCount();
                    mockUpdateCharacterLimitStatus();
                    mockUpdateMissionLimitStatus();
                    mockUpdateSpecialCardsFilter();
                    mockUpdateAdvancedUniverseFilter();
                    mockUpdatePowerCardsFilter();
                    mockUpdateBasicUniverseFilter();
                    mockUpdateTeamworkFilter();
                    mockUpdateTrainingFilter();
                    mockUpdateAllyUniverseFilter();
                    await mockShowDeckValidation(mockDeckEditorCards);
                }
            }

            // Verify final state
            expect(mockDeckEditorCards.length).toBe(1); // Only power card remains
            expect(mockDeckEditorCards[0].id).toBe('power-1');
            expect(mockDeckEditorCards[0].quantity).toBe(2); // Back to original quantity

            // Verify all UI update functions were called for each operation
            expect(mockDisplayDeckCardsForEditing).toHaveBeenCalledTimes(operations.length);
            expect(mockShowDeckValidation).toHaveBeenCalledTimes(operations.length);
        });

        test('should handle rapid button clicks without issues', async () => {
            // Setup card
            const powerCard = {
                id: 'power-1',
                cardId: 'power-1',
                type: 'power',
                quantity: 5,
                selectedAlternateImage: null
            };

            mockDeckEditorCards.push(powerCard);

            // Simulate rapid clicks
            const rapidClicks = 10;
            for (let i = 0; i < rapidClicks; i++) {
                const cardIndex = mockDeckEditorCards.findIndex(card => card.id === 'power-1');
                if (cardIndex !== -1 && mockDeckEditorCards[cardIndex]) {
                    const currentExpansionState = mockGetExpansionState();
                    mockDeckEditorCards[cardIndex].quantity += 1;
                    await mockDisplayDeckCardsForEditing();
                    mockUltraAggressiveLayoutEnforcement();
                    mockApplyUIPreferences({ expansionState: currentExpansionState });
                    mockUpdateDeckEditorCardCount();
                    mockUpdateCharacterLimitStatus();
                    mockUpdateMissionLimitStatus();
                    mockUpdateSpecialCardsFilter();
                    mockUpdateAdvancedUniverseFilter();
                    mockUpdatePowerCardsFilter();
                    mockUpdateBasicUniverseFilter();
                    mockUpdateTeamworkFilter();
                    mockUpdateTrainingFilter();
                    mockUpdateAllyUniverseFilter();
                    await mockShowDeckValidation(mockDeckEditorCards);
                }
            }

            // Verify final quantity
            expect(mockDeckEditorCards[0].quantity).toBe(5 + rapidClicks);

            // Verify all UI update functions were called for each click
            expect(mockDisplayDeckCardsForEditing).toHaveBeenCalledTimes(rapidClicks);
            expect(mockShowDeckValidation).toHaveBeenCalledTimes(rapidClicks);
        });
    });
});

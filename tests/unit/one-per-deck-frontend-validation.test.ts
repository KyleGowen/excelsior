import { jest } from '@jest/globals';

// Mock the global functions and objects
const mockShowNotification = jest.fn();
const mockAvailableCardsMap = new Map();

// Mock global objects
(global as any).showNotification = mockShowNotification;
(global as any).window = {
    availableCardsMap: mockAvailableCardsMap
};

// Mock deckEditorCards array
let mockDeckEditorCards: any[] = [];

// Mock the addCardToEditor function
async function addCardToEditor(cardType: string, cardId: string, cardName: string, selectedAlternateImage: string | null = null) {
    // Check "One Per Deck" limit for all card types
    const cardData = mockAvailableCardsMap.get(cardId);
    if (cardData && cardData.one_per_deck === true) {
        // Check if we already have this "One Per Deck" card in the deck
        const existingOnePerDeckCard = mockDeckEditorCards.find(card => 
            card.type === cardType && card.cardId === cardId
        );
        
        if (existingOnePerDeckCard) {
            mockShowNotification(`Cannot add more than 1 copy of "${cardName}" - One Per Deck`, 'error');
            return;
        }
    }
    
    // Add card to deck (simplified for testing)
    mockDeckEditorCards.push({
        id: `deck-${cardType}-${cardId}`,
        type: cardType,
        cardId: cardId,
        name: cardName,
        quantity: 1
    });
}

// Mock the addOneCardToEditor function
async function addOneCardToEditor(index: number) {
    const card = mockDeckEditorCards[index];
    const cardData = mockAvailableCardsMap.get(card.cardId);
    if (cardData && cardData.one_per_deck === true) {
        mockShowNotification(`Cannot add more than 1 copy of "${card.name}" - One Per Deck`, 'error');
        return;
    }
    
    // Increase quantity by 1
    mockDeckEditorCards[index].quantity += 1;
}

describe('One Per Deck Frontend Validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDeckEditorCards = [];
        mockAvailableCardsMap.clear();
    });

    describe('addCardToEditor - One Per Deck Validation', () => {
        it('should allow adding a one-per-deck card when not already in deck', async () => {
            // Setup mock data
            const onePerDeckCard = {
                id: 'special1',
                name: 'One Per Deck Special',
                one_per_deck: true
            };
            mockAvailableCardsMap.set('special1', onePerDeckCard);

            // Add card to deck
            await addCardToEditor('special', 'special1', 'One Per Deck Special');

            // Should succeed
            expect(mockDeckEditorCards).toHaveLength(1);
            expect(mockDeckEditorCards[0]).toEqual({
                id: 'deck-special-special1',
                type: 'special',
                cardId: 'special1',
                name: 'One Per Deck Special',
                quantity: 1
            });
            expect(mockShowNotification).not.toHaveBeenCalled();
        });

        it('should prevent adding a one-per-deck card when already in deck', async () => {
            // Setup mock data
            const onePerDeckCard = {
                id: 'power1',
                name: 'One Per Deck Power',
                one_per_deck: true
            };
            mockAvailableCardsMap.set('power1', onePerDeckCard);

            // Add card to deck first time
            await addCardToEditor('power', 'power1', 'One Per Deck Power');
            expect(mockDeckEditorCards).toHaveLength(1);

            // Try to add same card again
            await addCardToEditor('power', 'power1', 'One Per Deck Power');

            // Should be blocked
            expect(mockDeckEditorCards).toHaveLength(1); // Still only one card
            expect(mockShowNotification).toHaveBeenCalledWith(
                'Cannot add more than 1 copy of "One Per Deck Power" - One Per Deck',
                'error'
            );
        });

        it('should allow adding multiple copies of non-one-per-deck cards', async () => {
            // Setup mock data - regular card (not one-per-deck)
            const regularCard = {
                id: 'special2',
                name: 'Regular Special',
                one_per_deck: false
            };
            mockAvailableCardsMap.set('special2', regularCard);

            // Add same card multiple times
            await addCardToEditor('special', 'special2', 'Regular Special');
            await addCardToEditor('special', 'special2', 'Regular Special');
            await addCardToEditor('special', 'special2', 'Regular Special');

            // Should succeed - multiple cards added
            expect(mockDeckEditorCards).toHaveLength(3);
            expect(mockShowNotification).not.toHaveBeenCalled();
        });

        it('should handle cards without one_per_deck property', async () => {
            // Setup mock data - card without one_per_deck property
            const cardWithoutProperty = {
                id: 'special3',
                name: 'Card Without Property'
                // No one_per_deck property
            };
            mockAvailableCardsMap.set('special3', cardWithoutProperty);

            // Add same card multiple times
            await addCardToEditor('special', 'special3', 'Card Without Property');
            await addCardToEditor('special', 'special3', 'Card Without Property');

            // Should succeed - no one-per-deck restriction
            expect(mockDeckEditorCards).toHaveLength(2);
            expect(mockShowNotification).not.toHaveBeenCalled();
        });

        it('should handle missing card data gracefully', async () => {
            // Try to add card that doesn't exist in availableCardsMap
            await addCardToEditor('special', 'nonexistent', 'Nonexistent Card');

            // Should succeed - no one-per-deck restriction for missing data
            expect(mockDeckEditorCards).toHaveLength(1);
            expect(mockShowNotification).not.toHaveBeenCalled();
        });

        it('should work with different card types', async () => {
            const testCases = [
                { cardType: 'character', cardId: 'char1', name: 'One Per Deck Character' },
                { cardType: 'special', cardId: 'special1', name: 'One Per Deck Special' },
                { cardType: 'power', cardId: 'power1', name: 'One Per Deck Power' },
                { cardType: 'mission', cardId: 'mission1', name: 'One Per Deck Mission' },
                { cardType: 'event', cardId: 'event1', name: 'One Per Deck Event' },
                { cardType: 'aspect', cardId: 'aspect1', name: 'One Per Deck Aspect' },
                { cardType: 'location', cardId: 'location1', name: 'One Per Deck Location' }
            ];

            for (const testCase of testCases) {
                // Reset for each test case
                mockDeckEditorCards = [];
                mockAvailableCardsMap.clear();
                jest.clearAllMocks();

                // Setup mock data
                const onePerDeckCard = {
                    id: testCase.cardId,
                    name: testCase.name,
                    one_per_deck: true
                };
                mockAvailableCardsMap.set(testCase.cardId, onePerDeckCard);

                // Add card first time - should succeed
                await addCardToEditor(testCase.cardType, testCase.cardId, testCase.name);
                expect(mockDeckEditorCards).toHaveLength(1);
                expect(mockShowNotification).not.toHaveBeenCalled();

                // Try to add same card again - should be blocked
                await addCardToEditor(testCase.cardType, testCase.cardId, testCase.name);
                expect(mockDeckEditorCards).toHaveLength(1); // Still only one card
                expect(mockShowNotification).toHaveBeenCalledWith(
                    `Cannot add more than 1 copy of "${testCase.name}" - One Per Deck`,
                    'error'
                );
            }
        });
    });

    describe('addOneCardToEditor - One Per Deck Validation', () => {
        it('should prevent increasing quantity of one-per-deck cards', async () => {
            // Setup mock data
            const onePerDeckCard = {
                id: 'special1',
                name: 'One Per Deck Special',
                one_per_deck: true
            };
            mockAvailableCardsMap.set('special1', onePerDeckCard);

            // Add card to deck first
            await addCardToEditor('special', 'special1', 'One Per Deck Special');
            expect(mockDeckEditorCards).toHaveLength(1);
            expect(mockDeckEditorCards[0].quantity).toBe(1);

            // Try to increase quantity
            await addOneCardToEditor(0);

            // Should be blocked
            expect(mockDeckEditorCards[0].quantity).toBe(1); // Quantity unchanged
            expect(mockShowNotification).toHaveBeenCalledWith(
                'Cannot add more than 1 copy of "One Per Deck Special" - One Per Deck',
                'error'
            );
        });

        it('should allow increasing quantity of non-one-per-deck cards', async () => {
            // Setup mock data - regular card (not one-per-deck)
            const regularCard = {
                id: 'special2',
                name: 'Regular Special',
                one_per_deck: false
            };
            mockAvailableCardsMap.set('special2', regularCard);

            // Add card to deck first
            await addCardToEditor('special', 'special2', 'Regular Special');
            expect(mockDeckEditorCards[0].quantity).toBe(1);

            // Increase quantity
            await addOneCardToEditor(0);

            // Should succeed
            expect(mockDeckEditorCards[0].quantity).toBe(2);
            expect(mockShowNotification).not.toHaveBeenCalled();
        });

        it('should handle cards without one_per_deck property in addOneCardToEditor', async () => {
            // Setup mock data - card without one_per_deck property
            const cardWithoutProperty = {
                id: 'special3',
                name: 'Card Without Property'
                // No one_per_deck property
            };
            mockAvailableCardsMap.set('special3', cardWithoutProperty);

            // Add card to deck first
            await addCardToEditor('special', 'special3', 'Card Without Property');
            expect(mockDeckEditorCards[0].quantity).toBe(1);

            // Increase quantity
            await addOneCardToEditor(0);

            // Should succeed - no one-per-deck restriction
            expect(mockDeckEditorCards[0].quantity).toBe(2);
            expect(mockShowNotification).not.toHaveBeenCalled();
        });

        it('should handle missing card data in addOneCardToEditor', async () => {
            // Add card without data in availableCardsMap
            mockDeckEditorCards.push({
                id: 'deck-special-nonexistent',
                type: 'special',
                cardId: 'nonexistent',
                name: 'Nonexistent Card',
                quantity: 1
            });

            // Try to increase quantity
            await addOneCardToEditor(0);

            // Should succeed - no one-per-deck restriction for missing data
            expect(mockDeckEditorCards[0].quantity).toBe(2);
            expect(mockShowNotification).not.toHaveBeenCalled();
        });
    });
});

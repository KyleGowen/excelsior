describe('Power Card Counting Logic', () => {

    describe('Power card counting calculations', () => {
        test('should calculate correct power card counts for individual types', () => {
            const deckEditorCards = [
                { type: 'power', card_id: 'card1', quantity: 3 }, // Energy
                { type: 'power', card_id: 'card2', quantity: 2 }, // Combat
                { type: 'power', card_id: 'card3', quantity: 1 }, // Brute Force
                { type: 'power', card_id: 'card4', quantity: 4 }, // Intelligence
                { type: 'power', card_id: 'card5', quantity: 2 }, // Energy
                { type: 'power', card_id: 'card6', quantity: 1 }, // Combat
                { type: 'character', card_id: 'char1', quantity: 1 }, // Non-power card
            ];

            const availableCardsMap = new Map([
                ['power_card1', { id: 'card1', power_type: 'Energy' }],
                ['power_card2', { id: 'card2', power_type: 'Combat' }],
                ['power_card3', { id: 'card3', power_type: 'Brute Force' }],
                ['power_card4', { id: 'card4', power_type: 'Intelligence' }],
                ['power_card5', { id: 'card5', power_type: 'Energy' }],
                ['power_card6', { id: 'card6', power_type: 'Combat' }],
            ]);

            // Calculate Energy count
            const energyCount = deckEditorCards
                .filter(card => card.type === 'power')
                .filter(card => {
                    const availableCard = availableCardsMap.get(`power_${card.card_id}`);
                    return availableCard && availableCard.power_type === 'Energy';
                })
                .reduce((total, card) => total + card.quantity, 0);

            // Calculate Combat count
            const combatCount = deckEditorCards
                .filter(card => card.type === 'power')
                .filter(card => {
                    const availableCard = availableCardsMap.get(`power_${card.card_id}`);
                    return availableCard && availableCard.power_type === 'Combat';
                })
                .reduce((total, card) => total + card.quantity, 0);

            // Calculate Brute Force count
            const bruteForceCount = deckEditorCards
                .filter(card => card.type === 'power')
                .filter(card => {
                    const availableCard = availableCardsMap.get(`power_${card.card_id}`);
                    return availableCard && availableCard.power_type === 'Brute Force';
                })
                .reduce((total, card) => total + card.quantity, 0);

            // Calculate Intelligence count
            const intelligenceCount = deckEditorCards
                .filter(card => card.type === 'power')
                .filter(card => {
                    const availableCard = availableCardsMap.get(`power_${card.card_id}`);
                    return availableCard && availableCard.power_type === 'Intelligence';
                })
                .reduce((total, card) => total + card.quantity, 0);

            expect(energyCount).toBe(5); // 3 + 2
            expect(combatCount).toBe(3); // 2 + 1
            expect(bruteForceCount).toBe(1); // 1
            expect(intelligenceCount).toBe(4); // 4
        });

        test('should calculate correct total power card count', () => {
            const deckEditorCards = [
                { type: 'power', card_id: 'card1', quantity: 8 }, // Energy
                { type: 'power', card_id: 'card2', quantity: 7 }, // Combat
                { type: 'power', card_id: 'card3', quantity: 5 }, // Brute Force
                { type: 'power', card_id: 'card4', quantity: 4 }, // Intelligence
                { type: 'character', card_id: 'char1', quantity: 1 }, // Non-power card
            ];

            const totalPowerCardCount = deckEditorCards
                .filter(card => card.type === 'power')
                .reduce((total, card) => total + card.quantity, 0);

            expect(totalPowerCardCount).toBe(24); // 8 + 7 + 5 + 4
        });

        test('should handle empty deck editor cards', () => {
            const deckEditorCards: any[] = [];
            const totalPowerCardCount = deckEditorCards
                .filter(card => card.type === 'power')
                .reduce((total, card) => total + card.quantity, 0);

            expect(totalPowerCardCount).toBe(0);
        });

        test('should handle cards with no matching power type', () => {
            const deckEditorCards = [
                { type: 'power', card_id: 'unknown_card', quantity: 5 },
            ];

            const availableCardsMap = new Map(); // Empty map

            const energyCount = deckEditorCards
                .filter(card => card.type === 'power')
                .filter(card => {
                    const availableCard = availableCardsMap.get(`power_${card.card_id}`);
                    return availableCard && availableCard.power_type === 'Energy';
                })
                .reduce((total, card) => total + card.quantity, 0);

            const totalPowerCardCount = deckEditorCards
                .filter(card => card.type === 'power')
                .reduce((total, card) => total + card.quantity, 0);

            expect(energyCount).toBe(0); // No matching power types
            expect(totalPowerCardCount).toBe(5); // Total still counts all power cards
        });
    });

    describe('Deck type count calculation', () => {
        test('should calculate correct card count using quantities', () => {
            const typeCards = [
                { quantity: 3 },
                { quantity: 2 },
                { quantity: 1 },
                { quantity: 4 },
            ];

            const cardCount = typeCards.reduce((total, card) => total + (card.quantity || 1), 0);
            expect(cardCount).toBe(10); // 3 + 2 + 1 + 4
        });

        test('should handle cards without quantity property', () => {
            const typeCards = [
                { quantity: 3 },
                {}, // No quantity property
                { quantity: 2 },
            ];

            const cardCount = typeCards.reduce((total, card) => total + (card.quantity || 1), 0);
            expect(cardCount).toBe(6); // 3 + 1 + 2
        });

        test('should handle empty array', () => {
            const typeCards: any[] = [];
            const cardCount = typeCards.reduce((total, card) => total + (card.quantity || 1), 0);
            expect(cardCount).toBe(0);
        });

        test('should handle cards with zero quantity', () => {
            const typeCards = [
                { quantity: 3 },
                { quantity: 0 },
                { quantity: 2 },
            ];

            const cardCount = typeCards.reduce((total, card) => total + (card.quantity ?? 1), 0);
            expect(cardCount).toBe(5); // 3 + 0 + 2
        });
    });

    describe('Power card counting integration', () => {
        test('should match the specific scenario from user report', () => {
            // This test matches the exact scenario: Energy (8), Combat (7), Brute Force (5), Intelligence (4) = 24 total
            const deckEditorCards = [
                { type: 'power', card_id: 'energy1', quantity: 8 },
                { type: 'power', card_id: 'combat1', quantity: 7 },
                { type: 'power', card_id: 'brute1', quantity: 5 },
                { type: 'power', card_id: 'intel1', quantity: 4 },
            ];

            const totalPowerCardCount = deckEditorCards
                .filter(card => card.type === 'power')
                .reduce((total, card) => total + card.quantity, 0);

            expect(totalPowerCardCount).toBe(24);
        });

        test('should handle mixed card types correctly', () => {
            const deckEditorCards = [
                { type: 'power', card_id: 'power1', quantity: 5 },
                { type: 'character', card_id: 'char1', quantity: 1 },
                { type: 'power', card_id: 'power2', quantity: 3 },
                { type: 'special', card_id: 'special1', quantity: 2 },
                { type: 'power', card_id: 'power3', quantity: 2 },
            ];

            const totalPowerCardCount = deckEditorCards
                .filter(card => card.type === 'power')
                .reduce((total, card) => total + card.quantity, 0);

            expect(totalPowerCardCount).toBe(10); // 5 + 3 + 2
        });
    });
});

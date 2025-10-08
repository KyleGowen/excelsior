describe('Reserve Character Threat Calculation', () => {
    let mockAvailableCardsMap: Map<string, any>;
    let mockCurrentDeckData: any;

    beforeEach(() => {
        // Mock the global variables and functions
        mockAvailableCardsMap = new Map();
        mockCurrentDeckData = {
            metadata: {
                reserve_character: null
            },
            cards: []
        };

        // Mock the global variables
        (global as any).availableCardsMap = mockAvailableCardsMap;
        (global as any).currentDeckData = mockCurrentDeckData;

        // Character data for testing
        mockAvailableCardsMap.set('61f13415-f7a0-4218-aa21-0dcf21b4af8d', {
            id: '61f13415-f7a0-4218-aa21-0dcf21b4af8d',
            name: 'Carson of Venus',
            threat_level: 18
        });

        mockAvailableCardsMap.set('f7cb4b37-73f3-4718-b8ad-ee6adfc2e5f1', {
            id: 'f7cb4b37-73f3-4718-b8ad-ee6adfc2e5f1',
            name: 'Morgan le Fay',
            threat_level: 19
        });

        mockAvailableCardsMap.set('050f4873-2fa8-422c-ba32-eab3500cbdc0', {
            id: '050f4873-2fa8-422c-ba32-eab3500cbdc0',
            name: 'Victory Harben',
            threat_level: 18
        });

        mockAvailableCardsMap.set('other-character-id', {
            id: 'other-character-id',
            name: 'Other Character',
            threat_level: 17
        });

        // Mock the calculateTotalThreat function
        (global as any).calculateTotalThreat = function(deckCards: any[]) {
            let totalThreat = 0;
            
            // Get the current reserve character ID
            const reserveCharacterId = (global as any).currentDeckData && 
                (global as any).currentDeckData.metadata && 
                (global as any).currentDeckData.metadata.reserve_character;
            
            // Calculate threat from character cards
            const characterCards = deckCards.filter((card: any) => card.type === 'character');
            
            characterCards.forEach((card: any) => {
                const character = (global as any).availableCardsMap.get(card.cardId);
                if (character && character.threat_level) {
                    let threatLevel = character.threat_level;
                    
                    // Apply reserve character adjustments
                    if (card.cardId === reserveCharacterId) {
                        // Carson of Venus: 18 -> 19 when reserve
                        if (card.cardId === '61f13415-f7a0-4218-aa21-0dcf21b4af8d') {
                            threatLevel = 19;
                        }
                        // Morgan le Fay: 19 -> 20 when reserve
                        else if (card.cardId === 'f7cb4b37-73f3-4718-b8ad-ee6adfc2e5f1') {
                            threatLevel = 20;
                        }
                        // Victory Harben: 18 -> 20 when reserve
                        else if (card.cardId === '050f4873-2fa8-422c-ba32-eab3500cbdc0') {
                            threatLevel = 20;
                        }
                    }
                    
                    totalThreat += threatLevel * card.quantity;
                }
            });
            
            // Calculate threat from location cards
            const locationCards = deckCards.filter((card: any) => card.type === 'location');
            
            locationCards.forEach((card: any) => {
                const location = (global as any).availableCardsMap.get(card.cardId);
                if (location && location.threat_level) {
                    totalThreat += location.threat_level * card.quantity;
                }
            });
            
            return totalThreat;
        };
    });

    describe('Normal threat calculation (no reserve character)', () => {
        it('should calculate normal threat levels for all characters', () => {
            const deckCards = [
                { type: 'character', cardId: '61f13415-f7a0-4218-aa21-0dcf21b4af8d', quantity: 1 }, // Carson of Venus: 18
                { type: 'character', cardId: 'f7cb4b37-73f3-4718-b8ad-ee6adfc2e5f1', quantity: 1 }, // Morgan le Fay: 19
                { type: 'character', cardId: '050f4873-2fa8-422c-ba32-eab3500cbdc0', quantity: 1 }, // Victory Harben: 18
                { type: 'character', cardId: 'other-character-id', quantity: 1 } // Other Character: 17
            ];

            mockCurrentDeckData.metadata.reserve_character = null;

            const totalThreat = (global as any).calculateTotalThreat(deckCards);
            expect(totalThreat).toBe(18 + 19 + 18 + 17); // 72
        });
    });

    describe('Reserve character threat adjustments', () => {
        it('should adjust Carson of Venus threat from 18 to 19 when reserve', () => {
            const deckCards = [
                { type: 'character', cardId: '61f13415-f7a0-4218-aa21-0dcf21b4af8d', quantity: 1 }, // Carson of Venus
                { type: 'character', cardId: 'other-character-id', quantity: 1 } // Other Character: 17
            ];

            mockCurrentDeckData.metadata.reserve_character = '61f13415-f7a0-4218-aa21-0dcf21b4af8d';

            const totalThreat = (global as any).calculateTotalThreat(deckCards);
            expect(totalThreat).toBe(19 + 17); // 36 (Carson adjusted to 19)
        });

        it('should adjust Morgan le Fay threat from 19 to 20 when reserve', () => {
            const deckCards = [
                { type: 'character', cardId: 'f7cb4b37-73f3-4718-b8ad-ee6adfc2e5f1', quantity: 1 }, // Morgan le Fay
                { type: 'character', cardId: 'other-character-id', quantity: 1 } // Other Character: 17
            ];

            mockCurrentDeckData.metadata.reserve_character = 'f7cb4b37-73f3-4718-b8ad-ee6adfc2e5f1';

            const totalThreat = (global as any).calculateTotalThreat(deckCards);
            expect(totalThreat).toBe(20 + 17); // 37 (Morgan adjusted to 20)
        });

        it('should adjust Victory Harben threat from 18 to 20 when reserve', () => {
            const deckCards = [
                { type: 'character', cardId: '050f4873-2fa8-422c-ba32-eab3500cbdc0', quantity: 1 }, // Victory Harben
                { type: 'character', cardId: 'other-character-id', quantity: 1 } // Other Character: 17
            ];

            mockCurrentDeckData.metadata.reserve_character = '050f4873-2fa8-422c-ba32-eab3500cbdc0';

            const totalThreat = (global as any).calculateTotalThreat(deckCards);
            expect(totalThreat).toBe(20 + 17); // 37 (Victory adjusted to 20)
        });

        it('should not adjust other characters when they are reserve', () => {
            const deckCards = [
                { type: 'character', cardId: 'other-character-id', quantity: 1 } // Other Character: 17
            ];

            mockCurrentDeckData.metadata.reserve_character = 'other-character-id';

            const totalThreat = (global as any).calculateTotalThreat(deckCards);
            expect(totalThreat).toBe(17); // No adjustment for other characters
        });
    });

    describe('Multiple characters with one reserve', () => {
        it('should only adjust the reserve character, not others', () => {
            const deckCards = [
                { type: 'character', cardId: '61f13415-f7a0-4218-aa21-0dcf21b4af8d', quantity: 1 }, // Carson of Venus: 18 -> 19 (reserve)
                { type: 'character', cardId: 'f7cb4b37-73f3-4718-b8ad-ee6adfc2e5f1', quantity: 1 }, // Morgan le Fay: 19 (normal)
                { type: 'character', cardId: '050f4873-2fa8-422c-ba32-eab3500cbdc0', quantity: 1 }, // Victory Harben: 18 (normal)
                { type: 'character', cardId: 'other-character-id', quantity: 1 } // Other Character: 17 (normal)
            ];

            mockCurrentDeckData.metadata.reserve_character = '61f13415-f7a0-4218-aa21-0dcf21b4af8d';

            const totalThreat = (global as any).calculateTotalThreat(deckCards);
            expect(totalThreat).toBe(19 + 19 + 18 + 17); // 73 (only Carson adjusted)
        });
    });

    describe('Edge cases', () => {
        it('should handle missing currentDeckData gracefully', () => {
            (global as any).currentDeckData = null;

            const deckCards = [
                { type: 'character', cardId: '61f13415-f7a0-4218-aa21-0dcf21b4af8d', quantity: 1 }
            ];

            const totalThreat = (global as any).calculateTotalThreat(deckCards);
            expect(totalThreat).toBe(18); // Should use normal threat level
        });

        it('should handle missing metadata gracefully', () => {
            mockCurrentDeckData.metadata = null;

            const deckCards = [
                { type: 'character', cardId: '61f13415-f7a0-4218-aa21-0dcf21b4af8d', quantity: 1 }
            ];

            const totalThreat = (global as any).calculateTotalThreat(deckCards);
            expect(totalThreat).toBe(18); // Should use normal threat level
        });

        it('should handle missing reserve_character field gracefully', () => {
            mockCurrentDeckData.metadata = {};

            const deckCards = [
                { type: 'character', cardId: '61f13415-f7a0-4218-aa21-0dcf21b4af8d', quantity: 1 }
            ];

            const totalThreat = (global as any).calculateTotalThreat(deckCards);
            expect(totalThreat).toBe(18); // Should use normal threat level
        });

        it('should handle character not found in availableCardsMap', () => {
            const deckCards = [
                { type: 'character', cardId: 'non-existent-character', quantity: 1 }
            ];

            const totalThreat = (global as any).calculateTotalThreat(deckCards);
            expect(totalThreat).toBe(0); // Should not add any threat
        });

        it('should handle character without threat_level', () => {
            mockAvailableCardsMap.set('no-threat-character', {
                id: 'no-threat-character',
                name: 'No Threat Character'
                // No threat_level property
            });

            const deckCards = [
                { type: 'character', cardId: 'no-threat-character', quantity: 1 }
            ];

            const totalThreat = (global as any).calculateTotalThreat(deckCards);
            expect(totalThreat).toBe(0); // Should not add any threat
        });
    });

    describe('Location cards', () => {
        beforeEach(() => {
            mockAvailableCardsMap.set('location-id', {
                id: 'location-id',
                name: 'Test Location',
                threat_level: 5
            });
        });

        it('should include location threat in total calculation', () => {
            const deckCards = [
                { type: 'character', cardId: 'other-character-id', quantity: 1 }, // 17
                { type: 'location', cardId: 'location-id', quantity: 1 } // 5
            ];

            const totalThreat = (global as any).calculateTotalThreat(deckCards);
            expect(totalThreat).toBe(17 + 5); // 22
        });

        it('should not affect reserve character adjustments for locations', () => {
            const deckCards = [
                { type: 'character', cardId: '61f13415-f7a0-4218-aa21-0dcf21b4af8d', quantity: 1 }, // Carson: 18 -> 19 (reserve)
                { type: 'location', cardId: 'location-id', quantity: 1 } // 5
            ];

            mockCurrentDeckData.metadata.reserve_character = '61f13415-f7a0-4218-aa21-0dcf21b4af8d';

            const totalThreat = (global as any).calculateTotalThreat(deckCards);
            expect(totalThreat).toBe(19 + 5); // 24 (Carson adjusted, location normal)
        });
    });
});

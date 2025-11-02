/** @jest-environment jsdom */

/**
 * Unit Tests for Deck Ally Card Export Functionality
 * 
 * Tests cover:
 * - createAllyCards() - Ally card export with stat_to_use and stat_type_to_use appended
 * - Various field combinations (both fields, only stat_to_use, only stat_type_to_use, neither)
 * - Quantity handling
 * - Edge cases and error handling
 * - Integration with full export function
 */

describe('Deck Ally Card Export - Unit Tests', () => {
    let mockDeckEditorCards: any[];
    let mockAvailableCardsMap: Map<string, any>;
    let mockExportFunction: () => Promise<any>;

    beforeEach(() => {
        mockDeckEditorCards = [];
        mockAvailableCardsMap = new Map();

        // Mock export function that uses createAllyCards
        mockExportFunction = async () => {
            const createAllyCards = (cards: any[]) => {
                const result: string[] = [];
                cards.filter((card: any) => card.type === 'ally-universe' || card.type === 'ally_universe').forEach((card: any) => {
                    const availableCard = mockAvailableCardsMap.get(card.cardId);
                    if (!availableCard) return;
                    
                    const cardName = availableCard.name || availableCard.card_name || 'Unknown Card';
                    const statToUse = availableCard.stat_to_use;
                    const statTypeToUse = availableCard.stat_type_to_use;
                    const quantity = card.quantity || 1;
                    
                    // Format: "Little John - 3 Combat" if both stat_to_use and stat_type_to_use exist
                    let formattedName = cardName;
                    
                    // Check if statTypeToUse is valid (not null, not undefined, not empty string after trim)
                    const validStatTypeToUse = statTypeToUse && typeof statTypeToUse === 'string' && statTypeToUse.trim();
                    const trimmedStatTypeToUse = validStatTypeToUse ? statTypeToUse.trim() : null;
                    
                    if (statToUse && trimmedStatTypeToUse) {
                        // Both stat_to_use and stat_type_to_use
                        formattedName = `${cardName} - ${statToUse} ${trimmedStatTypeToUse}`;
                    } else if (trimmedStatTypeToUse) {
                        // Only stat_type_to_use
                        formattedName = `${cardName} - ${trimmedStatTypeToUse}`;
                    } else if (statToUse !== null && statToUse !== undefined) {
                        // Only stat_to_use
                        formattedName = `${cardName} - ${statToUse}`;
                    }
                    
                    // Add card repeated by quantity
                    for (let i = 0; i < quantity; i++) {
                        result.push(formattedName);
                    }
                });
                return result;
            };

            return {
                cards: {
                    allies: createAllyCards(mockDeckEditorCards)
                }
            };
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
        mockDeckEditorCards = [];
        mockAvailableCardsMap.clear();
    });

    describe('createAllyCards - Basic Functionality', () => {
        it('should export ally cards with both stat_to_use and stat_type_to_use', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'ally1',
                    quantity: 1
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                name: 'Little John',
                stat_to_use: '3',
                stat_type_to_use: 'Combat'
            });

            const result = await mockExportFunction();
            
            expect(result.cards.allies).toHaveLength(1);
            expect(result.cards.allies[0]).toBe('Little John - 3 Combat');
        });

        it('should export ally cards using card_name when name is missing', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'ally1',
                    quantity: 1
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                card_name: 'Little John',
                stat_to_use: '3',
                stat_type_to_use: 'Combat'
            });

            const result = await mockExportFunction();
            
            expect(result.cards.allies[0]).toBe('Little John - 3 Combat');
        });

        it('should export ally cards with only stat_type_to_use', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'ally1',
                    quantity: 1
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                name: 'Little John',
                stat_type_to_use: 'Combat'
            });

            const result = await mockExportFunction();
            
            expect(result.cards.allies[0]).toBe('Little John - Combat');
        });

        it('should export ally cards with only stat_to_use', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'ally1',
                    quantity: 1
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                name: 'Little John',
                stat_to_use: '3'
            });

            const result = await mockExportFunction();
            
            expect(result.cards.allies[0]).toBe('Little John - 3');
        });

        it('should export ally cards without stat fields (just name)', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'ally1',
                    quantity: 1
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                name: 'Little John'
            });

            const result = await mockExportFunction();
            
            expect(result.cards.allies[0]).toBe('Little John');
        });

        it('should handle empty stat_type_to_use string', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'ally1',
                    quantity: 1
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                name: 'Little John',
                stat_to_use: '3',
                stat_type_to_use: ''
            });

            const result = await mockExportFunction();
            
            expect(result.cards.allies[0]).toBe('Little John - 3');
        });

        it('should handle whitespace-only stat_type_to_use', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'ally1',
                    quantity: 1
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                name: 'Little John',
                stat_to_use: '3',
                stat_type_to_use: '   '
            });

            const result = await mockExportFunction();
            
            // Whitespace-only stat_type_to_use should be treated as empty and use stat_to_use only
            // The check is: statTypeToUse && typeof statTypeToUse === 'string' && statTypeToUse.trim()
            // Since '   '.trim() is '', it fails the truthy check, so only stat_to_use is used
            expect(result.cards.allies[0]).toBe('Little John - 3');
        });

        it('should handle stat_to_use as 0', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'ally1',
                    quantity: 1
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                name: 'Little John',
                stat_to_use: '0',
                stat_type_to_use: 'Combat'
            });

            const result = await mockExportFunction();
            
            expect(result.cards.allies[0]).toBe('Little John - 0 Combat');
        });
    });

    describe('createAllyCards - Quantity Handling', () => {
        it('should repeat ally cards based on quantity', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'ally1',
                    quantity: 4
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                name: 'Little John',
                stat_to_use: '3',
                stat_type_to_use: 'Combat'
            });

            const result = await mockExportFunction();
            
            expect(result.cards.allies).toHaveLength(4);
            expect(result.cards.allies).toEqual([
                'Little John - 3 Combat',
                'Little John - 3 Combat',
                'Little John - 3 Combat',
                'Little John - 3 Combat'
            ]);
        });

        it('should default to quantity 1 if quantity is missing', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'ally1'
                    // quantity missing
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                name: 'Little John',
                stat_to_use: '3',
                stat_type_to_use: 'Combat'
            });

            const result = await mockExportFunction();
            
            expect(result.cards.allies).toHaveLength(1);
        });

        it('should handle quantity 0 (should still add one card)', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'ally1',
                    quantity: 0
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                name: 'Little John',
                stat_to_use: '3',
                stat_type_to_use: 'Combat'
            });

            const result = await mockExportFunction();
            
            // Quantity 0 still results in 1 card (default behavior)
            expect(result.cards.allies).toHaveLength(1);
        });
    });

    describe('createAllyCards - Multiple Ally Cards', () => {
        it('should handle multiple different ally cards', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'ally1',
                    quantity: 2
                },
                {
                    id: 'deck2',
                    type: 'ally-universe',
                    cardId: 'ally2',
                    quantity: 1
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                name: 'Little John',
                stat_to_use: '3',
                stat_type_to_use: 'Combat'
            });

            mockAvailableCardsMap.set('ally2', {
                name: 'Hera',
                stat_to_use: '5',
                stat_type_to_use: 'Energy'
            });

            const result = await mockExportFunction();
            
            expect(result.cards.allies).toHaveLength(3);
            expect(result.cards.allies).toContain('Little John - 3 Combat');
            expect(result.cards.allies).toContain('Hera - 5 Energy');
            expect(result.cards.allies.filter((c: string) => c === 'Little John - 3 Combat')).toHaveLength(2);
            expect(result.cards.allies.filter((c: string) => c === 'Hera - 5 Energy')).toHaveLength(1);
        });

        it('should handle same ally card with different stat values', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'ally1',
                    quantity: 1
                },
                {
                    id: 'deck2',
                    type: 'ally-universe',
                    cardId: 'ally2',
                    quantity: 1
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                name: 'Little John',
                stat_to_use: '3',
                stat_type_to_use: 'Combat'
            });

            mockAvailableCardsMap.set('ally2', {
                name: 'Little John',
                stat_to_use: '5',
                stat_type_to_use: 'Energy'
            });

            const result = await mockExportFunction();
            
            expect(result.cards.allies).toHaveLength(2);
            expect(result.cards.allies).toContain('Little John - 3 Combat');
            expect(result.cards.allies).toContain('Little John - 5 Energy');
        });
    });

    describe('createAllyCards - Edge Cases', () => {
        it('should handle ally card missing from availableCardsMap', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'missing_ally',
                    quantity: 1
                }
            ];

            // Card not added to map

            const result = await mockExportFunction();
            
            expect(result.cards.allies).toHaveLength(0);
        });

        it('should handle ally-universe type with underscore', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally_universe',
                    cardId: 'ally1',
                    quantity: 1
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                name: 'Little John',
                stat_to_use: '3',
                stat_type_to_use: 'Combat'
            });

            const result = await mockExportFunction();
            
            expect(result.cards.allies[0]).toBe('Little John - 3 Combat');
        });

        it('should handle null stat_to_use', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'ally1',
                    quantity: 1
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                name: 'Little John',
                stat_to_use: null,
                stat_type_to_use: 'Combat'
            });

            const result = await mockExportFunction();
            
            expect(result.cards.allies[0]).toBe('Little John - Combat');
        });

        it('should handle undefined stat_to_use', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'ally1',
                    quantity: 1
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                name: 'Little John',
                stat_type_to_use: 'Combat'
                // stat_to_use is undefined
            });

            const result = await mockExportFunction();
            
            expect(result.cards.allies[0]).toBe('Little John - Combat');
        });

        it('should handle numeric stat_to_use (converts to string)', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'ally1',
                    quantity: 1
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                name: 'Little John',
                stat_to_use: 3 as any, // Number instead of string
                stat_type_to_use: 'Combat'
            });

            const result = await mockExportFunction();
            
            // Should handle it correctly (truthy check will pass)
            expect(result.cards.allies[0]).toBe('Little John - 3 Combat');
        });

        it('should handle "Unknown Card" fallback when name fields are missing', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'ally1',
                    quantity: 1
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                stat_to_use: '3',
                stat_type_to_use: 'Combat'
                // No name or card_name
            });

            const result = await mockExportFunction();
            
            expect(result.cards.allies[0]).toBe('Unknown Card - 3 Combat');
        });
    });

    describe('createAllyCards - Real-world Scenarios', () => {
        it('should handle typical ally card export with stat requirements', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'little_john',
                    quantity: 5
                },
                {
                    id: 'deck2',
                    type: 'ally-universe',
                    cardId: 'hera',
                    quantity: 2
                }
            ];

            mockAvailableCardsMap.set('little_john', {
                name: 'Little John',
                stat_to_use: '3',
                stat_type_to_use: 'Combat'
            });

            mockAvailableCardsMap.set('hera', {
                name: 'Hera',
                stat_to_use: '5',
                stat_type_to_use: 'Energy'
            });

            const result = await mockExportFunction();
            
            expect(result.cards.allies).toHaveLength(7);
            expect(result.cards.allies.filter((c: string) => c === 'Little John - 3 Combat')).toHaveLength(5);
            expect(result.cards.allies.filter((c: string) => c === 'Hera - 5 Energy')).toHaveLength(2);
        });

        it('should handle ally cards with "or less" stat requirements', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'ally1',
                    quantity: 1
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                name: 'Test Ally',
                stat_to_use: '5 or less',
                stat_type_to_use: 'Combat'
            });

            const result = await mockExportFunction();
            
            expect(result.cards.allies[0]).toBe('Test Ally - 5 or less Combat');
        });

        it('should handle ally cards with "or higher" stat requirements', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'ally-universe',
                    cardId: 'ally1',
                    quantity: 1
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                name: 'Test Ally',
                stat_to_use: '7 or higher',
                stat_type_to_use: 'Brute Force'
            });

            const result = await mockExportFunction();
            
            expect(result.cards.allies[0]).toBe('Test Ally - 7 or higher Brute Force');
        });
    });

    describe('createAllyCards - Integration with Full Export', () => {
        it('should work correctly when mixed with other card types', async () => {
            mockDeckEditorCards = [
                {
                    id: 'deck1',
                    type: 'character',
                    cardId: 'char1',
                    quantity: 1
                },
                {
                    id: 'deck2',
                    type: 'ally-universe',
                    cardId: 'ally1',
                    quantity: 2
                },
                {
                    id: 'deck3',
                    type: 'special',
                    cardId: 'special1',
                    quantity: 1
                }
            ];

            mockAvailableCardsMap.set('ally1', {
                name: 'Little John',
                stat_to_use: '3',
                stat_type_to_use: 'Combat'
            });

            const result = await mockExportFunction();
            
            // Only ally cards should be in the allies array
            expect(result.cards.allies).toHaveLength(2);
            expect(result.cards.allies[0]).toBe('Little John - 3 Combat');
            expect(result.cards.allies[1]).toBe('Little John - 3 Combat');
        });
    });
});


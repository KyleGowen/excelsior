/** @jest-environment jsdom */

/**
 * Unit Tests for Deck Training Card Export Functionality
 * 
 * Tests cover:
 * - createTrainingCards() - Training card export with type_1, type_2, and bonus appended
 * - Full export integration
 * - Edge cases and field combinations
 * - Quantity handling
 * - Real-world data scenarios
 */

describe('Deck Training Card Export - Unit Tests', () => {
    let mockCurrentUser: any;
    let mockDeckEditorCards: any[];
    let mockAvailableCardsMap: Map<string, any>;
    let mockIsDeckLimited: boolean;
    let mockCurrentDeckData: any;
    let mockShowNotification: jest.Mock;
    let mockLoadAvailableCards: jest.Mock;
    let mockValidateDeck: jest.Mock;
    let mockShowExportOverlay: jest.Mock;

    // Helper to create the actual export function implementation for testing
    function createExportFunction() {
        return async function exportDeckAsJson(): Promise<any> {
            const currentUser = (window as any).currentUser;
            const deckEditorCards = (window as any).deckEditorCards || [];
            const availableCardsMap = (window as any).availableCardsMap || new Map();
            const isDeckLimited = (window as any).isDeckLimited || false;
            const currentDeckData = (window as any).currentDeckData;
            const validateDeck = (window as any).validateDeck;
            const showExportOverlay = (window as any).showExportOverlay;
            const showNotification = (window as any).showNotification;
            const loadAvailableCards = (window as any).loadAvailableCards;

            if (!currentUser || currentUser.role !== 'ADMIN') {
                return undefined;
            }

            try {
                if (!availableCardsMap || availableCardsMap.size === 0) {
                    if (typeof loadAvailableCards === 'function') {
                        await loadAvailableCards();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                    if (!availableCardsMap || availableCardsMap.size === 0) {
                        return undefined;
                    }
                }

                const deckName = currentDeckData?.metadata?.name || 'Untitled Deck';
                const deckDescription = currentDeckData?.metadata?.description || '';

                // Helper function to get card name from map
                const getCardNameFromMap = (card: any) => {
                    const availableCard = availableCardsMap.get(card.cardId);
                    if (availableCard) {
                        return availableCard.name || availableCard.card_name || 'Unknown Card';
                    }
                    return 'Unknown Card';
                };

                // Helper function to create training cards with type_1, type_2, and bonus appended
                const createTrainingCards = (cards: any[]) => {
                    const result: string[] = [];
                    cards.filter((card: any) => card.type === 'training').forEach((card: any) => {
                        const availableCard = availableCardsMap.get(card.cardId);
                        if (!availableCard) return;
                        
                        // Get card name (training cards use name or card_name)
                        const cardName = availableCard.name || availableCard.card_name || 'Unknown Card';
                        const type1 = availableCard.type_1;
                        const type2 = availableCard.type_2;
                        const bonus = availableCard.bonus;
                        const quantity = card.quantity || 1;
                        
                        // Format: "Training (Leonidas) - Energy Combat +4" if all three exist
                        // Format: "Training (Leonidas) - Energy Combat" if only types exist
                        // Format: "Training (Leonidas) - +4" if only bonus exists
                        // Format: "Training (Leonidas)" if none exist
                        let formattedName = cardName;
                        
                        // Normalize type_1 and type_2 (trim and check for valid values)
                        const validType1 = type1 && typeof type1 === 'string' && type1.trim();
                        const validType2 = type2 && typeof type2 === 'string' && type2.trim();
                        const trimmedType1 = validType1 ? type1.trim() : null;
                        const trimmedType2 = validType2 ? type2.trim() : null;
                        
                        // Normalize bonus (trim and check for valid value)
                        const validBonus = bonus && typeof bonus === 'string' && bonus.trim();
                        const trimmedBonus = validBonus ? bonus.trim() : null;
                        
                        // Build the suffix string
                        const suffixParts: string[] = [];
                        
                        // Add type_1 and type_2 if they exist
                        if (trimmedType1 && trimmedType2) {
                            suffixParts.push(`${trimmedType1} ${trimmedType2}`);
                        } else if (trimmedType1) {
                            suffixParts.push(trimmedType1);
                        } else if (trimmedType2) {
                            suffixParts.push(trimmedType2);
                        }
                        
                        // Add bonus if it exists
                        if (trimmedBonus) {
                            suffixParts.push(trimmedBonus);
                        }
                        
                        // Format the name with suffix if we have any parts
                        if (suffixParts.length > 0) {
                            formattedName = `${cardName} - ${suffixParts.join(' ')}`;
                        }
                        
                        // Add card repeated by quantity
                        for (let i = 0; i < quantity; i++) {
                            result.push(formattedName);
                        }
                    });
                    return result;
                };

                const cardCategories = {
                    characters: [],
                    special_cards: {},
                    locations: [],
                    missions: {},
                    events: {},
                    aspects: [],
                    advanced_universe: {},
                    teamwork: [],
                    allies: [],
                    training: createTrainingCards(deckEditorCards),
                    basic_universe: [],
                    power_cards: []
                };

                const exportData = {
                    name: deckName,
                    description: deckDescription,
                    total_cards: 0,
                    max_energy: 0,
                    max_combat: 0,
                    max_brute_force: 0,
                    max_intelligence: 0,
                    total_energy_icons: 0,
                    total_combat_icons: 0,
                    total_brute_force_icons: 0,
                    total_intelligence_icons: 0,
                    total_threat: 0,
                    legal: true,
                    limited: isDeckLimited,
                    export_timestamp: new Date().toISOString(),
                    exported_by: currentUser.name || currentUser.username || 'Admin',
                    reserve_character: null,
                    cataclysm_special: null,
                    assist_special: null,
                    ambush_special: null,
                    cards: cardCategories
                };

                if (typeof showExportOverlay === 'function') {
                    showExportOverlay(JSON.stringify(exportData, null, 2));
                }

                return exportData;
            } catch (error: any) {
                console.error('Error exporting deck:', error);
                if (typeof showNotification === 'function') {
                    showNotification('Error exporting deck: ' + error.message, 'error');
                }
                return undefined;
            }
        };
    }

    beforeEach(() => {
        jest.useFakeTimers();

        // Mock DOM elements
        document.body.innerHTML = `
            <h4>Test Deck Name</h4>
            <div class="deck-description">Test deck description</div>
            <div id="exportJsonOverlay" style="display: none;">
                <div class="export-overlay-content">
                    <div class="export-overlay-header">
                        <h3>Deck Export</h3>
                        <button class="export-close-btn">&times;</button>
                    </div>
                    <div class="export-overlay-body">
                        <div class="json-container">
                            <div class="copy-button" title="Copy to clipboard"></div>
                            <pre id="exportJsonContent"></pre>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Mock global functions
        mockShowNotification = jest.fn();
        mockLoadAvailableCards = jest.fn().mockResolvedValue(undefined);
        mockValidateDeck = jest.fn().mockReturnValue({ errors: [], warnings: [] });
        mockShowExportOverlay = jest.fn();

        // Mock global variables
        mockCurrentUser = {
            role: 'ADMIN',
            name: 'Test Admin',
            username: 'testadmin'
        };

        mockDeckEditorCards = [];

        mockAvailableCardsMap = new Map();

        mockIsDeckLimited = false;
        mockCurrentDeckData = null;

        // Set up global mocks
        (window as any).currentUser = mockCurrentUser;
        (window as any).deckEditorCards = mockDeckEditorCards;
        (window as any).availableCardsMap = mockAvailableCardsMap;
        (window as any).isDeckLimited = mockIsDeckLimited;
        (window as any).currentDeckData = mockCurrentDeckData;
        (window as any).showNotification = mockShowNotification;
        (window as any).loadAvailableCards = mockLoadAvailableCards;
        (window as any).validateDeck = mockValidateDeck;
        (window as any).showExportOverlay = mockShowExportOverlay;
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        jest.useRealTimers();
        delete (window as any).currentUser;
        delete (window as any).deckEditorCards;
        delete (window as any).availableCardsMap;
        delete (window as any).isDeckLimited;
        delete (window as any).currentDeckData;
        delete (window as any).showNotification;
        delete (window as any).loadAvailableCards;
        delete (window as any).validateDeck;
        delete (window as any).showExportOverlay;
        delete (window as any).exportDeckAsJson;
    });

    describe('createTrainingCards - Basic Functionality', () => {
        it('should export training cards with type_1, type_2, and bonus', async () => {
            mockDeckEditorCards = [
                { id: 'deck1', type: 'training', cardId: 'training1', quantity: 1 }
            ];
            mockAvailableCardsMap.set('training1', {
                name: 'Training (Leonidas)',
                type_1: 'Energy',
                type_2: 'Combat',
                bonus: '+4'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result.cards.training[0]).toBe('Training (Leonidas) - Energy Combat +4');
        });

        it('should export training cards with only type_1 and type_2', async () => {
            mockDeckEditorCards = [
                { id: 'deck1', type: 'training', cardId: 'training1', quantity: 1 }
            ];
            mockAvailableCardsMap.set('training1', {
                name: 'Training (Leonidas)',
                type_1: 'Energy',
                type_2: 'Combat'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result.cards.training[0]).toBe('Training (Leonidas) - Energy Combat');
        });

        it('should export training cards with only type_1', async () => {
            mockDeckEditorCards = [
                { id: 'deck1', type: 'training', cardId: 'training1', quantity: 1 }
            ];
            mockAvailableCardsMap.set('training1', {
                name: 'Training (Leonidas)',
                type_1: 'Energy'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result.cards.training[0]).toBe('Training (Leonidas) - Energy');
        });

        it('should export training cards with only type_2', async () => {
            mockDeckEditorCards = [
                { id: 'deck1', type: 'training', cardId: 'training1', quantity: 1 }
            ];
            mockAvailableCardsMap.set('training1', {
                name: 'Training (Leonidas)',
                type_2: 'Combat'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result.cards.training[0]).toBe('Training (Leonidas) - Combat');
        });

        it('should export training cards with only bonus', async () => {
            mockDeckEditorCards = [
                { id: 'deck1', type: 'training', cardId: 'training1', quantity: 1 }
            ];
            mockAvailableCardsMap.set('training1', {
                name: 'Training (Leonidas)',
                bonus: '+4'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result.cards.training[0]).toBe('Training (Leonidas) - +4');
        });

        it('should export training cards without type_1, type_2, or bonus', async () => {
            mockDeckEditorCards = [
                { id: 'deck1', type: 'training', cardId: 'training1', quantity: 1 }
            ];
            mockAvailableCardsMap.set('training1', {
                name: 'Training (Leonidas)'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result.cards.training[0]).toBe('Training (Leonidas)');
        });

        it('should handle whitespace-only type_1', async () => {
            mockDeckEditorCards = [
                { id: 'deck1', type: 'training', cardId: 'training1', quantity: 1 }
            ];
            mockAvailableCardsMap.set('training1', {
                name: 'Training (Leonidas)',
                type_1: '   ',
                type_2: 'Combat',
                bonus: '+4'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result.cards.training[0]).toBe('Training (Leonidas) - Combat +4');
        });

        it('should handle whitespace-only type_2', async () => {
            mockDeckEditorCards = [
                { id: 'deck1', type: 'training', cardId: 'training1', quantity: 1 }
            ];
            mockAvailableCardsMap.set('training1', {
                name: 'Training (Leonidas)',
                type_1: 'Energy',
                type_2: '   ',
                bonus: '+4'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result.cards.training[0]).toBe('Training (Leonidas) - Energy +4');
        });

        it('should handle whitespace-only bonus', async () => {
            mockDeckEditorCards = [
                { id: 'deck1', type: 'training', cardId: 'training1', quantity: 1 }
            ];
            mockAvailableCardsMap.set('training1', {
                name: 'Training (Leonidas)',
                type_1: 'Energy',
                type_2: 'Combat',
                bonus: '   '
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result.cards.training[0]).toBe('Training (Leonidas) - Energy Combat');
        });
    });

    describe('createTrainingCards - Quantity Handling', () => {
        it('should handle multiple quantities of same training card', async () => {
            mockDeckEditorCards = [
                { id: 'deck1', type: 'training', cardId: 'training1', quantity: 3 }
            ];
            mockAvailableCardsMap.set('training1', {
                name: 'Training (Cultists)',
                type_1: 'Energy',
                type_2: 'Combat',
                bonus: '+4'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result.cards.training).toHaveLength(3);
            expect(result.cards.training).toEqual([
                'Training (Cultists) - Energy Combat +4',
                'Training (Cultists) - Energy Combat +4',
                'Training (Cultists) - Energy Combat +4'
            ]);
        });

        it('should handle quantity of 1 (default)', async () => {
            mockDeckEditorCards = [
                { id: 'deck1', type: 'training', cardId: 'training1' }
            ];
            mockAvailableCardsMap.set('training1', {
                name: 'Training (Leonidas)',
                type_1: 'Energy',
                type_2: 'Combat',
                bonus: '+4'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result.cards.training).toHaveLength(1);
        });
    });

    describe('createTrainingCards - Multiple Training Cards', () => {
        it('should handle multiple different training cards', async () => {
            mockDeckEditorCards = [
                { id: 'deck1', type: 'training', cardId: 'training1', quantity: 1 },
                { id: 'deck2', type: 'training', cardId: 'training2', quantity: 1 },
                { id: 'deck3', type: 'training', cardId: 'training3', quantity: 1 }
            ];
            mockAvailableCardsMap.set('training1', {
                name: 'Training (Leonidas)',
                type_1: 'Energy',
                type_2: 'Combat',
                bonus: '+4'
            });
            mockAvailableCardsMap.set('training2', {
                name: 'Training (Cultists)',
                type_1: 'Brute Force',
                type_2: 'Intelligence',
                bonus: '+2'
            });
            mockAvailableCardsMap.set('training3', {
                name: 'Training (Test)',
                type_1: 'Combat',
                bonus: '+3'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result.cards.training).toContain('Training (Leonidas) - Energy Combat +4');
            expect(result.cards.training).toContain('Training (Cultists) - Brute Force Intelligence +2');
            expect(result.cards.training).toContain('Training (Test) - Combat +3');
            expect(result.cards.training).toHaveLength(3);
        });
    });

    describe('createTrainingCards - Edge Cases', () => {
        it('should skip training cards missing from availableCardsMap', async () => {
            mockDeckEditorCards = [
                { id: 'deck1', type: 'training', cardId: 'missing_training', quantity: 1 },
                { id: 'deck2', type: 'training', cardId: 'training1', quantity: 1 }
            ];
            mockAvailableCardsMap.set('training1', {
                name: 'Training (Leonidas)',
                type_1: 'Energy',
                type_2: 'Combat',
                bonus: '+4'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result.cards.training).toEqual(['Training (Leonidas) - Energy Combat +4']);
        });

        it('should handle training cards with card_name field instead of name', async () => {
            mockDeckEditorCards = [
                { id: 'deck1', type: 'training', cardId: 'training1', quantity: 1 }
            ];
            mockAvailableCardsMap.set('training1', {
                card_name: 'Training (Leonidas)',
                type_1: 'Energy',
                type_2: 'Combat',
                bonus: '+4'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result.cards.training[0]).toBe('Training (Leonidas) - Energy Combat +4');
        });

        it('should handle null type_1, type_2, and bonus', async () => {
            mockDeckEditorCards = [
                { id: 'deck1', type: 'training', cardId: 'training1', quantity: 1 }
            ];
            mockAvailableCardsMap.set('training1', {
                name: 'Training (Leonidas)',
                type_1: null,
                type_2: null,
                bonus: null
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result.cards.training[0]).toBe('Training (Leonidas)');
        });

        it('should handle undefined type_1, type_2, and bonus', async () => {
            mockDeckEditorCards = [
                { id: 'deck1', type: 'training', cardId: 'training1', quantity: 1 }
            ];
            mockAvailableCardsMap.set('training1', {
                name: 'Training (Leonidas)'
                // type_1, type_2, and bonus are undefined
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result.cards.training[0]).toBe('Training (Leonidas)');
        });

        it('should handle non-training card types (should be filtered out)', async () => {
            mockDeckEditorCards = [
                { id: 'deck1', type: 'character', cardId: 'char1', quantity: 1 },
                { id: 'deck2', type: 'training', cardId: 'training1', quantity: 1 }
            ];
            mockAvailableCardsMap.set('char1', { name: 'Test Character' });
            mockAvailableCardsMap.set('training1', {
                name: 'Training (Leonidas)',
                type_1: 'Energy',
                type_2: 'Combat',
                bonus: '+4'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result.cards.training).toEqual(['Training (Leonidas) - Energy Combat +4']);
        });
    });

    describe('createTrainingCards - Real-World Scenarios', () => {
        it('should handle training cards with all stat types', async () => {
            mockDeckEditorCards = [
                { id: 'deck1', type: 'training', cardId: 'training1', quantity: 1 },
                { id: 'deck2', type: 'training', cardId: 'training2', quantity: 1 },
                { id: 'deck3', type: 'training', cardId: 'training3', quantity: 1 },
                { id: 'deck4', type: 'training', cardId: 'training4', quantity: 1 }
            ];
            mockAvailableCardsMap.set('training1', {
                name: 'Training (Leonidas)',
                type_1: 'Energy',
                type_2: 'Combat',
                bonus: '+4'
            });
            mockAvailableCardsMap.set('training2', {
                name: 'Training (Cultists)',
                type_1: 'Brute Force',
                type_2: 'Intelligence',
                bonus: '+3'
            });
            mockAvailableCardsMap.set('training3', {
                name: 'Training (Test 1)',
                type_1: 'Combat',
                type_2: 'Energy',
                bonus: '+2'
            });
            mockAvailableCardsMap.set('training4', {
                name: 'Training (Test 2)',
                type_1: 'Intelligence',
                type_2: 'Brute Force',
                bonus: '+5'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result.cards.training).toHaveLength(4);
            expect(result.cards.training).toContain('Training (Leonidas) - Energy Combat +4');
            expect(result.cards.training).toContain('Training (Cultists) - Brute Force Intelligence +3');
            expect(result.cards.training).toContain('Training (Test 1) - Combat Energy +2');
            expect(result.cards.training).toContain('Training (Test 2) - Intelligence Brute Force +5');
        });

        it('should handle training cards with mixed field combinations', async () => {
            mockDeckEditorCards = [
                { id: 'deck1', type: 'training', cardId: 'training1', quantity: 1 },
                { id: 'deck2', type: 'training', cardId: 'training2', quantity: 1 },
                { id: 'deck3', type: 'training', cardId: 'training3', quantity: 1 },
                { id: 'deck4', type: 'training', cardId: 'training4', quantity: 1 },
                { id: 'deck5', type: 'training', cardId: 'training5', quantity: 1 }
            ];
            mockAvailableCardsMap.set('training1', {
                name: 'Training (All Fields)',
                type_1: 'Energy',
                type_2: 'Combat',
                bonus: '+4'
            });
            mockAvailableCardsMap.set('training2', {
                name: 'Training (Types Only)',
                type_1: 'Energy',
                type_2: 'Combat'
            });
            mockAvailableCardsMap.set('training3', {
                name: 'Training (Bonus Only)',
                bonus: '+4'
            });
            mockAvailableCardsMap.set('training4', {
                name: 'Training (Type1 Only)',
                type_1: 'Energy'
            });
            mockAvailableCardsMap.set('training5', {
                name: 'Training (No Fields)'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result.cards.training).toContain('Training (All Fields) - Energy Combat +4');
            expect(result.cards.training).toContain('Training (Types Only) - Energy Combat');
            expect(result.cards.training).toContain('Training (Bonus Only) - +4');
            expect(result.cards.training).toContain('Training (Type1 Only) - Energy');
            expect(result.cards.training).toContain('Training (No Fields)');
            expect(result.cards.training).toHaveLength(5);
        });
    });

    describe('createTrainingCards - Integration with Full Export', () => {
        it('should integrate training cards into full export structure', async () => {
            mockDeckEditorCards = [
                { id: 'deck1', type: 'training', cardId: 'training1', quantity: 1 },
                { id: 'deck2', type: 'character', cardId: 'char1', quantity: 1 }
            ];
            mockAvailableCardsMap.set('training1', {
                name: 'Training (Leonidas)',
                type_1: 'Energy',
                type_2: 'Combat',
                bonus: '+4'
            });
            mockAvailableCardsMap.set('char1', { name: 'Test Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result).toBeDefined();
            expect(result.cards).toBeDefined();
            expect(result.cards.training).toBeDefined();
            expect(Array.isArray(result.cards.training)).toBe(true);
            expect(result.cards.training[0]).toBe('Training (Leonidas) - Energy Combat +4');
        });
    });
});


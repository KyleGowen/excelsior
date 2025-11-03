/** @jest-environment jsdom */

/**
 * Unit Tests for Deck Basic Universe Card Export Functionality
 * 
 * Tests cover:
 * - createBasicUniverseCards() - Basic universe card export with type, value_to_use, and bonus appended
 * - Full export integration
 * - Edge cases and field combinations
 * - Quantity handling
 * - Real-world data scenarios
 */

describe('Deck Basic Universe Card Export - Unit Tests', () => {
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

                // Helper function to create basic universe cards with type, value_to_use, and bonus appended
                const createBasicUniverseCards = (cards: any[]) => {
                    const result: string[] = [];
                    cards.filter((card: any) => card.type === 'basic-universe').forEach((card: any) => {
                        const availableCard = availableCardsMap.get(card.cardId);
                        if (!availableCard) return;
                        
                        // Get card name (basic universe cards use card_name)
                        const cardName = availableCard.card_name || availableCard.name || 'Unknown Card';
                        const type = availableCard.type;
                        const valueToUse = availableCard.value_to_use;
                        const bonus = availableCard.bonus;
                        const quantity = card.quantity || 1;
                        
                        // Format: "Secret Identity - Energy 6 or greater +2" if all three exist
                        // Format: "Secret Identity - Energy 6 or greater" if only type and value_to_use exist
                        // Format: "Secret Identity - +2" if only bonus exists
                        // Format: "Secret Identity" if none exist
                        let formattedName = cardName;
                        
                        // Normalize type, value_to_use, and bonus (trim and check for valid values)
                        const validType = type && typeof type === 'string' && type.trim();
                        const trimmedType = validType ? type.trim() : null;
                        
                        const validValueToUse = valueToUse && typeof valueToUse === 'string' && valueToUse.trim();
                        const trimmedValueToUse = validValueToUse ? valueToUse.trim() : null;
                        
                        const validBonus = bonus && typeof bonus === 'string' && bonus.trim();
                        const trimmedBonus = validBonus ? bonus.trim() : null;
                        
                        // Build the suffix string
                        const suffixParts: string[] = [];
                        
                        // Add type and value_to_use if they exist
                        if (trimmedType && trimmedValueToUse) {
                            suffixParts.push(`${trimmedType} ${trimmedValueToUse}`);
                        } else if (trimmedType) {
                            suffixParts.push(trimmedType);
                        } else if (trimmedValueToUse) {
                            suffixParts.push(trimmedValueToUse);
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

                // Create card categories
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
                    training: [],
                    basic_universe: createBasicUniverseCards(deckEditorCards),
                    power_cards: []
                };

                // Build export data structure
                const exportData = {
                    name: deckName,
                    description: deckDescription,
                    total_cards: deckEditorCards.filter((c: any) => !['mission', 'character', 'location'].includes(c.type)).reduce((sum: number, c: any) => sum + (c.quantity || 1), 0),
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
                    exported_by: currentUser.username || currentUser.name || 'Unknown'
                };

                return {
                    ...exportData,
                    cards: cardCategories
                };
            } catch (error) {
                console.error('Error exporting deck:', error);
                showNotification('Failed to export deck', 'error');
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
        mockCurrentDeckData = {
            metadata: {
                name: 'Test Deck',
                description: 'Test description'
            }
        };

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

    describe('createBasicUniverseCards - Basic Export', () => {
        it('should export basic universe cards with all fields (type, value_to_use, bonus)', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];
            // Add at least one card to prevent early return
            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Secret Identity',
                type: 'Energy',
                value_to_use: '6 or greater',
                bonus: '+2'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();
            expect(result.cards.basic_universe).toEqual(['Secret Identity - Energy 6 or greater +2']);
        });

        it('should export basic universe cards with only type and value_to_use (no bonus)', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Secret Identity',
                type: 'Energy',
                value_to_use: '6 or greater'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity - Energy 6 or greater']);
        });

        it('should export basic universe cards with only type (no value_to_use, no bonus)', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Secret Identity',
                type: 'Energy'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity - Energy']);
        });

        it('should export basic universe cards with only value_to_use (no type, no bonus)', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Secret Identity',
                value_to_use: '6 or greater'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity - 6 or greater']);
        });

        it('should export basic universe cards with only bonus (no type, no value_to_use)', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Secret Identity',
                bonus: '+2'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity - +2']);
        });

        it('should export basic universe cards without any fields', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Secret Identity'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity']);
        });
    });

    describe('createBasicUniverseCards - Field Variations', () => {
        it('should handle different stat types (Energy, Combat, Brute Force, Intelligence)', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 },
                { cardId: 'basic2', type: 'basic-universe', quantity: 1 },
                { cardId: 'basic3', type: 'basic-universe', quantity: 1 },
                { cardId: 'basic4', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Energy Card',
                type: 'Energy',
                value_to_use: '6 or greater',
                bonus: '+2'
            });
            mockAvailableCardsMap.set('basic2', {
                card_name: 'Combat Card',
                type: 'Combat',
                value_to_use: '7 or greater',
                bonus: '+3'
            });
            mockAvailableCardsMap.set('basic3', {
                card_name: 'Brute Force Card',
                type: 'Brute Force',
                value_to_use: '5 or greater',
                bonus: '+1'
            });
            mockAvailableCardsMap.set('basic4', {
                card_name: 'Intelligence Card',
                type: 'Intelligence',
                value_to_use: '8 or greater',
                bonus: '+4'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toContain('Energy Card - Energy 6 or greater +2');
            expect(result.cards.basic_universe).toContain('Combat Card - Combat 7 or greater +3');
            expect(result.cards.basic_universe).toContain('Brute Force Card - Brute Force 5 or greater +1');
            expect(result.cards.basic_universe).toContain('Intelligence Card - Intelligence 8 or greater +4');
        });

        it('should handle different value_to_use formats', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 },
                { cardId: 'basic2', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Card 1',
                type: 'Energy',
                value_to_use: '6 or greater',
                bonus: '+2'
            });
            mockAvailableCardsMap.set('basic2', {
                card_name: 'Card 2',
                type: 'Combat',
                value_to_use: '7 or higher',
                bonus: '+3'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toContain('Card 1 - Energy 6 or greater +2');
            expect(result.cards.basic_universe).toContain('Card 2 - Combat 7 or higher +3');
        });

        it('should handle negative bonus values', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Secret Identity',
                type: 'Energy',
                value_to_use: '6 or greater',
                bonus: '-1'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity - Energy 6 or greater -1']);
        });

        it('should handle Any-Power type', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Any Power Card',
                type: 'Any-Power',
                value_to_use: '6 or greater',
                bonus: '+2'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual(['Any Power Card - Any-Power 6 or greater +2']);
        });
    });

    describe('createBasicUniverseCards - Quantity Handling', () => {
        it('should handle multiple quantities of same card', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 3 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Secret Identity',
                type: 'Energy',
                value_to_use: '6 or greater',
                bonus: '+2'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual([
                'Secret Identity - Energy 6 or greater +2',
                'Secret Identity - Energy 6 or greater +2',
                'Secret Identity - Energy 6 or greater +2'
            ]);
        });

        it('should handle quantity of 1 (default)', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe' } // No quantity field
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Secret Identity',
                type: 'Energy',
                value_to_use: '6 or greater',
                bonus: '+2'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity - Energy 6 or greater +2']);
        });

        it('should handle large quantities', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 10 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Secret Identity',
                type: 'Energy',
                value_to_use: '6 or greater',
                bonus: '+2'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toHaveLength(10);
            expect(result.cards.basic_universe.every((card: string) => card === 'Secret Identity - Energy 6 or greater +2')).toBe(true);
        });
    });

    describe('createBasicUniverseCards - Real-World Data Scenarios', () => {
        it('should handle Secret Identity card export', async () => {
            mockDeckEditorCards = [
                { cardId: 'secret_identity', type: 'basic-universe', quantity: 2 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('secret_identity', {
                card_name: 'Secret Identity',
                type: 'Energy',
                value_to_use: '6 or greater',
                bonus: '+2'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual([
                'Secret Identity - Energy 6 or greater +2',
                'Secret Identity - Energy 6 or greater +2'
            ]);
        });

        it('should handle Longbow card export', async () => {
            mockDeckEditorCards = [
                { cardId: 'longbow', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('longbow', {
                card_name: 'Longbow',
                type: 'Combat',
                value_to_use: '7 or greater',
                bonus: '+3'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual(['Longbow - Combat 7 or greater +3']);
        });

        it('should handle Flintlock card export', async () => {
            mockDeckEditorCards = [
                { cardId: 'flintlock', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('flintlock', {
                card_name: 'Flintlock',
                type: 'Brute Force',
                value_to_use: '5 or greater',
                bonus: '+1'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual(['Flintlock - Brute Force 5 or greater +1']);
        });

        it('should handle multiple different basic universe cards', async () => {
            mockDeckEditorCards = [
                { cardId: 'secret_identity', type: 'basic-universe', quantity: 2 },
                { cardId: 'longbow', type: 'basic-universe', quantity: 1 },
                { cardId: 'flintlock', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('secret_identity', {
                card_name: 'Secret Identity',
                type: 'Energy',
                value_to_use: '6 or greater',
                bonus: '+2'
            });
            mockAvailableCardsMap.set('longbow', {
                card_name: 'Longbow',
                type: 'Combat',
                value_to_use: '7 or greater',
                bonus: '+3'
            });
            mockAvailableCardsMap.set('flintlock', {
                card_name: 'Flintlock',
                type: 'Brute Force',
                value_to_use: '5 or greater',
                bonus: '+1'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toContain('Secret Identity - Energy 6 or greater +2');
            expect(result.cards.basic_universe).toContain('Longbow - Combat 7 or greater +3');
            expect(result.cards.basic_universe).toContain('Flintlock - Brute Force 5 or greater +1');
            expect(result.cards.basic_universe.filter((c: string) => c.includes('Secret Identity')).length).toBe(2);
            expect(result.cards.basic_universe.length).toBe(4);
        });
    });

    describe('createBasicUniverseCards - Edge Cases', () => {
        it('should handle cards missing from availableCardsMap', async () => {
            mockDeckEditorCards = [
                { cardId: 'missing_basic', type: 'basic-universe', quantity: 1 },
                { cardId: 'char1', type: 'character', quantity: 1 }
            ];

            // Don't add missing_basic to map
            mockAvailableCardsMap.set('char1', { name: 'Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual([]);
        });

        it('should handle whitespace in type, value_to_use, and bonus fields', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Secret Identity',
                type: ' Energy ',
                value_to_use: ' 6 or greater ',
                bonus: ' +2 '
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity - Energy 6 or greater +2']);
        });

        it('should handle basic universe cards with name field instead of card_name', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                name: 'Secret Identity',
                type: 'Energy',
                value_to_use: '6 or greater',
                bonus: '+2'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity - Energy 6 or greater +2']);
        });

        it('should handle null or undefined field values', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Secret Identity',
                type: null,
                value_to_use: undefined,
                bonus: null
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity']);
        });

        it('should handle empty string field values', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Secret Identity',
                type: '',
                value_to_use: '   ',
                bonus: ''
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity']);
        });

        it('should handle non-string field values gracefully', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Secret Identity',
                type: 123 as any,
                value_to_use: true as any,
                bonus: {} as any
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            // Non-string values should be ignored
            expect(result.cards.basic_universe).toEqual(['Secret Identity']);
        });

        it('should handle cards with only type and bonus (no value_to_use)', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Secret Identity',
                type: 'Energy',
                bonus: '+2'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity - Energy +2']);
        });

        it('should handle cards with only value_to_use and bonus (no type)', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Secret Identity',
                value_to_use: '6 or greater',
                bonus: '+2'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity - 6 or greater +2']);
        });
    });

    describe('createBasicUniverseCards - Integration with Full Export', () => {
        it('should integrate with full deck export', async () => {
            mockDeckEditorCards = [
                { cardId: 'char1', type: 'character', quantity: 1 },
                { cardId: 'basic1', type: 'basic-universe', quantity: 2 },
                { cardId: 'power1', type: 'power', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character', energy: 5, combat: 4, brute_force: 3, intelligence: 2, threat_level: 18 });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Secret Identity',
                type: 'Energy',
                value_to_use: '6 or greater',
                bonus: '+2'
            });
            mockAvailableCardsMap.set('power1', { name: 'Power Card', power_type: 'Energy' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result).toBeDefined();
            expect(result.cards).toBeDefined();
            expect(result.cards.basic_universe).toBeDefined();
            expect(Array.isArray(result.cards.basic_universe)).toBe(true);
            expect(result.cards.basic_universe).toEqual([
                'Secret Identity - Energy 6 or greater +2',
                'Secret Identity - Energy 6 or greater +2'
            ]);
        });

        it('should handle empty basic universe array when no cards present', async () => {
            mockDeckEditorCards = [
                { cardId: 'char1', type: 'character', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character', energy: 5, combat: 4, brute_force: 3, intelligence: 2, threat_level: 18 });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual([]);
        });

        it('should filter out non-basic-universe cards', async () => {
            mockDeckEditorCards = [
                { cardId: 'char1', type: 'character', quantity: 1 },
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 },
                { cardId: 'training1', type: 'training', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('basic1', {
                card_name: 'Secret Identity',
                type: 'Energy',
                value_to_use: '6 or greater',
                bonus: '+2'
            });
            mockAvailableCardsMap.set('training1', { name: 'Training Card' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity - Energy 6 or greater +2']);
            expect(result.cards.basic_universe.length).toBe(1);
        });
    });
});


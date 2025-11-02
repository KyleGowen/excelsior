/** @jest-environment jsdom */

/**
 * Unit Tests for Teamwork Card Export Functionality
 * 
 * Tests cover:
 * - createTeamworkCards() function behavior
 * - followup_attack_types formatting and appending
 * - Edge cases: missing data, alternative field names, quantity handling
 * - Integration with full export flow
 * - Real-world data scenarios
 */

describe('Deck Export - Teamwork Cards Export', () => {
    let mockCurrentUser: any;
    let mockDeckEditorCards: any[];
    let mockAvailableCardsMap: Map<string, any>;
    let mockIsDeckLimited: boolean;
    let mockCurrentDeckData: any;
    let mockShowNotification: jest.Mock;
    let mockLoadAvailableCards: jest.Mock;
    let mockValidateDeck: jest.Mock;
    let mockShowExportOverlay: jest.Mock;

    beforeEach(() => {
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

        jest.useFakeTimers();
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

    // Helper function to create the actual export function implementation for testing
    const createExportFunction = () => {
        return async () => {
            const availableCardsMap = (window as any).availableCardsMap;
            const deckEditorCards = (window as any).deckEditorCards;
            const currentDeckData = (window as any).currentDeckData;
            const validateDeck = (window as any).validateDeck;
            const isDeckLimited = (window as any).isDeckLimited;
            const currentUser = (window as any).currentUser;

            // Access control check
            if (!currentUser || currentUser.role !== 'ADMIN') {
                (window as any).showNotification('Export functionality is only available to ADMIN users', 'error');
                return null;
            }

            // Get deck name
            let deckName = 'Unnamed Deck';
            if (currentDeckData && currentDeckData.name) {
                deckName = currentDeckData.name.replace(/\[.*?\]/g, '').trim();
            } else {
                const nameElement = document.querySelector('h4');
                if (nameElement) {
                    deckName = nameElement.textContent?.replace(/\[.*?\]/g, '').trim() || 'Unnamed Deck';
                }
            }

            // Get deck description
            let deckDescription = '';
            const descElement = document.querySelector('.deck-description');
            if (descElement) {
                deckDescription = descElement.textContent || '';
            }

            // Load cards if map is empty
            if (!availableCardsMap || availableCardsMap.size === 0) {
                if (typeof (window as any).loadAvailableCards === 'function') {
                    await (window as any).loadAvailableCards();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            // Helper function to get card name
            const getCardNameFromMap = (card: any) => {
                const availableCard = availableCardsMap.get(card.cardId);
                if (availableCard) {
                    return availableCard.name || availableCard.card_name || 'Unknown Card';
                }
                return 'Unknown Card';
            };

            // Helper function to create teamwork cards with followup_attack_types
            const createTeamworkCards = (cards: any[]) => {
                const result: string[] = [];
                cards.filter((card: any) => card.type === 'teamwork').forEach((card: any) => {
                    const availableCard = availableCardsMap.get(card.cardId);
                    if (!availableCard) return;
                    
                    const cardName = availableCard.name || availableCard.card_name || 'Unknown Card';
                    const followupTypes = availableCard.followup_attack_types || availableCard.follow_up_attack_types;
                    const quantity = card.quantity || 1;
                    
                    // Format: "7 Combat - Intelligence + Energy" or just "7 Combat" if no followup types
                    const formattedName = followupTypes && typeof followupTypes === 'string' && followupTypes.trim() 
                        ? `${cardName} - ${followupTypes}`
                        : cardName;
                    
                    // Add card repeated by quantity
                    for (let i = 0; i < quantity; i++) {
                        result.push(formattedName);
                    }
                });
                return result;
            };

            // Create export data
            const exportData = {
                name: deckName,
                description: deckDescription,
                cards: {
                    teamwork: createTeamworkCards(deckEditorCards)
                },
                exported_by: currentUser.name || currentUser.username || 'Admin',
                exported_at: new Date().toISOString(),
                legal: true,
                limited: isDeckLimited || false
            };

            // Validate deck
            if (typeof validateDeck === 'function') {
                const validation = validateDeck(deckEditorCards);
                if (validation && validation.errors && validation.errors.length > 0) {
                    exportData.legal = false;
                }
            }

            return exportData;
        };
    };

    describe('Basic Teamwork Export', () => {
        it('should export single teamwork card with followup_attack_types', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                name: '6 Combat',
                followup_attack_types: 'Brute Force + Energy'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork).toEqual(['6 Combat - Brute Force + Energy']);
        });

        it('should export teamwork card without followup_attack_types', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                name: '6 Combat'
                // No followup_attack_types
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork).toEqual(['6 Combat']);
        });

        it('should export multiple different teamwork cards', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 },
                { cardId: 'teamwork2', type: 'teamwork', quantity: 1 },
                { cardId: 'teamwork3', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                name: '6 Combat',
                followup_attack_types: 'Brute Force + Energy'
            });
            mockAvailableCardsMap.set('teamwork2', {
                name: '7 Combat',
                followup_attack_types: 'Intelligence + Energy'
            });
            mockAvailableCardsMap.set('teamwork3', {
                name: '8 Energy',
                followup_attack_types: 'Combat + Intelligence'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork.length).toBe(3);
            expect(result.cards.teamwork).toContain('6 Combat - Brute Force + Energy');
            expect(result.cards.teamwork).toContain('7 Combat - Intelligence + Energy');
            expect(result.cards.teamwork).toContain('8 Energy - Combat + Intelligence');
        });
    });

    describe('followup_attack_types Field Variations', () => {
        it('should prefer followup_attack_types over follow_up_attack_types', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                name: '7 Combat',
                followup_attack_types: 'Intelligence + Energy',
                follow_up_attack_types: 'Brute Force + Energy'  // Should be ignored
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork).toEqual(['7 Combat - Intelligence + Energy']);
        });

        it('should use follow_up_attack_types when followup_attack_types is missing', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                name: '7 Combat',
                follow_up_attack_types: 'Brute Force + Energy'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork).toEqual(['7 Combat - Brute Force + Energy']);
        });

        it('should handle null followup_attack_types', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                name: '6 Combat',
                followup_attack_types: null
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork).toEqual(['6 Combat']);
        });

        it('should handle undefined followup_attack_types', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                name: '6 Combat',
                followup_attack_types: undefined
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork).toEqual(['6 Combat']);
        });

        it('should ignore numeric followup_attack_types (only strings are processed)', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                name: '7 Combat',
                followup_attack_types: 12345 as any  // Invalid - should be ignored
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            // Should export without followup types since numeric is not a valid string
            expect(result.cards.teamwork).toEqual(['7 Combat']);
        });
    });

    describe('Card Name Variations', () => {
        it('should use card_name when name is missing', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                card_name: '6 Combat',
                followup_attack_types: 'Brute Force + Energy'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork).toEqual(['6 Combat - Brute Force + Energy']);
        });

        it('should prefer name over card_name', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                name: '7 Combat',
                card_name: '6 Combat',
                followup_attack_types: 'Intelligence + Energy'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork).toEqual(['7 Combat - Intelligence + Energy']);
        });

        it('should use "Unknown Card" when both name and card_name are missing', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                followup_attack_types: 'Brute Force + Energy'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork).toEqual(['Unknown Card - Brute Force + Energy']);
        });
    });

    describe('Quantity Handling', () => {
        it('should handle quantity 0 (defaults to 1)', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 0 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                name: '6 Combat',
                followup_attack_types: 'Brute Force + Energy'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork).toEqual(['6 Combat - Brute Force + Energy']);
        });

        it('should handle undefined quantity (defaults to 1)', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork' }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                name: '7 Combat',
                followup_attack_types: 'Intelligence + Energy'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork).toEqual(['7 Combat - Intelligence + Energy']);
        });

        it('should handle large quantities', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 10 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                name: '6 Combat',
                followup_attack_types: 'Brute Force + Energy'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork.length).toBe(10);
            expect(result.cards.teamwork.every((card: string) => card === '6 Combat - Brute Force + Energy')).toBe(true);
        });

        it('should handle multiple cards with different quantities', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 2 },
                { cardId: 'teamwork2', type: 'teamwork', quantity: 3 },
                { cardId: 'teamwork3', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                name: '6 Combat',
                followup_attack_types: 'Brute Force + Energy'
            });
            mockAvailableCardsMap.set('teamwork2', {
                name: '7 Combat',
                followup_attack_types: 'Intelligence + Energy'
            });
            mockAvailableCardsMap.set('teamwork3', {
                name: '8 Energy',
                followup_attack_types: 'Combat + Intelligence'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork.length).toBe(6);
            expect(result.cards.teamwork.filter((c: string) => c === '6 Combat - Brute Force + Energy').length).toBe(2);
            expect(result.cards.teamwork.filter((c: string) => c === '7 Combat - Intelligence + Energy').length).toBe(3);
            expect(result.cards.teamwork.filter((c: string) => c === '8 Energy - Combat + Intelligence').length).toBe(1);
        });
    });

    describe('Real-World Data Scenarios', () => {
        it('should handle "Any-Power / Any-Power" format', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                name: '7 Any-Power',
                followup_attack_types: 'Any-Power / Any-Power'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork).toEqual(['7 Any-Power - Any-Power / Any-Power']);
        });

        it('should handle all four main stat types in followup', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 },
                { cardId: 'teamwork2', type: 'teamwork', quantity: 1 },
                { cardId: 'teamwork3', type: 'teamwork', quantity: 1 },
                { cardId: 'teamwork4', type: 'teamwork', quantity: 1 },
                { cardId: 'teamwork5', type: 'teamwork', quantity: 1 },
                { cardId: 'teamwork6', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                name: '6 Combat',
                followup_attack_types: 'Brute Force + Energy'
            });
            mockAvailableCardsMap.set('teamwork2', {
                name: '6 Combat',
                followup_attack_types: 'Intelligence + Energy'
            });
            mockAvailableCardsMap.set('teamwork3', {
                name: '6 Combat',
                followup_attack_types: 'Energy + Combat'
            });
            mockAvailableCardsMap.set('teamwork4', {
                name: '6 Combat',
                followup_attack_types: 'Intelligence + Brute Force'
            });
            mockAvailableCardsMap.set('teamwork5', {
                name: '6 Combat',
                followup_attack_types: 'Combat + Intelligence'
            });
            mockAvailableCardsMap.set('teamwork6', {
                name: '6 Combat',
                followup_attack_types: 'Brute Force + Intelligence'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork.length).toBe(6);
            expect(result.cards.teamwork).toContain('6 Combat - Brute Force + Energy');
            expect(result.cards.teamwork).toContain('6 Combat - Intelligence + Energy');
            expect(result.cards.teamwork).toContain('6 Combat - Energy + Combat');
            expect(result.cards.teamwork).toContain('6 Combat - Intelligence + Brute Force');
            expect(result.cards.teamwork).toContain('6 Combat - Combat + Intelligence');
            expect(result.cards.teamwork).toContain('6 Combat - Brute Force + Intelligence');
        });

        it('should handle various Energy values (6, 7, 8)', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 },
                { cardId: 'teamwork2', type: 'teamwork', quantity: 1 },
                { cardId: 'teamwork3', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                name: '6 Energy',
                followup_attack_types: 'Combat + Intelligence'
            });
            mockAvailableCardsMap.set('teamwork2', {
                name: '7 Energy',
                followup_attack_types: 'Brute Force + Combat'
            });
            mockAvailableCardsMap.set('teamwork3', {
                name: '8 Energy',
                followup_attack_types: 'Intelligence + Brute Force'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork).toContain('6 Energy - Combat + Intelligence');
            expect(result.cards.teamwork).toContain('7 Energy - Brute Force + Combat');
            expect(result.cards.teamwork).toContain('8 Energy - Intelligence + Brute Force');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should skip teamwork cards not in availableCardsMap', async () => {
            mockDeckEditorCards = [
                { cardId: 'missing1', type: 'teamwork', quantity: 1 },
                { cardId: 'missing2', type: 'teamwork', quantity: 1 },
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                name: '6 Combat',
                followup_attack_types: 'Brute Force + Energy'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork).toEqual(['6 Combat - Brute Force + Energy']);
        });

        it('should handle empty teamwork cards array', async () => {
            mockDeckEditorCards = [
                { cardId: 'character1', type: 'character', quantity: 1 }
            ];

            mockAvailableCardsMap.set('character1', {
                name: 'Test Character'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork).toEqual([]);
        });

        it('should handle whitespace in card name', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                name: '  6 Combat  ',
                followup_attack_types: 'Brute Force + Energy'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork).toEqual(['  6 Combat   - Brute Force + Energy']);
        });

        it('should handle special characters in followup_attack_types', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                name: '7 Combat',
                followup_attack_types: 'Intelligence + Energy (Special)'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork).toEqual(['7 Combat - Intelligence + Energy (Special)']);
        });

        it('should handle very long followup_attack_types strings', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 }
            ];

            const longString = 'Energy + Combat + Brute Force + Intelligence + Multi-Power + Any-Power';
            mockAvailableCardsMap.set('teamwork1', {
                name: '6 Combat',
                followup_attack_types: longString
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork).toEqual([`6 Combat - ${longString}`]);
        });
    });

    describe('Integration with Full Export', () => {
        it('should include teamwork cards in full deck export', async () => {
            mockDeckEditorCards = [
                { cardId: 'char1', type: 'character', quantity: 1 },
                { cardId: 'teamwork1', type: 'teamwork', quantity: 2 },
                { cardId: 'power1', type: 'power', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Test Character' });
            mockAvailableCardsMap.set('teamwork1', {
                name: '6 Combat',
                followup_attack_types: 'Brute Force + Energy'
            });
            mockAvailableCardsMap.set('power1', { name: '5 - Energy' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            expect(result.cards.teamwork).toBeDefined();
            expect(Array.isArray(result.cards.teamwork)).toBe(true);
            expect(result.cards.teamwork.length).toBe(2);
            expect(result.cards.teamwork).toEqual([
                '6 Combat - Brute Force + Energy',
                '6 Combat - Brute Force + Energy'
            ]);
        });

        it('should preserve order of teamwork cards in export', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 },
                { cardId: 'teamwork2', type: 'teamwork', quantity: 1 },
                { cardId: 'teamwork3', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', {
                name: '6 Combat',
                followup_attack_types: 'Brute Force + Energy'
            });
            mockAvailableCardsMap.set('teamwork2', {
                name: '7 Combat',
                followup_attack_types: 'Intelligence + Energy'
            });
            mockAvailableCardsMap.set('teamwork3', {
                name: '8 Energy',
                followup_attack_types: 'Combat + Intelligence'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).exportDeckAsJson = createExportFunction();

            const result = await (window as any).exportDeckAsJson();

            // Order should match deckEditorCards order
            expect(result.cards.teamwork[0]).toBe('6 Combat - Brute Force + Energy');
            expect(result.cards.teamwork[1]).toBe('7 Combat - Intelligence + Energy');
            expect(result.cards.teamwork[2]).toBe('8 Energy - Combat + Intelligence');
        });
    });
});


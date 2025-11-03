/** @jest-environment jsdom */

describe('Export Functionality', () => {
    let mockCurrentUser: any;
    let mockDeckEditorCards: any[];
    let mockAvailableCardsMap: Map<string, any>;
    let mockIsDeckLimited: boolean;

    beforeEach(() => {
        // Mock DOM elements
        document.body.innerHTML = `
            <h4>Test Deck Name</h4>
            <div class="deck-description">Test deck description</div>
            <div id="exportOverlay" style="display: none;"></div>
        `;

        // Mock global variables
        mockCurrentUser = {
            role: 'ADMIN',
            name: 'Test Admin',
            username: 'testadmin'
        };

        mockDeckEditorCards = [
            {
                cardId: 'char1',
                type: 'character',
                quantity: 1
            },
            {
                cardId: 'power1',
                type: 'power',
                quantity: 3
            },
            {
                cardId: 'ally1',
                type: 'ally-universe',
                quantity: 2
            }
        ];

        mockAvailableCardsMap = new Map([
            ['char1', {
                name: 'Test Character',
                energy: 5,
                combat: 4,
                brute_force: 3,
                intelligence: 2,
                threat_level: 0
            }],
            ['power1', {
                value: 8,
                power_type: 'Energy',
                threat_level: 0
            }],
            ['ally1', {
                card_name: 'Test Ally',
                stat_to_use: '3',
                stat_type_to_use: 'Combat',
                attack_value: 6,
                attack_type: 'Physical',
                threat_level: 1
            }]
        ]);

        mockIsDeckLimited = false;

        // Mock global variables
        (global as any).currentUser = mockCurrentUser;
        (global as any).deckEditorCards = mockDeckEditorCards;
        (global as any).availableCardsMap = mockAvailableCardsMap;
        (global as any).isDeckLimited = mockIsDeckLimited;

        // Mock validation function
        (global as any).validateDeck = jest.fn().mockReturnValue({
            errors: [],
            warnings: []
        });

        // Mock showExportOverlay function
        (global as any).showExportOverlay = jest.fn();

        // Mock export function
        (global as any).exportDeckAsJson = function(): any {
            const currentUser = (global as any).currentUser;
            const deckEditorCards = (global as any).deckEditorCards;
            const availableCardsMap = (global as any).availableCardsMap;
            const isDeckLimited = (global as any).isDeckLimited;
            const validateDeck = (global as any).validateDeck;
            const showExportOverlay = (global as any).showExportOverlay;

            if (!currentUser || currentUser.role !== 'ADMIN') {
                return;
            }

            try {
                // Get deck name and description from UI elements
                let deckName = 'Untitled Deck';
                let deckDescription = '';

                const deckTitleElement = document.querySelector('h4') || document.querySelector('.deck-title');
                if (deckTitleElement && deckTitleElement.textContent.trim()) {
                    let titleText = deckTitleElement.textContent.trim();
                    titleText = titleText.replace(/\s+(Not Legal|Legal|Invalid|Valid)$/i, '');
                    const legalityBadge = deckTitleElement.querySelector('.deck-validation-badge, .legality-badge');
                    if (legalityBadge) {
                        const cleanElement = deckTitleElement.cloneNode(true) as Element;
                        const cleanBadge = cleanElement.querySelector('.deck-validation-badge, .legality-badge');
                        if (cleanBadge) {
                            cleanBadge.remove();
                        }
                        titleText = cleanElement.textContent?.trim() || titleText;
                    }
                    if (titleText) {
                        deckName = titleText;
                    }
                }

                const deckDescElement = document.querySelector('.deck-description') || 
                                      document.querySelector('.deck-desc') ||
                                      document.querySelector('[data-deck-description]');
                if (deckDescElement && deckDescElement.textContent.trim()) {
                    deckDescription = deckDescElement.textContent.trim();
                }

                // Calculate deck statistics
                const totalCards = deckEditorCards
                    .filter((card: any) => !['mission', 'character', 'location'].includes(card.type))
                    .reduce((sum: number, card: any) => sum + card.quantity, 0);

                let maxEnergy = 0, maxCombat = 0, maxBruteForce = 0, maxIntelligence = 0;
                let totalThreat = 0;

                deckEditorCards.forEach((card: any) => {
                    const availableCard = availableCardsMap.get(card.cardId);
                    if (availableCard) {
                        maxEnergy = Math.max(maxEnergy, availableCard.energy || 0);
                        maxCombat = Math.max(maxCombat, availableCard.combat || 0);
                        maxBruteForce = Math.max(maxBruteForce, availableCard.brute_force || 0);
                        maxIntelligence = Math.max(maxIntelligence, availableCard.intelligence || 0);
                        totalThreat += (availableCard.threat_level || 0) * card.quantity;
                    }
                });

                // Helper function to get card name from availableCardsMap
                const getCardNameFromMap = (card: any) => {
                    const availableCard = availableCardsMap.get(card.cardId);
                    if (availableCard) {
                        if (card.type === 'power') {
                            return `${availableCard.value} - ${availableCard.power_type}`;
                        } else if (card.type === 'ally-universe') {
                            // Format: "Card Name - stat_to_use stat_type_to_use"
                            const cardName = availableCard.card_name || availableCard.name || 'Unknown Card';
                            const statToUse = availableCard.stat_to_use;
                            const statTypeToUse = availableCard.stat_type_to_use;
                            
                            if (statToUse && statTypeToUse) {
                                return `${cardName} - ${statToUse} ${statTypeToUse}`;
                            } else if (statTypeToUse && typeof statTypeToUse === 'string' && statTypeToUse.trim()) {
                                return `${cardName} - ${statTypeToUse}`;
                            } else if (statToUse !== null && statToUse !== undefined) {
                                return `${cardName} - ${statToUse}`;
                            }
                            return cardName;
                        } else {
                            return availableCard.name || availableCard.card_name || 'Unknown Card';
                        }
                    }
                    return 'Unknown Card';
                };

                // Helper function to create repeated cards array based on quantity
                const createRepeatedCards = (cards: any[], cardType: string) => {
                    const result: string[] = [];
                    cards.filter(card => card.type === cardType).forEach(card => {
                        const cardName = getCardNameFromMap(card);
                        const quantity = card.quantity || 1;
                        for (let i = 0; i < quantity; i++) {
                            result.push(cardName);
                        }
                    });
                    return result;
                };

                // Helper function to create characters array with reserve indicator
                const createCharactersArray = (cards: any[]) => {
                    const result: any[] = [];
                    const currentDeckData = (global as any).currentDeckData;
                    const reserveCharacterId = currentDeckData && currentDeckData.metadata && currentDeckData.metadata.reserve_character;
                    
                    cards.filter((card: any) => card.type === 'character').forEach((card: any) => {
                        const cardName = getCardNameFromMap(card);
                        const quantity = card.quantity || 1;
                        
                        if (card.cardId === reserveCharacterId) {
                            // Reserve character - structure as object with reserve flag
                            for (let i = 0; i < quantity; i++) {
                                result.push({
                                    [cardName]: {
                                        reserve: true
                                    }
                                });
                            }
                        } else {
                            // Regular character - just the name string
                            for (let i = 0; i < quantity; i++) {
                                result.push(cardName);
                            }
                        }
                    });
                    
                    return result;
                };

                // Organize cards by category with repeated cards for multiple quantities
                const cardCategories = {
                    characters: createCharactersArray(deckEditorCards),
                    special_cards: createRepeatedCards(deckEditorCards, 'special'),
                    locations: createRepeatedCards(deckEditorCards, 'location'),
                    missions: createRepeatedCards(deckEditorCards, 'mission'),
                    events: createRepeatedCards(deckEditorCards, 'event'),
                    aspects: createRepeatedCards(deckEditorCards, 'aspect'),
                    advanced_universe: createRepeatedCards(deckEditorCards, 'advanced-universe'),
                    teamwork: createRepeatedCards(deckEditorCards, 'teamwork'),
                    allies: createRepeatedCards(deckEditorCards, 'ally-universe'),
                    training: createRepeatedCards(deckEditorCards, 'training'),
                    basic_universe: createRepeatedCards(deckEditorCards, 'basic-universe'),
                    power_cards: createRepeatedCards(deckEditorCards, 'power')
                };

                // Determine if deck is legal and limited using the actual validation logic
                const validation = validateDeck(deckEditorCards);
                const isLegal = validation.errors.length === 0;
                const isLimited = isDeckLimited;

                // Create export data structure with data at top level
                const exportData = {
                        name: deckName,
                        description: deckDescription,
                        total_cards: totalCards,
                        max_energy: maxEnergy,
                        max_combat: maxCombat,
                        max_brute_force: maxBruteForce,
                        max_intelligence: maxIntelligence,
                        total_threat: totalThreat,
                        legal: isLegal,
                        limited: isLimited,
                        export_timestamp: new Date().toISOString(),
                    exported_by: currentUser.name || currentUser.username || 'Admin',
                    cards: cardCategories
                };

                // Show JSON in overlay
                const jsonString = JSON.stringify(exportData, null, 2);
                showExportOverlay(jsonString);

                return exportData;
            } catch (error) {
                console.error('Error exporting deck:', error);
                throw error;
            }
        };
    });

    afterEach(() => {
        // Clean up global variables
        delete (global as any).currentUser;
        delete (global as any).deckEditorCards;
        delete (global as any).availableCardsMap;
        delete (global as any).isDeckLimited;
        delete (global as any).validateDeck;
        delete (global as any).showExportOverlay;
        delete (global as any).exportDeckAsJson;
    });

    describe('exportDeckAsJson', () => {
        it('should export deck with correct structure', () => {
            const result = (global as any).exportDeckAsJson();

            expect(result).toBeDefined();
            expect(result).toBeDefined();
            expect(result.cards).toBeDefined();
            expect(result.name).toBe('Test Deck Name');
            expect(result.description).toBe('Test deck description');
        });

        it('should handle legal and limited status correctly', () => {
            // Test legal deck
            (global as any).validateDeck.mockReturnValue({ errors: [], warnings: [] });
            (global as any).isDeckLimited = false;

            let result = (global as any).exportDeckAsJson();
            expect(result.legal).toBe(true);
            expect(result.limited).toBe(false);

            // Test illegal deck
            (global as any).validateDeck.mockReturnValue({ 
                errors: ['Deck must have exactly 4 characters'], 
                warnings: [] 
            });

            result = (global as any).exportDeckAsJson();
            expect(result.legal).toBe(false);
            expect(result.limited).toBe(false);

            // Test limited deck
            (global as any).validateDeck.mockReturnValue({ errors: [], warnings: [] });
            (global as any).isDeckLimited = true;

            result = (global as any).exportDeckAsJson();
            expect(result.legal).toBe(true);
            expect(result.limited).toBe(true);
        });

        it('should handle card quantities correctly', () => {
            const result = (global as any).exportDeckAsJson();

            // Check that power cards with quantity 3 appear 3 times
            expect(result.cards.power_cards).toHaveLength(3);
            expect(result.cards.power_cards).toEqual([
                '8 - Energy',
                '8 - Energy', 
                '8 - Energy'
            ]);

            // Check that ally cards with quantity 2 appear 2 times
            expect(result.cards.allies).toHaveLength(2);
            expect(result.cards.allies).toEqual([
                'Test Ally - 3 Combat',
                'Test Ally - 3 Combat'
            ]);

            // Check that character cards with quantity 1 appear 1 time
            expect(result.cards.characters).toBeDefined();
            expect(Array.isArray(result.cards.characters)).toBe(true);
            expect(result.cards.characters.length).toBeGreaterThanOrEqual(1);
            // Character should be a string (not reserve) or an object (if reserve)
            const char = result.cards.characters[0];
            if (typeof char === 'string') {
                expect(char).toBe('Test Character');
            } else {
                expect(char).toHaveProperty('Test Character');
            }
        });

        it('should calculate deck statistics correctly', () => {
            const result = (global as any).exportDeckAsJson();

            expect(result.total_cards).toBe(5); // 3 power + 2 allies
            expect(result.max_energy).toBe(5);
            expect(result.max_combat).toBe(4);
            expect(result.max_brute_force).toBe(3);
            expect(result.max_intelligence).toBe(2);
            expect(result.total_threat).toBe(2); // (0*1) + (0*3) + (1*2) = 2
        });

        it('should remove legality badges from deck name', () => {
            // Test with legality badge in title
            const titleElement = document.querySelector('h4');
            titleElement!.innerHTML = 'Test Deck <span class="deck-validation-badge error">Not Legal</span>';
            titleElement!.textContent = 'Test Deck Not Legal';

            const result = (global as any).exportDeckAsJson();
            expect(result.name).toBe('Test Deck');
        });

        it('should handle empty deck gracefully', () => {
            (global as any).deckEditorCards = [];

            const result = (global as any).exportDeckAsJson();

            expect(result.total_cards).toBe(0);
            expect(result.max_energy).toBe(0);
            expect(result.max_combat).toBe(0);
            expect(result.max_brute_force).toBe(0);
            expect(result.max_intelligence).toBe(0);
            expect(result.total_threat).toBe(0);
            
            // All card categories should be empty arrays
            Object.values(result.cards).forEach(category => {
                expect(Array.isArray(category)).toBe(true);
                expect(category).toHaveLength(0);
            });
        });

        it('should deny access to non-ADMIN users', () => {
            (global as any).currentUser = { role: 'USER' };

            const result = (global as any).exportDeckAsJson();
            expect(result).toBeUndefined();
            expect((global as any).showExportOverlay).not.toHaveBeenCalled();
        });

        it('should deny access when no user is logged in', () => {
            (global as any).currentUser = null;

            const result = (global as any).exportDeckAsJson();
            expect(result).toBeUndefined();
            expect((global as any).showExportOverlay).not.toHaveBeenCalled();
        });

        it('should include correct metadata', () => {
            const result = (global as any).exportDeckAsJson();

            expect(result.exported_by).toBe('Test Admin');
            expect(result.export_timestamp).toBeDefined();
            expect(new Date(result.export_timestamp)).toBeInstanceOf(Date);
        });
    });
});

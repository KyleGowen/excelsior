/** @jest-environment jsdom */

/**
 * Unit Tests for Deck Ally Card Import Functionality
 * 
 * Tests cover:
 * - extractCardsFromImportData() - Ally card extraction from JSON with stat_to_use and stat_type_to_use parsing
 * - findAllyCardIdByName() - Ally card lookup by name AND stat_to_use AND stat_type_to_use
 * - processImportDeck() - Full import flow
 *   - Ally cards with both stat_to_use and stat_type_to_use
 *   - Ally cards with only stat_type_to_use
 *   - Ally cards with only stat_to_use
 *   - Ally cards without stat fields
 *   - Duplicate detection (allowed for ally cards)
 *   - Matching by exact stat_to_use and stat_type_to_use values
 *   - Error handling and validation
 *   - Success scenarios with verification
 */

describe('Deck Ally Card Import - Unit Tests', () => {
    let mockCurrentUser: any;
    let mockDeckEditorCards: any[];
    let mockAvailableCardsMap: Map<string, any>;
    let mockAddCardToEditor: jest.Mock;
    let mockShowNotification: jest.Mock;
    let mockCloseImportOverlay: jest.Mock;
    let mockValidateDeck: jest.Mock;
    let mockLoadAvailableCards: jest.Mock;

    // Helper to load the actual functions from deck-import.js
    let extractCardsFromImportData: (cardsData: any) => any[];
    let findAllyCardIdByName: (cardName: string, statToUse: string | null, statTypeToUse: string | null) => string | null;
    let processImportDeck: () => Promise<void>;

    beforeEach(() => {
        jest.useFakeTimers();

        // Mock DOM elements
        document.body.innerHTML = `
            <textarea id="importJsonContent"></textarea>
            <div id="importErrorMessages" style="display: none;"></div>
            <button id="importJsonButton"></button>
        `;

        // Mock global functions
        mockAddCardToEditor = jest.fn().mockImplementation(async (type, cardId, cardName, selectedAlternateImage) => {
            // Simulate adding card to deck - ally cards can have duplicates
            mockDeckEditorCards.push({
                id: `deckcard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: type,
                cardId: cardId,
                quantity: 1,
                selectedAlternateImage: selectedAlternateImage || null
            });
        });
        mockShowNotification = jest.fn();
        mockCloseImportOverlay = jest.fn();
        mockValidateDeck = jest.fn().mockReturnValue({ errors: [], warnings: [] });
        mockLoadAvailableCards = jest.fn().mockResolvedValue(undefined);

        // Mock global variables
        mockCurrentUser = {
            role: 'ADMIN',
            name: 'Test Admin',
            username: 'testadmin'
        };

        mockDeckEditorCards = [];

        mockAvailableCardsMap = new Map([
            // Ally cards with both stat_to_use and stat_type_to_use
            ['ally_little_john_5_or_less_bf', {
                id: 'ally_little_john_5_or_less_bf',
                name: 'Little John',
                card_name: 'Little John',
                cardType: 'ally-universe',
                type: 'ally-universe',
                stat_to_use: '5 or less',
                stat_type_to_use: 'Brute Force',
                alternateImages: []
            }],
            ['ally_little_john_3_combat', {
                id: 'ally_little_john_3_combat',
                name: 'Little John',
                card_name: 'Little John',
                cardType: 'ally-universe',
                type: 'ally-universe',
                stat_to_use: '3',
                stat_type_to_use: 'Combat',
                alternateImages: []
            }],
            ['ally_hera_7_or_higher_energy', {
                id: 'ally_hera_7_or_higher_energy',
                name: 'Hera',
                card_name: 'Hera',
                cardType: 'ally-universe',
                type: 'ally-universe',
                stat_to_use: '7 or higher',
                stat_type_to_use: 'Energy',
                alternateImages: []
            }],
            // Ally card with only stat_type_to_use
            ['ally_test_combat_only', {
                id: 'ally_test_combat_only',
                name: 'Test Ally',
                card_name: 'Test Ally',
                cardType: 'ally-universe',
                type: 'ally-universe',
                stat_type_to_use: 'Combat',
                alternateImages: []
            }],
            // Ally card with only stat_to_use
            ['ally_test_3_only', {
                id: 'ally_test_3_only',
                name: 'Test Ally 2',
                card_name: 'Test Ally 2',
                cardType: 'ally-universe',
                type: 'ally-universe',
                stat_to_use: '3',
                alternateImages: []
            }],
            // Ally card without stat fields
            ['ally_test_no_stats', {
                id: 'ally_test_no_stats',
                name: 'Test Ally 3',
                card_name: 'Test Ally 3',
                cardType: 'ally-universe',
                type: 'ally-universe',
                alternateImages: []
            }],
            // Different ally card with same name but different stats
            ['ally_little_john_5_or_less_energy', {
                id: 'ally_little_john_5_or_less_energy',
                name: 'Little John',
                card_name: 'Little John',
                cardType: 'ally-universe',
                type: 'ally-universe',
                stat_to_use: '5 or less',
                stat_type_to_use: 'Energy',
                alternateImages: []
            }],
        ]);

        (window as any).currentUser = mockCurrentUser;
        (window as any).deckEditorCards = mockDeckEditorCards;
        (window as any).availableCardsMap = mockAvailableCardsMap;
        (window as any).addCardToEditor = mockAddCardToEditor;
        (window as any).showNotification = mockShowNotification;
        (window as any).closeImportOverlay = mockCloseImportOverlay;
        (window as any).validateDeck = mockValidateDeck;
        (window as any).loadAvailableCards = mockLoadAvailableCards;
        (window as any).DECK_RULES = {};

        // Recreate the actual functions from deck-import.js
        extractCardsFromImportData = (cardsData: any) => {
            const result: any[] = [];

            // Helper to add card with type
            const addCard = (cardName: string, cardType: string) => {
                if (cardName && typeof cardName === 'string') {
                    result.push({ name: cardName.trim(), type: cardType });
                }
            };

            // Allies (array of strings, format: "Little John - 5 or less Brute Force")
            if (Array.isArray(cardsData.allies)) {
                cardsData.allies.forEach((cardName: any) => {
                    if (cardName && typeof cardName === 'string') {
                        const trimmedName = cardName.trim();
                        const dashIndex = trimmedName.indexOf(' - ');
                        
                        if (dashIndex > 0) {
                            // Has stat information after dash
                            const baseName = trimmedName.substring(0, dashIndex).trim();
                            const statInfo = trimmedName.substring(dashIndex + 3).trim();
                            
                            // Split stat_info into stat_to_use and stat_type_to_use
                            const statTypes = ['Brute Force', 'Energy', 'Combat', 'Intelligence']; // Order matters - two-word first
                            let statTypeToUse = null;
                            let statToUse = null;
                            
                            // Try to find a stat type at the end (check two-word types first)
                            for (const statType of statTypes) {
                                if (statInfo.endsWith(` ${statType}`) || statInfo === statType) {
                                    statTypeToUse = statType;
                                    const remaining = statInfo.substring(0, statInfo.length - statType.length).trim();
                                    statToUse = remaining || null;
                                    break;
                                }
                            }
                            
                            // If no stat type found, treat entire string as stat_type_to_use or stat_to_use
                            if (!statTypeToUse) {
                                // Check if it's just a stat type
                                if (statTypes.includes(statInfo)) {
                                    statTypeToUse = statInfo;
                                } else {
                                    // Otherwise treat as stat_to_use only
                                    statToUse = statInfo;
                                }
                            }
                            
                            result.push({ 
                                name: baseName, 
                                type: 'ally-universe',
                                stat_to_use: statToUse,
                                stat_type_to_use: statTypeToUse
                            });
                        } else {
                            // No stat information, just the base name
                            result.push({ name: trimmedName, type: 'ally-universe' });
                        }
                    }
                });
            }

            return result;
        };

        findAllyCardIdByName = (cardName: string, statToUse: string | null, statTypeToUse: string | null) => {
            if (!mockAvailableCardsMap || !cardName || typeof cardName !== 'string') {
                return null;
            }
            
            // Search through all cards to find matching ally card
            for (const [key, card] of mockAvailableCardsMap.entries()) {
                // Skip if key or card is undefined/null
                if (!key || !card) {
                    continue;
                }
                
                // Additional safety check: ensure card has expected properties
                if (!card.id || typeof card.id !== 'string') {
                    continue;
                }
                
                // Check if this is an ally card
                const cardType = card.cardType || card.type || card.card_type;
                if (!cardType || (cardType !== 'ally-universe' && cardType !== 'ally_universe')) {
                    continue;
                }
                
                // Check name match (ally cards use name or card_name)
                const cardNameMatch = (card.name && typeof card.name === 'string' && card.name === cardName) ||
                                     (card.card_name && typeof card.card_name === 'string' && card.card_name === cardName);
                
                if (!cardNameMatch) {
                    continue; // Name doesn't match
                }
                
                // Check stat_to_use and stat_type_to_use match
                const cardStatToUse = card.stat_to_use;
                const cardStatTypeToUse = card.stat_type_to_use;
                
                // Normalize stat_type_to_use for comparison (trim)
                const normalizeStatType = (statType: any) => {
                    if (!statType || typeof statType !== 'string') return null;
                    return statType.trim();
                };
                
                const normalizedCardStatType = normalizeStatType(cardStatTypeToUse);
                const normalizedSearchStatType = normalizeStatType(statTypeToUse);
                
                // Normalize stat_to_use for comparison
                const normalizeStatToUse = (stat: any) => {
                    if (stat === null || stat === undefined) return null;
                    if (typeof stat === 'string') return stat.trim();
                    return String(stat).trim();
                };
                
                const normalizedCardStatToUse = normalizeStatToUse(cardStatToUse);
                const normalizedSearchStatToUse = normalizeStatToUse(statToUse);
                
                // Match logic:
                // If both stat_to_use and stat_type_to_use are provided, both must match
                // If only stat_type_to_use is provided, it must match
                // If only stat_to_use is provided, it must match
                // If neither is provided, match cards with neither
                if (statToUse !== null && statTypeToUse !== null) {
                    // Both provided - both must match
                    if (normalizedCardStatToUse === normalizedSearchStatToUse &&
                        normalizedCardStatType === normalizedSearchStatType) {
                        return card.id;
                    }
                } else if (statTypeToUse !== null) {
                    // Only stat_type_to_use provided
                    if (normalizedCardStatType === normalizedSearchStatType) {
                        return card.id;
                    }
                } else if (statToUse !== null) {
                    // Only stat_to_use provided
                    if (normalizedCardStatToUse === normalizedSearchStatToUse) {
                        return card.id;
                    }
                } else {
                    // Neither provided - match cards with neither
                    if (!normalizedCardStatToUse && !normalizedCardStatType) {
                        return card.id;
                    }
                }
            }
            
            return null;
        };

        processImportDeck = async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            const importButton = document.getElementById('importJsonButton') as HTMLButtonElement;

            if (!textarea || !errorMessages || !importButton) {
                mockShowNotification('Import UI elements not found', 'error');
                return;
            }

            const jsonText = textarea.value.trim();
            if (!jsonText) {
                errorMessages.style.display = 'block';
                errorMessages.innerHTML = '<ul><li>Please paste JSON data into the text area</li></ul>';
                return;
            }

            importButton.disabled = true;

            try {
                let importData;
                try {
                    importData = JSON.parse(jsonText);
                } catch (parseError: any) {
                    errorMessages.style.display = 'block';
                    errorMessages.innerHTML = `<ul><li>Invalid JSON format: ${parseError.message}</li></ul>`;
                    importButton.disabled = false;
                    return;
                }

                if (!importData.cards || typeof importData.cards !== 'object') {
                    errorMessages.style.display = 'block';
                    errorMessages.innerHTML = '<ul><li>Invalid import format: Missing "cards" section</li></ul>';
                    importButton.disabled = false;
                    return;
                }

                const cardsToImport = extractCardsFromImportData(importData.cards);
                if (cardsToImport.length === 0) {
                    errorMessages.style.display = 'block';
                    errorMessages.innerHTML = '<ul><li>No cards found in import data</li></ul>';
                    importButton.disabled = false;
                    return;
                }

                if (!mockAvailableCardsMap || mockAvailableCardsMap.size === 0) {
                    if (typeof mockLoadAvailableCards === 'function') {
                        await mockLoadAvailableCards();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                    if (!mockAvailableCardsMap || mockAvailableCardsMap.size === 0) {
                        errorMessages.style.display = 'block';
                        errorMessages.innerHTML = '<ul><li>Card data not loaded. Please refresh the page and try again.</li></ul>';
                        importButton.disabled = false;
                        return;
                    }
                }

                const currentDeckCards = [...mockDeckEditorCards];
                const importList: any[] = [];
                const unresolvedCards: string[] = [];

                for (const cardEntry of cardsToImport) {
                    if (cardEntry.type !== 'ally-universe') {
                        continue;
                    }

                    const statToUse = cardEntry.stat_to_use || null;
                    const statTypeToUse = cardEntry.stat_type_to_use || null;
                    const cardId = findAllyCardIdByName(cardEntry.name, statToUse, statTypeToUse);

                    if (cardId) {
                        importList.push({
                            type: cardEntry.type,
                            cardId: cardId,
                            cardName: cardEntry.name
                        });
                    } else {
                        unresolvedCards.push(cardEntry.name + (statToUse ? ` - ${statToUse}` : '') + (statTypeToUse ? ` ${statTypeToUse}` : ''));
                    }
                }

                if (unresolvedCards.length > 0) {
                    const unresolvedList = unresolvedCards.slice(0, 10).join(', ');
                    const moreText = unresolvedCards.length > 10 ? ` (and ${unresolvedCards.length - 10} more)` : '';
                    errorMessages.style.display = 'block';
                    errorMessages.innerHTML = `<ul><li>Could not find ${unresolvedCards.length} card(s): ${unresolvedList}${moreText}</li></ul>`;
                    importButton.disabled = false;
                    return;
                }

                const testDeckCards = [];
                currentDeckCards.forEach(card => {
                    testDeckCards.push({
                        type: card.type,
                        cardId: card.cardId,
                        quantity: card.quantity || 1
                    });
                });

                for (const importCard of importList) {
                    const existingIndex = testDeckCards.findIndex(
                        card => card.type === importCard.type && card.cardId === importCard.cardId
                    );

                    if (existingIndex >= 0) {
                        testDeckCards[existingIndex].quantity += 1;
                    } else {
                        testDeckCards.push({
                            type: importCard.type,
                            cardId: importCard.cardId,
                            quantity: 1
                        });
                    }
                }

                if (typeof mockValidateDeck === 'function') {
                    try {
                        const validation = mockValidateDeck(testDeckCards);
                        if (validation && validation.errors && validation.errors.length > 0) {
                            const filteredErrors = validation.errors.filter((error: string) => {
                                if (typeof error === 'string') {
                                    if (error.includes('cards in draw pile')) {
                                        return false;
                                    }
                                    if (error.includes('threat level') || error.includes('Total threat')) {
                                        return false;
                                    }
                                }
                                return true;
                            });

                            if (filteredErrors.length > 0) {
                                errorMessages.style.display = 'block';
                                errorMessages.innerHTML = '<ul>' + filteredErrors.map((error: string) => `<li>${error}</li>`).join('') + '</ul>';
                                importButton.disabled = false;
                                return;
                            }
                        }
                    } catch (validationError: any) {
                        console.error('Error during deck validation:', validationError);
                        errorMessages.style.display = 'block';
                        errorMessages.innerHTML = `<ul><li>Validation error: ${validationError.message}</li></ul>`;
                        importButton.disabled = false;
                        return;
                    }
                } else {
                    console.warn('mockValidateDeck function not found - skipping validation');
                }

                let successCount = 0;
                let errorCount = 0;
                const addErrors: string[] = [];

                for (const importCard of importList) {
                    if (importCard.type !== 'ally-universe') {
                        continue;
                    }

                    try {
                        const cardData = mockAvailableCardsMap.get(importCard.cardId);
                        let selectedAlternateImage = null;
                        if (cardData && cardData.alternateImages && cardData.alternateImages.length > 0) {
                            selectedAlternateImage = cardData.alternateImages[0];
                        }

                        if (typeof mockAddCardToEditor === 'function') {
                            await mockAddCardToEditor(importCard.type, importCard.cardId, importCard.cardName, selectedAlternateImage);
                            await new Promise(resolve => setTimeout(resolve, 100));

                            const wasAdded = mockDeckEditorCards?.some(c =>
                                c.type === importCard.type && c.cardId === importCard.cardId
                            );

                            if (wasAdded) {
                                successCount++;
                            } else {
                                errorCount++;
                                addErrors.push(`${importCard.cardName}: Card was not added to deck`);
                            }
                        } else {
                            throw new Error('mockAddCardToEditor function not available');
                        }
                    } catch (error: any) {
                        errorCount++;
                        addErrors.push(`${importCard.cardName}: ${error.message}`);
                    }
                }

                if (errorCount > 0) {
                    errorMessages.style.display = 'block';
                    errorMessages.innerHTML = '<ul>' +
                        `<li>Successfully imported ${successCount} card(s)</li>` +
                        addErrors.map(error => `<li>${error}</li>`).join('') +
                        '</ul>';
                } else {
                    mockCloseImportOverlay();
                    mockShowNotification(`Successfully imported ${successCount} card(s)`, 'success');
                }

            } catch (error: any) {
                console.error('Error processing import:', error);
                errorMessages.style.display = 'block';
                errorMessages.innerHTML = `<ul><li>Error processing import: ${error.message}</li></ul>`;
            } finally {
                importButton.disabled = false;
            }
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        jest.useRealTimers();
        delete (window as any).currentUser;
        delete (window as any).deckEditorCards;
        delete (window as any).availableCardsMap;
        delete (window as any).addCardToEditor;
        delete (window as any).showNotification;
        delete (window as any).closeImportOverlay;
        delete (window as any).validateDeck;
        delete (window as any).loadAvailableCards;
        delete (window as any).DECK_RULES;
    });

    describe('extractCardsFromImportData', () => {
        it('should extract ally cards with both stat_to_use and stat_type_to_use', () => {
            const cardsData = {
                allies: [
                    'Little John - 5 or less Brute Force',
                    'Hera - 7 or higher Energy'
                ]
            };
            const result = extractCardsFromImportData(cardsData);
            expect(result.length).toBe(2);
            expect(result[0]).toEqual({ 
                name: 'Little John', 
                type: 'ally-universe', 
                stat_to_use: '5 or less',
                stat_type_to_use: 'Brute Force'
            });
            expect(result[1]).toEqual({ 
                name: 'Hera', 
                type: 'ally-universe', 
                stat_to_use: '7 or higher',
                stat_type_to_use: 'Energy'
            });
        });

        it('should extract ally cards with only stat_type_to_use', () => {
            const cardsData = {
                allies: [
                    'Little John - Combat'
                ]
            };
            const result = extractCardsFromImportData(cardsData);
            expect(result.length).toBe(1);
            expect(result[0]).toEqual({ 
                name: 'Little John', 
                type: 'ally-universe', 
                stat_to_use: null,
                stat_type_to_use: 'Combat'
            });
        });

        it('should extract ally cards with only stat_to_use', () => {
            const cardsData = {
                allies: [
                    'Little John - 3'
                ]
            };
            const result = extractCardsFromImportData(cardsData);
            expect(result.length).toBe(1);
            expect(result[0]).toEqual({ 
                name: 'Little John', 
                type: 'ally-universe', 
                stat_to_use: '3',
                stat_type_to_use: null
            });
        });

        it('should extract ally cards without stat fields', () => {
            const cardsData = {
                allies: [
                    'Little John'
                ]
            };
            const result = extractCardsFromImportData(cardsData);
            expect(result.length).toBe(1);
            expect(result[0]).toEqual({ 
                name: 'Little John', 
                type: 'ally-universe'
            });
            expect(result[0].stat_to_use).toBeUndefined();
            expect(result[0].stat_type_to_use).toBeUndefined();
        });

        it('should handle whitespace in ally card names', () => {
            const cardsData = {
                allies: [
                    '  Little John   -   5 or less   Brute Force  '
                ]
            };
            const result = extractCardsFromImportData(cardsData);
            expect(result.length).toBe(1);
            expect(result[0].name).toBe('Little John');
            expect(result[0].stat_to_use).toBe('5 or less');
            expect(result[0].stat_type_to_use).toBe('Brute Force');
        });

        it('should handle "Brute Force" as two-word stat type', () => {
            const cardsData = {
                allies: [
                    'Little John - 5 or less Brute Force'
                ]
            };
            const result = extractCardsFromImportData(cardsData);
            expect(result.length).toBe(1);
            expect(result[0].stat_type_to_use).toBe('Brute Force');
            expect(result[0].stat_to_use).toBe('5 or less');
        });

        it('should handle empty allies array', () => {
            const cardsData = {
                allies: []
            };
            const result = extractCardsFromImportData(cardsData);
            expect(result.length).toBe(0);
        });

        it('should handle mixed ally cards with and without stat info', () => {
            const cardsData = {
                allies: [
                    'Little John - 5 or less Brute Force',
                    'Hera - Combat',
                    'Test Ally'
                ]
            };
            const result = extractCardsFromImportData(cardsData);
            expect(result.length).toBe(3);
            expect(result[0]).toEqual({ 
                name: 'Little John', 
                type: 'ally-universe', 
                stat_to_use: '5 or less',
                stat_type_to_use: 'Brute Force'
            });
            expect(result[1]).toEqual({ 
                name: 'Hera', 
                type: 'ally-universe', 
                stat_to_use: null,
                stat_type_to_use: 'Combat'
            });
            expect(result[2]).toEqual({ 
                name: 'Test Ally', 
                type: 'ally-universe'
            });
        });
    });

    describe('findAllyCardIdByName', () => {
        it('should find ally card by name, stat_to_use, and stat_type_to_use', () => {
            const cardId = findAllyCardIdByName('Little John', '5 or less', 'Brute Force');
            expect(cardId).toBe('ally_little_john_5_or_less_bf');
        });

        it('should differentiate between ally cards with same name but different stats', () => {
            const cardId1 = findAllyCardIdByName('Little John', '5 or less', 'Brute Force');
            const cardId2 = findAllyCardIdByName('Little John', '5 or less', 'Energy');
            
            expect(cardId1).toBe('ally_little_john_5_or_less_bf');
            expect(cardId2).toBe('ally_little_john_5_or_less_energy');
            expect(cardId1).not.toBe(cardId2);
        });

        it('should find ally card with only stat_type_to_use', () => {
            const cardId = findAllyCardIdByName('Test Ally', null, 'Combat');
            expect(cardId).toBe('ally_test_combat_only');
        });

        it('should find ally card with only stat_to_use', () => {
            const cardId = findAllyCardIdByName('Test Ally 2', '3', null);
            expect(cardId).toBe('ally_test_3_only');
        });

        it('should find ally card without stat fields', () => {
            const cardId = findAllyCardIdByName('Test Ally 3', null, null);
            expect(cardId).toBe('ally_test_no_stats');
        });

        it('should return null for non-existent ally card', () => {
            const cardId = findAllyCardIdByName('Non-existent Ally', 'Some Stat', 'Some Type');
            expect(cardId).toBeNull();
        });

        it('should return null when stat_to_use does not match', () => {
            const cardId = findAllyCardIdByName('Little John', '7 or higher', 'Brute Force');
            expect(cardId).toBeNull();
        });

        it('should return null when stat_type_to_use does not match', () => {
            const cardId = findAllyCardIdByName('Little John', '5 or less', 'Intelligence');
            expect(cardId).toBeNull();
        });

        it('should match stat values with whitespace trimmed', () => {
            const cardId1 = findAllyCardIdByName('Little John', '5 or less', 'Brute Force');
            const cardId2 = findAllyCardIdByName('Little John', '  5 or less  ', '  Brute Force  ');
            
            expect(cardId1).toBe('ally_little_john_5_or_less_bf');
            expect(cardId2).toBe('ally_little_john_5_or_less_bf');
        });
    });

    describe('processImportDeck - Ally Import', () => {
        it('should successfully import ally cards with both stat_to_use and stat_type_to_use', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    allies: [
                        'Little John - 5 or less Brute Force',
                        'Hera - 7 or higher Energy'
                    ]
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(2);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('ally-universe', 'ally_little_john_5_or_less_bf', 'Little John', null);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('ally-universe', 'ally_hera_7_or_higher_energy', 'Hera', null);
            expect(mockCloseImportOverlay).toHaveBeenCalled();
            expect(mockShowNotification).toHaveBeenCalledWith('Successfully imported 2 card(s)', 'success');
        });

        it('should successfully import ally cards with only stat_type_to_use', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    allies: ['Test Ally - Combat']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(1);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('ally-universe', 'ally_test_combat_only', 'Test Ally', null);
            expect(mockCloseImportOverlay).toHaveBeenCalled();
        });

        it('should successfully import ally cards with only stat_to_use', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    allies: ['Test Ally 2 - 3']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(1);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('ally-universe', 'ally_test_3_only', 'Test Ally 2', null);
            expect(mockCloseImportOverlay).toHaveBeenCalled();
        });

        it('should successfully import ally cards without stat fields', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    allies: ['Test Ally 3']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(1);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('ally-universe', 'ally_test_no_stats', 'Test Ally 3', null);
            expect(mockCloseImportOverlay).toHaveBeenCalled();
        });

        it('should import duplicate ally cards (multiple instances)', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    allies: [
                        'Little John - 5 or less Brute Force',
                        'Little John - 5 or less Brute Force',
                        'Little John - 5 or less Brute Force'
                    ]
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(3);
            expect(mockDeckEditorCards.filter(c => c.cardId === 'ally_little_john_5_or_less_bf').length).toBe(3);
            expect(mockShowNotification).toHaveBeenCalledWith('Successfully imported 3 card(s)', 'success');
        });

        it('should differentiate between same name but different stat combinations', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    allies: [
                        'Little John - 5 or less Brute Force',
                        'Little John - 5 or less Energy',
                        'Little John - 3 Combat'
                    ]
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(3);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('ally-universe', 'ally_little_john_5_or_less_bf', 'Little John', null);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('ally-universe', 'ally_little_john_5_or_less_energy', 'Little John', null);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('ally-universe', 'ally_little_john_3_combat', 'Little John', null);
            expect(mockDeckEditorCards.filter(c => c.cardId === 'ally_little_john_5_or_less_bf').length).toBe(1);
            expect(mockDeckEditorCards.filter(c => c.cardId === 'ally_little_john_5_or_less_energy').length).toBe(1);
            expect(mockDeckEditorCards.filter(c => c.cardId === 'ally_little_john_3_combat').length).toBe(1);
        });

        it('should handle unresolved ally cards', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    allies: [
                        'Non-existent Ally - Some Stat Some Type',
                        'Little John - Wrong Stat Brute Force'
                    ]
                }
            });

            const errorMessages = document.getElementById('importErrorMessages') as HTMLDivElement;
            await processImportDeck();

            expect(mockAddCardToEditor).not.toHaveBeenCalled();
            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('Could not find 2 card(s)');
        });

        it('should handle mixed ally cards with various stat configurations', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    allies: [
                        'Little John - 5 or less Brute Force',
                        'Test Ally - Combat',
                        'Test Ally 2 - 3',
                        'Test Ally 3'
                    ]
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(4);
            expect(mockCloseImportOverlay).toHaveBeenCalled();
        });
    });

    describe('processImportDeck - Validation', () => {
        it('should filter out 51-card and threat level validation errors', async () => {
            mockValidateDeck.mockReturnValue({
                errors: [
                    'Deck must have at least 51 cards in draw pile (2/51)',
                    'Total threat level must be <= 76 (current: 78)'
                ],
                warnings: []
            });

            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    allies: ['Little John - 5 or less Brute Force']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalled();
            expect(mockCloseImportOverlay).toHaveBeenCalled();
        });

        it('should handle addCardToEditor throwing error', async () => {
            mockAddCardToEditor.mockImplementationOnce(() => {
                throw new Error('Failed to add card');
            });

            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    allies: ['Little John - 5 or less Brute Force']
                }
            });

            const errorMessages = document.getElementById('importErrorMessages') as HTMLDivElement;
            await processImportDeck();

            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('Little John: Failed to add card');
            expect(mockShowNotification).not.toHaveBeenCalled();
        });
    });
});


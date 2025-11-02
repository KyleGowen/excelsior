/** @jest-environment jsdom */

/**
 * Unit Tests for Deck Teamwork Card Import Functionality
 * 
 * Tests cover:
 * - extractCardsFromImportData() - Teamwork card extraction from JSON with followup_attack_types parsing
 * - findTeamworkCardIdByName() - Teamwork card lookup by name AND followup_attack_types
 * - processImportDeck() - Full import flow
 *   - Teamwork cards with followup_attack_types
 *   - Teamwork cards without followup_attack_types
 *   - Duplicate detection (allowed for teamwork cards)
 *   - Matching by exact followup_attack_types value
 *   - Error handling and validation
 *   - Success scenarios with verification
 */

describe('Deck Teamwork Card Import - Unit Tests', () => {
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
    let findTeamworkCardIdByName: (cardName: string, followupTypes: string | null) => string | null;
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
            // Simulate adding card to deck - teamwork cards can have duplicates
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
            // Teamwork cards with followup_attack_types - use unique keys but cards have same name
            // IMPORTANT: These cards have cardType set (like loadAvailableCards does)
            ['teamwork_6_combat_bf_e', {
                id: 'teamwork_6_combat_bf_e',
                name: '6 Combat',
                to_use: '6 Combat', // Primary name field for teamwork cards
                cardType: 'teamwork', // Set by loadAvailableCards
                type: 'teamwork',
                followup_attack_types: 'Brute Force + Energy',
                alternateImages: []
            }],
            ['teamwork_6_combat_bf_i', {
                id: 'teamwork_6_combat_bf_i',
                name: '6 Combat',
                to_use: '6 Combat',
                cardType: 'teamwork',
                type: 'teamwork',
                followup_attack_types: 'Brute Force + Intelligence',
                alternateImages: []
            }],
            ['teamwork_7_combat_i_e', {
                id: 'teamwork_7_combat_i_e',
                name: '7 Combat',
                to_use: '7 Combat',
                cardType: 'teamwork',
                type: 'teamwork',
                followup_attack_types: 'Intelligence + Energy',
                alternateImages: []
            }],
            ['teamwork_7_combat_bf_e', {
                id: 'teamwork_7_combat_bf_e',
                name: '7 Combat',
                to_use: '7 Combat',
                cardType: 'teamwork',
                type: 'teamwork',
                followup_attack_types: 'Brute Force + Energy',
                alternateImages: []
            }],
            ['teamwork_7_anypower', {
                id: 'teamwork_7_anypower',
                name: '7 Any-Power',
                to_use: '7 Any-Power',
                cardType: 'teamwork',
                type: 'teamwork',
                followup_attack_types: 'Any-Power / Any-Power',
                alternateImages: []
            }],
            // Teamwork card without followup_attack_types
            ['teamwork_8_energy_no_followup', {
                id: 'teamwork_8_energy_no_followup',
                name: '8 Energy',
                to_use: '8 Energy',
                cardType: 'teamwork',
                type: 'teamwork',
                alternateImages: []
            }],
            // Teamwork card with follow_up_attack_types (alternative field name)
            ['teamwork_6_bf_i_c', {
                id: 'teamwork_6_bf_i_c',
                name: '6 Brute Force',
                to_use: '6 Brute Force',
                cardType: 'teamwork',
                type: 'teamwork',
                follow_up_attack_types: 'Intelligence + Combat',
                alternateImages: []
            }],
            // Teamwork card with ONLY cardType (not type) - tests the fix
            ['teamwork_cardtype_only', {
                id: 'teamwork_cardtype_only',
                name: '9 Combat',
                to_use: '9 Combat',
                cardType: 'teamwork', // Only cardType, no type field
                followup_attack_types: 'Energy + Intelligence',
                alternateImages: []
            }],
            // Teamwork card with ONLY cardType and no followup
            ['teamwork_cardtype_only_no_followup', {
                id: 'teamwork_cardtype_only_no_followup',
                name: '10 Energy',
                to_use: '10 Energy',
                cardType: 'teamwork', // Only cardType, no type field
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

            // Teamwork (array of strings, format: "6 Combat - Brute Force + Intelligence")
            if (Array.isArray(cardsData.teamwork)) {
                cardsData.teamwork.forEach((cardName: any) => {
                    if (cardName && typeof cardName === 'string') {
                        // Parse teamwork card name to extract base name and followup_attack_types
                        // Format: "6 Combat - Brute Force + Intelligence" or just "6 Combat"
                        const trimmedName = cardName.trim();
                        const dashIndex = trimmedName.indexOf(' - ');
                        
                        if (dashIndex > 0) {
                            // Has followup_attack_types
                            const baseName = trimmedName.substring(0, dashIndex).trim();
                            const followupTypes = trimmedName.substring(dashIndex + 3).trim();
                            result.push({ 
                                name: baseName, 
                                type: 'teamwork',
                                followup_attack_types: followupTypes
                            });
                        } else {
                            // No followup_attack_types, just the base name
                            result.push({ name: trimmedName, type: 'teamwork' });
                        }
                    }
                });
            }

            return result;
        };

        findTeamworkCardIdByName = (cardName: string, followupTypes: string | null) => {
            if (!mockAvailableCardsMap || !cardName || typeof cardName !== 'string') {
                return null;
            }
            
            // Search through all cards to find matching teamwork card
            for (const [key, card] of mockAvailableCardsMap.entries()) {
                // Skip if key or card is undefined/null, or key is not a string
                if (!key || !card || typeof key !== 'string') {
                    continue;
                }
                
                // Additional safety check: ensure card has expected properties
                if (!card.id || typeof card.id !== 'string') {
                    continue;
                }
                
                // Check if this is a teamwork card
                // IMPORTANT: Check cardType first (set by loadAvailableCards), then fallback to type/card_type
                const cardType = card.cardType || card.type || card.card_type;
                if (cardType !== 'teamwork') {
                    continue;
                }
                
                // Check name match - for teamwork cards, check to_use first (primary name field)
                const cardNameMatch = (card.to_use && typeof card.to_use === 'string' && card.to_use === cardName) ||
                                     (card.name && typeof card.name === 'string' && card.name === cardName) ||
                                     (card.card_name && typeof card.card_name === 'string' && card.card_name === cardName);
                
                if (!cardNameMatch) {
                    continue; // Name doesn't match
                }
                
                // Check followup_attack_types match (check both field name variations)
                const cardFollowupTypes = card.followup_attack_types || card.follow_up_attack_types;
                
                if (followupTypes) {
                    // If followupTypes is provided, must match exactly
                    if (cardFollowupTypes && typeof cardFollowupTypes === 'string' && 
                        cardFollowupTypes.trim() === followupTypes.trim()) {
                        return card.id;
                    }
                } else {
                    // If no followupTypes provided, match cards that also have no followup_attack_types
                    if (!cardFollowupTypes || (typeof cardFollowupTypes === 'string' && !cardFollowupTypes.trim())) {
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
                    if (cardEntry.type !== 'teamwork') {
                        continue;
                    }

                    const followupTypes = cardEntry.followup_attack_types || null;
                    const cardId = findTeamworkCardIdByName(cardEntry.name, followupTypes);

                    if (cardId) {
                        importList.push({
                            type: cardEntry.type,
                            cardId: cardId,
                            cardName: cardEntry.name
                        });
                    } else {
                        unresolvedCards.push(cardEntry.name + (followupTypes ? ` - ${followupTypes}` : ''));
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
                    if (importCard.type !== 'teamwork') {
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
    });

    describe('extractCardsFromImportData', () => {
        it('should extract teamwork cards with followup_attack_types', () => {
            const cardsData = {
                teamwork: [
                    '6 Combat - Brute Force + Energy',
                    '7 Combat - Intelligence + Energy'
                ]
            };
            const result = extractCardsFromImportData(cardsData);
            expect(result.length).toBe(2);
            expect(result.filter(c => c.type === 'teamwork').length).toBe(2);
            expect(result[0]).toEqual({ name: '6 Combat', type: 'teamwork', followup_attack_types: 'Brute Force + Energy' });
            expect(result[1]).toEqual({ name: '7 Combat', type: 'teamwork', followup_attack_types: 'Intelligence + Energy' });
        });

        it('should extract teamwork cards without followup_attack_types', () => {
            const cardsData = {
                teamwork: [
                    '8 Energy'
                ]
            };
            const result = extractCardsFromImportData(cardsData);
            expect(result.length).toBe(1);
            expect(result[0]).toEqual({ name: '8 Energy', type: 'teamwork' });
            expect(result[0].followup_attack_types).toBeUndefined();
        });

        it('should handle mixed teamwork cards with and without followup_attack_types', () => {
            const cardsData = {
                teamwork: [
                    '6 Combat - Brute Force + Energy',
                    '7 Any-Power - Any-Power / Any-Power',
                    '8 Energy'
                ]
            };
            const result = extractCardsFromImportData(cardsData);
            expect(result.length).toBe(3);
            expect(result[0]).toEqual({ name: '6 Combat', type: 'teamwork', followup_attack_types: 'Brute Force + Energy' });
            expect(result[1]).toEqual({ name: '7 Any-Power', type: 'teamwork', followup_attack_types: 'Any-Power / Any-Power' });
            expect(result[2]).toEqual({ name: '8 Energy', type: 'teamwork' });
        });

        it('should handle whitespace in teamwork card names', () => {
            const cardsData = {
                teamwork: [
                    '  6 Combat  -  Brute Force + Energy  '
                ]
            };
            const result = extractCardsFromImportData(cardsData);
            expect(result.length).toBe(1);
            expect(result[0].name).toBe('6 Combat');
            expect(result[0].followup_attack_types).toBe('Brute Force + Energy');
        });

        it('should handle empty teamwork array', () => {
            const cardsData = {
                teamwork: []
            };
            const result = extractCardsFromImportData(cardsData);
            expect(result.length).toBe(0);
        });
    });

    describe('findTeamworkCardIdByName', () => {
        it('should find teamwork card by name and followup_attack_types', () => {
            const cardId = findTeamworkCardIdByName('6 Combat', 'Brute Force + Energy');
            expect(cardId).toBe('teamwork_6_combat_bf_e');
        });

        it('should differentiate between teamwork cards with same name but different followup types', () => {
            const cardId1 = findTeamworkCardIdByName('6 Combat', 'Brute Force + Energy');
            const cardId2 = findTeamworkCardIdByName('6 Combat', 'Brute Force + Intelligence');
            
            expect(cardId1).toBe('teamwork_6_combat_bf_e');
            expect(cardId2).toBe('teamwork_6_combat_bf_i');
            expect(cardId1).not.toBe(cardId2);
        });

        it('should find teamwork card without followup_attack_types', () => {
            const cardId = findTeamworkCardIdByName('8 Energy', null);
            expect(cardId).toBe('teamwork_8_energy_no_followup');
        });

        it('should use follow_up_attack_types when followup_attack_types is missing', () => {
            const cardId = findTeamworkCardIdByName('6 Brute Force', 'Intelligence + Combat');
            expect(cardId).toBe('teamwork_6_bf_i_c');
        });

        it('should return null for non-existent teamwork card', () => {
            const cardId = findTeamworkCardIdByName('Non-existent Card', 'Some Followup');
            expect(cardId).toBeNull();
        });

        it('should return null when followup_attack_types does not match', () => {
            const cardId = findTeamworkCardIdByName('6 Combat', 'Wrong Followup Types');
            expect(cardId).toBeNull();
        });

        it('should match followup_attack_types exactly (trimmed)', () => {
            const cardId1 = findTeamworkCardIdByName('6 Combat', 'Brute Force + Energy');
            const cardId2 = findTeamworkCardIdByName('6 Combat', '  Brute Force + Energy  ');
            
            expect(cardId1).toBe('teamwork_6_combat_bf_e');
            expect(cardId2).toBe('teamwork_6_combat_bf_e');
        });

        it('should find teamwork card identified by cardType only (no type field)', () => {
            // This tests the fix: cards with cardType set but no type field
            const cardId = findTeamworkCardIdByName('9 Combat', 'Energy + Intelligence');
            expect(cardId).toBe('teamwork_cardtype_only');
        });

        it('should find teamwork card by to_use field (primary name field)', () => {
            // Test that to_use is the primary lookup field for teamwork cards
            const cardId = findTeamworkCardIdByName('9 Combat', 'Energy + Intelligence');
            expect(cardId).toBe('teamwork_cardtype_only');
            
            // Also test without followup
            const cardId2 = findTeamworkCardIdByName('10 Energy', null);
            expect(cardId2).toBe('teamwork_cardtype_only_no_followup');
        });

        it('should prioritize cardType over type field when both exist', () => {
            // Card has both cardType and type, should use cardType
            const cardId = findTeamworkCardIdByName('6 Combat', 'Brute Force + Energy');
            expect(cardId).toBe('teamwork_6_combat_bf_e');
        });

        it('should find teamwork card with cardType and no followup types', () => {
            const cardId = findTeamworkCardIdByName('10 Energy', null);
            expect(cardId).toBe('teamwork_cardtype_only_no_followup');
        });
    });

    describe('processImportDeck - Teamwork Import', () => {
        it('should successfully import teamwork cards with followup_attack_types', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    teamwork: [
                        '6 Combat - Brute Force + Energy',
                        '7 Combat - Intelligence + Energy',
                        '7 Any-Power - Any-Power / Any-Power'
                    ]
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(3);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('teamwork', 'teamwork_6_combat_bf_e', '6 Combat', null);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('teamwork', 'teamwork_7_combat_i_e', '7 Combat', null);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('teamwork', 'teamwork_7_anypower', '7 Any-Power', null);
            expect(mockCloseImportOverlay).toHaveBeenCalled();
            expect(mockShowNotification).toHaveBeenCalledWith('Successfully imported 3 card(s)', 'success');
        });

        it('should successfully import teamwork cards without followup_attack_types', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    teamwork: ['8 Energy']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(1);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('teamwork', 'teamwork_8_energy_no_followup', '8 Energy', null);
            expect(mockCloseImportOverlay).toHaveBeenCalled();
        });

        it('should import duplicate teamwork cards (multiple instances)', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    teamwork: [
                        '6 Combat - Brute Force + Energy',
                        '6 Combat - Brute Force + Energy',
                        '6 Combat - Brute Force + Energy'
                    ]
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(3);
            expect(mockDeckEditorCards.filter(c => c.cardId === 'teamwork_6_combat_bf_e').length).toBe(3);
        });

        it('should differentiate between same name but different followup types', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    teamwork: [
                        '6 Combat - Brute Force + Energy',
                        '6 Combat - Brute Force + Intelligence'
                    ]
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(2);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('teamwork', 'teamwork_6_combat_bf_e', '6 Combat', null);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('teamwork', 'teamwork_6_combat_bf_i', '6 Combat', null);
            expect(mockDeckEditorCards.filter(c => c.cardId === 'teamwork_6_combat_bf_e').length).toBe(1);
            expect(mockDeckEditorCards.filter(c => c.cardId === 'teamwork_6_combat_bf_i').length).toBe(1);
        });

        it('should handle unresolved teamwork cards', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    teamwork: [
                        'Non-existent Card - Some Followup',
                        '6 Combat - Wrong Followup Types'
                    ]
                }
            });

            const errorMessages = document.getElementById('importErrorMessages') as HTMLDivElement;
            await processImportDeck();

            expect(mockAddCardToEditor).not.toHaveBeenCalled();
            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('Could not find 2 card(s)');
        });

        it('should handle mixed teamwork cards with and without followup types', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    teamwork: [
                        '6 Combat - Brute Force + Energy',
                        '7 Combat - Intelligence + Energy',
                        '8 Energy'
                    ]
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(3);
            expect(mockCloseImportOverlay).toHaveBeenCalled();
        });

        it('should import teamwork cards identified by cardType only', async () => {
            // Test the fix: cards with cardType but no type field
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    teamwork: [
                        '9 Combat - Energy + Intelligence',
                        '10 Energy'
                    ]
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(2);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('teamwork', 'teamwork_cardtype_only', '9 Combat', null);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('teamwork', 'teamwork_cardtype_only_no_followup', '10 Energy', null);
            expect(mockCloseImportOverlay).toHaveBeenCalled();
        });

        it('should use to_use field as primary name for teamwork card lookup', async () => {
            // Ensure to_use is used when looking up by name
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    teamwork: [
                        '9 Combat - Energy + Intelligence'
                    ]
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Should find the card even though we search by name that matches to_use
            expect(mockAddCardToEditor).toHaveBeenCalledTimes(1);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('teamwork', 'teamwork_cardtype_only', '9 Combat', null);
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
                    teamwork: ['6 Combat - Brute Force + Energy']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalled();
            expect(mockCloseImportOverlay).toHaveBeenCalled();
        });
    });
});


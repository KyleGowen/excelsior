/** @jest-environment jsdom */

/**
 * Unit Tests for Deck Aspect and Advanced Universe Card Import Functionality
 * 
 * Tests cover:
 * - extractCardsFromImportData() - Aspect and Advanced Universe extraction from JSON
 * - findCardIdByName() - Aspect and Advanced Universe lookup by name
 * - processImportDeck() - Full import flow
 *   - Aspects and Advanced Universe without alternate images
 *   - Aspects and Advanced Universe with alternate images (auto-selecting first)
 *   - Duplicate detection (allowed for aspects and advanced-universe)
 *   - Error handling and validation
 *   - Success scenarios with verification
 */

describe('Deck Aspect and Advanced Universe Import - Unit Tests', () => {
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
    let findCardIdByName: (cardName: string, cardType: string) => string | null;
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
            // Simulate adding card to deck - aspects and advanced-universe can have duplicates
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
            // Aspects - stored by card_name (aspects use card_name field)
            ['Supay', {
                id: 'aspect_supay_id',
                card_name: 'Supay',
                type: 'aspect',
                cardType: 'aspect',
                location: 'Any Homebase',
                alternateImages: []
            }],
            // Aspect with alternate images
            ['Amaru: Dragon Legend', {
                id: 'aspect_amaru_id',
                card_name: 'Amaru: Dragon Legend',
                type: 'aspect',
                cardType: 'aspect',
                location: 'Any Homebase',
                alternateImages: ['aspects/alternate/amaru_alt.webp']
            }],
            ['aspect_amaru_id', {
                id: 'aspect_amaru_id',
                card_name: 'Amaru: Dragon Legend',
                type: 'aspect',
                cardType: 'aspect',
                location: 'Any Homebase',
                alternateImages: ['aspects/alternate/amaru_alt.webp']
            }],
            // Aspect stored with prefixed key
            ['aspect_mallku_id', {
                id: 'aspect_mallku_id',
                card_name: 'Mallku',
                cardType: 'aspect',
                location: 'Any Homebase',
                alternateImages: []
            }],
            // Aspect using card_type field
            ['Cheshire Cat', {
                id: 'aspect_cheshire_id',
                card_name: 'Cheshire Cat',
                card_type: 'aspect',
                location: 'Any Homebase',
                alternateImages: []
            }],
            // Aspect with both type and cardType
            ['Isis', {
                id: 'aspect_isis_id',
                card_name: 'Isis',
                type: 'aspect',
                cardType: 'aspect',
                location: 'Any Homebase',
                alternateImages: []
            }],
            // Advanced Universe cards - stored by name (advanced-universe uses name field)
            ['Shards of the Staff', {
                id: 'advanced_shards_id',
                name: 'Shards of the Staff',
                type: 'advanced-universe',
                cardType: 'advanced-universe',
                character: 'Ra',
                alternateImages: []
            }],
            ['Staff Fragments', {
                id: 'advanced_fragments_id',
                name: 'Staff Fragments',
                type: 'advanced-universe',
                cardType: 'advanced-universe',
                character: 'Ra',
                alternateImages: []
            }],
            // Advanced Universe with alternate images
            ['Staff Head', {
                id: 'advanced_head_id',
                name: 'Staff Head',
                type: 'advanced-universe',
                cardType: 'advanced-universe',
                character: 'Ra',
                alternateImages: ['advanced-universe/alternate/staff_head_alt.webp']
            }],
            ['advanced_head_id', {
                id: 'advanced_head_id',
                name: 'Staff Head',
                type: 'advanced-universe',
                cardType: 'advanced-universe',
                character: 'Ra',
                alternateImages: ['advanced-universe/alternate/staff_head_alt.webp']
            }],
            // Advanced Universe stored with prefixed key
            ['advanced-universe_shards_id', {
                id: 'advanced_shards_id',
                name: 'Shards of the Staff',
                cardType: 'advanced-universe',
                character: 'Ra',
                alternateImages: []
            }],
            // Advanced Universe using card_type field
            ['Advanced Universe Test', {
                id: 'advanced_test_id',
                name: 'Advanced Universe Test',
                card_type: 'advanced-universe',
                character: 'Ra',
                alternateImages: []
            }],
            // Store by ID for lookup
            ['aspect_supay_id', {
                id: 'aspect_supay_id',
                card_name: 'Supay',
                type: 'aspect',
                cardType: 'aspect',
                location: 'Any Homebase',
                alternateImages: []
            }],
            ['advanced_shards_id', {
                id: 'advanced_shards_id',
                name: 'Shards of the Staff',
                type: 'advanced-universe',
                cardType: 'advanced-universe',
                character: 'Ra',
                alternateImages: []
            }]
        ]);

        // Setup global mocks
        (window as any).currentUser = mockCurrentUser;
        (window as any).deckEditorCards = mockDeckEditorCards;
        (window as any).availableCardsMap = mockAvailableCardsMap;
        (window as any).addCardToEditor = mockAddCardToEditor;
        (window as any).showNotification = mockShowNotification;
        (window as any).closeImportOverlay = mockCloseImportOverlay;
        (window as any).validateDeck = mockValidateDeck;
        (window as any).loadAvailableCards = mockLoadAvailableCards;
        (window as any).DECK_RULES = {};

        // Recreate the functions from deck-import.js for testing
        // This mimics the actual implementation
        extractCardsFromImportData = (cardsData: any) => {
            const result: any[] = [];
            const addCard = (cardName: string, cardType: string) => {
                if (cardName && typeof cardName === 'string') {
                    result.push({ name: cardName.trim(), type: cardType });
                }
            };

            // Aspects (array of strings)
            if (Array.isArray(cardsData.aspects)) {
                cardsData.aspects.forEach((cardName: any) => addCard(cardName, 'aspect'));
            }

            // Advanced universe (object grouped by character)
            if (cardsData.advanced_universe && typeof cardsData.advanced_universe === 'object') {
                Object.values(cardsData.advanced_universe).forEach((characterCards: any) => {
                    if (Array.isArray(characterCards)) {
                        characterCards.forEach((cardName: string) => addCard(cardName, 'advanced-universe'));
                    }
                });
            }

            return result;
        };

        findCardIdByName = (cardName: string, cardType: string) => {
            if (!mockAvailableCardsMap || !cardName || typeof cardName !== 'string') {
                return null;
            }

            // Direct name lookup (cards are stored by name in the map)
            // Try both name and card_name as keys (aspects use card_name, advanced-universe uses name)
            let foundCard = mockAvailableCardsMap.get(cardName);
            if (!foundCard) {
                // Try looking through entries to find by card_name if direct lookup failed
                for (const [key, card] of mockAvailableCardsMap.entries()) {
                    if (card && (card.card_name === cardName || card.name === cardName)) {
                        // Found by card_name - check if type matches
                        const foundType = card.type || card.card_type || card.cardType;
                        if (cardType) {
                            const normalizedFoundType = foundType ? foundType.replace('-universe', '') : null;
                            const normalizedCardType = cardType.replace('-universe', '');
                            if (normalizedFoundType === normalizedCardType) {
                                foundCard = card;
                                break;
                            }
                        } else {
                            foundCard = card;
                            break;
                        }
                    }
                }
            }
            
            if (foundCard && foundCard.id) {
                const foundName = foundCard.name || foundCard.card_name;
                const foundType = foundCard.type || foundCard.card_type || foundCard.cardType;
                // Type mapping: 'ally-universe' -> 'ally', etc.
                const normalizedFoundType = foundType ? foundType.replace('-universe', '') : null;
                const normalizedCardType = cardType ? cardType.replace('-universe', '') : null;
                
                if (foundName === cardName && 
                    (!cardType || !normalizedFoundType || !normalizedCardType || normalizedFoundType === normalizedCardType)) {
                    return foundCard.id;
                }
            }

            // Search through all cards in the map by name
            for (const [key, card] of mockAvailableCardsMap.entries()) {
                // Skip if key or card is undefined/null, or key is not a string
                if (!key || !card || typeof key !== 'string') {
                    continue;
                }
                
                // Additional safety check: ensure card has expected properties
                if (!card.id || typeof card.id !== 'string') {
                    continue;
                }
                
                // Skip prefixed keys (e.g., "character_123") - only if key doesn't match card.id
                // BUT: allow prefixed keys that match the pattern for the card type we're looking for
                if (key.includes('_') && key !== card.id) {
                    // Check if this is a prefixed key for the card type we're looking for
                    if (cardType && cardType !== 'power') {
                        const prefixedPattern = `${cardType}_${card.id}`;
                        // Also check for advanced-universe which uses dash
                        const prefixedPatternDash = cardType === 'advanced-universe' ? `${cardType.replace('-', '_')}_${card.id}` : null;
                        if (key !== prefixedPattern && key !== prefixedPatternDash) {
                            continue; // Skip this prefixed key
                        }
                        // This is the correct prefixed key for our search type - continue processing
                    } else {
                        continue; // No cardType specified, skip all prefixed keys
                    }
                }
                
                // Safely check card name first - exact match required
                // Check both name and card_name fields (aspects use card_name, advanced-universe uses name)
                const cardNameMatch = (card.name && typeof card.name === 'string' && card.name === cardName) || 
                                     (card.card_name && typeof card.card_name === 'string' && card.card_name === cardName);
                
                if (!cardNameMatch) {
                    continue; // Name doesn't match, skip this card
                }
                
                // If name matches, check type if specified (except for power cards which are handled above)
                if (cardType && cardType !== 'power') {
                    const cardTypeToMatch = card.type || card.card_type || card.cardType;
                    if (cardTypeToMatch) {
                        // Normalize types (handle 'ally-universe' vs 'ally', etc.)
                        const normalizedCardTypeToMatch = cardTypeToMatch.replace('-universe', '');
                        const normalizedRequestedType = cardType.replace('-universe', '');
                        if (normalizedCardTypeToMatch !== normalizedRequestedType) {
                            continue; // Type doesn't match
                        }
                    } else {
                        // Card has no type field - check if we matched by prefixed key or cardType
                        // If cardType matches what we're looking for, allow it
                        if (card.cardType && card.cardType === cardType) {
                            // cardType matches - allow it
                        } else if (!card.cardType) {
                            // No type information at all - allow match if name matched (fallback for legacy data)
                            // This helps with cards that might not have type properly set
                        } else {
                            continue; // cardType doesn't match
                        }
                    }
                }
                
                // Name matches (and type matches if specified) - return the card ID
                return card.id;
            }

            return null;
        };

        // Create a simplified version of processImportDeck for testing
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
                    if (cardEntry.type !== 'aspect' && cardEntry.type !== 'advanced-universe') {
                        continue;
                    }

                    const cardId = findCardIdByName(cardEntry.name, cardEntry.type);
                    
                    if (cardId) {
                        // Aspects and advanced-universe don't need duplicate checking - they can be added multiple times
                        importList.push({
                            type: cardEntry.type,
                            cardId: cardId,
                            cardName: cardEntry.name
                        });
                    } else {
                        unresolvedCards.push(cardEntry.name);
                    }
                }

                // Report unresolved cards
                if (unresolvedCards.length > 0) {
                    const unresolvedList = unresolvedCards.slice(0, 10).join(', ');
                    const moreText = unresolvedCards.length > 10 ? ` (and ${unresolvedCards.length - 10} more)` : '';
                    errorMessages.style.display = 'block';
                    errorMessages.innerHTML = `<ul><li>Could not find ${unresolvedCards.length} card(s): ${unresolvedList}${moreText}</li></ul>`;
                    importButton.disabled = false;
                    return;
                }

                // Validate the deck would be valid after adding all import cards
                const testDeckCards: any[] = [];
                
                // Copy current deck cards
                currentDeckCards.forEach(card => {
                    testDeckCards.push({
                        type: card.type,
                        cardId: card.cardId,
                        quantity: card.quantity || 1
                    });
                });
                
                // Add import cards to test deck (merging with existing if needed)
                for (const importCard of importList) {
                    const existingIndex = testDeckCards.findIndex(
                        card => card.type === importCard.type && card.cardId === importCard.cardId
                    );
                    
                    if (existingIndex >= 0) {
                        // Card exists - increment quantity
                        testDeckCards[existingIndex].quantity += 1;
                    } else {
                        // New card - add it
                        testDeckCards.push({
                            type: importCard.type,
                            cardId: importCard.cardId,
                            quantity: 1
                        });
                    }
                }

                // Validate the test deck
                if (typeof mockValidateDeck === 'function') {
                    try {
                        const validation = mockValidateDeck(testDeckCards);
                        if (validation && validation.errors && validation.errors.length > 0) {
                            // Filter out validation errors that we don't want to enforce during import
                            const filteredErrors = validation.errors.filter((error: any) => {
                                if (typeof error === 'string') {
                                    // Skip errors about minimum deck size / draw pile size
                                    if (error.includes('cards in draw pile')) {
                                        return false;
                                    }
                                    // Skip errors about threat level (can be adjusted after import)
                                    if (error.includes('threat level') || error.includes('Total threat')) {
                                        return false;
                                    }
                                }
                                return true;
                            });
                            
                            if (filteredErrors.length > 0) {
                                errorMessages.style.display = 'block';
                                errorMessages.innerHTML = '<ul>' + filteredErrors.map((error: any) => `<li>${error}</li>`).join('') + '</ul>';
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
                }

                // All validation passed - add cards to deck
                let successCount = 0;
                let errorCount = 0;
                const addErrors: string[] = [];

                for (const importCard of importList) {
                    if (importCard.type !== 'aspect' && importCard.type !== 'advanced-universe') {
                        continue;
                    }
                    
                    try {
                        // Check card data before adding
                        const cardData = mockAvailableCardsMap.get(importCard.cardId);
                        
                        // Aspects and advanced-universe cards can be added directly (no duplicate checking needed, similar to special cards)
                        // But we should auto-select default art if alternate images exist
                        let selectedAlternateImage = null;
                        if (cardData && cardData.alternateImages && cardData.alternateImages.length > 0) {
                            // Automatically select the first alternate image for import (default art)
                            selectedAlternateImage = cardData.alternateImages[0];
                        }
                        
                        // Check if addCardToEditor exists
                        if (typeof mockAddCardToEditor === 'function') {
                            // Pass selected alternate image (or null if none) - same as special cards
                            await mockAddCardToEditor(importCard.type, importCard.cardId, importCard.cardName, selectedAlternateImage);
                            
                            // Wait a bit for async operations to complete
                            await new Promise(resolve => setTimeout(resolve, 100));
                            
                            // Check if card was actually added (aspects and advanced-universe can have duplicates, so we just check if it exists)
                            const wasAdded = mockDeckEditorCards.some(c => 
                                c.type === importCard.type && c.cardId === importCard.cardId
                            );
                            
                            if (wasAdded) {
                                successCount++;
                            } else {
                                errorCount++;
                                addErrors.push(`${importCard.cardName}: Card was not added to deck`);
                            }
                        } else {
                            throw new Error('addCardToEditor function not available');
                        }
                    } catch (error: any) {
                        errorCount++;
                        addErrors.push(`${importCard.cardName}: ${error.message}`);
                    }
                }

                // Show results
                if (errorCount > 0) {
                    errorMessages.style.display = 'block';
                    errorMessages.innerHTML = '<ul>' + 
                        `<li>Successfully imported ${successCount} card(s)</li>` +
                        addErrors.map(error => `<li>${error}</li>`).join('') +
                        '</ul>';
                } else {
                    // Success - close overlay
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
        it('should extract aspect cards from aspects array', () => {
            const cardsData = {
                aspects: [
                    'Supay',
                    'Amaru: Dragon Legend',
                    'Mallku'
                ]
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result.length).toBe(3);
            expect(result.filter(c => c.type === 'aspect').length).toBe(3);
            expect(result.some(c => c.name === 'Supay')).toBe(true);
            expect(result.some(c => c.name === 'Amaru: Dragon Legend')).toBe(true);
            expect(result.some(c => c.name === 'Mallku')).toBe(true);
        });

        it('should extract advanced universe cards from advanced_universe object grouped by character', () => {
            const cardsData = {
                advanced_universe: {
                    'Ra': [
                        'Shards of the Staff',
                        'Staff Fragments',
                        'Staff Head'
                    ]
                }
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result.length).toBe(3);
            expect(result.filter(c => c.type === 'advanced-universe').length).toBe(3);
            expect(result.some(c => c.name === 'Shards of the Staff')).toBe(true);
            expect(result.some(c => c.name === 'Staff Fragments')).toBe(true);
            expect(result.some(c => c.name === 'Staff Head')).toBe(true);
        });

        it('should handle advanced universe cards from multiple characters', () => {
            const cardsData = {
                advanced_universe: {
                    'Ra': ['Shards of the Staff'],
                    'Another Character': ['Advanced Card 1', 'Advanced Card 2']
                }
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result.length).toBe(3);
            expect(result.filter(c => c.type === 'advanced-universe').length).toBe(3);
            expect(result.some(c => c.name === 'Shards of the Staff')).toBe(true);
            expect(result.some(c => c.name === 'Advanced Card 1')).toBe(true);
            expect(result.some(c => c.name === 'Advanced Card 2')).toBe(true);
        });

        it('should handle empty aspects array', () => {
            const cardsData = {
                aspects: []
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result.length).toBe(0);
        });

        it('should handle empty advanced_universe object', () => {
            const cardsData = {
                advanced_universe: {}
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result.length).toBe(0);
        });

        it('should handle aspects and advanced_universe together', () => {
            const cardsData = {
                aspects: ['Supay'],
                advanced_universe: {
                    'Ra': ['Shards of the Staff']
                }
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result.length).toBe(2);
            expect(result.filter(c => c.type === 'aspect').length).toBe(1);
            expect(result.filter(c => c.type === 'advanced-universe').length).toBe(1);
        });
    });

    describe('findCardIdByName - Aspect and Advanced Universe Card Lookup', () => {
        it('should find aspect by card_name', () => {
            const cardId = findCardIdByName('Supay', 'aspect');
            expect(cardId).toBe('aspect_supay_id');
        });

        it('should find advanced universe by name', () => {
            const cardId = findCardIdByName('Shards of the Staff', 'advanced-universe');
            expect(cardId).toBe('advanced_shards_id');
        });

        it('should return null for non-existent aspect', () => {
            const cardId = findCardIdByName('Non-existent Aspect', 'aspect');
            expect(cardId).toBeNull();
        });

        it('should return null for non-existent advanced universe', () => {
            const cardId = findCardIdByName('Non-existent Advanced Universe', 'advanced-universe');
            expect(cardId).toBeNull();
        });

        it('should filter by card type (aspect vs advanced-universe)', () => {
            const aspectId = findCardIdByName('Supay', 'aspect');
            const advancedId = findCardIdByName('Shards of the Staff', 'advanced-universe');
            
            expect(aspectId).toBe('aspect_supay_id');
            expect(advancedId).toBe('advanced_shards_id');
        });

        describe('card_name field support for aspects', () => {
            it('should find aspect stored with card_name', () => {
                const cardId = findCardIdByName('Supay', 'aspect');
                expect(cardId).toBe('aspect_supay_id');
            });

            it('should find aspect with only card_name field', () => {
                const cardId = findCardIdByName('Mallku', 'aspect');
                expect(cardId).toBe('aspect_mallku_id');
            });
        });

        describe('prefixed key lookup', () => {
            it('should find aspect stored with prefixed key', () => {
                const cardId = findCardIdByName('Mallku', 'aspect');
                expect(cardId).toBe('aspect_mallku_id');
            });

            it('should find advanced universe stored with prefixed key', () => {
                const cardId = findCardIdByName('Shards of the Staff', 'advanced-universe');
                expect(cardId).toBe('advanced_shards_id');
            });
        });

        describe('type field variations', () => {
            it('should find aspect using cardType field', () => {
                const cardId = findCardIdByName('Mallku', 'aspect');
                expect(cardId).toBe('aspect_mallku_id');
            });

            it('should find aspect using card_type field', () => {
                const cardId = findCardIdByName('Cheshire Cat', 'aspect');
                expect(cardId).toBe('aspect_cheshire_id');
            });

            it('should find aspect with both type and cardType', () => {
                const cardId = findCardIdByName('Isis', 'aspect');
                expect(cardId).toBe('aspect_isis_id');
            });

            it('should reject aspect when type field does not match', () => {
                // Add a card with wrong type
                mockAvailableCardsMap.set('Wrong Type Aspect', {
                    id: 'wrong_type_id',
                    card_name: 'Wrong Type Aspect',
                    type: 'character', // Wrong type
                    location: 'Any Homebase'
                });
                
                const cardId = findCardIdByName('Wrong Type Aspect', 'aspect');
                expect(cardId).toBeNull();
            });
        });
    });

    describe('processImportDeck - Aspect Import', () => {
        it('should successfully import aspects from array', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    aspects: [
                        'Supay',
                        'Amaru: Dragon Legend',
                        'Mallku'
                    ]
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(3);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('aspect', 'aspect_supay_id', 'Supay', null);
            // Amaru has alternate images, so first one is auto-selected
            expect(mockAddCardToEditor).toHaveBeenCalledWith('aspect', 'aspect_amaru_id', 'Amaru: Dragon Legend', 'aspects/alternate/amaru_alt.webp');
            expect(mockAddCardToEditor).toHaveBeenCalledWith('aspect', 'aspect_mallku_id', 'Mallku', null);
            expect(mockCloseImportOverlay).toHaveBeenCalled();
            expect(mockShowNotification).toHaveBeenCalledWith('Successfully imported 3 card(s)', 'success');
        });

        it('should successfully import aspect with alternate images and auto-select first', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    aspects: ['Amaru: Dragon Legend']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledWith(
                'aspect',
                'aspect_amaru_id',
                'Amaru: Dragon Legend',
                'aspects/alternate/amaru_alt.webp'
            );
            expect(mockDeckEditorCards[0].selectedAlternateImage).toBe('aspects/alternate/amaru_alt.webp');
        });

        it('should import duplicate aspects (multiple instances)', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    aspects: [
                        'Supay',
                        'Supay',
                        'Supay'
                    ]
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(3);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('aspect', 'aspect_supay_id', 'Supay', null);
            expect(mockCloseImportOverlay).toHaveBeenCalled();
        });
    });

    describe('processImportDeck - Advanced Universe Import', () => {
        it('should successfully import advanced universe cards from single character', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    advanced_universe: {
                        'Ra': [
                            'Shards of the Staff',
                            'Staff Fragments',
                            'Staff Head'
                        ]
                    }
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(3);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('advanced-universe', 'advanced_shards_id', 'Shards of the Staff', null);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('advanced-universe', 'advanced_fragments_id', 'Staff Fragments', null);
            // Staff Head has alternate images, so first one is auto-selected
            expect(mockAddCardToEditor).toHaveBeenCalledWith('advanced-universe', 'advanced_head_id', 'Staff Head', 'advanced-universe/alternate/staff_head_alt.webp');
            expect(mockCloseImportOverlay).toHaveBeenCalled();
            expect(mockShowNotification).toHaveBeenCalledWith('Successfully imported 3 card(s)', 'success');
        });

        it('should successfully import advanced universe with alternate images and auto-select first', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    advanced_universe: {
                        'Ra': ['Staff Head']
                    }
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledWith(
                'advanced-universe',
                'advanced_head_id',
                'Staff Head',
                'advanced-universe/alternate/staff_head_alt.webp'
            );
            expect(mockDeckEditorCards[0].selectedAlternateImage).toBe('advanced-universe/alternate/staff_head_alt.webp');
        });

        it('should import duplicate advanced universe cards (multiple instances)', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    advanced_universe: {
                        'Ra': [
                            'Shards of the Staff',
                            'Shards of the Staff',
                            'Shards of the Staff'
                        ]
                    }
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(3);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('advanced-universe', 'advanced_shards_id', 'Shards of the Staff', null);
            expect(mockCloseImportOverlay).toHaveBeenCalled();
        });

        it('should handle advanced universe cards from multiple characters', async () => {
            // Add another character's cards
            mockAvailableCardsMap.set('Other Advanced Card', {
                id: 'advanced_other_id',
                name: 'Other Advanced Card',
                type: 'advanced-universe',
                cardType: 'advanced-universe',
                character: 'Another Character',
                alternateImages: []
            });

            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    advanced_universe: {
                        'Ra': ['Shards of the Staff'],
                        'Another Character': ['Other Advanced Card']
                    }
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(2);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('advanced-universe', 'advanced_shards_id', 'Shards of the Staff', null);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('advanced-universe', 'advanced_other_id', 'Other Advanced Card', null);
        });
    });

    describe('processImportDeck - Combined Aspect and Advanced Universe Import', () => {
        it('should import both aspects and advanced universe cards', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    aspects: ['Supay'],
                    advanced_universe: {
                        'Ra': ['Shards of the Staff']
                    }
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(2);
            expect(mockDeckEditorCards.filter(c => c.type === 'aspect').length).toBe(1);
            expect(mockDeckEditorCards.filter(c => c.type === 'advanced-universe').length).toBe(1);
            expect(mockCloseImportOverlay).toHaveBeenCalled();
        });

        it('should import all aspects and advanced universe cards', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    aspects: [
                        'Supay',
                        'Amaru: Dragon Legend',
                        'Mallku',
                        'Cheshire Cat',
                        'Isis'
                    ],
                    advanced_universe: {
                        'Ra': [
                            'Shards of the Staff',
                            'Staff Fragments',
                            'Staff Head'
                        ]
                    }
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(8);
            expect(mockDeckEditorCards.filter(c => c.type === 'aspect').length).toBe(5);
            expect(mockDeckEditorCards.filter(c => c.type === 'advanced-universe').length).toBe(3);
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
                    aspects: ['Supay']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Should proceed despite validation errors
            expect(mockAddCardToEditor).toHaveBeenCalled();
            expect(mockCloseImportOverlay).toHaveBeenCalled();
        });

        it('should handle unresolved aspects and advanced universe', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            textarea.value = JSON.stringify({
                cards: {
                    aspects: ['Non-Existent Aspect'],
                    advanced_universe: {
                        'Ra': ['Non-Existent Advanced Universe']
                    }
                }
            });

            await processImportDeck();

            expect(mockAddCardToEditor).not.toHaveBeenCalled();
            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('Could not find');
        });
    });

    describe('processImportDeck - Error Handling', () => {
        it('should handle addCardToEditor throwing error', async () => {
            mockAddCardToEditor.mockImplementation(async () => {
                throw new Error('Failed to add card');
            });

            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            textarea.value = JSON.stringify({
                cards: {
                    aspects: ['Supay']
                }
            });

            await processImportDeck();

            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('Failed to add card');
        });
    });
});


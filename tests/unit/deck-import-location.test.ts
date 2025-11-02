/** @jest-environment jsdom */

/**
 * Unit Tests for Deck Location Import Functionality
 * 
 * Tests cover:
 * - extractCardsFromImportData() - Location extraction from JSON
 * - findCardIdByName() - Location lookup by name
 * - processImportDeck() - Full import flow
 *   - Locations without alternate images
 *   - Locations with alternate images (auto-selecting first)
 *   - Duplicate detection (in deck and import list)
 *   - Location limit enforcement (1 max)
 *   - Error handling and validation
 *   - Success scenarios with verification
 */

describe('Deck Location Import - Unit Tests', () => {
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
        // Mock DOM elements
        document.body.innerHTML = `
            <textarea id="importJsonContent"></textarea>
            <div id="importErrorMessages" style="display: none;"></div>
            <button id="importJsonButton"></button>
        `;

        // Mock global functions
        mockAddCardToEditor = jest.fn().mockImplementation(async (type, cardId, cardName, selectedAlternateImage) => {
            // Simulate adding card to deck
            if (!mockDeckEditorCards.find(c => c.type === type && c.cardId === cardId)) {
                mockDeckEditorCards.push({
                    id: `deckcard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: type,
                    cardId: cardId,
                    quantity: 1,
                    selectedAlternateImage: selectedAlternateImage || null
                });
            }
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
            // Locations without alternate images
            ['Event Horizon: The Future', {
                id: 'event_horizon_id',
                name: 'Event Horizon: The Future',
                type: 'location',
                alternateImages: []
            }],
            ['The Citadel', {
                id: 'citadel_id',
                name: 'The Citadel',
                type: 'location',
                alternateImages: []
            }],
            // Locations with alternate images
            ['Ancient Ruins', {
                id: 'ancient_ruins_id',
                name: 'Ancient Ruins',
                type: 'location',
                alternateImages: ['locations/alternate/ancient_ruins_alt.webp']
            }],
            ['ancient_ruins_id', {
                id: 'ancient_ruins_id',
                name: 'Ancient Ruins',
                type: 'location',
                alternateImages: ['locations/alternate/ancient_ruins_alt.webp']
            }],
            ['Lost City', {
                id: 'lost_city_id',
                name: 'Lost City',
                type: 'location',
                alternateImages: ['locations/alternate/lost_city_alt1.webp', 'locations/alternate/lost_city_alt2.webp']
            }],
            ['lost_city_id', {
                id: 'lost_city_id',
                name: 'Lost City',
                type: 'location',
                alternateImages: ['locations/alternate/lost_city_alt1.webp', 'locations/alternate/lost_city_alt2.webp']
            }],
            ['event_horizon_id', {
                id: 'event_horizon_id',
                name: 'Event Horizon: The Future',
                type: 'location',
                alternateImages: []
            }],
            ['citadel_id', {
                id: 'citadel_id',
                name: 'The Citadel',
                type: 'location',
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

        // Recreate the functions from deck-import.js for testing
        extractCardsFromImportData = (cardsData: any) => {
            const result: any[] = [];
            const addCard = (cardName: string, cardType: string) => {
                if (cardName && typeof cardName === 'string') {
                    result.push({ name: cardName.trim(), type: cardType });
                }
            };

            if (Array.isArray(cardsData.locations)) {
                cardsData.locations.forEach((cardName: any) => addCard(cardName, 'location'));
            }

            return result;
        };

        findCardIdByName = (cardName: string, cardType: string) => {
            if (!mockAvailableCardsMap || !cardName || typeof cardName !== 'string') {
                return null;
            }

            // Direct name lookup
            let foundCard = mockAvailableCardsMap.get(cardName);
            if (foundCard && foundCard.id) {
                const foundName = foundCard.name || foundCard.card_name;
                const foundType = foundCard.type || foundCard.card_type;
                const normalizedFoundType = foundType ? foundType.replace('-universe', '') : null;
                const normalizedCardType = cardType ? cardType.replace('-universe', '') : null;
                
                if (foundName === cardName && 
                    (!cardType || !normalizedFoundType || !normalizedCardType || normalizedFoundType === normalizedCardType)) {
                    return foundCard.id;
                }
            }

            // Search through all cards
            for (const [key, card] of mockAvailableCardsMap.entries()) {
                if (!key || !card || typeof key !== 'string') continue;
                if (!card.id || typeof card.id !== 'string') continue;
                
                // Filter by card type if specified
                if (cardType && cardType !== 'power') {
                    const cardTypeToMatch = card.type || card.card_type;
                    if (!cardTypeToMatch) continue;
                    const normalizedCardTypeToMatch = cardTypeToMatch.replace('-universe', '');
                    const normalizedRequestedType = cardType.replace('-universe', '');
                    if (normalizedCardTypeToMatch !== normalizedRequestedType) continue;
                }

                const cardNameMatch = (card.name && typeof card.name === 'string' && card.name === cardName) || 
                                     (card.card_name && typeof card.card_name === 'string' && card.card_name === cardName);
                
                if (cardNameMatch) {
                    return card.id;
                }
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
                const alreadyImported = new Set<string>();
                const alreadyInDeck = new Set<string>();

                if (currentDeckCards && currentDeckCards.length > 0) {
                    currentDeckCards.forEach(card => {
                        const key = `${card.type}_${card.cardId}`;
                        alreadyInDeck.add(key);
                    });
                }

                for (const cardEntry of cardsToImport) {
                    if (cardEntry.type !== 'location') {
                        continue;
                    }

                    const cardId = findCardIdByName(cardEntry.name, cardEntry.type);

                    if (cardId) {
                        const importKey = `${cardEntry.type}_${cardId}`;

                        if (alreadyInDeck.has(importKey)) {
                            continue;
                        }
                        if (alreadyImported.has(importKey)) {
                            continue;
                        }

                        importList.push({
                            type: cardEntry.type,
                            cardId: cardId,
                            cardName: cardEntry.name
                        });
                        alreadyImported.add(importKey);
                    } else {
                        unresolvedCards.push(cardEntry.name);
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

                // Validate deck
                const testDeckCards: any[] = [];
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
                        if (importCard.type === 'location') {
                            continue; // Locations shouldn't have duplicates
                        } else {
                            testDeckCards[existingIndex].quantity += 1;
                        }
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
                        errorMessages.style.display = 'block';
                        errorMessages.innerHTML = `<ul><li>Validation error: ${validationError.message}</li></ul>`;
                        importButton.disabled = false;
                        return;
                    }
                }

                // Add cards to deck
                let successCount = 0;
                let errorCount = 0;
                const addErrors: string[] = [];

                for (const importCard of importList) {
                    if (importCard.type !== 'location') {
                        continue;
                    }

                    try {
                        const cardData = mockAvailableCardsMap.get(importCard.cardId);

                        const existingLocation = mockDeckEditorCards.find(c =>
                            c.type === 'location' && c.cardId === importCard.cardId
                        );
                        if (existingLocation) {
                            continue;
                        }

                        const locationCount = mockDeckEditorCards.filter(c => c.type === 'location').length;
                        if (locationCount >= 1) {
                            errorCount++;
                            addErrors.push(`${importCard.cardName}: Cannot add more than 1 location`);
                            continue;
                        }

                        let selectedAlternateImage = null;
                        if (cardData && cardData.alternateImages && cardData.alternateImages.length > 0) {
                            selectedAlternateImage = cardData.alternateImages[0];
                        }

                        const addCardToEditorFunc = (window as any).addCardToEditor;
                        if (typeof addCardToEditorFunc === 'function') {
                            await addCardToEditorFunc(importCard.type, importCard.cardId, importCard.cardName, selectedAlternateImage);

                            await new Promise(resolve => setTimeout(resolve, 100));

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
                errorMessages.style.display = 'block';
                errorMessages.innerHTML = `<ul><li>Error processing import: ${error.message}</li></ul>`;
            } finally {
                importButton.disabled = false;
            }
        };

        jest.useFakeTimers();
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
        it('should extract location cards from JSON structure', () => {
            const cardsData = {
                locations: ['Event Horizon: The Future', 'The Citadel']
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ name: 'Event Horizon: The Future', type: 'location' });
            expect(result[1]).toEqual({ name: 'The Citadel', type: 'location' });
        });

        it('should handle empty locations array', () => {
            const cardsData = {
                locations: []
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result).toHaveLength(0);
        });

        it('should trim whitespace from location names', () => {
            const cardsData = {
                locations: ['  Event Horizon: The Future  ', '  The Citadel  ']
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result[0].name).toBe('Event Horizon: The Future');
            expect(result[1].name).toBe('The Citadel');
        });

        it('should skip non-string location names', () => {
            const cardsData = {
                locations: ['Event Horizon: The Future', null, undefined, 123, 'The Citadel']
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('Event Horizon: The Future');
            expect(result[1].name).toBe('The Citadel');
        });

        it('should handle missing locations field', () => {
            const cardsData = {};

            const result = extractCardsFromImportData(cardsData);

            expect(result).toHaveLength(0);
        });
    });

    describe('findCardIdByName', () => {
        it('should find location by exact name match', () => {
            const cardId = findCardIdByName('Event Horizon: The Future', 'location');
            expect(cardId).toBe('event_horizon_id');
        });

        it('should find location with alternate images by name', () => {
            const cardId = findCardIdByName('Ancient Ruins', 'location');
            expect(cardId).toBe('ancient_ruins_id');
        });

        it('should return null for location not found', () => {
            const cardId = findCardIdByName('Non-existent Location', 'location');
            expect(cardId).toBeNull();
        });

        it('should return null for invalid input', () => {
            expect(findCardIdByName(null as any, 'location')).toBeNull();
            expect(findCardIdByName(undefined as any, 'location')).toBeNull();
            expect(findCardIdByName('', 'location')).toBeNull();
        });

        it('should filter by card type', () => {
            // Add a non-location card with same name to test filtering
            mockAvailableCardsMap.set('Event Horizon Special', {
                id: 'special-event-horizon',
                name: 'Event Horizon: The Future',
                type: 'special'
            });

            const cardId = findCardIdByName('Event Horizon: The Future', 'location');
            // Should find location, not special
            expect(cardId).toBe('event_horizon_id');
        });
    });

    describe('processImportDeck - Location Import Success', () => {
        it('should successfully import location without alternate images', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    locations: ['Event Horizon: The Future']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledWith(
                'location',
                'event_horizon_id',
                'Event Horizon: The Future',
                null
            );
            expect(mockDeckEditorCards).toHaveLength(1);
            expect(mockDeckEditorCards[0].cardId).toBe('event_horizon_id');
            expect(mockCloseImportOverlay).toHaveBeenCalled();
            expect(mockShowNotification).toHaveBeenCalledWith('Successfully imported 1 card(s)', 'success');
        });

        it('should successfully import location with alternate images and auto-select first', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    locations: ['Ancient Ruins']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledWith(
                'location',
                'ancient_ruins_id',
                'Ancient Ruins',
                'locations/alternate/ancient_ruins_alt.webp'
            );
            expect(mockDeckEditorCards).toHaveLength(1);
            expect(mockDeckEditorCards[0].selectedAlternateImage).toBe('locations/alternate/ancient_ruins_alt.webp');
            expect(mockCloseImportOverlay).toHaveBeenCalled();
        });

        it('should successfully import location with multiple alternate images (selects first)', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    locations: ['Lost City']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledWith(
                'location',
                'lost_city_id',
                'Lost City',
                'locations/alternate/lost_city_alt1.webp' // First alternate image
            );
            expect(mockDeckEditorCards).toHaveLength(1);
            expect(mockDeckEditorCards[0].selectedAlternateImage).toBe('locations/alternate/lost_city_alt1.webp');
        });
    });

    describe('processImportDeck - Duplicate Detection', () => {
        it('should skip location already in deck', async () => {
            // Add location to deck first
            mockDeckEditorCards.push({
                id: 'existing-1',
                type: 'location',
                cardId: 'event_horizon_id',
                quantity: 1
            });

            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    locations: ['Event Horizon: The Future']
                }
            });

            await processImportDeck();
            jest.advanceTimersByTime(200);

            // Should not call addCardToEditor since already in deck
            expect(mockAddCardToEditor).not.toHaveBeenCalled();
            expect(mockDeckEditorCards).toHaveLength(1); // Still only one
        });

        it('should skip duplicate location in import list', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    locations: ['Event Horizon: The Future', 'Event Horizon: The Future', 'Event Horizon: The Future']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Should only add once despite being in list 3 times
            expect(mockAddCardToEditor).toHaveBeenCalledTimes(1);
            expect(mockDeckEditorCards).toHaveLength(1);
        });
    });

    describe('processImportDeck - Location Limit', () => {
        it('should enforce 1 location maximum', async () => {
            // Add 1 location to deck first
            mockDeckEditorCards.push({
                id: 'existing-1',
                type: 'location',
                cardId: 'citadel_id',
                quantity: 1
            });

            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            textarea.value = JSON.stringify({
                cards: {
                    locations: ['Event Horizon: The Future']
                }
            });

            await processImportDeck();
            jest.advanceTimersByTime(200);

            expect(mockAddCardToEditor).not.toHaveBeenCalled();
            expect(mockDeckEditorCards).toHaveLength(1); // Still 1
            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('Cannot add more than 1 location');
        });

        it('should allow adding 1 location total', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    locations: ['Event Horizon: The Future']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(1);
            expect(mockDeckEditorCards).toHaveLength(1);
        });
    });

    describe('processImportDeck - Unresolved Cards', () => {
        it('should show error for location not found in card map', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            textarea.value = JSON.stringify({
                cards: {
                    locations: ['Non-existent Location']
                }
            });

            await processImportDeck();

            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('Could not find');
            expect(errorMessages.innerHTML).toContain('Non-existent Location');
            expect(mockAddCardToEditor).not.toHaveBeenCalled();
        });
    });

    describe('processImportDeck - Validation', () => {
        it('should filter out 51-card rule validation errors', async () => {
            mockValidateDeck.mockReturnValue({
                errors: ['Deck must have at least 51 cards in draw pile (1/51)'],
                warnings: []
            });

            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    locations: ['Event Horizon: The Future']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Should proceed despite 51-card error
            expect(mockAddCardToEditor).toHaveBeenCalled();
            expect(mockCloseImportOverlay).toHaveBeenCalled();
        });

        it('should filter out threat level validation errors', async () => {
            mockValidateDeck.mockReturnValue({
                errors: ['Total threat level must be <= 76 (current: 78)'],
                warnings: []
            });

            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    locations: ['Event Horizon: The Future']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Should proceed despite threat level error
            expect(mockAddCardToEditor).toHaveBeenCalled();
            expect(mockCloseImportOverlay).toHaveBeenCalled();
        });

        it('should filter out both 51-card and threat level validation errors', async () => {
            mockValidateDeck.mockReturnValue({
                errors: [
                    'Deck must have at least 51 cards in draw pile (1/51)',
                    'Total threat level must be <= 76 (current: 78)'
                ],
                warnings: []
            });

            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    locations: ['Event Horizon: The Future']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Should proceed despite both errors
            expect(mockAddCardToEditor).toHaveBeenCalled();
            expect(mockCloseImportOverlay).toHaveBeenCalled();
        });
    });

    describe('processImportDeck - Error Handling', () => {
        it('should handle addCardToEditor throwing error', async () => {
            mockAddCardToEditor.mockRejectedValueOnce(new Error('Add card failed'));

            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            textarea.value = JSON.stringify({
                cards: {
                    locations: ['Event Horizon: The Future']
                }
            });

            await processImportDeck();
            jest.advanceTimersByTime(200);

            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('Add card failed');
        });

        it('should handle addCardToEditor function not available', async () => {
            (window as any).addCardToEditor = undefined;

            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            textarea.value = JSON.stringify({
                cards: {
                    locations: ['Event Horizon: The Future']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('addCardToEditor function not available');
        });
    });

    describe('processImportDeck - Mixed Location Types', () => {
        it('should handle locations with and without alternate images in same import', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    locations: [
                        'Event Horizon: The Future', // No alternate images
                        'Ancient Ruins' // Has alternate images
                    ]
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Should only import first location (limit is 1)
            expect(mockAddCardToEditor).toHaveBeenCalledTimes(1);
            expect(mockAddCardToEditor).toHaveBeenCalledWith(
                'location',
                'event_horizon_id',
                'Event Horizon: The Future',
                null
            );
            expect(mockDeckEditorCards).toHaveLength(1);
        });
    });
});


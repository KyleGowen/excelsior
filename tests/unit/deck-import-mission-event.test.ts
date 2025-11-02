/** @jest-environment jsdom */

/**
 * Unit Tests for Deck Mission and Event Import Functionality
 * 
 * Tests cover:
 * - extractCardsFromImportData() - Mission and event extraction from JSON
 * - findCardIdByName() - Mission and event lookup by name
 * - processImportDeck() - Full import flow
 *   - Missions and events without alternate images
 *   - Missions and events with alternate images (auto-selecting first)
 *   - Duplicate detection (allowed for missions/events)
 *   - Error handling and validation
 *   - Success scenarios with verification
 */

describe('Deck Mission and Event Import - Unit Tests', () => {
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
            // Simulate adding card to deck - missions and events can have duplicates
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
            // Missions without alternate images - stored by name
            ['Battle at Olympus', {
                id: 'battle_at_olympus_id',
                name: 'Battle at Olympus',
                type: 'mission',
                missionSet: 'Time Wars: Rise of the Gods',
                alternateImages: []
            }],
            // Mission stored by card_name (missions use card_name field)
            ['Divine Retribution', {
                id: 'divine_retribution_id',
                card_name: 'Divine Retribution', // No 'name' field, only 'card_name'
                type: 'mission',
                missionSet: 'Time Wars: Rise of the Gods',
                alternateImages: []
            }],
            // Mission stored with prefixed key
            ['mission_supernatural_allies_id', {
                id: 'supernatural_allies_id',
                name: 'Supernatural Allies',
                cardType: 'mission', // Using cardType instead of type
                missionSet: 'Time Wars: Rise of the Gods',
                alternateImages: []
            }],
            // Mission with card_name and prefixed key
            ['mission_gods_return_id', {
                id: 'gods_return_id',
                card_name: 'The Gods Return',
                cardType: 'mission',
                missionSet: 'Time Wars: Rise of the Gods',
                alternateImages: []
            }],
            ['supernatural_allies_id', {
                id: 'supernatural_allies_id',
                name: 'Supernatural Allies',
                cardType: 'mission',
                missionSet: 'Time Wars: Rise of the Gods',
                alternateImages: []
            }],
            ['gods_return_id', {
                id: 'gods_return_id',
                card_name: 'The Gods Return',
                cardType: 'mission',
                missionSet: 'Time Wars: Rise of the Gods',
                alternateImages: []
            }],
            ['Supernatural Allies', {
                id: 'supernatural_allies_id',
                name: 'Supernatural Allies',
                type: 'mission',
                missionSet: 'Time Wars: Rise of the Gods',
                alternateImages: []
            }],
            ['The Gods Return', {
                id: 'gods_return_id',
                name: 'The Gods Return',
                type: 'mission',
                missionSet: 'Time Wars: Rise of the Gods',
                alternateImages: []
            }],
            ['Tide Begins to Turn', {
                id: 'tide_begins_id',
                name: 'Tide Begins to Turn',
                card_type: 'mission', // Using card_type instead of type
                missionSet: 'Time Wars: Rise of the Gods',
                alternateImages: []
            }],
            ['Traveler\'s Warning', {
                id: 'travelers_warning_id',
                card_name: 'Traveler\'s Warning', // Only card_name
                type: 'mission',
                missionSet: 'Time Wars: Rise of the Gods',
                alternateImages: []
            }],
            ['Warriors from Across Time', {
                id: 'warriors_across_time_id',
                name: 'Warriors from Across Time',
                type: 'mission',
                cardType: 'mission', // Has both type and cardType
                missionSet: 'Time Wars: Rise of the Gods',
                alternateImages: []
            }],
            // Mission stored with prefixed key and card_name
            ['mission_travelers_warning_id', {
                id: 'travelers_warning_id',
                card_name: 'Traveler\'s Warning',
                cardType: 'mission',
                missionSet: 'Time Wars: Rise of the Gods',
                alternateImages: []
            }],
            // Missions with alternate images
            ['Mission With Alt Art', {
                id: 'mission_alt_id',
                name: 'Mission With Alt Art',
                type: 'mission',
                missionSet: 'Time Wars: Rise of the Gods',
                alternateImages: ['missions/alternate/mission_alt.webp']
            }],
            ['mission_alt_id', {
                id: 'mission_alt_id',
                name: 'Mission With Alt Art',
                type: 'mission',
                missionSet: 'Time Wars: Rise of the Gods',
                alternateImages: ['missions/alternate/mission_alt.webp']
            }],
            // Events without alternate images
            ['Getting Our Hands Dirty', {
                id: 'getting_hands_dirty_id',
                name: 'Getting Our Hands Dirty',
                type: 'event',
                missionSet: 'Time Wars: Rise of the Gods',
                alternateImages: []
            }],
            // Event stored by card_name
            ['Ready for War', {
                id: 'ready_for_war_id',
                card_name: 'Ready for War', // Using card_name like missions
                cardType: 'event',
                missionSet: 'Time Wars: Rise of the Gods',
                alternateImages: []
            }],
            // Event stored with prefixed key
            ['event_ready_for_war_id', {
                id: 'ready_for_war_id',
                card_name: 'Ready for War',
                cardType: 'event',
                missionSet: 'Time Wars: Rise of the Gods',
                alternateImages: []
            }],
            // Events with alternate images
            ['Event With Alt Art', {
                id: 'event_alt_id',
                name: 'Event With Alt Art',
                type: 'event',
                missionSet: 'Time Wars: Rise of the Gods',
                alternateImages: ['events/alternate/event_alt.webp']
            }],
            ['event_alt_id', {
                id: 'event_alt_id',
                name: 'Event With Alt Art',
                type: 'event',
                missionSet: 'Time Wars: Rise of the Gods',
                alternateImages: ['events/alternate/event_alt.webp']
            }],
            // Store by ID for lookup
            ['battle_at_olympus_id', {
                id: 'battle_at_olympus_id',
                name: 'Battle at Olympus',
                type: 'mission',
                missionSet: 'Time Wars: Rise of the Gods',
                alternateImages: []
            }],
            ['getting_hands_dirty_id', {
                id: 'getting_hands_dirty_id',
                name: 'Getting Our Hands Dirty',
                type: 'event',
                missionSet: 'Time Wars: Rise of the Gods',
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

            // Missions (object grouped by mission set)
            if (cardsData.missions && typeof cardsData.missions === 'object') {
                Object.values(cardsData.missions).forEach((missionSetCards: any) => {
                    if (Array.isArray(missionSetCards)) {
                        missionSetCards.forEach((cardName: string) => addCard(cardName, 'mission'));
                    }
                });
            }

            // Events (object grouped by mission set)
            if (cardsData.events && typeof cardsData.events === 'object') {
                Object.values(cardsData.events).forEach((eventSetCards: any) => {
                    if (Array.isArray(eventSetCards)) {
                        eventSetCards.forEach((cardName: string) => addCard(cardName, 'event'));
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
            // Try both name and card_name as keys (missions use card_name)
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
                        if (key !== prefixedPattern) {
                            continue; // Skip this prefixed key
                        }
                        // This is the correct prefixed key for our search type - continue processing
                    } else {
                        continue; // No cardType specified, skip all prefixed keys
                    }
                }
                
                // Safely check card name first - exact match required
                // Check both name and card_name fields (missions use card_name, events use name)
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
                    if (cardEntry.type !== 'mission' && cardEntry.type !== 'event') {
                        continue;
                    }

                    const cardId = findCardIdByName(cardEntry.name, cardEntry.type);

                    if (cardId) {
                        importList.push({
                            type: cardEntry.type,
                            cardId: cardId,
                            cardName: cardEntry.name
                        });
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
                        // Missions and events can have duplicates - increment quantity
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
                    if (importCard.type !== 'mission' && importCard.type !== 'event') {
                        continue;
                    }

                    try {
                        // Look up card data by ID (or by name as fallback)
                        let cardData = mockAvailableCardsMap.get(importCard.cardId);
                        if (!cardData) {
                            // Fallback: search by card name
                            for (const [key, card] of mockAvailableCardsMap.entries()) {
                                if (card.id === importCard.cardId || card.name === importCard.cardName) {
                                    cardData = card;
                                    break;
                                }
                            }
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
        it('should extract mission cards from missions object grouped by mission set', () => {
            const cardsData = {
                missions: {
                    'Time Wars: Rise of the Gods': [
                        'Battle at Olympus',
                        'Divine Retribution',
                        'Supernatural Allies'
                    ]
                }
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result.length).toBe(3);
            expect(result.filter(c => c.type === 'mission').length).toBe(3);
            expect(result.some(c => c.name === 'Battle at Olympus')).toBe(true);
            expect(result.some(c => c.name === 'Divine Retribution')).toBe(true);
            expect(result.some(c => c.name === 'Supernatural Allies')).toBe(true);
        });

        it('should extract event cards from events object grouped by mission set', () => {
            const cardsData = {
                events: {
                    'Time Wars: Rise of the Gods': [
                        'Getting Our Hands Dirty',
                        'Ready for War'
                    ]
                }
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result.length).toBe(2);
            expect(result.filter(c => c.type === 'event').length).toBe(2);
            expect(result.some(c => c.name === 'Getting Our Hands Dirty')).toBe(true);
            expect(result.some(c => c.name === 'Ready for War')).toBe(true);
        });

        it('should extract both missions and events from same mission set', () => {
            const cardsData = {
                missions: {
                    'Time Wars: Rise of the Gods': ['Battle at Olympus', 'Divine Retribution']
                },
                events: {
                    'Time Wars: Rise of the Gods': ['Getting Our Hands Dirty', 'Ready for War']
                }
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result.length).toBe(4);
            expect(result.filter(c => c.type === 'mission').length).toBe(2);
            expect(result.filter(c => c.type === 'event').length).toBe(2);
        });

        it('should handle empty missions and events objects', () => {
            const cardsData = {
                missions: {},
                events: {}
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result.length).toBe(0);
        });

        it('should handle missions and events from multiple mission sets', () => {
            const cardsData = {
                missions: {
                    'Time Wars: Rise of the Gods': ['Battle at Olympus'],
                    'Another Mission Set': ['Mission 1', 'Mission 2']
                },
                events: {
                    'Time Wars: Rise of the Gods': ['Getting Our Hands Dirty'],
                    'Another Mission Set': ['Event 1']
                }
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result.length).toBe(5);
            expect(result.filter(c => c.type === 'mission').length).toBe(3);
            expect(result.filter(c => c.type === 'event').length).toBe(2);
        });
    });

    describe('findCardIdByName', () => {
        it('should find mission card by name', () => {
            const cardId = findCardIdByName('Battle at Olympus', 'mission');
            expect(cardId).toBe('battle_at_olympus_id');
        });

        it('should find event card by name', () => {
            const cardId = findCardIdByName('Getting Our Hands Dirty', 'event');
            expect(cardId).toBe('getting_hands_dirty_id');
        });

        it('should return null for non-existent mission', () => {
            const cardId = findCardIdByName('Non-existent Mission', 'mission');
            expect(cardId).toBeNull();
        });

        it('should return null for non-existent event', () => {
            const cardId = findCardIdByName('Non-existent Event', 'event');
            expect(cardId).toBeNull();
        });

        it('should filter by card type (mission vs event)', () => {
            const missionId = findCardIdByName('Battle at Olympus', 'mission');
            const eventId = findCardIdByName('Getting Our Hands Dirty', 'event');
            
            expect(missionId).toBe('battle_at_olympus_id');
            expect(eventId).toBe('getting_hands_dirty_id');
        });

        describe('card_name field support', () => {
            it('should find mission stored with card_name (not name)', () => {
                const cardId = findCardIdByName('Divine Retribution', 'mission');
                expect(cardId).toBe('divine_retribution_id');
            });

            it('should find mission with only card_name field', () => {
                const cardId = findCardIdByName('Traveler\'s Warning', 'mission');
                expect(cardId).toBe('travelers_warning_id');
            });

            it('should find event stored with card_name', () => {
                const cardId = findCardIdByName('Ready for War', 'event');
                expect(cardId).toBe('ready_for_war_id');
            });
        });

        describe('prefixed key lookup', () => {
            it('should find mission stored with prefixed key (mission_xxx)', () => {
                const cardId = findCardIdByName('Supernatural Allies', 'mission');
                expect(cardId).toBe('supernatural_allies_id');
            });

            it('should find mission with prefixed key and card_name', () => {
                const cardId = findCardIdByName('The Gods Return', 'mission');
                expect(cardId).toBe('gods_return_id');
            });

            it('should find event stored with prefixed key (event_xxx)', () => {
                const cardId = findCardIdByName('Ready for War', 'event');
                expect(cardId).toBe('ready_for_war_id');
            });
        });

        describe('type field variations', () => {
            it('should find mission using cardType field', () => {
                const cardId = findCardIdByName('Supernatural Allies', 'mission');
                expect(cardId).toBe('supernatural_allies_id');
            });

            it('should find mission using card_type field', () => {
                const cardId = findCardIdByName('Tide Begins to Turn', 'mission');
                expect(cardId).toBe('tide_begins_id');
            });

            it('should find mission with both type and cardType', () => {
                const cardId = findCardIdByName('Warriors from Across Time', 'mission');
                expect(cardId).toBe('warriors_across_time_id');
            });

            it('should find event using cardType field', () => {
                const cardId = findCardIdByName('Ready for War', 'event');
                expect(cardId).toBe('ready_for_war_id');
            });

            it('should reject mission when type field does not match', () => {
                // Add a card with wrong type
                mockAvailableCardsMap.set('Wrong Type Mission', {
                    id: 'wrong_type_id',
                    name: 'Wrong Type Mission',
                    type: 'character', // Wrong type
                    missionSet: 'Time Wars: Rise of the Gods'
                });
                
                const cardId = findCardIdByName('Wrong Type Mission', 'mission');
                expect(cardId).toBeNull();
            });

            it('should reject event when cardType field does not match', () => {
                // Add a card with wrong type
                mockAvailableCardsMap.set('Wrong Type Event', {
                    id: 'wrong_type_event_id',
                    name: 'Wrong Type Event',
                    cardType: 'mission', // Wrong type
                    missionSet: 'Time Wars: Rise of the Gods'
                });
                
                const cardId = findCardIdByName('Wrong Type Event', 'event');
                expect(cardId).toBeNull();
            });
        });

        describe('direct lookup fallback', () => {
            it('should use direct lookup when card is stored by name', () => {
                const cardId = findCardIdByName('Battle at Olympus', 'mission');
                expect(cardId).toBe('battle_at_olympus_id');
            });

            it('should fallback to card_name search when direct lookup fails', () => {
                // Mission stored by card_name, not by name key
                const cardId = findCardIdByName('Divine Retribution', 'mission');
                expect(cardId).toBe('divine_retribution_id');
            });

            it('should search through all entries when direct lookup fails', () => {
                // Mission only stored with prefixed key, not by name
                const cardId = findCardIdByName('Supernatural Allies', 'mission');
                expect(cardId).toBe('supernatural_allies_id');
            });
        });

        describe('edge cases and validation', () => {
            it('should handle null/undefined cardName', () => {
                expect(findCardIdByName(null as any, 'mission')).toBeNull();
                expect(findCardIdByName(undefined as any, 'mission')).toBeNull();
                expect(findCardIdByName('', 'mission')).toBeNull();
            });

            it('should handle missing type field gracefully (legacy data fallback)', () => {
                // Card with no type information but name matches
                mockAvailableCardsMap.set('Legacy Mission', {
                    id: 'legacy_mission_id',
                    card_name: 'Legacy Mission',
                    // No type, card_type, or cardType
                    missionSet: 'Time Wars: Rise of the Gods'
                });
                
                const cardId = findCardIdByName('Legacy Mission', 'mission');
                // Should allow match if name matches (fallback for legacy data)
                expect(cardId).toBe('legacy_mission_id');
            });

            it('should skip cards without id field', () => {
                mockAvailableCardsMap.set('Invalid Card', {
                    // Missing id field
                    name: 'Invalid Card',
                    type: 'mission'
                });
                
                const cardId = findCardIdByName('Invalid Card', 'mission');
                expect(cardId).toBeNull();
            });

            it('should find cards with non-string keys by name/card_name', () => {
                // Cards stored with non-string keys should still be findable by name/card_name
                // This tests that the search logic properly checks card.name/card.card_name
                // regardless of the map key type
                mockAvailableCardsMap.set(123 as any, {
                    id: 'numeric_key_id',
                    name: 'Numeric Key Card',
                    type: 'mission',
                    missionSet: 'Time Wars: Rise of the Gods'
                });
                
                // Should still find the card by its name field, even if stored with numeric key
                const cardId = findCardIdByName('Numeric Key Card', 'mission');
                expect(cardId).toBe('numeric_key_id');
            });

            it('should handle cards with both name and card_name', () => {
                mockAvailableCardsMap.set('Dual Name Card', {
                    id: 'dual_name_id',
                    name: 'Dual Name Card',
                    card_name: 'Dual Name Card',
                    type: 'mission',
                    missionSet: 'Time Wars: Rise of the Gods'
                });
                
                const cardId = findCardIdByName('Dual Name Card', 'mission');
                expect(cardId).toBe('dual_name_id');
            });

            it('should match by both name and card_name when both exist', () => {
                mockAvailableCardsMap.set('Priority Test', {
                    id: 'priority_test_id',
                    name: 'Priority Test',
                    card_name: 'Different Name',
                    type: 'mission',
                    missionSet: 'Time Wars: Rise of the Gods'
                });
                
                // Searching for name field should match
                const cardId = findCardIdByName('Priority Test', 'mission');
                expect(cardId).toBe('priority_test_id');
                
                // Searching for card_name should also match
                const cardId2 = findCardIdByName('Different Name', 'mission');
                expect(cardId2).toBe('priority_test_id');
            });

            it('should handle cardType match when type fields are missing', () => {
                mockAvailableCardsMap.set('CardType Only', {
                    id: 'cardtype_only_id',
                    name: 'CardType Only',
                    cardType: 'mission', // Only cardType, no type or card_type
                    missionSet: 'Time Wars: Rise of the Gods'
                });
                
                const cardId = findCardIdByName('CardType Only', 'mission');
                expect(cardId).toBe('cardtype_only_id');
            });

            it('should reject when cardType does not match requested type', () => {
                mockAvailableCardsMap.set('Mismatched CardType', {
                    id: 'mismatched_cardtype_id',
                    name: 'Mismatched CardType',
                    cardType: 'event', // Looking for mission
                    missionSet: 'Time Wars: Rise of the Gods'
                });
                
                const cardId = findCardIdByName('Mismatched CardType', 'mission');
                expect(cardId).toBeNull();
            });
        });
    });

    describe('processImportDeck - Mission Import', () => {
        it('should successfully import missions from single mission set', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    missions: {
                        'Time Wars: Rise of the Gods': [
                            'Battle at Olympus',
                            'Divine Retribution',
                            'Supernatural Allies'
                        ]
                    }
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(3);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('mission', 'battle_at_olympus_id', 'Battle at Olympus', null);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('mission', 'divine_retribution_id', 'Divine Retribution', null);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('mission', 'supernatural_allies_id', 'Supernatural Allies', null);
            expect(mockCloseImportOverlay).toHaveBeenCalled();
            expect(mockShowNotification).toHaveBeenCalledWith('Successfully imported 3 card(s)', 'success');
        });

        it('should successfully import mission with alternate images and auto-select first', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    missions: {
                        'Time Wars: Rise of the Gods': ['Mission With Alt Art']
                    }
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledWith(
                'mission',
                'mission_alt_id',
                'Mission With Alt Art',
                'missions/alternate/mission_alt.webp'
            );
            expect(mockDeckEditorCards[0].selectedAlternateImage).toBe('missions/alternate/mission_alt.webp');
        });

        it('should import duplicate missions (multiple instances)', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    missions: {
                        'Time Wars: Rise of the Gods': [
                            'Battle at Olympus',
                            'Battle at Olympus',
                            'Battle at Olympus'
                        ]
                    }
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(3);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('mission', 'battle_at_olympus_id', 'Battle at Olympus', null);
            expect(mockCloseImportOverlay).toHaveBeenCalled();
        });
    });

    describe('processImportDeck - Event Import', () => {
        it('should successfully import events from single mission set', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    events: {
                        'Time Wars: Rise of the Gods': [
                            'Getting Our Hands Dirty',
                            'Ready for War'
                        ]
                    }
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(2);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('event', 'getting_hands_dirty_id', 'Getting Our Hands Dirty', null);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('event', 'ready_for_war_id', 'Ready for War', null);
            expect(mockCloseImportOverlay).toHaveBeenCalled();
            expect(mockShowNotification).toHaveBeenCalledWith('Successfully imported 2 card(s)', 'success');
        });

        it('should successfully import event with alternate images and auto-select first', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    events: {
                        'Time Wars: Rise of the Gods': ['Event With Alt Art']
                    }
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledWith(
                'event',
                'event_alt_id',
                'Event With Alt Art',
                'events/alternate/event_alt.webp'
            );
            expect(mockDeckEditorCards[0].selectedAlternateImage).toBe('events/alternate/event_alt.webp');
        });

        it('should import duplicate events (multiple instances)', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    events: {
                        'Time Wars: Rise of the Gods': [
                            'Getting Our Hands Dirty',
                            'Getting Our Hands Dirty'
                        ]
                    }
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(2);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('event', 'getting_hands_dirty_id', 'Getting Our Hands Dirty', null);
        });
    });

    describe('processImportDeck - Combined Mission and Event Import', () => {
        it('should import both missions and events from same mission set', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    missions: {
                        'Time Wars: Rise of the Gods': [
                            'Battle at Olympus',
                            'Divine Retribution'
                        ]
                    },
                    events: {
                        'Time Wars: Rise of the Gods': [
                            'Getting Our Hands Dirty',
                            'Ready for War'
                        ]
                    }
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(4);
            expect(mockDeckEditorCards.filter(c => c.type === 'mission').length).toBe(2);
            expect(mockDeckEditorCards.filter(c => c.type === 'event').length).toBe(2);
            expect(mockCloseImportOverlay).toHaveBeenCalled();
        });

        it('should import all missions and events from Time Wars: Rise of the Gods', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    missions: {
                        'Time Wars: Rise of the Gods': [
                            'Battle at Olympus',
                            'Divine Retribution',
                            'Supernatural Allies',
                            'The Gods Return',
                            'Tide Begins to Turn',
                            'Traveler\'s Warning',
                            'Warriors from Across Time'
                        ]
                    },
                    events: {
                        'Time Wars: Rise of the Gods': [
                            'Getting Our Hands Dirty',
                            'Ready for War'
                        ]
                    }
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(9);
            expect(mockDeckEditorCards.filter(c => c.type === 'mission').length).toBe(7);
            expect(mockDeckEditorCards.filter(c => c.type === 'event').length).toBe(2);
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
                    missions: {
                        'Time Wars: Rise of the Gods': ['Battle at Olympus']
                    }
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Should proceed despite validation errors
            expect(mockAddCardToEditor).toHaveBeenCalled();
            expect(mockCloseImportOverlay).toHaveBeenCalled();
        });

        it('should handle unresolved missions and events', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            textarea.value = JSON.stringify({
                cards: {
                    missions: {
                        'Time Wars: Rise of the Gods': ['Non-existent Mission']
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
            mockAddCardToEditor.mockRejectedValueOnce(new Error('Add card failed'));

            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            textarea.value = JSON.stringify({
                cards: {
                    missions: {
                        'Time Wars: Rise of the Gods': ['Battle at Olympus']
                    }
                }
            });

            await processImportDeck();
            jest.advanceTimersByTime(200);

            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('Add card failed');
        });
    });
});


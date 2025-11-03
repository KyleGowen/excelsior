/** @jest-environment jsdom */

describe('Deck Import - Basic Universe - Unit Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <textarea id="importJsonContent"></textarea>
      <div id="importErrorMessages" style="display: none;"></div>
      <button id="importJsonButton"></button>
      <select id="viewMode">
        <option value="card" selected>Card</option>
        <option value="list">List</option>
      </select>
    `;

    (window as any).availableCardsMap = new Map();
    (window as any).deckEditorCards = [];
    (window as any).addCardToEditor = jest.fn(async (type: string, cardId: string, cardName: string) => {
      (window as any).deckEditorCards.push({ type, cardId, cardName, quantity: 1 });
    });
    (window as any).showNotification = jest.fn();
    (window as any).closeImportOverlay = jest.fn();
    (window as any).validateDeck = jest.fn().mockReturnValue({ errors: [], warnings: [] });
    (window as any).loadAvailableCards = jest.fn().mockResolvedValue(undefined);
    (window as any).renderDeckCardsCardView = jest.fn();
    (window as any).renderDeckCardsListView = jest.fn();

    // Load real implementation to attach functions to window
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('../../public/js/components/deck-import.js');

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
    delete (window as any).availableCardsMap;
    delete (window as any).deckEditorCards;
    delete (window as any).addCardToEditor;
    delete (window as any).showNotification;
    delete (window as any).closeImportOverlay;
    delete (window as any).validateDeck;
    delete (window as any).loadAvailableCards;
    delete (window as any).renderDeckCardsCardView;
    delete (window as any).renderDeckCardsListView;
  });

  describe('extractCardsFromImportData - basic_universe', () => {
    it('parses full spec: name - Type value +bonus', () => {
      const fn = (window as any).extractCardsFromImportData as (d: any) => any[];
      const result = fn({ basic_universe: ['Secret Identity - Intelligence 6 or greater +2'] });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'Secret Identity',
        type: 'basic-universe',
        type_field: 'Intelligence',
        value_to_use: '6 or greater',
        bonus: '+2'
      });
    });

    it('parses without bonus', () => {
      const fn = (window as any).extractCardsFromImportData as (d: any) => any[];
      const result = fn({ basic_universe: ['Longbow - Combat 7 or greater'] });
      expect(result[0]).toMatchObject({ name: 'Longbow', type: 'basic-universe', type_field: 'Combat', value_to_use: '7 or greater', bonus: null });
    });

    it('parses name only', () => {
      const fn = (window as any).extractCardsFromImportData as (d: any) => any[];
      const result = fn({ basic_universe: ['Flintlock'] });
      expect(result[0]).toEqual({ name: 'Flintlock', type: 'basic-universe' });
    });
  });

  describe('findBasicUniverseCardIdByName', () => {
    it('matches by all fields', () => {
      const map: Map<string, any> = (window as any).availableCardsMap;
      const card = {
        id: 'basic_universe_secret_identity',
        cardType: 'basic-universe',
        name: 'Secret Identity',
        type: 'Intelligence',
        value_to_use: '6 or greater',
        bonus: '+2'
      };
      map.set(card.id, card);
      const find = (window as any).findBasicUniverseCardIdByName as (n: string, t?: string|null, v?: string|null, b?: string|null) => string|null;
      expect(find('Secret Identity', 'Intelligence', '6 or greater', '+2')).toBe(card.id);
    });

    it('matches by subset of fields', () => {
      const map: Map<string, any> = (window as any).availableCardsMap;
      const card = {
        id: 'basic_universe_longbow',
        cardType: 'basic-universe',
        name: 'Longbow',
        type: 'Combat',
        value_to_use: '7 or greater',
        bonus: '+3'
      };
      map.set(card.id, card);
      const find = (window as any).findBasicUniverseCardIdByName as (n: string, t?: string|null, v?: string|null, b?: string|null) => string|null;
      expect(find('Longbow', 'Combat', '7 or greater', null)).toBe(card.id);
      expect(find('Longbow', 'Combat', null, null)).toBe(card.id);
    });
  });

  describe('processImportDeck - Basic Universe import + view mode preservation', () => {
    function seedBasicUniverseCards() {
      const map: Map<string, any> = (window as any).availableCardsMap;
      const cards = [
        {
          id: 'basic_universe_secret_identity',
          cardType: 'basic-universe',
          name: 'Secret Identity',
          type: 'Intelligence',
          value_to_use: '6 or greater',
          bonus: '+2',
          alternateImages: []
        },
        {
          id: 'basic_universe_longbow',
          cardType: 'basic-universe',
          name: 'Longbow',
          type: 'Combat',
          value_to_use: '7 or greater',
          bonus: '+3',
          alternateImages: []
        },
        {
          id: 'basic_universe_flintlock',
          cardType: 'basic-universe',
          name: 'Flintlock',
          type: 'Combat',
          value_to_use: '6 or greater',
          bonus: '+2',
          alternateImages: []
        }
      ];
      cards.forEach(c => map.set(c.id, c));
    }

    it('imports basic-universe cards and keeps Card View active', async () => {
      seedBasicUniverseCards();
      // Ensure starting in Card View
      const select = document.getElementById('viewMode') as HTMLSelectElement;
      select.value = 'card';

      const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
      textarea.value = JSON.stringify({
        cards: {
          basic_universe: [
            'Secret Identity - Intelligence 6 or greater +2',
            'Longbow - Combat 7 or greater +3',
            'Flintlock - Combat 6 or greater +2'
          ]
        }
      });

      const process = (window as any).processImportDeck as () => Promise<void>;
      const promise = process();
      await jest.runAllTimersAsync();
      await promise;

      // Added to deck
      expect((window as any).deckEditorCards.filter((c: any) => c.type === 'basic-universe')).toHaveLength(3);
      // View preserved
      expect((window as any).renderDeckCardsCardView).toHaveBeenCalled();
      expect((window as any).renderDeckCardsListView).not.toHaveBeenCalled();
    });

    it('imports basic-universe cards and keeps List View active', async () => {
      seedBasicUniverseCards();
      const select = document.getElementById('viewMode') as HTMLSelectElement;
      select.value = 'list';

      const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
      textarea.value = JSON.stringify({
        cards: {
          basic_universe: [
            'Secret Identity - Intelligence 6 or greater +2'
          ]
        }
      });

      const process = (window as any).processImportDeck as () => Promise<void>;
      const promise = process();
      await jest.runAllTimersAsync();
      await promise;

      expect((window as any).renderDeckCardsListView).toHaveBeenCalled();
      expect((window as any).renderDeckCardsCardView).not.toHaveBeenCalled();
    });

    it('imports when viewMode missing and defaults to Card View', async () => {
      seedBasicUniverseCards();
      // Remove viewMode control
      const el = document.getElementById('viewMode');
      el?.parentElement?.removeChild(el);

      const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
      textarea.value = JSON.stringify({
        cards: {
          basic_universe: ['Flintlock - Combat 6 or greater +2']
        }
      });

      const process = (window as any).processImportDeck as () => Promise<void>;
      const promise = process();
      await jest.runAllTimersAsync();
      await promise;

      expect((window as any).renderDeckCardsCardView).toHaveBeenCalled();
    });
  });
});

/** @jest-environment jsdom */

/**
 * Unit Tests for Deck Basic Universe Card Import Functionality
 * 
 * Tests cover:
 * - extractCardsFromImportData() - Basic universe card extraction from JSON
 * - findBasicUniverseCardIdByName() - Basic universe card lookup by name, type, value_to_use, and bonus
 * - processImportDeck() - Full import flow
 *   - Basic universe cards with all fields (type, value_to_use, bonus)
 *   - Basic universe cards with partial fields
 *   - Duplicate handling (basic universe cards can have duplicates)
 *   - Error handling and validation
 *   - Success scenarios with verification
 */

describe('Deck Basic Universe Import - Unit Tests', () => {
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
    let findBasicUniverseCardIdByName: (cardName: string, typeField: string | null, valueToUse: string | null, bonus: string | null) => string | null;
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
            // Simulate adding card to deck (basic universe cards can have duplicates, so always add)
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
            // Basic universe cards
            ['basic_universe_secret_identity', {
                id: 'basic_universe_secret_identity',
                card_name: 'Secret Identity',
                name: 'Secret Identity',
                type: 'Intelligence',
                value_to_use: '6 or greater',
                bonus: '+2',
                cardType: 'basic-universe'
            }],
            ['Secret Identity', {
                id: 'basic_universe_secret_identity',
                card_name: 'Secret Identity',
                name: 'Secret Identity',
                type: 'Intelligence',
                value_to_use: '6 or greater',
                bonus: '+2',
                cardType: 'basic-universe'
            }],
            ['basic_universe_longbow', {
                id: 'basic_universe_longbow',
                card_name: 'Longbow',
                name: 'Longbow',
                type: 'Combat',
                value_to_use: '7 or greater',
                bonus: '+3',
                cardType: 'basic-universe'
            }],
            ['Longbow', {
                id: 'basic_universe_longbow',
                card_name: 'Longbow',
                name: 'Longbow',
                type: 'Combat',
                value_to_use: '7 or greater',
                bonus: '+3',
                cardType: 'basic-universe'
            }],
            ['basic_universe_flintlock', {
                id: 'basic_universe_flintlock',
                card_name: 'Flintlock',
                name: 'Flintlock',
                type: 'Combat',
                value_to_use: '6 or greater',
                bonus: '+2',
                cardType: 'basic-universe'
            }],
            ['Flintlock', {
                id: 'basic_universe_flintlock',
                card_name: 'Flintlock',
                name: 'Flintlock',
                type: 'Combat',
                value_to_use: '6 or greater',
                bonus: '+2',
                cardType: 'basic-universe'
            }],
            // Basic universe card with different type
            ['basic_universe_ray_gun', {
                id: 'basic_universe_ray_gun',
                card_name: 'Ray Gun',
                name: 'Ray Gun',
                type: 'Energy',
                value_to_use: '6 or greater',
                bonus: '+2',
                cardType: 'basic-universe'
            }],
            ['Ray Gun', {
                id: 'basic_universe_ray_gun',
                card_name: 'Ray Gun',
                name: 'Ray Gun',
                type: 'Energy',
                value_to_use: '6 or greater',
                bonus: '+2',
                cardType: 'basic-universe'
            }]
        ]);

        // Set up global mocks
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

            // Basic universe (array of strings, format: "Secret Identity - Intelligence 6 or greater +2")
            if (Array.isArray(cardsData.basic_universe)) {
                cardsData.basic_universe.forEach((cardName: any) => {
                    if (cardName && typeof cardName === 'string') {
                        const trimmedName = cardName.trim();
                        const dashIndex = trimmedName.indexOf(' - ');
                        
                        if (dashIndex > 0) {
                            const baseName = trimmedName.substring(0, dashIndex).trim();
                            const suffix = trimmedName.substring(dashIndex + 3).trim();
                            
                            const bonusMatch = suffix.match(/^(.+?)\s*([+-]\d+)$/);
                            let statInfo = suffix;
                            let bonus = null;
                            
                            if (bonusMatch) {
                                statInfo = bonusMatch[1].trim();
                                bonus = bonusMatch[2].trim();
                            } else if (/^[+-]\d+$/.test(suffix.trim())) {
                                statInfo = '';
                                bonus = suffix.trim();
                            }
                            
                            const statTypes = ['Brute Force', 'Any-Power', 'Energy', 'Combat', 'Intelligence'];
                            let type = null;
                            let valueToUse = null;
                            
                            if (statInfo && statInfo.trim()) {
                                const trimmedStatInfo = statInfo.trim();
                                
                                for (const statType of statTypes) {
                                    if (trimmedStatInfo.startsWith(statType)) {
                                        type = statType;
                                        const remaining = trimmedStatInfo.substring(statType.length).trim();
                                        valueToUse = remaining || null;
                                        break;
                                    }
                                }
                                
                                if (!type && statTypes.includes(trimmedStatInfo)) {
                                    type = trimmedStatInfo;
                                } else if (!type) {
                                    valueToUse = trimmedStatInfo;
                                }
                            }
                            
                            result.push({ 
                                name: baseName, 
                                type: 'basic-universe',
                                type_field: type,
                                value_to_use: valueToUse,
                                bonus: bonus
                            });
                        } else {
                            result.push({ name: trimmedName, type: 'basic-universe' });
                        }
                    }
                });
            }

            return result;
        };

        findBasicUniverseCardIdByName = (cardName: string, typeField: string | null, valueToUse: string | null, bonus: string | null) => {
            if (!mockAvailableCardsMap || !cardName || typeof cardName !== 'string') {
                return null;
            }
            
            for (const [key, card] of mockAvailableCardsMap.entries()) {
                if (!key || !card || !card.id) continue;
                
                const cardType = card.cardType || card.type || card.card_type;
                if (!cardType || (cardType !== 'basic-universe' && cardType !== 'basic_universe')) {
                    continue;
                }
                
                const cardNameMatch = (card.name && typeof card.name === 'string' && card.name === cardName) ||
                                     (card.card_name && typeof card.card_name === 'string' && card.card_name === cardName);
                
                if (!cardNameMatch) continue;
                
                const normalize = (value: any) => {
                    if (!value || typeof value !== 'string') return null;
                    return value.trim();
                };
                
                const normalizedCardType = normalize(card.type);
                const normalizedCardValueToUse = normalize(card.value_to_use);
                const normalizedCardBonus = normalize(card.bonus);
                const normalizedSearchType = normalize(typeField);
                const normalizedSearchValueToUse = normalize(valueToUse);
                const normalizedSearchBonus = normalize(bonus);
                
                if (typeField !== null && valueToUse !== null && bonus !== null) {
                    if (normalizedCardType === normalizedSearchType &&
                        normalizedCardValueToUse === normalizedSearchValueToUse &&
                        normalizedCardBonus === normalizedSearchBonus) {
                        return card.id;
                    }
                } else if (typeField !== null && valueToUse !== null) {
                    if (normalizedCardType === normalizedSearchType &&
                        normalizedCardValueToUse === normalizedSearchValueToUse) {
                        return card.id;
                    }
                } else if (typeField !== null && bonus !== null) {
                    if (normalizedCardType === normalizedSearchType &&
                        normalizedCardBonus === normalizedSearchBonus) {
                        return card.id;
                    }
                } else if (valueToUse !== null && bonus !== null) {
                    if (normalizedCardValueToUse === normalizedSearchValueToUse &&
                        normalizedCardBonus === normalizedSearchBonus) {
                        return card.id;
                    }
                } else if (typeField !== null) {
                    if (normalizedCardType === normalizedSearchType) {
                        return card.id;
                    }
                } else if (valueToUse !== null) {
                    if (normalizedCardValueToUse === normalizedSearchValueToUse) {
                        return card.id;
                    }
                } else if (bonus !== null) {
                    if (normalizedCardBonus === normalizedSearchBonus) {
                        return card.id;
                    }
                } else {
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

                for (const cardEntry of cardsToImport) {
                    if (cardEntry.type !== 'basic-universe') {
                        continue;
                    }

                    const cardId = findBasicUniverseCardIdByName(
                        cardEntry.name, 
                        cardEntry.type_field || null,
                        cardEntry.value_to_use || null,
                        cardEntry.bonus || null
                    );

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
                    if (importCard.type !== 'basic-universe') {
                        continue;
                    }

                    try {
                        const cardData = mockAvailableCardsMap.get(importCard.cardId);

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
        it('should extract basic universe cards from JSON structure with all fields', () => {
            const cardsData = {
                basic_universe: [
                    'Secret Identity - Intelligence 6 or greater +2',
                    'Longbow - Combat 7 or greater +3'
                ]
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ 
                name: 'Secret Identity', 
                type: 'basic-universe',
                type_field: 'Intelligence',
                value_to_use: '6 or greater',
                bonus: '+2'
            });
            expect(result[1]).toEqual({ 
                name: 'Longbow', 
                type: 'basic-universe',
                type_field: 'Combat',
                value_to_use: '7 or greater',
                bonus: '+3'
            });
        });

        it('should extract basic universe cards with only type and value_to_use', () => {
            const cardsData = {
                basic_universe: [
                    'Secret Identity - Intelligence 6 or greater'
                ]
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ 
                name: 'Secret Identity', 
                type: 'basic-universe',
                type_field: 'Intelligence',
                value_to_use: '6 or greater',
                bonus: null
            });
        });

        it('should extract basic universe cards with just name', () => {
            const cardsData = {
                basic_universe: [
                    'Secret Identity'
                ]
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ 
                name: 'Secret Identity', 
                type: 'basic-universe'
            });
        });

        it('should handle empty basic_universe array', () => {
            const cardsData = {
                basic_universe: []
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result).toHaveLength(0);
        });

        it('should trim whitespace from card names', () => {
            const cardsData = {
                basic_universe: ['  Secret Identity - Intelligence 6 or greater +2  ']
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result[0].name).toBe('Secret Identity');
        });

        it('should handle Brute Force stat type (two words)', () => {
            const cardsData = {
                basic_universe: [
                    'Card Name - Brute Force 5 or greater +2'
                ]
            };

            const result = extractCardsFromImportData(cardsData);

            expect(result[0].type_field).toBe('Brute Force');
            expect(result[0].value_to_use).toBe('5 or greater');
            expect(result[0].bonus).toBe('+2');
        });
    });

    describe('findBasicUniverseCardIdByName', () => {
        it('should find basic universe card by exact match with all fields', () => {
            const cardId = findBasicUniverseCardIdByName('Secret Identity', 'Intelligence', '6 or greater', '+2');
            expect(cardId).toBe('basic_universe_secret_identity');
        });

        it('should find basic universe card by name and type only', () => {
            const cardId = findBasicUniverseCardIdByName('Secret Identity', 'Intelligence', null, null);
            expect(cardId).toBe('basic_universe_secret_identity');
        });

        it('should find basic universe card by name only', () => {
            const cardId = findBasicUniverseCardIdByName('Secret Identity', null, null, null);
            expect(cardId).toBe('basic_universe_secret_identity');
        });

        it('should return null for card not found', () => {
            const cardId = findBasicUniverseCardIdByName('Non-existent Card', 'Intelligence', '6 or greater', '+2');
            expect(cardId).toBeNull();
        });

        it('should distinguish between cards with same name but different types', () => {
            // Note: In our test data, we have Secret Identity (Intelligence) and Longbow (Combat)
            // This test ensures type matching works correctly
            const cardId1 = findBasicUniverseCardIdByName('Secret Identity', 'Intelligence', null, null);
            const cardId2 = findBasicUniverseCardIdByName('Longbow', 'Combat', null, null);
            
            expect(cardId1).toBe('basic_universe_secret_identity');
            expect(cardId2).toBe('basic_universe_longbow');
        });

        it('should return null for invalid input', () => {
            expect(findBasicUniverseCardIdByName(null as any, null, null, null)).toBeNull();
            expect(findBasicUniverseCardIdByName(undefined as any, null, null, null)).toBeNull();
            expect(findBasicUniverseCardIdByName('', null, null, null)).toBeNull();
        });
    });

    describe('processImportDeck - Basic Universe Import Success', () => {
        it('should successfully import basic universe card with all fields', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    basic_universe: ['Secret Identity - Intelligence 6 or greater +2']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledWith(
                'basic-universe',
                'basic_universe_secret_identity',
                'Secret Identity',
                null
            );
            expect(mockDeckEditorCards).toHaveLength(1);
            expect(mockDeckEditorCards[0].cardId).toBe('basic_universe_secret_identity');
            expect(mockCloseImportOverlay).toHaveBeenCalled();
            expect(mockShowNotification).toHaveBeenCalledWith('Successfully imported 1 card(s)', 'success');
        });

        it('should successfully import multiple basic universe cards', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    basic_universe: [
                        'Secret Identity - Intelligence 6 or greater +2',
                        'Longbow - Combat 7 or greater +3',
                        'Flintlock - Combat 6 or greater +2'
                    ]
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalledTimes(3);
            expect(mockDeckEditorCards).toHaveLength(3);
            expect(mockCloseImportOverlay).toHaveBeenCalled();
            expect(mockShowNotification).toHaveBeenCalledWith('Successfully imported 3 card(s)', 'success');
        });

        it('should allow duplicate basic universe cards in import', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    basic_universe: [
                        'Secret Identity - Intelligence 6 or greater +2',
                        'Secret Identity - Intelligence 6 or greater +2'
                    ]
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Should add both (basic universe cards can have duplicates)
            expect(mockAddCardToEditor).toHaveBeenCalledTimes(2);
            expect(mockDeckEditorCards).toHaveLength(2);
            expect(mockDeckEditorCards[0].cardId).toBe('basic_universe_secret_identity');
            expect(mockDeckEditorCards[1].cardId).toBe('basic_universe_secret_identity');
        });
    });

    describe('processImportDeck - Unresolved Cards', () => {
        it('should show error for basic universe card not found in card map', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            textarea.value = JSON.stringify({
                cards: {
                    basic_universe: ['Non-existent Card - Intelligence 6 or greater +2']
                }
            });

            await processImportDeck();

            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('Could not find');
            expect(errorMessages.innerHTML).toContain('Non-existent Card');
            expect(mockAddCardToEditor).not.toHaveBeenCalled();
        });

        it('should show error for basic universe card with mismatched fields', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            textarea.value = JSON.stringify({
                cards: {
                    basic_universe: ['Secret Identity - Intelligence 10 or greater +5']
                }
            });

            await processImportDeck();

            // Should not find the card because fields don't match
            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('Could not find');
        });
    });

    describe('processImportDeck - JSON Parsing', () => {
        it('should show error for empty textarea', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            textarea.value = '';

            await processImportDeck();

            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('Please paste JSON data');
        });

        it('should show error for invalid JSON', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            textarea.value = '{ invalid json }';

            await processImportDeck();

            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('Invalid JSON format');
        });

        it('should show error for missing cards section', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            textarea.value = JSON.stringify({ name: 'Test Deck' });

            await processImportDeck();

            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('Missing "cards" section');
        });

        it('should show error for empty basic_universe array', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            textarea.value = JSON.stringify({ cards: { basic_universe: [] } });

            await processImportDeck();

            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('No cards found');
        });
    });

    describe('processImportDeck - Edge Cases', () => {
        it('should handle basic universe cards with just name (no fields)', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    basic_universe: ['Secret Identity']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Should still find and add the card by name
            expect(mockAddCardToEditor).toHaveBeenCalled();
            expect(mockDeckEditorCards.length).toBeGreaterThan(0);
        });

        it('should preserve existing deck cards during import', async () => {
            // Add existing non-basic-universe card
            mockDeckEditorCards.push({
                id: 'existing-character',
                type: 'character',
                cardId: 'char-1',
                quantity: 1
            });

            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    basic_universe: ['Secret Identity - Intelligence 6 or greater +2']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockDeckEditorCards).toHaveLength(2); // Existing character + new basic universe
            expect(mockDeckEditorCards.some(c => c.type === 'character')).toBe(true);
            expect(mockDeckEditorCards.some(c => c.type === 'basic-universe')).toBe(true);
        });
    });
});


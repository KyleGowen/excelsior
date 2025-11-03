/** @jest-environment jsdom */

/**
 * Comprehensive Unit Tests for Deck Export Component
 * 
 * Tests cover:
 * - Export data structure validation
 * - Card grouping by character/mission set
 * - Threat calculation with reserve character adjustments
 * - All card types and edge cases
 * - Error handling and missing data scenarios
 * - Deck metadata extraction
 * - Quantity handling in grouped structures
 */

import fs from 'fs';
import path from 'path';

// Polyfill for TextEncoder/TextDecoder if needed
if (typeof global.TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
}

describe('Deck Export Component - Comprehensive Tests', () => {
    let mockCurrentUser: any;
    let mockDeckEditorCards: any[];
    let mockAvailableCardsMap: Map<string, any>;
    let mockIsDeckLimited: boolean;
    let mockCurrentDeckData: any;
    let mockShowNotification: jest.Mock;
    let mockLoadAvailableCards: jest.Mock;
    let mockValidateDeck: jest.Mock;
    let mockShowExportOverlay: jest.Mock = jest.fn();
    
    // Functions from the actual file
    let exportDeckAsJson: () => Promise<void>;

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

        // Set up global mocks (using window for browser globals)
        (window as any).currentUser = mockCurrentUser;
        (window as any).deckEditorCards = mockDeckEditorCards;
        (window as any).availableCardsMap = mockAvailableCardsMap;
        (window as any).isDeckLimited = mockIsDeckLimited;
        (window as any).currentDeckData = mockCurrentDeckData;
        (window as any).showNotification = mockShowNotification;
        (window as any).loadAvailableCards = mockLoadAvailableCards;
        (window as any).validateDeck = mockValidateDeck;

        // Load and execute the actual deck-export.js file
        const deckExportPath = path.join(__dirname, '../../public/js/components/deck-export.js');
        const deckExportCode = fs.readFileSync(deckExportPath, 'utf-8');

        const executeCode = new Function(
            'window',
            'document',
            'navigator',
            `
            // Make globals available in function scope
            const currentUser = window.currentUser;
            const showNotification = window.showNotification;
            const loadAvailableCards = window.loadAvailableCards;
            const validateDeck = window.validateDeck;
            const isDeckLimited = window.isDeckLimited;
            const currentDeckData = window.currentDeckData;
            
            ${deckExportCode}
            `
        );
        
        executeCode(window, document, navigator);

        // Get function from window after execution
        exportDeckAsJson = (window as any).exportDeckAsJson;
        
        if (!exportDeckAsJson) {
            throw new Error('exportDeckAsJson function not found on window object');
        }

        // Spy on showExportOverlay after it's been defined by the actual code
        // and make it store the JSON in dataset for our getExportedJson helper
        const actualShowExportOverlay = (window as any).showExportOverlay;
        mockShowExportOverlay = jest.fn((jsonString: string) => {
            // Store JSON in dataset for getExportedJson helper
            const overlay = document.getElementById('exportJsonOverlay');
            if (overlay) {
                (overlay as HTMLElement).dataset.jsonString = jsonString;
            }
            // Also call the actual function to maintain behavior
            actualShowExportOverlay(jsonString);
        });
        (window as any).showExportOverlay = mockShowExportOverlay;

        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.clearAllMocks();
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
        delete (window as any).closeExportOverlay;
        delete (window as any).copyJsonToClipboard;
    });

    // Helper function to get exported JSON from overlay
    function getExportedJson(): any {
        const overlay = document.getElementById('exportJsonOverlay');
        const jsonString = (overlay as HTMLElement)?.dataset.jsonString;
        if (!jsonString) return null;
        return JSON.parse(jsonString);
    }

    // REMOVED: createExportFunction() - now using actual code from deck-export.js

    describe('exportDeckAsJson - Basic Functionality', () => {
        it('should export deck with correct structure', async () => {
            mockDeckEditorCards = [
                { cardId: 'char1', type: 'character', quantity: 1 },
                { cardId: 'power1', type: 'power', quantity: 2 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Test Character', energy: 5, combat: 4, brute_force: 3, intelligence: 2, threat_level: 18 });
            mockAvailableCardsMap.set('power1', { name: 'Test Power', value: 8, power_type: 'Energy' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result).toBeDefined();
            expect(result.cards).toBeDefined();
            expect(result.name).toBe('Test Deck Name');
            expect(result.description).toBe('Test deck description');
            expect(result).toHaveProperty('total_energy_icons');
            expect(result).toHaveProperty('total_combat_icons');
            expect(result).toHaveProperty('total_brute_force_icons');
            expect(result).toHaveProperty('total_intelligence_icons');
            // Characters should be an array (strings for regular, objects for reserve)
            expect(Array.isArray(result.cards.characters)).toBe(true);
            expect(mockShowExportOverlay).toHaveBeenCalled();
        });

        it('should handle missing currentDeckData and extract from DOM', async () => {
            // Need at least one card in map to avoid early return
            mockAvailableCardsMap.set('char1', { name: 'Character' });
            
            mockDeckEditorCards = [];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.name).toBe('Test Deck Name');
            expect(result.description).toBe('Test deck description');
        });

        it('should prefer currentDeckData over DOM elements', async () => {
            mockCurrentDeckData = {
                metadata: {
                    name: 'From CurrentDeckData',
                    description: 'Description from CurrentDeckData'
                }
            };
            (window as any).currentDeckData = mockCurrentDeckData;
            
            // Need at least one card in map to avoid early return
            mockAvailableCardsMap.set('char1', { name: 'Character' });
            
            mockDeckEditorCards = [];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.name).toBe('From CurrentDeckData');
            expect(result.description).toBe('Description from CurrentDeckData');
        });

        it('should remove legality badges from deck name', async () => {
            const titleElement = document.querySelector('h4');
            titleElement!.innerHTML = 'Test Deck <span class="deck-validation-badge error">Not Legal</span>';
            
            // Need at least one card in map to avoid early return
            mockAvailableCardsMap.set('char1', { name: 'Character' });
            
            mockDeckEditorCards = [];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.name).toBe('Test Deck');
        });

        it('should handle empty deck gracefully', async () => {
            // Need at least one card in map to avoid early return
            mockAvailableCardsMap.set('char1', { name: 'Character' });
            
            mockDeckEditorCards = [];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.total_cards).toBe(0);
            expect(result.max_energy).toBe(0);
            expect(result.max_combat).toBe(0);
            expect(result.max_brute_force).toBe(0);
            expect(result.max_intelligence).toBe(0);
            expect(result.total_threat).toBe(0);
            expect(result.cards.special_cards).toEqual({});
            expect(result.cards.missions).toEqual({});
            expect(result.cards.events).toEqual({});
            expect(result.cards.advanced_universe).toEqual({});
        });

        it('should deny access to non-ADMIN users', async () => {
            (window as any).currentUser = { role: 'USER' };
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result).toBeUndefined();
            expect(mockShowExportOverlay).not.toHaveBeenCalled();
        });

        it('should deny access when no user is logged in', async () => {
            (window as any).currentUser = null;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result).toBeUndefined();
            expect(mockShowExportOverlay).not.toHaveBeenCalled();
        });

        it('should include correct metadata', async () => {
            // Need at least one card in map to avoid early return
            mockAvailableCardsMap.set('char1', { name: 'Character' });
            
            mockDeckEditorCards = [];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.exported_by).toBe('Test Admin');
            expect(result.export_timestamp).toBeDefined();
            expect(new Date(result.export_timestamp)).toBeInstanceOf(Date);
            expect(typeof result.legal).toBe('boolean');
            expect(typeof result.limited).toBe('boolean');
        });

        it('should use username if name is not available', async () => {
            (window as any).currentUser = {
                role: 'ADMIN',
                username: 'testuser'
                // no name field
            };

            // Need at least one card in map to avoid early return
            mockAvailableCardsMap.set('char1', { name: 'Character' });

            mockDeckEditorCards = [];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.exported_by).toBe('testuser');
        });
    });

    describe('Threat Calculation', () => {
        it('should calculate threat from characters', async () => {
            mockDeckEditorCards = [
                { cardId: 'char1', type: 'character', quantity: 1 },
                { cardId: 'char2', type: 'character', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character 1', threat_level: 18 });
            mockAvailableCardsMap.set('char2', { name: 'Character 2', threat_level: 20 });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.total_threat).toBe(38); // 18 + 20
        });

        it('should calculate threat from locations', async () => {
            mockDeckEditorCards = [
                { cardId: 'loc1', type: 'location', quantity: 1 },
                { cardId: 'loc2', type: 'location', quantity: 2 }
            ];

            mockAvailableCardsMap.set('loc1', { name: 'Location 1', threat_level: 3 });
            mockAvailableCardsMap.set('loc2', { name: 'Location 2', threat_level: 2 });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.total_threat).toBe(7); // 3 + (2 * 2)
        });

        it('should calculate threat from both characters and locations', async () => {
            mockDeckEditorCards = [
                { cardId: 'char1', type: 'character', quantity: 1 },
                { cardId: 'loc1', type: 'location', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character 1', threat_level: 18 });
            mockAvailableCardsMap.set('loc1', { name: 'Location 1', threat_level: 3 });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.total_threat).toBe(21); // 18 + 3
        });

        it('should apply reserve character threat adjustment for Victory Harben', async () => {
            mockDeckEditorCards = [
                { cardId: 'victory', type: 'character', quantity: 1 }
            ];

            mockCurrentDeckData = {
                metadata: {
                    reserve_character: 'victory'
                }
            };

            mockAvailableCardsMap.set('victory', { 
                name: 'Victory Harben', 
                threat_level: 18,
                energy: 5,
                combat: 4,
                brute_force: 3,
                intelligence: 2
            });

            (window as any).currentDeckData = mockCurrentDeckData;
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.total_threat).toBe(20); // Adjusted from 18 to 20
        });

        it('should apply reserve character threat adjustment for Carson of Venus', async () => {
            mockDeckEditorCards = [
                { cardId: 'carson', type: 'character', quantity: 1 }
            ];

            mockCurrentDeckData = {
                metadata: {
                    reserve_character: 'carson'
                }
            };

            mockAvailableCardsMap.set('carson', { 
                name: 'Carson of Venus', 
                threat_level: 18,
                energy: 5,
                combat: 4,
                brute_force: 3,
                intelligence: 2
            });

            (window as any).currentDeckData = mockCurrentDeckData;
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.total_threat).toBe(19); // Adjusted from 18 to 19
        });

        it('should apply reserve character threat adjustment for Morgan Le Fay', async () => {
            mockDeckEditorCards = [
                { cardId: 'morgan', type: 'character', quantity: 1 }
            ];

            mockCurrentDeckData = {
                metadata: {
                    reserve_character: 'morgan'
                }
            };

            mockAvailableCardsMap.set('morgan', { 
                name: 'Morgan Le Fay', 
                threat_level: 19,
                energy: 5,
                combat: 4,
                brute_force: 3,
                intelligence: 2
            });

            (window as any).currentDeckData = mockCurrentDeckData;
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.total_threat).toBe(20); // Adjusted from 19 to 20
        });

        it('should not apply reserve adjustments to non-reserve characters', async () => {
            mockDeckEditorCards = [
                { cardId: 'victory', type: 'character', quantity: 1 },
                { cardId: 'other', type: 'character', quantity: 1 }
            ];

            mockCurrentDeckData = {
                metadata: {
                    reserve_character: 'other' // Victory Harben is NOT reserve
                }
            };

            mockAvailableCardsMap.set('victory', { 
                name: 'Victory Harben', 
                threat_level: 18,
                energy: 5,
                combat: 4,
                brute_force: 3,
                intelligence: 2
            });
            mockAvailableCardsMap.set('other', { 
                name: 'Other Character', 
                threat_level: 19,
                energy: 4,
                combat: 3,
                brute_force: 2,
                intelligence: 1
            });

            (window as any).currentDeckData = mockCurrentDeckData;
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.total_threat).toBe(37); // 18 + 19 (no adjustment for Victory Harben since it's not reserve)
        });

        it('should handle character quantity when calculating threat', async () => {
            mockDeckEditorCards = [
                { cardId: 'char1', type: 'character', quantity: 2 }
            ];

            mockAvailableCardsMap.set('char1', { 
                name: 'Character 1', 
                threat_level: 18,
                energy: 5,
                combat: 4,
                brute_force: 3,
                intelligence: 2
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.total_threat).toBe(36); // 18 * 2
        });
    });

    describe('Card Grouping - Special Cards by Character', () => {
        it('should group special cards by character name', async () => {
            mockDeckEditorCards = [
                { cardId: 'special1', type: 'special', quantity: 1 },
                { cardId: 'special2', type: 'special', quantity: 1 },
                { cardId: 'special3', type: 'special', quantity: 2 }
            ];

            mockAvailableCardsMap.set('special1', { name: 'Card 1', character_name: 'Captain Nemo' });
            mockAvailableCardsMap.set('special2', { name: 'Card 2', character_name: 'Captain Nemo' });
            mockAvailableCardsMap.set('special3', { name: 'Card 3', character_name: 'Count of Monte Cristo' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.special_cards).toEqual({
                'Captain Nemo': ['Card 1', 'Card 2'],
                'Count of Monte Cristo': ['Card 3', 'Card 3']
            });
        });

        it('should handle special cards with Any Character', async () => {
            mockDeckEditorCards = [
                { cardId: 'special1', type: 'special', quantity: 1 }
            ];

            mockAvailableCardsMap.set('special1', { name: 'Universal Card', character_name: 'Any Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.special_cards).toEqual({
                'Any Character': ['Universal Card']
            });
        });

        it('should handle special cards with missing character_name using character field', async () => {
            mockDeckEditorCards = [
                { cardId: 'special1', type: 'special', quantity: 1 }
            ];

            mockAvailableCardsMap.set('special1', { name: 'Card 1', character: 'Fallback Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.special_cards).toEqual({
                'Fallback Character': ['Card 1']
            });
        });

        it('should handle special cards with missing character field', async () => {
            mockDeckEditorCards = [
                { cardId: 'special1', type: 'special', quantity: 1 }
            ];

            mockAvailableCardsMap.set('special1', { name: 'Card 1' }); // No character_name or character

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.special_cards).toEqual({
                'Any Character': ['Card 1']
            });
        });

        it('should handle special card quantities correctly', async () => {
            mockDeckEditorCards = [
                { cardId: 'special1', type: 'special', quantity: 3 }
            ];

            mockAvailableCardsMap.set('special1', { name: 'Card 1', character_name: 'Test Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.special_cards).toEqual({
                'Test Character': ['Card 1', 'Card 1', 'Card 1']
            });
        });
    });

    describe('Card Grouping - Missions by Mission Set', () => {
        it('should group missions by mission set', async () => {
            mockDeckEditorCards = [
                { cardId: 'mission1', type: 'mission', quantity: 1 },
                { cardId: 'mission2', type: 'mission', quantity: 1 },
                { cardId: 'mission3', type: 'mission', quantity: 2 }
            ];

            mockAvailableCardsMap.set('mission1', { name: 'Mission 1', mission_set: 'Battle at Olympus' });
            mockAvailableCardsMap.set('mission2', { name: 'Mission 2', mission_set: 'Battle at Olympus' });
            mockAvailableCardsMap.set('mission3', { name: 'Mission 3', mission_set: 'Divine Retribution' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.missions).toEqual({
                'Battle at Olympus': ['Mission 1', 'Mission 2'],
                'Divine Retribution': ['Mission 3', 'Mission 3']
            });
        });

        it('should handle missions with missing mission_set', async () => {
            mockDeckEditorCards = [
                { cardId: 'mission1', type: 'mission', quantity: 1 }
            ];

            mockAvailableCardsMap.set('mission1', { name: 'Mission 1' }); // No mission_set

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.missions).toEqual({
                'Unknown Mission Set': ['Mission 1']
            });
        });

        it('should handle mission quantities correctly', async () => {
            mockDeckEditorCards = [
                { cardId: 'mission1', type: 'mission', quantity: 4 }
            ];

            mockAvailableCardsMap.set('mission1', { name: 'Mission 1', mission_set: 'Test Set' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.missions).toEqual({
                'Test Set': ['Mission 1', 'Mission 1', 'Mission 1', 'Mission 1']
            });
        });
    });

    describe('Card Grouping - Events by Mission Set', () => {
        it('should group events by mission set', async () => {
            mockDeckEditorCards = [
                { cardId: 'event1', type: 'event', quantity: 1 },
                { cardId: 'event2', type: 'event', quantity: 1 }
            ];

            mockAvailableCardsMap.set('event1', { name: 'Event 1', mission_set: 'Set A' });
            mockAvailableCardsMap.set('event2', { name: 'Event 2', mission_set: 'Set B' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.events).toEqual({
                'Set A': ['Event 1'],
                'Set B': ['Event 2']
            });
        });

        it('should handle events with missing mission_set', async () => {
            mockDeckEditorCards = [
                { cardId: 'event1', type: 'event', quantity: 1 }
            ];

            mockAvailableCardsMap.set('event1', { name: 'Event 1' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.events).toEqual({
                'Unknown Mission Set': ['Event 1']
            });
        });
    });

    describe('Card Grouping - Advanced Universe by Character', () => {
        it('should group advanced universe cards by character', async () => {
            mockDeckEditorCards = [
                { cardId: 'adv1', type: 'advanced-universe', quantity: 1 },
                { cardId: 'adv2', type: 'advanced-universe', quantity: 1 },
                { cardId: 'adv3', type: 'advanced-universe', quantity: 2 }
            ];

            mockAvailableCardsMap.set('adv1', { name: 'Card 1', character: 'Ra' });
            mockAvailableCardsMap.set('adv2', { name: 'Card 2', character: 'Ra' });
            mockAvailableCardsMap.set('adv3', { name: 'Card 3', character: 'Other Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.advanced_universe).toEqual({
                'Ra': ['Card 1', 'Card 2'],
                'Other Character': ['Card 3', 'Card 3']
            });
        });

        it('should handle advanced universe cards with missing character', async () => {
            mockDeckEditorCards = [
                { cardId: 'adv1', type: 'advanced-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('adv1', { name: 'Card 1' }); // No character field

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.advanced_universe).toEqual({
                'Unknown Character': ['Card 1']
            });
        });
    });

    describe('Card Types - All Categories', () => {
        it('should handle all card types correctly', async () => {
            mockDeckEditorCards = [
                { cardId: 'char1', type: 'character', quantity: 1 },
                { cardId: 'special1', type: 'special', quantity: 1 },
                { cardId: 'loc1', type: 'location', quantity: 1 },
                { cardId: 'mission1', type: 'mission', quantity: 1 },
                { cardId: 'event1', type: 'event', quantity: 1 },
                { cardId: 'aspect1', type: 'aspect', quantity: 1 },
                { cardId: 'adv1', type: 'advanced-universe', quantity: 1 },
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 },
                { cardId: 'ally1', type: 'ally-universe', quantity: 1 },
                { cardId: 'training1', type: 'training', quantity: 1 },
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 },
                { cardId: 'power1', type: 'power', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('special1', { name: 'Special', character_name: 'Test Character' });
            mockAvailableCardsMap.set('loc1', { name: 'Location' });
            mockAvailableCardsMap.set('mission1', { name: 'Mission', mission_set: 'Test Set' });
            mockAvailableCardsMap.set('event1', { name: 'Event', mission_set: 'Test Set' });
            mockAvailableCardsMap.set('aspect1', { name: 'Aspect' });
            mockAvailableCardsMap.set('adv1', { name: 'Advanced', character: 'Ra' });
            mockAvailableCardsMap.set('teamwork1', { name: '6 Combat', followup_attack_types: 'Brute Force + Energy' });
            mockAvailableCardsMap.set('ally1', { name: 'Ally' });
            mockAvailableCardsMap.set('training1', { name: 'Training' });
            mockAvailableCardsMap.set('basic1', { name: 'Basic' });
            mockAvailableCardsMap.set('power1', { name: 'Power' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(Array.isArray(result.cards.characters)).toBe(true);
            expect(typeof result.cards.special_cards).toBe('object');
            expect(Array.isArray(result.cards.locations)).toBe(true);
            expect(typeof result.cards.missions).toBe('object');
            expect(typeof result.cards.events).toBe('object');
            expect(Array.isArray(result.cards.aspects)).toBe(true);
            expect(typeof result.cards.advanced_universe).toBe('object');
            expect(Array.isArray(result.cards.teamwork)).toBe(true);
            expect(Array.isArray(result.cards.allies)).toBe(true);
            expect(Array.isArray(result.cards.training)).toBe(true);
            expect(Array.isArray(result.cards.basic_universe)).toBe(true);
            expect(Array.isArray(result.cards.power_cards)).toBe(true);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle cards missing from availableCardsMap', async () => {
            mockDeckEditorCards = [
                { cardId: 'missing1', type: 'character', quantity: 1 },
                { cardId: 'missing2', type: 'special', quantity: 1 }
            ];

            // Add at least one card to the map to avoid early return
            // but don't add the cards we're testing (missing1, missing2)
            mockAvailableCardsMap.set('someOtherCard', { name: 'Other Card' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            // Characters can be strings or objects (for reserve)
            expect(result.cards.characters).toBeDefined();
            expect(Array.isArray(result.cards.characters)).toBe(true);
            expect(result.cards.special_cards).toEqual({});
        });

        it('should handle cards with quantity 0', async () => {
            mockDeckEditorCards = [
                { cardId: 'char1', type: 'character', quantity: 0 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character', energy: 5, combat: 4, brute_force: 3, intelligence: 2 });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            // The function uses quantity || 1, so quantity 0 becomes 1
            // This is expected behavior - quantity 0 shouldn't exist in a deck in practice
            expect(result.cards.characters).toBeDefined();
            expect(Array.isArray(result.cards.characters)).toBe(true);
            expect(result.cards.characters.length).toBeGreaterThanOrEqual(1);
        });

        it('should handle cards with undefined quantity', async () => {
            mockDeckEditorCards = [
                { cardId: 'char1', type: 'character' } // No quantity field
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            // Character should be in array (could be string or object for reserve)
            expect(result.cards.characters).toBeDefined();
            expect(Array.isArray(result.cards.characters)).toBe(true);
        });

        it('should handle availableCardsMap not loaded initially', async () => {
            mockLoadAvailableCards.mockImplementation(() => {
                // Simulate loading cards after delay
                setTimeout(() => {
                    mockAvailableCardsMap.set('char1', { name: 'Character' });
                    (window as any).availableCardsMap = mockAvailableCardsMap;
                }, 500);
            });

            mockDeckEditorCards = [{ cardId: 'char1', type: 'character', quantity: 1 }];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = new Map(); // Start empty
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(mockLoadAvailableCards).toHaveBeenCalled();
            // Note: In real scenario, cards might still not be loaded after 1 second
            // This test verifies the loading attempt is made
        });

        it('should handle validation errors gracefully', async () => {
            mockValidateDeck.mockReturnValue({
                errors: ['Test validation error'],
                warnings: []
            });

            mockDeckEditorCards = [{ cardId: 'char1', type: 'character', quantity: 1 }];
            mockAvailableCardsMap.set('char1', { name: 'Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.legal).toBe(false);
        });

        it('should handle limited deck flag', async () => {
            (window as any).isDeckLimited = true;

            // Need at least one card in the map to avoid early return
            mockAvailableCardsMap.set('char1', { name: 'Character' });
            
            mockDeckEditorCards = [];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.limited).toBe(true);
        });

        it('should calculate max stats correctly with multiple characters', async () => {
            mockDeckEditorCards = [
                { cardId: 'char1', type: 'character', quantity: 1 },
                { cardId: 'char2', type: 'character', quantity: 1 },
                { cardId: 'char3', type: 'character', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Char 1', energy: 3, combat: 5, brute_force: 2, intelligence: 4 });
            mockAvailableCardsMap.set('char2', { name: 'Char 2', energy: 6, combat: 3, brute_force: 7, intelligence: 2 });
            mockAvailableCardsMap.set('char3', { name: 'Char 3', energy: 4, combat: 4, brute_force: 3, intelligence: 8 });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.max_energy).toBe(6);
            expect(result.max_combat).toBe(5);
            expect(result.max_brute_force).toBe(7);
            expect(result.max_intelligence).toBe(8);
        });

        it('should exclude mission, character, and location from total_cards count', async () => {
            mockDeckEditorCards = [
                { cardId: 'char1', type: 'character', quantity: 1 },
                { cardId: 'mission1', type: 'mission', quantity: 1 },
                { cardId: 'loc1', type: 'location', quantity: 1 },
                { cardId: 'power1', type: 'power', quantity: 3 },
                { cardId: 'special1', type: 'special', quantity: 2 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' });
            mockAvailableCardsMap.set('mission1', { name: 'Mission' });
            mockAvailableCardsMap.set('loc1', { name: 'Location' });
            mockAvailableCardsMap.set('power1', { name: 'Power' });
            mockAvailableCardsMap.set('special1', { name: 'Special', character_name: 'Test' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            // Should only count power (3) + special (2) = 5
            // Excludes character (1), mission (1), location (1)
            expect(result.total_cards).toBe(5);
        });

        it('should handle characters with missing stats', async () => {
            mockDeckEditorCards = [
                { cardId: 'char1', type: 'character', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Character' }); // No stats

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.max_energy).toBe(0);
            expect(result.max_combat).toBe(0);
            expect(result.max_brute_force).toBe(0);
            expect(result.max_intelligence).toBe(0);
        });

        it('should handle location with missing threat_level', async () => {
            mockDeckEditorCards = [
                { cardId: 'loc1', type: 'location', quantity: 1 }
            ];

            mockAvailableCardsMap.set('loc1', { name: 'Location' }); // No threat_level

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.total_threat).toBe(0);
        });

        it('should calculate icon totals correctly', async () => {
            mockDeckEditorCards = [
                { cardId: 'power1', type: 'power', quantity: 2 },
                { cardId: 'power2', type: 'power', quantity: 1 },
                { cardId: 'special1', type: 'special', quantity: 3 },
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 },
                { cardId: 'aspect1', type: 'aspect', quantity: 1 }
            ];

            mockAvailableCardsMap.set('power1', { name: 'Energy Power', power_type: 'Energy' });
            mockAvailableCardsMap.set('power2', { name: 'Multi Power', power_type: 'Multi-Power' });
            mockAvailableCardsMap.set('special1', { name: 'Special Card', icons: ['Energy', 'Combat'] });
            mockAvailableCardsMap.set('teamwork1', { name: '6 Combat', followup_attack_types: 'Brute Force + Energy', to_use: '6 Combat' });
            mockAvailableCardsMap.set('aspect1', { name: 'Aspect Card', icons: ['Brute Force'] });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            // Energy: power1 (2x Energy) + power2 multi (1x all types) + special1 (3x Energy) = 2+1+3 = 6
            // Combat: power2 multi (1x) + special1 (3x Combat) + teamwork1 (1x Combat from to_use: "6 Combat") = 1+3+1 = 5
            // Brute Force: power2 multi (1x) + aspect1 (1x) = 1+1 = 2
            // Intelligence: power2 multi (1x) = 1
            expect(result.total_energy_icons).toBe(6);
            expect(result.total_combat_icons).toBe(5);
            expect(result.total_brute_force_icons).toBe(2);
            expect(result.total_intelligence_icons).toBe(1);
        });

        it('should handle icon totals with cards that have no icons', async () => {
            mockDeckEditorCards = [
                { cardId: 'power1', type: 'power', quantity: 1 },
                { cardId: 'special1', type: 'special', quantity: 1 }
            ];

            mockAvailableCardsMap.set('power1', { name: 'Any Power', power_type: 'Any-Power' });
            mockAvailableCardsMap.set('special1', { name: 'Special Card', icons: [] }); // No icons

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.total_energy_icons).toBe(0);
            expect(result.total_combat_icons).toBe(0);
            expect(result.total_brute_force_icons).toBe(0);
            expect(result.total_intelligence_icons).toBe(0);
        });
    });

    describe('Real-World Scenarios', () => {
        it('should export a complete deck with all card types and groupings', async () => {
            // Simulate a real deck export
            mockDeckEditorCards = [
                // Characters
                { cardId: 'nemo', type: 'character', quantity: 1 },
                { cardId: 'monte', type: 'character', quantity: 1 },
                { cardId: 'korak', type: 'character', quantity: 1 },
                { cardId: 'mob', type: 'character', quantity: 1 },
                // Special cards (multiple characters)
                { cardId: 'special1', type: 'special', quantity: 1 },
                { cardId: 'special2', type: 'special', quantity: 6 },
                { cardId: 'special3', type: 'special', quantity: 1 },
                // Missions (multiple sets)
                { cardId: 'mission1', type: 'mission', quantity: 1 },
                { cardId: 'mission2', type: 'mission', quantity: 1 },
                // Events
                { cardId: 'event1', type: 'event', quantity: 1 },
                // Advanced universe
                { cardId: 'adv1', type: 'advanced-universe', quantity: 3 },
                // Power cards
                { cardId: 'power1', type: 'power', quantity: 23 }
            ];

            mockAvailableCardsMap.set('nemo', { name: 'Captain Nemo', energy: 4, combat: 6, brute_force: 7, intelligence: 7, threat_level: 19 });
            mockAvailableCardsMap.set('monte', { name: 'Count of Monte Cristo', energy: 3, combat: 5, brute_force: 6, intelligence: 8, threat_level: 18 });
            mockAvailableCardsMap.set('korak', { name: 'Korak', energy: 2, combat: 4, brute_force: 5, intelligence: 3, threat_level: 17 });
            mockAvailableCardsMap.set('mob', { name: 'Angry Mob (Industrial Age)', energy: 1, combat: 2, brute_force: 1, intelligence: 1, threat_level: 16 });
            
            mockAvailableCardsMap.set('special1', { name: 'The Gemini', character_name: 'Any Character' });
            mockAvailableCardsMap.set('special2', { name: 'Preternatural Healing', character_name: 'Count of Monte Cristo' });
            mockAvailableCardsMap.set('special3', { name: 'The Nautilus', character_name: 'Captain Nemo' });
            
            mockAvailableCardsMap.set('mission1', { name: 'Battle at Olympus', mission_set: 'Battle at Olympus' });
            mockAvailableCardsMap.set('mission2', { name: 'Divine Retribution', mission_set: 'Divine Retribution' });
            
            mockAvailableCardsMap.set('event1', { name: 'Getting Our Hands Dirty', mission_set: 'Getting Our Hands Dirty' });
            
            mockAvailableCardsMap.set('adv1', { name: 'Shards of the Staff', character: 'Ra' });
            
            mockAvailableCardsMap.set('power1', { name: 'Test Power', value: 5, power_type: 'Energy' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            // Verify structure
            expect(result).toBeDefined();
            expect(result.cards).toBeDefined();

            // Verify special cards grouping
            expect(result.cards.special_cards['Any Character']).toEqual(['The Gemini']);
            expect(result.cards.special_cards['Count of Monte Cristo']).toHaveLength(6);
            expect(result.cards.special_cards['Captain Nemo']).toEqual(['The Nautilus']);

            // Verify missions grouping
            expect(result.cards.missions['Battle at Olympus']).toEqual(['Battle at Olympus']);
            expect(result.cards.missions['Divine Retribution']).toEqual(['Divine Retribution']);

            // Verify events grouping
            expect(result.cards.events['Getting Our Hands Dirty']).toEqual(['Getting Our Hands Dirty']);

            // Verify advanced universe grouping
            expect(result.cards.advanced_universe['Ra']).toHaveLength(3);

            // Verify threat calculation (characters only in this case)
            const expectedThreat = 19 + 18 + 17 + 16; // 70
            expect(result.total_threat).toBe(expectedThreat);

            // Verify max stats
            expect(result.max_energy).toBe(4);
            expect(result.max_combat).toBe(6);
            expect(result.max_brute_force).toBe(7);
            expect(result.max_intelligence).toBe(8);

            // Verify total cards (excludes characters, missions, locations)
            // special (8) + event (1) + adv (3) + power (23) = 35
            expect(result.total_cards).toBe(35);
        });
    });

    describe('Special Card Attributes - Root Level Fields', () => {
        it('should export reserve_character when present', async () => {
            mockDeckEditorCards = [
                { cardId: 'char1', type: 'character', quantity: 1 },
                { cardId: 'char2', type: 'character', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Captain Nemo', threat_level: 19 });
            mockAvailableCardsMap.set('char2', { name: 'Count of Monte Cristo', threat_level: 18 });

            mockCurrentDeckData = {
                metadata: {
                    reserve_character: 'char1'
                }
            };
            (window as any).currentDeckData = mockCurrentDeckData;
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.reserve_character).toBe('Captain Nemo');
            expect(typeof result.reserve_character).toBe('string');
        });

        it('should export reserve_character as null when not present', async () => {
            mockDeckEditorCards = [
                { cardId: 'char1', type: 'character', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Captain Nemo', threat_level: 19 });

            mockCurrentDeckData = {
                metadata: {}
            };
            (window as any).currentDeckData = mockCurrentDeckData;
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.reserve_character).toBeNull();
        });

        it('should export reserve_character as null when currentDeckData is null', async () => {
            mockDeckEditorCards = [
                { cardId: 'char1', type: 'character', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Captain Nemo', threat_level: 19 });

            (window as any).currentDeckData = null;
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.reserve_character).toBeNull();
        });

        it('should export cataclysm_special when present', async () => {
            mockDeckEditorCards = [
                { cardId: 'special1', type: 'special', quantity: 1 },
                { cardId: 'special2', type: 'special', quantity: 1 }
            ];

            mockAvailableCardsMap.set('special1', { name: 'Fairy Protection', is_cataclysm: true, character_name: 'Any Character' });
            mockAvailableCardsMap.set('special2', { name: 'Regular Special', is_cataclysm: false, character_name: 'Any Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cataclysm_special).toBe('Fairy Protection');
            expect(typeof result.cataclysm_special).toBe('string');
        });

        it('should export cataclysm_special using cataclysm property when is_cataclysm is not present', async () => {
            mockDeckEditorCards = [
                { cardId: 'special1', type: 'special', quantity: 1 }
            ];

            mockAvailableCardsMap.set('special1', { name: 'Fairy Protection', cataclysm: true, character_name: 'Any Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cataclysm_special).toBe('Fairy Protection');
        });

        it('should export cataclysm_special as null when not present', async () => {
            mockDeckEditorCards = [
                { cardId: 'special1', type: 'special', quantity: 1 }
            ];

            mockAvailableCardsMap.set('special1', { name: 'Regular Special', is_cataclysm: false, character_name: 'Any Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cataclysm_special).toBeNull();
        });

        it('should take first cataclysm_special when multiple are present', async () => {
            mockDeckEditorCards = [
                { cardId: 'special1', type: 'special', quantity: 1 },
                { cardId: 'special2', type: 'special', quantity: 1 }
            ];

            mockAvailableCardsMap.set('special1', { name: 'First Cataclysm', is_cataclysm: true, character_name: 'Any Character' });
            mockAvailableCardsMap.set('special2', { name: 'Second Cataclysm', is_cataclysm: true, character_name: 'Any Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cataclysm_special).toBe('First Cataclysm');
        });

        it('should export assist_special when present', async () => {
            mockDeckEditorCards = [
                { cardId: 'special1', type: 'special', quantity: 1 }
            ];

            mockAvailableCardsMap.set('special1', { name: 'Charge into Battle!', is_assist: true, character_name: 'Any Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.assist_special).toBe('Charge into Battle!');
            expect(typeof result.assist_special).toBe('string');
        });

        it('should export assist_special using assist property when is_assist is not present', async () => {
            mockDeckEditorCards = [
                { cardId: 'special1', type: 'special', quantity: 1 }
            ];

            mockAvailableCardsMap.set('special1', { name: 'Charge into Battle!', assist: true, character_name: 'Any Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.assist_special).toBe('Charge into Battle!');
        });

        it('should export assist_special as null when not present', async () => {
            mockDeckEditorCards = [
                { cardId: 'special1', type: 'special', quantity: 1 }
            ];

            mockAvailableCardsMap.set('special1', { name: 'Regular Special', is_assist: false, character_name: 'Any Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.assist_special).toBeNull();
        });

        it('should take first assist_special when multiple are present', async () => {
            mockDeckEditorCards = [
                { cardId: 'special1', type: 'special', quantity: 1 },
                { cardId: 'special2', type: 'special', quantity: 1 }
            ];

            mockAvailableCardsMap.set('special1', { name: 'First Assist', is_assist: true, character_name: 'Any Character' });
            mockAvailableCardsMap.set('special2', { name: 'Second Assist', is_assist: true, character_name: 'Any Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.assist_special).toBe('First Assist');
        });

        it('should export ambush_special when present', async () => {
            mockDeckEditorCards = [
                { cardId: 'special1', type: 'special', quantity: 1 }
            ];

            mockAvailableCardsMap.set('special1', { name: 'Bodhisattva: Enlightened One', is_ambush: true, character_name: 'Any Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.ambush_special).toBe('Bodhisattva: Enlightened One');
            expect(typeof result.ambush_special).toBe('string');
        });

        it('should export ambush_special using ambush property when is_ambush is not present', async () => {
            mockDeckEditorCards = [
                { cardId: 'special1', type: 'special', quantity: 1 }
            ];

            mockAvailableCardsMap.set('special1', { name: 'Bodhisattva: Enlightened One', ambush: true, character_name: 'Any Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.ambush_special).toBe('Bodhisattva: Enlightened One');
        });

        it('should export ambush_special as null when not present', async () => {
            mockDeckEditorCards = [
                { cardId: 'special1', type: 'special', quantity: 1 }
            ];

            mockAvailableCardsMap.set('special1', { name: 'Regular Special', is_ambush: false, character_name: 'Any Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.ambush_special).toBeNull();
        });

        it('should take first ambush_special when multiple are present', async () => {
            mockDeckEditorCards = [
                { cardId: 'special1', type: 'special', quantity: 1 },
                { cardId: 'special2', type: 'special', quantity: 1 }
            ];

            mockAvailableCardsMap.set('special1', { name: 'First Ambush', is_ambush: true, character_name: 'Any Character' });
            mockAvailableCardsMap.set('special2', { name: 'Second Ambush', is_ambush: true, character_name: 'Any Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.ambush_special).toBe('First Ambush');
        });

        it('should export all four attribute types when present', async () => {
            mockDeckEditorCards = [
                { cardId: 'char1', type: 'character', quantity: 1 },
                { cardId: 'special1', type: 'special', quantity: 1 },
                { cardId: 'special2', type: 'special', quantity: 1 },
                { cardId: 'special3', type: 'special', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Captain Nemo', threat_level: 19 });
            mockAvailableCardsMap.set('special1', { name: 'Fairy Protection', is_cataclysm: true, character_name: 'Any Character' });
            mockAvailableCardsMap.set('special2', { name: 'Charge into Battle!', is_assist: true, character_name: 'Any Character' });
            mockAvailableCardsMap.set('special3', { name: 'Bodhisattva: Enlightened One', is_ambush: true, character_name: 'Any Character' });

            mockCurrentDeckData = {
                metadata: {
                    reserve_character: 'char1'
                }
            };
            (window as any).currentDeckData = mockCurrentDeckData;
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.reserve_character).toBe('Captain Nemo');
            expect(result.cataclysm_special).toBe('Fairy Protection');
            expect(result.assist_special).toBe('Charge into Battle!');
            expect(result.ambush_special).toBe('Bodhisattva: Enlightened One');
        });

        it('should handle special card with multiple types (cataclysm and assist)', async () => {
            mockDeckEditorCards = [
                { cardId: 'special1', type: 'special', quantity: 1 },
                { cardId: 'special2', type: 'special', quantity: 1 }
            ];

            // Card with both cataclysm and assist (should appear in both fields)
            mockAvailableCardsMap.set('special1', { 
                name: 'Multi-Type Card', 
                is_cataclysm: true, 
                is_assist: true,
                character_name: 'Any Character' 
            });
            mockAvailableCardsMap.set('special2', { 
                name: 'Regular Special',
                is_cataclysm: false,
                is_assist: false,
                character_name: 'Any Character'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            // First card should be captured as cataclysm (checked first in loop)
            expect(result.cataclysm_special).toBe('Multi-Type Card');
            // Since cataclysm is checked first, it will be set as cataclysm_special
            // but assist_special should also be set to the same card
            expect(result.assist_special).toBe('Multi-Type Card');
        });

        it('should handle cards with undefined special properties gracefully', async () => {
            mockDeckEditorCards = [
                { cardId: 'special1', type: 'special', quantity: 1 }
            ];

            mockAvailableCardsMap.set('special1', { 
                name: 'Card Without Properties', 
                character_name: 'Any Character'
                // No is_cataclysm, is_assist, or is_ambush properties
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cataclysm_special).toBeNull();
            expect(result.assist_special).toBeNull();
            expect(result.ambush_special).toBeNull();
        });

        it('should handle cards missing from availableCardsMap gracefully', async () => {
            mockDeckEditorCards = [
                { cardId: 'missing1', type: 'special', quantity: 1 }
            ];

            // Need at least one card in map to avoid early return
            mockAvailableCardsMap.set('dummy', { name: 'Dummy Card' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cataclysm_special).toBeNull();
            expect(result.assist_special).toBeNull();
            expect(result.ambush_special).toBeNull();
        });

        it('should handle reserve character missing from availableCardsMap gracefully', async () => {
            mockDeckEditorCards = [
                { cardId: 'missing1', type: 'character', quantity: 1 }
            ];

            // Need at least one card in map to avoid early return
            mockAvailableCardsMap.set('dummy', { name: 'Dummy Card' });

            mockCurrentDeckData = {
                metadata: {
                    reserve_character: 'missing1'
                }
            };
            (window as any).currentDeckData = mockCurrentDeckData;
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            // When card is missing from availableCardsMap, reserve_character is null
            expect(result.reserve_character).toBeNull();
        });

        it('should use card_name if name is not present for special cards', async () => {
            mockDeckEditorCards = [
                { cardId: 'special1', type: 'special', quantity: 1 }
            ];

            // Create object without 'name' property (only card_name)
            const specialCardData: any = { 
                card_name: 'Card With Card Name', 
                is_cataclysm: true,
                character_name: 'Any Character'
            };
            // Explicitly delete name if it exists
            delete specialCardData.name;
            
            mockAvailableCardsMap.set('special1', specialCardData);

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            // The export function uses: availableCard.name || availableCard.card_name || 'Unknown Card'
            // So if name is undefined, it should use card_name
            expect(result.cataclysm_special).toBe('Card With Card Name');
        });

        it('should handle empty deck with all attributes as null', async () => {
            mockDeckEditorCards = [];
            
            // Need at least one card in map to avoid early return
            mockAvailableCardsMap.set('dummy', { name: 'Dummy Card' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.reserve_character).toBeNull();
            expect(result.cataclysm_special).toBeNull();
            expect(result.assist_special).toBeNull();
            expect(result.ambush_special).toBeNull();
        });
    });

    describe('Power Card Sorting', () => {
        it('should sort power cards by value ascending, then by type order', async () => {
            mockDeckEditorCards = [
                { cardId: 'power1', type: 'power', quantity: 1 },
                { cardId: 'power2', type: 'power', quantity: 1 },
                { cardId: 'power3', type: 'power', quantity: 1 },
                { cardId: 'power4', type: 'power', quantity: 1 },
                { cardId: 'power5', type: 'power', quantity: 1 },
                { cardId: 'power6', type: 'power', quantity: 1 },
                { cardId: 'power7', type: 'power', quantity: 1 },
                { cardId: 'power8', type: 'power', quantity: 1 }
            ];

            // Add power cards in mixed order
            mockAvailableCardsMap.set('power1', { name: '5 - Any-Power' });
            mockAvailableCardsMap.set('power2', { name: '3 - Energy' });
            mockAvailableCardsMap.set('power3', { name: '5 - Combat' });
            mockAvailableCardsMap.set('power4', { name: '3 - Multi Power' });
            mockAvailableCardsMap.set('power5', { name: '5 - Energy' });
            mockAvailableCardsMap.set('power6', { name: '3 - Brute Force' });
            mockAvailableCardsMap.set('power7', { name: '3 - Intelligence' });
            mockAvailableCardsMap.set('power8', { name: '1 - Combat' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            // Expected order: by value (1, 3, 3, 3, 3, 5, 5, 5), then by type
            // Value 1: Combat
            // Value 3: Energy, Brute Force, Intelligence, Multi Power (in that order)
            // Value 5: Energy, Combat, Any-Power (in that order)
            expect(result.cards.power_cards).toEqual([
                '1 - Combat',
                '3 - Energy',
                '3 - Brute Force',
                '3 - Intelligence',
                '3 - Multi Power',
                '5 - Energy',
                '5 - Combat',
                '5 - Any-Power'
            ]);
        });

        it('should handle multiple quantities of same power card correctly', async () => {
            mockDeckEditorCards = [
                { cardId: 'power1', type: 'power', quantity: 2 },
                { cardId: 'power2', type: 'power', quantity: 3 },
                { cardId: 'power3', type: 'power', quantity: 1 }
            ];

            mockAvailableCardsMap.set('power1', { name: '5 - Energy' });
            mockAvailableCardsMap.set('power2', { name: '3 - Combat' });
            mockAvailableCardsMap.set('power3', { name: '8 - Energy' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            // Should be sorted: 3 Combat (x3), 5 Energy (x2), 8 Energy (x1)
            expect(result.cards.power_cards).toEqual([
                '3 - Combat',
                '3 - Combat',
                '3 - Combat',
                '5 - Energy',
                '5 - Energy',
                '8 - Energy'
            ]);
        });

        it('should handle power cards with different type format variations', async () => {
            mockDeckEditorCards = [
                { cardId: 'power1', type: 'power', quantity: 1 },
                { cardId: 'power2', type: 'power', quantity: 1 },
                { cardId: 'power3', type: 'power', quantity: 1 }
            ];

            mockAvailableCardsMap.set('power1', { name: '5 - Multi-Power' }); // With hyphen
            mockAvailableCardsMap.set('power2', { name: '5 - Multi Power' }); // Without hyphen
            mockAvailableCardsMap.set('power3', { name: '5 - Energy' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            // Should sort: Energy (1), then Multi Power/Multi-Power (both order 5)
            expect(result.cards.power_cards[0]).toBe('5 - Energy');
            expect(result.cards.power_cards).toHaveLength(3);
        });

        it('should correctly order all power card types when same value', async () => {
            mockDeckEditorCards = [
                { cardId: 'power1', type: 'power', quantity: 1 },
                { cardId: 'power2', type: 'power', quantity: 1 },
                { cardId: 'power3', type: 'power', quantity: 1 },
                { cardId: 'power4', type: 'power', quantity: 1 },
                { cardId: 'power5', type: 'power', quantity: 1 },
                { cardId: 'power6', type: 'power', quantity: 1 }
            ];

            // All value 5, different types - should order: Energy, Combat, Brute Force, Intelligence, Multi, Any-Power
            mockAvailableCardsMap.set('power1', { name: '5 - Any-Power' });
            mockAvailableCardsMap.set('power2', { name: '5 - Energy' });
            mockAvailableCardsMap.set('power3', { name: '5 - Combat' });
            mockAvailableCardsMap.set('power4', { name: '5 - Brute Force' });
            mockAvailableCardsMap.set('power5', { name: '5 - Intelligence' });
            mockAvailableCardsMap.set('power6', { name: '5 - Multi Power' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            // Expected order: Energy, Combat, Brute Force, Intelligence, Multi Power, Any-Power
            expect(result.cards.power_cards).toEqual([
                '5 - Energy',
                '5 - Combat',
                '5 - Brute Force',
                '5 - Intelligence',
                '5 - Multi Power',
                '5 - Any-Power'
            ]);
        });

        it('should handle real-world power card list from user example', async () => {
            mockDeckEditorCards = [
                { cardId: 'p1', type: 'power', quantity: 1 },
                { cardId: 'p2', type: 'power', quantity: 1 },
                { cardId: 'p3', type: 'power', quantity: 1 },
                { cardId: 'p4', type: 'power', quantity: 1 },
                { cardId: 'p5', type: 'power', quantity: 1 },
                { cardId: 'p6', type: 'power', quantity: 1 },
                { cardId: 'p7', type: 'power', quantity: 1 },
                { cardId: 'p8', type: 'power', quantity: 1 },
                { cardId: 'p9', type: 'power', quantity: 1 },
                { cardId: 'p10', type: 'power', quantity: 1 },
                { cardId: 'p11', type: 'power', quantity: 1 },
                { cardId: 'p12', type: 'power', quantity: 1 },
                { cardId: 'p13', type: 'power', quantity: 1 },
                { cardId: 'p14', type: 'power', quantity: 1 },
                { cardId: 'p15', type: 'power', quantity: 1 },
                { cardId: 'p16', type: 'power', quantity: 1 },
                { cardId: 'p17', type: 'power', quantity: 1 },
                { cardId: 'p18', type: 'power', quantity: 1 },
                { cardId: 'p19', type: 'power', quantity: 1 },
                { cardId: 'p20', type: 'power', quantity: 1 },
                { cardId: 'p21', type: 'power', quantity: 1 },
                { cardId: 'p22', type: 'power', quantity: 1 },
                { cardId: 'p23', type: 'power', quantity: 1 },
                { cardId: 'p24', type: 'power', quantity: 1 }
            ];

            // User's original unsorted list
            mockAvailableCardsMap.set('p1', { name: '5 - Any-Power' });
            mockAvailableCardsMap.set('p2', { name: '6 - Any-Power' });
            mockAvailableCardsMap.set('p3', { name: '8 - Any-Power' });
            mockAvailableCardsMap.set('p4', { name: '7 - Any-Power' });
            mockAvailableCardsMap.set('p5', { name: '3 - Multi Power' });
            mockAvailableCardsMap.set('p6', { name: '4 - Multi Power' });
            mockAvailableCardsMap.set('p7', { name: '5 - Multi Power' });
            mockAvailableCardsMap.set('p8', { name: '6 - Intelligence' });
            mockAvailableCardsMap.set('p9', { name: '3 - Intelligence' });
            mockAvailableCardsMap.set('p10', { name: '2 - Intelligence' });
            mockAvailableCardsMap.set('p11', { name: '2 - Brute Force' });
            mockAvailableCardsMap.set('p12', { name: '6 - Brute Force' });
            mockAvailableCardsMap.set('p13', { name: '8 - Brute Force' });
            mockAvailableCardsMap.set('p14', { name: '8 - Combat' });
            mockAvailableCardsMap.set('p15', { name: '4 - Combat' });
            mockAvailableCardsMap.set('p16', { name: '1 - Combat' });
            mockAvailableCardsMap.set('p17', { name: '4 - Energy' });
            mockAvailableCardsMap.set('p18', { name: '8 - Energy' });
            mockAvailableCardsMap.set('p19', { name: '5 - Energy' });
            mockAvailableCardsMap.set('p20', { name: '3 - Energy' });
            mockAvailableCardsMap.set('p21', { name: '2 - Energy' });
            mockAvailableCardsMap.set('p22', { name: '2 - Energy' });
            mockAvailableCardsMap.set('p23', { name: '2 - Energy' });
            mockAvailableCardsMap.set('p24', { name: '2 - Energy' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            // Expected sorted order: by value (1, 2, 3, 4, 5, 6, 7, 8), then by type
            expect(result.cards.power_cards).toEqual([
                '1 - Combat',
                '2 - Energy',
                '2 - Energy',
                '2 - Energy',
                '2 - Energy',
                '2 - Brute Force',
                '2 - Intelligence',
                '3 - Energy',
                '3 - Intelligence',
                '3 - Multi Power',
                '4 - Energy',
                '4 - Combat',
                '4 - Multi Power',
                '5 - Energy',
                '5 - Multi Power',
                '5 - Any-Power',
                '6 - Brute Force',
                '6 - Intelligence',
                '6 - Any-Power',
                '7 - Any-Power',
                '8 - Energy',
                '8 - Combat',
                '8 - Brute Force',
                '8 - Any-Power'
            ]);
        });

        it('should handle empty power cards array', async () => {
            mockDeckEditorCards = [
                { cardId: 'char1', type: 'character', quantity: 1 }
            ];

            mockAvailableCardsMap.set('char1', { name: 'Test Character', threat_level: 18 });
            
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.power_cards).toEqual([]);
            expect(Array.isArray(result.cards.power_cards)).toBe(true);
        });

        it('should handle single power card', async () => {
            mockDeckEditorCards = [
                { cardId: 'power1', type: 'power', quantity: 1 }
            ];

            mockAvailableCardsMap.set('power1', { name: '5 - Energy' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.power_cards).toEqual(['5 - Energy']);
        });

        it('should handle power cards with very high values', async () => {
            mockDeckEditorCards = [
                { cardId: 'power1', type: 'power', quantity: 1 },
                { cardId: 'power2', type: 'power', quantity: 1 },
                { cardId: 'power3', type: 'power', quantity: 1 }
            ];

            mockAvailableCardsMap.set('power1', { name: '99 - Energy' });
            mockAvailableCardsMap.set('power2', { name: '10 - Combat' });
            mockAvailableCardsMap.set('power3', { name: '100 - Any-Power' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.power_cards).toEqual([
                '10 - Combat',
                '99 - Energy',
                '100 - Any-Power'
            ]);
        });

        it('should handle power cards with value 1 correctly', async () => {
            mockDeckEditorCards = [
                { cardId: 'power1', type: 'power', quantity: 1 },
                { cardId: 'power2', type: 'power', quantity: 1 },
                { cardId: 'power3', type: 'power', quantity: 1 }
            ];

            mockAvailableCardsMap.set('power1', { name: '1 - Any-Power' });
            mockAvailableCardsMap.set('power2', { name: '1 - Energy' });
            mockAvailableCardsMap.set('power3', { name: '1 - Combat' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.power_cards).toEqual([
                '1 - Energy',
                '1 - Combat',
                '1 - Any-Power'
            ]);
        });

        it('should handle power cards with unexpected format gracefully', async () => {
            mockDeckEditorCards = [
                { cardId: 'power1', type: 'power', quantity: 1 },
                { cardId: 'power2', type: 'power', quantity: 1 },
                { cardId: 'power3', type: 'power', quantity: 1 }
            ];

            mockAvailableCardsMap.set('power1', { name: '5 - Energy' });
            mockAvailableCardsMap.set('power2', { name: 'Invalid Format' }); // Doesn't match pattern
            mockAvailableCardsMap.set('power3', { name: '3 - Combat' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            // Invalid format should be sorted last (value 999), but should still be included
            expect(result.cards.power_cards).toContain('3 - Combat');
            expect(result.cards.power_cards).toContain('5 - Energy');
            expect(result.cards.power_cards).toContain('Invalid Format');
            // Invalid format should come after valid ones
            const invalidIndex = result.cards.power_cards.indexOf('Invalid Format');
            const validIndices = [
                result.cards.power_cards.indexOf('3 - Combat'),
                result.cards.power_cards.indexOf('5 - Energy')
            ];
            expect(invalidIndex).toBeGreaterThan(Math.max(...validIndices));
        });

        it('should maintain stable sort for cards with same value and type', async () => {
            mockDeckEditorCards = [
                { cardId: 'power1', type: 'power', quantity: 1 },
                { cardId: 'power2', type: 'power', quantity: 1 },
                { cardId: 'power3', type: 'power', quantity: 1 }
            ];

            // All same value and type - should maintain insertion order
            mockAvailableCardsMap.set('power1', { name: '5 - Energy' });
            mockAvailableCardsMap.set('power2', { name: '5 - Energy' });
            mockAvailableCardsMap.set('power3', { name: '5 - Energy' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            // All should be present and sorted together
            expect(result.cards.power_cards).toEqual([
                '5 - Energy',
                '5 - Energy',
                '5 - Energy'
            ]);
        });

        it('should handle Any Power format variations', async () => {
            mockDeckEditorCards = [
                { cardId: 'power1', type: 'power', quantity: 1 },
                { cardId: 'power2', type: 'power', quantity: 1 },
                { cardId: 'power3', type: 'power', quantity: 1 }
            ];

            mockAvailableCardsMap.set('power1', { name: '5 - Any-Power' }); // With hyphen
            mockAvailableCardsMap.set('power2', { name: '5 - Any Power' }); // Without hyphen
            mockAvailableCardsMap.set('power3', { name: '5 - Energy' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            // Both Any-Power and Any Power should be treated the same (order 6)
            expect(result.cards.power_cards[0]).toBe('5 - Energy');
            // Both Any variations should come after Energy
            expect(result.cards.power_cards.filter((c: string) => c.includes('Any'))).toHaveLength(2);
        });

        it('should handle large quantities with mixed values and types', async () => {
            mockDeckEditorCards = [
                { cardId: 'power1', type: 'power', quantity: 4 }, // 4x "2 - Energy"
                { cardId: 'power2', type: 'power', quantity: 2 }, // 2x "2 - Combat"
                { cardId: 'power3', type: 'power', quantity: 3 }, // 3x "2 - Brute Force"
                { cardId: 'power4', type: 'power', quantity: 1 }   // 1x "2 - Intelligence"
            ];

            mockAvailableCardsMap.set('power1', { name: '2 - Energy' });
            mockAvailableCardsMap.set('power2', { name: '2 - Combat' });
            mockAvailableCardsMap.set('power3', { name: '2 - Brute Force' });
            mockAvailableCardsMap.set('power4', { name: '2 - Intelligence' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            // Should be sorted: Energy (x4), Combat (x2), Brute Force (x3), Intelligence (x1)
            expect(result.cards.power_cards).toEqual([
                '2 - Energy',
                '2 - Energy',
                '2 - Energy',
                '2 - Energy',
                '2 - Combat',
                '2 - Combat',
                '2 - Brute Force',
                '2 - Brute Force',
                '2 - Brute Force',
                '2 - Intelligence'
            ]);
        });

        it('should handle whitespace variations in power card names', async () => {
            mockDeckEditorCards = [
                { cardId: 'power1', type: 'power', quantity: 1 },
                { cardId: 'power2', type: 'power', quantity: 1 },
                { cardId: 'power3', type: 'power', quantity: 1 }
            ];

            mockAvailableCardsMap.set('power1', { name: '5 -Energy' }); // No space before dash
            mockAvailableCardsMap.set('power2', { name: '5- Energy' }); // No space after dash
            mockAvailableCardsMap.set('power3', { name: '5  -  Energy' }); // Multiple spaces

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            // Regex handles whitespace variations with \s*
            expect(result.cards.power_cards).toHaveLength(3);
            // All should parse correctly and sort together
            expect(result.cards.power_cards.every((card: string) => card.includes('5'))).toBe(true);
        });
    });

    describe('Import Function', () => {
        it('should show notification that import is disabled', () => {
            (window as any).importDeckFromJson = function() {
                const showNotification = (window as any).showNotification;
                showNotification('Import functionality is currently disabled', 'info');
            };

            (window as any).importDeckFromJson();

            expect(mockShowNotification).toHaveBeenCalledWith('Import functionality is currently disabled', 'info');
        });
    });

    describe('Teamwork Cards Export - Enhanced Format', () => {
        it('should export teamwork cards with followup_attack_types appended', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 },
                { cardId: 'teamwork2', type: 'teamwork', quantity: 2 },
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
                name: '7 Any-Power',
                followup_attack_types: 'Any-Power / Any-Power'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.teamwork).toEqual([
                '6 Combat - Brute Force + Energy',
                '7 Combat - Intelligence + Energy',
                '7 Combat - Intelligence + Energy',
                '7 Any-Power - Any-Power / Any-Power'
            ]);
        });

        it('should export teamwork cards without followup_attack_types if field is missing', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', { 
                name: '6 Combat'
                // No followup_attack_types field
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.teamwork).toEqual(['6 Combat']);
        });

        it('should export teamwork cards without followup_attack_types if field is empty', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', { 
                name: '6 Combat',
                followup_attack_types: ''
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.teamwork).toEqual(['6 Combat']);
        });

        it('should export teamwork cards without followup_attack_types if field is whitespace only', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', { 
                name: '6 Combat',
                followup_attack_types: '   '
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.teamwork).toEqual(['6 Combat']);
        });

        it('should handle teamwork cards with follow_up_attack_types (alternative field name)', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 }
            ];

            mockAvailableCardsMap.set('teamwork1', { 
                name: '7 Combat',
                follow_up_attack_types: 'Intelligence + Energy'  // Alternative field name
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.teamwork).toEqual(['7 Combat - Intelligence + Energy']);
        });

        it('should handle multiple quantities of same teamwork card with followup types', async () => {
            mockDeckEditorCards = [
                { cardId: 'teamwork1', type: 'teamwork', quantity: 3 }
            ];

            mockAvailableCardsMap.set('teamwork1', { 
                name: '7 Combat',
                followup_attack_types: 'Intelligence + Energy'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.teamwork).toEqual([
                '7 Combat - Intelligence + Energy',
                '7 Combat - Intelligence + Energy',
                '7 Combat - Intelligence + Energy'
            ]);
        });
    });

    describe('Training Cards Export - Enhanced Format', () => {
        it('should export training cards with type_1, type_2, and bonus appended', async () => {
            mockDeckEditorCards = [
                { cardId: 'training1', type: 'training', quantity: 1 }
            ];

            mockAvailableCardsMap.set('training1', { 
                name: 'Training (Leonidas)',
                type_1: 'Energy',
                type_2: 'Combat',
                bonus: '+4'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.training).toEqual(['Training (Leonidas) - Energy Combat +4']);
        });

        it('should export training cards with only type_1 and type_2 (no bonus)', async () => {
            mockDeckEditorCards = [
                { cardId: 'training1', type: 'training', quantity: 1 }
            ];

            mockAvailableCardsMap.set('training1', { 
                name: 'Training (Leonidas)',
                type_1: 'Energy',
                type_2: 'Combat'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.training).toEqual(['Training (Leonidas) - Energy Combat']);
        });

        it('should export training cards with only type_1 (no type_2, no bonus)', async () => {
            mockDeckEditorCards = [
                { cardId: 'training1', type: 'training', quantity: 1 }
            ];

            mockAvailableCardsMap.set('training1', { 
                name: 'Training (Leonidas)',
                type_1: 'Energy'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.training).toEqual(['Training (Leonidas) - Energy']);
        });

        it('should export training cards with only type_2 (no type_1, no bonus)', async () => {
            mockDeckEditorCards = [
                { cardId: 'training1', type: 'training', quantity: 1 }
            ];

            mockAvailableCardsMap.set('training1', { 
                name: 'Training (Leonidas)',
                type_2: 'Combat'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.training).toEqual(['Training (Leonidas) - Combat']);
        });

        it('should export training cards with only bonus (no types)', async () => {
            mockDeckEditorCards = [
                { cardId: 'training1', type: 'training', quantity: 1 }
            ];

            mockAvailableCardsMap.set('training1', { 
                name: 'Training (Leonidas)',
                bonus: '+4'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.training).toEqual(['Training (Leonidas) - +4']);
        });

        it('should export training cards without type_1, type_2, or bonus', async () => {
            mockDeckEditorCards = [
                { cardId: 'training1', type: 'training', quantity: 1 }
            ];

            mockAvailableCardsMap.set('training1', { 
                name: 'Training (Leonidas)'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.training).toEqual(['Training (Leonidas)']);
        });

        it('should handle multiple quantities of same training card', async () => {
            mockDeckEditorCards = [
                { cardId: 'training1', type: 'training', quantity: 2 }
            ];

            mockAvailableCardsMap.set('training1', { 
                name: 'Training (Cultists)',
                type_1: 'Energy',
                type_2: 'Combat',
                bonus: '+4'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.training).toEqual([
                'Training (Cultists) - Energy Combat +4',
                'Training (Cultists) - Energy Combat +4'
            ]);
        });

        it('should handle training cards missing from availableCardsMap', async () => {
            mockDeckEditorCards = [
                { cardId: 'training1', type: 'training', quantity: 1 }
            ];

            // Don't add training1 to mockAvailableCardsMap
            // Add at least one other card to ensure export doesn't fail completely
            mockDeckEditorCards.push({ cardId: 'char1', type: 'character', quantity: 1 });
            mockAvailableCardsMap.set('char1', { name: 'Test Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result).toBeDefined();
            expect(result.cards).toBeDefined();
            expect(result.cards.training).toEqual([]);
        });

        it('should handle whitespace in type_1, type_2, and bonus fields', async () => {
            mockDeckEditorCards = [
                { cardId: 'training1', type: 'training', quantity: 1 }
            ];

            mockAvailableCardsMap.set('training1', { 
                name: 'Training (Leonidas)',
                type_1: '  Energy  ',
                type_2: '  Combat  ',
                bonus: '  +4  '
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.training).toEqual(['Training (Leonidas) - Energy Combat +4']);
        });

        it('should handle training cards with card_name field instead of name', async () => {
            mockDeckEditorCards = [
                { cardId: 'training1', type: 'training', quantity: 1 }
            ];

            mockAvailableCardsMap.set('training1', { 
                card_name: 'Training (Leonidas)',
                type_1: 'Energy',
                type_2: 'Combat',
                bonus: '+4'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.training).toEqual(['Training (Leonidas) - Energy Combat +4']);
        });

        it('should handle teamwork cards missing from availableCardsMap', async () => {
            mockDeckEditorCards = [
                { cardId: 'missing_teamwork', type: 'teamwork', quantity: 1 },
                { cardId: 'teamwork1', type: 'teamwork', quantity: 1 }
            ];

            // Only add one teamwork card to map
            mockAvailableCardsMap.set('teamwork1', { 
                name: '6 Combat',
                followup_attack_types: 'Brute Force + Energy'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            // Missing card should be skipped (not added to result)
            expect(result.cards.teamwork).toEqual(['6 Combat - Brute Force + Energy']);
        });

        it('should handle various followup_attack_types formats', async () => {
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
                name: '7 Any-Power',
                followup_attack_types: 'Any-Power / Any-Power'
            });
            mockAvailableCardsMap.set('teamwork3', { 
                name: '8 Energy',
                followup_attack_types: 'Combat + Intelligence'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.teamwork).toContain('6 Combat - Brute Force + Energy');
            expect(result.cards.teamwork).toContain('7 Any-Power - Any-Power / Any-Power');
            expect(result.cards.teamwork).toContain('8 Energy - Combat + Intelligence');
        });
    });

    describe('Basic Universe Cards Export - Enhanced Format', () => {
        it('should export basic universe cards with type, value_to_use, and bonus appended', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('basic1', { 
                card_name: 'Secret Identity',
                type: 'Energy',
                value_to_use: '6 or greater',
                bonus: '+2'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity - Energy 6 or greater +2']);
        });

        it('should export basic universe cards with only type and value_to_use (no bonus)', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('basic1', { 
                card_name: 'Secret Identity',
                type: 'Energy',
                value_to_use: '6 or greater'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity - Energy 6 or greater']);
        });

        it('should export basic universe cards with only type (no value_to_use, no bonus)', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('basic1', { 
                card_name: 'Secret Identity',
                type: 'Energy'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity - Energy']);
        });

        it('should export basic universe cards with only value_to_use (no type, no bonus)', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('basic1', { 
                card_name: 'Secret Identity',
                value_to_use: '6 or greater'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity - 6 or greater']);
        });

        it('should export basic universe cards with only bonus (no type, no value_to_use)', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('basic1', { 
                card_name: 'Secret Identity',
                bonus: '+2'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity - +2']);
        });

        it('should export basic universe cards without type, value_to_use, or bonus', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('basic1', { 
                card_name: 'Secret Identity'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity']);
        });

        it('should handle multiple quantities of same basic universe card', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 3 }
            ];

            mockAvailableCardsMap.set('basic1', { 
                card_name: 'Secret Identity',
                type: 'Energy',
                value_to_use: '6 or greater',
                bonus: '+2'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.basic_universe).toEqual([
                'Secret Identity - Energy 6 or greater +2',
                'Secret Identity - Energy 6 or greater +2',
                'Secret Identity - Energy 6 or greater +2'
            ]);
        });

        it('should handle basic universe cards missing from availableCardsMap', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 },
                { cardId: 'char1', type: 'character', quantity: 1 }
            ];

            // Don't add basic1 to map - card should be skipped
            // Add at least one other card to ensure export doesn't fail completely
            mockAvailableCardsMap.set('char1', { name: 'Test Character' });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.basic_universe).toEqual([]);
        });

        it('should handle whitespace in type, value_to_use, and bonus fields', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('basic1', { 
                card_name: 'Secret Identity',
                type: ' Energy ',
                value_to_use: ' 6 or greater ',
                bonus: ' +2 '
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity - Energy 6 or greater +2']);
        });

        it('should handle basic universe cards with name field instead of card_name', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('basic1', { 
                name: 'Secret Identity',
                type: 'Energy',
                value_to_use: '6 or greater',
                bonus: '+2'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.basic_universe).toEqual(['Secret Identity - Energy 6 or greater +2']);
        });

        it('should handle multiple different basic universe cards', async () => {
            mockDeckEditorCards = [
                { cardId: 'basic1', type: 'basic-universe', quantity: 1 },
                { cardId: 'basic2', type: 'basic-universe', quantity: 2 },
                { cardId: 'basic3', type: 'basic-universe', quantity: 1 }
            ];

            mockAvailableCardsMap.set('basic1', { 
                card_name: 'Secret Identity',
                type: 'Energy',
                value_to_use: '6 or greater',
                bonus: '+2'
            });
            mockAvailableCardsMap.set('basic2', { 
                card_name: 'Longbow',
                type: 'Combat',
                value_to_use: '7 or greater',
                bonus: '+3'
            });
            mockAvailableCardsMap.set('basic3', { 
                card_name: 'Flintlock',
                type: 'Brute Force',
                value_to_use: '5 or greater',
                bonus: '+1'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const result = getExportedJson();

            expect(result.cards.basic_universe).toEqual([
                'Secret Identity - Energy 6 or greater +2',
                'Longbow - Combat 7 or greater +3',
                'Longbow - Combat 7 or greater +3',
                'Flintlock - Brute Force 5 or greater +1'
            ]);
        });
    });
});


/** @jest-environment jsdom */

/**
 * Deck Export - Tests Using Actual Code
 * 
 * This test file loads and tests the actual deck-export.js file
 * to ensure Jest can track coverage for the real implementation.
 */

import fs from 'fs';
import path from 'path';

// Polyfill for TextEncoder/TextDecoder if needed
if (typeof global.TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
}

describe('Deck Export - Actual Code Tests', () => {
    let mockShowNotification: jest.Mock;
    let mockLoadAvailableCards: jest.Mock;
    let mockValidateDeck: jest.Mock;
    let mockCurrentUser: any;
    let mockDeckEditorCards: any[];
    let mockAvailableCardsMap: Map<string, any>;
    let mockIsDeckLimited: boolean;
    let mockCurrentDeckData: any;
    
    // Functions from the actual file
    let exportDeckAsJson: () => Promise<any>;
    let showExportOverlay: (jsonString: string) => void;
    let closeExportOverlay: () => void;
    let copyJsonToClipboard: () => Promise<void>;

    beforeEach(() => {
        // Mock DOM elements
        document.body.innerHTML = `
            <div id="deckEditorModal">
                <h4>Test Deck Name</h4>
                <div class="deck-description">Test deck description</div>
            </div>
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

        // Mock functions
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
        mockAvailableCardsMap = new Map([
            ['Test Character', { 
                id: 'char-1', 
                name: 'Test Character', 
                type: 'character',
                energy: 5,
                combat: 4,
                brute_force: 3,
                intelligence: 6,
                threat_level: 18
            }]
        ]);

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

        // Load and execute the actual deck-export.js file
        const deckExportPath = path.join(__dirname, '../../public/js/components/deck-export.js');
        const deckExportCode = fs.readFileSync(deckExportPath, 'utf-8');

        // The export code expects these globals to be available
        // It references them directly (e.g., `currentUser`, `showNotification`)
        // So we need to create local variables that shadow window properties
        // or make them available in the execution scope
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

        // Get functions from window after execution
        exportDeckAsJson = (window as any).exportDeckAsJson;
        showExportOverlay = (window as any).showExportOverlay;
        closeExportOverlay = (window as any).closeExportOverlay;
        copyJsonToClipboard = (window as any).copyJsonToClipboard;

        if (!exportDeckAsJson || !showExportOverlay || !closeExportOverlay || !copyJsonToClipboard) {
            throw new Error('Export functions not found on window object');
        }

        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    describe('exportDeckAsJson - Basic Functionality', () => {
        it('should export deck and show overlay', async () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'char-1', quantity: 1 }
            ];

            (window as any).deckEditorCards = mockDeckEditorCards;

            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            // Should show overlay
            const overlay = document.getElementById('exportJsonOverlay');
            expect((overlay as HTMLElement).style.display).toBe('flex');
            
            // Should have JSON content
            const content = document.getElementById('exportJsonContent');
            expect(content?.textContent).toBeTruthy();
            
            // Parse and verify structure
            const jsonString = (overlay as HTMLElement).dataset.jsonString;
            expect(jsonString).toBeTruthy();
            const result = JSON.parse(jsonString!);
            expect(result.name).toBe('Test Deck Name');
            expect(result.description).toBe('Test deck description');
            expect(result.cards).toBeDefined();
        });

        it('should handle empty deck', async () => {
            mockDeckEditorCards = [];
            (window as any).deckEditorCards = [];

            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const overlay = document.getElementById('exportJsonOverlay');
            const jsonString = (overlay as HTMLElement).dataset.jsonString;
            const result = JSON.parse(jsonString!);
            
            expect(result.cards).toBeDefined();
            expect(result.cards.characters).toEqual([]);
        });

        it('should calculate statistics correctly', async () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'char-1', quantity: 1 }
            ];
            // Add character to availableCardsMap with proper stats
            mockAvailableCardsMap.set('char-1', {
                id: 'char-1',
                name: 'Test Character',
                type: 'character',
                energy: 5,
                combat: 4,
                brute_force: 3,
                intelligence: 2,
                threat_level: 18
            });
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            const overlay = document.getElementById('exportJsonOverlay');
            const jsonString = (overlay as HTMLElement).dataset.jsonString;
            expect(jsonString).toBeTruthy();
            const result = JSON.parse(jsonString!);
            
            // Check if stats exist (they might be in the root or a stats object)
            if (result.stats) {
                expect(result.stats.maxEnergy || result.stats.max_energy).toBe(5);
                expect(result.stats.maxCombat || result.stats.max_combat).toBe(4);
                expect(result.stats.totalThreat || result.stats.total_threat).toBe(18);
            } else {
                // Stats are at root level with snake_case
                expect(result.max_energy).toBe(5);
                expect(result.max_combat).toBe(4);
                expect(result.total_threat).toBe(18);
            }
        });
    });

    describe('showExportOverlay - Coverage', () => {
        it('should display overlay and show JSON', () => {
            const testJson = JSON.stringify({ test: 'data' });
            showExportOverlay(testJson);
            const overlay = document.getElementById('exportJsonOverlay');
            expect((overlay as HTMLElement).style.display).toBe('flex');
        });

        it('should handle missing overlay gracefully', () => {
            document.getElementById('exportJsonOverlay')?.remove();
            expect(() => showExportOverlay('{}')).not.toThrow();
        });
    });

    describe('closeExportOverlay - Coverage', () => {
        it('should hide overlay', () => {
            const overlay = document.getElementById('exportJsonOverlay') as HTMLElement;
            overlay.style.display = 'flex';
            closeExportOverlay();
            expect(overlay.style.display).toBe('none');
        });

        it('should handle missing overlay gracefully', () => {
            document.getElementById('exportJsonOverlay')?.remove();
            expect(() => closeExportOverlay()).not.toThrow();
        });
    });

    describe('copyJsonToClipboard - Coverage', () => {
        beforeEach(() => {
            // Mock clipboard API
            Object.assign(navigator, {
                clipboard: {
                    writeText: jest.fn().mockResolvedValue(undefined)
                }
            });
        });

        it('should copy JSON to clipboard', async () => {
            // Set up overlay with JSON data (showExportOverlay sets this)
            const overlay = document.getElementById('exportJsonOverlay') as HTMLElement;
            const preElement = document.getElementById('exportJsonContent') as HTMLPreElement;
            const jsonString = '{"test": "data"}';
            overlay.dataset.jsonString = jsonString;
            preElement.textContent = jsonString;

            const promise = copyJsonToClipboard();
            jest.advanceTimersByTime(100);
            await promise;

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('{"test": "data"}');
        });

        it('should use fallback if clipboard API fails', async () => {
            // Remove clipboard API
            delete (navigator as any).clipboard;
            
            // Mock document.execCommand
            document.execCommand = jest.fn().mockReturnValue(true);
            
            // Set up overlay with JSON data (showExportOverlay sets this)
            const overlay = document.getElementById('exportJsonOverlay') as HTMLElement;
            const preElement = document.getElementById('exportJsonContent') as HTMLPreElement;
            const jsonString = '{"test": "data"}';
            overlay.dataset.jsonString = jsonString;
            preElement.textContent = jsonString;

            const promise = copyJsonToClipboard();
            jest.advanceTimersByTime(100);
            await promise;

            expect(document.execCommand).toHaveBeenCalledWith('copy');
        });
    });

    describe('exportDeckAsJson - Error Handling', () => {
        it('should handle missing card data gracefully', async () => {
            (window as any).availableCardsMap = new Map();
            mockLoadAvailableCards.mockImplementation(() => {
                (window as any).availableCardsMap = new Map(); // Still empty
                return Promise.resolve();
            });

            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockShowNotification).toHaveBeenCalledWith(
                'Card data not loaded. Please refresh the page and try again.',
                'error'
            );
        });

        it('should load cards if map is empty', async () => {
            (window as any).availableCardsMap = new Map();
            mockLoadAvailableCards.mockImplementation(() => {
                (window as any).availableCardsMap = mockAvailableCardsMap;
                return Promise.resolve();
            });

            const promise = exportDeckAsJson();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockLoadAvailableCards).toHaveBeenCalled();
        });
    });
});


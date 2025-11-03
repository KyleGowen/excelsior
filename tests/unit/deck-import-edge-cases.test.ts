/** @jest-environment jsdom */

/**
 * Unit Tests for Deck Import Edge Cases
 * 
 * Tests cover edge cases and less common paths:
 * - Already in deck detection (alreadyInDeck building)
 * - Unknown card types (continue path)
 * - Empty currentDeckCards handling
 * - Mixed card type scenarios
 */

// Polyfill for TextEncoder/TextDecoder if needed
if (typeof global.TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
}

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Deck Import Edge Cases', () => {
    let dom: JSDOM;
    let mockShowNotification: jest.Mock;
    let mockAddCardToEditor: jest.Mock;
    let mockCloseImportOverlay: jest.Mock;
    let mockValidateDeck: jest.Mock;
    let mockLoadAvailableCards: jest.Mock;
    let processImportDeck: () => Promise<void>;

    beforeEach(() => {
        // Create JSDOM instance
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost',
            pretendToBeVisual: true,
            resources: 'usable'
        });

        global.window = dom.window as any;
        global.document = dom.window.document;

        // Mock functions
        mockShowNotification = jest.fn();
        mockAddCardToEditor = jest.fn().mockResolvedValue(undefined);
        mockCloseImportOverlay = jest.fn();
        mockValidateDeck = jest.fn().mockReturnValue({ errors: [], warnings: [] });
        mockLoadAvailableCards = jest.fn().mockResolvedValue(undefined);

        // Set up global mocks BEFORE loading code so they're available
        (dom.window as any).showNotification = mockShowNotification;
        (dom.window as any).addCardToEditor = mockAddCardToEditor;
        (dom.window as any).closeImportOverlay = mockCloseImportOverlay;
        (dom.window as any).validateDeck = mockValidateDeck;
        (dom.window as any).loadAvailableCards = mockLoadAvailableCards;
        (dom.window as any).availableCardsMap = new Map();
        (dom.window as any).deckEditorCards = [];
        (dom.window as any).renderDeckCardsCardView = jest.fn();
        (dom.window as any).renderDeckCardsListView = jest.fn();

        // Load the deck-import.js file
        const deckImportPath = path.join(__dirname, '../../public/js/components/deck-import.js');
        const deckImportCode = fs.readFileSync(deckImportPath, 'utf-8');
        
        // Execute the code
        const executeInContext = new dom.window.Function(
            'window', 
            'document', 
            'navigator',
            'showNotification',
            'addCardToEditor',
            'closeImportOverlay',
            'validateDeck',
            'loadAvailableCards',
            'renderDeckCardsCardView',
            'renderDeckCardsListView',
            deckImportCode
        );
        executeInContext(
            dom.window, 
            dom.window.document, 
            dom.window.navigator,
            mockShowNotification,
            mockAddCardToEditor,
            mockCloseImportOverlay,
            mockValidateDeck,
            mockLoadAvailableCards,
            (dom.window as any).renderDeckCardsCardView,
            (dom.window as any).renderDeckCardsListView
        );

        // Get the function from window
        processImportDeck = (dom.window as any).processImportDeck;

        if (!processImportDeck) {
            throw new Error('processImportDeck function not found on window object');
        }

        // Use fake timers
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        dom.window.close();
    });

    describe('Already in deck detection', () => {
        beforeEach(() => {
            dom.window.document.body.innerHTML = `
                <textarea id="importJsonContent"></textarea>
                <div id="importErrorMessages"></div>
                <button id="importJsonButton"></button>
                <input type="hidden" id="viewMode" value="card">
            `;
        });

        it('should build alreadyInDeck set from existing deck cards', async () => {
            // Set up existing deck cards
            (dom.window as any).deckEditorCards = [
                { type: 'character', cardId: 'char-1', quantity: 1 },
                { type: 'location', cardId: 'loc-1', quantity: 1 },
                { type: 'special', cardId: 'spec-1', quantity: 2 }
            ];

            (dom.window as any).availableCardsMap = new Map([
                ['Test Character', { id: 'char-2', name: 'Test Character', type: 'character' }]
            ]);

            const textarea = dom.window.document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    characters: ['Test Character']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Should add the new character (char-2) since it's not in the deck
            expect(mockAddCardToEditor).toHaveBeenCalledWith(
                'character',
                'char-2',
                'Test Character',
                null
            );
        });

        it('should skip cards that are already in deck', async () => {
            // Set up existing deck cards
            (dom.window as any).deckEditorCards = [
                { type: 'character', cardId: 'char-1', quantity: 1 },
                { type: 'location', cardId: 'loc-1', quantity: 1 }
            ];

            (dom.window as any).availableCardsMap = new Map([
                ['Existing Character', { id: 'char-1', name: 'Existing Character', type: 'character' }]
            ]);

            const textarea = dom.window.document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    characters: ['Existing Character']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Should NOT add the character since it's already in deck
            expect(mockAddCardToEditor).not.toHaveBeenCalled();
        });

        it('should handle empty deckEditorCards array', async () => {
            (dom.window as any).deckEditorCards = [];
            (dom.window as any).availableCardsMap = new Map([
                ['Test Character', { id: 'char-1', name: 'Test Character', type: 'character' }]
            ]);

            const textarea = dom.window.document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    characters: ['Test Character']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Should add the character since deck is empty
            expect(mockAddCardToEditor).toHaveBeenCalled();
        });

        it('should handle undefined deckEditorCards', async () => {
            (dom.window as any).deckEditorCards = undefined;
            (dom.window as any).availableCardsMap = new Map([
                ['Test Character', { id: 'char-1', name: 'Test Character', type: 'character' }]
            ]);

            const textarea = dom.window.document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    characters: ['Test Character']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Should add the character since deck is undefined
            expect(mockAddCardToEditor).toHaveBeenCalled();
        });
    });

    describe('Unknown card types', () => {
        beforeEach(() => {
            dom.window.document.body.innerHTML = `
                <textarea id="importJsonContent"></textarea>
                <div id="importErrorMessages"></div>
                <button id="importJsonButton"></button>
                <input type="hidden" id="viewMode" value="card">
            `;
        });

        it('should skip unknown card types', async () => {
            (dom.window as any).availableCardsMap = new Map();
            
            const textarea = dom.window.document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    unknown_type: ['Unknown Card']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Should not try to add unknown card types
            expect(mockAddCardToEditor).not.toHaveBeenCalled();
        });

        it('should process known card types and skip unknown ones', async () => {
            (dom.window as any).availableCardsMap = new Map([
                ['Test Character', { id: 'char-1', name: 'Test Character', type: 'character' }]
            ]);
            
            const textarea = dom.window.document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    characters: ['Test Character'],
                    unknown_type: ['Unknown Card']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Should only add the known character type, not the unknown type
            expect(mockAddCardToEditor).toHaveBeenCalledTimes(1);
            expect(mockAddCardToEditor).toHaveBeenCalledWith(
                'character',
                'char-1',
                'Test Character',
                null
            );
        });
    });

    describe('Mixed scenarios', () => {
        beforeEach(() => {
            dom.window.document.body.innerHTML = `
                <textarea id="importJsonContent"></textarea>
                <div id="importErrorMessages"></div>
                <button id="importJsonButton"></button>
                <input type="hidden" id="viewMode" value="card">
            `;
        });

        it('should handle import with existing cards of different types', async () => {
            (dom.window as any).deckEditorCards = [
                { type: 'character', cardId: 'char-existing', quantity: 1 }
            ];

            (dom.window as any).availableCardsMap = new Map([
                ['New Character', { id: 'char-new', name: 'New Character', type: 'character' }],
                ['Existing Character', { id: 'char-existing', name: 'Existing Character', type: 'character' }],
                // Also add by ID for lookup
                ['char-new', { id: 'char-new', name: 'New Character', type: 'character' }],
                ['char-existing', { id: 'char-existing', name: 'Existing Character', type: 'character' }]
            ]);

            const textarea = dom.window.document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    characters: ['New Character', 'Existing Character']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Should add new character, but skip existing character
            expect(mockAddCardToEditor).toHaveBeenCalledTimes(1);
            expect(mockAddCardToEditor).toHaveBeenCalledWith('character', 'char-new', 'New Character', null);
            expect(mockAddCardToEditor).not.toHaveBeenCalledWith('character', 'char-existing', expect.anything(), expect.anything());
        });

        it('should handle cards with missing cardId in deckEditorCards', async () => {
            // Edge case: deck card without cardId
            (dom.window as any).deckEditorCards = [
                { type: 'character', quantity: 1 } // Missing cardId
            ];

            (dom.window as any).availableCardsMap = new Map([
                ['Test Character', { id: 'char-1', name: 'Test Character', type: 'character' }]
            ]);

            const textarea = dom.window.document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    characters: ['Test Character']
                }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Should still process the import (the missing cardId won't match)
            expect(mockAddCardToEditor).toHaveBeenCalled();
        });
    });
});


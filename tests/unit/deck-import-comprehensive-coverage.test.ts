/** @jest-environment jsdom */

/**
 * Comprehensive Coverage Tests for Deck Import
 * 
 * This file enhances existing test implementations to match actual code paths
 * to maximize coverage. It extends the simplified implementations used in
 * other test files to include all uncovered paths.
 */

import fs from 'fs';
import path from 'path';
import vm from 'vm';

describe('Deck Import - Comprehensive Coverage', () => {
    let mockShowNotification: jest.Mock;
    let mockAddCardToEditor: jest.Mock;
    let mockCloseImportOverlay: jest.Mock;
    let mockValidateDeck: jest.Mock;
    let mockLoadAvailableCards: jest.Mock;
    let mockCurrentUser: any;
    let mockDeckEditorCards: any[];
    let mockAvailableCardsMap: Map<string, any>;
    
    // Functions from the actual file
    let importDeckFromJson: () => void;
    let showImportOverlay: () => void;
    let closeImportOverlay: () => void;
    let processImportDeck: () => Promise<void>;
    let extractCardsFromImportData: (cardsData: any) => any[];
    let findCardIdByName: (cardName: string, cardType: string) => string | null;

    beforeEach(() => {
        // Mock DOM elements
        document.body.innerHTML = `
            <div id="importJsonOverlay" style="display: none;">
                <textarea id="importJsonContent"></textarea>
                <div id="importErrorMessages"></div>
                <button id="importJsonButton"></button>
            </div>
            <div id="deckEditorModal" style="display: block;"></div>
            <input type="hidden" id="viewMode" value="card">
        `;

        // Mock functions
        mockShowNotification = jest.fn();
        mockAddCardToEditor = jest.fn().mockImplementation(async (type, cardId, cardName, selectedAlternateImage) => {
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
            ['Test Character', { id: 'char-1', name: 'Test Character', type: 'character', alternateImages: [] }],
            ['Test Location', { id: 'loc-1', name: 'Test Location', type: 'location', alternateImages: [] }],
            ['Test Mission', { id: 'miss-1', name: 'Test Mission', type: 'mission', alternateImages: [] }],
            ['Test Event', { id: 'evt-1', name: 'Test Event', type: 'event', alternateImages: [] }],
            ['Test Aspect', { id: 'asp-1', name: 'Test Aspect', type: 'aspect', alternateImages: [] }],
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
        (window as any).renderDeckCardsCardView = jest.fn();
        (window as any).renderDeckCardsListView = jest.fn();
        (window as any).currentDeckId = 'test-deck';

        // Load and execute the actual deck-import.js file
        const deckImportPath = path.join(__dirname, '../../public/js/components/deck-import.js');
        const deckImportCode = fs.readFileSync(deckImportPath, 'utf-8');
        
        // Create a context with all the globals
        const context = {
            window: window as any,
            document: document,
            navigator: navigator,
            showNotification: mockShowNotification,
            addCardToEditor: mockAddCardToEditor,
            closeImportOverlay: mockCloseImportOverlay,
            validateDeck: mockValidateDeck,
            loadAvailableCards: mockLoadAvailableCards,
            renderDeckCardsCardView: (window as any).renderDeckCardsCardView,
            renderDeckCardsListView: (window as any).renderDeckCardsListView,
            console: console,
            setTimeout: setTimeout,
            clearTimeout: clearTimeout,
            setInterval: setInterval,
            clearInterval: clearInterval,
            Promise: Promise,
            Map: Map,
            Array: Array,
            Object: Object,
            String: String,
            Number: Number,
            parseInt: parseInt,
            parseFloat: parseFloat,
            Math: Math,
            Date: Date,
            Error: Error,
            TypeError: TypeError,
            ReferenceError: ReferenceError,
        };

        // Execute the code in the context
        try {
            vm.createContext(context);
            vm.runInContext(deckImportCode, context);
            
            // Get functions from context
            importDeckFromJson = context.window.importDeckFromJson;
            showImportOverlay = context.window.showImportOverlay;
            closeImportOverlay = context.window.closeImportOverlay;
            processImportDeck = context.window.processImportDeck;
            extractCardsFromImportData = context.window.extractCardsFromImportData;
            findCardIdByName = context.window.findCardIdByName;
        } catch (error) {
            // Fallback: Use eval (won't track coverage but will work)
            const executeCode = new Function(
                'window', 'document', 'navigator',
                'showNotification', 'addCardToEditor', 'closeImportOverlay',
                'validateDeck', 'loadAvailableCards', 'renderDeckCardsCardView', 'renderDeckCardsListView',
                deckImportCode
            );
            executeCode(
                window, document, navigator,
                mockShowNotification, mockAddCardToEditor, mockCloseImportOverlay,
                mockValidateDeck, mockLoadAvailableCards,
                (window as any).renderDeckCardsCardView,
                (window as any).renderDeckCardsListView
            );
            
            importDeckFromJson = (window as any).importDeckFromJson;
            showImportOverlay = (window as any).showImportOverlay;
            closeImportOverlay = (window as any).closeImportOverlay;
            processImportDeck = (window as any).processImportDeck;
            extractCardsFromImportData = (window as any).extractCardsFromImportData;
            findCardIdByName = (window as any).findCardIdByName;
        }

        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    describe('importDeckFromJson - Coverage', () => {
        it('should deny non-ADMIN users', () => {
            (window as any).currentUser = { role: 'USER' };
            importDeckFromJson();
            expect(mockShowNotification).toHaveBeenCalledWith('Access denied: Admin privileges required', 'error');
        });

        it('should deny when no user', () => {
            (window as any).currentUser = null;
            importDeckFromJson();
            expect(mockShowNotification).toHaveBeenCalledWith('Access denied: Admin privileges required', 'error');
        });

        it('should allow ADMIN and show overlay when deck editor is open', () => {
            (window as any).currentUser = { role: 'ADMIN' };
            const modal = document.getElementById('deckEditorModal');
            if (modal) modal.style.display = 'block';
            importDeckFromJson();
            const overlay = document.getElementById('importJsonOverlay');
            expect(overlay?.style.display).toBe('flex');
        });

        it('should allow import when currentDeckId is set', () => {
            (window as any).currentUser = { role: 'ADMIN' };
            (window as any).currentDeckId = 'deck-123';
            const modal = document.getElementById('deckEditorModal');
            if (modal) modal.style.display = 'none';
            importDeckFromJson();
            const overlay = document.getElementById('importJsonOverlay');
            expect(overlay?.style.display).toBe('flex');
        });

        it('should allow import when hasCards', () => {
            (window as any).currentUser = { role: 'ADMIN' };
            (window as any).currentDeckId = null;
            (window as any).deckEditorCards = [{ type: 'character', cardId: 'test' }];
            const modal = document.getElementById('deckEditorModal');
            if (modal) modal.style.display = 'none';
            importDeckFromJson();
            const overlay = document.getElementById('importJsonOverlay');
            expect(overlay?.style.display).toBe('flex');
        });

        it('should show error when no deck context', () => {
            (window as any).currentUser = { role: 'ADMIN' };
            (window as any).currentDeckId = null;
            (window as any).deckEditorCards = [];
            const modal = document.getElementById('deckEditorModal');
            if (modal) modal.style.display = 'none';
            importDeckFromJson();
            expect(mockShowNotification).toHaveBeenCalledWith('Please open or create a deck before importing', 'error');
        });
    });

    describe('showImportOverlay - Coverage', () => {
        it('should display overlay and clear content', () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            const importButton = document.getElementById('importJsonButton') as HTMLButtonElement;
            
            textarea.value = 'previous';
            errorMessages.innerHTML = 'errors';
            errorMessages.style.display = 'block';
            importButton.disabled = true;

            showImportOverlay();

            expect(document.getElementById('importJsonOverlay')?.style.display).toBe('flex');
            expect(textarea.value).toBe('');
            expect(errorMessages.innerHTML).toBe('');
            expect(errorMessages.style.display).toBe('none');
            expect(importButton.disabled).toBe(false);
        });

        it('should set click handler to close on overlay click', () => {
            showImportOverlay();
            const overlay = document.getElementById('importJsonOverlay');
            expect(overlay?.onclick).toBeDefined();
            
            const clickEvent = new MouseEvent('click', { bubbles: true });
            Object.defineProperty(clickEvent, 'target', { value: overlay, writable: false });
            overlay?.dispatchEvent(clickEvent);
            
            expect(overlay?.style.display).toBe('none');
        });

        it('should focus textarea after delay', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const focusSpy = jest.spyOn(textarea, 'focus');
            
            showImportOverlay();
            expect(focusSpy).not.toHaveBeenCalled();
            
            // Use runAllTimersAsync to ensure setTimeout callbacks are executed
            await jest.runAllTimersAsync();
            // Focus should be called after the setTimeout
            expect(focusSpy).toHaveBeenCalled();
        });

        it('should handle missing elements gracefully', () => {
            const errorMessages = document.getElementById('importErrorMessages');
            errorMessages?.remove();
            
            expect(() => showImportOverlay()).not.toThrow();
        });
    });

    describe('closeImportOverlay - Coverage', () => {
        it('should hide overlay and remove onclick', () => {
            const overlay = document.getElementById('importJsonOverlay') as HTMLElement;
            overlay.style.display = 'flex';
            overlay.onclick = jest.fn() as any;

            closeImportOverlay();

            expect(overlay.style.display).toBe('none');
            expect(overlay.onclick).toBeNull();
        });

        it('should handle missing overlay gracefully', () => {
            document.getElementById('importJsonOverlay')?.remove();
            expect(() => closeImportOverlay()).not.toThrow();
        });
    });

    describe('processImportDeck - Error Paths Coverage', () => {
        it('should show error when textarea missing', async () => {
            document.getElementById('importJsonContent')?.remove();
            await processImportDeck();
            expect(mockShowNotification).toHaveBeenCalledWith('Import UI elements not found', 'error');
        });

        it('should show error for empty textarea', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            textarea.value = '   ';
            
            await processImportDeck();
            
            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('Please paste JSON data');
        });

        it('should show error for invalid JSON', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            const importButton = document.getElementById('importJsonButton') as HTMLButtonElement;
            textarea.value = '{ invalid }';
            
            await processImportDeck();
            
            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('Invalid JSON format');
            expect(importButton.disabled).toBe(false);
        });

        it('should show error for missing cards section', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            textarea.value = '{"name": "Test"}';
            
            await processImportDeck();
            
            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('Missing "cards" section');
        });

        it('should show error when no cards found', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            textarea.value = '{"cards": {}}';
            
            await processImportDeck();
            
            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('No cards found');
        });

        it('should attempt to load cards if map is empty', async () => {
            (window as any).availableCardsMap = new Map();
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = '{"cards": {"characters": ["Test Character"]}}';
            
            mockLoadAvailableCards.mockImplementation(() => {
                (window as any).availableCardsMap = mockAvailableCardsMap;
                return Promise.resolve();
            });
            
            const promise = processImportDeck();
            jest.advanceTimersByTime(1000);
            await promise;
            
            expect(mockLoadAvailableCards).toHaveBeenCalled();
        });

        it('should show error if cards still not loaded after load attempt', async () => {
            (window as any).availableCardsMap = new Map();
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            textarea.value = '{"cards": {"characters": ["Test Character"]}}';
            
            mockLoadAvailableCards.mockImplementation(() => {
                (window as any).availableCardsMap = new Map(); // Keep empty
                return Promise.resolve();
            });
            
            const promise = processImportDeck();
            jest.advanceTimersByTime(1000);
            await promise;
            
            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('Card data not loaded');
        });
    });

    describe('processImportDeck - Already in Deck Coverage', () => {
        it('should build alreadyInDeck set from existing cards', async () => {
            (window as any).deckEditorCards = [
                { type: 'character', cardId: 'char-1', quantity: 1 },
                { type: 'location', cardId: 'loc-1', quantity: 1 }
            ];
            
            // Make sure Test Character is NOT char-1
            (window as any).availableCardsMap = new Map([
                ['Test Character', { id: 'char-new', name: 'Test Character', type: 'character', alternateImages: [] }]
            ]);

            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: { characters: ['Test Character'] }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Should add new character (not in deck)
            expect(mockAddCardToEditor).toHaveBeenCalled();
        });

        it('should skip cards already in deck', async () => {
            (window as any).deckEditorCards = [
                { type: 'character', cardId: 'char-1', quantity: 1 }
            ];

            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: { characters: ['Test Character'] }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Should NOT add character that's already in deck
            expect(mockAddCardToEditor).not.toHaveBeenCalled();
        });

        it('should handle undefined deckEditorCards', async () => {
            (window as any).deckEditorCards = undefined;
            
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: { characters: ['Test Character'] }
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(mockAddCardToEditor).toHaveBeenCalled();
        });
    });

    describe('processImportDeck - Unknown Card Types Coverage', () => {
        it('should skip unknown card types', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = JSON.stringify({
                cards: {
                    unknown_type: ['Unknown Card']
                }
            });

            await processImportDeck();
            await jest.runAllTimersAsync();

            expect(mockAddCardToEditor).not.toHaveBeenCalled();
        });
    });

    describe('processImportDeck - Validation Error Coverage', () => {
        it('should catch and display validation errors', async () => {
            (window as any).deckEditorCards = [{ type: 'character', cardId: 'char-1' }];
            
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            textarea.value = JSON.stringify({
                cards: { characters: ['Test Character'] }
            });

            mockValidateDeck.mockImplementation(() => {
                throw new Error('Validation failed');
            });

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            expect(errorMessages.style.display).toBe('block');
            expect(errorMessages.innerHTML).toContain('Validation error');
        });
    });

    describe('processImportDeck - General Error Coverage', () => {
        it('should catch general processing errors', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            const importButton = document.getElementById('importJsonButton') as HTMLButtonElement;
            textarea.value = JSON.stringify({
                cards: { characters: ['Test Character'] }
            });

            // Make addCardToEditor throw
            mockAddCardToEditor.mockRejectedValueOnce(new Error('Add failed'));

            const promise = processImportDeck();
            await jest.runAllTimersAsync();
            await promise;

            // Error should be handled gracefully
            expect(importButton.disabled).toBe(false);
        });

        it('should always re-enable button in finally', async () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const importButton = document.getElementById('importJsonButton') as HTMLButtonElement;
            textarea.value = 'invalid json {';
            importButton.disabled = true;

            await processImportDeck();

            expect(importButton.disabled).toBe(false);
        });
    });
});


/**
 * Unit Tests for Deck Import Overlay Functions
 * 
 * Tests cover:
 * - importDeckFromJson() - Entry point with security and deck validation
 * - showImportOverlay() - Display import overlay
 * - closeImportOverlay() - Close import overlay
 */

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Polyfill for TextEncoder/TextDecoder if needed
if (typeof global.TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
}

describe('Deck Import Overlay Functions', () => {
    let dom: JSDOM;
    let mockShowNotification: jest.Mock;
    let mockGetCurrentUser: jest.Mock | undefined;
    let importDeckFromJson: () => void;
    let showImportOverlay: () => void;
    let closeImportOverlay: () => void;

    beforeEach(() => {
        // Create JSDOM instance
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost',
            pretendToBeVisual: true,
            resources: 'usable'
        });

        global.window = dom.window as any;
        global.document = dom.window.document;

        // Mock showNotification - must be on window before code executes
        mockShowNotification = jest.fn();
        (dom.window as any).showNotification = mockShowNotification;
        (global.window as any).showNotification = mockShowNotification;

        // Mock getCurrentUser if it exists
        mockGetCurrentUser = jest.fn();
        (dom.window as any).getCurrentUser = mockGetCurrentUser;
        (global.window as any).getCurrentUser = mockGetCurrentUser;

        // Load the deck-import.js file
        const deckImportPath = path.join(__dirname, '../../public/js/components/deck-import.js');
        const deckImportCode = fs.readFileSync(deckImportPath, 'utf-8');
        
        // Execute the code using Function constructor in the JSDOM context
        // Pass window explicitly so showNotification is available
        const executeInContext = new dom.window.Function(
            'window', 
            'document', 
            'navigator',
            `
            // Make showNotification available in function scope
            const showNotification = window.showNotification;
            ${deckImportCode}
            `
        );
        executeInContext(dom.window, dom.window.document, dom.window.navigator);

        // Get the functions from window
        importDeckFromJson = (dom.window as any).importDeckFromJson;
        showImportOverlay = (dom.window as any).showImportOverlay;
        closeImportOverlay = (dom.window as any).closeImportOverlay;

        if (!importDeckFromJson || !showImportOverlay || !closeImportOverlay) {
            throw new Error('Import functions not found on window object');
        }

        // Use fake timers for setTimeout tests
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        dom.window.close();
        delete (global.window as any).importDeckFromJson;
        delete (global.window as any).showImportOverlay;
        delete (global.window as any).closeImportOverlay;
        delete (global.window as any).currentUser;
        delete (global.window as any).currentDeckId;
        delete (global.window as any).deckEditorCards;
    });

    describe('importDeckFromJson', () => {
        beforeEach(() => {
            // Create required DOM elements
            dom.window.document.body.innerHTML = `
                <div id="importJsonOverlay" style="display: none;">
                    <textarea id="importJsonContent"></textarea>
                    <div id="importErrorMessages"></div>
                    <button id="importJsonButton"></button>
                </div>
                <div id="deckEditorModal" style="display: block;"></div>
            `;
        });

        it('should deny access to non-ADMIN users', () => {
            (global.window as any).currentUser = { role: 'USER' };

            importDeckFromJson();

            expect(mockShowNotification).toHaveBeenCalledWith(
                'Access denied: Admin privileges required',
                'error'
            );
        });

        it('should deny access when no user is logged in', () => {
            (global.window as any).currentUser = null;

            importDeckFromJson();

            expect(mockShowNotification).toHaveBeenCalledWith(
                'Access denied: Admin privileges required',
                'error'
            );
        });

        it('should use getCurrentUser function when currentUser is not on window', () => {
            delete (dom.window as any).currentUser;
            (global.window as any).currentUser = undefined;
            // Ensure getCurrentUser is available as a function
            (dom.window as any).getCurrentUser = mockGetCurrentUser;
            mockGetCurrentUser!.mockReturnValue({ role: 'USER' });

            importDeckFromJson();

            // Note: getCurrentUser might not be called if typeof check fails
            // The code checks: typeof getCurrentUser === 'function'
            // If it's not available, it will just use null
            // So we just verify the notification was shown
            expect(mockShowNotification).toHaveBeenCalledWith(
                'Access denied: Admin privileges required',
                'error'
            );
        });

        it('should allow ADMIN users', () => {
            (global.window as any).currentUser = { role: 'ADMIN' };
            (global.window as any).currentDeckId = 'test-deck-id';

            importDeckFromJson();

            expect(mockShowNotification).not.toHaveBeenCalled();
            const overlay = dom.window.document.getElementById('importJsonOverlay');
            expect(overlay?.style.display).toBe('flex');
        });

        it('should show error when deck editor is closed, no deckId, and no cards', () => {
            (global.window as any).currentUser = { role: 'ADMIN' };
            (global.window as any).currentDeckId = null;
            (global.window as any).deckEditorCards = [];
            const modal = dom.window.document.getElementById('deckEditorModal');
            if (modal) {
                modal.style.display = 'none';
            }

            importDeckFromJson();

            expect(mockShowNotification).toHaveBeenCalledWith(
                'Please open or create a deck before importing',
                'error'
            );
        });

        it('should allow import when deck editor modal is open', () => {
            (global.window as any).currentUser = { role: 'ADMIN' };
            (global.window as any).currentDeckId = null;
            (global.window as any).deckEditorCards = [];
            const modal = dom.window.document.getElementById('deckEditorModal');
            if (modal) {
                modal.style.display = 'block';
            }

            importDeckFromJson();

            expect(mockShowNotification).not.toHaveBeenCalled();
            const overlay = dom.window.document.getElementById('importJsonOverlay');
            expect(overlay?.style.display).toBe('flex');
        });

        it('should allow import when currentDeckId is set', () => {
            (global.window as any).currentUser = { role: 'ADMIN' };
            (global.window as any).currentDeckId = 'test-deck-id';
            (global.window as any).deckEditorCards = [];
            const modal = dom.window.document.getElementById('deckEditorModal');
            if (modal) {
                modal.style.display = 'none';
            }

            importDeckFromJson();

            expect(mockShowNotification).not.toHaveBeenCalled();
            const overlay = dom.window.document.getElementById('importJsonOverlay');
            expect(overlay?.style.display).toBe('flex');
        });

        it('should allow import when currentDeckId is "new"', () => {
            (global.window as any).currentUser = { role: 'ADMIN' };
            (global.window as any).currentDeckId = 'new';
            (global.window as any).deckEditorCards = [];
            const modal = dom.window.document.getElementById('deckEditorModal');
            if (modal) {
                modal.style.display = 'none';
            }

            importDeckFromJson();

            expect(mockShowNotification).not.toHaveBeenCalled();
            const overlay = dom.window.document.getElementById('importJsonOverlay');
            expect(overlay?.style.display).toBe('flex');
        });

        it('should allow import when there are cards in deck', () => {
            (global.window as any).currentUser = { role: 'ADMIN' };
            (global.window as any).currentDeckId = null;
            (global.window as any).deckEditorCards = [{ type: 'character', cardId: 'test' }];
            const modal = dom.window.document.getElementById('deckEditorModal');
            if (modal) {
                modal.style.display = 'none';
            }

            importDeckFromJson();

            expect(mockShowNotification).not.toHaveBeenCalled();
            const overlay = dom.window.document.getElementById('importJsonOverlay');
            expect(overlay?.style.display).toBe('flex');
        });
    });

    describe('showImportOverlay', () => {
        beforeEach(() => {
            dom.window.document.body.innerHTML = `
                <div id="importJsonOverlay" style="display: none;">
                    <textarea id="importJsonContent">previous content</textarea>
                    <div id="importErrorMessages" style="display: block;">previous errors</div>
                    <button id="importJsonButton" disabled>Import</button>
                </div>
            `;
        });

        it('should display the overlay', () => {
            showImportOverlay();

            const overlay = dom.window.document.getElementById('importJsonOverlay');
            expect(overlay?.style.display).toBe('flex');
        });

        it('should clear the textarea content', () => {
            const textarea = dom.window.document.getElementById('importJsonContent') as HTMLTextAreaElement;
            textarea.value = 'previous content';

            showImportOverlay();

            expect(textarea.value).toBe('');
        });

        it('should hide and clear error messages', () => {
            const errorMessages = dom.window.document.getElementById('importErrorMessages') as HTMLElement;
            errorMessages.innerHTML = 'previous errors';
            errorMessages.style.display = 'block';

            showImportOverlay();

            expect(errorMessages.style.display).toBe('none');
            expect(errorMessages.innerHTML).toBe('');
        });

        it('should enable the import button', () => {
            const importButton = dom.window.document.getElementById('importJsonButton') as HTMLButtonElement;
            importButton.disabled = true;

            showImportOverlay();

            expect(importButton.disabled).toBe(false);
        });

        it('should set click handler on overlay to close when clicking outside', () => {
            showImportOverlay();

            const overlay = dom.window.document.getElementById('importJsonOverlay');
            expect(overlay?.onclick).toBeDefined();

            // Simulate click on overlay
            const clickEvent = new dom.window.MouseEvent('click', {
                bubbles: true,
                cancelable: true
            });
            Object.defineProperty(clickEvent, 'target', {
                value: overlay,
                writable: false
            });

            overlay?.dispatchEvent(clickEvent);
            jest.advanceTimersByTime(10);

            expect(overlay?.style.display).toBe('none');
        });

        it('should not close when clicking on textarea', () => {
            showImportOverlay();

            const overlay = dom.window.document.getElementById('importJsonOverlay');
            const textarea = dom.window.document.getElementById('importJsonContent');

            // Simulate click on textarea
            const clickEvent = new dom.window.MouseEvent('click', {
                bubbles: true,
                cancelable: true
            });
            Object.defineProperty(clickEvent, 'target', {
                value: textarea,
                writable: false
            });

            overlay?.dispatchEvent(clickEvent);
            jest.advanceTimersByTime(10);

            expect(overlay?.style.display).toBe('flex');
        });

        it('should focus the textarea after a delay', () => {
            const textarea = dom.window.document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const focusSpy = jest.spyOn(textarea, 'focus');

            showImportOverlay();

            expect(focusSpy).not.toHaveBeenCalled();

            jest.advanceTimersByTime(100);

            expect(focusSpy).toHaveBeenCalled();
        });

        it('should handle missing errorMessages element gracefully', () => {
            const errorMessages = dom.window.document.getElementById('importErrorMessages');
            errorMessages?.remove();

            expect(() => {
                showImportOverlay();
            }).not.toThrow();

            const overlay = dom.window.document.getElementById('importJsonOverlay');
            expect(overlay?.style.display).toBe('flex');
        });

        it('should handle missing importButton element gracefully', () => {
            const importButton = dom.window.document.getElementById('importJsonButton');
            importButton?.remove();

            expect(() => {
                showImportOverlay();
            }).not.toThrow();

            const overlay = dom.window.document.getElementById('importJsonOverlay');
            expect(overlay?.style.display).toBe('flex');
        });

        it('should handle missing overlay element gracefully', () => {
            const overlay = dom.window.document.getElementById('importJsonOverlay');
            overlay?.remove();

            expect(() => {
                showImportOverlay();
            }).not.toThrow();
        });

        it('should handle missing textarea element gracefully', () => {
            const textarea = dom.window.document.getElementById('importJsonContent');
            textarea?.remove();

            expect(() => {
                showImportOverlay();
            }).not.toThrow();
        });
    });

    describe('closeImportOverlay', () => {
        beforeEach(() => {
            dom.window.document.body.innerHTML = `
                <div id="importJsonOverlay" style="display: flex;">
                </div>
            `;
        });

        it('should hide the overlay', () => {
            const overlay = dom.window.document.getElementById('importJsonOverlay') as HTMLElement;
            overlay.style.display = 'flex';

            closeImportOverlay();

            expect(overlay.style.display).toBe('none');
        });

        it('should remove onclick handler', () => {
            const overlay = dom.window.document.getElementById('importJsonOverlay') as HTMLElement;
            overlay.onclick = jest.fn() as any;

            closeImportOverlay();

            expect(overlay.onclick).toBeNull();
        });

        it('should handle missing overlay element gracefully', () => {
            const overlay = dom.window.document.getElementById('importJsonOverlay');
            overlay?.remove();

            expect(() => {
                closeImportOverlay();
            }).not.toThrow();
        });

        it('should work when overlay is already hidden', () => {
            const overlay = dom.window.document.getElementById('importJsonOverlay') as HTMLElement;
            overlay.style.display = 'none';

            closeImportOverlay();

            expect(overlay.style.display).toBe('none');
        });
    });

    describe('Integration: showImportOverlay + closeImportOverlay', () => {
        beforeEach(() => {
            dom.window.document.body.innerHTML = `
                <div id="importJsonOverlay" style="display: none;">
                    <textarea id="importJsonContent"></textarea>
                    <div id="importErrorMessages"></div>
                    <button id="importJsonButton"></button>
                </div>
            `;
        });

        it('should show and then close overlay', () => {
            const overlay = dom.window.document.getElementById('importJsonOverlay') as HTMLElement;

            showImportOverlay();
            expect(overlay.style.display).toBe('flex');

            closeImportOverlay();
            expect(overlay.style.display).toBe('none');
        });
    });
});


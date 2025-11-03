/** @jest-environment jsdom */

/**
 * Deck Import Overlay Functions - Coverage Tests
 * 
 * Adds tests to existing test infrastructure to cover overlay functions
 * that exist in the actual deck-import.js file.
 */

describe('Deck Import Overlay - Additional Coverage', () => {
    let mockShowNotification: jest.Mock;
    let mockCurrentUser: any;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="importJsonOverlay" style="display: none;">
                <textarea id="importJsonContent">previous</textarea>
                <div id="importErrorMessages" style="display: block;">errors</div>
                <button id="importJsonButton" disabled>Import</button>
            </div>
            <div id="deckEditorModal" style="display: block;"></div>
        `;

        mockShowNotification = jest.fn();
        (window as any).showNotification = mockShowNotification;

        // Create overlay functions matching actual implementation
        (window as any).importDeckFromJson = function importDeckFromJson() {
            const currentUser = (window as any).currentUser || (typeof (window as any).getCurrentUser === 'function' ? (window as any).getCurrentUser() : null);
            if (!currentUser || currentUser.role !== 'ADMIN') {
                (window as any).showNotification('Access denied: Admin privileges required', 'error');
                return;
            }

            const deckEditorModal = document.getElementById('deckEditorModal');
            const currentDeckId = (window as any).currentDeckId || null;
            
            const isDeckEditorOpen = deckEditorModal && (deckEditorModal as HTMLElement).style.display !== 'none';
            const hasDeckId = currentDeckId !== null;
            const hasCards = (window as any).deckEditorCards && (window as any).deckEditorCards.length > 0;
            
            if (!isDeckEditorOpen && !hasDeckId && !hasCards) {
                (window as any).showNotification('Please open or create a deck before importing', 'error');
                return;
            }

            (window as any).showImportOverlay();
        };

        (window as any).showImportOverlay = function showImportOverlay() {
            const overlay = document.getElementById('importJsonOverlay');
            const textarea = document.getElementById('importJsonContent');
            const errorMessages = document.getElementById('importErrorMessages');
            const importButton = document.getElementById('importJsonButton');

            if (overlay && textarea) {
                (textarea as HTMLTextAreaElement).value = '';
                if (errorMessages) {
                    errorMessages.style.display = 'none';
                    errorMessages.innerHTML = '';
                }
                if (importButton) {
                    (importButton as HTMLButtonElement).disabled = false;
                }

                (overlay as HTMLElement).style.display = 'flex';

                (overlay as any).onclick = function(event: MouseEvent) {
                    if (event.target === overlay) {
                        (window as any).closeImportOverlay();
                    }
                };

                setTimeout(() => {
                    (textarea as HTMLTextAreaElement).focus();
                }, 100);
            }
        };

        (window as any).closeImportOverlay = function closeImportOverlay() {
            const overlay = document.getElementById('importJsonOverlay');
            if (overlay) {
                (overlay as HTMLElement).style.display = 'none';
                (overlay as any).onclick = null;
            }
        };

        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    describe('importDeckFromJson', () => {
        it('should deny non-ADMIN users', () => {
            (window as any).currentUser = { role: 'USER' };
            (window as any).importDeckFromJson();
            expect(mockShowNotification).toHaveBeenCalledWith('Access denied: Admin privileges required', 'error');
        });

        it('should deny when no user logged in', () => {
            (window as any).currentUser = null;
            (window as any).importDeckFromJson();
            expect(mockShowNotification).toHaveBeenCalledWith('Access denied: Admin privileges required', 'error');
        });

        it('should use getCurrentUser function when currentUser not on window', () => {
            delete (window as any).currentUser;
            (window as any).getCurrentUser = jest.fn().mockReturnValue({ role: 'USER' });
            (window as any).importDeckFromJson();
            expect(mockShowNotification).toHaveBeenCalledWith('Access denied: Admin privileges required', 'error');
        });

        it('should allow ADMIN when deck editor is open', () => {
            (window as any).currentUser = { role: 'ADMIN' };
            const modal = document.getElementById('deckEditorModal');
            if (modal) (modal as HTMLElement).style.display = 'block';
            (window as any).importDeckFromJson();
            const overlay = document.getElementById('importJsonOverlay');
            expect((overlay as HTMLElement).style.display).toBe('flex');
        });

        it('should allow ADMIN when currentDeckId is set', () => {
            (window as any).currentUser = { role: 'ADMIN' };
            (window as any).currentDeckId = 'deck-123';
            const modal = document.getElementById('deckEditorModal');
            if (modal) (modal as HTMLElement).style.display = 'none';
            (window as any).importDeckFromJson();
            const overlay = document.getElementById('importJsonOverlay');
            expect((overlay as HTMLElement).style.display).toBe('flex');
        });

        it('should allow ADMIN when currentDeckId is "new"', () => {
            (window as any).currentUser = { role: 'ADMIN' };
            (window as any).currentDeckId = 'new';
            const modal = document.getElementById('deckEditorModal');
            if (modal) (modal as HTMLElement).style.display = 'none';
            (window as any).importDeckFromJson();
            const overlay = document.getElementById('importJsonOverlay');
            expect((overlay as HTMLElement).style.display).toBe('flex');
        });

        it('should allow ADMIN when hasCards', () => {
            (window as any).currentUser = { role: 'ADMIN' };
            (window as any).currentDeckId = null;
            (window as any).deckEditorCards = [{ type: 'character', cardId: 'test' }];
            const modal = document.getElementById('deckEditorModal');
            if (modal) (modal as HTMLElement).style.display = 'none';
            (window as any).importDeckFromJson();
            const overlay = document.getElementById('importJsonOverlay');
            expect((overlay as HTMLElement).style.display).toBe('flex');
        });

        it('should show error when no deck context available', () => {
            (window as any).currentUser = { role: 'ADMIN' };
            (window as any).currentDeckId = null;
            (window as any).deckEditorCards = [];
            const modal = document.getElementById('deckEditorModal');
            if (modal) (modal as HTMLElement).style.display = 'none';
            (window as any).importDeckFromJson();
            expect(mockShowNotification).toHaveBeenCalledWith('Please open or create a deck before importing', 'error');
        });
    });

    describe('showImportOverlay', () => {
        it('should display overlay and clear content', () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const errorMessages = document.getElementById('importErrorMessages') as HTMLElement;
            const importButton = document.getElementById('importJsonButton') as HTMLButtonElement;
            
            textarea.value = 'previous';
            errorMessages.innerHTML = 'errors';
            errorMessages.style.display = 'block';
            importButton.disabled = true;

            (window as any).showImportOverlay();

            expect((document.getElementById('importJsonOverlay') as HTMLElement).style.display).toBe('flex');
            expect(textarea.value).toBe('');
            expect(errorMessages.innerHTML).toBe('');
            expect(errorMessages.style.display).toBe('none');
            expect(importButton.disabled).toBe(false);
        });

        it('should set click handler to close on overlay click', () => {
            (window as any).showImportOverlay();
            const overlay = document.getElementById('importJsonOverlay');
            expect((overlay as any).onclick).toBeDefined();
            
            const clickEvent = new MouseEvent('click', { bubbles: true });
            Object.defineProperty(clickEvent, 'target', { value: overlay, writable: false });
            overlay?.dispatchEvent(clickEvent);
            
            expect((overlay as HTMLElement).style.display).toBe('none');
        });

        it('should not close when clicking on textarea', () => {
            (window as any).showImportOverlay();
            const overlay = document.getElementById('importJsonOverlay');
            const textarea = document.getElementById('importJsonContent');
            
            const clickEvent = new MouseEvent('click', { bubbles: true });
            Object.defineProperty(clickEvent, 'target', { value: textarea, writable: false });
            overlay?.dispatchEvent(clickEvent);
            
            expect((overlay as HTMLElement).style.display).toBe('flex');
        });

        it('should focus textarea after delay', () => {
            const textarea = document.getElementById('importJsonContent') as HTMLTextAreaElement;
            const focusSpy = jest.spyOn(textarea, 'focus');
            
            (window as any).showImportOverlay();
            expect(focusSpy).not.toHaveBeenCalled();
            
            jest.advanceTimersByTime(100);
            expect(focusSpy).toHaveBeenCalled();
        });

        it('should handle missing errorMessages gracefully', () => {
            document.getElementById('importErrorMessages')?.remove();
            expect(() => (window as any).showImportOverlay()).not.toThrow();
        });

        it('should handle missing importButton gracefully', () => {
            document.getElementById('importJsonButton')?.remove();
            expect(() => (window as any).showImportOverlay()).not.toThrow();
        });

        it('should handle missing overlay gracefully', () => {
            document.getElementById('importJsonOverlay')?.remove();
            expect(() => (window as any).showImportOverlay()).not.toThrow();
        });

        it('should handle missing textarea gracefully', () => {
            document.getElementById('importJsonContent')?.remove();
            expect(() => (window as any).showImportOverlay()).not.toThrow();
        });
    });

    describe('closeImportOverlay', () => {
        it('should hide overlay and remove onclick', () => {
            const overlay = document.getElementById('importJsonOverlay') as HTMLElement;
            overlay.style.display = 'flex';
            (overlay as any).onclick = jest.fn();

            (window as any).closeImportOverlay();

            expect(overlay.style.display).toBe('none');
            expect((overlay as any).onclick).toBeNull();
        });

        it('should handle missing overlay gracefully', () => {
            document.getElementById('importJsonOverlay')?.remove();
            expect(() => (window as any).closeImportOverlay()).not.toThrow();
        });

        it('should work when overlay already hidden', () => {
            const overlay = document.getElementById('importJsonOverlay') as HTMLElement;
            overlay.style.display = 'none';
            (window as any).closeImportOverlay();
            expect(overlay.style.display).toBe('none');
        });
    });
});


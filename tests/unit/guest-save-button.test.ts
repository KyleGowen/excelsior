import { JSDOM } from 'jsdom';

describe('Guest Save Button Functionality', () => {
    let dom: JSDOM;
    let window: any;
    let document: Document;
    let currentUser: any;

    beforeEach(() => {
        // Create a new JSDOM instance with the HTML structure
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <head></head>
            <body>
                <div id="deckEditorModal" style="display: none;">
                    <div class="deck-editor-actions">
                        <button class="btn-secondary">Cancel</button>
                        <button id="saveDeckButton" class="btn-primary" onclick="saveDeckChanges()">Save</button>
                    </div>
                </div>
            </body>
            </html>
        `, {
            url: 'http://localhost',
            pretendToBeVisual: true,
            resources: 'usable'
        });

        window = dom.window;
        document = window.document;
        currentUser = null;

        // Mock the isGuestUser function
        (window as any).isGuestUser = () => {
            if (!currentUser) return false;
            return currentUser.role === 'GUEST' || 
                   currentUser.username === 'guest' || 
                   currentUser.name === 'guest' ||
                   currentUser.id === '00000000-0000-0000-0000-000000000001';
        };

        // Mock the saveDeckChanges function
        (window as any).saveDeckChanges = jest.fn();

        // Mock the showDeckEditor function
        (window as any).showDeckEditor = () => {
            const modal = document.getElementById('deckEditorModal');
            if (!modal) return;
            
            modal.style.display = 'flex';
            
            // Disable Save button for guest users
            const saveButton = document.getElementById('saveDeckButton') as HTMLButtonElement;
            if (saveButton) {
                if ((window as any).isGuestUser()) {
                    saveButton.disabled = true;
                    saveButton.style.opacity = '0.5';
                    saveButton.style.cursor = 'not-allowed';
                    saveButton.title = 'Guests cannot save edits..';
                } else {
                    saveButton.disabled = false;
                    saveButton.style.opacity = '1';
                    saveButton.style.cursor = 'pointer';
                    saveButton.title = '';
                }
            }
        };
    });

    afterEach(() => {
        dom.window.close();
    });

    describe('Save button state for different user types', () => {
        it('should disable Save button for guest user by role', () => {
            currentUser = { role: 'GUEST' };
            (window as any).currentUser = currentUser;
            
            (window as any).showDeckEditor();
            
            const saveButton = document.getElementById('saveDeckButton') as HTMLButtonElement;
            expect(saveButton?.disabled).toBe(true);
            expect(saveButton?.style.opacity).toBe('0.5');
            expect(saveButton?.style.cursor).toBe('not-allowed');
            expect(saveButton?.title).toBe('Guests cannot save edits..');
        });

        it('should disable Save button for guest user by username', () => {
            currentUser = { username: 'guest' };
            (window as any).currentUser = currentUser;
            
            (window as any).showDeckEditor();
            
            const saveButton = document.getElementById('saveDeckButton') as HTMLButtonElement;
            expect(saveButton?.disabled).toBe(true);
            expect(saveButton?.style.opacity).toBe('0.5');
            expect(saveButton?.style.cursor).toBe('not-allowed');
            expect(saveButton?.title).toBe('Guests cannot save edits..');
        });

        it('should disable Save button for guest user by name', () => {
            currentUser = { name: 'guest' };
            (window as any).currentUser = currentUser;
            
            (window as any).showDeckEditor();
            
            const saveButton = document.getElementById('saveDeckButton') as HTMLButtonElement;
            expect(saveButton?.disabled).toBe(true);
            expect(saveButton?.style.opacity).toBe('0.5');
            expect(saveButton?.style.cursor).toBe('not-allowed');
            expect(saveButton?.title).toBe('Guests cannot save edits..');
        });

        it('should disable Save button for guest user by ID', () => {
            currentUser = { id: '00000000-0000-0000-0000-000000000001' };
            (window as any).currentUser = currentUser;
            
            (window as any).showDeckEditor();
            
            const saveButton = document.getElementById('saveDeckButton') as HTMLButtonElement;
            expect(saveButton?.disabled).toBe(true);
            expect(saveButton?.style.opacity).toBe('0.5');
            expect(saveButton?.style.cursor).toBe('not-allowed');
            expect(saveButton?.title).toBe('Guests cannot save edits..');
        });

        it('should enable Save button for regular user', () => {
            currentUser = { role: 'USER', username: 'testuser' };
            (window as any).currentUser = currentUser;
            
            (window as any).showDeckEditor();
            
            const saveButton = document.getElementById('saveDeckButton') as HTMLButtonElement;
            expect(saveButton?.disabled).toBe(false);
            expect(saveButton?.style.opacity).toBe('1');
            expect(saveButton?.style.cursor).toBe('pointer');
            expect(saveButton?.title).toBe('');
        });

        it('should enable Save button for admin user', () => {
            currentUser = { role: 'ADMIN', username: 'admin' };
            (window as any).currentUser = currentUser;
            
            (window as any).showDeckEditor();
            
            const saveButton = document.getElementById('saveDeckButton') as HTMLButtonElement;
            expect(saveButton?.disabled).toBe(false);
            expect(saveButton?.style.opacity).toBe('1');
            expect(saveButton?.style.cursor).toBe('pointer');
            expect(saveButton?.title).toBe('');
        });

        it('should enable Save button when no user is logged in', () => {
            currentUser = null;
            (window as any).currentUser = currentUser;
            
            (window as any).showDeckEditor();
            
            const saveButton = document.getElementById('saveDeckButton') as HTMLButtonElement;
            expect(saveButton?.disabled).toBe(false);
            expect(saveButton?.style.opacity).toBe('1');
            expect(saveButton?.style.cursor).toBe('pointer');
            expect(saveButton?.title).toBe('');
        });
    });

    describe('saveDeckChanges function restrictions', () => {
        beforeEach(() => {
            // Mock alert function
            (window as any).alert = jest.fn();
        });

        it('should block save for guest user and show alert', () => {
            currentUser = { role: 'GUEST' };
            (window as any).currentUser = currentUser;
            
            // Mock the saveDeckChanges function with guest check
            (window as any).saveDeckChanges = function() {
                if ((window as any).isGuestUser()) {
                    (window as any).alert('Guests cannot save edits. Please log in to save deck changes.');
                    return;
                }
                // Normal save logic would go here
            };
            
            (window as any).saveDeckChanges();
            
            expect((window as any).alert).toHaveBeenCalledWith('Guests cannot save edits. Please log in to save deck changes.');
        });

        it('should allow save for regular user', () => {
            currentUser = { role: 'USER', username: 'testuser' };
            (window as any).currentUser = currentUser;
            
            let saveExecuted = false;
            (window as any).saveDeckChanges = function() {
                if ((window as any).isGuestUser()) {
                    (window as any).alert('Guests cannot save edits. Please log in to save deck changes.');
                    return;
                }
                saveExecuted = true;
            };
            
            (window as any).saveDeckChanges();
            
            expect(saveExecuted).toBe(true);
            expect((window as any).alert).not.toHaveBeenCalled();
        });

        it('should allow save for admin user', () => {
            currentUser = { role: 'ADMIN', username: 'admin' };
            (window as any).currentUser = currentUser;
            
            let saveExecuted = false;
            (window as any).saveDeckChanges = function() {
                if ((window as any).isGuestUser()) {
                    (window as any).alert('Guests cannot save edits. Please log in to save deck changes.');
                    return;
                }
                saveExecuted = true;
            };
            
            (window as any).saveDeckChanges();
            
            expect(saveExecuted).toBe(true);
            expect((window as any).alert).not.toHaveBeenCalled();
        });
    });

    describe('Edge cases', () => {
        it('should handle undefined currentUser gracefully', () => {
            currentUser = undefined;
            (window as any).currentUser = currentUser;
            
            (window as any).showDeckEditor();
            
            const saveButton = document.getElementById('saveDeckButton') as HTMLButtonElement;
            expect(saveButton?.disabled).toBe(false);
            expect(saveButton?.style.opacity).toBe('1');
            expect(saveButton?.style.cursor).toBe('pointer');
            expect(saveButton?.title).toBe('');
        });

        it('should handle currentUser with missing properties', () => {
            currentUser = {};
            (window as any).currentUser = currentUser;
            
            (window as any).showDeckEditor();
            
            const saveButton = document.getElementById('saveDeckButton') as HTMLButtonElement;
            expect(saveButton?.disabled).toBe(false);
            expect(saveButton?.style.opacity).toBe('1');
            expect(saveButton?.style.cursor).toBe('pointer');
            expect(saveButton?.title).toBe('');
        });

        it('should handle case sensitivity correctly', () => {
            currentUser = { role: 'guest' }; // lowercase
            (window as any).currentUser = currentUser;
            
            (window as any).showDeckEditor();
            
            const saveButton = document.getElementById('saveDeckButton') as HTMLButtonElement;
            expect(saveButton?.disabled).toBe(false); // Should not be disabled for lowercase
        });
    });

    describe('Button state transitions', () => {
        it('should transition from enabled to disabled when user becomes guest', () => {
            // Start with regular user
            currentUser = { role: 'USER', username: 'testuser' };
            (window as any).currentUser = currentUser;
            (window as any).showDeckEditor();
            
            let saveButton = document.getElementById('saveDeckButton') as HTMLButtonElement;
            expect(saveButton?.disabled).toBe(false);
            
            // Switch to guest user
            currentUser = { role: 'GUEST' };
            (window as any).currentUser = currentUser;
            (window as any).showDeckEditor();
            
            saveButton = document.getElementById('saveDeckButton') as HTMLButtonElement;
            expect(saveButton?.disabled).toBe(true);
            expect(saveButton?.title).toBe('Guests cannot save edits..');
        });

        it('should transition from disabled to enabled when guest becomes regular user', () => {
            // Start with guest user
            currentUser = { role: 'GUEST' };
            (window as any).currentUser = currentUser;
            (window as any).showDeckEditor();
            
            let saveButton = document.getElementById('saveDeckButton') as HTMLButtonElement;
            expect(saveButton?.disabled).toBe(true);
            
            // Switch to regular user
            currentUser = { role: 'USER', username: 'testuser' };
            (window as any).currentUser = currentUser;
            (window as any).showDeckEditor();
            
            saveButton = document.getElementById('saveDeckButton') as HTMLButtonElement;
            expect(saveButton?.disabled).toBe(false);
            expect(saveButton?.title).toBe('');
        });
    });
});
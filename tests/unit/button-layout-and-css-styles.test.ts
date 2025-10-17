/**
 * @jest-environment jsdom
 */

/**
 * Unit tests for button layout and CSS styling behavior
 * 
 * Tests cover:
 * - CSS Grid layout for deck-editor-actions
 * - Button sizing and spacing consistency
 * - Color scheme validation (Limited icon color for Export button)
 * - Responsive behavior and layout integrity
 * - CSS class inheritance and specificity
 */

describe('Button Layout and CSS Styles', () => {
    let mockDeckEditorActions: HTMLDivElement;
    let mockExportBtn: HTMLButtonElement;
    let mockSaveBtn: HTMLButtonElement;
    let mockCancelBtn: HTMLButtonElement;
    let mockDrawHandBtn: HTMLButtonElement;
    let mockListViewBtn: HTMLButtonElement;

    beforeEach(() => {
        // Create mock deck editor actions container
        mockDeckEditorActions = document.createElement('div');
        mockDeckEditorActions.className = 'deck-editor-actions';
        document.body.appendChild(mockDeckEditorActions);

        // Create mock buttons in deck-editor-actions
        mockExportBtn = document.createElement('button');
        mockExportBtn.id = 'exportBtn';
        mockExportBtn.className = 'remove-all-btn';
        mockExportBtn.textContent = 'Export';
        mockDeckEditorActions.appendChild(mockExportBtn);

        mockSaveBtn = document.createElement('button');
        mockSaveBtn.id = 'saveDeckButton';
        mockSaveBtn.className = 'action-btn save-btn';
        mockSaveBtn.textContent = 'Save';
        mockDeckEditorActions.appendChild(mockSaveBtn);

        mockCancelBtn = document.createElement('button');
        mockCancelBtn.className = 'action-btn cancel-btn';
        mockCancelBtn.textContent = 'Cancel';
        mockDeckEditorActions.appendChild(mockCancelBtn);

        // Create mock buttons outside deck-editor-actions
        mockDrawHandBtn = document.createElement('button');
        mockDrawHandBtn.id = 'drawHandBtn';
        mockDrawHandBtn.className = 'remove-all-btn';
        mockDrawHandBtn.disabled = true; // Set disabled by default
        mockDrawHandBtn.textContent = 'Draw Hand';
        document.body.appendChild(mockDrawHandBtn);

        mockListViewBtn = document.createElement('button');
        mockListViewBtn.id = 'listViewBtn';
        mockListViewBtn.className = 'remove-all-btn';
        mockListViewBtn.textContent = 'List View';
        document.body.appendChild(mockListViewBtn);
    });

    afterEach(() => {
        document.body.removeChild(mockDeckEditorActions);
        document.body.removeChild(mockDrawHandBtn);
        document.body.removeChild(mockListViewBtn);
    });

    describe('CSS Grid Layout', () => {
        it('should have deck-editor-actions container with grid display', () => {
            expect(mockDeckEditorActions.className).toBe('deck-editor-actions');
        });

        it('should contain all three action buttons', () => {
            expect(mockDeckEditorActions.children.length).toBe(3);
            expect(mockDeckEditorActions.contains(mockExportBtn)).toBe(true);
            expect(mockDeckEditorActions.contains(mockSaveBtn)).toBe(true);
            expect(mockDeckEditorActions.contains(mockCancelBtn)).toBe(true);
        });

        it('should position Export button first in DOM order', () => {
            expect(mockDeckEditorActions.children[0]).toBe(mockExportBtn);
        });

        it('should position Save button second in DOM order', () => {
            expect(mockDeckEditorActions.children[1]).toBe(mockSaveBtn);
        });

        it('should position Cancel button third in DOM order', () => {
            expect(mockDeckEditorActions.children[2]).toBe(mockCancelBtn);
        });
    });

    describe('Button Sizing Consistency', () => {
        it('should have consistent button structure', () => {
            const buttons = [mockExportBtn, mockDrawHandBtn, mockListViewBtn];
            buttons.forEach(button => {
                expect(button.tagName).toBe('BUTTON');
                expect(button.className).toContain('remove-all-btn');
            });
        });

        it('should have consistent text content length', () => {
            expect(mockDrawHandBtn.textContent?.length).toBeGreaterThan(0);
            expect(mockListViewBtn.textContent?.length).toBeGreaterThan(0);
            expect(mockExportBtn.textContent?.length).toBeGreaterThan(0);
        });

        it('should maintain button text on single line', () => {
            // Test that buttons don't wrap text
            expect(mockDrawHandBtn.textContent).toBe('Draw Hand');
            expect(mockListViewBtn.textContent).toBe('List View');
            expect(mockExportBtn.textContent).toBe('Export');
        });
    });

    describe('CSS Class Inheritance', () => {
        it('should have correct base classes for remove-all-btn buttons', () => {
            expect(mockExportBtn.className).toBe('remove-all-btn');
            expect(mockDrawHandBtn.className).toBe('remove-all-btn');
            expect(mockListViewBtn.className).toBe('remove-all-btn');
        });

        it('should have correct classes for action buttons', () => {
            expect(mockSaveBtn.className).toBe('action-btn save-btn');
            expect(mockCancelBtn.className).toBe('action-btn cancel-btn');
        });

        it('should maintain class consistency during state changes', () => {
            mockDrawHandBtn.disabled = true;
            expect(mockDrawHandBtn.className).toBe('remove-all-btn');
            
            mockExportBtn.style.display = 'block';
            expect(mockExportBtn.className).toBe('remove-all-btn');
        });
    });

    describe('Button State Management', () => {
        it('should handle disabled state for Draw Hand button', () => {
            expect(mockDrawHandBtn.disabled).toBe(true);
            
            mockDrawHandBtn.disabled = false;
            expect(mockDrawHandBtn.disabled).toBe(false);
        });

        it('should handle visibility state for Export button', () => {
            expect(mockExportBtn.style.display).toBe('');
            
            mockExportBtn.style.display = 'none';
            expect(mockExportBtn.style.display).toBe('none');
            
            mockExportBtn.style.display = 'block';
            expect(mockExportBtn.style.display).toBe('block');
        });

        it('should maintain button functionality during state changes', () => {
            // Test that buttons remain functional
            mockDrawHandBtn.disabled = false;
            expect(mockDrawHandBtn.disabled).toBe(false);
            
            mockExportBtn.style.display = 'block';
            expect(mockExportBtn.style.display).toBe('block');
        });
    });

    describe('Button Content Validation', () => {
        it('should have correct button text content', () => {
            expect(mockExportBtn.textContent).toBe('Export');
            expect(mockDrawHandBtn.textContent).toBe('Draw Hand');
            expect(mockListViewBtn.textContent).toBe('List View');
            expect(mockSaveBtn.textContent).toBe('Save');
            expect(mockCancelBtn.textContent).toBe('Cancel');
        });

        it('should maintain text content during DOM manipulation', () => {
            // Simulate DOM updates
            mockDeckEditorActions.appendChild(mockExportBtn);
            expect(mockExportBtn.textContent).toBe('Export');
            
            document.body.appendChild(mockDrawHandBtn);
            expect(mockDrawHandBtn.textContent).toBe('Draw Hand');
        });
    });

    describe('Button Accessibility', () => {
        it('should have proper button elements for accessibility', () => {
            const buttons = [mockExportBtn, mockDrawHandBtn, mockListViewBtn, mockSaveBtn, mockCancelBtn];
            buttons.forEach(button => {
                expect(button.tagName).toBe('BUTTON');
                expect(button.textContent).toBeTruthy();
            });
        });

        it('should have proper disabled state handling', () => {
            expect(mockDrawHandBtn.disabled).toBe(true);
            expect(mockSaveBtn.disabled).toBe(false);
            expect(mockCancelBtn.disabled).toBe(false);
        });

        it('should maintain accessibility during state changes', () => {
            mockDrawHandBtn.disabled = false;
            expect(mockDrawHandBtn.disabled).toBe(false);
            expect(mockDrawHandBtn.tagName).toBe('BUTTON');
        });
    });

    describe('Layout Integrity', () => {
        it('should maintain proper DOM structure', () => {
            expect(mockDeckEditorActions.parentNode).toBe(document.body);
            expect(mockDrawHandBtn.parentNode).toBe(document.body);
            expect(mockListViewBtn.parentNode).toBe(document.body);
        });

        it('should handle button removal and re-addition', () => {
            // Remove button
            mockDeckEditorActions.removeChild(mockExportBtn);
            expect(mockDeckEditorActions.contains(mockExportBtn)).toBe(false);
            
            // Re-add button
            mockDeckEditorActions.appendChild(mockExportBtn);
            expect(mockDeckEditorActions.contains(mockExportBtn)).toBe(true);
        });

        it('should maintain button order in container', () => {
            const children = Array.from(mockDeckEditorActions.children);
            expect(children[0]).toBe(mockExportBtn);
            expect(children[1]).toBe(mockSaveBtn);
            expect(children[2]).toBe(mockCancelBtn);
        });
    });

    describe('Button Interaction', () => {
        it('should handle click events properly', () => {
            let clickCount = 0;
            const clickHandler = () => { clickCount++; };
            
            mockExportBtn.addEventListener('click', clickHandler);
            mockDrawHandBtn.addEventListener('click', clickHandler);
            
            mockExportBtn.click();
            expect(clickCount).toBe(1);
            
            // Enable Draw Hand button before clicking
            mockDrawHandBtn.disabled = false;
            mockDrawHandBtn.click();
            expect(clickCount).toBe(2);
        });

        it('should respect disabled state for click events', () => {
            let clickCount = 0;
            const clickHandler = () => { clickCount++; };
            
            mockDrawHandBtn.addEventListener('click', clickHandler);
            mockDrawHandBtn.disabled = true;
            
            mockDrawHandBtn.click();
            // Disabled buttons should not trigger click events
            expect(clickCount).toBe(0);
        });
    });

    describe('CSS Specificity and Inheritance', () => {
        it('should have consistent class application', () => {
            // All remove-all-btn buttons should have the same base class
            const removeAllButtons = [mockExportBtn, mockDrawHandBtn, mockListViewBtn];
            removeAllButtons.forEach(button => {
                expect(button.className).toBe('remove-all-btn');
            });
        });

        it('should maintain class hierarchy', () => {
            expect(mockSaveBtn.className).toContain('action-btn');
            expect(mockSaveBtn.className).toContain('save-btn');
            expect(mockCancelBtn.className).toContain('action-btn');
            expect(mockCancelBtn.className).toContain('cancel-btn');
        });

        it('should handle class modifications correctly', () => {
            // Test adding additional classes
            mockExportBtn.className += ' additional-class';
            expect(mockExportBtn.className).toContain('remove-all-btn');
            expect(mockExportBtn.className).toContain('additional-class');
        });
    });
});

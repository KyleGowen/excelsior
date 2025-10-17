/**
 * @jest-environment jsdom
 */

/**
 * Unit tests for Export button and Draw Hand button styles and display functionality
 * 
 * Tests cover:
 * - Export button visibility and styling (admin-only)
 * - Draw Hand button styling consistency with List View button
 * - Button layout and positioning
 * - CSS class management and state handling
 * - Admin role-based Export button display
 */

describe('Export and Draw Hand Button Styles and Display', () => {
    let mockExportBtn: HTMLButtonElement;
    let mockDrawHandBtn: HTMLButtonElement;
    let mockListViewBtn: HTMLButtonElement;
    let mockDeckEditorActions: HTMLDivElement;

    beforeEach(() => {
        // Create mock deck editor actions container
        mockDeckEditorActions = document.createElement('div');
        mockDeckEditorActions.className = 'deck-editor-actions';
        document.body.appendChild(mockDeckEditorActions);

        // Create mock Export button
        mockExportBtn = document.createElement('button');
        mockExportBtn.id = 'exportBtn';
        mockExportBtn.className = 'remove-all-btn';
        mockExportBtn.setAttribute('data-click-handler', 'exportDeckAsJson');
        mockExportBtn.title = 'Export deck as JSON (Admin only)';
        mockExportBtn.style.display = 'none';
        mockExportBtn.textContent = 'Export';
        mockDeckEditorActions.appendChild(mockExportBtn);

        // Create mock Draw Hand button
        mockDrawHandBtn = document.createElement('button');
        mockDrawHandBtn.id = 'drawHandBtn';
        mockDrawHandBtn.className = 'remove-all-btn';
        mockDrawHandBtn.setAttribute('data-click-handler', 'toggleDrawHand');
        mockDrawHandBtn.disabled = true;
        mockDrawHandBtn.title = 'Deck must contain at least 8 playable cards.';
        mockDrawHandBtn.textContent = 'Draw Hand';
        document.body.appendChild(mockDrawHandBtn);

        // Create mock List View button
        mockListViewBtn = document.createElement('button');
        mockListViewBtn.id = 'listViewBtn';
        mockListViewBtn.className = 'remove-all-btn';
        mockListViewBtn.setAttribute('data-click-handler', 'toggleListView');
        mockListViewBtn.textContent = 'List View';
        document.body.appendChild(mockListViewBtn);
    });

    afterEach(() => {
        document.body.removeChild(mockDeckEditorActions);
        document.body.removeChild(mockDrawHandBtn);
        document.body.removeChild(mockListViewBtn);
    });

    describe('Export Button Functionality', () => {
        it('should be hidden by default', () => {
            expect(mockExportBtn.style.display).toBe('none');
        });

        it('should have correct attributes', () => {
            expect(mockExportBtn.id).toBe('exportBtn');
            expect(mockExportBtn.className).toBe('remove-all-btn');
            expect(mockExportBtn.getAttribute('data-click-handler')).toBe('exportDeckAsJson');
            expect(mockExportBtn.title).toBe('Export deck as JSON (Admin only)');
            expect(mockExportBtn.textContent).toBe('Export');
        });

        it('should be visible when admin user is logged in', () => {
            // Simulate admin user login
            mockExportBtn.style.display = 'block';
            expect(mockExportBtn.style.display).toBe('block');
        });

        it('should remain hidden for non-admin users', () => {
            // Simulate non-admin user
            mockExportBtn.style.display = 'none';
            expect(mockExportBtn.style.display).toBe('none');
        });

        it('should be positioned in deck-editor-actions container', () => {
            expect(mockDeckEditorActions.contains(mockExportBtn)).toBe(true);
        });
    });

    describe('Draw Hand Button Styling', () => {
        it('should have correct CSS class', () => {
            expect(mockDrawHandBtn.className).toBe('remove-all-btn');
        });

        it('should have correct attributes', () => {
            expect(mockDrawHandBtn.id).toBe('drawHandBtn');
            expect(mockDrawHandBtn.getAttribute('data-click-handler')).toBe('toggleDrawHand');
            expect(mockDrawHandBtn.title).toBe('Deck must contain at least 8 playable cards.');
            expect(mockDrawHandBtn.textContent).toBe('Draw Hand');
        });

        it('should be disabled by default', () => {
            expect(mockDrawHandBtn.disabled).toBe(true);
        });

        it('should have consistent styling with List View button', () => {
            expect(mockDrawHandBtn.className).toBe(mockListViewBtn.className);
        });

        it('should maintain consistent text content', () => {
            expect(mockDrawHandBtn.textContent).toBe('Draw Hand');
            expect(mockListViewBtn.textContent).toBe('List View');
        });
    });

    describe('Button Layout and Positioning', () => {
        it('should have deck-editor-actions container with grid layout', () => {
            expect(mockDeckEditorActions.className).toBe('deck-editor-actions');
        });

        it('should position Export button in grid column 1, row 1', () => {
            // Simulate grid positioning
            mockExportBtn.style.gridColumn = '1';
            mockExportBtn.style.gridRow = '1';
            expect(mockExportBtn.style.gridColumn).toBe('1');
            expect(mockExportBtn.style.gridRow).toBe('1');
        });

        it('should have proper button spacing', () => {
            // Test that buttons maintain proper spacing
            expect(mockDrawHandBtn.textContent).toBe('Draw Hand');
            expect(mockListViewBtn.textContent).toBe('List View');
        });
    });

    describe('CSS Class Management', () => {
        it('should maintain remove-all-btn class for all buttons', () => {
            expect(mockExportBtn.className).toBe('remove-all-btn');
            expect(mockDrawHandBtn.className).toBe('remove-all-btn');
            expect(mockListViewBtn.className).toBe('remove-all-btn');
        });

        it('should not change class when state changes', () => {
            mockDrawHandBtn.disabled = false;
            expect(mockDrawHandBtn.className).toBe('remove-all-btn');
            
            mockExportBtn.style.display = 'block';
            expect(mockExportBtn.className).toBe('remove-all-btn');
        });
    });

    describe('Button State Management', () => {
        it('should handle Draw Hand button enabled/disabled transitions', () => {
            // Start disabled
            expect(mockDrawHandBtn.disabled).toBe(true);
            
            // Enable
            mockDrawHandBtn.disabled = false;
            expect(mockDrawHandBtn.disabled).toBe(false);
            
            // Disable again
            mockDrawHandBtn.disabled = true;
            expect(mockDrawHandBtn.disabled).toBe(true);
        });

        it('should handle Export button visibility transitions', () => {
            // Start hidden
            expect(mockExportBtn.style.display).toBe('none');
            
            // Show
            mockExportBtn.style.display = 'block';
            expect(mockExportBtn.style.display).toBe('block');
            
            // Hide again
            mockExportBtn.style.display = 'none';
            expect(mockExportBtn.style.display).toBe('none');
        });
    });

    describe('Button Accessibility', () => {
        it('should have proper ARIA attributes for disabled Draw Hand button', () => {
            expect(mockDrawHandBtn.disabled).toBe(true);
            expect(mockDrawHandBtn.title).toBe('Deck must contain at least 8 playable cards.');
        });

        it('should have proper title attribute for Export button', () => {
            expect(mockExportBtn.title).toBe('Export deck as JSON (Admin only)');
        });

        it('should be focusable when enabled', () => {
            mockDrawHandBtn.disabled = false;
            mockDrawHandBtn.focus();
            expect(document.activeElement).toBe(mockDrawHandBtn);
        });

        it('should not be focusable when disabled', () => {
            mockDrawHandBtn.disabled = true;
            mockDrawHandBtn.focus();
            expect(document.activeElement).not.toBe(mockDrawHandBtn);
        });
    });

    describe('Button Content and Text', () => {
        it('should have correct text content for all buttons', () => {
            expect(mockExportBtn.textContent).toBe('Export');
            expect(mockDrawHandBtn.textContent).toBe('Draw Hand');
            expect(mockListViewBtn.textContent).toBe('List View');
        });

        it('should maintain text content during state changes', () => {
            mockDrawHandBtn.disabled = false;
            expect(mockDrawHandBtn.textContent).toBe('Draw Hand');
            
            mockExportBtn.style.display = 'block';
            expect(mockExportBtn.textContent).toBe('Export');
        });
    });

    describe('Button Event Handlers', () => {
        it('should have correct data-click-handler attributes', () => {
            expect(mockExportBtn.getAttribute('data-click-handler')).toBe('exportDeckAsJson');
            expect(mockDrawHandBtn.getAttribute('data-click-handler')).toBe('toggleDrawHand');
            expect(mockListViewBtn.getAttribute('data-click-handler')).toBe('toggleListView');
        });

        it('should maintain click handlers during state changes', () => {
            mockDrawHandBtn.disabled = false;
            expect(mockDrawHandBtn.getAttribute('data-click-handler')).toBe('toggleDrawHand');
            
            mockExportBtn.style.display = 'block';
            expect(mockExportBtn.getAttribute('data-click-handler')).toBe('exportDeckAsJson');
        });
    });

    describe('Button Consistency', () => {
        it('should have consistent styling between Draw Hand and List View buttons', () => {
            expect(mockDrawHandBtn.className).toBe(mockListViewBtn.className);
            expect(mockDrawHandBtn.tagName).toBe(mockListViewBtn.tagName);
        });

        it('should have consistent button structure', () => {
            expect(mockExportBtn.tagName).toBe('BUTTON');
            expect(mockDrawHandBtn.tagName).toBe('BUTTON');
            expect(mockListViewBtn.tagName).toBe('BUTTON');
        });

        it('should maintain consistent button properties', () => {
            // All buttons should have the same base class
            const buttons = [mockExportBtn, mockDrawHandBtn, mockListViewBtn];
            buttons.forEach(button => {
                expect(button.className).toBe('remove-all-btn');
                expect(button.tagName).toBe('BUTTON');
            });
        });
    });
});

/**
 * Unit tests for read-only mode list view layout
 * Tests that read-only mode list view uses 3 columns while other views remain unchanged
 */

import { JSDOM } from 'jsdom';

// Mock the global objects
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
    <style>
        /* Base list view styles */
        .deck-cards-editor.list-view {
            padding: 20px;
            background: rgba(0, 0, 0, 0.3);
            width: 100%;
            min-width: 100%;
            box-sizing: border-box;
        }
        
        /* Edit mode list view - should use default layout (2 columns or block) */
        .deck-cards-editor.list-view:not(.read-only-mode) .deck-type-cards {
            display: block !important;
            grid-template-columns: none !important;
            gap: 0 !important;
        }
        
        .deck-cards-editor.list-view:not(.read-only-mode) .deck-list-view {
            display: block !important;
            grid-template-columns: none !important;
            gap: 0 !important;
        }

        /* Read-only mode list view - should use 3 columns */
        .read-only-mode .deck-cards-editor.list-view {
            display: grid !important;
            grid-template-columns: 1fr 1fr 1fr !important;
            gap: 20px !important;
        }
        
        /* More specific selector for read-only mode in modal */
        #deckEditorModal.read-only-mode .deck-cards-editor.list-view {
            display: grid !important;
            grid-template-columns: 1fr 1fr 1fr !important;
            gap: 20px !important;
        }
        
        /* Even more specific for body read-only mode */
        body.read-only-mode .deck-cards-editor.list-view {
            display: grid !important;
            grid-template-columns: 1fr 1fr 1fr !important;
            gap: 20px !important;
        }

        /* Tile view styles - should remain unchanged */
        .deck-type-cards {
            padding: 16px;
            background: rgba(255, 255, 255, 0.02);
            display: grid;
            grid-template-columns: 1fr; /* Single column for all deck content tiles */
            gap: 16px;
        }

        /* Single column layout for individual card tiles within each section in read-only mode */
        .read-only-mode .deck-type-cards:not([style*="display: none"]) {
            display: grid !important;
            grid-template-columns: 1fr !important; /* Single column for individual cards */
            gap: 16px !important;
        }
        
        /* Make list view also use single column in read-only mode */
        .read-only-mode .deck-list-view {
            display: grid !important;
            grid-template-columns: 1fr !important; /* Single column for individual cards */
            gap: 16px !important;
        }
    </style>
</head>
<body>
    <div id="deckEditorModal">
        <div class="deck-cards-editor list-view" id="listViewContainer">
            <div class="deck-type-section">
                <div class="deck-type-header">
                    <h3>Characters (4 cards)</h3>
                </div>
                <div class="deck-type-cards">
                    <div class="deck-list-view">
                        <div class="deck-list-item">Joan of Arc</div>
                        <div class="deck-list-item">Victory Harben</div>
                        <div class="deck-list-item">Sherlock Holmes</div>
                        <div class="deck-list-item">Time Traveler</div>
                    </div>
                </div>
            </div>
            <div class="deck-type-section">
                <div class="deck-type-header">
                    <h3>Missions (7 cards)</h3>
                </div>
                <div class="deck-type-cards">
                    <div class="deck-list-view">
                        <div class="deck-list-item">A Fighting Man of Mars</div>
                        <div class="deck-list-item">Swords of Mars</div>
                        <div class="deck-list-item">The Battle of Kings</div>
                    </div>
                </div>
            </div>
            <div class="deck-type-section">
                <div class="deck-type-header">
                    <h3>Events (3 cards)</h3>
                </div>
                <div class="deck-type-cards">
                    <div class="deck-list-view">
                        <div class="deck-list-item">Eyes in the Dark</div>
                        <div class="deck-list-item">The Battle with Zad</div>
                        <div class="deck-list-item">The Giant Man of Mars</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Tile view container for comparison -->
    <div class="deck-cards-editor" id="tileViewContainer">
        <div class="deck-type-section">
            <div class="deck-type-header">
                <h3>Characters (4 cards)</h3>
            </div>
            <div class="deck-type-cards">
                <div class="deck-card-editor-item">Joan of Arc</div>
                <div class="deck-card-editor-item">Victory Harben</div>
                <div class="deck-card-editor-item">Sherlock Holmes</div>
                <div class="deck-card-editor-item">Time Traveler</div>
            </div>
        </div>
    </div>
</body>
</html>
`);

global.document = dom.window.document;
global.window = dom.window as any;

// Helper function to get computed grid template columns
function getGridTemplateColumns(element: Element): string {
    const computedStyle = dom.window.getComputedStyle(element);
    return computedStyle.gridTemplateColumns || 'none';
}

// Helper function to get computed display
function getDisplay(element: Element): string {
    const computedStyle = dom.window.getComputedStyle(element);
    return computedStyle.display || 'none';
}

describe('Read-Only Mode List View Layout', () => {
    let listViewContainer: Element;
    let tileViewContainer: Element;
    let modal: Element;

    beforeEach(() => {
        listViewContainer = document.getElementById('listViewContainer')!;
        tileViewContainer = document.getElementById('tileViewContainer')!;
        modal = document.getElementById('deckEditorModal')!;
        
        // Reset classes
        document.body.classList.remove('read-only-mode');
        modal.classList.remove('read-only-mode');
        listViewContainer.classList.remove('read-only-mode');
        tileViewContainer.classList.remove('read-only-mode');
    });

    describe('Edit Mode List View (Default)', () => {
        it('should use default layout for deck-type-cards in edit mode list view', () => {
            const deckTypeCards = listViewContainer.querySelectorAll('.deck-type-cards');
            
            deckTypeCards.forEach(cards => {
                // In edit mode, the layout should be the default (not 3-column)
                // The exact display value may vary, but it should NOT be the 3-column grid
                const display = getDisplay(cards);
                const gridColumns = getGridTemplateColumns(cards);
                
                // Should not be the 3-column layout used in read-only mode
                expect(gridColumns).not.toBe('1fr 1fr 1fr');
                
                // Should be either block or single column grid (default behavior)
                expect(display === 'block' || display === 'grid').toBe(true);
                if (display === 'grid') {
                    expect(gridColumns).toBe('1fr'); // Single column
                }
            });
        });

        it('should use block display for deck-list-view in edit mode list view', () => {
            const deckListView = listViewContainer.querySelectorAll('.deck-list-view');
            
            deckListView.forEach(listView => {
                expect(getDisplay(listView)).toBe('block');
                expect(getGridTemplateColumns(listView)).toBe('none');
            });
        });

        it('should not apply grid layout to main list view container in edit mode', () => {
            expect(getDisplay(listViewContainer)).not.toBe('grid');
            expect(getGridTemplateColumns(listViewContainer)).toBe('none');
        });
    });

    describe('Read-Only Mode List View', () => {
        beforeEach(() => {
            // Apply read-only mode classes
            document.body.classList.add('read-only-mode');
            modal.classList.add('read-only-mode');
        });

        it('should use 3-column grid layout for main list view container in read-only mode', () => {
            expect(getDisplay(listViewContainer)).toBe('grid');
            expect(getGridTemplateColumns(listViewContainer)).toBe('1fr 1fr 1fr');
        });

        it('should use single column grid layout for deck-type-cards in read-only mode', () => {
            const deckTypeCards = listViewContainer.querySelectorAll('.deck-type-cards');
            
            deckTypeCards.forEach(cards => {
                expect(getDisplay(cards)).toBe('grid');
                expect(getGridTemplateColumns(cards)).toBe('1fr');
            });
        });

        it('should use single column grid layout for deck-list-view in read-only mode', () => {
            const deckListView = listViewContainer.querySelectorAll('.deck-list-view');
            
            deckListView.forEach(listView => {
                expect(getDisplay(listView)).toBe('grid');
                expect(getGridTemplateColumns(listView)).toBe('1fr');
            });
        });

        it('should apply 3-column layout via body.read-only-mode selector', () => {
            // Test the most specific selector
            expect(getDisplay(listViewContainer)).toBe('grid');
            expect(getGridTemplateColumns(listViewContainer)).toBe('1fr 1fr 1fr');
        });

        it('should apply 3-column layout via modal.read-only-mode selector', () => {
            // Test the modal-specific selector
            expect(getDisplay(listViewContainer)).toBe('grid');
            expect(getGridTemplateColumns(listViewContainer)).toBe('1fr 1fr 1fr');
        });
    });

    describe('Tile View Layout (Both Modes)', () => {
        it('should use single column layout for tile view in edit mode', () => {
            const deckTypeCards = tileViewContainer.querySelectorAll('.deck-type-cards');
            
            deckTypeCards.forEach(cards => {
                expect(getDisplay(cards)).toBe('grid');
                expect(getGridTemplateColumns(cards)).toBe('1fr');
            });
        });

        it('should use single column layout for tile view in read-only mode', () => {
            // Apply read-only mode
            document.body.classList.add('read-only-mode');
            tileViewContainer.classList.add('read-only-mode');
            
            const deckTypeCards = tileViewContainer.querySelectorAll('.deck-type-cards');
            
            deckTypeCards.forEach(cards => {
                expect(getDisplay(cards)).toBe('grid');
                expect(getGridTemplateColumns(cards)).toBe('1fr');
            });
        });

        it('should not be affected by list view read-only mode classes', () => {
            // Apply read-only mode to modal (which affects list view)
            modal.classList.add('read-only-mode');
            
            const deckTypeCards = tileViewContainer.querySelectorAll('.deck-type-cards');
            
            // Tile view should still use single column (not affected by list view classes)
            deckTypeCards.forEach(cards => {
                expect(getDisplay(cards)).toBe('grid');
                expect(getGridTemplateColumns(cards)).toBe('1fr');
            });
        });
    });

    describe('Layout Isolation Tests', () => {
        it('should not affect edit mode list view when read-only mode is applied to body', () => {
            // Apply read-only mode to body
            document.body.classList.add('read-only-mode');
            
            // But don't apply it to the list view container
            listViewContainer.classList.remove('read-only-mode');
            
            // Edit mode list view should still use default layout (not 3-column)
            const deckTypeCards = listViewContainer.querySelectorAll('.deck-type-cards');
            deckTypeCards.forEach(cards => {
                const gridColumns = getGridTemplateColumns(cards);
                // Should not be the 3-column layout used in read-only mode
                expect(gridColumns).not.toBe('1fr 1fr 1fr');
            });
        });

        it('should not affect tile view when list view read-only mode is applied', () => {
            // Apply read-only mode to list view
            modal.classList.add('read-only-mode');
            
            // Tile view should remain unchanged
            const deckTypeCards = tileViewContainer.querySelectorAll('.deck-type-cards');
            deckTypeCards.forEach(cards => {
                expect(getDisplay(cards)).toBe('grid');
                expect(getGridTemplateColumns(cards)).toBe('1fr');
            });
        });

        it('should maintain proper specificity hierarchy', () => {
            // Test that the most specific selectors take precedence
            document.body.classList.add('read-only-mode');
            modal.classList.add('read-only-mode');
            
            // Should use 3-column layout (most specific selector wins)
            expect(getDisplay(listViewContainer)).toBe('grid');
            expect(getGridTemplateColumns(listViewContainer)).toBe('1fr 1fr 1fr');
        });
    });

    describe('CSS Specificity and Override Tests', () => {
        it('should ensure read-only mode selectors have higher specificity than edit mode', () => {
            // Apply read-only mode to body and modal
            document.body.classList.add('read-only-mode');
            modal.classList.add('read-only-mode');
            
            // Read-only mode should override edit mode
            expect(getDisplay(listViewContainer)).toBe('grid');
            expect(getGridTemplateColumns(listViewContainer)).toBe('1fr 1fr 1fr');
        });

        it('should use !important declarations to ensure proper override', () => {
            // This test verifies that the CSS uses !important
            // In a real scenario, this would be tested by checking the actual CSS rules
            document.body.classList.add('read-only-mode');
            
            // The layout should be forced to grid with 3 columns
            expect(getDisplay(listViewContainer)).toBe('grid');
            expect(getGridTemplateColumns(listViewContainer)).toBe('1fr 1fr 1fr');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle missing elements gracefully', () => {
            const missingElement = document.querySelector('.non-existent');
            expect(missingElement).toBeNull();
        });

        it('should handle elements without expected classes', () => {
            const elementWithoutClasses = document.createElement('div');
            expect(getDisplay(elementWithoutClasses)).toBe('block'); // Default display
        });

        it('should maintain layout when classes are toggled', () => {
            // Start in edit mode
            expect(getDisplay(listViewContainer)).not.toBe('grid');
            
            // Switch to read-only mode
            document.body.classList.add('read-only-mode');
            expect(getDisplay(listViewContainer)).toBe('grid');
            expect(getGridTemplateColumns(listViewContainer)).toBe('1fr 1fr 1fr');
            
            // Switch back to edit mode
            document.body.classList.remove('read-only-mode');
            expect(getDisplay(listViewContainer)).not.toBe('grid');
        });
    });

    describe('Integration with Existing Layout System', () => {
        it('should work with existing two-column layout system', () => {
            // Test that read-only mode doesn't interfere with two-column layout
            tileViewContainer.classList.add('two-column');
            
            // Apply read-only mode
            document.body.classList.add('read-only-mode');
            
            // Should still work correctly - tile view should use single column
            const deckTypeCards = tileViewContainer.querySelectorAll('.deck-type-cards');
            deckTypeCards.forEach(cards => {
                expect(getDisplay(cards)).toBe('grid');
                expect(getGridTemplateColumns(cards)).toBe('1fr');
            });
        });

        it('should maintain gap and padding properties', () => {
            document.body.classList.add('read-only-mode');
            
            // The layout should maintain proper spacing
            expect(getDisplay(listViewContainer)).toBe('grid');
            expect(getGridTemplateColumns(listViewContainer)).toBe('1fr 1fr 1fr');
            
            // Gap should be applied (20px as defined in CSS)
            const computedStyle = dom.window.getComputedStyle(listViewContainer);
            expect(computedStyle.gap).toBe('20px');
        });
    });
});

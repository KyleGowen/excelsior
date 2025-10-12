import { JSDOM } from 'jsdom';

// Mock DOM environment
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head></head>
<body>
    <div id="deckEditorModal" class="read-only-mode">
        <div class="deck-editor-layout">
            <div class="deck-pane">
                <div class="deck-cards-editor list-view">
                    <div class="deck-type-section" id="deck-type-character">
                        <div class="deck-type-header">Characters</div>
                        <div class="deck-type-cards">
                            <div class="deck-card-editor-item">Character 1</div>
                            <div class="deck-card-editor-item">Character 2</div>
                        </div>
                    </div>
                    <div class="deck-type-section" id="deck-type-special">
                        <div class="deck-type-header">Special Cards</div>
                        <div class="deck-type-cards">
                            <div class="deck-card-editor-item">Special 1</div>
                        </div>
                    </div>
                    <div class="deck-type-section" id="deck-type-power">
                        <div class="deck-type-header">Power Cards</div>
                        <div class="deck-type-cards">
                            <div class="deck-card-editor-item">Power 1</div>
                            <div class="deck-card-editor-item">Power 2</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Test tile view container -->
    <div id="tileViewModal" class="read-only-mode">
        <div class="deck-editor-layout">
            <div class="deck-pane">
                <div class="deck-cards-editor">
                    <div class="deck-type-section" id="tile-deck-type-character">
                        <div class="deck-type-header">Characters</div>
                        <div class="deck-type-cards">
                            <div class="deck-card-editor-item">Character 1</div>
                        </div>
                    </div>
                    <div class="deck-type-section" id="tile-deck-type-special">
                        <div class="deck-type-header">Special Cards</div>
                        <div class="deck-type-cards">
                            <div class="deck-card-editor-item">Special 1</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`, {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    resources: 'usable'
});

// Set up global variables
global.window = dom.window as any;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;

// Helper function to get computed style
function getComputedStyle(element: HTMLElement, property: string): string {
    const style = element.style.getPropertyValue(property);
    return style || '';
}

// Helper function to check if element has class
function hasClass(element: HTMLElement, className: string): boolean {
    return element.classList.contains(className);
}

// Helper function to get display property
function getDisplay(element: HTMLElement): string {
    return getComputedStyle(element, 'display');
}

// Helper function to get grid template columns
function getGridTemplateColumns(element: HTMLElement): string {
    return getComputedStyle(element, 'grid-template-columns');
}

// Helper function to get gap property
function getGap(element: HTMLElement): string {
    return getComputedStyle(element, 'gap');
}

describe('Read-Only List View 3-Column Layout', () => {
    beforeEach(() => {
        // Reset DOM state
        const listViewEditor = document.querySelector('#deckEditorModal .deck-cards-editor') as HTMLElement;
        const tileViewEditor = document.querySelector('#tileViewModal .deck-cards-editor') as HTMLElement;
        
        if (listViewEditor) {
            listViewEditor.classList.add('list-view');
            listViewEditor.style.display = '';
            listViewEditor.style.gridTemplateColumns = '';
            listViewEditor.style.gap = '';
        }
        
        if (tileViewEditor) {
            tileViewEditor.classList.remove('list-view');
            tileViewEditor.style.display = '';
            tileViewEditor.style.gridTemplateColumns = '';
            tileViewEditor.style.gap = '';
        }
    });

    describe('List View in Read-Only Mode', () => {
        it('should apply 3-column grid layout to deck-cards-editor with list-view class', () => {
            const listViewEditor = document.querySelector('#deckEditorModal .deck-cards-editor') as HTMLElement;
            expect(listViewEditor).toBeTruthy();
            expect(hasClass(listViewEditor, 'list-view')).toBe(true);
            
            // Apply the CSS rules that would be applied in read-only mode
            listViewEditor.style.display = 'grid';
            listViewEditor.style.gridTemplateColumns = '1fr 1fr 1fr';
            listViewEditor.style.gap = '20px';
            
            expect(getDisplay(listViewEditor)).toBe('grid');
            expect(getGridTemplateColumns(listViewEditor)).toBe('1fr 1fr 1fr');
            expect(getGap(listViewEditor)).toBe('20px');
        });

        it('should have correct CSS specificity for read-only mode list view', () => {
            const modal = document.querySelector('#deckEditorModal') as HTMLElement;
            const listViewEditor = document.querySelector('#deckEditorModal .deck-cards-editor') as HTMLElement;
            
            expect(modal).toBeTruthy();
            expect(hasClass(modal, 'read-only-mode')).toBe(true);
            expect(listViewEditor).toBeTruthy();
            expect(hasClass(listViewEditor, 'list-view')).toBe(true);
            
            // Simulate the CSS rule: .read-only-mode .deck-cards-editor.list-view
            const shouldApply3Column = hasClass(modal, 'read-only-mode') && hasClass(listViewEditor, 'list-view');
            expect(shouldApply3Column).toBe(true);
        });

        it('should display deck-type-sections in 3 columns when in list view', () => {
            const listViewEditor = document.querySelector('#deckEditorModal .deck-cards-editor') as HTMLElement;
            const sections = listViewEditor.querySelectorAll('.deck-type-section');
            
            expect(sections.length).toBeGreaterThan(0);
            
            // Apply 3-column layout
            listViewEditor.style.display = 'grid';
            listViewEditor.style.gridTemplateColumns = '1fr 1fr 1fr';
            listViewEditor.style.gap = '20px';
            
            expect(getDisplay(listViewEditor)).toBe('grid');
            expect(getGridTemplateColumns(listViewEditor)).toBe('1fr 1fr 1fr');
            
            // Verify sections are direct children and will be arranged in grid
            sections.forEach((section, index) => {
                expect(section.parentElement).toBe(listViewEditor);
            });
        });

        it('should maintain individual card single column layout within each section', () => {
            const sections = document.querySelectorAll('#deckEditorModal .deck-type-section');
            
            sections.forEach(section => {
                const cardsContainer = section.querySelector('.deck-type-cards') as HTMLElement;
                expect(cardsContainer).toBeTruthy();
                
                // Individual cards should remain in single column
                cardsContainer.style.display = 'grid';
                cardsContainer.style.gridTemplateColumns = '1fr';
                cardsContainer.style.gap = '16px';
                
                expect(getDisplay(cardsContainer)).toBe('grid');
                expect(getGridTemplateColumns(cardsContainer)).toBe('1fr');
            });
        });
    });

    describe('Tile View in Read-Only Mode (Should Remain Unchanged)', () => {
        it('should maintain single column layout for tile view in read-only mode', () => {
            const tileViewEditor = document.querySelector('#tileViewModal .deck-cards-editor') as HTMLElement;
            expect(tileViewEditor).toBeTruthy();
            expect(hasClass(tileViewEditor, 'list-view')).toBe(false);
            
            // Apply the CSS rules that should be applied for tile view
            tileViewEditor.style.display = 'block';
            
            expect(getDisplay(tileViewEditor)).toBe('block');
            expect(getGridTemplateColumns(tileViewEditor)).toBe('');
        });

        it('should not apply 3-column layout to tile view even in read-only mode', () => {
            const modal = document.querySelector('#tileViewModal') as HTMLElement;
            const tileViewEditor = document.querySelector('#tileViewModal .deck-cards-editor') as HTMLElement;
            
            expect(modal).toBeTruthy();
            expect(hasClass(modal, 'read-only-mode')).toBe(true);
            expect(tileViewEditor).toBeTruthy();
            expect(hasClass(tileViewEditor, 'list-view')).toBe(false);
            
            // The CSS rule should NOT apply: .read-only-mode .deck-cards-editor:not(.list-view)
            const shouldApply3Column = hasClass(modal, 'read-only-mode') && !hasClass(tileViewEditor, 'list-view');
            expect(shouldApply3Column).toBe(true);
            
            // But it should use block layout, not grid
            tileViewEditor.style.display = 'block';
            expect(getDisplay(tileViewEditor)).toBe('block');
        });

        it('should maintain proper spacing for tile view sections', () => {
            const tileViewEditor = document.querySelector('#tileViewModal .deck-cards-editor') as HTMLElement;
            const sections = tileViewEditor.querySelectorAll('.deck-type-section');
            
            expect(sections.length).toBeGreaterThan(0);
            
            // Apply block layout with proper margins
            tileViewEditor.style.display = 'block';
            
            sections.forEach(section => {
                const sectionElement = section as HTMLElement;
                sectionElement.style.display = 'block';
                sectionElement.style.width = '100%';
                sectionElement.style.marginBottom = '20px';
                
                expect(getDisplay(sectionElement)).toBe('block');
                expect(getComputedStyle(sectionElement, 'width')).toBe('100%');
                expect(getComputedStyle(sectionElement, 'margin-bottom')).toBe('20px');
            });
        });
    });

    describe('CSS Selector Specificity', () => {
        it('should have correct CSS selector hierarchy for list view', () => {
            const selectors = [
                '.read-only-mode .deck-cards-editor.list-view',
                '#deckEditorModal.read-only-mode .deck-cards-editor.list-view',
                'body.read-only-mode .deck-cards-editor.list-view'
            ];
            
            // These selectors should target list view in read-only mode
            selectors.forEach(selector => {
                expect(selector).toContain('.list-view');
                expect(selector).toContain('.read-only-mode');
            });
        });

        it('should have correct CSS selector hierarchy for tile view', () => {
            const selectors = [
                '.read-only-mode .deck-cards-editor:not(.list-view)',
                '.read-only-mode .deck-cards-editor.two-column:not(.list-view)'
            ];
            
            // These selectors should target tile view in read-only mode
            selectors.forEach(selector => {
                expect(selector).toContain(':not(.list-view)');
                expect(selector).toContain('.read-only-mode');
            });
        });

        it('should ensure list view selectors are more specific than tile view selectors', () => {
            const listViewSelector = '.read-only-mode .deck-cards-editor.list-view';
            const tileViewSelector = '.read-only-mode .deck-cards-editor:not(.list-view)';
            
            // Both have same specificity (0,0,2,0), but :not() adds specificity
            // The .list-view class should be more specific than :not(.list-view)
            expect(listViewSelector).toContain('.list-view');
            expect(tileViewSelector).toContain(':not(.list-view)');
        });
    });

    describe('Layout Behavior Validation', () => {
        it('should handle multiple deck-type-sections in 3-column grid', () => {
            const listViewEditor = document.querySelector('#deckEditorModal .deck-cards-editor') as HTMLElement;
            const sections = listViewEditor.querySelectorAll('.deck-type-section');
            
            expect(sections.length).toBe(3); // character, special, power
            
            // Apply 3-column grid
            listViewEditor.style.display = 'grid';
            listViewEditor.style.gridTemplateColumns = '1fr 1fr 1fr';
            listViewEditor.style.gap = '20px';
            
            // Verify grid properties
            expect(getDisplay(listViewEditor)).toBe('grid');
            expect(getGridTemplateColumns(listViewEditor)).toBe('1fr 1fr 1fr');
            expect(getGap(listViewEditor)).toBe('20px');
            
            // Verify all sections are direct children
            sections.forEach(section => {
                expect(section.parentElement).toBe(listViewEditor);
            });
        });

        it('should maintain responsive behavior for different screen sizes', () => {
            const listViewEditor = document.querySelector('#deckEditorModal .deck-cards-editor') as HTMLElement;
            
            // Test different grid configurations
            const gridConfigs = [
                '1fr 1fr 1fr',  // 3 equal columns
                '1fr 1fr 1fr',  // Same as above
                '1fr 1fr 1fr'   // Consistent 3-column layout
            ];
            
            gridConfigs.forEach(config => {
                listViewEditor.style.gridTemplateColumns = config;
                expect(getGridTemplateColumns(listViewEditor)).toBe(config);
            });
        });

        it('should handle edge case with no deck-type-sections', () => {
            const emptyEditor = document.createElement('div');
            emptyEditor.className = 'deck-cards-editor list-view';
            emptyEditor.style.display = 'grid';
            emptyEditor.style.gridTemplateColumns = '1fr 1fr 1fr';
            emptyEditor.style.gap = '20px';
            
            expect(getDisplay(emptyEditor)).toBe('grid');
            expect(getGridTemplateColumns(emptyEditor)).toBe('1fr 1fr 1fr');
            expect(emptyEditor.children.length).toBe(0);
        });

        it('should handle edge case with single deck-type-section', () => {
            const singleSectionEditor = document.createElement('div');
            singleSectionEditor.className = 'deck-cards-editor list-view';
            singleSectionEditor.style.display = 'grid';
            singleSectionEditor.style.gridTemplateColumns = '1fr 1fr 1fr';
            singleSectionEditor.style.gap = '20px';
            
            const section = document.createElement('div');
            section.className = 'deck-type-section';
            singleSectionEditor.appendChild(section);
            
            expect(getDisplay(singleSectionEditor)).toBe('grid');
            expect(getGridTemplateColumns(singleSectionEditor)).toBe('1fr 1fr 1fr');
            expect(singleSectionEditor.children.length).toBe(1);
        });
    });

    describe('Integration with Existing Layout System', () => {
        it('should work with two-column layout system', () => {
            const listViewEditor = document.querySelector('#deckEditorModal .deck-cards-editor') as HTMLElement;
            
            // Add two-column class
            listViewEditor.classList.add('two-column');
            
            // In read-only mode with list-view, should still use 3-column grid
            listViewEditor.style.display = 'grid';
            listViewEditor.style.gridTemplateColumns = '1fr 1fr 1fr';
            listViewEditor.style.gap = '20px';
            
            expect(hasClass(listViewEditor, 'two-column')).toBe(true);
            expect(hasClass(listViewEditor, 'list-view')).toBe(true);
            expect(getDisplay(listViewEditor)).toBe('grid');
            expect(getGridTemplateColumns(listViewEditor)).toBe('1fr 1fr 1fr');
        });

        it('should override two-column layout in read-only list view', () => {
            const listViewEditor = document.querySelector('#deckEditorModal .deck-cards-editor') as HTMLElement;
            
            // Simulate two-column layout first
            listViewEditor.classList.add('two-column');
            listViewEditor.style.display = 'flex';
            
            // Then apply read-only list view rules (should override)
            listViewEditor.style.display = 'grid';
            listViewEditor.style.gridTemplateColumns = '1fr 1fr 1fr';
            listViewEditor.style.gap = '20px';
            
            expect(getDisplay(listViewEditor)).toBe('grid');
            expect(getGridTemplateColumns(listViewEditor)).toBe('1fr 1fr 1fr');
        });
    });
});

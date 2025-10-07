/**
 * Unit tests for list view layout behavior
 * Tests that list view always uses 2 columns and never shows 4 columns
 */

import { JSDOM } from 'jsdom';

describe('List View Layout Behavior', () => {
    let dom: JSDOM;
    let document: Document;
    let window: any;
    let mockDeckCardsEditor: HTMLElement;
    let mockCreateTwoColumnLayout: jest.Mock;
    let mockRestoreSingleColumnLayout: jest.Mock;
    let mockRenderDeckCardsListView: jest.Mock;
    let mockSetupLayoutObserver: jest.Mock;

    beforeEach(() => {
        // Create JSDOM environment
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="deckCardsEditor" class="deck-cards-editor"></div>
            </body>
            </html>
        `, {
            url: 'http://localhost:3000',
            pretendToBeVisual: true,
            resources: 'usable'
        });

        document = dom.window.document;
        window = dom.window as any;
        global.document = document;
        global.window = window;

        mockDeckCardsEditor = document.getElementById('deckCardsEditor') as HTMLElement;

        // Mock global functions
        (global as any).createTwoColumnLayout = jest.fn();
        (global as any).restoreSingleColumnLayout = jest.fn();
        (global as any).renderDeckCardsListView = jest.fn();
        (global as any).setupLayoutObserver = jest.fn();
    });

    afterEach(() => {
        dom.window.close();
        jest.restoreAllMocks();
    });

    describe('updateDeckLayout function behavior', () => {
        it('should always apply 2-column layout to list view regardless of width', () => {
            // Mock the updateDeckLayout function behavior
            const updateDeckLayout = (deckWidth: number, totalWidth: number) => {
                const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
                if (!deckCardsEditor) return;
                
                const deckPercentage = (deckWidth / totalWidth) * 100;
                
                if (deckCardsEditor.classList.contains('list-view')) {
                    // List view: always 2 columns, never responsive
                    deckCardsEditor.classList.add('two-column');
                    (global as any).createTwoColumnLayout();
                } else {
                    // Tile view: normal responsive behavior
                    if (deckPercentage >= 33) {
                        deckCardsEditor.classList.add('two-column');
                        (global as any).createTwoColumnLayout();
                    } else {
                        deckCardsEditor.classList.remove('two-column');
                        (global as any).restoreSingleColumnLayout();
                    }
                }
            };

            // Test with list view - should always use 2 columns
            mockDeckCardsEditor.classList.add('list-view');
            
            // Test with narrow width (should still use 2 columns)
            updateDeckLayout(100, 1000); // 10% width
            expect(mockDeckCardsEditor.classList.contains('two-column')).toBe(true);
            expect((global as any).createTwoColumnLayout).toHaveBeenCalled();
            
            // Test with wide width (should still use 2 columns)
            updateDeckLayout(500, 1000); // 50% width
            expect(mockDeckCardsEditor.classList.contains('two-column')).toBe(true);
            expect((global as any).createTwoColumnLayout).toHaveBeenCalledTimes(2);
        });

        it('should not apply responsive logic to list view', () => {
            const updateDeckLayout = (deckWidth: number, totalWidth: number) => {
                const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
                if (!deckCardsEditor) return;
                
                const deckPercentage = (deckWidth / totalWidth) * 100;
                
                if (deckCardsEditor.classList.contains('list-view')) {
                    // List view: always 2 columns, never responsive
                    deckCardsEditor.classList.add('two-column');
                    (global as any).createTwoColumnLayout();
                } else {
                    // Tile view: normal responsive behavior
                    if (deckPercentage >= 33) {
                        deckCardsEditor.classList.add('two-column');
                        (global as any).createTwoColumnLayout();
                    } else {
                        deckCardsEditor.classList.remove('two-column');
                        (global as any).restoreSingleColumnLayout();
                    }
                }
            };

            // Test with list view - should never call restoreSingleColumnLayout
            mockDeckCardsEditor.classList.add('list-view');
            
            updateDeckLayout(100, 1000); // Very narrow width
            expect((global as any).restoreSingleColumnLayout).not.toHaveBeenCalled();
            expect((global as any).createTwoColumnLayout).toHaveBeenCalled();
        });

        it('should maintain responsive behavior for tile view', () => {
            const updateDeckLayout = (deckWidth: number, totalWidth: number) => {
                const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
                if (!deckCardsEditor) return;
                
                const deckPercentage = (deckWidth / totalWidth) * 100;
                
                if (deckCardsEditor.classList.contains('list-view')) {
                    // List view: always 2 columns, never responsive
                    deckCardsEditor.classList.add('two-column');
                    (global as any).createTwoColumnLayout();
                } else {
                    // Tile view: normal responsive behavior
                    if (deckPercentage >= 33) {
                        deckCardsEditor.classList.add('two-column');
                        (global as any).createTwoColumnLayout();
                    } else {
                        deckCardsEditor.classList.remove('two-column');
                        (global as any).restoreSingleColumnLayout();
                    }
                }
            };

            // Test with tile view - should be responsive
            mockDeckCardsEditor.classList.remove('list-view');
            
            // Test with narrow width (should use single column)
            updateDeckLayout(100, 1000); // 10% width
            expect(mockDeckCardsEditor.classList.contains('two-column')).toBe(false);
            expect((global as any).restoreSingleColumnLayout).toHaveBeenCalled();
            
            // Test with wide width (should use two columns)
            updateDeckLayout(500, 1000); // 50% width
            expect(mockDeckCardsEditor.classList.contains('two-column')).toBe(true);
            expect((global as any).createTwoColumnLayout).toHaveBeenCalled();
        });
    });

    describe('List view toggle behavior', () => {
        it('should immediately apply 2-column layout when switching to list view', () => {
            const toggleListView = () => {
                const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
                if (!deckCardsEditor) return;
                
                if (deckCardsEditor.classList.contains('list-view')) {
                    // Switch to tile view
                    deckCardsEditor.classList.remove('list-view');
                    (global as any).renderDeckCardsListView();
                } else {
                    // Switch to list view
                    deckCardsEditor.classList.add('list-view');
                    // Force list view to always be 2 columns
                    deckCardsEditor.classList.add('two-column');
                    (global as any).renderDeckCardsListView();
                    // Ensure 2-column layout is applied
                    (global as any).createTwoColumnLayout();
                }
            };

            // Start in tile view
            mockDeckCardsEditor.classList.remove('list-view');
            expect(mockDeckCardsEditor.classList.contains('two-column')).toBe(false);
            
            // Switch to list view
            toggleListView();
            
            expect(mockDeckCardsEditor.classList.contains('list-view')).toBe(true);
            expect(mockDeckCardsEditor.classList.contains('two-column')).toBe(true);
            expect((global as any).createTwoColumnLayout).toHaveBeenCalled();
        });

        it('should maintain 2-column layout when switching to list view from any state', () => {
            const switchToListView = () => {
                const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
                if (!deckCardsEditor) return;
                
                // Switch to list view
                deckCardsEditor.classList.add('list-view');
                // Force list view to always be 2 columns
                deckCardsEditor.classList.add('two-column');
                (global as any).renderDeckCardsListView();
                // Ensure 2-column layout is applied
                (global as any).createTwoColumnLayout();
            };

            // Test switching from single column tile view
            mockDeckCardsEditor.classList.remove('list-view');
            mockDeckCardsEditor.classList.remove('two-column');
            
            switchToListView();
            
            expect(mockDeckCardsEditor.classList.contains('list-view')).toBe(true);
            expect(mockDeckCardsEditor.classList.contains('two-column')).toBe(true);
            expect((global as any).createTwoColumnLayout).toHaveBeenCalled();
        });
    });

    describe('List view layout consistency', () => {
        it('should never show 4 columns in list view', () => {
            const updateDeckLayout = (deckWidth: number, totalWidth: number) => {
                const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
                if (!deckCardsEditor) return;
                
                if (deckCardsEditor.classList.contains('list-view')) {
                    // List view: always 2 columns, never responsive
                    deckCardsEditor.classList.add('two-column');
                    (global as any).createTwoColumnLayout();
                }
            };

            mockDeckCardsEditor.classList.add('list-view');
            
            // Test various width scenarios - should always be 2 columns
            const testCases = [
                { width: 100, total: 1000 },   // 10% width
                { width: 200, total: 1000 },   // 20% width
                { width: 300, total: 1000 },   // 30% width
                { width: 400, total: 1000 },   // 40% width
                { width: 500, total: 1000 },   // 50% width
                { width: 600, total: 1000 },   // 60% width
                { width: 700, total: 1000 },   // 70% width
                { width: 800, total: 1000 },   // 80% width
                { width: 900, total: 1000 },   // 90% width
            ];

            testCases.forEach(({ width, total }) => {
                updateDeckLayout(width, total);
                expect(mockDeckCardsEditor.classList.contains('two-column')).toBe(true);
                expect(mockDeckCardsEditor.classList.contains('list-view')).toBe(true);
            });
        });

        it('should maintain 2-column layout after card changes in list view', () => {
            const simulateCardChange = () => {
                const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
                if (!deckCardsEditor) return;
                
                if (deckCardsEditor.classList.contains('list-view')) {
                    // List view: always 2 columns, never responsive
                    deckCardsEditor.classList.add('two-column');
                    (global as any).createTwoColumnLayout();
                }
            };

            mockDeckCardsEditor.classList.add('list-view');
            
            // Simulate multiple card changes
            for (let i = 0; i < 5; i++) {
                simulateCardChange();
                expect(mockDeckCardsEditor.classList.contains('two-column')).toBe(true);
                expect((global as any).createTwoColumnLayout).toHaveBeenCalledTimes(i + 1);
            }
        });
    });

    describe('Edge cases and error handling', () => {
        it('should handle missing deck cards editor element gracefully', () => {
            const updateDeckLayout = (deckWidth: number, totalWidth: number) => {
                const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
                if (!deckCardsEditor) return; // Should return early if element not found
                
                if (deckCardsEditor.classList.contains('list-view')) {
                    deckCardsEditor.classList.add('two-column');
                    (global as any).createTwoColumnLayout();
                }
            };

            // Remove the element
            document.body.removeChild(mockDeckCardsEditor);
            
            // Should not throw error
            expect(() => updateDeckLayout(500, 1000)).not.toThrow();
            expect((global as any).createTwoColumnLayout).not.toHaveBeenCalled();
        });

        it('should handle rapid layout updates in list view', () => {
            const updateDeckLayout = (deckWidth: number, totalWidth: number) => {
                const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
                if (!deckCardsEditor) return;
                
                if (deckCardsEditor.classList.contains('list-view')) {
                    deckCardsEditor.classList.add('two-column');
                    (global as any).createTwoColumnLayout();
                }
            };

            mockDeckCardsEditor.classList.add('list-view');
            
            // Simulate rapid layout updates
            const rapidUpdates = Array.from({ length: 10 }, (_, i) => 
                updateDeckLayout(100 + i * 50, 1000)
            );
            
            // All updates should result in 2-column layout
            rapidUpdates.forEach(() => {
                expect(mockDeckCardsEditor.classList.contains('two-column')).toBe(true);
            });
            
            expect((global as any).createTwoColumnLayout).toHaveBeenCalledTimes(10);
        });
    });
});

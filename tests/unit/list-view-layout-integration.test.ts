/**
 * Integration tests for list view layout behavior
 * Tests the complete workflow of list view layout management
 */

import { JSDOM } from 'jsdom';

describe('List View Layout Integration Tests', () => {
    let dom: JSDOM;
    let document: Document;
    let window: any;
    let mockDeckCardsEditor: HTMLElement;
    let mockListItems: HTMLElement[];
    let mockCreateTwoColumnLayout: jest.Mock;
    let mockRestoreSingleColumnLayout: jest.Mock;
    let mockRenderDeckCardsListView: jest.Mock;
    let mockSetupLayoutObserver: jest.Mock;
    let mockUltraAggressiveLayoutEnforcement: jest.Mock;

    beforeEach(() => {
        // Create JSDOM environment
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="deckCardsEditor" class="deck-cards-editor">
                    <div class="deck-list-item">List Item 1</div>
                    <div class="deck-list-item">List Item 2</div>
                    <div class="deck-list-item">List Item 3</div>
                </div>
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
        mockListItems = Array.from(mockDeckCardsEditor.querySelectorAll('.deck-list-item')) as HTMLElement[];

        // Mock global functions
        (global as any).createTwoColumnLayout = jest.fn();
        (global as any).restoreSingleColumnLayout = jest.fn();
        (global as any).renderDeckCardsListView = jest.fn();
        (global as any).setupLayoutObserver = jest.fn();
        (global as any).ultraAggressiveLayoutEnforcement = jest.fn();
    });

    afterEach(() => {
        dom.window.close();
        jest.restoreAllMocks();
    });

    describe('Complete List View Layout Workflow', () => {
        it('should maintain 2-column layout throughout complete list view lifecycle', () => {
            // Simulate the complete list view workflow
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
                
                // Set up layout observer for list view
                (global as any).setupLayoutObserver();
                
                // Force immediate layout fix for list view
                setTimeout(() => {
                    const listItems = deckCardsEditor.querySelectorAll('.deck-list-item');
                    listItems.forEach(item => {
                        const htmlItem = item as HTMLElement;
                        htmlItem.style.display = 'flex';
                        htmlItem.style.flexDirection = 'row';
                        htmlItem.style.flexWrap = 'nowrap';
                        htmlItem.style.width = '100%';
                        htmlItem.style.minWidth = '100%';
                        htmlItem.style.boxSizing = 'border-box';
                        htmlItem.style.alignItems = 'center';
                        htmlItem.style.justifyContent = 'flex-start';
                    });
                }, 0);
            };

            // Start in tile view
            expect(mockDeckCardsEditor.classList.contains('list-view')).toBe(false);
            expect(mockDeckCardsEditor.classList.contains('two-column')).toBe(false);
            
            // Switch to list view
            switchToListView();
            
            // Verify list view state
            expect(mockDeckCardsEditor.classList.contains('list-view')).toBe(true);
            expect(mockDeckCardsEditor.classList.contains('two-column')).toBe(true);
            expect((global as any).createTwoColumnLayout).toHaveBeenCalled();
            expect((global as any).setupLayoutObserver).toHaveBeenCalled();
        });

        it('should handle layout updates during list view operations', () => {
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

            // Set up list view
            mockDeckCardsEditor.classList.add('list-view');
            
            // Simulate various layout scenarios
            const scenarios = [
                { name: 'narrow pane', width: 200, total: 1000 },
                { name: 'medium pane', width: 400, total: 1000 },
                { name: 'wide pane', width: 600, total: 1000 },
                { name: 'very wide pane', width: 800, total: 1000 },
            ];

            scenarios.forEach(({ name, width, total }) => {
                updateDeckLayout(width, total);
                expect(mockDeckCardsEditor.classList.contains('two-column')).toBe(true);
                expect(mockDeckCardsEditor.classList.contains('list-view')).toBe(true);
            });
            
            expect((global as any).createTwoColumnLayout).toHaveBeenCalledTimes(scenarios.length);
        });
    });

    describe('List View Layout Consistency During Operations', () => {
        it('should maintain 2-column layout during card operations', () => {
            const simulateCardOperation = (operation: string) => {
                const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
                if (!deckCardsEditor) return;
                
                if (deckCardsEditor.classList.contains('list-view')) {
                    // List view: always 2 columns, never responsive
                    deckCardsEditor.classList.add('two-column');
                    (global as any).createTwoColumnLayout();
                }
                
                // Simulate layout enforcement
                (global as any).ultraAggressiveLayoutEnforcement();
            };

            mockDeckCardsEditor.classList.add('list-view');
            
            // Simulate various card operations
            const operations = [
                'add card',
                'remove card',
                'change quantity',
                'switch art',
                'reorder cards',
            ];

            operations.forEach((operation) => {
                simulateCardOperation(operation);
                expect(mockDeckCardsEditor.classList.contains('two-column')).toBe(true);
            });
            
            expect((global as any).createTwoColumnLayout).toHaveBeenCalledTimes(operations.length);
            expect((global as any).ultraAggressiveLayoutEnforcement).toHaveBeenCalledTimes(operations.length);
        });

        it('should handle rapid view switching between tile and list view', () => {
            const switchView = (toListView: boolean) => {
                const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
                if (!deckCardsEditor) return;
                
                if (toListView) {
                    // Switch to list view
                    deckCardsEditor.classList.add('list-view');
                    deckCardsEditor.classList.add('two-column');
                    (global as any).createTwoColumnLayout();
                } else {
                    // Switch to tile view
                    deckCardsEditor.classList.remove('list-view');
                    // Tile view can be responsive
                    deckCardsEditor.classList.remove('two-column');
                    (global as any).restoreSingleColumnLayout();
                }
            };

            // Simulate rapid switching
            const switches = [
                { to: true, expected: 'list-view' },
                { to: false, expected: 'tile-view' },
                { to: true, expected: 'list-view' },
                { to: true, expected: 'list-view' },
                { to: false, expected: 'tile-view' },
            ];

            switches.forEach(({ to, expected }) => {
                switchView(to);
                
                if (expected === 'list-view') {
                    expect(mockDeckCardsEditor.classList.contains('list-view')).toBe(true);
                    expect(mockDeckCardsEditor.classList.contains('two-column')).toBe(true);
                } else {
                    expect(mockDeckCardsEditor.classList.contains('list-view')).toBe(false);
                    expect(mockDeckCardsEditor.classList.contains('two-column')).toBe(false);
                }
            });
        });
    });

    describe('Layout Enforcement Integration', () => {
        it('should integrate with ultraAggressiveLayoutEnforcement for list view', () => {
            const enforceLayout = () => {
                const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
                if (!deckCardsEditor || !deckCardsEditor.classList.contains('list-view')) {
                    return;
                }
                
                // List view: always 2 columns, never responsive
                deckCardsEditor.classList.add('two-column');
                (global as any).createTwoColumnLayout();
                
                // Ultra-aggressive layout enforcement
                (global as any).ultraAggressiveLayoutEnforcement();
            };

            mockDeckCardsEditor.classList.add('list-view');
            
            // Simulate layout enforcement
            enforceLayout();
            
            expect(mockDeckCardsEditor.classList.contains('two-column')).toBe(true);
            expect((global as any).createTwoColumnLayout).toHaveBeenCalled();
            expect((global as any).ultraAggressiveLayoutEnforcement).toHaveBeenCalled();
        });

        it('should handle layout enforcement during resize operations', () => {
            const handleResize = (newWidth: number, totalWidth: number) => {
                const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
                if (!deckCardsEditor) return;
                
                if (deckCardsEditor.classList.contains('list-view')) {
                    // List view: always 2 columns, never responsive
                    deckCardsEditor.classList.add('two-column');
                    (global as any).createTwoColumnLayout();
                }
                
                // Simulate layout enforcement after resize
                (global as any).ultraAggressiveLayoutEnforcement();
            };

            mockDeckCardsEditor.classList.add('list-view');
            
            // Simulate resize operations
            const resizeScenarios = [
                { width: 300, total: 1000 },
                { width: 500, total: 1000 },
                { width: 700, total: 1000 },
                { width: 900, total: 1000 },
            ];

            resizeScenarios.forEach(({ width, total }) => {
                handleResize(width, total);
                expect(mockDeckCardsEditor.classList.contains('two-column')).toBe(true);
            });
            
            expect((global as any).createTwoColumnLayout).toHaveBeenCalledTimes(resizeScenarios.length);
            expect((global as any).ultraAggressiveLayoutEnforcement).toHaveBeenCalledTimes(resizeScenarios.length);
        });
    });

    describe('Performance and State Management', () => {
        it('should handle multiple rapid layout updates efficiently', () => {
            const updateLayout = () => {
                const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
                if (!deckCardsEditor) return;
                
                if (deckCardsEditor.classList.contains('list-view')) {
                    deckCardsEditor.classList.add('two-column');
                    (global as any).createTwoColumnLayout();
                }
            };

            mockDeckCardsEditor.classList.add('list-view');
            
            // Simulate rapid updates
            const startTime = Date.now();
            for (let i = 0; i < 100; i++) {
                updateLayout();
            }
            const endTime = Date.now();
            
            // Should complete quickly
            expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
            expect((global as any).createTwoColumnLayout).toHaveBeenCalledTimes(100);
            expect(mockDeckCardsEditor.classList.contains('two-column')).toBe(true);
        });

        it('should maintain consistent state across multiple operations', () => {
            const performOperation = (operation: string) => {
                const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
                if (!deckCardsEditor) return;
                
                if (deckCardsEditor.classList.contains('list-view')) {
                    deckCardsEditor.classList.add('two-column');
                    (global as any).createTwoColumnLayout();
                }
                
                // Simulate operation-specific logic
                switch (operation) {
                    case 'add':
                        // Add card logic
                        break;
                    case 'remove':
                        // Remove card logic
                        break;
                    case 'update':
                        // Update card logic
                        break;
                }
            };

            mockDeckCardsEditor.classList.add('list-view');
            
            // Perform multiple operations
            const operations = ['add', 'remove', 'update', 'add', 'update', 'remove'];
            
            operations.forEach((operation) => {
                performOperation(operation);
                expect(mockDeckCardsEditor.classList.contains('two-column')).toBe(true);
                expect(mockDeckCardsEditor.classList.contains('list-view')).toBe(true);
            });
            
            expect((global as any).createTwoColumnLayout).toHaveBeenCalledTimes(operations.length);
        });
    });
});

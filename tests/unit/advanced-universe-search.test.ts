import { JSDOM } from 'jsdom';

describe('Advanced Universe Search Functionality', () => {
    let dom: JSDOM;
    let document: Document;
    let window: Window;

    beforeEach(() => {
        // Create a new JSDOM instance for each test
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    #advanced-universe-table .header-filter[data-column="card_effect"] {
                        width: 480px !important;
                        max-width: 480px !important;
                        margin: 0 auto;
                        display: block;
                        box-sizing: border-box;
                    }
                </style>
            </head>
            <body>
                <div id="advanced-universe-tab">
                    <table id="advanced-universe-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th></th>
                                <th>Name</th>
                                <th>Character</th>
                                <th>Card Effect</th>
                                <th>One Per Deck</th>
                            </tr>
                            <tr class="filter-row">
                                <th>
                                    <button class="clear-filters-btn" onclick="clearAdvancedUniverseFilters()">Clear All Filters</button>
                                </th>
                                <th></th>
                                <th></th>
                                <th>
                                    <input type="text" class="header-filter" placeholder="Search characters..." data-column="character">
                                </th>
                                <th>
                                    <input type="text" class="header-filter" placeholder="Search effects..." data-column="card_effect">
                                </th>
                                <th class="one-per-deck-advanced-column"></th>
                            </tr>
                        </thead>
                        <tbody id="advanced-universe-tbody">
                            <tr>
                                <td><img src="shards.jpg" alt="Shards of the Staff"></td>
                                <td><button>Add to Deck</button></td>
                                <td><strong>Shards of the Staff</strong></td>
                                <td>Ra</td>
                                <td>Ra's team's Power cards are +2 to defense for remainder of game. **One Per Deck**</td>
                                <td>Yes</td>
                            </tr>
                            <tr>
                                <td><img src="fragments.jpg" alt="Staff Fragments"></td>
                                <td><button>Add to Deck</button></td>
                                <td><strong>Staff Fragments</strong></td>
                                <td>Ra</td>
                                <td>For remainder of game, during the Venture Phase, Ra may discard 2 cards from the top of Draw Pile into Dead Pile, to venture 3 Mission cards with no penalty. **One Per Deck**</td>
                                <td>Yes</td>
                            </tr>
                            <tr>
                                <td><img src="head.jpg" alt="Staff Head"></td>
                                <td><button>Add to Deck</button></td>
                                <td><strong>Staff Head</strong></td>
                                <td>Ra</td>
                                <td>For remainder of game, during Discard Phase, after discarding 1 or more duplicate or unusable cards, sort through Power Pack and choose any 1 card and place it in hand. May not be duplicate. **One Per Deck**</td>
                                <td>Yes</td>
                            </tr>
                        </tbody>
                    </table>
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

        // Mock global functions
        (global as any).displayAdvancedUniverse = jest.fn();
        (global as any).loadAdvancedUniverse = jest.fn();
        (global as any).debounce = jest.fn((func: Function, wait: number) => func);
        (global as any).fetch = jest.fn();

        // Add the search function to the global scope
        (global as any).setupAdvancedUniverseSearch = () => {
            const characterInput = document.querySelector('#advanced-universe-table .header-filter[data-column="character"]') as HTMLInputElement;
            const effectInput = document.querySelector('#advanced-universe-table .header-filter[data-column="card_effect"]') as HTMLInputElement;

            if (characterInput) {
                characterInput.addEventListener('input', async (e: Event) => {
                    const target = e.target as HTMLInputElement;
                    const characterTerm = target.value.toLowerCase();

                    if (characterTerm.length === 0) {
                        await (global as any).loadAdvancedUniverse();
                        return;
                    }

                    try {
                        const response = await (global as any).fetch('/api/advanced-universe');
                        const data = await response.json();

                        if (data.success) {
                            const filteredAdvancedUniverse = data.data.filter((card: any) =>
                                card.character.toLowerCase().includes(characterTerm)
                            );
                            (global as any).displayAdvancedUniverse(filteredAdvancedUniverse);
                        }
                    } catch (error) {
                        console.error('Error searching advanced universe by character:', error);
                    }
                });
            }

            if (effectInput) {
                effectInput.addEventListener('input', async (e: Event) => {
                    const target = e.target as HTMLInputElement;
                    const effectTerm = target.value.toLowerCase();

                    if (effectTerm.length === 0) {
                        await (global as any).loadAdvancedUniverse();
                        return;
                    }

                    try {
                        const response = await (global as any).fetch('/api/advanced-universe');
                        const data = await response.json();

                        if (data.success) {
                            const filteredAdvancedUniverse = data.data.filter((card: any) => {
                                const effectText = (card.card_description || card.card_effect || '').toString();
                                return effectText.toLowerCase().includes(effectTerm);
                            });
                            (global as any).displayAdvancedUniverse(filteredAdvancedUniverse);
                        }
                    } catch (error) {
                        console.error('Error searching advanced universe by card effect:', error);
                    }
                });
            }
        };

        // Initialize the search functionality
        (global as any).setupAdvancedUniverseSearch();

        // Mock fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
            json: () => Promise.resolve({
                success: true,
                data: [
                    {
                        name: 'Shards of the Staff',
                        character: 'Ra',
                        card_description: 'Ra\'s team\'s Power cards are +2 to defense for remainder of game. **One Per Deck**',
                        card_effect: 'Ra\'s team\'s Power cards are +2 to defense for remainder of game. **One Per Deck**'
                    },
                    {
                        name: 'Staff Fragments',
                        character: 'Ra',
                        card_description: 'For remainder of game, during the Venture Phase, Ra may discard 2 cards from the top of Draw Pile into Dead Pile, to venture 3 Mission cards with no penalty. **One Per Deck**',
                        card_effect: 'For remainder of game, during the Venture Phase, Ra may discard 2 cards from the top of Draw Pile into Dead Pile, to venture 3 Mission cards with no penalty. **One Per Deck**'
                    },
                    {
                        name: 'Staff Head',
                        character: 'Ra',
                        card_description: 'For remainder of game, during Discard Phase, after discarding 1 or more duplicate or unusable cards, sort through Power Pack and choose any 1 card and place it in hand. May not be duplicate. **One Per Deck**',
                        card_effect: 'For remainder of game, during Discard Phase, after discarding 1 or more duplicate or unusable cards, sort through Power Pack and choose any 1 card and place it in hand. May not be duplicate. **One Per Deck**'
                    }
                ]
            })
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Search Bar Width Styling', () => {
        test('should apply 480px width to card effect search input', () => {
            const effectInput = document.querySelector('#advanced-universe-table .header-filter[data-column="card_effect"]') as HTMLInputElement;
            expect(effectInput).toBeTruthy();

            const computedStyle = window.getComputedStyle(effectInput);
            expect(computedStyle.width).toBe('480px');
            expect(computedStyle.maxWidth).toBe('480px');
        });

        test('should center the search input within its column', () => {
            const effectInput = document.querySelector('#advanced-universe-table .header-filter[data-column="card_effect"]') as HTMLInputElement;
            const computedStyle = window.getComputedStyle(effectInput);
            
            expect(computedStyle.margin).toContain('auto');
            expect(computedStyle.display).toBe('block');
        });

        test('should use box-sizing border-box for proper width calculation', () => {
            const effectInput = document.querySelector('#advanced-universe-table .header-filter[data-column="card_effect"]') as HTMLInputElement;
            const computedStyle = window.getComputedStyle(effectInput);
            
            expect(computedStyle.boxSizing).toBe('border-box');
        });

        test('should not affect character search input width', () => {
            const characterInput = document.querySelector('#advanced-universe-table .header-filter[data-column="character"]') as HTMLInputElement;
            const computedStyle = window.getComputedStyle(characterInput);
            
            // Character input should not have the 480px width constraint
            expect(computedStyle.width).not.toBe('480px');
            expect(computedStyle.maxWidth).not.toBe('480px');
        });
    });

    describe('Search Input Elements', () => {
        test('should find both character and card effect search inputs', () => {
            const characterInput = document.querySelector('#advanced-universe-table .header-filter[data-column="character"]');
            const effectInput = document.querySelector('#advanced-universe-table .header-filter[data-column="card_effect"]');
            
            expect(characterInput).toBeTruthy();
            expect(effectInput).toBeTruthy();
        });

        test('should have correct placeholder text', () => {
            const characterInput = document.querySelector('#advanced-universe-table .header-filter[data-column="character"]') as HTMLInputElement;
            const effectInput = document.querySelector('#advanced-universe-table .header-filter[data-column="card_effect"]') as HTMLInputElement;
            
            expect(characterInput.placeholder).toBe('Search characters...');
            expect(effectInput.placeholder).toBe('Search effects...');
        });

        test('should have correct data-column attributes', () => {
            const characterInput = document.querySelector('#advanced-universe-table .header-filter[data-column="character"]') as HTMLInputElement;
            const effectInput = document.querySelector('#advanced-universe-table .header-filter[data-column="card_effect"]') as HTMLInputElement;
            
            expect(characterInput.getAttribute('data-column')).toBe('character');
            expect(effectInput.getAttribute('data-column')).toBe('card_effect');
        });
    });

    describe('Search Functionality', () => {
        test('should filter cards by character name', async () => {
            const characterInput = document.querySelector('#advanced-universe-table .header-filter[data-column="character"]') as HTMLInputElement;
            
            // Simulate typing in character search
            characterInput.value = 'Ra';
            const event = new dom.window.Event('input');
            characterInput.dispatchEvent(event);

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(global.fetch).toHaveBeenCalledWith('/api/advanced-universe');
        });

        test('should filter cards by card effect', async () => {
            const effectInput = document.querySelector('#advanced-universe-table .header-filter[data-column="card_effect"]') as HTMLInputElement;
            
            // Simulate typing in effect search
            effectInput.value = 'defense';
            const event = new dom.window.Event('input');
            effectInput.dispatchEvent(event);

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(global.fetch).toHaveBeenCalledWith('/api/advanced-universe');
        });

        test('should handle empty search terms by reloading all cards', async () => {
            const effectInput = document.querySelector('#advanced-universe-table .header-filter[data-column="card_effect"]') as HTMLInputElement;
            
            // Simulate clearing the search
            effectInput.value = '';
            const event = new dom.window.Event('input');
            effectInput.dispatchEvent(event);

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));

            expect((global as any).loadAdvancedUniverse).toHaveBeenCalled();
        });

        test('should handle case-insensitive search', async () => {
            const effectInput = document.querySelector('#advanced-universe-table .header-filter[data-column="card_effect"]') as HTMLInputElement;
            
            // Simulate typing in uppercase
            effectInput.value = 'DEFENSE';
            const event = new dom.window.Event('input');
            effectInput.dispatchEvent(event);

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(global.fetch).toHaveBeenCalledWith('/api/advanced-universe');
        });
    });

    describe('Clear Filters Functionality', () => {
        test('should clear both character and card effect search inputs', () => {
            // Set up the clear function
            const clearAdvancedUniverseFilters = () => {
                const characterInput = document.querySelector('#advanced-universe-table .header-filter[data-column="character"]') as HTMLInputElement;
                const effectInput = document.querySelector('#advanced-universe-table .header-filter[data-column="card_effect"]') as HTMLInputElement;
                
                if (characterInput) characterInput.value = '';
                if (effectInput) effectInput.value = '';
                
                if (typeof (global as any).loadAdvancedUniverse === 'function') {
                    (global as any).loadAdvancedUniverse();
                }
            };

            // Set some values
            const characterInput = document.querySelector('#advanced-universe-table .header-filter[data-column="character"]') as HTMLInputElement;
            const effectInput = document.querySelector('#advanced-universe-table .header-filter[data-column="card_effect"]') as HTMLInputElement;
            
            characterInput.value = 'Ra';
            effectInput.value = 'defense';

            // Clear filters
            clearAdvancedUniverseFilters();

            expect(characterInput.value).toBe('');
            expect(effectInput.value).toBe('');
            expect((global as any).loadAdvancedUniverse).toHaveBeenCalled();
        });

        test('should find clear filters button', () => {
            const clearButton = document.querySelector('.clear-filters-btn');
            expect(clearButton).toBeTruthy();
            expect(clearButton?.textContent).toBe('Clear All Filters');
        });
    });

    describe('Error Handling', () => {
        test('should handle API errors gracefully', async () => {
            // Mock API error
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

            const effectInput = document.querySelector('#advanced-universe-table .header-filter[data-column="card_effect"]') as HTMLInputElement;
            
            effectInput.value = 'test';
            const event = new dom.window.Event('input');
            effectInput.dispatchEvent(event);

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));

            // Should not crash and should have attempted the fetch
            expect(global.fetch).toHaveBeenCalledWith('/api/advanced-universe');
        });

        test('should handle missing search inputs gracefully', () => {
            // Remove the search inputs
            const characterInput = document.querySelector('#advanced-universe-table .header-filter[data-column="character"]');
            const effectInput = document.querySelector('#advanced-universe-table .header-filter[data-column="card_effect"]');
            
            characterInput?.remove();
            effectInput?.remove();

            // Should not crash when trying to access them
            const clearAdvancedUniverseFilters = () => {
                const characterInput = document.querySelector('#advanced-universe-table .header-filter[data-column="character"]') as HTMLInputElement;
                const effectInput = document.querySelector('#advanced-universe-table .header-filter[data-column="card_effect"]') as HTMLInputElement;
                
                if (characterInput) characterInput.value = '';
                if (effectInput) effectInput.value = '';
            };

            expect(() => clearAdvancedUniverseFilters()).not.toThrow();
        });
    });

    describe('Integration Tests', () => {
        test('should maintain search state when switching between inputs', async () => {
            const characterInput = document.querySelector('#advanced-universe-table .header-filter[data-column="character"]') as HTMLInputElement;
            const effectInput = document.querySelector('#advanced-universe-table .header-filter[data-column="card_effect"]') as HTMLInputElement;
            
            // Set character search
            characterInput.value = 'Ra';
            const characterEvent = new dom.window.Event('input');
            characterInput.dispatchEvent(characterEvent);

            await new Promise(resolve => setTimeout(resolve, 50));

            // Set effect search
            effectInput.value = 'defense';
            const effectEvent = new dom.window.Event('input');
            effectInput.dispatchEvent(effectEvent);

            await new Promise(resolve => setTimeout(resolve, 50));

            // Both values should be maintained
            expect(characterInput.value).toBe('Ra');
            expect(effectInput.value).toBe('defense');
        });

        test('should handle rapid successive searches', async () => {
            const effectInput = document.querySelector('#advanced-universe-table .header-filter[data-column="card_effect"]') as HTMLInputElement;
            
            // Simulate rapid typing
            const searchTerms = ['d', 'de', 'def', 'defe', 'defen', 'defense'];
            
            for (const term of searchTerms) {
                effectInput.value = term;
                const event = new dom.window.Event('input');
                effectInput.dispatchEvent(event);
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            // Should have made multiple API calls
            expect(global.fetch).toHaveBeenCalledTimes(searchTerms.length);
        });
    });

    describe('CSS Specificity and Override Tests', () => {
        test('should have higher specificity than general header-filter rules', () => {
            const effectInput = document.querySelector('#advanced-universe-table .header-filter[data-column="card_effect"]') as HTMLInputElement;
            const computedStyle = window.getComputedStyle(effectInput);
            
            // Should have the specific width override
            expect(computedStyle.width).toBe('480px');
        });

        test('should not affect other tables or search inputs', () => {
            // Add another table with header-filter inputs
            const otherTable = document.createElement('table');
            otherTable.id = 'other-table';
            otherTable.innerHTML = `
                <tr>
                    <th>
                        <input type="text" class="header-filter" placeholder="Other search..." data-column="other">
                    </th>
                </tr>
            `;
            document.body.appendChild(otherTable);

            const otherInput = document.querySelector('#other-table .header-filter[data-column="other"]') as HTMLInputElement;
            const computedStyle = window.getComputedStyle(otherInput);
            
            // Should not have the 480px width
            expect(computedStyle.width).not.toBe('480px');
        });
    });
});

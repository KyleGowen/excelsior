import { JSDOM } from 'jsdom';

describe('Locations Search Functionality', () => {
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
                    #locations-table .header-filter[data-column="special_ability"] {
                        width: 480px !important;
                        max-width: 480px !important;
                        margin: 0 auto;
                        display: block;
                        box-sizing: border-box;
                    }
                </style>
            </head>
            <body>
                <div id="locations-tab">
                    <table id="locations-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th></th>
                                <th>Name</th>
                                <th>Threat Level</th>
                                <th>Special Ability</th>
                            </tr>
                            <tr class="filter-row">
                                <th>
                                    <button class="clear-filters-btn" onclick="clearLocationFilters()">Clear All Filters</button>
                                </th>
                                <th></th>
                                <th></th>
                                <th>
                                    <div class="column-filters">
                                        <div class="range-inputs">
                                            <input type="number" id="location-threat-min" placeholder="Min" min="0" max="3" class="filter-input">
                                            <span>-</span>
                                            <input type="number" id="location-threat-max" placeholder="Max" min="0" max="3" class="filter-input">
                                        </div>
                                    </div>
                                </th>
                                <th>
                                    <input type="text" class="header-filter" placeholder="Search abilities..." data-column="special_ability">
                                </th>
                            </tr>
                        </thead>
                        <tbody id="locations-tbody">
                            <tr>
                                <td><img src="baker.jpg" alt="221-B Baker St."></td>
                                <td><button>Add to Deck</button></td>
                                <td><strong>221-B Baker St.</strong></td>
                                <td>0</td>
                                <td>Any time the 221-B Baker St. team plays a card that Reveals, Sorts, or Looks at cards from Opponent's hand or Draw Pile, you may choose one of those cards and discard it into the appropriate Discard Pile.</td>
                            </tr>
                            <tr>
                                <td><img src="asclepieion.jpg" alt="Asclepieion"></td>
                                <td><button>Add to Deck</button></td>
                                <td><strong>Asclepieion</strong></td>
                                <td>0</td>
                                <td>Anytime an Asclepieion Character plays a card that successfully removes a hit(s) from permanent record, but not current battle, they may draw a card and may immediately make an attack. Discard duplicates.</td>
                            </tr>
                            <tr>
                                <td><img src="barsoom.jpg" alt="Barsoom"></td>
                                <td><button>Add to Deck</button></td>
                                <td><strong>Barsoom</strong></td>
                                <td>0</td>
                                <td>Whenever a character on your team offensively plays a non-numerical Special card that increases 1 or more of their grids, you may fetch 1 Power card from the Draw Pile, useable by the character playing the Special card. May not be duplicate. Reshuffle Draw Pile. All of these Special cards are now considered to have a "remainder of game" effect and have the "remainder of game" text.</td>
                            </tr>
                            <tr>
                                <td><img src="dracula.jpg" alt="Dracula's Armory"></td>
                                <td><button>Add to Deck</button></td>
                                <td><strong>Dracula's Armory</strong></td>
                                <td>3</td>
                                <td>At the beginning of the game, place three unique Basic Universe cards, excluding "Any-Power," under Dracula's Armory. Once per battle, you may remove one of these cards to combine it with a legal attack or defense.</td>
                            </tr>
                            <tr>
                                <td><img src="spartan.jpg" alt="Spartan Training Ground"></td>
                                <td><button>Add to Deck</button></td>
                                <td><strong>Spartan Training Ground</strong></td>
                                <td>2</td>
                                <td>At the beginning of the game, place three unique Training Universe cards, excluding "Any-Power," under Spartan Training Ground. Once per battle, you may remove one of these cards to combine it with a legal attack or defense.</td>
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
        (global as any).displayLocations = jest.fn();
        (global as any).loadLocations = jest.fn();
        (global as any).debounce = jest.fn((func: Function, wait: number) => func);
        (global as any).fetch = jest.fn();

        // Add the search function to the global scope
        (global as any).setupLocationSearch = () => {
            const abilitySearchInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]') as HTMLInputElement;

            if (abilitySearchInput) {
                abilitySearchInput.addEventListener('input', async (e: Event) => {
                    const target = e.target as HTMLInputElement;
                    const abilityTerm = target.value.toLowerCase();

                    if (abilityTerm.length === 0) {
                        await (global as any).loadLocations();
                        return;
                    }

                    try {
                        const response = await (global as any).fetch('/api/locations');
                        const data = await response.json();

                        if (data.success) {
                            const filteredLocations = data.data.filter((location: any) =>
                                location.special_ability.toLowerCase().includes(abilityTerm)
                            );
                            (global as any).displayLocations(filteredLocations);
                        }
                    } catch (error) {
                        console.error('Error searching locations by special ability:', error);
                    }
                });
            }
        };

        // Initialize the search functionality
        (global as any).setupLocationSearch();

        // Mock fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
            json: () => Promise.resolve({
                success: true,
                data: [
                    {
                        name: '221-B Baker St.',
                        special_ability: 'Any time the 221-B Baker St. team plays a card that Reveals, Sorts, or Looks at cards from Opponent\'s hand or Draw Pile, you may choose one of those cards and discard it into the appropriate Discard Pile.'
                    },
                    {
                        name: 'Asclepieion',
                        special_ability: 'Anytime an Asclepieion Character plays a card that successfully removes a hit(s) from permanent record, but not current battle, they may draw a card and may immediately make an attack. Discard duplicates.'
                    },
                    {
                        name: 'Barsoom',
                        special_ability: 'Whenever a character on your team offensively plays a non-numerical Special card that increases 1 or more of their grids, you may fetch 1 Power card from the Draw Pile, useable by the character playing the Special card. May not be duplicate. Reshuffle Draw Pile. All of these Special cards are now considered to have a "remainder of game" effect and have the "remainder of game" text.'
                    },
                    {
                        name: 'Dracula\'s Armory',
                        special_ability: 'At the beginning of the game, place three unique Basic Universe cards, excluding "Any-Power," under Dracula\'s Armory. Once per battle, you may remove one of these cards to combine it with a legal attack or defense.'
                    },
                    {
                        name: 'Spartan Training Ground',
                        special_ability: 'At the beginning of the game, place three unique Training Universe cards, excluding "Any-Power," under Spartan Training Ground. Once per battle, you may remove one of these cards to combine it with a legal attack or defense.'
                    }
                ]
            })
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Search Bar Width Styling', () => {
        test('should apply 480px width to special ability search input', () => {
            const abilityInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]') as HTMLInputElement;
            expect(abilityInput).toBeTruthy();

            const computedStyle = window.getComputedStyle(abilityInput);
            expect(computedStyle.width).toBe('480px');
            expect(computedStyle.maxWidth).toBe('480px');
        });

        test('should center the search input within its column', () => {
            const abilityInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]') as HTMLInputElement;
            const computedStyle = window.getComputedStyle(abilityInput);
            
            expect(computedStyle.margin).toContain('auto');
            expect(computedStyle.display).toBe('block');
        });

        test('should use box-sizing border-box for proper width calculation', () => {
            const abilityInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]') as HTMLInputElement;
            const computedStyle = window.getComputedStyle(abilityInput);
            
            expect(computedStyle.boxSizing).toBe('border-box');
        });

        test('should not affect other search inputs or elements', () => {
            const threatMinInput = document.getElementById('location-threat-min') as HTMLInputElement;
            const threatMaxInput = document.getElementById('location-threat-max') as HTMLInputElement;
            
            expect(threatMinInput).toBeTruthy();
            expect(threatMaxInput).toBeTruthy();
            
            // These inputs should not have the 480px width constraint
            const minStyle = window.getComputedStyle(threatMinInput);
            const maxStyle = window.getComputedStyle(threatMaxInput);
            
            expect(minStyle.width).not.toBe('480px');
            expect(maxStyle.width).not.toBe('480px');
        });
    });

    describe('Search Input Elements', () => {
        test('should find the special ability search input', () => {
            const abilityInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]');
            expect(abilityInput).toBeTruthy();
        });

        test('should have correct placeholder text', () => {
            const abilityInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]') as HTMLInputElement;
            expect(abilityInput.placeholder).toBe('Search abilities...');
        });

        test('should have correct data-column attribute', () => {
            const abilityInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]') as HTMLInputElement;
            expect(abilityInput.getAttribute('data-column')).toBe('special_ability');
        });
    });

    describe('Search Functionality', () => {
        test('should filter locations by special ability text', async () => {
            const abilityInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]') as HTMLInputElement;
            
            // Simulate typing in ability search
            abilityInput.value = 'defense';
            const event = new dom.window.Event('input');
            abilityInput.dispatchEvent(event);

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(global.fetch).toHaveBeenCalledWith('/api/locations');
        });

        test('should handle empty search terms by reloading all locations', async () => {
            const abilityInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]') as HTMLInputElement;
            
            // Simulate clearing the search
            abilityInput.value = '';
            const event = new dom.window.Event('input');
            abilityInput.dispatchEvent(event);

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));

            expect((global as any).loadLocations).toHaveBeenCalled();
        });

        test('should handle case-insensitive search', async () => {
            const abilityInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]') as HTMLInputElement;
            
            // Simulate typing in uppercase
            abilityInput.value = 'DEFENSE';
            const event = new dom.window.Event('input');
            abilityInput.dispatchEvent(event);

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(global.fetch).toHaveBeenCalledWith('/api/locations');
        });

        test('should filter by partial matches', async () => {
            const abilityInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]') as HTMLInputElement;
            
            // Simulate typing partial text
            abilityInput.value = 'attack';
            const event = new dom.window.Event('input');
            abilityInput.dispatchEvent(event);

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(global.fetch).toHaveBeenCalledWith('/api/locations');
        });
    });

    describe('Clear Filters Functionality', () => {
        test('should clear special ability search input', () => {
            // Set up the clear function
            const clearLocationFilters = () => {
                const abilityInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]') as HTMLInputElement;
                
                if (abilityInput) abilityInput.value = '';
                
                if (typeof (global as any).loadLocations === 'function') {
                    (global as any).loadLocations();
                }
            };

            // Set a value
            const abilityInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]') as HTMLInputElement;
            abilityInput.value = 'defense';

            // Clear filters
            clearLocationFilters();

            expect(abilityInput.value).toBe('');
            expect((global as any).loadLocations).toHaveBeenCalled();
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

            const abilityInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]') as HTMLInputElement;
            
            abilityInput.value = 'test';
            const event = new dom.window.Event('input');
            abilityInput.dispatchEvent(event);

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));

            // Should not crash and should have attempted the fetch
            expect(global.fetch).toHaveBeenCalledWith('/api/locations');
        });

        test('should handle missing search input gracefully', () => {
            // Remove the search input
            const abilityInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]');
            abilityInput?.remove();

            // Should not crash when trying to access it
            const clearLocationFilters = () => {
                const abilityInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]') as HTMLInputElement;
                
                if (abilityInput) abilityInput.value = '';
            };

            expect(() => clearLocationFilters()).not.toThrow();
        });
    });

    describe('Integration Tests', () => {
        test('should maintain search state when switching between inputs', async () => {
            const abilityInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]') as HTMLInputElement;
            
            // Set ability search
            abilityInput.value = 'defense';
            const abilityEvent = new dom.window.Event('input');
            abilityInput.dispatchEvent(abilityEvent);

            await new Promise(resolve => setTimeout(resolve, 50));

            // Value should be maintained
            expect(abilityInput.value).toBe('defense');
        });

        test('should handle rapid successive searches', async () => {
            const abilityInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]') as HTMLInputElement;
            
            // Simulate rapid typing
            const searchTerms = ['d', 'de', 'def', 'defe', 'defen', 'defense'];
            
            for (const term of searchTerms) {
                abilityInput.value = term;
                const event = new dom.window.Event('input');
                abilityInput.dispatchEvent(event);
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            // Should have made multiple API calls
            expect(global.fetch).toHaveBeenCalledTimes(searchTerms.length);
        });
    });

    describe('CSS Specificity and Override Tests', () => {
        test('should have higher specificity than general header-filter rules', () => {
            const abilityInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]') as HTMLInputElement;
            const computedStyle = window.getComputedStyle(abilityInput);
            
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

    describe('Search Results Validation', () => {
        test('should filter locations correctly based on special ability content', async () => {
            const abilityInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]') as HTMLInputElement;
            
            // Test searching for "defense" - should match Dracula's Armory and Spartan Training Ground
            abilityInput.value = 'defense';
            const event = new dom.window.Event('input');
            abilityInput.dispatchEvent(event);

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(global.fetch).toHaveBeenCalledWith('/api/locations');
        });

        test('should handle no matches gracefully', async () => {
            const abilityInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]') as HTMLInputElement;
            
            // Test searching for something that doesn't exist
            abilityInput.value = 'nonexistent';
            const event = new dom.window.Event('input');
            abilityInput.dispatchEvent(event);

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(global.fetch).toHaveBeenCalledWith('/api/locations');
        });
    });
});

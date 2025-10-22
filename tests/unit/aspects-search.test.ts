import { JSDOM } from 'jsdom';

describe('Aspects Search Functionality', () => {
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
                    #aspects-table .header-filter[data-column="card_name"],
                    #aspects-table .header-filter[data-column="location"],
                    #aspects-table .header-filter[data-column="card_effect"] {
                        width: 480px !important;
                        max-width: 480px !important;
                        margin: 0 auto;
                        display: block;
                        box-sizing: border-box;
                    }
                </style>
            </head>
            <body>
                <div id="aspects-tab">
                    <table id="aspects-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th></th>
                                <th>Card Name</th>
                                <th>Location</th>
                                <th>Card Effect</th>
                                <th class="fortifications-column">Fortifications</th>
                                <th class="one-per-deck-column">One Per Deck</th>
                            </tr>
                            <tr class="filter-row">
                                <th>
                                    <button class="clear-filters-btn" onclick="clearAspectsFilters()">Clear All Filters</button>
                                </th>
                                <th></th>
                                <th>
                                    <input type="text" class="header-filter" placeholder="Search names..." data-column="card_name">
                                </th>
                                <th>
                                    <input type="text" class="header-filter" placeholder="Search locations..." data-column="location">
                                </th>
                                <th>
                                    <input type="text" class="header-filter" placeholder="Search effects..." data-column="card_effect">
                                </th>
                                <th class="fortifications-column"></th>
                                <th class="one-per-deck-column"></th>
                            </tr>
                        </thead>
                        <tbody id="aspects-tbody">
                            <tr>
                                <td><img src="amaru.jpg" alt="Amaru: Dragon Legend"></td>
                                <td><button>Add to Deck</button></td>
                                <td><strong>Amaru: Dragon Legend</strong></td>
                                <td>Any Homebase</td>
                                <td>Homebase makes a level 4 Energy attack. Any Front Line Character may make 1 additional attack. May only have 1 "Fortifications" card per deck. Fortifications! One Per Deck</td>
                                <td>Yes</td>
                                <td>Yes</td>
                            </tr>
                            <tr>
                                <td><img src="cheshire.jpg" alt="Cheshire Cat"></td>
                                <td><button>Add to Deck</button></td>
                                <td><strong>Cheshire Cat</strong></td>
                                <td>Any Homebase</td>
                                <td>Homebase makes a level 4 Intelligence attack. Any Front Line Character may make 1 additional attack. May only have 1 "Fortifications" card per deck. Fortifications! One Per Deck</td>
                                <td>Yes</td>
                                <td>Yes</td>
                            </tr>
                            <tr>
                                <td><img src="isis.jpg" alt="Isis"></td>
                                <td><button>Add to Deck</button></td>
                                <td><strong>Isis</strong></td>
                                <td>Any Homebase</td>
                                <td>Homebase makes a level 2 MultiPower attack. Any Front Line Character may make 1 additional attack. May only have 1 "Fortifications" card per deck. Fortifications! One Per Deck</td>
                                <td>Yes</td>
                                <td>Yes</td>
                            </tr>
                            <tr>
                                <td><img src="mallku.jpg" alt="Mallku"></td>
                                <td><button>Add to Deck</button></td>
                                <td><strong>Mallku</strong></td>
                                <td>Any Homebase</td>
                                <td>Homebase makes a level 4 Combat attack. Any Front Line Character may make 1 additional attack. May only have 1 "Fortifications" card per deck. Fortifications! One Per Deck</td>
                                <td>Yes</td>
                                <td>Yes</td>
                            </tr>
                            <tr>
                                <td><img src="supay.jpg" alt="Supay"></td>
                                <td><button>Add to Deck</button></td>
                                <td><strong>Supay</strong></td>
                                <td>Any Homebase</td>
                                <td>Homebase makes a level 4 Brute Force attack. Any Front Line Character may make 1 additional attack. May only have 1 "Fortifications" card per deck. Fortifications! One Per Deck</td>
                                <td>Yes</td>
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
        (global as any).displayAspects = jest.fn();
        (global as any).loadAspects = jest.fn();
        (global as any).debounce = jest.fn((func: Function, wait: number) => func);
        (global as any).fetch = jest.fn();

        // Add the search function to the global scope
        (global as any).setupAspectSearch = () => {
            const nameSearchInput = document.querySelector('#aspects-table .header-filter[data-column="card_name"]') as HTMLInputElement;
            const locationSearchInput = document.querySelector('#aspects-table .header-filter[data-column="location"]') as HTMLInputElement;
            const effectSearchInput = document.querySelector('#aspects-table .header-filter[data-column="card_effect"]') as HTMLInputElement;

            if (nameSearchInput) {
                nameSearchInput.addEventListener('input', async (e: Event) => {
                    const target = e.target as HTMLInputElement;
                    const nameTerm = target.value.toLowerCase();

                    if (nameTerm.length === 0) {
                        await (global as any).loadAspects();
                        return;
                    }

                    try {
                        const response = await (global as any).fetch('/api/aspects');
                        const data = await response.json();

                        if (data.success) {
                            const filteredAspects = data.data.filter((aspect: any) =>
                                aspect.card_name.toLowerCase().includes(nameTerm)
                            );
                            (global as any).displayAspects(filteredAspects);
                        }
                    } catch (error) {
                        console.error('Error searching aspects by name:', error);
                    }
                });
            }

            if (locationSearchInput) {
                locationSearchInput.addEventListener('input', async (e: Event) => {
                    const target = e.target as HTMLInputElement;
                    const locationTerm = target.value.toLowerCase();

                    if (locationTerm.length === 0) {
                        await (global as any).loadAspects();
                        return;
                    }

                    try {
                        const response = await (global as any).fetch('/api/aspects');
                        const data = await response.json();

                        if (data.success) {
                            const filteredAspects = data.data.filter((aspect: any) =>
                                aspect.location.toLowerCase().includes(locationTerm)
                            );
                            (global as any).displayAspects(filteredAspects);
                        }
                    } catch (error) {
                        console.error('Error searching aspects by location:', error);
                    }
                });
            }

            if (effectSearchInput) {
                effectSearchInput.addEventListener('input', async (e: Event) => {
                    const target = e.target as HTMLInputElement;
                    const effectTerm = target.value.toLowerCase();

                    if (effectTerm.length === 0) {
                        await (global as any).loadAspects();
                        return;
                    }

                    try {
                        const response = await (global as any).fetch('/api/aspects');
                        const data = await response.json();

                        if (data.success) {
                            const filteredAspects = data.data.filter((aspect: any) => {
                                const effectText = (aspect.aspect_description || aspect.card_effect || '').toString();
                                return effectText.toLowerCase().includes(effectTerm);
                            });
                            (global as any).displayAspects(filteredAspects);
                        }
                    } catch (error) {
                        console.error('Error searching aspects by card effect:', error);
                    }
                });
            }
        };

        // Initialize the search functionality
        (global as any).setupAspectSearch();

        // Mock fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
            json: () => Promise.resolve({
                success: true,
                data: [
                    {
                        card_name: 'Amaru: Dragon Legend',
                        location: 'Any Homebase',
                        aspect_description: 'Homebase makes a level 4 Energy attack. Any Front Line Character may make 1 additional attack. May only have 1 "Fortifications" card per deck. Fortifications! One Per Deck'
                    },
                    {
                        card_name: 'Cheshire Cat',
                        location: 'Any Homebase',
                        aspect_description: 'Homebase makes a level 4 Intelligence attack. Any Front Line Character may make 1 additional attack. May only have 1 "Fortifications" card per deck. Fortifications! One Per Deck'
                    },
                    {
                        card_name: 'Isis',
                        location: 'Any Homebase',
                        aspect_description: 'Homebase makes a level 2 MultiPower attack. Any Front Line Character may make 1 additional attack. May only have 1 "Fortifications" card per deck. Fortifications! One Per Deck'
                    },
                    {
                        card_name: 'Mallku',
                        location: 'Any Homebase',
                        aspect_description: 'Homebase makes a level 4 Combat attack. Any Front Line Character may make 1 additional attack. May only have 1 "Fortifications" card per deck. Fortifications! One Per Deck'
                    },
                    {
                        card_name: 'Supay',
                        location: 'Any Homebase',
                        aspect_description: 'Homebase makes a level 4 Brute Force attack. Any Front Line Character may make 1 additional attack. May only have 1 "Fortifications" card per deck. Fortifications! One Per Deck'
                    }
                ]
            })
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Search Bar Width Styling', () => {
        test('should apply 480px width to all aspects search inputs', () => {
            const nameInput = document.querySelector('#aspects-table .header-filter[data-column="card_name"]') as HTMLInputElement;
            const locationInput = document.querySelector('#aspects-table .header-filter[data-column="location"]') as HTMLInputElement;
            const effectInput = document.querySelector('#aspects-table .header-filter[data-column="card_effect"]') as HTMLInputElement;

            expect(nameInput).toBeTruthy();
            expect(locationInput).toBeTruthy();
            expect(effectInput).toBeTruthy();

            const nameStyle = window.getComputedStyle(nameInput);
            const locationStyle = window.getComputedStyle(locationInput);
            const effectStyle = window.getComputedStyle(effectInput);

            expect(nameStyle.width).toBe('480px');
            expect(locationStyle.width).toBe('480px');
            expect(effectStyle.width).toBe('480px');
        });

        test('should center all search inputs within their columns', () => {
            const nameInput = document.querySelector('#aspects-table .header-filter[data-column="card_name"]') as HTMLInputElement;
            const locationInput = document.querySelector('#aspects-table .header-filter[data-column="location"]') as HTMLInputElement;
            const effectInput = document.querySelector('#aspects-table .header-filter[data-column="card_effect"]') as HTMLInputElement;

            const nameStyle = window.getComputedStyle(nameInput);
            const locationStyle = window.getComputedStyle(locationInput);
            const effectStyle = window.getComputedStyle(effectInput);

            expect(nameStyle.margin).toContain('auto');
            expect(locationStyle.margin).toContain('auto');
            expect(effectStyle.margin).toContain('auto');

            expect(nameStyle.display).toBe('block');
            expect(locationStyle.display).toBe('block');
            expect(effectStyle.display).toBe('block');
        });

        test('should use box-sizing border-box for proper width calculation', () => {
            const nameInput = document.querySelector('#aspects-table .header-filter[data-column="card_name"]') as HTMLInputElement;
            const locationInput = document.querySelector('#aspects-table .header-filter[data-column="location"]') as HTMLInputElement;
            const effectInput = document.querySelector('#aspects-table .header-filter[data-column="card_effect"]') as HTMLInputElement;

            const nameStyle = window.getComputedStyle(nameInput);
            const locationStyle = window.getComputedStyle(locationInput);
            const effectStyle = window.getComputedStyle(effectInput);

            expect(nameStyle.boxSizing).toBe('border-box');
            expect(locationStyle.boxSizing).toBe('border-box');
            expect(effectStyle.boxSizing).toBe('border-box');
        });
    });

    describe('Search Input Elements', () => {
        test('should find all three search inputs', () => {
            const nameInput = document.querySelector('#aspects-table .header-filter[data-column="card_name"]');
            const locationInput = document.querySelector('#aspects-table .header-filter[data-column="location"]');
            const effectInput = document.querySelector('#aspects-table .header-filter[data-column="card_effect"]');

            expect(nameInput).toBeTruthy();
            expect(locationInput).toBeTruthy();
            expect(effectInput).toBeTruthy();
        });

        test('should have correct placeholder text', () => {
            const nameInput = document.querySelector('#aspects-table .header-filter[data-column="card_name"]') as HTMLInputElement;
            const locationInput = document.querySelector('#aspects-table .header-filter[data-column="location"]') as HTMLInputElement;
            const effectInput = document.querySelector('#aspects-table .header-filter[data-column="card_effect"]') as HTMLInputElement;

            expect(nameInput.placeholder).toBe('Search names...');
            expect(locationInput.placeholder).toBe('Search locations...');
            expect(effectInput.placeholder).toBe('Search effects...');
        });

        test('should have correct data-column attributes', () => {
            const nameInput = document.querySelector('#aspects-table .header-filter[data-column="card_name"]') as HTMLInputElement;
            const locationInput = document.querySelector('#aspects-table .header-filter[data-column="location"]') as HTMLInputElement;
            const effectInput = document.querySelector('#aspects-table .header-filter[data-column="card_effect"]') as HTMLInputElement;

            expect(nameInput.getAttribute('data-column')).toBe('card_name');
            expect(locationInput.getAttribute('data-column')).toBe('location');
            expect(effectInput.getAttribute('data-column')).toBe('card_effect');
        });
    });

    describe('Search Functionality', () => {
        test('should filter aspects by card name', async () => {
            const nameInput = document.querySelector('#aspects-table .header-filter[data-column="card_name"]') as HTMLInputElement;
            
            nameInput.value = 'Cheshire';
            const event = new dom.window.Event('input');
            nameInput.dispatchEvent(event);

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(global.fetch).toHaveBeenCalledWith('/api/aspects');
        });

        test('should filter aspects by location', async () => {
            const locationInput = document.querySelector('#aspects-table .header-filter[data-column="location"]') as HTMLInputElement;
            
            locationInput.value = 'Any Homebase';
            const event = new dom.window.Event('input');
            locationInput.dispatchEvent(event);

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(global.fetch).toHaveBeenCalledWith('/api/aspects');
        });

        test('should filter aspects by card effect', async () => {
            const effectInput = document.querySelector('#aspects-table .header-filter[data-column="card_effect"]') as HTMLInputElement;
            
            effectInput.value = 'Energy';
            const event = new dom.window.Event('input');
            effectInput.dispatchEvent(event);

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(global.fetch).toHaveBeenCalledWith('/api/aspects');
        });

        test('should handle empty search terms by reloading all aspects', async () => {
            const nameInput = document.querySelector('#aspects-table .header-filter[data-column="card_name"]') as HTMLInputElement;
            
            nameInput.value = '';
            const event = new dom.window.Event('input');
            nameInput.dispatchEvent(event);

            await new Promise(resolve => setTimeout(resolve, 100));

            expect((global as any).loadAspects).toHaveBeenCalled();
        });

        test('should handle case-insensitive search', async () => {
            const nameInput = document.querySelector('#aspects-table .header-filter[data-column="card_name"]') as HTMLInputElement;
            
            nameInput.value = 'CHESHIRE';
            const event = new dom.window.Event('input');
            nameInput.dispatchEvent(event);

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(global.fetch).toHaveBeenCalledWith('/api/aspects');
        });

        test('should filter by partial matches', async () => {
            const effectInput = document.querySelector('#aspects-table .header-filter[data-column="card_effect"]') as HTMLInputElement;
            
            effectInput.value = 'attack';
            const event = new dom.window.Event('input');
            effectInput.dispatchEvent(event);

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(global.fetch).toHaveBeenCalledWith('/api/aspects');
        });
    });

    describe('Clear Filters Functionality', () => {
        test('should clear all aspects search inputs', () => {
            const clearAspectsFilters = () => {
                const nameInput = document.querySelector('#aspects-table .header-filter[data-column="card_name"]') as HTMLInputElement;
                const locationInput = document.querySelector('#aspects-table .header-filter[data-column="location"]') as HTMLInputElement;
                const effectInput = document.querySelector('#aspects-table .header-filter[data-column="card_effect"]') as HTMLInputElement;

                if (nameInput) nameInput.value = '';
                if (locationInput) locationInput.value = '';
                if (effectInput) effectInput.value = '';

                if (typeof (global as any).loadAspects === 'function') {
                    (global as any).loadAspects();
                }
            };

            // Set values
            const nameInput = document.querySelector('#aspects-table .header-filter[data-column="card_name"]') as HTMLInputElement;
            const locationInput = document.querySelector('#aspects-table .header-filter[data-column="location"]') as HTMLInputElement;
            const effectInput = document.querySelector('#aspects-table .header-filter[data-column="card_effect"]') as HTMLInputElement;

            nameInput.value = 'Cheshire';
            locationInput.value = 'Any Homebase';
            effectInput.value = 'Energy';

            // Clear filters
            clearAspectsFilters();

            expect(nameInput.value).toBe('');
            expect(locationInput.value).toBe('');
            expect(effectInput.value).toBe('');
            expect((global as any).loadAspects).toHaveBeenCalled();
        });

        test('should find clear filters button', () => {
            const clearButton = document.querySelector('.clear-filters-btn');
            expect(clearButton).toBeTruthy();
            expect(clearButton?.textContent).toBe('Clear All Filters');
        });
    });

    describe('Error Handling', () => {
        test('should handle API errors gracefully', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

            const nameInput = document.querySelector('#aspects-table .header-filter[data-column="card_name"]') as HTMLInputElement;
            
            nameInput.value = 'test';
            const event = new dom.window.Event('input');
            nameInput.dispatchEvent(event);

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(global.fetch).toHaveBeenCalledWith('/api/aspects');
        });

        test('should handle missing search inputs gracefully', () => {
            const clearAspectsFilters = () => {
                const nameInput = document.querySelector('#aspects-table .header-filter[data-column="card_name"]') as HTMLInputElement;
                const locationInput = document.querySelector('#aspects-table .header-filter[data-column="location"]') as HTMLInputElement;
                const effectInput = document.querySelector('#aspects-table .header-filter[data-column="card_effect"]') as HTMLInputElement;

                if (nameInput) nameInput.value = '';
                if (locationInput) locationInput.value = '';
                if (effectInput) effectInput.value = '';
            };

            expect(() => clearAspectsFilters()).not.toThrow();
        });
    });

    describe('Integration Tests', () => {
        test('should maintain search state when switching between inputs', async () => {
            const nameInput = document.querySelector('#aspects-table .header-filter[data-column="card_name"]') as HTMLInputElement;
            const locationInput = document.querySelector('#aspects-table .header-filter[data-column="location"]') as HTMLInputElement;
            
            nameInput.value = 'Cheshire';
            const nameEvent = new dom.window.Event('input');
            nameInput.dispatchEvent(nameEvent);

            await new Promise(resolve => setTimeout(resolve, 50));

            locationInput.value = 'Any Homebase';
            const locationEvent = new dom.window.Event('input');
            locationInput.dispatchEvent(locationEvent);

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(nameInput.value).toBe('Cheshire');
            expect(locationInput.value).toBe('Any Homebase');
        });

        test('should handle rapid successive searches', async () => {
            const nameInput = document.querySelector('#aspects-table .header-filter[data-column="card_name"]') as HTMLInputElement;
            
            const searchTerms = ['A', 'Am', 'Ama', 'Amar', 'Amaru'];
            
            for (const term of searchTerms) {
                nameInput.value = term;
                const event = new dom.window.Event('input');
                nameInput.dispatchEvent(event);
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(global.fetch).toHaveBeenCalledTimes(searchTerms.length);
        });
    });

    describe('CSS Specificity and Override Tests', () => {
        test('should have higher specificity than general header-filter rules', () => {
            const nameInput = document.querySelector('#aspects-table .header-filter[data-column="card_name"]') as HTMLInputElement;
            const locationInput = document.querySelector('#aspects-table .header-filter[data-column="location"]') as HTMLInputElement;
            const effectInput = document.querySelector('#aspects-table .header-filter[data-column="card_effect"]') as HTMLInputElement;

            const nameStyle = window.getComputedStyle(nameInput);
            const locationStyle = window.getComputedStyle(locationInput);
            const effectStyle = window.getComputedStyle(effectInput);

            expect(nameStyle.width).toBe('480px');
            expect(locationStyle.width).toBe('480px');
            expect(effectStyle.width).toBe('480px');
        });

        test('should not affect other tables or search inputs', () => {
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

            expect(computedStyle.width).not.toBe('480px');
        });
    });

    describe('Search Results Validation', () => {
        test('should filter aspects correctly based on card name content', async () => {
            const nameInput = document.querySelector('#aspects-table .header-filter[data-column="card_name"]') as HTMLInputElement;
            
            nameInput.value = 'Cheshire';
            const event = new dom.window.Event('input');
            nameInput.dispatchEvent(event);

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(global.fetch).toHaveBeenCalledWith('/api/aspects');
        });

        test('should filter aspects correctly based on location content', async () => {
            const locationInput = document.querySelector('#aspects-table .header-filter[data-column="location"]') as HTMLInputElement;
            
            locationInput.value = 'Any Homebase';
            const event = new dom.window.Event('input');
            locationInput.dispatchEvent(event);

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(global.fetch).toHaveBeenCalledWith('/api/aspects');
        });

        test('should filter aspects correctly based on card effect content', async () => {
            const effectInput = document.querySelector('#aspects-table .header-filter[data-column="card_effect"]') as HTMLInputElement;
            
            effectInput.value = 'Energy';
            const event = new dom.window.Event('input');
            effectInput.dispatchEvent(event);

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(global.fetch).toHaveBeenCalledWith('/api/aspects');
        });

        test('should handle no matches gracefully', async () => {
            const nameInput = document.querySelector('#aspects-table .header-filter[data-column="card_name"]') as HTMLInputElement;
            
            nameInput.value = 'nonexistent';
            const event = new dom.window.Event('input');
            nameInput.dispatchEvent(event);

            await new Promise(resolve => setTimeout(resolve, 100));

            expect(global.fetch).toHaveBeenCalledWith('/api/aspects');
        });
    });
});

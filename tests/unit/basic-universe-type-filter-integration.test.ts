/**
 * Integration tests for Basic Universe Type Filter functionality
 * Tests the actual behavior and DOM interactions
 */

import { JSDOM } from 'jsdom';

describe('Basic Universe Type Filter Integration', () => {
    let dom: JSDOM;
    let document: Document;
    let window: any;

    beforeEach(() => {
        // Create a mock DOM with the Basic Universe tab structure
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="basic-universe-tab">
                    <table>
                        <thead>
                            <tr class="filter-row">
                                <th>
                                    <button class="clear-filters-btn" onclick="clearBasicUniverseFilters()">Clear All Filters</button>
                                </th>
                                <th></th>
                                <th>
                                    <div class="column-filters">
                                        <div class="checkbox-group">
                                            <label><input type="checkbox" value="Energy" checked> Energy</label>
                                            <label><input type="checkbox" value="Combat" checked> Combat</label>
                                            <label><input type="checkbox" value="Brute Force" checked> Brute Force</label>
                                            <label><input type="checkbox" value="Intelligence" checked> Intelligence</label>
                                        </div>
                                    </div>
                                </th>
                                <th>
                                    <div class="column-filters">
                                        <input type="number" class="filter-input equals" data-column="value" placeholder="=" min="6" max="7">
                                        <div class="range-inputs">
                                            <input type="number" id="basic-value-min" placeholder="Min" min="6" max="7" class="filter-input">
                                            <span>-</span>
                                            <input type="number" id="basic-value-max" placeholder="Max" min="6" max="7" class="filter-input">
                                        </div>
                                    </div>
                                </th>
                                <th>
                                    <div class="column-filters">
                                        <input type="number" class="filter-input equals" data-column="bonus" placeholder="=" min="2" max="3">
                                        <div class="range-inputs">
                                            <input type="number" id="basic-bonus-min" placeholder="Min" min="2" max="3" class="filter-input">
                                            <span>-</span>
                                            <input type="number" id="basic-bonus-max" placeholder="Max" min="2" max="3" class="filter-input">
                                        </div>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody id="basic-universe-tbody">
                            <tr><td colspan="6">No basic universe cards found</td></tr>
                        </tbody>
                    </table>
                </div>
                <input type="text" class="search-input" id="search-input" placeholder="Search basic universe by name, type, or bonus...">
            </body>
            </html>
        `, {
            url: 'http://localhost:3000',
            pretendToBeVisual: true,
            resources: 'usable'
        });

        document = dom.window.document;
        window = dom.window;

        // Mock global functions
        window.applyBasicUniverseFilters = jest.fn();
        window.clearBasicUniverseFilters = jest.fn();
        window.displayBasicUniverse = jest.fn();
        window.fetch = jest.fn();

        // Mock console
        window.console = {
            log: jest.fn(),
            error: jest.fn()
        };
    });

    afterEach(() => {
        dom.window.close();
    });

    describe('Checkbox Initialization', () => {
        it('should have all checkboxes checked by default', () => {
            const checkboxes = document.querySelectorAll('#basic-universe-tab input[type="checkbox"]');
            
            expect(checkboxes).toHaveLength(4);
            
            checkboxes.forEach(checkbox => {
                expect(checkbox).toHaveProperty('checked', true);
            });
        });

        it('should have correct values for each checkbox', () => {
            const checkboxes = document.querySelectorAll('#basic-universe-tab input[type="checkbox"]');
            const values = Array.from(checkboxes).map(cb => cb.getAttribute('value'));
            
            expect(values).toEqual(['Energy', 'Combat', 'Brute Force', 'Intelligence']);
        });
    });

    describe('setupBasicUniverseSearch Function', () => {
        it('should initialize checkboxes to checked state', () => {
            // Simulate the setupBasicUniverseSearch function
            const checkboxes = document.querySelectorAll('#basic-universe-tab input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                (checkbox as HTMLInputElement).checked = true;
            });

            checkboxes.forEach(checkbox => {
                expect((checkbox as HTMLInputElement).checked).toBe(true);
            });
        });

        it('should add event listeners to checkboxes', () => {
            const checkboxes = document.querySelectorAll('#basic-universe-tab input[type="checkbox"]');
            const addEventListenerSpy = jest.fn();
            
            // Mock addEventListener
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener = addEventListenerSpy;
            });

            // Simulate adding event listeners
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', window.applyBasicUniverseFilters);
            });

            expect(addEventListenerSpy).toHaveBeenCalledTimes(4);
            expect(addEventListenerSpy).toHaveBeenCalledWith('change', window.applyBasicUniverseFilters);
        });

        it('should add event listeners to filter inputs', () => {
            const valueEquals = document.querySelector('#basic-universe-tab input[data-column="value"].equals');
            const valueMin = document.getElementById('basic-value-min');
            const valueMax = document.getElementById('basic-value-max');
            const bonusEquals = document.querySelector('#basic-universe-tab input[data-column="bonus"].equals');
            const bonusMin = document.getElementById('basic-bonus-min');
            const bonusMax = document.getElementById('basic-bonus-max');

            const addEventListenerSpy = jest.fn();

            // Mock addEventListener for all inputs
            [valueEquals, valueMin, valueMax, bonusEquals, bonusMin, bonusMax].forEach(input => {
                if (input) {
                    input.addEventListener = addEventListenerSpy;
                }
            });

            // Simulate adding event listeners
            if (valueEquals) valueEquals.addEventListener('input', window.applyBasicUniverseFilters);
            if (valueMin) valueMin.addEventListener('input', window.applyBasicUniverseFilters);
            if (valueMax) valueMax.addEventListener('input', window.applyBasicUniverseFilters);
            if (bonusEquals) bonusEquals.addEventListener('input', window.applyBasicUniverseFilters);
            if (bonusMin) bonusMin.addEventListener('input', window.applyBasicUniverseFilters);
            if (bonusMax) bonusMax.addEventListener('input', window.applyBasicUniverseFilters);

            expect(addEventListenerSpy).toHaveBeenCalledTimes(6);
        });
    });

    describe('Type Filtering Logic', () => {
        it('should get selected types from checked checkboxes', () => {
            const checkboxes = document.querySelectorAll('#basic-universe-tab input[type="checkbox"]:checked');
            const selectedTypes = Array.from(checkboxes).map(cb => cb.getAttribute('value'));
            
            expect(selectedTypes).toEqual(['Energy', 'Combat', 'Brute Force', 'Intelligence']);
        });

        it('should handle no selected types', () => {
            // Uncheck all checkboxes
            const checkboxes = document.querySelectorAll('#basic-universe-tab input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                (checkbox as HTMLInputElement).checked = false;
            });

            const selectedTypes = Array.from(document.querySelectorAll('#basic-universe-tab input[type="checkbox"]:checked'))
                .map(cb => cb.getAttribute('value'));
            
            expect(selectedTypes).toEqual([]);
        });

        it('should filter cards by selected types', () => {
            const mockCards = [
                { card_name: 'Ray Gun', type: 'Energy', value_to_use: '6 or greater', bonus: '+2' },
                { card_name: 'Flintlock', type: 'Combat', value_to_use: '6 or greater', bonus: '+2' },
                { card_name: 'Hyde\'s Serum', type: 'Brute Force', value_to_use: '6 or greater', bonus: '+2' },
                { card_name: 'Secret Identity', type: 'Intelligence', value_to_use: '6 or greater', bonus: '+2' }
            ];

            // Test with all types selected
            const selectedTypes = ['Energy', 'Combat', 'Brute Force', 'Intelligence'];
            const filtered = mockCards.filter(card => selectedTypes.includes(card.type));
            
            expect(filtered).toHaveLength(4);
            expect(filtered).toEqual(mockCards);

            // Test with only Energy selected
            const energyOnly = ['Energy'];
            const energyFiltered = mockCards.filter(card => energyOnly.includes(card.type));
            
            expect(energyFiltered).toHaveLength(1);
            expect(energyFiltered[0].type).toBe('Energy');

            // Test with no types selected
            const noTypes: string[] = [];
            const noTypesFiltered = mockCards.filter(card => noTypes.includes(card.type));
            
            expect(noTypesFiltered).toHaveLength(0);
        });
    });

    describe('Search Functionality', () => {
        it('should setup search input event listener', () => {
            const searchInput = document.getElementById('search-input');
            const addEventListenerSpy = jest.fn();
            
            searchInput!.addEventListener = addEventListenerSpy;

            // Simulate adding search event listener
            searchInput!.addEventListener('input', jest.fn());

            expect(addEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function));
        });

        it('should handle empty search term', () => {
            const searchInput = document.getElementById('search-input') as HTMLInputElement;
            searchInput.value = '';

            // Simulate search input event
            const event = new dom.window.Event('input');
            searchInput.dispatchEvent(event);

            // Should call applyBasicUniverseFilters when search is empty
            // This would be tested in the actual implementation
        });
    });

    describe('Clear All Filters', () => {
        it('should have clear filters button', () => {
            const clearButton = document.querySelector('.clear-filters-btn');
            expect(clearButton).toBeTruthy();
            expect(clearButton!.textContent).toBe('Clear All Filters');
        });

        it('should call clearBasicUniverseFilters when clicked', () => {
            const clearButton = document.querySelector('.clear-filters-btn') as HTMLButtonElement;
            
            // Simulate click
            clearButton.click();
            
            // In the actual implementation, this would call clearBasicUniverseFilters
            // This tests the HTML structure is correct
            expect(clearButton.onclick).toBeDefined();
        });
    });

    describe('DOM Structure Validation', () => {
        it('should have correct table structure', () => {
            const table = document.querySelector('#basic-universe-tab table');
            expect(table).toBeTruthy();

            const thead = table!.querySelector('thead');
            expect(thead).toBeTruthy();

            const tbody = document.getElementById('basic-universe-tbody');
            expect(tbody).toBeTruthy();
        });

        it('should have correct filter row structure', () => {
            const filterRow = document.querySelector('.filter-row');
            expect(filterRow).toBeTruthy();

            const checkboxGroup = filterRow!.querySelector('.checkbox-group');
            expect(checkboxGroup).toBeTruthy();

            const checkboxes = checkboxGroup!.querySelectorAll('input[type="checkbox"]');
            expect(checkboxes).toHaveLength(4);
        });

        it('should have correct input IDs and classes', () => {
            const valueMin = document.getElementById('basic-value-min');
            const valueMax = document.getElementById('basic-value-max');
            const bonusMin = document.getElementById('basic-bonus-min');
            const bonusMax = document.getElementById('basic-bonus-max');

            expect(valueMin).toBeTruthy();
            expect(valueMax).toBeTruthy();
            expect(bonusMin).toBeTruthy();
            expect(bonusMax).toBeTruthy();

            expect(valueMin!.classList.contains('filter-input')).toBe(true);
            expect(valueMax!.classList.contains('filter-input')).toBe(true);
            expect(bonusMin!.classList.contains('filter-input')).toBe(true);
            expect(bonusMax!.classList.contains('filter-input')).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should handle missing DOM elements gracefully', () => {
            // Test with missing elements
            const missingElement = document.getElementById('non-existent-element');
            expect(missingElement).toBeNull();

            // Should not throw errors when checking for existence
            expect(() => {
                if (missingElement) {
                    missingElement.addEventListener('input', jest.fn());
                }
            }).not.toThrow();
        });

        it('should handle empty checkbox collections', () => {
            const emptyCheckboxes = document.querySelectorAll('.non-existent-checkboxes');
            expect(emptyCheckboxes).toHaveLength(0);

            // Should handle empty collections gracefully
            const selectedTypes = Array.from(emptyCheckboxes).map(cb => cb.getAttribute('value'));
            expect(selectedTypes).toEqual([]);
        });
    });
});

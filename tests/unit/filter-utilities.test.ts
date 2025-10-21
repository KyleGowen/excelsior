/* ========================================
 * FILTER UTILITIES UNIT TESTS
 * ========================================
 * 
 * Unit tests for the filter utilities module created in Step 4
 * of the database view refactoring project.
 * 
 * Purpose: Test filter utility functions and classes
 * Created: Step 4 of database view refactoring project
 * 
 * ======================================== */

import { readFileSync } from 'fs';
import { join } from 'path';

describe('Filter Utilities', () => {
    let filterUtilitiesContent: string;
    let filterManagerContent: string;

    beforeAll(() => {
        // Read the filter utilities file
        const filterUtilitiesPath = join(process.cwd(), 'public/js/filter-utilities.js');
        filterUtilitiesContent = readFileSync(filterUtilitiesPath, 'utf-8');
        
        // Read the filter manager file
        const filterManagerPath = join(process.cwd(), 'public/js/filter-manager.js');
        filterManagerContent = readFileSync(filterManagerPath, 'utf-8');
    });

    describe('Filter Utilities File Structure', () => {
        it('should contain FilterStateManager class', () => {
            expect(filterUtilitiesContent).toContain('class FilterStateManager');
        });

        it('should contain FilterUtilities class', () => {
            expect(filterUtilitiesContent).toContain('class FilterUtilities');
        });

        it('should contain FilterPatterns class', () => {
            expect(filterUtilitiesContent).toContain('class FilterPatterns');
        });

        it('should contain FilterInitialization class', () => {
            expect(filterUtilitiesContent).toContain('class FilterInitialization');
        });

        it('should make classes globally available', () => {
            expect(filterUtilitiesContent).toContain('window.FilterStateManager = FilterStateManager');
            expect(filterUtilitiesContent).toContain('window.FilterUtilities = FilterUtilities');
            expect(filterUtilitiesContent).toContain('window.FilterPatterns = FilterPatterns');
            expect(filterUtilitiesContent).toContain('window.FilterInitialization = FilterInitialization');
            expect(filterUtilitiesContent).toContain('window.filterStateManager = filterStateManager');
        });
    });

    describe('FilterStateManager Class', () => {
        it('should have initializeFilterState method', () => {
            expect(filterUtilitiesContent).toContain('initializeFilterState(tabId, defaultState = {})');
        });

        it('should have getFilterState method', () => {
            expect(filterUtilitiesContent).toContain('getFilterState(tabId)');
        });

        it('should have setFilterState method', () => {
            expect(filterUtilitiesContent).toContain('setFilterState(tabId, state)');
        });

        it('should have clearAllStates method', () => {
            expect(filterUtilitiesContent).toContain('clearAllStates()');
        });

        it('should have markInitialized method', () => {
            expect(filterUtilitiesContent).toContain('markInitialized()');
        });

        it('should have isInitialized method', () => {
            expect(filterUtilitiesContent).toContain('isInitialized()');
        });
    });

    describe('FilterUtilities Class', () => {
        it('should have initializeCheckboxes method', () => {
            expect(filterUtilitiesContent).toContain('static initializeCheckboxes(containerSelector, defaultChecked = true)');
        });

        it('should have getSelectedCheckboxValues method', () => {
            expect(filterUtilitiesContent).toContain('static getSelectedCheckboxValues(containerSelector)');
        });

        it('should have getNumericFilterValues method', () => {
            expect(filterUtilitiesContent).toContain('static getNumericFilterValues(minSelector, maxSelector)');
        });

        it('should have applyNumericFilter method', () => {
            expect(filterUtilitiesContent).toContain('static applyNumericFilter(data, field, min, max)');
        });

        it('should have applyCheckboxFilter method', () => {
            expect(filterUtilitiesContent).toContain('static applyCheckboxFilter(data, field, selectedValues)');
        });

        it('should have applyTextSearchFilter method', () => {
            expect(filterUtilitiesContent).toContain('static applyTextSearchFilter(data, searchTerm, fields)');
        });

        it('should have clearFilters method', () => {
            expect(filterUtilitiesContent).toContain('static clearFilters(containerSelector)');
        });

        it('should have setupFilterEventListeners method', () => {
            expect(filterUtilitiesContent).toContain('static setupFilterEventListeners(containerSelector, callback)');
        });

        it('should have debounce method', () => {
            expect(filterUtilitiesContent).toContain('static debounce(func, wait)');
        });
    });

    describe('FilterPatterns Class', () => {
        it('should have applyBasicUniverseFilters method', () => {
            expect(filterUtilitiesContent).toContain('static async applyBasicUniverseFilters()');
        });

        it('should have applyMissionFilters method', () => {
            expect(filterUtilitiesContent).toContain('static applyMissionFilters()');
        });

        it('should have applyEventFilters method', () => {
            expect(filterUtilitiesContent).toContain('static applyEventFilters()');
        });
    });

    describe('FilterInitialization Class', () => {
        it('should have initializeDatabaseViewFilters method', () => {
            expect(filterUtilitiesContent).toContain('static initializeDatabaseViewFilters()');
        });

        it('should have initializeBasicUniverseFilters method', () => {
            expect(filterUtilitiesContent).toContain('static initializeBasicUniverseFilters()');
        });

        it('should have initializeMissionFilters method', () => {
            expect(filterUtilitiesContent).toContain('static initializeMissionFilters()');
        });

        it('should have initializeEventFilters method', () => {
            expect(filterUtilitiesContent).toContain('static initializeEventFilters()');
        });

        it('should have reinitializeFiltersForTab method', () => {
            expect(filterUtilitiesContent).toContain('static reinitializeFiltersForTab(tabName)');
        });
    });

    describe('Filter Manager File Structure', () => {
        it('should contain FilterManager class', () => {
            expect(filterManagerContent).toContain('class FilterManager');
        });

        it('should make FilterManager globally available', () => {
            expect(filterManagerContent).toContain('window.FilterManager = FilterManager');
            expect(filterManagerContent).toContain('window.filterManager = filterManager');
        });
    });

    describe('FilterManager Class', () => {
        it('should have initialize method', () => {
            expect(filterManagerContent).toContain('async initialize()');
        });

        it('should have registerFilterHandlers method', () => {
            expect(filterManagerContent).toContain('registerFilterHandlers()');
        });

        it('should have setupGlobalEventListeners method', () => {
            expect(filterManagerContent).toContain('setupGlobalEventListeners()');
        });

        it('should have handleTabSwitch method', () => {
            expect(filterManagerContent).toContain('handleTabSwitch(event)');
        });

        it('should have handleFilterChange method', () => {
            expect(filterManagerContent).toContain('handleFilterChange(event)');
        });

        it('should have handleSearchInput method', () => {
            expect(filterManagerContent).toContain('handleSearchInput(event)');
        });

        it('should have applyFilters method', () => {
            expect(filterManagerContent).toContain('applyFilters(tabName)');
        });

        it('should have clearFilters method', () => {
            expect(filterManagerContent).toContain('clearFilters(tabName)');
        });

        it('should have search method', () => {
            expect(filterManagerContent).toContain('search(tabName, searchTerm)');
        });

        it('should have clearAllFilters method', () => {
            expect(filterManagerContent).toContain('clearAllFilters()');
        });

        it('should have getFilterState method', () => {
            expect(filterManagerContent).toContain('getFilterState(tabName)');
        });

        it('should have setFilterState method', () => {
            expect(filterManagerContent).toContain('setFilterState(tabName, state)');
        });
    });

    describe('Filter Handler Registration', () => {
        it('should register basic-universe filter handler', () => {
            expect(filterManagerContent).toContain("this.filterHandlers.set('basic-universe'");
        });

        it('should register missions filter handler', () => {
            expect(filterManagerContent).toContain("this.filterHandlers.set('missions'");
        });

        it('should register events filter handler', () => {
            expect(filterManagerContent).toContain("this.filterHandlers.set('events'");
        });

        it('should register characters filter handler', () => {
            expect(filterManagerContent).toContain("this.filterHandlers.set('characters'");
        });

        it('should register locations filter handler', () => {
            expect(filterManagerContent).toContain("this.filterHandlers.set('locations'");
        });

        it('should register special-cards filter handler', () => {
            expect(filterManagerContent).toContain("this.filterHandlers.set('special-cards'");
        });

        it('should register power-cards filter handler', () => {
            expect(filterManagerContent).toContain("this.filterHandlers.set('power-cards'");
        });
    });

    describe('Auto-initialization', () => {
        it('should auto-initialize when DOM is ready', () => {
            expect(filterManagerContent).toContain('document.addEventListener(\'DOMContentLoaded\'');
            expect(filterManagerContent).toContain('filterManager.initialize()');
        });

        it('should handle case when DOM is already loaded', () => {
            expect(filterManagerContent).toContain('document.readyState === \'loading\'');
            expect(filterManagerContent).toContain('filterManager.initialize()');
        });
    });

    describe('Code Quality', () => {
        it('should have proper documentation headers', () => {
            expect(filterUtilitiesContent).toContain('FILTER UTILITIES');
            expect(filterUtilitiesContent).toContain('Step 4 of the database view refactoring project');
            expect(filterManagerContent).toContain('FILTER MANAGER');
            expect(filterManagerContent).toContain('Step 4 of the database view refactoring project');
        });

        it('should not have trailing whitespace', () => {
            const lines = filterUtilitiesContent.split('\n');
            lines.forEach((line, index) => {
                if (line.endsWith(' ') || line.endsWith('\t')) {
                    throw new Error(`Trailing whitespace found in filter-utilities.js at line ${index + 1}: "${line}"`);
                }
            });

            const managerLines = filterManagerContent.split('\n');
            managerLines.forEach((line, index) => {
                if (line.endsWith(' ') || line.endsWith('\t')) {
                    throw new Error(`Trailing whitespace found in filter-manager.js at line ${index + 1}: "${line}"`);
                }
            });
        });

        it('should have consistent indentation', () => {
            const lines = filterUtilitiesContent.split('\n');
            lines.forEach((line, index) => {
                if (line.trim() && !line.startsWith(' ') && !line.startsWith('\t') && !line.startsWith('/*') && !line.startsWith('*') && !line.startsWith('//') && !line.includes('class ') && !line.includes('function ') && !line.includes('if (') && !line.includes('} else') && !line.includes('} catch') && !line.includes('} finally') && !line.includes('window.') && !line.includes('const ') && !line.includes('let ') && !line.includes('var ')) {
                    // Allow some exceptions for specific patterns
                    if (!line.includes('=') && !line.includes('{') && !line.includes('}') && !line.includes(';') && !line.includes('//') && !line.includes('/*') && !line.includes('*/')) {
                        // This is likely an indentation issue
                        throw new Error(`Potential indentation issue in filter-utilities.js at line ${index + 1}: "${line}"`);
                    }
                }
            });
        });
    });
});

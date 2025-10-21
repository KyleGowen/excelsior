/* ========================================
 * STEP 4 DATABASE VIEW UPDATES UNIT TESTS
 * ========================================
 * 
 * Unit tests for the database-view.js updates made in Step 4
 * of the database view refactoring project.
 * 
 * Purpose: Test integration with new filter system
 * Created: Step 4 of database view refactoring project
 * 
 * ======================================== */

import { readFileSync } from 'fs';
import { join } from 'path';

describe('Step 4 Database View Updates', () => {
    let databaseViewContent: string;
    let databaseHtmlContent: string;

    beforeAll(() => {
        // Read the database view JavaScript file
        const databaseViewPath = join(process.cwd(), 'public/js/database-view.js');
        databaseViewContent = readFileSync(databaseViewPath, 'utf-8');
        
        // Read the database HTML file
        const databaseHtmlPath = join(process.cwd(), 'public/database.html');
        databaseHtmlContent = readFileSync(databaseHtmlPath, 'utf-8');
    });

    describe('Filter System Integration', () => {
        it('should delegate applyBasicUniverseFilters to new filter system', () => {
            expect(databaseViewContent).toContain('if (window.FilterPatterns && window.FilterPatterns.applyBasicUniverseFilters)');
            expect(databaseViewContent).toContain('await window.FilterPatterns.applyBasicUniverseFilters()');
        });

        it('should have fallback implementation for applyBasicUniverseFilters', () => {
            expect(databaseViewContent).toContain('async function applyBasicUniverseFiltersFallback()');
            expect(databaseViewContent).toContain('console.warn(\'New filter system not available, using fallback\')');
        });

        it('should delegate clearBasicUniverseFilters to new filter system', () => {
            expect(databaseViewContent).toContain('if (window.filterManager)');
            expect(databaseViewContent).toContain('window.filterManager.clearFilters(\'basic-universe\')');
        });

        it('should have fallback implementation for clearBasicUniverseFilters', () => {
            expect(databaseViewContent).toContain('function clearBasicUniverseFiltersFallback()');
            expect(databaseViewContent).toContain('console.warn(\'New filter system not available, using fallback\')');
        });

        it('should notify filter manager of tab switches', () => {
            expect(databaseViewContent).toContain('// Notify filter manager of tab switch');
            expect(databaseViewContent).toContain('if (window.filterManager)');
            expect(databaseViewContent).toContain('window.filterManager.handleTabSwitch({ detail: { tabName } })');
        });
    });

    describe('Database HTML Integration', () => {
        it('should include filter utilities script', () => {
            expect(databaseHtmlContent).toContain('<script src="/js/filter-utilities.js"></script>');
        });

        it('should include filter manager script', () => {
            expect(databaseHtmlContent).toContain('<script src="/js/filter-manager.js"></script>');
        });

        it('should have comment indicating Step 4 filter system', () => {
            expect(databaseHtmlContent).toContain('<!-- Step 4: New Filter System -->');
        });

        it('should initialize filter system after template loading', () => {
            expect(databaseHtmlContent).toContain('loadDatabaseViewTemplate().then(() => {');
            expect(databaseHtmlContent).toContain('if (window.filterManager)');
            expect(databaseHtmlContent).toContain('window.filterManager.initialize()');
        });

        it('should have proper error handling for filter system initialization', () => {
            expect(databaseHtmlContent).toContain('console.warn(\'Filter manager not available\')');
        });
    });

    describe('Backward Compatibility', () => {
        it('should maintain existing function signatures', () => {
            expect(databaseViewContent).toContain('async function applyBasicUniverseFilters()');
            expect(databaseViewContent).toContain('function clearBasicUniverseFilters()');
        });

        it('should maintain global function assignments', () => {
            expect(databaseViewContent).toContain('window.applyBasicUniverseFilters = applyBasicUniverseFilters');
            expect(databaseViewContent).toContain('window.clearBasicUniverseFilters = clearBasicUniverseFilters');
        });

        it('should maintain existing switchTab function', () => {
            expect(databaseViewContent).toContain('function switchTab(tabName)');
        });
    });

    describe('Filter System Features', () => {
        it('should have proper error handling in filter delegation', () => {
            expect(databaseViewContent).toContain('console.warn(\'New filter system not available, using fallback\')');
        });

        it('should maintain existing filter functionality as fallback', () => {
            expect(databaseViewContent).toContain('const selectedTypes = Array.from(document.querySelectorAll');
            expect(databaseViewContent).toContain('filtered.filter(card => selectedTypes.includes(card.type))');
        });

        it('should maintain existing clear filter functionality as fallback', () => {
            expect(databaseViewContent).toContain('checkbox.checked = true; // Default to checked');
            expect(databaseViewContent).toContain('applyBasicUniverseFilters()');
        });
    });

    describe('Code Quality', () => {
        it('should have proper documentation for new functionality', () => {
            expect(databaseViewContent).toContain('* Now delegates to the new filter system');
            expect(databaseViewContent).toContain('* (kept for backward compatibility)');
        });

        it('should not have trailing whitespace', () => {
            const lines = databaseViewContent.split('\n');
            lines.forEach((line, index) => {
                if (line.endsWith(' ') || line.endsWith('\t')) {
                    throw new Error(`Trailing whitespace found in database-view.js at line ${index + 1}: "${line}"`);
                }
            });
        });

        it('should maintain consistent code style', () => {
            // Check that new code follows existing patterns
            expect(databaseViewContent).toContain('if (window.FilterPatterns && window.FilterPatterns.applyBasicUniverseFilters) {');
            expect(databaseViewContent).toContain('} else {');
            expect(databaseViewContent).toContain('console.warn(\'New filter system not available, using fallback\');');
        });
    });

    describe('Integration Points', () => {
        it('should properly integrate with existing tab switching', () => {
            expect(databaseViewContent).toContain('// Notify filter manager of tab switch');
            expect(databaseViewContent).toContain('window.filterManager.handleTabSwitch({ detail: { tabName } })');
        });

        it('should maintain existing data loading functionality', () => {
            expect(databaseViewContent).toContain('loadBasicUniverse()');
            expect(databaseViewContent).toContain('displayBasicUniverse(filtered)');
        });

        it('should maintain existing search functionality', () => {
            expect(databaseViewContent).toContain('setupBasicUniverseSearch()');
        });
    });

    describe('Error Handling', () => {
        it('should handle missing filter system gracefully', () => {
            expect(databaseViewContent).toContain('if (window.FilterPatterns && window.FilterPatterns.applyBasicUniverseFilters)');
            expect(databaseViewContent).toContain('if (window.filterManager)');
        });

        it('should provide meaningful error messages', () => {
            expect(databaseViewContent).toContain('console.warn(\'New filter system not available, using fallback\')');
            expect(databaseHtmlContent).toContain('console.warn(\'Filter manager not available\')');
        });

        it('should maintain existing error handling in fallback functions', () => {
            expect(databaseViewContent).toContain('} catch (error) {');
            expect(databaseViewContent).toContain('console.error(\'Error applying basic universe filters:\', error)');
        });
    });
});

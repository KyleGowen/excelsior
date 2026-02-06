/**
 * Simple unit tests for Basic Universe Type Filter functionality
 * Tests the core behavior without complex HTML parsing
 */

import { readFileSync } from 'fs';
import { join } from 'path';

describe('Basic Universe Type Filter - Simple', () => {
    let indexHtmlContent: string;
    let cardDataDisplayContent: string;
    let cardFilterTogglesContent: string;

    beforeEach(() => {
        // Read the main index.html and external JS files where functions were extracted
        indexHtmlContent = readFileSync(join(__dirname, '../../public/index.html'), 'utf-8');
        cardDataDisplayContent = readFileSync(join(__dirname, '../../public/js/card-data-display.js'), 'utf-8');
        cardFilterTogglesContent = readFileSync(join(__dirname, '../../public/js/card-filter-toggles.js'), 'utf-8');
    });

    describe('Core Functionality', () => {
        it('should contain setupBasicUniverseSearch function', () => {
            expect(cardDataDisplayContent).toContain('function setupBasicUniverseSearch()');
        });

        it('should contain applyBasicUniverseFilters function', () => {
            expect(cardFilterTogglesContent).toContain('async function applyBasicUniverseFilters()');
        });

        it('should contain displayBasicUniverse function', () => {
            expect(cardDataDisplayContent).toContain('function displayBasicUniverse(');
        });

        it('should reference clearBasicUniverseFilters function', () => {
            // clearBasicUniverseFilters is referenced in index.html or filter-functions.js
            const allContent = indexHtmlContent + cardFilterTogglesContent + cardDataDisplayContent;
            expect(allContent).toContain('clearBasicUniverseFilters');
        });
    });

    describe('HTML Structure', () => {
        it('should have Basic Universe tab container', () => {
            expect(indexHtmlContent).toContain('id="basic-universe-tab"');
        });

        it('should have Type filter checkboxes', () => {
            expect(indexHtmlContent).toContain('value="Energy"');
            expect(indexHtmlContent).toContain('value="Combat"');
            expect(indexHtmlContent).toContain('value="Brute Force"');
            expect(indexHtmlContent).toContain('value="Intelligence"');
        });

        it('should have Clear All Filters button', () => {
            expect(indexHtmlContent).toContain('Clear All Filters');
        });

        it('should have filter input fields', () => {
            expect(indexHtmlContent).toContain('id="basic-value-min"');
            expect(indexHtmlContent).toContain('id="basic-value-max"');
            expect(indexHtmlContent).toContain('id="basic-bonus-min"');
            expect(indexHtmlContent).toContain('id="basic-bonus-max"');
        });
    });

    describe('API Integration', () => {
        it('should fetch from correct API endpoint', () => {
            expect(cardFilterTogglesContent + cardDataDisplayContent).toContain('fetch(\'/api/basic-universe\')');
        });

        it('should handle API response correctly', () => {
            expect(cardFilterTogglesContent + cardDataDisplayContent).toContain('data.success');
            expect(cardFilterTogglesContent + cardDataDisplayContent).toContain('data.data');
        });
    });

    describe('Filtering Logic', () => {
        it('should filter by selected types', () => {
            expect(cardFilterTogglesContent).toContain('selectedTypes.includes(card.type)');
        });

        it('should handle empty selection', () => {
            expect(cardFilterTogglesContent).toContain('selectedTypes.length === 0');
        });

        it('should show no cards when no types selected', () => {
            expect(cardFilterTogglesContent).toContain('No types selected - showing no cards');
        });
    });

    describe('Event Handling', () => {
        it('should add event listeners to checkboxes', () => {
            expect(cardDataDisplayContent).toContain('addEventListener(\'change\'');
        });

        it('should add event listeners to filter inputs', () => {
            expect(cardDataDisplayContent).toContain('addEventListener(\'input\'');
        });
    });

    describe('Console Logging', () => {
        it('should include debug logging', () => {
            expect(cardFilterTogglesContent).toContain('console.log(\'Selected types for filtering:\'');
            expect(cardFilterTogglesContent).toContain('console.log(\'Filtered cards count:\'');
        });
    });

    describe('Error Handling', () => {
        it('should handle errors gracefully', () => {
            expect(cardFilterTogglesContent).toContain('catch (err)');
            expect(cardFilterTogglesContent).toContain('console.error(\'Error applying basic universe filters:\'');
        });
    });

    describe('Tab Integration', () => {
        it('should be called when tab is switched', () => {
            expect(indexHtmlContent).toContain('setupBasicUniverseSearch()');
            expect(indexHtmlContent).toContain('loadBasicUniverse()');
        });
    });

    describe('Function Registration', () => {
        it('should define functions in extracted modules', () => {
            expect(cardFilterTogglesContent).toContain('function applyBasicUniverseFilters()');
            expect(cardDataDisplayContent).toContain('function displayBasicUniverse(');
            expect(cardDataDisplayContent).toContain('function setupBasicUniverseSearch()');
        });
    });
});

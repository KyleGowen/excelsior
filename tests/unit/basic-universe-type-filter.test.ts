/**
 * Unit tests for Basic Universe Type Filter functionality
 * Tests the setupBasicUniverseSearch and applyBasicUniverseFilters functions
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Helper function to extract complete function body by counting braces
function extractFunctionBody(content: string, functionName: string): string | null {
    const functionRegex = new RegExp(`function\\s+${functionName}\\s*\\([^)]*\\)\\s*\\{`);
    const match = content.match(functionRegex);
    
    if (!match) {
        return null;
    }
    
    const startIndex = match.index! + match[0].length - 1; // -1 to include the opening brace
    let braceCount = 1;
    let currentIndex = startIndex + 1;
    
    while (currentIndex < content.length && braceCount > 0) {
        const char = content[currentIndex];
        if (char === '{') {
            braceCount++;
        } else if (char === '}') {
            braceCount--;
        }
        currentIndex++;
    }
    
    if (braceCount === 0) {
        return content.substring(match.index!, currentIndex);
    }
    
    return null;
}

describe('Basic Universe Type Filter', () => {
    let indexHtmlContent: string;
    let mockDocument: any;
    let mockFetch: jest.Mock;
    let mockConsole: any;

    beforeEach(() => {
        // Read the main index.html file
        indexHtmlContent = readFileSync(join(__dirname, '../../public/index.html'), 'utf-8');
        
        // Mock document object
        mockDocument = {
            querySelectorAll: jest.fn(),
            querySelector: jest.fn(),
            getElementById: jest.fn(),
            addEventListener: jest.fn()
        };

        // Mock fetch
        mockFetch = jest.fn();
        global.fetch = mockFetch;

        // Mock console
        mockConsole = {
            log: jest.fn(),
            error: jest.fn()
        };
        global.console = mockConsole;

        // Mock window object
        global.window = {
            ...global.window,
            document: mockDocument
        } as any;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('setupBasicUniverseSearch function', () => {
        it('should be defined in index.html', () => {
            expect(indexHtmlContent).toContain('function setupBasicUniverseSearch()');
        });

        it('should initialize checkboxes to checked by default', () => {
            const mockCheckboxes = [
                { checked: false, value: 'Energy', addEventListener: jest.fn() },
                { checked: false, value: 'Combat', addEventListener: jest.fn() },
                { checked: false, value: 'Brute Force', addEventListener: jest.fn() },
                { checked: false, value: 'Intelligence', addEventListener: jest.fn() }
            ];

            mockDocument.querySelectorAll.mockReturnValue(mockCheckboxes);

            // Extract and execute the setupBasicUniverseSearch function
            const functionCode = extractFunctionBody(indexHtmlContent, 'setupBasicUniverseSearch');
            expect(functionCode).toBeTruthy();
            expect(functionCode).toContain('checkbox.checked = true');
            expect(functionCode).toContain('checkboxes.forEach(checkbox => {');
        });

        it('should add event listeners to checkboxes', () => {
            const functionCode = extractFunctionBody(indexHtmlContent, 'setupBasicUniverseSearch');
            expect(functionCode).toBeTruthy();
            
            expect(functionCode).toContain('checkbox.addEventListener(\'change\', applyBasicUniverseFilters)');
        });

        it('should add event listeners to other filter inputs', () => {
            const functionCode = extractFunctionBody(indexHtmlContent, 'setupBasicUniverseSearch');
            expect(functionCode).toBeTruthy();
            
            expect(functionCode).toContain('if (valueEquals) valueEquals.addEventListener(\'input\', applyBasicUniverseFilters)');
            expect(functionCode).toContain('if (valueMin) valueMin.addEventListener(\'input\', applyBasicUniverseFilters)');
            expect(functionCode).toContain('if (valueMax) valueMax.addEventListener(\'input\', applyBasicUniverseFilters)');
            expect(functionCode).toContain('if (bonusEquals) bonusEquals.addEventListener(\'input\', applyBasicUniverseFilters)');
            expect(functionCode).toContain('if (bonusMin) bonusMin.addEventListener(\'input\', applyBasicUniverseFilters)');
            expect(functionCode).toContain('if (bonusMax) bonusMax.addEventListener(\'input\', applyBasicUniverseFilters)');
        });

        it('should setup search functionality', () => {
            const functionCode = extractFunctionBody(indexHtmlContent, 'setupBasicUniverseSearch');
            expect(functionCode).toBeTruthy();
            
            expect(functionCode).toContain('searchInput.addEventListener(\'input\', async (e) => {');
            expect(functionCode).toContain('await applyBasicUniverseFilters()');
        });
    });

    describe('applyBasicUniverseFilters function', () => {
        it('should be defined in index.html', () => {
            expect(indexHtmlContent).toContain('async function applyBasicUniverseFilters()');
        });

        it('should fetch data from /api/basic-universe', () => {
            const functionCode = extractFunctionBody(indexHtmlContent, 'applyBasicUniverseFilters');
            expect(functionCode).toBeTruthy();
            expect(functionCode).toContain('fetch(\'/api/basic-universe\')');
        });

        it('should filter by selected types', () => {
            const functionCode = extractFunctionBody(indexHtmlContent, 'applyBasicUniverseFilters');
            expect(functionCode).toBeTruthy();
            
            expect(functionCode).toContain('input[type="checkbox"]:checked');
            expect(functionCode).toContain('filtered.filter(card => selectedTypes.includes(card.type))');
        });

        it('should show no cards when no types are selected', () => {
            const functionCode = extractFunctionBody(indexHtmlContent, 'applyBasicUniverseFilters');
            expect(functionCode).toBeTruthy();
            expect(functionCode).toContain('if (selectedTypes.length === 0)');
            expect(functionCode).toContain('filtered = []');
            expect(functionCode).toContain('No types selected - showing no cards');
        });

        it('should include console logging for debugging', () => {
            const functionCode = extractFunctionBody(indexHtmlContent, 'applyBasicUniverseFilters');
            expect(functionCode).toBeTruthy();
            expect(functionCode).toContain('console.log(\'Selected types for filtering:\', selectedTypes)');
            expect(functionCode).toContain('console.log(\'Filtered cards count:\', filtered.length)');
            expect(functionCode).toContain('console.log(\'No types selected - showing no cards\')');
        });

        it('should handle value range filtering', () => {
            const functionCode = extractFunctionBody(indexHtmlContent, 'applyBasicUniverseFilters');
            expect(functionCode).toBeTruthy();
            expect(functionCode).toContain('basic-value-min');
            expect(functionCode).toContain('basic-value-max');
            expect(functionCode).toContain('value_to_use');
        });

        it('should handle bonus range filtering', () => {
            const functionCode = extractFunctionBody(indexHtmlContent, 'applyBasicUniverseFilters');
            expect(functionCode).toBeTruthy();
            expect(functionCode).toContain('basic-bonus-min');
            expect(functionCode).toContain('basic-bonus-max');
            expect(functionCode).toContain('card.bonus');
        });

        it('should call displayBasicUniverse with filtered results', () => {
            const functionCode = extractFunctionBody(indexHtmlContent, 'applyBasicUniverseFilters');
            expect(functionCode).toBeTruthy();
            expect(functionCode).toContain('displayBasicUniverse(filtered)');
        });

        it('should handle errors gracefully', () => {
            const functionCode = extractFunctionBody(indexHtmlContent, 'applyBasicUniverseFilters');
            expect(functionCode).toBeTruthy();
            expect(functionCode).toContain('catch (err)');
            expect(functionCode).toContain('console.error(\'Error applying basic universe filters:\', err)');
        });
    });

    describe('Type Filter Integration', () => {
        it('should have proper HTML structure for checkboxes', () => {
            expect(indexHtmlContent).toContain('id="basic-universe-tab"');
            expect(indexHtmlContent).toContain('value="Energy" checked');
            expect(indexHtmlContent).toContain('value="Combat" checked');
            expect(indexHtmlContent).toContain('value="Brute Force" checked');
            expect(indexHtmlContent).toContain('value="Intelligence" checked');
        });

        it('should have Clear All Filters button', () => {
            expect(indexHtmlContent).toContain('Clear All Filters');
            expect(indexHtmlContent).toContain('onclick="clearBasicUniverseFilters()"');
        });

        it('should have proper tab switching integration', () => {
            expect(indexHtmlContent).toContain('setupBasicUniverseSearch()');
            expect(indexHtmlContent).toContain('loadBasicUniverse()');
        });
    });

    describe('Filter Logic Validation', () => {
        it('should handle empty selected types correctly', () => {
            const functionCode = extractFunctionBody(indexHtmlContent, 'applyBasicUniverseFilters');
            expect(functionCode).toBeTruthy();
            
            // Should check for empty array
            expect(functionCode).toContain('selectedTypes.length === 0');
            
            // Should set filtered to empty array
            expect(functionCode).toContain('filtered = []');
        });

        it('should filter cards by type when types are selected', () => {
            const functionCode = extractFunctionBody(indexHtmlContent, 'applyBasicUniverseFilters');
            expect(functionCode).toBeTruthy();
            
            // Should filter by selected types
            expect(functionCode).toContain('filtered.filter(card => selectedTypes.includes(card.type))');
        });

        it('should maintain all filter types (Energy, Combat, Brute Force, Intelligence)', () => {
            // Check that the HTML contains all four types
            expect(indexHtmlContent).toContain('value="Energy"');
            expect(indexHtmlContent).toContain('value="Combat"');
            expect(indexHtmlContent).toContain('value="Brute Force"');
            expect(indexHtmlContent).toContain('value="Intelligence"');
        });
    });

    describe('Error Handling', () => {
        it('should handle API fetch errors', () => {
            const functionCode = extractFunctionBody(indexHtmlContent, 'applyBasicUniverseFilters');
            expect(functionCode).toBeTruthy();
            expect(functionCode).toContain('if (!data.success) return');
        });

        it('should handle missing DOM elements gracefully', () => {
            const functionCode = extractFunctionBody(indexHtmlContent, 'setupBasicUniverseSearch');
            expect(functionCode).toBeTruthy();
            expect(functionCode).toContain('if (valueEquals)');
            expect(functionCode).toContain('if (valueMin)');
            expect(functionCode).toContain('if (valueMax)');
            expect(functionCode).toContain('if (bonusEquals)');
            expect(functionCode).toContain('if (bonusMin)');
            expect(functionCode).toContain('if (bonusMax)');
            expect(functionCode).toContain('if (searchInput)');
        });
    });

    describe('Performance Considerations', () => {
        it('should use efficient DOM queries', () => {
            const functionCode = extractFunctionBody(indexHtmlContent, 'applyBasicUniverseFilters');
            expect(functionCode).toBeTruthy();
            
            // Should use efficient selectors
            expect(functionCode).toContain('#basic-universe-tab input[type="checkbox"]:checked');
        });

        it('should avoid redundant API calls', () => {
            const functionCode = extractFunctionBody(indexHtmlContent, 'setupBasicUniverseSearch');
            expect(functionCode).toBeTruthy();
            
            // Should only fetch when search term is empty
            expect(functionCode).toContain('if (searchTerm.length === 0)');
        });
    });
});

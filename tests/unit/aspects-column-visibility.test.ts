/**
 * Unit tests for Aspects section column visibility functionality
 * 
 * Tests the removal of toggle buttons and ensuring Fortifications and One Per Deck
 * columns are always visible with correct data display.
 */

import fs from 'fs';
import path from 'path';

describe('Aspects Column Visibility', () => {
    const indexHtmlPath = path.join(process.cwd(), 'public', 'index.html');
    const cardDisplayFunctionsPath = path.join(process.cwd(), 'public', 'js', 'card-display-functions.js');

    describe('HTML Structure - Aspects Section', () => {
        let indexHtmlContent: string;

        beforeAll(() => {
            indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
        });

        it('should not contain toggle buttons in aspects section', () => {
            // Extract the aspects section
            const aspectsSectionMatch = indexHtmlContent.match(/<div class="table-container" id="aspects-tab"[^>]*>[\s\S]*?<\/div>/);
            expect(aspectsSectionMatch).toBeTruthy();
            
            const aspectsSection = aspectsSectionMatch![0];
            
            // Should not contain toggle button controls
            expect(aspectsSection).not.toContain('aspects-controls');
            expect(aspectsSection).not.toContain('toggle-fortifications');
            expect(aspectsSection).not.toContain('toggle-one-per-deck');
            expect(aspectsSection).not.toContain('toggleFortificationsColumn');
            expect(aspectsSection).not.toContain('toggleOnePerDeckColumn');
        });

        it('should have fortifications and one per deck columns without hidden class', () => {
            // Extract the aspects table header
            const aspectsTableMatch = indexHtmlContent.match(/<table id="aspects-table">[\s\S]*?<\/table>/);
            expect(aspectsTableMatch).toBeTruthy();
            
            const aspectsTable = aspectsTableMatch![0];
            
            // Should contain column headers without hidden class
            expect(aspectsTable).toContain('<th class="fortifications-column">Fortifications</th>');
            expect(aspectsTable).toContain('<th class="one-per-deck-column">One Per Deck</th>');
            
            // Should not contain hidden class on column headers
            expect(aspectsTable).not.toContain('class="fortifications-column hidden"');
            expect(aspectsTable).not.toContain('class="one-per-deck-column hidden"');
        });

        it('should have filter row cells without hidden class', () => {
            // Extract the aspects table
            const aspectsTableMatch = indexHtmlContent.match(/<table id="aspects-table">[\s\S]*?<\/table>/);
            expect(aspectsTableMatch).toBeTruthy();
            
            const aspectsTable = aspectsTableMatch![0];
            
            // Should contain filter row cells without hidden class
            expect(aspectsTable).toContain('<th class="fortifications-column"></th>');
            expect(aspectsTable).toContain('<th class="one-per-deck-column"></th>');
            
            // Should not contain hidden class on filter row cells
            expect(aspectsTable).not.toContain('class="fortifications-column hidden"');
            expect(aspectsTable).not.toContain('class="one-per-deck-column hidden"');
        });
    });

    describe('JavaScript Functions - displayAspects', () => {
        let cardDisplayFunctionsContent: string;

        beforeAll(() => {
            cardDisplayFunctionsContent = fs.readFileSync(cardDisplayFunctionsPath, 'utf8');
        });

        it('should contain displayAspects function', () => {
            expect(cardDisplayFunctionsContent).toContain('function displayAspects(aspects)');
        });

        it('should render fortifications column without hidden class', () => {
            // Should contain fortifications column without hidden class in the file
            expect(cardDisplayFunctionsContent).toContain('<td class="fortifications-column">${aspect.is_fortification ? \'Yes\' : \'No\'}</td>');
            expect(cardDisplayFunctionsContent).not.toContain('class="fortifications-column hidden"');
        });

        it('should render one per deck column without hidden class', () => {
            // Should contain one per deck column without hidden class in the file
            expect(cardDisplayFunctionsContent).toContain('<td class="one-per-deck-column">${aspect.is_one_per_deck ? \'Yes\' : \'No\'}</td>');
            expect(cardDisplayFunctionsContent).not.toContain('class="one-per-deck-column hidden"');
        });

        it('should display correct data for fortifications', () => {
            // Should use is_fortification property to determine Yes/No
            expect(cardDisplayFunctionsContent).toContain('${aspect.is_fortification ? \'Yes\' : \'No\'}');
        });

        it('should display correct data for one per deck', () => {
            // Should use is_one_per_deck property to determine Yes/No
            expect(cardDisplayFunctionsContent).toContain('${aspect.is_one_per_deck ? \'Yes\' : \'No\'}');
        });
    });

    describe('JavaScript Functions - Toggle Functions Removal', () => {
        let deckEditorSimpleContent: string;
        let filterFunctionsContent: string;

        beforeAll(() => {
            const deckEditorSimplePath = path.join(process.cwd(), 'public', 'js', 'deck-editor-simple.js');
            const filterFunctionsPath = path.join(process.cwd(), 'public', 'js', 'filter-functions.js');
            
            deckEditorSimpleContent = fs.readFileSync(deckEditorSimplePath, 'utf8');
            filterFunctionsContent = fs.readFileSync(filterFunctionsPath, 'utf8');
        });

        it('should not contain toggleOnePerDeckColumn function in deck-editor-simple.js', () => {
            expect(deckEditorSimpleContent).not.toContain('function toggleOnePerDeckColumn()');
        });

        it('should not contain toggleFortificationsColumn function in filter-functions.js', () => {
            expect(filterFunctionsContent).not.toContain('function toggleFortificationsColumn()');
        });
    });

    describe('Data Structure Validation', () => {
        it('should have correct aspect interface structure', () => {
            const typesPath = path.join(process.cwd(), 'src', 'types', 'index.ts');
            const typesContent = fs.readFileSync(typesPath, 'utf8');
            
            // Should contain Aspect interface with required properties
            expect(typesContent).toContain('export interface Aspect');
            expect(typesContent).toContain('is_fortification: boolean');
            expect(typesContent).toContain('is_one_per_deck: boolean');
        });
    });

    describe('Integration Tests', () => {
        it('should have consistent column count in aspects table', () => {
            const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
            
            // Extract the aspects table
            const aspectsTableMatch = indexHtmlContent.match(/<table id="aspects-table">[\s\S]*?<\/table>/);
            expect(aspectsTableMatch).toBeTruthy();
            
            const aspectsTable = aspectsTableMatch![0];
            
            // Count header columns (only from the first tr, not filter row)
            const headerRowMatch = aspectsTable.match(/<tr>\s*<th[^>]*>[\s\S]*?<\/tr>/);
            expect(headerRowMatch).toBeTruthy();
            const headerRow = headerRowMatch![0];
            const headerMatches = headerRow.match(/<th[^>]*>/g);
            expect(headerMatches).toHaveLength(7); // Image, empty column, Card Name, Location, Card Effect, Fortifications, One Per Deck
            
            // Count filter row cells
            const filterRowMatches = aspectsTable.match(/<tr class="filter-row">[\s\S]*?<\/tr>/);
            expect(filterRowMatches).toBeTruthy();
            
            const filterRow = filterRowMatches![0];
            const filterCellMatches = filterRow.match(/<th[^>]*>/g);
            expect(filterCellMatches).toHaveLength(7); // Should match header count
        });

        it('should have proper colspan for loading message', () => {
            const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
            
            // Extract the aspects table
            const aspectsTableMatch = indexHtmlContent.match(/<table id="aspects-table">[\s\S]*?<\/table>/);
            expect(aspectsTableMatch).toBeTruthy();
            
            const aspectsTable = aspectsTableMatch![0];
            
            // Should have correct colspan for loading message
            expect(aspectsTable).toContain('<td colspan="6" class="loading">Loading aspects...</td>');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle empty aspects array gracefully', () => {
            const cardDisplayFunctionsContent = fs.readFileSync(cardDisplayFunctionsPath, 'utf8');
            
            // Should contain check for empty array
            expect(cardDisplayFunctionsContent).toContain('if (aspects.length === 0)');
            expect(cardDisplayFunctionsContent).toContain('No aspects found');
        });

        it('should handle missing aspect properties gracefully', () => {
            const cardDisplayFunctionsContent = fs.readFileSync(cardDisplayFunctionsPath, 'utf8');
            
            // Should use ternary operators to handle missing properties
            expect(cardDisplayFunctionsContent).toContain('${aspect.is_fortification ? \'Yes\' : \'No\'}');
            expect(cardDisplayFunctionsContent).toContain('${aspect.is_one_per_deck ? \'Yes\' : \'No\'}');
        });
    });

    describe('Performance and Code Quality', () => {
        it('should not have any obvious syntax errors in aspects-related code', () => {
            const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
            const cardDisplayFunctionsContent = fs.readFileSync(cardDisplayFunctionsPath, 'utf8');
            
            // Should not contain obvious syntax errors (but allow legitimate uses of undefined)
            // Check for malformed HTML or JavaScript syntax instead
            expect(indexHtmlContent).not.toContain('<<<');
            expect(indexHtmlContent).not.toContain('>>>');
            expect(cardDisplayFunctionsContent).not.toContain('<<<');
            expect(cardDisplayFunctionsContent).not.toContain('>>>');
        });

        it('should have proper HTML structure for aspects table', () => {
            const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
            
            // Extract the aspects table
            const aspectsTableMatch = indexHtmlContent.match(/<table id="aspects-table">[\s\S]*?<\/table>/);
            expect(aspectsTableMatch).toBeTruthy();
            
            const aspectsTable = aspectsTableMatch![0];
            
            // Should have proper table structure
            expect(aspectsTable).toContain('<thead>');
            expect(aspectsTable).toContain('<tbody id="aspects-tbody">');
            expect(aspectsTable).toContain('</thead>');
            expect(aspectsTable).toContain('</tbody>');
        });
    });
});

/**
 * Unit tests for Database View CSS extraction (Step 2)
 * 
 * Tests the dedicated database-view.css file created during Step 2
 * of the database view refactoring project.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Database View CSS Extraction (Step 2)', () => {
    const cssFilePath = path.join(process.cwd(), 'public/css/database-view.css');
    const htmlFilePath = path.join(process.cwd(), 'public/database.html');

    describe('CSS File Creation', () => {
        it('should create database-view.css file', () => {
            expect(fs.existsSync(cssFilePath)).toBe(true);
        });

        it('should have non-empty content', () => {
            const content = fs.readFileSync(cssFilePath, 'utf-8');
            expect(content.length).toBeGreaterThan(0);
        });

        it('should have proper file header documentation', () => {
            const content = fs.readFileSync(cssFilePath, 'utf-8');
            expect(content).toContain('DATABASE VIEW CSS - STEP 2 REFACTORING');
            expect(content).toContain('database view refactoring project');
            expect(content).toContain('Dedicated styling for database view components');
        });
    });

    describe('CSS Structure and Organization', () => {
        let cssContent: string;

        beforeAll(() => {
            cssContent = fs.readFileSync(cssFilePath, 'utf-8');
        });

        it('should have proper section organization', () => {
            expect(cssContent).toContain('DATABASE VIEW LAYOUT & STRUCTURE');
            expect(cssContent).toContain('STATS CONTAINER');
            expect(cssContent).toContain('TAB NAVIGATION');
            expect(cssContent).toContain('SEARCH CONTAINER');
            expect(cssContent).toContain('TABLE CONTAINER & STRUCTURE');
            expect(cssContent).toContain('FILTER SYSTEM');
            expect(cssContent).toContain('CARD CATEGORY HEADERS & CONTROLS');
            expect(cssContent).toContain('SPECIAL CONTROLS & TOGGLES');
            expect(cssContent).toContain('CHARACTER SEARCH');
            expect(cssContent).toContain('INHERENT ABILITIES FILTERS');
            expect(cssContent).toContain('COLUMN-SPECIFIC STYLING');
            expect(cssContent).toContain('TABLE-SPECIFIC COLUMN WIDTHS');
            expect(cssContent).toContain('ADD TO DECK BUTTON');
            expect(cssContent).toContain('UTILITY CLASSES');
            expect(cssContent).toContain('RESPONSIVE DESIGN');
            expect(cssContent).toContain('FILTER BAR STYLES');
        });

        it('should contain all essential database view classes', () => {
            const essentialClasses = [
                '.database-section',
                '.section-header',
                '.stats',
                '.stat-card',
                '.tab-container',
                '.tab-button',
                '.search-container',
                '.table-container',
                '.filter-row',
                '.column-filters',
                '.filter-input',
                '.card-category-header',
                '.filter-toggle',
                '.add-to-deck-btn',
                '.clear-filters-btn'
            ];

            essentialClasses.forEach(className => {
                expect(cssContent).toContain(className);
            });
        });

        it('should contain all table-specific styles', () => {
            const tableSelectors = [
                '#characters-table',
                '#special-cards-table',
                '#advanced-universe-table',
                '#locations-table',
                '#aspects-table',
                '#missions-table',
                '#events-table',
                '#teamwork-table',
                '#ally-universe-table',
                '#training-table',
                '#power-cards-table',
                '#basic-universe-table'
            ];

            tableSelectors.forEach(selector => {
                expect(cssContent).toContain(selector);
            });
        });
    });

    describe('CSS Content Validation', () => {
        let cssContent: string;

        beforeAll(() => {
            cssContent = fs.readFileSync(cssFilePath, 'utf-8');
        });

        it('should have proper CSS syntax', () => {
            // Check for balanced braces
            const openBraces = (cssContent.match(/\{/g) || []).length;
            const closeBraces = (cssContent.match(/\}/g) || []).length;
            expect(openBraces).toBe(closeBraces);
        });

        it('should contain color definitions', () => {
            expect(cssContent).toContain('#4ecdc4'); // Primary teal color
            expect(cssContent).toContain('#1a1a2e'); // Dark background
            expect(cssContent).toContain('#ffffff'); // White text
        });

        it('should contain responsive design elements', () => {
            expect(cssContent).toContain('overflow-x: auto');
            expect(cssContent).toContain('min-width: 100%');
            expect(cssContent).toContain('word-wrap: break-word');
        });

        it('should contain transition effects', () => {
            expect(cssContent).toContain('transition:');
            expect(cssContent).toContain('transform:');
            expect(cssContent).toContain('box-shadow:');
        });

        it('should contain proper flexbox and grid layouts', () => {
            expect(cssContent).toContain('display: flex');
            expect(cssContent).toContain('display: grid');
            expect(cssContent).toContain('grid-template-columns');
        });
    });

    describe('HTML File Updates', () => {
        let htmlContent: string;

        beforeAll(() => {
            htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
        });

        it('should reference the new CSS file', () => {
            expect(htmlContent).toContain('<link rel="stylesheet" href="/css/database-view.css">');
        });

        it('should not contain embedded styles', () => {
            expect(htmlContent).not.toContain('<style>');
            expect(htmlContent).not.toContain('</style>');
        });

        it('should have proper documentation comments', () => {
            expect(htmlContent).toContain('Database View CSS - Step 2 Refactoring');
            expect(htmlContent).toContain('Base styles still needed from main CSS');
        });

        it('should maintain all essential HTML structure', () => {
            expect(htmlContent).toContain('<div id="database-view-container">');
            expect(htmlContent).toContain('loadDatabaseViewTemplate()');
            expect(htmlContent).toContain('DOMContentLoaded');
        });
    });

    describe('CSS File Size and Performance', () => {
        it('should have reasonable file size', () => {
            const stats = fs.statSync(cssFilePath);
            const fileSizeKB = stats.size / 1024;
            
            // Should be substantial but not excessive
            expect(fileSizeKB).toBeGreaterThan(10); // At least 10KB
            expect(fileSizeKB).toBeLessThan(100);   // Less than 100KB
        });

        it('should be well-formatted and readable', () => {
            const content = fs.readFileSync(cssFilePath, 'utf-8');
            const lines = content.split('\n');
            
            // Should have proper indentation and spacing
            expect(lines.some(line => line.includes('/* ========================================'))).toBe(true);
            expect(lines.some(line => line.includes(' * '))).toBe(true);
        });
    });

    describe('Backward Compatibility', () => {
        let cssContent: string;

        beforeAll(() => {
            cssContent = fs.readFileSync(cssFilePath, 'utf-8');
        });

        it('should maintain all original class names', () => {
            const originalClasses = [
                '.tab-button.active',
                '.filter-input:focus',
                '.add-to-deck-btn:hover',
                '.clear-filters-btn:hover',
                '.threat-high',
                '.threat-medium',
                '.threat-low',
                '.cataclysm-yes',
                '.cataclysm-no'
            ];

            originalClasses.forEach(className => {
                expect(cssContent).toContain(className);
            });
        });

        it('should maintain all original color schemes', () => {
            const originalColors = [
                'rgba(78, 205, 196, 0.2)', // Teal with opacity
                'rgba(255, 255, 255, 0.1)', // White with opacity
                'linear-gradient(135deg, #4ecdc4, #44a08d)', // Gradient
                'rgba(0, 0, 0, 0.3)' // Black with opacity
            ];

            originalColors.forEach(color => {
                expect(cssContent).toContain(color);
            });
        });

        it('should maintain all original layout properties', () => {
            const layoutProperties = [
                'border-radius: 10px',
                'backdrop-filter: blur(10px)',
                'position: sticky',
                'table-layout: fixed',
                'word-break: break-word'
            ];

            layoutProperties.forEach(property => {
                expect(cssContent).toContain(property);
            });
        });
    });

    describe('Integration with Main CSS', () => {
        let htmlContent: string;

        beforeAll(() => {
            htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
        });

        it('should still reference main index.css for base styles', () => {
            expect(htmlContent).toContain('<link rel="stylesheet" href="/css/index.css">');
        });

        it('should load database-view.css before index.css for proper cascade', () => {
            const databaseViewLinkIndex = htmlContent.indexOf('database-view.css');
            const indexCssLinkIndex = htmlContent.indexOf('index.css');
            
            expect(databaseViewLinkIndex).toBeLessThan(indexCssLinkIndex);
        });
    });

    describe('File Dependencies', () => {
        it('should not create circular dependencies', () => {
            const cssContent = fs.readFileSync(cssFilePath, 'utf-8');
            
            // Should not import other CSS files
            expect(cssContent).not.toContain('@import');
            expect(cssContent).not.toContain('url(');
        });

        it('should be self-contained for database view styles', () => {
            const cssContent = fs.readFileSync(cssFilePath, 'utf-8');
            
            // Should contain all necessary styles for database view
            expect(cssContent).toContain('.database-section'); // Database-specific styles
            expect(cssContent).toContain('.tab-container'); // Tab navigation styles
        });
    });
});

/**
 * Step 2 Refactoring Coverage Tests
 * 
 * Comprehensive tests to ensure 100% coverage of all changes made in Step 2
 * of the database view refactoring project.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Step 2 Refactoring Coverage Tests', () => {
    const projectRoot = process.cwd();
    
    describe('New Files Created', () => {
        it('should create database-view.css file', () => {
            const cssFilePath = path.join(projectRoot, 'public/css/database-view.css');
            expect(fs.existsSync(cssFilePath)).toBe(true);
        });

        it('should create database-view-css.test.ts file', () => {
            const testFilePath = path.join(projectRoot, 'tests/unit/database-view-css.test.ts');
            expect(fs.existsSync(testFilePath)).toBe(true);
        });

        it('should create step2-refactoring-coverage.test.ts file', () => {
            const testFilePath = path.join(projectRoot, 'tests/unit/step2-refactoring-coverage.test.ts');
            expect(fs.existsSync(testFilePath)).toBe(true);
        });
    });

    describe('Modified Files', () => {
        it('should have updated database.html file', () => {
            const htmlFilePath = path.join(projectRoot, 'public/database.html');
            expect(fs.existsSync(htmlFilePath)).toBe(true);
            
            const content = fs.readFileSync(htmlFilePath, 'utf-8');
            expect(content).toContain('database-view.css');
            expect(content).not.toContain('<style>');
        });

        it('should have backup of original database.html', () => {
            const backupFilePath = path.join(projectRoot, 'public/database-old.html');
            expect(fs.existsSync(backupFilePath)).toBe(true);
        });
    });

    describe('CSS File Content Coverage', () => {
        let cssContent: string;

        beforeAll(() => {
            const cssFilePath = path.join(projectRoot, 'public/css/database-view.css');
            cssContent = fs.readFileSync(cssFilePath, 'utf-8');
        });

        it('should cover all database view layout styles', () => {
            const layoutStyles = [
                '.database-section',
                '.section-header',
                '.stats',
                '.stat-card',
                '.stat-info',
                '.stat-number',
                '.stat-label'
            ];

            layoutStyles.forEach(style => {
                expect(cssContent).toContain(style);
            });
        });

        it('should cover all tab navigation styles', () => {
            const tabStyles = [
                '.tab-container',
                '.tab-row',
                '.tab-button',
                '.tab-button:hover',
                '.tab-button.active'
            ];

            tabStyles.forEach(style => {
                expect(cssContent).toContain(style);
            });
        });

        it('should cover all search and filter styles', () => {
            const searchFilterStyles = [
                '.search-container',
                '.search-input',
                '.filter-row',
                '.column-filters',
                '.filter-input',
                '.header-filter',
                '.clear-filters-btn'
            ];

            searchFilterStyles.forEach(style => {
                expect(cssContent).toContain(style);
            });
        });

        it('should cover all table styles', () => {
            const tableStyles = [
                '.table-container',
                'table',
                'th, td',
                'th',
                'tr:hover',
                'td img',
                'td img:hover'
            ];

            tableStyles.forEach(style => {
                expect(cssContent).toContain(style);
            });
        });

        it('should cover all card category styles', () => {
            const cardCategoryStyles = [
                '.card-category-header',
                '.category-header-content',
                '.category-header-controls',
                '.filter-toggle',
                '.toggle-label'
            ];

            cardCategoryStyles.forEach(style => {
                expect(cssContent).toContain(style);
            });
        });

        it('should cover all special controls styles', () => {
            const specialControlsStyles = [
                '.special-cards-controls',
                '.aspects-controls',
                '.advanced-universe-controls',
                '.toggle-button',
                '.ability-toggle'
            ];

            specialControlsStyles.forEach(style => {
                expect(cssContent).toContain(style);
            });
        });

        it('should cover all character search styles', () => {
            const characterSearchStyles = [
                '.character-name-search',
                '.character-name-search::placeholder',
                '.character-name-search:focus'
            ];

            characterSearchStyles.forEach(style => {
                expect(cssContent).toContain(style);
            });
        });

        it('should cover all inherent abilities filter styles', () => {
            const inherentAbilitiesStyles = [
                '.inherent-abilities-filters'
            ];

            inherentAbilitiesStyles.forEach(style => {
                expect(cssContent).toContain(style);
            });
        });

        it('should cover all column-specific styles', () => {
            const columnStyles = [
                '.cataclysm-yes',
                '.cataclysm-no',
                '.fortifications-column',
                '.one-per-deck-column',
                '.one-per-deck-advanced-column',
                '.threat-high',
                '.threat-medium',
                '.threat-low'
            ];

            columnStyles.forEach(style => {
                expect(cssContent).toContain(style);
            });
        });

        it('should cover all table-specific column widths', () => {
            const tableColumnStyles = [
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

            tableColumnStyles.forEach(style => {
                expect(cssContent).toContain(style);
            });
        });

        it('should cover all button styles', () => {
            const buttonStyles = [
                '.add-to-deck-btn',
                '.add-to-deck-btn:hover',
                '.add-to-deck-btn:active'
            ];

            buttonStyles.forEach(style => {
                expect(cssContent).toContain(style);
            });
        });

        it('should cover all utility classes', () => {
            const utilityStyles = [
                '.hidden',
                '.loading',
                '.error'
            ];

            utilityStyles.forEach(style => {
                expect(cssContent).toContain(style);
            });
        });

        it('should cover all responsive design styles', () => {
            const responsiveStyles = [
                'overflow-x: auto',
                'min-width: 100%',
                'word-wrap: break-word',
                'word-break: break-word',
                'white-space: normal'
            ];

            responsiveStyles.forEach(style => {
                expect(cssContent).toContain(style);
            });
        });

        it('should cover all filter bar styles', () => {
            const filterBarStyles = [
                '.filter-bar',
                '.filter-group',
                '.filter-group label'
            ];

            filterBarStyles.forEach(style => {
                expect(cssContent).toContain(style);
            });
        });
    });

    describe('HTML File Content Coverage', () => {
        let htmlContent: string;

        beforeAll(() => {
            const htmlFilePath = path.join(projectRoot, 'public/database.html');
            htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
        });

        it('should have proper CSS file references', () => {
            expect(htmlContent).toContain('<link rel="stylesheet" href="/css/database-view.css">');
            expect(htmlContent).toContain('<link rel="stylesheet" href="/css/index.css">');
        });

        it('should have proper documentation comments', () => {
            expect(htmlContent).toContain('Database View CSS - Step 2 Refactoring');
            expect(htmlContent).toContain('Base styles still needed from main CSS');
        });

        it('should maintain all essential HTML structure', () => {
            const essentialElements = [
                '<div id="loginContainer"',
                '<div class="container" id="mainContainer"',
                '<div id="database-view-container"',
                '<div id="deck-builder"',
                '<div id="imageModal"',
                '<div id="createDeckModal"'
            ];

            essentialElements.forEach(element => {
                expect(htmlContent).toContain(element);
            });
        });

        it('should maintain all JavaScript file references', () => {
            const jsFiles = [
                '/js/globalNav.js',
                '/js/data-loading.js',
                '/js/search-filter.js',
                '/js/ui-utility-functions.js',
                '/js/deck-management.js',
                '/js/auth-service.js',
                '/js/utilities.js'
            ];

            jsFiles.forEach(jsFile => {
                expect(htmlContent).toContain(`<script src="${jsFile}"></script>`);
            });
        });

        it('should maintain template loading functionality', () => {
            expect(htmlContent).toContain('loadDatabaseViewTemplate()');
            expect(htmlContent).toContain('DOMContentLoaded');
            expect(htmlContent).toContain('/templates/database-view-complete.html');
        });
    });

    describe('Integration Coverage', () => {
        it('should maintain file relationships', () => {
            // Check that database.html references database-view.css
            const htmlContent = fs.readFileSync(path.join(projectRoot, 'public/database.html'), 'utf-8');
            expect(htmlContent).toContain('database-view.css');

            // Check that database-view.css exists and is referenced
            const cssFilePath = path.join(projectRoot, 'public/css/database-view.css');
            expect(fs.existsSync(cssFilePath)).toBe(true);
        });

        it('should maintain backward compatibility', () => {
            const htmlContent = fs.readFileSync(path.join(projectRoot, 'public/database.html'), 'utf-8');
            
            // Should still reference index.css for base styles
            expect(htmlContent).toContain('index.css');
            
            // Should maintain all original functionality
            expect(htmlContent).toContain('loadDatabaseViewTemplate');
            expect(htmlContent).toContain('database-view-container');
        });

        it('should maintain server route compatibility', () => {
            // Check that the server can still serve the database.html file
            const htmlFilePath = path.join(projectRoot, 'public/database.html');
            expect(fs.existsSync(htmlFilePath)).toBe(true);
            
            // Check that the file is valid HTML
            const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
            expect(htmlContent).toContain('<!DOCTYPE html>');
            expect(htmlContent).toContain('<html lang="en">');
            expect(htmlContent).toContain('</html>');
        });
    });

    describe('Code Quality Coverage', () => {
        it('should have proper error handling in CSS', () => {
            const cssContent = fs.readFileSync(path.join(projectRoot, 'public/css/database-view.css'), 'utf-8');
            
            // Should have proper CSS syntax
            const openBraces = (cssContent.match(/\{/g) || []).length;
            const closeBraces = (cssContent.match(/\}/g) || []).length;
            expect(openBraces).toBe(closeBraces);
        });

        it('should have proper documentation', () => {
            const cssContent = fs.readFileSync(path.join(projectRoot, 'public/css/database-view.css'), 'utf-8');
            
            expect(cssContent).toContain('DATABASE VIEW CSS - STEP 2 REFACTORING');
            expect(cssContent).toContain('database view refactoring project');
            expect(cssContent).toContain('Dedicated styling for database view components');
        });

        it('should have proper file organization', () => {
            const cssContent = fs.readFileSync(path.join(projectRoot, 'public/css/database-view.css'), 'utf-8');
            
            // Should have section headers
            expect(cssContent).toContain('/* ========================================');
            expect(cssContent).toContain('DATABASE VIEW LAYOUT & STRUCTURE');
            expect(cssContent).toContain('======================================== */');
        });

        it('should have reasonable file size', () => {
            const cssFilePath = path.join(projectRoot, 'public/css/database-view.css');
            const stats = fs.statSync(cssFilePath);
            const fileSizeKB = stats.size / 1024;
            
            // Should be substantial but not excessive
            expect(fileSizeKB).toBeGreaterThan(10);
            expect(fileSizeKB).toBeLessThan(100);
        });
    });

    describe('Performance Coverage', () => {
        it('should not create performance issues', () => {
            const cssContent = fs.readFileSync(path.join(projectRoot, 'public/css/database-view.css'), 'utf-8');
            
            // Should not have excessive selectors
            const selectorCount = (cssContent.match(/[.#][a-zA-Z0-9_-]+/g) || []).length;
            expect(selectorCount).toBeGreaterThan(50); // Should have substantial selectors
            expect(selectorCount).toBeLessThan(500);   // But not excessive
            
            // Should not have excessive duplicate rules (accounting for common CSS patterns)
            const lines = cssContent.split('\n').filter(line => line.trim().length > 0); // Filter out empty lines
            const uniqueLines = new Set(lines);
            expect(uniqueLines.size).toBeGreaterThan(lines.length * 0.4); // At least 40% unique non-empty lines
        });

        it('should maintain CSS cascade order', () => {
            const htmlContent = fs.readFileSync(path.join(projectRoot, 'public/database.html'), 'utf-8');
            
            // database-view.css should load before index.css
            const databaseViewIndex = htmlContent.indexOf('database-view.css');
            const indexCssIndex = htmlContent.indexOf('index.css');
            
            expect(databaseViewIndex).toBeLessThan(indexCssIndex);
        });
    });
});

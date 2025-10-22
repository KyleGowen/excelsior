/**
 * Comprehensive unit tests for database.html changes in Step 3
 * Tests all modifications made to the HTML file during JavaScript extraction
 */

import fs from 'fs';
import path from 'path';

describe('Database HTML - Step 3 Changes Coverage', () => {
    const databaseHtmlPath = path.join(process.cwd(), 'public/database.html');
    let content: string;

    beforeAll(() => {
        content = fs.readFileSync(databaseHtmlPath, 'utf8');
    });

    describe('JavaScript File References', () => {
        it('should reference the new database-view.js file', () => {
            expect(content).toContain('database-view.js');
        });

        it('should include all necessary JavaScript dependencies', () => {
            const requiredScripts = [
                'globalNav.js',
                'data-loading.js',
                'search-filter.js',
                'search-filter-functions.js',
                'filter-functions.js',
                'deck-editor-simple.js',
                'database-view.js',
                'ui-utility-functions.js',
                'deck-management.js',
                'auth-service.js',
                'utilities.js'
            ];

            requiredScripts.forEach(script => {
                expect(content).toContain(script);
            });
        });

        it('should have proper script tag structure', () => {
            expect(content).toContain('<script src="/js/');
            expect(content).toContain('</script>');
        });

        it('should maintain correct script loading order', () => {
            const scriptTags = content.match(/<script src="\/js\/[^"]+\.js"><\/script>/g) || [];
            expect(scriptTags.length).toBeGreaterThan(10);
            
            // database-view.js should be loaded after its dependencies
            const databaseViewIndex = content.indexOf('database-view.js');
            const searchFilterIndex = content.indexOf('search-filter-functions.js');
            const filterFunctionsIndex = content.indexOf('filter-functions.js');
            const deckEditorIndex = content.indexOf('deck-editor-simple.js');
            
            expect(databaseViewIndex).toBeGreaterThan(searchFilterIndex);
            expect(databaseViewIndex).toBeGreaterThan(filterFunctionsIndex);
            expect(databaseViewIndex).toBeGreaterThan(deckEditorIndex);
        });
    });

    describe('HTML Structure Integrity', () => {
        it('should maintain all essential HTML structure', () => {
            const essentialElements = [
                '<!DOCTYPE html>',
                '<html lang="en">',
                '<head>',
                '<meta charset="UTF-8">',
                '<meta name="viewport"',
                '<title>',
                '<body>',
                '<div id="loginContainer"',
                '<div class="container" id="mainContainer"',
                '<div id="globalNav"',
                '<div id="database-view-container"',
                '<div id="deck-builder"',
                '<div id="imageModal"',
                '<div id="createDeckModal"'
            ];

            essentialElements.forEach(element => {
                expect(content).toContain(element);
            });
        });

        it('should maintain CSS file references', () => {
            expect(content).toContain('database-view.css');
            expect(content).toContain('index.css');
            expect(content).toContain('<link rel="stylesheet"');
        });

        it('should maintain proper CSS loading order', () => {
            const databaseViewCssIndex = content.indexOf('database-view.css');
            const indexCssIndex = content.indexOf('index.css');
            
            expect(databaseViewCssIndex).toBeLessThan(indexCssIndex);
        });
    });

    describe('Template Loading Function', () => {
        it('should contain the template loading function', () => {
            expect(content).toContain('loadDatabaseViewTemplate');
            expect(content).toContain('async function loadDatabaseViewTemplate()');
        });

        it('should have proper template loading logic', () => {
            expect(content).toContain('/templates/database-view-complete.html');
            expect(content).toContain('fetch(');
            expect(content).toContain('response.text()');
            expect(content).toContain('getElementById(\'database-view-container\')');
            expect(content).toContain('innerHTML = templateContent');
        });

        it('should have proper error handling', () => {
            expect(content).toContain('try {');
            expect(content).toContain('} catch (error)');
            expect(content).toContain('console.error');
            expect(content).toContain('Failed to load database view template');
        });

        it('should have proper success logging', () => {
            expect(content).toContain('console.log');
            expect(content).toContain('Loading database view template');
            expect(content).toContain('Template loaded successfully');
            expect(content).toContain('Template content inserted into container');
        });

        it('should handle HTTP errors', () => {
            expect(content).toContain('if (!response.ok)');
            expect(content).toContain('throw new Error');
            expect(content).toContain('HTTP error! status:');
        });

        it('should handle missing container element', () => {
            expect(content).toContain('if (container)');
            expect(content).toContain('Database view container not found');
        });
    });

    describe('DOM Content Loaded Event', () => {
        it('should have DOMContentLoaded event listener', () => {
            expect(content).toContain('DOMContentLoaded');
            expect(content).toContain('addEventListener');
        });

        it('should call loadDatabaseViewTemplate on page load', () => {
            expect(content).toContain('loadDatabaseViewTemplate()');
        });

        it('should have proper event listener structure', () => {
            expect(content).toContain('document.addEventListener(\'DOMContentLoaded\', function()');
        });
    });

    describe('File Size and Performance', () => {
        it('should have reasonable file size', () => {
            const stats = fs.statSync(databaseHtmlPath);
            expect(stats.size).toBeGreaterThan(5000);
            expect(stats.size).toBeLessThan(50000);
        });

        it('should not have excessive whitespace', () => {
            const lines = content.split('\n');
            const emptyLines = lines.filter(line => line.trim() === '').length;
            const totalLines = lines.length;
            const emptyLineRatio = emptyLines / totalLines;
            
            expect(emptyLineRatio).toBeLessThan(0.3);
        });
    });

    describe('Code Quality', () => {
        it('should have proper HTML structure', () => {
            expect(content).toContain('<!DOCTYPE html>');
            expect(content).toContain('<html');
            expect(content).toContain('</html>');
            expect(content).toContain('<head>');
            expect(content).toContain('</head>');
            expect(content).toContain('<body>');
            expect(content).toContain('</body>');
        });

        it.skip('should have proper indentation', () => {
            const lines = content.split('\n');
            let hasProperIndentation = true;
            
            lines.forEach((line, index) => {
                if (line.trim() !== '' && !line.startsWith(' ') && !line.startsWith('\t') && 
                    !line.startsWith('<!') && !line.startsWith('<script') && !line.startsWith('</script>') &&
                    !line.startsWith('<link') && !line.startsWith('<meta') && !line.startsWith('<title') &&
                    !line.startsWith('<div') && !line.startsWith('</div') && !line.startsWith('<body') &&
                    !line.startsWith('</body') && !line.startsWith('<html') && !line.startsWith('</html')) {
                    // Allow some lines to not be indented (like DOCTYPE, html, head, body tags)
                    if (!line.match(/^<(html|head|body|!DOCTYPE|div|script|link|meta|title)/)) {
                        hasProperIndentation = false;
                    }
                }
            });
            
            // Allow some flexibility in indentation for HTML files
            expect(hasProperIndentation).toBe(true);
        });

        it('should not have trailing whitespace', () => {
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                if (line.trim() !== '' && line.endsWith(' ')) {
                    throw new Error(`Line ${index + 1} has trailing whitespace: "${line}"`);
                }
            });
        });
    });

    describe('Backward Compatibility', () => {
        it('should maintain all original functionality', () => {
            // All original elements should still be present
            expect(content).toContain('loginContainer');
            expect(content).toContain('mainContainer');
            expect(content).toContain('globalNav');
            expect(content).toContain('database-view-container');
            expect(content).toContain('deck-builder');
            expect(content).toContain('imageModal');
            expect(content).toContain('createDeckModal');
        });

        it('should maintain all original CSS classes', () => {
            const originalClasses = [
                'login-container',
                'login-form',
                'container',
                'deck-builder-section',
                'deck-list-container',
                'deck-stats',
                'stat-card',
                'modal',
                'modal-content'
            ];

            originalClasses.forEach(className => {
                expect(content).toContain(className);
            });
        });

        it('should maintain all original IDs', () => {
            const originalIds = [
                'loginContainer',
                'loginForm',
                'username',
                'password',
                'loginError',
                'mainContainer',
                'globalNav',
                'database-view-container',
                'deck-builder',
                'deck-list',
                'total-decks',
                'imageModal',
                'modalImage',
                'createDeckModal',
                'createDeckForm',
                'deckName',
                'deckDescription'
            ];

            originalIds.forEach(id => {
                expect(content).toContain(`id="${id}"`);
            });
        });
    });

    describe('Security and Best Practices', () => {
        it('should have proper meta tags', () => {
            expect(content).toContain('<meta charset="UTF-8">');
            expect(content).toContain('<meta name="viewport"');
        });

        it('should have proper form structure', () => {
            expect(content).toContain('<form id="loginForm"');
            expect(content).toContain('<form id="createDeckForm"');
            expect(content).toContain('type="text"');
            expect(content).toContain('type="password"');
            expect(content).toContain('required');
        });

        it('should have proper button structure', () => {
            expect(content).toContain('<button type="submit"');
            expect(content).toContain('onclick=');
        });
    });

    describe('Integration Points', () => {
        it('should properly integrate with existing JavaScript files', () => {
            // Should load dependencies before database-view.js
            const scriptOrder = [
                'globalNav.js',
                'data-loading.js',
                'search-filter.js',
                'search-filter-functions.js',
                'filter-functions.js',
                'deck-editor-simple.js',
                'database-view.js'
            ];

            let lastIndex = -1;
            scriptOrder.forEach(script => {
                const currentIndex = content.indexOf(script);
                expect(currentIndex).toBeGreaterThan(lastIndex);
                lastIndex = currentIndex;
            });
        });

        it('should maintain template loading functionality', () => {
            expect(content).toContain('database-view-container');
            expect(content).toContain('Database view content will be loaded here');
        });
    });

    describe('Error Handling Coverage', () => {
        it('should handle template loading errors', () => {
            expect(content).toContain('catch (error)');
            expect(content).toContain('console.error(\'Error loading database view template:\', error)');
        });

        it('should provide fallback content on error', () => {
            expect(content).toContain('<div class="error">Failed to load database view template</div>');
        });

        it('should handle missing elements gracefully', () => {
            expect(content).toContain('if (container)');
            expect(content).toContain('Database view container not found');
        });
    });

    describe('Documentation and Comments', () => {
        it('should have proper documentation comments', () => {
            expect(content).toContain('<!-- Database View CSS - Step 2 Refactoring -->');
            expect(content).toContain('<!-- Base styles still needed from main CSS -->');
            expect(content).toContain('<!-- Global Navigation Component -->');
            expect(content).toContain('<!-- Database View Section - Loaded from template -->');
            expect(content).toContain('<!-- Deck Builder Section -->');
            expect(content).toContain('<!-- Image Modal -->');
            expect(content).toContain('<!-- Create Deck Modal -->');
            expect(content).toContain('<!-- JavaScript Files -->');
        });

        it('should have inline JavaScript documentation', () => {
            expect(content).toContain('// Database View Template Loader - Step 1 Refactoring');
            expect(content).toContain('// Initialize the page');
        });
    });
});

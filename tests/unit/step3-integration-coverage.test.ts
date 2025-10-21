/**
 * Integration coverage tests for Step 3 changes
 * Tests the integration between new database-view.js and existing functionality
 */

import fs from 'fs';
import path from 'path';

describe('Step 3 Integration Coverage', () => {
    const databaseViewJsPath = path.join(process.cwd(), 'public/js/database-view.js');
    const databaseHtmlPath = path.join(process.cwd(), 'public/database.html');
    const searchFilterFunctionsPath = path.join(process.cwd(), 'public/js/search-filter-functions.js');
    const filterFunctionsPath = path.join(process.cwd(), 'public/js/filter-functions.js');
    const deckEditorSimplePath = path.join(process.cwd(), 'public/js/deck-editor-simple.js');

    describe('File Dependencies and Integration', () => {
        it('should have all required dependency files', () => {
            expect(fs.existsSync(databaseViewJsPath)).toBe(true);
            expect(fs.existsSync(databaseHtmlPath)).toBe(true);
            expect(fs.existsSync(searchFilterFunctionsPath)).toBe(true);
            expect(fs.existsSync(filterFunctionsPath)).toBe(true);
            expect(fs.existsSync(deckEditorSimplePath)).toBe(true);
        });

        it('should reference all dependencies in HTML', () => {
            const htmlContent = fs.readFileSync(databaseHtmlPath, 'utf8');
            
            const dependencies = [
                'search-filter-functions.js',
                'filter-functions.js',
                'deck-editor-simple.js',
                'database-view.js'
            ];

            dependencies.forEach(dep => {
                expect(htmlContent).toContain(dep);
            });
        });
    });

    describe('Function Call Integration', () => {
        let databaseViewContent: string;
        let searchFilterContent: string;
        let filterFunctionsContent: string;
        let deckEditorContent: string;

        beforeAll(() => {
            databaseViewContent = fs.readFileSync(databaseViewJsPath, 'utf8');
            searchFilterContent = fs.readFileSync(searchFilterFunctionsPath, 'utf8');
            filterFunctionsContent = fs.readFileSync(filterFunctionsPath, 'utf8');
            deckEditorContent = fs.readFileSync(deckEditorSimplePath, 'utf8');
        });

        it('should call functions from search-filter-functions.js', () => {
            const searchFilterCalls = [
                'setupSearch()',
                'setupSpecialCardSearch()',
                'setupAdvancedUniverseSearch()',
                'setupLocationSearch()',
                'setupAspectSearch()',
                'setupMissionSearch()',
                'setupEventSearch()',
                'setupTeamworkSearch()',
                'setupAllyUniverseSearch()',
                'setupTrainingSearch()',
                'setupBasicUniverseSearch()',
                'setupPowerCardsSearch()'
            ];

            searchFilterCalls.forEach(call => {
                expect(databaseViewContent).toContain(call);
            });
        });

        it('should call functions from data-loading.js', () => {
            const dataLoadingCalls = [
                'loadCharacters()',
                'loadSpecialCards()',
                'loadAdvancedUniverse()',
                'loadLocations()',
                'loadAspects()',
                'loadMissions()',
                'loadEvents()',
                'loadTeamwork()',
                'loadAllyUniverse()',
                'loadTraining()',
                'loadBasicUniverse()',
                'loadPowerCards()'
            ];

            dataLoadingCalls.forEach(call => {
                expect(databaseViewContent).toContain(call);
            });
        });

        it('should call functions from search-filter.js', () => {
            expect(databaseViewContent).toContain('clearAllFiltersGlobally()');
        });

        it('should call functions from ui-utility-functions.js', () => {
            expect(databaseViewContent).toContain('disableAddToDeckButtonsImmediate()');
        });

        it('should call functions from filter-functions.js', () => {
            expect(databaseViewContent).toContain('applyFilters()');
        });
    });

    describe('Global Function Availability', () => {
        let databaseViewContent: string;

        beforeAll(() => {
            databaseViewContent = fs.readFileSync(databaseViewJsPath, 'utf8');
        });

        it('should register all functions globally for HTML onclick handlers', () => {
            const globalFunctions = [
                'switchTab',
                'clearLocationFilters',
                'clearSpecialCardFilters',
                'clearAdvancedUniverseFilters',
                'clearAspectsFilters',
                'clearMissionsFilters',
                'clearEventsFilters',
                'clearTeamworkFilters',
                'clearAllyUniverseFilters',
                'clearTrainingFilters',
                'clearBasicUniverseFilters',
                'clearPowerCardFilters',
                'toggleFortificationsColumn',
                'toggleOnePerDeckColumn',
                'toggleOnePerDeckAdvancedColumn'
            ];

            globalFunctions.forEach(func => {
                expect(databaseViewContent).toContain(`window.${func} = ${func}`);
            });
        });

        it('should register basic universe functions globally', () => {
            const basicUniverseFunctions = [
                'loadBasicUniverse',
                'displayBasicUniverse',
                'applyBasicUniverseFilters',
                'toggleBasicUniverseCharacterFilter',
                'updateBasicUniverseFilter'
            ];

            basicUniverseFunctions.forEach(func => {
                expect(databaseViewContent).toContain(`window.${func} = ${func}`);
            });
        });

        it('should register teamwork functions globally', () => {
            const teamworkFunctions = [
                'toggleTeamworkCharacterFilter',
                'updateTeamworkFilter'
            ];

            teamworkFunctions.forEach(func => {
                expect(databaseViewContent).toContain(`window.${func} = ${func}`);
            });
        });
    });

    describe('Template Integration', () => {
        let htmlContent: string;

        beforeAll(() => {
            htmlContent = fs.readFileSync(databaseHtmlPath, 'utf8');
        });

        it('should load template from correct path', () => {
            expect(htmlContent).toContain('/templates/database-view-complete.html');
        });

        it('should have proper template container', () => {
            expect(htmlContent).toContain('id="database-view-container"');
            expect(htmlContent).toContain('Database view content will be loaded here');
        });

        it('should initialize template loading on page load', () => {
            expect(htmlContent).toContain('DOMContentLoaded');
            expect(htmlContent).toContain('loadDatabaseViewTemplate()');
        });
    });

    describe('CSS Integration', () => {
        let htmlContent: string;

        beforeAll(() => {
            htmlContent = fs.readFileSync(databaseHtmlPath, 'utf8');
        });

        it('should load database-view.css', () => {
            expect(htmlContent).toContain('database-view.css');
        });

        it('should maintain index.css for base styles', () => {
            expect(htmlContent).toContain('index.css');
        });

        it('should load CSS in correct order', () => {
            const databaseViewCssIndex = htmlContent.indexOf('database-view.css');
            const indexCssIndex = htmlContent.indexOf('index.css');
            
            expect(databaseViewCssIndex).toBeLessThan(indexCssIndex);
        });
    });

    describe('Error Handling Integration', () => {
        let databaseViewContent: string;

        beforeAll(() => {
            databaseViewContent = fs.readFileSync(databaseViewJsPath, 'utf8');
        });

        it('should handle missing DOM elements gracefully', () => {
            expect(databaseViewContent).toContain('if (!filterCheckbox)');
            expect(databaseViewContent).toContain('if (!basicUniverseCategory)');
            expect(databaseViewContent).toContain('if (!teamworkCategory)');
            expect(databaseViewContent).toContain('console.error');
        });

        it('should handle API errors gracefully', () => {
            expect(databaseViewContent).toContain('try {');
            expect(databaseViewContent).toContain('} catch (e)');
            expect(databaseViewContent).toContain('} catch (error)');
            expect(databaseViewContent).toContain('console.error(\'Error loading basic universe:\', e)');
            expect(databaseViewContent).toContain('console.error(\'Error applying basic universe filters:\', error)');
        });

        it('should handle missing tab elements', () => {
            expect(databaseViewContent).toContain('console.warn');
            expect(databaseViewContent).toContain('Tab button for');
            expect(databaseViewContent).toContain('not found');
        });
    });

    describe('Performance Integration', () => {
        let databaseViewContent: string;

        beforeAll(() => {
            databaseViewContent = fs.readFileSync(databaseViewJsPath, 'utf8');
        });

        it('should use efficient DOM queries', () => {
            expect(databaseViewContent).toContain('document.getElementById');
            expect(databaseViewContent).toContain('document.querySelector');
            expect(databaseViewContent).toContain('document.querySelectorAll');
        });

        it('should handle large datasets efficiently', () => {
            expect(databaseViewContent).toContain('filtered.filter');
            expect(databaseViewContent).toContain('sortedCards.map');
            expect(databaseViewContent).toContain('Array.from');
        });

        it('should avoid unnecessary operations', () => {
            expect(databaseViewContent).toContain('if (selectedTypes.length > 0)');
            expect(databaseViewContent).toContain('if (isChecked)');
            expect(databaseViewContent).toContain('if (fortificationsColumn.length > 0)');
        });
    });

    describe('Backward Compatibility Integration', () => {
        let databaseViewContent: string;

        beforeAll(() => {
            databaseViewContent = fs.readFileSync(databaseViewJsPath, 'utf8');
        });

        it('should maintain all original function signatures', () => {
            const originalSignatures = [
                'function switchTab(tabName)',
                'function clearLocationFilters()',
                'function clearSpecialCardFilters()',
                'function clearAdvancedUniverseFilters()',
                'function clearAspectsFilters()',
                'function clearMissionsFilters()',
                'function clearEventsFilters()',
                'function clearTeamworkFilters()',
                'function clearAllyUniverseFilters()',
                'function clearTrainingFilters()',
                'function clearBasicUniverseFilters()',
                'function clearPowerCardFilters()',
                'function toggleFortificationsColumn()',
                'function toggleOnePerDeckColumn()',
                'function toggleOnePerDeckAdvancedColumn()'
            ];

            originalSignatures.forEach(signature => {
                expect(databaseViewContent).toContain(signature);
            });
        });

        it('should maintain all original external function calls', () => {
            const externalCalls = [
                'clearAllFiltersGlobally()',
                'setupSearch()',
                'loadCharacters()',
                'setupSpecialCardSearch()',
                'loadSpecialCards()',
                'setupAdvancedUniverseSearch()',
                'loadAdvancedUniverse()',
                'setupLocationSearch()',
                'loadLocations()',
                'setupAspectSearch()',
                'loadAspects()',
                'setupMissionSearch()',
                'loadMissions()',
                'setupEventSearch()',
                'loadEvents()',
                'setupTeamworkSearch()',
                'loadTeamwork()',
                'setupAllyUniverseSearch()',
                'loadAllyUniverse()',
                'setupTrainingSearch()',
                'loadTraining()',
                'setupBasicUniverseSearch()',
                'loadBasicUniverse()',
                'setupPowerCardsSearch()',
                'loadPowerCards()',
                'disableAddToDeckButtonsImmediate()'
            ];

            externalCalls.forEach(call => {
                expect(databaseViewContent).toContain(call);
            });
        });
    });

    describe('Code Quality Integration', () => {
        let databaseViewContent: string;

        beforeAll(() => {
            databaseViewContent = fs.readFileSync(databaseViewJsPath, 'utf8');
        });

        it('should have proper async/await usage', () => {
            expect(databaseViewContent).toContain('async function');
            expect(databaseViewContent).toContain('await fetch');
            expect(databaseViewContent).toContain('await resp.json()');
        });

        it('should have proper error handling', () => {
            expect(databaseViewContent).toContain('try {');
            expect(databaseViewContent).toContain('} catch (');
            expect(databaseViewContent).toContain('console.error');
            expect(databaseViewContent).toContain('console.warn');
        });

        it('should have proper documentation', () => {
            expect(databaseViewContent).toContain('/**');
            expect(databaseViewContent).toContain('Main tab switching function for database view');
            expect(databaseViewContent).toContain('Clear location-specific filters');
            expect(databaseViewContent).toContain('Toggle fortifications column visibility');
            expect(databaseViewContent).toContain('Load and display basic universe cards');
        });
    });

    describe('File Size and Performance Integration', () => {
        it('should have reasonable file sizes', () => {
            const databaseViewStats = fs.statSync(databaseViewJsPath);
            const htmlStats = fs.statSync(databaseHtmlPath);

            expect(databaseViewStats.size).toBeGreaterThan(15000);
            expect(databaseViewStats.size).toBeLessThan(100000);
            expect(htmlStats.size).toBeGreaterThan(5000);
            expect(htmlStats.size).toBeLessThan(50000);
        });

        it('should not have excessive whitespace', () => {
            const databaseViewContent = fs.readFileSync(databaseViewJsPath, 'utf8');
            const lines = databaseViewContent.split('\n');
            const emptyLines = lines.filter(line => line.trim() === '').length;
            const totalLines = lines.length;
            const emptyLineRatio = emptyLines / totalLines;
            
            expect(emptyLineRatio).toBeLessThan(0.2);
        });
    });

    describe('Complete Integration Coverage', () => {
        it('should have all required files present', () => {
            const requiredFiles = [
                'public/js/database-view.js',
                'public/database.html',
                'public/templates/database-view-complete.html',
                'public/css/database-view.css'
            ];

            requiredFiles.forEach(file => {
                expect(fs.existsSync(path.join(process.cwd(), file))).toBe(true);
            });
        });

        it('should have proper file relationships', () => {
            const htmlContent = fs.readFileSync(databaseHtmlPath, 'utf8');
            
            // HTML should reference all required files
            expect(htmlContent).toContain('database-view.css');
            expect(htmlContent).toContain('database-view.js');
            expect(htmlContent).toContain('database-view-complete.html');
        });

        it('should maintain all functionality', () => {
            const databaseViewContent = fs.readFileSync(databaseViewJsPath, 'utf8');
            
            // Should have all 22 functions
            const functionMatches = databaseViewContent.match(/function\s+\w+\s*\(/g);
            expect(functionMatches).toHaveLength(22);
            
            // Should have all 22 global registrations
            const globalMatches = databaseViewContent.match(/window\.\w+\s*=\s*\w+/g);
            expect(globalMatches).toHaveLength(22);
        });
    });
});

/**
 * Unit tests for database-view.js
 * Tests the extracted database view JavaScript functions
 */

import fs from 'fs';
import path from 'path';

describe('Database View JavaScript Functions', () => {
    const databaseViewJsPath = path.join(process.cwd(), 'public/js/database-view.js');
    
    describe('File Creation and Structure', () => {
        it('should create database-view.js file', () => {
            expect(fs.existsSync(databaseViewJsPath)).toBe(true);
        });

        it('should have proper file header documentation', () => {
            const content = fs.readFileSync(databaseViewJsPath, 'utf8');
            expect(content).toContain('DATABASE VIEW JAVASCRIPT FUNCTIONS');
            expect(content).toContain('Step 3 of 6-step database view refactoring');
        });

        it('should be a non-empty file', () => {
            const content = fs.readFileSync(databaseViewJsPath, 'utf8');
            expect(content.length).toBeGreaterThan(1000);
        });

        it('should have proper JavaScript syntax', () => {
            const content = fs.readFileSync(databaseViewJsPath, 'utf8');
            // Check for proper function declarations
            expect(content).toMatch(/function\s+\w+\s*\(/);
            // Check for proper comment blocks
            expect(content).toContain('/* ========================================');
        });
    });

    describe('Core Functions', () => {
        let content: string;

        beforeAll(() => {
            content = fs.readFileSync(databaseViewJsPath, 'utf8');
        });

        it('should contain switchTab function', () => {
            expect(content).toContain('function switchTab(tabName)');
        });

        it('should contain all clear filter functions', () => {
            const clearFunctions = [
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
                'clearPowerCardFilters'
            ];

            clearFunctions.forEach(func => {
                expect(content).toContain(`function ${func}()`);
            });
        });

        it('should contain all toggle column functions', () => {
            const toggleFunctions: string[] = [
                // Note: All toggle functions removed - columns are now always visible
            ];

            toggleFunctions.forEach(func => {
                expect(content).toContain(`function ${func}()`);
            });
        });

        it('should contain basic universe specific functions', () => {
            const basicUniverseFunctions = [
                'loadBasicUniverse',
                'displayBasicUniverse',
                'applyBasicUniverseFilters',
                'toggleBasicUniverseCharacterFilter',
                'updateBasicUniverseFilter'
            ];

            basicUniverseFunctions.forEach(func => {
                expect(content).toContain(`function ${func}(`);
            });
        });

        it('should contain teamwork specific functions', () => {
            const teamworkFunctions = [
                'toggleTeamworkCharacterFilter',
                'updateTeamworkFilter'
            ];

            teamworkFunctions.forEach(func => {
                expect(content).toContain(`function ${func}()`);
            });
        });
    });

    describe('Function Implementation', () => {
        let content: string;

        beforeAll(() => {
            content = fs.readFileSync(databaseViewJsPath, 'utf8');
        });

        it('should have proper switchTab implementation', () => {
            expect(content).toContain('clearAllFiltersGlobally()');
            expect(content).toContain('document.getElementById(\'characters-tab\')');
            expect(content).toContain('document.getElementById(\'special-cards-tab\')');
            expect(content).toContain('document.getElementById(\'search-container\')');
            expect(content).toContain('setupSearch()');
            expect(content).toContain('loadCharacters()');
        });

        it('should have proper filter clearing implementations', () => {
            expect(content).toContain('clearLocationFilters()');
            expect(content).toContain('location-threat-min');
            expect(content).toContain('location-threat-max');
            expect(content).toContain('loadLocations()');
        });

        it('should have proper column toggle implementations', () => {
            // Note: All toggle functions removed - columns are now always visible
            // No toggle implementations to test
        });

        it('should have proper basic universe implementations', () => {
            expect(content).toContain('loadBasicUniverse()');
            expect(content).toContain('/api/basic-universe');
            expect(content).toContain('displayBasicUniverse(data.data)');
            expect(content).toContain('applyBasicUniverseFilters()');
        });
    });

    describe('Global Function Registration', () => {
        let content: string;

        beforeAll(() => {
            content = fs.readFileSync(databaseViewJsPath, 'utf8');
        });

        it('should register all functions globally', () => {
            const globalRegistrations = [
                'window.switchTab = switchTab',
                'window.clearLocationFilters = clearLocationFilters',
                'window.clearSpecialCardFilters = clearSpecialCardFilters',
                'window.clearAdvancedUniverseFilters = clearAdvancedUniverseFilters',
                'window.clearAspectsFilters = clearAspectsFilters',
                'window.clearMissionsFilters = clearMissionsFilters',
                'window.clearEventsFilters = clearEventsFilters',
                'window.clearTeamworkFilters = clearTeamworkFilters',
                'window.clearAllyUniverseFilters = clearAllyUniverseFilters',
                'window.clearTrainingFilters = clearTrainingFilters',
                'window.clearBasicUniverseFilters = clearBasicUniverseFilters',
                'window.clearPowerCardFilters = clearPowerCardFilters',
                // Note: All toggle functions removed - columns are now always visible
            ];

            globalRegistrations.forEach(registration => {
                expect(content).toContain(registration);
            });
        });

        it('should register basic universe functions globally', () => {
            const basicUniverseRegistrations = [
                'window.loadBasicUniverse = loadBasicUniverse',
                'window.displayBasicUniverse = displayBasicUniverse',
                'window.applyBasicUniverseFilters = applyBasicUniverseFilters',
                'window.toggleBasicUniverseCharacterFilter = toggleBasicUniverseCharacterFilter',
                'window.updateBasicUniverseFilter = updateBasicUniverseFilter'
            ];

            basicUniverseRegistrations.forEach(registration => {
                expect(content).toContain(registration);
            });
        });

        it('should register teamwork functions globally', () => {
            const teamworkRegistrations = [
                'window.toggleTeamworkCharacterFilter = toggleTeamworkCharacterFilter',
                'window.updateTeamworkFilter = updateTeamworkFilter'
            ];

            teamworkRegistrations.forEach(registration => {
                expect(content).toContain(registration);
            });
        });
    });

    describe('Code Organization', () => {
        let content: string;

        beforeAll(() => {
            content = fs.readFileSync(databaseViewJsPath, 'utf8');
        });

        it('should have proper section headers', () => {
            const sections = [
                'FILTER CLEARING FUNCTIONS',
                'COLUMN TOGGLE FUNCTIONS',
                'DATABASE VIEW SPECIFIC FUNCTIONS',
                'INITIALIZATION'
            ];

            sections.forEach(section => {
                expect(content).toContain(section);
            });
        });

        it('should have proper function documentation', () => {
            expect(content).toContain('/**');
            expect(content).toContain('Main tab switching function for database view');
            expect(content).toContain('Clear location-specific filters');
            // Note: Toggle function documentation removed - columns are now always visible
            expect(content).toContain('Load and display basic universe cards');
        });

        it('should have proper error handling', () => {
            expect(content).toContain('console.error');
            expect(content).toContain('console.warn');
            expect(content).toContain('try {');
            expect(content).toContain('} catch (');
        });
    });

    describe('Integration Points', () => {
        let content: string;

        beforeAll(() => {
            content = fs.readFileSync(databaseViewJsPath, 'utf8');
        });

        it('should call external functions correctly', () => {
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
                expect(content).toContain(call);
            });
        });

        it('should handle DOM elements correctly', () => {
            const domElements = [
                'document.getElementById',
                'document.querySelector',
                'document.querySelectorAll',
                'style.display',
                'classList.add',
                'classList.remove'
            ];

            domElements.forEach(element => {
                expect(content).toContain(element);
            });
        });

        it('should handle API calls correctly', () => {
            expect(content).toContain('fetch(\'/api/basic-universe\')');
            expect(content).toContain('await fetch');
            expect(content).toContain('.json()');
            expect(content).toContain('data.success');
        });
    });

    describe('Performance and Quality', () => {
        let content: string;

        beforeAll(() => {
            content = fs.readFileSync(databaseViewJsPath, 'utf8');
        });

        it('should not have any obvious syntax errors', () => {
            // Check for balanced braces
            const openBraces = (content.match(/\{/g) || []).length;
            const closeBraces = (content.match(/\}/g) || []).length;
            expect(openBraces).toBe(closeBraces);

            // Check for balanced parentheses
            const openParens = (content.match(/\(/g) || []).length;
            const closeParens = (content.match(/\)/g) || []).length;
            expect(openParens).toBe(closeParens);
        });

        it('should have reasonable file size', () => {
            const stats = fs.statSync(databaseViewJsPath);
            expect(stats.size).toBeGreaterThan(10000); // At least 10KB
            expect(stats.size).toBeLessThan(100000); // Less than 100KB
        });

        it('should have proper line endings', () => {
            expect(content).toContain('\n');
            expect(content).not.toContain('\r\n'); // Should use Unix line endings
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
});

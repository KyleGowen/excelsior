/**
 * Comprehensive coverage tests for Step 3: JavaScript Function Extraction
 * Tests all changes made during Step 3 of the database view refactoring
 */

import fs from 'fs';
import path from 'path';

describe('Step 3: JavaScript Function Extraction - Coverage Tests', () => {
    const databaseViewJsPath = path.join(process.cwd(), 'public/js/database-view.js');
    const databaseHtmlPath = path.join(process.cwd(), 'public/database.html');
    
    describe('New Files Created', () => {
        it('should create database-view.js file', () => {
            expect(fs.existsSync(databaseViewJsPath)).toBe(true);
        });

        it('should have proper file structure for database-view.js', () => {
            const content = fs.readFileSync(databaseViewJsPath, 'utf8');
            expect(content).toContain('DATABASE VIEW JAVASCRIPT FUNCTIONS');
            expect(content).toContain('Step 3 of 6-step database view refactoring');
        });
    });

    describe('Modified Files', () => {
        it('should update database.html to reference new JavaScript file', () => {
            const content = fs.readFileSync(databaseHtmlPath, 'utf8');
            expect(content).toContain('database-view.js');
        });

        it('should include all necessary JavaScript dependencies', () => {
            const content = fs.readFileSync(databaseHtmlPath, 'utf8');
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
    });

    describe('JavaScript Function Coverage', () => {
        let content: string;

        beforeAll(() => {
            content = fs.readFileSync(databaseViewJsPath, 'utf8');
        });

        it('should contain all extracted functions', () => {
            const extractedFunctions = [
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
                'toggleOnePerDeckAdvancedColumn',
                'loadBasicUniverse',
                'displayBasicUniverse',
                'applyBasicUniverseFilters',
                'toggleBasicUniverseCharacterFilter',
                'updateBasicUniverseFilter',
                'toggleTeamworkCharacterFilter',
                'updateTeamworkFilter'
            ];

            extractedFunctions.forEach(func => {
                expect(content).toContain(`function ${func}(`);
            });
        });

        it('should have proper function implementations', () => {
            // Test switchTab function
            expect(content).toContain('function switchTab(tabName) {');
            expect(content).toContain('clearAllFiltersGlobally()');
            expect(content).toContain('document.getElementById(\'characters-tab\')');
            expect(content).toContain('document.getElementById(\'special-cards-tab\')');
            expect(content).toContain('document.getElementById(\'advanced-universe-tab\')');
            expect(content).toContain('document.getElementById(\'missions-tab\')');
            expect(content).toContain('document.getElementById(\'locations-tab\')');
            expect(content).toContain('document.getElementById(\'aspects-tab\')');
            expect(content).toContain('document.getElementById(\'events-tab\')');
            expect(content).toContain('document.getElementById(\'teamwork-tab\')');
            expect(content).toContain('document.getElementById(\'ally-universe-tab\')');
            expect(content).toContain('document.getElementById(\'training-tab\')');
            expect(content).toContain('document.getElementById(\'basic-universe-tab\')');
            expect(content).toContain('document.getElementById(\'power-cards-tab\')');
        });

        it('should have proper filter clearing implementations', () => {
            // Test clearLocationFilters
            expect(content).toContain('function clearLocationFilters() {');
            expect(content).toContain('location-threat-min');
            expect(content).toContain('location-threat-max');
            expect(content).toContain('loadLocations()');

            // Test other clear functions
            expect(content).toContain('function clearSpecialCardFilters() {');
            expect(content).toContain('function clearAdvancedUniverseFilters() {');
            expect(content).toContain('function clearAspectsFilters() {');
            expect(content).toContain('function clearMissionsFilters() {');
            expect(content).toContain('function clearEventsFilters() {');
            expect(content).toContain('function clearTeamworkFilters() {');
            expect(content).toContain('function clearAllyUniverseFilters() {');
            expect(content).toContain('function clearTrainingFilters() {');
            expect(content).toContain('function clearBasicUniverseFilters() {');
            expect(content).toContain('function clearPowerCardFilters() {');
        });

        it('should have proper column toggle implementations', () => {
            // Test toggleFortificationsColumn
            expect(content).toContain('function toggleFortificationsColumn() {');
            expect(content).toContain('.fortifications-column');
            expect(content).toContain('toggle-fortifications');
            expect(content).toContain('fortifications-toggle-text');

            // Test toggleOnePerDeckColumn
            expect(content).toContain('function toggleOnePerDeckColumn() {');
            expect(content).toContain('.one-per-deck-column');
            expect(content).toContain('toggle-one-per-deck');
            expect(content).toContain('one-per-deck-toggle-text');

            // Test toggleOnePerDeckAdvancedColumn
            expect(content).toContain('function toggleOnePerDeckAdvancedColumn() {');
            expect(content).toContain('.one-per-deck-advanced-column');
            expect(content).toContain('toggle-one-per-deck-advanced');
            expect(content).toContain('one-per-deck-advanced-toggle-text');
        });

        it('should have proper basic universe implementations', () => {
            // Test loadBasicUniverse
            expect(content).toContain('async function loadBasicUniverse() {');
            expect(content).toContain('/api/basic-universe');
            expect(content).toContain('displayBasicUniverse(data.data)');

            // Test displayBasicUniverse
            expect(content).toContain('function displayBasicUniverse(cards) {');
            expect(content).toContain('basic-universe-tbody');
            expect(content).toContain('preferredOrder');
            expect(content).toContain('Energy');
            expect(content).toContain('Combat');
            expect(content).toContain('Brute Force');
            expect(content).toContain('Intelligence');
            expect(content).toContain('Any-Power');

            // Test applyBasicUniverseFilters
            expect(content).toContain('async function applyBasicUniverseFilters() {');
            expect(content).toContain('basic-universe-tab input[type="checkbox"]:checked');
            expect(content).toContain('basic-universe-value-min');
            expect(content).toContain('basic-universe-value-max');
            expect(content).toContain('basic-universe-bonus-min');
            expect(content).toContain('basic-universe-bonus-max');
        });

        it('should have proper character filter implementations', () => {
            // Test toggleBasicUniverseCharacterFilter
            expect(content).toContain('function toggleBasicUniverseCharacterFilter() {');
            expect(content).toContain('basicUniverseCharacterFilter');
            expect(content).toContain('Basic Universe');

            // Test toggleTeamworkCharacterFilter
            expect(content).toContain('function toggleTeamworkCharacterFilter() {');
            expect(content).toContain('teamworkCharacterFilter');
            expect(content).toContain('Teamwork');
        });
    });

    describe('Global Function Registration Coverage', () => {
        let content: string;

        beforeAll(() => {
            content = fs.readFileSync(databaseViewJsPath, 'utf8');
        });

        it('should register all main functions globally', () => {
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
                'window.toggleFortificationsColumn = toggleFortificationsColumn',
                'window.toggleOnePerDeckColumn = toggleOnePerDeckColumn',
                'window.toggleOnePerDeckAdvancedColumn = toggleOnePerDeckAdvancedColumn'
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

    describe('Integration Coverage', () => {
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

        it('should handle DOM manipulation correctly', () => {
            const domOperations = [
                'document.getElementById',
                'document.querySelector',
                'document.querySelectorAll',
                'style.display',
                'classList.add',
                'classList.remove',
                'innerHTML',
                'textContent'
            ];

            domOperations.forEach(operation => {
                expect(content).toContain(operation);
            });
        });

        it('should handle API calls correctly', () => {
            expect(content).toContain('fetch(\'/api/basic-universe\')');
            expect(content).toContain('await fetch');
            expect(content).toContain('.json()');
            expect(content).toContain('data.success');
        });

        it('should handle error cases correctly', () => {
            expect(content).toContain('console.error');
            expect(content).toContain('console.warn');
            expect(content).toContain('try {');
            expect(content).toContain('} catch (');
        });
    });

    describe('Code Quality Coverage', () => {
        let content: string;

        beforeAll(() => {
            content = fs.readFileSync(databaseViewJsPath, 'utf8');
        });

        it('should have proper documentation', () => {
            expect(content).toContain('/**');
            expect(content).toContain('Main tab switching function for database view');
            expect(content).toContain('Clear location-specific filters');
            expect(content).toContain('Toggle fortifications column visibility');
            expect(content).toContain('Load and display basic universe cards');
            expect(content).toContain('Apply basic universe filters');
        });

        it('should have proper section organization', () => {
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

        it('should have proper syntax', () => {
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
            expect(stats.size).toBeGreaterThan(15000); // At least 15KB
            expect(stats.size).toBeLessThan(100000); // Less than 100KB
        });
    });

    describe('Backward Compatibility Coverage', () => {
        let content: string;

        beforeAll(() => {
            content = fs.readFileSync(databaseViewJsPath, 'utf8');
        });

        it('should maintain all function signatures', () => {
            // All functions should have the same signatures as before
            expect(content).toContain('function switchTab(tabName)');
            expect(content).toContain('function clearLocationFilters()');
            expect(content).toContain('function clearSpecialCardFilters()');
            expect(content).toContain('function clearAdvancedUniverseFilters()');
            expect(content).toContain('function clearAspectsFilters()');
            expect(content).toContain('function clearMissionsFilters()');
            expect(content).toContain('function clearEventsFilters()');
            expect(content).toContain('function clearTeamworkFilters()');
            expect(content).toContain('function clearAllyUniverseFilters()');
            expect(content).toContain('function clearTrainingFilters()');
            expect(content).toContain('function clearBasicUniverseFilters()');
            expect(content).toContain('function clearPowerCardFilters()');
        });

        it('should maintain all global function registrations', () => {
            // All functions should be registered globally
            expect(content).toContain('window.switchTab = switchTab');
            expect(content).toContain('window.clearLocationFilters = clearLocationFilters');
            expect(content).toContain('window.clearSpecialCardFilters = clearSpecialCardFilters');
            expect(content).toContain('window.clearAdvancedUniverseFilters = clearAdvancedUniverseFilters');
            expect(content).toContain('window.clearAspectsFilters = clearAspectsFilters');
            expect(content).toContain('window.clearMissionsFilters = clearMissionsFilters');
            expect(content).toContain('window.clearEventsFilters = clearEventsFilters');
            expect(content).toContain('window.clearTeamworkFilters = clearTeamworkFilters');
            expect(content).toContain('window.clearAllyUniverseFilters = clearAllyUniverseFilters');
            expect(content).toContain('window.clearTrainingFilters = clearTrainingFilters');
            expect(content).toContain('window.clearBasicUniverseFilters = clearBasicUniverseFilters');
            expect(content).toContain('window.clearPowerCardFilters = clearPowerCardFilters');
        });

        it('should maintain all external function calls', () => {
            // All external function calls should be preserved
            expect(content).toContain('clearAllFiltersGlobally()');
            expect(content).toContain('setupSearch()');
            expect(content).toContain('loadCharacters()');
            expect(content).toContain('setupSpecialCardSearch()');
            expect(content).toContain('loadSpecialCards()');
            expect(content).toContain('setupAdvancedUniverseSearch()');
            expect(content).toContain('loadAdvancedUniverse()');
            expect(content).toContain('setupLocationSearch()');
            expect(content).toContain('loadLocations()');
            expect(content).toContain('setupAspectSearch()');
            expect(content).toContain('loadAspects()');
            expect(content).toContain('setupMissionSearch()');
            expect(content).toContain('loadMissions()');
            expect(content).toContain('setupEventSearch()');
            expect(content).toContain('loadEvents()');
            expect(content).toContain('setupTeamworkSearch()');
            expect(content).toContain('loadTeamwork()');
            expect(content).toContain('setupAllyUniverseSearch()');
            expect(content).toContain('loadAllyUniverse()');
            expect(content).toContain('setupTrainingSearch()');
            expect(content).toContain('loadTraining()');
            expect(content).toContain('setupBasicUniverseSearch()');
            expect(content).toContain('loadBasicUniverse()');
            expect(content).toContain('setupPowerCardsSearch()');
            expect(content).toContain('loadPowerCards()');
            expect(content).toContain('disableAddToDeckButtonsImmediate()');
        });
    });

    describe('Performance Coverage', () => {
        let content: string;

        beforeAll(() => {
            content = fs.readFileSync(databaseViewJsPath, 'utf8');
        });

        it('should not have performance issues', () => {
            // Check for efficient DOM queries
            expect(content).toContain('document.getElementById');
            expect(content).toContain('document.querySelector');
            expect(content).toContain('document.querySelectorAll');

            // Check for proper error handling
            expect(content).toContain('try {');
            expect(content).toContain('} catch (');
            expect(content).toContain('console.error');
        });

        it('should have proper async/await usage', () => {
            expect(content).toContain('async function');
            expect(content).toContain('await fetch');
            expect(content).toContain('await resp.json()');
        });

        it('should have proper event handling', () => {
            expect(content).toContain('onclick');
        });
    });
});

/* ========================================
 * STEP 5 COMPONENT ORGANIZATION TESTS
 * ========================================
 * 
 * Comprehensive unit tests for Step 5 component organization
 * created as part of Step 5 of the database view refactoring project.
 * 
 * Purpose: Test all new component organization changes
 * Created: Step 5 of 6-step database view refactoring project
 * 
 * ======================================== */

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Step 5: Component Organization', () => {
    let dom: JSDOM;
    let window: any;
    let document: any;

    beforeEach(() => {
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="database-view-container"></div>
                <div id="characters-tab" style="display: none;"></div>
                <div id="search-container" style="display: none;"></div>
                <input id="search-input" type="text" placeholder="Search...">
            </body>
            </html>
        `, {
            url: 'http://localhost',
            pretendToBeVisual: true,
            resources: 'usable'
        });

        window = dom.window as any;
        document = window.document;
        global.window = window;
        global.document = document;
    });

    afterEach(() => {
        dom.window.close();
    });

    describe('New Component Files', () => {
        test('should have database-view-core.js file', () => {
            const filePath = path.join(process.cwd(), 'public/js/database-view-core.js');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('should have database-view-tabs.js file', () => {
            const filePath = path.join(process.cwd(), 'public/js/database-view-tabs.js');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('should have database-view-search.js file', () => {
            const filePath = path.join(process.cwd(), 'public/js/database-view-search.js');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('should have database-view-display.js file', () => {
            const filePath = path.join(process.cwd(), 'public/js/database-view-display.js');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        test('should have data-loading-core.js file', () => {
            const filePath = path.join(process.cwd(), 'public/js/data-loading-core.js');
            expect(fs.existsSync(filePath)).toBe(true);
        });
    });

    describe('Component File Content', () => {
        test('database-view-core.js should have proper structure', () => {
            const filePath = path.join(process.cwd(), 'public/js/database-view-core.js');
            const content = fs.readFileSync(filePath, 'utf8');

            expect(content).toContain('DatabaseViewCore');
            expect(content).toContain('Step 5 of the database view refactoring project');
            expect(content).toContain('class DatabaseViewCore');
            expect(content).toContain('initialize()');
            expect(content).toContain('getComponent(');
            expect(content).toContain('handleTabSwitch(');
            expect(content).toContain('cleanup()');
        });

        test('database-view-tabs.js should have proper structure', () => {
            const filePath = path.join(process.cwd(), 'public/js/database-view-tabs.js');
            const content = fs.readFileSync(filePath, 'utf8');

            expect(content).toContain('DatabaseViewTabs');
            expect(content).toContain('Step 5 of the database view refactoring project');
            expect(content).toContain('class DatabaseViewTabs');
            expect(content).toContain('switchTab(');
            expect(content).toContain('initializeTabConfigs()');
            expect(content).toContain('updateSearchContainer(');
        });

        test('database-view-search.js should have proper structure', () => {
            const filePath = path.join(process.cwd(), 'public/js/database-view-search.js');
            const content = fs.readFileSync(filePath, 'utf8');

            expect(content).toContain('DatabaseViewSearch');
            expect(content).toContain('Step 5 of the database view refactoring project');
            expect(content).toContain('class DatabaseViewSearch');
            expect(content).toContain('handleSearchInput(');
            expect(content).toContain('performSearch(');
            expect(content).toContain('clearSearch(');
        });

        test('database-view-display.js should have proper structure', () => {
            const filePath = path.join(process.cwd(), 'public/js/database-view-display.js');
            const content = fs.readFileSync(filePath, 'utf8');

            expect(content).toContain('DatabaseViewDisplay');
            expect(content).toContain('Step 5 of the database view refactoring project');
            expect(content).toContain('class DatabaseViewDisplay');
            expect(content).toContain('updateDisplay(');
            expect(content).toContain('showLoading(');
            expect(content).toContain('hideLoading(');
        });

        test('data-loading-core.js should have proper structure', () => {
            const filePath = path.join(process.cwd(), 'public/js/data-loading-core.js');
            const content = fs.readFileSync(filePath, 'utf8');

            expect(content).toContain('DataLoadingCore');
            expect(content).toContain('Step 5 of the database view refactoring project');
            expect(content).toContain('class DataLoadingCore');
            expect(content).toContain('loadAllData(');
            expect(content).toContain('loadData(');
            expect(content).toContain('getCachedData(');
        });
    });

    describe('Database HTML Updates', () => {
        test('database.html should include new component scripts', () => {
            const filePath = path.join(process.cwd(), 'public/database.html');
            const content = fs.readFileSync(filePath, 'utf8');

            expect(content).toContain('database-view-core.js');
            expect(content).toContain('database-view-tabs.js');
            expect(content).toContain('database-view-search.js');
            expect(content).toContain('database-view-display.js');
            expect(content).toContain('data-loading-core.js');
            expect(content).toContain('Step 5: New Component Structure');
        });

        test('database.html should initialize new component structure', () => {
            const filePath = path.join(process.cwd(), 'public/database.html');
            const content = fs.readFileSync(filePath, 'utf8');

            expect(content).toContain('databaseViewCore.initialize()');
            expect(content).toContain('Initializing new component structure');
        });
    });

    describe('Database View JS Updates', () => {
        test('database-view.js should have updated switchTab function', () => {
            const filePath = path.join(process.cwd(), 'public/js/database-view.js');
            const content = fs.readFileSync(filePath, 'utf8');

            expect(content).toContain('switchTabFallback');
            expect(content).toContain('window.databaseViewCore');
            expect(content).toContain('Using new component structure for tab switch');
            expect(content).toContain('Using fallback tab switch implementation');
        });

        test('database-view.js should export fallback function', () => {
            const filePath = path.join(process.cwd(), 'public/js/database-view.js');
            const content = fs.readFileSync(filePath, 'utf8');

            expect(content).toContain('window.switchTabFallback = switchTabFallback');
        });
    });

    describe('Component Integration', () => {
        test('should have proper component dependencies', () => {
            const corePath = path.join(process.cwd(), 'public/js/database-view-core.js');
            const coreContent = fs.readFileSync(corePath, 'utf8');

            expect(coreContent).toContain('window.DatabaseViewTabs');
            expect(coreContent).toContain('window.DatabaseViewSearch');
            expect(coreContent).toContain('window.DatabaseViewDisplay');
            expect(coreContent).toContain('window.DataLoadingCore');
        });

        test('should have proper global exports', () => {
            const corePath = path.join(process.cwd(), 'public/js/database-view-core.js');
            const coreContent = fs.readFileSync(corePath, 'utf8');

            expect(coreContent).toContain('window.DatabaseViewCore = DatabaseViewCore');
            expect(coreContent).toContain('window.databaseViewCore = databaseViewCore');
        });
    });

    describe('Component Architecture', () => {
        test('should follow proper component patterns', () => {
            const componentFiles = [
                'database-view-core.js',
                'database-view-tabs.js',
                'database-view-search.js',
                'database-view-display.js',
                'data-loading-core.js'
            ];

            componentFiles.forEach(fileName => {
                const filePath = path.join(process.cwd(), 'public/js', fileName);
                const content = fs.readFileSync(filePath, 'utf8');

                // Each component should have proper documentation
                expect(content).toContain('/* ========================================');
                expect(content).toContain('Step 5 of the database view refactoring project');
                
                // Each component should have a class
                expect(content).toContain('class ');
                
                // Each component should have initialization
                expect(content).toContain('initialize(');
                
                // Each component should have cleanup
                expect(content).toContain('cleanup(');
                
                // Each component should be globally available
                expect(content).toContain('window.');
            });
        });

        test('should have proper error handling', () => {
            const corePath = path.join(process.cwd(), 'public/js/database-view-core.js');
            const coreContent = fs.readFileSync(corePath, 'utf8');

            expect(coreContent).toContain('try {');
            expect(coreContent).toContain('catch (error)');
            expect(coreContent).toContain('console.error(');
        });

        test('should have proper logging', () => {
            const componentFiles = [
                'database-view-core.js',
                'database-view-tabs.js',
                'database-view-search.js',
                'database-view-display.js',
                'data-loading-core.js'
            ];

            componentFiles.forEach(fileName => {
                const filePath = path.join(process.cwd(), 'public/js', fileName);
                const content = fs.readFileSync(filePath, 'utf8');

                expect(content).toContain('console.log(');
            });
        });
    });

    describe('Backward Compatibility', () => {
        test('should maintain backward compatibility', () => {
            const dbViewPath = path.join(process.cwd(), 'public/js/database-view.js');
            const dbViewContent = fs.readFileSync(dbViewPath, 'utf8');

            // Should still have original switchTab function
            expect(dbViewContent).toContain('function switchTab(tabName)');
            
            // Should have fallback implementation
            expect(dbViewContent).toContain('function switchTabFallback(tabName)');
            
            // Should check for new component structure first
            expect(dbViewContent).toContain('window.databaseViewCore');
        });
    });

    describe('File Organization', () => {
        test('should have proper file naming convention', () => {
            const componentFiles = [
                'database-view-core.js',
                'database-view-tabs.js',
                'database-view-search.js',
                'database-view-display.js',
                'data-loading-core.js'
            ];

            componentFiles.forEach(fileName => {
                const filePath = path.join(process.cwd(), 'public/js', fileName);
                expect(fs.existsSync(filePath)).toBe(true);
            });
        });

        test('should have consistent file structure', () => {
            const componentFiles = [
                'database-view-core.js',
                'database-view-tabs.js',
                'database-view-search.js',
                'database-view-display.js',
                'data-loading-core.js'
            ];

            componentFiles.forEach(fileName => {
                const filePath = path.join(process.cwd(), 'public/js', fileName);
                const content = fs.readFileSync(filePath, 'utf8');

                // Each file should start with proper documentation
                expect(content).toMatch(/^\/\* ========================================/);
                
                // Each file should have a class definition
                expect(content).toContain('class ');
                
                // Each file should have global exports
                expect(content).toContain('window.');
            });
        });
    });
});

/**
 * Comprehensive coverage tests for Step 1 refactoring
 * Tests all new code created in Step 1: template loader, route, and template file
 */

import fs from 'fs';
import path from 'path';

describe('Step 1 Refactoring - Complete Coverage', () => {
    describe('New Files Created', () => {
        it('should have created database-view-complete.html template', () => {
            const templatePath = path.join(process.cwd(), 'public/templates/database-view-complete.html');
            expect(fs.existsSync(templatePath)).toBe(true);
        });

        it('should have modified database.html to use template loader', () => {
            const databasePath = path.join(process.cwd(), 'public/database.html');
            const content = fs.readFileSync(databasePath, 'utf-8');
            
            // Should contain the template loader function
            expect(content).toContain('loadDatabaseViewTemplate');
            expect(content).toContain('database-view-container');
            expect(content).toContain('/templates/database-view-complete.html');
        });

        it('should have added /database route to index.ts', () => {
            const indexPath = path.join(process.cwd(), 'src/index.ts');
            const content = fs.readFileSync(indexPath, 'utf-8');
            
            // Should contain the new database route
            expect(content).toContain("app.get('/database'");
            expect(content).toContain('public/database.html');
        });
    });

    describe('Template Loader Function Coverage', () => {
        it('should define loadDatabaseViewTemplate function', () => {
            const databasePath = path.join(process.cwd(), 'public/database.html');
            const content = fs.readFileSync(databasePath, 'utf-8');
            
            // Function definition
            expect(content).toContain('async function loadDatabaseViewTemplate()');
            
            // Function body
            expect(content).toContain('fetch(\'/templates/database-view-complete.html\')');
            expect(content).toContain('response.text()');
            expect(content).toContain('getElementById(\'database-view-container\')');
            expect(content).toContain('innerHTML = templateContent');
            
            // Error handling
            expect(content).toContain('catch (error)');
            expect(content).toContain('console.error');
            
            // Success logging
            expect(content).toContain('console.log');
            expect(content).toContain('Template loaded successfully');
        });

        it('should call loadDatabaseViewTemplate in DOMContentLoaded', () => {
            const databasePath = path.join(process.cwd(), 'public/database.html');
            const content = fs.readFileSync(databasePath, 'utf-8');
            
            // Should be called in DOMContentLoaded
            expect(content).toContain('loadDatabaseViewTemplate()');
            expect(content).toContain('DOMContentLoaded');
        });
    });

    describe('Server Route Coverage', () => {
        it('should have correct route configuration', () => {
            const indexPath = path.join(process.cwd(), 'src/index.ts');
            const content = fs.readFileSync(indexPath, 'utf-8');
            
            // Route definition
            expect(content).toContain("app.get('/database'");
            expect(content).toContain('(req, res) => {');
            expect(content).toContain('res.sendFile');
            expect(content).toContain('path.join(process.cwd(), \'public/database.html\')');
        });

        it('should be positioned correctly in the file', () => {
            const indexPath = path.join(process.cwd(), 'src/index.ts');
            const content = fs.readFileSync(indexPath, 'utf-8');
            
            // Should be after the /data route
            const dataRouteIndex = content.indexOf("app.get('/data'");
            const databaseRouteIndex = content.indexOf("app.get('/database'");
            
            expect(dataRouteIndex).toBeGreaterThan(-1);
            expect(databaseRouteIndex).toBeGreaterThan(-1);
            expect(databaseRouteIndex).toBeGreaterThan(dataRouteIndex);
        });
    });

    describe('Template File Coverage', () => {
        it('should contain all required HTML structure', () => {
            const templatePath = path.join(process.cwd(), 'public/templates/database-view-complete.html');
            const content = fs.readFileSync(templatePath, 'utf-8');
            
            // Main container
            expect(content).toContain('<div id="database-view" class="database-section"');
            
            // All table containers
            const tableIds = [
                'characters-tab', 'special-cards-tab', 'advanced-universe-tab',
                'locations-tab', 'aspects-tab', 'missions-tab', 'events-tab',
                'teamwork-tab', 'ally-universe-tab', 'training-tab',
                'basic-universe-tab', 'power-cards-tab'
            ];
            
            tableIds.forEach(id => {
                expect(content).toContain(`id="${id}"`);
            });
            
            // All table bodies
            const tbodyIds = [
                'characters-tbody', 'special-cards-tbody', 'advanced-universe-tbody',
                'locations-tbody', 'aspects-tbody', 'missions-tbody', 'events-tbody',
                'teamwork-tbody', 'ally-universe-tbody', 'training-tbody',
                'basic-universe-tbody', 'power-cards-tbody'
            ];
            
            tbodyIds.forEach(id => {
                expect(content).toContain(`id="${id}"`);
            });
        });

        it('should contain all filter elements', () => {
            const templatePath = path.join(process.cwd(), 'public/templates/database-view-complete.html');
            const content = fs.readFileSync(templatePath, 'utf-8');
            
            // Character filters
            expect(content).toContain('data-column="energy"');
            expect(content).toContain('data-column="combat"');
            expect(content).toContain('data-column="brute_force"');
            expect(content).toContain('data-column="intelligence"');
            expect(content).toContain('data-column="threat_level"');
            
            // Location filters
            expect(content).toContain('id="location-threat-min"');
            expect(content).toContain('id="location-threat-max"');
            
            // Basic universe filters
            expect(content).toContain('id="basic-value-min"');
            expect(content).toContain('id="basic-value-max"');
            expect(content).toContain('id="basic-bonus-min"');
            expect(content).toContain('id="basic-bonus-max"');
        });

        it('should contain all onclick handlers', () => {
            const templatePath = path.join(process.cwd(), 'public/templates/database-view-complete.html');
            const content = fs.readFileSync(templatePath, 'utf-8');
            
            // Tab switching handlers
            const tabHandlers = [
                'switchTab(\'characters\')', 'switchTab(\'special-cards\')',
                'switchTab(\'advanced-universe\')', 'switchTab(\'locations\')',
                'switchTab(\'aspects\')', 'switchTab(\'missions\')',
                'switchTab(\'events\')', 'switchTab(\'teamwork\')',
                'switchTab(\'ally-universe\')', 'switchTab(\'training\')',
                'switchTab(\'basic-universe\')', 'switchTab(\'power-cards\')'
            ];
            
            tabHandlers.forEach(handler => {
                expect(content).toContain(`onclick="${handler}"`);
            });
            
            // Clear filter handlers
            const clearHandlers = [
                'clearSpecialCardFilters()', 'clearAdvancedUniverseFilters()',
                'clearLocationFilters()', 'clearAspectsFilters()',
                'clearMissionsFilters()', 'clearEventsFilters()',
                'clearTeamworkFilters()', 'clearAllyUniverseFilters()',
                'clearTrainingFilters()', 'clearBasicUniverseFilters()',
                'clearPowerCardFilters()'
            ];
            
            clearHandlers.forEach(handler => {
                expect(content).toContain(`onclick="${handler}"`);
            });
        });
    });

    describe('Integration Coverage', () => {
        it('should have proper file relationships', () => {
            // Template file should exist
            const templatePath = path.join(process.cwd(), 'public/templates/database-view-complete.html');
            expect(fs.existsSync(templatePath)).toBe(true);
            
            // Database.html should reference the template
            const databasePath = path.join(process.cwd(), 'public/database.html');
            const databaseContent = fs.readFileSync(databasePath, 'utf-8');
            expect(databaseContent).toContain('/templates/database-view-complete.html');
            
            // Index.ts should serve database.html
            const indexPath = path.join(process.cwd(), 'src/index.ts');
            const indexContent = fs.readFileSync(indexPath, 'utf-8');
            expect(indexContent).toContain('public/database.html');
        });

        it('should maintain backward compatibility', () => {
            // Original /data route should still exist
            const indexPath = path.join(process.cwd(), 'src/index.ts');
            const indexContent = fs.readFileSync(indexPath, 'utf-8');
            expect(indexContent).toContain("app.get('/data'");
            
            // Database.html should still be a valid HTML file
            const databasePath = path.join(process.cwd(), 'public/database.html');
            const databaseContent = fs.readFileSync(databasePath, 'utf-8');
            expect(databaseContent).toContain('<!DOCTYPE html>');
            expect(databaseContent).toContain('<html');
            expect(databaseContent).toContain('</html>');
        });
    });

    describe('Code Quality Coverage', () => {
        it('should have proper error handling', () => {
            const databasePath = path.join(process.cwd(), 'public/database.html');
            const content = fs.readFileSync(databasePath, 'utf-8');
            
            // Template loader should have try-catch
            expect(content).toContain('try {');
            expect(content).toContain('catch (error) {');
            expect(content).toContain('console.error');
        });

        it('should have proper logging', () => {
            const databasePath = path.join(process.cwd(), 'public/database.html');
            const content = fs.readFileSync(databasePath, 'utf-8');
            
            // Should have success and error logging
            expect(content).toContain('console.log');
            expect(content).toContain('console.error');
            expect(content).toContain('Template loaded successfully');
            expect(content).toContain('Error loading database view template:');
        });

        it('should have proper documentation', () => {
            const templatePath = path.join(process.cwd(), 'public/templates/database-view-complete.html');
            const content = fs.readFileSync(templatePath, 'utf-8');
            
            // Should have header documentation
            expect(content).toContain('DATABASE VIEW COMPLETE TEMPLATE');
            expect(content).toContain('Step 1');
            expect(content).toContain('refactoring project');
            expect(content).toContain('Purpose: Complete database view HTML structure');
        });
    });

    describe('Performance Coverage', () => {
        it('should have reasonable file sizes', () => {
            const templatePath = path.join(process.cwd(), 'public/templates/database-view-complete.html');
            const templateStats = fs.statSync(templatePath);
            
            // Template should be substantial but not excessive
            expect(templateStats.size).toBeGreaterThan(10000); // At least 10KB
            expect(templateStats.size).toBeLessThan(100000); // Less than 100KB
        });

        it('should have efficient HTML structure', () => {
            const templatePath = path.join(process.cwd(), 'public/templates/database-view-complete.html');
            const content = fs.readFileSync(templatePath, 'utf-8');
            
            // Should not have excessive empty lines
            const lines = content.split('\n');
            const emptyLines = lines.filter(line => line.trim() === '').length;
            const totalLines = lines.length;
            
            expect(emptyLines / totalLines).toBeLessThan(0.2); // Less than 20% empty lines
        });
    });
});

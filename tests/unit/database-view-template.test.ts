/**
 * Unit tests for the database-view-complete.html template file
 * Tests the template structure and content created in Step 1 refactoring
 */

import fs from 'fs';
import path from 'path';

describe('Database View Template', () => {
    const templatePath = path.join(process.cwd(), 'public/templates/database-view-complete.html');
    let templateContent: string;

    beforeAll(() => {
        // Read the template file
        templateContent = fs.readFileSync(templatePath, 'utf-8');
    });

    describe('Template File Existence', () => {
        it('should exist in the correct location', () => {
            expect(fs.existsSync(templatePath)).toBe(true);
        });

        it('should be readable', () => {
            expect(() => fs.readFileSync(templatePath, 'utf-8')).not.toThrow();
        });

        it('should not be empty', () => {
            expect(templateContent.length).toBeGreaterThan(0);
        });
    });

    describe('Template Structure', () => {
        it('should contain the main database-view container', () => {
            expect(templateContent).toContain('id="database-view"');
            expect(templateContent).toContain('database-section');
        });

        it('should contain statistics section', () => {
            expect(templateContent).toContain('class="stats"');
            expect(templateContent).toContain('id="total-characters"');
            expect(templateContent).toContain('id="total-special-cards"');
            expect(templateContent).toContain('id="total-missions"');
            expect(templateContent).toContain('id="total-events"');
            expect(templateContent).toContain('id="total-locations"');
            expect(templateContent).toContain('id="db-total-decks"');
            expect(templateContent).toContain('id="total-users"');
        });

        it('should contain tab container with all tabs', () => {
            expect(templateContent).toContain('class="tab-container"');
            expect(templateContent).toContain('onclick="switchTab(\'characters\')"');
            expect(templateContent).toContain('onclick="switchTab(\'special-cards\')"');
            expect(templateContent).toContain('onclick="switchTab(\'advanced-universe\')"');
            expect(templateContent).toContain('onclick="switchTab(\'locations\')"');
            expect(templateContent).toContain('onclick="switchTab(\'aspects\')"');
            expect(templateContent).toContain('onclick="switchTab(\'missions\')"');
            expect(templateContent).toContain('onclick="switchTab(\'events\')"');
            expect(templateContent).toContain('onclick="switchTab(\'teamwork\')"');
            expect(templateContent).toContain('onclick="switchTab(\'ally-universe\')"');
            expect(templateContent).toContain('onclick="switchTab(\'training\')"');
            expect(templateContent).toContain('onclick="switchTab(\'basic-universe\')"');
            expect(templateContent).toContain('onclick="switchTab(\'power-cards\')"');
        });

        it('should contain search container', () => {
            expect(templateContent).toContain('id="search-container"');
            expect(templateContent).toContain('id="search-input"');
        });
    });

    describe('Table Containers', () => {
        it('should contain characters table', () => {
            expect(templateContent).toContain('id="characters-tab"');
            expect(templateContent).toContain('id="characters-table"');
            expect(templateContent).toContain('id="characters-tbody"');
            expect(templateContent).toContain('id="clear-filters"');
        });

        it('should contain special cards table', () => {
            expect(templateContent).toContain('id="special-cards-tab"');
            expect(templateContent).toContain('id="special-cards-table"');
            expect(templateContent).toContain('id="special-cards-tbody"');
            expect(templateContent).toContain('onclick="clearSpecialCardFilters()"');
        });

        it('should contain advanced universe table', () => {
            expect(templateContent).toContain('id="advanced-universe-tab"');
            expect(templateContent).toContain('id="advanced-universe-table"');
            expect(templateContent).toContain('id="advanced-universe-tbody"');
            expect(templateContent).toContain('onclick="clearAdvancedUniverseFilters()"');
        });

        it('should contain locations table', () => {
            expect(templateContent).toContain('id="locations-tab"');
            expect(templateContent).toContain('id="locations-table"');
            expect(templateContent).toContain('id="locations-tbody"');
            expect(templateContent).toContain('onclick="clearLocationFilters()"');
        });

        it('should contain aspects table', () => {
            expect(templateContent).toContain('id="aspects-tab"');
            expect(templateContent).toContain('id="aspects-table"');
            expect(templateContent).toContain('id="aspects-tbody"');
            expect(templateContent).toContain('onclick="clearAspectsFilters()"');
        });

        it('should contain missions table', () => {
            expect(templateContent).toContain('id="missions-tab"');
            expect(templateContent).toContain('id="missions-table"');
            expect(templateContent).toContain('id="missions-tbody"');
            expect(templateContent).toContain('onclick="clearMissionsFilters()"');
        });

        it('should contain events table', () => {
            expect(templateContent).toContain('id="events-tab"');
            expect(templateContent).toContain('id="events-table"');
            expect(templateContent).toContain('id="events-tbody"');
            expect(templateContent).toContain('onclick="clearEventsFilters()"');
        });

        it('should contain teamwork table', () => {
            expect(templateContent).toContain('id="teamwork-tab"');
            expect(templateContent).toContain('id="teamwork-table"');
            expect(templateContent).toContain('id="teamwork-tbody"');
            expect(templateContent).toContain('onclick="clearTeamworkFilters()"');
        });

        it('should contain ally universe table', () => {
            expect(templateContent).toContain('id="ally-universe-tab"');
            expect(templateContent).toContain('id="ally-universe-table"');
            expect(templateContent).toContain('id="ally-universe-tbody"');
            expect(templateContent).toContain('onclick="clearAllyUniverseFilters()"');
        });

        it('should contain training table', () => {
            expect(templateContent).toContain('id="training-tab"');
            expect(templateContent).toContain('id="training-table"');
            expect(templateContent).toContain('id="training-tbody"');
            expect(templateContent).toContain('onclick="clearTrainingFilters()"');
        });

        it('should contain basic universe table', () => {
            expect(templateContent).toContain('id="basic-universe-tab"');
            expect(templateContent).toContain('id="basic-universe-table"');
            expect(templateContent).toContain('id="basic-universe-tbody"');
            expect(templateContent).toContain('onclick="clearBasicUniverseFilters()"');
        });

        it('should contain power cards table', () => {
            expect(templateContent).toContain('id="power-cards-tab"');
            expect(templateContent).toContain('id="power-cards-table"');
            expect(templateContent).toContain('id="power-cards-tbody"');
            expect(templateContent).toContain('onclick="clearPowerCardFilters()"');
        });
    });

    describe('Filter Elements', () => {
        it('should contain character filters', () => {
            expect(templateContent).toContain('data-column="energy"');
            expect(templateContent).toContain('data-column="combat"');
            expect(templateContent).toContain('data-column="brute_force"');
            expect(templateContent).toContain('data-column="intelligence"');
            expect(templateContent).toContain('data-column="threat_level"');
            expect(templateContent).toContain('id="has-inherent-ability"');
            expect(templateContent).toContain('id="has-no-inherent-ability"');
        });

        it('should contain location filters', () => {
            expect(templateContent).toContain('id="location-threat-min"');
            expect(templateContent).toContain('id="location-threat-max"');
        });

        it('should contain basic universe filters', () => {
            expect(templateContent).toContain('id="basic-value-min"');
            expect(templateContent).toContain('id="basic-value-max"');
            expect(templateContent).toContain('id="basic-bonus-min"');
            expect(templateContent).toContain('id="basic-bonus-max"');
        });

        it('should contain power card filters', () => {
            expect(templateContent).toContain('id="power-value-min"');
            expect(templateContent).toContain('id="power-value-max"');
        });

        it('should contain mission set checkboxes', () => {
            expect(templateContent).toContain('value="King of the Jungle"');
            expect(templateContent).toContain('value="The Call of Cthulhu"');
            expect(templateContent).toContain('value="Time Wars: Rise of the Gods"');
            expect(templateContent).toContain('value="Warlord of Mars"');
        });

        it('should contain power type checkboxes', () => {
            expect(templateContent).toContain('value="Energy"');
            expect(templateContent).toContain('value="Combat"');
            expect(templateContent).toContain('value="Brute Force"');
            expect(templateContent).toContain('value="Intelligence"');
            expect(templateContent).toContain('value="Any-Power"');
            expect(templateContent).toContain('value="Multi-Power"');
        });
    });

    describe('Toggle Controls', () => {
        it('should contain advanced universe toggle controls', () => {
            expect(templateContent).toContain('id="toggle-one-per-deck-advanced"');
            expect(templateContent).toContain('onclick="toggleOnePerDeckAdvancedColumn()"');
            expect(templateContent).toContain('id="one-per-deck-advanced-toggle-text"');
        });

        it('should contain aspects toggle controls', () => {
            expect(templateContent).toContain('id="toggle-fortifications"');
            expect(templateContent).toContain('onclick="toggleFortificationsColumn()"');
            expect(templateContent).toContain('id="fortifications-toggle-text"');
            expect(templateContent).toContain('id="toggle-one-per-deck"');
            expect(templateContent).toContain('onclick="toggleOnePerDeckColumn()"');
            expect(templateContent).toContain('id="one-per-deck-toggle-text"');
        });
    });

    describe('Column Visibility Classes', () => {
        it('should contain hidden column classes', () => {
            expect(templateContent).toContain('class="one-per-deck-advanced-column"');
            expect(templateContent).toContain('class="fortifications-column hidden"');
            expect(templateContent).toContain('class="one-per-deck-column hidden"');
        });
    });

    describe('Loading States', () => {
        it('should contain loading messages for all tables', () => {
            expect(templateContent).toContain('Loading characters...');
            expect(templateContent).toContain('Loading special cards...');
            expect(templateContent).toContain('Loading advanced universe cards...');
            expect(templateContent).toContain('Loading locations...');
            expect(templateContent).toContain('Loading aspects...');
            expect(templateContent).toContain('Loading missions...');
            expect(templateContent).toContain('Loading events...');
            expect(templateContent).toContain('Loading teamwork cards...');
            expect(templateContent).toContain('Loading allies...');
            expect(templateContent).toContain('Loading training...');
            expect(templateContent).toContain('Loading basic universe...');
            expect(templateContent).toContain('Loading power cards...');
        });
    });

    describe('HTML Validation', () => {
        it('should have proper HTML structure', () => {
            // Check for proper opening and closing tags
            const openDivs = (templateContent.match(/<div/g) || []).length;
            const closeDivs = (templateContent.match(/<\/div>/g) || []).length;
            expect(openDivs).toBe(closeDivs);

            const openTables = (templateContent.match(/<table/g) || []).length;
            const closeTables = (templateContent.match(/<\/table>/g) || []).length;
            expect(openTables).toBe(closeTables);

            const openButtons = (templateContent.match(/<button/g) || []).length;
            const closeButtons = (templateContent.match(/<\/button>/g) || []).length;
            expect(openButtons).toBe(closeButtons);
        });

        it('should not contain any unclosed tags', () => {
            // Check for common unclosed tag patterns
            expect(templateContent).not.toMatch(/<[^>]*$/);
            expect(templateContent).not.toContain('<<');
            expect(templateContent).not.toContain('>>');
        });

        it('should have proper attribute quoting', () => {
            // Check that all attributes are properly quoted
            const unquotedAttributes = templateContent.match(/=\w+/g);
            expect(unquotedAttributes).toBeNull();
        });
    });

    describe('Template Documentation', () => {
        it('should contain proper header documentation', () => {
            expect(templateContent).toContain('DATABASE VIEW COMPLETE TEMPLATE');
            expect(templateContent).toContain('Step 1');
            expect(templateContent).toContain('refactoring project');
        });

        it('should contain purpose and creation information', () => {
            expect(templateContent).toContain('Purpose: Complete database view HTML structure');
            expect(templateContent).toContain('Created: Database view refactoring - Step 1');
            expect(templateContent).toContain('Contains: Complete HTML for the database view section');
        });
    });

    describe('Template Size and Performance', () => {
        it('should be reasonably sized', () => {
            // Template should be substantial but not excessively large
            expect(templateContent.length).toBeGreaterThan(10000); // At least 10KB
            expect(templateContent.length).toBeLessThan(100000); // Less than 100KB
        });

        it('should not contain excessive whitespace', () => {
            const lines = templateContent.split('\n');
            const emptyLines = lines.filter(line => line.trim() === '').length;
            const totalLines = lines.length;
            
            // Should not have more than 20% empty lines
            expect(emptyLines / totalLines).toBeLessThan(0.2);
        });
    });
});

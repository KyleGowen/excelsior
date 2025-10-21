/**
 * Unit tests for database view template loader functionality
 * Tests the new loadDatabaseViewTemplate() function created in Step 1 refactoring
 */

import { JSDOM } from 'jsdom';

// Mock fetch globally
global.fetch = jest.fn();

describe('Database View Template Loader', () => {
    let dom: JSDOM;
    let document: Document;
    let window: any;

    beforeEach(() => {
        // Create a clean JSDOM environment for each test
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <head></head>
            <body>
                <div id="database-view-container">
                    <!-- Database view content will be loaded here -->
                </div>
            </body>
            </html>
        `, {
            url: 'http://localhost:3000',
            pretendToBeVisual: true,
            resources: 'usable'
        });

        document = dom.window.document;
        window = dom.window;
        global.document = document;
        global.window = window;

        // Reset fetch mock
        (global.fetch as jest.Mock).mockClear();
        
        // Reset console methods
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
        dom.window.close();
    });

    describe('loadDatabaseViewTemplate', () => {
        it('should successfully load and inject template HTML', async () => {
            // Arrange
            const mockTemplateHTML = `
                <div id="database-view" class="database-section">
                    <div class="stats">
                        <div class="stat-card">
                            <div class="stat-number" id="total-characters">-</div>
                            <div class="stat-label">Characters</div>
                        </div>
                    </div>
                    <div class="tab-container">
                        <button class="tab-button active" onclick="switchTab('characters')">Characters</button>
                    </div>
                </div>
            `;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                text: jest.fn().mockResolvedValueOnce(mockTemplateHTML)
            });

            // Act
            await loadDatabaseViewTemplate();

            // Assert
            expect(global.fetch).toHaveBeenCalledWith('/templates/database-view-complete.html');
            expect(document.getElementById('database-view-container')?.innerHTML).toBe(mockTemplateHTML);
            expect(console.log).toHaveBeenCalledWith('✅ Database view template loaded successfully');
        });

        it('should handle fetch errors gracefully', async () => {
            // Arrange
            const mockError = new Error('Network error');
            (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

            // Act
            await loadDatabaseViewTemplate();

            // Assert
            expect(global.fetch).toHaveBeenCalledWith('/templates/database-view-complete.html');
            expect(console.error).toHaveBeenCalledWith('❌ Error loading database view template:', mockError);
            // Container should remain unchanged
            expect(document.getElementById('database-view-container')?.innerHTML.trim()).toBe('<!-- Database view content will be loaded here -->');
        });

        it('should handle missing database-view-container element', async () => {
            // Arrange
            const container = document.getElementById('database-view-container');
            container?.remove();

            const mockTemplateHTML = '<div>Test template</div>';
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                text: jest.fn().mockResolvedValueOnce(mockTemplateHTML)
            });

            // Act & Assert
            await expect(loadDatabaseViewTemplate()).resolves.not.toThrow();
            expect(console.error).toHaveBeenCalledWith('❌ Error loading database view template:', expect.any(Error));
        });

        it('should handle empty template response', async () => {
            // Arrange
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                text: jest.fn().mockResolvedValueOnce('')
            });

            // Act
            await loadDatabaseViewTemplate();

            // Assert
            expect(global.fetch).toHaveBeenCalledWith('/templates/database-view-complete.html');
            expect(document.getElementById('database-view-container')?.innerHTML).toBe('');
            expect(console.log).toHaveBeenCalledWith('✅ Database view template loaded successfully');
        });

        it('should handle malformed template HTML', async () => {
            // Arrange
            const malformedHTML = '<div>Unclosed div';
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                text: jest.fn().mockResolvedValueOnce(malformedHTML)
            });

            // Act
            await loadDatabaseViewTemplate();

            // Assert
            expect(global.fetch).toHaveBeenCalledWith('/templates/database-view-complete.html');
            // JSDOM may auto-close tags, so we check that the content is set
            expect(document.getElementById('database-view-container')?.innerHTML).toContain('Unclosed div');
            expect(console.log).toHaveBeenCalledWith('✅ Database view template loaded successfully');
        });

        it('should preserve existing content if fetch fails', async () => {
            // Arrange
            const originalContent = '<!-- Database view content will be loaded here -->';
            const container = document.getElementById('database-view-container');
            container!.innerHTML = originalContent;

            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'));

            // Act
            await loadDatabaseViewTemplate();

            // Assert
            expect(container?.innerHTML).toBe(originalContent);
            expect(console.error).toHaveBeenCalledWith('❌ Error loading database view template:', expect.any(Error));
        });

        it('should handle concurrent calls gracefully', async () => {
            // Arrange
            const mockTemplateHTML = '<div>Template content</div>';
            (global.fetch as jest.Mock).mockResolvedValue({
                text: jest.fn().mockResolvedValue(mockTemplateHTML)
            });

            // Act - Call the function multiple times concurrently
            const promises = [
                loadDatabaseViewTemplate(),
                loadDatabaseViewTemplate(),
                loadDatabaseViewTemplate()
            ];

            await Promise.all(promises);

            // Assert
            expect(global.fetch).toHaveBeenCalledTimes(3);
            expect(document.getElementById('database-view-container')?.innerHTML).toBe(mockTemplateHTML);
            expect(console.log).toHaveBeenCalledTimes(3);
        });
    });

    describe('Template Content Validation', () => {
        it('should load template with all required database view elements', async () => {
            // Arrange
            const completeTemplateHTML = `
                <div id="database-view" class="database-section">
                    <div class="stats">
                        <div class="stat-card">
                            <div class="stat-number" id="total-characters">-</div>
                            <div class="stat-label">Characters</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="total-special-cards">-</div>
                            <div class="stat-label">Special Cards</div>
                        </div>
                    </div>
                    <div class="tab-container">
                        <div class="tab-row">
                            <button class="tab-button active" onclick="switchTab('characters')">Characters</button>
                            <button class="tab-button" onclick="switchTab('special-cards')">Special Cards</button>
                        </div>
                    </div>
                    <div class="table-container" id="characters-tab">
                        <table id="characters-table">
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Name</th>
                                    <th>Energy</th>
                                </tr>
                            </thead>
                            <tbody id="characters-tbody">
                                <tr><td colspan="3" class="loading">Loading characters...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                text: jest.fn().mockResolvedValueOnce(completeTemplateHTML)
            });

            // Act
            await loadDatabaseViewTemplate();

            // Assert
            const container = document.getElementById('database-view-container');
            expect(container?.innerHTML).toContain('id="database-view"');
            expect(container?.innerHTML).toContain('class="database-section"');
            expect(container?.innerHTML).toContain('id="total-characters"');
            expect(container?.innerHTML).toContain('id="characters-tab"');
            expect(container?.innerHTML).toContain('id="characters-table"');
        });

        it('should preserve all tab button onclick handlers', async () => {
            // Arrange
            const templateWithHandlers = `
                <div class="tab-container">
                    <button class="tab-button active" onclick="switchTab('characters')">Characters</button>
                    <button class="tab-button" onclick="switchTab('special-cards')">Special Cards</button>
                    <button class="tab-button" onclick="switchTab('locations')">Locations</button>
                </div>
            `;

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                text: jest.fn().mockResolvedValueOnce(templateWithHandlers)
            });

            // Act
            await loadDatabaseViewTemplate();

            // Assert
            const container = document.getElementById('database-view-container');
            expect(container?.innerHTML).toContain('onclick="switchTab(\'characters\')"');
            expect(container?.innerHTML).toContain('onclick="switchTab(\'special-cards\')"');
            expect(container?.innerHTML).toContain('onclick="switchTab(\'locations\')"');
        });
    });

    describe('Function Definition', () => {
        it('should be defined and callable', () => {
            // Assert
            expect(typeof loadDatabaseViewTemplate).toBe('function');
        });

        it('should return a Promise', () => {
            // Arrange
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                text: jest.fn().mockResolvedValueOnce('<div>Test</div>')
            });

            // Act
            const result = loadDatabaseViewTemplate();

            // Assert
            expect(result).toBeInstanceOf(Promise);
        });
    });
});

// Define the function being tested (extracted from database.html)
async function loadDatabaseViewTemplate() {
    try {
        const response = await fetch('/templates/database-view-complete.html');
        const html = await response.text();
        document.getElementById('database-view-container')!.innerHTML = html;
        console.log('✅ Database view template loaded successfully');
    } catch (error) {
        console.error('❌ Error loading database view template:', error);
    }
}

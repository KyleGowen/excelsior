/** @jest-environment jsdom */

/**
 * Unit Tests for Deck Export Overlay Functions
 * 
 * Tests cover:
 * - showExportOverlay() - Display overlay with JSON
 * - closeExportOverlay() - Close overlay
 * - copyJsonToClipboard() - Copy to clipboard functionality
 * - importDeckFromJson() - Import function (disabled)
 */

describe('Deck Export Overlay Functions', () => {
    let mockShowNotification: jest.Mock;
    let mockNavigatorClipboard: any;

    beforeEach(() => {
        // Mock DOM elements
        document.body.innerHTML = `
            <div id="exportJsonOverlay" style="display: none;">
                <div class="export-overlay-content">
                    <div class="export-overlay-header">
                        <h3>Deck Export</h3>
                        <button class="export-close-btn">&times;</button>
                    </div>
                    <div class="export-overlay-body">
                        <div class="json-container">
                            <div class="copy-button" title="Copy to clipboard"></div>
                            <pre id="exportJsonContent"></pre>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Mock showNotification
        mockShowNotification = jest.fn();
        (window as any).showNotification = mockShowNotification;

        // Mock navigator.clipboard
        mockNavigatorClipboard = {
            writeText: jest.fn().mockResolvedValue(undefined),
        };
        (window.navigator as any).clipboard = mockNavigatorClipboard;

        // Mock timers
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        delete (window as any).showNotification;
        delete (window.navigator as any).clipboard;
        delete (window as any).showExportOverlay;
        delete (window as any).closeExportOverlay;
        delete (window as any).copyJsonToClipboard;
        delete (window as any).importDeckFromJson;
    });

    describe('showExportOverlay', () => {
        function createShowExportOverlay() {
            return function showExportOverlay(jsonString: string) {
                const overlay = document.getElementById('exportJsonOverlay');
                const content = document.getElementById('exportJsonContent');
                
                if (overlay && content) {
                    // Display formatted JSON as static text
                    try {
                        const jsonData = JSON.parse(jsonString);
                        const formattedJson = JSON.stringify(jsonData, null, 2);
                        content.textContent = formattedJson;
                        content.className = ''; // Use default pre styling
                    } catch (e) {
                        // Fallback to plain text if JSON is invalid
                        content.textContent = jsonString;
                        content.className = '';
                    }
                    
                    overlay.style.display = 'flex';
                    
                    // Store JSON for copying
                    (overlay as HTMLElement).dataset.jsonString = jsonString;
                    
                    // Add click outside to close
                    overlay.onclick = function(event: MouseEvent) {
                        if (event.target === overlay) {
                            (window as any).closeExportOverlay();
                        }
                    };
                }
            };
        }

        it('should display overlay with valid JSON', () => {
            const showExportOverlay = createShowExportOverlay();
            const testJson = '{"test": "data"}';
            
            showExportOverlay(testJson);
            
            const overlay = document.getElementById('exportJsonOverlay');
            const content = document.getElementById('exportJsonContent');
            
            expect(overlay?.style.display).toBe('flex');
            expect(content?.textContent).toContain('test');
            expect(content?.textContent).toContain('data');
            expect(overlay?.dataset.jsonString).toBe(testJson);
        });

        it('should format JSON with proper indentation', () => {
            const showExportOverlay = createShowExportOverlay();
            const testJson = '{"key":"value","nested":{"inner":"data"}}';
            
            showExportOverlay(testJson);
            
            const content = document.getElementById('exportJsonContent');
            const formatted = content?.textContent || '';
            
            // Should have newlines and spaces (formatted)
            expect(formatted).toContain('\n');
            expect(formatted).toContain('  '); // Indentation
            expect(formatted).toContain('key');
            expect(formatted).toContain('value');
        });

        it('should handle invalid JSON gracefully', () => {
            const showExportOverlay = createShowExportOverlay();
            const invalidJson = 'not valid json {';
            
            showExportOverlay(invalidJson);
            
            const overlay = document.getElementById('exportJsonOverlay');
            const content = document.getElementById('exportJsonContent');
            
            expect(overlay?.style.display).toBe('flex');
            expect(content?.textContent).toBe(invalidJson);
        });

        it('should store JSON string in dataset for copying', () => {
            const showExportOverlay = createShowExportOverlay();
            const testJson = '{"test": "data"}';
            
            showExportOverlay(testJson);
            
            const overlay = document.getElementById('exportJsonOverlay') as HTMLElement;
            expect(overlay?.dataset.jsonString).toBe(testJson);
        });

        it('should set click handler on overlay for closing', () => {
            const showExportOverlay = createShowExportOverlay();
            const closeExportOverlay = jest.fn();
            (window as any).closeExportOverlay = closeExportOverlay;
            
            const testJson = '{"test": "data"}';
            showExportOverlay(testJson);
            
            const overlay = document.getElementById('exportJsonOverlay');
            expect(overlay?.onclick).toBeDefined();
            
            // Simulate click on overlay (not on content)
            if (overlay && overlay.onclick) {
                const mockEvent = { target: overlay } as any;
                overlay.onclick(mockEvent);
                expect(closeExportOverlay).toHaveBeenCalled();
            }
        });

        it('should not close when clicking on content', () => {
            const showExportOverlay = createShowExportOverlay();
            const closeExportOverlay = jest.fn();
            (window as any).closeExportOverlay = closeExportOverlay;
            
            const testJson = '{"test": "data"}';
            showExportOverlay(testJson);
            
            const overlay = document.getElementById('exportJsonOverlay');
            const content = document.getElementById('exportJsonContent');
            
            // Simulate click on content (should not close)
            if (overlay && overlay.onclick && content) {
                const mockEvent = { target: content } as any;
                overlay.onclick(mockEvent);
                expect(closeExportOverlay).not.toHaveBeenCalled();
            }
        });

        it('should handle missing overlay element gracefully', () => {
            const showExportOverlay = createShowExportOverlay();
            document.getElementById('exportJsonOverlay')?.remove();
            
            // Should not throw
            expect(() => {
                showExportOverlay('{"test": "data"}');
            }).not.toThrow();
        });

        it('should handle missing content element gracefully', () => {
            const showExportOverlay = createShowExportOverlay();
            document.getElementById('exportJsonContent')?.remove();
            
            // Should not throw
            expect(() => {
                showExportOverlay('{"test": "data"}');
            }).not.toThrow();
        });

        it('should handle empty JSON string', () => {
            const showExportOverlay = createShowExportOverlay();
            
            showExportOverlay('');
            
            const overlay = document.getElementById('exportJsonOverlay');
            const content = document.getElementById('exportJsonContent');
            
            expect(overlay?.style.display).toBe('flex');
            expect(content?.textContent).toBe('');
        });

        it('should handle complex nested JSON structures', () => {
            const showExportOverlay = createShowExportOverlay();
            const complexJson = JSON.stringify({
                data: {
                    name: 'Test Deck',
                    cards: {
                        characters: ['Char1', 'Char2'],
                        special_cards: {
                            'Character Name': ['Card1', 'Card2']
                        }
                    }
                }
            });
            
            showExportOverlay(complexJson);
            
            const content = document.getElementById('exportJsonContent');
            const formatted = content?.textContent || '';
            
            expect(formatted).toContain('Test Deck');
            expect(formatted).toContain('Char1');
            expect(formatted).toContain('Character Name');
            expect(formatted).toContain('Card1');
        });
    });

    describe('closeExportOverlay', () => {
        function createCloseExportOverlay() {
            return function closeExportOverlay() {
                const overlay = document.getElementById('exportJsonOverlay');
                if (overlay) {
                    overlay.style.display = 'none';
                    overlay.onclick = null;
                }
            };
        }

        it('should hide the overlay', () => {
            const closeExportOverlay = createCloseExportOverlay();
            const overlay = document.getElementById('exportJsonOverlay');
            
            // First show it
            overlay!.style.display = 'flex';
            expect(overlay?.style.display).toBe('flex');
            
            closeExportOverlay();
            
            expect(overlay?.style.display).toBe('none');
        });

        it('should remove click handler', () => {
            const closeExportOverlay = createCloseExportOverlay();
            const overlay = document.getElementById('exportJsonOverlay');
            
            // Set a click handler
            overlay!.onclick = jest.fn() as any;
            expect(overlay?.onclick).toBeDefined();
            
            closeExportOverlay();
            
            expect(overlay?.onclick).toBeNull();
        });

        it('should handle missing overlay element gracefully', () => {
            const closeExportOverlay = createCloseExportOverlay();
            document.getElementById('exportJsonOverlay')?.remove();
            
            // Should not throw
            expect(() => {
                closeExportOverlay();
            }).not.toThrow();
        });

        it('should work when overlay is already hidden', () => {
            const closeExportOverlay = createCloseExportOverlay();
            const overlay = document.getElementById('exportJsonOverlay');
            
            overlay!.style.display = 'none';
            
            closeExportOverlay();
            
            expect(overlay?.style.display).toBe('none');
        });
    });

    describe('copyJsonToClipboard', () => {
        function createCopyJsonToClipboard() {
            return function copyJsonToClipboard() {
                const overlay = document.getElementById('exportJsonOverlay') as HTMLElement;
                const jsonString = overlay?.dataset.jsonString;
                
                if (jsonString) {
                    (window.navigator.clipboard as any).writeText(jsonString).then(() => {
                        // Show temporary feedback
                        const copyBtn = document.querySelector('.copy-button') as HTMLElement;
                        if (copyBtn) {
                            const originalTitle = copyBtn.title;
                            copyBtn.title = 'Copied!';
                            copyBtn.style.background = 'rgba(78, 205, 196, 0.4)';
                            copyBtn.style.borderColor = 'rgba(78, 205, 196, 0.6)';

                            setTimeout(() => {
                                copyBtn.title = originalTitle;
                                copyBtn.style.background = 'rgba(78, 205, 196, 0.2)';
                                copyBtn.style.borderColor = 'rgba(78, 205, 196, 0.3)';
                            }, 1000);
                        }
                    }).catch((err: Error) => {
                        console.error('Failed to copy JSON: ', err);
                        (window as any).showNotification('Failed to copy to clipboard', 'error');
                    });
                }
            };
        }

        it('should copy JSON to clipboard', async () => {
            const copyJsonToClipboard = createCopyJsonToClipboard();
            const overlay = document.getElementById('exportJsonOverlay') as HTMLElement;
            const testJson = '{"test": "data"}';
            
            overlay.dataset.jsonString = testJson;
            
            await copyJsonToClipboard();
            
            expect(mockNavigatorClipboard.writeText).toHaveBeenCalledWith(testJson);
        });

        it('should update copy button appearance on success', async () => {
            const copyJsonToClipboard = createCopyJsonToClipboard();
            const overlay = document.getElementById('exportJsonOverlay') as HTMLElement;
            const copyBtn = document.querySelector('.copy-button') as HTMLElement;
            
            overlay.dataset.jsonString = '{"test": "data"}';
            const originalTitle = copyBtn.title;
            const originalBackground = copyBtn.style.background;
            
            await copyJsonToClipboard();
            
            expect(copyBtn.title).toBe('Copied!');
            expect(copyBtn.style.background).toBe('rgba(78, 205, 196, 0.4)');
            expect(copyBtn.style.borderColor).toBe('rgba(78, 205, 196, 0.6)');
            
            // Fast-forward timer to reset
            jest.advanceTimersByTime(1000);
            
            expect(copyBtn.title).toBe(originalTitle);
            expect(copyBtn.style.background).toBe('rgba(78, 205, 196, 0.2)');
            expect(copyBtn.style.borderColor).toBe('rgba(78, 205, 196, 0.3)');
        });

        it('should handle clipboard write failure', async () => {
            const copyJsonToClipboard = createCopyJsonToClipboard();
            const overlay = document.getElementById('exportJsonOverlay') as HTMLElement;
            const error = new Error('Clipboard error');
            mockNavigatorClipboard.writeText.mockRejectedValue(error);
            
            overlay.dataset.jsonString = '{"test": "data"}';
            
            copyJsonToClipboard();
            
            // Wait for promise rejection to be handled in catch block
            // Use Promise.resolve().then() to wait for next tick
            await Promise.resolve();
            await Promise.resolve(); // Wait an extra tick for catch handler
            
            expect(mockShowNotification).toHaveBeenCalledWith('Failed to copy to clipboard', 'error');
        });

        it('should handle missing JSON string gracefully', async () => {
            const copyJsonToClipboard = createCopyJsonToClipboard();
            const overlay = document.getElementById('exportJsonOverlay') as HTMLElement;
            
            delete overlay.dataset.jsonString;
            
            await copyJsonToClipboard();
            
            expect(mockNavigatorClipboard.writeText).not.toHaveBeenCalled();
        });

        it('should handle missing overlay element gracefully', () => {
            const copyJsonToClipboard = createCopyJsonToClipboard();
            document.getElementById('exportJsonOverlay')?.remove();
            
            // Should not throw
            expect(() => {
                copyJsonToClipboard();
            }).not.toThrow();
        });

        it('should handle missing copy button gracefully', async () => {
            const copyJsonToClipboard = createCopyJsonToClipboard();
            const overlay = document.getElementById('exportJsonOverlay') as HTMLElement;
            document.querySelector('.copy-button')?.remove();
            
            overlay.dataset.jsonString = '{"test": "data"}';
            
            // Should not throw - function doesn't return promise but uses .then()
            expect(() => {
                copyJsonToClipboard();
            }).not.toThrow();
            
            // Wait for promise to resolve
            await Promise.resolve();
            expect(mockNavigatorClipboard.writeText).toHaveBeenCalled();
        });

        it('should preserve original button title and styles before reset', async () => {
            const copyJsonToClipboard = createCopyJsonToClipboard();
            const overlay = document.getElementById('exportJsonOverlay') as HTMLElement;
            const copyBtn = document.querySelector('.copy-button') as HTMLElement;
            
            copyBtn.title = 'Original Title';
            copyBtn.style.background = 'original-bg';
            copyBtn.style.borderColor = 'original-border';
            
            overlay.dataset.jsonString = '{"test": "data"}';
            
            await copyJsonToClipboard();
            
            // Should have updated
            expect(copyBtn.title).toBe('Copied!');
            
            // Fast-forward timer
            jest.advanceTimersByTime(1000);
            
            // Should restore original
            expect(copyBtn.title).toBe('Original Title');
        });

        it('should copy complex JSON correctly', async () => {
            const copyJsonToClipboard = createCopyJsonToClipboard();
            const overlay = document.getElementById('exportJsonOverlay') as HTMLElement;
            const complexJson = JSON.stringify({
                data: { name: 'Test' },
                Cards: { characters: ['Char1'] }
            });
            
            overlay.dataset.jsonString = complexJson;
            
            await copyJsonToClipboard();
            
            expect(mockNavigatorClipboard.writeText).toHaveBeenCalledWith(complexJson);
        });
    });

    describe('importDeckFromJson', () => {
        function createImportDeckFromJson() {
            return function importDeckFromJson() {
                // Import functionality has been disabled
                (window as any).showNotification('Import functionality is currently disabled', 'info');
            };
        }

        it('should show notification that import is disabled', () => {
            const importDeckFromJson = createImportDeckFromJson();
            
            importDeckFromJson();
            
            expect(mockShowNotification).toHaveBeenCalledWith(
                'Import functionality is currently disabled',
                'info'
            );
        });

        it('should not throw errors', () => {
            const importDeckFromJson = createImportDeckFromJson();
            
            expect(() => {
                importDeckFromJson();
            }).not.toThrow();
        });

        it('should always return undefined', () => {
            const importDeckFromJson = createImportDeckFromJson();
            
            const result = importDeckFromJson();
            
            expect(result).toBeUndefined();
        });
    });

    describe('Integration: showExportOverlay + closeExportOverlay', () => {
        it('should show and then close overlay', () => {
            const showExportOverlay = function(jsonString: string) {
                const overlay = document.getElementById('exportJsonOverlay');
                const content = document.getElementById('exportJsonContent');
                if (overlay && content) {
                    try {
                        const jsonData = JSON.parse(jsonString);
                        const formattedJson = JSON.stringify(jsonData, null, 2);
                        content.textContent = formattedJson;
                        content.className = '';
                    } catch (e) {
                        content.textContent = jsonString;
                        content.className = '';
                    }
                    overlay.style.display = 'flex';
                    (overlay as HTMLElement).dataset.jsonString = jsonString;
                }
            };
            
            const closeExportOverlay = function() {
                const overlay = document.getElementById('exportJsonOverlay');
                if (overlay) {
                    overlay.style.display = 'none';
                    overlay.onclick = null;
                }
            };
            
            const testJson = '{"test": "data"}';
            
            showExportOverlay(testJson);
            const overlay = document.getElementById('exportJsonOverlay');
            expect(overlay?.style.display).toBe('flex');
            
            closeExportOverlay();
            expect(overlay?.style.display).toBe('none');
        });
    });

    describe('Integration: showExportOverlay + copyJsonToClipboard', () => {
        it('should display JSON and allow copying', async () => {
            const showExportOverlay = function(jsonString: string) {
                const overlay = document.getElementById('exportJsonOverlay');
                const content = document.getElementById('exportJsonContent');
                if (overlay && content) {
                    try {
                        const jsonData = JSON.parse(jsonString);
                        const formattedJson = JSON.stringify(jsonData, null, 2);
                        content.textContent = formattedJson;
                        content.className = '';
                    } catch (e) {
                        content.textContent = jsonString;
                        content.className = '';
                    }
                    overlay.style.display = 'flex';
                    (overlay as HTMLElement).dataset.jsonString = jsonString;
                }
            };
            
            const copyJsonToClipboard = async function() {
                const overlay = document.getElementById('exportJsonOverlay') as HTMLElement;
                const jsonString = overlay?.dataset.jsonString;
                if (jsonString) {
                    await (window.navigator.clipboard as any).writeText(jsonString);
                }
            };
            
            const testJson = '{"test": "data"}';
            
            showExportOverlay(testJson);
            const overlay = document.getElementById('exportJsonOverlay') as HTMLElement;
            expect(overlay?.dataset.jsonString).toBe(testJson);
            
            await copyJsonToClipboard();
            expect(mockNavigatorClipboard.writeText).toHaveBeenCalledWith(testJson);
        });
    });
});


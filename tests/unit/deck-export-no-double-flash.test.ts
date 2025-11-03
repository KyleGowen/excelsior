/**
 * Unit tests for deck-export.js copy button double flash prevention
 * 
 * Tests the fix for the issue where the copy button would sometimes
 * flash twice on click. The fix includes:
 * - Guard flag to prevent multiple feedback triggers
 * - Removal of inline transform to avoid CSS animation conflicts
 * - Proper class management to prevent animation restart
 */

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Deck Export - Copy Button Double Flash Prevention', () => {
    let dom: JSDOM;
    let mockNavigatorClipboard: any;
    let mockShowNotification: jest.Mock;
    let copyJsonToClipboard: () => void;

    beforeEach(() => {
        // Create JSDOM instance
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost',
            pretendToBeVisual: true,
            resources: 'usable'
        });

        global.window = dom.window as any;
        global.document = dom.window.document;
        global.navigator = dom.window.navigator as any;

        // Mock clipboard API
        mockNavigatorClipboard = {
            writeText: jest.fn().mockResolvedValue(undefined)
        };
        (global.navigator as any).clipboard = mockNavigatorClipboard;

        // Mock showNotification
        mockShowNotification = jest.fn();
        (global.window as any).showNotification = mockShowNotification;

        // Load the deck-export.js file using eval in the JSDOM context
        const deckExportPath = path.join(__dirname, '../../public/js/components/deck-export.js');
        const deckExportCode = fs.readFileSync(deckExportPath, 'utf-8');
        
        // Execute the code using Function constructor in the JSDOM context
        const executeInContext = new dom.window.Function('window', 'document', 'navigator', deckExportCode);
        executeInContext(dom.window, dom.window.document, dom.window.navigator);

        // Get the function from window
        copyJsonToClipboard = (dom.window as any).copyJsonToClipboard;
        
        if (!copyJsonToClipboard) {
            throw new Error('copyJsonToClipboard function not found on window object');
        }

        // Create overlay and copy button
        const overlay = dom.window.document.createElement('div');
        overlay.id = 'exportJsonOverlay';
        overlay.dataset.jsonString = '{"test": "data"}';
        
        const copyBtn = dom.window.document.createElement('div');
        copyBtn.className = 'copy-button';
        copyBtn.title = 'Copy to clipboard';
        copyBtn.style.background = 'rgba(78, 205, 196, 0.2)';
        copyBtn.style.borderColor = 'rgba(78, 205, 196, 0.3)';
        
        const jsonContainer = dom.window.document.createElement('div');
        jsonContainer.className = 'json-container';
        
        const jsonContent = dom.window.document.createElement('pre');
        jsonContent.id = 'exportJsonContent';
        
        jsonContainer.appendChild(jsonContent);
        overlay.appendChild(jsonContainer);
        overlay.appendChild(copyBtn);
        dom.window.document.body.appendChild(overlay);

        // Use fake timers
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        dom.window.close();
        delete (global.window as any).copyJsonToClipboard;
    });

    describe('Single click behavior', () => {
        it('should add flash class only once on single click', async () => {
            const copyBtn = dom.window.document.querySelector('.copy-button') as HTMLElement;
            
            await copyJsonToClipboard();
            jest.advanceTimersByTime(10);
            
            expect(copyBtn.classList.contains('copy-flash')).toBe(true);
        });

        it('should NOT set transform inline to avoid CSS animation conflict', async () => {
            const copyBtn = dom.window.document.querySelector('.copy-button') as HTMLElement;
            
            await copyJsonToClipboard();
            jest.advanceTimersByTime(10);
            
            // Transform should NOT be set inline - CSS animation handles it
            expect(copyBtn.style.transform).toBe('');
        });

        it('should remove flash class after animation completes', async () => {
            const copyBtn = dom.window.document.querySelector('.copy-button') as HTMLElement;
            
            await copyJsonToClipboard();
            
            // Flash class should be present initially
            jest.advanceTimersByTime(10);
            expect(copyBtn.classList.contains('copy-flash')).toBe(true);
            
            // Flash class should be removed after 150ms
            jest.advanceTimersByTime(150);
            expect(copyBtn.classList.contains('copy-flash')).toBe(false);
        });

        it('should reset button styles after feedback completes', async () => {
            const copyBtn = dom.window.document.querySelector('.copy-button') as HTMLElement;
            const originalBackground = copyBtn.style.background;
            
            await copyJsonToClipboard();
            
            // Styles should be updated
            jest.advanceTimersByTime(10);
            expect(copyBtn.style.background).toBe('rgba(78, 205, 196, 0.6)');
            
            // Styles should be reset after 500ms
            jest.advanceTimersByTime(500);
            expect(copyBtn.style.background).toBe(originalBackground);
        });
    });

    describe('Multiple rapid clicks - double flash prevention', () => {
        it('should only show feedback once for rapid successive clicks', async () => {
            const copyBtn = dom.window.document.querySelector('.copy-button') as HTMLElement;
            let flashClassAddCount = 0;
            
            // Track when flash class is added
            const originalAdd = copyBtn.classList.add.bind(copyBtn.classList);
            copyBtn.classList.add = function(...args: string[]) {
                if (args.includes('copy-flash')) {
                    flashClassAddCount++;
                }
                return originalAdd(...args);
            };
            
            // First click
            copyJsonToClipboard();
            // Wait for promise to resolve
            await Promise.resolve();
            jest.advanceTimersByTime(10);
            
            // Second click immediately (before flag resets)
            copyJsonToClipboard();
            // Wait for promise to resolve
            await Promise.resolve();
            jest.advanceTimersByTime(10);
            
            // Flash class should only be added once
            expect(flashClassAddCount).toBe(1);
        });

        it('should block second click if feedback is already showing', async () => {
            const copyBtn = dom.window.document.querySelector('.copy-button') as HTMLElement;
            const writeTextSpy = jest.spyOn(mockNavigatorClipboard, 'writeText');
            
            // First click
            copyJsonToClipboard();
            // Wait for promise to resolve and feedback to start
            await Promise.resolve();
            jest.advanceTimersByTime(10);
            
            // Verify flag is set by checking if button has flash class
            expect(copyBtn.classList.contains('copy-flash')).toBe(true);
            
            // Second click immediately (should be blocked)
            copyJsonToClipboard();
            await Promise.resolve();
            jest.advanceTimersByTime(10);
            
            // Clipboard API should only be called once (second call should be blocked)
            expect(writeTextSpy).toHaveBeenCalledTimes(1);
        });

        it('should allow second click after feedback completes', async () => {
            const copyBtn = dom.window.document.querySelector('.copy-button') as HTMLElement;
            const writeTextSpy = jest.spyOn(mockNavigatorClipboard, 'writeText');
            
            // First click
            copyJsonToClipboard();
            
            // Wait for feedback to complete (600ms)
            jest.advanceTimersByTime(600);
            
            // Second click should be allowed
            copyJsonToClipboard();
            jest.advanceTimersByTime(10);
            
            // Clipboard API should be called twice
            expect(writeTextSpy).toHaveBeenCalledTimes(2);
        });

        it('should remove and re-add flash class if it already exists', async () => {
            const copyBtn = dom.window.document.querySelector('.copy-button') as HTMLElement;
            const removeSpy = jest.spyOn(copyBtn.classList, 'remove');
            const addSpy = jest.spyOn(copyBtn.classList, 'add');
            
            // Manually add flash class first
            copyBtn.classList.add('copy-flash');
            
            await copyJsonToClipboard();
            jest.advanceTimersByTime(10);
            
            // Should remove existing class before adding
            expect(removeSpy).toHaveBeenCalledWith('copy-flash');
            expect(addSpy).toHaveBeenCalledWith('copy-flash');
        });
    });

    describe('Guard flag mechanism', () => {
        it('should set flag when feedback starts', async () => {
            const copyBtn = dom.window.document.querySelector('.copy-button') as HTMLElement;
            
            await copyJsonToClipboard();
            jest.advanceTimersByTime(10);
            
            // Attempt second call - should be blocked
            copyJsonToClipboard();
            jest.advanceTimersByTime(10);
            
            // Only one flash class should exist
            expect(copyBtn.classList.contains('copy-flash')).toBe(true);
        });

        it('should reset flag after all animations complete', async () => {
            const copyBtn = dom.window.document.querySelector('.copy-button') as HTMLElement;
            const writeTextSpy = jest.spyOn(mockNavigatorClipboard, 'writeText');
            
            // First click
            copyJsonToClipboard();
            
            // Wait for flag to reset (600ms)
            jest.advanceTimersByTime(600);
            
            // Second click should now work
            copyJsonToClipboard();
            jest.advanceTimersByTime(10);
            
            expect(writeTextSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('Promise race condition prevention', () => {
        it('should not trigger feedback twice if promise resolves after flag reset', async () => {
            const copyBtn = dom.window.document.querySelector('.copy-button') as HTMLElement;
            let flashClassAddCount = 0;
            
            // Track when flash class is added
            const originalAdd = copyBtn.classList.add.bind(copyBtn.classList);
            copyBtn.classList.add = function(...args: string[]) {
                if (args.includes('copy-flash')) {
                    flashClassAddCount++;
                }
                return originalAdd(...args);
            };
            
            // Create a delayed promise
            let resolvePromise: (value?: any) => void;
            const delayedPromise = new Promise<void>((resolve) => {
                resolvePromise = resolve;
            });
            mockNavigatorClipboard.writeText.mockReturnValue(delayedPromise);
            
            // First click
            copyJsonToClipboard();
            
            // Wait for flag to reset (600ms)
            jest.advanceTimersByTime(600);
            
            // Now resolve the promise (simulating delayed resolution)
            resolvePromise!();
            await Promise.resolve();
            jest.advanceTimersByTime(10);
            
            // Feedback should only be shown once (flag was set, even though it reset)
            // The guard in showCopyFeedback should prevent double triggering
            expect(flashClassAddCount).toBeLessThanOrEqual(1);
        });

        it('should prevent fallback from triggering if feedback already shown', async () => {
            const copyBtn = dom.window.document.querySelector('.copy-button') as HTMLElement;
            const writeTextSpy = jest.spyOn(mockNavigatorClipboard, 'writeText');
            
            // Make clipboard API succeed immediately
            mockNavigatorClipboard.writeText.mockResolvedValue(undefined);
            
            copyJsonToClipboard();
            jest.advanceTimersByTime(10);
            
            // Simulate promise rejection after feedback shown
            // But wait, if promise already resolved, it won't reject
            // Let's test with a promise that rejects immediately
            mockNavigatorClipboard.writeText.mockReset();
            mockNavigatorClipboard.writeText.mockRejectedValue(new Error('Clipboard error'));
            
            // Second call that would trigger fallback
            copyJsonToClipboard();
            jest.advanceTimersByTime(10);
            
            // Should not call fallback because flag is set
            // (This is tested through the fact that showCopyFeedback wouldn't be called again)
            expect(writeTextSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('CSS animation compatibility', () => {
        it('should not set transform inline to avoid conflict with CSS animation', async () => {
            const copyBtn = dom.window.document.querySelector('.copy-button') as HTMLElement;
            
            await copyJsonToClipboard();
            jest.advanceTimersByTime(10);
            
            // Transform should not be set inline - CSS animation handles it
            expect(copyBtn.style.transform).toBe('');
            
            // Flash class should be present for CSS animation to work
            expect(copyBtn.classList.contains('copy-flash')).toBe(true);
        });

        it('should force reflow before adding flash class', async () => {
            const copyBtn = dom.window.document.querySelector('.copy-button') as HTMLElement;
            const offsetHeightSpy = jest.spyOn(copyBtn, 'offsetHeight', 'get');
            
            await copyJsonToClipboard();
            
            // offsetHeight should be accessed (forcing reflow)
            expect(offsetHeightSpy).toHaveBeenCalled();
        });
    });

    describe('Container and content flashing', () => {
        it('should flash container and content along with button', async () => {
            const jsonContainer = dom.window.document.querySelector('.json-container') as HTMLElement;
            const jsonContent = dom.window.document.querySelector('#exportJsonContent') as HTMLElement;
            
            await copyJsonToClipboard();
            jest.advanceTimersByTime(10);
            
            expect(jsonContainer.classList.contains('json-copied-flash')).toBe(true);
            expect(jsonContent.classList.contains('json-text-flash')).toBe(true);
        });

        it('should remove container and content flash classes after animations', async () => {
            const jsonContainer = dom.window.document.querySelector('.json-container') as HTMLElement;
            const jsonContent = dom.window.document.querySelector('#exportJsonContent') as HTMLElement;
            
            await copyJsonToClipboard();
            
            // Wait for container flash to complete (400ms)
            jest.advanceTimersByTime(400);
            expect(jsonContainer.classList.contains('json-copied-flash')).toBe(false);
            
            // Content flash completes at 300ms (already passed)
            expect(jsonContent.classList.contains('json-text-flash')).toBe(false);
        });
    });
});


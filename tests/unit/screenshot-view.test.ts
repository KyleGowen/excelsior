/** @jest-environment jsdom */

/**
 * Screenshot View - Unit Tests
 *
 * Tests the screenshot content generation and drag-and-drop:
 * - generateScreenshotContent() builds HTML for deck screenshots
 * - setupScreenshotDragAndDrop() initializes drag-and-drop for reordering
 */

import fs from 'fs';
import path from 'path';

declare global {
    interface Window {
        generateScreenshotContent?: () => void;
        setupScreenshotDragAndDrop?: () => void;
        deckEditorCards?: any[];
        availableCardsMap?: Map<string, any>;
        getCardImagePath?: (card: any, type: string) => string;
        currentDeckData?: any;
    }
}

describe('Screenshot View', () => {
    let code: string;

    beforeEach(() => {
        const filePath = path.join(__dirname, '../../public/js/screenshot-view.js');
        code = fs.readFileSync(filePath, 'utf-8');

        // Stub globals
        window.deckEditorCards = [];
        window.availableCardsMap = new Map();
        window.getCardImagePath = jest.fn().mockReturnValue('/test.png');
        window.currentDeckData = { metadata: { deck_name: 'Test Deck' } };

        new Function(code)();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('Module Loading', () => {
        it('should export generateScreenshotContent to window', () => {
            expect(typeof window.generateScreenshotContent).toBe('function');
        });

        it('should export setupScreenshotDragAndDrop to window', () => {
            expect(typeof window.setupScreenshotDragAndDrop).toBe('function');
        });
    });

    describe('generateScreenshotContent', () => {
        it('should not throw with empty deck', () => {
            document.body.innerHTML = '<div id="screenshotContent"></div>';
            window.deckEditorCards = [];
            expect(() => window.generateScreenshotContent!()).not.toThrow();
        });
    });
});

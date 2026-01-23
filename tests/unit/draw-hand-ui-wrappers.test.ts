/** @jest-environment jsdom */

/**
 * Draw Hand UI Wrappers - Unit Tests
 * 
 * Tests the wrapper functions in ui-utility-functions.js that delegate
 * to the Draw Hand module:
 * - toggleDrawHand()
 * - closeDrawHand()
 */

import fs from 'fs';
import path from 'path';

// Extend Window interface for test globals
declare global {
    interface Window {
        DrawHand?: {
            init: () => void;
            refresh: () => void;
            displayDrawnCards: (cards: any[]) => void;
            toggle: () => void;
            close: () => void;
        };
    }
}

describe('Draw Hand UI Wrappers', () => {
    let uiUtilityFunctionsCode: string;
    let drawHandCode: string;

    beforeEach(() => {
        // Load the actual files
        const uiUtilityPath = path.join(__dirname, '../../public/js/ui-utility-functions.js');
        uiUtilityFunctionsCode = fs.readFileSync(uiUtilityPath, 'utf-8');

        const drawHandPath = path.join(__dirname, '../../public/js/components/draw-hand.js');
        drawHandCode = fs.readFileSync(drawHandPath, 'utf-8');

        // Execute modules
        new Function(drawHandCode)();
        new Function(uiUtilityFunctionsCode)();

        // Setup console.warn spy
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
        delete (window as any).DrawHand;
        delete (window as any).toggleDrawHand;
        delete (window as any).closeDrawHand;
    });

    describe('toggleDrawHand()', () => {
        it('should call DrawHand.toggle() when module is available', () => {
            const mockToggle = jest.fn();
            (window as any).DrawHand = {
                toggle: mockToggle
            };

            // Execute the function
            (window as any).toggleDrawHand();

            expect(mockToggle).toHaveBeenCalledTimes(1);
        });

        it('should log warning when DrawHand module is not available', () => {
            delete (window as any).DrawHand;

            // Execute the function
            (window as any).toggleDrawHand();

            expect(console.warn).toHaveBeenCalledWith('Draw Hand module not loaded');
        });

        it('should handle missing toggle method gracefully', () => {
            (window as any).DrawHand = {};

            expect(() => {
                (window as any).toggleDrawHand();
            }).not.toThrow();
        });
    });

    describe('closeDrawHand()', () => {
        it('should call DrawHand.close() when module is available', () => {
            const mockClose = jest.fn();
            (window as any).DrawHand = {
                close: mockClose
            };

            // Execute the function
            (window as any).closeDrawHand();

            expect(mockClose).toHaveBeenCalledTimes(1);
        });

        it('should log warning when DrawHand module is not available', () => {
            delete (window as any).DrawHand;

            // Execute the function
            (window as any).closeDrawHand();

            expect(console.warn).toHaveBeenCalledWith('Draw Hand module not loaded');
        });

        it('should handle missing close method gracefully', () => {
            (window as any).DrawHand = {};

            expect(() => {
                (window as any).closeDrawHand();
            }).not.toThrow();
        });
    });

    describe('Integration with Draw Hand Module', () => {
        beforeEach(() => {
            // Setup DOM elements
            const drawHandSection = document.createElement('div');
            drawHandSection.id = 'drawHandSection';
            drawHandSection.style.display = 'none';
            document.body.appendChild(drawHandSection);

            const drawHandBtn = document.createElement('button');
            drawHandBtn.id = 'drawHandBtn';
            drawHandBtn.textContent = 'Draw Hand';
            document.body.appendChild(drawHandBtn);

            const drawHandContent = document.createElement('div');
            drawHandContent.id = 'drawHandContent';
            drawHandSection.appendChild(drawHandContent);

            // Setup deck cards
            (window as any).deckEditorCards = Array.from({ length: 10 }, (_, i) => ({
                type: 'power',
                cardId: `power-${i}`,
                quantity: 1
            }));

            (window as any).availableCardsMap = new Map();
            (window as any).getCardImagePath = jest.fn(() => '/path/to/image.webp');
        });

        afterEach(() => {
            document.body.innerHTML = '';
            delete (window as any).deckEditorCards;
            delete (window as any).availableCardsMap;
            delete (window as any).getCardImagePath;
        });

        it('should work end-to-end with actual module', () => {
            // toggleDrawHand should work with real module
            (window as any).toggleDrawHand();

            const drawHandSection = document.getElementById('drawHandSection');
            expect(drawHandSection?.style.display).toBe('block');
        });

        it('should close pane with real module', () => {
            const drawHandSection = document.getElementById('drawHandSection') as HTMLElement;
            drawHandSection.style.display = 'block';

            (window as any).closeDrawHand();

            expect(drawHandSection.style.display).toBe('none');
        });
    });
});


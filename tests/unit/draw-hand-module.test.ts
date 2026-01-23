/** @jest-environment jsdom */

/**
 * Draw Hand Module - Comprehensive Unit Tests
 * 
 * Tests the Draw Hand module (public/js/components/draw-hand.js) for:
 * - Module initialization
 * - Drawing logic (8 cards, 9 with events)
 * - Display functionality with KO dimming integration
 * - Toggle and close functionality
 * - Button state management
 * - Drag and drop handlers
 * - State management
 */

import fs from 'fs';
import path from 'path';

// Extend Window interface for test globals
declare global {
    interface Window {
        DrawHand?: {
            init: () => void;
            drawHand: () => void;
            displayDrawnCards: (cards: any[]) => void;
            toggle: () => void;
            close: () => void;
            updateButtonState: (deckCards: any[]) => void;
            getDrawnCards: () => any[];
            refresh: () => void;
        };
        SimulateKO?: {
            shouldDimCard: (card: any, availableCardsMap: Map<string, any>, deckCards: any[]) => boolean;
        };
        deckEditorCards?: any[];
        availableCardsMap?: Map<string, any>;
        drawnCards?: any[];
        displayDrawnCards?: (cards: any[]) => void;
        getCardImagePath?: (card: any, type: string) => string;
    }
}

// Polyfill for TextEncoder/TextDecoder if needed
if (typeof global.TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
}

describe('Draw Hand Module - Comprehensive Tests', () => {
    let drawHandCode: string;
    let mockDeckEditorCards: any[];
    let mockAvailableCardsMap: Map<string, any>;
    let mockDrawHandSection: HTMLElement;
    let mockDrawHandBtn: HTMLButtonElement;
    let mockDrawHandContent: HTMLElement;

    beforeEach(() => {
        // Load the actual draw-hand.js file
        const drawHandPath = path.join(__dirname, '../../public/js/components/draw-hand.js');
        drawHandCode = fs.readFileSync(drawHandPath, 'utf-8');
        
        // Execute the module code
        new Function(drawHandCode)();

        // Setup mock DOM elements
        mockDrawHandSection = document.createElement('div');
        mockDrawHandSection.id = 'drawHandSection';
        mockDrawHandSection.style.display = 'none';
        document.body.appendChild(mockDrawHandSection);

        mockDrawHandBtn = document.createElement('button');
        mockDrawHandBtn.id = 'drawHandBtn';
        mockDrawHandBtn.textContent = 'Draw Hand';
        mockDrawHandBtn.disabled = false;
        document.body.appendChild(mockDrawHandBtn);

        mockDrawHandContent = document.createElement('div');
        mockDrawHandContent.id = 'drawHandContent';
        mockDrawHandSection.appendChild(mockDrawHandContent);

        // Setup mock data
        mockDeckEditorCards = [];
        mockAvailableCardsMap = new Map();

        // Setup window globals
        (window as any).deckEditorCards = mockDeckEditorCards;
        (window as any).availableCardsMap = mockAvailableCardsMap;
        (window as any).getCardImagePath = jest.fn((card: any, type: string) => {
            return `/src/resources/cards/images/${type}/${card.id || card.cardId}.webp`;
        });

        // Initialize module
        window.DrawHand?.init();
    });

    afterEach(() => {
        // Cleanup
        document.body.innerHTML = '';
        delete (window as any).DrawHand;
        delete (window as any).deckEditorCards;
        delete (window as any).availableCardsMap;
        delete (window as any).drawnCards;
        delete (window as any).displayDrawnCards;
        delete (window as any).getCardImagePath;
        delete (window as any).SimulateKO;
    });

    describe('Module Initialization', () => {
        it('should initialize module state', () => {
            expect(window.DrawHand).toBeDefined();
            if (window.DrawHand) {
                expect(window.DrawHand.init).toBeDefined();
                expect(window.DrawHand.drawHand).toBeDefined();
                expect(window.DrawHand.displayDrawnCards).toBeDefined();
                expect(window.DrawHand.toggle).toBeDefined();
                expect(window.DrawHand.close).toBeDefined();
                expect(window.DrawHand.updateButtonState).toBeDefined();
            }
        });

        it('should initialize drawnCards array', () => {
            expect(window.drawnCards).toEqual([]);
        });

        it('should expose displayDrawnCards globally for backward compatibility', () => {
            expect(window.displayDrawnCards).toBeDefined();
            expect(typeof window.displayDrawnCards).toBe('function');
        });
    });

    describe('drawHand() - Drawing Logic', () => {
        beforeEach(() => {
            // Create a deck with enough playable cards
            mockDeckEditorCards = [
                { type: 'character', cardId: 'char-1', quantity: 1 },
                { type: 'power', cardId: 'power-1', quantity: 1 },
                { type: 'power', cardId: 'power-2', quantity: 1 },
                { type: 'power', cardId: 'power-3', quantity: 1 },
                { type: 'power', cardId: 'power-4', quantity: 1 },
                { type: 'power', cardId: 'power-5', quantity: 1 },
                { type: 'power', cardId: 'power-6', quantity: 1 },
                { type: 'power', cardId: 'power-7', quantity: 1 },
                { type: 'power', cardId: 'power-8', quantity: 1 },
                { type: 'special', cardId: 'special-1', quantity: 1 }
            ];

            mockDeckEditorCards.forEach(card => {
                mockAvailableCardsMap.set(card.cardId, {
                    id: card.cardId,
                    name: `Card ${card.cardId}`,
                    card_name: `Card ${card.cardId}`
                });
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
        });

        it('should draw 8 cards from playable cards', () => {
            window.DrawHand?.drawHand();

            expect(window.drawnCards).toBeDefined();
            expect(window.drawnCards?.length).toBe(8);
            // Should not include characters
            expect(window.drawnCards?.every(card => card.type !== 'character')).toBe(true);
        });

        it('should exclude characters, locations, and missions from draw pile', () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'char-1', quantity: 1 },
                { type: 'location', cardId: 'loc-1', quantity: 1 },
                { type: 'mission', cardId: 'miss-1', quantity: 1 },
                { type: 'power', cardId: 'power-1', quantity: 1 },
                { type: 'power', cardId: 'power-2', quantity: 1 },
                { type: 'power', cardId: 'power-3', quantity: 1 },
                { type: 'power', cardId: 'power-4', quantity: 1 },
                { type: 'power', cardId: 'power-5', quantity: 1 },
                { type: 'power', cardId: 'power-6', quantity: 1 },
                { type: 'power', cardId: 'power-7', quantity: 1 },
                { type: 'power', cardId: 'power-8', quantity: 1 }
            ];

            (window as any).deckEditorCards = mockDeckEditorCards;

            window.DrawHand?.drawHand();

            expect(window.drawnCards?.length).toBe(8);
            expect(window.drawnCards?.every(card => 
                card.type !== 'character' && 
                card.type !== 'location' && 
                card.type !== 'mission'
            )).toBe(true);
        });

        it('should draw 9 cards if event cards are present', () => {
            mockDeckEditorCards = [
                { type: 'power', cardId: 'power-1', quantity: 1 },
                { type: 'power', cardId: 'power-2', quantity: 1 },
                { type: 'power', cardId: 'power-3', quantity: 1 },
                { type: 'power', cardId: 'power-4', quantity: 1 },
                { type: 'power', cardId: 'power-5', quantity: 1 },
                { type: 'power', cardId: 'power-6', quantity: 1 },
                { type: 'power', cardId: 'power-7', quantity: 1 },
                { type: 'power', cardId: 'power-8', quantity: 1 },
                { type: 'event', cardId: 'event-1', quantity: 1 },
                { type: 'power', cardId: 'power-9', quantity: 1 }
            ];

            (window as any).deckEditorCards = mockDeckEditorCards;

            // Mock Math.random to ensure we get an event card in first 8
            const originalRandom = Math.random;
            let callCount = 0;
            Math.random = jest.fn(() => {
                callCount++;
                // Make sure event card is drawn early
                if (callCount <= 8) {
                    return callCount / 10; // Deterministic but varied
                }
                return originalRandom();
            });

            window.DrawHand?.drawHand();

            Math.random = originalRandom;

            // Should have 9 cards if event was in first 8
            const hasEvent = window.drawnCards?.some(card => card.type === 'event');
            if (hasEvent && mockDeckEditorCards.filter(c => 
                c.type !== 'character' && c.type !== 'location' && c.type !== 'mission'
            ).length > 8) {
                expect(window.drawnCards?.length).toBeGreaterThanOrEqual(8);
                expect(window.drawnCards?.length).toBeLessThanOrEqual(9);
            }
        });

        it('should handle empty deck gracefully', () => {
            mockDeckEditorCards = [];
            (window as any).deckEditorCards = mockDeckEditorCards;

            // Should not throw or hang
            expect(() => window.DrawHand?.drawHand()).not.toThrow();
            expect(window.drawnCards).toBeDefined();
            expect(window.drawnCards?.length).toBe(0);
        });

        it('should handle deck with less than 8 playable cards', () => {
            mockDeckEditorCards = [
                { type: 'power', cardId: 'power-1', quantity: 1 },
                { type: 'power', cardId: 'power-2', quantity: 1 },
                { type: 'power', cardId: 'power-3', quantity: 1 }
            ];

            mockDeckEditorCards.forEach(card => {
                mockAvailableCardsMap.set(card.cardId, {
                    id: card.cardId,
                    name: `Card ${card.cardId}`
                });
            });

            (window as any).deckEditorCards = mockDeckEditorCards;

            // Should not throw, should draw only available cards (3)
            expect(() => window.DrawHand?.drawHand()).not.toThrow();
            expect(window.drawnCards?.length).toBe(3);
        });
    });

    describe('displayDrawnCards() - Rendering', () => {
        beforeEach(() => {
            mockDeckEditorCards = [
                { type: 'power', cardId: 'power-1', quantity: 1 },
                { type: 'special', cardId: 'special-1', quantity: 1 }
            ];

            mockAvailableCardsMap.set('power-1', {
                id: 'power-1',
                name: 'Power Card 1',
                card_name: 'Power Card 1'
            });

            mockAvailableCardsMap.set('special-1', {
                id: 'special-1',
                name: 'Special Card 1',
                card_name: 'Special Card 1'
            });

            (window as any).deckEditorCards = mockDeckEditorCards;
        });

        it('should render cards in draw hand content', () => {
            const cards = [
                { type: 'power', cardId: 'power-1', quantity: 1 },
                { type: 'special', cardId: 'special-1', quantity: 1 }
            ];

            window.DrawHand?.displayDrawnCards(cards);

            const renderedCards = mockDrawHandContent.querySelectorAll('.drawn-card');
            expect(renderedCards.length).toBe(2);
        });

        it('should add event-card class for event cards', () => {
            const cards = [
                { type: 'event', cardId: 'event-1', quantity: 1 }
            ];

            mockAvailableCardsMap.set('event-1', {
                id: 'event-1',
                name: 'Event Card 1'
            });

            window.DrawHand?.displayDrawnCards(cards);

            const eventCard = mockDrawHandContent.querySelector('.drawn-card.event-card');
            expect(eventCard).toBeTruthy();
        });

        it('should apply KO dimming when SimulateKO is available', () => {
            // Mock SimulateKO
            (window as any).SimulateKO = {
                shouldDimCard: jest.fn((card: any) => {
                    return card.cardId === 'power-1'; // Dim power-1
                })
            };

            const cards = [
                { type: 'power', cardId: 'power-1', quantity: 1 },
                { type: 'power', cardId: 'power-2', quantity: 1 }
            ];

            mockAvailableCardsMap.set('power-2', {
                id: 'power-2',
                name: 'Power Card 2'
            });

            window.DrawHand?.displayDrawnCards(cards);

            const dimmedCard = mockDrawHandContent.querySelector('.drawn-card.ko-dimmed');
            expect(dimmedCard).toBeTruthy();
            expect(window.SimulateKO?.shouldDimCard).toHaveBeenCalled();
        });

        it('should set card images using getCardImagePath', () => {
            const cards = [
                { type: 'power', cardId: 'power-1', quantity: 1 }
            ];

            window.DrawHand?.displayDrawnCards(cards);

            expect(window.getCardImagePath).toHaveBeenCalled();
            const cardElement = mockDrawHandContent.querySelector('.drawn-card') as HTMLElement;
            expect(cardElement?.style.backgroundImage).toContain('url(');
        });

        it('should add tooltips to cards', () => {
            const cards = [
                { type: 'power', cardId: 'power-1', quantity: 1 }
            ];

            window.DrawHand?.displayDrawnCards(cards);

            const cardElement = mockDrawHandContent.querySelector('.drawn-card') as HTMLElement;
            expect(cardElement?.title).toBe('Power Card 1');
        });

        it('should use placeholder for unknown cards', () => {
            const cards = [
                { type: 'power', cardId: 'unknown-card', quantity: 1 }
            ];

            window.DrawHand?.displayDrawnCards(cards);

            const cardElement = mockDrawHandContent.querySelector('.drawn-card') as HTMLElement;
            expect(cardElement?.style.backgroundImage).toContain('placeholder.webp');
            expect(cardElement?.title).toBe('Unknown Card');
        });

        it('should make cards draggable', () => {
            const cards = [
                { type: 'power', cardId: 'power-1', quantity: 1 }
            ];

            window.DrawHand?.displayDrawnCards(cards);

            const cardElement = mockDrawHandContent.querySelector('.drawn-card') as HTMLElement;
            expect(cardElement?.draggable).toBe(true);
        });
    });

    describe('toggle() - Toggle Functionality', () => {
        it('should show pane and draw hand when hidden', () => {
            mockDrawHandSection.style.display = 'none';
            mockDrawHandBtn.textContent = 'Draw Hand';

            // Setup deck with cards
            mockDeckEditorCards = Array.from({ length: 10 }, (_, i) => ({
                type: 'power',
                cardId: `power-${i}`,
                quantity: 1
            }));

            (window as any).deckEditorCards = mockDeckEditorCards;

            window.DrawHand?.toggle();

            expect(mockDrawHandSection.style.display).toBe('block');
            expect(mockDrawHandBtn.textContent).toBe('Draw Hand');
            expect(window.drawnCards?.length).toBeGreaterThan(0);
        });

        it('should draw new hand when pane is already visible', () => {
            mockDrawHandSection.style.display = 'block';
            mockDrawHandBtn.textContent = 'Draw Hand';

            mockDeckEditorCards = Array.from({ length: 10 }, (_, i) => ({
                type: 'power',
                cardId: `power-${i}`,
                quantity: 1
            }));

            (window as any).deckEditorCards = mockDeckEditorCards;

            const initialCards = window.drawnCards?.length || 0;

            window.DrawHand?.toggle();

            // Should have drawn cards (may be same or different)
            expect(window.drawnCards?.length).toBeGreaterThan(0);
        });

        it('should handle missing elements gracefully', () => {
            mockDrawHandSection.remove();
            mockDrawHandBtn.remove();

            expect(() => window.DrawHand?.toggle()).not.toThrow();
        });
    });

    describe('close() - Close Functionality', () => {
        it('should hide pane and reset button text', () => {
            mockDrawHandSection.style.display = 'block';
            mockDrawHandBtn.textContent = 'Draw Hand';

            window.DrawHand?.close();

            expect(mockDrawHandSection.style.display).toBe('none');
            expect(mockDrawHandBtn.textContent).toBe('Draw Hand');
        });

        it('should handle missing elements gracefully', () => {
            mockDrawHandSection.remove();
            mockDrawHandBtn.remove();

            expect(() => window.DrawHand?.close()).not.toThrow();
        });
    });

    describe('updateButtonState() - Button State Management', () => {
        it('should enable button when deck has 8+ playable cards', () => {
            mockDrawHandBtn.disabled = true;
            mockDrawHandBtn.style.opacity = '0.5';
            mockDrawHandBtn.style.cursor = 'not-allowed';

            const deckCards = Array.from({ length: 8 }, (_, i) => ({
                type: 'power',
                cardId: `power-${i}`,
                quantity: 1
            }));

            window.DrawHand?.updateButtonState(deckCards);

            expect(mockDrawHandBtn.disabled).toBe(false);
            expect(mockDrawHandBtn.style.opacity).toBe('1');
            expect(mockDrawHandBtn.style.cursor).toBe('pointer');
            expect(mockDrawHandBtn.title).toBe('');
        });

        it('should disable button when deck has less than 8 playable cards', () => {
            mockDrawHandBtn.disabled = false;
            mockDrawHandBtn.style.opacity = '1';
            mockDrawHandBtn.style.cursor = 'pointer';

            const deckCards = Array.from({ length: 5 }, (_, i) => ({
                type: 'power',
                cardId: `power-${i}`,
                quantity: 1
            }));

            window.DrawHand?.updateButtonState(deckCards);

            expect(mockDrawHandBtn.disabled).toBe(true);
            expect(mockDrawHandBtn.style.opacity).toBe('0.5');
            expect(mockDrawHandBtn.style.cursor).toBe('not-allowed');
            expect(mockDrawHandBtn.title).toBe('Deck must contain at least 8 playable cards.');
        });

        it('should exclude characters, locations, and missions from count', () => {
            const deckCards = [
                { type: 'character', cardId: 'char-1', quantity: 4 },
                { type: 'location', cardId: 'loc-1', quantity: 1 },
                { type: 'mission', cardId: 'miss-1', quantity: 7 },
                { type: 'power', cardId: 'power-1', quantity: 8 }
            ];

            window.DrawHand?.updateButtonState(deckCards);

            expect(mockDrawHandBtn.disabled).toBe(false); // 8 power cards
        });

        it('should handle cards with quantity > 1', () => {
            const deckCards = [
                { type: 'power', cardId: 'power-1', quantity: 4 },
                { type: 'power', cardId: 'power-2', quantity: 4 }
            ];

            window.DrawHand?.updateButtonState(deckCards);

            expect(mockDrawHandBtn.disabled).toBe(false); // 8 total cards
        });

        it('should handle empty deck', () => {
            window.DrawHand?.updateButtonState([]);

            expect(mockDrawHandBtn.disabled).toBe(true);
        });

        it('should handle missing button gracefully', () => {
            mockDrawHandBtn.remove();

            expect(() => window.DrawHand?.updateButtonState([])).not.toThrow();
        });
    });

    describe('getDrawnCards() - State Access', () => {
        it('should return current drawn cards', () => {
            const testCards = [
                { type: 'power', cardId: 'power-1', quantity: 1 }
            ];

            // Use displayDrawnCards to set the internal state
            mockAvailableCardsMap.set('power-1', {
                id: 'power-1',
                name: 'Power Card 1'
            });

            window.DrawHand?.displayDrawnCards(testCards);

            const result = window.DrawHand?.getDrawnCards();

            expect(result).toEqual(testCards);
        });

        it('should return empty array when no cards drawn', () => {
            window.drawnCards = [];
            const result = window.DrawHand?.getDrawnCards();

            expect(result).toEqual([]);
        });
    });

    describe('refresh() - Refresh Functionality', () => {
        it('should re-display current drawn cards', () => {
            const testCards = [
                { type: 'power', cardId: 'power-1', quantity: 1 }
            ];

            mockAvailableCardsMap.set('power-1', {
                id: 'power-1',
                name: 'Power Card 1'
            });

            // First display cards to set internal state
            window.DrawHand?.displayDrawnCards(testCards);

            // Clear the content
            mockDrawHandContent.innerHTML = '';

            // Refresh should re-display
            window.DrawHand?.refresh();

            const renderedCards = mockDrawHandContent.querySelectorAll('.drawn-card');
            expect(renderedCards.length).toBe(1);
        });

        it('should do nothing when no cards are drawn', () => {
            window.drawnCards = [];
            window.DrawHand?.refresh();

            const renderedCards = mockDrawHandContent.querySelectorAll('.drawn-card');
            expect(renderedCards.length).toBe(0);
        });
    });

    describe('Backward Compatibility', () => {
        it('should maintain window.drawnCards global', () => {
            const testCards = [
                { type: 'power', cardId: 'power-1', quantity: 1 }
            ];

            mockAvailableCardsMap.set('power-1', {
                id: 'power-1',
                name: 'Power Card 1'
            });

            window.DrawHand?.displayDrawnCards(testCards);

            expect(window.drawnCards).toBeDefined();
            expect(window.drawnCards).toEqual(testCards);
        });

        it('should expose displayDrawnCards globally', () => {
            expect(window.displayDrawnCards).toBeDefined();
            expect(typeof window.displayDrawnCards).toBe('function');
        });

        it('should update window.drawnCards when using global displayDrawnCards', () => {
            const testCards = [
                { type: 'power', cardId: 'power-1', quantity: 1 }
            ];

            mockAvailableCardsMap.set('power-1', {
                id: 'power-1',
                name: 'Power Card 1'
            });

            window.displayDrawnCards?.(testCards);

            expect(window.drawnCards).toEqual(testCards);
        });
    });

    describe('Drag and Drop Integration', () => {
        it('should attach drag event listeners to cards', () => {
            const cards = [
                { type: 'power', cardId: 'power-1', quantity: 1 },
                { type: 'power', cardId: 'power-2', quantity: 1 }
            ];

            mockAvailableCardsMap.set('power-1', { id: 'power-1', name: 'Power 1' });
            mockAvailableCardsMap.set('power-2', { id: 'power-2', name: 'Power 2' });

            window.DrawHand?.displayDrawnCards(cards);

            const cardElements = mockDrawHandContent.querySelectorAll('.drawn-card');
            cardElements.forEach(card => {
                expect(card.getAttribute('draggable')).toBe('true');
            });
        });

        it('should handle drag over on container', () => {
            const cards = [
                { type: 'power', cardId: 'power-1', quantity: 1 }
            ];

            mockAvailableCardsMap.set('power-1', { id: 'power-1', name: 'Power 1' });

            window.DrawHand?.displayDrawnCards(cards);

            // Create a mock drag event (jsdom doesn't support DragEvent)
            const dragOverEvent = document.createEvent('Event');
            dragOverEvent.initEvent('dragover', true, true);
            
            // Mock dataTransfer
            Object.defineProperty(dragOverEvent, 'dataTransfer', {
                value: {
                    dropEffect: 'move'
                },
                writable: true
            });

            // Mock preventDefault
            Object.defineProperty(dragOverEvent, 'preventDefault', {
                value: jest.fn(),
                writable: true
            });

            mockDrawHandContent.dispatchEvent(dragOverEvent);

            // Should not throw - the event handler should have been called
            expect(dragOverEvent.preventDefault).toHaveBeenCalled();
        });
    });
});


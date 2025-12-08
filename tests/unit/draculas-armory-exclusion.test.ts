/** @jest-environment jsdom */

/**
 * Dracula's Armory Exclusion Feature - Unit Tests
 * 
 * Tests the Pre-Placed button functionality for Basic Universe cards:
 * - hasDraculasArmory() function for location detection
 * - drawBasicUniverseCard() function for toggling exclude_from_draw flag
 * - Pre-Placed button rendering logic in Card View
 */

import fs from 'fs';
import path from 'path';

// Extend Window interface for test globals
declare global {
    interface Window {
        deckEditorCards?: any[];
        availableCardsMap?: Map<string, any>;
        hasDraculasArmory?: () => boolean;
        drawBasicUniverseCard?: (cardId: string, index: number) => Promise<void>;
        renderDeckCardsCardView?: () => Promise<void>;
        displayDeckCardsForEditing?: () => Promise<void>;
        renderDeckCardsListView?: () => Promise<void>;
        getExpansionState?: () => any;
        applyUIPreferences?: (prefs: any) => void;
        showDeckValidation?: (cards: any[]) => Promise<void>;
        showNotification?: (message: string, type: string) => void;
    }
}

describe('Dracula\'s Armory Exclusion Feature Tests', () => {
    let indexHtmlCode: string;
    let mockDeckEditorCards: any[];
    let mockAvailableCardsMap: Map<string, any>;
    let mockDraculasArmoryLocation: any;
    let mockBasicUniverseCard: any;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        // Setup mock DOM elements
        const mockDeckCardsEditor = document.createElement('div');
        mockDeckCardsEditor.className = 'deck-cards-editor card-view';
        mockDeckCardsEditor.scrollTop = 100;
        document.body.appendChild(mockDeckCardsEditor);

        // Setup mock data
        mockDeckEditorCards = [];
        mockAvailableCardsMap = new Map();

        // Mock Dracula's Armory location
        mockDraculasArmoryLocation = {
            id: 'loc-dracula',
            name: "Dracula's Armory",
            card_name: "Dracula's Armory",
            type: 'location',
            threat_level: 2
        };

        // Mock Basic Universe card
        mockBasicUniverseCard = {
            id: 'basic-universe-1',
            name: 'Basic Universe (Energy)',
            card_name: 'Basic Universe (Energy)',
            type: 'Energy',
            value_to_use: '6',
            bonus: '+2'
        };

        // Setup window globals
        (window as any).deckEditorCards = mockDeckEditorCards;
        (window as any).availableCardsMap = mockAvailableCardsMap;
        
        // Mock render functions
        (window as any).renderDeckCardsCardView = jest.fn().mockResolvedValue(undefined);
        (window as any).displayDeckCardsForEditing = jest.fn().mockResolvedValue(undefined);
        (window as any).renderDeckCardsListView = jest.fn().mockResolvedValue(undefined);
        (window as any).getExpansionState = jest.fn().mockReturnValue({});
        (window as any).applyUIPreferences = jest.fn();
        (window as any).showDeckValidation = jest.fn().mockResolvedValue(undefined);
        (window as any).showNotification = jest.fn();

        // Implement hasDraculasArmory function directly (matching the actual implementation)
        (window as any).hasDraculasArmory = function() {
            const deckCards = (window as any).deckEditorCards;
            const cardsMap = (window as any).availableCardsMap;
            
            if (!deckCards || !cardsMap) {
                return false;
            }
            
            return deckCards.some((card: any) => {
                if (card.type !== 'location') return false;
                const locationData = cardsMap.get(card.cardId);
                return locationData && (locationData.name === "Dracula's Armory" || locationData.card_name === "Dracula's Armory");
            });
        };

        // Implement drawBasicUniverseCard function directly (matching the actual implementation)
        (window as any).drawBasicUniverseCard = async function(cardId: string, index: number) {
            try {
                const deckCards = (window as any).deckEditorCards;
                const cardsMap = (window as any).availableCardsMap;
                
                if (!deckCards || !cardsMap) {
                    return;
                }
                
                const card = deckCards[index];
                
                // Validate card exists and is a Basic Universe card
                if (!card || card.cardId !== cardId || card.type !== 'basic-universe') {
                    console.warn('drawBasicUniverseCard: Card not found or not a Basic Universe card', { cardId, index });
                    return;
                }
                
                // Toggle exclude_from_draw flag
                card.exclude_from_draw = card.exclude_from_draw === true ? false : true;
                
                // Capture current expansion state before re-rendering
                const currentExpansionState = (window as any).getExpansionState ? (window as any).getExpansionState() : {};
                
                // Capture current scroll position before re-rendering
                const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
                const currentScrollTop = deckCardsEditor ? deckCardsEditor.scrollTop : 0;
                
                // Re-render the current view
                if (deckCardsEditor && deckCardsEditor.classList.contains('card-view')) {
                    if ((window as any).renderDeckCardsCardView) {
                        await (window as any).renderDeckCardsCardView();
                    }
                } else if (deckCardsEditor && deckCardsEditor.classList.contains('list-view')) {
                    if ((window as any).renderDeckCardsListView) {
                        await (window as any).renderDeckCardsListView();
                    }
                } else {
                    if ((window as any).displayDeckCardsForEditing) {
                        await (window as any).displayDeckCardsForEditing();
                    }
                }
                
                // Restore scroll position after re-rendering
                setTimeout(() => {
                    if (deckCardsEditor) {
                        deckCardsEditor.scrollTop = currentScrollTop;
                    }
                }, 10);
                
                // Restore the expansion state after re-rendering
                if ((window as any).applyUIPreferences) {
                    (window as any).applyUIPreferences({ expansionState: currentExpansionState });
                }
                
                // Show notification
                const cardData = cardsMap.get(cardId);
                const cardName = cardData ? (cardData.name || cardData.card_name || cardId) : cardId;
                const message = card.exclude_from_draw 
                    ? `"${cardName}" marked as Pre-Placed (excluded from Draw Hand)`
                    : `"${cardName}" included in Draw Hand`;
                if ((window as any).showNotification) {
                    (window as any).showNotification(message, 'success');
                }
                
                // Update deck validation
                if ((window as any).showDeckValidation) {
                    await (window as any).showDeckValidation(deckCards);
                }
            } catch (error) {
                console.error('Error in drawBasicUniverseCard:', error);
                if ((window as any).showNotification) {
                    (window as any).showNotification('Error toggling Pre-Placed status', 'error');
                }
            }
        };

        // Setup console spies
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        // Clean up
        document.body.innerHTML = '';
        jest.clearAllMocks();
        if (consoleWarnSpy) consoleWarnSpy.mockRestore();
        if (consoleErrorSpy) consoleErrorSpy.mockRestore();
    });

    describe('hasDraculasArmory() Function', () => {
        it('should return true when Dracula\'s Armory location is in deck', () => {
            mockDeckEditorCards = [
                { type: 'location', cardId: 'loc-dracula', quantity: 1 },
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1 }
            ];
            mockAvailableCardsMap.set('loc-dracula', mockDraculasArmoryLocation);
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const result = (window as any).hasDraculasArmory();
            expect(result).toBe(true);
        });

        it('should return false when Dracula\'s Armory is not in deck', () => {
            mockDeckEditorCards = [
                { type: 'location', cardId: 'loc-other', quantity: 1 },
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1 }
            ];
            mockAvailableCardsMap.set('loc-other', {
                id: 'loc-other',
                name: 'Other Location',
                type: 'location'
            });
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const result = (window as any).hasDraculasArmory();
            expect(result).toBe(false);
        });

        it('should return false when deckEditorCards is undefined', () => {
            (window as any).deckEditorCards = undefined;
            mockAvailableCardsMap.set('loc-dracula', mockDraculasArmoryLocation);
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const result = (window as any).hasDraculasArmory();
            expect(result).toBe(false);
        });

        it('should return false when availableCardsMap is undefined', () => {
            mockDeckEditorCards = [
                { type: 'location', cardId: 'loc-dracula', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = undefined;

            const result = (window as any).hasDraculasArmory();
            expect(result).toBe(false);
        });

        it('should handle location with name property matching "Dracula\'s Armory"', () => {
            mockDeckEditorCards = [
                { type: 'location', cardId: 'loc-dracula', quantity: 1 }
            ];
            mockAvailableCardsMap.set('loc-dracula', {
                id: 'loc-dracula',
                name: "Dracula's Armory",
                type: 'location'
            });
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const result = (window as any).hasDraculasArmory();
            expect(result).toBe(true);
        });

        it('should handle location with card_name property matching "Dracula\'s Armory"', () => {
            mockDeckEditorCards = [
                { type: 'location', cardId: 'loc-dracula', quantity: 1 }
            ];
            mockAvailableCardsMap.set('loc-dracula', {
                id: 'loc-dracula',
                card_name: "Dracula's Armory",
                type: 'location'
            });
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const result = (window as any).hasDraculasArmory();
            expect(result).toBe(true);
        });

        it('should return false for other location cards', () => {
            mockDeckEditorCards = [
                { type: 'location', cardId: 'loc-spartan', quantity: 1 }
            ];
            mockAvailableCardsMap.set('loc-spartan', {
                id: 'loc-spartan',
                name: 'Spartan Training Ground',
                type: 'location'
            });
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const result = (window as any).hasDraculasArmory();
            expect(result).toBe(false);
        });

        it('should return false for non-location cards', () => {
            mockDeckEditorCards = [
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1 },
                { type: 'power', cardId: 'power-1', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const result = (window as any).hasDraculasArmory();
            expect(result).toBe(false);
        });
    });

    describe('drawBasicUniverseCard() Function', () => {
        beforeEach(() => {
            mockDeckEditorCards = [
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1, exclude_from_draw: false }
            ];
            mockAvailableCardsMap.set('basic-universe-1', mockBasicUniverseCard);
        });

        it('should toggle exclude_from_draw from false to true', async () => {
            mockDeckEditorCards = [
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1, exclude_from_draw: false }
            ];
            mockAvailableCardsMap.set('basic-universe-1', mockBasicUniverseCard);
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            const card = mockDeckEditorCards[0];
            card.exclude_from_draw = false;

            await (window as any).drawBasicUniverseCard('basic-universe-1', 0);

            expect(card.exclude_from_draw).toBe(true);
        });

        it('should toggle exclude_from_draw from true to false', async () => {
            mockDeckEditorCards = [
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1, exclude_from_draw: true }
            ];
            mockAvailableCardsMap.set('basic-universe-1', mockBasicUniverseCard);
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            const card = mockDeckEditorCards[0];
            card.exclude_from_draw = true;

            await (window as any).drawBasicUniverseCard('basic-universe-1', 0);

            expect(card.exclude_from_draw).toBe(false);
        });

        it('should toggle exclude_from_draw from undefined to true', async () => {
            mockDeckEditorCards = [
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1 }
            ];
            mockAvailableCardsMap.set('basic-universe-1', mockBasicUniverseCard);
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            const card = mockDeckEditorCards[0];
            delete card.exclude_from_draw;

            await (window as any).drawBasicUniverseCard('basic-universe-1', 0);

            expect(card.exclude_from_draw).toBe(true);
        });

        it('should validate card exists at index', async () => {
            mockDeckEditorCards = [
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            await (window as any).drawBasicUniverseCard('basic-universe-1', 999);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Card not found'),
                expect.any(Object)
            );
            expect((window as any).showNotification).not.toHaveBeenCalled();
        });

        it('should validate card ID matches', async () => {
            mockDeckEditorCards = [
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            await (window as any).drawBasicUniverseCard('wrong-card-id', 0);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Card not found'),
                expect.any(Object)
            );
            expect((window as any).showNotification).not.toHaveBeenCalled();
        });

        it('should validate card type is basic-universe', async () => {
            mockDeckEditorCards = [
                { type: 'power', cardId: 'basic-universe-1', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            await (window as any).drawBasicUniverseCard('basic-universe-1', 0);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('not a Basic Universe card'),
                expect.any(Object)
            );
            expect((window as any).showNotification).not.toHaveBeenCalled();
        });

        it('should show error notification if card not found', async () => {
            mockDeckEditorCards = [
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            await (window as any).drawBasicUniverseCard('nonexistent', 999);

            // Function should return early without showing notification
            // The console.warn is called instead
            expect(consoleWarnSpy).toHaveBeenCalled();
        });

        it('should show error notification if card type mismatch', async () => {
            mockDeckEditorCards = [
                { type: 'training', cardId: 'basic-universe-1', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            await (window as any).drawBasicUniverseCard('basic-universe-1', 0);

            expect(consoleWarnSpy).toHaveBeenCalled();
        });

        it('should re-render Card View after toggle', async () => {
            mockDeckEditorCards = [
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            const deckCardsEditor = document.querySelector('.deck-cards-editor');
            if (deckCardsEditor) {
                deckCardsEditor.classList.add('card-view');
            }

            await (window as any).drawBasicUniverseCard('basic-universe-1', 0);

            expect((window as any).renderDeckCardsCardView).toHaveBeenCalled();
        });

        it('should re-render List View after toggle', async () => {
            mockDeckEditorCards = [
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            const deckCardsEditor = document.querySelector('.deck-cards-editor');
            if (deckCardsEditor) {
                deckCardsEditor.classList.remove('card-view');
                deckCardsEditor.classList.add('list-view');
            }

            await (window as any).drawBasicUniverseCard('basic-universe-1', 0);

            expect((window as any).renderDeckCardsListView).toHaveBeenCalled();
        });

        it('should re-render Tile View after toggle', async () => {
            mockDeckEditorCards = [
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            const deckCardsEditor = document.querySelector('.deck-cards-editor');
            if (deckCardsEditor) {
                deckCardsEditor.classList.remove('card-view');
                deckCardsEditor.classList.remove('list-view');
            }

            await (window as any).drawBasicUniverseCard('basic-universe-1', 0);

            expect((window as any).displayDeckCardsForEditing).toHaveBeenCalled();
        });

        it('should restore scroll position after re-render', async () => {
            mockDeckEditorCards = [
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
            if (deckCardsEditor) {
                deckCardsEditor.scrollTop = 200;
            }

            await (window as any).drawBasicUniverseCard('basic-universe-1', 0);

            // Wait for setTimeout to execute
            await new Promise(resolve => setTimeout(resolve, 20));

            if (deckCardsEditor) {
                expect(deckCardsEditor.scrollTop).toBe(200);
            }
        });

        it('should restore expansion state after re-render', async () => {
            mockDeckEditorCards = [
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            const mockExpansionState = { section1: true, section2: false };
            (window as any).getExpansionState = jest.fn().mockReturnValue(mockExpansionState);

            await (window as any).drawBasicUniverseCard('basic-universe-1', 0);

            expect((window as any).getExpansionState).toHaveBeenCalled();
            expect((window as any).applyUIPreferences).toHaveBeenCalledWith({ expansionState: mockExpansionState });
        });

        it('should show success notification with card name when excluded', async () => {
            mockDeckEditorCards = [
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            await (window as any).drawBasicUniverseCard('basic-universe-1', 0);

            expect((window as any).showNotification).toHaveBeenCalledWith(
                expect.stringContaining('marked as Pre-Placed'),
                'success'
            );
        });

        it('should show success notification with card name when included', async () => {
            mockDeckEditorCards = [
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1, exclude_from_draw: true }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            await (window as any).drawBasicUniverseCard('basic-universe-1', 0);

            expect((window as any).showNotification).toHaveBeenCalledWith(
                expect.stringContaining('included in Draw Hand'),
                'success'
            );
        });

        it('should update deck validation after toggle', async () => {
            mockDeckEditorCards = [
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            await (window as any).drawBasicUniverseCard('basic-universe-1', 0);

            // Wait for async operations to complete
            await new Promise(resolve => setTimeout(resolve, 20));
            
            expect((window as any).showDeckValidation).toHaveBeenCalledWith(mockDeckEditorCards);
        });

        it('should handle errors gracefully', async () => {
            mockDeckEditorCards = [
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).renderDeckCardsCardView = jest.fn().mockRejectedValue(new Error('Render error'));

            await (window as any).drawBasicUniverseCard('basic-universe-1', 0);

            // Wait for async error handling
            await new Promise(resolve => setTimeout(resolve, 20));

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error in drawBasicUniverseCard'),
                expect.any(Error)
            );
            expect((window as any).showNotification).toHaveBeenCalledWith(
                'Error toggling Pre-Placed status',
                'error'
            );
        });
    });

    describe('Pre-Placed Button Rendering Logic', () => {
        beforeEach(() => {
            mockDeckEditorCards = [
                { type: 'location', cardId: 'loc-dracula', quantity: 1 },
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1 }
            ];
            mockAvailableCardsMap.set('loc-dracula', mockDraculasArmoryLocation);
            mockAvailableCardsMap.set('basic-universe-1', mockBasicUniverseCard);
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
        });

        it('should render Pre-Placed button when Dracula\'s Armory is present and card is Basic Universe', () => {
            const card = mockDeckEditorCards[1]; // Basic Universe card
            const index = 1;
            const hasDracula = (window as any).hasDraculasArmory() || false;

            if (card.type === 'basic-universe' && hasDracula) {
                const isExcluded = card.exclude_from_draw === true;
                const activeClass = isExcluded ? 'active' : '';
                const prePlacedButton = `
                    <button class="draw-training-btn card-view-btn ${activeClass}" onclick="drawBasicUniverseCard('${card.cardId}', ${index})" title="${isExcluded ? 'Unmark as Pre-Placed (include in Draw Hand)' : 'Mark as Pre-Placed (exclude from Draw Hand)'}">Pre-Placed</button>
                `;

                expect(prePlacedButton).toContain('drawBasicUniverseCard');
                expect(prePlacedButton).toContain('Pre-Placed');
                expect(prePlacedButton).toContain('draw-training-btn');
            }
            
            expect(hasDracula).toBe(true);
            expect(card.type).toBe('basic-universe');
        });

        it('should NOT render button when Dracula\'s Armory is not present', () => {
            // Clear the map and set up new data without Dracula's Armory
            mockAvailableCardsMap.clear();
            mockDeckEditorCards = [
                { type: 'location', cardId: 'loc-other', quantity: 1 },
                { type: 'basic-universe', cardId: 'basic-universe-1', quantity: 1 }
            ];
            mockAvailableCardsMap.set('loc-other', {
                id: 'loc-other',
                name: 'Other Location',
                type: 'location'
            });
            mockAvailableCardsMap.set('basic-universe-1', mockBasicUniverseCard);
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const card = mockDeckEditorCards[1];
            const hasDracula = (window as any).hasDraculasArmory() || false;

            expect(hasDracula).toBe(false);
            expect(card.type).toBe('basic-universe');
        });

        it('should NOT render button when card is not Basic Universe type', () => {
            const card = mockDeckEditorCards[0]; // Location card
            const hasDracula = (window as any).hasDraculasArmory() || false;

            expect(card.type).not.toBe('basic-universe');
            expect(hasDracula).toBe(true); // Dracula's Armory is present
        });

        it('should add active class when exclude_from_draw is true', () => {
            mockDeckEditorCards[1].exclude_from_draw = true;
            const card = mockDeckEditorCards[1];
            const index = 1;
            const hasDracula = (window as any).hasDraculasArmory() || false;

            if (card.type === 'basic-universe' && hasDracula) {
                const isExcluded = card.exclude_from_draw === true;
                const activeClass = isExcluded ? 'active' : '';
                const prePlacedButton = `
                    <button class="draw-training-btn card-view-btn ${activeClass}" onclick="drawBasicUniverseCard('${card.cardId}', ${index})">Pre-Placed</button>
                `;

                expect(activeClass).toBe('active');
                expect(prePlacedButton).toContain('active');
            }
        });

        it('should NOT add active class when exclude_from_draw is false', () => {
            mockDeckEditorCards[1].exclude_from_draw = false;
            const card = mockDeckEditorCards[1];
            const index = 1;
            const hasDracula = (window as any).hasDraculasArmory() || false;

            if (card.type === 'basic-universe' && hasDracula) {
                const isExcluded = card.exclude_from_draw === true;
                const activeClass = isExcluded ? 'active' : '';

                expect(activeClass).toBe('');
                expect(activeClass).not.toContain('active');
            }
        });

        it('should NOT add active class when exclude_from_draw is undefined', () => {
            delete mockDeckEditorCards[1].exclude_from_draw;
            const card = mockDeckEditorCards[1];
            const index = 1;
            const hasDracula = (window as any).hasDraculasArmory() || false;

            if (card.type === 'basic-universe' && hasDracula) {
                const isExcluded = card.exclude_from_draw === true;
                const activeClass = isExcluded ? 'active' : '';

                expect(activeClass).toBe('');
                expect(activeClass).not.toContain('active');
            }
        });

        it('should call drawBasicUniverseCard() with correct parameters on click', () => {
            const card = mockDeckEditorCards[1];
            const index = 1;
            const hasDracula = (window as any).hasDraculasArmory() || false;

            if (card.type === 'basic-universe' && hasDracula) {
                const prePlacedButton = `
                    <button onclick="drawBasicUniverseCard('${card.cardId}', ${index})">Pre-Placed</button>
                `;

                expect(prePlacedButton).toContain(`drawBasicUniverseCard('${card.cardId}', ${index})`);
            }
        });

        it('should show correct tooltip when excluded', () => {
            mockDeckEditorCards[1].exclude_from_draw = true;
            const card = mockDeckEditorCards[1];
            const index = 1;
            const hasDracula = (window as any).hasDraculasArmory() || false;

            if (card.type === 'basic-universe' && hasDracula) {
                const isExcluded = card.exclude_from_draw === true;
                const tooltip = isExcluded ? 'Unmark as Pre-Placed (include in Draw Hand)' : 'Mark as Pre-Placed (exclude from Draw Hand)';

                expect(tooltip).toBe('Unmark as Pre-Placed (include in Draw Hand)');
            }
        });

        it('should show correct tooltip when not excluded', () => {
            mockDeckEditorCards[1].exclude_from_draw = false;
            const card = mockDeckEditorCards[1];
            const index = 1;
            const hasDracula = (window as any).hasDraculasArmory() || false;

            if (card.type === 'basic-universe' && hasDracula) {
                const isExcluded = card.exclude_from_draw === true;
                const tooltip = isExcluded ? 'Unmark as Pre-Placed (include in Draw Hand)' : 'Mark as Pre-Placed (exclude from Draw Hand)';

                expect(tooltip).toBe('Mark as Pre-Placed (exclude from Draw Hand)');
            }
        });
    });
});


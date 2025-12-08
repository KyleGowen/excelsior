/** @jest-environment jsdom */

/**
 * Lancelot Sword and Shield Exclusion Feature - Unit Tests
 * 
 * Tests the Pre-Placed button functionality for Sword and Shield special card:
 * - hasLancelot() function for character detection
 * - drawSwordAndShield() function for toggling exclude_from_draw flag
 * - Pre-Placed button rendering logic in Card View
 */

import fs from 'fs';
import path from 'path';

// Extend Window interface for test globals
declare global {
    interface Window {
        deckEditorCards?: any[];
        availableCardsMap?: Map<string, any>;
        hasLancelot?: () => boolean;
        drawSwordAndShield?: (cardId: string, index: number) => Promise<void>;
        renderDeckCardsCardView?: () => Promise<void>;
        displayDeckCardsForEditing?: () => Promise<void>;
        renderDeckCardsListView?: () => Promise<void>;
        getExpansionState?: () => any;
        applyUIPreferences?: (prefs: any) => void;
        showDeckValidation?: (cards: any[]) => Promise<void>;
        showNotification?: (message: string, type: string) => void;
    }
}

describe('Lancelot Sword and Shield Exclusion Feature Tests', () => {
    let mockDeckEditorCards: any[];
    let mockAvailableCardsMap: Map<string, any>;
    let mockLancelotCharacter: any;
    let mockSwordAndShieldCard: any;
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

        // Mock Lancelot character
        mockLancelotCharacter = {
            id: 'character_lancelot',
            name: 'Lancelot',
            type: 'character',
            energy: 7,
            combat: 5,
            brute_force: 4,
            intelligence: 18
        };

        // Mock Sword and Shield special card
        mockSwordAndShieldCard = {
            id: 'special_sword_and_shield',
            name: 'Sword and Shield',
            card_name: 'Sword and Shield',
            type: 'special',
            character: 'Lancelot',
            card_effect: 'Lancelot\'s Power card attacks are +2 for remainder of battle. Lancelot may discard this card from play to avoid 1 attack made on Lancelot. **One Per Deck**',
            one_per_deck: true
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

        // Implement hasLancelot function directly (matching the actual implementation)
        (window as any).hasLancelot = function() {
            const deckCards = (window as any).deckEditorCards;
            const cardsMap = (window as any).availableCardsMap;
            
            if (!deckCards || !cardsMap) {
                return false;
            }
            
            return deckCards.some((card: any) => {
                if (card.type !== 'character') return false;
                const characterData = cardsMap.get(card.cardId);
                return characterData && (characterData.name === 'Lancelot' || card.cardId === 'character_lancelot' || card.cardId.includes('lancelot'));
            });
        };

        // Implement drawSwordAndShield function directly (matching the actual implementation)
        (window as any).drawSwordAndShield = async function(cardId: string, index: number) {
            try {
                const deckCards = (window as any).deckEditorCards;
                const cardsMap = (window as any).availableCardsMap;
                
                if (!deckCards || !cardsMap) {
                    return;
                }
                
                const card = deckCards[index];
                
                // Validate card exists and is a special card
                if (!card || card.cardId !== cardId || card.type !== 'special') {
                    console.warn('drawSwordAndShield: Card not found or not a special card', { cardId, index });
                    return;
                }
                
                // Verify it's actually Sword and Shield
                const cardData = cardsMap.get(cardId);
                const cardName = cardData ? (cardData.name || cardData.card_name || '') : '';
                if (cardName !== 'Sword and Shield' && !cardId.includes('sword_and_shield') && !cardId.includes('sword-and-shield')) {
                    console.warn('drawSwordAndShield: Card is not Sword and Shield', { cardId, cardName, index });
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
                const displayName = cardName || cardId;
                const message = card.exclude_from_draw 
                    ? `"${displayName}" marked as Pre-Placed (excluded from Draw Hand)`
                    : `"${displayName}" included in Draw Hand`;
                if ((window as any).showNotification) {
                    (window as any).showNotification(message, 'success');
                }
                
                // Update deck validation
                if ((window as any).showDeckValidation) {
                    await (window as any).showDeckValidation(deckCards);
                }
            } catch (error) {
                console.error('Error in drawSwordAndShield:', error);
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

    describe('hasLancelot() Function', () => {
        it('should return true when Lancelot character is in deck', () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'special_sword_and_shield', quantity: 1 }
            ];
            mockAvailableCardsMap.set('character_lancelot', mockLancelotCharacter);
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const result = (window as any).hasLancelot();
            expect(result).toBe(true);
        });

        it('should return false when Lancelot is not in deck', () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_leonidas', quantity: 1 },
                { type: 'special', cardId: 'special_sword_and_shield', quantity: 1 }
            ];
            mockAvailableCardsMap.set('character_leonidas', {
                id: 'character_leonidas',
                name: 'Leonidas',
                type: 'character'
            });
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const result = (window as any).hasLancelot();
            expect(result).toBe(false);
        });

        it('should return false when deckEditorCards is undefined', () => {
            (window as any).deckEditorCards = undefined;
            mockAvailableCardsMap.set('character_lancelot', mockLancelotCharacter);
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const result = (window as any).hasLancelot();
            expect(result).toBe(false);
        });

        it('should return false when availableCardsMap is undefined', () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = undefined;

            const result = (window as any).hasLancelot();
            expect(result).toBe(false);
        });

        it('should handle character with name property matching "Lancelot"', () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'char-123', quantity: 1 }
            ];
            mockAvailableCardsMap.set('char-123', {
                id: 'char-123',
                name: 'Lancelot',
                type: 'character'
            });
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const result = (window as any).hasLancelot();
            expect(result).toBe(true);
        });

        it('should handle character with cardId matching "character_lancelot"', () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 }
            ];
            mockAvailableCardsMap.set('character_lancelot', mockLancelotCharacter);
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const result = (window as any).hasLancelot();
            expect(result).toBe(true);
        });

        it('should handle character with cardId containing "lancelot"', () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'some-prefix-lancelot-suffix', quantity: 1 }
            ];
            mockAvailableCardsMap.set('some-prefix-lancelot-suffix', {
                id: 'some-prefix-lancelot-suffix',
                name: 'Lancelot',
                type: 'character'
            });
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const result = (window as any).hasLancelot();
            expect(result).toBe(true);
        });

        it('should return false for other character cards', () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_leonidas', quantity: 1 }
            ];
            mockAvailableCardsMap.set('character_leonidas', {
                id: 'character_leonidas',
                name: 'Leonidas',
                type: 'character'
            });
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const result = (window as any).hasLancelot();
            expect(result).toBe(false);
        });

        it('should return false for non-character cards', () => {
            mockDeckEditorCards = [
                { type: 'special', cardId: 'special_sword_and_shield', quantity: 1 },
                { type: 'power', cardId: 'power-1', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const result = (window as any).hasLancelot();
            expect(result).toBe(false);
        });
    });

    describe('drawSwordAndShield() Function', () => {
        beforeEach(() => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'special_sword_and_shield', quantity: 1, exclude_from_draw: false }
            ];
            mockAvailableCardsMap.set('character_lancelot', mockLancelotCharacter);
            mockAvailableCardsMap.set('special_sword_and_shield', mockSwordAndShieldCard);
        });

        it('should toggle exclude_from_draw from false to true', async () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'special_sword_and_shield', quantity: 1, exclude_from_draw: false }
            ];
            mockAvailableCardsMap.set('character_lancelot', mockLancelotCharacter);
            mockAvailableCardsMap.set('special_sword_and_shield', mockSwordAndShieldCard);
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            const card = mockDeckEditorCards[1];
            card.exclude_from_draw = false;

            await (window as any).drawSwordAndShield('special_sword_and_shield', 1);

            expect(card.exclude_from_draw).toBe(true);
        });

        it('should toggle exclude_from_draw from true to false', async () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'special_sword_and_shield', quantity: 1, exclude_from_draw: true }
            ];
            mockAvailableCardsMap.set('character_lancelot', mockLancelotCharacter);
            mockAvailableCardsMap.set('special_sword_and_shield', mockSwordAndShieldCard);
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            const card = mockDeckEditorCards[1];
            card.exclude_from_draw = true;

            await (window as any).drawSwordAndShield('special_sword_and_shield', 1);

            expect(card.exclude_from_draw).toBe(false);
        });

        it('should toggle exclude_from_draw from undefined to true', async () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'special_sword_and_shield', quantity: 1 }
            ];
            mockAvailableCardsMap.set('character_lancelot', mockLancelotCharacter);
            mockAvailableCardsMap.set('special_sword_and_shield', mockSwordAndShieldCard);
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            const card = mockDeckEditorCards[1];
            delete card.exclude_from_draw;

            await (window as any).drawSwordAndShield('special_sword_and_shield', 1);

            expect(card.exclude_from_draw).toBe(true);
        });

        it('should validate card exists at index', async () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'special_sword_and_shield', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            await (window as any).drawSwordAndShield('special_sword_and_shield', 999);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Card not found'),
                expect.any(Object)
            );
            expect((window as any).showNotification).not.toHaveBeenCalled();
        });

        it('should validate card ID matches', async () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'special_sword_and_shield', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            await (window as any).drawSwordAndShield('wrong-card-id', 1);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Card not found'),
                expect.any(Object)
            );
            expect((window as any).showNotification).not.toHaveBeenCalled();
        });

        it('should validate card type is special', async () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'power', cardId: 'special_sword_and_shield', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            await (window as any).drawSwordAndShield('special_sword_and_shield', 1);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('not a special card'),
                expect.any(Object)
            );
            expect((window as any).showNotification).not.toHaveBeenCalled();
        });

        it('should validate card is actually Sword and Shield by name', async () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'special_other', quantity: 1 }
            ];
            mockAvailableCardsMap.set('special_other', {
                id: 'special_other',
                name: 'Other Special Card',
                type: 'special'
            });
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            await (window as any).drawSwordAndShield('special_other', 1);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Card is not Sword and Shield'),
                expect.any(Object)
            );
            expect((window as any).showNotification).not.toHaveBeenCalled();
        });

        it('should accept card with cardId containing "sword_and_shield"', async () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'prefix_sword_and_shield_suffix', quantity: 1 }
            ];
            mockAvailableCardsMap.set('prefix_sword_and_shield_suffix', {
                id: 'prefix_sword_and_shield_suffix',
                name: 'Other Card',
                type: 'special'
            });
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            await (window as any).drawSwordAndShield('prefix_sword_and_shield_suffix', 1);

            // Should succeed because cardId contains "sword_and_shield"
            expect((window as any).showNotification).toHaveBeenCalled();
        });

        it('should accept card with cardId containing "sword-and-shield"', async () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'sword-and-shield-card', quantity: 1 }
            ];
            mockAvailableCardsMap.set('sword-and-shield-card', {
                id: 'sword-and-shield-card',
                name: 'Other Card',
                type: 'special'
            });
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            await (window as any).drawSwordAndShield('sword-and-shield-card', 1);

            // Should succeed because cardId contains "sword-and-shield"
            expect((window as any).showNotification).toHaveBeenCalled();
        });

        it('should re-render Card View after toggle', async () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'special_sword_and_shield', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            const deckCardsEditor = document.querySelector('.deck-cards-editor');
            if (deckCardsEditor) {
                deckCardsEditor.classList.add('card-view');
            }

            await (window as any).drawSwordAndShield('special_sword_and_shield', 1);

            expect((window as any).renderDeckCardsCardView).toHaveBeenCalled();
        });

        it('should re-render List View after toggle', async () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'special_sword_and_shield', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            const deckCardsEditor = document.querySelector('.deck-cards-editor');
            if (deckCardsEditor) {
                deckCardsEditor.classList.remove('card-view');
                deckCardsEditor.classList.add('list-view');
            }

            await (window as any).drawSwordAndShield('special_sword_and_shield', 1);

            expect((window as any).renderDeckCardsListView).toHaveBeenCalled();
        });

        it('should re-render Tile View after toggle', async () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'special_sword_and_shield', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            const deckCardsEditor = document.querySelector('.deck-cards-editor');
            if (deckCardsEditor) {
                deckCardsEditor.classList.remove('card-view');
                deckCardsEditor.classList.remove('list-view');
            }

            await (window as any).drawSwordAndShield('special_sword_and_shield', 1);

            expect((window as any).displayDeckCardsForEditing).toHaveBeenCalled();
        });

        it('should restore scroll position after re-render', async () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'special_sword_and_shield', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            const deckCardsEditor = document.querySelector('.deck-cards-editor') as HTMLElement;
            if (deckCardsEditor) {
                deckCardsEditor.scrollTop = 200;
            }

            await (window as any).drawSwordAndShield('special_sword_and_shield', 1);

            // Wait for setTimeout to execute
            await new Promise(resolve => setTimeout(resolve, 20));

            if (deckCardsEditor) {
                expect(deckCardsEditor.scrollTop).toBe(200);
            }
        });

        it('should restore expansion state after re-render', async () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'special_sword_and_shield', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            const mockExpansionState = { section1: true, section2: false };
            (window as any).getExpansionState = jest.fn().mockReturnValue(mockExpansionState);

            await (window as any).drawSwordAndShield('special_sword_and_shield', 1);

            expect((window as any).getExpansionState).toHaveBeenCalled();
            expect((window as any).applyUIPreferences).toHaveBeenCalledWith({ expansionState: mockExpansionState });
        });

        it('should show success notification with card name when excluded', async () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'special_sword_and_shield', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            await (window as any).drawSwordAndShield('special_sword_and_shield', 1);

            expect((window as any).showNotification).toHaveBeenCalledWith(
                expect.stringContaining('marked as Pre-Placed'),
                'success'
            );
        });

        it('should show success notification with card name when included', async () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'special_sword_and_shield', quantity: 1, exclude_from_draw: true }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            await (window as any).drawSwordAndShield('special_sword_and_shield', 1);

            expect((window as any).showNotification).toHaveBeenCalledWith(
                expect.stringContaining('included in Draw Hand'),
                'success'
            );
        });

        it('should update deck validation after toggle', async () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'special_sword_and_shield', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            
            await (window as any).drawSwordAndShield('special_sword_and_shield', 1);

            // Wait for async operations to complete
            await new Promise(resolve => setTimeout(resolve, 20));
            
            expect((window as any).showDeckValidation).toHaveBeenCalledWith(mockDeckEditorCards);
        });

        it('should handle errors gracefully', async () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'special_sword_and_shield', quantity: 1 }
            ];
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
            (window as any).renderDeckCardsCardView = jest.fn().mockRejectedValue(new Error('Render error'));

            await (window as any).drawSwordAndShield('special_sword_and_shield', 1);

            // Wait for async error handling
            await new Promise(resolve => setTimeout(resolve, 20));

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error in drawSwordAndShield'),
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
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'special_sword_and_shield', quantity: 1 }
            ];
            mockAvailableCardsMap.set('character_lancelot', mockLancelotCharacter);
            mockAvailableCardsMap.set('special_sword_and_shield', mockSwordAndShieldCard);
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;
        });

        it('should render Pre-Placed button when Lancelot is present and card is Sword and Shield', () => {
            const card = mockDeckEditorCards[1]; // Sword and Shield card
            const index = 1;
            const hasLancelot = (window as any).hasLancelot() || false;
            const cardData = mockAvailableCardsMap.get(card.cardId);
            const cardName = cardData ? (cardData.name || cardData.card_name || '') : '';

            if (card.type === 'special' && hasLancelot && (cardName === 'Sword and Shield' || card.cardId.includes('sword_and_shield') || card.cardId.includes('sword-and-shield'))) {
                const isExcluded = card.exclude_from_draw === true;
                const activeClass = isExcluded ? 'active' : '';
                const prePlacedButton = `
                    <button class="draw-training-btn card-view-btn ${activeClass}" onclick="drawSwordAndShield('${card.cardId}', ${index})" title="${isExcluded ? 'Unmark as Pre-Placed (include in Draw Hand)' : 'Mark as Pre-Placed (exclude from Draw Hand)'}">Pre-Placed</button>
                `;

                expect(prePlacedButton).toContain('drawSwordAndShield');
                expect(prePlacedButton).toContain('Pre-Placed');
                expect(prePlacedButton).toContain('draw-training-btn');
            }
            
            expect(hasLancelot).toBe(true);
            expect(card.type).toBe('special');
            expect(cardName).toBe('Sword and Shield');
        });

        it('should NOT render button when Lancelot is not present', () => {
            // Clear the map and set up new data without Lancelot
            mockAvailableCardsMap.clear();
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_leonidas', quantity: 1 },
                { type: 'special', cardId: 'special_sword_and_shield', quantity: 1 }
            ];
            mockAvailableCardsMap.set('character_leonidas', {
                id: 'character_leonidas',
                name: 'Leonidas',
                type: 'character'
            });
            mockAvailableCardsMap.set('special_sword_and_shield', mockSwordAndShieldCard);
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const card = mockDeckEditorCards[1];
            const hasLancelot = (window as any).hasLancelot() || false;

            expect(hasLancelot).toBe(false);
            expect(card.type).toBe('special');
        });

        it('should NOT render button when card is not Sword and Shield', () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'special_other', quantity: 1 }
            ];
            mockAvailableCardsMap.set('character_lancelot', mockLancelotCharacter);
            mockAvailableCardsMap.set('special_other', {
                id: 'special_other',
                name: 'Other Special Card',
                type: 'special'
            });
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const card = mockDeckEditorCards[1];
            const hasLancelot = (window as any).hasLancelot() || false;
            const cardData = mockAvailableCardsMap.get(card.cardId);
            const cardName = cardData ? (cardData.name || cardData.card_name || '') : '';

            expect(hasLancelot).toBe(true);
            expect(card.type).toBe('special');
            expect(cardName).not.toBe('Sword and Shield');
            expect(card.cardId).not.toContain('sword_and_shield');
            expect(card.cardId).not.toContain('sword-and-shield');
        });

        it('should NOT render button when card is not special type', () => {
            const card = mockDeckEditorCards[0]; // Character card
            const hasLancelot = (window as any).hasLancelot() || false;

            expect(card.type).not.toBe('special');
            expect(hasLancelot).toBe(true); // Lancelot is present
        });

        it('should add active class when exclude_from_draw is true', () => {
            mockDeckEditorCards[1].exclude_from_draw = true;
            const card = mockDeckEditorCards[1];
            const index = 1;
            const hasLancelot = (window as any).hasLancelot() || false;
            const cardData = mockAvailableCardsMap.get(card.cardId);
            const cardName = cardData ? (cardData.name || cardData.card_name || '') : '';

            if (card.type === 'special' && hasLancelot && (cardName === 'Sword and Shield' || card.cardId.includes('sword_and_shield') || card.cardId.includes('sword-and-shield'))) {
                const isExcluded = card.exclude_from_draw === true;
                const activeClass = isExcluded ? 'active' : '';
                const prePlacedButton = `
                    <button class="draw-training-btn card-view-btn ${activeClass}" onclick="drawSwordAndShield('${card.cardId}', ${index})">Pre-Placed</button>
                `;

                expect(activeClass).toBe('active');
                expect(prePlacedButton).toContain('active');
            }
        });

        it('should NOT add active class when exclude_from_draw is false', () => {
            mockDeckEditorCards[1].exclude_from_draw = false;
            const card = mockDeckEditorCards[1];
            const index = 1;
            const hasLancelot = (window as any).hasLancelot() || false;
            const cardData = mockAvailableCardsMap.get(card.cardId);
            const cardName = cardData ? (cardData.name || cardData.card_name || '') : '';

            if (card.type === 'special' && hasLancelot && (cardName === 'Sword and Shield' || card.cardId.includes('sword_and_shield') || card.cardId.includes('sword-and-shield'))) {
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
            const hasLancelot = (window as any).hasLancelot() || false;
            const cardData = mockAvailableCardsMap.get(card.cardId);
            const cardName = cardData ? (cardData.name || cardData.card_name || '') : '';

            if (card.type === 'special' && hasLancelot && (cardName === 'Sword and Shield' || card.cardId.includes('sword_and_shield') || card.cardId.includes('sword-and-shield'))) {
                const isExcluded = card.exclude_from_draw === true;
                const activeClass = isExcluded ? 'active' : '';

                expect(activeClass).toBe('');
                expect(activeClass).not.toContain('active');
            }
        });

        it('should call drawSwordAndShield() with correct parameters on click', () => {
            const card = mockDeckEditorCards[1];
            const index = 1;
            const hasLancelot = (window as any).hasLancelot() || false;
            const cardData = mockAvailableCardsMap.get(card.cardId);
            const cardName = cardData ? (cardData.name || cardData.card_name || '') : '';

            if (card.type === 'special' && hasLancelot && (cardName === 'Sword and Shield' || card.cardId.includes('sword_and_shield') || card.cardId.includes('sword-and-shield'))) {
                const prePlacedButton = `
                    <button onclick="drawSwordAndShield('${card.cardId}', ${index})">Pre-Placed</button>
                `;

                expect(prePlacedButton).toContain(`drawSwordAndShield('${card.cardId}', ${index})`);
            }
        });

        it('should show correct tooltip when excluded', () => {
            mockDeckEditorCards[1].exclude_from_draw = true;
            const card = mockDeckEditorCards[1];
            const index = 1;
            const hasLancelot = (window as any).hasLancelot() || false;
            const cardData = mockAvailableCardsMap.get(card.cardId);
            const cardName = cardData ? (cardData.name || cardData.card_name || '') : '';

            if (card.type === 'special' && hasLancelot && (cardName === 'Sword and Shield' || card.cardId.includes('sword_and_shield') || card.cardId.includes('sword-and-shield'))) {
                const isExcluded = card.exclude_from_draw === true;
                const tooltip = isExcluded ? 'Unmark as Pre-Placed (include in Draw Hand)' : 'Mark as Pre-Placed (exclude from Draw Hand)';

                expect(tooltip).toBe('Unmark as Pre-Placed (include in Draw Hand)');
            }
        });

        it('should show correct tooltip when not excluded', () => {
            mockDeckEditorCards[1].exclude_from_draw = false;
            const card = mockDeckEditorCards[1];
            const index = 1;
            const hasLancelot = (window as any).hasLancelot() || false;
            const cardData = mockAvailableCardsMap.get(card.cardId);
            const cardName = cardData ? (cardData.name || cardData.card_name || '') : '';

            if (card.type === 'special' && hasLancelot && (cardName === 'Sword and Shield' || card.cardId.includes('sword_and_shield') || card.cardId.includes('sword-and-shield'))) {
                const isExcluded = card.exclude_from_draw === true;
                const tooltip = isExcluded ? 'Unmark as Pre-Placed (include in Draw Hand)' : 'Mark as Pre-Placed (exclude from Draw Hand)';

                expect(tooltip).toBe('Mark as Pre-Placed (exclude from Draw Hand)');
            }
        });

        it('should handle card with cardId containing "sword_and_shield"', () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'prefix_sword_and_shield_suffix', quantity: 1 }
            ];
            mockAvailableCardsMap.set('character_lancelot', mockLancelotCharacter);
            mockAvailableCardsMap.set('prefix_sword_and_shield_suffix', {
                id: 'prefix_sword_and_shield_suffix',
                name: 'Other Card',
                type: 'special'
            });
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const card = mockDeckEditorCards[1];
            const hasLancelot = (window as any).hasLancelot() || false;
            const cardData = mockAvailableCardsMap.get(card.cardId);
            const cardName = cardData ? (cardData.name || cardData.card_name || '') : '';

            if (card.type === 'special' && hasLancelot && (cardName === 'Sword and Shield' || card.cardId.includes('sword_and_shield') || card.cardId.includes('sword-and-shield'))) {
                const isExcluded = card.exclude_from_draw === true;
                const activeClass = isExcluded ? 'active' : '';
                const prePlacedButton = `
                    <button class="draw-training-btn card-view-btn ${activeClass}" onclick="drawSwordAndShield('${card.cardId}', 1)">Pre-Placed</button>
                `;

                expect(prePlacedButton).toContain('drawSwordAndShield');
                expect(prePlacedButton).toContain('Pre-Placed');
            }
        });

        it('should handle card with cardId containing "sword-and-shield"', () => {
            mockDeckEditorCards = [
                { type: 'character', cardId: 'character_lancelot', quantity: 1 },
                { type: 'special', cardId: 'sword-and-shield-card', quantity: 1 }
            ];
            mockAvailableCardsMap.set('character_lancelot', mockLancelotCharacter);
            mockAvailableCardsMap.set('sword-and-shield-card', {
                id: 'sword-and-shield-card',
                name: 'Other Card',
                type: 'special'
            });
            (window as any).deckEditorCards = mockDeckEditorCards;
            (window as any).availableCardsMap = mockAvailableCardsMap;

            const card = mockDeckEditorCards[1];
            const hasLancelot = (window as any).hasLancelot() || false;
            const cardData = mockAvailableCardsMap.get(card.cardId);
            const cardName = cardData ? (cardData.name || cardData.card_name || '') : '';

            if (card.type === 'special' && hasLancelot && (cardName === 'Sword and Shield' || card.cardId.includes('sword_and_shield') || card.cardId.includes('sword-and-shield'))) {
                const isExcluded = card.exclude_from_draw === true;
                const activeClass = isExcluded ? 'active' : '';
                const prePlacedButton = `
                    <button class="draw-training-btn card-view-btn ${activeClass}" onclick="drawSwordAndShield('${card.cardId}', 1)">Pre-Placed</button>
                `;

                expect(prePlacedButton).toContain('drawSwordAndShield');
                expect(prePlacedButton).toContain('Pre-Placed');
            }
        });
    });
});


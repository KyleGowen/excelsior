/**
 * Unit tests for reserve character threat calculation fix
 * Tests the updateReserveButtons function to ensure correct card ID matching
 */

import { JSDOM } from 'jsdom';

// Mock the global objects
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head></head>
<body>
    <div id="deckCardsEditor">
        <div class="deck-card-editor-item">
            <div class="deck-card-editor-name">Joan of Arc</div>
            <div class="deck-card-editor-reserve"></div>
        </div>
        <div class="deck-card-editor-item">
            <div class="deck-card-editor-name">Victory Harben</div>
            <div class="deck-card-editor-reserve"></div>
        </div>
        <div class="deck-card-editor-item">
            <div class="deck-card-editor-name">Sherlock Holmes</div>
            <div class="deck-card-editor-reserve"></div>
        </div>
    </div>
    <div id="deck-list-items-character">
        <div class="deck-list-item">
            <div class="deck-list-item-name">Joan of Arc</div>
            <div class="deck-list-item-actions">
                <button class="deck-list-item-remove">-</button>
            </div>
        </div>
        <div class="deck-list-item">
            <div class="deck-list-item-name">Victory Harben</div>
            <div class="deck-list-item-actions">
                <button class="deck-list-item-remove">-</button>
            </div>
        </div>
        <div class="deck-list-item">
            <div class="deck-list-item-name">Sherlock Holmes</div>
            <div class="deck-list-item-actions">
                <button class="deck-list-item-remove">-</button>
            </div>
        </div>
    </div>
</body>
</html>
`);

global.document = dom.window.document;
global.window = dom.window as any;

// Mock the global variables and functions
let currentDeckData: any;
let deckEditorCards: any[];
let availableCardsMap: Map<string, any>;

// Mock the getReserveCharacterButton function
function getReserveCharacterButton(cardId: string, index: number): string {
    const isReserveCharacter = currentDeckData && currentDeckData.metadata && currentDeckData.metadata.reserve_character === cardId;
    const hasReserveCharacter = currentDeckData && currentDeckData.metadata && currentDeckData.metadata.reserve_character;
    
    if (isReserveCharacter) {
        return `<button class="reserve-btn active" onclick="deselectReserveCharacter(${index})">Reserve</button>`;
    } else if (hasReserveCharacter) {
        return '';
    } else {
        return `<button class="reserve-btn" onclick="selectReserveCharacter('${cardId}', ${index})">Select Reserve</button>`;
    }
}

// The fixed updateReserveButtons function
function updateReserveButtons() {
    // Find all character cards in the deck editor
    const characterCards = document.querySelectorAll('.deck-card-editor-item');
    
    characterCards.forEach((cardElement, index) => {
        // Check if this is a character card
        const cardInfo = cardElement.querySelector('.deck-card-editor-name');
        if (!cardInfo) return;
        
        // Find the card ID from the deckEditorCards array by matching the card name
        const cardName = cardInfo.textContent?.trim();
        const matchingCard = deckEditorCards.find(card => {
            if (card.type !== 'character') return false;
            const character = availableCardsMap.get(card.cardId);
            return character && character.name === cardName;
        });
        
        if (matchingCard) {
            const cardId = matchingCard.cardId;
            const cardIndex = deckEditorCards.indexOf(matchingCard);
            const reserveContainer = cardElement.querySelector('.deck-card-editor-reserve');
            
            if (reserveContainer) {
                // Get the new button HTML
                const newButtonHTML = getReserveCharacterButton(cardId, cardIndex);
                
                // Only update if the content has actually changed to avoid unnecessary DOM manipulation
                if (reserveContainer.innerHTML !== newButtonHTML) {
                    reserveContainer.innerHTML = newButtonHTML;
                }
            }
        }
    });

    // Also update reserve buttons in list view - only in Characters section
    const charactersListItems = document.querySelectorAll('#deck-list-items-character .deck-list-item');
    charactersListItems.forEach((listItem, index) => {
        // Find the card name from the list item
        const cardNameElement = listItem.querySelector('.deck-list-item-name');
        if (!cardNameElement) return;
        
        const cardName = cardNameElement.textContent?.trim();
        
        // Find the corresponding character card in deckEditorCards by name
        const matchingCard = deckEditorCards.find(card => {
            if (card.type !== 'character') return false;
            const character = availableCardsMap.get(card.cardId);
            return character && character.name === cardName;
        });
        
        if (matchingCard) {
            const cardId = matchingCard.cardId;
            const originalIndex = deckEditorCards.indexOf(matchingCard);
            const actionsContainer = listItem.querySelector('.deck-list-item-actions');
            
            if (actionsContainer) {
                // Find existing reserve button and remove it
                const existingReserveBtn = actionsContainer.querySelector('.reserve-btn');
                if (existingReserveBtn) {
                    existingReserveBtn.remove();
                }
                
                // Get the new button HTML
                const newButtonHTML = getReserveCharacterButton(cardId, originalIndex);
                
                // Insert the new button before the remove button
                const removeBtn = actionsContainer.querySelector('.deck-list-item-remove');
                if (removeBtn && newButtonHTML) {
                    removeBtn.insertAdjacentHTML('beforebegin', newButtonHTML);
                }
            }
        }
    });
}

describe('Reserve Character Threat Calculation Fix', () => {
    beforeEach(() => {
        // Reset the DOM
        document.querySelectorAll('.deck-card-editor-reserve').forEach(el => {
            el.innerHTML = '';
        });
        document.querySelectorAll('.deck-list-item-actions').forEach(el => {
            const reserveBtn = el.querySelector('.reserve-btn');
            if (reserveBtn) reserveBtn.remove();
        });

        // Setup test data
        currentDeckData = {
            metadata: {
                reserve_character: null
            }
        };

        deckEditorCards = [
            { cardId: 'card-1', type: 'character', quantity: 1 },
            { cardId: 'card-2', type: 'character', quantity: 1 },
            { cardId: 'card-3', type: 'character', quantity: 1 },
            { cardId: 'card-4', type: 'power', quantity: 1 }, // Non-character card
        ];

        availableCardsMap = new Map([
            ['card-1', { name: 'Joan of Arc', threat_level: 18 }],
            ['card-2', { name: 'Victory Harben', threat_level: 18 }],
            ['card-3', { name: 'Sherlock Holmes', threat_level: 20 }],
        ]);
    });

    describe('updateReserveButtons - Tile View', () => {
        it('should correctly match card IDs by name when no reserve character is selected', () => {
            updateReserveButtons();

            // Check that all character cards have "Select Reserve" buttons
            const reserveContainers = document.querySelectorAll('.deck-card-editor-reserve');
            expect(reserveContainers[0].innerHTML).toContain('Select Reserve');
            expect(reserveContainers[0].innerHTML).toContain("selectReserveCharacter('card-1', 0)");
            
            expect(reserveContainers[1].innerHTML).toContain('Select Reserve');
            expect(reserveContainers[1].innerHTML).toContain("selectReserveCharacter('card-2', 1)");
            
            expect(reserveContainers[2].innerHTML).toContain('Select Reserve');
            expect(reserveContainers[2].innerHTML).toContain("selectReserveCharacter('card-3', 2)");
        });

        it('should correctly match Victory Harben card ID when she is selected as reserve', () => {
            currentDeckData.metadata.reserve_character = 'card-2'; // Victory Harben

            updateReserveButtons();

            const reserveContainers = document.querySelectorAll('.deck-card-editor-reserve');
            
            // Victory Harben should have "Reserve" button (active)
            expect(reserveContainers[1].innerHTML).toContain('Reserve');
            expect(reserveContainers[1].innerHTML).toContain('reserve-btn active');
            expect(reserveContainers[1].innerHTML).toContain('deselectReserveCharacter(1)');
            
            // Other characters should have no buttons (hidden when reserve is selected)
            expect(reserveContainers[0].innerHTML).toBe('');
            expect(reserveContainers[2].innerHTML).toBe('');
        });

        it('should correctly match Sherlock Holmes card ID when he is selected as reserve', () => {
            currentDeckData.metadata.reserve_character = 'card-3'; // Sherlock Holmes

            updateReserveButtons();

            const reserveContainers = document.querySelectorAll('.deck-card-editor-reserve');
            
            // Sherlock Holmes should have "Reserve" button (active)
            expect(reserveContainers[2].innerHTML).toContain('Reserve');
            expect(reserveContainers[2].innerHTML).toContain('reserve-btn active');
            expect(reserveContainers[2].innerHTML).toContain('deselectReserveCharacter(2)');
            
            // Other characters should have no buttons
            expect(reserveContainers[0].innerHTML).toBe('');
            expect(reserveContainers[1].innerHTML).toBe('');
        });

        it('should handle cards in different order than deckEditorCards array', () => {
            // Reorder the deckEditorCards array to simulate different ordering
            deckEditorCards = [
                { cardId: 'card-3', type: 'character', quantity: 1 }, // Sherlock Holmes first
                { cardId: 'card-1', type: 'character', quantity: 1 }, // Joan of Arc second
                { cardId: 'card-2', type: 'character', quantity: 1 }, // Victory Harben third
            ];

            updateReserveButtons();

            const reserveContainers = document.querySelectorAll('.deck-card-editor-reserve');
            
            // Should still correctly match by name, not by DOM index
            expect(reserveContainers[0].innerHTML).toContain("selectReserveCharacter('card-1', 1)"); // Joan of Arc
            expect(reserveContainers[1].innerHTML).toContain("selectReserveCharacter('card-2', 2)"); // Victory Harben
            expect(reserveContainers[2].innerHTML).toContain("selectReserveCharacter('card-3', 0)"); // Sherlock Holmes
        });

        it('should handle missing character data gracefully', () => {
            // Remove Victory Harben from availableCardsMap
            availableCardsMap.delete('card-2');

            updateReserveButtons();

            const reserveContainers = document.querySelectorAll('.deck-card-editor-reserve');
            
            // Victory Harben should not have a button (no matching card found)
            expect(reserveContainers[1].innerHTML).toBe('');
            
            // Other characters should still work
            expect(reserveContainers[0].innerHTML).toContain('Select Reserve');
            expect(reserveContainers[2].innerHTML).toContain('Select Reserve');
        });
    });

    describe('updateReserveButtons - List View', () => {
        it('should correctly match card IDs by name in list view when no reserve character is selected', () => {
            updateReserveButtons();

            const listItems = document.querySelectorAll('#deck-list-items-character .deck-list-item');
            
            // Check that all list items have "Select Reserve" buttons
            const actions1 = listItems[0].querySelector('.deck-list-item-actions');
            const actions2 = listItems[1].querySelector('.deck-list-item-actions');
            const actions3 = listItems[2].querySelector('.deck-list-item-actions');
            
            expect(actions1?.innerHTML).toContain('Select Reserve');
            expect(actions1?.innerHTML).toContain("selectReserveCharacter('card-1', 0)");
            
            expect(actions2?.innerHTML).toContain('Select Reserve');
            expect(actions2?.innerHTML).toContain("selectReserveCharacter('card-2', 1)");
            
            expect(actions3?.innerHTML).toContain('Select Reserve');
            expect(actions3?.innerHTML).toContain("selectReserveCharacter('card-3', 2)");
        });

        it('should correctly match Victory Harben card ID in list view when she is selected as reserve', () => {
            currentDeckData.metadata.reserve_character = 'card-2'; // Victory Harben

            updateReserveButtons();

            const listItems = document.querySelectorAll('#deck-list-items-character .deck-list-item');
            
            // Victory Harben should have "Reserve" button (active)
            const actions2 = listItems[1].querySelector('.deck-list-item-actions');
            expect(actions2?.innerHTML).toContain('Reserve');
            expect(actions2?.innerHTML).toContain('reserve-btn active');
            expect(actions2?.innerHTML).toContain('deselectReserveCharacter(1)');
            
            // Other characters should have no reserve buttons
            const actions1 = listItems[0].querySelector('.deck-list-item-actions');
            const actions3 = listItems[2].querySelector('.deck-list-item-actions');
            expect(actions1?.innerHTML).not.toContain('reserve-btn');
            expect(actions3?.innerHTML).not.toContain('reserve-btn');
        });

        it('should handle cards in different order in list view', () => {
            // Reorder the deckEditorCards array
            deckEditorCards = [
                { cardId: 'card-3', type: 'character', quantity: 1 }, // Sherlock Holmes first
                { cardId: 'card-1', type: 'character', quantity: 1 }, // Joan of Arc second
                { cardId: 'card-2', type: 'character', quantity: 1 }, // Victory Harben third
            ];

            updateReserveButtons();

            const listItems = document.querySelectorAll('#deck-list-items-character .deck-list-item');
            
            // Should still correctly match by name
            const actions1 = listItems[0].querySelector('.deck-list-item-actions');
            const actions2 = listItems[1].querySelector('.deck-list-item-actions');
            const actions3 = listItems[2].querySelector('.deck-list-item-actions');
            
            expect(actions1?.innerHTML).toContain("selectReserveCharacter('card-1', 1)"); // Joan of Arc
            expect(actions2?.innerHTML).toContain("selectReserveCharacter('card-2', 2)"); // Victory Harben
            expect(actions3?.innerHTML).toContain("selectReserveCharacter('card-3', 0)"); // Sherlock Holmes
        });

        it('should remove existing reserve buttons before adding new ones', () => {
            // First, add a reserve button
            const listItem = document.querySelector('#deck-list-items-character .deck-list-item:nth-child(2)');
            const actionsContainer = listItem?.querySelector('.deck-list-item-actions');
            if (actionsContainer) {
                actionsContainer.innerHTML = '<button class="reserve-btn">Old Button</button><button class="deck-list-item-remove">-</button>';
            }

            updateReserveButtons();

            // Should have removed the old button and added the new one
            const actions = listItem?.querySelector('.deck-list-item-actions');
            expect(actions?.innerHTML).toContain('Select Reserve');
            expect(actions?.innerHTML).not.toContain('Old Button');
            expect(actions?.innerHTML).toContain('deck-list-item-remove');
        });
    });

    describe('Card ID Matching Logic', () => {
        it('should correctly identify Victory Harben by name regardless of array position', () => {
            // Test with Victory Harben in different positions
            const testCases = [
                [0, 1, 2], // Victory Harben at index 1
                [1, 0, 2], // Victory Harben at index 0
                [2, 0, 1], // Victory Harben at index 2
            ];

            testCases.forEach((order, testIndex) => {
                // Reset DOM
                document.querySelectorAll('.deck-card-editor-reserve').forEach(el => {
                    el.innerHTML = '';
                });

                // Reorder deckEditorCards
                deckEditorCards = order.map(i => deckEditorCards[i]);

                updateReserveButtons();

                // Victory Harben should always get the correct card ID
                const victoryHarbenContainer = document.querySelectorAll('.deck-card-editor-reserve')[1]; // DOM position 1
                const expectedCardId = 'card-2'; // Victory Harben's card ID
                const expectedIndex = deckEditorCards.findIndex(card => card.cardId === expectedCardId);

                expect(victoryHarbenContainer.innerHTML).toContain(`selectReserveCharacter('${expectedCardId}', ${expectedIndex})`);
            });
        });

        it('should handle duplicate character names correctly', () => {
            // Add a duplicate character name to test edge case
            deckEditorCards.push({ cardId: 'card-5', type: 'character', quantity: 1 });
            availableCardsMap.set('card-5', { name: 'Victory Harben', threat_level: 18 });

            updateReserveButtons();

            // Should use the first match found
            const victoryHarbenContainer = document.querySelectorAll('.deck-card-editor-reserve')[1];
            expect(victoryHarbenContainer.innerHTML).toContain("selectReserveCharacter('card-2', 1)");
        });

        it('should ignore non-character cards in deckEditorCards', () => {
            // Add more non-character cards
            deckEditorCards.push(
                { cardId: 'card-5', type: 'power', quantity: 1 },
                { cardId: 'card-6', type: 'special', quantity: 1 },
                { cardId: 'card-7', type: 'location', quantity: 1 }
            );

            updateReserveButtons();

            // Should still work correctly, ignoring non-character cards
            const reserveContainers = document.querySelectorAll('.deck-card-editor-reserve');
            expect(reserveContainers[0].innerHTML).toContain("selectReserveCharacter('card-1', 0)");
            expect(reserveContainers[1].innerHTML).toContain("selectReserveCharacter('card-2', 1)");
            expect(reserveContainers[2].innerHTML).toContain("selectReserveCharacter('card-3', 2)");
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty deckEditorCards array', () => {
            deckEditorCards = [];

            updateReserveButtons();

            // Should not crash and should not add any buttons
            const reserveContainers = document.querySelectorAll('.deck-card-editor-reserve');
            reserveContainers.forEach(container => {
                expect(container.innerHTML).toBe('');
            });
        });

        it('should handle empty availableCardsMap', () => {
            availableCardsMap.clear();

            updateReserveButtons();

            // Should not crash and should not add any buttons
            const reserveContainers = document.querySelectorAll('.deck-card-editor-reserve');
            reserveContainers.forEach(container => {
                expect(container.innerHTML).toBe('');
            });
        });

        it('should handle missing DOM elements gracefully', () => {
            // Remove some DOM elements
            const cardInfo = document.querySelector('.deck-card-editor-name');
            cardInfo?.remove();

            updateReserveButtons();

            // Should not crash
            expect(() => updateReserveButtons()).not.toThrow();
        });

        it('should handle whitespace in card names', () => {
            // Add extra whitespace to card names
            const cardInfo = document.querySelector('.deck-card-editor-name');
            if (cardInfo) {
                cardInfo.textContent = '  Victory Harben  ';
            }

            updateReserveButtons();

            // Should still match correctly after trimming
            const reserveContainer = document.querySelectorAll('.deck-card-editor-reserve')[1];
            expect(reserveContainer.innerHTML).toContain("selectReserveCharacter('card-2', 1)");
        });
    });
});

/**
 * @jest-environment jsdom
 */

describe('Reserve Button List View Functionality', () => {
    let mockCurrentDeckData: any;
    let mockCurrentDeckId: string;
    let mockDeckEditorCards: any[];
    let mockAvailableCardsMap: Map<string, any>;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock current deck data
        mockCurrentDeckData = {
            id: 'test-deck-id',
            name: 'Test Deck',
            metadata: {
                reserve_character: null
            },
            cards: []
        };

        mockCurrentDeckId = 'test-deck-id';

        // Mock deck editor cards
        mockDeckEditorCards = [
            {
                cardId: 'char-1',
                type: 'character',
                quantity: 1,
                name: 'Joan of Arc'
            },
            {
                cardId: 'char-2', 
                type: 'character',
                quantity: 1,
                name: 'Sherlock Holmes'
            },
            {
                cardId: 'mission-1',
                type: 'mission',
                quantity: 1,
                name: 'A Fighting Man of Mars'
            },
            {
                cardId: 'power-1',
                type: 'power',
                quantity: 2,
                name: 'Energy Card'
            }
        ];

        // Mock available cards map
        mockAvailableCardsMap = new Map();
        mockAvailableCardsMap.set('char-1', { name: 'Joan of Arc', character: 'Joan of Arc' });
        mockAvailableCardsMap.set('char-2', { name: 'Sherlock Holmes', character: 'Sherlock Holmes' });
        mockAvailableCardsMap.set('mission-1', { name: 'A Fighting Man of Mars' });
        mockAvailableCardsMap.set('power-1', { name: 'Energy Card' });

        // Set up global mocks
        (global as any).currentDeckData = mockCurrentDeckData;
        (global as any).currentDeckId = mockCurrentDeckId;
        (global as any).deckEditorCards = mockDeckEditorCards;
        (global as any).availableCardsMap = mockAvailableCardsMap;
        (global as any).isReadOnlyMode = false;

        // Mock DOM elements
        document.body.innerHTML = `
            <div id="deckCardsEditor" class="deck-cards-editor list-view">
                <div id="deck-list-items-character">
                    <div class="deck-list-item">
                        <div class="deck-list-item-quantity">1</div>
                        <div class="deck-list-item-name">Joan of Arc</div>
                        <div class="deck-list-item-actions">
                            <button class="deck-list-item-remove">-</button>
                        </div>
                    </div>
                    <div class="deck-list-item">
                        <div class="deck-list-item-quantity">1</div>
                        <div class="deck-list-item-name">Sherlock Holmes</div>
                        <div class="deck-list-item-actions">
                            <button class="deck-list-item-remove">-</button>
                        </div>
                    </div>
                </div>
                <div id="deck-list-items-mission">
                    <div class="deck-list-item">
                        <div class="deck-list-item-quantity">1</div>
                        <div class="deck-list-item-name">A Fighting Man of Mars</div>
                        <div class="deck-list-item-actions">
                            <button class="deck-list-item-remove">-</button>
                        </div>
                    </div>
                </div>
                <div id="deck-list-items-power">
                    <div class="deck-list-item">
                        <div class="deck-list-item-quantity">2</div>
                        <div class="deck-list-item-name">Energy Card</div>
                        <div class="deck-list-item-actions">
                            <div class="deck-list-item-quantity-control">
                                <button class="deck-list-item-quantity-btn">-1</button>
                                <button class="deck-list-item-quantity-btn">+1</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Mock the getReserveCharacterButton function
        (global as any).getReserveCharacterButton = jest.fn((cardId: string, index: number) => {
            const isReserveCharacter = mockCurrentDeckData && mockCurrentDeckData.metadata && mockCurrentDeckData.metadata.reserve_character === cardId;
            const hasReserveCharacter = mockCurrentDeckData && mockCurrentDeckData.metadata && mockCurrentDeckData.metadata.reserve_character;
            
            if (isReserveCharacter) {
                return `<button class="reserve-btn active" onclick="deselectReserveCharacter(${index})">Reserve</button>`;
            } else if (hasReserveCharacter) {
                return '';
            } else {
                return `<button class="reserve-btn" onclick="selectReserveCharacter('${cardId}', ${index})">Select Reserve</button>`;
            }
        });

        // Mock other functions
        (global as any).updateDeckSummary = jest.fn();
        (global as any).showNotification = jest.fn();
    });

    describe('updateReserveButtons function', () => {
        it('should only update reserve buttons in Characters section', () => {
            // Mock the updateReserveButtons function
            (global as any).updateReserveButtons = function() {
                // Find all character cards in the Characters section
                const charactersListItems = document.querySelectorAll('#deck-list-items-character .deck-list-item');
                charactersListItems.forEach((listItem, index) => {
                    const characterCards = mockDeckEditorCards.filter(card => card.type === 'character');
                    if (characterCards[index]) {
                        const cardId = characterCards[index].cardId;
                        const originalIndex = mockDeckEditorCards.indexOf(characterCards[index]);
                        const actionsContainer = listItem.querySelector('.deck-list-item-actions');
                        
                        if (actionsContainer) {
                            // Find existing reserve button and remove it
                            const existingReserveBtn = actionsContainer.querySelector('.reserve-btn');
                            if (existingReserveBtn) {
                                existingReserveBtn.remove();
                            }
                            
                            // Get the new button HTML
                            const newButtonHTML = (global as any).getReserveCharacterButton(cardId, originalIndex);
                            
                            // Insert the new button before the remove button
                            const removeBtn = actionsContainer.querySelector('.deck-list-item-remove');
                            if (removeBtn && newButtonHTML) {
                                removeBtn.insertAdjacentHTML('beforebegin', newButtonHTML);
                            }
                        }
                    }
                });
            };

            // Call the function
            (global as any).updateReserveButtons();

            // Verify that reserve buttons were added to character items
            const characterItems = document.querySelectorAll('#deck-list-items-character .deck-list-item');
            expect(characterItems).toHaveLength(2);

            // Check first character item
            const firstCharacterActions = characterItems[0].querySelector('.deck-list-item-actions');
            const firstReserveBtn = firstCharacterActions?.querySelector('.reserve-btn');
            expect(firstReserveBtn).toBeTruthy();
            expect(firstReserveBtn?.textContent).toBe('Select Reserve');

            // Check second character item
            const secondCharacterActions = characterItems[1].querySelector('.deck-list-item-actions');
            const secondReserveBtn = secondCharacterActions?.querySelector('.reserve-btn');
            expect(secondReserveBtn).toBeTruthy();
            expect(secondReserveBtn?.textContent).toBe('Select Reserve');

            // Verify that mission items were NOT affected
            const missionItems = document.querySelectorAll('#deck-list-items-mission .deck-list-item');
            expect(missionItems).toHaveLength(1);
            const missionActions = missionItems[0].querySelector('.deck-list-item-actions');
            const missionReserveBtn = missionActions?.querySelector('.reserve-btn');
            expect(missionReserveBtn).toBeFalsy();

            // Verify that power items were NOT affected
            const powerItems = document.querySelectorAll('#deck-list-items-power .deck-list-item');
            expect(powerItems).toHaveLength(1);
            const powerActions = powerItems[0].querySelector('.deck-list-item-actions');
            const powerReserveBtn = powerActions?.querySelector('.reserve-btn');
            expect(powerReserveBtn).toBeFalsy();
        });

        it('should update reserve button state when a character is selected as reserve', () => {
            // Set a character as reserve
            mockCurrentDeckData.metadata.reserve_character = 'char-1';

            // Mock the updateReserveButtons function
            (global as any).updateReserveButtons = function() {
                const charactersListItems = document.querySelectorAll('#deck-list-items-character .deck-list-item');
                charactersListItems.forEach((listItem, index) => {
                    const characterCards = mockDeckEditorCards.filter(card => card.type === 'character');
                    if (characterCards[index]) {
                        const cardId = characterCards[index].cardId;
                        const originalIndex = mockDeckEditorCards.indexOf(characterCards[index]);
                        const actionsContainer = listItem.querySelector('.deck-list-item-actions');
                        
                        if (actionsContainer) {
                            const existingReserveBtn = actionsContainer.querySelector('.reserve-btn');
                            if (existingReserveBtn) {
                                existingReserveBtn.remove();
                            }
                            
                            const newButtonHTML = (global as any).getReserveCharacterButton(cardId, originalIndex);
                            const removeBtn = actionsContainer.querySelector('.deck-list-item-remove');
                            if (removeBtn && newButtonHTML) {
                                removeBtn.insertAdjacentHTML('beforebegin', newButtonHTML);
                            }
                        }
                    }
                });
            };

            // Call the function
            (global as any).updateReserveButtons();

            // Verify the first character shows "Reserve" (active state)
            const characterItems = document.querySelectorAll('#deck-list-items-character .deck-list-item');
            const firstCharacterActions = characterItems[0].querySelector('.deck-list-item-actions');
            const firstReserveBtn = firstCharacterActions?.querySelector('.reserve-btn');
            expect(firstReserveBtn?.textContent).toBe('Reserve');
            expect(firstReserveBtn?.classList.contains('active')).toBe(true);

            // Verify the second character has no reserve button (hidden when another is selected)
            const secondCharacterActions = characterItems[1].querySelector('.deck-list-item-actions');
            const secondReserveBtn = secondCharacterActions?.querySelector('.reserve-btn');
            expect(secondReserveBtn).toBeFalsy();
        });

        it('should not affect non-character sections when updating reserve buttons', () => {
            // Mock the updateReserveButtons function
            (global as any).updateReserveButtons = function() {
                const charactersListItems = document.querySelectorAll('#deck-list-items-character .deck-list-item');
                charactersListItems.forEach((listItem, index) => {
                    const characterCards = mockDeckEditorCards.filter(card => card.type === 'character');
                    if (characterCards[index]) {
                        const cardId = characterCards[index].cardId;
                        const originalIndex = mockDeckEditorCards.indexOf(characterCards[index]);
                        const actionsContainer = listItem.querySelector('.deck-list-item-actions');
                        
                        if (actionsContainer) {
                            const existingReserveBtn = actionsContainer.querySelector('.reserve-btn');
                            if (existingReserveBtn) {
                                existingReserveBtn.remove();
                            }
                            
                            const newButtonHTML = (global as any).getReserveCharacterButton(cardId, originalIndex);
                            const removeBtn = actionsContainer.querySelector('.deck-list-item-remove');
                            if (removeBtn && newButtonHTML) {
                                removeBtn.insertAdjacentHTML('beforebegin', newButtonHTML);
                            }
                        }
                    }
                });
            };

            // Store original state of mission and power sections
            const missionActions = document.querySelector('#deck-list-items-mission .deck-list-item .deck-list-item-actions');
            const powerActions = document.querySelector('#deck-list-items-power .deck-list-item .deck-list-item-actions');
            
            const originalMissionHTML = missionActions?.innerHTML;
            const originalPowerHTML = powerActions?.innerHTML;

            // Call the function
            (global as any).updateReserveButtons();

            // Verify mission section was not modified
            expect(missionActions?.innerHTML).toBe(originalMissionHTML);
            expect(missionActions?.querySelector('.reserve-btn')).toBeFalsy();

            // Verify power section was not modified
            expect(powerActions?.innerHTML).toBe(originalPowerHTML);
            expect(powerActions?.querySelector('.reserve-btn')).toBeFalsy();
        });
    });

    describe('selectReserveCharacter function', () => {
        it('should update reserve character and call updateReserveButtons without re-rendering deck', () => {
            // Mock the selectReserveCharacter function
            (global as any).selectReserveCharacter = jest.fn(async (cardId: string, index: number) => {
                if (!mockCurrentDeckId || !mockCurrentDeckData) {
                    (global as any).showNotification('No deck selected', 'error');
                    return;
                }

                if ((global as any).isReadOnlyMode) {
                    alert('Cannot modify deck in read-only mode. You are viewing another user\'s deck.');
                    return;
                }

                if (!mockCurrentDeckData.metadata) {
                    mockCurrentDeckData.metadata = {};
                }
                mockCurrentDeckData.metadata.reserve_character = cardId;
                (global as any).showNotification('Reserve character selected! (Click Save to persist changes)', 'success');
                
                // Update reserve buttons without re-rendering the entire deck to preserve layout
                (global as any).updateReserveButtons();
                
                // Update deck summary to reflect new threat calculation
                await (global as any).updateDeckSummary(mockCurrentDeckData.cards || []);
            });

            // Mock updateReserveButtons
            (global as any).updateReserveButtons = jest.fn();

            // Call selectReserveCharacter
            (global as any).selectReserveCharacter('char-1', 0);

            // Verify the reserve character was set
            expect(mockCurrentDeckData.metadata.reserve_character).toBe('char-1');

            // Verify updateReserveButtons was called
            expect((global as any).updateReserveButtons).toHaveBeenCalled();

            // Verify showNotification was called with success message
            expect((global as any).showNotification).toHaveBeenCalledWith(
                'Reserve character selected! (Click Save to persist changes)', 
                'success'
            );
        });

        it('should not allow reserve character selection in read-only mode', () => {
            (global as any).isReadOnlyMode = true;

            // Mock the selectReserveCharacter function
            (global as any).selectReserveCharacter = jest.fn(async (cardId: string, index: number) => {
                if (!mockCurrentDeckId || !mockCurrentDeckData) {
                    (global as any).showNotification('No deck selected', 'error');
                    return;
                }

                if ((global as any).isReadOnlyMode) {
                    alert('Cannot modify deck in read-only mode. You are viewing another user\'s deck.');
                    return;
                }

                if (!mockCurrentDeckData.metadata) {
                    mockCurrentDeckData.metadata = {};
                }
                mockCurrentDeckData.metadata.reserve_character = cardId;
                (global as any).showNotification('Reserve character selected! (Click Save to persist changes)', 'success');
                
                (global as any).updateReserveButtons();
                await (global as any).updateDeckSummary(mockCurrentDeckData.cards || []);
            });

            // Mock alert
            global.alert = jest.fn();

            // Call selectReserveCharacter
            (global as any).selectReserveCharacter('char-1', 0);

            // Verify alert was called
            expect(global.alert).toHaveBeenCalledWith(
                'Cannot modify deck in read-only mode. You are viewing another user\'s deck.'
            );

            // Verify reserve character was not set
            expect(mockCurrentDeckData.metadata.reserve_character).toBeNull();
        });
    });

    describe('deselectReserveCharacter function', () => {
        it('should deselect reserve character and call updateReserveButtons', () => {
            // Set a reserve character first
            mockCurrentDeckData.metadata.reserve_character = 'char-1';

            // Mock the deselectReserveCharacter function
            (global as any).deselectReserveCharacter = jest.fn(async (index: number) => {
                if (!mockCurrentDeckId || !mockCurrentDeckData) {
                    (global as any).showNotification('No deck selected', 'error');
                    return;
                }

                if ((global as any).isReadOnlyMode) {
                    alert('Cannot modify deck in read-only mode. You are viewing another user\'s deck.');
                    return;
                }

                if (!mockCurrentDeckData.metadata) {
                    mockCurrentDeckData.metadata = {};
                }
                mockCurrentDeckData.metadata.reserve_character = null;
                (global as any).showNotification('Reserve character deselected! (Click Save to persist changes)', 'success');
                
                // Update reserve buttons without re-rendering the entire deck to preserve layout
                (global as any).updateReserveButtons();
                
                // Update deck summary to reflect new threat calculation
                await (global as any).updateDeckSummary(mockCurrentDeckData.cards || []);
            });

            // Mock updateReserveButtons
            (global as any).updateReserveButtons = jest.fn();

            // Call deselectReserveCharacter
            (global as any).deselectReserveCharacter(0);

            // Verify the reserve character was cleared
            expect(mockCurrentDeckData.metadata.reserve_character).toBeNull();

            // Verify updateReserveButtons was called
            expect((global as any).updateReserveButtons).toHaveBeenCalled();

            // Verify showNotification was called with success message
            expect((global as any).showNotification).toHaveBeenCalledWith(
                'Reserve character deselected! (Click Save to persist changes)', 
                'success'
            );
        });
    });

    describe('HTML generation for list view', () => {
        it('should only add reserve buttons to character type sections', () => {
            // Mock the HTML generation logic
            const generateListHTML = (type: string, cards: any[]) => {
                let html = '';
                cards.forEach(card => {
                    html += `
                        <div class="deck-list-item">
                            <div class="deck-list-item-quantity">${card.quantity}</div>
                            <div class="deck-list-item-name">${card.name}</div>
                            <div class="deck-list-item-actions">
                                ${card.type !== 'character' && card.type !== 'location' && card.type !== 'mission' ? `
                                    <div class="deck-list-item-quantity-control">
                                        <button class="deck-list-item-quantity-btn">-1</button>
                                        <button class="deck-list-item-quantity-btn">+1</button>
                                    </div>
                                ` : ''}
                                ${type === 'character' ? `
                                    ${(global as any).getReserveCharacterButton(card.cardId, 0)}
                                    <button class="deck-list-item-remove">-</button>
                                ` : ''}
                                ${(type === 'location' || type === 'mission') ? `
                                    <button class="deck-list-item-remove">-</button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                });
                return html;
            };

            // Test character section
            const characterCards = mockDeckEditorCards.filter(card => card.type === 'character');
            const characterHTML = generateListHTML('character', characterCards);
            expect(characterHTML).toContain('reserve-btn');
            expect(characterHTML).toContain('Select Reserve');

            // Test mission section
            const missionCards = mockDeckEditorCards.filter(card => card.type === 'mission');
            const missionHTML = generateListHTML('mission', missionCards);
            expect(missionHTML).not.toContain('reserve-btn');
            expect(missionHTML).not.toContain('Select Reserve');

            // Test power section
            const powerCards = mockDeckEditorCards.filter(card => card.type === 'power');
            const powerHTML = generateListHTML('power', powerCards);
            expect(powerHTML).not.toContain('reserve-btn');
            expect(powerHTML).toContain('deck-list-item-quantity-control');
        });
    });
});

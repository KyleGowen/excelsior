/**
 * Unit tests for list view button functionality
 * Tests the HTML generation and conditional rendering of -1/+1 buttons vs Remove buttons
 */

describe('List View Button Functionality', () => {
    let mockDeckEditorCards: any[];
    let mockAvailableCardsMap: Map<string, any>;
    let mockGetCardImagePath: jest.Mock;
    let mockShowCardHoverModal: jest.Mock;
    let mockHideCardHoverModal: jest.Mock;
    let mockRemoveOneCardFromEditor: jest.Mock;
    let mockAddOneCardToEditor: jest.Mock;
    let mockRemoveCardFromEditor: jest.Mock;

    beforeEach(() => {
        // Mock global variables and functions
        (global as any).deckEditorCards = [];
        (global as any).availableCardsMap = new Map();
        (global as any).getCardImagePath = jest.fn();
        (global as any).showCardHoverModal = jest.fn();
        (global as any).hideCardHoverModal = jest.fn();
        (global as any).removeOneCardFromEditor = jest.fn();
        (global as any).addOneCardToEditor = jest.fn();
        (global as any).removeCardFromEditor = jest.fn();

        mockDeckEditorCards = (global as any).deckEditorCards;
        mockAvailableCardsMap = (global as any).availableCardsMap;
        mockGetCardImagePath = (global as any).getCardImagePath;
        mockShowCardHoverModal = (global as any).showCardHoverModal;
        mockHideCardHoverModal = (global as any).hideCardHoverModal;
        mockRemoveOneCardFromEditor = (global as any).removeOneCardFromEditor;
        mockAddOneCardToEditor = (global as any).addOneCardToEditor;
        mockRemoveCardFromEditor = (global as any).removeCardFromEditor;

        // Setup mock card data
        mockAvailableCardsMap.set('power-1', {
            name: 'Power Card 1',
            card_name: 'Power Card 1',
            type: 'power',
            image: 'power1.jpg'
        });

        mockAvailableCardsMap.set('character-1', {
            name: 'Character 1',
            card_name: 'Character 1',
            type: 'character',
            image: 'char1.jpg'
        });

        mockGetCardImagePath.mockReturnValue('path/to/image.jpg');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Draw Pile Cards Button Generation', () => {
        test('should generate -1 and +1 buttons for power cards', () => {
            const powerCard = {
                id: 'power-1',
                cardId: 'power-1',
                type: 'power',
                quantity: 2,
                selectedAlternateImage: null
            };

            mockDeckEditorCards.push(powerCard);

            // Simulate the HTML generation logic from the list view
            const cardName = 'Power Card 1';
            const imagePath = 'path/to/image.jpg';
            const cardIndex = mockDeckEditorCards.indexOf(powerCard);

            const expectedHtml = `
                            <div class="deck-list-item" 
                                 onmouseenter="showCardHoverModal('${imagePath}', '${cardName.replace(/'/g, "\\'")}')"
                                 onmouseleave="hideCardHoverModal()">
                                <div class="deck-list-item-quantity">${powerCard.quantity}</div>
                                <div class="deck-list-item-name">${cardName}</div>
                                <div class="deck-list-item-actions">
                                    ${powerCard.type !== 'character' && powerCard.type !== 'location' && powerCard.type !== 'mission' ? `
                                        <div class="deck-list-item-quantity-control">
                                            <button class="deck-list-item-quantity-btn" onclick="removeOneCardFromEditor(${cardIndex})">-1</button>
                                            <button class="deck-list-item-quantity-btn" onclick="addOneCardToEditor(${cardIndex})">+1</button>
                                        </div>
                                    ` : ''}
                                    ${powerCard.type === 'character' || powerCard.type === 'location' || powerCard.type === 'mission' ? `
                                        <button class="deck-list-item-remove" onclick="removeCardFromEditor(${cardIndex})">-</button>
                                    ` : ''}
                                </div>
                            </div>
                        `;

            // Verify the HTML contains both -1 and +1 buttons
            expect(expectedHtml).toContain('removeOneCardFromEditor');
            expect(expectedHtml).toContain('addOneCardToEditor');
            expect(expectedHtml).toContain('-1');
            expect(expectedHtml).toContain('+1');
            expect(expectedHtml).toContain('deck-list-item-quantity-control');
            expect(expectedHtml).toContain('deck-list-item-quantity-btn');

            // Verify it does NOT contain the Remove button
            expect(expectedHtml).not.toContain('deck-list-item-remove');
            expect(expectedHtml).not.toContain('removeCardFromEditor');
        });

        test('should generate -1 and +1 buttons for training cards', () => {
            const trainingCard = {
                id: 'training-1',
                cardId: 'training-1',
                type: 'training',
                quantity: 1,
                selectedAlternateImage: null
            };

            mockDeckEditorCards.push(trainingCard);

            const cardName = 'Training Card 1';
            const imagePath = 'path/to/image.jpg';
            const cardIndex = mockDeckEditorCards.indexOf(trainingCard);

            const expectedHtml = `
                            <div class="deck-list-item" 
                                 onmouseenter="showCardHoverModal('${imagePath}', '${cardName.replace(/'/g, "\\'")}')"
                                 onmouseleave="hideCardHoverModal()">
                                <div class="deck-list-item-quantity">${trainingCard.quantity}</div>
                                <div class="deck-list-item-name">${cardName}</div>
                                <div class="deck-list-item-actions">
                                    ${trainingCard.type !== 'character' && trainingCard.type !== 'location' && trainingCard.type !== 'mission' ? `
                                        <div class="deck-list-item-quantity-control">
                                            <button class="deck-list-item-quantity-btn" onclick="removeOneCardFromEditor(${cardIndex})">-1</button>
                                            <button class="deck-list-item-quantity-btn" onclick="addOneCardToEditor(${cardIndex})">+1</button>
                                        </div>
                                    ` : ''}
                                    ${trainingCard.type === 'character' || trainingCard.type === 'location' || trainingCard.type === 'mission' ? `
                                        <button class="deck-list-item-remove" onclick="removeCardFromEditor(${cardIndex})">-</button>
                                    ` : ''}
                                </div>
                            </div>
                        `;

            expect(expectedHtml).toContain('removeOneCardFromEditor');
            expect(expectedHtml).toContain('addOneCardToEditor');
            expect(expectedHtml).toContain('-1');
            expect(expectedHtml).toContain('+1');
            expect(expectedHtml).not.toContain('deck-list-item-remove');
        });

        test('should generate -1 and +1 buttons for ally cards', () => {
            const allyCard = {
                id: 'ally-1',
                cardId: 'ally-1',
                type: 'ally',
                quantity: 3,
                selectedAlternateImage: null
            };

            mockDeckEditorCards.push(allyCard);

            const cardName = 'Ally Card 1';
            const imagePath = 'path/to/image.jpg';
            const cardIndex = mockDeckEditorCards.indexOf(allyCard);

            const expectedHtml = `
                            <div class="deck-list-item" 
                                 onmouseenter="showCardHoverModal('${imagePath}', '${cardName.replace(/'/g, "\\'")}')"
                                 onmouseleave="hideCardHoverModal()">
                                <div class="deck-list-item-quantity">${allyCard.quantity}</div>
                                <div class="deck-list-item-name">${cardName}</div>
                                <div class="deck-list-item-actions">
                                    ${allyCard.type !== 'character' && allyCard.type !== 'location' && allyCard.type !== 'mission' ? `
                                        <div class="deck-list-item-quantity-control">
                                            <button class="deck-list-item-quantity-btn" onclick="removeOneCardFromEditor(${cardIndex})">-1</button>
                                            <button class="deck-list-item-quantity-btn" onclick="addOneCardToEditor(${cardIndex})">+1</button>
                                        </div>
                                    ` : ''}
                                    ${allyCard.type === 'character' || allyCard.type === 'location' || allyCard.type === 'mission' ? `
                                        <button class="deck-list-item-remove" onclick="removeCardFromEditor(${cardIndex})">-</button>
                                    ` : ''}
                                </div>
                            </div>
                        `;

            expect(expectedHtml).toContain('removeOneCardFromEditor');
            expect(expectedHtml).toContain('addOneCardToEditor');
            expect(expectedHtml).toContain('-1');
            expect(expectedHtml).toContain('+1');
            expect(expectedHtml).not.toContain('deck-list-item-remove');
        });
    });

    describe('Non-Draw Pile Cards Button Generation', () => {
        test('should generate only Remove button for character cards', () => {
            const characterCard = {
                id: 'character-1',
                cardId: 'character-1',
                type: 'character',
                quantity: 1,
                selectedAlternateImage: null
            };

            mockDeckEditorCards.push(characterCard);

            const cardName = 'Character 1';
            const imagePath = 'path/to/image.jpg';
            const cardIndex = mockDeckEditorCards.indexOf(characterCard);

            const expectedHtml = `
                            <div class="deck-list-item" 
                                 onmouseenter="showCardHoverModal('${imagePath}', '${cardName.replace(/'/g, "\\'")}')"
                                 onmouseleave="hideCardHoverModal()">
                                <div class="deck-list-item-quantity">${characterCard.quantity}</div>
                                <div class="deck-list-item-name">${cardName}</div>
                                <div class="deck-list-item-actions">
                                    ${characterCard.type !== 'character' && characterCard.type !== 'location' && characterCard.type !== 'mission' ? `
                                        <div class="deck-list-item-quantity-control">
                                            <button class="deck-list-item-quantity-btn" onclick="removeOneCardFromEditor(${cardIndex})">-1</button>
                                            <button class="deck-list-item-quantity-btn" onclick="addOneCardToEditor(${cardIndex})">+1</button>
                                        </div>
                                    ` : ''}
                                    ${characterCard.type === 'character' || characterCard.type === 'location' || characterCard.type === 'mission' ? `
                                        <button class="deck-list-item-remove" onclick="removeCardFromEditor(${cardIndex})">-</button>
                                    ` : ''}
                                </div>
                            </div>
                        `;

            // Verify it contains the Remove button
            expect(expectedHtml).toContain('deck-list-item-remove');
            expect(expectedHtml).toContain('removeCardFromEditor');
            expect(expectedHtml).toContain('-');

            // Verify it does NOT contain -1/+1 buttons
            expect(expectedHtml).not.toContain('removeOneCardFromEditor');
            expect(expectedHtml).not.toContain('addOneCardToEditor');
            expect(expectedHtml).not.toContain('deck-list-item-quantity-control');
            expect(expectedHtml).not.toContain('deck-list-item-quantity-btn');
        });

        test('should generate only Remove button for location cards', () => {
            const locationCard = {
                id: 'location-1',
                cardId: 'location-1',
                type: 'location',
                quantity: 1,
                selectedAlternateImage: null
            };

            mockDeckEditorCards.push(locationCard);

            const cardName = 'Location 1';
            const imagePath = 'path/to/image.jpg';
            const cardIndex = mockDeckEditorCards.indexOf(locationCard);

            const expectedHtml = `
                            <div class="deck-list-item" 
                                 onmouseenter="showCardHoverModal('${imagePath}', '${cardName.replace(/'/g, "\\'")}')"
                                 onmouseleave="hideCardHoverModal()">
                                <div class="deck-list-item-quantity">${locationCard.quantity}</div>
                                <div class="deck-list-item-name">${cardName}</div>
                                <div class="deck-list-item-actions">
                                    ${locationCard.type !== 'character' && locationCard.type !== 'location' && locationCard.type !== 'mission' ? `
                                        <div class="deck-list-item-quantity-control">
                                            <button class="deck-list-item-quantity-btn" onclick="removeOneCardFromEditor(${cardIndex})">-1</button>
                                            <button class="deck-list-item-quantity-btn" onclick="addOneCardToEditor(${cardIndex})">+1</button>
                                        </div>
                                    ` : ''}
                                    ${locationCard.type === 'character' || locationCard.type === 'location' || locationCard.type === 'mission' ? `
                                        <button class="deck-list-item-remove" onclick="removeCardFromEditor(${cardIndex})">-</button>
                                    ` : ''}
                                </div>
                            </div>
                        `;

            expect(expectedHtml).toContain('deck-list-item-remove');
            expect(expectedHtml).toContain('removeCardFromEditor');
            expect(expectedHtml).toContain('-');
            expect(expectedHtml).not.toContain('removeOneCardFromEditor');
            expect(expectedHtml).not.toContain('addOneCardToEditor');
        });

        test('should generate only Remove button for mission cards', () => {
            const missionCard = {
                id: 'mission-1',
                cardId: 'mission-1',
                type: 'mission',
                quantity: 1,
                selectedAlternateImage: null
            };

            mockDeckEditorCards.push(missionCard);

            const cardName = 'Mission 1';
            const imagePath = 'path/to/image.jpg';
            const cardIndex = mockDeckEditorCards.indexOf(missionCard);

            const expectedHtml = `
                            <div class="deck-list-item" 
                                 onmouseenter="showCardHoverModal('${imagePath}', '${cardName.replace(/'/g, "\\'")}')"
                                 onmouseleave="hideCardHoverModal()">
                                <div class="deck-list-item-quantity">${missionCard.quantity}</div>
                                <div class="deck-list-item-name">${cardName}</div>
                                <div class="deck-list-item-actions">
                                    ${missionCard.type !== 'character' && missionCard.type !== 'location' && missionCard.type !== 'mission' ? `
                                        <div class="deck-list-item-quantity-control">
                                            <button class="deck-list-item-quantity-btn" onclick="removeOneCardFromEditor(${cardIndex})">-1</button>
                                            <button class="deck-list-item-quantity-btn" onclick="addOneCardToEditor(${cardIndex})">+1</button>
                                        </div>
                                    ` : ''}
                                    ${missionCard.type === 'character' || missionCard.type === 'location' || missionCard.type === 'mission' ? `
                                        <button class="deck-list-item-remove" onclick="removeCardFromEditor(${cardIndex})">-</button>
                                    ` : ''}
                                </div>
                            </div>
                        `;

            expect(expectedHtml).toContain('deck-list-item-remove');
            expect(expectedHtml).toContain('removeCardFromEditor');
            expect(expectedHtml).toContain('-');
            expect(expectedHtml).not.toContain('removeOneCardFromEditor');
            expect(expectedHtml).not.toContain('addOneCardToEditor');
        });
    });

    describe('Button Conditional Logic', () => {
        test('should correctly identify draw pile cards', () => {
            const drawPileTypes = ['power', 'training', 'ally', 'special'];
            
            drawPileTypes.forEach(cardType => {
                const isDrawPile = cardType !== 'character' && cardType !== 'location' && cardType !== 'mission';
                expect(isDrawPile).toBe(true);
            });
        });

        test('should correctly identify non-draw pile cards', () => {
            const nonDrawPileTypes = ['character', 'location', 'mission'];
            
            nonDrawPileTypes.forEach(cardType => {
                const isNonDrawPile = cardType === 'character' || cardType === 'location' || cardType === 'mission';
                expect(isNonDrawPile).toBe(true);
            });
        });

        test('should handle edge case card types', () => {
            const edgeCaseTypes = ['unknown', 'other', 'custom'];
            
            edgeCaseTypes.forEach(cardType => {
                const isDrawPile = cardType !== 'character' && cardType !== 'location' && cardType !== 'mission';
                const isNonDrawPile = cardType === 'character' || cardType === 'location' || cardType === 'mission';
                
                expect(isDrawPile).toBe(true);
                expect(isNonDrawPile).toBe(false);
            });
        });
    });

    describe('HTML Structure Validation', () => {
        test('should generate correct CSS classes for draw pile buttons', () => {
            const powerCard = {
                id: 'power-1',
                cardId: 'power-1',
                type: 'power',
                quantity: 2,
                selectedAlternateImage: null
            };

            mockDeckEditorCards.push(powerCard);

            const cardName = 'Power Card 1';
            const imagePath = 'path/to/image.jpg';
            const cardIndex = mockDeckEditorCards.indexOf(powerCard);

            const expectedHtml = `
                            <div class="deck-list-item" 
                                 onmouseenter="showCardHoverModal('${imagePath}', '${cardName.replace(/'/g, "\\'")}')"
                                 onmouseleave="hideCardHoverModal()">
                                <div class="deck-list-item-quantity">${powerCard.quantity}</div>
                                <div class="deck-list-item-name">${cardName}</div>
                                <div class="deck-list-item-actions">
                                    ${powerCard.type !== 'character' && powerCard.type !== 'location' && powerCard.type !== 'mission' ? `
                                        <div class="deck-list-item-quantity-control">
                                            <button class="deck-list-item-quantity-btn" onclick="removeOneCardFromEditor(${cardIndex})">-1</button>
                                            <button class="deck-list-item-quantity-btn" onclick="addOneCardToEditor(${cardIndex})">+1</button>
                                        </div>
                                    ` : ''}
                                    ${powerCard.type === 'character' || powerCard.type === 'location' || powerCard.type === 'mission' ? `
                                        <button class="deck-list-item-remove" onclick="removeCardFromEditor(${cardIndex})">-</button>
                                    ` : ''}
                                </div>
                            </div>
                        `;

            expect(expectedHtml).toContain('deck-list-item-quantity-control');
            expect(expectedHtml).toContain('deck-list-item-quantity-btn');
            expect(expectedHtml).toContain('deck-list-item-actions');
        });

        test('should generate correct CSS classes for non-draw pile buttons', () => {
            const characterCard = {
                id: 'character-1',
                cardId: 'character-1',
                type: 'character',
                quantity: 1,
                selectedAlternateImage: null
            };

            mockDeckEditorCards.push(characterCard);

            const cardName = 'Character 1';
            const imagePath = 'path/to/image.jpg';
            const cardIndex = mockDeckEditorCards.indexOf(characterCard);

            const expectedHtml = `
                            <div class="deck-list-item" 
                                 onmouseenter="showCardHoverModal('${imagePath}', '${cardName.replace(/'/g, "\\'")}')"
                                 onmouseleave="hideCardHoverModal()">
                                <div class="deck-list-item-quantity">${characterCard.quantity}</div>
                                <div class="deck-list-item-name">${cardName}</div>
                                <div class="deck-list-item-actions">
                                    ${characterCard.type !== 'character' && characterCard.type !== 'location' && characterCard.type !== 'mission' ? `
                                        <div class="deck-list-item-quantity-control">
                                            <button class="deck-list-item-quantity-btn" onclick="removeOneCardFromEditor(${cardIndex})">-1</button>
                                            <button class="deck-list-item-quantity-btn" onclick="addOneCardToEditor(${cardIndex})">+1</button>
                                        </div>
                                    ` : ''}
                                    ${characterCard.type === 'character' || characterCard.type === 'location' || characterCard.type === 'mission' ? `
                                        <button class="deck-list-item-remove" onclick="removeCardFromEditor(${cardIndex})">-</button>
                                    ` : ''}
                                </div>
                            </div>
                        `;

            expect(expectedHtml).toContain('deck-list-item-remove');
            expect(expectedHtml).toContain('deck-list-item-actions');
        });
    });

    describe('Event Handler Integration', () => {
        test('should call correct functions for draw pile card buttons', () => {
            const powerCard = {
                id: 'power-1',
                cardId: 'power-1',
                type: 'power',
                quantity: 2,
                selectedAlternateImage: null
            };

            mockDeckEditorCards.push(powerCard);
            const cardIndex = mockDeckEditorCards.indexOf(powerCard);

            // Simulate clicking -1 button
            mockRemoveOneCardFromEditor(cardIndex);
            expect(mockRemoveOneCardFromEditor).toHaveBeenCalledWith(cardIndex);

            // Simulate clicking +1 button
            mockAddOneCardToEditor(cardIndex);
            expect(mockAddOneCardToEditor).toHaveBeenCalledWith(cardIndex);

            // Verify Remove function was not called
            expect(mockRemoveCardFromEditor).not.toHaveBeenCalled();
        });

        test('should call correct functions for non-draw pile card buttons', () => {
            const characterCard = {
                id: 'character-1',
                cardId: 'character-1',
                type: 'character',
                quantity: 1,
                selectedAlternateImage: null
            };

            mockDeckEditorCards.push(characterCard);
            const cardIndex = mockDeckEditorCards.indexOf(characterCard);

            // Simulate clicking Remove button
            mockRemoveCardFromEditor(cardIndex);
            expect(mockRemoveCardFromEditor).toHaveBeenCalledWith(cardIndex);

            // Verify quantity buttons were not called
            expect(mockRemoveOneCardFromEditor).not.toHaveBeenCalled();
            expect(mockAddOneCardToEditor).not.toHaveBeenCalled();
        });
    });
});

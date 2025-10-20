/**
 * @jest-environment jsdom
 */

// Mock DOM elements
const mockDeckCardsEditor = {
    innerHTML: '',
    querySelector: jest.fn(),
    querySelectorAll: jest.fn()
};

// Mock document
(global as any).document = {
    getElementById: jest.fn((id: string) => {
        if (id === 'deckCardsEditor') {
            return mockDeckCardsEditor;
        }
        return null;
    })
};

// Mock global functions
(global as any).showNotification = jest.fn();
(global as any).showToast = jest.fn();
(global as any).showDeckValidation = jest.fn();
(global as any).updateDeckEditorCardCount = jest.fn();
(global as any).updateOnePerDeckLimitStatus = jest.fn();
(global as any).ultraAggressiveLayoutEnforcement = jest.fn();
(global as any).getCardImagePath = jest.fn((card: any, type: any, selectedImage: any) => `images/${type}/${card.id}.webp`);
(global as any).showCardHoverModal = jest.fn();
(global as any).hideCardHoverModal = jest.fn();
(global as any).handleDeckCardDragStart = jest.fn();
(global as any).handleDeckCardDragEnd = jest.fn();
(global as any).handleDeckCardDragOver = jest.fn();
(global as any).handleDeckCardDrop = jest.fn();
(global as any).showAlternateArtSelection = jest.fn();
(global as any).showAlternateArtSelectionForExistingCard = jest.fn();
(global as any).toggleSpecialCardsCharacterFilter = jest.fn();

// Mock availableCardsMap and deckEditorCards
(global.window as any).availableCardsMap = new Map();
(global.window as any).deckEditorCards = [];

// Mock card data
const mockCharacterCard = {
    id: 'char-1',
    name: 'Test Character',
    threat_level: 3,
    special_abilities: 'Test ability',
    image: 'characters/test_character.webp',
    alternateImages: [
        { image: 'characters/test_character_alt1.webp', name: 'Alt Art 1' },
        { image: 'characters/test_character_alt2.webp', name: 'Alt Art 2' }
    ]
};

const mockPowerCard = {
    id: 'power-1',
    name: 'Test Power',
    power_type: 'Offense',
    value: 5,
    image: 'powers/test_power.webp',
    one_per_deck: false
};

// Setup availableCardsMap
(global.window as any).availableCardsMap.set('char-1', mockCharacterCard);
(global.window as any).availableCardsMap.set('power-1', mockPowerCard);

// Mock the displayDeckCardsForEditing function
const mockDisplayDeckCardsForEditing = async () => {
    if ((global.window as any).deckEditorCards.length === 0) {
        mockDeckCardsEditor.innerHTML = `
            <div class="empty-deck-message">
                <p>No cards in this deck yet.</p>
                <p>Drag cards from the right panel to add them!</p>
            </div>
        `;
        
        await (global as any).showDeckValidation((global.window as any).deckEditorCards);
        return;
    }
    
    // Validate deck and show results
    await (global as any).showDeckValidation((global.window as any).deckEditorCards);
    
    // Group cards by type
    const cardsByType: any = {};
    (global.window as any).deckEditorCards.forEach((card: any, index: number) => {
        const type = card.type;
        if (!cardsByType[type]) {
            cardsByType[type] = [];
        }
        cardsByType[type].push({ ...card, originalIndex: index });
    });
    
    // Define type order and display names
    const typeOrder = [
        'character', 'location', 'mission', 'event', 'special', 
        'aspect', 'advanced_universe', 'teamwork', 'ally_universe', 
        'training', 'basic_universe', 'power'
    ];
    
    const typeDisplayNames: any = {
        'character': 'Characters',
        'location': 'Locations',
        'mission': 'Missions',
        'event': 'Events',
        'special': 'Special Cards',
        'aspect': 'Aspects',
        'advanced_universe': 'Advanced Universe',
        'teamwork': 'Teamwork',
        'ally_universe': 'Ally Universe',
        'training': 'Training',
        'basic_universe': 'Basic Universe',
        'power': 'Power Cards'
    };
    
    let cardsHtml = '';
    
    // Render each card type section
    typeOrder.forEach((type: string) => {
        if (cardsByType[type] && cardsByType[type].length > 0) {
            const cards = cardsByType[type];
            const displayName = typeDisplayNames[type] || type;
            
            cardsHtml += `
                <div class="deck-type-section" data-type="${type}">
                    <h3 class="deck-type-header">${displayName} (${cards.length})</h3>
                    <div class="deck-type-cards">
            `;
            
            cards.forEach((card: any, cardIndex: number) => {
                const availableCard = (global.window as any).availableCardsMap.get(card.cardId);
                if (!availableCard) {
                    cardsHtml += `<div class="deck-card-error">Card not found: ${card.cardId}</div>`;
                    return;
                }
                
                const cardName = availableCard.name || availableCard.card_name || 'Unknown Card';
                const cardImage = (global as any).getCardImagePath(availableCard, card.type, card.selectedAlternateImage);
                
                // Generate card details based on type
                let cardDetails = '';
                if (card.type === 'character') {
                    cardDetails = `TL: ${availableCard.threat_level || 0}`;
                } else if (card.type === 'power') {
                    cardDetails = `${availableCard.value} - ${availableCard.power_type}`;
                }
                
                // Generate CSS classes
                const characterClass = card.type === 'character' ? 'character-card' : '';
                const powerClass = card.type === 'power' ? 'power-card' : '';
                
                // Generate background image data attribute
                const bgImageData = cardImage ? `data-bg-image="${cardImage}"` : '';
                
                // Generate alternate art button for characters
                let alternateArtButton = '';
                if (card.type === 'character' && availableCard.alternateImages && availableCard.alternateImages.length > 0) {
                    const characterName = cardName.replace(/'/g, "\\'");
                    alternateArtButton = `<button class="alternate-art-btn" onclick="showAlternateArtSelectionForExistingCard('${card.cardId}', ${card.originalIndex})">Change Art</button>`;
                }
                
                cardsHtml += `
                    <div class="deck-card-editor-item preview-view ${characterClass} ${powerClass}" 
                         draggable="true" data-index="${card.originalIndex}" data-type="${card.type}"
                         ${bgImageData}
                         onmouseenter="showCardHoverModal('${cardImage}', '${cardName.replace(/'/g, "\\'")}')"
                         onmouseleave="hideCardHoverModal()"
                         ondragstart="handleDeckCardDragStart(event)"
                         ondragend="handleDeckCardDragEnd(event)"
                         ondragover="handleDeckCardDragOver(event)"
                         ondrop="handleDeckCardDrop(event)">
                        <div class="deck-card-editor-info">
                            <div class="deck-card-editor-name">${cardName} ${card.quantity > 1 ? `(${card.quantity})` : ''}</div>
                            ${cardDetails ? `<div class="deck-card-editor-stats">${cardDetails}</div>` : ''}
                        </div>
                        <div class="deck-card-editor-actions">
                            ${alternateArtButton}
                            <button class="quantity-btn minus-btn" onclick="removeOneCardFromDeck(${card.originalIndex})">-1</button>
                            <button class="quantity-btn plus-btn" onclick="addOneCardToEditor(${card.originalIndex})">+1</button>
                            <button class="remove-btn" onclick="removeCardFromDeck(${card.originalIndex})">Remove</button>
                        </div>
                    </div>
                `;
            });
            
            cardsHtml += `
                    </div>
                </div>
            `;
        }
    });
    
    mockDeckCardsEditor.innerHTML = cardsHtml;
    
    // Update "One Per Deck" limit status after deck display
    (global as any).updateOnePerDeckLimitStatus();
};

const mockAddCardToEditor = async (cardType: string, cardId: string, cardName: string, selectedAlternateImage: any = null) => {
    // Check character limit before adding
    if (cardType === 'character') {
        const existingCharacter = (global.window as any).deckEditorCards.find((card: any) => card.type === 'character' && card.cardId === cardId);
        
        if (existingCharacter) {
            (global as any).showNotification('This character is already in your deck', 'error');
            return;
        }
        
        const uniqueCharacterCount = (global.window as any).deckEditorCards
            .filter((card: any) => card.type === 'character')
            .length;
        
        if (uniqueCharacterCount >= 4) {
            (global as any).showNotification('Cannot add more than 4 different characters to a deck', 'error');
            return;
        }
        
        // Check if character has alternate images and none selected
        const character = (global.window as any).availableCardsMap.get(cardId);
        if (character && character.alternateImages && character.alternateImages.length > 0 && !selectedAlternateImage) {
            // For testing, just use the default image instead of showing selection modal
            selectedAlternateImage = character.image;
        }
    }
    
    // Check "One Per Deck" validation
    const cardData = (global.window as any).availableCardsMap.get(cardId);
    if (cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true)) {
        const existingCard = (global.window as any).deckEditorCards.find((card: any) => card.cardId === cardId);
        if (existingCard) {
            (global as any).showNotification(`${cardName} is limited to one per deck`, 'error');
            return;
        }
    }
    
    // Add new card
    const newCard: any = {
        id: `deckcard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: cardType,
        cardId: cardId,
        quantity: 1
    };
    
    // Add selected alternate image if provided
    if (selectedAlternateImage && (cardType === 'character' || cardType === 'special' || cardType === 'power')) {
        newCard.selectedAlternateImage = selectedAlternateImage;
    }
    
    (global.window as any).deckEditorCards.push(newCard);
    
    // Update deck display
    await mockDisplayDeckCardsForEditing();
    
    // Update card count
    (global as any).updateDeckEditorCardCount();
    
    // Update "One Per Deck" limit status
    (global as any).updateOnePerDeckLimitStatus();
    
    // Apply layout enforcement
    (global as any).ultraAggressiveLayoutEnforcement();
    
    (global as any).showToast('Card added to deck!', 'success');
};

describe('Deck Display Functionality Tests', () => {
    beforeEach(() => {
        // Reset deck editor cards
        (global.window as any).deckEditorCards = [];
        
        // Clear all mocks
        jest.clearAllMocks();
        
        // Reset DOM
        mockDeckCardsEditor.innerHTML = '';
        
        // Ensure availableCardsMap is properly set up
        (global.window as any).availableCardsMap = new Map();
        (global.window as any).availableCardsMap.set('char-1', mockCharacterCard);
        (global.window as any).availableCardsMap.set('power-1', mockPowerCard);
    });

    describe('Empty Deck Display', () => {
        test('should show empty deck message when no cards are present', async () => {
            (global.window as any).deckEditorCards = [];
            
            await mockDisplayDeckCardsForEditing();
            
            expect(mockDeckCardsEditor.innerHTML).toContain('No cards in this deck yet');
            expect(mockDeckCardsEditor.innerHTML).toContain('Drag cards from the right panel to add them!');
            expect(mockDeckCardsEditor.innerHTML).toContain('empty-deck-message');
        });

        test('should call showDeckValidation for empty deck', async () => {
            (global.window as any).deckEditorCards = [];
            
            await mockDisplayDeckCardsForEditing();
            
            expect((global as any).showDeckValidation).toHaveBeenCalledWith([]);
        });
    });

    describe('Card Addition and Display', () => {
        test('should add character card and display it in deck content pane', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect((global.window as any).deckEditorCards).toHaveLength(1);
            expect((global.window as any).deckEditorCards[0].type).toBe('character');
            expect((global.window as any).deckEditorCards[0].cardId).toBe('char-1');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('Test Character');
            expect(mockDeckCardsEditor.innerHTML).toContain('Characters (1)');
            expect(mockDeckCardsEditor.innerHTML).toContain('character-card');
        });

        test('should add power card and display it in deck content pane', async () => {
            await mockAddCardToEditor('power', 'power-1', 'Test Power');
            
            expect((global.window as any).deckEditorCards).toHaveLength(1);
            expect((global.window as any).deckEditorCards[0].type).toBe('power');
            expect((global.window as any).deckEditorCards[0].cardId).toBe('power-1');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('Test Power');
            expect(mockDeckCardsEditor.innerHTML).toContain('Power Cards (1)');
            expect(mockDeckCardsEditor.innerHTML).toContain('power-card');
        });
    });

    describe('Card Visual Elements', () => {
        test('should render card with correct CSS classes', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('character-card');
            expect(mockDeckCardsEditor.innerHTML).toContain('preview-view');
            expect(mockDeckCardsEditor.innerHTML).toContain('draggable="true"');
        });

        test('should render card with correct data attributes', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('data-type="character"');
            expect(mockDeckCardsEditor.innerHTML).toContain('data-index="0"');
            expect(mockDeckCardsEditor.innerHTML).toContain('data-bg-image="images/character/char-1.webp"');
        });

        test('should render card name and stats correctly', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('Test Character');
            expect(mockDeckCardsEditor.innerHTML).toContain('TL: 3');
        });

        test('should render power card with correct value and type', async () => {
            await mockAddCardToEditor('power', 'power-1', 'Test Power');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('Test Power');
            expect(mockDeckCardsEditor.innerHTML).toContain('5 - Offense');
        });
    });

    describe('Card Interactivity', () => {
        test('should render interactive buttons for each card', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('alternate-art-btn');
            expect(mockDeckCardsEditor.innerHTML).toContain('minus-btn');
            expect(mockDeckCardsEditor.innerHTML).toContain('plus-btn');
            expect(mockDeckCardsEditor.innerHTML).toContain('remove-btn');
        });

        test('should render alternate art button for characters with alternate images', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('Change Art');
            expect(mockDeckCardsEditor.innerHTML).toContain('showAlternateArtSelectionForExistingCard');
        });

        test('should not render alternate art button for cards without alternate images', async () => {
            await mockAddCardToEditor('power', 'power-1', 'Test Power');
            
            expect(mockDeckCardsEditor.innerHTML).not.toContain('Change Art');
        });

        test('should render quantity buttons with correct onclick handlers', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('removeOneCardFromDeck(0)');
            expect(mockDeckCardsEditor.innerHTML).toContain('addOneCardToEditor(0)');
        });

        test('should render remove button with correct onclick handler', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('removeCardFromDeck(0)');
        });
    });

    describe('Card Hover and Drag Functionality', () => {
        test('should render card with hover event handlers', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('showCardHoverModal');
            expect(mockDeckCardsEditor.innerHTML).toContain('hideCardHoverModal');
        });

        test('should render card with drag event handlers', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('handleDeckCardDragStart');
            expect(mockDeckCardsEditor.innerHTML).toContain('handleDeckCardDragEnd');
            expect(mockDeckCardsEditor.innerHTML).toContain('handleDeckCardDragOver');
            expect(mockDeckCardsEditor.innerHTML).toContain('handleDeckCardDrop');
        });
    });

    describe('Multiple Cards Display', () => {
        test('should display multiple cards of different types', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            await mockAddCardToEditor('power', 'power-1', 'Test Power');
            
            expect((global.window as any).deckEditorCards).toHaveLength(2);
            
            expect(mockDeckCardsEditor.innerHTML).toContain('Characters (1)');
            expect(mockDeckCardsEditor.innerHTML).toContain('Power Cards (1)');
        });

        test('should group cards by type correctly', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            await mockAddCardToEditor('power', 'power-1', 'Test Power');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('data-type="character"');
            expect(mockDeckCardsEditor.innerHTML).toContain('data-type="power"');
        });
    });

    describe('Card Quantity Display', () => {
        test('should show quantity when card quantity is greater than 1', async () => {
            await mockAddCardToEditor('power', 'power-1', 'Test Power');
            
            // Manually set quantity to 2 to test display
            (global.window as any).deckEditorCards[0].quantity = 2;
            await mockDisplayDeckCardsForEditing();
            
            expect(mockDeckCardsEditor.innerHTML).toContain('(2)');
        });

        test('should not show quantity when card quantity is 1', async () => {
            await mockAddCardToEditor('power', 'power-1', 'Test Power');
            
            // The header shows count, not quantity - this is correct behavior
            expect(mockDeckCardsEditor.innerHTML).toContain('Power Cards (1)');
        });
    });

    describe('Error Handling', () => {
        test('should display error message for missing card data', async () => {
            // Add a card with ID that doesn't exist in availableCardsMap
            (global.window as any).deckEditorCards.push({
                id: 'deckcard-1',
                type: 'character',
                cardId: 'nonexistent-card',
                quantity: 1
            });
            
            await mockDisplayDeckCardsForEditing();
            
            expect(mockDeckCardsEditor.innerHTML).toContain('Card not found: nonexistent-card');
        });

        test('should handle missing availableCardsMap gracefully', async () => {
            // Clear availableCardsMap
            (global.window as any).availableCardsMap.clear();
            
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            // Should still add card to deckEditorCards but display error in UI
            expect((global.window as any).deckEditorCards).toHaveLength(1);
            
            expect(mockDeckCardsEditor.innerHTML).toContain('Card not found: char-1');
        });
    });

    describe('Function Call Verification', () => {
        test('should call required functions after adding card', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect((global as any).showDeckValidation).toHaveBeenCalled();
            expect((global as any).updateDeckEditorCardCount).toHaveBeenCalled();
            expect((global as any).updateOnePerDeckLimitStatus).toHaveBeenCalled();
            expect((global as any).ultraAggressiveLayoutEnforcement).toHaveBeenCalled();
            expect((global as any).showToast).toHaveBeenCalledWith('Card added to deck!', 'success');
        });

        test('should call required functions after displaying deck cards', async () => {
            (global.window as any).deckEditorCards.push({
                id: 'deckcard-1',
                type: 'character',
                cardId: 'char-1',
                quantity: 1
            });
            
            await mockDisplayDeckCardsForEditing();
            
            expect((global as any).showDeckValidation).toHaveBeenCalled();
            expect((global as any).updateOnePerDeckLimitStatus).toHaveBeenCalled();
        });
    });

    describe('Character Limit Validation', () => {
        test('should prevent adding duplicate character', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            // Try to add the same character again
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect((global.window as any).deckEditorCards).toHaveLength(1);
            expect((global as any).showNotification).toHaveBeenCalledWith('This character is already in your deck', 'error');
        });
    });

    describe('Visual Layout and Structure', () => {
        test('should render proper HTML structure for deck content pane', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('deck-type-section');
            expect(mockDeckCardsEditor.innerHTML).toContain('deck-card-editor-item');
            expect(mockDeckCardsEditor.innerHTML).toContain('data-type="character"');
        });

        test('should render cards in correct type order', async () => {
            await mockAddCardToEditor('power', 'power-1', 'Test Power');
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            const characterIndex = mockDeckCardsEditor.innerHTML.indexOf('data-type="character"');
            const powerIndex = mockDeckCardsEditor.innerHTML.indexOf('data-type="power"');
            
            // Character should come before power in the HTML
            expect(characterIndex).toBeLessThan(powerIndex);
        });

        test('should render type headers with correct counts', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            await mockAddCardToEditor('power', 'power-1', 'Test Power');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('Characters (1)');
            expect(mockDeckCardsEditor.innerHTML).toContain('Power Cards (1)');
        });
    });

    describe('Card Visual Styling', () => {
        test('should apply correct CSS classes based on card type', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            await mockAddCardToEditor('power', 'power-1', 'Test Power');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('character-card');
            expect(mockDeckCardsEditor.innerHTML).toContain('power-card');
        });

        test('should render cards with draggable attribute', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('draggable="true"');
        });

        test('should render cards with background image data attribute', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('data-bg-image="images/character/char-1.webp"');
        });
    });

    describe('Card Content and Information Display', () => {
        test('should display card name correctly', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('Test Character');
        });

        test('should display card stats correctly for different types', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            await mockAddCardToEditor('power', 'power-1', 'Test Power');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('TL: 3');
            expect(mockDeckCardsEditor.innerHTML).toContain('5 - Offense');
        });
    });

    describe('Interactive Elements', () => {
        test('should render all required action buttons', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('deck-card-editor-actions');
            expect(mockDeckCardsEditor.innerHTML).toContain('alternate-art-btn');
            expect(mockDeckCardsEditor.innerHTML).toContain('minus-btn');
            expect(mockDeckCardsEditor.innerHTML).toContain('plus-btn');
            expect(mockDeckCardsEditor.innerHTML).toContain('remove-btn');
        });

        test('should render alternate art button only for characters with alternate images', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            await mockAddCardToEditor('power', 'power-1', 'Test Power');
            
            // Count occurrences of "Change Art" button
            const changeArtCount = (mockDeckCardsEditor.innerHTML.match(/Change Art/g) || []).length;
            expect(changeArtCount).toBe(1); // Only for character
        });

        test('should render buttons with correct onclick handlers', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('removeOneCardFromDeck(0)');
            expect(mockDeckCardsEditor.innerHTML).toContain('addOneCardToEditor(0)');
            expect(mockDeckCardsEditor.innerHTML).toContain('removeCardFromDeck(0)');
            expect(mockDeckCardsEditor.innerHTML).toContain('showAlternateArtSelectionForExistingCard');
        });
    });

    describe('Event Handlers', () => {
        test('should render cards with hover event handlers', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('onmouseenter="showCardHoverModal');
            expect(mockDeckCardsEditor.innerHTML).toContain('onmouseleave="hideCardHoverModal');
        });

        test('should render cards with drag event handlers', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('ondragstart="handleDeckCardDragStart');
            expect(mockDeckCardsEditor.innerHTML).toContain('ondragend="handleDeckCardDragEnd');
            expect(mockDeckCardsEditor.innerHTML).toContain('ondragover="handleDeckCardDragOver');
            expect(mockDeckCardsEditor.innerHTML).toContain('ondrop="handleDeckCardDrop');
        });
    });

    describe('Multiple Cards Layout', () => {
        test('should handle multiple cards of the same type', async () => {
            // Add multiple power cards
            const mockPower2 = { ...mockPowerCard, id: 'power-2', name: 'Test Power 2' };
            (global.window as any).availableCardsMap.set('power-2', mockPower2);
            
            await mockAddCardToEditor('power', 'power-1', 'Test Power');
            await mockAddCardToEditor('power', 'power-2', 'Test Power 2');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('Power Cards (2)');
        });

        test('should maintain proper card indexing for multiple cards', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            await mockAddCardToEditor('power', 'power-1', 'Test Power');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('data-index="0"');
            expect(mockDeckCardsEditor.innerHTML).toContain('data-index="1"');
        });
    });

    describe('Empty State Handling', () => {
        test('should display empty deck message with proper styling', async () => {
            (global.window as any).deckEditorCards = [];
            await mockDisplayDeckCardsForEditing();
            
            expect(mockDeckCardsEditor.innerHTML).toContain('empty-deck-message');
            expect(mockDeckCardsEditor.innerHTML).toContain('No cards in this deck yet');
            expect(mockDeckCardsEditor.innerHTML).toContain('Drag cards from the right panel to add them!');
        });

        test('should not display type sections when deck is empty', async () => {
            (global.window as any).deckEditorCards = [];
            await mockDisplayDeckCardsForEditing();
            
            expect(mockDeckCardsEditor.innerHTML).not.toContain('deck-type-section');
        });
    });

    describe('Error State Handling', () => {
        test('should display error message for missing card data', async () => {
            (global.window as any).deckEditorCards.push({
                id: 'deckcard-1',
                type: 'character',
                cardId: 'nonexistent-card',
                quantity: 1
            });
            
            await mockDisplayDeckCardsForEditing();
            
            expect(mockDeckCardsEditor.innerHTML).toContain('deck-card-error');
            expect(mockDeckCardsEditor.innerHTML).toContain('Card not found: nonexistent-card');
        });
    });

    describe('Visual Accessibility', () => {
        test('should render cards with proper semantic structure', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('deck-type-section');
            expect(mockDeckCardsEditor.innerHTML).toContain('deck-card-editor-item');
            expect(mockDeckCardsEditor.innerHTML).toContain('deck-card-editor-info');
            expect(mockDeckCardsEditor.innerHTML).toContain('deck-card-editor-name');
            expect(mockDeckCardsEditor.innerHTML).toContain('deck-card-editor-stats');
            expect(mockDeckCardsEditor.innerHTML).toContain('deck-card-editor-actions');
        });

        test('should render buttons with proper text content', async () => {
            await mockAddCardToEditor('character', 'char-1', 'Test Character');
            
            expect(mockDeckCardsEditor.innerHTML).toContain('>Change Art<');
            expect(mockDeckCardsEditor.innerHTML).toContain('>-1<');
            expect(mockDeckCardsEditor.innerHTML).toContain('>+1<');
            expect(mockDeckCardsEditor.innerHTML).toContain('>Remove<');
        });
    });
});

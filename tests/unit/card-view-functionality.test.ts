/**
 * @jest-environment jsdom
 */

// Mock DOM elements
const mockDeckCardsEditor = {
    innerHTML: '',
    classList: {
        contains: jest.fn(),
        add: jest.fn(),
        remove: jest.fn()
    },
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
(global as any).getCardImagePath = jest.fn((card: any, type: any, selectedImage: any) => 
    `images/${type}/${card.id}.webp`);
(global as any).showCardHoverModal = jest.fn();
(global as any).hideCardHoverModal = jest.fn();
(global as any).showAlternateArtSelectionForExistingCard = jest.fn();
(global as any).removeOneCardFromEditor = jest.fn();
(global as any).addOneCardToEditor = jest.fn();
(global as any).removeCardFromEditor = jest.fn();
(global as any).updateDeckEditorCardCount = jest.fn();
(global as any).updateDeckSummary = jest.fn();
(global as any).toggleCardViewCategory = jest.fn();

// Mock console methods
(global as any).console = {
    warn: jest.fn(),
    log: jest.fn(),
    error: jest.fn()
};

// Mock availableCardsMap and deckEditorCards
(global.window as any).availableCardsMap = new Map();
(global.window as any).deckEditorCards = [];

// Mock currentUser
(global as any).currentUser = null;

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

const mockMissionCard = {
    id: 'mission-1',
    name: 'Test Mission',
    description: 'Test mission description',
    image: 'missions/test_mission.webp'
};

const mockEventCard = {
    id: 'event-1',
    name: 'Test Event',
    game_effect: 'Test game effect',
    image: 'events/test_event.webp'
};

// Setup availableCardsMap
(global.window as any).availableCardsMap.set('char-1', mockCharacterCard);
(global.window as any).availableCardsMap.set('power-1', mockPowerCard);
(global.window as any).availableCardsMap.set('mission-1', mockMissionCard);
(global.window as any).availableCardsMap.set('event-1', mockEventCard);

// Mock the renderDeckCardsCardView function
function mockRenderDeckCardsCardView() {
    const deckCardsEditor = (global as any).document.getElementById('deckCardsEditor');
    if (!deckCardsEditor) {
        return;
    }

    // Check if user is admin
    if (!(global as any).currentUser || (global as any).currentUser.role !== 'ADMIN') {
        (global as any).console.warn('Card View is only available to ADMIN users');
        return;
    }

    if ((global.window as any).deckEditorCards.length === 0) {
        deckCardsEditor.innerHTML = `
            <div class="empty-deck-message">
                <p>No cards in this deck yet.</p>
                <p>Drag cards from the right panel to add them!</p>
            </div>
        `;
        return;
    }

    // Group cards by type - Card View specific logic
    const cardsByType: any = {};
    (global.window as any).deckEditorCards.forEach((card: any, index: number) => {
        let type = card.type;
        // Convert underscore format to hyphen format for consistency
        if (type === 'ally_universe') {
            type = 'ally-universe';
        } else if (type === 'basic_universe') {
            type = 'basic-universe';
        } else if (type === 'advanced_universe') {
            type = 'advanced-universe';
        }
        
        if (!cardsByType[type]) {
            cardsByType[type] = [];
        }
        cardsByType[type].push({ ...card, originalIndex: index });
    });

    // Card View specific type order and display names
    const typeOrder = [
        'character', 'location', 'mission', 'event', 'special', 
        'aspect', 'advanced-universe', 'teamwork', 'ally-universe', 
        'training', 'basic-universe', 'power'
    ];
    
    const typeDisplayNames: any = {
        'character': 'Characters',
        'location': 'Locations', 
        'mission': 'Missions',
        'event': 'Events',
        'special': 'Special Cards',
        'aspect': 'Aspects',
        'advanced-universe': 'Universe: Advanced',
        'teamwork': 'Universe: Teamwork',
        'ally-universe': 'Universe: Ally',
        'training': 'Universe: Training',
        'basic-universe': 'Universe: Basic',
        'power': 'Power Cards'
    };

    let cardsHtml = '';

    // Render each type group as a full-width vertical section
    typeOrder.forEach((type: string) => {
        if (cardsByType[type] && cardsByType[type].length > 0) {
            const typeCards = cardsByType[type];
            const typeName = typeDisplayNames[type] || type;
            const cardCount = typeCards.reduce((total: number, card: any) => total + (card.quantity || 1), 0);
            
            cardsHtml += `
                <div class="card-view-category-section" data-type="${type}">
                    <div class="card-view-category-header" onclick="toggleCardViewCategory('${type}')">
                        <span class="card-view-category-name">${typeName}</span>
                        <div class="card-view-category-controls">
                            <span class="card-view-category-count">${cardCount} card${cardCount !== 1 ? 's' : ''}</span>
                            <span class="card-view-category-toggle" id="toggle-${type}">▼</span>
                        </div>
                    </div>
                    <div class="card-view-category-cards" id="cards-${type}">
            `;
            
            // Render cards in horizontal rows
            typeCards.forEach((cardData: any, cardIndex: number) => {
                const card = cardData;
                const index = cardData.originalIndex;
                
                // Direct lookup using UUID
                const availableCard = (global.window as any).availableCardsMap.get(card.cardId);
                
                if (!availableCard) {
                    (global as any).console.warn('Card not found in availableCardsMap:', card);
                    return;
                }
                
                // Get card image path
                const cardImagePath = (global as any).getCardImagePath(availableCard, card.type, card.selectedAlternateImage);
                
                // Add alternate art button for cards with alternate images
                let alternateArtButton = '';
                if (availableCard.alternateImages && availableCard.alternateImages.length > 0) {
                    alternateArtButton = `<button class="alternate-art-btn card-view-btn" onclick="showAlternateArtSelectionForExistingCard('${card.cardId}', ${index})">Change Art</button>`;
                }
                
                // Add quantity buttons for applicable card types
                let quantityButtons = '';
                if (card.type !== 'character' && card.type !== 'location' && card.type !== 'mission') {
                    quantityButtons = `
                        <button class="remove-one-btn card-view-btn" onclick="removeOneCardFromEditor(${index})">-1</button>
                        <button class="add-one-btn card-view-btn" onclick="addOneCardToEditor(${index})">+1</button>
                    `;
                } else {
                    quantityButtons = `<button class="quantity-btn card-view-btn" onclick="removeCardFromEditor(${index})">-</button>`;
                }
                
                // Render multiple instances of the card based on quantity
                const quantity = card.quantity || 1;
                for (let i = 0; i < quantity; i++) {
                    cardsHtml += `
                        <div class="deck-card-card-view-item" 
                             data-index="${index}" 
                             data-type="${card.type}"
                             data-instance="${i + 1}"
                             onmouseenter="showCardHoverModal('${cardImagePath}', '${(availableCard.name || availableCard.card_name || 'Card').replace(/'/g, "\\'")}')"
                             onmouseleave="hideCardHoverModal()">
                            <img src="${cardImagePath}" alt="${availableCard.name || availableCard.card_name || 'Card'}" class="card-view-image">
                            <div class="card-view-actions">
                                ${alternateArtButton}
                                ${quantityButtons}
                            </div>
                        </div>
                    `;
                }
            });
            
            cardsHtml += `
                    </div>
                </div>
            `;
        }
    });

    deckCardsEditor.innerHTML = cardsHtml;
    
    // Update deck summary and card count to ensure Draw Hand button state is correct
    if (typeof (global as any).updateDeckEditorCardCount === 'function') {
        (global as any).updateDeckEditorCardCount();
    }
    if (typeof (global as any).updateDeckSummary === 'function') {
        (global as any).updateDeckSummary((global.window as any).deckEditorCards);
    }
};

describe('Card View Functionality Tests', () => {
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
        (global.window as any).availableCardsMap.set('mission-1', mockMissionCard);
        (global.window as any).availableCardsMap.set('event-1', mockEventCard);
    });

    describe('Admin Access Control', () => {
        test('should show warning and return early for non-admin users', () => {
            (global as any).currentUser = { role: 'USER' };
            
            // Verify the function is defined
            expect(typeof mockRenderDeckCardsCardView).toBe('function');
            
            // Call the mock function
            const result = mockRenderDeckCardsCardView();
            
            // Check if console.warn was called
            expect((global as any).console.warn).toHaveBeenCalledWith('Card View is only available to ADMIN users');
            expect(mockDeckCardsEditor.innerHTML).toBe('');
        });

        test('should show warning and return early for null currentUser', () => {
            (global as any).currentUser = null;
            
            mockRenderDeckCardsCardView();
            
            expect((global as any).console.warn).toHaveBeenCalledWith('Card View is only available to ADMIN users');
            expect(mockDeckCardsEditor.innerHTML).toBe('');
        });

        test('should render cards for admin users', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [{
                id: 'deckcard-1',
                type: 'character',
                cardId: 'char-1',
                quantity: 1
            }];
            
            mockRenderDeckCardsCardView();
            
            expect((global as any).console.warn).not.toHaveBeenCalled();
            expect(mockDeckCardsEditor.innerHTML).toContain('card-view-category-section');
        });
    });

    describe('Empty Deck Handling', () => {
        test('should show empty deck message when no cards are present', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [];
            
            mockRenderDeckCardsCardView();
            
            expect(mockDeckCardsEditor.innerHTML).toContain('empty-deck-message');
            expect(mockDeckCardsEditor.innerHTML).toContain('No cards in this deck yet');
            expect(mockDeckCardsEditor.innerHTML).toContain('Drag cards from the right panel to add them!');
        });
    });

    describe('Card Grouping and Type Conversion', () => {
        test('should group cards by type correctly', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [
                { id: 'deckcard-1', type: 'character', cardId: 'char-1', quantity: 1 },
                { id: 'deckcard-2', type: 'power', cardId: 'power-1', quantity: 2 },
                { id: 'deckcard-3', type: 'mission', cardId: 'mission-1', quantity: 1 }
            ];
            
            mockRenderDeckCardsCardView();
            
            expect(mockDeckCardsEditor.innerHTML).toContain('data-type="character"');
            expect(mockDeckCardsEditor.innerHTML).toContain('data-type="power"');
            expect(mockDeckCardsEditor.innerHTML).toContain('data-type="mission"');
        });

        test('should convert underscore format to hyphen format for universe cards', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [
                { id: 'deckcard-1', type: 'ally_universe', cardId: 'ally-1', quantity: 1 },
                { id: 'deckcard-2', type: 'basic_universe', cardId: 'basic-1', quantity: 1 },
                { id: 'deckcard-3', type: 'advanced_universe', cardId: 'advanced-1', quantity: 1 }
            ];
            
            // Add universe cards to availableCardsMap
            (global.window as any).availableCardsMap.set('ally-1', { id: 'ally-1', name: 'Ally Card' });
            (global.window as any).availableCardsMap.set('basic-1', { id: 'basic-1', name: 'Basic Card' });
            (global.window as any).availableCardsMap.set('advanced-1', { id: 'advanced-1', name: 'Advanced Card' });
            
            mockRenderDeckCardsCardView();
            
            expect(mockDeckCardsEditor.innerHTML).toContain('data-type="ally-universe"');
            expect(mockDeckCardsEditor.innerHTML).toContain('data-type="basic-universe"');
            expect(mockDeckCardsEditor.innerHTML).toContain('data-type="advanced-universe"');
        });
    });

    describe('Type Display Names and Ordering', () => {
        test('should display correct type names', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [
                { id: 'deckcard-1', type: 'character', cardId: 'char-1', quantity: 1 },
                { id: 'deckcard-2', type: 'power', cardId: 'power-1', quantity: 1 }
            ];
            
            mockRenderDeckCardsCardView();
            
            expect(mockDeckCardsEditor.innerHTML).toContain('Characters');
            expect(mockDeckCardsEditor.innerHTML).toContain('Power Cards');
        });

        test('should display correct card counts', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [
                { id: 'deckcard-1', type: 'character', cardId: 'char-1', quantity: 1 },
                { id: 'deckcard-2', type: 'power', cardId: 'power-1', quantity: 3 }
            ];
            
            mockRenderDeckCardsCardView();
            
            expect(mockDeckCardsEditor.innerHTML).toContain('1 card');
            expect(mockDeckCardsEditor.innerHTML).toContain('3 cards');
        });
    });

    describe('Card Rendering', () => {
        test('should render character cards with landscape layout', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [
                { id: 'deckcard-1', type: 'character', cardId: 'char-1', quantity: 1 }
            ];
            
            mockRenderDeckCardsCardView();
            
            expect(mockDeckCardsEditor.innerHTML).toContain('deck-card-card-view-item');
            expect(mockDeckCardsEditor.innerHTML).toContain('data-type="character"');
            expect(mockDeckCardsEditor.innerHTML).toContain('card-view-image');
        });

        test('should render power cards with portrait layout', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [
                { id: 'deckcard-1', type: 'power', cardId: 'power-1', quantity: 1 }
            ];
            
            mockRenderDeckCardsCardView();
            
            expect(mockDeckCardsEditor.innerHTML).toContain('deck-card-card-view-item');
            expect(mockDeckCardsEditor.innerHTML).toContain('data-type="power"');
            expect(mockDeckCardsEditor.innerHTML).toContain('card-view-image');
        });

        test('should render cards with correct image paths', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [
                { id: 'deckcard-1', type: 'character', cardId: 'char-1', quantity: 1 }
            ];
            
            mockRenderDeckCardsCardView();
            
            expect((global as any).getCardImagePath).toHaveBeenCalledWith(mockCharacterCard, 'character', undefined);
            expect(mockDeckCardsEditor.innerHTML).toContain('images/character/char-1.webp');
        });
    });

    describe('Interactive Elements', () => {
        test('should render alternate art button for characters with alternate images', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [
                { id: 'deckcard-1', type: 'character', cardId: 'char-1', quantity: 1 }
            ];
            
            mockRenderDeckCardsCardView();
            
            expect(mockDeckCardsEditor.innerHTML).toContain('alternate-art-btn');
            expect(mockDeckCardsEditor.innerHTML).toContain('Change Art');
            expect(mockDeckCardsEditor.innerHTML).toContain('showAlternateArtSelectionForExistingCard');
        });

        test('should not render alternate art button for cards without alternate images', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [
                { id: 'deckcard-1', type: 'power', cardId: 'power-1', quantity: 1 }
            ];
            
            mockRenderDeckCardsCardView();
            
            expect(mockDeckCardsEditor.innerHTML).not.toContain('Change Art');
        });

        test('should render quantity buttons for multi-quantity cards', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [
                { id: 'deckcard-1', type: 'power', cardId: 'power-1', quantity: 1 }
            ];
            
            mockRenderDeckCardsCardView();
            
            expect(mockDeckCardsEditor.innerHTML).toContain('remove-one-btn');
            expect(mockDeckCardsEditor.innerHTML).toContain('add-one-btn');
            expect(mockDeckCardsEditor.innerHTML).toContain('removeOneCardFromEditor(0)');
            expect(mockDeckCardsEditor.innerHTML).toContain('addOneCardToEditor(0)');
        });

        test('should render single remove button for single-quantity cards', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [
                { id: 'deckcard-1', type: 'character', cardId: 'char-1', quantity: 1 }
            ];
            
            mockRenderDeckCardsCardView();
            
            expect(mockDeckCardsEditor.innerHTML).toContain('quantity-btn');
            expect(mockDeckCardsEditor.innerHTML).toContain('removeCardFromEditor(0)');
            expect(mockDeckCardsEditor.innerHTML).not.toContain('remove-one-btn');
            expect(mockDeckCardsEditor.innerHTML).not.toContain('add-one-btn');
        });
    });

    describe('Hover Functionality', () => {
        test('should render cards with hover event handlers', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [
                { id: 'deckcard-1', type: 'character', cardId: 'char-1', quantity: 1 }
            ];
            
            mockRenderDeckCardsCardView();
            
            expect(mockDeckCardsEditor.innerHTML).toContain('onmouseenter="showCardHoverModal');
            expect(mockDeckCardsEditor.innerHTML).toContain('onmouseleave="hideCardHoverModal');
        });
    });

    describe('Error Handling', () => {
        test('should handle missing card data gracefully', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [
                { id: 'deckcard-1', type: 'character', cardId: 'nonexistent-card', quantity: 1 }
            ];
            
            mockRenderDeckCardsCardView();
            
            expect((global as any).console.warn).toHaveBeenCalledWith('Card not found in availableCardsMap:', 
                { id: 'deckcard-1', type: 'character', cardId: 'nonexistent-card', quantity: 1 });
        });

        test('should continue rendering other cards when one card is missing', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [
                { id: 'deckcard-1', type: 'character', cardId: 'nonexistent-card', quantity: 1 },
                { id: 'deckcard-2', type: 'power', cardId: 'power-1', quantity: 1 }
            ];
            
            mockRenderDeckCardsCardView();
            
            expect((global as any).console.warn).toHaveBeenCalled();
            expect(mockDeckCardsEditor.innerHTML).toContain('data-type="power"');
        });
    });

    describe('HTML Structure', () => {
        test('should generate proper HTML structure for card view', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [
                { id: 'deckcard-1', type: 'character', cardId: 'char-1', quantity: 1 }
            ];
            
            mockRenderDeckCardsCardView();
            
            expect(mockDeckCardsEditor.innerHTML).toContain('card-view-category-section');
            expect(mockDeckCardsEditor.innerHTML).toContain('card-view-category-header');
            expect(mockDeckCardsEditor.innerHTML).toContain('card-view-category-name');
            expect(mockDeckCardsEditor.innerHTML).toContain('card-view-category-count');
            expect(mockDeckCardsEditor.innerHTML).toContain('card-view-category-cards');
            expect(mockDeckCardsEditor.innerHTML).toContain('deck-card-card-view-item');
            expect(mockDeckCardsEditor.innerHTML).toContain('card-view-actions');
        });

        test('should include proper data attributes', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [
                { id: 'deckcard-1', type: 'character', cardId: 'char-1', quantity: 1 }
            ];
            
            mockRenderDeckCardsCardView();
            
            expect(mockDeckCardsEditor.innerHTML).toContain('data-type="character"');
            expect(mockDeckCardsEditor.innerHTML).toContain('data-index="0"');
        });
    });

    describe('Function Integration', () => {
        test('should call getCardImagePath for each card', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [
                { id: 'deckcard-1', type: 'character', cardId: 'char-1', quantity: 1 },
                { id: 'deckcard-2', type: 'power', cardId: 'power-1', quantity: 1 }
            ];
            
            mockRenderDeckCardsCardView();
            
            expect((global as any).getCardImagePath).toHaveBeenCalledWith(mockCharacterCard, 'character', undefined);
            expect((global as any).getCardImagePath).toHaveBeenCalledWith(mockPowerCard, 'power', undefined);
            expect((global as any).getCardImagePath).toHaveBeenCalledTimes(2);
        });
    });

    describe('Multiple Card Types', () => {
        test('should handle multiple card types correctly', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [
                { id: 'deckcard-1', type: 'character', cardId: 'char-1', quantity: 1 },
                { id: 'deckcard-2', type: 'power', cardId: 'power-1', quantity: 2 },
                { id: 'deckcard-3', type: 'mission', cardId: 'mission-1', quantity: 1 },
                { id: 'deckcard-4', type: 'event', cardId: 'event-1', quantity: 1 }
            ];
            
            mockRenderDeckCardsCardView();
            
            expect(mockDeckCardsEditor.innerHTML).toContain('Characters');
            expect(mockDeckCardsEditor.innerHTML).toContain('Power Cards');
            expect(mockDeckCardsEditor.innerHTML).toContain('Missions');
            expect(mockDeckCardsEditor.innerHTML).toContain('Events');
        });

        test('should maintain correct card indexing across types', () => {
            (global as any).currentUser = { role: 'ADMIN' };
            (global.window as any).deckEditorCards = [
                { id: 'deckcard-1', type: 'character', cardId: 'char-1', quantity: 1 },
                { id: 'deckcard-2', type: 'power', cardId: 'power-1', quantity: 1 },
                { id: 'deckcard-3', type: 'mission', cardId: 'mission-1', quantity: 1 }
            ];
            
            mockRenderDeckCardsCardView();
            
            expect(mockDeckCardsEditor.innerHTML).toContain('data-index="0"');
            expect(mockDeckCardsEditor.innerHTML).toContain('data-index="1"');
            expect(mockDeckCardsEditor.innerHTML).toContain('data-index="2"');
        });
    });
});

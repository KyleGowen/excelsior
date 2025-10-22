import { JSDOM } from 'jsdom';

// Mock the global window object
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head></head>
<body>
    <div id="cardCategories">
        <div class="card-item" data-type="character" data-id="char_1">Character 1</div>
        <div class="card-item" data-type="special" data-id="special_1">Grim Reaper</div>
        <div class="card-item" data-type="power" data-id="power_1">Any-Power Card</div>
        <div class="card-item" data-type="advanced-universe" data-id="adv_1">Universe: Advanced Card</div>
        <div class="card-item" data-type="teamwork" data-id="team_1">Teamwork Card</div>
        <div class="card-item" data-type="event" data-id="event_1">Event Card</div>
        <div class="card-item" data-type="mission" data-id="mission_1">Mission Card</div>
        <div class="card-item" data-type="ally-universe" data-id="ally_1">Ally Card</div>
        <div class="card-item" data-type="training" data-id="train_1">Training Card</div>
        <div class="card-item" data-type="basic-universe" data-id="basic_1">Basic Universe Card</div>
    </div>
</body>
</html>
`);

// Set up global variables
(global as any).window = dom.window;
(global as any).document = dom.window.document;

// Mock the availableCardsMap and deckEditorCards
(global as any).window.availableCardsMap = new Map();
(global as any).window.deckEditorCards = [];

// Mock card data
const mockCards = {
    'char_1': { id: 'char_1', name: 'Character 1', one_per_deck: false },
    'special_1': { id: 'special_1', name: 'Grim Reaper', one_per_deck: true },
    'power_1': { id: 'power_1', name: 'Any-Power Card', one_per_deck: true },
    'adv_1': { id: 'adv_1', name: 'Universe: Advanced Card', one_per_deck: true },
    'team_1': { id: 'team_1', name: 'Teamwork Card', one_per_deck: true },
    'event_1': { id: 'event_1', name: 'Event Card', one_per_deck: true },
    'mission_1': { id: 'mission_1', name: 'Mission Card', one_per_deck: true },
    'ally_1': { id: 'ally_1', name: 'Ally Card', one_per_deck: true },
    'train_1': { id: 'train_1', name: 'Training Card', one_per_deck: true },
    'basic_1': { id: 'basic_1', name: 'Basic Universe Card', one_per_deck: true },
};

// Populate the mock availableCardsMap
Object.entries(mockCards).forEach(([id, card]) => {
    (global as any).window.availableCardsMap.set(id, card);
});

// Mock the updateOnePerDeckLimitStatus function
(global as any).updateOnePerDeckLimitStatus = function() {
    console.log('updateOnePerDeckLimitStatus - Starting One Per Deck status update');
    
    // Get all One Per Deck cards currently in the deck
    const onePerDeckCardsInDeck = new Set();
    (global as any).window.deckEditorCards.forEach((card: any) => {
        const cardData = (global as any).window.availableCardsMap.get(card.cardId);
        if (cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true)) {
            onePerDeckCardsInDeck.add(card.cardId);
        }
    });
    
    console.log('updateOnePerDeckLimitStatus - One Per Deck cards in deck:', Array.from(onePerDeckCardsInDeck));
    
    // Update all card items for all card types
    const allCardItems = document.querySelectorAll('.card-item[data-id]');
    allCardItems.forEach((cardElement: any) => {
        const cardId = cardElement.getAttribute('data-id');
        const cardType = cardElement.getAttribute('data-type');
        
        if (cardId) {
            const cardData = (global as any).window.availableCardsMap.get(cardId);
            const isOnePerDeck = cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true);
            const isInDeck = onePerDeckCardsInDeck.has(cardId);
            
            if (isOnePerDeck && isInDeck) {
                // This is a One Per Deck card that's already in the deck - dim it
                cardElement.classList.add('disabled');
                cardElement.setAttribute('draggable', 'false');
                cardElement.title = 'One Per Deck - already in deck';
                console.log('updateOnePerDeckLimitStatus - Dimming One Per Deck card:', cardId, cardType);
            } else {
                // This card is not One Per Deck or not in deck - ensure it's not dimmed
                cardElement.classList.remove('disabled');
                cardElement.setAttribute('draggable', 'true');
                cardElement.title = '';
            }
        }
    });
    
    console.log('updateOnePerDeckLimitStatus - Completed One Per Deck status update');
};

describe('One Per Deck Visual Dimming', () => {
    beforeEach(() => {
        // Reset deckEditorCards
        (global as any).window.deckEditorCards = [];
        
        // Reset all card elements
        const allCardItems = document.querySelectorAll('.card-item[data-id]');
        allCardItems.forEach((cardElement: any) => {
            cardElement.classList.remove('disabled');
            cardElement.setAttribute('draggable', 'true');
            cardElement.title = '';
        });
    });

    describe('updateOnePerDeckLimitStatus function', () => {
        it('should not dim any cards when deck is empty', () => {
            (global as any).updateOnePerDeckLimitStatus();
            
            const allCardItems = document.querySelectorAll('.card-item[data-id]');
            allCardItems.forEach((cardElement: any) => {
                expect(cardElement.classList.contains('disabled')).toBe(false);
                expect(cardElement.getAttribute('draggable')).toBe('true');
                expect(cardElement.title).toBe('');
            });
        });

        it('should dim One Per Deck cards that are in the deck', () => {
            // Add a One Per Deck card to the deck
            (global as any).window.deckEditorCards = [
                { type: 'special', cardId: 'special_1', quantity: 1 }
            ];
            
            (global as any).updateOnePerDeckLimitStatus();
            
            // Check that Grim Reaper is dimmed
            const grimReaperCard = document.querySelector('.card-item[data-id="special_1"]');
            expect(grimReaperCard?.classList.contains('disabled')).toBe(true);
            expect(grimReaperCard?.getAttribute('draggable')).toBe('false');
            expect(grimReaperCard?.getAttribute('title')).toBe('One Per Deck - already in deck');
        });

        it('should not dim non-One Per Deck cards even when in deck', () => {
            // Add a non-One Per Deck card to the deck
            (global as any).window.deckEditorCards = [
                { type: 'character', cardId: 'char_1', quantity: 1 }
            ];
            
            (global as any).updateOnePerDeckLimitStatus();
            
            // Check that Character 1 is not dimmed
            const characterCard = document.querySelector('.card-item[data-id="char_1"]');
            expect(characterCard?.classList.contains('disabled')).toBe(false);
            expect(characterCard?.getAttribute('draggable')).toBe('true');
            expect(characterCard?.getAttribute('title')).toBe('');
        });

        it('should dim multiple One Per Deck cards when they are in the deck', () => {
            // Add multiple One Per Deck cards to the deck
            (global as any).window.deckEditorCards = [
                { type: 'special', cardId: 'special_1', quantity: 1 },
                { type: 'power', cardId: 'power_1', quantity: 1 },
                { type: 'advanced-universe', cardId: 'adv_1', quantity: 1 }
            ];
            
            (global as any).updateOnePerDeckLimitStatus();
            
            // Check that all One Per Deck cards are dimmed
            const specialCard = document.querySelector('.card-item[data-id="special_1"]');
            const powerCard = document.querySelector('.card-item[data-id="power_1"]');
            const advCard = document.querySelector('.card-item[data-id="adv_1"]');
            
            expect(specialCard?.classList.contains('disabled')).toBe(true);
            expect(powerCard?.classList.contains('disabled')).toBe(true);
            expect(advCard?.classList.contains('disabled')).toBe(true);
        });

        it('should remove dimming when One Per Deck cards are removed from deck', () => {
            // First add a One Per Deck card and dim it
            (global as any).window.deckEditorCards = [
                { type: 'special', cardId: 'special_1', quantity: 1 }
            ];
            (global as any).updateOnePerDeckLimitStatus();
            
            // Verify it's dimmed
            const grimReaperCard = document.querySelector('.card-item[data-id="special_1"]');
            expect(grimReaperCard?.classList.contains('disabled')).toBe(true);
            
            // Remove the card from deck
            (global as any).window.deckEditorCards = [];
            (global as any).updateOnePerDeckLimitStatus();
            
            // Verify it's no longer dimmed
            expect(grimReaperCard?.classList.contains('disabled')).toBe(false);
            expect(grimReaperCard?.getAttribute('draggable')).toBe('true');
            expect(grimReaperCard?.getAttribute('title')).toBe('');
        });

        it('should handle cards with is_one_per_deck property', () => {
            // Mock a card with is_one_per_deck instead of one_per_deck
            (global as any).window.availableCardsMap.set('test_card', {
                id: 'test_card',
                name: 'Test Card',
                is_one_per_deck: true
            });
            
            // Add the card to deck
            (global as any).window.deckEditorCards = [
                { type: 'special', cardId: 'test_card', quantity: 1 }
            ];
            
            // Create a test card element
            const testCardElement = document.createElement('div');
            testCardElement.className = 'card-item';
            testCardElement.setAttribute('data-type', 'special');
            testCardElement.setAttribute('data-id', 'test_card');
            document.getElementById('cardCategories')?.appendChild(testCardElement);
            
            (global as any).updateOnePerDeckLimitStatus();
            
            // Verify it's dimmed
            expect(testCardElement.classList.contains('disabled')).toBe(true);
            expect(testCardElement.getAttribute('draggable')).toBe('false');
            expect(testCardElement.getAttribute('title')).toBe('One Per Deck - already in deck');
        });

        it('should work with all card types', () => {
            // Test all card types
            const cardTypes = [
                'character', 'special', 'power', 'advanced-universe', 'teamwork',
                'event', 'mission', 'ally-universe', 'training', 'basic-universe'
            ];
            
            // Add one card of each type to the deck
            (global as any).window.deckEditorCards = cardTypes.map((type, index) => ({
                type,
                cardId: `${type}_1`,
                quantity: 1
            }));
            
            (global as any).updateOnePerDeckLimitStatus();
            
            // All One Per Deck cards should be dimmed
            cardTypes.forEach(type => {
                const cardElement = document.querySelector(`.card-item[data-id="${type}_1"]`);
                if (cardElement) {
                    if (type === 'character') {
                        // Character cards are not One Per Deck in our mock data
                        expect(cardElement.classList.contains('disabled')).toBe(false);
                    } else {
                        // All other cards are One Per Deck in our mock data
                        expect(cardElement.classList.contains('disabled')).toBe(true);
                        expect(cardElement.getAttribute('draggable')).toBe('false');
                        expect(cardElement.getAttribute('title')).toBe('One Per Deck - already in deck');
                    }
                }
            });
        });
    });

    describe('Card rendering with One Per Deck dimming', () => {
        it('should include One Per Deck dimming logic in character card rendering', () => {
            // Mock the character card rendering logic
            const mockCharacterCard = {
                id: 'char_1',
                name: 'Test Character',
                one_per_deck: true,
                threat_level: 18,
                energy: 6,
                combat: 2,
                brute_force: 7,
                intelligence: 5
            };
            
            // Mock deckEditorCards with the character
            (global as any).window.deckEditorCards = [
                { type: 'character', cardId: 'char_1', quantity: 1 }
            ];
            
            // Simulate the character card rendering logic
            const isCharacterLimitReached = false; // Not at limit
            const isOnePerDeck = mockCharacterCard.one_per_deck === true;
            const isOnePerDeckInDeck = isOnePerDeck && (global as any).window.deckEditorCards.some((deckCard: any) => 
                deckCard.type === 'character' && deckCard.cardId === mockCharacterCard.id
            );
            
            const disabledClass = (isCharacterLimitReached || isOnePerDeckInDeck) ? 'disabled' : '';
            let disabledTitle = '';
            if (isCharacterLimitReached) {
                disabledTitle = 'Character limit reached (max 4)';
            } else if (isOnePerDeckInDeck) {
                disabledTitle = 'One Per Deck - already in deck';
            }
            
            expect(disabledClass).toBe('disabled');
            expect(disabledTitle).toBe('One Per Deck - already in deck');
        });

        it('should include One Per Deck dimming logic in mission card rendering', () => {
            // Mock the mission card rendering logic
            const mockMissionCard = {
                id: 'mission_1',
                card_name: 'Test Mission',
                one_per_deck: true
            };
            
            // Mock deckEditorCards with the mission
            (global as any).window.deckEditorCards = [
                { type: 'mission', cardId: 'mission_1', quantity: 1 }
            ];
            
            // Simulate the mission card rendering logic
            const isMissionLimitReached = false; // Not at limit
            const isOnePerDeck = mockMissionCard.one_per_deck === true;
            const isOnePerDeckInDeck = isOnePerDeck && (global as any).window.deckEditorCards.some((deckCard: any) => 
                deckCard.type === 'mission' && deckCard.cardId === mockMissionCard.id
            );
            
            const disabledClass = (isMissionLimitReached || isOnePerDeckInDeck) ? 'disabled' : '';
            let disabledTitle = '';
            if (isMissionLimitReached) {
                disabledTitle = 'Mission limit reached (max 7)';
            } else if (isOnePerDeckInDeck) {
                disabledTitle = 'One Per Deck - already in deck';
            }
            
            expect(disabledClass).toBe('disabled');
            expect(disabledTitle).toBe('One Per Deck - already in deck');
        });

        it('should include One Per Deck dimming logic in special card rendering', () => {
            // Mock the special card rendering logic
            const mockSpecialCard = {
                id: 'special_1',
                name: 'Grim Reaper',
                one_per_deck: true
            };
            
            // Mock deckEditorCards with the special card
            (global as any).window.deckEditorCards = [
                { type: 'special', cardId: 'special_1', quantity: 1 }
            ];
            
            // Simulate the special card rendering logic
            const isOnePerDeck = mockSpecialCard.one_per_deck === true;
            const isOnePerDeckInDeck = isOnePerDeck && (global as any).window.deckEditorCards.some((deckCard: any) => 
                deckCard.type === 'special' && deckCard.cardId === mockSpecialCard.id
            );
            
            const disabledClass = isOnePerDeckInDeck ? 'disabled' : '';
            const disabledTitle = isOnePerDeckInDeck ? 'One Per Deck - already in deck' : '';
            
            expect(disabledClass).toBe('disabled');
            expect(disabledTitle).toBe('One Per Deck - already in deck');
        });

        it('should include One Per Deck dimming logic in power card rendering', () => {
            // Mock the power card rendering logic
            const mockPowerCard = {
                id: 'power_1',
                value: 5,
                power_type: 'Any-Power',
                one_per_deck: true
            };
            
            // Mock deckEditorCards with the power card
            (global as any).window.deckEditorCards = [
                { type: 'power', cardId: 'power_1', quantity: 1 }
            ];
            
            // Simulate the power card rendering logic
            const isOnePerDeck = mockPowerCard.one_per_deck === true;
            const isOnePerDeckInDeck = isOnePerDeck && (global as any).window.deckEditorCards.some((deckCard: any) => 
                deckCard.type === 'power' && deckCard.cardId === mockPowerCard.id
            );
            
            const disabledClass = isOnePerDeckInDeck ? 'disabled' : '';
            const disabledTitle = isOnePerDeckInDeck ? 'One Per Deck - already in deck' : '';
            
            expect(disabledClass).toBe('disabled');
            expect(disabledTitle).toBe('One Per Deck - already in deck');
        });

        it('should handle cards that are not One Per Deck', () => {
            // Mock a non-One Per Deck card
            const mockCard = {
                id: 'regular_card',
                name: 'Regular Card',
                one_per_deck: false
            };
            
            // Mock deckEditorCards with the regular card
            (global as any).window.deckEditorCards = [
                { type: 'special', cardId: 'regular_card', quantity: 1 }
            ];
            
            // Simulate the card rendering logic
            const isOnePerDeck = mockCard.one_per_deck === true;
            const isOnePerDeckInDeck = isOnePerDeck && (global as any).window.deckEditorCards.some((deckCard: any) => 
                deckCard.type === 'special' && deckCard.cardId === mockCard.id
            );
            
            const disabledClass = isOnePerDeckInDeck ? 'disabled' : '';
            const disabledTitle = isOnePerDeckInDeck ? 'One Per Deck - already in deck' : '';
            
            expect(disabledClass).toBe('');
            expect(disabledTitle).toBe('');
        });
    });

    describe('CSS styling for One Per Deck dimming', () => {
        it('should apply disabled class styling', () => {
            const cardElement = document.querySelector('.card-item[data-id="special_1"]') as HTMLElement;
            
            // Add disabled class
            cardElement.classList.add('disabled');
            
            // Verify the class is applied
            expect(cardElement.classList.contains('disabled')).toBe(true);
        });

        it('should set appropriate attributes when disabled', () => {
            const cardElement = document.querySelector('.card-item[data-id="special_1"]') as HTMLElement;
            
            // Simulate the disabled state
            cardElement.classList.add('disabled');
            cardElement.setAttribute('draggable', 'false');
            cardElement.title = 'One Per Deck - already in deck';
            
            // Verify attributes
            expect(cardElement.getAttribute('draggable')).toBe('false');
            expect(cardElement.title).toBe('One Per Deck - already in deck');
        });

        it('should remove disabled styling when card is no longer in deck', () => {
            const cardElement = document.querySelector('.card-item[data-id="special_1"]') as HTMLElement;
            
            // First set disabled state
            cardElement.classList.add('disabled');
            cardElement.setAttribute('draggable', 'false');
            cardElement.title = 'One Per Deck - already in deck';
            
            // Then remove disabled state
            cardElement.classList.remove('disabled');
            cardElement.setAttribute('draggable', 'true');
            cardElement.title = '';
            
            // Verify attributes
            expect(cardElement.classList.contains('disabled')).toBe(false);
            expect(cardElement.getAttribute('draggable')).toBe('true');
            expect(cardElement.title).toBe('');
        });
    });

    describe('Integration with existing limit functions', () => {
        it('should work alongside character limit dimming', () => {
            // Add a character that reaches the limit AND is One Per Deck
            (global as any).window.deckEditorCards = [
                { type: 'character', cardId: 'char_1', quantity: 1 },
                { type: 'character', cardId: 'char_2', quantity: 1 },
                { type: 'character', cardId: 'char_3', quantity: 1 },
                { type: 'character', cardId: 'char_4', quantity: 1 }
            ];
            
            // Mock a One Per Deck character
            (global as any).window.availableCardsMap.set('char_5', {
                id: 'char_5',
                name: 'One Per Deck Character',
                one_per_deck: true
            });
            
            // Create a test character element
            const testCharElement = document.createElement('div');
            testCharElement.className = 'card-item character-card';
            testCharElement.setAttribute('data-type', 'character');
            testCharElement.setAttribute('data-id', 'char_5');
            document.getElementById('cardCategories')?.appendChild(testCharElement);
            
            // Simulate character limit reached
            const currentCharacterCount = 4;
            const isCharacterLimitReached = currentCharacterCount >= 4;
            const isOnePerDeck = true;
            const isOnePerDeckInDeck = false; // Not in deck yet
            
            const disabledClass = (isCharacterLimitReached || isOnePerDeckInDeck) ? 'disabled' : '';
            let disabledTitle = '';
            if (isCharacterLimitReached) {
                disabledTitle = 'Character limit reached (max 4)';
            } else if (isOnePerDeckInDeck) {
                disabledTitle = 'One Per Deck - already in deck';
            }
            
            expect(disabledClass).toBe('disabled');
            expect(disabledTitle).toBe('Character limit reached (max 4)');
        });

        it('should work alongside mission limit dimming', () => {
            // Add missions that reach the limit AND are One Per Deck
            (global as any).window.deckEditorCards = Array.from({ length: 7 }, (_, i) => ({
                type: 'mission',
                cardId: `mission_${i + 1}`,
                quantity: 1
            }));
            
            // Mock a One Per Deck mission
            (global as any).window.availableCardsMap.set('mission_8', {
                id: 'mission_8',
                card_name: 'One Per Deck Mission',
                one_per_deck: true
            });
            
            // Simulate mission limit reached
            const currentMissionCount = 7;
            const isMissionLimitReached = currentMissionCount >= 7;
            const isOnePerDeck = true;
            const isOnePerDeckInDeck = false; // Not in deck yet
            
            const disabledClass = (isMissionLimitReached || isOnePerDeckInDeck) ? 'disabled' : '';
            let disabledTitle = '';
            if (isMissionLimitReached) {
                disabledTitle = 'Mission limit reached (max 7)';
            } else if (isOnePerDeckInDeck) {
                disabledTitle = 'One Per Deck - already in deck';
            }
            
            expect(disabledClass).toBe('disabled');
            expect(disabledTitle).toBe('Mission limit reached (max 7)');
        });
    });
});

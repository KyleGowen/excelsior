/**
 * @jest-environment jsdom
 */

// Mock DOM elements
const mockDeckCardsEditor = {
    innerHTML: '',
    style: {
        display: '',
        flexDirection: '',
        flexWrap: '',
        alignItems: ''
    },
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
(global as any).getCardImagePath = jest.fn((card: any, type: any) => 
    `/src/resources/cards/images/${type}/${card.id}.webp`);
(global as any).showCardHoverModal = jest.fn();
(global as any).hideCardHoverModal = jest.fn();
(global as any).showAlternateArtSelectionForExistingCard = jest.fn();
(global as any).removeOneCardFromEditor = jest.fn();
(global as any).addOneCardToEditor = jest.fn();
(global as any).removeCardFromEditor = jest.fn();
(global as any).updateDeckEditorCardCount = jest.fn();
(global as any).updateDeckSummary = jest.fn();
(global as any).toggleCardViewCategory = jest.fn();
(global as any).getReserveCharacterButton = jest.fn(() => '');

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

// Mock SimulateKO
(global.window as any).SimulateKO = {
    isKOd: jest.fn(() => false),
    applyDimming: jest.fn()
};

// Helper function to extract character order from deck cards
function extractCharacterOrder(deckCards: any[]): string[] {
    const characterOrder: string[] = [];
    const characterCards = deckCards.filter(card => card.type === 'character');
    
    characterCards.forEach(cardData => {
        const characterCard = (global.window as any).availableCardsMap.get(cardData.cardId);
        if (characterCard && characterCard.name) {
            const characterName = (characterCard.name || '').trim();
            if (characterName && !characterOrder.includes(characterName)) {
                characterOrder.push(characterName);
            }
        }
    });
    
    return characterOrder;
}

// Helper function to sort special cards (mimics the actual implementation)
function sortSpecialCards(specialCards: any[], characterOrder: string[]): any[] {
    const copy = [...specialCards];
    copy.sort((a, b) => {
        const cardA = (global.window as any).availableCardsMap.get(a.cardId);
        const cardB = (global.window as any).availableCardsMap.get(b.cardId);
        if (!cardA || !cardB) return 0;
        
        const charA = (cardA.character || '').trim();
        const charB = (cardB.character || '').trim();
        
        // Check if either is "Any Character" (case-insensitive)
        const aIsAnyCharacter = !charA || charA.toLowerCase().includes('any character') || charA.toLowerCase() === 'any';
        const bIsAnyCharacter = !charB || charB.toLowerCase().includes('any character') || charB.toLowerCase() === 'any';
        
        // "Any Character" specials always go last
        if (aIsAnyCharacter && !bIsAnyCharacter) return 1;
        if (!aIsAnyCharacter && bIsAnyCharacter) return -1;
        if (aIsAnyCharacter && bIsAnyCharacter) {
            // Both are "Any Character", sort by card name
            const nameA = (cardA.name || cardA.card_name || '').trim();
            const nameB = (cardB.name || cardB.card_name || '').trim();
            return nameA.localeCompare(nameB);
        }
        
        // Both are regular character specials - sort by character order
        const indexA = characterOrder.indexOf(charA);
        const indexB = characterOrder.indexOf(charB);
        
        // If character not found in order, put it at the end (after "Any Character")
        if (indexA === -1 && indexB === -1) {
            // Neither found, sort by character name then card name
            const charCompare = charA.localeCompare(charB);
            if (charCompare !== 0) return charCompare;
            const nameA = (cardA.name || cardA.card_name || '').trim();
            const nameB = (cardB.name || cardB.card_name || '').trim();
            return nameA.localeCompare(nameB);
        }
        if (indexA === -1) return 1; // A not found, put it after B
        if (indexB === -1) return -1; // B not found, put it after A
        
        // Both found in order - sort by character order
        if (indexA !== indexB) return indexA - indexB;
        
        // Same character - sort by card name
        const nameA = (cardA.name || cardA.card_name || '').trim();
        const nameB = (cardB.name || cardB.card_name || '').trim();
        return nameA.localeCompare(nameB);
    });
    return copy;
}

describe('Card View Special Card Sorting', () => {
    beforeEach(() => {
        // Reset deck editor cards
        (global.window as any).deckEditorCards = [];
        
        // Clear all mocks
        jest.clearAllMocks();
        
        // Reset DOM
        mockDeckCardsEditor.innerHTML = '';
        
        // Reset availableCardsMap
        (global.window as any).availableCardsMap = new Map();
    });

    describe('Character Order Extraction', () => {
        test('should extract character order from Characters section', () => {
            // Setup characters
            const korak = { id: 'char-korak', name: 'Korak', threat_level: 3 };
            const tarzan = { id: 'char-tarzan', name: 'Tarzan', threat_level: 3 };
            const ra = { id: 'char-ra', name: 'Ra', threat_level: 3 };
            const leonidas = { id: 'char-leonidas', name: 'Leonidas', threat_level: 3 };
            
            (global.window as any).availableCardsMap.set('char-korak', korak);
            (global.window as any).availableCardsMap.set('char-tarzan', tarzan);
            (global.window as any).availableCardsMap.set('char-ra', ra);
            (global.window as any).availableCardsMap.set('char-leonidas', leonidas);
            
            const deckCards = [
                { id: 'deckcard-1', type: 'character', cardId: 'char-korak', quantity: 1 },
                { id: 'deckcard-2', type: 'character', cardId: 'char-tarzan', quantity: 1 },
                { id: 'deckcard-3', type: 'character', cardId: 'char-ra', quantity: 1 },
                { id: 'deckcard-4', type: 'character', cardId: 'char-leonidas', quantity: 1 }
            ];
            
            const characterOrder = extractCharacterOrder(deckCards);
            
            expect(characterOrder).toEqual(['Korak', 'Tarzan', 'Ra', 'Leonidas']);
        });

        test('should handle duplicate characters in order', () => {
            const korak = { id: 'char-korak', name: 'Korak', threat_level: 3 };
            (global.window as any).availableCardsMap.set('char-korak', korak);
            
            const deckCards = [
                { id: 'deckcard-1', type: 'character', cardId: 'char-korak', quantity: 1 },
                { id: 'deckcard-2', type: 'character', cardId: 'char-korak', quantity: 1 }
            ];
            
            const characterOrder = extractCharacterOrder(deckCards);
            
            expect(characterOrder).toEqual(['Korak']);
            expect(characterOrder.length).toBe(1);
        });

        test('should return empty array when no characters present', () => {
            const deckCards = [
                { id: 'deckcard-1', type: 'power', cardId: 'power-1', quantity: 1 }
            ];
            
            const characterOrder = extractCharacterOrder(deckCards);
            
            expect(characterOrder).toEqual([]);
        });

        test('should handle characters with missing names', () => {
            const korak = { id: 'char-korak', name: 'Korak', threat_level: 3 };
            const noName = { id: 'char-noname', threat_level: 3 };
            
            (global.window as any).availableCardsMap.set('char-korak', korak);
            (global.window as any).availableCardsMap.set('char-noname', noName);
            
            const deckCards = [
                { id: 'deckcard-1', type: 'character', cardId: 'char-korak', quantity: 1 },
                { id: 'deckcard-2', type: 'character', cardId: 'char-noname', quantity: 1 }
            ];
            
            const characterOrder = extractCharacterOrder(deckCards);
            
            expect(characterOrder).toEqual(['Korak']);
        });
    });

    describe('Special Card Sorting by Character Order', () => {
        test('should sort special cards by character order', () => {
            // Setup characters
            const korak = { id: 'char-korak', name: 'Korak', threat_level: 3 };
            const tarzan = { id: 'char-tarzan', name: 'Tarzan', threat_level: 3 };
            const ra = { id: 'char-ra', name: 'Ra', threat_level: 3 };
            const leonidas = { id: 'char-leonidas', name: 'Leonidas', threat_level: 3 };
            
            (global.window as any).availableCardsMap.set('char-korak', korak);
            (global.window as any).availableCardsMap.set('char-tarzan', tarzan);
            (global.window as any).availableCardsMap.set('char-ra', ra);
            (global.window as any).availableCardsMap.set('char-leonidas', leonidas);
            
            // Setup special cards
            const korakSpecial = { id: 'special-korak-1', name: 'Korak Special 1', character: 'Korak' };
            const tarzanSpecial = { id: 'special-tarzan-1', name: 'Tarzan Special 1', character: 'Tarzan' };
            const raSpecial = { id: 'special-ra-1', name: 'Ra Special 1', character: 'Ra' };
            const leonidasSpecial = { id: 'special-leonidas-1', name: 'Leonidas Special 1', character: 'Leonidas' };
            
            (global.window as any).availableCardsMap.set('special-korak-1', korakSpecial);
            (global.window as any).availableCardsMap.set('special-tarzan-1', tarzanSpecial);
            (global.window as any).availableCardsMap.set('special-ra-1', raSpecial);
            (global.window as any).availableCardsMap.set('special-leonidas-1', leonidasSpecial);
            
            const characterOrder = ['Korak', 'Tarzan', 'Ra', 'Leonidas'];
            const specialCards = [
                { id: 'deckcard-1', type: 'special', cardId: 'special-leonidas-1', quantity: 1 },
                { id: 'deckcard-2', type: 'special', cardId: 'special-korak-1', quantity: 1 },
                { id: 'deckcard-3', type: 'special', cardId: 'special-ra-1', quantity: 1 },
                { id: 'deckcard-4', type: 'special', cardId: 'special-tarzan-1', quantity: 1 }
            ];
            
            const sorted = sortSpecialCards(specialCards, characterOrder);
            
            expect(sorted[0].cardId).toBe('special-korak-1');
            expect(sorted[1].cardId).toBe('special-tarzan-1');
            expect(sorted[2].cardId).toBe('special-ra-1');
            expect(sorted[3].cardId).toBe('special-leonidas-1');
        });

        test('should sort multiple specials for same character alphabetically', () => {
            const korak = { id: 'char-korak', name: 'Korak', threat_level: 3 };
            (global.window as any).availableCardsMap.set('char-korak', korak);
            
            const korakSpecial1 = { id: 'special-korak-1', name: 'Zebra Attack', character: 'Korak' };
            const korakSpecial2 = { id: 'special-korak-2', name: 'Alpha Strike', character: 'Korak' };
            const korakSpecial3 = { id: 'special-korak-3', name: 'Beta Defense', character: 'Korak' };
            
            (global.window as any).availableCardsMap.set('special-korak-1', korakSpecial1);
            (global.window as any).availableCardsMap.set('special-korak-2', korakSpecial2);
            (global.window as any).availableCardsMap.set('special-korak-3', korakSpecial3);
            
            const characterOrder = ['Korak'];
            const specialCards = [
                { id: 'deckcard-1', type: 'special', cardId: 'special-korak-1', quantity: 1 },
                { id: 'deckcard-2', type: 'special', cardId: 'special-korak-2', quantity: 1 },
                { id: 'deckcard-3', type: 'special', cardId: 'special-korak-3', quantity: 1 }
            ];
            
            const sorted = sortSpecialCards(specialCards, characterOrder);
            
            expect(sorted[0].cardId).toBe('special-korak-2'); // Alpha Strike
            expect(sorted[1].cardId).toBe('special-korak-3'); // Beta Defense
            expect(sorted[2].cardId).toBe('special-korak-1'); // Zebra Attack
        });
    });

    describe('"Any Character" Specials Sorting', () => {
        test('should place "Any Character" specials at the end', () => {
            const korak = { id: 'char-korak', name: 'Korak', threat_level: 3 };
            (global.window as any).availableCardsMap.set('char-korak', korak);
            
            const korakSpecial = { id: 'special-korak-1', name: 'Korak Special', character: 'Korak' };
            const anyCharacterSpecial1 = { id: 'special-any-1', name: 'Any Special 1', character: 'Any Character' };
            const anyCharacterSpecial2 = { id: 'special-any-2', name: 'Any Special 2', character: 'Any Character' };
            
            (global.window as any).availableCardsMap.set('special-korak-1', korakSpecial);
            (global.window as any).availableCardsMap.set('special-any-1', anyCharacterSpecial1);
            (global.window as any).availableCardsMap.set('special-any-2', anyCharacterSpecial2);
            
            const characterOrder = ['Korak'];
            const specialCards = [
                { id: 'deckcard-1', type: 'special', cardId: 'special-any-1', quantity: 1 },
                { id: 'deckcard-2', type: 'special', cardId: 'special-korak-1', quantity: 1 },
                { id: 'deckcard-3', type: 'special', cardId: 'special-any-2', quantity: 1 }
            ];
            
            const sorted = sortSpecialCards(specialCards, characterOrder);
            
            expect(sorted[0].cardId).toBe('special-korak-1');
            expect(sorted[1].cardId).toBe('special-any-1');
            expect(sorted[2].cardId).toBe('special-any-2');
        });

        test('should handle "Any Character" with different case variations', () => {
            const korak = { id: 'char-korak', name: 'Korak', threat_level: 3 };
            (global.window as any).availableCardsMap.set('char-korak', korak);
            
            const korakSpecial = { id: 'special-korak-1', name: 'Korak Special', character: 'Korak' };
            const anyCharacter1 = { id: 'special-any-1', name: 'Any Special 1', character: 'any character' };
            const anyCharacter2 = { id: 'special-any-2', name: 'Any Special 2', character: 'ANY CHARACTER' };
            const anyCharacter3 = { id: 'special-any-3', name: 'Any Special 3', character: 'Any' };
            
            (global.window as any).availableCardsMap.set('special-korak-1', korakSpecial);
            (global.window as any).availableCardsMap.set('special-any-1', anyCharacter1);
            (global.window as any).availableCardsMap.set('special-any-2', anyCharacter2);
            (global.window as any).availableCardsMap.set('special-any-3', anyCharacter3);
            
            const characterOrder = ['Korak'];
            const specialCards = [
                { id: 'deckcard-1', type: 'special', cardId: 'special-any-1', quantity: 1 },
                { id: 'deckcard-2', type: 'special', cardId: 'special-korak-1', quantity: 1 },
                { id: 'deckcard-3', type: 'special', cardId: 'special-any-2', quantity: 1 },
                { id: 'deckcard-4', type: 'special', cardId: 'special-any-3', quantity: 1 }
            ];
            
            const sorted = sortSpecialCards(specialCards, characterOrder);
            
            expect(sorted[0].cardId).toBe('special-korak-1');
            // All "Any Character" variants should be at the end
            expect(sorted.slice(1).every(card => 
                card.cardId.startsWith('special-any-')
            )).toBe(true);
        });

        test('should sort "Any Character" specials alphabetically among themselves', () => {
            const korak = { id: 'char-korak', name: 'Korak', threat_level: 3 };
            (global.window as any).availableCardsMap.set('char-korak', korak);
            
            const korakSpecial = { id: 'special-korak-1', name: 'Korak Special', character: 'Korak' };
            const anyCharacter1 = { id: 'special-any-1', name: 'Zebra Power', character: 'Any Character' };
            const anyCharacter2 = { id: 'special-any-2', name: 'Alpha Strike', character: 'Any Character' };
            const anyCharacter3 = { id: 'special-any-3', name: 'Beta Defense', character: 'Any Character' };
            
            (global.window as any).availableCardsMap.set('special-korak-1', korakSpecial);
            (global.window as any).availableCardsMap.set('special-any-1', anyCharacter1);
            (global.window as any).availableCardsMap.set('special-any-2', anyCharacter2);
            (global.window as any).availableCardsMap.set('special-any-3', anyCharacter3);
            
            const characterOrder = ['Korak'];
            const specialCards = [
                { id: 'deckcard-1', type: 'special', cardId: 'special-any-1', quantity: 1 },
                { id: 'deckcard-2', type: 'special', cardId: 'special-korak-1', quantity: 1 },
                { id: 'deckcard-3', type: 'special', cardId: 'special-any-2', quantity: 1 },
                { id: 'deckcard-4', type: 'special', cardId: 'special-any-3', quantity: 1 }
            ];
            
            const sorted = sortSpecialCards(specialCards, characterOrder);
            
            expect(sorted[0].cardId).toBe('special-korak-1');
            expect(sorted[1].cardId).toBe('special-any-2'); // Alpha Strike
            expect(sorted[2].cardId).toBe('special-any-3'); // Beta Defense
            expect(sorted[3].cardId).toBe('special-any-1'); // Zebra Power
        });
    });

    describe('Edge Cases', () => {
        test('should handle special cards for characters not in deck', () => {
            const korak = { id: 'char-korak', name: 'Korak', threat_level: 3 };
            (global.window as any).availableCardsMap.set('char-korak', korak);
            
            const korakSpecial = { id: 'special-korak-1', name: 'Korak Special', character: 'Korak' };
            const unknownSpecial = { id: 'special-unknown-1', name: 'Unknown Special', character: 'Unknown Character' };
            
            (global.window as any).availableCardsMap.set('special-korak-1', korakSpecial);
            (global.window as any).availableCardsMap.set('special-unknown-1', unknownSpecial);
            
            const characterOrder = ['Korak'];
            const specialCards = [
                { id: 'deckcard-1', type: 'special', cardId: 'special-unknown-1', quantity: 1 },
                { id: 'deckcard-2', type: 'special', cardId: 'special-korak-1', quantity: 1 }
            ];
            
            const sorted = sortSpecialCards(specialCards, characterOrder);
            
            // Korak special should come first
            expect(sorted[0].cardId).toBe('special-korak-1');
            // Unknown character special should come after (but before "Any Character")
            expect(sorted[1].cardId).toBe('special-unknown-1');
        });

        test('should handle empty character order', () => {
            const korakSpecial = { id: 'special-korak-1', name: 'Korak Special', character: 'Korak' };
            const tarzanSpecial = { id: 'special-tarzan-1', name: 'Tarzan Special', character: 'Tarzan' };
            
            (global.window as any).availableCardsMap.set('special-korak-1', korakSpecial);
            (global.window as any).availableCardsMap.set('special-tarzan-1', tarzanSpecial);
            
            const characterOrder: string[] = [];
            const specialCards = [
                { id: 'deckcard-1', type: 'special', cardId: 'special-korak-1', quantity: 1 },
                { id: 'deckcard-2', type: 'special', cardId: 'special-tarzan-1', quantity: 1 }
            ];
            
            const sorted = sortSpecialCards(specialCards, characterOrder);
            
            // Should sort by character name alphabetically when not in order
            expect(sorted.length).toBe(2);
            expect(sorted[0].cardId).toBe('special-korak-1'); // K comes before T
            expect(sorted[1].cardId).toBe('special-tarzan-1');
        });

        test('should handle special cards with empty character field', () => {
            const korak = { id: 'char-korak', name: 'Korak', threat_level: 3 };
            (global.window as any).availableCardsMap.set('char-korak', korak);
            
            const korakSpecial = { id: 'special-korak-1', name: 'Korak Special', character: 'Korak' };
            const emptyCharacterSpecial = { id: 'special-empty-1', name: 'Empty Special', character: '' };
            
            (global.window as any).availableCardsMap.set('special-korak-1', korakSpecial);
            (global.window as any).availableCardsMap.set('special-empty-1', emptyCharacterSpecial);
            
            const characterOrder = ['Korak'];
            const specialCards = [
                { id: 'deckcard-1', type: 'special', cardId: 'special-empty-1', quantity: 1 },
                { id: 'deckcard-2', type: 'special', cardId: 'special-korak-1', quantity: 1 }
            ];
            
            const sorted = sortSpecialCards(specialCards, characterOrder);
            
            // Empty character should be treated as "Any Character" and go last
            expect(sorted[0].cardId).toBe('special-korak-1');
            expect(sorted[1].cardId).toBe('special-empty-1');
        });

        test('should handle missing card data gracefully', () => {
            const korak = { id: 'char-korak', name: 'Korak', threat_level: 3 };
            (global.window as any).availableCardsMap.set('char-korak', korak);
            
            const korakSpecial = { id: 'special-korak-1', name: 'Korak Special', character: 'Korak' };
            (global.window as any).availableCardsMap.set('special-korak-1', korakSpecial);
            
            const characterOrder = ['Korak'];
            const specialCards = [
                { id: 'deckcard-1', type: 'special', cardId: 'special-korak-1', quantity: 1 },
                { id: 'deckcard-2', type: 'special', cardId: 'nonexistent-card', quantity: 1 }
            ];
            
            // Should not throw error
            expect(() => sortSpecialCards(specialCards, characterOrder)).not.toThrow();
        });
    });

    describe('Complex Scenarios', () => {
        test('should handle full scenario: multiple characters with multiple specials and "Any Character"', () => {
            // Setup characters
            const korak = { id: 'char-korak', name: 'Korak', threat_level: 3 };
            const tarzan = { id: 'char-tarzan', name: 'Tarzan', threat_level: 3 };
            const ra = { id: 'char-ra', name: 'Ra', threat_level: 3 };
            const leonidas = { id: 'char-leonidas', name: 'Leonidas', threat_level: 3 };
            
            (global.window as any).availableCardsMap.set('char-korak', korak);
            (global.window as any).availableCardsMap.set('char-tarzan', tarzan);
            (global.window as any).availableCardsMap.set('char-ra', ra);
            (global.window as any).availableCardsMap.set('char-leonidas', leonidas);
            
            // Setup special cards
            const korakSpecial1 = { id: 'special-korak-1', name: 'Zebra Attack', character: 'Korak' };
            const korakSpecial2 = { id: 'special-korak-2', name: 'Alpha Strike', character: 'Korak' };
            const tarzanSpecial = { id: 'special-tarzan-1', name: 'Tarzan Special', character: 'Tarzan' };
            const raSpecial = { id: 'special-ra-1', name: 'Ra Special', character: 'Ra' };
            const leonidasSpecial = { id: 'special-leonidas-1', name: 'Leonidas Special', character: 'Leonidas' };
            const anyCharacter1 = { id: 'special-any-1', name: 'Zebra Power', character: 'Any Character' };
            const anyCharacter2 = { id: 'special-any-2', name: 'Alpha Power', character: 'Any Character' };
            
            (global.window as any).availableCardsMap.set('special-korak-1', korakSpecial1);
            (global.window as any).availableCardsMap.set('special-korak-2', korakSpecial2);
            (global.window as any).availableCardsMap.set('special-tarzan-1', tarzanSpecial);
            (global.window as any).availableCardsMap.set('special-ra-1', raSpecial);
            (global.window as any).availableCardsMap.set('special-leonidas-1', leonidasSpecial);
            (global.window as any).availableCardsMap.set('special-any-1', anyCharacter1);
            (global.window as any).availableCardsMap.set('special-any-2', anyCharacter2);
            
            const characterOrder = ['Korak', 'Tarzan', 'Ra', 'Leonidas'];
            const specialCards = [
                { id: 'deckcard-1', type: 'special', cardId: 'special-any-1', quantity: 1 },
                { id: 'deckcard-2', type: 'special', cardId: 'special-leonidas-1', quantity: 1 },
                { id: 'deckcard-3', type: 'special', cardId: 'special-korak-1', quantity: 1 },
                { id: 'deckcard-4', type: 'special', cardId: 'special-ra-1', quantity: 1 },
                { id: 'deckcard-5', type: 'special', cardId: 'special-tarzan-1', quantity: 1 },
                { id: 'deckcard-6', type: 'special', cardId: 'special-korak-2', quantity: 1 },
                { id: 'deckcard-7', type: 'special', cardId: 'special-any-2', quantity: 1 }
            ];
            
            const sorted = sortSpecialCards(specialCards, characterOrder);
            
            // Should be sorted: Korak (alphabetically), Tarzan, Ra, Leonidas, Any Character (alphabetically)
            expect(sorted[0].cardId).toBe('special-korak-2'); // Alpha Strike (Korak)
            expect(sorted[1].cardId).toBe('special-korak-1'); // Zebra Attack (Korak)
            expect(sorted[2].cardId).toBe('special-tarzan-1'); // Tarzan
            expect(sorted[3].cardId).toBe('special-ra-1'); // Ra
            expect(sorted[4].cardId).toBe('special-leonidas-1'); // Leonidas
            expect(sorted[5].cardId).toBe('special-any-2'); // Alpha Power (Any Character)
            expect(sorted[6].cardId).toBe('special-any-1'); // Zebra Power (Any Character)
        });
    });
});


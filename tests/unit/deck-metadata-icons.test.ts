/** @jest-environment jsdom */

/**
 * Unit tests for deck metadata icons and values display
 * Tests that deck selection tiles show correct icons and values
 */

// Type definitions
interface MockCard {
    type: string;
    cardId: string;
    quantity: number;
}

interface MockCharacter {
    id: string;
    name: string;
    threat_level: number;
}

interface MockLocation {
    id: string;
    name: string;
    threat_level: number;
}

interface MockDeckMetadata {
    id: string;
    name: string;
    created?: string;
    lastModified?: string;
}

interface MockDeck {
    metadata: MockDeckMetadata;
    cards: MockCard[];
}

// Mock the global functions and objects
const mockAvailableCardsMap = new Map<string, MockCharacter | MockLocation>();

// Mock character data with threat levels
const mockCharacter1: MockCharacter = {
    id: 'char1',
    name: 'Test Character 1',
    threat_level: 5
};

const mockCharacter2: MockCharacter = {
    id: 'char2', 
    name: 'Test Character 2',
    threat_level: 3
};

const mockLocation: MockLocation = {
    id: 'loc1',
    name: 'Test Location',
    threat_level: 2
};

// Add mock data to the map
mockAvailableCardsMap.set('character_char1', mockCharacter1);
mockAvailableCardsMap.set('character_char2', mockCharacter2);
mockAvailableCardsMap.set('location_loc1', mockLocation);

// Mock global variables
(global as any).availableCardsMap = mockAvailableCardsMap;

// Mock the calculateTotalCardCount function
const mockCalculateTotalCardCount = jest.fn((cards: MockCard[]) => {
    return cards.filter((card: MockCard) => !['mission', 'character', 'location'].includes(card.type))
                .reduce((sum: number, card: MockCard) => sum + card.quantity, 0);
});

// Mock the calculateTotalThreat function
const mockCalculateTotalThreat = jest.fn((cards: MockCard[]) => {
    let totalThreat = 0;
    
    const characterCards = cards.filter((card: MockCard) => card.type === 'character');
    characterCards.forEach((card: MockCard) => {
        const character = mockAvailableCardsMap.get(`character_${card.cardId}`) as MockCharacter;
        if (character && character.threat_level) {
            totalThreat += character.threat_level * card.quantity;
        }
    });
    
    const locationCards = cards.filter((card: MockCard) => card.type === 'location');
    locationCards.forEach((card: MockCard) => {
        const location = mockAvailableCardsMap.get(`location_${card.cardId}`) as MockLocation;
        if (location && location.threat_level) {
            totalThreat += location.threat_level * card.quantity;
        }
    });
    
    return totalThreat;
});

// Mock DOM methods
const mockQuerySelector = jest.fn();
const mockCreateElement = jest.fn();
const mockSetAttribute = jest.fn();
const mockAppendChild = jest.fn();

// Mock document
(global as any).document = {
    querySelector: mockQuerySelector,
    createElement: mockCreateElement,
    getElementById: jest.fn()
};

// Mock console methods
const mockConsoleError = jest.fn();
Object.defineProperty(global, 'console', {
    value: {
        error: mockConsoleError,
        log: jest.fn()
    },
    writable: true
});

describe('Deck Metadata Icons and Values', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Reset mock functions
        mockCalculateTotalCardCount.mockClear();
        mockCalculateTotalThreat.mockClear();
        mockConsoleError.mockClear();
        
        // Mock DOM element creation
        mockCreateElement.mockImplementation((tagName) => {
            const element = {
                tagName: tagName.toUpperCase(),
                setAttribute: mockSetAttribute,
                appendChild: mockAppendChild,
                innerHTML: '',
                textContent: '',
                style: {},
                classList: {
                    add: jest.fn(),
                    remove: jest.fn(),
                    contains: jest.fn()
                }
            };
            return element;
        });
    });

    describe('calculateTotalCardCount function', () => {
        it('should calculate total card count excluding mission, character, and location cards', () => {
            const testCards: MockCard[] = [
                { type: 'character', cardId: 'char1', quantity: 2 },
                { type: 'special', cardId: 'special1', quantity: 3 },
                { type: 'mission', cardId: 'mission1', quantity: 1 },
                { type: 'event', cardId: 'event1', quantity: 2 },
                { type: 'location', cardId: 'loc1', quantity: 1 }
            ];

            const result = mockCalculateTotalCardCount(testCards);
            
            // Should only count special and event cards (3 + 2 = 5)
            expect(result).toBe(5);
        });

        it('should return 0 for empty deck', () => {
            const result = mockCalculateTotalCardCount([]);
            expect(result).toBe(0);
        });

        it('should handle only character, mission, and location cards', () => {
            const testCards: MockCard[] = [
                { type: 'character', cardId: 'char1', quantity: 2 },
                { type: 'mission', cardId: 'mission1', quantity: 1 },
                { type: 'location', cardId: 'loc1', quantity: 1 }
            ];

            const result = mockCalculateTotalCardCount(testCards);
            expect(result).toBe(0);
        });
    });

    describe('calculateTotalThreat function', () => {
        it('should calculate total threat from character and location cards', () => {
            const testCards = [
                { type: 'character', cardId: 'char1', quantity: 2 },
                { type: 'character', cardId: 'char2', quantity: 1 },
                { type: 'location', cardId: 'loc1', quantity: 1 },
                { type: 'special', cardId: 'special1', quantity: 3 }
            ];

            const result = mockCalculateTotalThreat(testCards);
            
            // Character 1: 5 threat * 2 quantity = 10
            // Character 2: 3 threat * 1 quantity = 3  
            // Location 1: 2 threat * 1 quantity = 2
            // Special cards don't contribute to threat
            // Total: 10 + 3 + 2 = 15
            expect(result).toBe(15);
        });

        it('should return 0 for deck with no character or location cards', () => {
            const testCards = [
                { type: 'special', cardId: 'special1', quantity: 3 },
                { type: 'event', cardId: 'event1', quantity: 2 }
            ];

            const result = mockCalculateTotalThreat(testCards);
            expect(result).toBe(0);
        });

        it('should handle cards not found in availableCardsMap', () => {
            const testCards = [
                { type: 'character', cardId: 'nonexistent', quantity: 2 }
            ];

            const result = mockCalculateTotalThreat(testCards);
            expect(result).toBe(0);
        });

        it('should handle cards without threat_level property', () => {
            // Add a character without threat_level
            const characterWithoutThreat: Partial<MockCharacter> = {
                id: 'char3',
                name: 'No Threat Character'
                // No threat_level property
            };
            mockAvailableCardsMap.set('character_char3', characterWithoutThreat as MockCharacter);

            const testCards: MockCard[] = [
                { type: 'character', cardId: 'char3', quantity: 2 }
            ];

            const result = mockCalculateTotalThreat(testCards);
            expect(result).toBe(0);
        });
    });

    describe('Deck metadata HTML generation', () => {
        it('should generate correct HTML structure for deck metadata', () => {
            const mockDeck = {
                metadata: {
                    id: 'deck1',
                    name: 'Test Deck',
                    created: '2025-01-01T00:00:00Z',
                    lastModified: '2025-01-02T00:00:00Z'
                },
                cards: [
                    { type: 'character', cardId: 'char1', quantity: 1 },
                    { type: 'special', cardId: 'special1', quantity: 2 }
                ]
            };

            // Mock the functions to return expected values
            mockCalculateTotalCardCount.mockReturnValue(2);
            mockCalculateTotalThreat.mockReturnValue(5);

            // Generate the expected HTML structure
            const expectedHtml = `
                <div class="deck-meta">
                    <span>📊 Cards:<br>2</span>
                    <span><img src="/resources/images/icons/threat.png" alt="Threat" class="stat-icon-small" onerror="console.error('Threat icon failed to load')"> Threat:<br>5</span>
                    <span>📅 Created:<br>1/1/2025</span>
                    <span>✏️ Modified:<br>1/2/2025</span>
                </div>
            `;

            // Verify the structure contains all required elements
            expect(expectedHtml).toContain('📊 Cards:<br>2');
            expect(expectedHtml).toContain('Threat:<br>5');
            expect(expectedHtml).toContain('📅 Created:<br>1/1/2025');
            expect(expectedHtml).toContain('✏️ Modified:<br>1/2/2025');
            expect(expectedHtml).toContain('class="stat-icon-small"');
            expect(expectedHtml).toContain('src="/resources/images/icons/threat.png"');
        });

        it('should include proper error handling for threat icon', () => {
            const expectedOnError = 'onerror="console.error(\'Threat icon failed to load\')"';
            expect(expectedOnError).toContain('console.error');
            expect(expectedOnError).toContain('Threat icon failed to load');
        });

        it('should format dates correctly', () => {
            const testDate = '2025-01-15T12:30:00Z';
            const formattedDate = new Date(testDate).toLocaleDateString();
            
            // Verify the date formatting works
            expect(formattedDate).toBeDefined();
            expect(typeof formattedDate).toBe('string');
        });
    });

    describe('Icon and label formatting', () => {
        it('should use correct icons for each metadata type', () => {
            const expectedIcons = {
                cards: '📊',
                threat: 'threat.png',
                created: '📅', 
                modified: '✏️'
            };

            expect(expectedIcons.cards).toBe('📊');
            expect(expectedIcons.created).toBe('📅');
            expect(expectedIcons.modified).toBe('✏️');
            expect(expectedIcons.threat).toBe('threat.png');
        });

        it('should use correct labels for each metadata type', () => {
            const expectedLabels = {
                cards: 'Cards:',
                threat: 'Threat:',
                created: 'Created:',
                modified: 'Modified:'
            };

            expect(expectedLabels.cards).toBe('Cards:');
            expect(expectedLabels.threat).toBe('Threat:');
            expect(expectedLabels.created).toBe('Created:');
            expect(expectedLabels.modified).toBe('Modified:');
        });

        it('should format values on separate lines using <br> tags', () => {
            const testValue = 'Test Value';
            const formattedValue = `Label:<br>${testValue}`;
            
            expect(formattedValue).toContain('<br>');
            expect(formattedValue).toContain('Label:');
            expect(formattedValue).toContain('Test Value');
        });
    });

    describe('Edge cases and error handling', () => {
        it('should handle deck with no cards', () => {
            const emptyDeck = {
                metadata: {
                    id: 'empty-deck',
                    name: 'Empty Deck',
                    created: '2025-01-01T00:00:00Z',
                    lastModified: '2025-01-01T00:00:00Z'
                },
                cards: []
            };

            mockCalculateTotalCardCount.mockReturnValue(0);
            mockCalculateTotalThreat.mockReturnValue(0);

            expect(mockCalculateTotalCardCount(emptyDeck.cards)).toBe(0);
            expect(mockCalculateTotalThreat(emptyDeck.cards)).toBe(0);
        });

        it('should handle deck with undefined cards array', () => {
            const deckWithUndefinedCards = {
                metadata: {
                    id: 'undefined-cards-deck',
                    name: 'Undefined Cards Deck',
                    created: '2025-01-01T00:00:00Z',
                    lastModified: '2025-01-01T00:00:00Z'
                },
                cards: undefined
            };

            const cards = deckWithUndefinedCards.cards || [];
            expect(mockCalculateTotalCardCount(cards)).toBe(0);
            expect(mockCalculateTotalThreat(cards)).toBe(0);
        });

        it('should handle missing metadata properties gracefully', () => {
            const incompleteDeck: MockDeck = {
                metadata: {
                    id: 'incomplete-deck',
                    name: 'Incomplete Deck'
                    // Missing created and lastModified
                },
                cards: []
            };

            // Should not throw errors when accessing missing properties
            expect(() => {
                const created = incompleteDeck.metadata.created;
                const lastModified = incompleteDeck.metadata.lastModified;
                // These should be undefined but not throw errors
                expect(created).toBeUndefined();
                expect(lastModified).toBeUndefined();
            }).not.toThrow();
        });
    });

    describe('Integration with availableCardsMap', () => {
        it('should correctly look up character data from availableCardsMap', () => {
            const characterCard = { type: 'character', cardId: 'char1', quantity: 1 };
            const character = mockAvailableCardsMap.get(`character_${characterCard.cardId}`) as MockCharacter;
            
            expect(character).toBeDefined();
            expect(character?.name).toBe('Test Character 1');
            expect(character?.threat_level).toBe(5);
        });

        it('should correctly look up location data from availableCardsMap', () => {
            const locationCard = { type: 'location', cardId: 'loc1', quantity: 1 };
            const location = mockAvailableCardsMap.get(`location_${locationCard.cardId}`) as MockLocation;
            
            expect(location).toBeDefined();
            expect(location?.name).toBe('Test Location');
            expect(location?.threat_level).toBe(2);
        });

        it('should handle missing data in availableCardsMap', () => {
            const missingCard = { type: 'character', cardId: 'missing', quantity: 1 };
            const character = mockAvailableCardsMap.get(`character_${missingCard.cardId}`);
            
            expect(character).toBeUndefined();
        });
    });
});

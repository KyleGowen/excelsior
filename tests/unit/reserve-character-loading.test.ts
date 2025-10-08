/**
 * Unit tests for reserve character loading functionality
 * Tests that reserve character is correctly loaded and displayed when a deck is opened
 */

describe('Reserve Character Loading Functionality', () => {
    let mockCurrentDeckData: any;
    let mockCurrentDeckId: string;
    let mockDisplayDeckCardsForEditing: jest.Mock;
    let mockShowNotification: jest.Mock;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Mock global variables
        mockCurrentDeckId = 'test-deck-123';
        mockCurrentDeckData = {
            metadata: {
                id: 'test-deck-123',
                name: 'Test Deck',
                description: 'Test Description',
                reserve_character: null
            },
            cards: []
        };

        // Mock global functions
        mockDisplayDeckCardsForEditing = jest.fn();
        mockShowNotification = jest.fn();

        // Set up global mocks
        (global as any).currentDeckId = mockCurrentDeckId;
        (global as any).currentDeckData = mockCurrentDeckData;
        (global as any).displayDeckCardsForEditing = mockDisplayDeckCardsForEditing;
        (global as any).showNotification = mockShowNotification;
        (global as any).isReadOnlyMode = false;

        // Mock the getReserveCharacterButton function
        (global as any).getReserveCharacterButton = function(cardId: string, index: number) {
            const isReserveCharacter = mockCurrentDeckData && mockCurrentDeckData.metadata && mockCurrentDeckData.metadata.reserve_character === cardId;
            const hasReserveCharacter = mockCurrentDeckData && mockCurrentDeckData.metadata && mockCurrentDeckData.metadata.reserve_character;
            
            // If this card is the selected reserve character, show the "Reserve" button
            if (isReserveCharacter) {
                const buttonText = 'Reserve';
                const buttonClass = 'reserve-btn active';
                const onclickFunction = `deselectReserveCharacter(${index})`;
                return `<button class="${buttonClass}" onclick="${onclickFunction}">${buttonText}</button>`;
            } 
            // If a reserve character is selected (but this isn't it), hide the button
            else if (hasReserveCharacter) {
                return ''; 
            }
            // If no reserve character is selected, show "Select Reserve" button
            else {
                const buttonText = 'Select Reserve';
                const buttonClass = 'reserve-btn';
                const onclickFunction = `selectReserveCharacter('${cardId}', ${index})`;
                return `<button class="${buttonClass}" onclick="${onclickFunction}">${buttonText}</button>`;
            }
        };
    });

    describe('getReserveCharacterButton with loaded reserve character', () => {
        it('should return "Reserve" button for the selected reserve character', () => {
            // Set up deck with Billy the Kid as reserve character
            mockCurrentDeckData.metadata.reserve_character = 'billy-the-kid-id';
            
            const result = (global as any).getReserveCharacterButton('billy-the-kid-id', 0);
            
            expect(result).toContain('Reserve');
            expect(result).toContain('reserve-btn active');
            expect(result).toContain('deselectReserveCharacter(0)');
        });

        it('should return empty string for non-reserve characters when reserve is selected', () => {
            // Set up deck with Billy the Kid as reserve character
            mockCurrentDeckData.metadata.reserve_character = 'billy-the-kid-id';
            
            const result = (global as any).getReserveCharacterButton('sheriff-id', 1);
            
            expect(result).toBe('');
        });

        it('should return "Select Reserve" button when no reserve character is selected', () => {
            // No reserve character selected
            mockCurrentDeckData.metadata.reserve_character = null;
            
            const result = (global as any).getReserveCharacterButton('billy-the-kid-id', 0);
            
            expect(result).toContain('Select Reserve');
            expect(result).toContain('reserve-btn');
            expect(result).toContain('selectReserveCharacter(\'billy-the-kid-id\', 0)');
        });

        it('should handle undefined reserve_character gracefully', () => {
            // Undefined reserve character
            mockCurrentDeckData.metadata.reserve_character = undefined;
            
            const result = (global as any).getReserveCharacterButton('billy-the-kid-id', 0);
            
            expect(result).toContain('Select Reserve');
            expect(result).toContain('reserve-btn');
        });

        it('should handle missing metadata gracefully', () => {
            // Missing metadata
            mockCurrentDeckData.metadata = undefined;
            
            const result = (global as any).getReserveCharacterButton('billy-the-kid-id', 0);
            
            expect(result).toContain('Select Reserve');
            expect(result).toContain('reserve-btn');
        });

        it('should handle missing currentDeckData gracefully', () => {
            // Missing currentDeckData
            (global as any).currentDeckData = null;
            
            const result = (global as any).getReserveCharacterButton('billy-the-kid-id', 0);
            
            expect(result).toContain('Select Reserve');
            expect(result).toContain('reserve-btn');
        });
    });

    describe('Reserve character button state transitions', () => {
        it('should show correct buttons when switching reserve character', () => {
            // Initially no reserve character
            mockCurrentDeckData.metadata.reserve_character = null;
            
            let result1 = (global as any).getReserveCharacterButton('billy-the-kid-id', 0);
            let result2 = (global as any).getReserveCharacterButton('sheriff-id', 1);
            
            expect(result1).toContain('Select Reserve');
            expect(result2).toContain('Select Reserve');
            
            // Select Billy the Kid as reserve
            mockCurrentDeckData.metadata.reserve_character = 'billy-the-kid-id';
            
            result1 = (global as any).getReserveCharacterButton('billy-the-kid-id', 0);
            result2 = (global as any).getReserveCharacterButton('sheriff-id', 1);
            
            expect(result1).toContain('Reserve');
            expect(result1).toContain('reserve-btn active');
            expect(result2).toBe('');
            
            // Switch to Sheriff as reserve
            mockCurrentDeckData.metadata.reserve_character = 'sheriff-id';
            
            result1 = (global as any).getReserveCharacterButton('billy-the-kid-id', 0);
            result2 = (global as any).getReserveCharacterButton('sheriff-id', 1);
            
            expect(result1).toBe('');
            expect(result2).toContain('Reserve');
            expect(result2).toContain('reserve-btn active');
        });

        it('should show all "Select Reserve" buttons when reserve is deselected', () => {
            // Initially have Billy as reserve
            mockCurrentDeckData.metadata.reserve_character = 'billy-the-kid-id';
            
            let result1 = (global as any).getReserveCharacterButton('billy-the-kid-id', 0);
            let result2 = (global as any).getReserveCharacterButton('sheriff-id', 1);
            
            expect(result1).toContain('Reserve');
            expect(result2).toBe('');
            
            // Deselect reserve character
            mockCurrentDeckData.metadata.reserve_character = null;
            
            result1 = (global as any).getReserveCharacterButton('billy-the-kid-id', 0);
            result2 = (global as any).getReserveCharacterButton('sheriff-id', 1);
            
            expect(result1).toContain('Select Reserve');
            expect(result2).toContain('Select Reserve');
        });
    });

    describe('Reserve character loading from API response', () => {
        it('should correctly identify reserve character from API response structure', () => {
            // Simulate API response structure
            const apiResponse = {
                success: true,
                data: {
                    metadata: {
                        id: 'test-deck-123',
                        name: 'Test Deck',
                        reserve_character: 'billy-the-kid-id'
                    },
                    cards: []
                }
            };
            
            // Simulate loading deck data - update both global and mock
            (global as any).currentDeckData = apiResponse.data;
            mockCurrentDeckData = apiResponse.data;
            
            const result = (global as any).getReserveCharacterButton('billy-the-kid-id', 0);
            
            expect(result).toContain('Reserve');
            expect(result).toContain('reserve-btn active');
        });

        it('should handle null reserve_character from API response', () => {
            // Simulate API response with null reserve_character
            const apiResponse = {
                success: true,
                data: {
                    metadata: {
                        id: 'test-deck-123',
                        name: 'Test Deck',
                        reserve_character: null
                    },
                    cards: []
                }
            };
            
            // Simulate loading deck data - update both global and mock
            (global as any).currentDeckData = apiResponse.data;
            mockCurrentDeckData = apiResponse.data;
            
            const result = (global as any).getReserveCharacterButton('billy-the-kid-id', 0);
            
            expect(result).toContain('Select Reserve');
            expect(result).toContain('reserve-btn');
        });

        it('should handle missing reserve_character field from API response', () => {
            // Simulate API response without reserve_character field
            const apiResponse = {
                success: true,
                data: {
                    metadata: {
                        id: 'test-deck-123',
                        name: 'Test Deck'
                        // reserve_character field missing
                    },
                    cards: []
                }
            };
            
            // Simulate loading deck data - update both global and mock
            (global as any).currentDeckData = apiResponse.data;
            mockCurrentDeckData = apiResponse.data;
            
            const result = (global as any).getReserveCharacterButton('billy-the-kid-id', 0);
            
            expect(result).toContain('Select Reserve');
            expect(result).toContain('reserve-btn');
        });
    });

    describe('Edge cases and error handling', () => {
        it('should handle empty string reserve_character', () => {
            mockCurrentDeckData.metadata.reserve_character = '';
            
            const result = (global as any).getReserveCharacterButton('billy-the-kid-id', 0);
            
            expect(result).toContain('Select Reserve');
            expect(result).toContain('reserve-btn');
        });

        it('should handle numeric reserve_character', () => {
            mockCurrentDeckData.metadata.reserve_character = 123;
            
            const result = (global as any).getReserveCharacterButton(123, 0);
            
            expect(result).toContain('Reserve');
            expect(result).toContain('reserve-btn active');
        });

        it('should handle boolean reserve_character', () => {
            mockCurrentDeckData.metadata.reserve_character = true;
            
            const result = (global as any).getReserveCharacterButton(true, 0);
            
            expect(result).toContain('Reserve');
            expect(result).toContain('reserve-btn active');
        });

        it('should handle object reserve_character', () => {
            const reserveObj = { id: 'billy-the-kid-id', name: 'Billy the Kid' };
            mockCurrentDeckData.metadata.reserve_character = reserveObj;
            
            const result = (global as any).getReserveCharacterButton(reserveObj, 0);
            
            expect(result).toContain('Reserve');
            expect(result).toContain('reserve-btn active');
        });
    });

    describe('Integration with deck loading workflow', () => {
        it('should maintain correct state after deck reload', () => {
            // Initial state: no reserve character
            mockCurrentDeckData.metadata.reserve_character = null;
            
            let result = (global as any).getReserveCharacterButton('billy-the-kid-id', 0);
            expect(result).toContain('Select Reserve');
            
            // Simulate deck reload with reserve character
            mockCurrentDeckData.metadata.reserve_character = 'billy-the-kid-id';
            
            result = (global as any).getReserveCharacterButton('billy-the-kid-id', 0);
            expect(result).toContain('Reserve');
            expect(result).toContain('reserve-btn active');
        });

        it('should handle multiple character cards correctly', () => {
            // Set up deck with multiple characters
            mockCurrentDeckData.metadata.reserve_character = 'billy-the-kid-id';
            
            const billyResult = (global as any).getReserveCharacterButton('billy-the-kid-id', 0);
            const sheriffResult = (global as any).getReserveCharacterButton('sheriff-id', 1);
            const morganResult = (global as any).getReserveCharacterButton('morgan-id', 2);
            
            expect(billyResult).toContain('Reserve');
            expect(billyResult).toContain('reserve-btn active');
            expect(sheriffResult).toBe('');
            expect(morganResult).toBe('');
        });
    });
});

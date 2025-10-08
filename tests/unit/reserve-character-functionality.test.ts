/**
 * @jest-environment jsdom
 */

describe('Reserve Character Functionality', () => {
    let mockCurrentDeckData: any;
    let mockCurrentDeckId: string;
    let mockFetch: jest.MockedFunction<typeof fetch>;
    let mockShowNotification: jest.MockedFunction<any>;
    let mockDisplayDeckCardsForEditing: jest.MockedFunction<any>;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Mock global variables
        mockCurrentDeckData = {
            id: 'test-deck-123',
            name: 'Test Deck',
            description: 'Test Description',
            is_limited: false,
            is_valid: true,
            reserve_character: null
        };
        mockCurrentDeckId = 'test-deck-123';
        
        // Mock global variables
        (global as any).currentDeckData = mockCurrentDeckData;
        (global as any).currentDeckId = mockCurrentDeckId;
        
        // Mock fetch
        mockFetch = jest.fn();
        global.fetch = mockFetch;
        
        // Mock functions
        mockShowNotification = jest.fn();
        mockDisplayDeckCardsForEditing = jest.fn();
        
        (global as any).showNotification = mockShowNotification;
        (global as any).displayDeckCardsForEditing = mockDisplayDeckCardsForEditing;
    });

    describe('getReserveCharacterButton', () => {
        beforeEach(() => {
            // Define the function in global scope for testing
            (global as any).getReserveCharacterButton = function(cardId: string, index: number) {
                const currentDeckData = (global as any).currentDeckData;
                const isReserveCharacter = currentDeckData && currentDeckData.reserve_character === cardId;
                const hasReserveCharacter = currentDeckData && currentDeckData.reserve_character;
                
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

        it('should return "Select Reserve" button when no reserve character is set', () => {
            const result = (global as any).getReserveCharacterButton('char-123', 0);
            
            expect(result).toContain('Select Reserve');
            expect(result).toContain('reserve-btn');
            expect(result).not.toContain('active');
            expect(result).toContain('selectReserveCharacter(\'char-123\', 0)');
        });

        it('should return "Reserve" button when character is the reserve character', () => {
            mockCurrentDeckData.reserve_character = 'char-123';
            
            const result = (global as any).getReserveCharacterButton('char-123', 0);
            
            expect(result).toContain('Reserve');
            expect(result).toContain('reserve-btn active');
            expect(result).toContain('deselectReserveCharacter(0)');
        });

        it('should return empty string when different character is reserve', () => {
            mockCurrentDeckData.reserve_character = 'char-456';
            (global as any).currentDeckData.reserve_character = 'char-456';
            
            const result = (global as any).getReserveCharacterButton('char-123', 0);
            
            expect(result).toBe('');
        });
    });

    describe('selectReserveCharacter', () => {
        beforeEach(() => {
            // Define the function in global scope for testing
            (global as any).selectReserveCharacter = async function(cardId: string, index: number) {
                if (!(global as any).currentDeckId || !(global as any).currentDeckData) {
                    (global as any).showNotification('No deck selected', 'error');
                    return;
                }

                // Check if in read-only mode
                if ((global as any).isReadOnlyMode) {
                    alert('Cannot modify deck in read-only mode. You are viewing another user\'s deck.');
                    return;
                }

                // Update local deck data only - changes will be persisted when user clicks Save
                (global as any).currentDeckData.reserve_character = cardId;
                (global as any).showNotification('Reserve character selected! (Click Save to persist changes)', 'success');
                
                // Re-render the entire deck to ensure all buttons are updated correctly
                await (global as any).displayDeckCardsForEditing();
            };
        });

        it('should successfully select a reserve character', async () => {
            await (global as any).selectReserveCharacter('char-123', 0);

            // Should update local state only, no API call
            expect(mockFetch).not.toHaveBeenCalled();
            expect(mockCurrentDeckData.reserve_character).toBe('char-123');
            expect(mockShowNotification).toHaveBeenCalledWith('Reserve character selected! (Click Save to persist changes)', 'success');
            expect(mockDisplayDeckCardsForEditing).toHaveBeenCalled();
        });

        it('should prevent selection in read-only mode', async () => {
            (global as any).isReadOnlyMode = true;
            const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

            await (global as any).selectReserveCharacter('char-123', 0);

            expect(mockAlert).toHaveBeenCalledWith('Cannot modify deck in read-only mode. You are viewing another user\'s deck.');
            expect(mockCurrentDeckData.reserve_character).toBeNull();
            expect(mockShowNotification).not.toHaveBeenCalled();
            expect(mockDisplayDeckCardsForEditing).not.toHaveBeenCalled();

            mockAlert.mockRestore();
            (global as any).isReadOnlyMode = false;
        });

        it('should show error when no deck is selected', async () => {
            (global as any).currentDeckId = null;

            await (global as any).selectReserveCharacter('char-123', 0);

            expect(mockShowNotification).toHaveBeenCalledWith('No deck selected', 'error');
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('deselectReserveCharacter', () => {
        beforeEach(() => {
            // Define the function in global scope for testing
            (global as any).deselectReserveCharacter = async function(index: number) {
                if (!(global as any).currentDeckId || !(global as any).currentDeckData) {
                    (global as any).showNotification('No deck selected', 'error');
                    return;
                }

                // Check if in read-only mode
                if ((global as any).isReadOnlyMode) {
                    alert('Cannot modify deck in read-only mode. You are viewing another user\'s deck.');
                    return;
                }

                // Update local deck data only - changes will be persisted when user clicks Save
                (global as any).currentDeckData.reserve_character = null;
                (global as any).showNotification('Reserve character deselected! (Click Save to persist changes)', 'success');
                
                // Re-render the entire deck to ensure all buttons are updated correctly
                await (global as any).displayDeckCardsForEditing();
            };
        });

        it('should successfully deselect a reserve character', async () => {
            mockCurrentDeckData.reserve_character = 'char-123';
            (global as any).currentDeckData.reserve_character = 'char-123';

            await (global as any).deselectReserveCharacter(0);

            // Should update local state only, no API call
            expect(mockFetch).not.toHaveBeenCalled();
            expect(mockCurrentDeckData.reserve_character).toBeNull();
            expect(mockShowNotification).toHaveBeenCalledWith('Reserve character deselected! (Click Save to persist changes)', 'success');
            expect(mockDisplayDeckCardsForEditing).toHaveBeenCalled();
        });

        it('should prevent deselection in read-only mode', async () => {
            mockCurrentDeckData.reserve_character = 'char-123';
            (global as any).currentDeckData.reserve_character = 'char-123';
            (global as any).isReadOnlyMode = true;
            const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

            await (global as any).deselectReserveCharacter(0);

            expect(mockAlert).toHaveBeenCalledWith('Cannot modify deck in read-only mode. You are viewing another user\'s deck.');
            expect(mockCurrentDeckData.reserve_character).toBe('char-123'); // Should remain unchanged
            expect(mockShowNotification).not.toHaveBeenCalled();
            expect(mockDisplayDeckCardsForEditing).not.toHaveBeenCalled();

            mockAlert.mockRestore();
            (global as any).isReadOnlyMode = false;
        });

        it('should show error when no deck is selected', async () => {
            (global as any).currentDeckId = null;

            await (global as any).deselectReserveCharacter(0);

            expect(mockShowNotification).toHaveBeenCalledWith('No deck selected', 'error');
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });
});

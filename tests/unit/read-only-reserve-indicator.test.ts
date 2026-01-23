/**
 * Unit tests for read-only reserve indicator functionality
 * Tests that the reserve indicator shows correctly in read-only mode
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
let isReadOnlyMode: boolean = false;

// Mock the getReserveCharacterButton function
function getReserveCharacterButton(cardId: string, index: number): string {
    const isReserveCharacter = currentDeckData && currentDeckData.metadata && currentDeckData.metadata.reserve_character === cardId;
    const hasReserveCharacter = currentDeckData && currentDeckData.metadata && currentDeckData.metadata.reserve_character;
    
    // In read-only mode, show a disabled Reserve button only for the selected reserve character
    if (isReadOnlyMode) {
        if (hasReserveCharacter && isReserveCharacter) {
            return `<button class="reserve-btn active" disabled>Reserve</button>`;
        }
        return ''; // Hide all reserve buttons when no reserve is selected
    }
    
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
}

describe('Read-Only Reserve Indicator Functionality', () => {
    beforeEach(() => {
        // Reset the DOM
        document.querySelectorAll('.deck-card-editor-reserve').forEach(el => {
            el.innerHTML = '';
        });
        document.querySelectorAll('.deck-list-item-actions').forEach(el => {
            const reserveBtn = el.querySelector('.reserve-btn, .reserve-indicator');
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
        ];

        availableCardsMap = new Map([
            ['card-1', { name: 'Joan of Arc', threat_level: 18 }],
            ['card-2', { name: 'Victory Harben', threat_level: 18 }],
            ['card-3', { name: 'Sherlock Holmes', threat_level: 20 }],
        ]);

        isReadOnlyMode = false;
    });

    describe('Edit Mode (isReadOnlyMode = false)', () => {
        it('should show "Select Reserve" buttons when no reserve character is selected', () => {
            const result = getReserveCharacterButton('card-1', 0);
            expect(result).toContain('Select Reserve');
            expect(result).toContain('reserve-btn');
            expect(result).toContain('button');
            expect(result).toContain('selectReserveCharacter');
        });

        it('should show "Reserve" button for selected reserve character', () => {
            currentDeckData.metadata.reserve_character = 'card-2';
            
            const result = getReserveCharacterButton('card-2', 1);
            expect(result).toContain('Reserve');
            expect(result).toContain('reserve-btn active');
            expect(result).toContain('button');
            expect(result).toContain('deselectReserveCharacter');
        });

        it('should show empty string for non-reserve characters when reserve is selected', () => {
            currentDeckData.metadata.reserve_character = 'card-2';
            
            const result = getReserveCharacterButton('card-1', 0);
            expect(result).toBe('');
        });
    });

    describe('Read-Only Mode (isReadOnlyMode = true)', () => {
        beforeEach(() => {
            isReadOnlyMode = true;
        });

        it('should show disabled reserve button for selected reserve character', () => {
            currentDeckData.metadata.reserve_character = 'card-2';
            
            const result = getReserveCharacterButton('card-2', 1);
            expect(result).toContain('Reserve');
            expect(result).toContain('reserve-btn active');
            expect(result).toContain('button');
            expect(result).toContain('disabled');
            expect(result).not.toContain('onclick');
        });

        it('should show empty string for non-reserve characters', () => {
            currentDeckData.metadata.reserve_character = 'card-2';
            
            const result = getReserveCharacterButton('card-1', 0);
            expect(result).toBe('');
        });

        it('should show empty string for all characters when no reserve is selected', () => {
            const result1 = getReserveCharacterButton('card-1', 0);
            const result2 = getReserveCharacterButton('card-2', 1);
            const result3 = getReserveCharacterButton('card-3', 2);
            
            expect(result1).toBe('');
            expect(result2).toBe('');
            expect(result3).toBe('');
        });

        it('should not include any interactive elements (onclick) in read-only mode', () => {
            currentDeckData.metadata.reserve_character = 'card-2';
            
            const result = getReserveCharacterButton('card-2', 1);
            expect(result).not.toContain('onclick');
            expect(result).toContain('button');
            expect(result).toContain('disabled');
        });
    });

    describe('HTML Structure Validation', () => {
        beforeEach(() => {
            isReadOnlyMode = true;
            currentDeckData.metadata.reserve_character = 'card-2';
        });

        it('should generate valid HTML for disabled reserve button', () => {
            const result = getReserveCharacterButton('card-2', 1);
            
            expect(result).toBe('<button class="reserve-btn active" disabled>Reserve</button>');
        });

        it('should have correct CSS class for styling', () => {
            const result = getReserveCharacterButton('card-2', 1);
            expect(result).toContain('class="reserve-btn active"');
            expect(result).toContain('disabled');
        });

        it('should have correct text content', () => {
            const result = getReserveCharacterButton('card-2', 1);
            expect(result).toContain('>Reserve<');
        });
    });

    describe('Edge Cases', () => {
        beforeEach(() => {
            isReadOnlyMode = true;
        });

        it('should handle missing currentDeckData gracefully', () => {
            currentDeckData = null;
            
            const result = getReserveCharacterButton('card-1', 0);
            expect(result).toBe('');
        });

        it('should handle missing metadata gracefully', () => {
            currentDeckData = {};
            
            const result = getReserveCharacterButton('card-1', 0);
            expect(result).toBe('');
        });

        it('should handle missing reserve_character gracefully', () => {
            currentDeckData = { metadata: {} };
            
            const result = getReserveCharacterButton('card-1', 0);
            expect(result).toBe('');
        });

        it('should handle null reserve_character', () => {
            currentDeckData = { metadata: { reserve_character: null } };
            
            const result = getReserveCharacterButton('card-1', 0);
            expect(result).toBe('');
        });
    });

    describe('Mode Switching', () => {
        it('should switch between edit and read-only modes correctly', () => {
            currentDeckData.metadata.reserve_character = 'card-2';
            
            // Test edit mode
            isReadOnlyMode = false;
            const editResult = getReserveCharacterButton('card-2', 1);
            expect(editResult).toContain('button');
            expect(editResult).toContain('onclick');
            
            // Test read-only mode
            isReadOnlyMode = true;
            const readOnlyResult = getReserveCharacterButton('card-2', 1);
            expect(readOnlyResult).toContain('button');
            expect(readOnlyResult).toContain('disabled');
            expect(readOnlyResult).not.toContain('onclick');
        });
    });
});

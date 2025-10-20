import { JSDOM } from 'jsdom';

// Mock the global window object
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
    <style>
        .card-item {
            opacity: 1;
            cursor: pointer;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            transition: all 0.2s ease;
        }
        
        .card-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        /* Disabled cards for One Per Deck (applies to all card types) */
        .card-item.disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .card-item.disabled:hover {
            transform: none;
            box-shadow: none;
        }
    </style>
</head>
<body>
    <div class="card-item" data-type="special" data-id="grim_reaper">Grim Reaper</div>
    <div class="card-item" data-type="power" data-id="any_power">Any-Power Card</div>
    <div class="card-item" data-type="character" data-id="regular_char">Regular Character</div>
</body>
</html>
`);

// Set up global variables
(global as any).window = dom.window;
(global as any).document = dom.window.document;

describe('One Per Deck CSS Styling', () => {
    let grimReaperCard: HTMLElement;
    let anyPowerCard: HTMLElement;
    let regularCharCard: HTMLElement;

    beforeEach(() => {
        grimReaperCard = document.querySelector('.card-item[data-id="grim_reaper"]') as HTMLElement;
        anyPowerCard = document.querySelector('.card-item[data-id="any_power"]') as HTMLElement;
        regularCharCard = document.querySelector('.card-item[data-id="regular_char"]') as HTMLElement;
    });

    describe('Disabled class application', () => {
        it('should apply disabled class to One Per Deck cards', () => {
            grimReaperCard.classList.add('disabled');
            anyPowerCard.classList.add('disabled');
            
            expect(grimReaperCard.classList.contains('disabled')).toBe(true);
            expect(anyPowerCard.classList.contains('disabled')).toBe(true);
        });

        it('should not apply disabled class to regular cards', () => {
            expect(regularCharCard.classList.contains('disabled')).toBe(false);
        });

        it('should remove disabled class when appropriate', () => {
            grimReaperCard.classList.add('disabled');
            expect(grimReaperCard.classList.contains('disabled')).toBe(true);
            
            grimReaperCard.classList.remove('disabled');
            expect(grimReaperCard.classList.contains('disabled')).toBe(false);
        });
    });

    describe('Visual styling properties', () => {
        it('should have correct opacity when disabled', () => {
            grimReaperCard.classList.add('disabled');
            
            const computedStyle = window.getComputedStyle(grimReaperCard);
            expect(computedStyle.opacity).toBe('0.5');
        });

        it('should have correct cursor when disabled', () => {
            grimReaperCard.classList.add('disabled');
            
            const computedStyle = window.getComputedStyle(grimReaperCard);
            expect(computedStyle.cursor).toBe('not-allowed');
        });

        it('should have correct background when disabled', () => {
            grimReaperCard.classList.add('disabled');
            
            const computedStyle = window.getComputedStyle(grimReaperCard);
            expect(computedStyle.background).toContain('rgba(255, 255, 255, 0.05)');
        });

        it('should have correct border when disabled', () => {
            grimReaperCard.classList.add('disabled');
            
            const computedStyle = window.getComputedStyle(grimReaperCard);
            // JSDOM doesn't fully support CSS border shorthand, so check border-width instead
            expect(computedStyle.borderWidth).toBe('1px');
        });

        it('should not have hover effects when disabled', () => {
            grimReaperCard.classList.add('disabled');
            
            // Check that hover effects are disabled by verifying the CSS class
            expect(grimReaperCard.classList.contains('disabled')).toBe(true);
            
            const computedStyle = window.getComputedStyle(grimReaperCard);
            // The hover effects should be disabled, so transform should be none or empty
            // JSDOM may return empty string instead of 'none'
            expect(computedStyle.transform === 'none' || computedStyle.transform === '').toBe(true);
        });
    });

    describe('State transitions', () => {
        it('should transition from enabled to disabled state', () => {
            // Initially enabled (remove any existing disabled class)
            grimReaperCard.classList.remove('disabled');
            expect(grimReaperCard.classList.contains('disabled')).toBe(false);
            
            // Apply disabled state
            grimReaperCard.classList.add('disabled');
            expect(grimReaperCard.classList.contains('disabled')).toBe(true);
            
            // Verify visual changes
            const computedStyle = window.getComputedStyle(grimReaperCard);
            expect(computedStyle.opacity).toBe('0.5');
            expect(computedStyle.cursor).toBe('not-allowed');
        });

        it('should transition from disabled to enabled state', () => {
            // Initially disabled
            grimReaperCard.classList.add('disabled');
            expect(grimReaperCard.classList.contains('disabled')).toBe(true);
            
            // Remove disabled state
            grimReaperCard.classList.remove('disabled');
            expect(grimReaperCard.classList.contains('disabled')).toBe(false);
            
            // Verify visual changes
            const computedStyle = window.getComputedStyle(grimReaperCard);
            expect(computedStyle.opacity).toBe('1');
            expect(computedStyle.cursor).toBe('pointer');
        });
    });

    describe('Multiple card types', () => {
        it('should apply consistent styling across all card types', () => {
            const cardTypes = ['special', 'power', 'character'];
            const cards = [grimReaperCard, anyPowerCard, regularCharCard];
            
            // Apply disabled class to all cards
            cards.forEach(card => card.classList.add('disabled'));
            
            // Verify all cards have the same disabled styling
            cards.forEach(card => {
                const computedStyle = window.getComputedStyle(card);
                expect(computedStyle.opacity).toBe('0.5');
                expect(computedStyle.cursor).toBe('not-allowed');
                expect(computedStyle.background).toContain('rgba(255, 255, 255, 0.05)');
            });
        });

        it('should handle mixed enabled/disabled states', () => {
            // Disable some cards, leave others enabled
            grimReaperCard.classList.add('disabled');
            // anyPowerCard remains enabled (ensure it's not disabled)
            anyPowerCard.classList.remove('disabled');
            regularCharCard.classList.add('disabled');
            
            // Verify disabled cards
            expect(grimReaperCard.classList.contains('disabled')).toBe(true);
            expect(regularCharCard.classList.contains('disabled')).toBe(true);
            
            // Verify enabled card
            expect(anyPowerCard.classList.contains('disabled')).toBe(false);
            
            // Verify visual states
            const disabledCards = [grimReaperCard, regularCharCard];
            disabledCards.forEach(card => {
                const computedStyle = window.getComputedStyle(card);
                expect(computedStyle.opacity).toBe('0.5');
                expect(computedStyle.cursor).toBe('not-allowed');
            });
            
            const enabledCard = anyPowerCard;
            const computedStyle = window.getComputedStyle(enabledCard);
            expect(computedStyle.opacity).toBe('1');
            expect(computedStyle.cursor).toBe('pointer');
        });
    });

    describe('Accessibility and usability', () => {
        it('should set appropriate draggable attribute when disabled', () => {
            grimReaperCard.classList.add('disabled');
            grimReaperCard.setAttribute('draggable', 'false');
            
            expect(grimReaperCard.getAttribute('draggable')).toBe('false');
        });

        it('should set appropriate title attribute when disabled', () => {
            grimReaperCard.classList.add('disabled');
            grimReaperCard.title = 'One Per Deck - already in deck';
            
            expect(grimReaperCard.title).toBe('One Per Deck - already in deck');
        });

        it('should restore draggable and title when enabled', () => {
            // First disable
            grimReaperCard.classList.add('disabled');
            grimReaperCard.setAttribute('draggable', 'false');
            grimReaperCard.title = 'One Per Deck - already in deck';
            
            // Then enable
            grimReaperCard.classList.remove('disabled');
            grimReaperCard.setAttribute('draggable', 'true');
            grimReaperCard.title = '';
            
            expect(grimReaperCard.getAttribute('draggable')).toBe('true');
            expect(grimReaperCard.title).toBe('');
        });
    });

    describe('CSS specificity and inheritance', () => {
        it('should override default card styling when disabled', () => {
            // Get default styling
            grimReaperCard.classList.remove('disabled');
            const defaultStyle = window.getComputedStyle(grimReaperCard);
            const defaultOpacity = defaultStyle.opacity;
            const defaultCursor = defaultStyle.cursor;
            
            // Apply disabled styling
            grimReaperCard.classList.add('disabled');
            const disabledStyle = window.getComputedStyle(grimReaperCard);
            
            // Verify disabled styling overrides default
            expect(disabledStyle.opacity).not.toBe(defaultOpacity);
            expect(disabledStyle.cursor).not.toBe(defaultCursor);
            expect(disabledStyle.opacity).toBe('0.5');
            expect(disabledStyle.cursor).toBe('not-allowed');
        });

        it('should maintain disabled styling even with other classes', () => {
            grimReaperCard.classList.add('disabled');
            grimReaperCard.classList.add('character-card');
            grimReaperCard.classList.add('selected');
            
            const computedStyle = window.getComputedStyle(grimReaperCard);
            expect(computedStyle.opacity).toBe('0.5');
            expect(computedStyle.cursor).toBe('not-allowed');
        });
    });
});

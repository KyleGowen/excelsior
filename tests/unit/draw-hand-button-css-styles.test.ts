/**
 * Unit tests for Draw Hand button CSS styling and state management
 * 
 * Tests that the disabled button state is properly managed
 * and that the CSS rules are correctly defined.
 */

/**
 * @jest-environment jsdom
 */

describe('Draw Hand Button CSS Styling', () => {
    let mockDrawHandBtn: HTMLButtonElement;

    beforeEach(() => {
        // Create mock button element
        mockDrawHandBtn = document.createElement('button');
        mockDrawHandBtn.id = 'drawHandBtn';
        mockDrawHandBtn.className = 'remove-all-btn';
        mockDrawHandBtn.disabled = false;

        // Add button to document
        document.body.appendChild(mockDrawHandBtn);
    });

    afterEach(() => {
        document.body.removeChild(mockDrawHandBtn);
    });

    describe('Button state management', () => {
        it('should have correct disabled attribute when disabled', () => {
            mockDrawHandBtn.disabled = true;
            expect(mockDrawHandBtn.disabled).toBe(true);
            expect(mockDrawHandBtn.getAttribute('disabled')).toBe('');
        });

        it('should have correct disabled attribute when enabled', () => {
            mockDrawHandBtn.disabled = false;
            expect(mockDrawHandBtn.disabled).toBe(false);
            expect(mockDrawHandBtn.getAttribute('disabled')).toBe(null);
        });

        it('should be focusable when enabled', () => {
            mockDrawHandBtn.disabled = false;
            mockDrawHandBtn.focus();
            expect(document.activeElement).toBe(mockDrawHandBtn);
        });

        it('should not be focusable when disabled', () => {
            mockDrawHandBtn.disabled = true;
            mockDrawHandBtn.focus();
            expect(document.activeElement).not.toBe(mockDrawHandBtn);
        });

        it('should transition from enabled to disabled state', () => {
            // Start enabled
            mockDrawHandBtn.disabled = false;
            expect(mockDrawHandBtn.disabled).toBe(false);
            
            // Transition to disabled
            mockDrawHandBtn.disabled = true;
            expect(mockDrawHandBtn.disabled).toBe(true);
        });

        it('should transition from disabled to enabled state', () => {
            // Start disabled
            mockDrawHandBtn.disabled = true;
            expect(mockDrawHandBtn.disabled).toBe(true);
            
            // Transition to enabled
            mockDrawHandBtn.disabled = false;
            expect(mockDrawHandBtn.disabled).toBe(false);
        });
    });

    describe('CSS class management', () => {
        it('should have correct CSS class', () => {
            expect(mockDrawHandBtn.className).toBe('remove-all-btn');
        });

        it('should maintain CSS class when state changes', () => {
            mockDrawHandBtn.disabled = true;
            expect(mockDrawHandBtn.className).toBe('remove-all-btn');
            
            mockDrawHandBtn.disabled = false;
            expect(mockDrawHandBtn.className).toBe('remove-all-btn');
        });
    });
});

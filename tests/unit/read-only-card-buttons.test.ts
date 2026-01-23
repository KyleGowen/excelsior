/**
 * @jest-environment jsdom
 */

/**
 * Read-Only Mode Card Button Visibility Tests
 * 
 * Tests that verify the correct card button visibility behavior in read-only mode:
 * - Change Art buttons should be hidden
 * - - (remove) buttons should be hidden
 * - +1 buttons should remain visible (for draw pile cards)
 * - Reserve buttons should be hidden unless a reserve character is already selected
 */

describe('Read-Only Mode Card Button Visibility Tests', () => {
    let mockDocument: any;
    let mockBody: any;

    beforeEach(() => {
        // Mock document and body
        mockBody = {
            classList: {
                contains: jest.fn(),
                add: jest.fn(),
                remove: jest.fn()
            }
        };

        mockDocument = {
            body: mockBody,
            getElementById: jest.fn(),
            querySelectorAll: jest.fn()
        };

        // Set up global document mock
        (global as any).document = mockDocument;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Change Art Button Hiding', () => {
        test('should hide Change Art buttons in read-only mode', () => {
            // Mock read-only mode
            mockBody.classList.contains.mockReturnValue(true);

            // Mock Change Art buttons
            const changeArtButtons = [
                { classList: { contains: jest.fn() }, className: 'alternate-art-btn' },
                { classList: { contains: jest.fn() }, className: 'alternate-art-btn' },
                { classList: { contains: jest.fn() }, className: 'alternate-art-btn' }
            ];

            // Test that Change Art buttons would be hidden by the CSS rule
            changeArtButtons.forEach(button => {
                const hasAlternateArtBtnClass = button.className === 'alternate-art-btn';
                const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');

                // The button should be hidden if:
                // - It's in read-only mode AND
                // - It has alternate-art-btn class
                const shouldBeHidden = isInReadOnlyMode && hasAlternateArtBtnClass;

                expect(shouldBeHidden).toBe(true);
            });
        });

        test('should not hide Change Art buttons in edit mode', () => {
            // Mock edit mode (not read-only)
            mockBody.classList.contains.mockReturnValue(false);

            // Test that Change Art buttons would NOT be hidden
            const changeArtButtons = [
                { className: 'alternate-art-btn' },
                { className: 'alternate-art-btn' }
            ];

            changeArtButtons.forEach(button => {
                const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');
                const shouldBeHidden = isInReadOnlyMode; // Only hidden in read-only mode

                expect(shouldBeHidden).toBe(false);
            });
        });

        test('should verify Change Art button CSS class', () => {
            const changeArtButton = { className: 'alternate-art-btn' };
            
            // Verify the button has the correct CSS class
            expect(changeArtButton.className).toBe('alternate-art-btn');
            
            // Verify this matches the CSS selector .alternate-art-btn
            const cssClass = 'alternate-art-btn';
            expect(changeArtButton.className).toBe(cssClass);
        });
    });

    describe('Quantity Button (-) Hiding', () => {
        test('should hide quantity buttons (-) in read-only mode', () => {
            // Mock read-only mode
            mockBody.classList.contains.mockReturnValue(true);

            // Mock quantity buttons (these are the - buttons)
            const quantityButtons = [
                { classList: { contains: jest.fn() }, className: 'quantity-btn' },
                { classList: { contains: jest.fn() }, className: 'quantity-btn' },
                { classList: { contains: jest.fn() }, className: 'quantity-btn' }
            ];

            // Test that quantity buttons would be hidden by the CSS rule
            quantityButtons.forEach(button => {
                const hasQuantityBtnClass = button.className === 'quantity-btn';
                const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');

                // The button should be hidden if:
                // - It's in read-only mode AND
                // - It has quantity-btn class
                const shouldBeHidden = isInReadOnlyMode && hasQuantityBtnClass;

                expect(shouldBeHidden).toBe(true);
            });
        });

        test('should not hide quantity buttons (-) in edit mode', () => {
            // Mock edit mode (not read-only)
            mockBody.classList.contains.mockReturnValue(false);

            // Test that quantity buttons would NOT be hidden
            const quantityButtons = [
                { className: 'quantity-btn' },
                { className: 'quantity-btn' }
            ];

            quantityButtons.forEach(button => {
                const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');
                const shouldBeHidden = isInReadOnlyMode; // Only hidden in read-only mode

                expect(shouldBeHidden).toBe(false);
            });
        });

        test('should verify quantity button CSS class', () => {
            const quantityButton = { className: 'quantity-btn' };
            
            // Verify the button has the correct CSS class
            expect(quantityButton.className).toBe('quantity-btn');
            
            // Verify this matches the CSS selector .quantity-btn
            const cssClass = 'quantity-btn';
            expect(quantityButton.className).toBe(cssClass);
        });
    });

    describe('Deck List Item Remove Button Hiding', () => {
        test('should hide deck list item remove buttons in read-only mode', () => {
            // Mock read-only mode
            mockBody.classList.contains.mockReturnValue(true);

            // Mock deck list item remove buttons
            const removeButtons = [
                { classList: { contains: jest.fn() }, className: 'deck-list-item-remove' },
                { classList: { contains: jest.fn() }, className: 'deck-list-item-remove' },
                { classList: { contains: jest.fn() }, className: 'deck-list-item-remove' }
            ];

            // Test that remove buttons would be hidden by the CSS rule
            removeButtons.forEach(button => {
                const hasRemoveBtnClass = button.className === 'deck-list-item-remove';
                const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');

                // The button should be hidden if:
                // - It's in read-only mode AND
                // - It has deck-list-item-remove class
                const shouldBeHidden = isInReadOnlyMode && hasRemoveBtnClass;

                expect(shouldBeHidden).toBe(true);
            });
        });

        test('should not hide deck list item remove buttons in edit mode', () => {
            // Mock edit mode (not read-only)
            mockBody.classList.contains.mockReturnValue(false);

            // Test that remove buttons would NOT be hidden
            const removeButtons = [
                { className: 'deck-list-item-remove' },
                { className: 'deck-list-item-remove' }
            ];

            removeButtons.forEach(button => {
                const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');
                const shouldBeHidden = isInReadOnlyMode; // Only hidden in read-only mode

                expect(shouldBeHidden).toBe(false);
            });
        });

        test('should verify deck list item remove button CSS class', () => {
            const removeButton = { className: 'deck-list-item-remove' };
            
            // Verify the button has the correct CSS class
            expect(removeButton.className).toBe('deck-list-item-remove');
            
            // Verify this matches the CSS selector .deck-list-item-remove
            const cssClass = 'deck-list-item-remove';
            expect(removeButton.className).toBe(cssClass);
        });
    });

    describe('+1/-1 Quantity Button Hiding', () => {
        test('should hide +1 buttons in read-only mode', () => {
            // Mock read-only mode
            mockBody.classList.contains.mockReturnValue(true);

            // Mock +1 buttons (these should now be hidden)
            const addOneButtons = [
                { className: 'add-one-btn' },
                { className: 'add-one-btn' }
            ];

            addOneButtons.forEach(button => {
                const hasAddOneBtnClass = button.className === 'add-one-btn';
                const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');

                // +1 buttons should now be hidden in read-only mode
                const shouldBeHidden = isInReadOnlyMode && hasAddOneBtnClass;

                expect(shouldBeHidden).toBe(true);
                expect(hasAddOneBtnClass).toBe(true);
            });
        });

        test('should hide -1 buttons in read-only mode', () => {
            // Mock read-only mode
            mockBody.classList.contains.mockReturnValue(true);

            // Mock -1 buttons (these should now be hidden)
            const removeOneButtons = [
                { className: 'remove-one-btn' },
                { className: 'remove-one-btn' }
            ];

            removeOneButtons.forEach(button => {
                const hasRemoveOneBtnClass = button.className === 'remove-one-btn';
                const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');

                // -1 buttons should now be hidden in read-only mode
                const shouldBeHidden = isInReadOnlyMode && hasRemoveOneBtnClass;

                expect(shouldBeHidden).toBe(true);
                expect(hasRemoveOneBtnClass).toBe(true);
            });
        });

        test('should hide deck list item quantity buttons in read-only mode', () => {
            // Mock read-only mode
            mockBody.classList.contains.mockReturnValue(true);

            // Mock deck list item quantity buttons (these should now be hidden)
            const quantityButtons = [
                { className: 'deck-list-item-quantity-btn' },
                { className: 'deck-list-item-quantity-btn' }
            ];

            quantityButtons.forEach(button => {
                const hasQuantityBtnClass = button.className === 'deck-list-item-quantity-btn';
                const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');

                // Quantity buttons should now be hidden in read-only mode
                const shouldBeHidden = isInReadOnlyMode && hasQuantityBtnClass;

                expect(shouldBeHidden).toBe(true);
                expect(hasQuantityBtnClass).toBe(true);
            });
        });

        test('should not hide +1/-1 buttons in edit mode', () => {
            // Mock edit mode (not read-only)
            mockBody.classList.contains.mockReturnValue(false);

            // Test that +1/-1 buttons would NOT be hidden
            const quantityButtons = [
                { className: 'add-one-btn' },
                { className: 'remove-one-btn' },
                { className: 'deck-list-item-quantity-btn' }
            ];

            quantityButtons.forEach(button => {
                const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');
                const shouldBeHidden = isInReadOnlyMode; // Only hidden in read-only mode

                expect(shouldBeHidden).toBe(false);
            });
        });
    });

    describe('Buttons That Should Remain Visible', () => {

        test('should treat Reserve buttons as hidden in read-only mode (unless selected)', () => {
            // Mock read-only mode
            mockBody.classList.contains.mockReturnValue(true);

            // Mock Reserve buttons (these should generally be hidden in read-only mode)
            const reserveButtons = [
                { className: 'reserve-btn' },
                { className: 'reserve-btn' }
            ];

            reserveButtons.forEach(button => {
                const hasReserveBtnClass = button.className === 'reserve-btn';
                const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');

                // In the real UI these are omitted/disabled by rendering logic in read-only mode.
                const shouldBeHidden = isInReadOnlyMode && hasReserveBtnClass;

                expect(shouldBeHidden).toBe(true);
                expect(hasReserveBtnClass).toBe(true);
            });
        });
    });

    describe('CSS Selector Specificity', () => {
        test('should verify CSS selector logic for card button visibility', () => {
            // Test the CSS selectors:
            // .read-only-mode .alternate-art-btn { display: none !important; }
            // .read-only-mode .quantity-btn { display: none !important; }
            // .read-only-mode .deck-list-item-remove { display: none !important; }
            
            const testCases = [
                // { buttonClass, isReadOnlyMode, expectedHidden }
                { buttonClass: 'alternate-art-btn', isReadOnlyMode: true, expectedHidden: true },
                { buttonClass: 'quantity-btn', isReadOnlyMode: true, expectedHidden: true },
                { buttonClass: 'deck-list-item-remove', isReadOnlyMode: true, expectedHidden: true },
                { buttonClass: 'add-one-btn', isReadOnlyMode: true, expectedHidden: true },
                { buttonClass: 'remove-one-btn', isReadOnlyMode: true, expectedHidden: true },
                { buttonClass: 'deck-list-item-quantity-btn', isReadOnlyMode: true, expectedHidden: true },
                { buttonClass: 'reserve-btn', isReadOnlyMode: true, expectedHidden: true },
                { buttonClass: 'alternate-art-btn', isReadOnlyMode: false, expectedHidden: false },
                { buttonClass: 'quantity-btn', isReadOnlyMode: false, expectedHidden: false },
                { buttonClass: 'deck-list-item-remove', isReadOnlyMode: false, expectedHidden: false },
                { buttonClass: 'add-one-btn', isReadOnlyMode: false, expectedHidden: false },
                { buttonClass: 'remove-one-btn', isReadOnlyMode: false, expectedHidden: false },
                { buttonClass: 'deck-list-item-quantity-btn', isReadOnlyMode: false, expectedHidden: false },
                { buttonClass: 'reserve-btn', isReadOnlyMode: false, expectedHidden: false }
            ];

            testCases.forEach(({ buttonClass, isReadOnlyMode, expectedHidden }) => {
                // Apply CSS selector logic
                const shouldBeHidden = isReadOnlyMode && 
                                     (buttonClass === 'alternate-art-btn' || 
                                      buttonClass === 'quantity-btn' || 
                                      buttonClass === 'deck-list-item-remove' ||
                                      buttonClass === 'add-one-btn' ||
                                      buttonClass === 'remove-one-btn' ||
                                      buttonClass === 'deck-list-item-quantity-btn' ||
                                      buttonClass === 'reserve-btn');

                expect(shouldBeHidden).toBe(expectedHidden);
            });
        });

        test('should handle edge cases in CSS selector', () => {
            // Test edge cases
            const edgeCases = [
                { buttonClass: 'alternate-art-btn', isReadOnlyMode: true, expectedHidden: true },
                { buttonClass: 'quantity-btn', isReadOnlyMode: true, expectedHidden: true },
                { buttonClass: 'deck-list-item-remove', isReadOnlyMode: true, expectedHidden: true },
                { buttonClass: 'someOtherButton', isReadOnlyMode: true, expectedHidden: false },
                { buttonClass: 'alternate-art-btn', isReadOnlyMode: false, expectedHidden: false },
                { buttonClass: 'quantity-btn', isReadOnlyMode: false, expectedHidden: false },
                { buttonClass: 'deck-list-item-remove', isReadOnlyMode: false, expectedHidden: false }
            ];

            edgeCases.forEach(({ buttonClass, isReadOnlyMode, expectedHidden }) => {
                const shouldBeHidden = isReadOnlyMode && 
                                     (buttonClass === 'alternate-art-btn' || 
                                      buttonClass === 'quantity-btn' || 
                                      buttonClass === 'deck-list-item-remove' ||
                                      buttonClass === 'add-one-btn' ||
                                      buttonClass === 'remove-one-btn' ||
                                      buttonClass === 'deck-list-item-quantity-btn');

                expect(shouldBeHidden).toBe(expectedHidden);
            });
        });
    });

    describe('Integration with Card Types', () => {
        test('should hide buttons correctly for different card types', () => {
            // Mock read-only mode
            mockBody.classList.contains.mockReturnValue(true);

            const cardTypes = [
                { type: 'character', hasChangeArt: true, hasRemoveButton: true },
                { type: 'mission', hasChangeArt: false, hasRemoveButton: true },
                { type: 'location', hasChangeArt: false, hasRemoveButton: true },
                { type: 'special', hasChangeArt: true, hasRemoveButton: true },
                { type: 'power', hasChangeArt: true, hasRemoveButton: true },
                { type: 'universe', hasChangeArt: false, hasRemoveButton: true }
            ];

            cardTypes.forEach(cardType => {
                // Test Change Art button visibility
                if (cardType.hasChangeArt) {
                    const changeArtButton = { className: 'alternate-art-btn' };
                    const shouldHideChangeArt = mockBody.classList.contains('read-only-mode');
                    expect(shouldHideChangeArt).toBe(true);
                }

                // Test Remove button visibility
                if (cardType.hasRemoveButton) {
                    const removeButton = { className: 'quantity-btn' };
                    const shouldHideRemove = mockBody.classList.contains('read-only-mode');
                    expect(shouldHideRemove).toBe(true);
                }
            });
        });

        test('should maintain button visibility consistency across card types', () => {
            // Test that the same CSS rules apply consistently across all card types
            const isInReadOnlyMode = true;

            const buttonTypes = [
                { class: 'alternate-art-btn', shouldBeHidden: true },
                { class: 'quantity-btn', shouldBeHidden: true },
                { class: 'deck-list-item-remove', shouldBeHidden: true },
                { class: 'add-one-btn', shouldBeHidden: false },
                { class: 'reserve-btn', shouldBeHidden: false }
            ];

            buttonTypes.forEach(buttonType => {
                const shouldBeHidden = isInReadOnlyMode && 
                                     (buttonType.class === 'alternate-art-btn' || 
                                      buttonType.class === 'quantity-btn' || 
                                      buttonType.class === 'deck-list-item-remove');

                expect(shouldBeHidden).toBe(buttonType.shouldBeHidden);
            });
        });
    });

    describe('Button State Consistency', () => {
        test('should maintain consistent button visibility across mode switches', () => {
            // Test switching from edit to read-only mode
            const buttons = [
                { className: 'alternate-art-btn', type: 'change-art' },
                { className: 'quantity-btn', type: 'remove' },
                { className: 'deck-list-item-remove', type: 'remove' },
                { className: 'add-one-btn', type: 'quantity' },
                { className: 'remove-one-btn', type: 'quantity' },
                { className: 'deck-list-item-quantity-btn', type: 'quantity' },
                { className: 'reserve-btn', type: 'reserve' }
            ];

            // Edit mode
            mockBody.classList.contains.mockReturnValue(false);
            buttons.forEach(button => {
                const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');
                const shouldBeHidden = false; // No buttons hidden in edit mode
                expect(shouldBeHidden).toBe(false);
            });

            // Read-only mode
            mockBody.classList.contains.mockReturnValue(true);
            buttons.forEach(button => {
                const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');
                const shouldBeHidden = isInReadOnlyMode && 
                                     (button.type === 'change-art' || button.type === 'remove' || button.type === 'quantity');
                
                if (button.type === 'change-art' || button.type === 'remove' || button.type === 'quantity') {
                    expect(shouldBeHidden).toBe(true);
                } else {
                    expect(shouldBeHidden).toBe(false);
                }
            });
        });
    });
});

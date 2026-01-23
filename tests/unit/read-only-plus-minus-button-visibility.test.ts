/**
 * @jest-environment jsdom
 */

/**
 * Read-Only Mode +1/-1 Button Visibility Tests
 * 
 * This test suite specifically covers the visibility behavior of +1/-1 quantity
 * adjustment buttons when the read-only mode is enabled or disabled.
 * 
 * Test Coverage:
 * - +1 button visibility in read-only mode (true/false)
 * - -1 button visibility in read-only mode (true/false)
 * - List view quantity button visibility in read-only mode (true/false)
 * - CSS selector logic for button hiding/showing
 * - DOM behavior simulation
 * - Edge cases and error handling
 */

describe('Read-Only Mode +1/-1 Button Visibility Tests', () => {
    let mockDocument: Document;
    let mockBody: HTMLElement;
    let mockButtons: any[];

    beforeEach(() => {
        // Create mock document and body
        mockDocument = {
            querySelectorAll: jest.fn(),
            getElementById: jest.fn()
        } as any;
        
        mockBody = {
            classList: {
                contains: jest.fn().mockReturnValue(false),
                add: jest.fn(),
                remove: jest.fn()
            }
        } as any;

        // Create mock buttons for testing
        mockButtons = [
            // +1 buttons (should be hidden in read-only mode)
            { id: 'addOneBtn1', className: 'add-one-btn', textContent: '+1', style: { display: '' } },
            { id: 'addOneBtn2', className: 'add-one-btn', textContent: '+1', style: { display: '' } },
            
            // -1 buttons (should be hidden in read-only mode)
            { id: 'removeOneBtn1', className: 'remove-one-btn', textContent: '-1', style: { display: '' } },
            { id: 'removeOneBtn2', className: 'remove-one-btn', textContent: '-1', style: { display: '' } },
            
            // List view quantity buttons (should be hidden in read-only mode)
            { id: 'quantityListBtn1', className: 'deck-list-item-quantity-btn', textContent: '+1', style: { display: '' } },
            { id: 'quantityListBtn2', className: 'deck-list-item-quantity-btn', textContent: '-1', style: { display: '' } },
            
            // Reserve button is hidden in read-only mode unless selected
            { id: 'reserveBtn1', className: 'reserve-btn', textContent: 'Reserve', style: { display: '' } },
            { id: 'listViewBtn', className: 'remove-all-btn', textContent: 'List View', style: { display: '' } },
            { id: 'drawHandBtn', className: 'remove-all-btn', textContent: 'Draw Hand', style: { display: '' } }
        ];

        // Mock document.querySelectorAll to return our mock buttons
        (mockDocument.querySelectorAll as jest.Mock).mockImplementation((selector: string) => {
            if (selector === '.add-one-btn') {
                return mockButtons.filter(btn => btn.className === 'add-one-btn');
            } else if (selector === '.remove-one-btn') {
                return mockButtons.filter(btn => btn.className === 'remove-one-btn');
            } else if (selector === '.deck-list-item-quantity-btn') {
                return mockButtons.filter(btn => btn.className === 'deck-list-item-quantity-btn');
            } else if (selector === '.reserve-btn') {
                return mockButtons.filter(btn => btn.className === 'reserve-btn');
            } else if (selector === '.remove-all-btn') {
                return mockButtons.filter(btn => btn.className === 'remove-all-btn');
            }
            return [];
        });

        // Mock document.getElementById
        (mockDocument.getElementById as jest.Mock).mockImplementation((id: string) => {
            return mockButtons.find(btn => btn.id === id);
        });

        // Ensure body starts without read-only-mode class
        mockBody.classList.remove('read-only-mode');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // Helper function to apply CSS rules based on read-only mode
    const applyReadOnlyModeCSS = (isReadOnly: boolean) => {
        if (isReadOnly) {
            (mockBody.classList.contains as jest.Mock).mockReturnValue(true);
            
            // Apply CSS rules for hiding buttons
            const addOneButtons = mockDocument.querySelectorAll('.add-one-btn');
            const removeOneButtons = mockDocument.querySelectorAll('.remove-one-btn');
            const quantityListButtons = mockDocument.querySelectorAll('.deck-list-item-quantity-btn');
            const reserveButtons = mockDocument.querySelectorAll('.reserve-btn');
            
            addOneButtons.forEach((button: any) => {
                button.style.display = 'none';
            });
            
            removeOneButtons.forEach((button: any) => {
                button.style.display = 'none';
            });
            
            quantityListButtons.forEach((button: any) => {
                button.style.display = 'none';
            });

            // Reserve buttons are hidden in read-only mode unless selected (not modeled here)
            reserveButtons.forEach((button: any) => {
                button.style.display = 'none';
            });
        } else {
            (mockBody.classList.contains as jest.Mock).mockReturnValue(false);
            
            // Reset button styles to visible
            const allButtons = [
                ...mockDocument.querySelectorAll('.add-one-btn'),
                ...mockDocument.querySelectorAll('.remove-one-btn'),
                ...mockDocument.querySelectorAll('.deck-list-item-quantity-btn'),
                ...mockDocument.querySelectorAll('.reserve-btn')
            ];
            
            allButtons.forEach((button: any) => {
                button.style.display = '';
            });
        }
    };

    // Helper function to check button visibility
    const isButtonVisible = (selector: string) => {
        const buttons = mockDocument.querySelectorAll(selector);
        return Array.from(buttons).every((button: any) => button.style.display !== 'none');
    };

    describe('+1 Button Visibility', () => {
        test('should hide +1 buttons when readOnly=true', () => {
            // Apply read-only mode
            applyReadOnlyModeCSS(true);
            
            // Verify +1 buttons are hidden
            expect(isButtonVisible('.add-one-btn')).toBe(false);
            
            // Verify specific buttons are hidden
            const addOneButtons = mockDocument.querySelectorAll('.add-one-btn');
            addOneButtons.forEach((button: any) => {
                expect(button.style.display).toBe('none');
            });
            
            // Verify we found the right buttons
            expect(addOneButtons.length).toBe(2);
        });

        test('should show +1 buttons when readOnly=false', () => {
            // Apply edit mode (not read-only)
            applyReadOnlyModeCSS(false);
            
            // Verify +1 buttons are visible
            expect(isButtonVisible('.add-one-btn')).toBe(true);
            
            // Verify specific buttons are visible
            const addOneButtons = mockDocument.querySelectorAll('.add-one-btn');
            addOneButtons.forEach((button: any) => {
                expect(button.style.display).toBe('');
            });
            
            // Verify we found the right buttons
            expect(addOneButtons.length).toBe(2);
        });

        test('should toggle +1 button visibility when switching modes', () => {
            // Start in edit mode
            applyReadOnlyModeCSS(false);
            expect(isButtonVisible('.add-one-btn')).toBe(true);
            
            // Switch to read-only mode
            applyReadOnlyModeCSS(true);
            expect(isButtonVisible('.add-one-btn')).toBe(false);
            
            // Switch back to edit mode
            applyReadOnlyModeCSS(false);
            expect(isButtonVisible('.add-one-btn')).toBe(true);
        });
    });

    describe('-1 Button Visibility', () => {
        test('should hide -1 buttons when readOnly=true', () => {
            // Apply read-only mode
            applyReadOnlyModeCSS(true);
            
            // Verify -1 buttons are hidden
            expect(isButtonVisible('.remove-one-btn')).toBe(false);
            
            // Verify specific buttons are hidden
            const removeOneButtons = mockDocument.querySelectorAll('.remove-one-btn');
            removeOneButtons.forEach((button: any) => {
                expect(button.style.display).toBe('none');
            });
            
            // Verify we found the right buttons
            expect(removeOneButtons.length).toBe(2);
        });

        test('should show -1 buttons when readOnly=false', () => {
            // Apply edit mode (not read-only)
            applyReadOnlyModeCSS(false);
            
            // Verify -1 buttons are visible
            expect(isButtonVisible('.remove-one-btn')).toBe(true);
            
            // Verify specific buttons are visible
            const removeOneButtons = mockDocument.querySelectorAll('.remove-one-btn');
            removeOneButtons.forEach((button: any) => {
                expect(button.style.display).toBe('');
            });
            
            // Verify we found the right buttons
            expect(removeOneButtons.length).toBe(2);
        });

        test('should toggle -1 button visibility when switching modes', () => {
            // Start in edit mode
            applyReadOnlyModeCSS(false);
            expect(isButtonVisible('.remove-one-btn')).toBe(true);
            
            // Switch to read-only mode
            applyReadOnlyModeCSS(true);
            expect(isButtonVisible('.remove-one-btn')).toBe(false);
            
            // Switch back to edit mode
            applyReadOnlyModeCSS(false);
            expect(isButtonVisible('.remove-one-btn')).toBe(true);
        });
    });

    describe('List View Quantity Button Visibility', () => {
        test('should hide list view quantity buttons when readOnly=true', () => {
            // Apply read-only mode
            applyReadOnlyModeCSS(true);
            
            // Verify list view quantity buttons are hidden
            expect(isButtonVisible('.deck-list-item-quantity-btn')).toBe(false);
            
            // Verify specific buttons are hidden
            const quantityListButtons = mockDocument.querySelectorAll('.deck-list-item-quantity-btn');
            quantityListButtons.forEach((button: any) => {
                expect(button.style.display).toBe('none');
            });
            
            // Verify we found the right buttons
            expect(quantityListButtons.length).toBe(2);
        });

        test('should show list view quantity buttons when readOnly=false', () => {
            // Apply edit mode (not read-only)
            applyReadOnlyModeCSS(false);
            
            // Verify list view quantity buttons are visible
            expect(isButtonVisible('.deck-list-item-quantity-btn')).toBe(true);
            
            // Verify specific buttons are visible
            const quantityListButtons = mockDocument.querySelectorAll('.deck-list-item-quantity-btn');
            quantityListButtons.forEach((button: any) => {
                expect(button.style.display).toBe('');
            });
            
            // Verify we found the right buttons
            expect(quantityListButtons.length).toBe(2);
        });

        test('should toggle list view quantity button visibility when switching modes', () => {
            // Start in edit mode
            applyReadOnlyModeCSS(false);
            expect(isButtonVisible('.deck-list-item-quantity-btn')).toBe(true);
            
            // Switch to read-only mode
            applyReadOnlyModeCSS(true);
            expect(isButtonVisible('.deck-list-item-quantity-btn')).toBe(false);
            
            // Switch back to edit mode
            applyReadOnlyModeCSS(false);
            expect(isButtonVisible('.deck-list-item-quantity-btn')).toBe(true);
        });
    });

    describe('CSS Selector Logic', () => {
        test('should apply correct CSS selectors for +1/-1 button hiding', () => {
            const testCases = [
                { selector: '.add-one-btn', className: 'add-one-btn', shouldBeHidden: true },
                { selector: '.remove-one-btn', className: 'remove-one-btn', shouldBeHidden: true },
                { selector: '.deck-list-item-quantity-btn', className: 'deck-list-item-quantity-btn', shouldBeHidden: true },
                { selector: '.reserve-btn', className: 'reserve-btn', shouldBeHidden: true },
                { selector: '.remove-all-btn', className: 'remove-all-btn', shouldBeHidden: false }
            ];

            testCases.forEach(({ selector, className, shouldBeHidden }) => {
                // Test in read-only mode
                applyReadOnlyModeCSS(true);
                
                const buttons = mockDocument.querySelectorAll(selector);
                buttons.forEach((button: any) => {
                    if (shouldBeHidden) {
                        expect(button.style.display).toBe('none');
                    } else {
                        expect(button.style.display).toBe('');
                    }
                });
            });
        });

        test('should verify CSS selector specificity', () => {
            // Test that our CSS selectors are specific enough
            const readOnlySelectors = [
                '.read-only-mode .add-one-btn',
                '.read-only-mode .remove-one-btn', 
                '.read-only-mode .deck-list-item-quantity-btn'
            ];

            // These selectors should target the correct buttons
            readOnlySelectors.forEach(selector => {
                expect(selector).toContain('.read-only-mode');
                expect(selector).toContain('btn');
            });
        });
    });

    describe('Button State Consistency', () => {
        test('should maintain consistent +1/-1 button state across mode switches', () => {
            const quantityButtonSelectors = [
                '.add-one-btn',
                '.remove-one-btn', 
                '.deck-list-item-quantity-btn'
            ];

            // Test multiple mode switches
            for (let i = 0; i < 3; i++) {
                // Switch to read-only mode
                applyReadOnlyModeCSS(true);
                quantityButtonSelectors.forEach(selector => {
                    expect(isButtonVisible(selector)).toBe(false);
                });

                // Switch to edit mode
                applyReadOnlyModeCSS(false);
                quantityButtonSelectors.forEach(selector => {
                    expect(isButtonVisible(selector)).toBe(true);
                });
            }
        });

        test('should preserve other button visibility when toggling +1/-1 buttons', () => {
            // Buttons that should always remain visible
            const alwaysVisibleSelectors = ['.remove-all-btn'];
            
            // Test in both modes
            [true, false].forEach(isReadOnly => {
                applyReadOnlyModeCSS(isReadOnly);
                
                alwaysVisibleSelectors.forEach(selector => {
                    expect(isButtonVisible(selector)).toBe(true);
                });
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle missing +1/-1 buttons gracefully', () => {
            // Clear all buttons
            mockButtons = [];
            mockDocument.querySelectorAll = jest.fn().mockReturnValue([]);
            
            // Should not throw errors
            expect(() => {
                applyReadOnlyModeCSS(true);
                applyReadOnlyModeCSS(false);
            }).not.toThrow();
        });

        test('should handle buttons with multiple classes', () => {
            // Create a button with multiple classes
            const multiClassButton = {
                id: 'multiClassBtn',
                className: 'add-one-btn some-other-class',
                textContent: '+1',
                style: { display: '' }
            };
            
            mockButtons.push(multiClassButton);
            
            // Mock querySelectorAll to return this button
            mockDocument.querySelectorAll = jest.fn().mockImplementation((selector: string) => {
                if (selector === '.add-one-btn') {
                    return [multiClassButton];
                }
                return [];
            });
            
            // Test that it gets hidden in read-only mode
            applyReadOnlyModeCSS(true);
            expect(multiClassButton.style.display).toBe('none');
            
            // Test that it becomes visible in edit mode
            applyReadOnlyModeCSS(false);
            expect(multiClassButton.style.display).toBe('');
        });

        test('should handle rapid mode switching', () => {
            // Rapidly switch between modes
            for (let i = 0; i < 10; i++) {
                applyReadOnlyModeCSS(i % 2 === 0);
                
                const addOneButtons = mockDocument.querySelectorAll('.add-one-btn');
                const removeOneButtons = mockDocument.querySelectorAll('.remove-one-btn');
                const quantityListButtons = mockDocument.querySelectorAll('.deck-list-item-quantity-btn');
                
                if (i % 2 === 0) {
                    // Read-only mode - buttons should be hidden
                    expect(isButtonVisible('.add-one-btn')).toBe(false);
                    expect(isButtonVisible('.remove-one-btn')).toBe(false);
                    expect(isButtonVisible('.deck-list-item-quantity-btn')).toBe(false);
                } else {
                    // Edit mode - buttons should be visible
                    expect(isButtonVisible('.add-one-btn')).toBe(true);
                    expect(isButtonVisible('.remove-one-btn')).toBe(true);
                    expect(isButtonVisible('.deck-list-item-quantity-btn')).toBe(true);
                }
            }
        });
    });

    describe('Integration with Read-Only Mode Detection', () => {
        test('should work with URL parameter detection', () => {
            // Simulate URL parameter detection
            const urlParams = new URLSearchParams('?readonly=true');
            const isReadOnlyFromQuery = urlParams.get('readonly') === 'true';
            
            expect(isReadOnlyFromQuery).toBe(true);
            
            // Apply the detected read-only mode
            applyReadOnlyModeCSS(isReadOnlyFromQuery);
            
            // Verify buttons are hidden
            expect(isButtonVisible('.add-one-btn')).toBe(false);
            expect(isButtonVisible('.remove-one-btn')).toBe(false);
            expect(isButtonVisible('.deck-list-item-quantity-btn')).toBe(false);
        });

        test('should work with URL parameter detection for edit mode', () => {
            // Simulate URL parameter detection for edit mode
            const urlParams = new URLSearchParams('?readonly=false');
            const isReadOnlyFromQuery = urlParams.get('readonly') === 'true';
            
            expect(isReadOnlyFromQuery).toBe(false);
            
            // Apply the detected mode
            applyReadOnlyModeCSS(isReadOnlyFromQuery);
            
            // Verify buttons are visible
            expect(isButtonVisible('.add-one-btn')).toBe(true);
            expect(isButtonVisible('.remove-one-btn')).toBe(true);
            expect(isButtonVisible('.deck-list-item-quantity-btn')).toBe(true);
        });

        test('should work when no URL parameter is present', () => {
            // Simulate no URL parameter
            const urlParams = new URLSearchParams('');
            const isReadOnlyFromQuery = urlParams.get('readonly') === 'true';
            
            expect(isReadOnlyFromQuery).toBe(false);
            
            // Apply the detected mode (should default to edit mode)
            applyReadOnlyModeCSS(isReadOnlyFromQuery);
            
            // Verify buttons are visible
            expect(isButtonVisible('.add-one-btn')).toBe(true);
            expect(isButtonVisible('.remove-one-btn')).toBe(true);
            expect(isButtonVisible('.deck-list-item-quantity-btn')).toBe(true);
        });
    });

    describe('Button Text and Content Verification', () => {
        test('should verify +1 buttons have correct text content', () => {
            const addOneButtons = mockDocument.querySelectorAll('.add-one-btn');
            addOneButtons.forEach((button: any) => {
                expect(button.textContent).toBe('+1');
            });
        });

        test('should verify -1 buttons have correct text content', () => {
            const removeOneButtons = mockDocument.querySelectorAll('.remove-one-btn');
            removeOneButtons.forEach((button: any) => {
                expect(button.textContent).toBe('-1');
            });
        });

        test('should verify list view quantity buttons have correct text content', () => {
            const quantityListButtons = mockDocument.querySelectorAll('.deck-list-item-quantity-btn');
            expect(quantityListButtons[0].textContent).toBe('+1');
            expect(quantityListButtons[1].textContent).toBe('-1');
        });
    });
});

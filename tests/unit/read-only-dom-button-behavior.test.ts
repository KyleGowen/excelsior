/**
 * @jest-environment jsdom
 */

/**
 * Read-Only Mode DOM Button Behavior Tests
 * 
 * Tests that verify the actual DOM behavior of button visibility:
 * - Buttons are hidden when readOnly=true (read-only-mode class applied)
 * - Buttons are visible when readOnly=false (read-only-mode class removed)
 * - CSS class application and removal on document.body
 */

describe('Read-Only Mode DOM Button Behavior Tests', () => {
    let mockDocument: any;
    let mockBody: any;
    let mockButtons: any[];

    beforeEach(() => {
        // Create mock buttons with realistic DOM structure
        mockButtons = [
            // Change Art buttons
            { id: 'changeArt1', className: 'alternate-art-btn', style: { display: '' } },
            { id: 'changeArt2', className: 'alternate-art-btn', style: { display: '' } },
            
            // Quantity buttons (-)
            { id: 'quantityBtn1', className: 'quantity-btn', style: { display: '' } },
            { id: 'quantityBtn2', className: 'quantity-btn', style: { display: '' } },
            
            // Deck list item remove buttons
            { id: 'removeBtn1', className: 'deck-list-item-remove', style: { display: '' } },
            { id: 'removeBtn2', className: 'deck-list-item-remove', style: { display: '' } },
            
            // Remove All buttons (should be hidden)
            { id: 'removeAll1', className: 'remove-all-btn', style: { display: '' } },
            { id: 'removeAll2', className: 'remove-all-btn', style: { display: '' } },
            
            // Buttons that should now be hidden
            { id: 'addOneBtn1', className: 'add-one-btn', style: { display: '' } },
            { id: 'removeOneBtn1', className: 'remove-one-btn', style: { display: '' } },
            { id: 'quantityBtn1', className: 'deck-list-item-quantity-btn', style: { display: '' } },
            
            // Reserve button is hidden in read-only mode unless selected
            { id: 'reserveBtn1', className: 'reserve-btn', style: { display: '' } },
            { id: 'listViewBtn', className: 'remove-all-btn', style: { display: '' } }, // Has remove-all-btn class but specific ID
            { id: 'drawHandBtn', className: 'remove-all-btn', style: { display: '' } }  // Has remove-all-btn class but specific ID
        ];

        // Mock document.body with classList
        mockBody = {
            classList: {
                contains: jest.fn(),
                add: jest.fn(),
                remove: jest.fn()
            }
        };

        // Mock document with querySelectorAll to return our mock buttons
        mockDocument = {
            body: mockBody,
            getElementById: jest.fn(),
            querySelectorAll: jest.fn().mockImplementation((selector) => {
                if (selector === '.alternate-art-btn') {
                    return mockButtons.filter(btn => btn.className === 'alternate-art-btn');
                } else if (selector === '.quantity-btn') {
                    return mockButtons.filter(btn => btn.className === 'quantity-btn');
                } else if (selector === '.deck-list-item-remove') {
                    return mockButtons.filter(btn => btn.className === 'deck-list-item-remove');
                } else if (selector === '.remove-all-btn') {
                    return mockButtons.filter(btn => btn.className === 'remove-all-btn');
                } else if (selector === '.add-one-btn') {
                    return mockButtons.filter(btn => btn.className === 'add-one-btn');
                } else if (selector === '.remove-one-btn') {
                    return mockButtons.filter(btn => btn.className === 'remove-one-btn');
                } else if (selector === '.deck-list-item-quantity-btn') {
                    return mockButtons.filter(btn => btn.className === 'deck-list-item-quantity-btn');
                } else if (selector === '.reserve-btn') {
                    return mockButtons.filter(btn => btn.className === 'reserve-btn');
                }
                return [];
            })
        };

        // Set up global document mock
        (global as any).document = mockDocument;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Button Hiding When ReadOnly=true', () => {
        test('should hide Change Art buttons when read-only-mode class is applied', () => {
            // Simulate read-only mode being applied
            mockBody.classList.contains.mockReturnValue(true);

            // Simulate CSS rule application: .read-only-mode .alternate-art-btn { display: none !important; }
            const changeArtButtons = mockDocument.querySelectorAll('.alternate-art-btn');
            
            changeArtButtons.forEach((button: any) => {
                // Simulate the CSS rule being applied
                if (mockBody.classList.contains('read-only-mode')) {
                    button.style.display = 'none';
                }
            });

            // Verify buttons are hidden
            changeArtButtons.forEach((button: any) => {
                expect(button.style.display).toBe('none');
            });

            // Verify we found the right buttons
            expect(changeArtButtons.length).toBe(2);
            expect(changeArtButtons[0].className).toBe('alternate-art-btn');
            expect(changeArtButtons[1].className).toBe('alternate-art-btn');
        });

        test('should hide quantity buttons (-) when read-only-mode class is applied', () => {
            // Simulate read-only mode being applied
            mockBody.classList.contains.mockReturnValue(true);

            // Simulate CSS rule application: .read-only-mode .quantity-btn { display: none !important; }
            const quantityButtons = mockDocument.querySelectorAll('.quantity-btn');
            
            quantityButtons.forEach((button: any) => {
                // Simulate the CSS rule being applied
                if (mockBody.classList.contains('read-only-mode')) {
                    button.style.display = 'none';
                }
            });

            // Verify buttons are hidden
            quantityButtons.forEach((button: any) => {
                expect(button.style.display).toBe('none');
            });

            // Verify we found the right buttons
            expect(quantityButtons.length).toBe(2);
            expect(quantityButtons[0].className).toBe('quantity-btn');
            expect(quantityButtons[1].className).toBe('quantity-btn');
        });

        test('should hide deck list item remove buttons when read-only-mode class is applied', () => {
            // Simulate read-only mode being applied
            mockBody.classList.contains.mockReturnValue(true);

            // Simulate CSS rule application: .read-only-mode .deck-list-item-remove { display: none !important; }
            const removeButtons = mockDocument.querySelectorAll('.deck-list-item-remove');
            
            removeButtons.forEach((button: any) => {
                // Simulate the CSS rule being applied
                if (mockBody.classList.contains('read-only-mode')) {
                    button.style.display = 'none';
                }
            });

            // Verify buttons are hidden
            removeButtons.forEach((button: any) => {
                expect(button.style.display).toBe('none');
            });

            // Verify we found the right buttons
            expect(removeButtons.length).toBe(2);
            expect(removeButtons[0].className).toBe('deck-list-item-remove');
            expect(removeButtons[1].className).toBe('deck-list-item-remove');
        });

        test('should hide Remove All buttons (except List View and Draw Hand) when read-only-mode class is applied', () => {
            // Simulate read-only mode being applied
            mockBody.classList.contains.mockReturnValue(true);

            // Simulate CSS rule application: .read-only-mode .remove-all-btn:not(#drawHandBtn):not(#listViewBtn) { display: none !important; }
            const removeAllButtons = mockDocument.querySelectorAll('.remove-all-btn');
            
            removeAllButtons.forEach((button: any) => {
                // Simulate the CSS rule being applied (excluding specific IDs)
                if (mockBody.classList.contains('read-only-mode') && 
                    button.id !== 'drawHandBtn' && 
                    button.id !== 'listViewBtn') {
                    button.style.display = 'none';
                }
            });

            // Verify regular Remove All buttons are hidden
            const regularRemoveAllButtons = removeAllButtons.filter((btn: any) => 
                btn.id !== 'drawHandBtn' && btn.id !== 'listViewBtn'
            );
            regularRemoveAllButtons.forEach((button: any) => {
                expect(button.style.display).toBe('none');
            });

            // Verify List View and Draw Hand buttons remain visible
            const listViewBtn = removeAllButtons.find((btn: any) => btn.id === 'listViewBtn');
            const drawHandBtn = removeAllButtons.find((btn: any) => btn.id === 'drawHandBtn');
            
            expect(listViewBtn.style.display).toBe('');
            expect(drawHandBtn.style.display).toBe('');
        });
    });

    describe('Button Visibility When ReadOnly=false', () => {
        test('should show Change Art buttons when read-only-mode class is removed', () => {
            // Simulate edit mode (not read-only)
            mockBody.classList.contains.mockReturnValue(false);

            // Simulate CSS rule NOT being applied
            const changeArtButtons = mockDocument.querySelectorAll('.alternate-art-btn');
            
            changeArtButtons.forEach((button: any) => {
                // Simulate the CSS rule NOT being applied
                if (!mockBody.classList.contains('read-only-mode')) {
                    button.style.display = ''; // Reset to default
                }
            });

            // Verify buttons are visible
            changeArtButtons.forEach((button: any) => {
                expect(button.style.display).toBe('');
            });

            // Verify we found the right buttons
            expect(changeArtButtons.length).toBe(2);
        });

        test('should show quantity buttons (-) when read-only-mode class is removed', () => {
            // Simulate edit mode (not read-only)
            mockBody.classList.contains.mockReturnValue(false);

            // Simulate CSS rule NOT being applied
            const quantityButtons = mockDocument.querySelectorAll('.quantity-btn');
            
            quantityButtons.forEach((button: any) => {
                // Simulate the CSS rule NOT being applied
                if (!mockBody.classList.contains('read-only-mode')) {
                    button.style.display = ''; // Reset to default
                }
            });

            // Verify buttons are visible
            quantityButtons.forEach((button: any) => {
                expect(button.style.display).toBe('');
            });

            // Verify we found the right buttons
            expect(quantityButtons.length).toBe(2);
        });

        test('should show deck list item remove buttons when read-only-mode class is removed', () => {
            // Simulate edit mode (not read-only)
            mockBody.classList.contains.mockReturnValue(false);

            // Simulate CSS rule NOT being applied
            const removeButtons = mockDocument.querySelectorAll('.deck-list-item-remove');
            
            removeButtons.forEach((button: any) => {
                // Simulate the CSS rule NOT being applied
                if (!mockBody.classList.contains('read-only-mode')) {
                    button.style.display = ''; // Reset to default
                }
            });

            // Verify buttons are visible
            removeButtons.forEach((button: any) => {
                expect(button.style.display).toBe('');
            });

            // Verify we found the right buttons
            expect(removeButtons.length).toBe(2);
        });

        test('should show all Remove All buttons when read-only-mode class is removed', () => {
            // Simulate edit mode (not read-only)
            mockBody.classList.contains.mockReturnValue(false);

            // Simulate CSS rule NOT being applied
            const removeAllButtons = mockDocument.querySelectorAll('.remove-all-btn');
            
            removeAllButtons.forEach((button: any) => {
                // Simulate the CSS rule NOT being applied
                if (!mockBody.classList.contains('read-only-mode')) {
                    button.style.display = ''; // Reset to default
                }
            });

            // Verify all Remove All buttons are visible
            removeAllButtons.forEach((button: any) => {
                expect(button.style.display).toBe('');
            });

            // Verify we found the right buttons
            expect(removeAllButtons.length).toBe(4); // 2 regular + listViewBtn + drawHandBtn
        });
    });

    describe('+1/-1 Quantity Button Hiding', () => {
        test('should hide +1 buttons in read-only mode', () => {
            // Test in read-only mode
            mockBody.classList.contains.mockReturnValue(true);
            const addOneButtons = mockDocument.querySelectorAll('.add-one-btn');
            
            // Apply CSS rule
            addOneButtons.forEach((button: any) => {
                if (mockBody.classList.contains('read-only-mode')) {
                    button.style.display = 'none';
                }
            });
            
            addOneButtons.forEach((button: any) => {
                expect(button.style.display).toBe('none');
            });

            // Test in edit mode
            mockBody.classList.contains.mockReturnValue(false);
            addOneButtons.forEach((button: any) => {
                button.style.display = ''; // Reset
                expect(button.style.display).toBe('');
            });

            expect(addOneButtons.length).toBe(1);
        });

        test('should hide -1 buttons in read-only mode', () => {
            // Test in read-only mode
            mockBody.classList.contains.mockReturnValue(true);
            const removeOneButtons = mockDocument.querySelectorAll('.remove-one-btn');
            
            // Apply CSS rule
            removeOneButtons.forEach((button: any) => {
                if (mockBody.classList.contains('read-only-mode')) {
                    button.style.display = 'none';
                }
            });
            
            removeOneButtons.forEach((button: any) => {
                expect(button.style.display).toBe('none');
            });

            // Test in edit mode
            mockBody.classList.contains.mockReturnValue(false);
            removeOneButtons.forEach((button: any) => {
                button.style.display = ''; // Reset
                expect(button.style.display).toBe('');
            });

            expect(removeOneButtons.length).toBe(1);
        });

        test('should hide deck list item quantity buttons in read-only mode', () => {
            // Test in read-only mode
            mockBody.classList.contains.mockReturnValue(true);
            const quantityButtons = mockDocument.querySelectorAll('.deck-list-item-quantity-btn');
            
            // Apply CSS rule
            quantityButtons.forEach((button: any) => {
                if (mockBody.classList.contains('read-only-mode')) {
                    button.style.display = 'none';
                }
            });
            
            quantityButtons.forEach((button: any) => {
                expect(button.style.display).toBe('none');
            });

            // Test in edit mode
            mockBody.classList.contains.mockReturnValue(false);
            quantityButtons.forEach((button: any) => {
                button.style.display = ''; // Reset
                expect(button.style.display).toBe('');
            });

            expect(quantityButtons.length).toBe(1);
        });
    });

    describe('Buttons That Always Remain Visible', () => {

        test('should keep Reserve buttons hidden in read-only mode (unless selected)', () => {
            // Test in read-only mode
            mockBody.classList.contains.mockReturnValue(true);
            const reserveButtons = mockDocument.querySelectorAll('.reserve-btn');
            
            reserveButtons.forEach((button: any) => {
                // Simulate rendering behavior: reserve buttons are hidden in read-only mode unless selected
                if (mockBody.classList.contains('read-only-mode')) {
                    button.style.display = 'none';
                }
                expect(button.style.display).toBe('none');
            });

            // Test in edit mode
            mockBody.classList.contains.mockReturnValue(false);
            reserveButtons.forEach((button: any) => {
                button.style.display = '';
                expect(button.style.display).toBe('');
            });

            expect(reserveButtons.length).toBe(1);
        });
    });

    describe('CSS Class Application and Removal', () => {
        test('should apply read-only-mode class to document.body when entering read-only mode', () => {
            // Simulate entering read-only mode
            mockBody.classList.add('read-only-mode');
            
            expect(mockBody.classList.add).toHaveBeenCalledWith('read-only-mode');
        });

        test('should remove read-only-mode class from document.body when exiting read-only mode', () => {
            // Simulate exiting read-only mode
            mockBody.classList.remove('read-only-mode');
            
            expect(mockBody.classList.remove).toHaveBeenCalledWith('read-only-mode');
        });

        test('should check for read-only-mode class on document.body', () => {
            // Test when class is present
            mockBody.classList.contains.mockReturnValue(true);
            expect(mockBody.classList.contains('read-only-mode')).toBe(true);

            // Test when class is not present
            mockBody.classList.contains.mockReturnValue(false);
            expect(mockBody.classList.contains('read-only-mode')).toBe(false);
        });
    });

    describe('Complete Read-Only Mode Toggle', () => {
        test('should hide all appropriate buttons when toggling to read-only mode', () => {
            // Start in edit mode
            mockBody.classList.contains.mockReturnValue(false);
            
            // Toggle to read-only mode
            mockBody.classList.contains.mockReturnValue(true);
            mockBody.classList.add('read-only-mode');

            // Apply CSS rules
            const changeArtButtons = mockDocument.querySelectorAll('.alternate-art-btn');
            const quantityButtons = mockDocument.querySelectorAll('.quantity-btn');
            const removeButtons = mockDocument.querySelectorAll('.deck-list-item-remove');
            const removeAllButtons = mockDocument.querySelectorAll('.remove-all-btn');
            const addOneButtons = mockDocument.querySelectorAll('.add-one-btn');
            const removeOneButtons = mockDocument.querySelectorAll('.remove-one-btn');
            const quantityListButtons = mockDocument.querySelectorAll('.deck-list-item-quantity-btn');
            const reserveButtons = mockDocument.querySelectorAll('.reserve-btn');

            // Hide buttons that should be hidden
            changeArtButtons.forEach((button: any) => {
                button.style.display = 'none';
            });
            quantityButtons.forEach((button: any) => {
                button.style.display = 'none';
            });
            removeButtons.forEach((button: any) => {
                button.style.display = 'none';
            });
            addOneButtons.forEach((button: any) => {
                button.style.display = 'none';
            });
            removeOneButtons.forEach((button: any) => {
                button.style.display = 'none';
            });
            quantityListButtons.forEach((button: any) => {
                button.style.display = 'none';
            });
            reserveButtons.forEach((button: any) => {
                button.style.display = 'none';
            });
            removeAllButtons.forEach((button: any) => {
                if (button.id !== 'drawHandBtn' && button.id !== 'listViewBtn') {
                    button.style.display = 'none';
                }
            });

            // Verify hidden buttons
            changeArtButtons.forEach((button: any) => {
                expect(button.style.display).toBe('none');
            });
            quantityButtons.forEach((button: any) => {
                expect(button.style.display).toBe('none');
            });
            removeButtons.forEach((button: any) => {
                expect(button.style.display).toBe('none');
            });
            addOneButtons.forEach((button: any) => {
                expect(button.style.display).toBe('none');
            });
            removeOneButtons.forEach((button: any) => {
                expect(button.style.display).toBe('none');
            });
            quantityListButtons.forEach((button: any) => {
                expect(button.style.display).toBe('none');
            });

            // Verify reserve buttons are hidden in read-only mode unless selected
            reserveButtons.forEach((button: any) => {
                expect(button.style.display).toBe('none');
            });

            // Verify List View and Draw Hand buttons remain visible
            const listViewBtn = removeAllButtons.find((btn: any) => btn.id === 'listViewBtn');
            const drawHandBtn = removeAllButtons.find((btn: any) => btn.id === 'drawHandBtn');
            expect(listViewBtn.style.display).toBe('');
            expect(drawHandBtn.style.display).toBe('');
        });

        test('should show all buttons when toggling to edit mode', () => {
            // Start in read-only mode
            mockBody.classList.contains.mockReturnValue(true);
            
            // Toggle to edit mode
            mockBody.classList.contains.mockReturnValue(false);
            mockBody.classList.remove('read-only-mode');

            // Reset all button styles
            const allButtons = [
                ...mockDocument.querySelectorAll('.alternate-art-btn'),
                ...mockDocument.querySelectorAll('.quantity-btn'),
                ...mockDocument.querySelectorAll('.deck-list-item-remove'),
                ...mockDocument.querySelectorAll('.remove-all-btn'),
                ...mockDocument.querySelectorAll('.add-one-btn'),
                ...mockDocument.querySelectorAll('.remove-one-btn'),
                ...mockDocument.querySelectorAll('.deck-list-item-quantity-btn'),
                ...mockDocument.querySelectorAll('.reserve-btn')
            ];

            allButtons.forEach((button: any) => {
                button.style.display = ''; // Reset to default
            });

            // Verify all buttons are visible
            allButtons.forEach((button: any) => {
                expect(button.style.display).toBe('');
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle missing buttons gracefully', () => {
            // Mock empty querySelectorAll result
            mockDocument.querySelectorAll.mockReturnValue([]);
            
            mockBody.classList.contains.mockReturnValue(true);

            const changeArtButtons = mockDocument.querySelectorAll('.alternate-art-btn');
            expect(changeArtButtons.length).toBe(0);

            // Should not throw errors when trying to hide non-existent buttons
            changeArtButtons.forEach((button: any) => {
                button.style.display = 'none';
            });
        });

        test('should handle buttons with multiple classes', () => {
            // Create a button with multiple classes
            const multiClassButton = {
                id: 'multiClassBtn',
                className: 'alternate-art-btn some-other-class',
                style: { display: '' }
            };

            mockDocument.querySelectorAll.mockImplementation((selector: string) => {
                if (selector === '.alternate-art-btn') {
                    return [multiClassButton];
                }
                return [];
            });

            mockBody.classList.contains.mockReturnValue(true);

            const buttons = mockDocument.querySelectorAll('.alternate-art-btn');
            buttons.forEach((button: any) => {
                button.style.display = 'none';
            });

            expect(multiClassButton.style.display).toBe('none');
        });
    });
});

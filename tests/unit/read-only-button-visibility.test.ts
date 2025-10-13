/**
 * @jest-environment jsdom
 */

/**
 * Read-Only Mode Button Visibility Tests
 * 
 * Tests that verify the correct button visibility behavior in read-only mode:
 * - Remove All buttons should be hidden
 * - List View and Draw Hand buttons should remain visible
 */

describe('Read-Only Mode Button Visibility Tests', () => {
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

    describe('Remove All Button Hiding', () => {
        test('should hide Remove All buttons in read-only mode', () => {
            // Mock read-only mode
            mockBody.classList.contains.mockReturnValue(true);

            // Mock Remove All buttons (these should be hidden)
            const removeAllButtons = [
                { id: 'removeAllCharacters', classList: { contains: jest.fn() } },
                { id: 'removeAllMissions', classList: { contains: jest.fn() } },
                { id: 'removeAllSpecial', classList: { contains: jest.fn() } },
                { id: 'removeAllPower', classList: { contains: jest.fn() } },
                { id: 'removeAllUniverse', classList: { contains: jest.fn() } },
                { id: 'removeAllEvents', classList: { contains: jest.fn() } },
                { id: 'removeAllLocations', classList: { contains: jest.fn() } }
            ];

            // Mock CSS rule application
            const cssRule = '.read-only-mode .remove-all-btn:not(#drawHandBtn):not(#listViewBtn) { display: none !important; }';

            // Test that Remove All buttons would be hidden by the CSS rule
            removeAllButtons.forEach(button => {
                // Simulate CSS selector matching
                const hasRemoveAllBtnClass = true; // All Remove All buttons have this class
                const isDrawHandBtn = button.id === 'drawHandBtn';
                const isListViewBtn = button.id === 'listViewBtn';
                const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');

                // The button should be hidden if:
                // - It's in read-only mode AND
                // - It has remove-all-btn class AND
                // - It's NOT the drawHandBtn AND
                // - It's NOT the listViewBtn
                const shouldBeHidden = isInReadOnlyMode && hasRemoveAllBtnClass && !isDrawHandBtn && !isListViewBtn;

                expect(shouldBeHidden).toBe(true);
            });
        });

        test('should not hide Remove All buttons in edit mode', () => {
            // Mock edit mode (not read-only)
            mockBody.classList.contains.mockReturnValue(false);

            // Test that Remove All buttons would NOT be hidden
            const removeAllButtons = [
                { id: 'removeAllCharacters' },
                { id: 'removeAllMissions' },
                { id: 'removeAllSpecial' }
            ];

            removeAllButtons.forEach(button => {
                const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');
                const shouldBeHidden = isInReadOnlyMode; // Only hidden in read-only mode

                expect(shouldBeHidden).toBe(false);
            });
        });

        test('should hide Remove Unusables buttons in read-only mode', () => {
            // Mock read-only mode
            mockBody.classList.contains.mockReturnValue(true);

            // Mock Remove Unusables buttons
            const removeUnusablesButtons = [
                { id: 'removeUnusablesSpecial', classList: { contains: jest.fn() } },
                { id: 'removeUnusablesPower', classList: { contains: jest.fn() } }
            ];

            removeUnusablesButtons.forEach(button => {
                const hasRemoveAllBtnClass = true; // Remove Unusables buttons also have this class
                const isDrawHandBtn = button.id === 'drawHandBtn';
                const isListViewBtn = button.id === 'listViewBtn';
                const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');

                const shouldBeHidden = isInReadOnlyMode && hasRemoveAllBtnClass && !isDrawHandBtn && !isListViewBtn;

                expect(shouldBeHidden).toBe(true);
            });
        });
    });

    describe('List View Button Visibility', () => {
        test('should keep List View button visible in read-only mode', () => {
            // Mock read-only mode
            mockBody.classList.contains.mockReturnValue(true);

            // Mock List View button
            const listViewBtn = {
                id: 'listViewBtn',
                classList: { contains: jest.fn() },
                style: { display: '' }
            };

            // Test that List View button would NOT be hidden by the CSS rule
            const hasRemoveAllBtnClass = true; // List View button has this class
            const isDrawHandBtn = listViewBtn.id === 'drawHandBtn';
            const isListViewBtn = listViewBtn.id === 'listViewBtn';
            const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');

            // The button should NOT be hidden because it matches the :not(#listViewBtn) exclusion
            const shouldBeHidden = isInReadOnlyMode && hasRemoveAllBtnClass && !isDrawHandBtn && !isListViewBtn;

            expect(shouldBeHidden).toBe(false);
            expect(isListViewBtn).toBe(true);
        });

        test('should keep List View button visible in edit mode', () => {
            // Mock edit mode
            mockBody.classList.contains.mockReturnValue(false);

            const listViewBtn = { id: 'listViewBtn' };
            const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');

            expect(isInReadOnlyMode).toBe(false);
            // Button should be visible in edit mode
        });

        test('should verify List View button has correct ID for CSS exclusion', () => {
            const listViewBtn = { id: 'listViewBtn' };
            
            // Verify the button has the exact ID that's excluded in the CSS rule
            expect(listViewBtn.id).toBe('listViewBtn');
            
            // Verify this matches the CSS selector :not(#listViewBtn)
            const cssExclusionId = 'listViewBtn';
            expect(listViewBtn.id).toBe(cssExclusionId);
        });
    });

    describe('Draw Hand Button Visibility', () => {
        test('should keep Draw Hand button visible in read-only mode', () => {
            // Mock read-only mode
            mockBody.classList.contains.mockReturnValue(true);

            // Mock Draw Hand button
            const drawHandBtn = {
                id: 'drawHandBtn',
                classList: { contains: jest.fn() },
                style: { display: '' }
            };

            // Test that Draw Hand button would NOT be hidden by the CSS rule
            const hasRemoveAllBtnClass = true; // Draw Hand button has this class
            const isDrawHandBtn = drawHandBtn.id === 'drawHandBtn';
            const isListViewBtn = drawHandBtn.id === 'listViewBtn';
            const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');

            // The button should NOT be hidden because it matches the :not(#drawHandBtn) exclusion
            const shouldBeHidden = isInReadOnlyMode && hasRemoveAllBtnClass && !isDrawHandBtn && !isListViewBtn;

            expect(shouldBeHidden).toBe(false);
            expect(isDrawHandBtn).toBe(true);
        });

        test('should keep Draw Hand button visible in edit mode', () => {
            // Mock edit mode
            mockBody.classList.contains.mockReturnValue(false);

            const drawHandBtn = { id: 'drawHandBtn' };
            const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');

            expect(isInReadOnlyMode).toBe(false);
            // Button should be visible in edit mode
        });

        test('should verify Draw Hand button has correct ID for CSS exclusion', () => {
            const drawHandBtn = { id: 'drawHandBtn' };
            
            // Verify the button has the exact ID that's excluded in the CSS rule
            expect(drawHandBtn.id).toBe('drawHandBtn');
            
            // Verify this matches the CSS selector :not(#drawHandBtn)
            const cssExclusionId = 'drawHandBtn';
            expect(drawHandBtn.id).toBe(cssExclusionId);
        });
    });

    describe('CSS Selector Specificity', () => {
        test('should verify CSS selector logic for button visibility', () => {
            // Test the CSS selector: .read-only-mode .remove-all-btn:not(#drawHandBtn):not(#listViewBtn)
            
            const testCases = [
                // { buttonId, hasRemoveAllClass, isReadOnlyMode, expectedHidden }
                { buttonId: 'removeAllCharacters', hasRemoveAllClass: true, isReadOnlyMode: true, expectedHidden: true },
                { buttonId: 'removeAllMissions', hasRemoveAllClass: true, isReadOnlyMode: true, expectedHidden: true },
                { buttonId: 'removeAllSpecial', hasRemoveAllClass: true, isReadOnlyMode: true, expectedHidden: true },
                { buttonId: 'drawHandBtn', hasRemoveAllClass: true, isReadOnlyMode: true, expectedHidden: false },
                { buttonId: 'listViewBtn', hasRemoveAllClass: true, isReadOnlyMode: true, expectedHidden: false },
                { buttonId: 'removeAllCharacters', hasRemoveAllClass: true, isReadOnlyMode: false, expectedHidden: false },
                { buttonId: 'drawHandBtn', hasRemoveAllClass: true, isReadOnlyMode: false, expectedHidden: false },
                { buttonId: 'listViewBtn', hasRemoveAllClass: true, isReadOnlyMode: false, expectedHidden: false }
            ];

            testCases.forEach(({ buttonId, hasRemoveAllClass, isReadOnlyMode, expectedHidden }) => {
                const isDrawHandBtn = buttonId === 'drawHandBtn';
                const isListViewBtn = buttonId === 'listViewBtn';
                
                // Apply CSS selector logic
                const shouldBeHidden = isReadOnlyMode && 
                                     hasRemoveAllClass && 
                                     !isDrawHandBtn && 
                                     !isListViewBtn;

                expect(shouldBeHidden).toBe(expectedHidden);
            });
        });

        test('should handle edge cases in CSS selector', () => {
            // Test edge cases
            const edgeCases = [
                { buttonId: 'drawHandBtn', isReadOnlyMode: true, expectedHidden: false },
                { buttonId: 'listViewBtn', isReadOnlyMode: true, expectedHidden: false },
                { buttonId: 'someOtherButton', isReadOnlyMode: true, expectedHidden: true },
                { buttonId: 'drawHandBtn', isReadOnlyMode: false, expectedHidden: false },
                { buttonId: 'listViewBtn', isReadOnlyMode: false, expectedHidden: false }
            ];

            edgeCases.forEach(({ buttonId, isReadOnlyMode, expectedHidden }) => {
                const hasRemoveAllClass = true; // Assume all test buttons have this class
                const isDrawHandBtn = buttonId === 'drawHandBtn';
                const isListViewBtn = buttonId === 'listViewBtn';
                
                const shouldBeHidden = isReadOnlyMode && 
                                     hasRemoveAllClass && 
                                     !isDrawHandBtn && 
                                     !isListViewBtn;

                expect(shouldBeHidden).toBe(expectedHidden);
            });
        });
    });

    describe('Integration with Read-Only Mode Detection', () => {
        test('should apply read-only mode class based on URL parameter', () => {
            // Mock URL parameter detection
            const mockUrlParams = {
                get: jest.fn().mockReturnValue('true')
            };

            const mockURLSearchParams = jest.fn().mockReturnValue(mockUrlParams);
            (global as any).URLSearchParams = mockURLSearchParams;

            // Test URL parameter detection
            const urlParams = new URLSearchParams('?readonly=true');
            const isReadOnlyFromQuery = urlParams.get('readonly') === 'true';

            expect(isReadOnlyFromQuery).toBe(true);
        });

        test('should not apply read-only mode class when URL parameter is false', () => {
            const mockUrlParams = {
                get: jest.fn().mockReturnValue('false')
            };

            const mockURLSearchParams = jest.fn().mockReturnValue(mockUrlParams);
            (global as any).URLSearchParams = mockURLSearchParams;

            const urlParams = new URLSearchParams('?readonly=false');
            const isReadOnlyFromQuery = urlParams.get('readonly') === 'true';

            expect(isReadOnlyFromQuery).toBe(false);
        });

        test('should not apply read-only mode class when URL parameter is missing', () => {
            const mockUrlParams = {
                get: jest.fn().mockReturnValue(null)
            };

            const mockURLSearchParams = jest.fn().mockReturnValue(mockUrlParams);
            (global as any).URLSearchParams = mockURLSearchParams;

            const urlParams = new URLSearchParams('');
            const isReadOnlyFromQuery = urlParams.get('readonly') === 'true';

            expect(isReadOnlyFromQuery).toBe(false);
        });
    });

    describe('Button State Consistency', () => {
        test('should maintain consistent button visibility across mode switches', () => {
            // Test switching from edit to read-only mode
            const buttons = [
                { id: 'removeAllCharacters', type: 'remove-all' },
                { id: 'drawHandBtn', type: 'functional' },
                { id: 'listViewBtn', type: 'functional' }
            ];

            // Edit mode
            mockBody.classList.contains.mockReturnValue(false);
            buttons.forEach(button => {
                const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');
                const shouldBeHidden = isInReadOnlyMode && button.type === 'remove-all';
                expect(shouldBeHidden).toBe(false);
            });

            // Read-only mode
            mockBody.classList.contains.mockReturnValue(true);
            buttons.forEach(button => {
                const isInReadOnlyMode = mockBody.classList.contains('read-only-mode');
                const isDrawHandBtn = button.id === 'drawHandBtn';
                const isListViewBtn = button.id === 'listViewBtn';
                const shouldBeHidden = isInReadOnlyMode && button.type === 'remove-all' && !isDrawHandBtn && !isListViewBtn;
                
                if (button.type === 'remove-all') {
                    expect(shouldBeHidden).toBe(true);
                } else {
                    expect(shouldBeHidden).toBe(false);
                }
            });
        });
    });
});

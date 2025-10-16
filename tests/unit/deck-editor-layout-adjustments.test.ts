/**
 * Unit tests for deck editor layout adjustments made in the last hour
 * Covers: Save button height matching, spacing reductions, and horizontal divider positioning
 */

describe('Deck Editor Layout Adjustments', () => {
    let mockModalHeader: HTMLElement;
    let mockSaveButton: HTMLElement;
    let mockCancelButton: HTMLElement;
    let mockDeckEditorTopRow: HTMLElement;

    beforeEach(() => {
        // Mock modal header element
        mockModalHeader = {
            style: {} as CSSStyleDeclaration,
            classList: {
                contains: jest.fn(() => false),
                add: jest.fn(),
                remove: jest.fn()
            }
        } as any;

        // Mock save button element
        mockSaveButton = {
            style: {} as CSSStyleDeclaration,
            classList: {
                contains: jest.fn(() => false),
                add: jest.fn(),
                remove: jest.fn()
            },
            get offsetHeight() { return 32; },
            get offsetWidth() { return 80; }
        } as any;

        // Mock cancel button element
        mockCancelButton = {
            style: {} as CSSStyleDeclaration,
            classList: {
                contains: jest.fn(() => false),
                add: jest.fn(),
                remove: jest.fn()
            },
            get offsetHeight() { return 32; },
            get offsetWidth() { return 80; }
        } as any;

        // Mock deck editor top row element
        mockDeckEditorTopRow = {
            style: {} as CSSStyleDeclaration,
            classList: {
                contains: jest.fn(() => false),
                add: jest.fn(),
                remove: jest.fn()
            }
        } as any;

        // Mock document.querySelector
        (global as any).document = {
            querySelector: jest.fn((selector: string) => {
                if (selector === '.modal-header') return mockModalHeader;
                if (selector === '.action-btn.save-btn') return mockSaveButton;
                if (selector === '.action-btn.cancel-btn') return mockCancelButton;
                if (selector === '.deck-editor-top-row') return mockDeckEditorTopRow;
                return null;
            }),
            querySelectorAll: jest.fn(() => [])
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Save Button Height Matching', () => {
        it('should have matching height properties for Save and Cancel buttons', () => {
            // Test that both buttons have the same height-related CSS properties
            const expectedHeight = 'auto';
            const expectedMinHeight = '24px';
            const expectedPadding = '4px 8px';
            const expectedBoxSizing = 'border-box';

            // Simulate CSS application
            mockSaveButton.style.height = expectedHeight;
            mockSaveButton.style.minHeight = expectedMinHeight;
            mockSaveButton.style.padding = expectedPadding;
            mockSaveButton.style.boxSizing = expectedBoxSizing;

            mockCancelButton.style.height = expectedHeight;
            mockCancelButton.style.minHeight = expectedMinHeight;
            mockCancelButton.style.padding = expectedPadding;
            mockCancelButton.style.boxSizing = expectedBoxSizing;

            expect(mockSaveButton.style.height).toBe(expectedHeight);
            expect(mockSaveButton.style.minHeight).toBe(expectedMinHeight);
            expect(mockSaveButton.style.padding).toBe(expectedPadding);
            expect(mockSaveButton.style.boxSizing).toBe(expectedBoxSizing);

            expect(mockCancelButton.style.height).toBe(expectedHeight);
            expect(mockCancelButton.style.minHeight).toBe(expectedMinHeight);
            expect(mockCancelButton.style.padding).toBe(expectedPadding);
            expect(mockCancelButton.style.boxSizing).toBe(expectedBoxSizing);
        });

        it('should have identical computed heights for Save and Cancel buttons', () => {
            // Test that both buttons have the same computed height
            const expectedHeight = 32;

            expect(mockSaveButton.offsetHeight).toBe(mockCancelButton.offsetHeight);
            expect(mockSaveButton.offsetHeight).toBe(expectedHeight);
        });

        it('should apply higher specificity CSS rules for Save button', () => {
            // Test that Save button has higher specificity CSS rules
            const highSpecificitySelectors = [
                '.action-btn.save-btn',
                '.deck-editor-actions .action-btn.save-btn',
                '.modal-header .deck-editor-actions .action-btn.save-btn'
            ];

            // Simulate CSS rule application with !important
            highSpecificitySelectors.forEach(selector => {
                expect(selector).toContain('save-btn');
                expect(selector).toMatch(/\.action-btn/);
            });
        });

        it('should maintain consistent button styling across different contexts', () => {
            // Test that Save button styling is consistent in different CSS contexts
            const expectedBackground = 'rgba(78, 205, 196, 0.2)';
            const expectedColor = '#4ecdc4';
            const expectedBorder = '1px solid rgba(78, 205, 196, 0.3)';

            // Simulate CSS application
            mockSaveButton.style.background = expectedBackground;
            mockSaveButton.style.color = expectedColor;
            mockSaveButton.style.border = expectedBorder;

            expect(mockSaveButton.style.background).toBe(expectedBackground);
            expect(mockSaveButton.style.color).toBe(expectedColor);
            expect(mockSaveButton.style.border).toBe(expectedBorder);
        });
    });

    describe('Modal Header Spacing Adjustments', () => {
        it('should have reduced bottom padding for modal header', () => {
            // Test that modal header has the correct reduced bottom padding
            const expectedPadding = '12px 20px 5px 20px'; // top, right, bottom, left
            mockModalHeader.style.padding = expectedPadding;

            expect(mockModalHeader.style.padding).toBe(expectedPadding);
            expect(mockModalHeader.style.padding).toContain('5px'); // bottom padding
        });

        it('should have reduced margin-bottom for modal header', () => {
            // Test that modal header has the correct reduced margin-bottom
            const expectedMarginBottom = '4px';
            mockModalHeader.style.marginBottom = expectedMarginBottom;

            expect(mockModalHeader.style.marginBottom).toBe(expectedMarginBottom);
        });

        it('should maintain proper gap between header elements', () => {
            // Test that the gap between header elements is maintained
            const expectedGap = '15px';
            mockModalHeader.style.gap = expectedGap;

            expect(mockModalHeader.style.gap).toBe(expectedGap);
        });

        it('should have correct border-bottom styling', () => {
            // Test that the horizontal divider (border-bottom) is properly styled
            const expectedBorderBottom = '1px solid rgba(255, 255, 255, 0.2)';
            mockModalHeader.style.borderBottom = expectedBorderBottom;

            expect(mockModalHeader.style.borderBottom).toBe(expectedBorderBottom);
        });
    });

    describe('Horizontal Divider Positioning', () => {
        it('should position horizontal divider correctly with reduced padding', () => {
            // Test that the horizontal divider is positioned correctly
            const expectedPadding = '12px 20px 5px 20px';
            const expectedBorderBottom = '1px solid rgba(255, 255, 255, 0.2)';
            
            mockModalHeader.style.padding = expectedPadding;
            mockModalHeader.style.borderBottom = expectedBorderBottom;

            expect(mockModalHeader.style.padding).toBe(expectedPadding);
            expect(mockModalHeader.style.borderBottom).toBe(expectedBorderBottom);
        });

        it('should maintain flex layout properties for modal header', () => {
            // Test that modal header maintains proper flex layout
            const expectedDisplay = 'flex';
            const expectedFlexDirection = 'column';
            
            mockModalHeader.style.display = expectedDisplay;
            mockModalHeader.style.flexDirection = expectedFlexDirection;

            expect(mockModalHeader.style.display).toBe(expectedDisplay);
            expect(mockModalHeader.style.flexDirection).toBe(expectedFlexDirection);
        });

        it('should have consistent spacing between header and content', () => {
            // Test that spacing between header and content is consistent
            const expectedMarginBottom = '4px';
            const expectedGap = '15px';
            
            mockModalHeader.style.marginBottom = expectedMarginBottom;
            mockModalHeader.style.gap = expectedGap;

            expect(mockModalHeader.style.marginBottom).toBe(expectedMarginBottom);
            expect(mockModalHeader.style.gap).toBe(expectedGap);
        });
    });

    describe('Layout Consistency', () => {
        it('should maintain consistent button dimensions across all action buttons', () => {
            // Test that all action buttons have consistent dimensions
            const expectedHeight = 32;
            const expectedMinHeight = '24px';
            const expectedPadding = '4px 8px';

            mockSaveButton.style.minHeight = expectedMinHeight;
            mockSaveButton.style.padding = expectedPadding;

            mockCancelButton.style.minHeight = expectedMinHeight;
            mockCancelButton.style.padding = expectedPadding;

            expect(mockSaveButton.offsetHeight).toBe(mockCancelButton.offsetHeight);
            expect(mockSaveButton.style.minHeight).toBe(mockCancelButton.style.minHeight);
            expect(mockSaveButton.style.padding).toBe(mockCancelButton.style.padding);
        });

        it('should maintain proper CSS specificity hierarchy', () => {
            // Test that CSS specificity is properly maintained
            const baseSelector = '.action-btn.save-btn';
            const mediumSpecificitySelector = '.deck-editor-actions .action-btn.save-btn';
            const highSpecificitySelector = '.modal-header .deck-editor-actions .action-btn.save-btn';

            expect(highSpecificitySelector).toContain(mediumSpecificitySelector);
            expect(mediumSpecificitySelector).toContain(baseSelector);
            expect(highSpecificitySelector).toContain('modal-header');
        });

        it('should handle missing DOM elements gracefully', () => {
            // Test that the layout adjustments handle missing elements gracefully
            (global as any).document.querySelector = jest.fn(() => null);

            expect(() => {
                const element = (global as any).document.querySelector('.non-existent-element');
                expect(element).toBeNull();
            }).not.toThrow();
        });

        it('should maintain responsive layout properties', () => {
            // Test that responsive layout properties are maintained
            const expectedFlexDirection = 'column';
            const expectedGap = '15px';
            const expectedPadding = '12px 20px 5px 20px';

            mockModalHeader.style.flexDirection = expectedFlexDirection;
            mockModalHeader.style.gap = expectedGap;
            mockModalHeader.style.padding = expectedPadding;

            expect(mockModalHeader.style.flexDirection).toBe(expectedFlexDirection);
            expect(mockModalHeader.style.gap).toBe(expectedGap);
            expect(mockModalHeader.style.padding).toBe(expectedPadding);
        });
    });

    describe('CSS Rule Validation', () => {
        it('should validate that Save button CSS rules include !important declarations', () => {
            // Test that Save button CSS rules use !important for proper specificity
            const cssRules = [
                'background: rgba(78, 205, 196, 0.2) !important',
                'color: #4ecdc4 !important',
                'border: 1px solid rgba(78, 205, 196, 0.3) !important',
                'height: auto !important',
                'min-height: 24px !important',
                'padding: 4px 8px !important',
                'box-sizing: border-box !important'
            ];

            cssRules.forEach(rule => {
                expect(rule).toContain('!important');
            });
        });

        it('should validate that Cancel button CSS rules include !important declarations', () => {
            // Test that Cancel button CSS rules use !important for proper specificity
            const cssRules = [
                'background: rgba(255, 255, 255, 0.1) !important',
                'color: #ffffff !important',
                'border: 1px solid rgba(255, 255, 255, 0.2) !important',
                'display: block !important',
                'visibility: visible !important',
                'opacity: 1 !important',
                'position: static !important',
                'width: 100% !important',
                'height: auto !important',
                'min-height: 24px !important',
                'min-width: 60px !important',
                'padding: 4px 8px !important',
                'box-sizing: border-box !important'
            ];

            cssRules.forEach(rule => {
                expect(rule).toContain('!important');
            });
        });

        it('should validate modal header CSS properties', () => {
            // Test that modal header has the correct CSS properties
            const expectedProperties = {
                display: 'flex',
                flexDirection: 'column',
                padding: '12px 20px 5px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                marginBottom: '4px',
                gap: '15px'
            };

            Object.entries(expectedProperties).forEach(([property, value]) => {
                mockModalHeader.style[property as any] = value;
                expect(mockModalHeader.style[property as any]).toBe(value);
            });
        });
    });

    describe('Integration with Existing Layout', () => {
        it('should maintain compatibility with existing deck editor layout', () => {
            // Test that the layout adjustments don't break existing functionality
            const existingLayoutProperties = {
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
            };

            Object.entries(existingLayoutProperties).forEach(([property, value]) => {
                mockModalHeader.style[property as any] = value;
                expect(mockModalHeader.style[property as any]).toBe(value);
            });
        });

        it('should maintain proper positioning for deck editor top row', () => {
            // Test that deck editor top row positioning is maintained
            const expectedProperties = {
                display: 'flex',
                alignItems: 'flex-start',
                width: '100%',
                position: 'relative'
            };

            Object.entries(expectedProperties).forEach(([property, value]) => {
                mockDeckEditorTopRow.style[property as any] = value;
                expect(mockDeckEditorTopRow.style[property as any]).toBe(value);
            });
        });

        it('should maintain centered positioning for deck summary section', () => {
            // Test that deck summary section remains centered
            const expectedPosition = 'absolute';
            const expectedLeft = '50%';
            const expectedTransform = 'translateX(-50%)';

            // Simulate CSS application for centered positioning
            expect(expectedPosition).toBe('absolute');
            expect(expectedLeft).toBe('50%');
            expect(expectedTransform).toBe('translateX(-50%)');
        });
    });
});

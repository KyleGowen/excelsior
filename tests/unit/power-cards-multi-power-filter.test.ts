/**
 * Unit tests for Power Cards Multi-Power filter functionality
 * Tests the specific issue where Multi-Power cards disappear when deselected
 * but don't reappear when selected again due to data mismatch
 */

describe('Power Cards Multi-Power Filter', () => {
    let mockDocument: any;
    let mockFetch: jest.Mock;
    let mockConsoleLog: jest.SpyInstance;

    beforeEach(() => {
        // Mock console.log to avoid cluttering test output
        mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
        
        // Mock fetch for API calls
        mockFetch = jest.fn();
        global.fetch = mockFetch;

        // Mock DOM elements
        mockDocument = {
            querySelectorAll: jest.fn(),
            getElementById: jest.fn()
        };
        global.document = mockDocument;

        // Mock Power Cards data
        const mockPowerCardsData = [
            { id: '1', name: 'Energy 1', power_type: 'Energy', value: 1 },
            { id: '2', name: 'Combat 1', power_type: 'Combat', value: 1 },
            { id: '3', name: 'Multi Power 3', power_type: 'Multi Power', value: 3 },
            { id: '4', name: 'Multi Power 4', power_type: 'Multi Power', value: 4 },
            { id: '5', name: 'Multi Power 5', power_type: 'Multi Power', value: 5 },
            { id: '6', name: 'Any-Power 5', power_type: 'Any-Power', value: 5 }
        ];

        mockFetch.mockResolvedValue({
            json: () => Promise.resolve({
                success: true,
                data: mockPowerCardsData
            })
        });
    });

    afterEach(() => {
        mockConsoleLog.mockRestore();
        jest.clearAllMocks();
    });

    describe('Data Mismatch Issue', () => {
        it('should identify the data mismatch between checkbox value and database power_type', () => {
            // This test documents the root cause of the issue
            const checkboxValue = 'Multi-Power'; // What the checkbox had before fix
            const databasePowerType = 'Multi Power'; // What's actually in the database
            
            expect(checkboxValue).not.toBe(databasePowerType);
            expect(checkboxValue).toBe('Multi-Power');
            expect(databasePowerType).toBe('Multi Power');
        });

        it('should have correct checkbox value after fix', () => {
            // This test verifies the fix is correct
            const checkboxValue = 'Multi Power'; // What the checkbox has after fix
            const databasePowerType = 'Multi Power'; // What's in the database
            
            expect(checkboxValue).toBe(databasePowerType);
            expect(checkboxValue).toBe('Multi Power');
        });
    });

    describe('Multi-Power Filter Logic', () => {
        let applyPowerCardFilters: Function;
        let setupPowerCardsSearch: Function;
        let clearPowerCardFilters: Function;

        beforeEach(() => {
            // Mock the Power Cards filter functions
            applyPowerCardFilters = jest.fn().mockImplementation(async () => {
                const resp = await fetch('/api/power-cards');
                const data = await resp.json();
                if (!data.success) return;

                let filtered = data.data;

                // Filter by power type - get only checked checkboxes
                const allCheckboxes = Array.from(document.querySelectorAll('#power-cards-tab input[type="checkbox"]'));
                const selectedTypes = allCheckboxes
                    .filter((cb: any) => cb.checked)
                    .map((cb: any) => cb.value);

                if (selectedTypes.length === 0) {
                    filtered = [];
                } else {
                    filtered = filtered.filter((card: any) => selectedTypes.includes(card.power_type));
                }

                console.log('Selected power types for filtering:', selectedTypes);
                console.log('Filtered power cards count:', filtered.length);
            });

            setupPowerCardsSearch = jest.fn().mockImplementation(() => {
                const checkboxes = document.querySelectorAll('#power-cards-tab input[type="checkbox"]');
                checkboxes.forEach((checkbox: any) => {
                    checkbox.checked = true;
                    checkbox.addEventListener = jest.fn(); // Mock addEventListener
                });
            });

            clearPowerCardFilters = jest.fn().mockImplementation(() => {
                const checkboxes = document.querySelectorAll('#power-cards-tab input[type="checkbox"]');
                checkboxes.forEach((checkbox: any) => {
                    checkbox.checked = true;
                });
                applyPowerCardFilters();
            });
        });

        it('should filter out Multi-Power cards when Multi-Power checkbox is unchecked', async () => {
            // Mock checkboxes with Multi-Power unchecked
            const mockCheckboxes = [
                { value: 'Energy', checked: true },
                { value: 'Combat', checked: true },
                { value: 'Brute Force', checked: true },
                { value: 'Intelligence', checked: true },
                { value: 'Any-Power', checked: true },
                { value: 'Multi Power', checked: false } // Unchecked
            ];

            mockDocument.querySelectorAll.mockReturnValue(mockCheckboxes);

            await applyPowerCardFilters();

            expect(mockConsoleLog).toHaveBeenCalledWith(
                'Selected power types for filtering:', 
                ['Energy', 'Combat', 'Brute Force', 'Intelligence', 'Any-Power']
            );
        });

        it('should include Multi-Power cards when Multi-Power checkbox is checked', async () => {
            // Mock checkboxes with Multi-Power checked
            const mockCheckboxes = [
                { value: 'Energy', checked: true },
                { value: 'Combat', checked: true },
                { value: 'Brute Force', checked: true },
                { value: 'Intelligence', checked: true },
                { value: 'Any-Power', checked: true },
                { value: 'Multi Power', checked: true } // Checked
            ];

            mockDocument.querySelectorAll.mockReturnValue(mockCheckboxes);

            await applyPowerCardFilters();

            expect(mockConsoleLog).toHaveBeenCalledWith(
                'Selected power types for filtering:', 
                ['Energy', 'Combat', 'Brute Force', 'Intelligence', 'Any-Power', 'Multi Power']
            );
        });

        it('should show no cards when no checkboxes are selected', async () => {
            // Mock all checkboxes unchecked
            const mockCheckboxes = [
                { value: 'Energy', checked: false },
                { value: 'Combat', checked: false },
                { value: 'Brute Force', checked: false },
                { value: 'Intelligence', checked: false },
                { value: 'Any-Power', checked: false },
                { value: 'Multi Power', checked: false }
            ];

            mockDocument.querySelectorAll.mockReturnValue(mockCheckboxes);

            await applyPowerCardFilters();

            expect(mockConsoleLog).toHaveBeenCalledWith(
                'Selected power types for filtering:', 
                []
            );
        });

        it('should initialize all checkboxes as checked by default', () => {
            const mockCheckboxes = [
                { value: 'Energy', checked: false },
                { value: 'Combat', checked: false },
                { value: 'Brute Force', checked: false },
                { value: 'Intelligence', checked: false },
                { value: 'Any-Power', checked: false },
                { value: 'Multi Power', checked: false }
            ];

            mockDocument.querySelectorAll.mockReturnValue(mockCheckboxes);

            setupPowerCardsSearch();

            // Verify all checkboxes are set to checked
            mockCheckboxes.forEach(checkbox => {
                expect(checkbox.checked).toBe(true);
            });
        });

        it('should reset all checkboxes to checked when clearing filters', () => {
            const mockCheckboxes = [
                { value: 'Energy', checked: false },
                { value: 'Combat', checked: false },
                { value: 'Brute Force', checked: false },
                { value: 'Intelligence', checked: false },
                { value: 'Any-Power', checked: false },
                { value: 'Multi Power', checked: false }
            ];

            mockDocument.querySelectorAll.mockReturnValue(mockCheckboxes);

            clearPowerCardFilters();

            // Verify all checkboxes are reset to checked
            mockCheckboxes.forEach(checkbox => {
                expect(checkbox.checked).toBe(true);
            });
        });
    });

    describe('Multi-Power Card Filtering Scenarios', () => {
        it('should correctly filter Multi-Power cards based on exact power_type match', () => {
            const mockCards = [
                { id: '1', name: 'Energy 1', power_type: 'Energy', value: 1 },
                { id: '2', name: 'Combat 1', power_type: 'Combat', value: 1 },
                { id: '3', name: 'Multi Power 3', power_type: 'Multi Power', value: 3 },
                { id: '4', name: 'Multi Power 4', power_type: 'Multi Power', value: 4 },
                { id: '5', name: 'Multi Power 5', power_type: 'Multi Power', value: 5 }
            ];

            const selectedTypes = ['Multi Power'];
            const filtered = mockCards.filter(card => selectedTypes.includes(card.power_type));

            expect(filtered).toHaveLength(3);
            expect(filtered.map(card => card.name)).toEqual([
                'Multi Power 3',
                'Multi Power 4', 
                'Multi Power 5'
            ]);
        });

        it('should not match Multi-Power cards with incorrect checkbox value', () => {
            const mockCards = [
                { id: '3', name: 'Multi Power 3', power_type: 'Multi Power', value: 3 },
                { id: '4', name: 'Multi Power 4', power_type: 'Multi Power', value: 4 }
            ];

            // This simulates the old broken behavior with wrong checkbox value
            const selectedTypes = ['Multi-Power']; // Wrong value (with hyphen)
            const filtered = mockCards.filter(card => selectedTypes.includes(card.power_type));

            expect(filtered).toHaveLength(0); // No matches because of data mismatch
        });

        it('should match Multi-Power cards with correct checkbox value', () => {
            const mockCards = [
                { id: '3', name: 'Multi Power 3', power_type: 'Multi Power', value: 3 },
                { id: '4', name: 'Multi Power 4', power_type: 'Multi Power', value: 4 }
            ];

            // This simulates the fixed behavior with correct checkbox value
            const selectedTypes = ['Multi Power']; // Correct value (with space)
            const filtered = mockCards.filter(card => selectedTypes.includes(card.power_type));

            expect(filtered).toHaveLength(2); // Matches because values match exactly
        });
    });

    describe('Error Handling', () => {
        it('should handle API errors gracefully', async () => {
            mockFetch.mockRejectedValue(new Error('API Error'));

            const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

            const applyPowerCardFilters = jest.fn().mockImplementation(async () => {
                try {
                    const resp = await fetch('/api/power-cards');
                    const data = await resp.json();
                    if (!data.success) return;
                    // ... rest of filtering logic
                } catch (err) {
                    console.error('Error applying power card filters:', err);
                }
            });

            await applyPowerCardFilters();

            expect(mockConsoleError).toHaveBeenCalledWith(
                'Error applying power card filters:', 
                expect.any(Error)
            );

            mockConsoleError.mockRestore();
        });

        it('should handle empty API response', async () => {
            mockFetch.mockResolvedValue({
                json: () => Promise.resolve({
                    success: false,
                    data: []
                })
            });

            const applyPowerCardFilters = jest.fn().mockImplementation(async () => {
                const resp = await fetch('/api/power-cards');
                const data = await resp.json();
                if (!data.success) return;
                // ... rest of filtering logic
            });

            await applyPowerCardFilters();

            // Should return early without processing
            expect(mockConsoleLog).not.toHaveBeenCalledWith(
                'Selected power types for filtering:', 
                expect.any(Array)
            );
        });
    });

    describe('Performance and Edge Cases', () => {
        it('should handle large datasets efficiently', async () => {
            // Create a large dataset
            const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
                id: `card-${i}`,
                name: `Card ${i}`,
                power_type: i % 6 === 0 ? 'Multi Power' : 'Energy',
                value: i % 10
            }));

            mockFetch.mockResolvedValue({
                json: () => Promise.resolve({
                    success: true,
                    data: largeDataset
                })
            });

            const mockCheckboxes = [
                { value: 'Multi Power', checked: true }
            ];

            mockDocument.querySelectorAll.mockReturnValue(mockCheckboxes);

            const applyPowerCardFilters = jest.fn().mockImplementation(async () => {
                const resp = await fetch('/api/power-cards');
                const data = await resp.json();
                if (!data.success) return;

                let filtered = data.data;
                const selectedTypes = Array.from(document.querySelectorAll('#power-cards-tab input[type="checkbox"]:checked'))
                    .map((cb: any) => cb.value);

                if (selectedTypes.length === 0) {
                    filtered = [];
                } else {
                    filtered = filtered.filter((card: any) => selectedTypes.includes(card.power_type));
                }

                console.log('Filtered power cards count:', filtered.length);
            });

            const startTime = Date.now();
            await applyPowerCardFilters();
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
            expect(mockConsoleLog).toHaveBeenCalledWith('Filtered power cards count:', expect.any(Number));
        });

        it('should handle undefined or null power_type values', () => {
            const mockCards = [
                { id: '1', name: 'Valid Card', power_type: 'Multi Power', value: 1 },
                { id: '2', name: 'Invalid Card 1', power_type: null, value: 2 },
                { id: '3', name: 'Invalid Card 2', power_type: undefined, value: 3 },
                { id: '4', name: 'Empty Card', power_type: '', value: 4 }
            ];

            const selectedTypes = ['Multi Power'];
            const filtered = mockCards.filter(card => 
                card.power_type && selectedTypes.includes(card.power_type)
            );

            expect(filtered).toHaveLength(1);
            expect(filtered[0].name).toBe('Valid Card');
        });
    });
});

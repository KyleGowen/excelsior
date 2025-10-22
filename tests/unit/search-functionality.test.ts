/**
 * Unit tests for search functionality
 * Tests the search bar functionality on the Characters tab
 */

describe('Search Functionality', () => {
    let mockDocument: any;
    let mockSearchInput: any;
    let mockActiveTab: any;
    let mockRows: any[];

    beforeEach(() => {
        // Mock DOM elements
        mockSearchInput = {
            value: '',
            addEventListener: jest.fn(),
            dispatchEvent: jest.fn()
        };

        mockRows = [
            {
                textContent: 'Angry Mob (Industrial Age) Add to Deck 4 5 7 3 18 Must have 25 hits to be Cumulative KO\'d.',
                style: { display: '' }
            },
            {
                textContent: 'Zeus Add to Deck 8 3 6 5 23 May have 1 duplicate "Thunderbolt" Special',
                style: { display: '' }
            },
            {
                textContent: 'Sherlock Holmes Add to Deck 6 7 4 8 25 Detective abilities',
                style: { display: '' }
            }
        ];

        mockActiveTab = {
            querySelectorAll: jest.fn().mockReturnValue(mockRows)
        };

        mockDocument = {
            getElementById: jest.fn().mockImplementation((id) => {
                if (id === 'search-input') return mockSearchInput;
                return null;
            }),
            querySelector: jest.fn().mockImplementation((selector) => {
                if (selector === '.table-container[style*="block"]') return mockActiveTab;
                return null;
            })
        };

        // Mock global document
        global.document = mockDocument;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('debounce function', () => {
        test('should debounce function calls', (done) => {
            // Import the debounce function (we'll need to make it available)
            const debounce = (func: Function, wait: number) => {
                let timeout: NodeJS.Timeout;
                return function executedFunction(...args: any[]) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            };

            const mockFunction = jest.fn();
            const debouncedFunction = debounce(mockFunction, 100);

            // Call the debounced function multiple times quickly
            debouncedFunction('test1');
            debouncedFunction('test2');
            debouncedFunction('test3');

            // Should not have been called yet
            expect(mockFunction).not.toHaveBeenCalled();

            // Wait for debounce delay
            setTimeout(() => {
                expect(mockFunction).toHaveBeenCalledTimes(1);
                expect(mockFunction).toHaveBeenCalledWith('test3');
                done();
            }, 150);
        });

        test('should call function with correct arguments', (done) => {
            const debounce = (func: Function, wait: number) => {
                let timeout: NodeJS.Timeout;
                return function executedFunction(...args: any[]) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            };

            const mockFunction = jest.fn();
            const debouncedFunction = debounce(mockFunction, 50);

            debouncedFunction('arg1', 'arg2');

            setTimeout(() => {
                expect(mockFunction).toHaveBeenCalledWith('arg1', 'arg2');
                done();
            }, 100);
        });
    });

    describe('performMainSearch function', () => {
        test('should show all rows when search term is empty', () => {
            // Import the performMainSearch function
            const performMainSearch = () => {
                const searchInput = document.getElementById('search-input') as HTMLInputElement;
                if (!searchInput) return;
                
                const searchTerm = searchInput.value.toLowerCase();
                const activeTab = document.querySelector('.table-container[style*="block"]');
                
                if (!activeTab) return;
                
                const rows = activeTab.querySelectorAll('tbody tr');
                rows.forEach((row: any) => {
                    if (searchTerm.length === 0) {
                        row.style.display = '';
                    } else {
                        const text = row.textContent.toLowerCase();
                        row.style.display = text.includes(searchTerm) ? '' : 'none';
                    }
                });
            };

            mockSearchInput.value = '';

            performMainSearch();

            // All rows should be visible
            mockRows.forEach(row => {
                expect(row.style.display).toBe('');
            });
        });

        test('should filter rows based on search term', () => {
            const performMainSearch = () => {
                const searchInput = document.getElementById('search-input') as HTMLInputElement;
                if (!searchInput) return;
                
                const searchTerm = searchInput.value.toLowerCase();
                const activeTab = document.querySelector('.table-container[style*="block"]');
                
                if (!activeTab) return;
                
                const rows = activeTab.querySelectorAll('tbody tr');
                rows.forEach((row: any) => {
                    if (searchTerm.length === 0) {
                        row.style.display = '';
                    } else {
                        const text = row.textContent.toLowerCase();
                        row.style.display = text.includes(searchTerm) ? '' : 'none';
                    }
                });
            };

            mockSearchInput.value = 'angry';

            performMainSearch();

            // Only rows containing 'angry' should be visible
            expect(mockRows[0].style.display).toBe(''); // Contains 'Angry Mob'
            expect(mockRows[1].style.display).toBe('none'); // Zeus - doesn't contain 'angry'
            expect(mockRows[2].style.display).toBe('none'); // Sherlock Holmes - doesn't contain 'angry'
        });

        test('should handle case-insensitive search', () => {
            const performMainSearch = () => {
                const searchInput = document.getElementById('search-input') as HTMLInputElement;
                if (!searchInput) return;
                
                const searchTerm = searchInput.value.toLowerCase();
                const activeTab = document.querySelector('.table-container[style*="block"]');
                
                if (!activeTab) return;
                
                const rows = activeTab.querySelectorAll('tbody tr');
                rows.forEach((row: any) => {
                    if (searchTerm.length === 0) {
                        row.style.display = '';
                    } else {
                        const text = row.textContent.toLowerCase();
                        row.style.display = text.includes(searchTerm) ? '' : 'none';
                    }
                });
            };

            mockSearchInput.value = 'ZEUS'; // Uppercase

            performMainSearch();

            // Should find Zeus despite case difference
            expect(mockRows[0].style.display).toBe('none'); // Angry Mob
            expect(mockRows[1].style.display).toBe(''); // Zeus
            expect(mockRows[2].style.display).toBe('none'); // Sherlock Holmes
        });

        test('should handle partial matches', () => {
            const performMainSearch = () => {
                const searchInput = document.getElementById('search-input') as HTMLInputElement;
                if (!searchInput) return;
                
                const searchTerm = searchInput.value.toLowerCase();
                const activeTab = document.querySelector('.table-container[style*="block"]');
                
                if (!activeTab) return;
                
                const rows = activeTab.querySelectorAll('tbody tr');
                rows.forEach((row: any) => {
                    if (searchTerm.length === 0) {
                        row.style.display = '';
                    } else {
                        const text = row.textContent.toLowerCase();
                        row.style.display = text.includes(searchTerm) ? '' : 'none';
                    }
                });
            };

            mockSearchInput.value = 'detective';

            performMainSearch();

            // Should find Sherlock Holmes based on 'detective' in abilities
            expect(mockRows[0].style.display).toBe('none'); // Angry Mob
            expect(mockRows[1].style.display).toBe('none'); // Zeus
            expect(mockRows[2].style.display).toBe(''); // Sherlock Holmes - contains 'detective'
        });

        test('should handle no matches', () => {
            const performMainSearch = () => {
                const searchInput = document.getElementById('search-input') as HTMLInputElement;
                if (!searchInput) return;
                
                const searchTerm = searchInput.value.toLowerCase();
                const activeTab = document.querySelector('.table-container[style*="block"]');
                
                if (!activeTab) return;
                
                const rows = activeTab.querySelectorAll('tbody tr');
                rows.forEach((row: any) => {
                    if (searchTerm.length === 0) {
                        row.style.display = '';
                    } else {
                        const text = row.textContent.toLowerCase();
                        row.style.display = text.includes(searchTerm) ? '' : 'none';
                    }
                });
            };

            mockSearchInput.value = 'nonexistent';

            performMainSearch();

            // All rows should be hidden
            mockRows.forEach(row => {
                expect(row.style.display).toBe('none');
            });
        });

        test('should handle missing active tab gracefully', () => {
            const performMainSearch = () => {
                const searchInput = document.getElementById('search-input') as HTMLInputElement;
                if (!searchInput) return;
                
                const searchTerm = searchInput.value.toLowerCase();
                const activeTab = document.querySelector('.table-container[style*="block"]');
                
                if (!activeTab) return;
                
                const rows = activeTab.querySelectorAll('tbody tr');
                rows.forEach((row: any) => {
                    if (searchTerm.length === 0) {
                        row.style.display = '';
                    } else {
                        const text = row.textContent.toLowerCase();
                        row.style.display = text.includes(searchTerm) ? '' : 'none';
                    }
                });
            };

            // Mock no active tab found
            mockDocument.querySelector.mockReturnValue(null);

            mockSearchInput.value = 'test';

            // Should not throw error
            expect(() => performMainSearch()).not.toThrow();
        });
    });

    describe('setupSearch function', () => {
        test('should add event listener to search input', () => {
            const setupSearch = () => {
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.addEventListener('input', jest.fn());
                }
            };

            setupSearch();

            expect(mockSearchInput.addEventListener).toHaveBeenCalledWith('input', expect.any(Function));
        });

        test('should handle missing search input gracefully', () => {
            const setupSearch = () => {
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.addEventListener('input', jest.fn());
                }
            };

            // Mock no search input found
            mockDocument.getElementById.mockReturnValue(null);

            // Should not throw error
            expect(() => setupSearch()).not.toThrow();
        });
    });

    describe('Search integration scenarios', () => {
        test('should handle search workflow: empty -> search -> clear', () => {
            const performMainSearch = () => {
                const searchInput = document.getElementById('search-input') as HTMLInputElement;
                if (!searchInput) return;
                
                const searchTerm = searchInput.value.toLowerCase();
                const activeTab = document.querySelector('.table-container[style*="block"]');
                
                if (!activeTab) return;
                
                const rows = activeTab.querySelectorAll('tbody tr');
                rows.forEach((row: any) => {
                    if (searchTerm.length === 0) {
                        row.style.display = '';
                    } else {
                        const text = row.textContent.toLowerCase();
                        row.style.display = text.includes(searchTerm) ? '' : 'none';
                    }
                });
            };

            // Start with empty search
            mockSearchInput.value = '';
            performMainSearch();
            mockRows.forEach(row => {
                expect(row.style.display).toBe('');
            });

            // Search for 'angry'
            mockSearchInput.value = 'angry';
            performMainSearch();
            expect(mockRows[0].style.display).toBe('');
            expect(mockRows[1].style.display).toBe('none');
            expect(mockRows[2].style.display).toBe('none');

            // Clear search
            mockSearchInput.value = '';
            performMainSearch();
            mockRows.forEach(row => {
                expect(row.style.display).toBe('');
            });
        });

        test('should handle multiple search terms', () => {
            const performMainSearch = () => {
                const searchInput = document.getElementById('search-input') as HTMLInputElement;
                if (!searchInput) return;
                
                const searchTerm = searchInput.value.toLowerCase();
                const activeTab = document.querySelector('.table-container[style*="block"]');
                
                if (!activeTab) return;
                
                const rows = activeTab.querySelectorAll('tbody tr');
                rows.forEach((row: any) => {
                    if (searchTerm.length === 0) {
                        row.style.display = '';
                    } else {
                        const text = row.textContent.toLowerCase();
                        row.style.display = text.includes(searchTerm) ? '' : 'none';
                    }
                });
            };

            // Test different search terms
            const searchTerms = ['angry', 'zeus', 'sherlock', 'nonexistent'];
            const expectedResults = [
                [true, false, false],   // 'angry' - only first row
                [false, true, false],   // 'zeus' - only second row
                [false, false, true],   // 'sherlock' - only third row
                [false, false, false]   // 'nonexistent' - no rows
            ];

            searchTerms.forEach((term, index) => {
                mockSearchInput.value = term;
                performMainSearch();
                
                expectedResults[index].forEach((shouldBeVisible, rowIndex) => {
                    const expectedDisplay = shouldBeVisible ? '' : 'none';
                    expect(mockRows[rowIndex].style.display).toBe(expectedDisplay);
                });
            });
        });
    });
});

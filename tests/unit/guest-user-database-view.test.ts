/**
 * Unit tests for guest user database view functionality
 * Tests the hiding of "Add to Deck" buttons and columns for guest users
 */

export {};

// Mock the global functions and DOM elements
const mockGetCurrentUser = jest.fn();
const mockQuerySelector = jest.fn();
const mockQuerySelectorAll = jest.fn();

// Mock DOM elements
const mockTable = {
    querySelector: mockQuerySelector,
    children: [
        { style: { display: '' } }, // First child (header row)
        { style: { display: '' } }  // Second child (filter row)
    ]
};

const mockHeaderRow = {
    children: [
        { style: { display: '' } }, // Image column
        { style: { display: '' } }  // Add to Deck column
    ]
};

const mockFilterRow = {
    children: [
        { style: { display: '' } }, // Image column filter
        { style: { display: '' } }  // Add to Deck column filter
    ]
};

// Mock document.getElementById
const mockGetElementById = jest.fn();

// Set up global mocks
(global as any).getCurrentUser = mockGetCurrentUser;
(global as any).document = {
    getElementById: mockGetElementById,
    querySelector: mockQuerySelector,
    querySelectorAll: mockQuerySelectorAll
};

// Mock the functions we're testing
let isGuestUser: () => boolean;
let hideAddToDeckColumn: () => void;

// Load the functions from the HTML file (we'll simulate them here)
beforeAll(() => {
    // Simulate the isGuestUser function
    isGuestUser = () => {
        const currentUser = mockGetCurrentUser();
        return !!(currentUser && (currentUser.role === 'GUEST' || currentUser.name === 'guest' || currentUser.username === 'guest'));
    };

    // Simulate the hideAddToDeckColumn function
    hideAddToDeckColumn = () => {
        if (isGuestUser()) {
            const tables = ['characters-table', 'basic-universe-table', 'advanced-universe-table'];
            
            tables.forEach(tableId => {
                const table = mockGetElementById(tableId);
                if (table) {
                    const headerRow = table.querySelector('thead tr:first-child');
                    const filterRow = table.querySelector('thead tr.filter-row');
                    
                    if (headerRow && headerRow.children[1]) {
                        headerRow.children[1].style.display = 'none';
                    }
                    if (filterRow && filterRow.children[1]) {
                        filterRow.children[1].style.display = 'none';
                    }
                }
            });
        }
    };
});

describe('Guest User Database View', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetElementById.mockReturnValue(mockTable);
        mockQuerySelector.mockImplementation((selector) => {
            if (selector === 'thead tr:first-child') return mockHeaderRow;
            if (selector === 'thead tr.filter-row') return mockFilterRow;
            return null;
        });
    });

    describe('isGuestUser()', () => {
        it('should return true for user with GUEST role', () => {
            mockGetCurrentUser.mockReturnValue({
                id: '123',
                name: 'guest',
                role: 'GUEST'
            });

            expect(isGuestUser()).toBe(true);
        });

        it('should return true for user with guest name', () => {
            mockGetCurrentUser.mockReturnValue({
                id: '123',
                name: 'guest',
                role: 'USER'
            });

            expect(isGuestUser()).toBe(true);
        });

        it('should return true for user with guest username', () => {
            mockGetCurrentUser.mockReturnValue({
                id: '123',
                username: 'guest',
                role: 'USER'
            });

            expect(isGuestUser()).toBe(true);
        });

        it('should return false for regular user', () => {
            mockGetCurrentUser.mockReturnValue({
                id: '123',
                name: 'john',
                username: 'john',
                role: 'USER'
            });

            expect(isGuestUser()).toBe(false);
        });

        it('should return false for admin user', () => {
            mockGetCurrentUser.mockReturnValue({
                id: '123',
                name: 'admin',
                username: 'admin',
                role: 'ADMIN'
            });

            expect(isGuestUser()).toBe(false);
        });

        it('should return false when no user is logged in', () => {
            mockGetCurrentUser.mockReturnValue(null);

            expect(isGuestUser()).toBe(false);
        });

        it('should return false when user object is undefined', () => {
            mockGetCurrentUser.mockReturnValue(undefined);

            expect(isGuestUser()).toBe(false);
        });
    });

    describe('hideAddToDeckColumn()', () => {
        beforeEach(() => {
            // Reset the mock table children styles
            mockHeaderRow.children[1].style.display = '';
            mockFilterRow.children[1].style.display = '';
        });

        it('should hide Add to Deck column headers for guest users', () => {
            // Mock guest user
            mockGetCurrentUser.mockReturnValue({
                id: '123',
                name: 'guest',
                role: 'GUEST'
            });

            // Mock table elements
            mockGetElementById.mockImplementation((id) => {
                if (['characters-table', 'basic-universe-table', 'advanced-universe-table'].includes(id)) {
                    return mockTable;
                }
                return null;
            });

            hideAddToDeckColumn();

            // Verify that the Add to Deck column headers are hidden
            expect(mockHeaderRow.children[1].style.display).toBe('none');
            expect(mockFilterRow.children[1].style.display).toBe('none');
        });

        it('should not hide Add to Deck column headers for regular users', () => {
            // Mock regular user
            mockGetCurrentUser.mockReturnValue({
                id: '123',
                name: 'john',
                role: 'USER'
            });

            hideAddToDeckColumn();

            // Verify that the Add to Deck column headers are not hidden
            expect(mockHeaderRow.children[1].style.display).toBe('');
            expect(mockFilterRow.children[1].style.display).toBe('');
        });

        it('should handle missing table elements gracefully', () => {
            // Mock guest user
            mockGetCurrentUser.mockReturnValue({
                id: '123',
                name: 'guest',
                role: 'GUEST'
            });

            // Mock missing table elements
            mockGetElementById.mockReturnValue(null);

            expect(() => hideAddToDeckColumn()).not.toThrow();
        });

        it('should handle missing header rows gracefully', () => {
            // Mock guest user
            mockGetCurrentUser.mockReturnValue({
                id: '123',
                name: 'guest',
                role: 'GUEST'
            });

            // Mock table with missing header rows
            mockGetElementById.mockReturnValue(mockTable);
            mockQuerySelector.mockReturnValue(null);

            expect(() => hideAddToDeckColumn()).not.toThrow();
        });

        it('should process all three table types', () => {
            // Mock guest user
            mockGetCurrentUser.mockReturnValue({
                id: '123',
                name: 'guest',
                role: 'GUEST'
            });

            const mockTables = {
                'characters-table': { ...mockTable },
                'basic-universe-table': { ...mockTable },
                'advanced-universe-table': { ...mockTable }
            };

            mockGetElementById.mockImplementation((id: string) => mockTables[id as keyof typeof mockTables] || null);

            hideAddToDeckColumn();

            // Verify that getElementById was called for all three table types
            expect(mockGetElementById).toHaveBeenCalledWith('characters-table');
            expect(mockGetElementById).toHaveBeenCalledWith('basic-universe-table');
            expect(mockGetElementById).toHaveBeenCalledWith('advanced-universe-table');
        });
    });

    describe('Integration Tests', () => {
        it('should work correctly with different guest user variations', () => {
            const guestVariations = [
                { name: 'guest', role: 'USER' },
                { username: 'guest', role: 'USER' },
                { name: 'guest', role: 'GUEST' },
                { username: 'guest', role: 'GUEST' }
            ];

            guestVariations.forEach((user, index) => {
                mockGetCurrentUser.mockReturnValue({ id: '123', ...user });
                
                // Reset styles
                mockHeaderRow.children[1].style.display = '';
                mockFilterRow.children[1].style.display = '';

                hideAddToDeckColumn();

                expect(mockHeaderRow.children[1].style.display).toBe('none');
                expect(mockFilterRow.children[1].style.display).toBe('none');
            });
        });

        it('should not affect non-guest users regardless of table state', () => {
            const nonGuestUsers = [
                { name: 'john', role: 'USER' },
                { name: 'admin', role: 'ADMIN' },
                { name: 'test', role: 'USER' }
            ];

            nonGuestUsers.forEach((user) => {
                mockGetCurrentUser.mockReturnValue({ id: '123', ...user });
                
                // Reset styles
                mockHeaderRow.children[1].style.display = '';
                mockFilterRow.children[1].style.display = '';

                hideAddToDeckColumn();

                expect(mockHeaderRow.children[1].style.display).toBe('');
                expect(mockFilterRow.children[1].style.display).toBe('');
            });
        });
    });
});

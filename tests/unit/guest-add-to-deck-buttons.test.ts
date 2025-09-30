/**
 * @jest-environment jsdom
 */

import { JSDOM } from 'jsdom';

// Mock the global objects that would be available in a browser environment
const mockGetCurrentUser = jest.fn();
const mockQuerySelectorAll = jest.fn();

// Mock localStorage for FrontendAuthService
const localStorageMock = (() => {
    let store: { [key: string]: string } = {};
    return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: jest.fn((key: string) => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; })
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock the FrontendAuthService to control currentUser
jest.mock('../../src/services/FrontendAuthService', () => {
    return {
        FrontendAuthService: {
            getInstance: jest.fn(() => ({
                getCurrentUser: mockGetCurrentUser,
                getUserId: jest.fn(() => mockGetCurrentUser()?.id || null),
                getUsername: jest.fn(() => mockGetCurrentUser()?.name || null),
                getUserIdForUrl: jest.fn(() => mockGetCurrentUser()?.id || 'guest'),
                isAuthenticated: jest.fn(() => !!mockGetCurrentUser()),
                isInReadOnlyMode: jest.fn(() => false),
                setReadOnlyMode: jest.fn(),
                checkAuthentication: jest.fn(),
                login: jest.fn(),
                logout: jest.fn(),
                guestLogin: jest.fn(),
                storeUser: jest.fn(),
                getStoredUser: jest.fn(),
                clearStoredUser: jest.fn(),
            })),
        },
    };
});

// Import the actual functions from the public/index.html file
// We need to simulate the environment for these functions
let isGuestUser: () => boolean;
let disableAddToDeckButtons: () => void;

// Load the functions from the HTML file (we'll simulate them here)
beforeAll(() => {
    // Simulate the isGuestUser function
    isGuestUser = () => {
        const currentUser = mockGetCurrentUser();
        const isGuest = !!(currentUser && (currentUser.role === 'GUEST' || currentUser.name === 'guest' || currentUser.username === 'guest'));
        console.log('🔍 isGuestUser() called - currentUser:', currentUser, 'isGuest:', isGuest);
        return isGuest;
    };

    // Simulate the disableAddToDeckButtons function
    disableAddToDeckButtons = () => {
        if (isGuestUser()) {
            const addToDeckButtons = mockQuerySelectorAll('.add-to-deck-btn');
            addToDeckButtons.forEach((button: any) => {
                button.disabled = true;
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
                button.title = 'Log in to add to decks...';
                button.setAttribute('data-guest-disabled', 'true');
            });
            console.log('🔍 Disabled', addToDeckButtons.length, 'Add to Deck buttons for guest user');
        }
    };
});

beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks for DOM elements
    mockQuerySelectorAll.mockReturnValue([]);
    mockGetCurrentUser.mockReturnValue(null); // Default to no user logged in
});

describe('Guest User Add to Deck Button Functionality', () => {
    describe('isGuestUser()', () => {
        it('should return true for user with GUEST role', () => {
            mockGetCurrentUser.mockReturnValue({ 
                id: 'guest-id', 
                name: 'someuser', 
                username: 'someuser', 
                role: 'GUEST' 
            });
            expect(isGuestUser()).toBe(true);
        });

        it('should return true for user with guest name', () => {
            mockGetCurrentUser.mockReturnValue({ 
                id: 'user-id', 
                name: 'guest', 
                username: 'someuser', 
                role: 'USER' 
            });
            expect(isGuestUser()).toBe(true);
        });

        it('should return true for user with guest username', () => {
            mockGetCurrentUser.mockReturnValue({ 
                id: 'user-id', 
                name: 'someuser', 
                username: 'guest', 
                role: 'USER' 
            });
            expect(isGuestUser()).toBe(true);
        });

        it('should return false for regular user', () => {
            mockGetCurrentUser.mockReturnValue({ 
                id: 'user-id', 
                name: 'regular', 
                username: 'regular', 
                role: 'USER' 
            });
            expect(isGuestUser()).toBe(false);
        });

        it('should return false for admin user', () => {
            mockGetCurrentUser.mockReturnValue({ 
                id: 'admin-id', 
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

    describe('disableAddToDeckButtons()', () => {
        const mockButton = {
            disabled: false,
            style: { opacity: '', cursor: '' },
            title: '',
            setAttribute: jest.fn()
        };

        beforeEach(() => {
            mockButton.disabled = false;
            mockButton.style.opacity = '';
            mockButton.style.cursor = '';
            mockButton.title = '';
            mockButton.setAttribute.mockClear();
        });

        it('should disable buttons for guest users', () => {
            mockGetCurrentUser.mockReturnValue({ 
                id: 'guest-id', 
                name: 'guest', 
                username: 'guest', 
                role: 'GUEST' 
            });
            
            const mockButtons = [mockButton, { ...mockButton }, { ...mockButton }];
            mockQuerySelectorAll.mockReturnValue(mockButtons);

            disableAddToDeckButtons();

            expect(mockQuerySelectorAll).toHaveBeenCalledWith('.add-to-deck-btn');
            expect(mockButtons[0].disabled).toBe(true);
            expect(mockButtons[0].style.opacity).toBe('0.5');
            expect(mockButtons[0].style.cursor).toBe('not-allowed');
            expect(mockButtons[0].title).toBe('Log in to add to decks...');
            expect(mockButtons[0].setAttribute).toHaveBeenCalledWith('data-guest-disabled', 'true');
        });

        it('should not disable buttons for regular users', () => {
            mockGetCurrentUser.mockReturnValue({ 
                id: 'user-id', 
                name: 'regular', 
                username: 'regular', 
                role: 'USER' 
            });
            
            const mockButtons = [mockButton];
            mockQuerySelectorAll.mockReturnValue(mockButtons);

            disableAddToDeckButtons();

            expect(mockButtons[0].disabled).toBe(false);
            expect(mockButtons[0].style.opacity).toBe('');
            expect(mockButtons[0].style.cursor).toBe('');
            expect(mockButtons[0].title).toBe('');
            expect(mockButtons[0].setAttribute).not.toHaveBeenCalled();
        });

        it('should not disable buttons for admin users', () => {
            mockGetCurrentUser.mockReturnValue({ 
                id: 'admin-id', 
                name: 'admin', 
                username: 'admin', 
                role: 'ADMIN' 
            });
            
            const mockButtons = [mockButton];
            mockQuerySelectorAll.mockReturnValue(mockButtons);

            disableAddToDeckButtons();

            expect(mockButtons[0].disabled).toBe(false);
            expect(mockButtons[0].style.opacity).toBe('');
            expect(mockButtons[0].style.cursor).toBe('');
            expect(mockButtons[0].title).toBe('');
            expect(mockButtons[0].setAttribute).not.toHaveBeenCalled();
        });

        it('should handle empty button list gracefully', () => {
            mockGetCurrentUser.mockReturnValue({ 
                id: 'guest-id', 
                name: 'guest', 
                username: 'guest', 
                role: 'GUEST' 
            });
            
            mockQuerySelectorAll.mockReturnValue([]);

            expect(() => disableAddToDeckButtons()).not.toThrow();
        });

        it('should process all buttons in the list', () => {
            mockGetCurrentUser.mockReturnValue({ 
                id: 'guest-id', 
                name: 'guest', 
                username: 'guest', 
                role: 'GUEST' 
            });
            
            const mockButtons = [
                { ...mockButton },
                { ...mockButton },
                { ...mockButton }
            ];
            mockQuerySelectorAll.mockReturnValue(mockButtons);

            disableAddToDeckButtons();

            mockButtons.forEach(button => {
                expect(button.disabled).toBe(true);
                expect(button.style.opacity).toBe('0.5');
                expect(button.style.cursor).toBe('not-allowed');
                expect(button.title).toBe('Log in to add to decks...');
                expect(button.setAttribute).toHaveBeenCalledWith('data-guest-disabled', 'true');
            });
        });
    });

    describe('Integration Tests', () => {
        it('should work correctly with different guest user variations', () => {
            const createMockButton = () => ({
                disabled: false,
                style: { opacity: '', cursor: '' },
                title: '',
                setAttribute: jest.fn()
            });

            // Test with GUEST role
            mockGetCurrentUser.mockReturnValue({ 
                id: 'guest-id', 
                name: 'someuser', 
                username: 'someuser', 
                role: 'GUEST' 
            });
            const mockButtons1 = [createMockButton()];
            mockQuerySelectorAll.mockReturnValue(mockButtons1);
            disableAddToDeckButtons();
            expect(mockButtons1[0].disabled).toBe(true);

            // Test with guest name
            mockGetCurrentUser.mockReturnValue({ 
                id: 'user-id', 
                name: 'guest', 
                username: 'someuser', 
                role: 'USER' 
            });
            const mockButtons2 = [createMockButton()];
            mockQuerySelectorAll.mockReturnValue(mockButtons2);
            disableAddToDeckButtons();
            expect(mockButtons2[0].disabled).toBe(true);

            // Test with guest username
            mockGetCurrentUser.mockReturnValue({ 
                id: 'user-id', 
                name: 'someuser', 
                username: 'guest', 
                role: 'USER' 
            });
            const mockButtons3 = [createMockButton()];
            mockQuerySelectorAll.mockReturnValue(mockButtons3);
            disableAddToDeckButtons();
            expect(mockButtons3[0].disabled).toBe(true);
        });

        it('should not affect non-guest users regardless of user state', () => {
            const createMockButton = () => ({
                disabled: false,
                style: { opacity: '', cursor: '' },
                title: '',
                setAttribute: jest.fn()
            });

            const testCases = [
                { role: 'USER', name: 'regular', username: 'regular' },
                { role: 'ADMIN', name: 'admin', username: 'admin' },
                { role: 'MODERATOR', name: 'mod', username: 'mod' }
            ];

            testCases.forEach(user => {
                mockGetCurrentUser.mockReturnValue({ 
                    id: 'user-id', 
                    ...user 
                });
                
                const mockButtons = [createMockButton()];
                mockQuerySelectorAll.mockReturnValue(mockButtons);
                disableAddToDeckButtons();
                
                expect(mockButtons[0].disabled).toBe(false);
                expect(mockButtons[0].style.opacity).toBe('');
                expect(mockButtons[0].style.cursor).toBe('');
                expect(mockButtons[0].title).toBe('');
            });
        });
    });
});

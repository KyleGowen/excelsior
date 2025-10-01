/** @jest-environment jsdom */

/**
 * Comprehensive unit tests for FrontendAuthService
 * Tests the actual service code without excessive mocking
 */

import { FrontendAuthService, LoginCredentials, LoginResponse } from '../../src/services/FrontendAuthService';
import { User, UserRole } from '../../src/types';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};

// Mock document.getElementById
const mockLoginModal = {
  style: { display: 'none' }
};

const mockDocument = {
  getElementById: jest.fn(() => mockLoginModal as HTMLElement | null)
};

// Mock window.location
const mockLocation = {
  pathname: '/users/testuser/decks/testdeck'
};

// Setup global mocks
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

(global as any).document = mockDocument;

(global as any).window = {
  ...window,
  location: mockLocation
};

describe('FrontendAuthService', () => {
  let authService: FrontendAuthService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset singleton instance
    (FrontendAuthService as any).instance = undefined;
    
    // Create new instance
    authService = FrontendAuthService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = FrontendAuthService.getInstance();
      const instance2 = FrontendAuthService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create new instance when previous is undefined', () => {
      (FrontendAuthService as any).instance = undefined;
      const instance = FrontendAuthService.getInstance();
      expect(instance).toBeInstanceOf(FrontendAuthService);
    });
  });

  describe('Initialization', () => {
    it('should initialize with no user by default', () => {
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should initialize from localStorage if user exists', () => {
      const mockUser: User = {
        id: 'test-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));
      
      // Create new instance to test initialization
      (FrontendAuthService as any).instance = undefined;
      const newAuthService = FrontendAuthService.getInstance();
      
      expect(newAuthService.getCurrentUser()).toEqual(mockUser);
      expect(newAuthService.isAuthenticated()).toBe(true);
    });

    it('should handle localStorage errors during initialization', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      // Should not throw error
      expect(() => {
        (FrontendAuthService as any).instance = undefined;
        FrontendAuthService.getInstance();
      }).not.toThrow();
    });
  });

  describe('User State Management', () => {
    it('should return current user', () => {
      const mockUser: User = {
        id: 'test-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      };
      
      (authService as any).currentUser = mockUser;
      expect(authService.getCurrentUser()).toEqual(mockUser);
    });

    it('should return null when no user', () => {
      (authService as any).currentUser = null;
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should check authentication status correctly', () => {
      expect(authService.isAuthenticated()).toBe(false);
      
      (authService as any).currentUser = { id: 'test', name: 'test', email: '', role: 'USER' };
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should get user ID', () => {
      expect(authService.getUserId()).toBeNull();
      
      const mockUser: User = {
        id: 'test-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      };
      (authService as any).currentUser = mockUser;
      expect(authService.getUserId()).toBe('test-id');
    });

    it('should get username', () => {
      expect(authService.getUsername()).toBeNull();
      
      const mockUser: User = {
        id: 'test-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      };
      (authService as any).currentUser = mockUser;
      expect(authService.getUsername()).toBe('testuser');
    });

    it('should get user ID for URL with current user', () => {
      const mockUser: User = {
        id: 'test-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      };
      (authService as any).currentUser = mockUser;
      expect(authService.getUserIdForUrl()).toBe('test-id');
    });

    it('should get user ID for URL with legacy userId property', () => {
      const mockUser = {
        id: 'test-id',
        userId: 'legacy-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      };
      (authService as any).currentUser = mockUser;
      expect(authService.getUserIdForUrl()).toBe('legacy-id');
    });

    it('should return guest for URL when no user', () => {
      (authService as any).currentUser = null;
      expect(authService.getUserIdForUrl()).toBe('guest');
    });
  });

  describe('Read-Only Mode', () => {
    it('should return read-only mode status', () => {
      expect(authService.isInReadOnlyMode()).toBe(false);
    });

    it('should set read-only mode', () => {
      authService.setReadOnlyMode(true);
      expect(authService.isInReadOnlyMode()).toBe(true);
      
      authService.setReadOnlyMode(false);
      expect(authService.isInReadOnlyMode()).toBe(false);
    });
  });

  describe('Authentication Check', () => {
    beforeEach(() => {
      mockLocation.pathname = '/users/testuser/decks/testdeck';
    });

    it('should extract deck ID and user ID from URL', async () => {
      // Reset the mock location to ensure it's set correctly
      (global as any).window = {
        ...window,
        location: { pathname: '/users/testuser/decks/testdeck' }
      };
      
      const result = await authService.checkAuthentication();
      
      expect(result.deckId).toBe('testdeck');
      expect(result.urlUserId).toBe('testuser');
    });

    it('should handle non-deck URLs', async () => {
      mockLocation.pathname = '/some/other/path';
      
      const result = await authService.checkAuthentication();
      
      expect(result.deckId).toBeNull();
      expect(result.urlUserId).toBeNull();
    });

    it('should handle deck URLs with pathname parameter', async () => {
      const result = await authService.checkAuthentication('/users/paramuser/decks/paramdeck');
      
      expect(result.deckId).toBe('paramdeck');
      expect(result.urlUserId).toBe('paramuser');
    });

    it('should verify session when user exists in localStorage', async () => {
      const mockUser: User = {
        id: 'test-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { userId: 'test-id', username: 'testuser' }
        })
      });

      const result = await authService.checkAuthentication();

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', {
        credentials: 'include'
      });
      expect(result.isAuthenticated).toBe(true);
      expect(result.currentUser).toEqual({
        id: 'test-id',
        name: 'testuser',
        email: '',
        role: 'USER'
      });
    });

    it('should clear user when session verification fails', async () => {
      const mockUser: User = {
        id: 'test-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const result = await authService.checkAuthentication();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentUser');
      expect(result.isAuthenticated).toBe(false);
      expect(result.currentUser).toBeNull();
    });

    it('should handle session verification errors', async () => {
      const mockUser: User = {
        id: 'test-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await authService.checkAuthentication();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentUser');
      expect(result.isAuthenticated).toBe(false);
      expect(result.currentUser).toBeNull();
    });

    it('should attempt auto guest login for deck URLs without authentication', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false }) // Session verification fails
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { userId: 'guest-id', username: 'guest' }
          })
        });

      const result = await authService.checkAuthentication('/users/testuser/decks/testdeck');

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'guest', password: 'guest' })
      });
      expect(result.isAuthenticated).toBe(true);
      expect(result.currentUser).toEqual({
        id: 'guest-id',
        name: 'guest',
        email: '',
        role: 'GUEST'
      });
    });

    it('should set read-only mode when viewing another user\'s deck', async () => {
      const mockUser: User = {
        id: 'current-user-id',
        name: 'currentuser',
        email: 'current@example.com',
        role: 'USER'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { userId: 'current-user-id', username: 'currentuser' }
        })
      });

      const result = await authService.checkAuthentication('/users/different-user/decks/testdeck');

      expect(result.isReadOnlyMode).toBe(true);
      expect(authService.isInReadOnlyMode()).toBe(true);
    });

    it('should set read-only mode when not authenticated on deck URL', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false }); // No stored user

      const result = await authService.checkAuthentication('/users/testuser/decks/testdeck');

      expect(result.isReadOnlyMode).toBe(true);
      expect(authService.isInReadOnlyMode()).toBe(true);
    });

    it('should allow edit mode when viewing own deck', async () => {
      const mockUser: User = {
        id: 'testuser',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { userId: 'testuser', username: 'testuser' }
        })
      });

      const result = await authService.checkAuthentication('/users/testuser/decks/testdeck');

      expect(result.isReadOnlyMode).toBe(false);
      expect(authService.isInReadOnlyMode()).toBe(false);
    });
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password123'
      };

      const mockResponse: LoginResponse = {
        success: true,
        data: { userId: 'test-id', username: 'testuser' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await authService.login(credentials);

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      expect(result).toEqual(mockResponse);
      expect(authService.getCurrentUser()).toEqual({
        id: 'test-id',
        name: 'testuser',
        email: '',
        role: 'USER'
      });
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('currentUser', JSON.stringify({
        id: 'test-id',
        name: 'testuser',
        email: '',
        role: 'USER'
      }));
    });

    it('should handle login failure', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const mockResponse: LoginResponse = {
        success: false,
        error: 'Invalid credentials'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await authService.login(credentials);

      expect(result).toEqual(mockResponse);
      // When login fails, currentUser should remain null (it was null before the test)
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should handle network errors during login', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password123'
      };

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await authService.login(credentials);

      expect(result).toEqual({
        success: false,
        error: 'Login failed'
      });
      // When login fails due to network error, currentUser should remain null
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should perform guest login', async () => {
      const mockResponse: LoginResponse = {
        success: true,
        data: { userId: 'guest-id', username: 'guest' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await authService.guestLogin();

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'guest', password: 'guest' })
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      // Set up a logged-in user
      (authService as any).currentUser = {
        id: 'test-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await authService.logout();

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      expect(authService.getCurrentUser()).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentUser');
    });

    it('should handle logout errors gracefully', async () => {
      (authService as any).currentUser = {
        id: 'test-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      };

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await authService.logout();

      // Should still clear user even if logout request fails
      expect(authService.getCurrentUser()).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentUser');
    });
  });

  describe('Storage Methods', () => {
    it('should get stored user from localStorage', () => {
      const mockUser: User = {
        id: 'test-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      const result = (authService as any).getStoredUser();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('currentUser');
      expect(result).toEqual(mockUser);
    });

    it('should return null when no stored user', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = (authService as any).getStoredUser();

      expect(result).toBeNull();
    });

    it('should handle localStorage errors in getStoredUser', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = (authService as any).getStoredUser();

      expect(result).toBeNull();
    });

    it('should store user in localStorage', () => {
      const mockUser: User = {
        id: 'test-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      };

      (authService as any).storeUser(mockUser);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('currentUser', JSON.stringify(mockUser));
    });

    it('should handle localStorage errors in storeUser', () => {
      const mockUser: User = {
        id: 'test-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      };

      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not throw error
      expect(() => {
        (authService as any).storeUser(mockUser);
      }).not.toThrow();
    });

    it('should clear stored user from localStorage', () => {
      (authService as any).clearStoredUser();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentUser');
    });

    it('should handle localStorage errors in clearStoredUser', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not throw error
      expect(() => {
        (authService as any).clearStoredUser();
      }).not.toThrow();
    });
  });

  describe('Modal Management', () => {
    it('should hide login modal', () => {
      // Ensure document is properly mocked
      (global as any).document = mockDocument;
      
      (authService as any).hideLoginModal();

      expect(mockDocument.getElementById).toHaveBeenCalledWith('loginModal');
      expect(mockLoginModal.style.display).toBe('none');
    });

    it('should show login modal', () => {
      // Ensure document is properly mocked
      (global as any).document = mockDocument;
      
      (authService as any).showLoginModal();

      expect(mockDocument.getElementById).toHaveBeenCalledWith('loginModal');
      expect(mockLoginModal.style.display).toBe('flex');
    });

    it('should handle missing login modal element in hideLoginModal', () => {
      mockDocument.getElementById.mockReturnValueOnce(null);

      // Should not throw error
      expect(() => {
        (authService as any).hideLoginModal();
      }).not.toThrow();
    });

    it('should handle missing login modal element in showLoginModal', () => {
      mockDocument.getElementById.mockReturnValueOnce(null);

      // Should not throw error
      expect(() => {
        (authService as any).showLoginModal();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined window object', () => {
      // Mock undefined window
      const originalWindow = global.window;
      (global as any).window = undefined;

      // Should not throw error
      expect(() => {
        (authService as any).getStoredUser();
        (authService as any).storeUser({ id: 'test', name: 'test', email: '', role: 'USER' });
        (authService as any).clearStoredUser();
      }).not.toThrow();

      // Restore window
      (global as any).window = originalWindow;
    });

    it('should handle undefined document object', () => {
      // Mock undefined document
      const originalDocument = global.document;
      (global as any).document = undefined;

      // Should not throw error
      expect(() => {
        (authService as any).hideLoginModal();
        (authService as any).showLoginModal();
      }).not.toThrow();

      // Restore document
      (global as any).document = originalDocument;
    });

    it('should handle malformed JSON in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const result = (authService as any).getStoredUser();

      expect(result).toBeNull();
    });
  });
});

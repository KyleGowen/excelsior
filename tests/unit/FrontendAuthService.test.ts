/**
 * @jest-environment jsdom
 */
import { FrontendAuthService, LoginCredentials, LoginResponse } from '../../src/services/FrontendAuthService';
import { User, UserRole } from '../../src/types';

// Mock the database setup to avoid TextEncoder issues
jest.mock('../../src/persistence/userPersistence', () => ({}));
jest.mock('../../src/database/PostgreSQLUserRepository', () => ({}));
jest.mock('../../src/config/DataSourceConfig', () => ({}));
jest.mock('../../src/repository/UserRepository', () => ({}));
jest.mock('../../src/repository/DeckRepository', () => ({}));
jest.mock('../../src/repository/CardRepository', () => ({}));

// Note: window.location mocking is not needed since we're using pathname parameter injection

// Mock global objects
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};

const mockElement = {
  style: { display: 'none' } as any
};


// Mock fetch
global.fetch = jest.fn();

// Setup mocks
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});


// Mock document.getElementById since document is already available in jsdom
document.getElementById = jest.fn(() => mockElement as HTMLElement);

describe('FrontendAuthService', () => {
  let authService: FrontendAuthService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset singleton instance
    (FrontendAuthService as any).instance = undefined;
    
    // Setup mock element
    mockElement.style.display = 'none';
    (document.getElementById as jest.Mock).mockReturnValue(mockElement as HTMLElement);
    
    // Reset localStorage
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Reset window location (no longer needed with pathname parameter)
    
    // Create new service instance
    authService = FrontendAuthService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = FrontendAuthService.getInstance();
      const instance2 = FrontendAuthService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user is set', () => {
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should return the current user when set', () => {
      const user: User = {
        id: 'user-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER' as UserRole
      };
      
      (authService as any).currentUser = user;
      expect(authService.getCurrentUser()).toEqual(user);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no user is set', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return true when user is set', () => {
      const user: User = {
        id: 'user-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER' as UserRole
      };
      
      (authService as any).currentUser = user;
      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('isInReadOnlyMode', () => {
    it('should return false by default', () => {
      expect(authService.isInReadOnlyMode()).toBe(false);
    });

    it('should return true when set to read-only', () => {
      authService.setReadOnlyMode(true);
      expect(authService.isInReadOnlyMode()).toBe(true);
    });
  });

  describe('setReadOnlyMode', () => {
    it('should set read-only mode to true', () => {
      authService.setReadOnlyMode(true);
      expect(authService.isInReadOnlyMode()).toBe(true);
    });

    it('should set read-only mode to false', () => {
      authService.setReadOnlyMode(true);
      authService.setReadOnlyMode(false);
      expect(authService.isInReadOnlyMode()).toBe(false);
    });
  });

  describe('checkAuthentication', () => {
    beforeEach(() => {
      // Mock successful fetch response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { userId: 'user-id', username: 'testuser' }
        })
      });
    });

    it('should return unauthenticated result for non-deck URL', async () => {
      const result = await authService.checkAuthentication('/');
      
      expect(result).toEqual({
        isAuthenticated: false,
        currentUser: null,
        deckId: null,
        urlUserId: null,
        isReadOnlyMode: false
      });
    });

    it('should extract deck ID and user ID from URL', async () => {
      const result = await authService.checkAuthentication('/users/123/decks/456');
      
      expect(result.deckId).toBe('456');
      expect(result.urlUserId).toBe('123');
    });

    it('should authenticate user from localStorage and verify session', async () => {
      const storedUser: User = {
        id: 'user-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER' as UserRole
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedUser));
      
      const result = await authService.checkAuthentication('/users/user-id/decks/456');
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('currentUser');
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/me', {
        credentials: 'include'
      });
      expect(result.isAuthenticated).toBe(true);
      expect(result.currentUser).toEqual({
        id: 'user-id',
        name: 'testuser',
        email: '',
        role: 'USER'
      });
    });

    it('should clear stored user when session verification fails', async () => {
      const storedUser: User = {
        id: 'user-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER' as UserRole
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedUser));
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401
      });
      
      const result = await authService.checkAuthentication();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentUser');
      expect(result.isAuthenticated).toBe(false);
      expect(result.currentUser).toBeNull();
    });

    it('should attempt auto guest login for deck URL without authentication', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { userId: 'guest-id', username: 'guest' }
          })
        });
      
      const result = await authService.checkAuthentication('/users/123/decks/456');
      
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
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
      const storedUser: User = {
        id: 'user-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER' as UserRole
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedUser));
      
      const result = await authService.checkAuthentication('/users/different-user/decks/456');
      
      expect(result.isReadOnlyMode).toBe(true);
      expect(authService.isInReadOnlyMode()).toBe(true);
    });

    it('should set read-only mode when not authenticated on deck URL', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401
      });
      
      const result = await authService.checkAuthentication('/users/123/decks/456');
      
      expect(result.isReadOnlyMode).toBe(true);
      expect(authService.isInReadOnlyMode()).toBe(true);
    });

    it('should allow edit mode when viewing own deck', async () => {
      const storedUser: User = {
        id: 'user-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER' as UserRole
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedUser));
      
      const result = await authService.checkAuthentication('/users/user-id/decks/456');
      
      expect(result.isReadOnlyMode).toBe(false);
      expect(authService.isInReadOnlyMode()).toBe(false);
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password'
      };
      
      const loginResponse: LoginResponse = {
        success: true,
        data: { userId: 'user-id', username: 'testuser' }
      };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(loginResponse)
      });
      
      const result = await authService.login(credentials);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      expect(result).toEqual(loginResponse);
      expect(authService.getCurrentUser()).toEqual({
        id: 'user-id',
        name: 'testuser',
        email: '',
        role: 'USER'
      });
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('currentUser', JSON.stringify({
        id: 'user-id',
        name: 'testuser',
        email: '',
        role: 'USER'
      }));
      expect((document.getElementById as jest.Mock)).toHaveBeenCalledWith('loginModal');
    });

    it('should handle login failure', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'wrongpassword'
      };
      
      const loginResponse: LoginResponse = {
        success: false,
        error: 'Invalid credentials'
      };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(loginResponse)
      });
      
      const result = await authService.login(credentials);
      
      expect(result).toEqual(loginResponse);
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should handle network errors', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password'
      };
      
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const result = await authService.login(credentials);
      
      expect(result).toEqual({
        success: false,
        error: 'Login failed'
      });
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      
      await authService.logout();
      
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      expect(authService.getCurrentUser()).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentUser');
      expect((document.getElementById as jest.Mock)).toHaveBeenCalledWith('loginModal');
    });

    it('should handle logout errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      await authService.logout();
      
      expect(authService.getCurrentUser()).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentUser');
    });
  });

  describe('guestLogin', () => {
    it('should call login with guest credentials', async () => {
      const loginSpy = jest.spyOn(authService, 'login');
      const guestResponse: LoginResponse = {
        success: true,
        data: { userId: 'guest-id', username: 'guest' }
      };
      
      loginSpy.mockResolvedValue(guestResponse);
      
      const result = await authService.guestLogin();
      
      expect(loginSpy).toHaveBeenCalledWith({
        username: 'guest',
        password: 'guest'
      });
      expect(result).toEqual(guestResponse);
    });
  });

  describe('getUserId', () => {
    it('should return null when no user is set', () => {
      expect(authService.getUserId()).toBeNull();
    });

    it('should return user ID when user is set', () => {
      const user: User = {
        id: 'user-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER' as UserRole
      };
      
      (authService as any).currentUser = user;
      expect(authService.getUserId()).toBe('user-id');
    });
  });

  describe('getUsername', () => {
    it('should return null when no user is set', () => {
      expect(authService.getUsername()).toBeNull();
    });

    it('should return username when user is set', () => {
      const user: User = {
        id: 'user-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER' as UserRole
      };
      
      (authService as any).currentUser = user;
      expect(authService.getUsername()).toBe('testuser');
    });
  });

  describe('getUserIdForUrl', () => {
    it('should return "guest" when no user is set', () => {
      expect(authService.getUserIdForUrl()).toBe('guest');
    });

    it('should return user ID when user is set', () => {
      const user: User = {
        id: 'user-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER' as UserRole
      };
      
      (authService as any).currentUser = user;
      expect(authService.getUserIdForUrl()).toBe('user-id');
    });

    it('should handle legacy userId property', () => {
      const user = {
        id: 'user-id',
        userId: 'legacy-user-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER' as UserRole
      };
      
      (authService as any).currentUser = user;
      expect(authService.getUserIdForUrl()).toBe('legacy-user-id');
    });
  });

  describe('Storage Methods', () => {
    it('should handle localStorage errors gracefully in getStoredUser', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      const result = (authService as any).getStoredUser();
      
      expect(result).toBeNull();
    });

    it('should handle localStorage errors gracefully in storeUser', () => {
      const user: User = {
        id: 'user-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER' as UserRole
      };
      
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      // Should not throw
      (authService as any).storeUser(user);
    });

    it('should handle localStorage errors gracefully in clearStoredUser', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      // Should not throw
      (authService as any).clearStoredUser();
    });
  });

  describe('Modal Methods', () => {
    it('should handle missing login modal element in hideLoginModal', () => {
      (document.getElementById as jest.Mock).mockReturnValue(null);
      
      // Should not throw
      (authService as any).hideLoginModal();
    });

    it('should handle missing login modal element in showLoginModal', () => {
      (document.getElementById as jest.Mock).mockReturnValue(null);
      
      // Should not throw
      (authService as any).showLoginModal();
    });
  });
});

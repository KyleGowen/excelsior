/**
 * Unit tests for public/js/auth-service.js
 * Tests the authentication service class extracted during Phase 5 of refactoring
 */

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock window.location
const mockLocation = {
  pathname: '/',
  href: 'http://localhost:3000',
};

// Mock window
(global as any).window = {
  ...global.window,
  localStorage: mockLocalStorage,
  location: mockLocation,
};

// Define the FrontendAuthService class for testing
class FrontendAuthService {
  currentUser: any;
  isReadOnlyMode: boolean;

  constructor() {
    this.currentUser = null;
    this.isReadOnlyMode = false;
    this.initializeFromStorage();
  }

  initializeFromStorage() {
    try {
      const storedUser = this.getStoredUser();
      if (storedUser) {
        this.currentUser = storedUser;
        this.hideLoginModal();
      }
    } catch (error) {
      console.error('Error initializing from storage:', error);
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  isInReadOnlyMode() {
    return this.isReadOnlyMode;
  }

  setReadOnlyMode(readOnly: boolean) {
    this.isReadOnlyMode = readOnly;
  }

  async checkAuthentication() {
    const authResult: any = {
      isAuthenticated: false,
      currentUser: null,
      deckId: null,
      urlUserId: null,
      isReadOnlyMode: false
    };

    // Extract deck ID and user ID from URL
    const deckUrlMatch = window.location.pathname.match(/\/users\/([^\/]+)\/decks\/([^\/]+)/);
    if (deckUrlMatch) {
      authResult.urlUserId = deckUrlMatch[1];
      authResult.deckId = deckUrlMatch[2];
    }

    // Check if we have a user in localStorage
    const storedUser = this.getStoredUser();
    if (storedUser) {
      this.currentUser = storedUser;
      authResult.currentUser = this.currentUser;

      // Verify the session is still valid
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          this.currentUser = data.data;
          this.storeUser(this.currentUser);
          authResult.isAuthenticated = true;
          authResult.currentUser = this.currentUser;
        } else {
          // Session expired, clear stored user
          this.clearStoredUser();
          this.currentUser = null;
          authResult.currentUser = null;
        }
      } catch (error) {
        console.error('Error verifying session:', error);
        this.clearStoredUser();
        this.currentUser = null;
        authResult.currentUser = null;
      }
    }

    // If not authenticated and we have a deck ID, try guest login
    if (!authResult.isAuthenticated && authResult.deckId) {
      try {
        const response = await fetch('/api/auth/guest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            this.currentUser = data.data;
            this.storeUser(this.currentUser);
            authResult.isAuthenticated = true;
            authResult.currentUser = this.currentUser;
          }
        }
      } catch (error) {
        console.error('Error with guest login:', error);
      }
    }

    // Set read-only mode based on deck ownership
    if (authResult.deckId) {
      if (authResult.isAuthenticated && authResult.currentUser && authResult.urlUserId && authResult.urlUserId !== 'undefined' && authResult.currentUser.id !== authResult.urlUserId) {
        authResult.isReadOnlyMode = true;
        this.setReadOnlyMode(true);
      } else {
        authResult.isReadOnlyMode = false;
        this.setReadOnlyMode(false);
      }
    }

    return authResult;
  }

  async login(credentials: any) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success && data.data) {
        this.currentUser = data.data;
        this.storeUser(this.currentUser);
        this.hideLoginModal();
        return { success: true, user: this.currentUser };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.currentUser = null;
      this.clearStoredUser();
      this.setReadOnlyMode(false);
    }
  }

  async guestLogin() {
    return this.checkAuthentication();
  }

  getStoredUser() {
    try {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error parsing stored user:', error);
    }
    return null;
  }

  storeUser(user: any) {
    try {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user:', error);
    }
  }

  clearStoredUser() {
    try {
      localStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Error clearing stored user:', error);
    }
  }

  hideLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
      loginModal.style.display = 'none';
    }
  }

  showLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
      loginModal.style.display = 'block';
    }
  }

  getUserId() {
    return this.currentUser ? this.currentUser.id : null;
  }

  getUsername() {
    return this.currentUser ? this.currentUser.username : null;
  }

  getUserIdForUrl() {
    if (this.currentUser) {
      return this.currentUser.userId || this.currentUser.id;
    }
    return 'guest';
  }
}

describe('FrontendAuthService - Authentication Service', () => {
  let authService: FrontendAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocation.pathname = '/';
    authService = new FrontendAuthService();
  });

  describe('constructor and initialization', () => {
    it('should initialize with null currentUser', () => {
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should initialize with read-only mode false', () => {
      expect(authService.isInReadOnlyMode()).toBe(false);
    });

    it('should initialize from storage if user exists', () => {
      const mockUser = { id: '123', username: 'testuser' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));
      
      const newAuthService = new FrontendAuthService();
      expect(newAuthService.getCurrentUser()).toEqual(mockUser);
    });

    it('should handle storage errors during initialization', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      expect(() => new FrontendAuthService()).not.toThrow();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', () => {
      const mockUser = { id: '123', username: 'testuser' };
      authService.currentUser = mockUser;
      
      expect(authService.getCurrentUser()).toBe(mockUser);
    });

    it('should return null when no user', () => {
      expect(authService.getCurrentUser()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user exists', () => {
      authService.currentUser = { id: '123' };
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when no user', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('read-only mode', () => {
    it('should set read-only mode', () => {
      authService.setReadOnlyMode(true);
      expect(authService.isInReadOnlyMode()).toBe(true);
    });

    it('should unset read-only mode', () => {
      authService.setReadOnlyMode(false);
      expect(authService.isInReadOnlyMode()).toBe(false);
    });
  });

  describe('checkAuthentication', () => {
    it('should return unauthenticated result for non-deck URLs', async () => {
      mockLocation.pathname = '/';
      
      const result = await authService.checkAuthentication();
      
      expect(result.isAuthenticated).toBe(false);
      expect(result.currentUser).toBeNull();
      expect(result.deckId).toBeNull();
      expect(result.urlUserId).toBeNull();
    });

    it('should extract deck ID and user ID from deck URLs', async () => {
      mockLocation.pathname = '/users/user123/decks/deck456';
      
      const result = await authService.checkAuthentication();
      
      expect(result.deckId).toBe('deck456');
      expect(result.urlUserId).toBe('user123');
    });

    it('should authenticate with valid stored user', async () => {
      const mockUser = { id: '123', username: 'testuser' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUser })
      });
      
      const result = await authService.checkAuthentication();
      
      expect(result.isAuthenticated).toBe(true);
      expect(result.currentUser).toEqual(mockUser);
    });

    it('should clear user on session verification failure', async () => {
      const mockUser = { id: '123', username: 'testuser' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false
      });
      
      const result = await authService.checkAuthentication();
      
      expect(result.isAuthenticated).toBe(false);
      expect(result.currentUser).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentUser');
    });

    it('should attempt guest login for deck URLs when not authenticated', async () => {
      mockLocation.pathname = '/users/user123/decks/deck456';
      const mockGuestUser = { id: 'guest', username: 'guest' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockGuestUser })
      });
      
      const result = await authService.checkAuthentication();
      
      expect(result.isAuthenticated).toBe(true);
      expect(result.currentUser).toEqual(mockGuestUser);
    });

    it('should set read-only mode for other users decks', async () => {
      mockLocation.pathname = '/users/otheruser/decks/deck456';
      const mockUser = { id: '123', username: 'testuser' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUser })
      });
      
      const result = await authService.checkAuthentication();
      
      expect(result.isReadOnlyMode).toBe(true);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = { id: '123', username: 'testuser' };
      const credentials = { username: 'testuser', password: 'password' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUser })
      });
      
      const result = await authService.login(credentials);
      
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(authService.getCurrentUser()).toEqual(mockUser);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('currentUser', JSON.stringify(mockUser));
    });

    it('should handle login failure', async () => {
      const credentials = { username: 'testuser', password: 'wrongpassword' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: 'Invalid credentials' })
      });
      
      const result = await authService.login(credentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should handle network errors', async () => {
      const credentials = { username: 'testuser', password: 'password' };
      
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const result = await authService.login(credentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      authService.currentUser = { id: '123', username: 'testuser' };
      authService.setReadOnlyMode(true);
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      });
      
      await authService.logout();
      
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.isInReadOnlyMode()).toBe(false);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentUser');
    });

    it('should clear user even if logout request fails', async () => {
      authService.currentUser = { id: '123', username: 'testuser' };
      
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      await authService.logout();
      
      expect(authService.getCurrentUser()).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentUser');
    });
  });

  describe('storage methods', () => {
    it('should get stored user from localStorage', () => {
      const mockUser = { id: '123', username: 'testuser' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));
      
      const result = authService.getStoredUser();
      
      expect(result).toEqual(mockUser);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('currentUser');
    });

    it('should return null when no stored user', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = authService.getStoredUser();
      
      expect(result).toBeNull();
    });

    it('should handle invalid JSON in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      const result = authService.getStoredUser();
      
      expect(result).toBeNull();
    });

    it('should store user in localStorage', () => {
      const mockUser = { id: '123', username: 'testuser' };
      
      authService.storeUser(mockUser);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('currentUser', JSON.stringify(mockUser));
    });

    it('should clear stored user from localStorage', () => {
      authService.clearStoredUser();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('currentUser');
    });
  });

  describe('modal management', () => {
    it('should hide login modal', () => {
      const mockModal = { style: { display: 'block' } };
      (global.document.getElementById as jest.Mock).mockReturnValue(mockModal);
      
      authService.hideLoginModal();
      
      expect(mockModal.style.display).toBe('none');
    });

    it('should show login modal', () => {
      const mockModal = { style: { display: 'none' } };
      (global.document.getElementById as jest.Mock).mockReturnValue(mockModal);
      
      authService.showLoginModal();
      
      expect(mockModal.style.display).toBe('block');
    });

    it('should handle missing login modal element', () => {
      (global.document.getElementById as jest.Mock).mockReturnValue(null);
      
      expect(() => authService.hideLoginModal()).not.toThrow();
      expect(() => authService.showLoginModal()).not.toThrow();
    });
  });

  describe('user info methods', () => {
    it('should get user ID', () => {
      const mockUser = { id: '123', username: 'testuser' };
      authService.currentUser = mockUser;
      
      expect(authService.getUserId()).toBe('123');
    });

    it('should return null for user ID when no user', () => {
      expect(authService.getUserId()).toBeNull();
    });

    it('should get username', () => {
      const mockUser = { id: '123', username: 'testuser' };
      authService.currentUser = mockUser;
      
      expect(authService.getUsername()).toBe('testuser');
    });

    it('should return null for username when no user', () => {
      expect(authService.getUsername()).toBeNull();
    });

    it('should get user ID for URL with userId property', () => {
      const mockUser = { id: '123', userId: 'url123', username: 'testuser' };
      authService.currentUser = mockUser;
      
      expect(authService.getUserIdForUrl()).toBe('url123');
    });

    it('should get user ID for URL with id property', () => {
      const mockUser = { id: '123', username: 'testuser' };
      authService.currentUser = mockUser;
      
      expect(authService.getUserIdForUrl()).toBe('123');
    });

    it('should return guest for URL when no user', () => {
      expect(authService.getUserIdForUrl()).toBe('guest');
    });
  });
});

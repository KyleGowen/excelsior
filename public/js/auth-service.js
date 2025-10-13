/* ========================================
 * PHASE 5: AUTHENTICATION FUNCTIONS
 * ========================================
 * 
 * This file contains user authentication and session management functions
 * extracted from index.html during Phase 5 of the refactoring project.
 * 
 * Purpose: User authentication and session management
 * Created: Phase 5 of 12-phase refactoring project
 * Contains:
 *   - login() - User login functionality
 *   - logout() - User logout functionality
 *   - checkAuthentication() - Session verification
 *   - showLoginModal() - Login modal management
 *   - showLoginError() / hideLoginError() - Error handling
 * 
 * ======================================== */


class FrontendAuthService {
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

  setReadOnlyMode(readOnly) {
    this.isReadOnlyMode = readOnly;
  }

  async checkAuthentication() {
    const authResult = {
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
      console.log('Detected deck editor route for deck:', authResult.deckId, 'user:', authResult.urlUserId);
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

    // If no user is authenticated and we are on a deck URL, attempt auto guest login
    if (!authResult.isAuthenticated && authResult.deckId) {
      console.log('✅ Detected deck URL - attempting auto guest login for deck:', authResult.deckId, 'user:', authResult.urlUserId);
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username: 'guest', password: 'guest' })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            this.currentUser = {
              id: data.data.userId,
              name: data.data.username,
              email: '',
              role: 'GUEST'
            };
            this.storeUser(this.currentUser);
            authResult.isAuthenticated = true;
            authResult.currentUser = this.currentUser;
            console.log('Auto guest login successful');
          }
        } else {
          console.error('Auto guest login failed:', await response.json());
        }
      } catch (error) {
        console.error('Error during auto guest login:', error);
      }
    }

    // Read-only mode removed - now handled by backend flag

    return authResult;
  }

  async login(credentials) {
    try {
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (data.success && data.data) {
        this.currentUser = {
          id: data.data.userId,
          name: data.data.username,
          email: '',
          role: 'USER'
        };
        this.storeUser(this.currentUser);
        this.hideLoginModal();
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
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
      this.showLoginModal();
    }
  }

  async guestLogin() {
    return this.login({ username: 'guest', password: 'guest' });
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

  storeUser(user) {
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
      loginModal.style.display = 'flex';
    }
  }

  getUserId() {
    return this.currentUser ? this.currentUser.id : null;
  }

  getUsername() {
    return this.currentUser ? this.currentUser.name : null;
  }

  getUserIdForUrl() {
    if (this.currentUser) {
      // Handle both 'userId' and 'id' properties for backward compatibility
      return this.currentUser.userId || this.currentUser.id;
    }
    return 'guest';
  }
}

// Create global instance
window.authService = new FrontendAuthService();

// Legacy compatibility functions
function getCurrentUser() {
  return window.authService.getCurrentUser();
}

// isReadOnlyMode is managed as a global variable in the main script

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FrontendAuthService;
}

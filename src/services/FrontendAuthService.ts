import { User, UserRole } from '../types';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    userId: string;
    username: string;
  };
  error?: string;
}

export class FrontendAuthService {
  private static instance: FrontendAuthService;
  private currentUser: User | null = null;
  private isReadOnlyMode: boolean = false;

  private constructor() {
    this.initializeFromStorage();
  }

  public static getInstance(): FrontendAuthService {
    if (!FrontendAuthService.instance) {
      FrontendAuthService.instance = new FrontendAuthService();
    }
    return FrontendAuthService.instance;
  }

  private initializeFromStorage(): void {
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

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  public isInReadOnlyMode(): boolean {
    return this.isReadOnlyMode;
  }

  public setReadOnlyMode(readOnly: boolean): void {
    this.isReadOnlyMode = readOnly;
  }

  public async checkAuthentication(pathname?: string): Promise<{
    isAuthenticated: boolean;
    currentUser: User | null;
    deckId: string | null;
    urlUserId: string | null;
    isReadOnlyMode: boolean;
  }> {
    const authResult = {
      isAuthenticated: false,
      currentUser: null as User | null,
      deckId: null as string | null,
      urlUserId: null as string | null,
      isReadOnlyMode: false
    };

    // Extract deck ID and user ID from URL
    const currentPathname = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
    const deckUrlMatch = currentPathname.match(/\/users\/([^\/]+)\/decks\/([^\/]+)/);
    if (deckUrlMatch) {
      authResult.urlUserId = deckUrlMatch[1];
      authResult.deckId = deckUrlMatch[2];
      console.log('Detected deck editor route for deck:', authResult.deckId, 'user:', authResult.urlUserId);
      
      // Check for readonly query parameter
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('readonly') === 'true') {
          authResult.isReadOnlyMode = true;
          this.isReadOnlyMode = true;
          console.log('Read-only mode: readonly=true query parameter detected');
        }
      }
    }

    // Check if we have a user in localStorage
    const storedUser = this.getStoredUser();
    if (storedUser) {
      this.currentUser = storedUser;
      authResult.currentUser = this.currentUser;

      // Verify the session is still valid
      try {
        console.log('🔍 DEBUG: Verifying session with /api/auth/me...');
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        console.log('🔍 DEBUG: /api/auth/me response status:', response.status);
        
        if (response.ok) {
          const data = await response.json() as { success: boolean; data: { userId: string; username: string } };
          console.log('🔍 DEBUG: /api/auth/me response data:', data);
          if (data.data) {
            this.currentUser = {
              id: data.data.userId,
              name: data.data.username,
              email: '',
              role: 'USER' as UserRole
            };
            this.storeUser(this.currentUser);
            authResult.isAuthenticated = true;
            authResult.currentUser = this.currentUser;
            console.log('🔍 DEBUG: Session verified successfully, currentUser:', this.currentUser);
          }
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
          body: JSON.stringify({ username: 'guest', password: 'guest' })
        });

        if (response.ok) {
          const data = await response.json() as LoginResponse;
          if (data.data) {
            this.currentUser = {
              id: data.data.userId,
              name: data.data.username,
              email: '',
              role: 'GUEST' as UserRole
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

    // Determine read-only mode if a deck is being viewed
    if (authResult.deckId) {
      console.log('🔍 DEBUG: Current User ID:', authResult.currentUser ? authResult.currentUser.id : 'N/A');
      console.log('🔍 DEBUG: Current User ID type:', authResult.currentUser ? typeof authResult.currentUser.id : 'N/A');
      console.log('🔍 DEBUG: URL User ID:', authResult.urlUserId);
      console.log('🔍 DEBUG: URL User ID type:', typeof authResult.urlUserId);
      console.log('🔍 DEBUG: IDs match?', authResult.currentUser && authResult.currentUser.id === authResult.urlUserId);
      console.log('🔍 DEBUG: Strict equality check:', authResult.currentUser && authResult.currentUser.id === authResult.urlUserId);
      console.log('🔍 DEBUG: Loose equality check:', authResult.currentUser && authResult.currentUser.id == authResult.urlUserId);
      console.log('🔍 DEBUG: Read-only mode from query param:', authResult.isReadOnlyMode);
      
      // If readonly query parameter is set, always use read-only mode
      if (authResult.isReadOnlyMode) {
        console.log('Read-only mode: readonly=true query parameter detected - FORCING read-only mode');
        // Ensure read-only mode is set
        authResult.isReadOnlyMode = true;
        this.isReadOnlyMode = true;
      } else if (authResult.isAuthenticated && authResult.currentUser && authResult.currentUser.id !== authResult.urlUserId) {
        authResult.isReadOnlyMode = true;
        this.isReadOnlyMode = true;
        console.log('Read-only mode: viewing another user\'s deck');
      } else if (!authResult.isAuthenticated) {
        // If not authenticated at all, it's read-only (e.g., if guest login failed)
        authResult.isReadOnlyMode = true;
        this.isReadOnlyMode = true;
        console.log('Read-only mode: no authentication (or guest login failed)');
      } else {
        authResult.isReadOnlyMode = false;
        this.isReadOnlyMode = false;
        console.log('Edit mode: viewing own deck');
      }
    }

    return authResult;
  }

  public async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log('🔍 DEBUG: Frontend login attempt:', {
        username: credentials.username,
        passwordLength: credentials.password?.length,
        timestamp: new Date().toISOString()
      });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      console.log('🔍 DEBUG: Frontend login response:', {
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString()
      });

      const data = await response.json() as LoginResponse;
      
      console.log('🔍 DEBUG: Frontend login response data:', {
        success: data.success,
        error: data.error,
        data: data.data,
        timestamp: new Date().toISOString()
      });

      if (data.success && data.data) {
        this.currentUser = {
          id: data.data.userId,
          name: data.data.username,
          email: '',
          role: 'USER' as UserRole
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

  public async logout(): Promise<void> {
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

  public async guestLogin(): Promise<LoginResponse> {
    return this.login({ username: 'guest', password: 'guest' });
  }

  private getStoredUser(): User | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
          return JSON.parse(userData);
        }
      }
    } catch (error) {
      console.error('Error parsing stored user:', error);
    }
    return null;
  }

  private storeUser(user: User): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Error storing user:', error);
    }
  }

  private clearStoredUser(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('currentUser');
      }
    } catch (error) {
      console.error('Error clearing stored user:', error);
    }
  }

  private hideLoginModal(): void {
    if (typeof document !== 'undefined') {
      const loginModal = document.getElementById('loginModal');
      if (loginModal) {
        loginModal.style.display = 'none';
      }
    }
  }

  private showLoginModal(): void {
    if (typeof document !== 'undefined') {
      const loginModal = document.getElementById('loginModal');
      if (loginModal) {
        loginModal.style.display = 'flex';
      }
    }
  }

  public getUserId(): string | null {
    return this.currentUser ? this.currentUser.id : null;
  }

  public getUsername(): string | null {
    return this.currentUser ? this.currentUser.name : null;
  }

  public getUserIdForUrl(): string {
    if (this.currentUser) {
      // Handle both 'userId' and 'id' properties for backward compatibility
      return (this.currentUser as any).userId || this.currentUser.id;
    }
    return 'guest';
  }
}

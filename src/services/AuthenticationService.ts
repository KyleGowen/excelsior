import { Request, Response } from 'express';
import { UserRepository } from '../repository/UserRepository';
import { UserPersistenceService } from '../persistence/userPersistence';
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

export interface SessionData {
  userId: string;
  expiresAt: number;
}

export class AuthenticationService {
  private userRepository: UserRepository;
  private userPersistence: UserPersistenceService;
  private sessions: Map<string, SessionData> = new Map();

  constructor(userRepository: UserRepository, userPersistence: UserPersistenceService) {
    this.userRepository = userRepository;
    this.userPersistence = userPersistence;
  }

  /**
   * Authenticate user with username and password
   * Tries database authentication first, then falls back to persistence service
   */
  public async authenticateUser(credentials: LoginCredentials): Promise<User | null> {
    try {
      // Use database authentication only
      const dbUser = await this.userRepository.authenticateUser(credentials.username, credentials.password);
      return dbUser || null;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  /**
   * Create a new session for the user
   */
  public createSession(user: User): string {
    const sessionId = this.generateSessionId();
    const expiresAt = Date.now() + (2 * 60 * 60 * 1000); // 2 hours

    this.sessions.set(sessionId, {
      userId: user.id,
      expiresAt
    });

    return sessionId;
  }

  /**
   * Validate a session and return user if valid
   */
  public validateSession(sessionId: string): { userId: string } | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    return { userId: session.userId };
  }

  /**
   * Destroy a session
   */
  public destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Get user by ID
   */
  public async getUserById(userId: string): Promise<User | null> {
    try {
      // Use database only
      const user = await this.userRepository.getUserById(userId);
      return user || null;
    } catch (error) {
      console.error('Error getting user by ID from database:', error);
      return null;
    }
  }

  /**
   * Handle login request
   */
  public async handleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        res.status(400).json({ success: false, error: 'Username and password are required' });
        return;
      }

      const user = await this.authenticateUser({ username, password });
      
      if (user) {
        const sessionId = this.createSession(user);
        
        res.cookie('sessionId', sessionId, {
          httpOnly: true,
          secure: false,
          maxAge: 2 * 60 * 60 * 1000,
          sameSite: 'lax'
        });
        
        res.json({ 
          success: true, 
          data: { 
            userId: user.id, 
            username: user.name 
          } 
        });
      } else {
        res.status(401).json({ success: false, error: 'Invalid username or password' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, error: 'Login failed' });
    }
  }

  /**
   * Handle logout request
   */
  public handleLogout(req: Request, res: Response): void {
    try {
      const sessionId = req.cookies?.sessionId;
      
      if (sessionId) {
        this.destroySession(sessionId);
      }
      
      res.clearCookie('sessionId');
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ success: false, error: 'Logout failed' });
    }
  }

  /**
   * Handle session validation request
   */
  public async handleSessionValidation(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.cookies?.sessionId;
      
      if (!sessionId) {
        res.status(401).json({ success: false, error: 'No session found' });
        return;
      }

      const session = this.validateSession(sessionId);
      
      if (!session) {
        res.status(401).json({ success: false, error: 'Invalid or expired session' });
        return;
      }

      // Get the full user object
      const user = await this.getUserById(session.userId);
      
      if (!user) {
        res.status(401).json({ success: false, error: 'User not found' });
        return;
      }

      res.json({ 
        success: true, 
        data: user 
      });
    } catch (error) {
      console.error('Session validation error:', error);
      res.status(500).json({ success: false, error: 'Session validation failed' });
    }
  }

  /**
   * Authentication middleware
   */
  public createAuthMiddleware() {
    return async (req: Request, res: Response, next: Function) => {
      const sessionId = req.cookies?.sessionId;
      const { userId } = req.params;
      
      // Special handling for guest routes - allow access without session for any user with GUEST role
      if (userId === 'guest') {
        // Find any user with GUEST role
        const allUsers = await this.userRepository.getAllUsers();
        const guestUser = allUsers.find(user => user.role === 'GUEST');
        if (guestUser) {
          (req as any).user = guestUser;
          return next();
        }
      }
      
      if (!sessionId) {
        // Return JSON error for API calls, redirect for page requests
        if (req.originalUrl.startsWith('/api/')) {
          return res.status(401).json({ success: false, error: 'Authentication required' });
        }
        return res.redirect('/');
      }
      
      const session = this.validateSession(sessionId);
      
      if (!session) {
        // Return JSON error for API calls, redirect for page requests
        if (req.originalUrl.startsWith('/api/')) {
          return res.status(401).json({ success: false, error: 'Invalid or expired session' });
        }
        return res.redirect('/');
      }
      
      // Get the full user object from the database
      const user = await this.getUserById(session.userId);
      if (!user) {
        if (req.originalUrl.startsWith('/api/')) {
          return res.status(401).json({ success: false, error: 'User not found' });
        }
        return res.redirect('/');
      }
      
      (req as any).user = user;
      next();
    };
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}


import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../repository/UserRepository';
import { User } from '../types';
import crypto from 'crypto';
import { sendV1Unauthorized } from '../api/http/v1Envelope';
import { initializeFirebaseAdmin, getFirebaseAdmin } from '../config/firebaseAdmin';
import { checkLimit, recordCreation } from '../middleware/newAccountRateLimiter';
import { NewUserSampleDeckService } from './newUserSampleDeckService';
import { type ISessionRepository, SESSION_TTL_MS } from '../database/sessionRepository';
import { buildSessionCookieOptions, clearSessionCookieOptions } from './authCookieOptions';
import { debugAuth, requestAuthContext, tokenPrefix } from './authDebug';
import { isValidEmail } from '../utils/emailValidation';

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

export class AuthenticationService {
  private userRepository: UserRepository;
  private sessionRepository: ISessionRepository;
  private newUserSampleDeckService: NewUserSampleDeckService | null;

  constructor(
    userRepository: UserRepository,
    sessionRepository: ISessionRepository,
    newUserSampleDeckService?: NewUserSampleDeckService
  ) {
    this.userRepository = userRepository;
    this.sessionRepository = sessionRepository;
    this.newUserSampleDeckService = newUserSampleDeckService ?? null;
    initializeFirebaseAdmin();
  }

  /**
   * Authenticate user with username and password
   * Uses database authentication only
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
   * Create a new session for the user (persisted in Postgres).
   */
  public async createSession(user: User): Promise<string> {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await this.sessionRepository.insert(user.id, sessionId, expiresAt);
    return sessionId;
  }

  /**
   * Validate a session and return user if valid; slides expiry on success.
   */
  public async validateSession(sessionId: string): Promise<{ userId: string } | null> {
    try {
      const newExpiresAt = new Date(Date.now() + SESSION_TTL_MS);
      const userId = await this.sessionRepository.validateAndSlideExpiry(sessionId, newExpiresAt);
      if (!userId) {
        debugAuth('validateSession MISS (token not found or expired)', { token: tokenPrefix(sessionId) });
        return null;
      }
      debugAuth('validateSession HIT (expiry slid)', { token: tokenPrefix(sessionId), userId });
      return { userId };
    } catch (error) {
      console.error('Session validation error:', error);
      debugAuth('validateSession ERROR', { token: tokenPrefix(sessionId), error: String(error) });
      return null;
    }
  }

  /**
   * Set the `sessionId` cookie and log the resolved attributes + request
   * context (DEBUG_AUTH). Centralizes issuance so login/signup/google and the
   * rolling-refresh path all behave identically.
   */
  private issueSessionCookie(req: Request, res: Response, sessionId: string): void {
    const options = buildSessionCookieOptions(req, SESSION_TTL_MS);
    res.cookie('sessionId', sessionId, options);
    debugAuth('issued sessionId cookie', {
      token: tokenPrefix(sessionId),
      options,
      ...requestAuthContext(req),
    });
  }

  /**
   * Destroy a session
   */
  public async destroySession(sessionId: string): Promise<void> {
    try {
      await this.sessionRepository.deleteByToken(sessionId);
    } catch (error) {
      console.error('Session destroy error:', error);
    }
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
        const sessionId = await this.createSession(user);

        this.issueSessionCookie(req, res, sessionId);
        // Update last_login_at on successful login/session creation
        try {
          await this.userRepository.updateLastLoginAt(user.id);
        } catch (e) {
          // Do not fail login if timestamp update fails; log and continue
          console.error('Warning: failed to update last_login_at:', e);
        }

        res.json({
          success: true,
          data: {
            userId: user.id,
            username: user.name,
            email: user.email,
            role: user.role,
            authProvider: user.authProvider ?? 'password'
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
  public async handleLogout(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.cookies?.sessionId;

      if (sessionId) {
        await this.destroySession(sessionId);
      }

      // Clear with the same attributes used when the cookie was set, otherwise
      // the browser may keep a cookie whose attributes don't match.
      res.clearCookie('sessionId', clearSessionCookieOptions(req));
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ success: false, error: 'Logout failed' });
    }
  }

  /**
   * Preview Google sign-in: verify token and report login vs new registration (no session).
   */
  public async handleGoogleLoginPreview(req: Request, res: Response): Promise<void> {
    try {
      const { idToken } = req.body;
      if (!idToken || typeof idToken !== 'string') {
        res.status(400).json({ success: false, error: 'idToken is required' });
        return;
      }

      const claims = await this.verifyGoogleIdTokenOrRespond(idToken, res);
      if (!claims) {
        return;
      }

      const resolution = await this.previewGoogleAuthResolution(claims);
      res.json({
        success: true,
        data: {
          action: resolution.action,
          profile: resolution.profile,
        },
      });
    } catch (error) {
      console.error('Google login preview error:', error);
      res.status(500).json({ success: false, error: 'Google sign-in preview failed' });
    }
  }

  /**
   * Handle Google login request.
   * Verifies Firebase ID token, finds or creates user, creates session.
   * New registrations require confirmRegistration: true in the request body.
   */
  public async handleGoogleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { idToken, confirmRegistration } = req.body;
      if (!idToken || typeof idToken !== 'string') {
        res.status(400).json({ success: false, error: 'idToken is required' });
        return;
      }

      const claims = await this.verifyGoogleIdTokenOrRespond(idToken, res);
      if (!claims) {
        return;
      }

      const preview = await this.previewGoogleAuthResolution(claims);
      if (preview.action === 'register' && confirmRegistration !== true) {
        res.status(403).json({
          success: false,
          error: 'Please confirm account creation before continuing',
          code: 'REGISTRATION_CONFIRMATION_REQUIRED',
        });
        return;
      }

      const user = await this.resolveGoogleUserForLogin(claims, req);
      if (!user) {
        res.status(500).json({ success: false, error: 'Google sign-in failed' });
        return;
      }

      const sessionId = await this.createSession(user);
      this.issueSessionCookie(req, res, sessionId);

      try {
        await this.userRepository.updateLastLoginAt(user.id);
      } catch (e) {
        console.error('Warning: failed to update last_login_at:', e);
      }

      res.json({
        success: true,
        data: {
          userId: user.id,
          username: user.name,
          email: user.email,
          role: user.role,
          authProvider: 'google'
        }
      });
    } catch (error) {
      if (error instanceof Error && (error as Error & { statusCode?: number }).statusCode === 429) {
        res.status(429).json({ success: false, error: 'Too many new accounts. Please try again later.' });
        return;
      }
      console.error('Google login error:', error);
      res.status(500).json({ success: false, error: 'Google sign-in failed' });
    }
  }

  private async verifyGoogleIdTokenOrRespond(
    idToken: string,
    res: Response
  ): Promise<{ firebaseUid: string; email: string; name: string } | null> {
    const firebaseAdmin = getFirebaseAdmin();
    if (!firebaseAdmin) {
      res.status(503).json({ success: false, error: 'Google sign-in is not configured' });
      return null;
    }

    let decodedToken: { uid: string; email?: string; name?: string };
    try {
      decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    } catch (err) {
      console.error('Firebase token verification failed:', err);
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return null;
    }

    return {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || decodedToken.email?.split('@')[0] || 'Google User',
    };
  }

  private async previewGoogleAuthResolution(claims: {
    firebaseUid: string;
    email: string;
    name: string;
  }): Promise<{
    action: 'login' | 'register';
    profile: { email: string; name: string; username?: string };
  }> {
    const { firebaseUid, email, name } = claims;

    const byUid = await this.userRepository.getUserByFirebaseUid(firebaseUid);
    if (byUid) {
      return {
        action: 'login',
        profile: { email: byUid.email || email, name: byUid.name, username: byUid.name },
      };
    }

    if (email) {
      const existingByEmail = await this.userRepository.getUserByEmail(email);
      if (existingByEmail && existingByEmail.role !== 'GUEST') {
        return {
          action: 'login',
          profile: {
            email: existingByEmail.email || email,
            name: existingByEmail.name,
            username: existingByEmail.name,
          },
        };
      }
    }

    return {
      action: 'register',
      profile: { email, name },
    };
  }

  /** Find, link, or create the Excelsior user for a verified Google token. */
  private async resolveGoogleUserForLogin(
    claims: { firebaseUid: string; email: string; name: string },
    req?: Request
  ): Promise<User | null> {
    const { firebaseUid, email, name } = claims;

    let user = await this.userRepository.getUserByFirebaseUid(firebaseUid);

    if (!user && email) {
      const existingByEmail = await this.userRepository.getUserByEmail(email);
      if (existingByEmail && existingByEmail.role !== 'GUEST') {
        await this.userRepository.linkGoogleToUser(existingByEmail.id, firebaseUid);
        user = existingByEmail;
      }
    }

    if (!user) {
      const ip = req?.ip || req?.socket?.remoteAddress || 'unknown';
      if (!checkLimit(ip)) {
        const err = new Error('RATE_LIMIT_EXCEEDED');
        (err as Error & { statusCode: number }).statusCode = 429;
        throw err;
      }
      recordCreation(ip);
      user = await this.userRepository.createGoogleUser(email, name, firebaseUid);
      if (this.newUserSampleDeckService) {
        try {
          await this.newUserSampleDeckService.copyRandomGuestDeckForUser(user.id);
        } catch (e) {
          console.error('Warning: failed to copy sample deck for new Google user:', e);
        }
      }
    }

    return user;
  }

  /**
   * Handle signup request (public, unauthenticated).
   * Creates user, applies rate limit (5/IP/min, 10 global/min), establishes session.
   */
  public async handleSignup(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body;

      if (!username || typeof username !== 'string' || !username.trim()) {
        res.status(400).json({ success: false, error: 'Username is required' });
        return;
      }
      if (!email || typeof email !== 'string' || !email.trim()) {
        res.status(400).json({ success: false, error: 'Email is required' });
        return;
      }
      if (!password || typeof password !== 'string') {
        res.status(400).json({ success: false, error: 'Password is required' });
        return;
      }

      const trimmedUsername = username.trim();
      const trimmedEmail = email.trim();

      if (!isValidEmail(trimmedEmail)) {
        res.status(400).json({ success: false, error: 'Invalid email format' });
        return;
      }

      const ip = req.ip || req.socket?.remoteAddress || 'unknown';
      if (!checkLimit(ip)) {
        res.status(429).json({ success: false, error: 'Too many new accounts. Please try again later.' });
        return;
      }

      const existingByUsername = await this.userRepository.getUserByUsername(trimmedUsername);
      if (existingByUsername) {
        res.status(409).json({ success: false, error: 'Username already exists' });
        return;
      }

      const existingByEmail = await this.userRepository.getUserByEmail(trimmedEmail);
      if (existingByEmail) {
        res.status(409).json({ success: false, error: 'Email already exists' });
        return;
      }

      recordCreation(ip);
      const user = await this.userRepository.createUser(trimmedUsername, trimmedEmail, password, 'USER');

      if (this.newUserSampleDeckService) {
        try {
          await this.newUserSampleDeckService.copyRandomGuestDeckForUser(user.id);
        } catch (e) {
          console.error('Warning: failed to copy sample deck for new user:', e);
        }
      }

      const sessionId = await this.createSession(user);
      this.issueSessionCookie(req, res, sessionId);

      try {
        await this.userRepository.updateLastLoginAt(user.id);
      } catch (e) {
        console.error('Warning: failed to update last_login_at:', e);
      }

      res.status(201).json({
        success: true,
        data: { userId: user.id, username: user.name, role: user.role }
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ success: false, error: 'Failed to create account' });
    }
  }

  /**
   * Handle session validation request
   */
  public async handleSessionValidation(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.cookies?.sessionId;

      if (!sessionId) {
        debugAuth('/api/auth/me DENY: no sessionId cookie', requestAuthContext(req));
        res.status(401).json({ success: false, error: 'No session found' });
        return;
      }

      const session = await this.validateSession(sessionId);

      if (!session) {
        debugAuth('/api/auth/me DENY: invalid/expired session', {
          token: tokenPrefix(sessionId),
          ...requestAuthContext(req),
        });
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
    return async (req: Request, res: Response, next: NextFunction) => {
      const sessionId = req.cookies?.sessionId;
      const { userId } = req.params;

      // Special handling for guest routes - allow access without session for any user with GUEST role
      if (userId === 'guest') {
        // Find any user with GUEST role
        const allUsers = await this.userRepository.getAllUsers();
        const guestUser = allUsers.find(user => user.role === 'GUEST');
        if (guestUser) {
          (req as unknown as Record<string, unknown>).user = guestUser;
          return next();
        }
      }

      if (!sessionId) {
        debugAuth('auth middleware DENY: no sessionId cookie', requestAuthContext(req));
        // Return JSON error for API calls, redirect for page requests
        if (req.originalUrl.startsWith('/api/v1')) {
          return sendV1Unauthorized(res, 'Authentication required');
        }
        if (req.originalUrl.startsWith('/api/')) {
          return res.status(401).json({ success: false, error: 'Authentication required' });
        }
        return res.redirect('/');
      }

      const session = await this.validateSession(sessionId);

      if (!session) {
        debugAuth('auth middleware DENY: invalid/expired session', {
          token: tokenPrefix(sessionId),
          ...requestAuthContext(req),
        });
        if (req.originalUrl.startsWith('/api/v1')) {
          return sendV1Unauthorized(res, 'Invalid or expired session');
        }
        if (req.originalUrl.startsWith('/api/')) {
          return res.status(401).json({ success: false, error: 'Invalid or expired session' });
        }
        return res.redirect('/');
      }

      // Get the full user object from the database
      const user = await this.getUserById(session.userId);
      if (!user) {
        debugAuth('auth middleware DENY: user not found for valid session', {
          token: tokenPrefix(sessionId),
          userId: session.userId,
          ...requestAuthContext(req),
        });
        if (req.originalUrl.startsWith('/api/v1')) {
          return sendV1Unauthorized(res, 'User not found');
        }
        if (req.originalUrl.startsWith('/api/')) {
          return res.status(401).json({ success: false, error: 'User not found' });
        }
        return res.redirect('/');
      }

      // Rolling cookie: re-issue on every authenticated request so the browser
      // cookie maxAge tracks the sliding DB session (no hard 2h cap for active
      // users), and any stale `Secure` cookie left over from the old HTTPS
      // behavior gets overwritten with the current HTTP-safe attributes.
      this.issueSessionCookie(req, res, sessionId);

      (req as unknown as Record<string, unknown>).user = user;
      next();
    };
  }

  /**
   * Optional auth: attaches `req.user` when a valid session cookie is present,
   * but NEVER rejects — guests (no/invalid session) simply proceed with no user.
   * Used by guest-viewable routes (community feed, public profiles).
   */
  public createOptionalAuthMiddleware() {
    return async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const sessionId = req.cookies?.sessionId;
        if (!sessionId) return next();
        const session = await this.validateSession(sessionId);
        if (!session) return next();
        const user = await this.getUserById(session.userId);
        if (user) {
          (req as unknown as Record<string, unknown>).user = user;
        }
      } catch {
        // Swallow errors — optional auth must never block a public read.
      }
      next();
    };
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    // Conservative hardening: crypto-strong session IDs without changing cookie flags.
    return crypto.randomBytes(32).toString('hex');
  }
}

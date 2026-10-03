import { AuthenticationService } from '../../src/services/AuthenticationService';
import { UserRepository } from '../../src/repository/UserRepository';
import { NewUserSampleDeckService } from '../../src/services/newUserSampleDeckService';
import { User, UserRole } from '../../src/types';
import { Request, Response, NextFunction } from 'express';
import { getFirebaseAdmin } from '../../src/config/firebaseAdmin';
import { checkLimit, recordCreation } from '../../src/middleware/newAccountRateLimiter';
import { SESSION_TTL_MS } from '../../src/database/sessionRepository';

function createMockSessionRepository() {
  const tokenToUser = new Map<string, string>();
  return {
    insert: jest.fn(async (userId: string, token: string) => {
      tokenToUser.set(token, userId);
    }),
    validateAndSlideExpiry: jest.fn(async (token: string) => tokenToUser.get(token) ?? null),
    deleteByToken: jest.fn(async (token: string) => {
      tokenToUser.delete(token);
    })
  };
}

// Mock dependencies
jest.mock('../../src/repository/UserRepository');
jest.mock('../../src/config/firebaseAdmin', () => ({
  getFirebaseAdmin: jest.fn(),
  initializeFirebaseAdmin: jest.fn()
}));
jest.mock('../../src/middleware/newAccountRateLimiter', () => ({
  checkLimit: jest.fn(() => true),
  recordCreation: jest.fn()
}));

describe('AuthenticationService', () => {
  let authService: AuthenticationService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockSessionRepository: ReturnType<typeof createMockSessionRepository>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mockUserRepository = {
      authenticateUser: jest.fn(),
      getUserById: jest.fn(),
      getUserAuthMeta: jest.fn(),
      getUserByUsername: jest.fn(),
      getUserByEmail: jest.fn(),
      getUserByFirebaseUid: jest.fn(),
      createUser: jest.fn(),
      createGoogleUser: jest.fn(),
      linkGoogleToUser: jest.fn(),
      getAllUsers: jest.fn(),
      getUsersByIds: jest.fn(),
      updateUser: jest.fn(),
      updateLastLoginAt: jest.fn(),
      updateUserPassword: jest.fn(),
      deleteUser: jest.fn(),
      getUserStats: jest.fn(),
      getUserAnalytics: jest.fn(),
      initialize: jest.fn()
    } as jest.Mocked<UserRepository>;

    mockSessionRepository = createMockSessionRepository();

    // Create service instance
    authService = new AuthenticationService(mockUserRepository, mockSessionRepository as any);

    // Setup mock request/response
    mockRequest = {
      cookies: {},
      body: {},
      params: {},
      originalUrl: '/api/test'
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe('createAuthMiddleware', () => {
    it('should allow guest user access', async () => {
      const guestUser: User = {
        id: 'guest-id',
        name: 'guest',
        email: 'guest@example.com',
        role: 'GUEST' as UserRole
      };

      mockRequest.params = { userId: 'guest' };
      mockUserRepository.getAllUsers.mockResolvedValue([guestUser]);

      const middleware = authService.createAuthMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserRepository.getAllUsers).toHaveBeenCalled();
      expect((mockRequest as any).user).toEqual(guestUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should redirect to home when no session and not API route', async () => {
      mockRequest.cookies = {};
      mockRequest.originalUrl = '/users/123/decks';

      const middleware = authService.createAuthMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.redirect).toHaveBeenCalledWith('/');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for API routes without session', async () => {
      mockRequest.cookies = {};
      mockRequest.originalUrl = '/api/decks';

      const middleware = authService.createAuthMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should redirect to home when session is invalid and not API route', async () => {
      mockRequest.cookies = { sessionId: 'invalid-session' };
      mockRequest.originalUrl = '/users/123/decks';
      // The service uses its own session management, not userPersistence

      const middleware = authService.createAuthMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.redirect).toHaveBeenCalledWith('/');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for API routes with invalid session', async () => {
      mockRequest.cookies = { sessionId: 'invalid-session' };
      mockRequest.originalUrl = '/api/decks';
      // The service uses its own session validation

      const middleware = authService.createAuthMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired session'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should redirect to home when user not found and not API route', async () => {
      // Create a valid session in the service
      const user: User = {
        id: 'user-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER' as UserRole
      };
      const sessionId = await authService.createSession(user);
      
      mockRequest.cookies = { sessionId };
      mockRequest.originalUrl = '/users/123/decks';
      mockUserRepository.getUserById.mockResolvedValue(undefined);

      const middleware = authService.createAuthMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.redirect).toHaveBeenCalledWith('/');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for API routes when user not found', async () => {
      // Create a valid session in the service
      const user: User = {
        id: 'user-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER' as UserRole
      };
      const sessionId = await authService.createSession(user);
      
      mockRequest.cookies = { sessionId };
      mockRequest.originalUrl = '/api/decks';
      mockUserRepository.getUserById.mockResolvedValue(undefined);

      const middleware = authService.createAuthMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should set user and call next for valid session', async () => {
      const user: User = {
        id: 'user-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER' as UserRole
      };

      // Create a valid session in the service
      const sessionId = await authService.createSession(user);
      mockRequest.cookies = { sessionId };
      mockUserRepository.getUserById.mockResolvedValue(user);

      const middleware = authService.createAuthMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).user).toEqual(user);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('handleLogin', () => {
    it('should return 400 when username is missing', async () => {
      mockRequest.body = { password: 'password' };

      (mockUserRepository as any).updateLastLoginAt = jest.fn().mockResolvedValue(undefined);

      await authService.handleLogin(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Username and password are required'
      });
    });

    it('should return 400 when password is missing', async () => {
      mockRequest.body = { username: 'testuser' };

      await authService.handleLogin(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Username and password are required'
      });
    });

    it('should return 401 for invalid credentials', async () => {
      mockRequest.body = { username: 'testuser', password: 'wrongpassword' };
      mockUserRepository.authenticateUser.mockResolvedValue(undefined);

      await authService.handleLogin(mockRequest as Request, mockResponse as Response);

      expect(mockUserRepository.authenticateUser).toHaveBeenCalledWith('testuser', 'wrongpassword');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid username or password'
      });
    });

    it('should create session and return success for valid credentials', async () => {
      const user: User = {
        id: 'user-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER' as UserRole
      };

      mockRequest.body = { username: 'testuser', password: 'password' };
      mockUserRepository.authenticateUser.mockResolvedValue(user);

      await authService.handleLogin(mockRequest as Request, mockResponse as Response);

      expect(mockUserRepository.authenticateUser).toHaveBeenCalledWith('testuser', 'password');
      expect(mockResponse.cookie).toHaveBeenCalledWith('sessionId', expect.any(String), {
        httpOnly: true,
        secure: false,
        maxAge: SESSION_TTL_MS,
        sameSite: 'lax'
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: user.id,
          username: user.name,
          email: user.email,
          role: user.role,
          authProvider: 'password'
        }
      });
      expect((mockUserRepository as any).updateLastLoginAt).toHaveBeenCalledWith(user.id);
    });

    it('should handle authentication errors', async () => {
      mockRequest.body = { username: 'testuser', password: 'password' };
      mockUserRepository.authenticateUser.mockRejectedValue(new Error('Database error'));

      await authService.handleLogin(mockRequest as Request, mockResponse as Response);

      // The authenticateUser method catches errors and returns null, so we get 401 instead of 500
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid username or password'
      });
    });
  });

  describe('handleLogout', () => {
    it('should clear session and cookie when session exists', async () => {
      // Create a session first
      const user: User = {
        id: 'user-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER' as UserRole
      };
      const sessionId = await authService.createSession(user);
      mockRequest.cookies = { sessionId };

      await authService.handleLogout(mockRequest as Request, mockResponse as Response);

      expect(mockSessionRepository.deleteByToken).toHaveBeenCalledWith(sessionId);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'sessionId',
        expect.objectContaining({ httpOnly: true, sameSite: 'lax', secure: false })
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully'
      });
    });

    it('should handle logout when no session exists', async () => {
      mockRequest.cookies = {};

      await authService.handleLogout(mockRequest as Request, mockResponse as Response);

      expect(mockSessionRepository.deleteByToken).not.toHaveBeenCalled();
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'sessionId',
        expect.objectContaining({ httpOnly: true, sameSite: 'lax', secure: false })
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully'
      });
    });

    it('should handle logout errors', async () => {
      mockRequest.cookies = { sessionId: 'session-id' };
      // Mock clearCookie to throw an error
      mockResponse.clearCookie = jest.fn().mockImplementation(() => {
        throw new Error('Clear cookie error');
      });

      await authService.handleLogout(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Logout failed'
      });
    });
  });

  describe('handleSessionValidation', () => {
    it('should return user data when user is authenticated', async () => {
      const user: User = {
        id: 'user-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER' as UserRole
      };

      // Create a session and set up the request properly
      const sessionId = await authService.createSession(user);
      mockRequest.cookies = { sessionId };
      mockUserRepository.getUserById.mockResolvedValue(user);

      await authService.handleSessionValidation(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: user
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.cookies = {};

      await authService.handleSessionValidation(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'No session found'
      });
    });

    it('should handle session validation errors', async () => {
      // Create a session but mock getUserById to throw an error
      const user: User = {
        id: 'user-id',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER' as UserRole
      };
      const sessionId = await authService.createSession(user);
      mockRequest.cookies = { sessionId };
      mockUserRepository.getUserById.mockRejectedValue(new Error('Database error'));

      await authService.handleSessionValidation(mockRequest as Request, mockResponse as Response);

      // The getUserById method catches errors and returns null, so we get 401 instead of 500
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });
  });

  describe('handleGoogleLogin', () => {
    beforeEach(() => {
      jest.mocked(checkLimit).mockReturnValue(true);
      jest.mocked(recordCreation).mockImplementation(() => {});
    });

    it('should return 400 when idToken is missing', async () => {
      mockRequest.body = {};

      await authService.handleGoogleLogin(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'idToken is required'
      });
    });

    it('should return 400 when idToken is not a string', async () => {
      mockRequest.body = { idToken: 12345 };

      await authService.handleGoogleLogin(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'idToken is required'
      });
    });

    it('should return 503 when Firebase is not configured', async () => {
      mockRequest.body = { idToken: 'fake-token' };
      jest.mocked(getFirebaseAdmin).mockReturnValue(null as any);

      await authService.handleGoogleLogin(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Google sign-in is not configured'
      });
    });

    it('should return 401 when token verification fails', async () => {
      mockRequest.body = { idToken: 'invalid-token' };
      const mockAuth = {
        auth: jest.fn().mockReturnValue({
          verifyIdToken: jest.fn().mockRejectedValue(new Error('Invalid token'))
        })
      };
      jest.mocked(getFirebaseAdmin).mockReturnValue(mockAuth as any);

      await authService.handleGoogleLogin(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token'
      });
    });

    it('should return 429 when rate limit exceeded', async () => {
      mockRequest.body = { idToken: 'valid-token', confirmRegistration: true };
      (mockRequest as any).ip = '192.168.1.1';
      jest.mocked(checkLimit).mockReturnValue(false);
      const mockAuth = {
        auth: jest.fn().mockReturnValue({
          verifyIdToken: jest.fn().mockResolvedValue({
            uid: 'firebase-uid-123',
            email: 'new@example.com',
            name: 'New User'
          })
        })
      };
      jest.mocked(getFirebaseAdmin).mockReturnValue(mockAuth as any);
      mockUserRepository.getUserByFirebaseUid.mockResolvedValue(undefined);
      mockUserRepository.getUserByEmail.mockResolvedValue(undefined);

      await authService.handleGoogleLogin(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Too many new accounts. Please try again later.'
      });
      expect(mockUserRepository.createGoogleUser).not.toHaveBeenCalled();
    });

    it('should return 403 when new user has not confirmed registration', async () => {
      mockRequest.body = { idToken: 'valid-token' };
      const mockAuth = {
        auth: jest.fn().mockReturnValue({
          verifyIdToken: jest.fn().mockResolvedValue({
            uid: 'firebase-uid-new',
            email: 'new@example.com',
            name: 'New User'
          })
        })
      };
      jest.mocked(getFirebaseAdmin).mockReturnValue(mockAuth as any);
      mockUserRepository.getUserByFirebaseUid.mockResolvedValue(undefined);
      mockUserRepository.getUserByEmail.mockResolvedValue(undefined);

      await authService.handleGoogleLogin(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Please confirm account creation before continuing',
        code: 'REGISTRATION_CONFIRMATION_REQUIRED'
      });
      expect(mockUserRepository.createGoogleUser).not.toHaveBeenCalled();
    });

    it('should create session for existing user by firebase_uid', async () => {
      const existingUser: User = {
        id: 'existing-id',
        name: 'Existing User',
        email: 'existing@example.com',
        role: 'USER' as UserRole
      };
      mockRequest.body = { idToken: 'valid-token' };
      const mockAuth = {
        auth: jest.fn().mockReturnValue({
          verifyIdToken: jest.fn().mockResolvedValue({
            uid: 'firebase-uid-123',
            email: 'existing@example.com',
            name: 'Existing User'
          })
        })
      };
      jest.mocked(getFirebaseAdmin).mockReturnValue(mockAuth as any);
      mockUserRepository.getUserByFirebaseUid.mockResolvedValue(existingUser);

      await authService.handleGoogleLogin(mockRequest as Request, mockResponse as Response);

      expect(mockUserRepository.getUserByFirebaseUid).toHaveBeenCalledWith('firebase-uid-123');
      expect(mockUserRepository.createGoogleUser).not.toHaveBeenCalled();
      expect(mockResponse.cookie).toHaveBeenCalledWith('sessionId', expect.any(String), expect.any(Object));
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: existingUser.id,
          username: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          authProvider: 'google'
        }
      });
    });

    it('should link and create session for existing user by email (non-guest)', async () => {
      const existingUser: User = {
        id: 'existing-id',
        name: 'Existing User',
        email: 'link@example.com',
        role: 'USER' as UserRole
      };
      mockRequest.body = { idToken: 'valid-token' };
      const mockAuth = {
        auth: jest.fn().mockReturnValue({
          verifyIdToken: jest.fn().mockResolvedValue({
            uid: 'firebase-uid-new',
            email: 'link@example.com',
            name: 'Google Name'
          })
        })
      };
      jest.mocked(getFirebaseAdmin).mockReturnValue(mockAuth as any);
      mockUserRepository.getUserByFirebaseUid.mockResolvedValue(undefined);
      mockUserRepository.getUserByEmail.mockResolvedValue(existingUser);

      await authService.handleGoogleLogin(mockRequest as Request, mockResponse as Response);

      expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith('link@example.com');
      expect(mockUserRepository.linkGoogleToUser).toHaveBeenCalledWith('existing-id', 'firebase-uid-new');
      expect(mockUserRepository.createGoogleUser).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: existingUser.id,
          username: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          authProvider: 'google'
        }
      });
    });

    it('should not link when existing user is GUEST', async () => {
      const guestUser: User = {
        id: 'guest-id',
        name: 'guest',
        email: 'guest@example.com',
        role: 'GUEST' as UserRole
      };
      mockRequest.body = { idToken: 'valid-token', confirmRegistration: true };
      (mockRequest as any).ip = '192.168.1.1';
      const mockAuth = {
        auth: jest.fn().mockReturnValue({
          verifyIdToken: jest.fn().mockResolvedValue({
            uid: 'firebase-uid-new',
            email: 'guest@example.com',
            name: 'Guest'
          })
        })
      };
      jest.mocked(getFirebaseAdmin).mockReturnValue(mockAuth as any);
      mockUserRepository.getUserByFirebaseUid.mockResolvedValue(undefined);
      mockUserRepository.getUserByEmail.mockResolvedValue(guestUser);
      mockUserRepository.createGoogleUser.mockResolvedValue({
        id: 'new-google-id',
        name: 'Guest',
        email: 'guest@example.com',
        role: 'USER' as UserRole
      });

      await authService.handleGoogleLogin(mockRequest as Request, mockResponse as Response);

      expect(mockUserRepository.linkGoogleToUser).not.toHaveBeenCalled();
      expect(mockUserRepository.createGoogleUser).toHaveBeenCalledWith(
        'guest@example.com',
        'Guest',
        'firebase-uid-new'
      );
    });

    it('should create new Google user and session when no existing user', async () => {
      const newUser: User = {
        id: 'new-id',
        name: 'New User',
        email: 'new@example.com',
        role: 'USER' as UserRole
      };
      mockRequest.body = { idToken: 'valid-token', confirmRegistration: true };
      (mockRequest as any).ip = '192.168.1.1';
      const mockAuth = {
        auth: jest.fn().mockReturnValue({
          verifyIdToken: jest.fn().mockResolvedValue({
            uid: 'firebase-uid-123',
            email: 'new@example.com',
            name: 'New User'
          })
        })
      };
      jest.mocked(getFirebaseAdmin).mockReturnValue(mockAuth as any);
      mockUserRepository.getUserByFirebaseUid.mockResolvedValue(undefined);
      mockUserRepository.getUserByEmail.mockResolvedValue(undefined);
      mockUserRepository.createGoogleUser.mockResolvedValue(newUser);

      await authService.handleGoogleLogin(mockRequest as Request, mockResponse as Response);

      expect(mockUserRepository.createGoogleUser).toHaveBeenCalledWith(
        'new@example.com',
        'New User',
        'firebase-uid-123'
      );
      expect(recordCreation).toHaveBeenCalledWith('192.168.1.1');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: newUser.id,
          username: newUser.name,
          email: newUser.email,
          role: newUser.role,
          authProvider: 'google'
        }
      });
    });

    it('should use email prefix when name is missing from token', async () => {
      mockRequest.body = { idToken: 'valid-token', confirmRegistration: true };
      (mockRequest as any).ip = '192.168.1.1';
      const mockAuth = {
        auth: jest.fn().mockReturnValue({
          verifyIdToken: jest.fn().mockResolvedValue({
            uid: 'firebase-uid-456',
            email: 'naming@example.com'
          })
        })
      };
      jest.mocked(getFirebaseAdmin).mockReturnValue(mockAuth as any);
      mockUserRepository.getUserByFirebaseUid.mockResolvedValue(undefined);
      mockUserRepository.getUserByEmail.mockResolvedValue(undefined);
      mockUserRepository.createGoogleUser.mockResolvedValue({
        id: 'new-id',
        name: 'naming',
        email: 'naming@example.com',
        role: 'USER' as UserRole
      });

      await authService.handleGoogleLogin(mockRequest as Request, mockResponse as Response);

      expect(mockUserRepository.createGoogleUser).toHaveBeenCalledWith(
        'naming@example.com',
        'naming',
        'firebase-uid-456'
      );
    });

    it('should copy sample deck for new Google user when newUserSampleDeckService is provided', async () => {
      const mockSampleDeckService = {
        copyRandomGuestDeckForUser: jest.fn().mockResolvedValue('deck-id')
      } as unknown as NewUserSampleDeckService;
      const authWithSampleDeck = new AuthenticationService(
        mockUserRepository,
        createMockSessionRepository() as any,
        mockSampleDeckService
      );

      const newUser: User = {
        id: 'new-google-id',
        name: 'Google New',
        email: 'google-new@example.com',
        role: 'USER' as UserRole
      };
      mockRequest.body = { idToken: 'valid-token', confirmRegistration: true };
      (mockRequest as any).ip = '192.168.1.1';
      const mockAuth = {
        auth: jest.fn().mockReturnValue({
          verifyIdToken: jest.fn().mockResolvedValue({
            uid: 'firebase-uid-new-google',
            email: 'google-new@example.com',
            name: 'Google New'
          })
        })
      };
      jest.mocked(getFirebaseAdmin).mockReturnValue(mockAuth as any);
      mockUserRepository.getUserByFirebaseUid.mockResolvedValue(undefined);
      mockUserRepository.getUserByEmail.mockResolvedValue(undefined);
      mockUserRepository.createGoogleUser.mockResolvedValue(newUser);

      await authWithSampleDeck.handleGoogleLogin(mockRequest as Request, mockResponse as Response);

      expect(mockSampleDeckService.copyRandomGuestDeckForUser).toHaveBeenCalledWith('new-google-id');
    });
  });

  describe('handleGoogleLoginPreview', () => {
    it('should return register action for new Google user', async () => {
      mockRequest.body = { idToken: 'valid-token' };
      const mockAuth = {
        auth: jest.fn().mockReturnValue({
          verifyIdToken: jest.fn().mockResolvedValue({
            uid: 'firebase-uid-new',
            email: 'new@example.com',
            name: 'New User'
          })
        })
      };
      jest.mocked(getFirebaseAdmin).mockReturnValue(mockAuth as any);
      mockUserRepository.getUserByFirebaseUid.mockResolvedValue(undefined);
      mockUserRepository.getUserByEmail.mockResolvedValue(undefined);

      await authService.handleGoogleLoginPreview(mockRequest as Request, mockResponse as Response);

      expect(mockUserRepository.createGoogleUser).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          action: 'register',
          profile: { email: 'new@example.com', name: 'New User' }
        }
      });
    });

    it('should return login action for existing user', async () => {
      const existingUser: User = {
        id: 'existing-id',
        name: 'Existing User',
        email: 'existing@example.com',
        role: 'USER' as UserRole
      };
      mockRequest.body = { idToken: 'valid-token' };
      const mockAuth = {
        auth: jest.fn().mockReturnValue({
          verifyIdToken: jest.fn().mockResolvedValue({
            uid: 'firebase-uid-123',
            email: 'existing@example.com',
            name: 'Existing User'
          })
        })
      };
      jest.mocked(getFirebaseAdmin).mockReturnValue(mockAuth as any);
      mockUserRepository.getUserByFirebaseUid.mockResolvedValue(existingUser);

      await authService.handleGoogleLoginPreview(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          action: 'login',
          profile: {
            email: 'existing@example.com',
            name: 'Existing User',
            username: 'Existing User'
          }
        }
      });
    });
  });

  describe('handleSignup', () => {
    beforeEach(() => {
      jest.mocked(checkLimit).mockReturnValue(true);
      jest.mocked(recordCreation).mockImplementation(() => {});
      (mockRequest as any).ip = '192.168.1.1';
    });

    it('should return 400 when username is missing', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'password123' };

      await authService.handleSignup(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'Username is required' });
      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
    });

    it('should return 400 when email is missing', async () => {
      mockRequest.body = { username: 'testuser', password: 'password123' };

      await authService.handleSignup(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'Email is required' });
      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
    });

    it('should return 400 when password is missing', async () => {
      mockRequest.body = { username: 'testuser', email: 'test@example.com' };

      await authService.handleSignup(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'Password is required' });
      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
    });

    it('should return 400 when username is whitespace only', async () => {
      mockRequest.body = { username: '   ', email: 'test@example.com', password: 'password123' };

      await authService.handleSignup(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'Username is required' });
      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email format', async () => {
      mockRequest.body = { username: 'testuser', email: 'notanemail', password: 'password123' };

      await authService.handleSignup(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'Invalid email format' });
      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
    });

    it('should return 429 when rate limit exceeded', async () => {
      mockRequest.body = { username: 'newuser', email: 'new@example.com', password: 'password123' };
      jest.mocked(checkLimit).mockReturnValue(false);
      mockUserRepository.getUserByUsername.mockResolvedValue(undefined);
      mockUserRepository.getUserByEmail.mockResolvedValue(undefined);

      await authService.handleSignup(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Too many new accounts. Please try again later.'
      });
      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
      expect(recordCreation).not.toHaveBeenCalled();
    });

    it('should return 409 when username already exists', async () => {
      mockRequest.body = { username: 'existing', email: 'new@example.com', password: 'password123' };
      mockUserRepository.getUserByUsername.mockResolvedValue({
        id: 'existing-id',
        name: 'existing',
        email: 'existing@other.com',
        role: 'USER' as UserRole
      });
      mockUserRepository.getUserByEmail.mockResolvedValue(undefined);

      await authService.handleSignup(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'Username already exists' });
      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
    });

    it('should return 409 when email already exists', async () => {
      mockRequest.body = { username: 'newuser', email: 'existing@example.com', password: 'password123' };
      mockUserRepository.getUserByUsername.mockResolvedValue(undefined);
      mockUserRepository.getUserByEmail.mockResolvedValue({
        id: 'existing-id',
        name: 'existing',
        email: 'existing@example.com',
        role: 'USER' as UserRole
      });

      await authService.handleSignup(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: false, error: 'Email already exists' });
      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
    });

    it('should create user, set session cookie, and return user on success', async () => {
      const newUser: User = {
        id: 'new-id',
        name: 'newuser',
        email: 'new@example.com',
        role: 'USER' as UserRole
      };
      mockRequest.body = { username: 'newuser', email: 'new@example.com', password: 'password123' };
      mockUserRepository.getUserByUsername.mockResolvedValue(undefined);
      mockUserRepository.getUserByEmail.mockResolvedValue(undefined);
      mockUserRepository.createUser.mockResolvedValue(newUser);

      await authService.handleSignup(mockRequest as Request, mockResponse as Response);

      expect(mockUserRepository.createUser).toHaveBeenCalledWith('newuser', 'new@example.com', 'password123', 'USER');
      expect(recordCreation).toHaveBeenCalledWith('192.168.1.1');
      expect(mockResponse.cookie).toHaveBeenCalledWith('sessionId', expect.any(String), expect.any(Object));
      expect(mockUserRepository.updateLastLoginAt).toHaveBeenCalledWith('new-id');
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { userId: newUser.id, username: newUser.name, role: newUser.role }
      });
    });

    it('should trim username and email before validation', async () => {
      const newUser: User = {
        id: 'new-id',
        name: 'trimmed',
        email: 'trimmed@example.com',
        role: 'USER' as UserRole
      };
      mockRequest.body = { username: '  trimmed  ', email: '  trimmed@example.com  ', password: 'password123' };
      mockUserRepository.getUserByUsername.mockResolvedValue(undefined);
      mockUserRepository.getUserByEmail.mockResolvedValue(undefined);
      mockUserRepository.createUser.mockResolvedValue(newUser);

      await authService.handleSignup(mockRequest as Request, mockResponse as Response);

      expect(mockUserRepository.createUser).toHaveBeenCalledWith('trimmed', 'trimmed@example.com', 'password123', 'USER');
    });
  });
});

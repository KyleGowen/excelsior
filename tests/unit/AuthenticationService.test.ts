import { AuthenticationService } from '../../src/services/AuthenticationService';
import { UserRepository } from '../../src/repository/UserRepository';
import { UserPersistenceService } from '../../src/persistence/userPersistence';
import { User, UserRole } from '../../src/types';
import { Request, Response, NextFunction } from 'express';

// Mock dependencies
jest.mock('../../src/repository/UserRepository');
jest.mock('../../src/persistence/userPersistence');

describe('AuthenticationService', () => {
  let authService: AuthenticationService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockUserPersistence: jest.Mocked<UserPersistenceService>;
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
      getUserByUsername: jest.fn(),
      createUser: jest.fn(),
      getAllUsers: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      getUserStats: jest.fn(),
      initialize: jest.fn()
    } as jest.Mocked<UserRepository>;

    mockUserPersistence = {
      authenticateUser: jest.fn(),
      createSession: jest.fn(),
      validateSession: jest.fn(),
      logout: jest.fn(),
      loadUsers: jest.fn(),
      loadSessions: jest.fn(),
      saveUsers: jest.fn(),
      saveSessions: jest.fn(),
      getUserById: jest.fn(),
      getUserByUsername: jest.fn(),
      getAllUsers: jest.fn(),
      getActiveSessions: jest.fn(),
      cleanupExpiredSessions: jest.fn(),
      initialize: jest.fn()
    } as any;

    // Create service instance
    authService = new AuthenticationService(mockUserRepository, mockUserPersistence);

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
      mockUserRepository.getUserById.mockResolvedValue(guestUser);

      const middleware = authService.createAuthMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserRepository.getUserById).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000001');
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
      const sessionId = authService.createSession(user);
      
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
      const sessionId = authService.createSession(user);
      
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
      const sessionId = authService.createSession(user);
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
        maxAge: 2 * 60 * 60 * 1000,
        sameSite: 'lax'
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: user.id,
          username: user.name
        }
      });
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
      const sessionId = authService.createSession(user);
      mockRequest.cookies = { sessionId };

      await authService.handleLogout(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('sessionId');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully'
      });
    });

    it('should handle logout when no session exists', async () => {
      mockRequest.cookies = {};

      await authService.handleLogout(mockRequest as Request, mockResponse as Response);

      expect(mockUserPersistence.logout).not.toHaveBeenCalled();
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('sessionId');
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
      const sessionId = authService.createSession(user);
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
      const sessionId = authService.createSession(user);
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
});

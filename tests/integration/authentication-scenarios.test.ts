import request from 'supertest';
import { UserPersistenceService } from '../../src/persistence/userPersistence';
import { AuthenticationService } from '../../src/services/AuthenticationService';
import { User, UserRole } from '../../src/types';
import { app, integrationTestUtils } from '../setup-integration';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';

describe('Authentication Scenarios Integration Tests', () => {
  let userPersistence: UserPersistenceService;
  let userRepository: any;
  let server: any;

  beforeAll(async () => {
    // Get test database
    const dataSource = DataSourceConfig.getInstance();
    userRepository = dataSource.getUserRepository();
    
    userPersistence = new UserPersistenceService();
    // Don't create a new authService - use the one from the server
    // authService = new AuthenticationService(userRepository, userPersistence);

    // Start the server on a different port for tests
    const PORT = process.env.TEST_PORT || 3002;
    server = app.listen(PORT, () => {
      console.log(`Test server listening on port ${PORT}`);
    });
  });

  afterAll(async () => {
    // Close the server first
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => {
          console.log('Test server closed');
          resolve();
        });
      });
    }
    
    // Clean up test data
    await integrationTestUtils.cleanupTestData();
  });

  describe('USER Role Authentication', () => {
    let testUser: User;
    let sessionId: string;

    beforeAll(async () => {
      // Create a test user with USER role
      testUser = await userRepository.createUser(
        'testuser',
        'testuser@example.com',
        'testuser', // Use same password for both creation and authentication
        'USER' as UserRole
      );
    });

    afterAll(async () => {
      // Clean up test user
      try {
        await userRepository.deleteUser(testUser.id);
      } catch (error) {
        // User might not exist, ignore error
      }
    });

    it('should successfully login as USER and validate session', async () => {
      // First, login to get a session
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testuser' // Assuming password is same as username for test users
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data).toBeDefined();
      expect(loginResponse.body.data.userId).toBe(testUser.id);
      expect(loginResponse.body.data.username).toBe('testuser');
      expect(loginResponse.headers['set-cookie']).toBeDefined();
      
      // Extract session ID from cookie
      const cookieHeader = loginResponse.headers['set-cookie'][0];
      const sessionMatch = cookieHeader.match(/sessionId=([^;]+)/);
      expect(sessionMatch).toBeDefined();
      sessionId = sessionMatch![1];

      // Now validate the session
      const validationResponse = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `sessionId=${sessionId}`);

      console.log('Session validation response:', {
        status: validationResponse.status,
        body: validationResponse.body,
        sessionId: sessionId
      });

      expect(validationResponse.status).toBe(200);
      expect(validationResponse.body.success).toBe(true);
      expect(validationResponse.body.data.id).toBe(testUser.id);
      expect(validationResponse.body.data.name).toBe('testuser');
    });

    it('should access protected USER routes', async () => {
      const response = await request(app)
        .get('/api/decks')
        .set('Cookie', `sessionId=${sessionId}`);

      expect(response.status).toBe(200);
    });

    it('should logout USER successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', `sessionId=${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should reject USER session after logout', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `sessionId=${sessionId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired session');
    });
  });

  describe('ADMIN Role Authentication', () => {
    let adminUser: User;
    let adminSessionId: string;

    beforeAll(async () => {
      // Find existing admin user (kyle)
      const users = await userRepository.getAllUsers();
      adminUser = users.find((u: User) => u.name === 'kyle')!;
      expect(adminUser).toBeDefined();
      expect(adminUser.role).toBe('ADMIN');
    });

    it('should successfully login as ADMIN', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'kyle',
          password: 'test'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.userId).toBe(adminUser.id);
      expect(response.body.data.username).toBe('kyle');
      expect(response.headers['set-cookie']).toBeDefined();
      
      // Extract session ID from cookie
      const cookieHeader = response.headers['set-cookie'][0];
      const sessionMatch = cookieHeader.match(/sessionId=([^;]+)/);
      expect(sessionMatch).toBeDefined();
      adminSessionId = sessionMatch![1];
    });

    it('should validate ADMIN session', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `sessionId=${adminSessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(adminUser.id);
      expect(response.body.data.username).toBe('kyle');
    });

    it('should access protected ADMIN routes', async () => {
      const response = await request(app)
        .get(`/users/${adminUser.id}/decks`)
        .set('Cookie', `sessionId=${adminSessionId}`);

      expect(response.status).toBe(200);
    });

    it('should logout ADMIN successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', `sessionId=${adminSessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  describe('GUEST Role Authentication', () => {
    let guestUser: User;
    let guestSessionId: string;

    beforeAll(async () => {
      // Find existing guest user
      const users = await userRepository.getAllUsers();
      guestUser = users.find((u: User) => u.name === 'guest')!;
      expect(guestUser).toBeDefined();
      expect(guestUser.role).toBe('GUEST');
    });

    it('should successfully login as GUEST', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'guest',
          password: 'guest'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.userId).toBe(guestUser.id);
      expect(response.body.data.username).toBe('guest');
      expect(response.headers['set-cookie']).toBeDefined();
      
      // Extract session ID from cookie
      const cookieHeader = response.headers['set-cookie'][0];
      const sessionMatch = cookieHeader.match(/sessionId=([^;]+)/);
      expect(sessionMatch).toBeDefined();
      guestSessionId = sessionMatch![1];
    });

    it('should validate GUEST session', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `sessionId=${guestSessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(guestUser.id);
      expect(response.body.data.username).toBe('guest');
    });

    it('should access protected GUEST routes', async () => {
      const response = await request(app)
        .get(`/users/${guestUser.id}/decks`)
        .set('Cookie', `sessionId=${guestSessionId}`);

      expect(response.status).toBe(200);
    });

    it('should logout GUEST successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', `sessionId=${guestSessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  describe('Authentication Middleware Integration', () => {
    let testUser: User;
    let sessionId: string;

    beforeAll(async () => {
      // Create a test user
      testUser = await userRepository.createUser(
        'middlewareuser',
        'middleware@example.com',
        'middlewareuser',
        'USER' as UserRole
      );

      // Login to get session
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'middlewareuser',
          password: 'middlewareuser'
        });

      const cookieHeader = loginResponse.headers['set-cookie'][0];
      const sessionMatch = cookieHeader.match(/sessionId=([^;]+)/);
      sessionId = sessionMatch![1];
    });

    afterAll(async () => {
      try {
        await userRepository.deleteUser(testUser.id);
      } catch (error) {
        // User might not exist, ignore error
      }
    });

    it('should allow access to guest routes', async () => {
      const response = await request(app)
        .get('/users/guest/decks/123');

      expect(response.status).toBe(200);
    });

    it('should allow access to own user routes with valid session', async () => {
      const response = await request(app)
        .get(`/users/${testUser.id}/decks`)
        .set('Cookie', `sessionId=${sessionId}`);

      expect(response.status).toBe(200);
    });

    it('should redirect to home for non-API routes without session', async () => {
      const response = await request(app)
        .get('/users/123/decks');

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/');
    });

    it('should return 401 for API routes without session', async () => {
      const response = await request(app)
        .get('/api/decks');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 401 for API routes with invalid session', async () => {
      const response = await request(app)
        .get('/api/decks')
        .set('Cookie', 'sessionId=invalid-session-id');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired session');
    });

    it('should return 401 for API routes when user not found', async () => {
      // Create a fake session for non-existent user
      const fakeSession = userPersistence.createSession({
        id: '00000000-0000-0000-0000-000000000000',
        name: 'fakeuser',
        email: 'fake@example.com',
        role: 'USER' as UserRole
      });

      const response = await request(app)
        .get('/api/decks')
        .set('Cookie', `sessionId=${fakeSession}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle login with missing username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Username and password are required');
    });

    it('should handle login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Username and password are required');
    });

    it('should handle login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid username or password');
    });

    it('should handle session validation without user', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not authenticated');
    });
  });

  describe('Session Management', () => {
    let testUser: User;
    let sessionId: string;

    beforeAll(async () => {
      // Create a test user
      testUser = await userRepository.createUser(
        'sessionuser',
        'session@example.com',
        'sessionuser',
        'USER' as UserRole
      );

      // Login to get session
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'sessionuser',
          password: 'sessionuser'
        });

      const cookieHeader = loginResponse.headers['set-cookie'][0];
      const sessionMatch = cookieHeader.match(/sessionId=([^;]+)/);
      sessionId = sessionMatch![1];
    });

    afterAll(async () => {
      try {
        await userRepository.deleteUser(testUser.id);
      } catch (error) {
        // User might not exist, ignore error
      }
    });

    it('should create valid session on login', () => {
      const session = userPersistence.validateSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.userId).toBe(testUser.id);
    });

    it('should maintain session across multiple requests', async () => {
      // First request
      const response1 = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `sessionId=${sessionId}`);

      expect(response1.status).toBe(200);

      // Second request
      const response2 = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `sessionId=${sessionId}`);

      expect(response2.status).toBe(200);
    });

    it('should destroy session on logout', async () => {
      // Verify session exists
      let session = userPersistence.validateSession(sessionId);
      expect(session).toBeDefined();

      // Logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', `sessionId=${sessionId}`);

      expect(response.status).toBe(200);

      // Verify session is destroyed
      session = userPersistence.validateSession(sessionId);
      expect(session).toBeNull();
    });

    it('should handle logout without session gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Cross-Role Access Control', () => {
    let userSessionId: string;
    let adminSessionId: string;
    let guestSessionId: string;

    beforeAll(async () => {
      // Login as different roles
      const userResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'testuser' });
      userSessionId = userResponse.headers['set-cookie'][0].match(/sessionId=([^;]+)/)![1];

      const adminResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'kyle', password: 'test' });
      adminSessionId = adminResponse.headers['set-cookie'][0].match(/sessionId=([^;]+)/)![1];

      const guestResponse = await request(app)
        .post('/api/auth/login')
        .send({ username: 'guest', password: 'guest' });
      guestSessionId = guestResponse.headers['set-cookie'][0].match(/sessionId=([^;]+)/)![1];
    });

    it('should allow users to access their own decks', async () => {
      const users = await userRepository.getAllUsers();
      const testUser = users.find((u: User) => u.name === 'testuser')!;

      const response = await request(app)
        .get(`/users/${testUser.id}/decks`)
        .set('Cookie', `sessionId=${userSessionId}`);

      expect(response.status).toBe(200);
    });

    it('should allow guests to access guest decks', async () => {
      const users = await userRepository.getAllUsers();
      const guestUser = users.find((u: User) => u.name === 'guest')!;

      const response = await request(app)
        .get(`/users/${guestUser.id}/decks`)
        .set('Cookie', `sessionId=${guestSessionId}`);

      expect(response.status).toBe(200);
    });

    it('should allow admins to access any user decks', async () => {
      const users = await userRepository.getAllUsers();
      const testUser = users.find((u: User) => u.name === 'testuser')!;

      const response = await request(app)
        .get(`/users/${testUser.id}/decks`)
        .set('Cookie', `sessionId=${adminSessionId}`);

      expect(response.status).toBe(200);
    });
  });
});

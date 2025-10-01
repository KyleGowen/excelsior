import { UserPersistenceService, LegacyUser, UserSession } from '../../src/persistence/userPersistence';
import { User } from '../../src/types';

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('UserPersistenceService', () => {
  let userPersistenceService: UserPersistenceService;

  beforeEach(() => {
    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();

    try {
      // Create service instance
      userPersistenceService = new UserPersistenceService();
      console.log('Service created successfully');
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('Basic Functionality', () => {
    it('should create service instance', () => {
      expect(userPersistenceService).toBeDefined();
    });

    it('should have getAllUsers method', () => {
      expect(typeof userPersistenceService.getAllUsers).toBe('function');
    });

    it('should have getActiveSessions method', () => {
      expect(typeof userPersistenceService.getActiveSessions).toBe('function');
    });

    it('should have authenticateUser method', () => {
      expect(typeof userPersistenceService.authenticateUser).toBe('function');
    });

    it('should have createSession method', () => {
      expect(typeof userPersistenceService.createSession).toBe('function');
    });

    it('should have validateSession method', () => {
      expect(typeof userPersistenceService.validateSession).toBe('function');
    });

    it('should have logout method', () => {
      expect(typeof userPersistenceService.logout).toBe('function');
    });

    it('should have getUserById method', () => {
      expect(typeof userPersistenceService.getUserById).toBe('function');
    });

    it('should have getUserByUsername method', () => {
      expect(typeof userPersistenceService.getUserByUsername).toBe('function');
    });

    it('should have cleanupExpiredSessions method', () => {
      expect(typeof userPersistenceService.cleanupExpiredSessions).toBe('function');
    });
  });

  describe('Method Return Types', () => {
    it('should return array from getAllUsers', () => {
      try {
        const users = userPersistenceService.getAllUsers();
        console.log('getAllUsers result:', users, typeof users);
        expect(Array.isArray(users)).toBe(true);
      } catch (error) {
        console.error('Error in getAllUsers test:', error);
        throw error;
      }
    });

    it('should return array from getActiveSessions', () => {
      try {
        const sessions = userPersistenceService.getActiveSessions();
        console.log('getActiveSessions result:', sessions, typeof sessions);
        expect(Array.isArray(sessions)).toBe(true);
      } catch (error) {
        console.error('Error in getActiveSessions test:', error);
        throw error;
      }
    });

    it('should return null for non-existent user', () => {
      try {
        const user = userPersistenceService.getUserById('nonexistent');
        console.log('getUserById result:', user, typeof user);
        expect(user).toBeNull();
      } catch (error) {
        console.error('Error in getUserById test:', error);
        throw error;
      }
    });

    it('should return null for non-existent username', () => {
      try {
        const user = userPersistenceService.getUserByUsername('nonexistent');
        console.log('getUserByUsername result:', user, typeof user);
        expect(user).toBeNull();
      } catch (error) {
        console.error('Error in getUserByUsername test:', error);
        throw error;
      }
    });

    it('should return null for invalid authentication', () => {
      try {
        const user = userPersistenceService.authenticateUser('invalid', 'invalid');
        console.log('authenticateUser result:', user, typeof user);
        expect(user).toBeNull();
      } catch (error) {
        console.error('Error in authenticateUser test:', error);
        throw error;
      }
    });

    it('should return null for non-existent session', () => {
      try {
        const session = userPersistenceService.validateSession('nonexistent');
        console.log('validateSession result:', session, typeof session);
        expect(session).toBeNull();
      } catch (error) {
        console.error('Error in validateSession test:', error);
        throw error;
      }
    });

    it('should return false for logout of non-existent session', () => {
      try {
        const result = userPersistenceService.logout('nonexistent');
        console.log('logout result:', result, typeof result);
        expect(result).toBe(false);
      } catch (error) {
        console.error('Error in logout test:', error);
        throw error;
      }
    });

    it('should return 0 for cleanup when no expired sessions', () => {
      try {
        const count = userPersistenceService.cleanupExpiredSessions();
        console.log('cleanupExpiredSessions result:', count, typeof count);
        expect(count).toBe(0);
      } catch (error) {
        console.error('Error in cleanupExpiredSessions test:', error);
        throw error;
      }
    });
  });

  describe('Session Management', () => {
    it('should create session for valid user', () => {
      try {
        const user: User = {
          id: 'user-1',
          name: 'testuser',
          email: 'test@example.com',
          role: 'USER'
        };

        const sessionId = userPersistenceService.createSession(user);
        console.log('createSession result:', sessionId, typeof sessionId);
        
        expect(sessionId).toBeDefined();
        expect(typeof sessionId).toBe('string');
        expect(sessionId).toMatch(/^sess_[a-z0-9]+_[a-z0-9]+$/);
      } catch (error) {
        console.error('Error in createSession test:', error);
        throw error;
      }
    });

    it('should validate created session', () => {
      try {
        const user: User = {
          id: 'user-1',
          name: 'testuser',
          email: 'test@example.com',
          role: 'USER'
        };

        const sessionId = userPersistenceService.createSession(user);
        const session = userPersistenceService.validateSession(sessionId);
        console.log('validateSession result:', session, typeof session);
        
        expect(session).toBeDefined();
        expect(session?.userId).toBe('user-1');
        expect(session?.username).toBe('testuser');
      } catch (error) {
        console.error('Error in validateSession test:', error);
        throw error;
      }
    });

    it('should logout created session', () => {
      try {
        const user: User = {
          id: 'user-1',
          name: 'testuser',
          email: 'test@example.com',
          role: 'USER'
        };

        const sessionId = userPersistenceService.createSession(user);
        const result = userPersistenceService.logout(sessionId);
        console.log('logout result:', result, typeof result);
        
        expect(result).toBe(true);
      } catch (error) {
        console.error('Error in logout test:', error);
        throw error;
      }
    });
  });

  describe('Data Validation', () => {
    it('should handle empty username and password', () => {
      try {
        const result1 = userPersistenceService.authenticateUser('', '');
        const result2 = userPersistenceService.authenticateUser('testuser', '');
        const result3 = userPersistenceService.authenticateUser('', 'password123');
        
        console.log('authenticateUser results:', { result1, result2, result3 });
        
        expect(result1).toBeNull();
        expect(result2).toBeNull();
        expect(result3).toBeNull();
      } catch (error) {
        console.error('Error in authenticateUser test:', error);
        throw error;
      }
    });

    it('should generate unique session IDs', () => {
      try {
        const user: User = {
          id: 'user-1',
          name: 'testuser',
          email: 'test@example.com',
          role: 'USER'
        };

        const sessionId1 = userPersistenceService.createSession(user);
        const sessionId2 = userPersistenceService.createSession(user);
        
        console.log('session IDs:', { sessionId1, sessionId2 });
        
        expect(sessionId1).not.toBe(sessionId2);
        expect(sessionId1).toMatch(/^sess_[a-z0-9]+_[a-z0-9]+$/);
        expect(sessionId2).toMatch(/^sess_[a-z0-9]+_[a-z0-9]+$/);
      } catch (error) {
        console.error('Error in session ID test:', error);
        throw error;
      }
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete user lifecycle', () => {
      try {
        const user: User = {
          id: 'user-1',
          name: 'testuser',
          email: 'test@example.com',
          role: 'USER'
        };

        // 1. Create session
        const sessionId = userPersistenceService.createSession(user);
        console.log('createSession result:', sessionId);
        expect(sessionId).toBeTruthy();

        // 2. Validate session
        const session = userPersistenceService.validateSession(sessionId);
        console.log('validateSession result:', session);
        expect(session).toBeTruthy();

        // 3. Logout
        const logoutResult = userPersistenceService.logout(sessionId);
        console.log('logout result:', logoutResult);
        expect(logoutResult).toBe(true);

        // 4. Verify session is gone
        const expiredSession = userPersistenceService.validateSession(sessionId);
        console.log('expiredSession result:', expiredSession);
        expect(expiredSession).toBeNull();
      } catch (error) {
        console.error('Error in lifecycle test:', error);
        throw error;
      }
    });

    it('should handle multiple sessions', () => {
      try {
        const user: User = {
          id: 'user-1',
          name: 'testuser',
          email: 'test@example.com',
          role: 'USER'
        };

        const session1 = userPersistenceService.createSession(user);
        const session2 = userPersistenceService.createSession(user);
        
        console.log('session IDs:', { session1, session2 });
        console.log('active sessions:', userPersistenceService.getActiveSessions());
        
        expect(session1).not.toBe(session2);
        expect(userPersistenceService.getActiveSessions()).toHaveLength(2);
        
        // Cleanup
        userPersistenceService.logout(session1);
        userPersistenceService.logout(session2);
        
        expect(userPersistenceService.getActiveSessions()).toHaveLength(0);
      } catch (error) {
        console.error('Error in multiple sessions test:', error);
        throw error;
      }
    });
  });
});
import { Pool } from 'pg';
import { UserPersistenceService } from '../../src/persistence/userPersistence';
import { PostgreSQLUserRepository } from '../../src/database/PostgreSQLUserRepository';
import { User, UserRole } from '../../src/types';

describe('Authentication Behavior Tests', () => {
  let pool: Pool;
  let userPersistence: UserPersistenceService;
  let userRepository: PostgreSQLUserRepository;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: 'postgresql://postgres:password@localhost:1337/overpower'
    });
    
    userPersistence = new UserPersistenceService();
    userRepository = new PostgreSQLUserRepository(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('User Authentication', () => {
    it('should authenticate valid user with database repository', async () => {
      const user = await userRepository.authenticateUser('kyle', 'Overpower2025!');
      
      expect(user).toBeDefined();
      expect(user?.name).toBe('kyle');
      expect(user?.id).toBeDefined();
      expect(user?.role).toBe('ADMIN');
    });

    it('should authenticate guest user with database repository', async () => {
      const user = await userRepository.authenticateUser('Test-Guest', 'test-guest');
      
      expect(user).toBeDefined();
      expect(user?.name).toBe('Test-Guest');
      expect(user?.id).toBeDefined();
      expect(user?.role).toBe('GUEST');
    });

    it('should reject invalid credentials with database repository', async () => {
      const user = await userRepository.authenticateUser('invalid', 'invalid');
      
      expect(user).toBeUndefined();
    });

    it('should authenticate valid user with persistence service', async () => {
      const user = userPersistence.authenticateUser('kyle', 'test');
      
      expect(user).toBeDefined();
      expect(user?.name).toBe('kyle');
      expect(user?.id).toBeDefined();
      expect(user?.role).toBe('USER');
    });

    it('should reject invalid credentials with persistence service', async () => {
      const user = userPersistence.authenticateUser('invalid', 'invalid');
      
      expect(user).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should create session for authenticated user', () => {
      const user: User = { id: 'test-user-id', name: 'test-user', email: 'test@example.com', role: 'USER' as UserRole };
      const sessionId = userPersistence.createSession(user);
      
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('should validate existing session', () => {
      const user: User = { id: 'test-user-id', name: 'test-user', email: 'test@example.com', role: 'USER' as UserRole };
      const sessionId = userPersistence.createSession(user);
      const session = userPersistence.validateSession(sessionId);
      
      expect(session).toBeDefined();
      expect(session?.userId).toBe('test-user-id');
    });

    it('should reject invalid session', () => {
      const session = userPersistence.validateSession('invalid-session-id');
      
      expect(session).toBeNull();
    });

    it('should logout user by destroying session', () => {
      const user: User = { id: 'test-user-id', name: 'test-user', email: 'test@example.com', role: 'USER' as UserRole };
      const sessionId = userPersistence.createSession(user);
      
      // Verify session exists
      expect(userPersistence.validateSession(sessionId)).toBeDefined();
      
      // Logout
      userPersistence.logout(sessionId);
      
      // Verify session is destroyed
      expect(userPersistence.validateSession(sessionId)).toBeNull();
    });
  });

  describe('User Data Retrieval', () => {
    it('should get user by ID from database', async () => {
      // First get a user to test with
      const users = await userRepository.getAllUsers();
      const testUser = users.find(u => u.name === 'kyle');
      
      expect(testUser).toBeDefined();
      
      if (testUser) {
        const user = await userRepository.getUserById(testUser.id);
        expect(user).toBeDefined();
        expect(user?.name).toBe('kyle');
        expect(user?.id).toBe(testUser.id);
      }
    });

    it('should get user by username from database', async () => {
      const user = await userRepository.getUserByUsername('kyle');
      
      expect(user).toBeDefined();
      expect(user?.name).toBe('kyle');
      expect(user?.id).toBeDefined();
    });

    it('should return undefined for non-existent user', async () => {
      const user = await userRepository.getUserById('00000000-0000-0000-0000-000000000000');
      
      expect(user).toBeUndefined();
    });
  });

  describe('Guest User Handling', () => {
    it('should have guest user in database', async () => {
      // First authenticate to get the actual guest user ID
      const guestUser = await userRepository.authenticateUser('Test-Guest', 'test-guest');
      
      expect(guestUser).toBeDefined();
      expect(guestUser?.name).toBe('Test-Guest');
      expect(guestUser?.role).toBe('GUEST');
      
      // Now test getting by ID
      if (guestUser) {
        const userById = await userRepository.getUserById(guestUser.id);
        expect(userById).toBeDefined();
        expect(userById?.name).toBe('Test-Guest');
        expect(userById?.role).toBe('GUEST');
      }
    });

    it('should authenticate guest user', async () => {
      const user = await userRepository.authenticateUser('Test-Guest', 'test-guest');
      
      expect(user).toBeDefined();
      expect(user?.name).toBe('Test-Guest');
      expect(user?.role).toBe('GUEST');
    });
  });
});

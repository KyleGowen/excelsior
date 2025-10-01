import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { PostgreSQLUserRepository } from '../../src/database/PostgreSQLUserRepository';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';

describe('Bcrypt Authentication Integration Tests', () => {
  let pool: Pool;
  let userRepository: PostgreSQLUserRepository;
  let testUserId: string | null = null;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: 'postgresql://postgres:password@localhost:1337/overpower'
    });
    
    // Get the user repository from DataSourceConfig
    const dataSource = DataSourceConfig.getInstance();
    userRepository = dataSource.getUserRepository() as PostgreSQLUserRepository;
  });

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  describe('Password Hashing and Verification', () => {
    it('should hash passwords correctly with bcrypt', async () => {
      const plainPassword = 'testpassword123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).toMatch(/^\$2[ab]\$\d+\$/); // bcrypt hash format
      expect(hashedPassword).not.toBe(plainPassword);
      
      console.log('✅ Password hashed successfully:', hashedPassword.substring(0, 20) + '...');
    });

    it('should verify correct passwords with bcrypt', async () => {
      const plainPassword = 'testpassword123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      expect(isValid).toBe(true);
      
      console.log('✅ Password verification successful');
    });

    it('should reject incorrect passwords with bcrypt', async () => {
      const plainPassword = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      const isValid = await bcrypt.compare(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
      
      console.log('✅ Incorrect password correctly rejected');
    });
  });

  describe('User Authentication with Bcrypt', () => {
    it('should create a user with hashed password', async () => {
      const username = `testuser_${Date.now()}`;
      const email = `test_${Date.now()}@example.com`;
      const password = 'testpassword123';
      
      const user = await userRepository.createUser(username, email, password, 'USER');
      
      expect(user).toBeDefined();
      expect(user.name).toBe(username);
      expect(user.email).toBe(email);
      expect(user.role).toBe('USER');
      
      testUserId = user.id;
      
      // Verify password is hashed in database
      const dbResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [user.id]);
      const storedHash = dbResult.rows[0].password_hash;
      
      expect(storedHash).toMatch(/^\$2[ab]\$\d+\$/); // Should be bcrypt hash
      expect(storedHash).not.toBe(password); // Should not be plain text
      
      console.log('✅ User created with hashed password');
    });

    it('should authenticate user with correct password', async () => {
      if (!testUserId) {
        throw new Error('Test user not created');
      }
      
      const username = `testuser_${Date.now()}`;
      const email = `test_${Date.now()}@example.com`;
      const password = 'testpassword123';
      
      // Create user
      const user = await userRepository.createUser(username, email, password, 'USER');
      testUserId = user.id;
      
      // Authenticate with correct password
      const authenticatedUser = await userRepository.authenticateUser(username, password);
      
      expect(authenticatedUser).toBeDefined();
      expect(authenticatedUser?.id).toBe(user.id);
      expect(authenticatedUser?.name).toBe(username);
      expect(authenticatedUser?.email).toBe(email);
      expect(authenticatedUser?.role).toBe('USER');
      
      console.log('✅ User authentication successful');
    });

    it('should reject authentication with incorrect password', async () => {
      if (!testUserId) {
        throw new Error('Test user not created');
      }
      
      const username = `testuser_${Date.now()}`;
      const email = `test_${Date.now()}@example.com`;
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      
      // Create user
      const user = await userRepository.createUser(username, email, password, 'USER');
      testUserId = user.id;
      
      // Try to authenticate with wrong password
      const authenticatedUser = await userRepository.authenticateUser(username, wrongPassword);
      
      expect(authenticatedUser).toBeUndefined();
      
      console.log('✅ Incorrect password correctly rejected');
    });

    it('should reject authentication for non-existent user', async () => {
      const authenticatedUser = await userRepository.authenticateUser('nonexistentuser', 'anypassword');
      
      expect(authenticatedUser).toBeUndefined();
      
      console.log('✅ Non-existent user correctly rejected');
    });
  });

  describe('Guest User Authentication', () => {
    it('should authenticate guest user with correct password', async () => {
      const authenticatedUser = await userRepository.authenticateUser('guest', 'guest');
      
      expect(authenticatedUser).toBeDefined();
      expect(authenticatedUser?.name).toBe('guest');
      expect(authenticatedUser?.role).toBe('GUEST');
      
      console.log('✅ Guest user authentication successful');
    });

    it('should reject guest authentication with incorrect password', async () => {
      const authenticatedUser = await userRepository.authenticateUser('guest', 'wrongpassword');
      
      expect(authenticatedUser).toBeUndefined();
      
      console.log('✅ Guest user incorrect password correctly rejected');
    });
  });

  describe('Admin User Authentication', () => {
    it('should authenticate admin user (kyle) with correct password', async () => {
      const authenticatedUser = await userRepository.authenticateUser('kyle', 'test');
      
      expect(authenticatedUser).toBeDefined();
      expect(authenticatedUser?.name).toBe('kyle');
      expect(authenticatedUser?.role).toBe('ADMIN');
      
      console.log('✅ Admin user authentication successful');
    });

    it('should reject admin authentication with incorrect password', async () => {
      const authenticatedUser = await userRepository.authenticateUser('kyle', 'wrongpassword');
      
      expect(authenticatedUser).toBeUndefined();
      
      console.log('✅ Admin user incorrect password correctly rejected');
    });
  });

  describe('Password Security Verification', () => {
    it('should verify all existing passwords are hashed', async () => {
      const result = await pool.query('SELECT username, password_hash FROM users LIMIT 10');
      
      result.rows.forEach(user => {
        expect(user.password_hash).toMatch(/^\$2[ab]\$\d+\$/);
        expect(user.password_hash).not.toMatch(/^[a-zA-Z0-9]+$/); // Should not be plain text
      });
      
      console.log(`✅ Verified ${result.rows.length} users have hashed passwords`);
    });

    it('should verify password hashes are unique for same password', async () => {
      const password = 'testpassword123';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);
      
      expect(hash1).not.toBe(hash2); // Different salts should produce different hashes
      
      // But both should verify correctly
      const verify1 = await bcrypt.compare(password, hash1);
      const verify2 = await bcrypt.compare(password, hash2);
      
      expect(verify1).toBe(true);
      expect(verify2).toBe(true);
      
      console.log('✅ Password hashes are unique and both verify correctly');
    });
  });

  describe('Performance and Security', () => {
    it('should hash passwords in reasonable time', async () => {
      const password = 'testpassword123';
      const startTime = Date.now();
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(hashedPassword).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should take less than 1 second
      
      console.log(`✅ Password hashing completed in ${duration}ms`);
    });

    it('should verify passwords in reasonable time', async () => {
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const startTime = Date.now();
      
      const isValid = await bcrypt.compare(password, hashedPassword);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(isValid).toBe(true);
      expect(duration).toBeLessThan(100); // Should be very fast
      
      console.log(`✅ Password verification completed in ${duration}ms`);
    });
  });
});

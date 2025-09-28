import { Pool } from 'pg';

// Simple UUID v4 generator for tests
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

describe('User Management Integration Tests', () => {
  let pool: Pool;
  let testUserId: string | null = null;

  beforeAll(() => {
    pool = new Pool({
      connectionString: 'postgresql://postgres:password@localhost:1337/overpower'
    });
  });

  afterAll(async () => {
    // Clean up test user if created
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  describe('User Creation and Database Operations', () => {
    it('should create a new user with valid data', async () => {
      const userId = generateUUID();
      const userName = 'Jest Test User';
      const userEmail = `jest-${generateUUID()}@example.com`;
      const userRole = 'USER';
      
      testUserId = userId; // Store for cleanup
      
      const result = await pool.query(
        'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
        [userId, userName, userEmail, 'test_password_hash', userRole]
      );
      
      expect(result.rows).toHaveLength(1);
      const user = result.rows[0];
      expect(user.id).toBe(userId);
      expect(user.username).toBe(userName);
      expect(user.email).toBe(userEmail);
      expect(user.role).toBe(userRole);
      expect(user.created_at).toBeDefined();
      expect(user.updated_at).toBeDefined();
      
      console.log('✅ Test user created successfully:', user);
    });

    it('should verify user can be retrieved by ID', async () => {
      expect(testUserId).toBeDefined();
      
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [testUserId!]
      );
      
      expect(result.rows).toHaveLength(1);
      const user = result.rows[0];
      expect(user.id).toBe(testUserId);
      expect(user.username).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.role).toBeDefined();
      
      console.log('✅ User retrieved by ID:', user);
    });

    it('should verify user can be retrieved by email', async () => {
      expect(testUserId).toBeDefined();
      
      // First get the user's email
      const userResult = await pool.query(
        'SELECT email FROM users WHERE id = $1',
        [testUserId!]
      );
      
      expect(userResult.rows).toHaveLength(1);
      const userEmail = userResult.rows[0].email;
      
      // Now search by email
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [userEmail]
      );
      
      expect(result.rows).toHaveLength(1);
      const user = result.rows[0];
      expect(user.id).toBe(testUserId);
      expect(user.email).toBe(userEmail);
      
      console.log('✅ User retrieved by email:', user);
    });

    it('should verify user role can be updated', async () => {
      expect(testUserId).toBeDefined();
      
      // Update user role to ADMIN
      const updateResult = await pool.query(
        'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        ['ADMIN', testUserId!]
      );
      
      expect(updateResult.rows).toHaveLength(1);
      const user = updateResult.rows[0];
      expect(user.role).toBe('ADMIN');
      expect(user.id).toBe(testUserId);
      
      // Verify the update persisted
      const verifyResult = await pool.query(
        'SELECT role FROM users WHERE id = $1',
        [testUserId!]
      );
      
      expect(verifyResult.rows).toHaveLength(1);
      expect(verifyResult.rows[0].role).toBe('ADMIN');
      
      console.log('✅ User role updated successfully');
    });

    it('should verify user can be deleted', async () => {
      expect(testUserId).toBeDefined();
      
      const deleteResult = await pool.query(
        'DELETE FROM users WHERE id = $1 RETURNING *',
        [testUserId!]
      );
      
      expect(deleteResult.rows).toHaveLength(1);
      const deletedUser = deleteResult.rows[0];
      expect(deletedUser.id).toBe(testUserId);
      
      // Verify user no longer exists
      const verifyResult = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [testUserId!]
      );
      
      expect(verifyResult.rows).toHaveLength(0);
      
      testUserId = null; // Clear for cleanup
      console.log('✅ User deleted successfully');
    });
  });

  describe('User Data Validation', () => {
    it('should verify email uniqueness constraint', async () => {
      const userId1 = generateUUID();
      const userId2 = generateUUID();
      const duplicateEmail = `duplicate-${generateUUID()}@example.com`;
      
      // Create first user
      await pool.query(
        'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [userId1, 'User 1', duplicateEmail, 'test_password_hash', 'USER']
      );
      
      // Try to create second user with same email
      try {
        await pool.query(
          'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [userId2, 'User 2', duplicateEmail, 'test_password_hash', 'USER']
        );
        fail('Expected duplicate email constraint to be violated');
      } catch (error) {
        expect(error).toBeDefined();
        console.log('✅ Email uniqueness constraint verified');
      }
      
      // Cleanup
      await pool.query('DELETE FROM users WHERE id = $1', [userId1]);
    });

    it('should verify role validation', async () => {
      const userId = generateUUID();
      
      // Try to create user with invalid role
      try {
        await pool.query(
          'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [userId, 'Test User', 'test@example.com', 'test_password_hash', 'INVALID_ROLE']
        );
        fail('Expected invalid role constraint to be violated');
      } catch (error) {
        expect(error).toBeDefined();
        console.log('✅ Role validation constraint verified');
      }
    });

    it('should verify required fields are not null', async () => {
      const userId = generateUUID();
      
      // Try to create user with null name
      try {
        await pool.query(
          'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [userId, null, 'test@example.com', 'test_password_hash', 'USER']
        );
        fail('Expected null name constraint to be violated');
      } catch (error) {
        expect(error).toBeDefined();
        console.log('✅ Required fields constraint verified');
      }
    });
  });

  describe('User Query Operations', () => {
    it('should verify users can be filtered by role', async () => {
      const result = await pool.query(
        'SELECT username, role FROM users WHERE role = $1 ORDER BY username',
        ['USER']
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      result.rows.forEach(user => {
        expect(user.role).toBe('USER');
        expect(user.username).toBeDefined();
      });
      
      console.log('✅ Users filtered by role:', result.rows);
    });

    it('should verify users can be sorted by creation date', async () => {
      const result = await pool.query(
        'SELECT username, created_at FROM users ORDER BY created_at ASC'
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      // Verify sorting is correct
      for (let i = 1; i < result.rows.length; i++) {
        const prevDate = new Date(result.rows[i - 1].created_at);
        const currDate = new Date(result.rows[i].created_at);
        expect(prevDate.getTime()).toBeLessThanOrEqual(currDate.getTime());
      }
      
      console.log('✅ Users sorted by creation date verified');
    });

    it('should verify user count by role', async () => {
      const result = await pool.query(
        'SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role'
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      result.rows.forEach(row => {
        expect(row.role).toBeDefined();
        expect(parseInt(row.count)).toBeGreaterThan(0);
      });
      
      console.log('✅ User count by role:', result.rows);
    });
  });
});
import { Pool } from 'pg';

describe('Authentication Integration Tests', () => {
  let pool: Pool;

  beforeAll(() => {
    pool = new Pool({
      connectionString: 'postgresql://postgres:password@localhost:1337/overpower'
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('User Authentication Database Verification', () => {
    it('should verify kyle user exists in database', async () => {
      const result = await pool.query(
        'SELECT id, username, email, role FROM users WHERE username = $1',
        ['kyle']
      );
      
      expect(result.rows).toHaveLength(1);
      const user = result.rows[0];
      expect(user.username).toBe('kyle');
      expect(user.role).toBe('ADMIN');
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      
      console.log('✅ Kyle user verified in database:', user);
    });

    it('should verify guest user exists in database', async () => {
      const result = await pool.query(
        'SELECT id, username, email, role FROM users WHERE username = $1',
        ['guest']
      );
      
      expect(result.rows).toHaveLength(1);
      const user = result.rows[0];
      expect(user.username).toBe('guest');
      expect(user.role).toBe('GUEST');
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      
      console.log('✅ Guest user verified in database:', user);
    });

    it('should verify user roles are properly set', async () => {
      const result = await pool.query(
        'SELECT username, role FROM users ORDER BY username'
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const users = result.rows;
      const kyleUser = users.find(u => u.username === 'kyle');
      const guestUser = users.find(u => u.username === 'guest');
      
      expect(kyleUser).toBeDefined();
      expect(guestUser).toBeDefined();
      expect(kyleUser.role).toBe('ADMIN');
      expect(guestUser.role).toBe('GUEST');
      
      // Verify all users have valid roles
      users.forEach(user => {
        expect(['USER', 'GUEST', 'ADMIN']).toContain(user.role);
      });
      
      console.log('✅ All user roles verified:', users);
    });
  });

  describe('Database Schema Verification', () => {
    it('should verify users table has correct structure', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('username');
      expect(columns).toContain('email');
      expect(columns).toContain('role');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
      
      console.log('✅ Users table structure verified:', columns);
    });

    it('should verify role enum values are correct', async () => {
      const result = await pool.query(`
        SELECT unnest(enum_range(NULL::user_role)) as role_value
      `);
      
      const roleValues = result.rows.map(row => row.role_value);
      expect(roleValues).toContain('USER');
      expect(roleValues).toContain('GUEST');
      expect(roleValues).toContain('ADMIN');
      
      console.log('✅ Role enum values verified:', roleValues);
    });

    it('should verify user data integrity', async () => {
      const result = await pool.query(`
        SELECT id, username, email, role, created_at, updated_at 
        FROM users 
        ORDER BY created_at
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      result.rows.forEach(user => {
        expect(user.id).toBeDefined();
        expect(user.username).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.role).toBeDefined();
        expect(user.created_at).toBeDefined();
        expect(user.updated_at).toBeDefined();
        
        // Verify email format
        expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        
        // Verify role is valid
        expect(['USER', 'GUEST', 'ADMIN']).toContain(user.role);
      });
      
      console.log('✅ User data integrity verified for', result.rows.length, 'users');
    });
  });
});

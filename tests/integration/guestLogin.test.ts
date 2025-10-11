import { Pool } from 'pg';

describe('Guest Login Integration Tests', () => {
  let pool: Pool;

  beforeAll(() => {
    pool = new Pool({
      connectionString: 'process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower''
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Guest User Database Verification', () => {
    it('should verify guest user exists with correct properties', async () => {
      const result = await pool.query(
        'SELECT id, username, email, role, created_at FROM users WHERE username = $1',
        ['Test-Guest']
      );
      
      expect(result.rows).toHaveLength(1);
      const guestUser = result.rows[0];
      expect(guestUser.username).toBe('Test-Guest');
      expect(guestUser.role).toBe('GUEST');
      expect(guestUser.id).toBeDefined();
      expect(guestUser.email).toBeDefined();
      expect(guestUser.created_at).toBeDefined();
      
      console.log('✅ Guest user verified in database:', guestUser);
    });

    it('should verify guest user has correct role permissions', async () => {
      const result = await pool.query(
        'SELECT role FROM users WHERE username = $1',
        ['Test-Guest']
      );
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].role).toBe('GUEST');
      
      // Verify GUEST role is different from USER role
      const userResult = await pool.query(
        'SELECT role FROM users WHERE username = $1',
        ['kyle']
      );
      
      expect(userResult.rows).toHaveLength(1);
      expect(userResult.rows[0].role).toBe('ADMIN');
      expect(result.rows[0].role).not.toBe(userResult.rows[0].role);
      
      console.log('✅ Guest role permissions verified');
    });

    it('should verify guest user can be identified uniquely', async () => {
      const result = await pool.query(
        'SELECT id, username, email FROM users WHERE role = $1',
        ['GUEST']
      );
      
      expect(result.rows.length).toBeGreaterThanOrEqual(1);
      
      // Verify the main guest user exists
      const mainGuest = result.rows.find(user => user.username === 'guest');
      expect(mainGuest).toBeDefined();
      expect(mainGuest.id).toBeDefined();
      expect(mainGuest.email).toBeDefined();
      
      // Verify all returned users have valid data
      result.rows.forEach(user => {
        expect(user.id).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.username).toBeDefined();
      });
      
      console.log('✅ Guest user uniqueness verified');
    });
  });

  describe('Guest User Data Integrity', () => {
    it('should verify guest user has valid email format', async () => {
      const result = await pool.query(
        'SELECT email FROM users WHERE username = $1',
        ['Test-Guest']
      );
      
      expect(result.rows).toHaveLength(1);
      const email = result.rows[0].email;
      expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      
      console.log('✅ Guest user email format verified:', email);
    });

    it('should verify guest user creation timestamp is valid', async () => {
      const result = await pool.query(
        'SELECT created_at FROM users WHERE username = $1',
        ['Test-Guest']
      );
      
      expect(result.rows).toHaveLength(1);
      const createdAt = new Date(result.rows[0].created_at);
      expect(createdAt).toBeInstanceOf(Date);
      expect(createdAt.getTime()).not.toBeNaN();
      
      // Verify it's not in the future
      expect(createdAt.getTime()).toBeLessThanOrEqual(Date.now());
      
      console.log('✅ Guest user creation timestamp verified:', createdAt);
    });

    it('should verify guest user has unique ID', async () => {
      const result = await pool.query(
        'SELECT id FROM users WHERE username = $1',
        ['Test-Guest']
      );
      
      expect(result.rows).toHaveLength(1);
      const guestId = result.rows[0].id;
      expect(guestId).toBeDefined();
      expect(typeof guestId).toBe('string');
      expect(guestId.length).toBeGreaterThan(0);
      
      // Verify it's different from other users
      const allUsersResult = await pool.query('SELECT id FROM users');
      const allIds = allUsersResult.rows.map(row => row.id);
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length); // All IDs should be unique
      
      console.log('✅ Guest user unique ID verified:', guestId);
    });
  });

  describe('Guest Role Validation', () => {
    it('should verify GUEST role is properly defined in enum', async () => {
      const result = await pool.query(
        'SELECT unnest(enum_range(NULL::user_role)) as role_value'
      );
      
      const roleValues = result.rows.map(row => row.role_value);
      expect(roleValues).toContain('GUEST');
      expect(roleValues).toContain('USER');
      expect(roleValues).toContain('ADMIN');
      
      console.log('✅ GUEST role enum verified:', roleValues);
    });

    it('should verify guest user cannot have other roles', async () => {
      const result = await pool.query(
        'SELECT username, role FROM users WHERE username = $1',
        ['Test-Guest']
      );
      
      expect(result.rows).toHaveLength(1);
      const guestRole = result.rows[0].role;
      expect(guestRole).toBe('GUEST');
      expect(guestRole).not.toBe('USER');
      expect(guestRole).not.toBe('ADMIN');
      
      console.log('✅ Guest role exclusivity verified');
    });

    it('should verify guest user data consistency', async () => {
      const result = await pool.query(
        'SELECT id, username, email, role, created_at, updated_at FROM users WHERE username = $1',
        ['Test-Guest']
      );
      
      expect(result.rows).toHaveLength(1);
      const guest = result.rows[0];
      
      // Verify all required fields are present and valid
      expect(guest.id).toBeDefined();
        expect(guest.username).toBe('Test-Guest');
      expect(guest.email).toBeDefined();
      expect(guest.role).toBe('GUEST');
      expect(guest.created_at).toBeDefined();
      expect(guest.updated_at).toBeDefined();
      
      // Verify timestamps are valid
      const createdAt = new Date(guest.created_at);
      const updatedAt = new Date(guest.updated_at);
      expect(createdAt.getTime()).not.toBeNaN();
      expect(updatedAt.getTime()).not.toBeNaN();
      
      console.log('✅ Guest user data consistency verified');
    });
  });
});
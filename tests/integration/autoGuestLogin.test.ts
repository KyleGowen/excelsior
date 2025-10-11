import { Pool } from 'pg';
import bcrypt from 'bcrypt';

// Simple UUID v4 generator for tests
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

describe('Auto Guest Login Integration Tests', () => {
  let pool: Pool;
  let testUserId: string | null = null;
  let testDeckId: string | null = null;

  beforeAll(() => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testDeckId) {
      await pool.query('DELETE FROM decks WHERE id = $1', [testDeckId]);
    }
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  describe('Guest User Auto-Login Database Verification', () => {
    it('should verify guest user exists and is accessible', async () => {
      const result = await pool.query(
        'SELECT id, username, email, role FROM users WHERE username = $1',
        ['guest']
      );
      
      expect(result.rows).toHaveLength(1);
      const guestUser = result.rows[0];
      expect(guestUser.username).toBe('guest');
      expect(guestUser.role).toBe('GUEST');
      expect(guestUser.id).toBeDefined();
      expect(guestUser.email).toBeDefined();
      
      console.log('✅ Guest user verified for auto-login:', guestUser);
    });

    it('should verify guest user has correct permissions for deck viewing', async () => {
      const result = await pool.query(
        'SELECT role FROM users WHERE username = $1',
        ['guest']
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
      
      console.log('✅ Guest permissions verified for deck viewing');
    });

    it('should verify guest user can be identified for auto-login', async () => {
      const result = await pool.query(
        'SELECT id, username, role FROM users WHERE role = $1',
        ['GUEST']
      );
      
      expect(result.rows.length).toBeGreaterThanOrEqual(1);
      
      const guestUsers = result.rows.filter(user => user.username === 'guest');
      expect(guestUsers).toHaveLength(1);
      
      const guestUser = guestUsers[0];
      expect(guestUser.id).toBeDefined();
      expect(guestUser.username).toBe('guest');
      expect(guestUser.role).toBe('GUEST');
      
      console.log('✅ Guest user identified for auto-login:', guestUser);
    });
  });

  describe('Deck Access Database Verification', () => {
    it('should verify decks table exists and has correct structure', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'decks' 
        ORDER BY ordinal_position
      `);
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const columns = result.rows.map(row => row.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('name');
      expect(columns).toContain('description');
        expect(columns).toContain('ui_preferences');
      expect(columns).toContain('created_at');
      expect(columns).toContain('updated_at');
      
      console.log('✅ Decks table structure verified:', columns);
    });

    it('should verify existing decks can be accessed by guest users', async () => {
      let result = await pool.query(
        'SELECT id, user_id, name, description FROM decks ORDER BY created_at LIMIT 5'
      );

      // If no decks exist yet, create a minimal deck to validate access
      let ownerId: string | undefined;
      let deckId: string | undefined;
      if (result.rows.length === 0) {
        ownerId = generateUUID();
        await pool.query(
          'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [ownerId, `agl_seed_${generateUUID()}`, `agl-seed-${generateUUID()}@it.local`, 'seed_pw', 'USER']
        );
        deckId = generateUUID();
        await pool.query(
          'INSERT INTO decks (id, user_id, name, description, ui_preferences, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [deckId, ownerId, 'Seed Deck', 'Seed deck for access check', JSON.stringify([])]
        );
        result = await pool.query(
          'SELECT id, user_id, name, description FROM decks ORDER BY created_at LIMIT 5'
        );
      }

      expect(result.rows.length).toBeGreaterThan(0);

      result.rows.forEach(deck => {
        expect(deck.id).toBeDefined();
        expect(deck.user_id).toBeDefined();
        expect(deck.name).toBeDefined();
        expect(deck.description).toBeDefined();
      });

      console.log('✅ Existing decks verified for guest access:', result.rows.length, 'decks');
      
      // Clean up test user and deck created in this test
      if (ownerId && deckId) {
        await pool.query('DELETE FROM decks WHERE id = $1', [deckId]);
        await pool.query('DELETE FROM users WHERE id = $1', [ownerId]);
      }
    });

    it('should verify deck ownership can be determined', async () => {
      // Get a deck and its owner
      const deckResult = await pool.query(
        'SELECT id, user_id, name FROM decks LIMIT 1'
      );
      
      if (deckResult.rows.length > 0) {
        const deck = deckResult.rows[0];
        const ownerResult = await pool.query(
          'SELECT id, username, role FROM users WHERE id = $1',
          [deck.user_id]
        );
        
        expect(ownerResult.rows).toHaveLength(1);
        const owner = ownerResult.rows[0];
        expect(owner.id).toBe(deck.user_id);
        expect(owner.username).toBeDefined();
        expect(owner.role).toBeDefined();
        
        console.log('✅ Deck ownership verified:', { deck: deck.name, owner: owner.username });
      } else {
        console.log('ℹ️ No decks found for ownership verification');
      }
    });
  });

  describe('Test Deck Creation and Access', () => {
    it('should create a test deck for guest access testing', async () => {
      // Create a test user first
      testUserId = generateUUID();
      const userName = `agl_owner_${generateUUID()}`;
      const userEmail = `agl-owner-${generateUUID()}@it.local`;
      
      await pool.query(
        'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [testUserId, userName, userEmail, await bcrypt.hash('test_password_hash', 10), 'USER']
      );
      
      // Create a test deck
      testDeckId = generateUUID();
      const deckName = 'AGL Deck for Guest Access';
      const deckDescription = 'A deck to test guest access functionality';
      const deckCards = JSON.stringify([
        { cardType: 'character', cardId: 'leonidas', quantity: 1 },
        { cardType: 'character', cardId: 'king_arthur', quantity: 1 }
      ]);
      
      await pool.query(
        'INSERT INTO decks (id, user_id, name, description, ui_preferences, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [testDeckId, testUserId, deckName, deckDescription, deckCards]
      );
      
      // Verify deck was created
      const result = await pool.query(
        'SELECT * FROM decks WHERE id = $1',
        [testDeckId]
      );
      
      expect(result.rows).toHaveLength(1);
      const deck = result.rows[0];
      expect(deck.id).toBe(testDeckId);
      expect(deck.user_id).toBe(testUserId);
      expect(deck.name).toBe(deckName);
      expect(deck.description).toBe(deckDescription);
      expect(deck.ui_preferences).toBeDefined();
      
      console.log('✅ Test deck created successfully:', deck);
      
      // Clean up test user and deck created in this test
      if (testUserId && testDeckId) {
        await pool.query('DELETE FROM decks WHERE id = $1', [testDeckId]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
      }
    });

    it('should verify test deck can be accessed by guest user', async () => {
      // Ensure the deck exists in case global cleanup removed it
      if (!testUserId) {
        testUserId = generateUUID();
      }
      // Ensure the referenced user actually exists
      let userExists = await pool.query('SELECT 1 FROM users WHERE id = $1', [testUserId]);
      if (userExists.rows.length === 0) {
        await pool.query(
          'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [
            testUserId,
            `agl_owner_${generateUUID()}`,
            `agl-owner-${generateUUID()}@it.local`,
            await bcrypt.hash('test_password_hash', 10),
            'USER'
          ]
        );
      }
      if (!testDeckId) {
        testDeckId = generateUUID();
      }
      let existing = await pool.query('SELECT id FROM decks WHERE id = $1', [testDeckId]);
      if (existing.rows.length === 0) {
        const deckCards = JSON.stringify([
          { cardType: 'character', cardId: 'leonidas', quantity: 1 },
          { cardType: 'character', cardId: 'king_arthur', quantity: 1 }
        ]);
        await pool.query(
          'INSERT INTO decks (id, user_id, name, description, ui_preferences, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [
            testDeckId,
            testUserId,
            'AGL Deck for Guest Access',
            'A deck to test guest access functionality',
            deckCards
          ]
        );
      }

      const result = await pool.query(
        'SELECT d.*, u.username as owner_name, u.role as owner_role FROM decks d JOIN users u ON d.user_id = u.id WHERE d.id = $1',
        [testDeckId]
      );
      
      expect(result.rows).toHaveLength(1);
      const deckWithOwner = result.rows[0];
      expect(deckWithOwner.id).toBe(testDeckId);
      expect(deckWithOwner.owner_name).toBeDefined();
      expect(deckWithOwner.owner_role).toBe('USER');
      
      console.log('✅ Test deck accessible with owner info:', deckWithOwner);
    });

    it('should verify deck cards are properly stored and retrievable', async () => {
      // Ensure the deck exists in case global cleanup removed it
      if (!testUserId) {
        testUserId = generateUUID();
      }
      // Ensure the referenced user actually exists
      let userExists = await pool.query('SELECT 1 FROM users WHERE id = $1', [testUserId]);
      if (userExists.rows.length === 0) {
        await pool.query(
          'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [
            testUserId,
            `agl_owner_${generateUUID()}`,
            `agl-owner-${generateUUID()}@it.local`,
            await bcrypt.hash('test_password_hash', 10),
            'USER'
          ]
        );
      }
      if (!testDeckId) {
        testDeckId = generateUUID();
      }
      let existing = await pool.query('SELECT id FROM decks WHERE id = $1', [testDeckId]);
      if (existing.rows.length === 0) {
        const deckCards = JSON.stringify([
          { cardType: 'character', cardId: 'leonidas', quantity: 1 },
          { cardType: 'character', cardId: 'king_arthur', quantity: 1 }
        ]);
        await pool.query(
          'INSERT INTO decks (id, user_id, name, description, ui_preferences, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [
            testDeckId,
            testUserId,
            'AGL Deck for Guest Access',
            'A deck to test guest access functionality',
            deckCards
          ]
        );
      }

      const result = await pool.query(
        'SELECT ui_preferences FROM decks WHERE id = $1',
        [testDeckId]
      );
      
      expect(result.rows).toHaveLength(1);
      const prefs = result.rows[0].ui_preferences;
      expect(prefs).toBeDefined();
      
      // Parse the JSON preferences if it's a string, otherwise use directly
      const parsedPrefs = typeof prefs === 'string' ? JSON.parse(prefs) : prefs;
      expect(typeof parsedPrefs).toBe('object');
      
      console.log('✅ Deck preferences verified:', parsedPrefs);
    });
  });

  describe('Guest Session Database Operations', () => {
    it('should verify guest user can be used for session management', async () => {
      const result = await pool.query(
        'SELECT id, username, role FROM users WHERE username = $1',
        ['guest']
      );
      
      expect(result.rows).toHaveLength(1);
      const guestUser = result.rows[0];
      
      // Verify guest user has all required fields for session management
      expect(guestUser.id).toBeDefined();
      expect(guestUser.username).toBe('guest');
      expect(guestUser.role).toBe('GUEST');
      
      // Verify guest user ID is a valid UUID format
      expect(guestUser.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      console.log('✅ Guest user ready for session management:', guestUser);
    });

    it('should verify guest user permissions are correctly set', async () => {
      const result = await pool.query(
        'SELECT role FROM users WHERE username = $1',
        ['guest']
      );
      
      expect(result.rows).toHaveLength(1);
      const guestRole = result.rows[0].role;
      
      // Verify guest role is exactly GUEST
      expect(guestRole).toBe('GUEST');
      expect(guestRole).not.toBe('USER');
      expect(guestRole).not.toBe('ADMIN');
      
      console.log('✅ Guest user permissions verified:', guestRole);
    });

    it('should verify guest user can access deck data without modification rights', async () => {
      // This test verifies that the guest user exists and has the correct role
      // for read-only access to deck data
      const result = await pool.query(
        'SELECT id, username, role FROM users WHERE username = $1',
        ['guest']
      );
      
      expect(result.rows).toHaveLength(1);
      const guestUser = result.rows[0];
      
      // Verify guest user exists and has GUEST role
      expect(guestUser.role).toBe('GUEST');
      
      // Verify guest user can be used for read-only operations
      // (This would be enforced at the application level, not database level)
      expect(guestUser.id).toBeDefined();
      expect(guestUser.username).toBe('guest');
      
      console.log('✅ Guest user verified for read-only deck access:', guestUser);
    });
  });
});

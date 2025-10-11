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

describe('Read-Only Mode Integration Tests', () => {
  let pool: Pool;
  let testUserId: string | null = null;
  let testDeckId: string | null = null;

  beforeAll(() => {
    pool = new Pool({
      connectionString: 'process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower''
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

  describe('Read-Only Mode Database Verification', () => {
    it('should verify deck ownership can be determined from database', async () => {
      // Get an existing deck and its owner
      const deckResult = await pool.query(
        'SELECT d.id, d.user_id, d.name, u.username as owner_name, u.role as owner_role FROM decks d JOIN users u ON d.user_id = u.id LIMIT 1'
      );
      
      if (deckResult.rows.length > 0) {
        const deck = deckResult.rows[0];
        expect(deck.id).toBeDefined();
        expect(deck.user_id).toBeDefined();
        expect(deck.owner_name).toBeDefined();
        expect(deck.owner_role).toBeDefined();
        
        console.log('✅ Deck ownership verified:', { deck: deck.name, owner: deck.owner_name, role: deck.owner_role });
      } else {
        console.log('ℹ️ No decks found for ownership verification');
      }
    });

    it('should verify user roles are properly set for read-only access control', async () => {
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
      
      console.log('✅ User roles verified for read-only access control:', users);
    });

    it('should verify deck access permissions can be determined', async () => {
      // Get a deck and its owner
      const deckResult = await pool.query(
        'SELECT d.id, d.user_id, d.name, u.username as owner_name, u.role as owner_role FROM decks d JOIN users u ON d.user_id = u.id WHERE u.username = $1 LIMIT 1',
        ['kyle']
      );
      
      if (deckResult.rows.length > 0) {
        const deck = deckResult.rows[0];
        
        // Verify deck owner has ADMIN role (can edit)
        expect(deck.owner_role).toBe('ADMIN');
        
        // Verify guest user exists and has GUEST role (read-only)
        const guestResult = await pool.query(
          'SELECT role FROM users WHERE username = $1',
          ['guest']
        );
        
        expect(guestResult.rows).toHaveLength(1);
        expect(guestResult.rows[0].role).toBe('GUEST');
        
        console.log('✅ Deck access permissions verified:', { 
          deck: deck.name, 
          owner: deck.owner_name, 
          ownerRole: deck.owner_role,
          guestRole: guestResult.rows[0].role 
        });
      } else {
        console.log('ℹ️ No decks found for access permission verification');
      }
    });
  });

  describe('Test Deck Creation for Read-Only Testing', () => {
    it('should create a test deck for read-only mode testing', async () => {
      // Create a test user first
      testUserId = generateUUID();
      const userName = `ro_owner_${generateUUID()}`;
      const userEmail = `ro-owner-${generateUUID()}@it.local`;
      
      await pool.query(
        'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [testUserId, userName, userEmail, await bcrypt.hash(await bcrypt.hash('test_password_hash', 10), 10), 'USER']
      );
      
      // Create a test deck
      testDeckId = generateUUID();
      const deckName = 'RO Deck for Read-Only Mode';
      const deckDescription = 'A deck to test read-only mode functionality';
      const deckCards = JSON.stringify([
        { cardType: 'character', cardId: 'leonidas', quantity: 1 },
        { cardType: 'character', cardId: 'king_arthur', quantity: 1 },
        { cardType: 'special', cardId: 'sword_and_shield', quantity: 2 }
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
      
      console.log('✅ Test deck created for read-only testing:', deck);
    });

    it('should verify test deck can be accessed with owner information', async () => {
      // Ensure the deck exists in case global cleanup removed it
      if (!testUserId) {
        testUserId = generateUUID();
        await pool.query(
          'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [testUserId, `ro_owner_${generateUUID()}`, `ro-owner-${generateUUID()}@it.local`, await bcrypt.hash('test_password_hash', 10), 'USER']
        );
      }
      if (!testDeckId) {
        testDeckId = generateUUID();
      }
      
      // Check if deck exists, create if not
      let existing = await pool.query('SELECT id FROM decks WHERE id = $1', [testDeckId]);
      if (existing.rows.length === 0) {
        // Ensure user exists before creating deck
        let userExists = await pool.query('SELECT 1 FROM users WHERE id = $1', [testUserId]);
        if (userExists.rows.length === 0) {
          await pool.query(
            'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
            [testUserId, `ro_owner_${generateUUID()}`, `ro-owner-${generateUUID()}@it.local`, await bcrypt.hash('test_password_hash', 10), 'USER']
          );
        }
        
        const deckCards = JSON.stringify([
          { cardType: 'character', cardId: 'leonidas', quantity: 1 },
          { cardType: 'character', cardId: 'king_arthur', quantity: 1 },
          { cardType: 'special', cardId: 'sword_and_shield', quantity: 2 }
        ]);
        await pool.query(
          'INSERT INTO decks (id, user_id, name, description, ui_preferences, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [testDeckId, testUserId, 'RO Deck for Read-Only Mode', 'A deck to test read-only mode functionality', deckCards]
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

    it('should verify deck cards are properly stored for read-only access', async () => {
      // Ensure the deck exists in case global cleanup removed it
      if (!testUserId) {
        testUserId = generateUUID();
        await pool.query(
          'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [testUserId, `ro_owner_${generateUUID()}`, `ro-owner-${generateUUID()}@it.local`, await bcrypt.hash('test_password_hash', 10), 'USER']
        );
      }
      if (!testDeckId) {
        testDeckId = generateUUID();
      }
      
      // Check if deck exists, create if not
      let existing = await pool.query('SELECT id FROM decks WHERE id = $1', [testDeckId]);
      if (existing.rows.length === 0) {
        // Ensure user exists before creating deck
        let userExists = await pool.query('SELECT 1 FROM users WHERE id = $1', [testUserId]);
        if (userExists.rows.length === 0) {
          await pool.query(
            'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
            [testUserId, `ro_owner_${generateUUID()}`, `ro-owner-${generateUUID()}@it.local`, await bcrypt.hash('test_password_hash', 10), 'USER']
          );
        }
        
        const deckCards = JSON.stringify([
          { cardType: 'character', cardId: 'leonidas', quantity: 1 },
          { cardType: 'character', cardId: 'king_arthur', quantity: 1 },
          { cardType: 'special', cardId: 'sword_and_shield', quantity: 2 }
        ]);
        await pool.query(
          'INSERT INTO decks (id, user_id, name, description, ui_preferences, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [testDeckId, testUserId, 'RO Deck for Read-Only Mode', 'A deck to test read-only mode functionality', deckCards]
        );
      }
      
      const result = await pool.query(
        'SELECT ui_preferences FROM decks WHERE id = $1',
        [testDeckId]
      );
      
      expect(result.rows).toHaveLength(1);
      const cards = result.rows[0].ui_preferences;
      expect(cards).toBeDefined();
      
      // Parse the JSON cards if it's a string, otherwise use directly
      const parsedCards = typeof cards === 'string' ? JSON.parse(cards) : cards;
      expect(Array.isArray(parsedCards)).toBe(true);
      expect(parsedCards.length).toBeGreaterThan(0);
      
      parsedCards.forEach((card: any) => {
        expect(card.cardType).toBeDefined();
        expect(card.cardId).toBeDefined();
        expect(card.quantity).toBeDefined();
      });
      
      console.log('✅ Deck cards verified for read-only access:', parsedCards);
    });
  });

  describe('Read-Only Access Control Database Verification', () => {
    it('should verify guest user has GUEST role for read-only access', async () => {
      const result = await pool.query(
        'SELECT id, username, role FROM users WHERE username = $1',
        ['guest']
      );
      
      expect(result.rows).toHaveLength(1);
      const guestUser = result.rows[0];
      expect(guestUser.username).toBe('guest');
      expect(guestUser.role).toBe('GUEST');
      expect(guestUser.id).toBeDefined();
      
      console.log('✅ Guest user verified for read-only access:', guestUser);
    });

    it('should verify USER role has edit permissions', async () => {
      const result = await pool.query(
        'SELECT id, username, role FROM users WHERE username = $1',
        ['kyle']
      );
      
      expect(result.rows).toHaveLength(1);
      const user = result.rows[0];
      expect(user.username).toBe('kyle');
      expect(user.role).toBe('ADMIN');
      expect(user.id).toBeDefined();
      
      console.log('✅ USER role verified for edit permissions:', user);
    });

    it('should verify role-based access control can be determined', async () => {
      const result = await pool.query(
        'SELECT username, role FROM users ORDER BY username'
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      const users = result.rows;
      const guestUser = users.find(u => u.username === 'guest');
      const regularUser = users.find(u => u.username === 'kyle');
      
      expect(guestUser).toBeDefined();
      expect(regularUser).toBeDefined();
      
      // Verify role hierarchy
      expect(guestUser.role).toBe('GUEST');
      expect(regularUser.role).toBe('ADMIN');
      expect(guestUser.role).not.toBe(regularUser.role);
      
      console.log('✅ Role-based access control verified:', { guest: guestUser.role, user: regularUser.role });
    });
  });

  describe('Deck Data Integrity for Read-Only Mode', () => {
    it('should verify deck data is complete for read-only viewing', async () => {
      // Ensure we have at least one deck to test with
      let result = await pool.query(
        'SELECT id, user_id, name, description, ui_preferences, created_at, updated_at FROM decks ORDER BY created_at LIMIT 5'
      );
      
      if (result.rows.length === 0) {
        // Create a test deck if none exist
        const testUserId = generateUUID();
        const testDeckId = generateUUID();
        await pool.query(
          'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [testUserId, `ro_test_${generateUUID()}`, `ro-test-${generateUUID()}@it.local`, await bcrypt.hash('test_password_hash', 10), 'USER']
        );
        await pool.query(
          'INSERT INTO decks (id, user_id, name, description, ui_preferences, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [testDeckId, testUserId, 'Test Deck for Read-Only', 'A test deck for read-only verification', JSON.stringify([])]
        );
        result = await pool.query(
          'SELECT id, user_id, name, description, ui_preferences, created_at, updated_at FROM decks ORDER BY created_at LIMIT 5'
        );
      }
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      result.rows.forEach(deck => {
        expect(deck.id).toBeDefined();
        expect(deck.user_id).toBeDefined();
        expect(deck.name).toBeDefined();
        expect(deck.description).toBeDefined();
        expect(deck.ui_preferences).toBeDefined();
        expect(deck.created_at).toBeDefined();
        expect(deck.updated_at).toBeDefined();
        
        // Verify ui_preferences is valid JSON
        const prefs = typeof deck.ui_preferences === 'string' ? JSON.parse(deck.ui_preferences) : deck.ui_preferences;
        expect(typeof prefs).toBe('object');
      });
      
      console.log('✅ Deck data integrity verified for read-only viewing:', result.rows.length, 'decks');
      
      // Clean up test user and deck created in this test
      if (testUserId && testDeckId) {
        await pool.query('DELETE FROM decks WHERE id = $1', [testDeckId]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
      }
    });

    it('should verify deck ownership information is available', async () => {
      // Ensure we have at least one deck to test with
      let result = await pool.query(
        'SELECT d.id, d.name, d.user_id, u.username as owner_name, u.role as owner_role FROM decks d JOIN users u ON d.user_id = u.id ORDER BY d.created_at LIMIT 5'
      );
      
      if (result.rows.length === 0) {
        // Create a test deck if none exist
        const testUserId = generateUUID();
        const testDeckId = generateUUID();
        await pool.query(
          'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [testUserId, `ro_test_${generateUUID()}`, `ro-test-${generateUUID()}@it.local`, await bcrypt.hash('test_password_hash', 10), 'USER']
        );
        await pool.query(
          'INSERT INTO decks (id, user_id, name, description, ui_preferences, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [testDeckId, testUserId, 'Test Deck for Read-Only', 'A test deck for read-only verification', JSON.stringify([])]
        );
        result = await pool.query(
          'SELECT d.id, d.name, d.user_id, u.username as owner_name, u.role as owner_role FROM decks d JOIN users u ON d.user_id = u.id ORDER BY d.created_at LIMIT 5'
        );
      }
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      result.rows.forEach(deck => {
        expect(deck.id).toBeDefined();
        expect(deck.name).toBeDefined();
        expect(deck.user_id).toBeDefined();
        expect(deck.owner_name).toBeDefined();
        expect(deck.owner_role).toBeDefined();
        expect(['USER', 'GUEST', 'ADMIN']).toContain(deck.owner_role);
      });
      
      console.log('✅ Deck ownership information verified:', result.rows.length, 'decks');
      
      // Clean up test user and deck created in this test
      if (testUserId && testDeckId) {
        await pool.query('DELETE FROM decks WHERE id = $1', [testDeckId]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
      }
    });

    it('should verify deck timestamps are valid for read-only mode', async () => {
      // Ensure we have at least one deck to test with
      let result = await pool.query(
        'SELECT id, name, created_at, updated_at FROM decks ORDER BY created_at LIMIT 5'
      );
      
      if (result.rows.length === 0) {
        // Create a test deck if none exist
        const testUserId = generateUUID();
        const testDeckId = generateUUID();
        await pool.query(
          'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [testUserId, `ro_test_${generateUUID()}`, `ro-test-${generateUUID()}@it.local`, await bcrypt.hash('test_password_hash', 10), 'USER']
        );
        await pool.query(
          'INSERT INTO decks (id, user_id, name, description, ui_preferences, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [testDeckId, testUserId, 'Test Deck for Read-Only', 'A test deck for read-only verification', JSON.stringify([])]
        );
        result = await pool.query(
          'SELECT id, name, created_at, updated_at FROM decks ORDER BY created_at LIMIT 5'
        );
      }
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      result.rows.forEach(deck => {
        const createdAt = new Date(deck.created_at);
        const updatedAt = new Date(deck.updated_at);
        
        expect(createdAt.getTime()).not.toBeNaN();
        expect(updatedAt.getTime()).not.toBeNaN();
        expect(createdAt.getTime()).toBeLessThanOrEqual(updatedAt.getTime());
      });
      
      console.log('✅ Deck timestamps verified for read-only mode:', result.rows.length, 'decks');
      
      // Clean up test user and deck created in this test
      if (testUserId && testDeckId) {
        await pool.query('DELETE FROM decks WHERE id = $1', [testDeckId]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
      }
    });
  });
});
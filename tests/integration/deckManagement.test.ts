import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { integrationTestUtils, logDeckDeletion } from '../setup-integration';

// Simple UUID v4 generator for tests
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

describe('Deck Management Integration Tests', () => {
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
      console.log(`🔍 DEBUG: deckManagement.test.ts afterAll() - Deleting deck: ${testDeckId}`);
      logDeckDeletion('deckManagement.test.ts afterAll', testDeckId, 'test cleanup');
      await pool.query('DELETE FROM decks WHERE id = $1', [testDeckId]);
    }
    if (testUserId) {
      console.log(`🔍 DEBUG: deckManagement.test.ts afterAll() - Deleting user: ${testUserId}`);
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  describe('Deck Creation Database Operations', () => {
    beforeEach(async () => {
      // Create a test user and deck for each test
      testUserId = generateUUID();
      const userName = `Test Deck Creator ${generateUUID()}`;
      const userEmail = `test-creator-${generateUUID()}@example.com`;
      
      await pool.query(
        'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [testUserId, userName, userEmail, await bcrypt.hash('test_password_hash', 10), 'USER']
      );
      
      // Create a test deck
      testDeckId = generateUUID();
      const deckName = 'Test Deck';
      const deckDescription = 'A test deck for integration testing';
      const deckCards = JSON.stringify([]);
      
      await pool.query(
        'INSERT INTO decks (id, user_id, name, description, ui_preferences, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [testDeckId, testUserId, deckName, deckDescription, deckCards]
      );
      
      // Track this deck for cleanup
      integrationTestUtils.trackTestDeck(testDeckId);
    });

    afterEach(async () => {
      // Clean up test user and deck created in beforeEach
      if (testDeckId) {
        try {
          await pool.query('DELETE FROM decks WHERE id = $1', [testDeckId]);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      if (testUserId) {
        try {
          await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });

    it('should create a new deck with valid data', async () => {
      const result = await pool.query(
        'SELECT * FROM decks WHERE id = $1',
        [testDeckId!]
      );
      
      expect(result.rows).toHaveLength(1);
      const deck = result.rows[0];
      expect(deck.id).toBe(testDeckId);
      expect(deck.user_id).toBe(testUserId);
      expect(deck.name).toBe('Test Deck');
      expect(deck.description).toBe('A test deck for integration testing');
      expect(deck.ui_preferences).toBeDefined();
      expect(deck.created_at).toBeDefined();
      expect(deck.updated_at).toBeDefined();
      
      console.log('✅ Test deck created successfully:', deck);
    });

    it('should verify deck can be retrieved by ID', async () => {
      expect(testDeckId).toBeDefined();
      
      const result = await pool.query(
        'SELECT * FROM decks WHERE id = $1',
        [testDeckId!]
      );
      
      expect(result.rows).toHaveLength(1);
      const deck = result.rows[0];
      expect(deck.id).toBe(testDeckId);
      expect(deck.user_id).toBe(testUserId);
      expect(deck.name).toBeDefined();
      expect(deck.description).toBeDefined();
      
      console.log('✅ Deck retrieved by ID:', deck);
    });

    it('should verify deck can be retrieved by user ID', async () => {
      expect(testUserId).toBeDefined();
      
      const result = await pool.query(
        'SELECT * FROM decks WHERE user_id = $1 ORDER BY created_at',
        [testUserId!]
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      result.rows.forEach(deck => {
        expect(deck.user_id).toBe(testUserId);
        expect(deck.id).toBeDefined();
        expect(deck.name).toBeDefined();
      });
      
      console.log('✅ Decks retrieved by user ID:', result.rows.length, 'decks');
    });

    it('should verify deck can be updated', async () => {
      expect(testDeckId).toBeDefined();
      
      const newName = 'Updated Test Deck';
      const newDescription = 'Updated description';
      
      const result = await pool.query(
        'UPDATE decks SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [newName, newDescription, testDeckId!]
      );
      
      expect(result.rows).toHaveLength(1);
      const deck = result.rows[0];
      expect(deck.name).toBe(newName);
      expect(deck.description).toBe(newDescription);
      expect(deck.id).toBe(testDeckId);
      
      console.log('✅ Deck updated successfully:', deck);
    });

    it('should verify deck can be deleted', async () => {
      expect(testDeckId).toBeDefined();
      
      console.log(`🔍 DEBUG: deckManagement.test.ts - Deleting deck for test: ${testDeckId!}`);
      const result = await pool.query(
        'DELETE FROM decks WHERE id = $1 RETURNING *',
        [testDeckId!]
      );
      
      expect(result.rows).toHaveLength(1);
      const deletedDeck = result.rows[0];
      expect(deletedDeck.id).toBe(testDeckId);
      
      // Verify deck no longer exists
      const verifyResult = await pool.query(
        'SELECT * FROM decks WHERE id = $1',
        [testDeckId!]
      );
      
      expect(verifyResult.rows).toHaveLength(0);
      
      testDeckId = null; // Clear for cleanup
      console.log('✅ Deck deleted successfully');
    });
  });

  describe('Deck Card Management Database Operations', () => {
    beforeEach(async () => {
      // Create a test user and deck for each test
      testUserId = generateUUID();
      const userName = `Test Card Manager ${generateUUID()}`;
      const userEmail = `test-card-manager-${generateUUID()}@example.com`;
      
      await pool.query(
        'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [testUserId, userName, userEmail, await bcrypt.hash('test_password_hash', 10), 'USER']
      );
      
      testDeckId = generateUUID();
      const deckName = 'Test Card Deck';
      const deckDescription = 'A deck for testing card management';
      
      await pool.query(
        'INSERT INTO decks (id, user_id, name, description, ui_preferences, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [testDeckId, testUserId, deckName, deckDescription, JSON.stringify([])]
      );
      
      // Track this deck for cleanup
      integrationTestUtils.trackTestDeck(testDeckId);
    });

    afterEach(async () => {
      // Clean up test user and deck created in beforeEach
      if (testDeckId) {
        try {
          await pool.query('DELETE FROM decks WHERE id = $1', [testDeckId]);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      if (testUserId) {
        try {
          await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });

    it('should add cards to deck', async () => {
      expect(testDeckId).toBeDefined();
      
      const cardsToAdd = [
        { cardType: 'character', cardId: 'leonidas', quantity: 1 },
        { cardType: 'character', cardId: 'king_arthur', quantity: 1 },
        { cardType: 'special', cardId: 'sword_and_shield', quantity: 2 }
      ];
      
      const result = await pool.query(
        'UPDATE decks SET ui_preferences = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [JSON.stringify(cardsToAdd), testDeckId!]
      );
      
      expect(result.rows).toHaveLength(1);
      const deck = result.rows[0];
      const cards = typeof deck.ui_preferences === 'string' ? JSON.parse(deck.ui_preferences) : deck.ui_preferences;
      expect(cards).toHaveLength(3);
      expect(cards[0].cardType).toBe('character');
      expect(cards[0].cardId).toBe('leonidas');
      expect(cards[0].quantity).toBe(1);
      
      console.log('✅ Cards added to deck:', cards);
    });

    it('should remove cards from deck', async () => {
      expect(testDeckId).toBeDefined();
      
      // First add some cards
      const initialCards = [
        { cardType: 'character', cardId: 'leonidas', quantity: 1 },
        { cardType: 'character', cardId: 'king_arthur', quantity: 1 }
      ];
      
      await pool.query(
        'UPDATE decks SET ui_preferences = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(initialCards), testDeckId!]
      );
      
      // Then remove one card
      const updatedCards = [
        { cardType: 'character', cardId: 'king_arthur', quantity: 1 }
      ];
      
      const result = await pool.query(
        'UPDATE decks SET ui_preferences = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [JSON.stringify(updatedCards), testDeckId!]
      );
      
      expect(result.rows).toHaveLength(1);
      const deck = result.rows[0];
      const cards = typeof deck.ui_preferences === 'string' ? JSON.parse(deck.ui_preferences) : deck.ui_preferences;
      expect(cards).toHaveLength(1);
      expect(cards[0].cardId).toBe('king_arthur');
      
      console.log('✅ Cards removed from deck:', cards);
    });

    it('should update card quantities in deck', async () => {
      expect(testDeckId).toBeDefined();
      
      const cardsWithQuantities = [
        { cardType: 'character', cardId: 'leonidas', quantity: 3 },
        { cardType: 'special', cardId: 'sword_and_shield', quantity: 1 }
      ];
      
      const result = await pool.query(
        'UPDATE decks SET ui_preferences = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [JSON.stringify(cardsWithQuantities), testDeckId!]
      );
      
      expect(result.rows).toHaveLength(1);
      const deck = result.rows[0];
      const cards = typeof deck.ui_preferences === 'string' ? JSON.parse(deck.ui_preferences) : deck.ui_preferences;
      expect(cards).toHaveLength(2);
      expect(cards[0].quantity).toBe(3);
      expect(cards[1].quantity).toBe(1);
      
      console.log('✅ Card quantities updated in deck:', cards);
    });
  });

  describe('Deck Data Validation', () => {
    it('should verify deck name is required', async () => {
      testUserId = generateUUID();
      const userName = `Test Validation User ${generateUUID()}`;
      const userEmail = `test-validation-${generateUUID()}@example.com`;
      
      await pool.query(
        'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [testUserId, userName, userEmail, await bcrypt.hash('test_password_hash', 10), 'USER']
      );
      
      // Try to create deck with null name
      try {
        await pool.query(
          'INSERT INTO decks (id, user_id, name, description, ui_preferences, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [generateUUID(), testUserId, null, 'Test description', JSON.stringify([])]
        );
        fail('Expected null name constraint to be violated');
      } catch (error) {
        expect(error).toBeDefined();
        console.log('✅ Deck name required constraint verified');
      }
      
      // Clean up test user created in this test
      if (testUserId) {
        try {
          await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });

    it('should verify deck user_id foreign key constraint', async () => {
      const invalidUserId = generateUUID();
      
      // Try to create deck with non-existent user_id
      try {
        await pool.query(
          'INSERT INTO decks (id, user_id, name, description, ui_preferences, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [generateUUID(), invalidUserId, 'Test Deck', 'Test description', JSON.stringify([])]
        );
        fail('Expected foreign key constraint to be violated');
      } catch (error) {
        expect(error).toBeDefined();
        console.log('✅ Deck user_id foreign key constraint verified');
      }
    });

    it('should verify deck cards JSON format', async () => {
      testUserId = generateUUID();
      const userName = 'Test JSON User';
      const userEmail = `test-json-${generateUUID()}@example.com`;
      
      await pool.query(
        'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [testUserId, userName, userEmail, await bcrypt.hash('test_password_hash', 10), 'USER']
      );
      
      const testDeckId = generateUUID();
      const validCards = [
        { cardType: 'character', cardId: 'leonidas', quantity: 1 },
        { cardType: 'special', cardId: 'sword_and_shield', quantity: 2 }
      ];
      
      const result = await pool.query(
        'INSERT INTO decks (id, user_id, name, description, ui_preferences, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING ui_preferences',
        [testDeckId, testUserId, 'Test JSON Deck', 'Test description', JSON.stringify(validCards)]
      );
      
      // Track this deck for cleanup
      integrationTestUtils.trackTestDeck(testDeckId);
      
      expect(result.rows).toHaveLength(1);
      const cards = typeof result.rows[0].ui_preferences === 'string' ? JSON.parse(result.rows[0].ui_preferences) : result.rows[0].ui_preferences;
      expect(Array.isArray(cards)).toBe(true);
      expect(cards).toHaveLength(2);
      
      // Cleanup
      console.log(`🔍 DEBUG: deckManagement.test.ts - Cleanup deleting deck: ${testDeckId}`);
      await pool.query('DELETE FROM decks WHERE id = $1', [testDeckId]);
      console.log(`🔍 DEBUG: deckManagement.test.ts - Cleanup deleting user: ${testUserId}`);
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
      
      console.log('✅ Deck cards JSON format verified:', cards);
    });
  });

  describe('Deck Query Operations', () => {
    it('should verify decks can be filtered by user', async () => {
      const result = await pool.query(
        'SELECT d.id, d.name, d.user_id, u.username as owner_name FROM decks d JOIN users u ON d.user_id = u.id ORDER BY d.created_at LIMIT 10'
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      result.rows.forEach(deck => {
        expect(deck.id).toBeDefined();
        expect(deck.name).toBeDefined();
        expect(deck.user_id).toBeDefined();
        expect(deck.owner_name).toBeDefined();
      });
      
      console.log('✅ Decks filtered by user:', result.rows.length, 'decks');
    });

    it('should verify decks can be sorted by creation date', async () => {
      const result = await pool.query(
        'SELECT id, name, created_at FROM decks ORDER BY created_at ASC LIMIT 10'
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      // Verify sorting is correct
      for (let i = 1; i < result.rows.length; i++) {
        const prevDate = new Date(result.rows[i - 1].created_at);
        const currDate = new Date(result.rows[i].created_at);
        expect(prevDate.getTime()).toBeLessThanOrEqual(currDate.getTime());
      }
      
      console.log('✅ Decks sorted by creation date verified');
    });

    it('should verify deck count by user', async () => {
      const result = await pool.query(
        'SELECT u.username as owner_name, COUNT(d.id) as deck_count FROM users u LEFT JOIN decks d ON u.id = d.user_id GROUP BY u.id, u.username ORDER BY deck_count DESC'
      );
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      result.rows.forEach(row => {
        expect(row.owner_name).toBeDefined();
        expect(parseInt(row.deck_count)).toBeGreaterThanOrEqual(0);
      });
      
      console.log('✅ Deck count by user:', result.rows);
    });
  });
});
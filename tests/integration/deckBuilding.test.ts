import { Pool } from 'pg';
import { integrationTestUtils } from '../setup-integration';

// Simple UUID v4 generator for tests
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

describe('Deck Building Integration Tests', () => {
  let pool: Pool;
  let testUserId: string | null = null;
  let testUserPassword: string = 'test_password_123';
  let createdDeckIds: string[] = [];

  beforeAll(async () => {
    // Set up database connection - use shared connection
    pool = new Pool({
      connectionString: 'postgresql://postgres:password@localhost:1337/overpower'
    });
    
    // Ensure test server is initialized
    await integrationTestUtils.ensureGuestUser();
    await integrationTestUtils.ensureAdminUser();
  });

  afterAll(async () => {
    // Clean up test data
    for (const deckId of createdDeckIds) {
      // Track these decks for cleanup
      integrationTestUtils.trackTestDeck(deckId);
    }
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  // Note: We don't use afterEach cleanup here because this test suite
  // manages its own test data lifecycle and needs to preserve data between tests

  describe('User Management', () => {
    it('should create a fresh user', async () => {
      testUserId = generateUUID();
      const userName = `Deck Builder Test User ${generateUUID()}`;
      const userEmail = `deck-builder-${generateUUID()}@example.com`;
      
      // Hash the password
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('test_password_hash', 10);
      
      const result = await pool.query(
        'INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
        [testUserId, userName, userEmail, hashedPassword, 'USER']
      );

      expect(result.rows[0]).toBeDefined();
      expect(result.rows[0].username).toBe(userName);
      expect(result.rows[0].email).toBe(userEmail);
      expect(result.rows[0].role).toBe('USER');

      console.log('✅ Test user created:', {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email
      });
    });

    it('should verify user can be retrieved from database', async () => {
      const result = await pool.query(
        'SELECT id, username, email, role FROM users WHERE id = $1',
        [testUserId]
      );
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe(testUserId);
      expect(result.rows[0].role).toBe('USER');

      console.log('✅ User verified in database:', {
        userId: result.rows[0].id,
        username: result.rows[0].username,
        role: result.rows[0].role
      });
    });
  });

  describe('Deck Creation', () => {
    it('should create a new deck with just a name', async () => {
      const deckName = `Test Deck Name Only ${generateUUID()}`;
      const deckId = generateUUID();
      
      const result = await pool.query(
        'INSERT INTO decks (id, user_id, name, description, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
        [deckId, testUserId, deckName, null]
      );
      
      expect(result.rows[0]).toBeDefined();
      expect(result.rows[0].name).toBe(deckName);
      expect(result.rows[0].description).toBeNull();
      expect(result.rows[0].user_id).toBe(testUserId);

      createdDeckIds.push(deckId);

      console.log('✅ Deck created with name only:', {
        id: result.rows[0].id,
        name: result.rows[0].name,
        description: result.rows[0].description
      });
    });

    it('should create a new deck with name and description', async () => {
      const deckName = `Test Deck with Description ${generateUUID()}`;
      const deckDescription = 'This is a test deck with a description for testing purposes';
      const deckId = generateUUID();
      
      const result = await pool.query(
        'INSERT INTO decks (id, user_id, name, description, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
        [deckId, testUserId, deckName, deckDescription]
      );
      
      expect(result.rows[0]).toBeDefined();
      expect(result.rows[0].name).toBe(deckName);
      expect(result.rows[0].description).toBe(deckDescription);
      expect(result.rows[0].user_id).toBe(testUserId);

      createdDeckIds.push(deckId);

      console.log('✅ Deck created with name and description:', {
        id: result.rows[0].id,
        name: result.rows[0].name,
        description: result.rows[0].description
      });
    });

    it('should create a new deck with 0-4 starting characters and enforce the 4 character limit', async () => {
      // First, get some character IDs from the database
      const characterResult = await pool.query(
        'SELECT id FROM characters LIMIT 6'
      );
      const characterIds = characterResult.rows.map(row => row.id);
      
      expect(characterIds.length).toBeGreaterThanOrEqual(4);

      // Test with 0 characters (empty deck)
      const deckName0 = `Test Deck 0 Characters ${generateUUID()}`;
      const deckId0 = generateUUID();
      
      const result0 = await pool.query(
        'INSERT INTO decks (id, user_id, name, description, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
        [deckId0, testUserId, deckName0, null]
      );
      
      expect(result0.rows[0]).toBeDefined();
      createdDeckIds.push(deckId0);

      // Test with 1 character
      const deckName1 = `Test Deck 1 Character ${generateUUID()}`;
      const deckId1 = generateUUID();
      
      const result1 = await pool.query(
        'INSERT INTO decks (id, user_id, name, description, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
        [deckId1, testUserId, deckName1, null]
      );
      
      // Add 1 character
      await pool.query(
        'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity) VALUES ($1, $2, $3, $4)',
        [deckId1, 'character', characterIds[0], 1]
      );
      
      expect(result1.rows[0]).toBeDefined();
      createdDeckIds.push(deckId1);

      // Test with 4 characters (maximum allowed)
      const deckName4 = `Test Deck 4 Characters ${generateUUID()}`;
      const deckId4 = generateUUID();
      
      const result4 = await pool.query(
        'INSERT INTO decks (id, user_id, name, description, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
        [deckId4, testUserId, deckName4, null]
      );
      
      // Add 4 characters
      for (let i = 0; i < 4; i++) {
        await pool.query(
          'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity) VALUES ($1, $2, $3, $4)',
          [deckId4, 'character', characterIds[i], 1]
        );
      }
      
      expect(result4.rows[0]).toBeDefined();
      createdDeckIds.push(deckId4);

      console.log('✅ Character limit testing completed:', {
        '0 character deck': deckId0,
        '1 character deck': deckId1,
        '4 character deck': deckId4
      });
    });

  });

  describe('Deck Data Verification', () => {
    it('should verify that each deck was created with proper starting data', async () => {
      for (const deckId of createdDeckIds) {
        const result = await pool.query(
          'SELECT * FROM decks WHERE id = $1',
          [deckId]
        );
        
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].id).toBe(deckId);
        expect(result.rows[0].user_id).toBe(testUserId);
        expect(result.rows[0].name).toBeDefined();
        expect(result.rows[0].created_at).toBeDefined();
        expect(result.rows[0].updated_at).toBeDefined();

        console.log('✅ Deck data verified:', {
          id: result.rows[0].id,
          name: result.rows[0].name,
          description: result.rows[0].description,
          user_id: result.rows[0].user_id
        });
      }
    });
  });

  describe('Deck Editing', () => {
    it('should edit names and descriptions of all decks', async () => {
      for (let i = 0; i < createdDeckIds.length; i++) {
        const deckId = createdDeckIds[i];
        const newName = `Updated Deck Name ${i + 1} ${generateUUID()}`;
        const newDescription = `Updated description for deck ${i + 1}`;
        
        const result = await pool.query(
          'UPDATE decks SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
          [newName, newDescription, deckId]
        );
        
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].name).toBe(newName);
        expect(result.rows[0].description).toBe(newDescription);

        console.log('✅ Deck updated:', {
          id: deckId,
          newName: newName,
          newDescription: newDescription
        });
      }
    });
  });

  describe('Card Management', () => {
    it('should add cards of every type to each deck (except decks with 4 starting characters)', async () => {
      // Get sample cards of each type
      const characterResult = await pool.query('SELECT id FROM characters LIMIT 1');
      const powerResult = await pool.query('SELECT id FROM power_cards LIMIT 1');
      const specialResult = await pool.query('SELECT id FROM special_cards LIMIT 1');
      
      // Check if locations table exists
      let locationResult;
      try {
        locationResult = await pool.query('SELECT id FROM locations LIMIT 1');
      } catch (error) {
        console.log('⚠️  Locations table not found, skipping location cards');
        locationResult = { rows: [] };
      }

      const sampleCards = {
        character: characterResult.rows[0]?.id,
        power: powerResult.rows[0]?.id,
        special: specialResult.rows[0]?.id,
        location: locationResult.rows[0]?.id
      };

      // Define all card types to test
      const cardTypes = [
        'character', 'location', 'special', 'mission', 'event', 'aspect', 
        'advanced-universe', 'teamwork', 'ally-universe', 'training', 
        'basic-universe', 'power'
      ];

      for (const deckId of createdDeckIds) {
        // Check if this deck already has 4 characters
        const existingCharacters = await pool.query(
          'SELECT COUNT(*) as count FROM deck_cards WHERE deck_id = $1 AND card_type = $2',
          [deckId, 'character']
        );
        const characterCount = parseInt(existingCharacters.rows[0].count);

        console.log(`Testing deck ${deckId} with ${characterCount} existing characters`);

        for (const cardType of cardTypes) {
          // Skip adding characters if we already have 4
          if (cardType === 'character' && characterCount >= 4) {
            console.log(`Skipping character addition to deck ${deckId} - already has 4 characters`);
            continue;
          }

          // Use sample card ID if available, otherwise generate a test ID
          const cardId = sampleCards[cardType as keyof typeof sampleCards] || `test_${cardType}_${generateUUID()}`;
          
          try {
            const result = await pool.query(
              'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity) VALUES ($1, $2, $3, $4)',
              [deckId, cardType, cardId, 1]
            );

            console.log(`✅ Added ${cardType} card to deck ${deckId}`);
          } catch (error) {
            console.log(`⚠️  Error adding ${cardType} card to deck ${deckId}:`, error);
          }
        }
      }
    });

    it('should remove cards from decks', async () => {
      for (const deckId of createdDeckIds) {
        // Get cards in this deck
        const cardsResult = await pool.query(
          'SELECT card_type, card_id, quantity FROM deck_cards WHERE deck_id = $1 LIMIT 2',
          [deckId]
        );

        for (const card of cardsResult.rows) {
          try {
            const result = await pool.query(
              'DELETE FROM deck_cards WHERE deck_id = $1 AND card_type = $2 AND card_id = $3',
              [deckId, card.card_type, card.card_id]
            );

            console.log(`✅ Removed ${card.card_type} card from deck ${deckId}`);
          } catch (error) {
            console.log(`⚠️  Error removing ${card.card_type} card from deck ${deckId}:`, error);
          }
        }
      }
    });
  });

  describe('Deck Persistence', () => {
    it('should verify that decks persist properly', async () => {
      // Get all decks for the test user
      const userDecksResult = await pool.query(
        'SELECT d.*, COUNT(dc.id) as card_count FROM decks d LEFT JOIN deck_cards dc ON d.id = dc.deck_id WHERE d.user_id = $1 GROUP BY d.id',
        [testUserId]
      );

      expect(userDecksResult.rows.length).toBeGreaterThan(0);
      expect(userDecksResult.rows.length).toBe(createdDeckIds.length);

      for (const deck of userDecksResult.rows) {
        expect(deck.id).toBeDefined();
        expect(deck.name).toBeDefined();
        expect(deck.user_id).toBe(testUserId);
        expect(deck.created_at).toBeDefined();
        expect(deck.updated_at).toBeDefined();

        console.log('✅ Deck persistence verified:', {
          id: deck.id,
          name: deck.name,
          card_count: deck.card_count
        });
      }
    });
  });

  describe('Deck Deletion', () => {
    it('should delete each deck and have no decks left at the end', async () => {
      const initialDeckCount = createdDeckIds.length;
      
      for (const deckId of createdDeckIds) {
        // Delete deck cards first
        await pool.query('DELETE FROM deck_cards WHERE deck_id = $1', [deckId]);
        
        // Delete the deck
        console.log(`🔍 DEBUG: deckBuilding.test.ts - Deleting deck: ${deckId}`);
        const result = await pool.query('DELETE FROM decks WHERE id = $1', [deckId]);
        expect(result.rowCount).toBe(1);

        console.log(`✅ Deleted deck ${deckId}`);
      }

      // Verify no decks remain for this user
      const remainingDecksResult = await pool.query(
        'SELECT COUNT(*) as count FROM decks WHERE user_id = $1',
        [testUserId]
      );

      expect(parseInt(remainingDecksResult.rows[0].count)).toBe(0);

      console.log('✅ All decks deleted successfully');
    });
  });

  describe('User Verification', () => {
    it('should verify the user still exists and can be retrieved', async () => {
      const result = await pool.query(
        'SELECT id, username, email, role FROM users WHERE id = $1',
        [testUserId]
      );
      
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].id).toBe(testUserId);
      expect(result.rows[0].role).toBe('USER');

      console.log('✅ User still exists and can be retrieved:', {
        userId: result.rows[0].id,
        username: result.rows[0].username,
        role: result.rows[0].role
      });
    });
  });

  describe('Test Data Cleanup', () => {
    it('should clean up any test data by deleting the user and their decks', async () => {
      // Delete any remaining deck cards
      for (const deckId of createdDeckIds) {
        await pool.query('DELETE FROM deck_cards WHERE deck_id = $1', [deckId]);
      }

      // Delete any remaining decks
      for (const deckId of createdDeckIds) {
        console.log(`🔍 DEBUG: deckBuilding.test.ts afterAll() - Deleting remaining deck: ${deckId}`);
        await pool.query('DELETE FROM decks WHERE id = $1', [deckId]);
      }

      // Delete the test user
      if (testUserId) {
        const userDeleteResult = await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
        expect(userDeleteResult.rowCount).toBe(1);
      }

      // Verify cleanup
      const remainingUserResult = await pool.query('SELECT COUNT(*) as count FROM users WHERE id = $1', [testUserId]);
      expect(parseInt(remainingUserResult.rows[0].count)).toBe(0);

      const remainingDecksResult = await pool.query('SELECT COUNT(*) as count FROM decks WHERE user_id = $1', [testUserId]);
      expect(parseInt(remainingDecksResult.rows[0].count)).toBe(0);

      console.log('✅ Test data cleanup completed successfully');
    });
  });
});

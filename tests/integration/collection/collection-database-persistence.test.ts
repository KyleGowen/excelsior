/**
 * Integration tests for Collection Database Persistence
 * 
 * Tests that collection data is properly persisted in the database:
 * - Collections are created and stored correctly
 * - Collection cards are persisted with correct data
 * - Quantity updates are persisted
 * - Card removals are persisted
 * - Data integrity is maintained across operations
 * - Timestamps are properly set
 */

import request from 'supertest';
import { Pool } from 'pg';
import { app } from '../../../src/test-server';
import { DataSourceConfig } from '../../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../../setup-integration';

describe('Collection Database Persistence Integration Tests', () => {
  let pool: Pool;
  let adminUser: any;
  let adminAuthCookie: string;
  let adminUsername: string;
  let testCharacterId: string;
  let testPowerCardId: string;
  let testSpecialCardId: string;

  beforeAll(async () => {
    await integrationTestUtils.ensureGuestUser();
    await integrationTestUtils.ensureAdminUser();

    // Initialize database connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/overpower_deckbuilder_test'
    });

    // Get test card IDs from database
    const characterResult = await pool.query('SELECT id FROM characters LIMIT 1');
    const powerResult = await pool.query('SELECT id FROM power_cards LIMIT 1');
    const specialResult = await pool.query('SELECT id FROM special_cards LIMIT 1');

    if (characterResult.rows.length === 0 || powerResult.rows.length === 0 || specialResult.rows.length === 0) {
      throw new Error('Not enough test cards available in database');
    }

    testCharacterId = characterResult.rows[0].id;
    testPowerCardId = powerResult.rows[0].id;
    testSpecialCardId = specialResult.rows[0].id;

    // Create ADMIN user
    const timestamp = Date.now();
    const userRepository = DataSourceConfig.getInstance().getUserRepository();
    adminUsername = `collection-persistence-admin-${timestamp}`;
    adminUser = await userRepository.createUser(
      adminUsername,
      `admin-${timestamp}@example.com`,
      'adminpass123',
      'ADMIN'
    );
    integrationTestUtils.trackTestUser(adminUser.id);

    // Login as admin
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: adminUsername,
        password: 'adminpass123'
      });

    adminAuthCookie = adminLoginResponse.headers['set-cookie'][0].split(';')[0];
  });

  beforeEach(async () => {
    // Clear collection before each test
    const collectionResult = await pool.query(
      'SELECT id FROM collections WHERE user_id = $1',
      [adminUser.id]
    );
    if (collectionResult.rows.length > 0) {
      const collectionId = collectionResult.rows[0].id;
      await pool.query('DELETE FROM collection_cards WHERE collection_id = $1', [collectionId]);
      await pool.query('DELETE FROM collections WHERE id = $1', [collectionId]);
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Collection Creation', () => {
    it('should create collection in database when first accessed', async () => {
      // Verify collection doesn't exist
      let collectionResult = await pool.query(
        'SELECT * FROM collections WHERE user_id = $1',
        [adminUser.id]
      );
      expect(collectionResult.rows.length).toBe(0);

      // Access collection endpoint
      await request(app)
        .get('/api/collections/me')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      // Verify collection was created
      collectionResult = await pool.query(
        'SELECT * FROM collections WHERE user_id = $1',
        [adminUser.id]
      );
      expect(collectionResult.rows.length).toBe(1);
      expect(collectionResult.rows[0].user_id).toBe(adminUser.id);
      expect(collectionResult.rows[0].id).toBeDefined();
    });

    it('should set created_at timestamp on collection creation', async () => {
      await request(app)
        .get('/api/collections/me')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      const collectionResult = await pool.query(
        'SELECT created_at FROM collections WHERE user_id = $1',
        [adminUser.id]
      );
      expect(collectionResult.rows[0].created_at).toBeDefined();
      expect(new Date(collectionResult.rows[0].created_at).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Card Persistence', () => {
    it('should persist card addition to database', async () => {
      // Add card via API
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/test-character.webp'
        })
        .expect(200);

      // Verify card was persisted
      const collectionResult = await pool.query(
        'SELECT id FROM collections WHERE user_id = $1',
        [adminUser.id]
      );
      const collectionId = collectionResult.rows[0].id;

      const cardResult = await pool.query(
        'SELECT * FROM collection_cards WHERE collection_id = $1 AND card_id = $2',
        [collectionId, testCharacterId]
      );

      expect(cardResult.rows.length).toBe(1);
      expect(cardResult.rows[0].card_id).toBe(testCharacterId);
      expect(cardResult.rows[0].card_type).toBe('character');
      expect(cardResult.rows[0].quantity).toBe(1);
      expect(cardResult.rows[0].image_path).toBe('/images/test-character.webp');
    });

    it('should persist multiple cards correctly', async () => {
      // Add multiple cards
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/test-character.webp'
        });

      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testPowerCardId,
          cardType: 'power',
          quantity: 2,
          imagePath: '/images/test-power.webp'
        });

      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testSpecialCardId,
          cardType: 'special',
          quantity: 3,
          imagePath: '/images/test-special.webp'
        });

      // Verify all cards were persisted
      const collectionResult = await pool.query(
        'SELECT id FROM collections WHERE user_id = $1',
        [adminUser.id]
      );
      const collectionId = collectionResult.rows[0].id;

      const cardResult = await pool.query(
        'SELECT * FROM collection_cards WHERE collection_id = $1 ORDER BY card_type',
        [collectionId]
      );

      expect(cardResult.rows.length).toBe(3);
      expect(cardResult.rows.find((r: any) => r.card_id === testCharacterId)?.quantity).toBe(1);
      expect(cardResult.rows.find((r: any) => r.card_id === testPowerCardId)?.quantity).toBe(2);
      expect(cardResult.rows.find((r: any) => r.card_id === testSpecialCardId)?.quantity).toBe(3);
    });

    it('should set created_at and updated_at timestamps on card addition', async () => {
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/test-character.webp'
        });

      const collectionResult = await pool.query(
        'SELECT id FROM collections WHERE user_id = $1',
        [adminUser.id]
      );
      const collectionId = collectionResult.rows[0].id;

      const cardResult = await pool.query(
        'SELECT created_at, updated_at FROM collection_cards WHERE collection_id = $1 AND card_id = $2',
        [collectionId, testCharacterId]
      );

      expect(cardResult.rows[0].created_at).toBeDefined();
      expect(cardResult.rows[0].updated_at).toBeDefined();
      expect(new Date(cardResult.rows[0].created_at).getTime()).toBeLessThanOrEqual(Date.now());
      expect(new Date(cardResult.rows[0].updated_at).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Quantity Update Persistence', () => {
    beforeEach(async () => {
      // Add a card first
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/test-character.webp'
        });
    });

    it('should persist quantity updates to database', async () => {
      // Update quantity via API
      await request(app)
        .put(`/api/collections/me/cards/${testCharacterId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          quantity: 5,
          cardType: 'character',
          imagePath: '/images/test-character.webp'
        })
        .expect(200);

      // Verify quantity was updated in database
      const collectionResult = await pool.query(
        'SELECT id FROM collections WHERE user_id = $1',
        [adminUser.id]
      );
      const collectionId = collectionResult.rows[0].id;

      const cardResult = await pool.query(
        'SELECT quantity FROM collection_cards WHERE collection_id = $1 AND card_id = $2',
        [collectionId, testCharacterId]
      );

      expect(cardResult.rows[0].quantity).toBe(5);
    });

    it('should update updated_at timestamp on quantity change', async () => {
      const collectionResult = await pool.query(
        'SELECT id FROM collections WHERE user_id = $1',
        [adminUser.id]
      );
      const collectionId = collectionResult.rows[0].id;

      // Get initial updated_at
      const initialResult = await pool.query(
        'SELECT updated_at FROM collection_cards WHERE collection_id = $1 AND card_id = $2',
        [collectionId, testCharacterId]
      );
      const initialUpdatedAt = new Date(initialResult.rows[0].updated_at).getTime();

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update quantity
      await request(app)
        .put(`/api/collections/me/cards/${testCharacterId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          quantity: 3,
          cardType: 'character',
          imagePath: '/images/test-character.webp'
        });

      // Verify updated_at was changed
      const updatedResult = await pool.query(
        'SELECT updated_at FROM collection_cards WHERE collection_id = $1 AND card_id = $2',
        [collectionId, testCharacterId]
      );
      const newUpdatedAt = new Date(updatedResult.rows[0].updated_at).getTime();

      expect(newUpdatedAt).toBeGreaterThanOrEqual(initialUpdatedAt);
    });
  });

  describe('Card Removal Persistence', () => {
    beforeEach(async () => {
      // Add cards first
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/test-character.webp'
        });

      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testPowerCardId,
          cardType: 'power',
          quantity: 1,
          imagePath: '/images/test-power.webp'
        });
    });

    it('should remove card from database when deleted', async () => {
      const collectionResult = await pool.query(
        'SELECT id FROM collections WHERE user_id = $1',
        [adminUser.id]
      );
      const collectionId = collectionResult.rows[0].id;

      // Verify card exists
      let cardResult = await pool.query(
        'SELECT * FROM collection_cards WHERE collection_id = $1 AND card_id = $2',
        [collectionId, testCharacterId]
      );
      expect(cardResult.rows.length).toBe(1);

      // Delete card via API
      await request(app)
        .delete(`/api/collections/me/cards/${testCharacterId}?cardType=character`)
        .set('Cookie', adminAuthCookie)
        .expect(200);

      // Verify card was removed
      cardResult = await pool.query(
        'SELECT * FROM collection_cards WHERE collection_id = $1 AND card_id = $2',
        [collectionId, testCharacterId]
      );
      expect(cardResult.rows.length).toBe(0);

      // Verify other card still exists
      const otherCardResult = await pool.query(
        'SELECT * FROM collection_cards WHERE collection_id = $1 AND card_id = $2',
        [collectionId, testPowerCardId]
      );
      expect(otherCardResult.rows.length).toBe(1);
    });

    it('should remove card when quantity set to 0', async () => {
      const collectionResult = await pool.query(
        'SELECT id FROM collections WHERE user_id = $1',
        [adminUser.id]
      );
      const collectionId = collectionResult.rows[0].id;

      // Set quantity to 0 via API
      await request(app)
        .put(`/api/collections/me/cards/${testCharacterId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          quantity: 0,
          cardType: 'character',
          imagePath: '/images/test-character.webp'
        })
        .expect(200);

      // Verify card was removed
      const cardResult = await pool.query(
        'SELECT * FROM collection_cards WHERE collection_id = $1 AND card_id = $2',
        [collectionId, testCharacterId]
      );
      expect(cardResult.rows.length).toBe(0);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity between collections and users', async () => {
      await request(app)
        .get('/api/collections/me')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      const collectionResult = await pool.query(
        'SELECT c.*, u.username FROM collections c JOIN users u ON c.user_id = u.id WHERE c.user_id = $1',
        [adminUser.id]
      );

      expect(collectionResult.rows.length).toBe(1);
      expect(collectionResult.rows[0].user_id).toBe(adminUser.id);
      expect(collectionResult.rows[0].username).toBe(adminUsername);
    });

    it('should maintain referential integrity between collection_cards and collections', async () => {
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/test-character.webp'
        });

      const collectionResult = await pool.query(
        'SELECT id FROM collections WHERE user_id = $1',
        [adminUser.id]
      );
      const collectionId = collectionResult.rows[0].id;

      const cardResult = await pool.query(
        'SELECT cc.*, c.user_id FROM collection_cards cc JOIN collections c ON cc.collection_id = c.id WHERE cc.collection_id = $1',
        [collectionId]
      );

      expect(cardResult.rows.length).toBe(1);
      expect(cardResult.rows[0].collection_id).toBe(collectionId);
      expect(cardResult.rows[0].user_id).toBe(adminUser.id);
    });

    it('should handle duplicate card additions correctly', async () => {
      // Add same card twice
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/test-character.webp'
        });

      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: 2,
          imagePath: '/images/test-character.webp'
        });

      // Verify only one record exists with correct quantity
      const collectionResult = await pool.query(
        'SELECT id FROM collections WHERE user_id = $1',
        [adminUser.id]
      );
      const collectionId = collectionResult.rows[0].id;

      const cardResult = await pool.query(
        'SELECT * FROM collection_cards WHERE collection_id = $1 AND card_id = $2',
        [collectionId, testCharacterId]
      );

      expect(cardResult.rows.length).toBe(1);
      expect(cardResult.rows[0].quantity).toBe(3); // 1 + 2
    });
  });
});


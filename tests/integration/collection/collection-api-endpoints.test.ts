/**
 * Integration tests for Collection API endpoints
 * 
 * Tests all CRUD operations for the collection feature:
 * - GET /api/collections/me - Get current user's collection
 * - GET /api/collections/me/cards - Get all cards in user's collection
 * - POST /api/collections/me/cards - Add card to collection
 * - PUT /api/collections/me/cards/:cardId - Update card quantity
 * - DELETE /api/collections/me/cards/:cardId - Remove card from collection
 * 
 * All endpoints require ADMIN role.
 */

import request from 'supertest';
import { Pool } from 'pg';
import { app } from '../../../src/test-server';
import { DataSourceConfig } from '../../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../../setup-integration';

describe('Collection API Endpoints Integration Tests', () => {
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
    adminUsername = `collection-admin-${timestamp}`;
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

    expect(adminLoginResponse.status).toBe(200);
    adminAuthCookie = adminLoginResponse.headers['set-cookie'][0].split(';')[0];
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/collections/me', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/collections/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Authentication required');
    });

    it('should return collection ID for ADMIN user', async () => {
      const response = await request(app)
        .get('/api/collections/me')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.user_id).toBe(adminUser.id);
    });

    it('should create collection if it does not exist', async () => {
      const response = await request(app)
        .get('/api/collections/me')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
    });

    it('should return same collection ID on subsequent calls', async () => {
      const firstResponse = await request(app)
        .get('/api/collections/me')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      const secondResponse = await request(app)
        .get('/api/collections/me')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(firstResponse.body.data.id).toBe(secondResponse.body.data.id);
    });
  });

  describe('GET /api/collections/me/cards', () => {
    beforeEach(async () => {
      // Clear collection before each test
      const collectionResult = await pool.query(
        'SELECT id FROM collections WHERE user_id = $1',
        [adminUser.id]
      );
      if (collectionResult.rows.length > 0) {
        const collectionId = collectionResult.rows[0].id;
        await pool.query('DELETE FROM collection_cards WHERE collection_id = $1', [collectionId]);
      }
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/collections/me/cards')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return empty array for empty collection', async () => {
      const response = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return all cards in collection', async () => {
      // Add a card first
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

      const response = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].card_id).toBe(testCharacterId);
      expect(response.body.data[0].card_type).toBe('character');
      expect(response.body.data[0].quantity).toBe(1);
    });

    it('should return multiple cards with correct quantities', async () => {
      // Add multiple cards
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: 2,
          imagePath: '/images/test-character.webp'
        });

      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testPowerCardId,
          cardType: 'power',
          quantity: 3,
          imagePath: '/images/test-power.webp'
        });

      const response = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      
      const characterCard = response.body.data.find((c: any) => c.card_id === testCharacterId);
      const powerCard = response.body.data.find((c: any) => c.card_id === testPowerCardId);
      
      expect(characterCard).toBeDefined();
      expect(characterCard.quantity).toBe(2);
      expect(powerCard).toBeDefined();
      expect(powerCard.quantity).toBe(3);
    });
  });

  describe('POST /api/collections/me/cards', () => {
    beforeEach(async () => {
      // Clear collection before each test
      const collectionResult = await pool.query(
        'SELECT id FROM collections WHERE user_id = $1',
        [adminUser.id]
      );
      if (collectionResult.rows.length > 0) {
        const collectionId = collectionResult.rows[0].id;
        await pool.query('DELETE FROM collection_cards WHERE collection_id = $1', [collectionId]);
      }
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: 1
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should add character card to collection', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/test-character.webp'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.card_id).toBe(testCharacterId);
      expect(response.body.data.card_type).toBe('character');
      expect(response.body.data.quantity).toBe(1);
      expect(response.body.data.image_path).toBe('/images/test-character.webp');
    });

    it('should add power card to collection', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testPowerCardId,
          cardType: 'power',
          quantity: 2,
          imagePath: '/images/test-power.webp'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.card_id).toBe(testPowerCardId);
      expect(response.body.data.card_type).toBe('power');
      expect(response.body.data.quantity).toBe(2);
    });

    it('should add special card to collection', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testSpecialCardId,
          cardType: 'special',
          quantity: 1,
          imagePath: '/images/test-special.webp'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.card_id).toBe(testSpecialCardId);
      expect(response.body.data.card_type).toBe('special');
    });

    it('should increment quantity when adding same card again', async () => {
      // Add card first time
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

      // Add same card again
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: 2,
          imagePath: '/images/test-character.webp'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(3); // 1 + 2
    });

    it('should default quantity to 1 if not provided', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          imagePath: '/images/test-character.webp'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(1);
    });

    it('should require cardId and cardType', async () => {
      const response1 = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardType: 'character',
          imagePath: '/images/test-character.webp'
        })
        .expect(400);

      expect(response1.body.success).toBe(false);
      expect(response1.body.error).toContain('cardId and cardType are required');

      const response2 = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          imagePath: '/images/test-character.webp'
        })
        .expect(400);

      expect(response2.body.success).toBe(false);
      expect(response2.body.error).toContain('cardId and cardType are required');
    });

    it('should return 404 for non-existent card', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: 'non-existent-card-id',
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/test-character.webp'
        });

      expect([404, 500]).toContain(response.status);
      if (response.status === 404) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('does not exist');
      }
    });
  });

  describe('PUT /api/collections/me/cards/:cardId', () => {
    beforeEach(async () => {
      // Clear collection and add a test card
      const collectionResult = await pool.query(
        'SELECT id FROM collections WHERE user_id = $1',
        [adminUser.id]
      );
      if (collectionResult.rows.length > 0) {
        const collectionId = collectionResult.rows[0].id;
        await pool.query('DELETE FROM collection_cards WHERE collection_id = $1', [collectionId]);
      }

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

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/collections/me/cards/${testCharacterId}`)
        .send({
          quantity: 5,
          cardType: 'character',
          imagePath: '/images/test-character.webp'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should update card quantity', async () => {
      const response = await request(app)
        .put(`/api/collections/me/cards/${testCharacterId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          quantity: 5,
          cardType: 'character',
          imagePath: '/images/test-character.webp'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(5);
      expect(response.body.data.card_id).toBe(testCharacterId);
    });

    it('should remove card when quantity is set to 0', async () => {
      const response = await request(app)
        .put(`/api/collections/me/cards/${testCharacterId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          quantity: 0,
          cardType: 'character',
          imagePath: '/images/test-character.webp'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
      expect(response.body.message).toContain('removed');

      // Verify card is removed
      const getResponse = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      const card = getResponse.body.data.find((c: any) => c.card_id === testCharacterId);
      expect(card).toBeUndefined();
    });

    it('should require quantity parameter', async () => {
      const response = await request(app)
        .put(`/api/collections/me/cards/${testCharacterId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          cardType: 'character',
          imagePath: '/images/test-character.webp'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('quantity is required');
    });

    it('should require cardType parameter', async () => {
      const response = await request(app)
        .put(`/api/collections/me/cards/${testCharacterId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          quantity: 5,
          imagePath: '/images/test-character.webp'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('cardType is required');
    });

    it('should require imagePath parameter', async () => {
      const response = await request(app)
        .put(`/api/collections/me/cards/${testCharacterId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          quantity: 5,
          cardType: 'character'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('imagePath is required');
    });

    it('should reject negative quantities', async () => {
      const response = await request(app)
        .put(`/api/collections/me/cards/${testCharacterId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          quantity: -1,
          cardType: 'character',
          imagePath: '/images/test-character.webp'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('cannot be negative');
    });

    it('should return 404 for non-existent card in collection', async () => {
      const response = await request(app)
        .put(`/api/collections/me/cards/non-existent-card-id`)
        .set('Cookie', adminAuthCookie)
        .send({
          quantity: 5,
          cardType: 'character',
          imagePath: '/images/test-character.webp'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('DELETE /api/collections/me/cards/:cardId', () => {
    beforeEach(async () => {
      // Clear collection and add a test card
      const collectionResult = await pool.query(
        'SELECT id FROM collections WHERE user_id = $1',
        [adminUser.id]
      );
      if (collectionResult.rows.length > 0) {
        const collectionId = collectionResult.rows[0].id;
        await pool.query('DELETE FROM collection_cards WHERE collection_id = $1', [collectionId]);
      }

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

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/collections/me/cards/${testCharacterId}?cardType=character`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should remove card from collection', async () => {
      const response = await request(app)
        .delete(`/api/collections/me/cards/${testCharacterId}?cardType=character`)
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removed');

      // Verify card is removed
      const getResponse = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      const card = getResponse.body.data.find((c: any) => c.card_id === testCharacterId);
      expect(card).toBeUndefined();
    });

    it('should require cardType query parameter', async () => {
      const response = await request(app)
        .delete(`/api/collections/me/cards/${testCharacterId}`)
        .set('Cookie', adminAuthCookie)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('cardType query parameter is required');
    });

    it('should return 404 for non-existent card', async () => {
      const response = await request(app)
        .delete(`/api/collections/me/cards/non-existent-card-id?cardType=character`)
        .set('Cookie', adminAuthCookie)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });
});


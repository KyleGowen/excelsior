/**
 * Integration tests for Collection Admin Access Control
 * 
 * Tests that all collection endpoints properly enforce ADMIN-only access:
 * - Non-admin users receive 403 Forbidden
 * - Unauthenticated users receive 401 Unauthorized
 * - ADMIN users can access all endpoints
 * - Role-based restrictions are properly enforced
 */

import request from 'supertest';
import { Pool } from 'pg';
import { app } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../../setup-integration';

describe('Collection Admin Access Control Integration Tests', () => {
  let pool: Pool;
  let adminUser: any;
  let regularUser: any;
  let guestUser: any;
  let adminAuthCookie: string;
  let regularAuthCookie: string;
  let guestAuthCookie: string;
  let adminUsername: string;
  let regularUsername: string;
  let testCharacterId: string;

  beforeAll(async () => {
    await integrationTestUtils.ensureGuestUser();
    await integrationTestUtils.ensureAdminUser();

    // Initialize database connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/overpower_deckbuilder_test'
    });

    // Get test card ID
    const characterResult = await pool.query('SELECT id FROM characters LIMIT 1');
    if (characterResult.rows.length === 0) {
      throw new Error('No test cards available in database');
    }
    testCharacterId = characterResult.rows[0].id;

    // Create users with different roles
    const timestamp = Date.now();
    const userRepository = DataSourceConfig.getInstance().getUserRepository();
    
    // Create ADMIN user
    adminUsername = `collection-admin-${timestamp}`;
    adminUser = await userRepository.createUser(
      adminUsername,
      `admin-${timestamp}@example.com`,
      'adminpass123',
      'ADMIN'
    );
    integrationTestUtils.trackTestUser(adminUser.id);

    // Create regular USER
    regularUsername = `collection-user-${timestamp}`;
    regularUser = await userRepository.createUser(
      regularUsername,
      `user-${timestamp}@example.com`,
      'userpass123',
      'USER'
    );
    integrationTestUtils.trackTestUser(regularUser.id);

    // Create GUEST user
    const guestUsername = `collection-guest-${timestamp}`;
    guestUser = await userRepository.createUser(
      guestUsername,
      `guest-${timestamp}@example.com`,
      'guestpass123',
      'GUEST'
    );
    integrationTestUtils.trackTestUser(guestUser.id);

    // Login as admin
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: adminUsername,
        password: 'adminpass123'
      });
    adminAuthCookie = adminLoginResponse.headers['set-cookie'][0].split(';')[0];

    // Login as regular user
    const regularLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: regularUsername,
        password: 'userpass123'
      });
    regularAuthCookie = regularLoginResponse.headers['set-cookie'][0].split(';')[0];

    // Login as guest
    const guestLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: guestUsername,
        password: 'guestpass123'
      });
    guestAuthCookie = guestLoginResponse.headers['set-cookie'][0].split(';')[0];
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/collections/me', () => {
    it('should allow ADMIN users to access', async () => {
      const response = await request(app)
        .get('/api/collections/me')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should block regular USER from accessing', async () => {
      const response = await request(app)
        .get('/api/collections/me')
        .set('Cookie', regularAuthCookie)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only ADMIN users can access collections');
    });

    it('should block GUEST users from accessing', async () => {
      const response = await request(app)
        .get('/api/collections/me')
        .set('Cookie', guestAuthCookie)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only ADMIN users can access collections');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/collections/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Authentication required');
    });
  });

  describe('GET /api/collections/me/cards', () => {
    it('should allow ADMIN users to access', async () => {
      const response = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should block regular USER from accessing', async () => {
      const response = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', regularAuthCookie)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only ADMIN users can access collections');
    });

    it('should block GUEST users from accessing', async () => {
      const response = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', guestAuthCookie)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only ADMIN users can access collections');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/collections/me/cards')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/collections/me/cards', () => {
    beforeEach(async () => {
      // Clear admin's collection before each test
      const collectionResult = await pool.query(
        'SELECT id FROM collections WHERE user_id = $1',
        [adminUser.id]
      );
      if (collectionResult.rows.length > 0) {
        const collectionId = collectionResult.rows[0].id;
        await pool.query('DELETE FROM collection_cards WHERE collection_id = $1', [collectionId]);
      }
    });

    it('should allow ADMIN users to add cards', async () => {
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
      expect(response.body.data).toBeDefined();
    });

    it('should block regular USER from adding cards', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', regularAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/test-character.webp'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only ADMIN users can modify collections');
    });

    it('should block GUEST users from adding cards', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', guestAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/test-character.webp'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only ADMIN users can modify collections');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/test-character.webp'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/collections/me/cards/:cardId', () => {
    beforeEach(async () => {
      // Add a card to admin's collection for testing updates
      const collectionResult = await pool.query(
        'SELECT id FROM collections WHERE user_id = $1',
        [adminUser.id]
      );
      let collectionId: string;
      if (collectionResult.rows.length === 0) {
        const insertResult = await pool.query(
          'INSERT INTO collections (user_id) VALUES ($1) RETURNING id',
          [adminUser.id]
        );
        collectionId = insertResult.rows[0].id;
      } else {
        collectionId = collectionResult.rows[0].id;
        await pool.query('DELETE FROM collection_cards WHERE collection_id = $1', [collectionId]);
      }

      await pool.query(
        'INSERT INTO collection_cards (collection_id, card_id, card_type, quantity, image_path) VALUES ($1, $2, $3, $4, $5)',
        [collectionId, testCharacterId, 'character', 1, '/images/test-character.webp']
      );
    });

    it('should allow ADMIN users to update cards', async () => {
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
    });

    it('should block regular USER from updating cards', async () => {
      const response = await request(app)
        .put(`/api/collections/me/cards/${testCharacterId}`)
        .set('Cookie', regularAuthCookie)
        .send({
          quantity: 5,
          cardType: 'character',
          imagePath: '/images/test-character.webp'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only ADMIN users can modify collections');
    });

    it('should block GUEST users from updating cards', async () => {
      const response = await request(app)
        .put(`/api/collections/me/cards/${testCharacterId}`)
        .set('Cookie', guestAuthCookie)
        .send({
          quantity: 5,
          cardType: 'character',
          imagePath: '/images/test-character.webp'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only ADMIN users can modify collections');
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
  });

  describe('DELETE /api/collections/me/cards/:cardId', () => {
    beforeEach(async () => {
      // Add a card to admin's collection for testing deletion
      const collectionResult = await pool.query(
        'SELECT id FROM collections WHERE user_id = $1',
        [adminUser.id]
      );
      let collectionId: string;
      if (collectionResult.rows.length === 0) {
        const insertResult = await pool.query(
          'INSERT INTO collections (user_id) VALUES ($1) RETURNING id',
          [adminUser.id]
        );
        collectionId = insertResult.rows[0].id;
      } else {
        collectionId = collectionResult.rows[0].id;
        await pool.query('DELETE FROM collection_cards WHERE collection_id = $1', [collectionId]);
      }

      await pool.query(
        'INSERT INTO collection_cards (collection_id, card_id, card_type, quantity, image_path) VALUES ($1, $2, $3, $4, $5)',
        [collectionId, testCharacterId, 'character', 1, '/images/test-character.webp']
      );
    });

    it('should allow ADMIN users to delete cards', async () => {
      const response = await request(app)
        .delete(`/api/collections/me/cards/${testCharacterId}?cardType=character`)
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removed');
    });

    it('should block regular USER from deleting cards', async () => {
      const response = await request(app)
        .delete(`/api/collections/me/cards/${testCharacterId}?cardType=character`)
        .set('Cookie', regularAuthCookie)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only ADMIN users can modify collections');
    });

    it('should block GUEST users from deleting cards', async () => {
      const response = await request(app)
        .delete(`/api/collections/me/cards/${testCharacterId}?cardType=character`)
        .set('Cookie', guestAuthCookie)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only ADMIN users can modify collections');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/collections/me/cards/${testCharacterId}?cardType=character`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Role consistency across all endpoints', () => {
    it('should consistently enforce ADMIN-only access', async () => {
      const endpoints = [
        { method: 'get', path: '/api/collections/me' },
        { method: 'get', path: '/api/collections/me/cards' },
        { method: 'post', path: '/api/collections/me/cards', body: { cardId: testCharacterId, cardType: 'character', quantity: 1, imagePath: '/images/test.webp' } },
        { method: 'put', path: `/api/collections/me/cards/${testCharacterId}`, body: { quantity: 5, cardType: 'character', imagePath: '/images/test.webp' } },
        { method: 'delete', path: `/api/collections/me/cards/${testCharacterId}?cardType=character` }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          [endpoint.method](endpoint.path)
          .set('Cookie', regularAuthCookie)
          .send(endpoint.body || {})
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/Only ADMIN users can/i);
      }
    });
  });
});


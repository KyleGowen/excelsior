/**
 * Integration tests for Collection Cross-User Isolation
 * 
 * Tests that collections are properly isolated between users:
 * - Users cannot access other users' collections
 * - Users cannot modify other users' collections
 * - Each user has their own independent collection
 * - Collection data is properly scoped to user
 * - Multiple users can have collections simultaneously
 */

import request from 'supertest';
import { Pool } from 'pg';
import { app } from '../../../src/test-server';
import { DataSourceConfig } from '../../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../../setup-integration';

describe('Collection Cross-User Isolation Integration Tests', () => {
  let pool: Pool;
  let adminUser1: any;
  let adminUser2: any;
  let adminUser3: any;
  let adminAuthCookie1: string;
  let adminAuthCookie2: string;
  let adminAuthCookie3: string;
  let adminUsername1: string;
  let adminUsername2: string;
  let adminUsername3: string;
  let testCharacterId1: string;
  let testCharacterId2: string;
  let testPowerCardId1: string;

  beforeAll(async () => {
    await integrationTestUtils.ensureGuestUser();
    await integrationTestUtils.ensureAdminUser();

    // Initialize database connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/overpower_deckbuilder_test'
    });

    // Get test card IDs
    const characterResult = await pool.query('SELECT id FROM characters LIMIT 2');
    const powerResult = await pool.query('SELECT id FROM power_cards LIMIT 1');

    if (characterResult.rows.length < 2 || powerResult.rows.length < 1) {
      throw new Error('Not enough test cards available in database');
    }

    testCharacterId1 = characterResult.rows[0].id;
    testCharacterId2 = characterResult.rows[1].id;
    testPowerCardId1 = powerResult.rows[0].id;

    // Create multiple ADMIN users
    const timestamp = Date.now();
    const userRepository = DataSourceConfig.getInstance().getUserRepository();

    adminUsername1 = `collection-isolation-admin1-${timestamp}`;
    adminUser1 = await userRepository.createUser(
      adminUsername1,
      `admin1-${timestamp}@example.com`,
      'adminpass123',
      'ADMIN'
    );
    integrationTestUtils.trackTestUser(adminUser1.id);

    adminUsername2 = `collection-isolation-admin2-${timestamp}`;
    adminUser2 = await userRepository.createUser(
      adminUsername2,
      `admin2-${timestamp}@example.com`,
      'adminpass123',
      'ADMIN'
    );
    integrationTestUtils.trackTestUser(adminUser2.id);

    adminUsername3 = `collection-isolation-admin3-${timestamp}`;
    adminUser3 = await userRepository.createUser(
      adminUsername3,
      `admin3-${timestamp}@example.com`,
      'adminpass123',
      'ADMIN'
    );
    integrationTestUtils.trackTestUser(adminUser3.id);

    // Login all users
    const login1 = await request(app)
      .post('/api/auth/login')
      .send({ username: adminUsername1, password: 'adminpass123' });
    adminAuthCookie1 = login1.headers['set-cookie'][0].split(';')[0];

    const login2 = await request(app)
      .post('/api/auth/login')
      .send({ username: adminUsername2, password: 'adminpass123' });
    adminAuthCookie2 = login2.headers['set-cookie'][0].split(';')[0];

    const login3 = await request(app)
      .post('/api/auth/login')
      .send({ username: adminUsername3, password: 'adminpass123' });
    adminAuthCookie3 = login3.headers['set-cookie'][0].split(';')[0];
  });

  beforeEach(async () => {
    // Clear all collections before each test
    const users = [adminUser1, adminUser2, adminUser3];
    for (const user of users) {
      const collectionResult = await pool.query(
        'SELECT id FROM collections WHERE user_id = $1',
        [user.id]
      );
      if (collectionResult.rows.length > 0) {
        const collectionId = collectionResult.rows[0].id;
        await pool.query('DELETE FROM collection_cards WHERE collection_id = $1', [collectionId]);
        await pool.query('DELETE FROM collections WHERE id = $1', [collectionId]);
      }
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Collection ID Isolation', () => {
    it('should create separate collections for different users', async () => {
      const response1 = await request(app)
        .get('/api/collections/me')
        .set('Cookie', adminAuthCookie1)
        .expect(200);

      const response2 = await request(app)
        .get('/api/collections/me')
        .set('Cookie', adminAuthCookie2)
        .expect(200);

      expect(response1.body.data.id).not.toBe(response2.body.data.id);
      expect(response1.body.data.user_id).toBe(adminUser1.id);
      expect(response2.body.data.user_id).toBe(adminUser2.id);
    });

    it('should maintain consistent collection IDs per user', async () => {
      const response1a = await request(app)
        .get('/api/collections/me')
        .set('Cookie', adminAuthCookie1)
        .expect(200);

      const response1b = await request(app)
        .get('/api/collections/me')
        .set('Cookie', adminAuthCookie1)
        .expect(200);

      expect(response1a.body.data.id).toBe(response1b.body.data.id);
    });
  });

  describe('Card Data Isolation', () => {
    it('should isolate cards between users', async () => {
      // User 1 adds card
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie1)
        .send({
          cardId: testCharacterId1,
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/char1.webp'
        })
        .expect(200);

      // User 2 adds different card
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie2)
        .send({
          cardId: testCharacterId2,
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/char2.webp'
        })
        .expect(200);

      // Verify each user only sees their own cards
      const response1 = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie1)
        .expect(200);

      const response2 = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie2)
        .expect(200);

      expect(response1.body.data.length).toBe(1);
      expect(response1.body.data[0].card_id).toBe(testCharacterId1);
      expect(response2.body.data.length).toBe(1);
      expect(response2.body.data[0].card_id).toBe(testCharacterId2);
    });

    it('should allow same card in multiple users\' collections', async () => {
      // Both users add the same card
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie1)
        .send({
          cardId: testCharacterId1,
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/char1.webp'
        })
        .expect(200);

      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie2)
        .send({
          cardId: testCharacterId1,
          cardType: 'character',
          quantity: 2,
          imagePath: '/images/char1.webp'
        })
        .expect(200);

      // Verify both have the card with their own quantities
      const response1 = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie1)
        .expect(200);

      const response2 = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie2)
        .expect(200);

      expect(response1.body.data[0].quantity).toBe(1);
      expect(response2.body.data[0].quantity).toBe(2);
    });
  });

  describe('Quantity Isolation', () => {
    beforeEach(async () => {
      // Both users add the same card with different quantities
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie1)
        .send({
          cardId: testCharacterId1,
          cardType: 'character',
          quantity: 3,
          imagePath: '/images/char1.webp'
        });

      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie2)
        .send({
          cardId: testCharacterId1,
          cardType: 'character',
          quantity: 5,
          imagePath: '/images/char1.webp'
        });
    });

    it('should maintain independent quantities per user', async () => {
      const response1 = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie1)
        .expect(200);

      const response2 = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie2)
        .expect(200);

      expect(response1.body.data[0].quantity).toBe(3);
      expect(response2.body.data[0].quantity).toBe(5);
    });

    it('should allow independent quantity updates', async () => {
      // User 1 updates quantity
      await request(app)
        .put(`/api/collections/me/cards/${testCharacterId1}`)
        .set('Cookie', adminAuthCookie1)
        .send({
          quantity: 10,
          cardType: 'character',
          imagePath: '/images/char1.webp'
        })
        .expect(200);

      // User 2 updates quantity differently
      await request(app)
        .put(`/api/collections/me/cards/${testCharacterId1}`)
        .set('Cookie', adminAuthCookie2)
        .send({
          quantity: 7,
          cardType: 'character',
          imagePath: '/images/char1.webp'
        })
        .expect(200);

      // Verify independent updates
      const response1 = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie1)
        .expect(200);

      const response2 = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie2)
        .expect(200);

      expect(response1.body.data[0].quantity).toBe(10);
      expect(response2.body.data[0].quantity).toBe(7);
    });
  });

  describe('Card Removal Isolation', () => {
    beforeEach(async () => {
      // Both users add the same card
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie1)
        .send({
          cardId: testCharacterId1,
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/char1.webp'
        });

      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie2)
        .send({
          cardId: testCharacterId1,
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/char1.webp'
        });
    });

    it('should allow one user to remove card without affecting others', async () => {
      // User 1 removes card
      await request(app)
        .delete(`/api/collections/me/cards/${testCharacterId1}?cardType=character`)
        .set('Cookie', adminAuthCookie1)
        .expect(200);

      // Verify User 1's collection is empty
      const response1 = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie1)
        .expect(200);

      // Verify User 2 still has the card
      const response2 = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie2)
        .expect(200);

      expect(response1.body.data.length).toBe(0);
      expect(response2.body.data.length).toBe(1);
      expect(response2.body.data[0].card_id).toBe(testCharacterId1);
    });
  });

  describe('Multiple Users Simultaneous Operations', () => {
    it('should handle multiple users adding cards simultaneously', async () => {
      // All three users add different cards
      await Promise.all([
        request(app)
          .post('/api/collections/me/cards')
          .set('Cookie', adminAuthCookie1)
          .send({
            cardId: testCharacterId1,
            cardType: 'character',
            quantity: 1,
            imagePath: '/images/char1.webp'
          }),
        request(app)
          .post('/api/collections/me/cards')
          .set('Cookie', adminAuthCookie2)
          .send({
            cardId: testCharacterId2,
            cardType: 'character',
            quantity: 1,
            imagePath: '/images/char2.webp'
          }),
        request(app)
          .post('/api/collections/me/cards')
          .set('Cookie', adminAuthCookie3)
          .send({
            cardId: testPowerCardId1,
            cardType: 'power',
            quantity: 1,
            imagePath: '/images/power1.webp'
          })
      ]);

      // Verify each user has their own card
      const [response1, response2, response3] = await Promise.all([
        request(app)
          .get('/api/collections/me/cards')
          .set('Cookie', adminAuthCookie1),
        request(app)
          .get('/api/collections/me/cards')
          .set('Cookie', adminAuthCookie2),
        request(app)
          .get('/api/collections/me/cards')
          .set('Cookie', adminAuthCookie3)
      ]);

      expect(response1.body.data[0].card_id).toBe(testCharacterId1);
      expect(response2.body.data[0].card_id).toBe(testCharacterId2);
      expect(response3.body.data[0].card_id).toBe(testPowerCardId1);
    });

    it('should maintain isolation during concurrent updates', async () => {
      // Both users add the same card
      await Promise.all([
        request(app)
          .post('/api/collections/me/cards')
          .set('Cookie', adminAuthCookie1)
          .send({
            cardId: testCharacterId1,
            cardType: 'character',
            quantity: 1,
            imagePath: '/images/char1.webp'
          }),
        request(app)
          .post('/api/collections/me/cards')
          .set('Cookie', adminAuthCookie2)
          .send({
            cardId: testCharacterId1,
            cardType: 'character',
            quantity: 1,
            imagePath: '/images/char1.webp'
          })
      ]);

      // Both users update simultaneously
      await Promise.all([
        request(app)
          .put(`/api/collections/me/cards/${testCharacterId1}`)
          .set('Cookie', adminAuthCookie1)
          .send({
            quantity: 10,
            cardType: 'character',
            imagePath: '/images/char1.webp'
          }),
        request(app)
          .put(`/api/collections/me/cards/${testCharacterId1}`)
          .set('Cookie', adminAuthCookie2)
          .send({
            quantity: 20,
            cardType: 'character',
            imagePath: '/images/char1.webp'
          })
      ]);

      // Verify independent updates
      const [response1, response2] = await Promise.all([
        request(app)
          .get('/api/collections/me/cards')
          .set('Cookie', adminAuthCookie1),
        request(app)
          .get('/api/collections/me/cards')
          .set('Cookie', adminAuthCookie2)
      ]);

      expect(response1.body.data[0].quantity).toBe(10);
      expect(response2.body.data[0].quantity).toBe(20);
    });
  });

  describe('Database-Level Isolation', () => {
    it('should store collections with correct user_id foreign keys', async () => {
      // Create collections for all users
      await request(app)
        .get('/api/collections/me')
        .set('Cookie', adminAuthCookie1)
        .expect(200);

      await request(app)
        .get('/api/collections/me')
        .set('Cookie', adminAuthCookie2)
        .expect(200);

      // Verify database records
      const result = await pool.query(
        'SELECT id, user_id FROM collections WHERE user_id IN ($1, $2) ORDER BY user_id',
        [adminUser1.id, adminUser2.id]
      );

      expect(result.rows.length).toBe(2);
      expect(result.rows[0].user_id).toBe(adminUser1.id);
      expect(result.rows[1].user_id).toBe(adminUser2.id);
    });

    it('should store collection cards with correct collection_id foreign keys', async () => {
      // Add cards to both users
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie1)
        .send({
          cardId: testCharacterId1,
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/char1.webp'
        });

      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie2)
        .send({
          cardId: testCharacterId2,
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/char2.webp'
        });

      // Verify database records
      const collections = await pool.query(
        'SELECT id FROM collections WHERE user_id IN ($1, $2) ORDER BY user_id',
        [adminUser1.id, adminUser2.id]
      );

      const collectionId1 = collections.rows[0].id;
      const collectionId2 = collections.rows[1].id;

      const cards1 = await pool.query(
        'SELECT * FROM collection_cards WHERE collection_id = $1',
        [collectionId1]
      );

      const cards2 = await pool.query(
        'SELECT * FROM collection_cards WHERE collection_id = $1',
        [collectionId2]
      );

      expect(cards1.rows.length).toBe(1);
      expect(cards1.rows[0].card_id).toBe(testCharacterId1);
      expect(cards2.rows.length).toBe(1);
      expect(cards2.rows[0].card_id).toBe(testCharacterId2);
    });
  });
});


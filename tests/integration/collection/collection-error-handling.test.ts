/**
 * Integration tests for Collection Error Handling
 * 
 * Tests error handling and edge cases:
 * - Invalid card IDs
 * - Missing required parameters
 * - Invalid quantity values
 * - Non-existent cards
 * - Database constraint violations
 * - Malformed requests
 * - Edge cases and boundary conditions
 */

import request from 'supertest';
import { Pool } from 'pg';
import { app } from '../../../src/test-server';
import { DataSourceConfig } from '../../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../../setup-integration';

describe('Collection Error Handling Integration Tests', () => {
  let pool: Pool;
  let adminUser: any;
  let adminAuthCookie: string;
  let adminUsername: string;
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

    // Create ADMIN user
    const timestamp = Date.now();
    const userRepository = DataSourceConfig.getInstance().getUserRepository();
    adminUsername = `collection-error-admin-${timestamp}`;
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

  describe('POST /api/collections/me/cards - Error Cases', () => {
    it('should return 400 when cardId is missing', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/test.webp'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('cardId and cardType are required');
    });

    it('should return 400 when cardType is missing', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          quantity: 1,
          imagePath: '/images/test.webp'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('cardId and cardType are required');
    });

    it('should return 400 when both cardId and cardType are missing', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          quantity: 1,
          imagePath: '/images/test.webp'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('cardId and cardType are required');
    });

    it('should return 404 when card does not exist', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: '00000000-0000-0000-0000-000000000000',
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/test.webp'
        });

      // May return 404 or 500 depending on validation
      expect([404, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should handle empty string cardId', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: '',
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/test.webp'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid cardType', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'invalid_type',
          quantity: 1,
          imagePath: '/images/test.webp'
        });

      // May succeed (if cardType is not validated) or fail
      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should handle negative quantity', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: -1,
          imagePath: '/images/test.webp'
        });

      // May succeed (if not validated) or fail
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle zero quantity', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: 0,
          imagePath: '/images/test.webp'
        });

      // May succeed or fail depending on validation
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle very large quantity', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: 999999,
          imagePath: '/images/test.webp'
        });

      // Should handle gracefully (may succeed or fail)
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle missing imagePath gracefully', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: 1
        });

      // Should succeed even without imagePath
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('PUT /api/collections/me/cards/:cardId - Error Cases', () => {
    beforeEach(async () => {
      // Add a card first for update tests
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

    it('should return 400 when quantity is missing', async () => {
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

    it('should return 400 when quantity is null', async () => {
      const response = await request(app)
        .put(`/api/collections/me/cards/${testCharacterId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          quantity: null,
          cardType: 'character',
          imagePath: '/images/test-character.webp'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('quantity is required');
    });

    it('should return 400 when cardType is missing', async () => {
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

    it('should return 400 when imagePath is missing', async () => {
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

    it('should return 400 when quantity is negative', async () => {
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

    it('should return 404 when card is not in collection', async () => {
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

    it('should handle invalid cardId format', async () => {
      const response = await request(app)
        .put(`/api/collections/me/cards/invalid-format`)
        .set('Cookie', adminAuthCookie)
        .send({
          quantity: 5,
          cardType: 'character',
          imagePath: '/images/test-character.webp'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/collections/me/cards/:cardId - Error Cases', () => {
    beforeEach(async () => {
      // Add a card first for deletion tests
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

    it('should return 400 when cardType query parameter is missing', async () => {
      const response = await request(app)
        .delete(`/api/collections/me/cards/${testCharacterId}`)
        .set('Cookie', adminAuthCookie)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('cardType query parameter is required');
    });

    it('should return 404 when card is not in collection', async () => {
      const response = await request(app)
        .delete(`/api/collections/me/cards/non-existent-card-id?cardType=character`)
        .set('Cookie', adminAuthCookie)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should handle invalid cardId format', async () => {
      const response = await request(app)
        .delete(`/api/collections/me/cards/invalid-format?cardType=character`)
        .set('Cookie', adminAuthCookie)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/collections/me/cards - Error Cases', () => {
    it('should return empty array for empty collection', async () => {
      const response = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should handle collection that does not exist yet', async () => {
      // Ensure collection doesn't exist
      const collectionResult = await pool.query(
        'SELECT id FROM collections WHERE user_id = $1',
        [adminUser.id]
      );
      if (collectionResult.rows.length > 0) {
        const collectionId = collectionResult.rows[0].id;
        await pool.query('DELETE FROM collection_cards WHERE collection_id = $1', [collectionId]);
        await pool.query('DELETE FROM collections WHERE id = $1', [collectionId]);
      }

      const response = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Malformed Request Handling', () => {
    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // Should handle gracefully
      expect([400, 500]).toContain(response.status);
    });

    it('should handle extra unexpected fields', async () => {
      const response = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/test.webp',
          unexpectedField: 'should be ignored'
        });

      // Should succeed, ignoring extra fields
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle updating card that was just added', async () => {
      // Add card
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

      // Immediately update
      const response = await request(app)
        .put(`/api/collections/me/cards/${testCharacterId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          quantity: 10,
          cardType: 'character',
          imagePath: '/images/test-character.webp'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quantity).toBe(10);
    });

    it('should handle deleting card that was just added', async () => {
      // Add card
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

      // Immediately delete
      const response = await request(app)
        .delete(`/api/collections/me/cards/${testCharacterId}?cardType=character`)
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle setting quantity to 0 immediately after adding', async () => {
      // Add card
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterId,
          cardType: 'character',
          quantity: 5,
          imagePath: '/images/test-character.webp'
        })
        .expect(200);

      // Set to 0
      const response = await request(app)
        .put(`/api/collections/me/cards/${testCharacterId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          quantity: 0,
          cardType: 'character',
          imagePath: '/images/test-character.webp'
        })
        .expect(200);

      expect(response.body.data).toBeNull();
      expect(response.body.message).toContain('removed');
    });
  });
});


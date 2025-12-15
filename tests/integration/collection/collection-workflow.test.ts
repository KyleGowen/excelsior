/**
 * Integration tests for Collection End-to-End Workflows
 * 
 * Tests complete user workflows for managing collections:
 * - Complete collection lifecycle: create, add cards, update, remove
 * - Multi-card workflows with different card types
 * - Quantity management workflows
 * - Collection retrieval and display workflows
 * - Real-world usage scenarios
 */

import request from 'supertest';
import { Pool } from 'pg';
import { app } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../../setup-integration';

describe('Collection End-to-End Workflow Integration Tests', () => {
  let pool: Pool;
  let adminUser: any;
  let adminAuthCookie: string;
  let adminUsername: string;
  let testCharacterIds: string[];
  let testPowerCardIds: string[];
  let testSpecialCardIds: string[];

  beforeAll(async () => {
    await integrationTestUtils.ensureGuestUser();
    await integrationTestUtils.ensureAdminUser();

    // Initialize database connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/overpower_deckbuilder_test'
    });

    // Get multiple test card IDs from database
    const characterResult = await pool.query('SELECT id FROM characters LIMIT 3');
    const powerResult = await pool.query('SELECT id FROM power_cards LIMIT 3');
    const specialResult = await pool.query('SELECT id FROM special_cards LIMIT 3');

    if (characterResult.rows.length < 3 || powerResult.rows.length < 3 || specialResult.rows.length < 3) {
      throw new Error('Not enough test cards available in database');
    }

    testCharacterIds = characterResult.rows.map((r: any) => r.id);
    testPowerCardIds = powerResult.rows.map((r: any) => r.id);
    testSpecialCardIds = specialResult.rows.map((r: any) => r.id);

    // Create ADMIN user
    const timestamp = Date.now();
    const userRepository = DataSourceConfig.getInstance().getUserRepository();
    adminUsername = `collection-workflow-admin-${timestamp}`;
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

  describe('Complete Collection Lifecycle', () => {
    it('should handle full workflow: create -> add -> update -> remove', async () => {
      // Step 1: Create collection
      const createResponse = await request(app)
        .get('/api/collections/me')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      const collectionId = createResponse.body.data.id;
      expect(collectionId).toBeDefined();

      // Step 2: Add card
      const addResponse = await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterIds[0],
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/test-character.webp'
        })
        .expect(200);

      expect(addResponse.body.success).toBe(true);
      expect(addResponse.body.data.quantity).toBe(1);

      // Step 3: Retrieve collection
      const getResponse = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(getResponse.body.data).toHaveLength(1);
      expect(getResponse.body.data[0].card_id).toBe(testCharacterIds[0]);

      // Step 4: Update quantity
      const updateResponse = await request(app)
        .put(`/api/collections/me/cards/${testCharacterIds[0]}`)
        .set('Cookie', adminAuthCookie)
        .send({
          quantity: 5,
          cardType: 'character',
          imagePath: '/images/test-character.webp'
        })
        .expect(200);

      expect(updateResponse.body.data.quantity).toBe(5);

      // Step 5: Verify update
      const verifyResponse = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(verifyResponse.body.data[0].quantity).toBe(5);

      // Step 6: Remove card
      const deleteResponse = await request(app)
        .delete(`/api/collections/me/cards/${testCharacterIds[0]}?cardType=character`)
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Step 7: Verify removal
      const finalResponse = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(finalResponse.body.data).toHaveLength(0);
    });
  });

  describe('Multi-Card Collection Workflow', () => {
    it('should handle building a complete collection with multiple card types', async () => {
      // Add characters
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterIds[0],
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/char1.webp'
        });

      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterIds[1],
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/char2.webp'
        });

      // Add power cards
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testPowerCardIds[0],
          cardType: 'power',
          quantity: 2,
          imagePath: '/images/power1.webp'
        });

      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testPowerCardIds[1],
          cardType: 'power',
          quantity: 3,
          imagePath: '/images/power2.webp'
        });

      // Add special cards
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testSpecialCardIds[0],
          cardType: 'special',
          quantity: 1,
          imagePath: '/images/special1.webp'
        });

      // Retrieve and verify collection
      const response = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(5);

      const characters = response.body.data.filter((c: any) => c.card_type === 'character');
      const powers = response.body.data.filter((c: any) => c.card_type === 'power');
      const specials = response.body.data.filter((c: any) => c.card_type === 'special');

      expect(characters.length).toBeGreaterThanOrEqual(2);
      expect(powers.length).toBeGreaterThanOrEqual(2);
      expect(specials.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle updating multiple cards in sequence', async () => {
      // Add multiple cards
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterIds[0],
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/char1.webp'
        });

      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testPowerCardIds[0],
          cardType: 'power',
          quantity: 1,
          imagePath: '/images/power1.webp'
        });

      // Update first card
      await request(app)
        .put(`/api/collections/me/cards/${testCharacterIds[0]}`)
        .set('Cookie', adminAuthCookie)
        .send({
          quantity: 3,
          cardType: 'character',
          imagePath: '/images/char1.webp'
        })
        .expect(200);

      // Update second card
      await request(app)
        .put(`/api/collections/me/cards/${testPowerCardIds[0]}`)
        .set('Cookie', adminAuthCookie)
        .send({
          quantity: 5,
          cardType: 'power',
          imagePath: '/images/power1.webp'
        })
        .expect(200);

      // Verify both updates
      const response = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      const charCard = response.body.data.find((c: any) => c.card_id === testCharacterIds[0]);
      const powerCard = response.body.data.find((c: any) => c.card_id === testPowerCardIds[0]);

      expect(charCard.quantity).toBe(3);
      expect(powerCard.quantity).toBe(5);
    });
  });

  describe('Quantity Management Workflow', () => {
    it('should handle incremental quantity increases', async () => {
      // Add card with quantity 1
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterIds[0],
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/char1.webp'
        });

      // Incrementally increase quantity
      for (let i = 2; i <= 5; i++) {
        await request(app)
          .put(`/api/collections/me/cards/${testCharacterIds[0]}`)
          .set('Cookie', adminAuthCookie)
          .send({
            quantity: i,
            cardType: 'character',
            imagePath: '/images/char1.webp'
          })
          .expect(200);
      }

      // Verify final quantity
      const response = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      const card = response.body.data.find((c: any) => c.card_id === testCharacterIds[0]);
      expect(card.quantity).toBe(5);
    });

    it('should handle quantity decrease to zero (removal)', async () => {
      // Add card with quantity 5
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterIds[0],
          cardType: 'character',
          quantity: 5,
          imagePath: '/images/char1.webp'
        });

      // Decrease quantity step by step
      for (let i = 4; i >= 0; i--) {
        await request(app)
          .put(`/api/collections/me/cards/${testCharacterIds[0]}`)
          .set('Cookie', adminAuthCookie)
          .send({
            quantity: i,
            cardType: 'character',
            imagePath: '/images/char1.webp'
          })
          .expect(200);
      }

      // Verify card was removed
      const response = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      const card = response.body.data.find((c: any) => c.card_id === testCharacterIds[0]);
      expect(card).toBeUndefined();
    });

    it('should handle adding same card multiple times (quantity accumulation)', async () => {
      // Add same card multiple times
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/collections/me/cards')
          .set('Cookie', adminAuthCookie)
          .send({
            cardId: testCharacterIds[0],
            cardType: 'character',
            quantity: 2,
            imagePath: '/images/char1.webp'
          })
          .expect(200);
      }

      // Verify total quantity
      const response = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      const card = response.body.data.find((c: any) => c.card_id === testCharacterIds[0]);
      expect(card.quantity).toBe(6); // 2 + 2 + 2
    });
  });

  describe('Collection Retrieval Workflow', () => {
    beforeEach(async () => {
      // Set up a collection with multiple cards
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterIds[0],
          cardType: 'character',
          quantity: 1,
          imagePath: '/images/char1.webp'
        });

      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testCharacterIds[1],
          cardType: 'character',
          quantity: 2,
          imagePath: '/images/char2.webp'
        });

      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testPowerCardIds[0],
          cardType: 'power',
          quantity: 3,
          imagePath: '/images/power1.webp'
        });
    });

    it('should retrieve collection ID consistently', async () => {
      const response1 = await request(app)
        .get('/api/collections/me')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      const response2 = await request(app)
        .get('/api/collections/me')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response1.body.data.id).toBe(response2.body.data.id);
    });

    it('should retrieve all cards with correct data', async () => {
      const response = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);

      // Verify all required fields are present
      response.body.data.forEach((card: any) => {
        expect(card.card_id).toBeDefined();
        expect(card.card_type).toBeDefined();
        expect(card.quantity).toBeDefined();
        expect(card.image_path).toBeDefined();
      });
    });

    it('should maintain collection state across multiple retrievals', async () => {
      // Get initial state
      const initialResponse = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      const initialCount = initialResponse.body.data.length;

      // Make changes
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testSpecialCardIds[0],
          cardType: 'special',
          quantity: 1,
          imagePath: '/images/special1.webp'
        });

      // Retrieve again
      const updatedResponse = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(updatedResponse.body.data.length).toBe(initialCount + 1);
    });
  });

  describe('Real-World Usage Scenarios', () => {
    it('should handle building a character-focused collection', async () => {
      // Add multiple characters
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/collections/me/cards')
          .set('Cookie', adminAuthCookie)
          .send({
            cardId: testCharacterIds[i],
            cardType: 'character',
            quantity: 1,
            imagePath: `/images/char${i}.webp`
          });
      }

      const response = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      const characters = response.body.data.filter((c: any) => c.card_type === 'character');
      expect(characters.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle managing a power card collection', async () => {
      // Add power cards with varying quantities
      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testPowerCardIds[0],
          cardType: 'power',
          quantity: 4,
          imagePath: '/images/power1.webp'
        });

      await request(app)
        .post('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .send({
          cardId: testPowerCardIds[1],
          cardType: 'power',
          quantity: 2,
          imagePath: '/images/power2.webp'
        });

      // Update quantities
      await request(app)
        .put(`/api/collections/me/cards/${testPowerCardIds[0]}`)
        .set('Cookie', adminAuthCookie)
        .send({
          quantity: 6,
          cardType: 'power',
          imagePath: '/images/power1.webp'
        });

      const response = await request(app)
        .get('/api/collections/me/cards')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      const powers = response.body.data.filter((c: any) => c.card_type === 'power');
      expect(powers.length).toBeGreaterThanOrEqual(2);
      expect(powers.find((c: any) => c.card_id === testPowerCardIds[0])?.quantity).toBe(6);
    });
  });
});


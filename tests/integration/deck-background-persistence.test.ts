/**
 * Integration tests for Deck Background Persistence
 * Tests database persistence of background_image_path column
 */

import request from 'supertest';
import { app } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../setup-integration';

describe('Deck Background Persistence Integration Tests', () => {
  let adminUser: any;
  let regularUser: any;
  let adminAuthCookie: string;
  let regularAuthCookie: string;
  let adminUsername: string;
  let regularUsername: string;
  let testDeckId: string | null = null;

  beforeAll(async () => {
    await integrationTestUtils.ensureGuestUser();
    await integrationTestUtils.ensureAdminUser();
    
    const timestamp = Date.now();
    const userRepository = DataSourceConfig.getInstance().getUserRepository();
    
    // Create ADMIN user
    adminUsername = `bg-admin-${timestamp}`;
    adminUser = await userRepository.createUser(
      adminUsername,
      `admin-${timestamp}@example.com`,
      'adminpass123',
      'ADMIN'
    );
    integrationTestUtils.trackTestUser(adminUser.id);
    
    // Create regular USER
    regularUsername = `bg-user-${timestamp}`;
    regularUser = await userRepository.createUser(
      regularUsername,
      `user-${timestamp}@example.com`,
      'userpass123',
      'USER'
    );
    integrationTestUtils.trackTestUser(regularUser.id);
    
    // Login as admin
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: adminUsername,
        password: 'adminpass123'
      });
    
    expect(adminLoginResponse.status).toBe(200);
    adminAuthCookie = adminLoginResponse.headers['set-cookie'][0].split(';')[0];
    
    // Login as regular user
    const regularLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: regularUsername,
        password: 'userpass123'
      });
    
    expect(regularLoginResponse.status).toBe(200);
    regularAuthCookie = regularLoginResponse.headers['set-cookie'][0].split(';')[0];
  });

  beforeEach(async () => {
    // Create a fresh deck for each test
    const createDeckResponse = await request(app)
      .post('/api/decks')
      .set('Cookie', adminAuthCookie)
      .send({
        name: 'Background Test Deck',
        description: 'A deck for testing background persistence'
      });

    if (createDeckResponse.status === 201) {
      testDeckId = createDeckResponse.body.data.id;
      if (testDeckId) {
        integrationTestUtils.trackTestDeck(testDeckId);
      }
    }
  });

  afterAll(async () => {
    // Cleanup is handled automatically by global cleanup functions
  });

  describe('PUT /api/decks/:id - background_image_path persistence', () => {
    it('should persist background_image_path when updating deck', async () => {
      const backgroundPath = 'src/resources/cards/images/backgrounds/aesclepnotext.png';
      
      const updateResponse = await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: backgroundPath
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.metadata.background_image_path).toBe(backgroundPath);
    });

    it('should retrieve persisted background_image_path on GET', async () => {
      const backgroundPath = 'src/resources/cards/images/backgrounds/bakernotext.png';
      
      // Set background
      await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: backgroundPath
        })
        .expect(200);

      // Retrieve deck
      const getResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.metadata.background_image_path).toBe(backgroundPath);
    });

    it('should allow setting background_image_path to null', async () => {
      // First set a background
      await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: 'src/resources/cards/images/backgrounds/aesclepnotext.png'
        })
        .expect(200);

      // Then set it to null
      const updateResponse = await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: null
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.metadata.background_image_path).toBeNull();
    });

    it('should validate background_image_path length (max 500 characters)', async () => {
      const longPath = 'a'.repeat(501); // 501 characters
      
      const updateResponse = await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: longPath
        })
        .expect(400);

      expect(updateResponse.body.success).toBe(false);
      expect(updateResponse.body.error).toContain('500 characters or less');
    });

    it('should validate background_image_path type (must be string or null)', async () => {
      const updateResponse = await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: 12345 // Invalid type
        })
        .expect(400);

      expect(updateResponse.body.success).toBe(false);
      expect(updateResponse.body.error).toContain('must be a string or null');
    });

    it('should validate background_image_path exists in filesystem', async () => {
      const invalidPath = 'src/resources/cards/images/backgrounds/nonexistent.png';
      
      const updateResponse = await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: invalidPath
        })
        .expect(400);

      expect(updateResponse.body.success).toBe(false);
      expect(updateResponse.body.error).toContain('Invalid background image path');
    });

    it('should reject paths that do not include "backgrounds" directory', async () => {
      const invalidPath = 'src/resources/cards/images/other/image.png';
      
      const updateResponse = await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: invalidPath
        })
        .expect(400);

      expect(updateResponse.body.success).toBe(false);
      expect(updateResponse.body.error).toContain('Invalid background image path');
    });

    it('should allow updating other deck fields along with background_image_path', async () => {
      const backgroundPath = 'src/resources/cards/images/backgrounds/dejahnotext.png';
      
      const updateResponse = await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          name: 'Updated Deck Name',
          description: 'Updated description',
          background_image_path: backgroundPath
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.metadata.name).toBe('Updated Deck Name');
      expect(updateResponse.body.data.metadata.description).toBe('Updated description');
      expect(updateResponse.body.data.metadata.background_image_path).toBe(backgroundPath);
    });

    it('should persist background_image_path in database', async () => {
      const backgroundPath = 'src/resources/cards/images/backgrounds/draculanotext.png';
      const deckRepository = DataSourceConfig.getInstance().getDeckRepository();
      
      // Set background via API
      await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: backgroundPath
        })
        .expect(200);

      // Verify directly in database
      const deck = await deckRepository.getDeckById(testDeckId!);
      expect(deck).toBeDefined();
      expect(deck?.background_image_path).toBe(backgroundPath);
    });

    it('should return background_image_path in /api/decks/:id/full endpoint', async () => {
      const backgroundPath = 'src/resources/cards/images/backgrounds/minanotext.png';
      
      // Set background
      await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: backgroundPath
        })
        .expect(200);

      // Retrieve via full endpoint
      const getResponse = await request(app)
        .get(`/api/decks/${testDeckId}/full`)
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.metadata.background_image_path).toBe(backgroundPath);
    });
  });
});

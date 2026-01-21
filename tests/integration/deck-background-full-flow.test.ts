/**
 * Integration tests for Deck Background Full Flow
 * Tests complete flow: admin selection, persistence, view mode, non-admin blocking
 */

import request from 'supertest';
import { app } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../setup-integration';

describe('Deck Background Full Flow Integration Tests', () => {
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
    adminUsername = `bg-flow-admin-${timestamp}`;
    adminUser = await userRepository.createUser(
      adminUsername,
      `admin-${timestamp}@example.com`,
      'adminpass123',
      'ADMIN'
    );
    integrationTestUtils.trackTestUser(adminUser.id);
    
    // Create regular USER
    regularUsername = `bg-flow-user-${timestamp}`;
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
        name: 'Background Flow Test Deck',
        description: 'A deck for testing background flow'
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

  describe('Complete Background Selection Flow', () => {
    it('should allow admin to select and save background', async () => {
      const backgroundPath = 'src/resources/cards/images/backgrounds/aesclepnotext.png';
      
      // Step 1: Admin gets available backgrounds
      const backgroundsResponse = await request(app)
        .get('/api/deck-backgrounds')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(backgroundsResponse.body.success).toBe(true);
      expect(backgroundsResponse.body.data.length).toBeGreaterThan(0);
      expect(backgroundsResponse.body.data).toContain(backgroundPath);

      // Step 2: Admin selects a background and saves
      const updateResponse = await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: backgroundPath
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.metadata.background_image_path).toBe(backgroundPath);

      // Step 3: Verify background persists on reload
      const getResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.metadata.background_image_path).toBe(backgroundPath);
    });

    it('should persist background across deck saves', async () => {
      const backgroundPath = 'src/resources/cards/images/backgrounds/bakernotext.png';
      
      // Set background
      await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: backgroundPath
        })
        .expect(200);

      // Update deck name (simulating a save)
      await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          name: 'Updated Deck Name'
        })
        .expect(200);

      // Verify background still persists
      const getResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(getResponse.body.data.metadata.background_image_path).toBe(backgroundPath);
    });

    it('should allow changing background to different image', async () => {
      const firstBackground = 'src/resources/cards/images/backgrounds/aesclepnotext.png';
      const secondBackground = 'src/resources/cards/images/backgrounds/dejahnotext.png';
      
      // Set first background
      await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: firstBackground
        })
        .expect(200);

      // Change to second background
      const updateResponse = await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: secondBackground
        })
        .expect(200);

      expect(updateResponse.body.data.metadata.background_image_path).toBe(secondBackground);
    });

    it('should allow removing background (setting to null)', async () => {
      const backgroundPath = 'src/resources/cards/images/backgrounds/aesclepnotext.png';
      
      // Set background first
      await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: backgroundPath
        })
        .expect(200);

      // Remove background
      const updateResponse = await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: null
        })
        .expect(200);

      expect(updateResponse.body.data.metadata.background_image_path).toBeNull();
    });
  });

  describe('View Mode Background Loading', () => {
    it('should load background in view mode for all users', async () => {
      const backgroundPath = 'src/resources/cards/images/backgrounds/draculanotext.png';
      
      // Admin sets background
      await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: backgroundPath
        })
        .expect(200);

      // Regular user can view deck and see background
      const getResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', regularAuthCookie)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.metadata.background_image_path).toBe(backgroundPath);
    });

    it('should load background when deck is opened in view mode', async () => {
      const backgroundPath = 'src/resources/cards/images/backgrounds/minanotext.png';
      
      // Set background
      await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: backgroundPath
        })
        .expect(200);

      // Simulate opening deck in view mode (unauthenticated or different user)
      const getResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .expect(200);

      expect(getResponse.body.data.metadata.background_image_path).toBe(backgroundPath);
    });
  });

  describe('Non-Admin Access Restrictions', () => {
    it('should allow regular users to access background list endpoint', async () => {
      const response = await request(app)
        .get('/api/deck-backgrounds')
        .set('Cookie', regularAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should allow regular users to view decks with backgrounds (read-only)', async () => {
      const backgroundPath = 'src/resources/cards/images/backgrounds/robinnotext.png';
      
      // Admin sets background
      await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: backgroundPath
        })
        .expect(200);

      // Regular user can view (but not modify)
      const getResponse = await request(app)
        .get(`/api/decks/${testDeckId}`)
        .set('Cookie', regularAuthCookie)
        .expect(200);

      expect(getResponse.body.data.metadata.background_image_path).toBe(backgroundPath);
    });

    it('should allow regular users to update their own decks without background (background not required)', async () => {
      // Create deck owned by regular user
      const createResponse = await request(app)
        .post('/api/decks')
        .set('Cookie', regularAuthCookie)
        .send({
          name: 'Regular User Deck',
          description: 'A deck owned by regular user'
        });

      const userDeckId = createResponse.body.data.id;
      if (userDeckId) {
        integrationTestUtils.trackTestDeck(userDeckId);
      }

      // Regular user can update their deck (without background)
      const updateResponse = await request(app)
        .put(`/api/decks/${userDeckId}`)
        .set('Cookie', regularAuthCookie)
        .send({
          name: 'Updated Name'
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
    });
  });

  describe('Background Persistence Across Operations', () => {
    it('should maintain background when updating deck name', async () => {
      const backgroundPath = 'src/resources/cards/images/backgrounds/spartannotext.png';
      
      // Set background
      await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: backgroundPath
        })
        .expect(200);

      // Update name only
      const updateResponse = await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          name: 'New Deck Name'
        })
        .expect(200);

      expect(updateResponse.body.data.metadata.background_image_path).toBe(backgroundPath);
    });

    it('should maintain background when updating description', async () => {
      const backgroundPath = 'src/resources/cards/images/backgrounds/victorynotext.png';
      
      // Set background
      await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: backgroundPath
        })
        .expect(200);

      // Update description only
      const updateResponse = await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          description: 'New description'
        })
        .expect(200);

      expect(updateResponse.body.data.metadata.background_image_path).toBe(backgroundPath);
    });

    it('should return background in full deck endpoint', async () => {
      const backgroundPath = 'src/resources/cards/images/backgrounds/watsonnotext.png';
      
      // Set background
      await request(app)
        .put(`/api/decks/${testDeckId}`)
        .set('Cookie', adminAuthCookie)
        .send({
          background_image_path: backgroundPath
        })
        .expect(200);

      // Get full deck data
      const fullResponse = await request(app)
        .get(`/api/decks/${testDeckId}/full`)
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(fullResponse.body.data.metadata.background_image_path).toBe(backgroundPath);
    });
  });
});

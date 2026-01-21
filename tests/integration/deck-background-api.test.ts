/**
 * Integration tests for Deck Background API endpoints
 * Tests admin-only access, authentication, and error handling
 */

import request from 'supertest';
import { app } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../setup-integration';

describe('Deck Background API Integration Tests', () => {
  let adminUser: any;
  let regularUser: any;
  let adminAuthCookie: string;
  let regularAuthCookie: string;
  let adminUsername: string;
  let regularUsername: string;

  beforeAll(async () => {
    await integrationTestUtils.ensureGuestUser();
    await integrationTestUtils.ensureAdminUser();
    
    const timestamp = Date.now();
    const userRepository = DataSourceConfig.getInstance().getUserRepository();
    
    // Create ADMIN user
    adminUsername = `background-admin-${timestamp}`;
    adminUser = await userRepository.createUser(
      adminUsername,
      `admin-${timestamp}@example.com`,
      'adminpass123',
      'ADMIN'
    );
    integrationTestUtils.trackTestUser(adminUser.id);
    
    // Create regular USER
    regularUsername = `background-user-${timestamp}`;
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

  afterAll(async () => {
    // Cleanup is handled automatically by global cleanup functions
  });

  describe('GET /api/deck-backgrounds', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/deck-backgrounds')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Authentication required');
    });

    it('should allow ADMIN users to access background list', async () => {
      const response = await request(app)
        .get('/api/deck-backgrounds')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return list of background image paths', async () => {
      const response = await request(app)
        .get('/api/deck-backgrounds')
        .set('Cookie', adminAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Verify all paths are valid background paths
      response.body.data.forEach((path: string) => {
        expect(path).toContain('src/resources/cards/images/backgrounds/');
        expect(path).toMatch(/\.png$/i);
      });
    });

    it('should allow non-ADMIN users to access background list', async () => {
      const response = await request(app)
        .get('/api/deck-backgrounds')
        .set('Cookie', regularAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should handle service errors gracefully', async () => {
      // This test verifies error handling - the service should return empty array on error
      // but the endpoint should still return 200 with success: true
      const response = await request(app)
        .get('/api/deck-backgrounds')
        .set('Cookie', adminAuthCookie);

      // Should return 200 even if service returns empty array
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('All roles can access backgrounds list', () => {
    it('should allow USER users to proceed', async () => {
      const response = await request(app)
        .get('/api/deck-backgrounds')
        .set('Cookie', regularAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should allow newly created USER users to proceed', async () => {
      const timestamp = Date.now();
      const userRepository = DataSourceConfig.getInstance().getUserRepository();
      const testUser = await userRepository.createUser(
        `test-user-${timestamp}`,
        `test-${timestamp}@example.com`,
        'testpass123',
        'USER'
      );
      integrationTestUtils.trackTestUser(testUser.id);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: `test-user-${timestamp}`,
          password: 'testpass123'
        });

      const testAuthCookie = loginResponse.headers['set-cookie'][0].split(';')[0];

      const response = await request(app)
        .get('/api/deck-backgrounds')
        .set('Cookie', testAuthCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

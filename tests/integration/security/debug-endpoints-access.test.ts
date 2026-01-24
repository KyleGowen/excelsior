import request from 'supertest';
import { app } from '../../../src/test-server';
import { integrationTestUtils } from '../../setup-integration';

describe('Debug/User Endpoint Access Control Integration Tests', () => {
  let userCookie: string;
  let adminCookie: string;

  beforeAll(async () => {
    const user = await integrationTestUtils.createTestUser({
      name: 'debug-access-user',
      email: 'debug-access-user@example.com',
      role: 'USER',
      password: 'password123'
    });
    const admin = await integrationTestUtils.createTestUser({
      name: 'debug-access-admin',
      email: 'debug-access-admin@example.com',
      role: 'ADMIN',
      password: 'adminpass123'
    });

    const loginUser = await request(app)
      .post('/api/auth/login')
      .send({ username: user.username, password: 'password123' });
    expect(loginUser.status).toBe(200);
    userCookie = loginUser.headers['set-cookie'][0].split(';')[0];

    const loginAdmin = await request(app)
      .post('/api/auth/login')
      .send({ username: admin.username, password: 'adminpass123' });
    expect(loginAdmin.status).toBe(200);
    adminCookie = loginAdmin.headers['set-cookie'][0].split(';')[0];
  });

  const endpoints = ['/api/users', '/api/debug/clear-cache', '/api/debug/clear-card-cache', '/api/database/status'];

  for (const endpoint of endpoints) {
    it(`requires authentication for ${endpoint}`, async () => {
      const res = await request(app).get(endpoint);
      expect(res.status).toBe(401);
    });

    it(`blocks non-admin users for ${endpoint}`, async () => {
      const res = await request(app).get(endpoint).set('Cookie', userCookie);
      expect(res.status).toBe(403);
    });

    it(`allows admin users for ${endpoint}`, async () => {
      const res = await request(app).get(endpoint).set('Cookie', adminCookie);
      expect([200, 204]).toContain(res.status);
    });
  }
});


import request from 'supertest';
import { app, integrationTestUtils } from '../setup-integration';

describe('Change Password Integration', () => {
  let user: any;
  let authCookie: string = '';

  beforeAll(async () => {
    user = await integrationTestUtils.createTestUser({ name: 'cp_user', email: 'cp_user@example.com', password: 'oldpass123', role: 'USER' });
    const loginRes = await request(app).post('/api/auth/login').send({ username: user.username, password: 'oldpass123' });
    const setCookie = loginRes.headers['set-cookie'];
    authCookie = Array.isArray(setCookie) ? setCookie.find((c: string) => c.startsWith('sessionId=')) : setCookie;
  });

  afterAll(async () => {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower' });
    try {
      await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
    } finally {
      await pool.end();
    }
  });

  it('should reject for guests and unauthenticated users', async () => {
    const unauth = await request(app).post('/api/users/change-password').send({ newPassword: 'x' });
    expect([401,403]).toContain(unauth.status);
  });

  it('should change password when inputs are valid (USER role)', async () => {
    const res = await request(app)
      .post('/api/users/change-password')
      .set('Cookie', authCookie)
      .send({ newPassword: 'newpass456' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Log out current session
    await request(app).post('/api/auth/logout').set('Cookie', authCookie);

    // Login with new password should succeed
    const loginNew = await request(app).post('/api/auth/login').send({ username: user.username, password: 'newpass456' });
    expect(loginNew.status).toBe(200);

    // Old password should now fail
    const loginOld = await request(app).post('/api/auth/login').send({ username: user.username, password: 'oldpass123' });
    expect(loginOld.status).toBe(401);
  });
});



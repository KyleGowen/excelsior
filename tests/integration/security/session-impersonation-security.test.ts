import request from 'supertest';
import { Pool } from 'pg';
import { app } from '../../../src/test-server';
import { integrationTestUtils } from '../../setup-integration';

describe('Session Impersonation Security Integration Tests', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('rejects missing session cookie on authenticated endpoints (401)', async () => {
    const response = await request(app).get('/api/decks');
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('rejects tampered sessionId cookies (401)', async () => {
    const user = await integrationTestUtils.createTestUser({
      name: 'session-tamper-user',
      email: 'session-tamper@example.com',
      role: 'USER',
      password: 'password123'
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: user.username, password: 'password123' });

    expect(login.status).toBe(200);
    const cookie = login.headers['set-cookie'][0].split(';')[0]; // sessionId=...
    const sessionMatch = cookie.match(/^sessionId=(.+)$/);
    expect(sessionMatch).toBeTruthy();

    const sessionId = sessionMatch![1];
    const tampered = sessionId.slice(0, -1) + (sessionId.slice(-1) === 'a' ? 'b' : 'a');

    const response = await request(app)
      .get('/api/decks')
      .set('Cookie', `sessionId=${tampered}`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('invalidates the session after logout (cannot reuse old cookie)', async () => {
    const user = await integrationTestUtils.createTestUser({
      name: 'session-logout-user',
      email: 'session-logout@example.com',
      role: 'USER',
      password: 'password123'
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: user.username, password: 'password123' });

    expect(login.status).toBe(200);
    const cookie = login.headers['set-cookie'][0].split(';')[0];

    const logout = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie);

    expect(logout.status).toBe(200);

    const after = await request(app)
      .get('/api/decks')
      .set('Cookie', cookie);

    expect(after.status).toBe(401);
    expect(after.body.success).toBe(false);
  });

  it('rejects sessions whose user no longer exists (401)', async () => {
    const user = await integrationTestUtils.createTestUser({
      name: 'session-deleted-user',
      email: 'session-deleted@example.com',
      role: 'USER',
      password: 'password123'
    });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: user.username, password: 'password123' });

    expect(login.status).toBe(200);
    const cookie = login.headers['set-cookie'][0].split(';')[0];

    // Delete the user record while the session still exists.
    await pool.query('DELETE FROM users WHERE id = $1', [user.id]);

    const me = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);

    expect(me.status).toBe(401);
    expect(me.body.success).toBe(false);
  });
});


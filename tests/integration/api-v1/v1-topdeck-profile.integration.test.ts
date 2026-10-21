import request from 'supertest';
import { Pool } from 'pg';
import { integrationTestUtils } from '../../setup-integration';
import { initializeTestServer } from '../../../src/test-server';
import type { Server } from 'http';

describe('TopDeck account/profile persistence', () => {
  let owner: { id: string; username: string };
  let other: { id: string; username: string };
  let cookie: string;
  let server: Server;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower' });

  async function signIn(username: string): Promise<string> {
    const response = await request(server).post('/api/auth/login').send({ username, password: 'fixture-pass-1' }).expect(200);
    const cookies = response.headers['set-cookie'];
    return Array.isArray(cookies) ? cookies.find((value: string) => value.startsWith('sessionId=')) ?? '' : cookies;
  }

  beforeAll(async () => {
    // Reuse the suite listener instead of opening/closing one per HTTP assertion.
    server = (await initializeTestServer()).server;
    owner = await integrationTestUtils.createTestUser({ name: 'topdeck_owner', email: 'td-owner@example.invalid', password: 'fixture-pass-1' });
    other = await integrationTestUtils.createTestUser({ name: 'topdeck_unset', email: 'td-unset@example.invalid', password: 'fixture-pass-1' });
    cookie = await signIn(owner.username);
  });
  afterAll(async () => { await pool.end(); });

  it('returns no inferred handle for an account with no public decks', async () => {
    const response = await request(server).get(`/api/v1/users/${other.id}/profile`).expect(200);
    expect(response.body.data).toEqual({ id: other.id, displayName: other.username, topdeckHandle: null, topdeckProfileUrl: null });
    expect(response.headers['cache-control']).toBe('no-store');
    const decks = await request(server).get(`/api/v1/users/${other.id}/public-decks`).expect(200);
    expect(decks.body.data).toEqual([]);
  });
  it('rejects anonymous/guest writes and malformed handles', async () => {
    await request(server).post('/api/v1/users/topdeck').send({ topdeckHandle: 'Example' }).expect(401);
    const guest = await request(server).post('/api/auth/login').send({ username: 'guest', password: 'guest' }).expect(200);
    await request(server).post('/api/v1/users/topdeck').set('Cookie', guest.headers['set-cookie'])
      .send({ topdeckHandle: 'Example' }).expect(403);
    await request(server).post('/api/v1/users/topdeck').set('Cookie', cookie).send({ topdeckHandle: 'https://evil.invalid/' }).expect(400);
  });
  it('saves only the actor, persists through fresh login, and exposes only public fields', async () => {
    await request(server).post('/api/v1/users/topdeck').set('Cookie', cookie)
      .send({ topdeckHandle: 'Example', userId: other.id }).expect(400);
    const saved = await request(server).post('/api/v1/users/topdeck').set('Cookie', cookie)
      .send({ topdeckHandle: '  @TopDeckExample  ' }).expect(200);
    expect(saved.body.data).toEqual({ topdeckHandle: 'TopDeckExample', topdeckProfileUrl: 'https://topdeck.gg/profile/@TopDeckExample' });
    const row = await pool.query('SELECT topdeck_handle FROM users WHERE id = $1', [owner.id]);
    expect(row.rows[0].topdeck_handle).toBe('TopDeckExample');
    const me = await request(server).get('/api/auth/me').set('Cookie', cookie).expect(200);
    expect(me.body.data.topdeckHandle).toBe('TopDeckExample');
    const login = await request(server).post('/api/auth/login').send({ username: owner.username, password: 'fixture-pass-1' }).expect(200);
    expect(login.body.data.topdeckHandle).toBe('TopDeckExample');
    const jwt = await request(server).post('/api/v1/auth/login').send({ username: owner.username, password: 'fixture-pass-1' }).expect(200);
    const bearerMe = await request(server).get('/api/v1/auth/me').set('Authorization', `Bearer ${jwt.body.data.accessToken}`).expect(200);
    expect(bearerMe.body.data.topdeckHandle).toBe('TopDeckExample');
    const profile = await request(server).get(`/api/v1/users/${owner.id}/profile`).expect(200);
    expect(profile.body.data).toEqual({ id: owner.id, displayName: owner.username, ...saved.body.data });
    const untouched = await request(server).get(`/api/v1/users/${other.id}/profile`).expect(200);
    expect(untouched.body.data.topdeckHandle).toBeNull();
  });
  it('allows Google-linked accounts to edit and clears both current/public reads', async () => {
    await pool.query("UPDATE users SET auth_provider = 'google', display_name = 'Fictional player' WHERE id = $1", [owner.id]);
    await request(server).post('/api/v1/users/topdeck').set('Cookie', cookie).send({ topdeckHandle: 'Changed' }).expect(200);
    const removed = await request(server).post('/api/v1/users/topdeck').set('Cookie', cookie).send({ topdeckHandle: null }).expect(200);
    expect(removed.body.data).toEqual({ topdeckHandle: null, topdeckProfileUrl: null });
    const profile = await request(server).get(`/api/v1/users/${owner.id}/profile`).expect(200);
    expect(profile.body.data.topdeckHandle).toBeNull();
    expect(profile.body.data.displayName).toBe('Fictional player');
    const me = await request(server).get('/api/auth/me').set('Cookie', cookie).expect(200);
    expect(me.body.data.topdeckHandle).toBeNull();
    const row = await pool.query('SELECT topdeck_handle FROM users WHERE id = $1', [owner.id]);
    expect(row.rows[0].topdeck_handle).toBeNull();
  });
  it('validates profile IDs and hides missing/guest accounts', async () => {
    await request(server).get('/api/v1/users/invalid/profile').expect(400);
    await request(server).get('/api/v1/users/00000000-0000-4000-8000-000000000099/profile').expect(404);
    await request(server).get('/api/v1/users/00000000-0000-0000-0000-000000000001/profile').expect(404);
  });
});

import { createHash, randomBytes, randomUUID } from 'crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import { app } from '../../src/index';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { integrationTestUtils } from '../setup-integration';
import { ACCOUNT_SERVICE_PREFIX as prefix, ACCOUNT_SESSION_HEADER } from '../../src/api/access/accountOperations';
import { SERVICE_HEADER } from '../../src/api/access/serviceAccessService';
import { resetV1RateLimitBucketsForTests } from '../../src/api/http/middleware/v1RateLimit';
import type { ServiceAccessConfig } from '../../src/api/access/serviceAccessConfig';

describe('account gateway with production composition and real PostgreSQL', () => {
  const keys = ['ENABLE_SERVICE_ACCESS', 'SERVICE_ACCESS_CONFIG_FILE', 'ENABLE_ACCOUNT_SERVICE_GATEWAY'] as const;
  const previous = new Map(keys.map(key => [key, process.env[key]]));
  const directory = mkdtempSync(join(tmpdir(), 'account-service-integration-'));
  const password = 'Fictional-account-fixture-123!';
  const pool = () => DataSourceConfig.getInstance().getPool();
  let token: string;
  let user: { id: string; username: string; email: string };
  const nativeLogin = (username = user.username, suppliedPassword = password) => request(app).post('/api/auth/login').send({ username, password: suppliedPassword });
  const external = (method: 'get' | 'post', path: string, session?: string) => {
    const call = request(app)[method](prefix + path).set(SERVICE_HEADER, 'Bearer ' + token);
    return session ? call.set(ACCOUNT_SESSION_HEADER, session) : call;
  };
  const externalLogin = async () => {
    const response = await external('post', '/auth/login').send({ username: user.username, password }).expect(200);
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.headers[ACCOUNT_SESSION_HEADER]).toMatch(/^[a-f0-9]{64}$/);
    return response.headers[ACCOUNT_SESSION_HEADER] as string;
  };
  beforeAll(async () => {
    user = await integrationTestUtils.createTestUser({ name: 'account_gateway', email: 'account-fixture@example.com', password });
    expect((await pool().query('SELECT id FROM users WHERE id=$1', [user.id])).rowCount).toBe(1);
    const secret = randomBytes(32).toString('base64url');
    const config: ServiceAccessConfig = { environment: 'development', signingSecret: randomBytes(48).toString('base64url'), tokenTtlSeconds: 300, clients: [
      { id: 'external-account-test', enabled: true, tokenEpoch: 0, requestsPerMinute: 600, scopes: ['account:self'], credentials: [{ version: 'v1', secretSha256: createHash('sha256').update(secret).digest('hex') }] },
    ] };
    const file = join(directory, 'registry.json');
    writeFileSync(file, JSON.stringify(config), { mode: 0o600 });
    process.env.ENABLE_SERVICE_ACCESS = '1'; process.env.SERVICE_ACCESS_CONFIG_FILE = file;
    const issued = await request(app).post('/api/v1/service-auth/token').send({ grant_type: 'client_credentials', client_id: 'external-account-test', client_secret: secret, scope: 'account:self' }).expect(200);
    token = issued.body.data.accessToken;
    process.env.ENABLE_ACCOUNT_SERVICE_GATEWAY = '1';
  });
  beforeEach(() => resetV1RateLimitBucketsForTests());
  afterAll(() => {
    for (const [key, value] of previous) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    rmSync(directory, { recursive: true, force: true });
  });
  it('preserves an existing native session/hash across activation and ignores its ambient cookie', async () => {
    delete process.env.ENABLE_ACCOUNT_SERVICE_GATEWAY;
    const before = (await pool().query('SELECT password_hash FROM users WHERE id=$1', [user.id])).rows[0];
    const native = await nativeLogin().expect(200);
    const cookie = native.headers['set-cookie'][0].split(';')[0];
    await external('get', '/auth/me').set('Cookie', cookie).expect(503);
    process.env.ENABLE_ACCOUNT_SERVICE_GATEWAY = '1';
    await request(app).get('/api/auth/me').set('Cookie', cookie).expect(200);
    await external('get', '/auth/me').set('Cookie', cookie).expect(401);
    const after = (await pool().query('SELECT password_hash FROM users WHERE id=$1', [user.id])).rows[0];
    expect(after).toEqual(before);
  });
  it('creates independent sessions for the same account and logout revokes only the selected session', async () => {
    const native = await nativeLogin().expect(200);
    const cookie = native.headers['set-cookie'][0].split(';')[0];
    const first = await externalLogin(); const second = await externalLogin();
    expect(first).not.toBe(second); expect(cookie).not.toContain(first);
    const who = await external('get', '/auth/me', first).expect(200);
    expect(who.body.data.id).toBe(user.id);
    await external('post', '/auth/logout', first).expect(200);
    await external('get', '/auth/me', first).expect(401);
    await external('get', '/auth/me', second).expect(200);
    await request(app).get('/api/auth/me').set('Cookie', cookie).expect(200);
    await request(app).post('/api/auth/logout').set('Cookie', cookie).expect(200);
    await external('get', '/auth/me', second).expect(200);
  });
  it('supports signup while preventing role injection, duplicate accounts, and invalid credentials', async () => {
    const name = 'test_account_signup_' + randomUUID().slice(0, 8);
    const email = name + '@example.com';
    const signedUp = await external('post', '/auth/signup').send({ username: name, email, password, role: 'ADMIN', userId: user.id }).expect(201);
    integrationTestUtils.trackTestUser(signedUp.body.data.userId);
    expect(signedUp.body.data.role).toBe('USER'); expect(signedUp.headers['set-cookie']).toBeUndefined();
    await nativeLogin(name).expect(200);
    await external('post', '/auth/signup').send({ username: name, email, password }).expect(409);
    await external('post', '/auth/login').send({ username: name, password: 'wrong-fixture-password' }).expect(401);
    await external('post', '/auth/signup').send({ username: name }).expect(400);
  });
  it('reuses self-service validation and actor identity for every profile operation', async () => {
    const session = await externalLogin();
    const email = 'changed-' + randomUUID() + '@example.com';
    await external('post', '/users/change-email', session).send({ email, userId: randomUUID(), role: 'ADMIN' }).expect(200);
    expect((await pool().query('SELECT email,role FROM users WHERE id=$1', [user.id])).rows[0]).toEqual({ email, role: 'USER' });
    await external('post', '/users/change-email', session).send({ email: 'bad' }).expect(400);
    await external('post', '/users/change-password', session).send({ newPassword: password, confirmPassword: 'mismatch' }).expect(400);
    await external('post', '/users/change-password', session).send({ newPassword: password, confirmPassword: password }).expect(200);
    await external('post', '/users/display-name', session).send({ displayName: user.username }).expect(200);
    await external('post', '/users/display-name', session).send({ displayName: '' }).expect(400);
    await external('post', '/users/change-email').send({ email }).expect(401);
  });
  it.each(['GUEST', 'ADMIN'])('retains %s self-service policy and denies admin routes for everyone', async role => {
    const fixture = await integrationTestUtils.createTestUser({ name: 'account_role', email: 'role-fixture@example.com', password, role });
    const loggedIn = await external('post', '/auth/login').send({ username: fixture.username, password }).expect(200);
    const session = loggedIn.headers[ACCOUNT_SESSION_HEADER];
    await external('post', '/users/display-name', session).send({ displayName: fixture.username }).expect(role === 'ADMIN' ? 200 : 403);
    await external('get', '/admin/users', session).expect(403);
    await external('post', '/guest/decks', session).send({ name: 'Never saved' }).expect(403);
  });
  it('enforces Google provider restrictions using the same account service', async () => {
    const session = await externalLogin();
    await pool().query("UPDATE users SET auth_provider='google' WHERE id=$1", [user.id]);
    try {
      await external('post', '/users/change-email', session).send({ email: 'blocked@example.com' }).expect(403);
      await external('post', '/users/change-password', session).send({ newPassword: password, confirmPassword: password }).expect(403);
      await external('post', '/users/display-name', session).send({ displayName: 'Fictional Google display' }).expect(200);
    } finally { await pool().query("UPDATE users SET auth_provider='password' WHERE id=$1", [user.id]); }
  });
  it('mounts Google preview/completion and Firebase config without redirect aliases', async () => {
    await external('get', '/config/firebase').expect(200);
    await external('post', '/auth/google/preview').send({}).expect(400);
    await external('post', '/auth/google').send({}).expect(400);
    await external('get', '/auth/google/callback').expect(403);
  });
  it('rejects expired, deleted, and forged sessions without falling back to native cookies', async () => {
    const expired = await externalLogin();
    await pool().query("UPDATE sessions SET expires_at=NOW()-INTERVAL '1 second' WHERE session_token=$1", [expired]);
    await external('get', '/auth/me', expired).expect(401);
    await external('get', '/auth/me', '0'.repeat(64)).expect(401);
    await external('get', '/auth/me', 'malformed').expect(401);
  });
});

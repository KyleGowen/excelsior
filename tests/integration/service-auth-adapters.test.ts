import { createHash, randomBytes } from 'crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { Server } from 'http';
import express from 'express';
import request from 'supertest';
import { app } from '../../src/index';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { ApplicationAccessAdapter } from '../../src/api/access/applicationAccessAdapter';
import { createApplicationAccessMiddleware } from '../../src/api/http/middleware/applicationAccess';
import { SERVICE_HEADER } from '../../src/api/access/serviceAccessService';
import { SERVICE_SCOPES, type ServiceAccessConfig } from '../../src/api/access/serviceAccessConfig';
import { integrationTestUtils } from '../setup-integration';

// Real production composition and PostgreSQL; no test-server authentication shim.
describe('both service clients through real application adapters', () => {
  const directory = mkdtempSync(join(tmpdir(), 'm2-service-integration-'));
  const registryFile = join(directory, 'registry.json');
  const secrets = new Map(['excelsior-web', 'lrg-web'].map(id => [id, randomBytes(32).toString('base64url')]));
  const config: ServiceAccessConfig = { environment: 'development', signingSecret: randomBytes(48).toString('base64url'), tokenTtlSeconds: 60, clients: [...secrets].map(([id, value]) => ({ id, enabled: true, tokenEpoch: 0, scopes: [...SERVICE_SCOPES], credentials: [{ version: 'v1', secretSha256: createHash('sha256').update(value).digest('hex') }], requestsPerMinute: 600 })) };
  const previous = { enabled: process.env.ENABLE_SERVICE_ACCESS, file: process.env.SERVICE_ACCESS_CONFIG_FILE };
  const save = () => writeFileSync(registryFile, JSON.stringify(config), { mode: 0o600 });
  let server: Server;
  let origin: string;
  let userOne: { id: string; username: string };
  let userTwo: { id: string; username: string };
  let playerOne: string;
  let playerTwo: string;
  let sessionOne: string;
  let guestOne: string;
  let guestTwo: string;
  let refresh: string;
  const password = randomBytes(24).toString('base64url');
  const cookies = (result: request.Response) => (result.headers['set-cookie'] as unknown as string[]).map(value => value.split(';')[0]).join('; ');
  beforeAll(async () => {
    save(); process.env.ENABLE_SERVICE_ACCESS = '1'; process.env.SERVICE_ACCESS_CONFIG_FILE = registryFile;
    server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
    const address = server.address(); if (!address || typeof address === 'string') throw new Error('Missing local listener'); origin = 'http://127.0.0.1:' + address.port;
    userOne = await integrationTestUtils.createTestUser({ name: 'M2AdapterOne', email: 'one@example.test', password });
    userTwo = await integrationTestUtils.createTestUser({ name: 'M2AdapterTwo', email: 'two@example.test', password });
    const loginOne = await request(app).post('/api/v1/auth/login').send({ username: userOne.username, password }).expect(200);
    const loginTwo = await request(app).post('/api/v1/auth/login').send({ username: userTwo.username, password }).expect(200);
    playerOne = loginOne.body.data.accessToken; playerTwo = loginTwo.body.data.accessToken; refresh = loginOne.body.data.refreshToken;
    expect(refresh).toBeTruthy();
    sessionOne = cookies(await request(app).post('/api/auth/login').send({ username: userOne.username, password }).expect(200));
    guestOne = cookies(await request(app).post('/api/auth/login').send({ username: 'guest', password: 'guest' }).expect(200));
    guestTwo = cookies(await request(app).post('/api/auth/login').send({ username: 'guest', password: 'guest' }).expect(200));
  });
  afterAll(async () => {
    try {
      const guestTokens = [guestOne, guestTwo].filter(Boolean).map(cookie => cookie.match(/(?:^|; )sessionId=([^;]+)/)?.[1]).filter(Boolean);
      if (guestTokens.length) await DataSourceConfig.getInstance().getPool().query('DELETE FROM sessions WHERE session_token = ANY($1)', [guestTokens]);
      if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
    finally {
      for (const [key, value] of Object.entries({ ENABLE_SERVICE_ACCESS: previous.enabled, SERVICE_ACCESS_CONFIG_FILE: previous.file })) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
      rmSync(directory, { recursive: true, force: true });
    }
    // The setup's tracked-ID cleanup removes users, their decks, collections and sessions even on assertion failure.
  });
  it.each(['excelsior-web', 'lrg-web'])('%s preserves player ownership, cookie/JWT auth and Guest isolation', async clientId => {
    const adapter = new ApplicationAccessAdapter(origin, () => ({ clientId, clientSecret: secrets.get(clientId)! }));
    const host = express(); host.use(express.json()); host.use('/api/host', createApplicationAccessMiddleware(adapter, true));
    await request(host).get('/api/host/api/v1/catalog/characters').expect(200);
    await request(host).get('/api/host/api/v1/decks').expect(401);
    const me = await request(host).get('/api/host/api/auth/me').set('Cookie', sessionOne).expect(200); expect(me.body.data.id ?? me.body.data.userId).toBe(userOne.id);
    const created = await request(host).post('/api/host/api/v1/decks').set('Authorization', 'Bearer ' + playerOne).send({ name: 'M2 isolated ' + clientId, is_private: true }).expect(201);
    const deckId = created.body.data.id; expect(deckId).toBeTruthy(); integrationTestUtils.trackTestDeck(deckId);
    await request(host).put('/api/host/api/v1/decks/' + deckId).set('Authorization', 'Bearer ' + playerTwo).send({ name: 'Forbidden overwrite' }).expect(403);
    const linkRead = await request(host).get('/api/host/api/v1/decks/' + deckId).set('Authorization', 'Bearer ' + playerTwo).expect(200); expect(linkRead.body.data.metadata.isOwner).toBe(false); // Existing unlisted decks are link-readable, not private ACLs.
    const owned = await request(host).get('/api/host/api/v1/decks/' + deckId).set('Cookie', sessionOne).expect(200); expect(owned.body.data.name ?? owned.body.data.metadata?.name).toBe('M2 isolated ' + clientId);
    const pool = DataSourceConfig.getInstance().getPool(); const card = await pool.query('SELECT id FROM characters ORDER BY id LIMIT 1');
    await request(host).post('/api/host/api/v1/collections/me/cards').set('Authorization', 'Bearer ' + playerOne).send({ cardId: card.rows[0].id, cardType: 'character', quantity: 1 }).expect(200);
    const other = await request(host).get('/api/host/api/v1/collections/me/cards').set('Authorization', 'Bearer ' + playerTwo).expect(200); expect(other.body.data).toEqual([]);
    const guestDeck = await request(host).post('/api/host/api/v1/guest/decks').set('Cookie', guestOne).send({ name: 'Isolated Guest ' + clientId }).expect(201);
    const guestId = guestDeck.body.data.id;
    try {
      await request(host).get('/api/host/api/v1/guest/decks/' + guestId).set('Cookie', guestTwo).expect(404);
      await request(host).get('/api/host/api/v1/guest/decks/' + guestId).set('Cookie', guestOne).expect(200);
      await request(host).get('/api/host/api/v1/admin/users').set('Authorization', 'Bearer ' + playerOne).expect(403);
    } finally { await request(host).delete('/api/host/api/v1/guest/decks/' + guestId).set('Cookie', guestOne).expect(200); }
    await request(host).delete('/api/host/api/v1/decks/' + deckId).set('Authorization', 'Bearer ' + playerOne).expect(200); integrationTestUtils.untrackTestDeck(deckId);
  });
  it('keeps service and player tokens non-interchangeable and checks explicit invalid tokens', async () => {
    const issued = await request(app).post('/api/v1/service-auth/token').send({ grant_type: 'client_credentials', client_id: 'excelsior-web', client_secret: secrets.get('excelsior-web') }).expect(200);
    const token = issued.body.data.accessToken;
    await request(app).get('/api/v1/decks').set(SERVICE_HEADER, 'Bearer ' + token).expect(401);
    await request(app).get('/api/v1/decks').set('Authorization', 'Bearer ' + token).expect(401);
    await request(app).get('/api/v1/decks').set(SERVICE_HEADER, 'Bearer ' + playerOne).set('Cookie', sessionOne).expect(401);
    await request(app).get('/api/v1/catalog/characters').set(SERVICE_HEADER, 'Bearer invalid').expect(401);
    await request(app).get('/api/v1/admin/users').set(SERVICE_HEADER, 'Bearer ' + token).set('Authorization', 'Bearer ' + playerOne).expect(403);
  });
  it('renews a revoked service token using the real issuance path', async () => {
    const adapter = new ApplicationAccessAdapter(origin, () => ({ clientId: 'lrg-web', clientSecret: secrets.get('lrg-web')! }));
    expect((await adapter.request('/api/v1/catalog/characters')).status).toBe(200);
    config.clients.find(c => c.id === 'lrg-web')!.tokenEpoch++; save();
    expect((await adapter.request('/api/v1/catalog/characters')).status).toBe(200);
  });
  it('rotates user refresh tokens, rejects replay, and revokes logout through both adapters', async () => {
    for (const clientId of ['excelsior-web', 'lrg-web']) {
      const adapter = new ApplicationAccessAdapter(origin, () => ({ clientId, clientSecret: secrets.get(clientId)! }));
      const login = await adapter.request('/api/v1/auth/login', { method: 'POST', body: { username: userOne.username, password } }); expect(login.status).toBe(200);
      const old = (await login.json() as { data: { refreshToken: string } }).data.refreshToken;
      const renewed = await adapter.request('/api/v1/auth/refresh', { method: 'POST', body: { refreshToken: old } }); expect(renewed.status).toBe(200);
      const data = (await renewed.json() as { data: { refreshToken: string; accessToken: string } }).data; refresh = data.refreshToken;
      expect(refresh).not.toBe(old); expect((await adapter.request('/api/v1/auth/me', { player: { userAccessToken: data.accessToken } })).status).toBe(200);
      expect((await adapter.request('/api/v1/auth/refresh', { method: 'POST', body: { refreshToken: old } })).status).toBe(401);
      expect((await adapter.request('/api/v1/auth/refresh', { method: 'POST', body: { refreshToken: refresh } })).status).toBe(401); // Reuse revokes the entire rotation family.
    }
    const adapter = new ApplicationAccessAdapter(origin, () => ({ clientId: 'lrg-web', clientSecret: secrets.get('lrg-web')! }));
    const freshLogin = await adapter.request('/api/v1/auth/login', { method: 'POST', body: { username: userOne.username, password } });
    refresh = (await freshLogin.json() as { data: { refreshToken: string } }).data.refreshToken;
    expect((await adapter.request('/api/v1/auth/logout', { method: 'POST', body: { refreshToken: refresh } })).status).toBe(200);
    expect((await adapter.request('/api/v1/auth/refresh', { method: 'POST', body: { refreshToken: refresh } })).status).toBe(401);
  });
});

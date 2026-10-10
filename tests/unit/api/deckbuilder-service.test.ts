import express from 'express';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import { createHash } from 'crypto';
import { DECKBUILDER_SERVICE_PREFIX as remote, NATIVE_DECKBUILDER_PREFIX as local, DECKBUILDER_PREVIEWS, deckbuilderCanonicalPath, deckbuilderRouteKey, nativeDeckbuilderScope } from '../../../src/api/access/deckbuilderOperations';
import { NativeDeckbuilderAccess } from '../../../src/api/access/nativeDeckbuilderAccess';
import { ServiceAccessError, ServiceAccessService, SERVICE_HEADER } from '../../../src/api/access/serviceAccessService';
import type { ServiceAccessConfig } from '../../../src/api/access/serviceAccessConfig';
import { createDeckbuilderAccessMiddleware, nativeDeckbuilderEnabled } from '../../../src/api/http/middleware/deckbuilderAccess';
import { createDatabaseAccessMiddleware } from '../../../src/api/http/middleware/databaseAccess';
import { createApiAccessLogMiddleware } from '../../../src/api/http/middleware/apiAccessLog';
import { setupMiddleware } from '../../../src/middleware/setup';

const secret = 'fictional-builder-service-test-secret';
const nativeSecret = 'fictional-native-builder-test-secret';
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
describe('builder application boundary', () => {
  const original = { ...process.env };
  let config: ServiceAccessConfig; let clock: number; let service: ServiceAccessService; let native: NativeDeckbuilderAccess;
  beforeEach(() => {
    clock = 1800000000000;
    process.env.ENABLE_DECKBUILDER_SERVICE_GATEWAY = '1'; process.env.ENABLE_NATIVE_DECKBUILDER_SERVICE = '1';
    config = { environment: 'development', signingSecret: 'fictional-builder-signing-key'.repeat(3), tokenTtlSeconds: 60, clients: [
      { id: 'bmg-deckbuilder', enabled: true, tokenEpoch: 0, requestsPerMinute: 600, scopes: ['catalog:read', 'decks:read'], credentials: [{ version: 'v1', secretSha256: digest(secret) }] },
      { id: 'excelsior-web', enabled: true, tokenEpoch: 0, requestsPerMinute: 600, scopes: ['catalog:read', 'decks:read', 'decks:write', 'guest:decks'], credentials: [{ version: 'v1', secretSha256: digest(nativeSecret) }] },
    ] };
    service = new ServiceAccessService(() => config, () => clock);
    native = new NativeDeckbuilderAccess(service, () => ({ clientId: 'excelsior-web', clientSecret: nativeSecret }), () => clock);
  });
  afterEach(() => { process.env = { ...original }; jest.restoreAllMocks(); });
  const token = () => service.issue({ client_id: 'bmg-deckbuilder', client_secret: secret }).accessToken;
  const app = (query = jest.fn().mockResolvedValue({ rows: [] })) => {
    const host = express(); host.set('trust proxy', 1);
    host.use(createApiAccessLogMiddleware({ pool: { query } })); host.use(express.json());
    host.use(createDeckbuilderAccessMiddleware(service, native)); host.use(createDatabaseAccessMiddleware(service));
    host.use((req, res) => {
      if (req.path.endsWith('/full') || req.method === 'PUT' || req.path.endsWith('/hand-analysis')) { res.sendStatus(401); return; }
      res.set('Cache-Control', 'public, max-age=300');
      res.json({ path: req.path, body: req.body, client: req.serviceClient?.clientId ?? null, cookie: req.headers.cookie ?? null,
        player: req.user ?? null, authorization: req.headers.authorization ?? null, ip: req.ip, query: req.query });
    });
    return host;
  };
  it.each(DECKBUILDER_PREVIEWS)('forwards only stateless %s and never a player identity', async path => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    const response = await request(app(query)).post(remote + path.slice('/api/v1'.length))
      .set(SERVICE_HEADER, 'Bearer ' + token()).set('Authorization', 'Bearer fictional-player').set('Cookie', 'sessionId=fictional-player')
      .send({ fictionalDraft: true }).expect(200);
    expect(response.body).toMatchObject({ path, client: 'bmg-deckbuilder', cookie: null, authorization: null, player: null, body: { fictionalDraft: true } });
    expect(response.headers['cache-control']).toBe('no-store'); expect(response.headers[SERVICE_HEADER]).toBeUndefined();
    await new Promise(resolve => setImmediate(resolve));
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0]![1]).toEqual([null, 'POST ' + path, 'POST', 200, '::ffff:127.0.0.1', null, 'bmg-deckbuilder', 'bmg-deckbuilder', true, expect.any(Number)]);
  });
  it.each([['POST', '/decks'], ['PUT', '/decks/fictional/cards'], ['POST', '/guest/decks'], ['GET', '/decks/fictional/full'], ['POST', '/admin/decks/hand-analysis'], ['POST', '/decks/summaries'], ['POST', '/decks/draw/'], ['POST', '/decks/%64raw'], ['POST', '/decks/candidates/evaluate/extra']])('denies remote %s %s', async (method, suffix) => {
    const host = request(app()); const call = method === 'GET' ? host.get(remote + suffix) : method === 'PUT' ? host.put(remote + suffix) : host.post(remote + suffix);
    const response = await call.set(SERVICE_HEADER, 'Bearer ' + token()).expect(403);
    expect(response.headers['cache-control']).toBe('no-store');
  });
  it('requires an actual service token and retains verified denied identity', async () => {
    for (const value of [undefined, 'bad', 'Bearer invalid']) {
      const call = request(app()).post(remote + '/decks/draw'); if (value) call.set(SERVICE_HEADER, value);
      await call.expect(401);
    }
    config.clients[0]!.scopes = ['catalog:read'];
    const query = jest.fn().mockResolvedValue({ rows: [] });
    await request(app(query)).post(remote + '/decks/draw').set(SERVICE_HEADER, 'Bearer ' + token()).expect(403);
    await new Promise(resolve => setImmediate(resolve)); expect(query.mock.calls[0]![1][6]).toBe('bmg-deckbuilder');
  });
  it('retains native cookies, caller IP, query and existing player denial', async () => {
    const response = await request(app()).post(local + '/api/v1/decks/draw?fictional=1').set('Cookie', 'sessionId=fictional-native')
      .set('X-Forwarded-For', '192.0.2.18').send({ native: true }).expect(200);
    expect(response.body).toMatchObject({ client: 'excelsior-web', cookie: 'sessionId=fictional-native', ip: '192.0.2.18', query: { fictional: '1' } });
    await request(app()).get(local + '/api/v1/decks/fictional/full').expect(401);
    await request(app()).put(local + '/api/v1/decks/fictional/cards').send({}).expect(401);
    await request(app()).post(local + '/api/v1/admin/decks/hand-analysis').send({}).expect(401);
    await request(app()).post(local + '/api/v1/decks/draw').set(SERVICE_HEADER, 'Bearer ' + token()).expect(401);
    await request(app()).get(local + '/api/v1/collections/me').expect(403);
  });
  it('loads private native credentials through the default production wiring', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'builder-native-fixture-'));
    const file = join(directory, 'credentials.json');
    writeFileSync(file, JSON.stringify({ environment: 'development', clients: [{ clientId: 'excelsior-web', clientSecret: nativeSecret }] }), { mode: 0o600 });
    process.env.APPLICATION_ACCESS_CREDENTIALS_FILE = file;
    try {
      const host = express();
      host.use(createDeckbuilderAccessMiddleware(service));
      host.post('/api/v1/decks/draw', (req, res) => res.json({ clientId: req.serviceClient?.clientId }));
      const response = await request(host).post(local + '/api/v1/decks/draw').expect(200);
      expect(response.body).toEqual({ clientId: 'excelsior-web' });
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
  it('keeps the database gateway catalog-only and direct API calls unchanged', async () => {
    process.env.ENABLE_DATABASE_SERVICE_GATEWAY = '1';
    await request(app()).post('/api/service/v1/decks/draw').set(SERVICE_HEADER, 'Bearer ' + token()).expect(403);
    const response = await request(app()).post('/api/v1/decks/draw').send({}).expect(200);
    expect(response.body.client).toBeNull(); expect(response.headers['cache-control']).toBe('public, max-age=300');
  });
  it('does not permit anonymous fallback when either native activation flag is off', async () => {
    expect(nativeDeckbuilderEnabled()).toBe(true);
    process.env.ENABLE_NATIVE_DECKBUILDER_SERVICE = '0'; expect(nativeDeckbuilderEnabled()).toBe(false);
    await request(app()).post(local + '/api/v1/decks/draw').expect(503);
    process.env.ENABLE_DECKBUILDER_SERVICE_GATEWAY = '0';
    await request(app()).post(remote + '/decks/draw').expect(503);
    await request(app()).get(remote).expect(503);
  });
  it('requires production origin HTTPS', async () => {
    process.env.NODE_ENV = 'production';
    await request(app()).post(remote + '/decks/draw').set(SERVICE_HEADER, 'Bearer ' + token()).expect(503);
    await request(app()).post(remote + '/decks/draw').set('X-Forwarded-Proto', 'https').set(SERVICE_HEADER, 'Bearer ' + token()).expect(200);
  });
  it('keeps native quota semantics and renews near expiry or revocation', () => {
    const issue = jest.spyOn(service, 'issue'); config.clients[1]!.requestsPerMinute = 3;
    for (let i = 0; i < 605; i++) expect(native.authenticate('decks:read').clientId).toBe('excelsior-web');
    expect(issue).toHaveBeenCalledTimes(1); clock += 55000; native.authenticate('decks:read'); expect(issue).toHaveBeenCalledTimes(2);
    config.clients[1]!.tokenEpoch++; native.authenticate('decks:read'); expect(issue).toHaveBeenCalledTimes(3);
    config.clients[1]!.enabled = false; expect(() => native.authenticate('decks:read')).toThrow(ServiceAccessError);
  });
  it('fails closed on wrong native client, retries invalid tokens only once, and redacts private failures', async () => {
    const wrong = new NativeDeckbuilderAccess(service, () => ({ clientId: 'bmg-deckbuilder', clientSecret: secret }));
    expect(() => wrong.authenticate('decks:read')).toThrow(expect.objectContaining({ status: 503 }));
    const authenticate = jest.spyOn(service, 'authenticateNativeApplication').mockImplementation(() => { throw new ServiceAccessError(401, 'SERVICE_TOKEN_INVALID', 'Revoked'); });
    const issue = jest.spyOn(service, 'issue'); expect(() => native.authenticate('decks:read')).toThrow(); expect(issue).toHaveBeenCalledTimes(2);
    authenticate.mockImplementation(() => { throw new Error('private-secret-detail'); });
    const failure = await request(app()).post(local + '/api/v1/decks/draw').expect(503);
    expect(JSON.stringify(failure.body)).not.toContain('private-secret-detail');
  });
  it('reports verified throttles with Retry-After', async () => {
    config.clients[0]!.requestsPerMinute = 1; const issued = token();
    const failure = await request(app()).post(remote + '/decks/draw').set(SERVICE_HEADER, 'Bearer ' + issued).expect(429);
    expect(failure.headers['retry-after']).toBe('60');
  });
  it('uses literal operations and safe telemetry templates', () => {
    expect(deckbuilderCanonicalPath(remote + '/decks/draw')).toBe('/api/v1/decks/draw');
    expect(deckbuilderCanonicalPath(local + '/api/v1/decks/draw')).toBe('/api/v1/decks/draw');
    expect(deckbuilderCanonicalPath('/other')).toBe('/other');
    expect(deckbuilderRouteKey('GET', '/api/v1/decks/fictional/full')).toBe('GET /api/v1/decks/:id/full');
    expect(deckbuilderRouteKey('PUT', '/api/v1/guest/decks/fictional/cards')).toBe('PUT /api/v1/guest/decks/:id/cards');
    expect(deckbuilderRouteKey('GET', '/private/record-id')).toBe('GET /api/v1/deckbuilder/unsupported');
    for (const [method, path, scope] of [
      ['GET', '/api/v1/decks/favorites', 'decks:read'], ['POST', '/api/v1/decks/fictional/favorite', 'decks:write'],
      ['DELETE', '/api/v1/decks/fictional/favorite', 'decks:write'], ['PUT', '/api/v1/decks/fictional', 'decks:write'],
      ['POST', '/api/v1/guest/decks', 'guest:decks'], ['GET', '/api/v1/guest/decks/fictional', 'guest:decks'],
      ['PUT', '/api/v1/guest/decks/fictional', 'guest:decks'], ['GET', '/api/v1/guest/decks/fictional/cards', null],
    ]) expect(nativeDeckbuilderScope(method!, path!)).toBe(scope);
  });
  it('real middleware wiring accepts candidate bodies above 16 KB and sanitizes invalid/oversized JSON', async () => {
    delete process.env.ENABLE_EXCELSIOR_ACCESS_ADAPTER;
    const host = express(); setupMiddleware(host);
    const reject = await request(host).post(remote + '/decks/candidates/evaluate').send({ candidates: Array.from({ length: 1500 }, () => ({ cardId: 'fictional-card' })) });
    expect(reject.status).toBe(401); // Parsed successfully; the service token is missing.
    const malformed = await request(host).post(remote + '/decks/draw').set('Content-Type', 'application/json').send('{"private-input":');
    expect(malformed.status).toBe(400); expect(JSON.stringify(malformed.body)).not.toContain('private-input');
    const oversized = await request(host).post(remote + '/decks/draw').send({ padding: 'x'.repeat(256 * 1024) });
    expect(oversized.status).toBe(413); expect(oversized.headers['cache-control']).toBe('no-store');
  });
});

import { createHash } from 'crypto';
import express from 'express';
import request from 'supertest';
import { databaseCanonicalPath, DATABASE_SERVICE_PREFIX as servicePrefix, NATIVE_DATABASE_PREFIX as nativePrefix, isDatabaseRead } from '../../../src/api/access/databaseOperations';
import { NativeDatabaseAccess } from '../../../src/api/access/nativeDatabaseAccess';
import { ServiceAccessService, ServiceAccessError, SERVICE_HEADER } from '../../../src/api/access/serviceAccessService';
import type { ServiceAccessConfig } from '../../../src/api/access/serviceAccessConfig';
import { createDatabaseAccessMiddleware, nativeDatabaseEnabled } from '../../../src/api/http/middleware/databaseAccess';
import { createServiceAccessMiddleware } from '../../../src/api/http/middleware/serviceAccess';
import { registerServiceAuthV1HttpRoutes } from '../../../src/api/http/service-auth.http';
import { resetV1RateLimitBucketsForTests } from '../../../src/api/http/middleware/v1RateLimit';
import { ApplicationAccessAdapter } from '../../../src/api/access/applicationAccessAdapter';

const secret = 'fictional-native-database-test-secret';
const configuration = (): ServiceAccessConfig => ({
  environment: 'development', signingSecret: 'fictional-database-signing-key'.repeat(3), tokenTtlSeconds: 60,
  clients: ['excelsior-web', 'bmg-database-ui'].map(id => ({ id, enabled: true, tokenEpoch: 0, scopes: ['catalog:read'], requestsPerMinute: 600,
    credentials: [{ version: 'v1', secretSha256: createHash('sha256').update(secret).digest('hex') }] })),
});
describe('database service boundary', () => {
  let config: ServiceAccessConfig;
  let now: number;
  let service: ServiceAccessService;
  let native: NativeDatabaseAccess;
  const previous = { ...process.env };
  beforeEach(() => {
    config = configuration(); now = 1800000000000;
    service = new ServiceAccessService(() => config, () => now);
    native = new NativeDatabaseAccess(service, () => ({ clientId: 'excelsior-web', clientSecret: secret }), () => now);
    process.env.ENABLE_DATABASE_SERVICE_GATEWAY = '1'; process.env.ENABLE_NATIVE_DATABASE_SERVICE = '1';
    resetV1RateLimitBucketsForTests();
  });
  afterEach(() => { process.env = { ...previous }; });
  const issue = (id = 'bmg-database-ui') => service.issue({ client_id: id, client_secret: secret }).accessToken;
  const app = (defaultNative = false) => {
    const host = express(); host.set('trust proxy', 1); host.use(express.json());
    host.use(defaultNative ? createDatabaseAccessMiddleware(service) : createDatabaseAccessMiddleware(service, native));
    host.use('/api', createServiceAccessMiddleware(service));
    const router = express.Router(); registerServiceAuthV1HttpRoutes(router, service);
    router.get('/catalog/presentation/characters', (req, res) => {
      res.set('Cache-Control', 'public, max-age=300');
      res.json({ client: req.serviceClient?.clientId, player: req.user ?? null, cookie: req.headers.cookie, ip: req.ip, query: req.query, url: req.originalUrl });
    });
    host.use('/api/v1', router);
    return host;
  };
  it('allowlists only literal database reads and canonicalizes both controlled prefixes', () => {
    expect(isDatabaseRead('GET', '/api/v1/catalog/presentation/characters')).toBe(true);
    for (const path of ['/api/v1/decks', '/api/v1/catalog/presentation/../characters', '/api/v1/catalog/presentation/%63haracters', '/api/v1/catalog/presentation/characters/']) expect(isDatabaseRead('GET', path)).toBe(false);
    expect(isDatabaseRead('POST', '/api/v1/dbv/sets')).toBe(false);
    expect(databaseCanonicalPath(servicePrefix + '/dbv/sets')).toBe('/api/v1/dbv/sets');
    expect(databaseCanonicalPath(nativePrefix + '/api/v1/dbv/sets')).toBe('/api/v1/dbv/sets');
    expect(databaseCanonicalPath('/api/v1/dbv/sets')).toBe('/api/v1/dbv/sets');
  });
  it('caches native identity, renews near expiry, and verifies revocation on every request', () => {
    const issuance = jest.spyOn(service, 'issue');
    expect(native.authenticate().clientId).toBe('excelsior-web'); native.authenticate(); expect(issuance).toHaveBeenCalledTimes(1);
    now += 55000; native.authenticate(); expect(issuance).toHaveBeenCalledTimes(2);
    config.clients[0]!.tokenEpoch++; native.authenticate(); expect(issuance).toHaveBeenCalledTimes(3);
    config.clients[0]!.enabled = false; expect(() => native.authenticate()).toThrow(expect.objectContaining({ status: 401 })); expect(issuance).toHaveBeenCalledTimes(4);
  });
  it('retains native per-user/IP quotas without a single global native client cap', () => {
    config.clients[0]!.requestsPerMinute = 1;
    const token = service.issue({ client_id: 'excelsior-web', client_secret: secret }).accessToken;
    for (let i = 0; i < 605; i++) expect(service.authenticateNativeDatabase(token).clientId).toBe('excelsior-web');
    expect(() => service.authenticate(token, 'catalog:read')).toThrow(expect.objectContaining({ status: 429 }));
    expect(() => service.authenticateNativeDatabase(issue())).toThrow(expect.objectContaining({ status: 403 }));
  });
  it('fails closed for a misconfigured native client and non-renewable failures', () => {
    const wrong = new NativeDatabaseAccess(service, () => ({ clientId: 'bmg-database-ui', clientSecret: secret }));
    expect(() => wrong.authenticate()).toThrow(expect.objectContaining({ status: 503 }));
    jest.spyOn(service, 'authenticateNativeDatabase').mockImplementation(() => { throw new ServiceAccessError(429, 'SERVICE_CLIENT_RATE_LIMITED', 'Throttled'); });
    expect(() => native.authenticate()).toThrow(expect.objectContaining({ status: 429 }));
  });
  it('retries a native invalid token at most once', () => {
    jest.spyOn(service, 'authenticateNativeDatabase').mockImplementation(() => { throw new ServiceAccessError(401, 'SERVICE_TOKEN_INVALID', 'Revoked'); });
    const issuance = jest.spyOn(service, 'issue');
    expect(() => native.authenticate()).toThrow(); expect(issuance).toHaveBeenCalledTimes(2);
  });
  it('preserves cookie, IP, query and player separation with a verified native identity', async () => {
    const result = await request(app()).get(nativePrefix + '/api/v1/catalog/presentation/characters?since_version=10')
      .set('Cookie', 'sessionId=fictional-cookie').set('X-Forwarded-For', '192.0.2.12').expect(200);
    expect(result.body).toMatchObject({ client: 'excelsior-web', player: null, cookie: 'sessionId=fictional-cookie', ip: '192.0.2.12', query: { since_version: '10' } });
    expect(result.headers['cache-control']).toBe('no-store'); expect(result.headers[SERVICE_HEADER]).toBeUndefined();
    await request(app()).get(nativePrefix + '/api/v1/catalog/presentation/characters').set(SERVICE_HEADER, 'Bearer ' + issue()).expect(401);
  });
  it('requires verified BMG credentials and keeps service identity separate from player identity', async () => {
    const result = await request(app()).get(servicePrefix + '/catalog/presentation/characters').set(SERVICE_HEADER, 'Bearer ' + issue()).expect(200);
    expect(result.body).toMatchObject({ client: 'bmg-database-ui', player: null }); expect(result.headers['cache-control']).toBe('no-store');
    await request(app()).get(servicePrefix + '/catalog/presentation/characters').expect(401);
    await request(app()).get(servicePrefix + '/catalog/presentation/characters').set(SERVICE_HEADER, 'bad').expect(401);
    await request(app()).get(servicePrefix + '/catalog/presentation/characters').set(SERVICE_HEADER, 'Bearer invalid').expect(401);
  });
  it.each([['get', '/decks'], ['post', '/catalog/presentation/characters'], ['delete', '/collections/me/cards']])('blocks %s %s', async (method, path) => {
    const test = request(app()) as unknown as Record<string, (path: string) => request.Test>;
    await test[method]!(servicePrefix + path).set(SERVICE_HEADER, 'Bearer ' + issue()).expect(403);
  });
  it('issues service tokens only through the controlled POST and leaves direct legacy reads compatible', async () => {
    const result = await request(app()).post(servicePrefix + '/service-auth/token').send({ grant_type: 'client_credentials', client_id: 'bmg-database-ui', client_secret: secret, scope: 'catalog:read' }).expect(200);
    expect(result.body.data.tokenType).toBe('Bearer'); expect(result.headers['cache-control']).toBe('no-store');
    await request(app()).get(servicePrefix + '/service-auth/token').expect(401);
    await request(app()).get(servicePrefix + '/service-auth/token').set(SERVICE_HEADER, 'Bearer ' + issue()).expect(403);
    await request(app()).post(nativePrefix + '/api/v1/dbv/sets').expect(403);
    await request(app()).post(nativePrefix + '/api/v1/service-auth/token').expect(403);
    await request(app()).get('/api/v1/catalog/presentation/characters').expect(200);
  });
  it('honors independent rollback flags and never falls back to anonymous service reads', async () => {
    process.env.ENABLE_NATIVE_DATABASE_SERVICE = '0'; expect(nativeDatabaseEnabled()).toBe(false);
    await request(app()).get(nativePrefix + '/api/v1/catalog/presentation/characters').expect(503);
    process.env.ENABLE_DATABASE_SERVICE_GATEWAY = '0';
    await request(app()).get(servicePrefix + '/catalog/presentation/characters').expect(503);
    await request(app()).get(nativePrefix).expect(503); await request(app()).get(servicePrefix).expect(503);
  });
  it('requires actual reverse-proxy TLS in production, including issuance', async () => {
    process.env.NODE_ENV = 'production';
    await request(app()).get(servicePrefix + '/catalog/presentation/characters').set(SERVICE_HEADER, 'Bearer ' + issue()).expect(503);
    await request(app()).post(servicePrefix + '/service-auth/token').send({}).expect(503);
    await request(app()).get(servicePrefix + '/catalog/presentation/characters').set('X-Forwarded-Proto', 'https').set(SERVICE_HEADER, 'Bearer ' + issue()).expect(200);
  });
  it('sanitizes configuration failures and reports verified throttles with Retry-After', async () => {
    delete process.env.APPLICATION_ACCESS_CREDENTIALS_FILE;
    await request(app(true)).get(nativePrefix + '/api/v1/catalog/presentation/characters').expect(503);
    jest.spyOn(native, 'authenticate').mockImplementation(() => { throw new Error('private credentials'); });
    const failure = await request(app()).get(nativePrefix + '/api/v1/catalog/presentation/characters').expect(503); expect(JSON.stringify(failure.body)).not.toContain('private credentials');
    config.clients[1]!.requestsPerMinute = 1;
    const limited = await request(app()).get(servicePrefix + '/catalog/presentation/characters').set(SERVICE_HEADER, 'Bearer ' + issue()).expect(429);
    expect(limited.headers['retry-after']).toBe('60');
  });
  it('the confidential BMG adapter uses the uncached service namespace and forbids unrelated operations', async () => {
    const fetcher = jest.fn(async (url: string, _options?: RequestInit) => new Response(JSON.stringify(url.endsWith('/token') ? { data: { accessToken: 'token', tokenType: 'Bearer', expiresInSeconds: 60 } } : { data: [] })));
    const adapter = new ApplicationAccessAdapter('http://127.0.0.1:8086', () => ({ clientId: 'bmg-database-ui', clientSecret: secret }), fetcher as typeof fetch, Date.now, true);
    await adapter.request('/api/v1/dbv/sets?since_version=1');
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual(['http://127.0.0.1:8086/api/service/v1/service-auth/token', 'http://127.0.0.1:8086/api/service/v1/dbv/sets?since_version=1']);
    const calls = fetcher.mock.calls.length;
    for (const options of [{ method: 'POST' }, { body: {} }, { player: {} }]) await expect(adapter.request('/api/v1/dbv/sets', options)).rejects.toThrow('Unsupported');
    await expect(adapter.request('/api/v1/decks')).rejects.toThrow('Unsupported database'); expect(fetcher).toHaveBeenCalledTimes(calls);
  });
  it('rejects certificate-verification bypass in a confidential database host', () => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    expect(() => new ApplicationAccessAdapter('https://example.test', () => ({ clientId: 'bmg-database-ui', clientSecret: secret }), fetch, Date.now, true)).toThrow('certificate verification');
  });
  it('redacts unexpected issuance failures rather than returning private error details', async () => {
    jest.spyOn(service, 'issue').mockImplementation(() => { throw new Error('private credential detail'); });
    const failure = await request(app()).post(servicePrefix + '/service-auth/token').send({ grant_type: 'client_credentials', client_id: 'bmg-database-ui', client_secret: secret }).expect(503);
    expect(failure.body.errors[0].code).toBe('SERVICE_ACCESS_UNAVAILABLE'); expect(JSON.stringify(failure.body)).not.toContain('private credential');
  });
});

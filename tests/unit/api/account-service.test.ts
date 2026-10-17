import express from 'express';
import request from 'supertest';
import { createHash } from 'crypto';
import { ACCOUNT_SERVICE_PREFIX as prefix, ACCOUNT_SESSION_HEADER, accountCanonicalPath } from '../../../src/api/access/accountOperations';
import { ServiceAccessService, SERVICE_HEADER } from '../../../src/api/access/serviceAccessService';
import type { ServiceAccessConfig } from '../../../src/api/access/serviceAccessConfig';
import { createAccountAccessMiddleware } from '../../../src/api/http/middleware/accountAccess';
import { createServiceAccessMiddleware } from '../../../src/api/http/middleware/serviceAccess';
import { resetV1RateLimitBucketsForTests } from '../../../src/api/http/middleware/v1RateLimit';
import { serviceScopeForOperation } from '../../../src/api/access/serviceOperations';
import { setupMiddleware } from '../../../src/middleware/setup';
import { createApplicationLogger } from '../../../src/middleware/logging';

const secret = 'fictional-account-test-service-secret';
const session = 'a'.repeat(64);
const operations = [
  ['POST', '/auth/login', '/api/auth/login'], ['POST', '/auth/signup', '/api/auth/signup'],
  ['POST', '/auth/google/preview', '/api/auth/google/preview'], ['POST', '/auth/google', '/api/auth/google'],
  ['POST', '/auth/logout', '/api/auth/logout'], ['GET', '/auth/me', '/api/auth/me'],
  ['GET', '/config/firebase', '/api/config/firebase'],
  ['POST', '/users/change-email', '/api/v1/users/change-email'],
  ['POST', '/users/change-password', '/api/v1/users/change-password'],
  ['POST', '/users/display-name', '/api/v1/users/display-name'],
] as const;

describe('opt-in external account boundary', () => {
  const original = { ...process.env };
  let config: ServiceAccessConfig; let now: number; let service: ServiceAccessService;
  beforeEach(() => {
    now = Date.now(); process.env.ENABLE_ACCOUNT_SERVICE_GATEWAY = '1';
    delete process.env.DISABLE_V1_RATE_LIMIT;
    resetV1RateLimitBucketsForTests();
    config = { environment: 'development', signingSecret: 'fictional-account-signing-key'.repeat(3), tokenTtlSeconds: 60, clients: [
      { id: 'external-account-test', enabled: true, tokenEpoch: 0, requestsPerMinute: 600, scopes: ['account:self'], credentials: [{ version: 'v1', secretSha256: createHash('sha256').update(secret).digest('hex') }] },
    ] };
    service = new ServiceAccessService(() => config, () => now);
  });
  afterEach(() => { process.env = { ...original }; jest.restoreAllMocks(); });
  const token = () => service.issue({ client_id: 'external-account-test', client_secret: secret }).accessToken;
  const app = () => {
    const host = express(); host.set('trust proxy', 1); host.use(express.json());
    host.use(createAccountAccessMiddleware(service));
    host.use('/api', createServiceAccessMiddleware(service));
    host.use((req, res) => {
      res.set('Cache-Control', 'public, max-age=300');
      res.cookie('sessionId', session, { httpOnly: true });
      res.json({ path: req.path, query: req.query, body: req.body, ip: req.ip, client: req.serviceClient?.clientId ?? null,
        cookie: req.headers.cookie ?? null, cookies: req.cookies ?? null, authorization: req.headers.authorization ?? null });
    });
    return host;
  };
  it.each(operations)('allows only %s %s with a separately granted scope', async (method, path, canonical) => {
    const call = method === 'GET' ? request(app()).get(prefix + path) : request(app()).post(prefix + path).send({ fictional: true });
    const response = await call.set(SERVICE_HEADER, 'Bearer ' + token()).expect(200);
    expect(response.body.path).toBe(canonical); expect(response.body.client).toBe('external-account-test');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['set-cookie']).toBeUndefined(); expect(response.headers[ACCOUNT_SESSION_HEADER]).toBe(session);
  });
  it.each(['/auth/login/', '/auth/%6cogin', '/auth/login/extra', '/admin/users', '/decks', '/guest/decks', '/service-auth/token', '/users/another-user', '/__proto__'])('denies nonliteral or out-of-scope %s', async path => {
    expect(accountCanonicalPath('POST', prefix + path)).toBeNull();
    await request(app()).post(prefix + path).set(SERVICE_HEADER, 'Bearer ' + token()).expect(403);
  });
  it.each(['GET', 'PUT', 'PATCH', 'DELETE', 'HEAD'])('denies method substitution %s', async method => {
    expect(accountCanonicalPath(method, prefix + '/auth/login')).toBeNull();
  });
  it('ignores ambient cookies/Bearer identity and forwards only an explicit private session', async () => {
    const issued = token();
    const anonymous = await request(app()).get(prefix + '/auth/me').set(SERVICE_HEADER, 'Bearer ' + issued)
      .set('Cookie', 'sessionId=' + session).set('Authorization', 'Bearer fictional-player').expect(200);
    expect(anonymous.body).toMatchObject({ cookies: null, cookie: null, authorization: null });
    const signedIn = await request(app()).get(prefix + '/auth/me?fictional=1').set(SERVICE_HEADER, 'Bearer ' + issued)
      .set(ACCOUNT_SESSION_HEADER, session).set('X-Forwarded-For', '192.0.2.8').expect(200);
    expect(signedIn.body).toMatchObject({ cookie: 'sessionId=' + session, cookies: { sessionId: session }, query: { fictional: '1' }, ip: '192.0.2.8' });
  });
  it.each(['bad', 'b'.repeat(63), 'b'.repeat(65), session + ';other=1', session + ',' + session])('rejects malformed private session %s', async value => {
    await request(app()).get(prefix + '/auth/me').set(SERVICE_HEADER, 'Bearer ' + token()).set(ACCOUNT_SESSION_HEADER, value).expect(401);
  });
  it('requires service identity even when an ambient player session exists', async () => {
    for (const value of [undefined, 'bad', 'Bearer invalid']) {
      const call = request(app()).get(prefix + '/auth/me').set('Cookie', 'sessionId=' + session);
      if (value) call.set(SERVICE_HEADER, value);
      await call.expect(401);
    }
  });
  it('rejects old scope tokens, expiry, client disablement, epoch and credential revocation', async () => {
    const issued = token();
    now += 60_000;
    await request(app()).get(prefix + '/auth/me').set(SERVICE_HEADER, 'Bearer ' + issued).expect(401);
    now -= 60_000;
    for (const change of [() => { config.clients[0]!.enabled = false; }, () => { config.clients[0]!.tokenEpoch++; }, () => { config.clients[0]!.credentials[0]!.version = 'v2'; }]) {
      const prior = structuredClone(config); change();
      await request(app()).get(prefix + '/auth/me').set(SERVICE_HEADER, 'Bearer ' + issued).expect(401);
      config = prior;
    }
    config.clients[0]!.scopes = ['auth:session'];
    await request(app()).get(prefix + '/auth/me').set(SERVICE_HEADER, 'Bearer ' + token()).expect(403);
    expect(serviceScopeForOperation('POST', '/api/v1/users/change-email')).toBeNull();
  });
  it('is off by default and leaves all native URLs/cookie behavior unchanged', async () => {
    delete process.env.ENABLE_ACCOUNT_SERVICE_GATEWAY;
    await request(app()).get(prefix + '/auth/me').expect(503);
    for (const path of ['/api/auth/me', '/api/auth/login', '/api/v1/users/change-email', prefix + '-other/auth/me']) {
      const response = await request(app()).get(path).set('Cookie', 'sessionId=' + session).expect(200);
      expect(response.body.client).toBeNull(); expect(response.body.cookie).toBe('sessionId=' + session);
      expect(response.headers['set-cookie']).toBeDefined(); expect(response.headers[ACCOUNT_SESSION_HEADER]).toBeUndefined();
      expect(response.headers['cache-control']).toBe('public, max-age=300');
    }
  });
  it('requires production HTTPS and sanitizes unavailable configuration', async () => {
    process.env.NODE_ENV = 'production';
    await request(app()).get(prefix + '/auth/me').set(SERVICE_HEADER, 'Bearer ' + token()).expect(503);
    await request(app()).get(prefix + '/auth/me').set('X-Forwarded-Proto', 'https').set(SERVICE_HEADER, 'Bearer ' + token()).expect(200);
    jest.spyOn(service, 'authenticate').mockImplementation(() => { throw new Error('private-configuration-detail'); });
    const failure = await request(app()).get(prefix + '/auth/me').set('X-Forwarded-Proto', 'https').set(SERVICE_HEADER, 'Bearer fictional').expect(503);
    expect(JSON.stringify(failure.body)).not.toContain('private-configuration-detail');
  });
  it('preserves service quota and uses a distinct login budget without throttling logout', async () => {
    const host = app(); const issued = token();
    for (let i = 0; i < 15; i++) await request(host).post(prefix + '/auth/login').set(SERVICE_HEADER, 'Bearer ' + issued).send({}).expect(200);
    const failure = await request(host).post(prefix + '/auth/google').set(SERVICE_HEADER, 'Bearer ' + issued).send({}).expect(429);
    expect(Number(failure.headers['retry-after'])).toBeGreaterThan(0);
    await request(host).post(prefix + '/auth/logout').set(SERVICE_HEADER, 'Bearer ' + issued).expect(200);
    config.clients[0]!.requestsPerMinute = 1;
    const limited = await request(host).get(prefix + '/auth/me').set(SERVICE_HEADER, 'Bearer ' + issued).expect(429);
    expect(limited.headers['retry-after']).toBe('60');
  });
  it('translates logout clearing, drops unrelated cookies, and preserves ordinary headers', async () => {
    const host = express(); host.use(createAccountAccessMiddleware(service));
    host.post('/api/auth/logout', (_req, res) => { res.setHeader('X-Fictional', 1); res.cookie('unrelated', 'never-forward'); res.clearCookie('sessionId'); res.json({ success: true }); });
    const response = await request(host).post(prefix + '/auth/logout').set(SERVICE_HEADER, 'Bearer ' + token()).expect(200);
    expect(response.headers[ACCOUNT_SESSION_HEADER]).toBe(''); expect(response.headers['set-cookie']).toBeUndefined(); expect(response.headers['x-fictional']).toBe('1');
  });
  it('sanitizes malformed/oversized JSON before account handlers in real middleware wiring', async () => {
    const host = express(); setupMiddleware(host);
    const malformed = await request(host).post(prefix + '/auth/login').set('Content-Type', 'application/json').send('{"private-password":').expect(400);
    expect(JSON.stringify(malformed.body)).not.toContain('private-password');
    await request(host).post(prefix + '/auth/login').send({ padding: 'x'.repeat(110 * 1024) }).expect(413);
  });
  it('redacts the new private session on both sides of structured logs', () => {
    let output = '';
    const logger = createApplicationLogger({ write: (value: string) => { output += value; } });
    logger.info({ req: { headers: { [ACCOUNT_SESSION_HEADER]: session } }, res: { headers: { [ACCOUNT_SESSION_HEADER]: session } } }, 'fictional account request');
    expect(output).toContain('fictional account request'); expect(output).not.toContain(session);
  });
});

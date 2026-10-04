import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { mkdtempSync, writeFileSync, rmSync, chmodSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import express from 'express';
import request from 'supertest';
import { ServiceAccessService, SERVICE_ISSUER, SERVICE_AUDIENCE, SERVICE_HEADER } from '../../../src/api/access/serviceAccessService';
import { SERVICE_SCOPES, readServiceAccessConfig, validateServiceAccessConfig, type ServiceAccessConfig } from '../../../src/api/access/serviceAccessConfig';
import { registerServiceAuthV1HttpRoutes } from '../../../src/api/http/service-auth.http';
import { createServiceAccessMiddleware } from '../../../src/api/http/middleware/serviceAccess';
import { resetV1RateLimitBucketsForTests } from '../../../src/api/http/middleware/v1RateLimit';

const secret = (id: string) => 'fictional-unit-credential-' + id.repeat(40);
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const configuration = (): ServiceAccessConfig => ({ environment: 'development', signingSecret: 'unit-service-key-distinct-from-player-key'.repeat(2), tokenTtlSeconds: 60, clients: ['excelsior-web', 'lrg-web'].map(id => ({ id, enabled: true, tokenEpoch: 0, scopes: [...SERVICE_SCOPES], credentials: [{ version: 'v1', secretSha256: digest(secret(id)) }], requestsPerMinute: 600 })) });

describe('confidential service access contract', () => {
  let config: ServiceAccessConfig;
  let now: number;
  let audit: jest.Mock;
  let service: ServiceAccessService;
  const issue = (id = 'excelsior-web') => service.issue({ client_id: id, client_secret: secret(id) }).accessToken;
  beforeEach(() => { config = configuration(); now = 1800000000000; audit = jest.fn(); service = new ServiceAccessService(() => config, () => now, audit); resetV1RateLimitBucketsForTests(); });
  it.each(['excelsior-web', 'lrg-web'])('issues a bounded service identity for %s without a player identity', id => {
    const token = issue(id); const claims = jwt.decode(token) as jwt.JwtPayload;
    expect(claims.sub).toBe(id); expect(claims.kind).toBe('service'); expect(claims.exp! - claims.iat!).toBe(60);
    expect(claims).not.toHaveProperty('role'); expect(claims).not.toHaveProperty('userId');
    expect(service.authenticate(token, 'catalog:read').clientId).toBe(id);
    expect(JSON.stringify(audit.mock.calls)).not.toContain(token); expect(JSON.stringify(audit.mock.calls)).not.toContain(secret(id));
  });
  it('rejects a different client credential and disallowed requested scopes', () => {
    expect(() => service.issue({ client_id: 'lrg-web', client_secret: secret('excelsior-web') })).toThrow(expect.objectContaining({ status: 401 }));
    expect(() => service.issue({ client_id: 'excelsior-web', client_secret: secret('excelsior-web'), scope: 'admin:all' })).toThrow(expect.objectContaining({ status: 403 }));
    const limited = service.issue({ client_id: 'excelsior-web', client_secret: secret('excelsior-web'), scope: 'catalog:read' }).accessToken;
    expect(() => service.authenticate(limited, 'decks:write')).toThrow(expect.objectContaining({ status: 403 }));
    expect(() => service.authenticate(issue(), null)).toThrow(expect.objectContaining({ status: 403 }));
  });
  it.each(['expired', 'disabled', 'epoch', 'removed-version', 'signing-key', 'scope-reduced'])('revokes a token on %s', mutation => {
    const token = issue(); const client = config.clients[0]!;
    if (mutation === 'expired') now += 61000;
    if (mutation === 'disabled') client.enabled = false;
    if (mutation === 'epoch') client.tokenEpoch++;
    if (mutation === 'removed-version') client.credentials[0]!.version = 'v2';
    if (mutation === 'signing-key') config.signingSecret = 'different-signing-key'.repeat(4);
    if (mutation === 'scope-reduced') client.scopes = ['catalog:read'];
    expect(() => service.authenticate(token, 'catalog:read')).toThrow(expect.objectContaining({ status: 401, code: 'SERVICE_TOKEN_INVALID' }));
  });
  it('supports overlap rotation then retires only the old version', () => {
    const old = issue(); const replacement = secret('rotated');
    config.clients[0]!.credentials.push({ version: 'v2', secretSha256: digest(replacement) });
    const fresh = service.issue({ client_id: 'excelsior-web', client_secret: replacement }).accessToken;
    service.authenticate(old, 'catalog:read'); service.authenticate(fresh, 'catalog:read');
    config.clients[0]!.credentials.shift();
    expect(() => service.authenticate(old, 'catalog:read')).toThrow(); service.authenticate(fresh, 'catalog:read');
  });
  it.each(['issuer', 'audience', 'algorithm', 'type', 'future-issued', 'overlong', 'duplicate-scope'])('rejects %s confusion', mutation => {
    const claims = jwt.decode(issue()) as jwt.JwtPayload; delete claims.iss; delete claims.aud;
    if (mutation === 'future-issued') claims.iat! += 10;
    if (mutation === 'overlong') claims.exp! += 60;
    if (mutation === 'duplicate-scope') claims.scopes = ['catalog:read', 'catalog:read'];
    const token = jwt.sign(claims, config.signingSecret, { algorithm: mutation === 'algorithm' ? 'HS384' : 'HS256', issuer: mutation === 'issuer' ? 'player' : SERVICE_ISSUER, audience: mutation === 'audience' ? 'player-api' : SERVICE_AUDIENCE, header: { alg: mutation === 'algorithm' ? 'HS384' : 'HS256', typ: mutation === 'type' ? 'JWT' : 'excelsior-service+jwt' } });
    expect(() => service.authenticate(token, 'catalog:read')).toThrow(expect.objectContaining({ status: 401 }));
  });
  it('enforces independent client budgets, resets windows, and records throttling', () => {
    config.clients[0]!.requestsPerMinute = 1; issue();
    expect(() => issue()).toThrow(expect.objectContaining({ status: 429, retryAfterSeconds: 60 }));
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ clientId: 'excelsior-web', outcome: 'throttled' }));
    issue('lrg-web'); now += 60000; issue();
  });
  it('fails closed on missing configuration and keeps parse details private', () => {
    for (const provider of [() => null, () => { throw new Error(secret('private')); }]) {
      const unconfigured = new ServiceAccessService(provider);
      expect(() => unconfigured.issue({ client_id: 'excelsior-web', client_secret: secret('private') })).toThrow(expect.objectContaining({ status: 503, message: 'Service access is not configured' }));
    }
  });
  it('validates separate client credentials, bounded TTL and strict fields', () => {
    validateServiceAccessConfig(config);
    config.clients[1]!.credentials = config.clients[0]!.credentials;
    expect(() => validateServiceAccessConfig(config)).toThrow();
    expect(() => validateServiceAccessConfig({ ...configuration(), tokenTtlSeconds: 301 })).toThrow();
    expect(() => validateServiceAccessConfig({ ...configuration(), extra: 'secret' })).toThrow();
  });
  it('honors private-file permissions and rejects development configuration in production', () => {
    const dir = mkdtempSync(join(tmpdir(), 'm2-config-')); const file = join(dir, 'config.json');
    const previous = { flag: process.env.ENABLE_SERVICE_ACCESS, file: process.env.SERVICE_ACCESS_CONFIG_FILE, env: process.env.NODE_ENV };
    try {
      writeFileSync(file, JSON.stringify(config), { mode: 0o600 }); process.env.ENABLE_SERVICE_ACCESS = '1'; process.env.SERVICE_ACCESS_CONFIG_FILE = file;
      expect(readServiceAccessConfig()?.clients).toHaveLength(2);
      chmodSync(file, 0o644); expect(readServiceAccessConfig).toThrow(); chmodSync(file, 0o600);
      process.env.NODE_ENV = 'production'; expect(readServiceAccessConfig).toThrow();
      process.env.ENABLE_SERVICE_ACCESS = '0'; expect(readServiceAccessConfig()).toBeNull();
    } finally { for (const [key, value] of Object.entries({ ENABLE_SERVICE_ACCESS: previous.flag, SERVICE_ACCESS_CONFIG_FILE: previous.file, NODE_ENV: previous.env })) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } rmSync(dir, { recursive: true }); }
  });
  it('serves issuance/errors with no-store, strict bodies, and no Origin requirement', async () => {
    const app = express(); app.use(express.json()); const router = express.Router(); registerServiceAuthV1HttpRoutes(router, service); app.use('/api/v1', router);
    const input = { grant_type: 'client_credentials', client_id: 'lrg-web', client_secret: secret('lrg-web') };
    const issued = await request(app).post('/api/v1/service-auth/token').send(input).expect(200);
    expect(issued.headers['cache-control']).toBe('no-store'); expect(issued.body.data.tokenType).toBe('Bearer');
    await request(app).post('/api/v1/service-auth/token').send({ ...input, arbitraryUser: 'other' }).expect(400);
    await request(app).post('/api/v1/service-auth/token').send({ ...input, client_secret: secret('wrong') }).expect(401);
    await request(app).post('/api/v1/service-auth/token').send({ ...input, scope: 'admin:all' }).expect(403);
    config.clients[1]!.requestsPerMinute = 2;
    const throttled = await request(app).post('/api/v1/service-auth/token').send(input).expect(429); expect(throttled.headers['retry-after']).toBeDefined();
  });
  it('middleware verifies explicit service tokens while leaving player authentication separate', async () => {
    const app = express(); app.use('/api', createServiceAccessMiddleware(service));
    app.get('/api/v1/catalog/characters', (req, res) => res.setHeader('Cache-Control', 'public, max-age=300').json({ client: req.serviceClient?.clientId, player: req.user ?? null }));
    app.get('/api/v1/admin/users', (_req, res) => res.json({ forbidden: true }));
    await request(app).get('/api/v1/catalog/characters').expect(200, { player: null });
    const valid = await request(app).get('/api/v1/catalog/characters').set(SERVICE_HEADER, 'Bearer ' + issue()).expect(200);
    expect(valid.body).toEqual({ client: 'excelsior-web', player: null });
    expect(valid.headers['cache-control']).toBe('no-store');
    expect(JSON.stringify(audit.mock.calls)).not.toContain('/api/v1/catalog/characters');
    await request(app).get('/api/v1/catalog/characters').set(SERVICE_HEADER, 'Bearer invalid').expect(401);
    await request(app).get('/api/v1/admin/users').set(SERVICE_HEADER, 'Bearer ' + issue()).expect(403);
    const throttledToken = issue(); config.clients[0]!.requestsPerMinute = 1;
    await request(app).get('/api/v1/catalog/characters').set(SERVICE_HEADER, 'Bearer ' + throttledToken).expect(429);
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ event: 'service_request', clientId: 'excelsior-web', outcome: 'throttled' }));
  });
});

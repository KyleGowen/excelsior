import { createHash, randomBytes, randomUUID } from 'crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { Server } from 'http';
import { get } from 'http';
import express from 'express';
import request from 'supertest';
import { app } from '../../src/index';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { ApplicationAccessAdapter } from '../../src/api/access/applicationAccessAdapter';
import { ServiceAccessService, SERVICE_HEADER } from '../../src/api/access/serviceAccessService';
import { createDatabaseAccessMiddleware } from '../../src/api/http/middleware/databaseAccess';
import { createApiAccessLogMiddleware } from '../../src/api/http/middleware/apiAccessLog';
import { createRequestIdMiddleware } from '../../src/middleware/requestId';
import type { ServiceAccessConfig } from '../../src/api/access/serviceAccessConfig';
import { CATALOG_PRESENTATION_TYPES } from '../../src/services/catalog-presentation/presentCatalog';

describe('database services with production composition and real PostgreSQL', () => {
  const directory = mkdtempSync(join(tmpdir(), 'database-service-auth-'));
  const registry = join(directory, 'registry.json'); const credentials = join(directory, 'credentials.json');
  const secrets = new Map(['excelsior-web', 'bmg-database-ui'].map(id => [id, randomBytes(32).toString('base64url')]));
  const config: ServiceAccessConfig = { environment: 'development', signingSecret: randomBytes(48).toString('base64url'), tokenTtlSeconds: 60,
    clients: [...secrets].map(([id, secret]) => ({ id, enabled: true, tokenEpoch: 0, requestsPerMinute: 600, scopes: ['catalog:read'],
      credentials: [{ version: 'v1', secretSha256: createHash('sha256').update(secret).digest('hex') }] })) };
  const keys = ['ENABLE_SERVICE_ACCESS', 'SERVICE_ACCESS_CONFIG_FILE', 'APPLICATION_ACCESS_CREDENTIALS_FILE', 'ENABLE_DATABASE_SERVICE_GATEWAY', 'ENABLE_NATIVE_DATABASE_SERVICE'] as const;
  const previous = new Map(keys.map(key => [key, process.env[key]]));
  const requestIds: string[] = []; let server: Server; let adapter: ApplicationAccessAdapter;
  const save = () => writeFileSync(registry, JSON.stringify(config), { mode: 0o600 });
  const pool = () => DataSourceConfig.getInstance().getPool();
  beforeAll(async () => {
    save(); writeFileSync(credentials, JSON.stringify({ environment: 'development', clients: [...secrets].map(([clientId, clientSecret]) => ({ clientId, clientSecret })) }), { mode: 0o600 });
    process.env.ENABLE_SERVICE_ACCESS = '1'; process.env.SERVICE_ACCESS_CONFIG_FILE = registry;
    process.env.APPLICATION_ACCESS_CREDENTIALS_FILE = credentials; process.env.ENABLE_DATABASE_SERVICE_GATEWAY = '1'; process.env.ENABLE_NATIVE_DATABASE_SERVICE = '1';
    server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
    const address = server.address(); if (!address || typeof address === 'string') throw new Error('Local API listener unavailable');
    adapter = new ApplicationAccessAdapter('http://127.0.0.1:' + address.port, () => ({ clientId: 'bmg-database-ui', clientSecret: secrets.get('bmg-database-ui')! }), fetch, Date.now, true);
  });
  afterAll(async () => {
    try {
      if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      // No players/decks created; request records are retained as run-owned local evidence.
    } finally {
      for (const [key, value] of previous) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
      rmSync(directory, { recursive: true, force: true });
    }
  });
  it('serves identical presentation, foil map, sets and asset config to both apps without a BMG account', async () => {
    for (const path of [...CATALOG_PRESENTATION_TYPES.map(type => '/api/v1/catalog/presentation/' + type), '/api/v1/catalog/foil-card-map', '/api/v1/dbv/sets', '/api/v1/config/app']) {
      const direct = await request(app).get(path).expect(200);
      const nativeId = randomUUID(); const bmgId = randomUUID(); requestIds.push(nativeId, bmgId);
      const native = await request(app).get('/api/apps/excelsior' + path).set('X-Request-Id', nativeId).expect(200);
      const external = await adapter.request(path, { requestId: bmgId }); expect(external.status).toBe(200);
      const data = await external.json();
      expect(native.body.data ?? native.body).toEqual(direct.body.data ?? direct.body);
      expect((data as { data?: unknown }).data ?? data).toEqual(direct.body.data ?? direct.body);
      expect(native.headers['cache-control']).toBe('no-store'); expect(external.headers.get('cache-control')).toBe('no-store');
      expect(native.headers[SERVICE_HEADER]).toBeUndefined(); expect(external.headers.get(SERVICE_HEADER)).toBeNull();
    }
  });
  it('preserves conditional GET and recovers a revoked confidential token without anonymous fallback', async () => {
    const first = await adapter.request('/api/v1/dbv/sets'); const etag = first.headers.get('etag'); expect(etag).toBeTruthy();
    const unchanged = await adapter.request('/api/v1/dbv/sets', { ifNoneMatch: etag! }); expect(unchanged.status).toBe(304); expect(unchanged.headers.get('cache-control')).toBe('no-store');
    config.clients[1]!.tokenEpoch++; save(); expect((await adapter.request('/api/v1/dbv/sets')).status).toBe(200);
    await request(app).get('/api/service/v1/dbv/sets').expect(401);
    await request(app).get('/api/service/v1/dbv/sets').set(SERVICE_HEADER, 'Bearer invalid').expect(401);
    await request(app).post('/api/service/v1/decks').send({ name: 'Never created' }).expect(401);
    const malformed = await request(app).post('/api/service/v1/service-auth/token').set('Content-Type', 'application/json').send('private-invalid-credential-body').expect(400);
    expect(malformed.body.errors[0].code).toBe('VALIDATION_ERROR'); expect(JSON.stringify(malformed.body)).not.toContain('private-invalid');
    const oversized = await request(app).post('/api/service/v1/service-auth/token').send({ client_secret: 'x'.repeat(110000) }).expect(413);
    expect(oversized.body.errors[0].code).toBe('VALIDATION_ERROR'); expect(oversized.headers['cache-control']).toBe('no-store');
  });
  it('records verified origin requests once and makes aggregate totals match the records', async () => {
    let rows: Array<{ request_id: string; application_id: string; service_client_id: string; identity_verified: boolean; user_id: string | null }> = [];
    for (let attempt = 0; attempt < 30; attempt++) {
      rows = (await pool().query('SELECT request_id, application_id, service_client_id, identity_verified, user_id FROM api_access_log WHERE request_id = ANY($1)', [requestIds])).rows;
      if (rows.length === requestIds.length) break;
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    expect(rows).toHaveLength(requestIds.length); expect(new Set(rows.map(row => row.request_id)).size).toBe(requestIds.length);
    for (let i = 0; i < requestIds.length; i++) {
      const row = rows.find(value => value.request_id === requestIds[i])!;
      expect(row).toMatchObject({ application_id: i % 2 ? 'bmg-database-ui' : 'excelsior', service_client_id: i % 2 ? 'bmg-database-ui' : 'excelsior-web', identity_verified: true, user_id: null });
    }
    const mismatch = await pool().query("SELECT a.application_id, a.route_key, a.status FROM api_application_hit_counts a LEFT JOIN (SELECT application_id, route_key, method, status, (ts AT TIME ZONE 'UTC')::date AS day, COUNT(*) AS total FROM api_access_log GROUP BY application_id, route_key, method, status, (ts AT TIME ZONE 'UTC')::date) r USING (application_id, route_key, method, status, day) WHERE a.application_id IN ('excelsior','bmg-database-ui') AND a.hit_count <> COALESCE(r.total,0)");
    expect(mismatch.rows).toEqual([]);
  });
  it('counts a real disconnected service request once with its verified identity', async () => {
    const service = new ServiceAccessService(() => config);
    const token = service.issue({ client_id: 'bmg-database-ui', client_secret: secrets.get('bmg-database-ui')! }).accessToken;
    const id = randomUUID(); const host = express();
    host.use(createRequestIdMiddleware()); host.use(createApiAccessLogMiddleware({ pool: pool() })); host.use(createDatabaseAccessMiddleware(service));
    host.get('/api/v1/dbv/sets', (_req, res) => { res.flushHeaders(); });
    const listener = host.listen(0, '127.0.0.1');
    try {
      await new Promise<void>(resolve => listener.once('listening', resolve));
      const address = listener.address(); if (!address || typeof address === 'string') throw new Error('Missing owned test listener');
      await new Promise<void>((resolve, reject) => {
        get('http://127.0.0.1:' + address.port + '/api/service/v1/dbv/sets', { headers: { [SERVICE_HEADER]: 'Bearer ' + token, 'X-Request-Id': id } }, response => { response.destroy(); resolve(); }).on('error', reject);
      });
      let rows: Array<{ status: number; identity_verified: boolean; application_id: string }> = [];
      for (let i = 0; i < 30; i++) {
        rows = (await pool().query('SELECT status, identity_verified, application_id FROM api_access_log WHERE request_id=$1', [id])).rows;
        if (rows.length) break; await new Promise(resolve => setTimeout(resolve, 30));
      }
      expect(rows).toEqual([{ status: 499, identity_verified: true, application_id: 'bmg-database-ui' }]);
    } finally { await new Promise<void>((resolve, reject) => listener.close(error => error ? reject(error) : resolve())); }
  });
  it('keeps native rollout reversible and direct catalog/player routes compatible', async () => {
    process.env.ENABLE_NATIVE_DATABASE_SERVICE = '0';
    const cfg = await request(app).get('/api/v1/config/app').expect(200); expect(cfg.body.databaseServiceAdapter).toBe(false);
    await request(app).get('/api/apps/excelsior/api/v1/dbv/sets').expect(503);
    await request(app).get('/api/v1/dbv/sets').expect(200);
    await request(app).get('/api/v1/decks').expect(401);
    process.env.ENABLE_NATIVE_DATABASE_SERVICE = '1';
    config.clients[1]!.enabled = false; save();
    await expect(adapter.request('/api/v1/dbv/sets')).rejects.toThrow('service authentication failed');
  });
});

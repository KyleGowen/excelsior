import { EventEmitter } from 'events';
import type { Request, Response } from 'express';
import type { Pool } from 'pg';
import { applicationId, createApiAccessLogMiddleware } from '../../../src/api/http/middleware/apiAccessLog';

const warn = jest.fn();
jest.mock('../../../src/middleware/logging', () => ({ getLogger: () => ({ warn }) }));
describe('atomic application request tracking', () => {
  const query = jest.fn();
  const pool = { query } as unknown as Pick<Pool, 'query'>;
  const response = () => Object.assign(new EventEmitter(), { statusCode: 200 }) as unknown as Response;
  const req = (extra = {}) => ({ method: 'GET', originalUrl: '/api/v1/catalog/presentation/characters?private=query', ip: '192.0.2.1', ...extra }) as unknown as Request;
  const settle = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
  beforeEach(() => { delete process.env.DISABLE_API_ACCESS_LOG; query.mockReset().mockResolvedValue({}); warn.mockClear(); });
  afterEach(() => { delete process.env.DISABLE_API_ACCESS_LOG; });
  it('records verified identity separately from player, with an atomic UTC daily aggregate', async () => {
    const middleware = createApiAccessLogMiddleware({ pool }); const res = response(); const next = jest.fn();
    middleware(req({ serviceClient: { clientId: 'excelsior-web' }, user: { id: 'player-id' }, id: 'request-id' }), res, next);
    expect(query).not.toHaveBeenCalled(); res.emit('finish'); await settle();
    expect(next).toHaveBeenCalledTimes(1); expect(query).toHaveBeenCalledTimes(1);
    const [sql, values] = query.mock.calls[0]!;
    expect(sql).toContain('WITH recorded AS'); expect(sql).toContain('ON CONFLICT'); expect(sql).toContain("AT TIME ZONE 'UTC'");
    expect(values).toEqual(['player-id', 'GET /api/v1/catalog/presentation/characters', 'GET', 200, '192.0.2.1', 'request-id', 'excelsior', 'excelsior-web', true, expect.any(Number)]);
    expect(JSON.stringify(values)).not.toContain('private'); expect(values[9]).toBeGreaterThanOrEqual(0);
  });
  it('uses the verified identity on denials and canonicalizes service/native prefixes', async () => {
    const middleware = createApiAccessLogMiddleware({ pool });
    for (const url of ['/api/service/v1/dbv/sets', '/api/apps/excelsior/api/v1/dbv/sets']) {
      const res = response(); res.statusCode = 429;
      middleware(req({ originalUrl: url, serviceIdentity: { clientId: 'bmg-database-ui' }, databaseCanonicalPath: '/api/v1/dbv/sets' }), res, jest.fn()); res.emit('finish');
    }
    await settle();
    expect(query.mock.calls.map(([, values]) => values.slice(6, 9))).toEqual([['bmg-database-ui', 'bmg-database-ui', true], ['bmg-database-ui', 'bmg-database-ui', true]]);
    expect(query.mock.calls[0]![1].slice(1, 4)).toEqual(['GET /api/v1/dbv/sets', 'GET', 429]);
  });
  it('keeps forged labels unknown and excludes raw IDs, unmatched URLs and query contents', async () => {
    const middleware = createApiAccessLogMiddleware({ pool });
    for (const route of [{ path: '/decks/:id' }, { path: 10 }, undefined]) {
      const res = response();
      middleware(req({ originalUrl: '/api/v1/decks/private-record-id?client_id=bmg-database-ui', route, headers: { 'x-app-id': 'excelsior' }, ip: undefined }), res, jest.fn()); res.emit('finish');
    }
    await settle();
    expect(query.mock.calls.map(([, values]) => values[1])).toEqual(['GET /api/v1/decks/:id', 'GET /api/v1/*', 'GET /api/v1/*']);
    for (const [, values] of query.mock.calls) { expect(values.slice(6, 9)).toEqual(['unknown', null, false]); expect(values[4]).toBeNull(); expect(JSON.stringify(values)).not.toContain('private-record'); }
    expect(applicationId('future-client')).toBe('future-client');
  });
  it('deduplicates global/router mounts and finish notifications, preserving the kill switch', async () => {
    const middleware = createApiAccessLogMiddleware({ pool }); const request = req(); const res = response(); const next = jest.fn();
    middleware(request, res, next); middleware(request, res, next); res.emit('finish'); res.emit('finish'); await settle();
    expect(query).toHaveBeenCalledTimes(1);
    process.env.DISABLE_API_ACCESS_LOG = '1'; const disabled = response(); middleware(req(), disabled, next); disabled.emit('finish'); expect(query).toHaveBeenCalledTimes(1); expect(next).toHaveBeenCalledTimes(3);
  });
  it('bounds pending writes, reports capacity, recovers after a write, and never delays next', async () => {
    let resolve!: (value: unknown) => void; query.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    const failure = jest.fn(); const middleware = createApiAccessLogMiddleware({ pool, maxPending: 1, reportFailure: failure }); const next = jest.fn();
    const record = () => { const res = response(); middleware(req(), res, next); res.emit('finish'); };
    record(); record(); expect(query).toHaveBeenCalledTimes(1); expect(failure).toHaveBeenCalledWith('capacity'); expect(next).toHaveBeenCalledTimes(2);
    resolve({}); await settle(); record(); await settle(); expect(query).toHaveBeenCalledTimes(2);
  });
  it('handles synchronous/asynchronous failures without exposing errors or breaking responses', async () => {
    const middleware = createApiAccessLogMiddleware({ pool }); const next = jest.fn();
    query.mockRejectedValueOnce(new Error('private database credentials')).mockImplementationOnce(() => { throw new Error('private credentials'); });
    for (let i = 0; i < 2; i++) { const res = response(); middleware(req(), res, next); res.emit('finish'); await settle(); }
    expect(warn).toHaveBeenCalledTimes(2); expect(JSON.stringify(warn.mock.calls)).not.toContain('private'); expect(next).toHaveBeenCalledTimes(2);
    const failingReporter = createApiAccessLogMiddleware({ pool, maxPending: 0, reportFailure: () => { throw new Error('reporter down'); } });
    const res = response(); failingReporter(req(), res, next); expect(() => res.emit('finish')).not.toThrow();
  });
  it('bounds IP/request identifiers and groups token/unsupported requests without secrets', async () => {
    const middleware = createApiAccessLogMiddleware({ pool });
    for (const path of ['/api/v1/service-auth/token', '/api/v1/database/unsupported']) {
      const res = response(); middleware(req({ originalUrl: path, ip: 'a'.repeat(100), id: 'b'.repeat(200) }), res, jest.fn()); res.emit('finish');
    }
    await settle(); expect(query.mock.calls[0]![1][4]).toHaveLength(64); expect(query.mock.calls[0]![1][5]).toHaveLength(128);
    expect(query.mock.calls[1]![1][1]).toBe('GET /api/v1/database/unsupported');
  });
  it('records abandoned requests as 499 once and ignores a normal completed close', async () => {
    const middleware = createApiAccessLogMiddleware({ pool }); const aborted = response();
    middleware(req({ serviceClient: { clientId: 'bmg-database-ui' } }), aborted, jest.fn());
    aborted.emit('close'); aborted.emit('finish'); await settle();
    expect(query).toHaveBeenCalledTimes(1); expect(query.mock.calls[0]![1][3]).toBe(499);
    const completed = Object.assign(response(), { writableFinished: true });
    middleware(req(), completed, jest.fn()); completed.emit('close'); expect(query).toHaveBeenCalledTimes(1);
  });
});

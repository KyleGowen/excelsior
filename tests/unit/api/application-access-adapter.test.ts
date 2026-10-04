import express from 'express';
import request from 'supertest';
import { Writable } from 'stream';
import { ApplicationAccessAdapter } from '../../../src/api/access/applicationAccessAdapter';
import { SERVICE_HEADER } from '../../../src/api/access/serviceAccessService';
import { createApplicationAccessMiddleware } from '../../../src/api/http/middleware/applicationAccess';
import { createApplicationLogger, createRequestLoggerMiddleware } from '../../../src/middleware/logging';

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
describe('server-only application adapter', () => {
  const creds = () => ({ clientId: 'lrg-web', clientSecret: 'fictional-adapter-unit-credential'.repeat(2) });
  const token = (value = 'service-token') => json({ data: { accessToken: value, tokenType: 'Bearer', expiresInSeconds: 60 } });
  it('single-flights issuance while keeping concurrent player credentials isolated', async () => {
    const mock = jest.fn(async (url: string, _init?: RequestInit) => url.endsWith('/token') ? token() : json({ data: true }));
    const adapter = new ApplicationAccessAdapter('http://127.0.0.1:8087', creds, mock as typeof fetch);
    await Promise.all([adapter.request('/api/v1/decks', { player: { userAccessToken: 'user-one' } }), adapter.request('/api/v1/decks', { player: { sessionCookie: 'session=player-two' } })]);
    expect(mock.mock.calls.filter(([url]) => url.endsWith('/token'))).toHaveLength(1);
    const headers = mock.mock.calls.filter(([url]) => !url.endsWith('/token')).map(([, init]) => init?.headers);
    expect(headers).toEqual(expect.arrayContaining([expect.objectContaining({ Authorization: 'Bearer user-one' }), expect.objectContaining({ Cookie: 'session=player-two' })]));
    expect(headers.every(h => !JSON.stringify(h).includes(creds().clientSecret))).toBe(true);
    await expect(adapter.request('/api/v1/decks', { player: { userAccessToken: 'one', sessionCookie: 'two' } })).rejects.toThrow('Choose one');
  });
  it('renews expiring service tokens and rereads rotated credentials', async () => {
    let now = 100000; let version = 'first'; const provider = () => ({ ...creds(), clientSecret: version });
    const mock = jest.fn(async (url: string) => url.endsWith('/token') ? token(version) : json({ data: true }));
    const adapter = new ApplicationAccessAdapter('http://127.0.0.1:8087', provider, mock as typeof fetch, () => now);
    await adapter.request('/api/v1/catalog/characters'); version = 'second'; now += 56000; await adapter.request('/api/v1/catalog/characters');
    expect(mock.mock.calls.filter(([url]) => url.endsWith('/token'))).toHaveLength(2);
  });
  it('retries once for revoked service identity and never for invalid player identity', async () => {
    for (const code of ['SERVICE_TOKEN_INVALID', 'UNAUTHORIZED']) {
      const mock = jest.fn(async (url: string) => url.endsWith('/token') ? token() : json({ errors: [{ code }] }, 401));
      const adapter = new ApplicationAccessAdapter('http://127.0.0.1:8087', creds, mock as typeof fetch);
      expect((await adapter.request('/api/v1/decks')).status).toBe(401);
      expect(mock.mock.calls.filter(([url]) => url.endsWith('/token'))).toHaveLength(code === 'SERVICE_TOKEN_INVALID' ? 2 : 1);
      expect(mock.mock.calls.filter(([url]) => !url.endsWith('/token'))).toHaveLength(code === 'SERVICE_TOKEN_INVALID' ? 2 : 1);
    }
  });
  it.each(['/api/v1/admin/users', '//evil.test/api/v1/decks', '/api/v1/decks/../catalog/characters', '/api/v1/decks/%2e%2e/catalog', '/api/v1/decks#secret', '/api/v1/decks\\other'])('blocks unsafe or unlisted request %s before issuance', async path => {
    const mock = jest.fn(); const adapter = new ApplicationAccessAdapter('http://127.0.0.1:8087', creds, mock);
    await expect(adapter.request(path)).rejects.toThrow(); expect(mock).not.toHaveBeenCalled();
  });
  it.each(['http://external.test', 'https://user:secret@example.test', 'https://example.test/path', 'https://example.test?key=value'])('rejects unsafe origin %s', origin => {
    expect(() => new ApplicationAccessAdapter(origin, creds)).toThrow();
  });
  it('forwards multiple cookies and rate-limit evidence without forwarding service secrets to the browser', async () => {
    const mock = jest.fn(async (url: string) => url.endsWith('/token') ? token() : new Response(JSON.stringify({ data: 'player' }), { headers: [['Set-Cookie', 'session=one; HttpOnly'], ['Set-Cookie', 'refresh=two; HttpOnly'], ['Retry-After', '3'], [SERVICE_HEADER, 'never-forward']] }));
    const adapter = new ApplicationAccessAdapter('http://127.0.0.1:8087', creds, mock as typeof fetch);
    const app = express(); app.use(express.json()); app.use('/api/host', createApplicationAccessMiddleware(adapter, true));
    const result = await request(app).post('/api/host/api/v1/auth/login').send({ username: 'fictional' }).expect(200);
    expect(result.headers['set-cookie']).toHaveLength(2); expect(result.headers[SERVICE_HEADER]).toBeUndefined(); expect(result.headers['cache-control']).toBe('no-store'); expect(result.headers['retry-after']).toBe('3');
    await request(app).get('/api/host/api/v1/admin/users').expect(403);
    await request(app).get('/api/host/api/v1/decks').set('Authorization', 'bad').expect(401);
  });
  it('returns a redacted unavailable error on issuance failure', async () => {
    const adapter = new ApplicationAccessAdapter('http://127.0.0.1:8087', creds, jest.fn().mockRejectedValue(new Error(creds().clientSecret)));
    const app = express(); app.use('/api/host', createApplicationAccessMiddleware(adapter, true));
    const result = await request(app).get('/api/host/api/v1/decks').expect(503);
    expect(JSON.stringify(result.body)).not.toContain(creds().clientSecret);
  });
});

describe('request log credential redaction', () => {
  it('redacts cookies, player/service tokens, body credentials, and query values in actual structured output', async () => {
    let output = ''; const stream = new Writable({ write(chunk, _encoding, callback) { output += chunk.toString(); callback(); } });
    const logger = createApplicationLogger(stream); const app = express();
    app.use(express.json()); app.use((req, res, next) => { (req as unknown as { id: string }).id = 'redaction-proof'; res.setHeader('X-Request-Id', 'redaction-proof'); next(); });
    app.use(createRequestLoggerMiddleware(logger));
    app.post('/api/v1/guest/decks/:id', (_req, res) => res.setHeader('Set-Cookie', 'session=private-response').json({ ok: true }));
    await request(app).post('/api/v1/guest/decks/guest_private-session-token_123?client_secret=private-query').set('Authorization', 'Bearer private-player').set(SERVICE_HEADER, 'Bearer private-service').set('Cookie', 'session=private-cookie').send({ password: 'private-password', client_secret: 'private-body', refreshToken: 'private-refresh' }).expect(200);
    expect(output).toContain('redaction-proof');
    for (const value of ['private-session-token', 'private-response', 'private-query', 'private-player', 'private-service', 'private-cookie', 'private-password', 'private-body', 'private-refresh']) expect(output).not.toContain(value);
  });
});

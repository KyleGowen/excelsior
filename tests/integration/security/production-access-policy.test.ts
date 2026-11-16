/** Exercise the production app and real authentication, never x-test-user-id. */
import request from 'supertest';
import { DataSourceConfig } from '../../../src/config/DataSourceConfig';
import { app } from '../../../src/index';
import { enumerateExpressRoutes } from '../../../src/metrics/endpointHitMetrics';
import { integrationTestUtils } from '../../setup-integration';

const routes = enumerateExpressRoutes(app).filter(key => key.includes(' /api/v1/') && !key.startsWith('HEAD '));
// These reads deliberately support public card browsing and shared deck links.
const publicReads = new Set([
  '/config/app', '/decks/featured', '/decks/:id', '/decks/:id/full', '/guest/decks/:id/share', '/community/decks', '/community/preconstructed-decks',
  '/users/:userId/public-decks', '/users/:userId/profile', '/recent-updates', '/dbv/sets', '/dbv/deck-backgrounds', '/supporter/status'
]);
const publicMutations = new Set(['/auth/login', '/auth/refresh', '/auth/logout', '/service-auth/token', '/decks/import/prepare', '/decks/evaluate', '/decks/candidates/evaluate', '/decks/draw', '/decks/export', '/decks/summaries', '/collections/evaluate', '/supporter/webhook']);
const protectedRoutes = routes.filter(key => {
  const [method, path] = key.split(' ');
  const relative = path.replace('/api/v1', '');
  return !(method === 'GET' && (relative.startsWith('/catalog/') || publicReads.has(relative)))
    && !(method === 'POST' && publicMutations.has(relative));
});
const adminRoutes = routes.filter(key => key.includes(' /api/v1/admin/'));
const id = '00000000-0000-0000-0000-000000000099';
function call(key: string) {
  const [method, route] = key.split(' ');
  const url = route.replace(/:[A-Za-z]+/g, id);
  return (request(app) as any)[method.toLowerCase()](url);
}
async function login(role: 'USER' | 'ADMIN' | 'GUEST') {
  const user = await integrationTestUtils.createTestUser({
    name: `policy-${role.toLowerCase()}`, email: `policy-${role.toLowerCase()}@example.com`,
    role, password: 'policy-test-password'
  });
  const response = await request(app).post('/api/auth/login')
    .send({ username: user.username, password: 'policy-test-password' }).expect(200);
  return { user, cookie: response.headers['set-cookie'][0].split(';')[0] };
}

describe('Production endpoint access policy', () => {
  let userCookie: string;
  let guestCookie: string;
  beforeAll(async () => {
    userCookie = (await login('USER')).cookie;
    guestCookie = (await login('GUEST')).cookie;
  });

  it('discovers the protected and administrative production routes', () => {
    expect(protectedRoutes.length).toBeGreaterThan(30);
    expect(adminRoutes.length).toBeGreaterThanOrEqual(7);
  });

  it.each(protectedRoutes)('%s rejects anonymous requests before processing their body', async key => {
    const response = await call(key).send({});
    expect(response.status).toBe(401);
  });

  it.each(adminRoutes)('%s rejects ordinary users and guests', async key => {
    for (const cookie of [userCookie, guestCookie]) {
      const response = await call(key).set('Cookie', cookie).send({});
      expect(response.status).toBe(403);
    }
  });

  it('keeps TopDeck profile reads public while rejecting anonymous and guest edits', async () => {
    const { user } = await login('USER');
    const profile = await request(app).get(`/api/v1/users/${user.id}/profile`).expect(200);
    expect(profile.headers['cache-control']).toBe('no-store');
    expect(profile.body.data).toEqual({ id: user.id, displayName: user.username, topdeckHandle: null, topdeckProfileUrl: null });
    await request(app).post('/api/v1/users/topdeck').send({ topdeckHandle: 'Example' }).expect(401);
    await request(app).post('/api/v1/users/topdeck').set('Cookie', guestCookie).send({ topdeckHandle: 'Example' }).expect(403);
  });

  it('publishes only explicitly shared Guest decks without giving viewers edit access', async () => {
    const created = await request(app).post('/api/v1/guest/decks').set('Cookie', guestCookie)
      .send({ name: 'Public Guest link policy', description: '' }).expect(201);
    const path = `/api/v1/guest/decks/${created.body.data.id}`;
    try {
      await request(app).get(`${path}/share`).expect('Cache-Control', 'no-store').expect(404);
      await request(app).post(`${path}/share`).expect(401);
      await request(app).post(`${path}/share`).set('Cookie', guestCookie).expect(200);
      const shared = await request(app).get(`${path}/share`).expect('Cache-Control', 'no-store').expect(200);
      expect(shared.body.data.metadata).toMatchObject({ id: created.body.data.id, isOwner: false });
      expect(JSON.stringify(shared.body)).not.toContain(guestCookie.slice('sessionId='.length));
      await request(app).put(path).send({ name: 'Anonymous edit' }).expect(401);
      const owner = await request(app).get(path).set('Cookie', guestCookie).expect(200);
      expect(owner.body.data.metadata.isOwner).toBe(true);
    } finally {
      await request(app).delete(path).set('Cookie', guestCookie).expect(200);
    }
    await request(app).get(`${path}/share`).expect(404);
  });

  it('keeps candidate evaluation stateless and public while rejecting malformed drafts', async () => {
    const response = await request(app).post('/api/v1/decks/candidates/evaluate')
      .send({ schemaVersion: 1, revision: 1, cards: [], candidates: [] }).expect(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body.data.candidates).toEqual([]);
    await request(app).post('/api/v1/decks/candidates/evaluate').send({}).expect(400);
  });

  it('prepares anonymous imports without creating a deck or session', async () => {
    const pool = DataSourceConfig.getInstance().getPool();
    const before = (await pool.query('SELECT count(*) FROM decks')).rows;
    const response = await request(app).post('/api/v1/decks/import/prepare').send({
      name: 'Synthetic preparation only',
      exportData: { limited: true, reserve_character: 'Lancelot', cards: { characters: ['Lancelot'], power_cards: ['5 - Combat'] } }
    }).expect(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.body.data.cards).toContainEqual(expect.objectContaining({ type: 'character', quantity: 1 }));
    expect(response.body.data.cards).toContainEqual(expect.objectContaining({ type: 'power', quantity: 1 }));
    await request(app).post('/api/v1/decks/import/prepare').send({ actor: 'untrusted' }).expect(400);
    expect((await pool.query('SELECT count(*) FROM decks')).rows).toEqual(before);
  });

  it('keeps unconfigured service issuance disabled even for a player session', async () => {
    const body = { grant_type: 'client_credentials', client_id: 'excelsior-web', client_secret: 'fictional-policy-test-credential'.repeat(2) };
    const response = await request(app).post('/api/v1/service-auth/token').set('Cookie', userCookie).send(body).expect(503);
    expect(response.body.errors[0].code).toBe('SERVICE_ACCESS_UNAVAILABLE');
    expect(response.headers['cache-control']).toBe('no-store');
    await request(app).get('/api/v1/decks').set('x-excelsior-service-authorization', 'Bearer invalid').set('Cookie', userCookie).expect(503);
  });

  it('does not accept the test impersonation header in the production app', async () => {
    const { user } = await login('ADMIN');
    await request(app).get('/api/v1/admin/users').set('x-test-user-id', user.id).expect(401);
  });

  it('rejects a tampered Bearer token for a protected resource', async () => {
    await request(app).get('/api/v1/decks').set('Authorization', 'Bearer not-a-valid-jwt').expect(401);
  });

  it('invalidates a real session on logout', async () => {
    const { cookie } = await login('USER');
    await request(app).get('/api/v1/decks').set('Cookie', cookie).expect(200);
    await request(app).post('/api/auth/logout').set('Cookie', cookie).expect(200);
    await request(app).get('/api/v1/decks').set('Cookie', cookie).expect(401);
  });

  it('rotates refresh tokens, prevents replay, and revokes the replacement on logout', async () => {
    const { user } = await login('USER');
    const original = await request(app).post('/api/v1/auth/login')
      .send({ username: user.username, password: 'policy-test-password' }).expect(200);
    const token = original.body.data.refreshToken;
    expect(typeof token).toBe('string');
    const rotated = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: token }).expect(200);
    expect(rotated.body.data.refreshToken).not.toBe(token);
    await request(app).post('/api/v1/auth/refresh').send({ refreshToken: token }).expect(401);
    await request(app).post('/api/v1/auth/logout').send({ refreshToken: rotated.body.data.refreshToken }).expect(200);
    await request(app).post('/api/v1/auth/refresh').send({ refreshToken: rotated.body.data.refreshToken }).expect(401);
  });
});

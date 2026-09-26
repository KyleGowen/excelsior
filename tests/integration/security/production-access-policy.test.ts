/** Exercise the production app and real authentication, never x-test-user-id. */
import request from 'supertest';
import { app } from '../../../src/index';
import { enumerateExpressRoutes } from '../../../src/metrics/endpointHitMetrics';
import { integrationTestUtils } from '../../setup-integration';

const routes = enumerateExpressRoutes(app).filter(key => key.includes(' /api/v1/') && !key.startsWith('HEAD '));
// These reads deliberately support public card browsing and shared deck links.
const publicReads = new Set([
  '/config/app', '/decks/:id', '/decks/:id/full', '/community/decks', '/community/preconstructed-decks',
  '/users/:userId/public-decks', '/recent-updates', '/dbv/sets', '/dbv/deck-backgrounds', '/supporter/status'
]);
const publicMutations = new Set(['/auth/login', '/auth/refresh', '/auth/logout', '/supporter/webhook']);
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

import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { registerUsersV1HttpRoutes } from '../../../../src/api/http/users.http';
import { registerCommunityV1HttpRoutes } from '../../../../src/api/http/community.http';
import type { UserAccountService } from '../../../../src/api/services/userAccountService';
import type { CommunityService } from '../../../../src/api/services/communityService';

const id = 'd9cf01c8-f581-463a-a1ab-caed5db1b88d';
function buildApp(role: 'USER' | 'ADMIN' | 'GUEST' | null = 'USER') {
  const app = express(); app.use(express.json()); const router = express.Router();
  const auth: RequestHandler = (req, _res, next) => {
    if (role) req.user = { id, role, name: 'Example', email: 'private@example.invalid' };
    next();
  };
  const setTopDeckHandle = jest.fn().mockResolvedValue({ ok: true, status: 200,
    data: { topdeckHandle: 'Example', topdeckProfileUrl: 'https://topdeck.gg/profile/@Example' } });
  const getPublicUserProfile = jest.fn().mockResolvedValue({ id, displayName: 'Example', topdeckHandle: null, topdeckProfileUrl: null });
  registerUsersV1HttpRoutes(router, { authenticateUser: auth, userAccountService: { setTopDeckHandle } as unknown as UserAccountService });
  registerCommunityV1HttpRoutes(router, { authenticateUser: auth, optionalAuth: auth,
    communityService: { getPublicUserProfile } as unknown as CommunityService });
  app.use(router); return { app, setTopDeckHandle, getPublicUserProfile };
}

describe('TopDeck account HTTP', () => {
  it.each(['USER', 'ADMIN'] as const)('saves as the authenticated %s', async role => {
    const { app, setTopDeckHandle } = buildApp(role);
    const res = await request(app).post('/users/topdeck').send({ topdeckHandle: '@Example' }).expect(200);
    expect(setTopDeckHandle).toHaveBeenCalledWith(id, role, '@Example');
    expect(res.body.data.topdeckHandle).toBe('Example');
    expect(res.headers['cache-control']).toBe('no-store');
  });
  it.each([[null, 401], ['GUEST', 403]] as const)('rejects %p', async (role, code) => {
    const { app, setTopDeckHandle } = buildApp(role);
    await request(app).post('/users/topdeck').send({ topdeckHandle: 'Example' }).expect(code);
    expect(setTopDeckHandle).not.toHaveBeenCalled();
  });
  it.each([{}, { topdeckHandle: 123 }, { topdeckHandle: [] }, { topdeckHandle: 'Example', userId: 'other' }])('rejects invalid request %p', async body => {
    const { app, setTopDeckHandle } = buildApp();
    const res = await request(app).post('/users/topdeck').send(body).expect(400);
    expect(res.body.errors[0].code).toBe('VALIDATION_ERROR');
    expect(setTopDeckHandle).not.toHaveBeenCalled();
  });
  it('accepts explicit removal', async () => {
    const { app, setTopDeckHandle } = buildApp();
    await request(app).post('/users/topdeck').send({ topdeckHandle: null }).expect(200);
    expect(setTopDeckHandle).toHaveBeenCalledWith(id, 'USER', null);
  });
  it('maps service errors', async () => {
    const { app, setTopDeckHandle } = buildApp();
    setTopDeckHandle.mockResolvedValue({ ok: false, status: 400, code: 'TOPDECK_HANDLE_INVALID', message: 'Invalid handle' });
    const res = await request(app).post('/users/topdeck').send({ topdeckHandle: '/' }).expect(400);
    expect(res.body.errors[0].code).toBe('TOPDECK_HANDLE_INVALID');
  });
  it('maps unexpected failures', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { app, setTopDeckHandle } = buildApp(); setTopDeckHandle.mockRejectedValue(new Error('db'));
      const res = await request(app).post('/users/topdeck').send({ topdeckHandle: 'Example' }).expect(500);
      expect(res.body.errors[0].code).toBe('SET_TOPDECK_ERROR');
    } finally { spy.mockRestore(); }
  });
});

describe('Public profile HTTP', () => {
  it('is guest-viewable and never cached', async () => {
    const { app, getPublicUserProfile } = buildApp(null);
    const res = await request(app).get(`/users/${id}/profile`).expect(200);
    expect(getPublicUserProfile).toHaveBeenCalledWith(id);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(Object.keys(res.body.data).sort()).toEqual(['displayName', 'id', 'topdeckHandle', 'topdeckProfileUrl']);
  });
  it('rejects invalid IDs before lookup', async () => {
    const { app, getPublicUserProfile } = buildApp();
    await request(app).get('/users/not-a-uuid/profile').expect(400);
    expect(getPublicUserProfile).not.toHaveBeenCalled();
  });
  it('returns 404 for unknown users', async () => {
    const { app, getPublicUserProfile } = buildApp(); getPublicUserProfile.mockResolvedValue(null);
    await request(app).get(`/users/${id}/profile`).expect(404);
  });
  it('maps unexpected failures', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { app, getPublicUserProfile } = buildApp(); getPublicUserProfile.mockRejectedValue(new Error('db'));
      const res = await request(app).get(`/users/${id}/profile`).expect(500);
      expect(res.body.errors[0].code).toBe('PUBLIC_PROFILE_ERROR');
    } finally { spy.mockRestore(); }
  });
});

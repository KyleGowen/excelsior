import express from 'express';
import request from 'supertest';
import type { AuthenticationService } from '../../../../src/services/AuthenticationService';
import { V1JwtTokenService } from '../../../../src/api/services/v1JwtTokenService';
import { registerAuthV1HttpRoutes } from '../../../../src/api/http/auth.http';
import { resetV1LoginRateLimitForTests } from '../../../../src/api/http/middleware/v1LoginRateLimit';
import type { User } from '../../../../src/types';

function buildAuthApp(deps: {
  authenticationService: Pick<AuthenticationService, 'authenticateUser'>;
  userRepository: {
    getUserById: jest.Mock;
    updateLastLoginAt: jest.Mock;
  };
  jwtTokenService: V1JwtTokenService;
}): express.Application {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  registerAuthV1HttpRoutes(router, {
    authenticationService: deps.authenticationService as AuthenticationService,
    userRepository: deps.userRepository,
    jwtTokenService: deps.jwtTokenService
  });
  app.use(router);
  return app;
}

describe('auth.http', () => {
  const user: User = {
    id: 'u1',
    name: 'alice',
    email: 'a@example.com',
    role: 'USER',
    lastLoginAt: new Date('2026-01-01T00:00:00.000Z')
  };

  beforeEach(() => {
    resetV1LoginRateLimitForTests();
  });

  it('POST /auth/login 400 when body invalid', async () => {
    const jwtTokenService = new V1JwtTokenService({ secret: 'unit-test-secret-key-32chars!!', expiresIn: '1h' });
    const app = buildAuthApp({
      authenticationService: { authenticateUser: jest.fn() },
      userRepository: { getUserById: jest.fn(), updateLastLoginAt: jest.fn() },
      jwtTokenService
    });
    const res = await request(app).post('/auth/login').send({}).expect(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
    expect(res.body.data).toBeNull();
  });

  it('POST /auth/login 401 when credentials invalid', async () => {
    const jwtTokenService = new V1JwtTokenService({ secret: 'unit-test-secret-key-32chars!!', expiresIn: '1h' });
    const authenticateUser = jest.fn().mockResolvedValue(null);
    const app = buildAuthApp({
      authenticationService: { authenticateUser },
      userRepository: { getUserById: jest.fn(), updateLastLoginAt: jest.fn() },
      jwtTokenService
    });
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'x', password: 'y' })
      .expect(401);
    expect(res.body.errors[0].code).toBe('INVALID_CREDENTIALS');
  });

  it('POST /auth/login 200 returns Bearer token', async () => {
    const jwtTokenService = new V1JwtTokenService({ secret: 'unit-test-secret-key-32chars!!', expiresIn: '1h' });
    const authenticateUser = jest.fn().mockResolvedValue(user);
    const updateLastLoginAt = jest.fn().mockResolvedValue(undefined);
    const app = buildAuthApp({
      authenticationService: { authenticateUser },
      userRepository: { getUserById: jest.fn(), updateLastLoginAt },
      jwtTokenService
    });
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'alice', password: 'secret' })
      .expect(200);
    expect(res.body.errors).toEqual([]);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.tokenType).toBe('Bearer');
    expect(res.body.data.user.id).toBe(user.id);
    expect(updateLastLoginAt).toHaveBeenCalledWith(user.id);
  });

  it('GET /auth/me 401 without Bearer token', async () => {
    const jwtTokenService = new V1JwtTokenService({ secret: 'unit-test-secret-key-32chars!!', expiresIn: '1h' });
    const app = buildAuthApp({
      authenticationService: { authenticateUser: jest.fn() },
      userRepository: { getUserById: jest.fn(), updateLastLoginAt: jest.fn() },
      jwtTokenService
    });
    const res = await request(app).get('/auth/me').expect(401);
    expect(res.body.errors[0].code).toBe('UNAUTHORIZED');
  });

  it('GET /auth/me 200 with valid token', async () => {
    const jwtTokenService = new V1JwtTokenService({ secret: 'unit-test-secret-key-32chars!!', expiresIn: '1h' });
    const { token } = jwtTokenService.signAccessToken(user);
    const getUserById = jest.fn().mockResolvedValue(user);
    const app = buildAuthApp({
      authenticationService: { authenticateUser: jest.fn() },
      userRepository: { getUserById, updateLastLoginAt: jest.fn() },
      jwtTokenService
    });
    const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body.data.username).toBe('alice');
    expect(res.body.data.email).toBe('a@example.com');
  });

  it('POST /auth/logout returns success envelope', async () => {
    const jwtTokenService = new V1JwtTokenService({ secret: 'unit-test-secret-key-32chars!!', expiresIn: '1h' });
    const app = buildAuthApp({
      authenticationService: { authenticateUser: jest.fn() },
      userRepository: { getUserById: jest.fn(), updateLastLoginAt: jest.fn() },
      jwtTokenService
    });
    const res = await request(app).post('/auth/logout').expect(200);
    expect(res.body.data.loggedOut).toBe(true);
  });

  it('POST /auth/login returns 429 after burst', async () => {
    const jwtTokenService = new V1JwtTokenService({ secret: 'unit-test-secret-key-32chars!!', expiresIn: '1h' });
    const authenticateUser = jest.fn().mockResolvedValue(null);
    const app = buildAuthApp({
      authenticationService: { authenticateUser },
      userRepository: { getUserById: jest.fn(), updateLastLoginAt: jest.fn() },
      jwtTokenService
    });
    for (let i = 0; i < 15; i += 1) {
      await request(app).post('/auth/login').send({ username: 'a', password: 'b' });
    }
    const res = await request(app).post('/auth/login').send({ username: 'a', password: 'b' }).expect(429);
    expect(res.body.errors[0].code).toBe('RATE_LIMITED');
  });
});

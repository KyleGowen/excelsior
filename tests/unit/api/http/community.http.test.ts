import express, { type Request, type RequestHandler } from 'express';
import request from 'supertest';
import {
  registerCommunityV1HttpRoutes,
  type CommunityV1HttpDeps
} from '../../../../src/api/http/community.http';
import type { CommunityService } from '../../../../src/api/services/communityService';

const passAuth: RequestHandler = (req: Request, _res, next) => {
  (req as Request & { user?: { id: string; name: string; email: string; role: string } }).user = {
    id: 'user-1',
    name: 't',
    email: 't@example.com',
    role: 'USER'
  };
  next();
};

const optionalNoUser: RequestHandler = (_req, _res, next) => {
  next();
};

function buildApp(deps: CommunityV1HttpDeps): express.Application {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  registerCommunityV1HttpRoutes(router, deps);
  app.use(router);
  return app;
}

function stubCommunityService(over: Partial<CommunityService> = {}): CommunityService {
  return {
    getFavorites: jest.fn().mockResolvedValue([]),
    getCommunityDecks: jest.fn().mockResolvedValue([]),
    getPreconstructedDeckGroups: jest.fn().mockResolvedValue([]),
    getPublicDecksForUser: jest.fn().mockResolvedValue([]),
    addFavorite: jest.fn(),
    removeFavorite: jest.fn(),
    ...over
  } as unknown as CommunityService;
}

describe('community.http cache headers', () => {
  it('GET /decks/favorites sets private Cache-Control and Vary: Cookie', async () => {
    const communityService = stubCommunityService();
    const deps: CommunityV1HttpDeps = {
      communityService,
      authenticateUser: passAuth,
      optionalAuth: optionalNoUser
    };
    const res = await request(buildApp(deps)).get('/decks/favorites').expect(200);
    expect(res.headers['cache-control']).toBe('private, max-age=0, must-revalidate');
    expect(res.headers.vary).toBe('Cookie');
    expect(communityService.getFavorites).toHaveBeenCalledWith('user-1');
  });

  it('GET /community/decks sets private Cache-Control and Vary: Cookie', async () => {
    const communityService = stubCommunityService();
    const deps: CommunityV1HttpDeps = {
      communityService,
      authenticateUser: passAuth,
      optionalAuth: passAuth
    };
    const res = await request(buildApp(deps)).get('/community/decks').expect(200);
    expect(res.headers['cache-control']).toBe('private, max-age=0, must-revalidate');
    expect(res.headers.vary).toBe('Cookie');
    expect(communityService.getCommunityDecks).toHaveBeenCalledWith('user-1', undefined);
  });

  it('GET /community/preconstructed-decks returns grouped decks with private cache headers', async () => {
    const groups = [{
      setCode: 'SKY',
      setName: 'Skybound',
      decks: [],
      featuredUpgradeRecommendations: [],
    }];
    const communityService = stubCommunityService({
      getPreconstructedDeckGroups: jest.fn().mockResolvedValue(groups),
    });
    const deps: CommunityV1HttpDeps = {
      communityService,
      authenticateUser: passAuth,
      optionalAuth: passAuth,
    };

    const res = await request(buildApp(deps))
      .get('/community/preconstructed-decks')
      .expect(200);

    expect(res.body.data).toEqual(groups);
    expect(res.headers['cache-control']).toBe('private, max-age=0, must-revalidate');
    expect(res.headers.vary).toBe('Cookie');
    expect(communityService.getPreconstructedDeckGroups).toHaveBeenCalledWith('user-1');
  });

  it('GET /community/preconstructed-decks maps service failures to the v1 error', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const communityService = stubCommunityService({
      getPreconstructedDeckGroups: jest.fn().mockRejectedValue(new Error('database unavailable')),
    });
    const deps: CommunityV1HttpDeps = {
      communityService,
      authenticateUser: passAuth,
      optionalAuth: optionalNoUser,
    };

    const res = await request(buildApp(deps))
      .get('/community/preconstructed-decks')
      .expect(500);

    expect(res.body.errors).toEqual([
      { code: 'PRECONSTRUCTED_DECKS_ERROR', message: 'Failed to load preconstructed decks' },
    ]);
    errorSpy.mockRestore();
  });

  it('GET /users/:userId/public-decks sets private Cache-Control and Vary: Cookie', async () => {
    const communityService = stubCommunityService();
    const deps: CommunityV1HttpDeps = {
      communityService,
      authenticateUser: passAuth,
      optionalAuth: passAuth
    };
    const res = await request(buildApp(deps))
      .get('/users/target-user/public-decks')
      .expect(200);
    expect(res.headers['cache-control']).toBe('private, max-age=0, must-revalidate');
    expect(res.headers.vary).toBe('Cookie');
    expect(communityService.getPublicDecksForUser).toHaveBeenCalledWith('target-user', 'user-1');
  });
});

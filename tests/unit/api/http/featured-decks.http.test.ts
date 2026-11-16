import express from 'express';
import request from 'supertest';
import { registerFeaturedDecksV1HttpRoutes } from '../../../../src/api/http/featured-decks.http';

describe('public Featured decks route', () => {
  const userId = 'a2d00000-0000-4000-8000-000000000001';
  const original = process.env.FEATURED_DECKS_USER_ID;
  const listFeatured = jest.fn();
  const app = express();
  const router = express.Router();
  registerFeaturedDecksV1HttpRoutes(router, { listFeatured });
  router.get('/decks/:id', (_req, res) => { res.sendStatus(418); });
  app.use('/api/v1', router);

  beforeEach(() => {
    delete process.env.FEATURED_DECKS_USER_ID;
    listFeatured.mockReset().mockResolvedValue([]);
  });
  afterAll(() => {
    if (original === undefined) delete process.env.FEATURED_DECKS_USER_ID;
    else process.env.FEATURED_DECKS_USER_ID = original;
  });

  it('returns an uncached empty list for missing or invalid configuration', async () => {
    await request(app).get('/api/v1/decks/featured').expect(200)
      .expect('Cache-Control', 'no-store').expect(({ body }) => expect(body.data).toEqual([]));
    process.env.FEATURED_DECKS_USER_ID = 'bad id';
    await request(app).get('/api/v1/decks/featured').expect(200)
      .expect(({ body }) => expect(body.data).toEqual([]));
    expect(listFeatured).not.toHaveBeenCalled();
  });

  it('uses the normalized configured account regardless of query selectors', async () => {
    process.env.FEATURED_DECKS_USER_ID = ' ' + userId.toUpperCase() + ' ';
    listFeatured.mockResolvedValue([{ metadata: { id: userId } }]);
    await request(app).get('/api/v1/decks/featured?userId=different').expect(200)
      .expect(({ body }) => expect(body.data).toEqual([{ metadata: { id: userId } }]));
    expect(listFeatured).toHaveBeenCalledWith(userId);
  });

  it('returns a sanitized retryable error without leaking failures', async () => {
    process.env.FEATURED_DECKS_USER_ID = userId;
    listFeatured.mockRejectedValue(new Error('private diagnostic'));
    const response = await request(app).get('/api/v1/decks/featured').expect(503)
      .expect('Cache-Control', 'no-store');
    expect(response.body.errors[0].code).toBe('FEATURED_DECKS_UNAVAILABLE');
    expect(response.text).not.toContain('private diagnostic');
  });
});

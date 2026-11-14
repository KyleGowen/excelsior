import express, { type Request, type RequestHandler } from 'express';
import request from 'supertest';
import {
  registerGuestDecksV1HttpRoutes,
  type GuestDecksV1HttpDeps
} from '../../../../src/api/http/guest-decks.http';
import type { GuestDeckService } from '../../../../src/api/services/guestDeckService';

const guestAuth: RequestHandler = (req: Request, _res, next) => {
  (req as Request & { user?: unknown }).user = {
    id: 'guest-user-1',
    name: 'g',
    email: 'g@example.com',
    role: 'GUEST'
  };
  next();
};

const userAuth: RequestHandler = (req: Request, _res, next) => {
  (req as Request & { user?: unknown }).user = {
    id: 'user-1',
    name: 'u',
    email: 'u@example.com',
    role: 'USER'
  };
  next();
};

function buildApp(deps: GuestDecksV1HttpDeps): express.Application {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as express.Request & { cookies?: Record<string, string> }).cookies = {};
    const h = req.headers.cookie;
    if (h) {
      h.split(';').forEach((c: string) => {
        const [n, v] = c.trim().split('=');
        if (n && v !== undefined) {
          (req as express.Request & { cookies: Record<string, string> }).cookies![n] = v;
        }
      });
    }
    next();
  });
  const router = express.Router();
  registerGuestDecksV1HttpRoutes(router, deps);
  app.use(router);
  return app;
}

function stubGuestDeckService(over: Partial<GuestDeckService> = {}): GuestDeckService {
  return {
    createDeck: jest.fn().mockReturnValue({
      ok: true,
      status: 201,
      data: {
        id: 'guest_x_1',
        name: 'New',
        description: '',
        created_at: 't1',
        updated_at: 't2'
      }
    }),
    listDecks: jest.fn().mockResolvedValue({ ok: true, status: 200, data: [] }),
    getDeck: jest.fn().mockReturnValue({
      ok: true,
      status: 200,
      data: { metadata: { id: 'guest_x_1', isOwner: true }, cards: [] }
    }),
    shareDeck: jest.fn().mockReturnValue({ ok: true, status: 200, data: { id: 'guest_deck' } }),
    getSharedDeck: jest.fn().mockResolvedValue({
      ok: true, status: 200, data: { metadata: { id: 'guest_deck', isOwner: false }, cards: [] }
    }),
    updateDeckMetadata: jest.fn().mockReturnValue({
      ok: true,
      status: 200,
      data: { metadata: { id: 'guest_x_1' }, cards: [] }
    }),
    replaceCards: jest.fn().mockReturnValue({
      ok: true,
      status: 200,
      data: { metadata: {}, cards: [] }
    }),
    addCard: jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      data: { metadata: {}, cards: [] }
    }),
    deleteDeck: jest.fn().mockReturnValue({ ok: true, status: 200, data: {} }),
    ...over
  } as unknown as GuestDeckService;
}

describe('guest-decks.http', () => {
  it('POST /guest/decks returns 403 for non-GUEST', async () => {
    const svc = stubGuestDeckService();
    const app = buildApp({ guestDeckService: svc, authenticateUser: userAuth });
    const res = await request(app)
      .post('/guest/decks')
      .set('Cookie', 'sessionId=s1')
      .send({ name: 'x' })
      .expect(403);
    expect(res.body.errors[0].code).toBe('GUEST_ONLY');
    expect(svc.createDeck).not.toHaveBeenCalled();
  });

  it('POST /guest/decks returns 401 without session cookie', async () => {
    const svc = stubGuestDeckService();
    const app = buildApp({ guestDeckService: svc, authenticateUser: guestAuth });
    const res = await request(app).post('/guest/decks').send({ name: 'x' }).expect(401);
    expect(res.body.errors[0].code).toBe('SESSION_REQUIRED');
  });

  it('POST /guest/decks creates deck for GUEST with session', async () => {
    const svc = stubGuestDeckService();
    const app = buildApp({ guestDeckService: svc, authenticateUser: guestAuth });
    const res = await request(app)
      .post('/guest/decks')
      .set('Cookie', 'sessionId=sess-a')
      .send({ name: 'A', description: '' })
      .expect(201);
    expect(res.body.errors).toEqual([]);
    expect(res.body.data.id).toBe('guest_x_1');
    expect(svc.createDeck).toHaveBeenCalledWith('sess-a', 'guest-user-1', { name: 'A', description: '' });
  });

  it('GET /guest/decks lists decks', async () => {
    const svc = stubGuestDeckService({
      listDecks: jest.fn().mockResolvedValue({ ok: true, status: 200, data: [{ x: 1 }] })
    });
    const app = buildApp({ guestDeckService: svc, authenticateUser: guestAuth });
    const res = await request(app).get('/guest/decks').set('Cookie', 'sessionId=s1').expect(200);
    expect(res.body.data).toEqual([{ x: 1 }]);
    expect(svc.listDecks).toHaveBeenCalledWith('s1', 'guest-user-1');
  });

  it('GET /guest/decks/:id returns deck', async () => {
    const svc = stubGuestDeckService();
    const app = buildApp({ guestDeckService: svc, authenticateUser: guestAuth });
    const res = await request(app).get('/guest/decks/guest_x_1').set('Cookie', 'sessionId=s1').expect(200);
    expect(res.body.data.metadata.id).toBe('guest_x_1');
    expect(svc.getDeck).toHaveBeenCalledWith('s1', 'guest_x_1');
  });

  it('PUT /guest/decks/:id updates metadata', async () => {
    const svc = stubGuestDeckService();
    const app = buildApp({ guestDeckService: svc, authenticateUser: guestAuth });
    await request(app).put('/guest/decks/g1').set('Cookie', 'sessionId=s1').send({ name: 'N' }).expect(200);
    expect(svc.updateDeckMetadata).toHaveBeenCalledWith('s1', 'g1', { name: 'N' });
  });

  it('enables sharing for a verified Guest session', async () => {
    const svc = stubGuestDeckService();
    const app = buildApp({ guestDeckService: svc, authenticateUser: guestAuth });
    await request(app).post('/guest/decks/guest_deck/share').set('Cookie', 'sessionId=s1')
      .expect('Cache-Control', 'no-store').expect(200);
    expect(svc.shareDeck).toHaveBeenCalledWith('s1', 'guest_deck');
  });

  it('rejects non-Guest callers trying to enable sharing', async () => {
    const svc = stubGuestDeckService();
    const app = buildApp({ guestDeckService: svc, authenticateUser: userAuth });
    await request(app).post('/guest/decks/guest_deck/share').set('Cookie', 'sessionId=s1').expect(403);
    expect(svc.shareDeck).not.toHaveBeenCalled();
  });

  it('provides an anonymous read-only view of a shared deck', async () => {
    const svc = stubGuestDeckService();
    const app = buildApp({ guestDeckService: svc, authenticateUser: (_req, res) => { res.sendStatus(401); } });
    const res = await request(app).get('/guest/decks/guest_deck/share').expect('Cache-Control', 'no-store').expect(200);
    expect(res.body.data.metadata.isOwner).toBe(false);
    expect(svc.getSharedDeck).toHaveBeenCalledWith('guest_deck');
  });

  it('PUT /guest/decks/:id/cards replaces cards', async () => {
    const svc = stubGuestDeckService();
    const app = buildApp({ guestDeckService: svc, authenticateUser: guestAuth });
    const cards = [{ cardType: 'character', cardId: 'c1', quantity: 1 }];
    await request(app).put('/guest/decks/g1/cards').set('Cookie', 'sessionId=s1').send({ cards }).expect(200);
    expect(svc.replaceCards).toHaveBeenCalledWith('s1', 'g1', cards);
  });

  it('PUT /guest/decks/:id/cards validates body', async () => {
    const svc = stubGuestDeckService();
    const app = buildApp({ guestDeckService: svc, authenticateUser: guestAuth });
    const res = await request(app).put('/guest/decks/g1/cards').set('Cookie', 'sessionId=s1').send({}).expect(400);
    expect(res.body.errors[0].message).toContain('cards');
    expect(svc.replaceCards).not.toHaveBeenCalled();
  });

  it('POST /guest/decks/:id/cards adds card', async () => {
    const svc = stubGuestDeckService();
    const app = buildApp({ guestDeckService: svc, authenticateUser: guestAuth });
    await request(app)
      .post('/guest/decks/g1/cards')
      .set('Cookie', 'sessionId=s1')
      .send({ cardType: 'power', cardId: 'p1', quantity: 2 })
      .expect(200);
    expect(svc.addCard).toHaveBeenCalledWith('s1', 'g1', {
      cardType: 'power',
      cardId: 'p1',
      quantity: 2
    });
  });

  it('DELETE /guest/decks/:id', async () => {
    const svc = stubGuestDeckService();
    const app = buildApp({ guestDeckService: svc, authenticateUser: guestAuth });
    await request(app).delete('/guest/decks/g1').set('Cookie', 'sessionId=s1').expect(200);
    expect(svc.deleteDeck).toHaveBeenCalledWith('s1', 'g1');
  });

  it('maps service failure to v1 errors', async () => {
    const svc = stubGuestDeckService({
      getDeck: jest.fn().mockReturnValue({
        ok: false,
        status: 404,
        code: 'DECK_NOT_FOUND',
        message: 'Deck not found'
      })
    });
    const app = buildApp({ guestDeckService: svc, authenticateUser: guestAuth });
    const res = await request(app).get('/guest/decks/missing').set('Cookie', 'sessionId=s1').expect(404);
    expect(res.body.data).toBeNull();
    expect(res.body.errors[0].code).toBe('DECK_NOT_FOUND');
  });
});

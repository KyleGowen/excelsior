import express, { type Request, type RequestHandler } from 'express';
import request from 'supertest';
import {
  registerSavedDatabaseViewsV1HttpRoutes,
  type SavedDatabaseViewsV1HttpDeps,
} from '../../../../src/api/http/saved-database-views.http';
import type { SavedDatabaseViewService } from '../../../../src/api/services/savedDatabaseViewService';
import type { SavedDatabaseViewAccessPolicy } from '../../../../src/api/services/savedDatabaseViewAccessPolicy';

const viewId = '10000000-0000-4000-8000-000000000001';
const state = {
  schemaVersion: 1 as const,
  tab: 'characters' as const,
  search: '',
  setFilter: '',
  filters: { numeric: [], powerTypes: [], functionIcons: [], missionSet: '' },
  hasFoilFilter: false,
  hideAltsFilter: true,
};
const view = {
  id: viewId,
  name: 'Characters',
  viewState: state,
  isPinned: false,
  createdAt: '2026-09-09T00:00:00.000Z',
  updatedAt: '2026-09-09T00:00:00.000Z',
};
const mutationData = { view, count: 1, max: 50 };

function auth(role: 'ADMIN' | 'USER' | 'GUEST'): RequestHandler {
  return (req: Request, _res, next) => {
    req.user = { id: `${role.toLowerCase()}-1`, name: role, email: `${role}@example.com`, role };
    next();
  };
}

const noAuth: RequestHandler = (_req, res) => {
  res.status(401).json({ data: null, meta: {}, errors: [{ code: 'UNAUTHORIZED' }], success: false });
};

function service(overrides: Partial<SavedDatabaseViewService> = {}): SavedDatabaseViewService {
  return {
    list: jest.fn().mockResolvedValue({ views: [view], count: 1, max: 50 }),
    create: jest.fn().mockResolvedValue({ ok: true, data: mutationData }),
    updateMetadata: jest.fn().mockResolvedValue({ ok: true, data: mutationData }),
    delete: jest.fn().mockResolvedValue({ ok: true, data: { deletedCount: 1, notFoundCount: 0, count: 0, max: 50 } }),
    bulkDelete: jest.fn().mockResolvedValue({ deletedCount: 1, notFoundCount: 1, count: 0, max: 50 }),
    ...overrides,
  } as unknown as SavedDatabaseViewService;
}

function buildApp(
  savedDatabaseViewService: SavedDatabaseViewService,
  authenticateUser: RequestHandler = auth('ADMIN'),
  accessPolicy: SavedDatabaseViewAccessPolicy = { canAccess: jest.fn().mockReturnValue(true) },
) {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  const deps: SavedDatabaseViewsV1HttpDeps = { savedDatabaseViewService, authenticateUser, accessPolicy };
  registerSavedDatabaseViewsV1HttpRoutes(router, deps);
  app.use(router);
  return { app, accessPolicy };
}

describe('saved-database-views.http', () => {
  it('lists the authenticated user records with private cache headers', async () => {
    const savedDatabaseViewService = service();
    const { app, accessPolicy } = buildApp(savedDatabaseViewService);
    const response = await request(app).get('/saved-database-views').expect(200);
    expect(response.body.data).toEqual({ views: [view], count: 1, max: 50 });
    expect(response.headers['cache-control']).toContain('private');
    expect(accessPolicy.canAccess).toHaveBeenCalledWith({ id: 'admin-1', role: 'ADMIN' });
    expect(savedDatabaseViewService.list).toHaveBeenCalledWith('admin-1');
  });

  it('creates a complete V1 state and maps unsupported versions distinctly', async () => {
    const savedDatabaseViewService = service();
    const { app } = buildApp(savedDatabaseViewService);
    await request(app).post('/saved-database-views').send({ name: ' New ', viewState: state }).expect(201);
    expect(savedDatabaseViewService.create).toHaveBeenCalledWith('admin-1', 'New', state);
    const invalid = await request(app).post('/saved-database-views').send({
      name: 'Bad', viewState: { ...state, schemaVersion: 2 },
    }).expect(400);
    expect(invalid.body.errors[0].code).toBe('SAVED_DATABASE_VIEW_UNSUPPORTED_SCHEMA_VERSION');
  });

  it('returns stable validation codes for invalid name and filter state', async () => {
    const { app } = buildApp(service());
    const invalidName = await request(app).post('/saved-database-views').send({ name: '  ', viewState: state }).expect(400);
    expect(invalidName.body.errors[0].code).toBe('SAVED_DATABASE_VIEW_INVALID_NAME');
    const invalidState = await request(app).post('/saved-database-views').send({
      name: 'Bad state',
      viewState: { ...state, filters: { ...state.filters, numeric: [{ field: 'unknown', op: 'eq', value: 1 }] } },
    }).expect(400);
    expect(invalidState.body.errors[0].code).toBe('SAVED_DATABASE_VIEW_INVALID_STATE');
  });

  it('updates only name and pin metadata', async () => {
    const savedDatabaseViewService = service();
    const { app } = buildApp(savedDatabaseViewService);
    await request(app).patch(`/saved-database-views/${viewId}`).send({ name: 'Renamed', isPinned: true }).expect(200);
    expect(savedDatabaseViewService.updateMetadata).toHaveBeenCalledWith('admin-1', viewId, { name: 'Renamed', isPinned: true });
    await request(app).patch(`/saved-database-views/${viewId}`).send({ viewState: state }).expect(400);
  });

  it('bulk deletes through the literal route and deletes one', async () => {
    const savedDatabaseViewService = service();
    const { app } = buildApp(savedDatabaseViewService);
    const otherId = '20000000-0000-4000-8000-000000000002';
    await request(app).post('/saved-database-views/bulk-delete').send({ ids: [viewId, otherId] }).expect(200);
    expect(savedDatabaseViewService.bulkDelete).toHaveBeenCalledWith('admin-1', [viewId, otherId]);
    await request(app).delete(`/saved-database-views/${viewId}`).expect(200);
    expect(savedDatabaseViewService.delete).toHaveBeenCalledWith('admin-1', viewId);
  });

  it('does not expose a duplicate route', async () => {
    const { app } = buildApp(service());
    await request(app).post(`/saved-database-views/${viewId}/duplicate`).send({ name: 'Copy' }).expect(404);
  });

  it('rejects invalid IDs before calling the service', async () => {
    const savedDatabaseViewService = service();
    const { app } = buildApp(savedDatabaseViewService);
    const response = await request(app).delete('/saved-database-views/not-a-uuid').expect(400);
    expect(response.body.errors[0].code).toBe('SAVED_DATABASE_VIEW_INVALID_ID');
    expect(savedDatabaseViewService.delete).not.toHaveBeenCalled();
  });

  it.each(['USER', 'GUEST'] as const)('returns stable forbidden for %s', async (role) => {
    const savedDatabaseViewService = service();
    const accessPolicy: SavedDatabaseViewAccessPolicy = { canAccess: jest.fn().mockReturnValue(false) };
    const { app } = buildApp(savedDatabaseViewService, auth(role), accessPolicy);
    const response = await request(app).get('/saved-database-views').expect(403);
    expect(response.body.errors[0].code).toBe('SAVED_DATABASE_VIEW_FORBIDDEN');
    expect(savedDatabaseViewService.list).not.toHaveBeenCalled();
  });

  it('requires authentication before the policy or service', async () => {
    const savedDatabaseViewService = service();
    const accessPolicy: SavedDatabaseViewAccessPolicy = { canAccess: jest.fn() };
    const { app } = buildApp(savedDatabaseViewService, noAuth, accessPolicy);
    await request(app).get('/saved-database-views').expect(401);
    expect(accessPolicy.canAccess).not.toHaveBeenCalled();
  });

  it('maps service domain errors and unexpected failures', async () => {
    const limitService = service({
      create: jest.fn().mockResolvedValue({ ok: false, status: 409, code: 'SAVED_DATABASE_VIEW_LIMIT_REACHED', message: 'Limit' }),
    });
    const limit = await request(buildApp(limitService).app).post('/saved-database-views').send({ name: 'Name', viewState: state }).expect(409);
    expect(limit.body.errors[0].code).toBe('SAVED_DATABASE_VIEW_LIMIT_REACHED');

    const broken = service({ list: jest.fn().mockRejectedValue(new Error('db')) });
    const failure = await request(buildApp(broken).app).get('/saved-database-views').expect(500);
    expect(failure.body.errors[0].code).toBe('SAVED_DATABASE_VIEW_ERROR');
  });
});

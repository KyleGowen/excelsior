import express, { type Request, type RequestHandler } from 'express';
import request from 'supertest';
import { registerAdminV1HttpRoutes, type AdminV1HttpDeps } from '../../../../src/api/http/admin.http';
import type { AdminService } from '../../../../src/api/services/adminService';
import type { AdminBizOpsDashboardService } from '../../../../src/api/services/adminBizOpsDashboardService';

const adminAuth: RequestHandler = (req: Request, _res, next) => {
  (req as Request & { user?: unknown }).user = {
    id: 'admin-1',
    name: 'a',
    email: 'a@example.com',
    role: 'ADMIN'
  };
  next();
};

const userAuth: RequestHandler = (req: Request, _res, next) => {
  (req as Request & { user?: unknown }).user = {
    id: 'u1',
    name: 'u',
    email: 'u@example.com',
    role: 'USER'
  };
  next();
};

type BuildAdminV1HttpDeps = Omit<AdminV1HttpDeps, 'bizOpsDashboardService'> & {
  bizOpsDashboardService?: AdminBizOpsDashboardService;
};

function stubBizOpsDashboardService(
  over: Partial<AdminBizOpsDashboardService> = {}
): AdminBizOpsDashboardService {
  return {
    getDashboard: jest.fn().mockResolvedValue({
      generatedAt: '2026-08-28T18:03:19.000Z',
      currency: 'USD',
      coverage: {
        finalizedInvoiceCount: 71,
        finalizedPeriodStart: '2020-09',
        finalizedPeriodEnd: '2026-07'
      },
      currentMonth: {
        month: '2026-08',
        throughDate: '2026-08-28',
        estimatedTotal: 78.396132,
        dailyAverage: 2.799862,
        projectedTotal: 86.795718,
        previousFinalizedMonth: '2026-07',
        previousFinalizedTotal: 88.62,
        percentOfPrevious: 88.5,
        projectedDeltaPercentage: -2.1,
        previousIsHistoricHigh: true
      },
      yearToDate: { year: 2026, finalizedTotal: 526.98, estimatedTotal: 78.396132, trackedTotal: 605.376132 },
      monthlyCosts: [],
      serviceCosts: [],
      serviceTrends: [],
      latestWeeklyDigest: null
    }),
    ...over
  } as unknown as AdminBizOpsDashboardService;
}

function buildApp(deps: BuildAdminV1HttpDeps): express.Application {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  registerAdminV1HttpRoutes(router, {
    ...deps,
    bizOpsDashboardService: deps.bizOpsDashboardService ?? stubBizOpsDashboardService()
  });
  app.use(router);
  return app;
}

function stubAdminService(over: Partial<AdminService> = {}): AdminService {
  return {
    getUserAnalytics: jest.fn().mockResolvedValue({
      generatedAt: '2026-08-24T12:00:00.000Z',
      acquisitionPeriodStart: '2026-07-25T12:00:00.000Z',
      standardUserAccounts: 90,
      newStandardAccounts: 40,
      loggedInLast24Hours: 7,
      loggedInLast30Days: { count: 49, percentage: 54 },
      inactiveOver30Days: 41,
      googleAuthUsers: { count: 44, percentage: 49 },
      recordedLoginUsers: 77,
      signupMonths: [],
      loginRecency: [],
      deckStatistics: {
        totalDecks: 247,
        legalDecks: 184,
        legalPercentage: 74.5,
        limitedDecks: 32,
        limitedPercentage: 13,
        averageDecksPerUser: 2.7,
        averageLegalDecksPerUser: 2
      },
      collectionStatistics: {
        usersWithNonZeroCollections: 38,
        adoptionPercentage: 42.2,
        averageCardsPerUser: 53.6,
        averageCardsPerCollector: 126.9
      },
      siteSectionUsage: {
        totalRequests: 260,
        sections: []
      },
      loginTimeDistribution: {
        timeZone: 'America/Los_Angeles',
        windowStart: '2026-08-23T12:00:00.000Z',
        totalLogins: 0,
        allTimeTotalLogins: 0,
        hours: []
      }
    }),
    listUsers: jest.fn().mockResolvedValue([
      { id: '1', name: 'n', email: 'n@e.com', role: 'USER', lastLoginAt: null }
    ]),
    createUser: jest.fn().mockResolvedValue({
      ok: true,
      user: { id: '2', name: 'new', email: 'new@example.com', role: 'USER', lastLoginAt: null }
    }),
    clearDeckCache: jest.fn(),
    clearCardCaches: jest.fn(),
    getDatabaseStatus: jest.fn().mockResolvedValue({
      status: 'OK' as const,
      database: { valid: true, upToDate: true, migrations: 'Flyway managed' }
    }),
    ...over
  } as unknown as AdminService;
}

describe('admin.http', () => {
  it('GET /admin/biz-ops-dashboard returns 403 for non-admin without reading the ledger', async () => {
    const bizOpsDashboardService = stubBizOpsDashboardService();
    const app = buildApp({
      adminService: stubAdminService(),
      bizOpsDashboardService,
      authenticateUser: userAuth
    });
    const res = await request(app).get('/admin/biz-ops-dashboard').expect(403);
    expect(res.body.errors[0].code).toBe('ADMIN_REQUIRED');
    expect(bizOpsDashboardService.getDashboard).not.toHaveBeenCalled();
  });

  it('GET /admin/biz-ops-dashboard returns AWS cost analytics for an admin', async () => {
    const bizOpsDashboardService = stubBizOpsDashboardService();
    const app = buildApp({
      adminService: stubAdminService(),
      bizOpsDashboardService,
      authenticateUser: adminAuth
    });
    const res = await request(app).get('/admin/biz-ops-dashboard').expect(200);
    expect(res.body.errors).toEqual([]);
    expect(res.body.data).toMatchObject({
      currency: 'USD',
      coverage: { finalizedInvoiceCount: 71 },
      currentMonth: { estimatedTotal: 78.396132 },
      yearToDate: { trackedTotal: 605.376132 }
    });
  });

  it('GET /admin/biz-ops-dashboard returns the scoped error when the ledger cannot be read', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const app = buildApp({
        adminService: stubAdminService(),
        bizOpsDashboardService: stubBizOpsDashboardService({
          getDashboard: jest.fn().mockRejectedValue(new Error('unavailable'))
        }),
        authenticateUser: adminAuth
      });
      const res = await request(app).get('/admin/biz-ops-dashboard').expect(500);
      expect(res.body.errors[0].code).toBe('ADMIN_BIZ_OPS_DASHBOARD_ERROR');
    } finally {
      consoleError.mockRestore();
    }
  });

  it('GET /admin/user-analytics returns 403 for non-admin without querying analytics', async () => {
    const svc = stubAdminService();
    const app = buildApp({ adminService: svc, authenticateUser: userAuth });
    const res = await request(app).get('/admin/user-analytics').expect(403);
    expect(res.body.errors[0].code).toBe('ADMIN_REQUIRED');
    expect(svc.getUserAnalytics).not.toHaveBeenCalled();
  });

  it('GET /admin/user-analytics returns aggregate analytics for admin', async () => {
    const svc = stubAdminService();
    const app = buildApp({ adminService: svc, authenticateUser: adminAuth });
    const res = await request(app).get('/admin/user-analytics').expect(200);
    expect(res.body.errors).toEqual([]);
    expect(res.body.data).toMatchObject({
      standardUserAccounts: 90,
      newStandardAccounts: 40,
      loggedInLast24Hours: 7,
      loggedInLast30Days: { count: 49, percentage: 54 },
      inactiveOver30Days: 41,
      deckStatistics: { totalDecks: 247, legalDecks: 184, limitedDecks: 32 },
      collectionStatistics: { usersWithNonZeroCollections: 38, averageCardsPerUser: 53.6 }
    });
  });

  it('GET /admin/users returns 403 for non-admin', async () => {
    const svc = stubAdminService();
    const app = buildApp({ adminService: svc, authenticateUser: userAuth });
    const res = await request(app).get('/admin/users').expect(403);
    expect(res.body.errors[0].code).toBe('ADMIN_REQUIRED');
    expect(svc.listUsers).not.toHaveBeenCalled();
  });

  it('GET /admin/users lists users for admin', async () => {
    const svc = stubAdminService();
    const app = buildApp({ adminService: svc, authenticateUser: adminAuth });
    const res = await request(app).get('/admin/users').expect(200);
    expect(res.body.errors).toEqual([]);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].name).toBe('n');
  });

  it('POST /admin/users creates user', async () => {
    const svc = stubAdminService();
    const app = buildApp({ adminService: svc, authenticateUser: adminAuth });
    const res = await request(app)
      .post('/admin/users')
      .send({ username: 'bob', password: 'secret' })
      .expect(201);
    expect(res.body.errors).toEqual([]);
    expect(res.body.data.name).toBe('new');
    expect(svc.createUser).toHaveBeenCalledWith('bob', 'secret');
  });

  it('POST /admin/users validates body', async () => {
    const svc = stubAdminService();
    const app = buildApp({ adminService: svc, authenticateUser: adminAuth });
    const res = await request(app).post('/admin/users').send({}).expect(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
    expect(svc.createUser).not.toHaveBeenCalled();
  });

  it('GET /admin/debug/clear-cache', async () => {
    const svc = stubAdminService();
    const app = buildApp({ adminService: svc, authenticateUser: adminAuth });
    await request(app).get('/admin/debug/clear-cache').expect(200);
    expect(svc.clearDeckCache).toHaveBeenCalled();
  });

  it('GET /admin/database/status', async () => {
    const svc = stubAdminService();
    const app = buildApp({ adminService: svc, authenticateUser: adminAuth });
    const res = await request(app).get('/admin/database/status').expect(200);
    expect(res.body.data.status).toBe('OK');
    expect(res.body.data.database.valid).toBe(true);
  });
});

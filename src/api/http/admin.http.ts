import type { Request, RequestHandler, Response, Router } from 'express';
import type { User } from '../../types';
import type { AdminService } from '../services/adminService';
import type { AdminBizOpsDashboardService } from '../services/adminBizOpsDashboardService';
import { sendV1Json, sendV1Success } from './v1Envelope';
import { CreateAdminUserBody } from './models/admin/CreateAdminUserBody';

export interface AdminV1HttpDeps {
  adminService: AdminService;
  bizOpsDashboardService: AdminBizOpsDashboardService;
  authenticateUser: RequestHandler;
}

function requireAdminV1(req: Request, res: Response): boolean {
  if (req.user?.role !== 'ADMIN') {
    sendV1Json(res, 403, null, [
      { code: 'ADMIN_REQUIRED', message: 'Only ADMIN users can access this endpoint' }
    ]);
    return false;
  }
  return true;
}

function userToJson(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null
  };
}

export function registerAdminV1HttpRoutes(router: Router, deps: AdminV1HttpDeps): void {
  router.get('/admin/biz-ops-dashboard', deps.authenticateUser, async (req, res) => {
    try {
      if (!requireAdminV1(req, res)) return;
      sendV1Success(res, await deps.bizOpsDashboardService.getDashboard());
    } catch (error) {
      console.error('v1 GET /admin/biz-ops-dashboard error:', error);
      sendV1Json(res, 500, null, [
        { code: 'ADMIN_BIZ_OPS_DASHBOARD_ERROR', message: 'Failed to fetch business operations dashboard' }
      ]);
    }
  });

  router.get('/admin/user-analytics', deps.authenticateUser, async (req, res) => {
    try {
      if (!requireAdminV1(req, res)) return;
      sendV1Success(res, await deps.adminService.getUserAnalytics());
    } catch (error) {
      console.error('v1 GET /admin/user-analytics error:', error);
      sendV1Json(res, 500, null, [
        { code: 'ADMIN_USER_ANALYTICS_ERROR', message: 'Failed to fetch user analytics' }
      ]);
    }
  });

  router.get('/admin/users', deps.authenticateUser, async (req, res) => {
    try {
      if (!requireAdminV1(req, res)) return;
      const users = await deps.adminService.listUsers();
      sendV1Success(res, users.map(userToJson));
    } catch (error) {
      console.error('v1 GET /admin/users error:', error);
      sendV1Json(res, 500, null, [{ code: 'ADMIN_USERS_LIST_ERROR', message: 'Failed to fetch users' }]);
    }
  });

  router.post('/admin/users', deps.authenticateUser, async (req, res) => {
    try {
      if (!requireAdminV1(req, res)) return;
      const parsed = CreateAdminUserBody.parse(req.body);
      if (!parsed.ok) {
        sendV1Json(res, 400, null, parsed.errors);
        return;
      }
      const result = await deps.adminService.createUser(parsed.value.username, parsed.value.password);
      if (!result.ok) {
        const status = result.kind === 'conflict' ? 409 : 400;
        const code = result.kind === 'conflict' ? 'USERNAME_EXISTS' : 'VALIDATION_ERROR';
        sendV1Json(res, status, null, [{ code, message: result.message }]);
        return;
      }
      sendV1Success(res, userToJson(result.user), 201);
    } catch (error) {
      console.error('v1 POST /admin/users error:', error);
      sendV1Json(res, 500, null, [{ code: 'ADMIN_USER_CREATE_ERROR', message: 'Failed to create user' }]);
    }
  });

  router.get('/admin/debug/clear-cache', deps.authenticateUser, async (req, res) => {
    try {
      if (!requireAdminV1(req, res)) return;
      deps.adminService.clearDeckCache();
      sendV1Success(res, { message: 'Deck cache cleared' });
    } catch (error) {
      console.error('v1 GET /admin/debug/clear-cache error:', error);
      sendV1Json(res, 500, null, [{ code: 'ADMIN_DEBUG_ERROR', message: 'Failed to clear cache' }]);
    }
  });

  router.get('/admin/debug/clear-card-cache', deps.authenticateUser, async (req, res) => {
    try {
      if (!requireAdminV1(req, res)) return;
      deps.adminService.clearCardCaches();
      sendV1Success(res, { message: 'Card repository cache cleared' });
    } catch (error) {
      console.error('v1 GET /admin/debug/clear-card-cache error:', error);
      sendV1Json(res, 500, null, [{ code: 'ADMIN_DEBUG_ERROR', message: 'Failed to clear card cache' }]);
    }
  });

  router.get('/admin/database/status', deps.authenticateUser, async (req, res) => {
    try {
      if (!requireAdminV1(req, res)) return;
      const payload = await deps.adminService.getDatabaseStatus();
      sendV1Success(res, payload);
    } catch (error) {
      console.error('v1 GET /admin/database/status error:', error);
      sendV1Json(res, 500, null, [
        {
          code: 'ADMIN_DATABASE_STATUS_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      ]);
    }
  });
}

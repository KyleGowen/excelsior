import type { Request, RequestHandler, Response, Router } from 'express';
import type { ZodIssue } from 'zod';
import type { SavedDatabaseViewService } from '../services/savedDatabaseViewService';
import type { SavedDatabaseViewAccessPolicy } from '../services/savedDatabaseViewAccessPolicy';
import {
  BulkDeleteSavedDatabaseViewsBody,
  CreateSavedDatabaseViewBody,
  SavedDatabaseViewIdParam,
  UpdateSavedDatabaseViewBody
} from './models/saved-database-views/SavedDatabaseViewRequestBodies';
import { parseV1Body } from './parseV1Body';
import { setPrivateUserCacheHeaders } from './privateUserCache';
import { createV1RateLimit } from './middleware/v1RateLimit';
import { sendV1Json, sendV1Success } from './v1Envelope';

export interface SavedDatabaseViewsV1HttpDeps {
  savedDatabaseViewService: SavedDatabaseViewService;
  accessPolicy: SavedDatabaseViewAccessPolicy;
  authenticateUser: RequestHandler;
}

function stateIssueCode(issue: ZodIssue): string {
  const path = issue.path.map(String);
  if (path[0] === 'name') return 'SAVED_DATABASE_VIEW_INVALID_NAME';
  if (path.includes('schemaVersion')) return 'SAVED_DATABASE_VIEW_UNSUPPORTED_SCHEMA_VERSION';
  return 'SAVED_DATABASE_VIEW_INVALID_STATE';
}

async function requireSavedViewsAccess(
  req: Request,
  res: Response,
  accessPolicy: SavedDatabaseViewAccessPolicy
): Promise<boolean> {
  if (!req.user) {
    sendV1Json(res, 401, null, [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]);
    return false;
  }
  if (!(await accessPolicy.canAccess({ id: req.user.id, role: req.user.role }))) {
    sendV1Json(res, 403, null, [{
      code: 'SAVED_DATABASE_VIEW_FORBIDDEN',
      message: 'Saved database views are not available for this account'
    }]);
    return false;
  }
  return true;
}

function parseId(id: string, res: Response): string | null {
  const parsed = SavedDatabaseViewIdParam.safeParse(id);
  if (parsed.success) return parsed.data;
  sendV1Json(res, 400, null, [{
    code: 'SAVED_DATABASE_VIEW_INVALID_ID',
    message: parsed.error.issues[0]?.message ?? 'Saved view ID is invalid',
    field: 'id'
  }]);
  return null;
}

function sendServiceResult(
  res: Response,
  result: Awaited<ReturnType<SavedDatabaseViewService['create']>>,
  successStatus = 200
): void {
  if (!result.ok) {
    sendV1Json(res, result.status, null, [{ code: result.code, message: result.message }]);
    return;
  }
  setPrivateUserCacheHeaders(res);
  sendV1Success(res, result.data, successStatus);
}

const mutationRateLimit = createV1RateLimit({ routeKey: 'mutation' });

export function registerSavedDatabaseViewsV1HttpRoutes(
  router: Router,
  deps: SavedDatabaseViewsV1HttpDeps
): void {
  router.get('/saved-database-views', deps.authenticateUser, async (req, res) => {
    if (!(await requireSavedViewsAccess(req, res, deps.accessPolicy))) return;
    try {
      const data = await deps.savedDatabaseViewService.list(req.user!.id);
      setPrivateUserCacheHeaders(res);
      sendV1Success(res, data);
    } catch (error) {
      console.error('v1 GET /saved-database-views error:', error);
      sendV1Json(res, 500, null, [{
        code: 'SAVED_DATABASE_VIEW_ERROR',
        message: 'Failed to load saved database views'
      }]);
    }
  });

  router.post('/saved-database-views', deps.authenticateUser, mutationRateLimit, async (req, res) => {
    if (!(await requireSavedViewsAccess(req, res, deps.accessPolicy))) return;
    const parsed = parseV1Body(CreateSavedDatabaseViewBody, req.body, res, { issueCode: stateIssueCode });
    if (!parsed) return;
    try {
      const result = await deps.savedDatabaseViewService.create(
        req.user!.id,
        parsed.value.name,
        parsed.value.viewState
      );
      sendServiceResult(res, result, 201);
    } catch (error) {
      console.error('v1 POST /saved-database-views error:', error);
      sendV1Json(res, 500, null, [{ code: 'SAVED_DATABASE_VIEW_ERROR', message: 'Failed to save view' }]);
    }
  });

  // Keep the literal bulk path before any ID-parameterized route.
  router.post(
    '/saved-database-views/bulk-delete',
    deps.authenticateUser,
    mutationRateLimit,
    async (req, res) => {
      if (!(await requireSavedViewsAccess(req, res, deps.accessPolicy))) return;
      const parsed = parseV1Body(BulkDeleteSavedDatabaseViewsBody, req.body, res, {
        issueCode: 'SAVED_DATABASE_VIEW_INVALID_ID'
      });
      if (!parsed) return;
      try {
        const data = await deps.savedDatabaseViewService.bulkDelete(req.user!.id, parsed.value.ids);
        setPrivateUserCacheHeaders(res);
        sendV1Success(res, data);
      } catch (error) {
        console.error('v1 POST /saved-database-views/bulk-delete error:', error);
        sendV1Json(res, 500, null, [{
          code: 'SAVED_DATABASE_VIEW_ERROR',
          message: 'Failed to delete selected saved views'
        }]);
      }
    }
  );

  router.patch(
    '/saved-database-views/:id',
    deps.authenticateUser,
    mutationRateLimit,
    async (req, res) => {
      if (!(await requireSavedViewsAccess(req, res, deps.accessPolicy))) return;
      const id = parseId(req.params.id, res);
      if (!id) return;
      const parsed = parseV1Body(UpdateSavedDatabaseViewBody, req.body, res, {
        issueCode: (issue) => issue.path.map(String).includes('name')
          ? 'SAVED_DATABASE_VIEW_INVALID_NAME'
          : 'SAVED_DATABASE_VIEW_INVALID_METADATA'
      });
      if (!parsed) return;
      try {
        const result = await deps.savedDatabaseViewService.updateMetadata(req.user!.id, id, {
          ...(parsed.value.name !== undefined ? { name: parsed.value.name } : {}),
          ...(parsed.value.isPinned !== undefined ? { isPinned: parsed.value.isPinned } : {})
        });
        sendServiceResult(res, result);
      } catch (error) {
        console.error('v1 PATCH /saved-database-views/:id error:', error);
        sendV1Json(res, 500, null, [{ code: 'SAVED_DATABASE_VIEW_ERROR', message: 'Failed to update view' }]);
      }
    }
  );

  router.delete(
    '/saved-database-views/:id',
    deps.authenticateUser,
    mutationRateLimit,
    async (req, res) => {
      if (!(await requireSavedViewsAccess(req, res, deps.accessPolicy))) return;
      const id = parseId(req.params.id, res);
      if (!id) return;
      try {
        const result = await deps.savedDatabaseViewService.delete(req.user!.id, id);
        if (!result.ok) {
          sendV1Json(res, result.status, null, [{ code: result.code, message: result.message }]);
          return;
        }
        setPrivateUserCacheHeaders(res);
        sendV1Success(res, result.data);
      } catch (error) {
        console.error('v1 DELETE /saved-database-views/:id error:', error);
        sendV1Json(res, 500, null, [{ code: 'SAVED_DATABASE_VIEW_ERROR', message: 'Failed to delete view' }]);
      }
    }
  );
}

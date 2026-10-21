import type { Request, RequestHandler, Response, Router } from 'express';
import type { UserAccountService } from '../services/userAccountService';
import { ChangeEmailRequestBody } from './models/users/ChangeEmailRequestBody';
import { ChangePasswordRequestBody } from './models/users/ChangePasswordRequestBody';
import { SetDisplayNameRequestBody } from './models/users/SetDisplayNameRequestBody';
import { sendV1Json, sendV1Success } from './v1Envelope';
import { parseV1Body } from './parseV1Body';
import { SetTopDeckRequestBody } from './models/users/SetTopDeckRequestBody';

export interface UsersV1HttpDeps {
  userAccountService: UserAccountService;
  authenticateUser: RequestHandler;
}

function requireSelfServiceUser(req: Request, res: Response): boolean {
  if (!req.user) {
    sendV1Json(res, 401, null, [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]);
    return false;
  }
  if (req.user.role !== 'USER' && req.user.role !== 'ADMIN') {
    sendV1Json(res, 403, null, [
      { code: 'FORBIDDEN', message: 'Only USER or ADMIN may change account settings' }
    ]);
    return false;
  }
  return true;
}

export function registerUsersV1HttpRoutes(router: Router, deps: UsersV1HttpDeps): void {
  router.post('/users/topdeck', deps.authenticateUser, async (req, res) => {
    if (!requireSelfServiceUser(req, res)) return;
    const parsed = parseV1Body(SetTopDeckRequestBody, req.body, res);
    if (!parsed) return;
    try {
      const result = await deps.userAccountService.setTopDeckHandle(
        req.user!.id, req.user!.role, parsed.value?.topdeckHandle
      );
      if (!result.ok) {
        sendV1Json(res, result.status, null, [{ code: result.code, message: result.message }]);
        return;
      }
      res.set('Cache-Control', 'no-store');
      sendV1Success(res, result.data, result.status);
    } catch (error) {
      console.error('v1 POST /users/topdeck error:', error);
      sendV1Json(res, 500, null, [{ code: 'SET_TOPDECK_ERROR', message: 'Failed to save TopDeck handle' }]);
    }
  });

  router.post('/users/change-email', deps.authenticateUser, async (req, res) => {
    if (!requireSelfServiceUser(req, res)) return;
    const parsed = ChangeEmailRequestBody.parse(req.body);
    if (!parsed.ok) {
      sendV1Json(res, 400, null, parsed.errors);
      return;
    }
    try {
      const result = await deps.userAccountService.changeEmail(
        req.user!.id,
        req.user!.role,
        parsed.value.email
      );
      if (!result.ok) {
        sendV1Json(res, result.status, null, [{ code: result.code, message: result.message }]);
        return;
      }
      sendV1Success(res, result.data, result.status);
    } catch (error) {
      console.error('v1 POST /users/change-email error:', error);
      sendV1Json(res, 500, null, [
        { code: 'CHANGE_EMAIL_ERROR', message: 'Failed to change email' }
      ]);
    }
  });

  router.post('/users/change-password', deps.authenticateUser, async (req, res) => {
    if (!requireSelfServiceUser(req, res)) return;
    const parsed = ChangePasswordRequestBody.parse(req.body);
    if (!parsed.ok) {
      sendV1Json(res, 400, null, parsed.errors);
      return;
    }
    try {
      const result = await deps.userAccountService.changePassword(
        req.user!.id,
        req.user!.role,
        parsed.value.newPassword,
        parsed.value.confirmPassword
      );
      if (!result.ok) {
        sendV1Json(res, result.status, null, [{ code: result.code, message: result.message }]);
        return;
      }
      sendV1Success(res, result.data, result.status);
    } catch (error) {
      console.error('v1 POST /users/change-password error:', error);
      sendV1Json(res, 500, null, [
        { code: 'CHANGE_PASSWORD_ERROR', message: 'Failed to change password' }
      ]);
    }
  });

  router.post('/users/display-name', deps.authenticateUser, async (req, res) => {
    if (!requireSelfServiceUser(req, res)) return;
    const parsed = SetDisplayNameRequestBody.parse(req.body);
    if (!parsed.ok) {
      sendV1Json(res, 400, null, parsed.errors);
      return;
    }
    try {
      const result = await deps.userAccountService.setDisplayName(
        req.user!.id,
        req.user!.role,
        parsed.value.displayName
      );
      if (!result.ok) {
        sendV1Json(res, result.status, null, [{ code: result.code, message: result.message }]);
        return;
      }
      sendV1Success(res, result.data, result.status);
    } catch (error) {
      console.error('v1 POST /users/display-name error:', error);
      sendV1Json(res, 500, null, [
        { code: 'SET_DISPLAY_NAME_ERROR', message: 'Failed to set display name' }
      ]);
    }
  });
}

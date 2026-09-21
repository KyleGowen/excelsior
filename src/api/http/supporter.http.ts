import type { RequestHandler, Router } from 'express';
import type { SupporterBillingService } from '../services/supporterBillingService';
import { SupporterBillingError } from '../services/supporterBillingService';
import { CreateSupporterCheckoutBody } from './models/supporter/CreateSupporterCheckoutBody';
import { parseV1Body } from './parseV1Body';
import { sendV1Json, sendV1Success } from './v1Envelope';

export interface SupporterV1HttpDeps {
  supporterBillingService: SupporterBillingService;
  authenticateUser: RequestHandler;
  optionalAuth: RequestHandler;
}

function sendBillingError(res: Parameters<typeof sendV1Json>[0], error: unknown): void {
  if (error instanceof SupporterBillingError) {
    sendV1Json(res, error.httpStatus, null, [{ code: error.code, message: error.message }]);
    return;
  }
  sendV1Json(res, 500, null, [
    { code: 'SUPPORTER_BILLING_ERROR', message: 'Supporter billing is temporarily unavailable.' }
  ]);
}

function requirePersistentUser(
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1]
): string | null {
  if (!req.user) {
    sendV1Json(res, 401, null, [{ code: 'UNAUTHORIZED', message: 'Sign in required' }]);
    return null;
  }
  if (req.user.role === 'GUEST') {
    sendV1Json(res, 403, null, [
      { code: 'GUEST_FORBIDDEN', message: 'Create an account or sign in to manage Supporter access.' }
    ]);
    return null;
  }
  if (req.user.role !== 'USER') {
    sendV1Json(res, 403, null, [
      { code: 'FORBIDDEN', message: 'This account cannot start Supporter billing.' }
    ]);
    return null;
  }
  return req.user.id;
}

export function registerSupporterV1HttpRoutes(router: Router, deps: SupporterV1HttpDeps): void {
  router.get('/supporter/status', deps.optionalAuth, async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    res.vary('Cookie');
    res.vary('Authorization');
    try {
      const userId = req.user?.role === 'USER' ? req.user.id : null;
      sendV1Success(res, await deps.supporterBillingService.getStatus(userId));
    } catch {
      sendV1Json(res, 500, null, [
        { code: 'SUPPORTER_STATUS_ERROR', message: 'Supporter status could not be loaded.' }
      ]);
    }
  });

  router.post('/supporter/checkout', deps.authenticateUser, async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    const userId = requirePersistentUser(req, res);
    if (!userId) return;
    const parsed = parseV1Body(CreateSupporterCheckoutBody, req.body, res);
    if (!parsed) return;
    try {
      sendV1Success(
        res,
        await deps.supporterBillingService.createCheckout(
          userId,
          parsed.value.monthlyContributionUsd
        ),
        201
      );
    } catch (error) {
      sendBillingError(res, error);
    }
  });

  router.post('/supporter/portal', deps.authenticateUser, async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    const userId = requirePersistentUser(req, res);
    if (!userId) return;
    if (req.body && Object.keys(req.body as object).length > 0) {
      sendV1Json(res, 400, null, [
        { code: 'VALIDATION_ERROR', message: 'Request body must be empty' }
      ]);
      return;
    }
    try {
      sendV1Success(res, await deps.supporterBillingService.createPortalSession(userId), 201);
    } catch (error) {
      sendBillingError(res, error);
    }
  });

  router.post('/supporter/webhook', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const signature = req.header('stripe-signature');
    const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;
    if (!signature || !rawBody) {
      sendV1Json(res, 400, null, [
        { code: 'SUPPORTER_WEBHOOK_INVALID', message: 'Invalid webhook request' }
      ]);
      return;
    }
    try {
      const event = deps.supporterBillingService.constructWebhookEvent(rawBody, signature);
      await deps.supporterBillingService.processWebhook(event);
      sendV1Success(res, { received: true });
    } catch (error) {
      sendBillingError(res, error);
    }
  });
}

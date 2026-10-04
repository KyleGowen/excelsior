import type { Router } from 'express';
import { ServiceAccessError, type ServiceAccessService } from '../access/serviceAccessService';
import { ServiceTokenRequestSchema } from './models/service-auth/ServiceTokenRequestBody';
import { parseV1Body } from './parseV1Body';
import { createV1RateLimit } from './middleware/v1RateLimit';
import { sendV1Json, sendV1Success } from './v1Envelope';

export function registerServiceAuthV1HttpRoutes(router: Router, service: ServiceAccessService): void {
  router.post('/service-auth/token', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); }, createV1RateLimit({ routeKey: 'service-token', budget: { limit: 15, windowMs: 60000 } }), (req, res) => {
    const parsed = parseV1Body(ServiceTokenRequestSchema, req.body, res);
    if (!parsed) return;
    try {
      sendV1Success(res, service.issue(parsed.value));
    } catch (error) {
      if (error instanceof ServiceAccessError) {
        if (error.retryAfterSeconds) res.setHeader('Retry-After', String(error.retryAfterSeconds));
        sendV1Json(res, error.status, null, [{ code: error.code, message: error.message }]);
      } else {
        sendV1Json(res, 503, null, [{ code: 'SERVICE_ACCESS_UNAVAILABLE', message: 'Service access is not configured' }]);
      }
    }
  });
}

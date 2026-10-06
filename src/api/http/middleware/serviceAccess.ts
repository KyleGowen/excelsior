import type { RequestHandler } from 'express';
import { ServiceAccessError, SERVICE_HEADER, type ServiceAccessService } from '../../access/serviceAccessService';
import { serviceScopeForOperation } from '../../access/serviceOperations';
import { sendV1Json } from '../v1Envelope';

/** Existing session/user-token callers stay compatible; an explicit service credential is always verified. */
export function createServiceAccessMiddleware(service: ServiceAccessService): RequestHandler {
  return (req, res, next) => {
    if (req.serviceClient) { next(); return; } // Already verified by the in-process database gateway.
    const header = req.headers[SERVICE_HEADER];
    if (header === undefined) { next(); return; }
    const requiredScope = serviceScopeForOperation(req.method, req.baseUrl + req.path);
    const operation = req.method + ' ' + (requiredScope ?? 'unsupported'); // Never audit record IDs or query values.
    const requestId = res.getHeader('X-Request-Id');
    try {
      if (typeof header !== 'string' || !/^Bearer [a-zA-Z0-9_.-]{1,8192}$/.test(header)) throw new ServiceAccessError(401, 'SERVICE_TOKEN_INVALID', 'Invalid service token');
      req.serviceClient = service.authenticate(header.slice(7), requiredScope);
      // Service-bearing responses must not bypass client validation through an intermediary cache.
      const setHeader = res.setHeader.bind(res);
      res.setHeader = ((name: string, value: string | number | readonly string[]) => setHeader(name, name.toLowerCase() === 'cache-control' ? 'no-store' : value)) as typeof res.setHeader;
      res.setHeader('Cache-Control', 'no-store');
      res.on('finish', () => service.record({ event: 'service_request', clientId: req.serviceClient!.clientId, outcome: res.statusCode < 400 ? 'allowed' : 'denied', operation, ...(typeof requestId === 'string' ? { requestId } : {}) }));
      next();
    } catch (error) {
      const failure = error instanceof ServiceAccessError ? error : new ServiceAccessError(503, 'SERVICE_ACCESS_UNAVAILABLE', 'Service access is not configured');
      if (failure.clientId) req.serviceIdentity = { clientId: failure.clientId };
      service.record({ event: 'service_request', ...(failure.clientId ? { clientId: failure.clientId } : {}), outcome: failure.status === 429 ? 'throttled' : 'denied', code: failure.code, operation, ...(typeof requestId === 'string' ? { requestId } : {}) });
      res.setHeader('Cache-Control', 'no-store');
      if (failure.retryAfterSeconds) res.setHeader('Retry-After', String(failure.retryAfterSeconds));
      sendV1Json(res, failure.status, null, [{ code: failure.code, message: failure.message }]);
    }
  };
}

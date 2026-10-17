import type { RequestHandler } from 'express';
import { ACCOUNT_SERVICE_PREFIX, ACCOUNT_SESSION_HEADER, accountCanonicalPath } from '../../access/accountOperations';
import { ServiceAccessError, SERVICE_HEADER, type ServiceAccessService } from '../../access/serviceAccessService';
import { sendV1Json } from '../v1Envelope';
import { createV1RateLimit } from './v1RateLimit';

/** Confidential server-to-server account access. Never participates in native login. */
export function createAccountAccessMiddleware(service: ServiceAccessService): RequestHandler {
  // Distinct budget keys cannot consume the native login allowance.
  const loginLimit = createV1RateLimit({ routeKey: 'account-service-login', budget: { limit: 15, windowMs: 60_000 } });
  return (req, res, next) => {
    const path = req.path;
    if (path !== ACCOUNT_SERVICE_PREFIX && !path.startsWith(ACCOUNT_SERVICE_PREFIX + '/')) { next(); return; }
    const canonical = accountCanonicalPath(req.method, path);
    req.applicationRouteKey = req.method + ' ' + (canonical ? path : ACCOUNT_SERVICE_PREFIX + '/unsupported');
    const setHeader = res.setHeader.bind(res);
    // Upstream sessions belong in the host's private SessionStore, never a browser cookie.
    res.setHeader = ((name: string, value: string | number | readonly string[]) => {
      if (name.toLowerCase() === 'set-cookie') {
        for (const cookie of Array.isArray(value) ? value : [String(value)]) {
          const match = /^sessionId=([a-f0-9]{64}|);/.exec(cookie);
          if (match) setHeader(ACCOUNT_SESSION_HEADER, match[1]!);
        }
        return res;
      }
      return setHeader(name, name.toLowerCase() === 'cache-control' ? 'no-store' : value);
    }) as typeof res.setHeader;
    res.setHeader('Cache-Control', 'no-store');
    try {
      if (process.env.ENABLE_ACCOUNT_SERVICE_GATEWAY !== '1') throw new ServiceAccessError(503, 'ACCOUNT_SERVICE_UNAVAILABLE', 'Account service access is not enabled');
      if (process.env.NODE_ENV === 'production' && !req.secure) throw new ServiceAccessError(503, 'SERVICE_TRANSPORT_REQUIRED', 'Account service access requires HTTPS');
      const header = req.headers[SERVICE_HEADER];
      if (typeof header !== 'string' || !/^Bearer [a-zA-Z0-9_.-]{1,8192}$/.test(header)) throw new ServiceAccessError(401, 'SERVICE_TOKEN_INVALID', 'A valid service token is required');
      req.serviceClient = service.authenticate(header.slice(7), canonical ? 'account:self' : null);
      const session = req.headers[ACCOUNT_SESSION_HEADER];
      if (session !== undefined && (typeof session !== 'string' || !/^[a-f0-9]{64}$/.test(session))) throw new ServiceAccessError(401, 'ACCOUNT_SESSION_INVALID', 'Invalid account session');
      // Ambient Excelsior cookies/Bearer tokens must never log a different host in.
      delete req.headers.authorization; delete req.headers.cookie; delete req.cookies; delete req.user;
      delete req.headers[ACCOUNT_SESSION_HEADER];
      if (session !== undefined) {
        req.cookies = { sessionId: session };
        req.headers.cookie = 'sessionId=' + session;
      }
      // canonical is non-null after successful scope verification.
      req.url = canonical! + req.url.slice(path.length);
      if (req.method === 'POST' && canonical!.startsWith('/api/auth/') && canonical !== '/api/auth/logout') loginLimit(req, res, next);
      else next();
    } catch (error) {
      const failure = error instanceof ServiceAccessError ? error : new ServiceAccessError(503, 'SERVICE_ACCESS_UNAVAILABLE', 'Service access is not configured');
      if (failure.clientId) req.serviceIdentity = { clientId: failure.clientId };
      if (failure.retryAfterSeconds) res.setHeader('Retry-After', String(failure.retryAfterSeconds));
      sendV1Json(res, failure.status, null, [{ code: failure.code, message: failure.message }]);
    }
  };
}

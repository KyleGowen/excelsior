import type { RequestHandler } from 'express';
import { DATABASE_SERVICE_PREFIX, NATIVE_DATABASE_PREFIX, databaseCanonicalPath, isDatabaseRead } from '../../access/databaseOperations';
import { NativeDatabaseAccess } from '../../access/nativeDatabaseAccess';
import { readApplicationClientCredentials } from '../../access/applicationClientCredentials';
import { ServiceAccessError, SERVICE_HEADER, type ServiceAccessService } from '../../access/serviceAccessService';
import { sendV1Json } from '../v1Envelope';

export function nativeDatabaseEnabled(): boolean {
  return process.env.ENABLE_DATABASE_SERVICE_GATEWAY === '1' && process.env.ENABLE_NATIVE_DATABASE_SERVICE === '1';
}
export function createDatabaseAccessMiddleware(service: ServiceAccessService, native = new NativeDatabaseAccess(service, () => readApplicationClientCredentials('excelsior-web'))): RequestHandler {
  return (req, res, next) => {
    const path = req.path;
    const isNative = path === NATIVE_DATABASE_PREFIX || path.startsWith(NATIVE_DATABASE_PREFIX + '/');
    const isService = path === DATABASE_SERVICE_PREFIX || path.startsWith(DATABASE_SERVICE_PREFIX + '/');
    if (!isNative && !isService) { next(); return; }
    const canonical = databaseCanonicalPath(path);
    const issuance = !isNative && req.method === 'POST' && canonical === '/api/v1/service-auth/token';
    req.databaseCanonicalPath = isDatabaseRead(req.method, canonical) || issuance ? canonical : '/api/v1/database/unsupported';
    // Override downstream public catalog headers: neither credentials nor validation may be cached.
    const setHeader = res.setHeader.bind(res);
    res.setHeader = ((name: string, value: string | number | readonly string[]) => setHeader(name, name.toLowerCase() === 'cache-control' ? 'no-store' : value)) as typeof res.setHeader;
    res.setHeader('Cache-Control', 'no-store');
    try {
      if (process.env.ENABLE_DATABASE_SERVICE_GATEWAY !== '1' || (isNative && !nativeDatabaseEnabled())) throw new ServiceAccessError(503, 'DATABASE_SERVICE_UNAVAILABLE', 'Database service access is not enabled');
      if (isService && process.env.NODE_ENV === 'production' && !req.secure) throw new ServiceAccessError(503, 'SERVICE_TRANSPORT_REQUIRED', 'Database service access requires HTTPS');
      if (isNative) {
        if (!isDatabaseRead(req.method, canonical)) throw new ServiceAccessError(403, 'SERVICE_SCOPE_DENIED', 'Database gateway permits catalog reads only');
        if (req.headers[SERVICE_HEADER] !== undefined) throw new ServiceAccessError(401, 'SERVICE_TOKEN_INVALID', 'Native application identity is server-managed');
        req.serviceClient = native.authenticate();
      } else if (!issuance) {
        const header = req.headers[SERVICE_HEADER];
        if (typeof header !== 'string' || !/^Bearer [a-zA-Z0-9_.-]{1,8192}$/.test(header)) throw new ServiceAccessError(401, 'SERVICE_TOKEN_INVALID', 'A valid service token is required');
        req.serviceClient = service.authenticate(header.slice(7), 'catalog:read');
      }
      if (!issuance && !isDatabaseRead(req.method, canonical)) throw new ServiceAccessError(403, 'SERVICE_SCOPE_DENIED', 'Database gateway permits catalog reads only');
      // Rewrite only a literal allowlisted operation; preserve query, original IP and player cookies.
      req.url = canonical + req.url.slice(path.length);
      next();
    } catch (error) {
      const failure = error instanceof ServiceAccessError ? error : new ServiceAccessError(503, 'SERVICE_ACCESS_UNAVAILABLE', 'Service access is not configured');
      if (failure.clientId) req.serviceIdentity = { clientId: failure.clientId };
      if (failure.retryAfterSeconds) res.setHeader('Retry-After', String(failure.retryAfterSeconds));
      sendV1Json(res, failure.status, null, [{ code: failure.code, message: failure.message }]);
    }
  };
}

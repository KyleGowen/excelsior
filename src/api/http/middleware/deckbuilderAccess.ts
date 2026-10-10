import type { RequestHandler } from 'express';
import { DECKBUILDER_SERVICE_PREFIX, NATIVE_DECKBUILDER_PREFIX, deckbuilderCanonicalPath, deckbuilderRouteKey, isDeckbuilderPreview, nativeDeckbuilderScope } from '../../access/deckbuilderOperations';
import { NativeDeckbuilderAccess } from '../../access/nativeDeckbuilderAccess';
import { readApplicationClientCredentials } from '../../access/applicationClientCredentials';
import { ServiceAccessError, SERVICE_HEADER, type ServiceAccessService } from '../../access/serviceAccessService';
import { sendV1Json } from '../v1Envelope';

export function nativeDeckbuilderEnabled(): boolean {
  return process.env.ENABLE_DECKBUILDER_SERVICE_GATEWAY === '1' && process.env.ENABLE_NATIVE_DECKBUILDER_SERVICE === '1';
}
export function createDeckbuilderAccessMiddleware(service: ServiceAccessService, native = new NativeDeckbuilderAccess(service, () => readApplicationClientCredentials('excelsior-web'))): RequestHandler {
  return (req, res, next) => {
    const path = req.path;
    const isNative = path === NATIVE_DECKBUILDER_PREFIX || path.startsWith(NATIVE_DECKBUILDER_PREFIX + '/');
    const isService = path === DECKBUILDER_SERVICE_PREFIX || path.startsWith(DECKBUILDER_SERVICE_PREFIX + '/');
    if (!isNative && !isService) { next(); return; }
    const canonical = deckbuilderCanonicalPath(path);
    req.applicationRouteKey = isNative || isDeckbuilderPreview(req.method, canonical) ? deckbuilderRouteKey(req.method, canonical) : req.method + ' /api/v1/deckbuilder/unsupported';
    const setHeader = res.setHeader.bind(res);
    res.setHeader = ((name: string, value: string | number | readonly string[]) => setHeader(name, name.toLowerCase() === 'cache-control' ? 'no-store' : value)) as typeof res.setHeader;
    res.setHeader('Cache-Control', 'no-store');
    try {
      if (process.env.ENABLE_DECKBUILDER_SERVICE_GATEWAY !== '1' || (isNative && !nativeDeckbuilderEnabled())) throw new ServiceAccessError(503, 'DECKBUILDER_SERVICE_UNAVAILABLE', 'Deckbuilder service access is not enabled');
      if (isService && process.env.NODE_ENV === 'production' && !req.secure) throw new ServiceAccessError(503, 'SERVICE_TRANSPORT_REQUIRED', 'Service access requires HTTPS');
      if (isNative) {
        const scope = nativeDeckbuilderScope(req.method, canonical);
        if (!scope) throw new ServiceAccessError(403, 'SERVICE_SCOPE_DENIED', 'Unsupported native builder operation');
        if (req.headers[SERVICE_HEADER] !== undefined) throw new ServiceAccessError(401, 'SERVICE_TOKEN_INVALID', 'Native identity is server-managed');
        req.serviceClient = native.authenticate(scope);
      } else {
        const header = req.headers[SERVICE_HEADER];
        if (typeof header !== 'string' || !/^Bearer [a-zA-Z0-9_.-]{1,8192}$/.test(header)) throw new ServiceAccessError(401, 'SERVICE_TOKEN_INVALID', 'A valid service token is required');
        req.serviceClient = service.authenticate(header.slice(7), 'decks:read');
        if (!isDeckbuilderPreview(req.method, canonical)) throw new ServiceAccessError(403, 'SERVICE_SCOPE_DENIED', 'Builder service permits stateless previews only');
        // The service gateway never bootstraps or forwards a player identity.
        delete req.headers.authorization; delete req.headers.cookie; delete req.cookies; delete req.user;
      }
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

import type { RequestHandler } from 'express';
import { ApplicationAccessAdapter, type PlayerAccess, type ApplicationRequestOptions } from '../../access/applicationAccessAdapter';
import { serviceScopeForOperation } from '../../access/serviceOperations';
import { SERVICE_HEADER } from '../../access/serviceAccessService';
import { readApplicationClientCredentials } from '../../access/applicationClientCredentials';
import { sendV1Json } from '../v1Envelope';

/** Same-origin cookie UX; only the server adds its confidential service credential. */
export function createApplicationAccessMiddleware(adapter: ApplicationAccessAdapter, fixture = false): RequestHandler {
  return async (req, res, next) => {
    const path = fixture ? req.url : req.baseUrl + req.url;
    const pathname = path.split('?')[0]!;
    if (!fixture && (req.headers[SERVICE_HEADER] !== undefined || !serviceScopeForOperation(req.method, pathname))) { next(); return; }
    if (!serviceScopeForOperation(req.method, pathname)) {
      sendV1Json(res, 403, null, [{ code: 'SERVICE_SCOPE_DENIED', message: 'Unsupported application operation' }]); return;
    }
    const player: PlayerAccess = {};
    // Prefer an explicitly supplied player token, as the direct API already does.
    const authorization = req.headers.authorization;
    if (authorization !== undefined) {
      if (!/^Bearer [a-zA-Z0-9_.-]{1,8192}$/.test(authorization)) {
        sendV1Json(res, 401, null, [{ code: 'UNAUTHORIZED', message: 'Invalid player credential' }]); return;
      }
      player.userAccessToken = authorization.slice(7);
    } else if (req.headers.cookie) player.sessionCookie = req.headers.cookie;
    const options: ApplicationRequestOptions = { method: req.method, player };
    if (req.body !== undefined && !['GET', 'HEAD'].includes(req.method)) options.body = req.body;
    const requestId = res.getHeader('X-Request-Id');
    if (typeof requestId === 'string') options.requestId = requestId;
    if (typeof req.headers['if-none-match'] === 'string') options.ifNoneMatch = req.headers['if-none-match'];
    try {
      const response = await adapter.request(path, options);
      // Authentication and owned responses cannot enter intermediary caches.
      res.setHeader('Cache-Control', 'no-store');
      for (const name of ['content-type', 'etag', 'retry-after', 'x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset']) {
        const value = response.headers.get(name); if (value !== null) res.setHeader(name, value);
      }
      const cookies = response.headers.getSetCookie();
      if (cookies.length) res.setHeader('Set-Cookie', cookies);
      res.status(response.status).send(Buffer.from(await response.arrayBuffer()));
    } catch {
      res.setHeader('Cache-Control', 'no-store');
      sendV1Json(res, 503, null, [{ code: 'APPLICATION_ACCESS_UNAVAILABLE', message: 'Application access is temporarily unavailable' }]);
    }
  };
}

export function configuredApplicationAdapter(clientId: 'excelsior-web' | 'lrg-web'): ApplicationAccessAdapter {
  const origin = process.env.APPLICATION_ACCESS_API_ORIGIN;
  if (!origin) throw new Error('Application API origin is required');
  return new ApplicationAccessAdapter(origin, () => readApplicationClientCredentials(clientId));
}

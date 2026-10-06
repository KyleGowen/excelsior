import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createRequestIdMiddleware } from './requestId';
import { createCorsMiddleware } from './corsAllowlist';
import { createSecurityHeadersMiddleware } from './securityHeaders';
import { createRequestLoggerMiddleware } from './logging';
import { createCompressionMiddleware } from './compressionMiddleware';
import { createServiceAccessMiddleware } from '../api/http/middleware/serviceAccess';
import { configuredServiceAccess } from '../api/access/configuredServiceAccess';
import { createApplicationAccessMiddleware, configuredApplicationAdapter } from '../api/http/middleware/applicationAccess';
import { redirectStaticImagesToCdn, setStaticAssetCacheHeaders } from './staticAssetCache';
import type { Pool } from 'pg';
import { createApiAccessLogMiddleware } from '../api/http/middleware/apiAccessLog';
import { createDatabaseAccessMiddleware } from '../api/http/middleware/databaseAccess';
import { sendV1Json } from '../api/http/v1Envelope';

/**
 * Applies the first block of app-wide middleware: request-id, structured
 * logging, CORS allowlist, security headers, body + cookie parsing, and
 * static mounts for card/general images. Called from index (composition root).
 *
 * Middleware order matters:
 *  1. `X-Request-Id` is assigned BEFORE logging so every log line carries it.
 *  2. `pino-http` is mounted BEFORE any route so request start/end are logged.
 *  3. `cors` and `helmet` run after logging so rejections are logged too.
 *  4. Body + cookie parsing run last before route handlers.
 *
 * See docs/current/API_V1_LOGGING.md, API_V1_CORS.md, API_V1_SECURITY_HEADERS.md.
 */
export function setupMiddleware(app: express.Application, pool?: Pool): void {
  app.use(createRequestIdMiddleware());
  app.use(createRequestLoggerMiddleware());
  const audit = pool ? createApiAccessLogMiddleware({ pool }) : undefined;
  // Include validation/CORS failures. The older HTTP proxy retains its inner-router audit only.
  if (audit && process.env.ENABLE_EXCELSIOR_ACCESS_ADAPTER !== '1') app.use((req, res, next) => {
    if (/^\/api\/(?:v1(?:\/|$)|service\/v1(?:\/|$)|apps\/excelsior(?:\/|$))/.test(req.path)) audit(req, res, next);
    else next();
  });
  app.use(createCorsMiddleware());
  app.use(createSecurityHeadersMiddleware());
  app.use(createCompressionMiddleware());

  app.use(express.json());
  app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/service/v1/') || req.path.startsWith('/api/apps/excelsior/') || req.path === '/api/v1/service-auth/token') {
      // Express parse errors can contain submitted credentials; never return/log those details.
      res.setHeader('Cache-Control', 'no-store');
      const status = (error as { status?: number })?.status === 413 ? 413 : 400;
      sendV1Json(res, status, null, [{ code: 'VALIDATION_ERROR', message: 'Invalid request body' }]);
    } else next(error);
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      req.cookies = {};
      cookieHeader.split(';').forEach((cookie: string) => {
        const [name, value] = cookie.trim().split('=');
        req.cookies[name] = value;
      });
    }
    next();
  });

  if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_APPLICATION_ACCESS_FIXTURES === '1') {
    app.use('/api/host-fixtures/excelsior', createApplicationAccessMiddleware(configuredApplicationAdapter('excelsior-web'), true));
    app.use('/api/host-fixtures/lrg', createApplicationAccessMiddleware(configuredApplicationAdapter('lrg-web'), true));
  }
  if (process.env.ENABLE_EXCELSIOR_ACCESS_ADAPTER === '1') {
    if (process.env.ENABLE_DATABASE_SERVICE_GATEWAY === '1') throw new Error('Choose one native application adapter');
    app.use('/api', createApplicationAccessMiddleware(configuredApplicationAdapter('excelsior-web')));
  }
  app.use(createDatabaseAccessMiddleware(configuredServiceAccess));
  app.use('/api', createServiceAccessMiddleware(configuredServiceAccess));

  app.use('/src/resources/cards/images', express.static(path.join(process.cwd(), 'src/resources/cards/images'), {
    setHeaders: setStaticAssetCacheHeaders,
  }));

  app.use('/src/resources/images', redirectStaticImagesToCdn, express.static(path.join(process.cwd(), 'src/resources/images'), {
    setHeaders: setStaticAssetCacheHeaders,
  }));
}

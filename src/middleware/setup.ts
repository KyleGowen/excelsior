import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createRequestIdMiddleware } from './requestId';
import { createCorsMiddleware } from './corsAllowlist';
import { createSecurityHeadersMiddleware } from './securityHeaders';
import { createRequestLoggerMiddleware } from './logging';
import { createCompressionMiddleware } from './compressionMiddleware';
import { redirectStaticImagesToCdn, setStaticAssetCacheHeaders } from './staticAssetCache';

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
export function setupMiddleware(app: express.Application): void {
  app.use(createRequestIdMiddleware());
  app.use(createRequestLoggerMiddleware());
  app.use(createCorsMiddleware());
  app.use(createSecurityHeadersMiddleware());
  app.use(createCompressionMiddleware());

  app.use(express.json());

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

  app.use('/src/resources/cards/images', express.static(path.join(process.cwd(), 'src/resources/cards/images'), {
    setHeaders: setStaticAssetCacheHeaders,
  }));

  app.use('/src/resources/images', redirectStaticImagesToCdn, express.static(path.join(process.cwd(), 'src/resources/images'), {
    setHeaders: setStaticAssetCacheHeaders,
  }));
}

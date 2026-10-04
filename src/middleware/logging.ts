import pino, { Logger, type DestinationStream } from 'pino';
import pinoHttp from 'pino-http';
import type { RequestHandler } from 'express';
import type { RequestWithId } from './requestId';

/**
 * Structured JSON logging via pino + pino-http.
 *
 * Every log line emitted by the request path carries `request_id` so a single
 * request can be reconstructed from the log stream. `docs/current/API_V1_LOGGING.md`
 * documents the schema and common grep patterns.
 *
 * Kill switch: `DISABLE_PINO=1` returns a no-op middleware and falls back to
 * `console.*` for structured output.
 */

export function createApplicationLogger(destination?: DestinationStream): Logger {
  return pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'excelsior' },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-excelsior-service-authorization"]',
      'res.headers["set-cookie"]',
      'password',
      'req.body.password',
      'req.body.idToken',
      'req.body.client_secret',
      'req.body.refreshToken',
      'req.query',
      'req.query.client_secret',
      'req.query.refreshToken',
    ],
    remove: true,
  },
}, destination);
}
const baseLogger = createApplicationLogger();

export function getLogger(): Logger {
  return baseLogger;
}

export function createRequestLoggerMiddleware(logger: Logger = baseLogger): RequestHandler {
  if (process.env.DISABLE_PINO === '1') {
    return (_req, _res, next) => next();
  }

  return pinoHttp({
    logger,
    serializers: {
      req: (req: { url?: string }) => ({ ...req, url: req.url?.split('?')[0]?.replace(/(\/guest\/decks\/)guest_[^/]+/, '$1:id') }),
    },
    genReqId: (req) => {
      const id = (req as unknown as RequestWithId).id;
      return id ?? 'unknown';
    },
    customProps: (req) => ({
      request_id: (req as unknown as RequestWithId).id,
      route: (req as unknown as { route?: { path?: string } }).route?.path,
    }),
    customSuccessMessage: (_req, res) => `request_completed status=${res.statusCode}`,
    customErrorMessage: (_req, res, err) =>
      `request_errored status=${res.statusCode} error=${err.message}`,
  }) as unknown as RequestHandler;
}

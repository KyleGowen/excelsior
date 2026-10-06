import type { Request, RequestHandler } from 'express';
import type { Pool } from 'pg';
import { databaseCanonicalPath, isDatabaseRead } from '../../access/databaseOperations';
import { getLogger } from '../../../middleware/logging';

const mounted = Symbol('apiAccessLog');
type LoggedRequest = Request & { [mounted]?: boolean; id?: string };
export interface ApiAccessLogDeps {
  pool: Pick<Pool, 'query'>;
  maxPending?: number;
  reportFailure?: (reason: 'capacity' | 'write') => void;
}
export function applicationId(clientId: string | undefined): string {
  if (clientId === 'excelsior-web') return 'excelsior';
  if (clientId === 'bmg-database-ui') return 'bmg-database-ui';
  return clientId ?? 'unknown';
}
function routeKey(req: Request): string {
  const path = req.databaseCanonicalPath ?? databaseCanonicalPath(req.originalUrl.split('?')[0]!);
  if (isDatabaseRead(req.method, path) || path === '/api/v1/service-auth/token' || path === '/api/v1/database/unsupported') return req.method + ' ' + path;
  // Registered patterns contain parameter placeholders; raw URLs and queries never become dimensions.
  const pattern = typeof req.route?.path === 'string' ? req.route.path : '/*';
  return req.method + ' /api/v1' + pattern;
}

/** One atomic row + daily aggregate per origin request, including client aborts. Best effort and bounded. */
export function createApiAccessLogMiddleware(deps: ApiAccessLogDeps): RequestHandler {
  let pending = 0;
  const reportFailure = deps.reportFailure ?? (reason => getLogger().warn({ reason }, 'api_access_log_write_failed'));
  const report = (reason: 'capacity' | 'write') => { try { reportFailure(reason); } catch { /* Telemetry never changes a response. */ } };
  return (request, res, next) => {
    const req = request as LoggedRequest;
    if (process.env.DISABLE_API_ACCESS_LOG === '1' || req[mounted]) { next(); return; }
    req[mounted] = true;
    const started = performance.now();
    let recorded = false;
    const record = (aborted: boolean) => {
      if (recorded) return;
      recorded = true;
      if (pending >= (deps.maxPending ?? 128)) { report('capacity'); return; }
      const clientId = req.serviceClient?.clientId ?? req.serviceIdentity?.clientId;
      const parameters = [req.user?.id ?? null, routeKey(req), req.method, aborted ? 499 : res.statusCode,
        typeof req.ip === 'string' ? req.ip.slice(0, 64) : null, req.id?.slice(0, 128) ?? null,
        applicationId(clientId), clientId ?? null, clientId !== undefined, Math.max(0, Math.round(performance.now() - started))];
      pending++;
      try {
        void deps.pool.query(`WITH recorded AS (
          INSERT INTO api_access_log (user_id, route_key, method, status, ip, request_id, application_id, service_client_id, identity_verified, duration_ms)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          RETURNING application_id, route_key, method, status, ts
        ) INSERT INTO api_application_hit_counts (application_id, route_key, method, status, day, hit_count, last_hit_at)
          SELECT application_id, route_key, method, status, (ts AT TIME ZONE 'UTC')::date, 1, ts FROM recorded
          ON CONFLICT (application_id, route_key, method, status, day)
          DO UPDATE SET hit_count = api_application_hit_counts.hit_count + 1, last_hit_at = EXCLUDED.last_hit_at`, parameters)
          .catch(() => report('write')).finally(() => { pending--; });
      } catch { pending--; report('write'); }
    };
    res.once('finish', () => record(false));
    res.once('close', () => { if (!res.writableFinished) record(true); });
    next();
  };
}

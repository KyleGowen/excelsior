import express from 'express';
import type { StaticHealthRoutesDeps } from './types';
import { setStaticAssetCacheHeaders } from '../middleware/staticAssetCache';
import { resolveSpaIndexPath, isSpaBuilt, spaDistDir } from './spaIndexPath';

/**
 * Phase 1 split the single `/health` into:
 *
 * - `GET /health/live`  — public, minimal. OK / version / uptime / git sha.
 *                          Never hits the database. Safe to probe from load
 *                          balancers and uptime monitors.
 * - `GET /health/ready` — public readiness for deploy gates. Live payload +
 *                          lightweight `SELECT 1` DB ping (no table scans).
 * - `GET /health/deep`  — ADMIN only. Full payload: migrations, table counts,
 *                          memory, guest checks, DB latency.
 * - `GET /health`        — back-compat. Returns the deep payload when called
 *                          by an ADMIN, otherwise falls back to the live
 *                          payload. No caller is broken by the split.
 *
 * CloudFront and clients MUST NOT cache these — they always emit
 * `Cache-Control: no-store`.
 *
 * Kill switch: `DISABLE_HEALTH_SPLIT=1` routes both `/health/live` and
 * `/health/deep` to the combined legacy payload. See
 * `docs/current/API_V1_HEALTH_ENDPOINTS.md`.
 */
type AuthedRequest = express.Request & { user?: { role?: string } };

async function buildLivePayload(deps: StaticHealthRoutesDeps): Promise<Record<string, unknown>> {
  const gitInfo = deps.getGitInfo();
  return {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    git: {
      commit: gitInfo.commit,
      shortCommit: gitInfo.shortCommit,
      branch: gitInfo.branch,
      commitDate: gitInfo.commitDate,
      commitMessage: gitInfo.commitMessage,
      commitAuthor: gitInfo.commitAuthor,
      commitEmail: gitInfo.commitEmail,
    },
  };
}

/** Lightweight DB ping for blue-green deploy and readiness probes. */
async function buildReadyPayload(deps: StaticHealthRoutesDeps, startTime: number): Promise<{ data: Record<string, unknown>; httpStatus: number }> {
  const healthData: Record<string, unknown> = await buildLivePayload(deps);

  if (!deps.dataSource) {
    healthData.database = { status: 'ERROR', error: 'DataSource not initialized', connection: 'Failed' };
    healthData.status = 'DEGRADED';
    healthData.latency = `${Date.now() - startTime}ms`;
    return { data: healthData, httpStatus: 200 };
  }
  const pool = deps.dataSource.getPool();
  if (!pool) {
    healthData.database = { status: 'ERROR', error: 'Database connection pool not initialized', connection: 'Failed' };
    healthData.status = 'DEGRADED';
    healthData.latency = `${Date.now() - startTime}ms`;
    return { data: healthData, httpStatus: 200 };
  }

  const dbStartTime = Date.now();
  const maxAttempts = 3;
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await pool.query('SELECT 1 AS ok');
      healthData.database = {
        status: 'OK',
        latency: `${Date.now() - dbStartTime}ms`,
        connection: 'Active',
      };
      lastError = null;
      break;
    } catch (dbError) {
      lastError = dbError;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  if (lastError) {
    healthData.database = {
      status: 'ERROR',
      error: lastError instanceof Error ? lastError.message : 'Unknown database error',
      connection: 'Failed',
    };
    healthData.status = 'DEGRADED';
  }

  healthData.latency = `${Date.now() - startTime}ms`;
  const httpStatus = healthData.status === 'ERROR' ? 503 : 200;
  return { data: healthData, httpStatus };
}

async function buildDeepPayload(deps: StaticHealthRoutesDeps, startTime: number): Promise<{ data: Record<string, unknown>; httpStatus: number }> {
  const healthData: Record<string, unknown> = await buildLivePayload(deps);

  try {
    const memUsage = process.memoryUsage();
    healthData.resources = {
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      },
      cpu: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
      },
    };

    try {
      const dbStartTime = Date.now();

      if (!deps.dataSource) {
        throw new Error('DataSource not initialized');
      }
      const pool = deps.dataSource.getPool();
      if (!pool) {
        throw new Error('Database connection pool not initialized');
      }
      const client = await pool.connect();

      const guestUserResult = await client.query(
        'SELECT id, username, role FROM users WHERE role = $1 OR username = $2',
        ['GUEST', 'guest']
      );
      const guestDecksResult = await client.query(
        'SELECT COUNT(*) as count FROM decks WHERE user_id IN (SELECT id FROM users WHERE role = $1 OR username = $2)',
        ['GUEST', 'guest']
      );
      const dbStatsResult = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM decks) as total_decks,
          (SELECT COUNT(*) FROM deck_cards) as total_deck_cards,
          (SELECT COUNT(*) FROM characters) as total_characters,
          (SELECT COUNT(*) FROM special_cards) as total_special_cards,
          (SELECT COUNT(*) FROM power_cards) as total_power_cards
      `);
      const migrationResult = await client.query(`
        SELECT 
          version, description, type, script, checksum,
          installed_by, installed_on, execution_time, success, installed_rank
        FROM flyway_schema_history 
        ORDER BY installed_rank DESC 
        LIMIT 1
      `);

      client.release();

      const dbLatency = Date.now() - dbStartTime;

      healthData.database = {
        status: 'OK',
        latency: `${dbLatency}ms`,
        connection: 'Active',
        guestUser: {
          exists: guestUserResult.rows.length > 0,
          count: guestUserResult.rows.length,
          users: (guestUserResult.rows as { id: string; username: string; role: string }[]).map((row) => ({
            id: row.id,
            username: row.username,
            role: row.role,
          })),
        },
        guestDecks: {
          total: parseInt((guestDecksResult.rows[0] as { count: string }).count),
        },
        stats: {
          totalUsers: parseInt((dbStatsResult.rows[0] as { total_users: string }).total_users),
          totalDecks: parseInt((dbStatsResult.rows[0] as { total_decks: string }).total_decks),
          totalDeckCards: parseInt((dbStatsResult.rows[0] as { total_deck_cards: string }).total_deck_cards),
          totalCharacters: parseInt((dbStatsResult.rows[0] as { total_characters: string }).total_characters),
          totalSpecialCards: parseInt((dbStatsResult.rows[0] as { total_special_cards: string }).total_special_cards),
          totalPowerCards: parseInt((dbStatsResult.rows[0] as { total_power_cards: string }).total_power_cards),
        },
        migrations: {
          latest: migrationResult.rows.length > 0
            ? (() => {
              const m = migrationResult.rows[0] as { version: string; description: string; type: string; script: string; checksum: number; installed_by: string; installed_on: string; execution_time: number; success: boolean; installed_rank: number };
              return { version: m.version, description: m.description, type: m.type, script: m.script, checksum: m.checksum, installedBy: m.installed_by, installedOn: m.installed_on, executionTime: m.execution_time, success: m.success, installedRank: m.installed_rank };
            })()
            : null,
        },
      };
    } catch (dbError) {
      healthData.database = {
        status: 'ERROR',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error',
        connection: 'Failed',
      };
      healthData.status = 'DEGRADED';
    }

    const totalLatency = Date.now() - startTime;
    healthData.latency = `${totalLatency}ms`;

    const httpStatus = healthData.status === 'ERROR' ? 503 : 200;
    return { data: healthData, httpStatus };
  } catch (error) {
    healthData.status = 'ERROR';
    healthData.error = error instanceof Error ? error.message : 'Unknown error';
    healthData.latency = `${Date.now() - startTime}ms`;
    return { data: healthData, httpStatus: 503 };
  }
}

export function registerStaticAndHealthRoutes(app: express.Application, deps: StaticHealthRoutesDeps): void {
  app.use('/src/resources', express.static('src/resources', {
    setHeaders: setStaticAssetCacheHeaders,
  }));

  // v2 React SPA build output (hashed /assets/*). Mounted before the SPA
  // catch-all so real built files are served rather than the app shell. Only
  // active once the SPA has been built (frontend/dist exists).
  if (isSpaBuilt()) {
    app.use(
      express.static(spaDistDir(), {
        index: false,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          } else {
            setStaticAssetCacheHeaders(res, filePath);
          }
        },
      })
    );
  }

  // Keep recently deployed hashed chunks reachable for tabs opened before a
  // blue-green cutover. The current build takes precedence above this mount.
  const legacyAssetsDir = process.env.LEGACY_FRONTEND_ASSETS_DIR;
  if (legacyAssetsDir) {
    app.use('/assets', express.static(legacyAssetsDir, {
      index: false,
      setHeaders: setStaticAssetCacheHeaders,
    }));
  }

  const splitDisabled = process.env.DISABLE_HEALTH_SPLIT === '1';

  // Public liveness — never hits the database.
  app.get('/health/live', async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (splitDisabled) {
      const startTime = Date.now();
      const { data, httpStatus } = await buildDeepPayload(deps, startTime);
      res.status(httpStatus).json(data);
      return;
    }
    const payload = await buildLivePayload(deps);
    res.status(200).json(payload);
  });

  // Readiness — live payload + SELECT 1. Used by EC2 blue-green deploy gate.
  app.get('/health/ready', async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const startTime = Date.now();
    const { data, httpStatus } = await buildReadyPayload(deps, startTime);
    res.status(httpStatus).json(data);
  });

  // Admin-gated deep health — full payload with DB introspection.
  app.get('/health/deep', deps.authenticateUser, async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const user = (req as AuthedRequest).user;
    if (!splitDisabled && (!user || user.role !== 'ADMIN')) {
      res.status(403).json({ success: false, error: 'Admin access required' });
      return;
    }
    const startTime = Date.now();
    const { data, httpStatus } = await buildDeepPayload(deps, startTime);
    res.status(httpStatus).json(data);
  });

  // Back-compat /health — deep payload for ops monitors and manual diagnostics.
  // EC2 blue-green deploy uses /health/ready (lighter SELECT 1 gate).
  app.get('/health', async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const startTime = Date.now();
    const { data, httpStatus } = await buildDeepPayload(deps, startTime);
    res.status(httpStatus).json(data);
  });

  // SPA catch-all — must be registered LAST. Serves the v2 app shell for
  // client-side routing on deep links / refreshes.
  app.get('*', (req, res, next) => {
    const p = req.path;
    if (
      p.startsWith('/api/') ||
      p.startsWith('/health') ||
      p.startsWith('/assets/') ||
      p.startsWith('/src/') ||
      p.includes('.')
    ) {
      return next();
    }
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    if (!isSpaBuilt()) {
      return next();
    }
    res.sendFile(resolveSpaIndexPath());
  });
}

# API v1 — `api_access_log`

Phase 2 §6.1.6 of the external API client plan. Async per-request audit trail for every `/api/v1/*` call.

## Schema

Migration: [`migrations/V276__Create_api_access_log.sql`](../../migrations/V276__Create_api_access_log.sql).

```sql
id BIGSERIAL PK
user_id UUID? FK users ON DELETE SET NULL
route_key TEXT          -- "<METHOD> <pattern>" from Express
method VARCHAR(10)
status INTEGER
ip VARCHAR(64)          -- req.ip (relies on Phase 0 `trust proxy`)
request_id VARCHAR(128) -- X-Request-Id from Phase 1
ts TIMESTAMPTZ DEFAULT NOW()
```

`request_id` lets you correlate one row here with the matching pino log line in `/var/log/app` and with any 429 / 5xx the caller observed.

Indexes: `ts`, `user_id`, `request_id`, `route_key`.

## Middleware

Source: [`src/api/http/middleware/apiAccessLog.ts`](../../src/api/http/middleware/apiAccessLog.ts).
Production composition mounts it before service validation for canonical and gateway
requests; the standalone v1 router also mounts it when given a pool. A per-request
marker prevents duplicate records. Finish (or an abandoned request's close) schedules one atomic PostgreSQL statement
inserting the request and incrementing its UTC daily application/route/method/status
aggregate. Errors and capacity drops produce a sanitized warning; writes are best
effort, bounded to 128 pending, and never delay or change a UI response.

V368 adds application_id, service_client_id, identity_verified and duration_ms.
Verified excelsior-web maps to excelsior; bmg-database-ui maps to bmg-database-ui.
Direct calls, unverifiable credentials and historical rows remain unknown. Verified
credential/scope/budget denials retain identity when available. Caller labels are
ignored; route keys exclude queries and record IDs. api_application_hit_counts
holds daily totals independently of 90-day request retention. Each origin retry is
a request; browser/query cache reuse and CDN image downloads are excluded. Existing
endpoint_hit_counts remains intact. Monitor api_access_log_write_failed warnings
for incomplete telemetry rather than interpreting a missing row as zero traffic.

## Env vars / kill switches

- `DISABLE_API_ACCESS_LOG=1` — middleware becomes a no-op; `finish` handler is not attached.

## Retention

The plan specifies 90 days. A nightly job deletes rows older than 90 days; add it when first audit queries appear in ops work. The job contract lives with this doc (not a separate migration) because it's data-only.

## Validation plan

### Automated (integration)

- `tests/integration/database-service-auth.test.ts` — real app, both verified
  identities, every allowed database read, one row per request, canonical route
  keys, aggregate agreement and malformed-body handling. The earlier planned
  api-access-log-writes test file is absent from the inspected baseline.

### Observability

- `SELECT count(*) FROM api_access_log WHERE ts > now() - interval '5 min';` should be non-zero shortly after traffic.
- `SELECT route_key, count(*) FROM api_access_log GROUP BY 1 ORDER BY 2 DESC LIMIT 10;` shows the top routes.
- Join to `refresh_tokens` on `user_id` for per-user session telemetry.

## Rollback plan

1. `DISABLE_API_ACCESS_LOG=1` to stop writes without redeploy.
2. Revert the middleware mount in `registerApiV1Routes.ts` if the kill switch is insufficient.
3. Table is additive; safe to leave in place. Do not drop as part of rollback.

## Related docs

- [`API_V1_LOGGING.md`](API_V1_LOGGING.md) — pino/request-id pairing.
- [`API_V1_AUTH_REFRESH.md`](API_V1_AUTH_REFRESH.md) — refresh rows help correlate long-running sessions.
Abandoned requests use synthetic status 499; completed responses retain their
actual HTTP status. Finish/close and global/router hooks cannot double count.

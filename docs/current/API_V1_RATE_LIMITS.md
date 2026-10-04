# API v1 — Consolidated rate limits

Phase 2 §6.1.8 of the external API client plan. Replaces the two pre-Phase-2 rate limiters (`v1LoginRateLimit`, `checkRateLimit`) with a single token-bucket middleware keyed by user or IP.

## Middleware

Source: [`src/api/http/middleware/v1RateLimit.ts`](../../src/api/http/middleware/v1RateLimit.ts). Buckets are keyed:

- `u:<user_id>:<route_key>` when the request has an authenticated principal (session or Bearer).
- `ip:<client_ip>:<route_key>` when anonymous.

Every response (success or 429) carries:

- `X-RateLimit-Limit` — the budget for this key.
- `X-RateLimit-Remaining` — remaining tokens after this request.
- `X-RateLimit-Reset` — Unix epoch seconds when the bucket resets.
- `Retry-After` (on 429 only) — seconds until reset.

429 body uses the v1 envelope with `errors[].code = 'RATE_LIMITED'`.

## Default budgets

Defined inside `v1RateLimit.ts`:

| routeKey   | limit / minute |
| ---------- | -------------- |
| `default`  | 120            |
| `login`    | 15             |
| `mutation` | 60             |
| `feedback` | 5              |

Specific routes can pass `{ budget: { limit, windowMs } }` when instantiating the middleware. New route groups should register a budget here rather than inline.

## Env vars / kill switches

- `DISABLE_V1_RATE_LIMIT=1` — middleware short-circuits to pass-through with no headers emitted. Useful for debugging or after a mass user-onboarding event.
- `LEGACY_RATE_LIMITS=1` — composition root can reinstate the old `v1LoginRateLimit` + `checkRateLimit` while the new middleware is being rolled out. The legacy shim stays in the tree for 30 days before removal.

## Validation plan

### Automated (unit)

- `tests/unit/v1RateLimit.test.ts` — header math, 429 on exhaustion, per-user bucket separation, kill-switch no-op.
- `tests/unit/api/http/feedback.http.test.ts` — feedback budget and sixth-request rejection.

### Automated (integration)

- `tests/integration/rate-limit-headers.test.ts` — headers on a 200, 429 after budget, `X-RateLimit-Reset` accurate within a second.

### Observability

- pino logs show `route_key` and `status=429` entries only once the budget is exceeded.
- `SELECT count(*) FROM api_access_log WHERE status = 429 AND ts > now() - interval '1 hour';` shows recent throttle activity.

## Rollback plan

1. `DISABLE_V1_RATE_LIMIT=1` → fast bypass without redeploy.
2. `LEGACY_RATE_LIMITS=1` → re-enable the pre-Phase-2 limiters via the compat shim in the composition root.
3. Revert the middleware + route wiring if both flags are insufficient.

## Related docs

- [`API_V1_AUTH_REFRESH.md`](API_V1_AUTH_REFRESH.md) — `/auth/login` and `/auth/refresh` are the first routes to move onto the `login` budget.
- [`API_V1_AUDIT_LOG.md`](API_V1_AUDIT_LOG.md) — 429s show up in `api_access_log` with `status = 429`.

Stateless `POST /decks/evaluate`: dedicated 120/minute IP budget; no persistence, no player identity needed. One-second editor debounce plus one retry; callers must honor 429.

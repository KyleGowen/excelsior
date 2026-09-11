# API v1 — changelog

One line per change. Newest first. Keep this in sync with
[`API_V1.md`](../../API_V1.md) and [`docs/openapi.yaml`](../openapi.yaml).

## Unreleased — Phase 3 (scale + docs)

- User Analytics deck averages now exclude the sample starter-deck copy automatically
  assigned during signup; total, legal, and Limited deck inventory counts remain unchanged.
- Added `GET /api/v1/community/preconstructed-decks` and the Community page's
  Preconstructed tab. Two deterministic migrations seed the four Skybound and four ERB
  starter decks as public Limited decks using set-number/non-foil printing resolution; the
  grouped response uses canonical friendly set names, preserves release and workbook order, and
  supports viewer favorites. The Skybound group also includes an ordered featured precon-upgrade
  recommendation row sourced from four stable public deck UUIDs.
- Added current-user-owned Saved Database Views under `/api/v1/saved-database-views`:
  strict versioned state, list/create/rename/pin/delete/bulk-delete, private
  cache headers, non-enumerating ownership failures, and a transactionally enforced
  50-view cap. Eligibility is temporarily ADMIN-only behind a replaceable centralized policy.
- Expanded the User Analytics Pacific-hour distribution with an all-known-history
  total and per-hour counts alongside the rolling 24-hour values. The paired radar
  series use the same aggregate, identifier-free telemetry table; the historical
  series begins with the V341/V342 known-last-login backfill and is not presented as
  complete pre-telemetry history.
- Expanded `GET /api/v1/admin/user-analytics` with unique standard accounts signed in
  during the last 24 hours, accounts inactive over 30 days (including never-signed-in
  accounts), cumulative API request share across Home/Database/Decks/Collection, and a
  privacy-bounded rolling-24-hour Pacific login distribution. Login-hour counters begin
  collecting after migration V340 and store no user identifiers; V341 seeds the first
  window's earlier hours from existing most-recent-login timestamps.
- Collection GET responses now emit `Cache-Control: private, max-age=0, must-revalidate`
  and `Vary: Cookie`, preventing CloudFront's default one-day TTL from restoring stale
  quantities after a successful collection mutation.
- Added `GET /api/v1/admin/biz-ops-dashboard` and the ADMIN-only `/admin/biz-ops`
  React view. The endpoint aggregates the committed AWS cost ledger into finalized invoice
  history, the current Cost Explorer estimate, year-to-date totals, service share, rolling
  twelve-month per-service invoice-row trends, and the latest weekly digest without exposing the source CSV or
  ingestion identifiers.
- Deck-card bulk replace accepts optional zero-based `displayOrder`, and deck detail reads return cards in that stable order. The deck editor uses it to persist character arrangement and keep every deck-preview carousel in character → location → battleground order.
- Added authenticated `POST /api/v1/feedback` for bug reports and feature/change
  requests. The endpoint validates and rate-limits submissions, sends them to
  `kyle@excelsior.cards` through SES with the authenticated sender's resolved
  display name and email address, and does not persist feedback text.
- Added `GET /api/v1/admin/user-analytics` and the admin-only `/admin/user-analytics`
  React view. The endpoint returns de-identified aggregate acquisition, authentication,
  login-recency, deck inventory, deck legality, per-user deck average, collection adoption,
  and average owned-card metrics; it excludes the community/tournament utility accounts.
- **`decks.is_valid` is now server-authoritative.** Deck card mutations
  (`POST`/`PUT`/`DELETE /api/v1/decks/:id/cards`) recompute the full deck legality
  via `DeckValidationService` and persist `is_valid`, and `importDeckFromExport`
  does the same. Previously the column was only written when a client explicitly
  PUT it, so deck tiles and the community feed (which filters `is_valid = true`)
  could disagree with the editor's live validation. Run
  `npm run backfill:deck-validity` once to correct historical rows.
- **Community decks, favorites, public profiles, display names** (V2 UI). New endpoints:
  `GET /api/v1/community/decks` (`?search=`), `GET /api/v1/users/:userId/public-decks`,
  `GET /api/v1/decks/favorites`, `POST`/`DELETE /api/v1/decks/:id/favorite`, and
  `POST /api/v1/users/display-name`. Deck metadata gains `is_private` (default `true`);
  `PUT /api/v1/decks/:id` accepts `is_private`. Community/profile/favorites list items add
  `ownerDisplayName` + `isFavorited`. Backed by migrations V284 (`users.display_name`),
  V285 (`decks.is_private`), V286 (`deck_favorites`), V287 (curated accounts public).
- `POST /api/v1/users/change-email` and `POST /api/v1/users/change-password` — self-service
  account updates for USER/ADMIN (session cookie). Google-linked accounts cannot
  change email (`GOOGLE_EMAIL_LOCKED`) or password (`GOOGLE_PASSWORD_LOCKED`).
- V1 envelopes now include backwards-compatible top-level `success` and optional
  `error` / `message` fields while preserving canonical `data`, `meta`, and
  `errors`. New clients should continue to use HTTP status and `errors[]`.
- `GET /api/v1/catalog/*` and `GET /api/v1/dbv/sets` now emit
  `Cache-Control: public, max-age=300, stale-while-revalidate=3600` plus a
  strong `ETag`, and honor `If-None-Match` for 304 responses. Meta envelope
  now includes `catalogDataVersion` and `catalogLastUpdated`. See
  [`API_V1_CATALOG_CACHING.md`](API_V1_CATALOG_CACHING.md).
- Optional `?since_version=<n>` query parameter accepted on catalog routes;
  currently a no-op filter but clients can use the response
  `meta.catalogDataVersion` to decide when to refresh.
- CloudFront now has ordered cache behaviors for `/api/v1/catalog/*` and
  `/api/v1/dbv/sets`. Authorization is not forwarded; responses are global.
- `compression` middleware added so responses negotiate gzip/brotli.
- OpenAPI 3 stub published at [`docs/openapi.yaml`](../openapi.yaml).
- New docs: [`API_V1_IMAGE_CONTRACT.md`](API_V1_IMAGE_CONTRACT.md),
  [`API_V1_ERROR_CATALOG.md`](API_V1_ERROR_CATALOG.md),
  [`API_V1_OPENAPI.md`](API_V1_OPENAPI.md), this changelog.

## Phase 2 (auth + audit)

- Refresh token flow: `POST /api/v1/auth/login` now optionally returns
  `refreshToken` and `refreshExpiresInSeconds`; access-token TTL reduced to
  `15m` (`JWT_ACCESS_TTL`). `POST /api/v1/auth/refresh` rotates tokens;
  `POST /api/v1/auth/logout` revokes the supplied refresh token. Reuse of a
  rotated refresh token revokes the entire family.
- Bearer JWT is now accepted on `/api/v1/decks/*` and
  `/api/v1/collections/*` in addition to session cookies. Kill switch:
  `DISABLE_BEARER_DECKS_COLLECTIONS=1`.
- New `api_access_log` table + async middleware logs every `/api/v1/*`
  request's `user_id`, `route_key`, `method`, `status`, `ip`, `request_id`,
  `ts`. Retention: 90 days.
- Zod validation on v1 request bodies via `parseV1Body`; errors come back
  as `VALIDATION_ERROR` with `errors[].field`.
- Consolidated per-user / per-IP rate limits with `X-RateLimit-*` headers
  and `RATE_LIMITED` 429s. Kill switches: `DISABLE_V1_RATE_LIMIT=1`,
  `LEGACY_RATE_LIMITS=1`.

## Phase 1 (security hygiene)

- CORS allowlist middleware (`ALLOWED_ORIGINS` env).
- `helmet` security headers (HSTS, `X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options`). CSP intentionally omitted.
- Request-ID middleware: echoes or generates `X-Request-Id`.
- Structured logging via `pino` / `pino-http` with `request_id`.
- `/health` split into `/health/live` (public, minimal) and `/health/deep`
  (ADMIN-only). Backward-compatible `/health` route preserved.
- RDS security group closed: PostgreSQL ingress restricted to the EC2
  application SG and an optional `var.rds_admin_cidrs` allowlist.
- Application secrets moved to SSM Parameter Store where feasible.

## Phase 0 (HTTPS)

- ACM certificate for `excelsior.cards` + `www.excelsior.cards` in
  `us-east-1`, wired into CloudFront.
- CloudFront `viewer_protocol_policy = "redirect-to-https"`.
- `origin.excelsior.cards` subdomain added to break the CloudFront DNS
  loop.
- Express trusts the proxy, session cookies are `Secure` +
  `SameSite=strict` in production.
- `APP_CDN_BASE` is HTTPS.

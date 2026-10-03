# HTTP API documentation

This document describes the **Excelsior / Overpower Deckbuilder** backend HTTP surface implemented in Express (`src/routes/`, registered from `src/routes/index.ts`). It is intended for developers integrating with or extending the server.

**Legacy contract:** this file documents routes that use the typical `{ success, data, error }` JSON shape and **session cookie** (`sessionId`) authentication unless noted otherwise.

**Versioned API (`/api/v1`):** the separate **[API_V1.md](API_V1.md)** document describes the Bearer JWT API, `{ data, meta, errors }` envelope, and per-endpoint examples. Use it for all new v1 clients.

**Migration:** track route-by-route work in **[API_MIGRATION_CHECKLIST.md](API_MIGRATION_CHECKLIST.md)**. Architecture and layering rules are in **[MIGRATION_ARCHITECTURE.md](MIGRATION_ARCHITECTURE.md)**.

**Related code:** route registration order matches `registerRoutes()` in `src/routes/index.ts`. The application composition root is `src/index.ts`. v1 routes are registered via `registerApiV1Routes()` from `src/api/http/registerApiV1Routes.ts`.

---

## Table of contents

1. [General conventions](#general-conventions)
2. [Authentication and sessions](#authentication-and-sessions)
3. [Static assets and health](#static-assets-and-health)
4. [Auth and client config](#auth-and-client-config)
5. [Card catalog and backgrounds](#card-catalog-and-backgrounds)
6. [Users, admin, and debug](#users-admin-and-debug)
7. [Decks (database-backed)](#decks-database-backed)
8. [Guest decks (session memory)](#guest-decks-session-memory)
9. [Collections](#collections)
10. [Sets](#sets)
11. [HTML pages (SPA shell)](#html-pages-spa-shell)
12. [Integration test server](#integration-test-server)
13. [Route index](#route-index)

---

## General conventions

### Base URL

- **Local development:** `http://localhost:8085` (unless `PORT` is set).

### Content type

- Request bodies for JSON APIs: `Content-Type: application/json`.
- Responses are JSON unless noted (HTML, JavaScript, redirects, `304` with empty body).

### Common JSON shapes

**Success (typical):**

```json
{ "success": true, "data": {} }
```

**Error (typical):**

```json
{ "success": false, "error": "Human-readable message" }
```

Some endpoints return additional fields (for example `validationErrors`, `message`, `details`).

### HTTP status codes (typical)

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 304 | Not Modified (`ETag` match — see `GET /api/v1/decks`) |
| 400 | Bad request / validation error |
| 401 | Not authenticated / invalid session |
| 403 | Forbidden (wrong role, not owner, guest blocked from mutation, read-only mode) |
| 404 | Not found |
| 409 | Conflict (e.g. duplicate username) |
| 429 | Rate limited |
| 500 | Server error |
| 501 | Not implemented |
| 503 | Unavailable (e.g. health critical failure, Google auth not configured) |

### Read-only mode

Some mutating deck operations honor read-only mode when indicated by query `?readonly=true`, URL param `readonly=true`, or header `x-readonly-mode: true`. The server responds with **403** and a message that the operation is not allowed in read-only mode. See `src/routes/helpers.ts`.

### Rate limiting

Per-IP rate limits apply to several deck mutations (creation, updates, card changes, UI preferences). On exceed: **429** with `success: false` and a message. See `checkRateLimit` in `src/routes/helpers.ts` (default window and max requests are defined there).

---

## Authentication and sessions

### Session cookie

- **Name:** `sessionId`
- **Attributes (default, HTTP):** `httpOnly`, `sameSite: 'lax'`, `secure: false`, **max age ~2 hours**
- **Attributes when `COOKIE_SECURE=true` (HTTPS opt-in):** `httpOnly`, `sameSite: 'strict'`, `secure: true`
- **Deterministic:** attributes depend only on `COOKIE_SECURE` (not on `req.secure`/`X-Forwarded-Proto`), so a proxy or a browser pinned to HTTPS by a stale HSTS header can never cause a `Secure` cookie to be dropped on the HTTP site.
- **Rolling:** the cookie is re-issued on every authenticated request, so the browser cookie's max age tracks the server-side sliding 2-hour session (active users are not logged out at a fixed 2-hour cap).

Successful login, signup, or Google sign-in sets this cookie. Send it on subsequent requests (`credentials: 'include'` in `fetch`, or browser same-origin navigation).

### Roles

Users have a `role` of `GUEST`, `USER`, or `ADMIN` (see `src/types/index.ts`).

- **GUEST:** May use guest-deck APIs and read-only deck APIs where allowed; **cannot** create/update/delete database-backed decks or mutate their cards (blocked with **403** on those routes).
- **USER / ADMIN:** Full deck and collection access per endpoint rules.
- **ADMIN:** Additional endpoints (user list, cache clear, database status).

---

## Static assets and health

| Method | Path | Source file | Description |
|--------|------|-------------|-------------|
| * | `/src/resources/*` | `src/routes/static-health.routes.ts` | Static files from repo `src/resources` (card images, UI icons, backgrounds) |
| * | `/src/resources/cards/images/*` | `src/middleware/setup.ts` | Narrower mount for card images (registered before full tree) |
| * | `/src/resources/images/*` | `src/middleware/setup.ts` | Narrower mount for general images |
| * | `/assets/*` (when built) | `src/routes/static-health.routes.ts` | Hashed Vite build output from `frontend/dist/` (only when `frontend/dist/index.html` exists) |

### `GET /health/ready`

**File:** `src/routes/static-health.routes.ts`

Readiness probe for deploy gates — live payload plus a single `SELECT 1` DB ping (no table scans). Returns **200** with `status: OK` and `database.status: OK` when RDS is reachable; **200** with `DEGRADED` when the DB ping fails. EC2 blue-green deploy polls this endpoint instead of `/health`.

### `GET /health` (alias: `GET /health/deep`)

**File:** `src/routes/static-health.routes.ts`

Full deep health check. Returns a large JSON payload: `status` (`OK`, `DEGRADED`, or `ERROR`), `timestamp`, `uptime`, `version`, `environment`, `git` (commit metadata), `resources` (memory/CPU), `database` (connectivity, counts, Flyway latest migration), and `latency`. **503** when `status === 'ERROR'`; degraded DB may still return **200** with `DEGRADED`.

`GET /health/deep` is a registered alias for the same handler — use it when you want a semantically explicit deep-check URL (e.g. Kubernetes readiness probes).

### `GET /health/live`

**File:** `src/routes/static-health.routes.ts`

Lightweight liveness probe — **no database query**. Always returns `{ "status": "OK" }` with **200** while the Node process is alive. Use for Kubernetes/ECS liveness probes where you do not want DB latency in the path.

**Sample (truncated):**

```http
GET /health HTTP/1.1
Host: localhost:8085
```

```json
{
  "status": "OK",
  "timestamp": "2026-04-03T12:00:00.000Z",
  "uptime": 123.45,
  "version": "1.0.0",
  "environment": "development",
  "git": {
    "commit": "...",
    "shortCommit": "abc1234",
    "branch": "main",
    "commitMessage": "...",
    "commitAuthor": "...",
    "commitEmail": "...",
    "commitDate": "..."
  },
  "resources": {
    "memory": { "rss": "120MB", "heapTotal": "40MB", "heapUsed": "35MB", "external": "2MB" },
    "cpu": { "platform": "darwin", "arch": "arm64", "nodeVersion": "v20.x" }
  },
  "database": {
    "status": "OK",
    "latency": "5ms",
    "connection": "Active",
    "stats": {
      "totalUsers": 10,
      "totalDecks": 50,
      "totalDeckCards": 500,
      "totalCharacters": 200,
      "totalSpecialCards": 100,
      "totalPowerCards": 300
    },
    "migrations": { "latest": { "version": "42", "description": "...", "success": true } }
  },
  "latency": "12ms"
}
```

---

## Auth and client config

**File:** `src/routes/auth.routes.ts` (handlers delegate to `AuthenticationService` in `src/services/AuthenticationService.ts`).

### `POST /api/auth/login`

**Body:**

```json
{ "username": "kyle", "password": "test" }
```

**Response 200:** Sets `sessionId` cookie.

```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "username": "kyle",
    "email": "user@example.com",
    "role": "USER",
    "authProvider": "password"
  }
}
```

**Response 400:** missing fields. **401:** invalid credentials.

### `POST /api/auth/signup`

**Body:**

```json
{ "username": "newuser", "email": "newuser@example.com", "password": "secret" }
```

**Response 201:** Session cookie set; body same shape as login (`userId`, `username`, `role`). **400:** validation. **409:** username or email exists. **429:** signup rate limit.

### `POST /api/auth/google/preview`

**Body:**

```json
{ "idToken": "<Firebase ID token>" }
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "action": "login",
    "profile": { "email": "user@example.com", "name": "Display Name", "username": "Display Name" }
  }
}
```

`action` is `login` for existing users (by Firebase UID or linked email) or `register` when a new account would be created. Does not create a session or user.

### `POST /api/auth/google`

**Body:**

```json
{ "idToken": "<Firebase ID token>", "confirmRegistration": true }
```

`confirmRegistration: true` is **required** when `action` would be `register` (new Google user). Existing users may omit it.

**Response 200:** Same `data` shape as login. **400:** missing token. **401:** invalid token. **403:** new user without confirmation. **503:** Firebase not configured. **429:** too many new accounts (IP-based).

### `POST /api/auth/logout`

**Response 200:**

```json
{ "success": true, "message": "Logged out successfully" }
```

Clears server session and `sessionId` cookie.

### `GET /api/auth/me`

**Auth:** Session cookie.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "kyle",
    "email": "kyle@example.com",
    "role": "USER",
    "authProvider": "password",
    "lastLoginAt": "2026-04-03T10:00:00.000Z"
  }
}
```

**401:** No or invalid session.

### `GET /api/config/firebase`

Public. **Response 200:**

```json
{
  "apiKey": "...",
  "authDomain": "...",
  "projectId": "...",
  "appId": "..."
}
```

Values come from environment variables (`FIREBASE_*`).

### `GET /api/v1/config/app`

JSON CDN and app config for the v2 SPA. **Prefer this** over any legacy config endpoints. See [API_V1.md](API_V1.md).

---

## Card catalog and backgrounds

Catalog **list** and **foil map** reads are **`/api/v1/catalog/*`** only ([`src/api/http/dbv-catalog.http.ts`](src/api/http/dbv-catalog.http.ts), [`src/api/services/catalogService.ts`](src/api/services/catalogService.ts)). Handlers use **`CatalogService`** only; they do **not** call **`CardRepository`** / **`FoilCardMapRepository`** directly.

**Removed:** diagnostic **`GET /test`** (counts/stats JSON). **Removed:** **`GET /api/characters`**, **`GET /api/locations`**, **`GET /api/special-cards`**, **`GET /api/missions`**, **`GET /api/events`**, **`GET /api/aspects`**, **`GET /api/advanced-universe`**, **`GET /api/teamwork`**, **`GET /api/ally-universe`**, **`GET /api/training`**, **`GET /api/basic-universe`**, **`GET /api/power-cards`** (list), **`GET /api/foil-card-map`** — use **`GET /api/v1/catalog/...`** counterparts ([API_V1.md](API_V1.md)); those legacy URLs are **not** registered (expect **404**).

**Removed:** **`GET /api/deck-backgrounds`** — use **`GET /api/v1/dbv/deck-backgrounds`** ([API_V1.md](API_V1.md)).

**Authentication (v1 only):** All **`GET /api/v1/catalog/*`**, **`GET /api/v1/dbv/sets`**, and **`GET /api/v1/dbv/deck-backgrounds`** require a **valid session** (`Cookie: sessionId=...` after `POST /api/auth/login`) **or** a **Bearer access token** (`Authorization: Bearer …` after `POST /api/v1/auth/login`). Unauthenticated requests receive **401** with the v1 envelope `{ "data": null, "meta": {}, "errors": [{ "code": "UNAUTHORIZED", "message": "..." }] }`. **GUEST** and **USER** (and other roles) all receive catalog JSON once authenticated; role does not gate catalog reads.

Responses use the **v1** envelope — see [API_V1.md](API_V1.md) **DBV catalog** and **DBV support**.

**Sample** (legacy `{ success, data }` applies only to remaining legacy card JSON elsewhere; catalog lists and foil map are v1-only — see [API_V1.md](API_V1.md)).

### `GET /api/advanced-universe` (removed)

The legacy **list** endpoint is **not** registered. Use **`GET /api/v1/catalog/advanced-universe`** — see [API_V1.md](API_V1.md).

### `GET /api/teamwork` (removed)

The legacy **list** endpoint is **not** registered. Use **`GET /api/v1/catalog/teamwork`** — see [API_V1.md](API_V1.md).

### `GET /api/ally-universe` (removed)

The legacy **list** endpoint is **not** registered. Use **`GET /api/v1/catalog/ally-universe`** — see [API_V1.md](API_V1.md).

### `GET /api/training` (removed)

The legacy **list** endpoint is **not** registered. Use **`GET /api/v1/catalog/training`** — see [API_V1.md](API_V1.md).

### `GET /api/basic-universe` (removed)

The legacy **list** endpoint is **not** registered. Use **`GET /api/v1/catalog/basic-universe`** — see [API_V1.md](API_V1.md).

### `GET /api/power-cards` (removed)

The legacy **list** endpoint is **not** registered. Use **`GET /api/v1/catalog/power-cards`** — see [API_V1.md](API_V1.md).

### `GET /api/aspects` (removed)

The legacy **list** endpoint is **not** registered. Use **`GET /api/v1/catalog/aspects`** — see [API_V1.md](API_V1.md).

---

## Users, admin, and debug

**File:** `src/routes/users-debug.routes.ts` (legacy **change-password** only). **Admin list/create, debug cache clears, and database status** are **`/api/v1/admin/...`** — see [API_V1.md](API_V1.md) **Admin**.

### `GET /api/users` / `POST /api/users` (removed)

**Removed:** use **`GET /api/v1/admin/users`** and **`POST /api/v1/admin/users`** ([API_V1.md](API_V1.md)). Legacy URLs are **not** registered (expect **404**). Responses use the **v1** envelope (`data`, `meta`, `errors`); **ADMIN** session required.

### `GET /api/debug/clear-cache` / `GET /api/debug/clear-card-cache` (removed)

**Removed:** use **`GET /api/v1/admin/debug/clear-cache`** and **`GET /api/v1/admin/debug/clear-card-cache`**. Legacy URLs are **not** registered.

### `GET /api/database/status` (removed)

**Removed:** use **`GET /api/v1/admin/database/status`**. The legacy URL is **not** registered.

### `POST /api/users/change-password`

**Auth:** `USER` or `ADMIN` only.

**Body:**

```json
{ "newPassword": "newsecret" }
```

**Response 200:** `{ "success": true, "message": "Password updated" }`

---

## Decks (database-backed)

### `GET /api/decks` (removed)

**Removed:** **`GET /api/decks`** — use **`GET /api/v1/decks`** ([API_V1.md](API_V1.md)). The legacy URL is **not** registered (expect **404**).

### Deck CRUD, cards, and UI preferences

**v1:** `src/api/http/decks.http.ts` (+ services under `src/api/services/`). Legacy **`deck-api.routes.ts`** is **removed** — there is no `src/routes/deck-api.routes.ts`.

Unless noted, **auth required**. Guest users receive **403** on mutations that change DB decks (create, update, delete, card POST/PUT/DELETE, UI prefs PUT).

#### `POST /api/decks` (removed)

**Removed:** use **`POST /api/v1/decks`** ([API_V1.md](API_V1.md)). The legacy URL is **not** registered (expect **404**).

#### `POST /api/decks/validate` (removed)

**Removed:** use **`POST /api/v1/decks/validate`** ([API_V1.md](API_V1.md)). The legacy URL is **not** registered (expect **404**).

#### `GET /api/decks/:id`, `GET /api/decks/:id/full` (compatibility)

**Compatibility only:** **`GET /api/decks/:id`** and **`GET /api/decks/:id/full`** are registered for cached clients; responses use the **same v1 JSON envelope** as **`GET /api/v1/decks/:id`** / **`/full`** ([API_V1.md](API_V1.md)) and send **`Cache-Control: no-store`** so public deck state is never served from a stale edge snapshot. Implementation: **[`legacyDeckReadCompat.http.ts`](src/api/http/legacyDeckReadCompat.http.ts)**.

**Still removed (404):** **`PUT /api/decks/:id`**, **`DELETE /api/decks/:id`** — use **`PUT` / `DELETE`** **`/api/v1/decks/:id`**.

`/full` uses a heavier repository load (`getDeckSummaryWithAllCards`) for full card hydration. **PUT** is **owner only**; success **`data`** includes updated **`metadata`** and **`cards: []`**. **DELETE** success **`data`** is **`{ "message": "Deck deleted successfully" }`** in the v1 envelope.

#### `GET /api/decks/:id/cards`, `POST /api/decks/:id/cards`, `PUT /api/decks/:id/cards`, `DELETE /api/decks/:id/cards` (removed)

**Removed:** use **`GET` / `POST` / `PUT` / `DELETE`** **`/api/v1/decks/:id/cards`** ([API_V1.md](API_V1.md)). Legacy URLs are **not** registered (expect **404**).

#### `GET /api/deck-stats` (removed)

**Removed:** use **`GET /api/v1/decks/stats`** ([API_V1.md](API_V1.md)). The legacy URL is **not** registered (expect **404**).

#### `GET /api/decks/:id/ui-preferences` / `PUT /api/decks/:id/ui-preferences` (removed)

**Removed:** use **`GET /api/v1/decks/:id/ui-preferences`** and **`PUT /api/v1/decks/:id/ui-preferences`** ([API_V1.md](API_V1.md)). Legacy URLs are **not** registered (expect **404**).

---

## Guest decks (session memory) — removed legacy JSON

**Removed:** **`/api/guest/decks`** and related paths are **not** registered. Use **`/api/v1/guest/decks...`** with the **v1 envelope** — see **[API_V1.md](API_V1.md)** (Guest decks) and implementation **[`guest-decks.http.ts`](src/api/http/guest-decks.http.ts)** + **[`GuestDeckService`](src/api/services/guestDeckService.ts)**.

**Auth:** **GUEST** role + **session cookie** (same **`authenticateUser`** as other deck routes) + **`sessionId`** cookie for in-memory guest persistence. Non-guests → **403** v1 `errors` (`GUEST_ONLY`). Missing **`sessionId`** → **401** (`SESSION_REQUIRED`).

---

## Collections

**Implementation:** [`collections.http.ts`](src/api/http/collections.http.ts) — all collection JSON endpoints are **`/api/v1/collections/me...`** ([API_V1.md](API_V1.md)). **No** legacy **`/api/collections/me/*`** routes are registered (expect **404**).

All v1 collection routes require authentication (session cookie).

**Valid `cardType` values** for collection card mutations:  
`character`, `special`, `power`, `location`, `mission`, `event`, `aspect`, `advanced_universe`, `teamwork`, `ally_universe`, `training`, `basic_universe` (see `isValidCollectionCardType` in [`src/validation/collectionCardType.ts`](src/validation/collectionCardType.ts), re-exported from `src/routes/helpers.ts`).

### Legacy `/api/collections/me/*` (removed)

Use **`GET /api/v1/collections/me`**, **`/api/v1/collections/me/cards`**, **`/api/v1/collections/me/history`**, and the card mutation paths documented in [API_V1.md](API_V1.md).

---

## Sets (removed)

**Removed:** **`GET /api/sets`** — use **`GET /api/v1/dbv/sets`** ([API_V1.md](API_V1.md)). The legacy URL is **not** registered (expect **404**).

---

## HTML pages (SPA shell)

**File:** `src/routes/pages.routes.ts`

These return **`frontend/dist/index.html`** (v2 React SPA shell) with no-cache headers except where noted.

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/` | No | Home |
| GET | `/logout` | No | Clears session server-side and cookie, **redirects** to `/` |
| GET | `/users/:userId/decks` | Yes | **403 JSON** if not own user id and not guest access |
| GET | `/users/:userId/decks/:deckId` | No | Deck editor shell (client loads data via API) |
| GET | `/users/:userId/collection` | Yes | Collection page |
| GET | `/data` | No | Database / card DB view |

---

## Integration test server

**Files:** `src/test-server/bootstrap.ts`, `src/test-server/testOnlyRoutes.ts`

The integration test app calls the same `registerRoutes()` but may register **additional** or **overriding** routes first:

- Component static paths: `/components/globalNav.html`, `.css`, `.js`
- Lenient HTML for `/users/:userId/decks` and `/users/:userId/decks/:deckId` (wins over `pages.routes` on that server)
- `GET /users/:userId/decks/:deckId/edit` (HTML)
- `GET /deck-editor/:deckId` (minimal test HTML)
- Fallback **404** JSON for unknown routes

Use this section when reading integration tests, not as part of the primary production API contract.

---

## Route index

Quick lookup: **method**, **path**, **source file**.

| Method | Path | File |
|--------|------|------|
| * | `/src/resources` (+ setup mounts), `/assets/*` when SPA built | `static-health.routes.ts`, `middleware/setup.ts` |
| GET | `/health`, `/health/deep` (deep health), `/health/live` (liveness, no DB), `/health/ready` (readiness, SELECT 1) | `static-health.routes.ts` |
| POST | `/api/auth/login`, `/signup`, `/google`, `/logout` | `auth.routes.ts` |
| GET | `/api/auth/me`, `/api/config/firebase`, `/api/v1/config/app` (JSON CDN config) | `auth.routes.ts` |
| POST | `/api/users/change-password` | `users-debug.routes.ts` |
| GET | ~~`/api/decks`~~ (removed) | *use* **`GET /api/v1/decks`** · [`decks.http.ts`](src/api/http/decks.http.ts) |
| POST/GET/PUT/DELETE | ~~`/api/guest/decks`~~ (removed) | *use* **`/api/v1/guest/decks...`** · [`guest-decks.http.ts`](src/api/http/guest-decks.http.ts) |
| GET | **`/api/decks/:id`**, **`/api/decks/:id/full`** (compat — v1 envelope; **`PUT`/`DELETE`** still v1 only) | [`legacyDeckReadCompat.http.ts`](src/api/http/legacyDeckReadCompat.http.ts) |
| POST/GET/PUT/DELETE | ~~`/api/decks/:id/cards`~~, ~~`/api/deck-stats`~~, ~~`/api/decks/:id/ui-preferences`~~ (removed — **`/api/v1/decks/...`**, **`/api/v1/decks/stats`**; create + validate: **`/api/v1/decks`**, **`/api/v1/decks/validate`** — see [API_V1.md](API_V1.md)) | *use v1* · [`decks.http.ts`](src/api/http/decks.http.ts) |
| * | Legacy `/api/collections/me/*` (removed — use [API_V1.md](API_V1.md) **`/api/v1/collections/me...`**) | [`collections.http.ts`](src/api/http/collections.http.ts) |
| GET | `/`, `/logout`, `/users/...`, `/data` | `pages.routes.ts` |

### API v1 (`/api/v1`)

Full contract, examples, and envelopes: **[API_V1.md](API_V1.md)**. Registration: [`src/api/http/registerApiV1Routes.ts`](src/api/http/registerApiV1Routes.ts) (called from `src/index.ts` and `src/test-server/bootstrap.ts`).

| Method | Path | HTTP module |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | `src/api/http/auth.http.ts` |
| POST | `/api/v1/auth/refresh` | `src/api/http/auth.http.ts` |
| GET | `/api/v1/auth/me` | `src/api/http/auth.http.ts` |
| POST | `/api/v1/auth/logout` | `src/api/http/auth.http.ts` |
| GET | `/api/v1/catalog/characters`, `/api/v1/catalog/locations`, `/api/v1/catalog/battlegrounds`, `/api/v1/catalog/special-cards`, `/api/v1/catalog/missions`, `/api/v1/catalog/events`, `/api/v1/catalog/aspects`, `/api/v1/catalog/advanced-universe`, `/api/v1/catalog/teamwork`, `/api/v1/catalog/ally-universe`, `/api/v1/catalog/training`, `/api/v1/catalog/basic-universe`, `/api/v1/catalog/power-cards`, `/api/v1/catalog/foil-card-map` | `src/api/http/dbv-catalog.http.ts` |
| GET | `/api/v1/dbv/sets`, `/api/v1/dbv/deck-backgrounds` | `src/api/http/dbv-support.http.ts` |
| GET | `/api/v1/collections/me`, `/api/v1/collections/me/cards`, `/api/v1/collections/me/history` | `src/api/http/collections.http.ts` |
| POST | `/api/v1/collections/me/cards`, `/api/v1/collections/me/cards/remove-one` | `src/api/http/collections.http.ts` |
| PUT | `/api/v1/collections/me/cards/:cardId` | `src/api/http/collections.http.ts` |
| DELETE | `/api/v1/collections/me/cards/:cardId` | `src/api/http/collections.http.ts` |
| GET/POST | `/api/v1/guest/decks` | `src/api/http/guest-decks.http.ts` |
| GET/PUT/DELETE | `/api/v1/guest/decks/:id` | `src/api/http/guest-decks.http.ts` |
| PUT/POST | `/api/v1/guest/decks/:id/cards` | `src/api/http/guest-decks.http.ts` |
| GET | `/api/v1/admin/users`, `/api/v1/admin/user-analytics`, `/api/v1/admin/biz-ops-dashboard`, `/api/v1/admin/database/status`, `/api/v1/admin/debug/clear-cache`, `/api/v1/admin/debug/clear-card-cache` | `src/api/http/admin.http.ts` |
| POST | `/api/v1/admin/users` | `src/api/http/admin.http.ts` |
| POST | `/api/v1/feedback` | `src/api/http/feedback.http.ts` |

---

## Maintaining this document

When adding or changing **legacy** routes, update the corresponding `src/routes/*.ts` file and adjust this document so samples and paths stay accurate. Route registration order is defined in `src/routes/index.ts`.

When adding or changing **`/api/v1`** routes, update **[API_V1.md](API_V1.md)** in the same change and tick **[API_MIGRATION_CHECKLIST.md](API_MIGRATION_CHECKLIST.md)**.

When a route’s implementation moves into **`src/api/`** (encapsulated API layer), update the route’s section and the [Route index](#route-index) to reference both the route file and the API module. Agent workflow: `.cursor/skills/api-layer-migration/SKILL.md`.

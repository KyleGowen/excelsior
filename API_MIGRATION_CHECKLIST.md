# API migration checklist (Excelsior `/api/v1`)

Track migration from legacy Express routes (`API_DOCUMENTATION.md`) to the encapsulated v1 API (`API_V1.md`), services under `src/api/services/`, and HTTP routers under `src/api/http/*.http.ts`.

**Related docs**

- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) — legacy HTTP contract (`{ success, data, error }`, session cookies).
- [API_V1.md](API_V1.md) — versioned contract (`{ data, meta, errors }`, Bearer JWT).
- [MIGRATION_ARCHITECTURE.md](MIGRATION_ARCHITECTURE.md) — layers, `/admin` rules, testing.
- Agent workflow: [.cursor/skills/api-layer-migration/SKILL.md](.cursor/skills/api-layer-migration/SKILL.md)
- **Integration test coverage:** [`tests/integration/api-v1/MIGRATED_ROUTES_COVERAGE.md`](tests/integration/api-v1/MIGRATED_ROUTES_COVERAGE.md) — one row per `/api/v1` route with a test reference. Keep in sync: when you tick a route as migrated here, add a row there too.

**Per-route columns**


| Column      | Meaning                                                                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Legacy path | Current documented path                                                                                                                       |
| v1 path     | Target under `/api/v1/...`                                                                                                                    |
| Migrated    | Done when **v1 route exists**, **legacy handler removed**, and **callers** (app + tests + Postman) use `**/api/v1/...`** with the v1 envelope |
| API module  | Service + DTO paths                                                                                                                           |
| HTTP unit   | Full unit tests for the `*.http.ts` file                                                                                                      |
| ≥1 int      | At least one integration test for that HTTP module                                                                                            |
| API_V1.md   | Subsection added/updated                                                                                                                      |


---

## P0 — Database View (DBV) backing APIs


| Legacy path                | v1 path (proposed)                    | Migrated | API module                               | HTTP unit | ≥1 int | API_V1.md |
| -------------------------- | ------------------------------------- | -------- | ---------------------------------------- | --------- | ------ | --------- |
| GET /api/characters        | GET /api/v1/catalog/characters        | [x]      | `CatalogService` + `dbv-catalog.http.ts` | [x]       | [x]    | [x]       |
| GET /api/locations         | GET /api/v1/catalog/locations         | [x]      | `CatalogService` + `dbv-catalog.http.ts` | [x]       | [x]    | [x]       |
| GET /api/special-cards     | GET /api/v1/catalog/special-cards     | [x]      | `CatalogService` + `dbv-catalog.http.ts` | [x]       | [x]    | [x]       |
| GET /api/missions          | GET /api/v1/catalog/missions          | [x]      | `CatalogService` + `dbv-catalog.http.ts` | [x]       | [x]    | [x]       |
| GET /api/events            | GET /api/v1/catalog/events            | [x]      | `CatalogService` + `dbv-catalog.http.ts` | [x]       | [x]    | [x]       |
| GET /api/aspects           | GET /api/v1/catalog/aspects           | [x]      | `CatalogService` + `dbv-catalog.http.ts` | [x]       | [x]    | [x]       |
| GET /api/advanced-universe | GET /api/v1/catalog/advanced-universe | [x]      | `CatalogService` + `dbv-catalog.http.ts` | [x]       | [x]    | [x]       |
| GET /api/teamwork          | GET /api/v1/catalog/teamwork          | [x]      | `CatalogService` + `dbv-catalog.http.ts` | [x]       | [x]    | [x]       |
| GET /api/ally-universe     | GET /api/v1/catalog/ally-universe     | [x]      | `CatalogService` + `dbv-catalog.http.ts` | [x]       | [x]    | [x]       |
| GET /api/training          | GET /api/v1/catalog/training          | [x]      | `CatalogService` + `dbv-catalog.http.ts` | [x]       | [x]    | [x]       |
| GET /api/basic-universe    | GET /api/v1/catalog/basic-universe    | [x]      | `CatalogService` + `dbv-catalog.http.ts` | [x]       | [x]    | [x]       |
| GET /api/power-cards       | GET /api/v1/catalog/power-cards       | [x]      | `CatalogService` + `dbv-catalog.http.ts` | [x]       | [x]    | [x]       |
| GET /api/foil-card-map     | GET /api/v1/catalog/foil-card-map     | [x]      | `CatalogService` + `dbv-catalog.http.ts` | [x]       | [x]    | [x]       |
| GET /api/sets              | GET /api/v1/dbv/sets                  | [x]      | `DbvSupportService` + `dbv-support.http.ts` | [x]       | [x]    | [x]       |
| GET /api/deck-backgrounds  | GET /api/v1/dbv/deck-backgrounds      | [x]      | `DeckBackgroundService` + `dbv-support.http.ts` | [x]       | [x]    | [x]       |
| ~~GET /test~~ (diagnostic; checklist formerly said `/api/test`) | *removed — not migrated* | n/a | — | — | — | — |


---

## P1 — Auth (API clients)


| Legacy path           | v1 path                  | Migrated | API module                           | HTTP unit | ≥1 int | API_V1.md |
| --------------------- | ------------------------ | -------- | ------------------------------------ | --------- | ------ | --------- |
| POST /api/auth/login  | POST /api/v1/auth/login  | [x]      | `auth.http.ts` + `V1JwtTokenService` | [x]       | [x]    | [x]       |
| GET /api/auth/me      | GET /api/v1/auth/me      | [x]      | `auth.http.ts`                       | [x]       | [x]    | [x]       |
| POST /api/auth/logout | POST /api/v1/auth/logout | [x]      | `auth.http.ts`                       | [x]       | [x]    | [x]       |


---

## P2 — Decks (database-backed)

**Scope:** Authenticated user decks in PostgreSQL; **GUEST** gets **403** on DB deck mutations (same as legacy). **Source:** `API_DOCUMENTATION.md` (Decks). **P2a list:** [`decks.http.ts`](src/api/http/decks.http.ts) + [`deckListService.ts`](src/api/services/deckListService.ts).

**v1 prefix:** `/api/v1/decks…`.

**Auth (Phase 2, 2026-04):** accepts **session cookie OR Bearer JWT** via `createV1SessionOrBearerAuthMiddleware`. Kill switch `DISABLE_BEARER_DECKS_COLLECTIONS=1` restores session-only. See [`docs/current/API_V1_AUTH_REFRESH.md`](docs/current/API_V1_AUTH_REFRESH.md).

### P2a — Deck list (ETag)

| Legacy path     | v1 path (proposed) | Migrated | API module | HTTP unit | ≥1 int | API_V1.md |
| --------------- | ------------------ | -------- | ---------- | --------- | ------ | --------- |
| GET /api/decks  | GET /api/v1/decks  | [x]      | `DeckListService` + `decks.http.ts` | [x]       | [x]    | [x]       |

### P2b — Create + validate

| Legacy path              | v1 path (proposed)           | Migrated | API module | HTTP unit | ≥1 int | API_V1.md |
| ------------------------ | ---------------------------- | -------- | ---------- | --------- | ------ | --------- |
| POST /api/decks          | POST /api/v1/decks           | [x]      | `DeckWriteService` + `decks.http.ts` | [x]       | [x]    | [x]       |
| POST /api/decks/validate | POST /api/v1/decks/validate  | [x]      | `DeckWriteService` + `decks.http.ts` | [x]       | [x]    | [x]       |

### P2c — Single deck (metadata + delete)

| Legacy path                 | v1 path (proposed)              | Migrated | API module | HTTP unit | ≥1 int | API_V1.md |
| --------------------------- | ------------------------------- | -------- | ---------- | --------- | ------ | --------- |
| GET /api/decks/:id          | GET /api/v1/decks/:id           | [x]      | `DeckDetailService` + `decks.http.ts` | [x]       | [x]    | [x]       |
| GET /api/decks/:id/full     | GET /api/v1/decks/:id/full      | [x]      | `DeckDetailService` + `decks.http.ts` | [x]       | [x]    | [x]       |
| PUT /api/decks/:id          | PUT /api/v1/decks/:id           | [x]      | `DeckDetailService` + `decks.http.ts` | [x]       | [x]    | [x]       |
| DELETE /api/decks/:id       | DELETE /api/v1/decks/:id        | [x]      | `DeckDetailService` + `decks.http.ts` | [x]       | [x]    | [x]       |

### P2d — Deck cards

| Legacy path                   | v1 path (proposed)                | Migrated | API module | HTTP unit | ≥1 int | API_V1.md |
| ----------------------------- | --------------------------------- | -------- | ---------- | --------- | ------ | --------- |
| GET /api/decks/:id/cards      | GET /api/v1/decks/:id/cards       | [x]      | `DeckCardsService` + `decks.http.ts` | [x]       | [x]    | [x]       |
| POST /api/decks/:id/cards     | POST /api/v1/decks/:id/cards      | [x]      | `DeckCardsService` + `decks.http.ts` | [x]       | [x]    | [x]       |
| PUT /api/decks/:id/cards      | PUT /api/v1/decks/:id/cards       | [x]      | `DeckCardsService` + `decks.http.ts` | [x]       | [x]    | [x]       |
| DELETE /api/decks/:id/cards   | DELETE /api/v1/decks/:id/cards    | [x]      | `DeckCardsService` + `decks.http.ts` | [x]       | [x]    | [x]       |

### P2e — Aggregate deck stats

| Legacy path        | v1 path (proposed)        | Migrated | API module | HTTP unit | ≥1 int | API_V1.md |
| ------------------ | ------------------------- | -------- | ---------- | --------- | ------ | --------- |
| GET /api/deck-stats | GET /api/v1/decks/stats   | [x]      | `DeckStatsService` + `decks.http.ts` | [x]       | [x]    | [x]       |

### P2f — Deck UI preferences

| Legacy path                         | v1 path (proposed)                         | Migrated | API module | HTTP unit | ≥1 int | API_V1.md |
| ----------------------------------- | ------------------------------------------ | -------- | ---------- | --------- | ------ | --------- |
| GET /api/decks/:id/ui-preferences   | GET /api/v1/decks/:id/ui-preferences       | [x]      | `DeckUIPreferencesService` + `decks.http.ts` | [x]       | [x]    | [x]       |
| PUT /api/decks/:id/ui-preferences   | PUT /api/v1/decks/:id/ui-preferences       | [x]      | `DeckUIPreferencesService` + `decks.http.ts` | [x]       | [x]    | [x]       |

### P2g — Official preconstructed decks

| Legacy path | v1 path | Migrated | API module | HTTP unit | ≥1 int | API_V1.md |
| ----------- | ------- | -------- | ---------- | --------- | ------ | --------- |
| — | GET /api/v1/community/preconstructed-decks | [x] | `CommunityService` + `community.http.ts` | [x] | [x] | [x] |


---

## P3 — Collections

**Scope:** Authenticated collection + card rows + history. **Source:** `API_DOCUMENTATION.md` (Collections), [`collections.http.ts`](src/api/http/collections.http.ts).

**v1 prefix:** `/api/v1/collections/me…`

**Auth (Phase 2, 2026-04):** accepts **session cookie OR Bearer JWT** via `createV1SessionOrBearerAuthMiddleware`. Kill switch `DISABLE_BEARER_DECKS_COLLECTIONS=1` restores session-only.

### P3a — Collection record

| Legacy path              | v1 path (proposed)              | Migrated | API module | HTTP unit | ≥1 int | API_V1.md |
| ------------------------ | ------------------------------- | -------- | ---------- | --------- | ------ | --------- |
| GET /api/collections/me  | GET /api/v1/collections/me      | [x]      | `CollectionService` + `collections.http.ts` | [x]       | [x]    | [x]       |

### P3b — Collection cards

| Legacy path                                    | v1 path (proposed)                                       | Migrated | API module | HTTP unit | ≥1 int | API_V1.md |
| ---------------------------------------------- | -------------------------------------------------------- | -------- | ---------- | --------- | ------ | --------- |
| GET /api/collections/me/cards                  | GET /api/v1/collections/me/cards                         | [x]      | `CollectionService` + `collections.http.ts` | [x]       | [x]    | [x]       |
| POST /api/collections/me/cards                 | POST /api/v1/collections/me/cards                        | [x]      | `CollectionService` + `collections.http.ts` | [x]       | [x]    | [x]       |
| POST /api/collections/me/cards/remove-one      | POST /api/v1/collections/me/cards/remove-one             | [x]      | `CollectionService` + `collections.http.ts` | [x]       | [x]    | [x]       |
| PUT /api/collections/me/cards/:cardId          | PUT /api/v1/collections/me/cards/:cardId                 | [x]      | `CollectionService` + `collections.http.ts` | [x]       | [x]    | [x]       |
| DELETE /api/collections/me/cards/:cardId       | DELETE /api/v1/collections/me/cards/:cardId              | [x]      | `CollectionService` + `collections.http.ts` | [x]       | [x]    | [x]       |

Legacy **DELETE** requires query `cardType` (see `API_DOCUMENTATION.md`); keep the same contract in `API_V1.md` when migrated.

### P3c — Collection history

| Legacy path                            | v1 path (proposed)                            | Migrated | API module | HTTP unit | ≥1 int | API_V1.md |
| -------------------------------------- | --------------------------------------------- | -------- | ---------- | --------- | ------ | --------- |
| GET /api/collections/me/history        | GET /api/v1/collections/me/history            | [x]      | `CollectionService` + `collections.http.ts` | [x]       | [x]    | [x]       |


---

## P4 — Guest decks

**Scope:** **GUEST** role + session; in-memory guest decks merged with DB list on **`GET`**. **Source:** `API_DOCUMENTATION.md` (Guest decks), [`guest-decks.http.ts`](src/api/http/guest-decks.http.ts) + [`guestDeckService.ts`](src/api/services/guestDeckService.ts).

**v1 prefix:** `/api/v1/guest/decks…`

### P4a — Guest list + create

| Legacy path           | v1 path (proposed)        | Migrated | API module | HTTP unit | ≥1 int | API_V1.md |
| --------------------- | ------------------------- | -------- | ---------- | --------- | ------ | --------- |
| GET /api/guest/decks  | GET /api/v1/guest/decks   | [x]      | `GuestDeckService` + `guest-decks.http.ts` | [x]       | [x]    | [x]       |
| POST /api/guest/decks | POST /api/v1/guest/decks  | [x]      | `GuestDeckService` + `guest-decks.http.ts` | [x]       | [x]    | [x]       |

### P4b — Guest single deck

| Legacy path                | v1 path (proposed)              | Migrated | API module | HTTP unit | ≥1 int | API_V1.md |
| -------------------------- | ------------------------------- | -------- | ---------- | --------- | ------ | --------- |
| GET /api/guest/decks/:id   | GET /api/v1/guest/decks/:id     | [x]      | `GuestDeckService` + `guest-decks.http.ts` | [x]       | [x]    | [x]       |
| PUT /api/guest/decks/:id   | PUT /api/v1/guest/decks/:id     | [x]      | `GuestDeckService` + `guest-decks.http.ts` | [x]       | [x]    | [x]       |
| DELETE /api/guest/decks/:id | DELETE /api/v1/guest/decks/:id | [x]      | `GuestDeckService` + `guest-decks.http.ts` | [x]       | [x]    | [x]       |

### P4c — Guest deck cards

| Legacy path                     | v1 path (proposed)                    | Migrated | API module | HTTP unit | ≥1 int | API_V1.md |
| ------------------------------- | ------------------------------------- | -------- | ---------- | --------- | ------ | --------- |
| PUT /api/guest/decks/:id/cards  | PUT /api/v1/guest/decks/:id/cards     | [x]      | `GuestDeckService` + `guest-decks.http.ts` | [x]       | [x]    | [x]       |
| POST /api/guest/decks/:id/cards | POST /api/v1/guest/decks/:id/cards    | [x]      | `GuestDeckService` + `guest-decks.http.ts` | [x]       | [x]    | [x]       |


---

## P4b — User account (self-service)

| Legacy | v1 | Migrated |
| ------ | -- | -------- |
| POST /api/users/change-password | POST /api/v1/users/change-password | [x] |
| — | POST /api/v1/users/change-email | [x] |

Service: `UserAccountService` + `users.http.ts`. Legacy change-password delegates to the same service.

---

## P4c — In-app feedback (additive v1 route)

| Legacy | v1 | Migrated | Service | Unit tests | Integration | Docs/OpenAPI |
| ------ | -- | -------- | ------- | ---------- | ----------- | ------------ |
| — | POST /api/v1/feedback | [x] | `FeedbackService` + `feedback.http.ts` | [x] | [x] | [x] |

Feedback is authenticated, Zod-validated, limited to five submissions per user per minute,
and delivered through SES without persisting the message body.

---

## P5 — Admin only (`/api/v1/admin/...`)

All elevated operations must live under `/api/v1/admin/...` (no client “admin” flags).


| Legacy                      | v1                            | Migrated |
| --------------------------- | ----------------------------- | -------- |
| GET/POST /api/users (admin) | /api/v1/admin/users…          | [x]      |
| GET /api/debug/*            | /api/v1/admin/debug/*         | [x]      |
| GET /api/database/status    | /api/v1/admin/database/status | [x]      |
| —                           | /api/v1/admin/biz-ops-dashboard | [x]    |


---

## P6 — Static, health, HTML shell

**Documented N/A** — no **`/api/v1/health`**; JSON v1 contract applies only under **`/api/v1`**. See [API_V1.md](API_V1.md) **Non-v1 surfaces**.

- **`GET /health`** — ops/monitoring; remains non-versioned.
- **Static assets** — non-versioned.
- **HTML shell routes** (`/users/...` pages, etc.) — non-versioned; see [API_DOCUMENTATION.md](API_DOCUMENTATION.md).


| Legacy                                 | Notes                          |
| -------------------------------------- | ------------------------------ |
| /health, static, /data, /users/… pages | **N/A** — documented in API_V1.md (Non-v1 surfaces) |


---

## P7 — Catalog + DBV support auth (implemented)

**Status:** **`GET /api/v1/catalog/*`**, **`GET /api/v1/dbv/sets`**, and **`GET /api/v1/dbv/deck-backgrounds`** require authentication. Clients send **session cookie** (`POST /api/auth/login`) **or** **`Authorization: Bearer`** (`POST /api/v1/auth/login`). Middleware: `createV1SessionOrBearerAuthMiddleware` in [`src/api/http/middleware/v1SessionOrBearerAuth.ts`](src/api/http/middleware/v1SessionOrBearerAuth.ts), wired from [`registerApiV1Routes.ts`](src/api/http/registerApiV1Routes.ts). **GUEST** and **USER** both receive catalog data after login; unauthenticated requests get **401** (`UNAUTHORIZED`).

**Docs / tooling:** [API_V1.md](API_V1.md), [API_DOCUMENTATION.md](API_DOCUMENTATION.md), Postman “Card catalog” folder description, [`public/js/catalog-legacy-fetch-rewrite.js`](public/js/catalog-legacy-fetch-rewrite.js) (`credentials: 'include'` + one-shot **401** → `showLoginModal`), [`public/js/catalog-v1-envelope.js`](public/js/catalog-v1-envelope.js). Integration helper: [`tests/integration/helpers/integrationSessionAuth.ts`](tests/integration/helpers/integrationSessionAuth.ts).

**Optional later:** Per-IP or CDN rate limits for catalog traffic; token denylist for JWT.

---
name: api-layer-migration
description: >-
  Migrates Express HTTP routes to an encapsulated backend API under src/api/
  (services + src/api/http/*.http.ts), keeps API_DOCUMENTATION.md (legacy) and
  API_V1.md (v1) accurate, and updates Codex project context. After each migration,
  use local browser or API verification on the local dev server to prove new routes work.
  Use for route migration, v1 endpoints, thinning src/routes, or aligning with
  MIGRATION_ARCHITECTURE.md.
---

# API layer migration (Excelsior)

## Goal

- **Legacy** (`/api/...` without v1): thin `src/routes/*.ts` handlers; **`API_DOCUMENTATION.md`**; `{ success, data, error }` + cookies unless documented otherwise.
- **v1** (`/api/v1/...`): handlers only in **`src/api/http/*.http.ts`**; contract in **`API_V1.md`** only; envelope **`{ data, meta, errors }`**; **Bearer JWT** where auth is required.
- **Shared business logic** in **service classes** (reuse from legacy + v1). **No** direct DB calls in HTTP modules. **No** password hashing / storage changes—reuse **`AuthenticationService.authenticateUser`** for v1 login.

**Patterns:** `src/api/deckTransform.ts` (transforms); `src/api/services/catalogService.ts`; `registerApiV1Routes` in `src/api/http/registerApiV1Routes.ts`.

## Load relevant contract context

For contract inspection, read relevant endpoint sections and actual callers. Apply the migration loop only when migration is authorized. Load security/path instructions before implementation; templates only when using their pattern. Reuse current instructions already loaded.

1. **[API_DOCUMENTATION.md](../../../API_DOCUMENTATION.md)** — legacy contract.
2. **[API_V1.md](../../../API_V1.md)** — v1 contract (examples, status codes, request model file paths).
3. **[API_MIGRATION_CHECKLIST.md](../../../API_MIGRATION_CHECKLIST.md)** — what to migrate next.
4. **[MIGRATION_ARCHITECTURE.md](../../../MIGRATION_ARCHITECTURE.md)** — layers, admin namespace, testing, JWT env.
5. **[src/api/.cursorrules](../../../src/api/.cursorrules)** — authoritative rules while directory `.cursorrules` files remain in the repo.
6. **Actual route / HTTP module** source files.
7. **[REFERENCE.md](REFERENCE.md)** in this skill — templates.

## Repeatable migration loop (one route or small group)

1. **Pick work** — next unchecked row in **API_MIGRATION_CHECKLIST.md** (respect **P0 → P6** unless told otherwise).
2. **Services** — implement or extend **service classes** under `src/api/services/` (or reuse existing `src/services/`). **No** `Request`/`Response` in service cores.
3. **Request models + response DTOs** — one **dedicated file** per inbound contract and per public response shape (`src/api/http/models/...`, `src/api/dto/v1/...`).
4. **v1 HTTP** — add routes in the correct **`src/api/http/<domain>.http.ts`**; validate → service → **`sendV1Success` / `sendV1Json`** from `v1Envelope.ts`. Register from **`registerApiV1Routes.ts`**.
5. **Legacy removal + clients** — when v1 for that route is ready to own the contract: **delete** the legacy **`app.get/post/...`** handler in `src/routes/` (do **not** leave a parallel legacy URL that still works). **Grep** the repo for the old path (`frontend/`, `tests/`, **Postman**, scripts) and **switch callers** to **`/api/v1/...`**. Parse the v1 envelope **`{ data, meta, errors }`** (not `{ success, data }`) via the shared `lib/api` client.
6. **Security pass** — authn/authz via middleware; **401 vs 403**; no credential logging; **admin** only under **`/api/v1/admin/...`**; **no** client admin flags; **passwords:** verify-only, no hash changes.
7. **Tests** — **unit:** services, DTOs, **full coverage** for each touched **`*.http.ts`** (happy + main error paths); **integration:** **≥1** test per **`*.http.ts`** file (Supertest + app from `src/test-server` when DB needed). **Merge blockers:** missing integration test or incomplete router unit coverage. Update any test `fetch` mocks with **`ok: true`** when production checks **`response.ok`**.
8. **Docs** — **`API_V1.md`** for v1; **`API_DOCUMENTATION.md`**: remove or mark **removed** legacy paths (callers must not rely on them); checklist checkboxes and “legacy removed” meaning.
9. **Codex context** — update **`AGENTS.md`** or the relevant directory context only when global API rules change; keep **`src/api/.cursorrules`** / **`src/routes/.cursorrules`** accurate while they remain in the repo.
10. **Local dev server** — when migration work for this task is **complete** (handlers, callers, tests, docs), restart or verify the local development stack with `$start-excelsior` so Express picks up new routes and any in-memory caches stay aligned with the code. If you added or edited **`migrations/*.sql`**, use the Flyway Docker workflow from [`docs/current/LOCAL_FLYWAY.md`](../../../docs/current/LOCAL_FLYWAY.md) before restarting.
11. **Codex verification proof (required)** — With the local stack running, prove the new or changed route behaves correctly against **`http://localhost:5173`** for UI flows or **`http://localhost:8085`** for direct API checks. Prefer browser automation/screenshots when a UI path exists; use `curl` or Supertest-style checks for direct API contracts. Match the contract you migrated: session cookie flows → use an isolated fictional local account and privately supplied run-only authentication; public GETs → hit the path or the app screen that triggers it; 401/403 → confirm the expected failure when unauthenticated or forbidden. Do not skip this step: unit/integration tests validate code paths, but local proof confirms Express mount order, cookies, CORS, proxies, and real client usage.

## Pre-merge checklist (security)

- Login rate limiting on **`POST /api/v1/auth/login`** (v1 middleware).
- JWT **`exp`** / TTL documented; **`JWT_SECRET`** required in production.
- **401** vs **403** used correctly.
- **No** secrets or Bearer tokens in logs.
- Timing / enumeration: follow product guidance; do **not** add a second password hash implementation.

## Anti-patterns

- Leaving **both** legacy and v1 URLs working indefinitely for the same resource (duplicated contracts, drift risk).
- Changing legacy JSON without updating **API_DOCUMENTATION.md** and tests.
- Documenting v1 in **API_DOCUMENTATION.md** instead of **API_V1.md**.
- Admin behavior on non-`/admin` paths or driven by request body flags.
- Skipping **tests** for **`*.http.ts`** files.
- Skipping **Codex local verification** after migrating or adding HTTP routes (step 11).

## Evolving this skill

Append a one-line note to **[REFERENCE.md](REFERENCE.md)** when conventions change.

## Verification handoff

Use [Test Local Browser](../test-local-browser/SKILL.md) for UI paths and [Ship receipts](../ship/references/verification.md) for selected commands. Distinguish API-only from browser proof; reuse unchanged inputs/evidence instead of rerunning a full suite merely for handoff. Coverage and security judgment remain with the main agent.

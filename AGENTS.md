# Agent orientation (Excelsior Deckbuilder)

**Excelsior** is an Overpower card game database and deck-building web app. Backend is Node/Express/TypeScript in `src/`. **The production frontend is the v2 React SPA in `frontend/`** (React 19 + Vite + TypeScript); Express serves `frontend/dist/index.html` for app routes. Tests live in `tests/` (unit: `tests/unit/`, integration: `tests/integration/`); v2 unit tests import from `frontend/src/`.

Before making changes:

1. **Use this file as the active Codex source of truth.** `.cursorrules` and archived `.cursor/` files are historical Cursor material unless a task explicitly asks about Cursor.
2. **Local dev URL is `http://localhost:5173`** (Vite in `frontend/`). Run root `npm run dev` (API :8085) **and** `frontend/npm run dev` (UI :5173).
3. **Read [DEAD_CODE_POLICY.md](DEAD_CODE_POLICY.md)** — how to identify and remove unused code (Knip).
4. **Load [`.agentos/global-rules.md`](.agentos/global-rules.md) for every substantive task.** It is the compact, checked-in cache of Kyle's global AgentOS rules. At the first substantive task in a session, run `npm run agentos:status`; reuse the cache when it is current, and do not open large AgentOS source files unless the status output identifies relevant changed files.

## AgentOS inheritance

- Excelsior is authoritative for this product, repository, architecture, users, data, operations, releases, and repo-local workflows. This file and nested path-specific instructions override inherited AgentOS rules when they conflict.
- AgentOS is authoritative for Kyle's global identity, communication preferences, privacy, verification, approval, memory, GitHub synchronization, and skill-learning practices.
- Follow [`docs/current/AGENTOS_INHERITANCE.md`](docs/current/AGENTOS_INHERITANCE.md) for source resolution, cache refresh, conflict reporting, exclusions, and the narrow AgentOS write allowlist.
- Report material conflicts. Never import context from AgentOS's other projects, and never treat uncommitted AgentOS changes as shared inherited state.

Key docs:

- [docs/current/FRONTEND_V2.md](docs/current/FRONTEND_V2.md) — **the v2 React SPA** (`frontend/`): architecture, routing, dev workflow, and how the production build is served. **Start here for frontend work.**
- [docs/current/SHADCN_UI.md](docs/current/SHADCN_UI.md) — Tailwind + shadcn/ui setup, theme bridge, dashboard tiles.
- [STYLE_GUIDE_V2.md](STYLE_GUIDE_V2.md) — visual source of truth for the v2 React SPA. Update it for any v2 UI change.
- [frontend/.cursorrules](frontend/.cursorrules) — conventions for the v2 SPA while directory context files remain in the repo (component structure, lib map, API client, layout/query patterns).
- [docs/archive/FRONTEND_V1_TO_V2_MIGRATION.md](docs/archive/FRONTEND_V1_TO_V2_MIGRATION.md) — historical v1 → v2 migration story and archived doc index.
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) — **legacy** HTTP contract (`src/routes/`, `{ success, data, error }`, session cookies).
- [API_V1.md](API_V1.md) — **`/api/v1`** contract (Bearer JWT, `{ data, meta, errors }`). Update this file whenever v1 paths or envelopes change.
- [API_MIGRATION_CHECKLIST.md](API_MIGRATION_CHECKLIST.md) — migration progress; keep in sync when checking routes off.
- [MIGRATION_ARCHITECTURE.md](MIGRATION_ARCHITECTURE.md) — layers, `/admin` rules, testing, JWT env.
- Layering and v1 route grouping: [`src/api/.cursorrules`](src/api/.cursorrules). When moving logic into `src/api/`, use the repo-local Codex skill [`api-layer-migration`](.agents/skills/api-layer-migration/SKILL.md).
- [docs/current/PROJECT_LAYOUT.md](docs/current/PROJECT_LAYOUT.md) — project structure and documentation map.
- [docs/current/LOCAL_FLYWAY.md](docs/current/LOCAL_FLYWAY.md) — local Postgres (`overpower-postgres`, port **1337**) and Flyway via Docker image (no host Flyway CLI).
- [docs/current/DECK_LEGALITY_RULES.md](docs/current/DECK_LEGALITY_RULES.md) — Standard (Venture) vs Skirmish vs in-app Limited; rulebook cites + `DeckValidationService` / client validator mapping and known gaps. **Any-Power:** Training uses **any** primary ≤ cap; Power / Teamwork use **max** for ≥ (see doc §3.1).
- [docs/current/TESTING_GUIDE.md](docs/current/TESTING_GUIDE.md) — how to run unit/integration tests and which Jest configs to use.
- [docs/current/ENDPOINT_HIT_METRICS.md](docs/current/ENDPOINT_HIT_METRICS.md) — `endpoint_hit_counts` async metrics; on startup the app seeds missing route keys at zero and **deletes rows for routes no longer registered** (no per-route migration).
- [docs/current/SIMULATE_KO_FEATURE.md](docs/current/SIMULATE_KO_FEATURE.md) — Simulate KO in [`frontend/src/features/deck-editor/DeckEditorPage.md`](frontend/src/features/deck-editor/DeckEditorPage.md).
- [docs/current/DRAW_HAND_FEATURE.md](docs/current/DRAW_HAND_FEATURE.md) — Draw Hand in [`DrawHandPanel.tsx`](frontend/src/features/deck-editor/DrawHandPanel.tsx) + [`drawHand.ts`](frontend/src/lib/decks/drawHand.ts).
- [docs/current/VENTURE_TOTAL.md](docs/current/VENTURE_TOTAL.md) — concise Modern-rulebook reference for calculating Venture Total and the Draw Hand estimate's scope.
- [docs/current/COLLECTION_CHECKLIST_SOURCE.md](docs/current/COLLECTION_CHECKLIST_SOURCE.md) — Source of truth for collection card names and numbers (OverPower Check List).

## External API hardening

Before touching auth, transport, CORS, caching, or `/api/v1` routes, read [`src/api/.cursorrules`](src/api/.cursorrules) — it has the full Phase 0–3 security index (kill switches, middleware files, per-phase doc links).

## Codex Skills

Repo-local Codex skills live in [`.agents/skills/`](.agents/skills/README.md). Use them for recurring workflows:

- **Start Excelsior**: use [`start-excelsior`](.agents/skills/start-excelsior/SKILL.md) for `/start`, "Start Excelsior", local server startup, and health verification.
- **Ship**: use [`ship`](.agents/skills/ship/SKILL.md) when Kyle says "ship" or "ship it". In this project, that phrase authorizes `git add`, `git commit`, and `git push` after required gates pass.
- **Add Card**: use [`add-card`](.agents/skills/add-card/SKILL.md) for cataloging new card images.
- **API Layer Migration**: use [`api-layer-migration`](.agents/skills/api-layer-migration/SKILL.md) for `/api/v1` work and route thinning.
- **Start AWS DB Tunnel**: use [`start-aws-db-tunnel`](.agents/skills/start-aws-db-tunnel/SKILL.md) for guarded production DB tunnel work.
- **PDF to PNG**: use [`pdf-to-png`](.agents/skills/pdf-to-png/SKILL.md) for native-resolution card-art PDF exports.
- **Fix Trivy**: use [`fix-trivy`](.agents/skills/fix-trivy/SKILL.md) for dependency scanner failures.
- **AWS Cost Audit**: use [`aws-cost-audit`](.agents/skills/aws-cost-audit/SKILL.md) for read-only Excelsior production AWS cost, waste, cleanup, and production-risk reviews.

`add-community-deck`, `add-tournament-deck`, and `split-to-prs` were intentionally not migrated.

## Core Workflow Rules

- Do not commit or push unless Kyle explicitly asks. The word **ship** is explicit permission for this repo.
- Before committing, lint and unit tests must pass. Use the `ship` skill for the full release gate.
- If a diff touches `src/index.ts`, `src/routes/`, or `src/api/http/`, run `bash scripts/soc2-compliance-checks.sh`.
- Run `npm audit` before the first push of each calendar day and whenever `package.json` or `package-lock.json` changes.
- Remove temporary debug logging before committing.
- Never implement paid AWS infrastructure changes without explicit instruction from Kyle.
- Use Flyway migrations for database changes. Locally, use Docker Flyway from `docs/current/LOCAL_FLYWAY.md`; do not install or chase host Flyway CLI.
- Use `/health` for API verification; do not rely on simple port checks as final proof.
- For v2 UI changes, verify in the live app at `http://localhost:5173` and update `STYLE_GUIDE_V2.md` for visual changes.

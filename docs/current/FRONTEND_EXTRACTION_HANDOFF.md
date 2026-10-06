# Frontend preparation handoff

This is an Excelsior-local readiness contract. It copies no code and authorizes no package publication, external host launch, rebrand or infrastructure change. M1–M7 have shipped; M8's final local acceptance is pending. See the [ledger](FRONTEND_PREPARATION.md) and [M8 audit](../evidence/frontend-preparation/m8/completion-audit.md).

## Deliverable and runtime

The ordinary Excelsior app and native fixture hosts import the same `CardDatabaseModule`, `DeckBuilderModule` and `CollectionModule` through `frontend/src/modules/index.ts`. The private `frontend/package.json` exports `./modules` (ESM and declarations) and `./modules/fonts`. React, React DOM and TanStack Query are explicit peer dependencies. The host owns its QueryClient lifecycle, router, identity, authentication and assets. Clear identity-bound queries on sign-in/sign-out or origin changes; never share account caches across players.

Build the ordinary frontend first, then `build:modules`, then `build:delivery-proof` and `check:delivery`. The ordinary build clears `frontend/dist`, including module artifacts; parallelizing those output-dependent builds invalidates the consumer. Storybook and independent backend checks may run separately. `verify:delivery` proves the declared frontend inputs build without backend source, migrations or the repository card-resource tree, reusing installed frontend dependencies. This is not a clean dependency installation or a published package.

## API, identity and assets

Use `createModuleApi` with the host's public API origin/prefix and player transport. Service credentials remain in a confidential server adapter. Existing `excelsior-web` and `lrg-web` scopes do not replace player authentication, ownership or Guest isolation. See [SERVICE_ACCESS](SERVICE_ACCESS.md), [API_V1](../../API_V1.md), [OpenAPI](../openapi.yaml) and [module contract](../../frontend/src/modules/README.md). Production service switches remain off until separately provisioned and approved; browser CORS and cache bypass require their own real-host validation.

The server supplies catalog identity/presentation, draft/candidate evaluation, summaries, simulation, draw, export/import and Collection totals/capabilities. `GET /api/v1/collections/me/view` returns current owned cards plus evaluation; `POST /api/v1/collections/evaluate` evaluates bounded device-local input without persistence. Failed or pending writes do not manufacture current totals. Local transport observations record only operation/status/duration/decoded bytes; they are development diagnostics, not production telemetry or a latency benchmark.

The host supplies card-art URL resolution and placeholder policy. Frontend-owned game/stat icons, placeholder and optional licensed Poppins Latin assets are emitted with the module. Brand/icons, tokens, fonts, surface dimensions, navigation/card actions, authentication callbacks, overlay root, save feedback and unsaved navigation policy remain host-owned. Isolated ShadowRoot styling is opt-in; invalid external overlay combinations are rejected. See [image contract](API_V1_IMAGE_CONTRACT.md) and [host checklist](FRONTEND_HOST_CHECKLIST.md).

## Outstanding real-host inputs

- Approved real LRG assets, fonts, licenses, tokens, contrast and supported browser/assistive-technology targets.
- Real host sign-in/player mapping, confidential credentials, deployment origin, CORS/cache policy and QueryClient isolation.
- Production router/history fallback, safe external navigation and native Chrome reload/tab-close prompt checks. Suppressed prompts, crashes and forced closure do not guarantee draft recovery.
- A separate installation/build against the intended host dependency versions, complete accessibility audit, non-Latin fonts and approved package performance budgets.
- An actual Insomnia UI import and any requested laptop tunnel coexistence check. The documented SSM tunnel is PostgreSQL forwarding, not an HTTP API endpoint or auth bypass. Root imports configure local API `http://localhost:8085` and production `https://excelsior.cards`; preview ports are temporary local overrides.

These are explicit future inputs, not claims closed by local tests. Production record mutations remain separately authorized with fixtures and cleanup.

## Acceptance and rollback

Kyle must accept the identified M8 ordinary app, native host and built consumer after reviewing the [local checklist](../evidence/frontend-preparation/m8/README.md). Automated success is not acceptance. M8 has no commit, push, deployment or production validation yet. Any release follows an explicitly authorized Ship with frozen scope, exact-SHA CI/Security Gate, cache-bypassed health and selected read-only production browser checks.

M8 adds routes/contracts and no database migration. A scoped release rollback returns to the verified M7 release `ca6d811fd0872859c01e575295a79678442b76b0` through the normal Ship workflow, retaining user records and historical migrations. No automatic rollback or revival of shelved Supporter is authorized. Before release, discard/revert only the approved M8 patch in its isolated checkout after preserving any needed evidence; do not reset the dirty primary checkout.

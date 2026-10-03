# Local target, fictional fixtures, and cleanup

Read this before creating a fixture or starting/replacing a process. The [shared browser guide](../../../../docs/current/BROWSER_TESTING.md) owns scenario assertions, invocation and reporting.

## Identify the actual target

- Record `git rev-parse --show-toplevel`, branch, `HEAD`, status and the existing `computeShipTreeFingerprint` output from `scripts/ship-tree-fingerprint.mjs`. Avoid a broad reset/stash or copying unrelated dirty changes. M1's old primary checkout and current remote main disagreed about shelved Supporter; the preview could be healthy and still be the wrong code.
- Invoke the existing startup helper from the intended root for the default pair:

  ```bash
  python3 .agents/skills/start-excelsior/scripts/start_local_dev.py <intended-checkout>
  ```

  It verifies responding listener directories, proxy health and local container binding, returning a receipt; missing evidence blocks readiness. Confirm API/Vite process working directories and sanitized launch settings without dumping environment secrets. Check API health and frontend HTML, then the visible application. Verify `/health` through Vite too, so the UI proxy reaches the intended API.
- Confirm `DB_HOST`, port, database name and container ownership from the controlled launch configuration; keep credentials out of reports. A matching migration alone is not proof of database identity. Default local PostgreSQL is on 1337. SSM forwards production PostgreSQL and is not a local HTTP API; never seed browser fixtures into a tunnel-backed connection.
- Use `scripts/browser-test-target.mjs` with explicit origins, full expected source SHA and migration. Its sanitized report checks API health, proxy health and frontend HTML. Separately record verified database binding and actual browser actor. A SHA identifies HEAD; fingerprint and process working directory explain the working tree actually served.

## Isolated port exception demonstrated in M1

M1 preserved the existing primary 5173/8085 servers and used a dedicated worktree, disposable PostgreSQL, API 8086 and UI 5174. These numbers describe a demonstrated isolation pattern, not permanent skill defaults. Select free loopback ports and record them; do not let Vite silently fall through to another port.

Reuse current `frontend/vite.config.ts` and override only root, `server.port`, `strictPort: true` and each proxy target in a temporary configuration outside source. Point **all** API/health/resource proxies at the isolated API. Do not import a temporary installation/worktree path into the skill or commit that configuration. Start Vite from that checkout with `npm --prefix frontend run dev -- --config <private-config-file>`; verify actual URL and proxy health.

The approved root development command uses `tsx watch` after thumbnail generation. M1 confirmed a replacement `tsx watch src/index.ts` API against an already migrated disposable database. Do not invoke the retired `ts-node-dev` watcher on current main; an old running watcher can break on its next restart after removal. A stale primary checkout may still contain the old command—report the mismatch rather than installing it as a workaround.

Use existing Docker Flyway mechanics in [Local Flyway](../../../../docs/current/LOCAL_FLYWAY.md) and `scripts/run-integration-shards.mjs` to understand container/migration isolation. The integration runner cleans up its databases after Jest; it is **not** a persistent browser-fixture launcher. M1's browser database was separately owned and retained for the spot check. No persistent browser fixture provisioning CLI existed in M1.

For a new persistent disposable fixture, establish a unique run/container ownership label, loopback binding, private persistence directory and teardown plan first. Migrate only that new database with the repository migrations via Docker Flyway. Set the API's local DB binding, `PORT`, private `USER_PERSISTENCE_DATA_DIR`, and, only after successful migration, `SKIP_MIGRATIONS=true`. Use the configured public asset base only after checking it against current application configuration. No paid infrastructure or production copy is needed. If dependencies/Docker/assets are unavailable, report that limitation rather than weakening isolation.

## Fixture selection and lifecycle

Read-only catalog/route cases can reuse M1's existing disposable catalog without creating records. Do not perform signup, login or collection/deck writes just to test a read-only page. New tabs share cookies/storage: verify the current actor; never sign out Kyle's real session or clear its storage automatically.

For account persistence or owned-deck cases, create a uniquely named fictional local account in the confirmed disposable database using current documented APIs/repository utilities. Generate run-only credentials privately; pass them only in memory/private temporary state and never in committed configs, screenshots, reports or command output. Do not create privileges unnecessary for the case. M1 did not establish a reusable browser signup/cleanup runner; build any needed setup deliberately, checking the HTTP contracts in `API_DOCUMENTATION.md` and `API_V1.md`.

Reuse `tests/helpers/apiClient.ts` for HTTP fixtures in a Jest/Supertest process. `tests/setup.ts` supplies Jest's `integrationTestUtils`; inspect the current setup and follow `tests/integration/.cursorrules` when tracking users/decks and teardown. Those helpers are not importable browser authentication shortcuts. Keep HTTP setup results separate from browser assertions.

For the pre-placement case, use `docs/evidence/frontend-preparation/m1/local-fixture-payload.json` after resolving its catalog IDs in the target. It deliberately enables Limited and repeats a one-per-deck Special; do not reuse it as a legal standard-deck fixture. For unrestricted copy-count tests, M1 succeeded after choosing a power printing with `one_per_deck=false`. Keep the synthetic compatibility fixture in `tests/unit/frontend-preparation/compatibility-baseline.test.ts` separate from real catalog IDs.

Track every created user/deck/collection row and imported deck immediately. Run cleanup in `finally`, including partially successful imports (current import can leave an empty created deck if card save fails). Remove only known run-owned IDs, or destroy the entire confirmed run-owned disposable container once no handoff needs it. Do not run broad repository cleanup scripts against a shared development database.

Guest collection/decks need a test-owned browser storage/session boundary as well as a local database. If the available browser cannot supply isolation, read-only checks may proceed but Guest writes are blocked; do not clear unknown existing storage. Reset only fixture-owned Guest entries and verify cleanup. Closing a tab does not guarantee storage is erased.

Record cleanup as completed, retained for the named local handoff, or blocked with the exact remaining fixture types. Stop only run-owned processes, reset viewport overrides, close temporary tabs and remove private credential/persistence files when the run finishes. Existing M1 fixture data can remain intentionally retained while preparation is paused; reuse it read-only and disclose that retention.

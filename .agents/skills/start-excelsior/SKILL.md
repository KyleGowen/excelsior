---
name: start-excelsior
description: Start or verify the Excelsior local development environment. Use when the user says /start, Start Excelsior, asks to start the local server, run local dev, bring up the app, verify localhost, or make sure the health check passes for /Users/kyle/cursored. Starts/reuses the root API on 8085, starts/reuses the Vite frontend on 5173, and verifies /health.
---

# Start Excelsior

## Workflow

Use this skill for `/start` or "Start Excelsior" in the Excelsior repo.

1. Run `scripts/start_local_dev.py` from this skill folder with the repo root as the working directory or first argument.
2. If sandboxed startup fails with `EPERM` (for example: `Operation not permitted` on `http://localhost:8085/health`), rerun the same command with approval/escalation. The API needs local Postgres access on `localhost:1337`; Vite binds `0.0.0.0:5173`.
3. Report:
   - API URL: `http://localhost:8085`
   - Frontend URL: `http://localhost:5173`
   - `/health` status, database status/latency, response latency, latest git commit, and latest migration.
   - Include the API/frontend process IDs or log path if printed by the script.

4. If startup succeeds but `/health` still fails, tail `/tmp/excelsior-start-excelsior/api.log` and `/tmp/excelsior-start-excelsior/frontend.log` for the next actionable error before retrying.

Do not use basic port checks as the final API verification. Always use `http://localhost:8085/health`.

## Notes

- Root `npm run dev` starts the Express API and runs thumbnail generation first.
- `frontend/npm run dev` starts the Vite SPA.
- Preserve responding servers and verify their checkout, proxy and local DB binding. A mismatch blocks testing; do not replace them automatically.
- Start the API before Vite when both are down; Vite proxies `/api`, `/health`, and `/src/resources` to the API.
- Keep long-running server sessions open when the user asked to start local dev.
- Use `http://localhost:5173` (or the local network URL from Vite output) for the frontend. `https://localhost:5173` is not valid unless you have SSL proxies enabled.
- In previous runs, the first attempt can fail only on network permission in this environment; escalation is normal and expected to complete health verification.

## Browser verification after startup

Startup and HTTP health are readiness checks. For live UI assertions or a spot-check handoff, use [Test Local Browser](../test-local-browser/SKILL.md) after confirming the responding processes and database belong to the intended checkout. A responding port can be another worktree. This reference does not turn a startup request into permission for account writes, production tests or release.

## Compact target verification

Before starting an API, the helper verifies a local database/container binding. Existing listeners must match the intended checkout before any new server starts. Unverified/tunnel/remote bindings block startup; health verification grants no fixture-write permission.

The helper returns a startup receipt with listener PIDs/directories, source SHA, sanitized API/proxy health and DB selectors matched to the named running local container. Missing ownership/tools, wrong proxy/revision/migration or nonlocal DB blocks readiness. Credentials and launch environments stay private. This proves launch/config/container binding, not historical data provenance or an independent build revision for dirty files.

`--verify-only` starts nothing. Defaults remain API 8085, UI 5173 and `overpower-postgres`. For an already controlled isolated launch, set `--api-port`, `--frontend-port`, `--database-owner`, and `--expected-migration`; custom ports never invent proxy configuration or start servers. `--report-dir` selects fresh private evidence. The latest checkout migration is the default expectation. Use browser fixture ownership checks before any writes; startup grants no production/fixture authority.

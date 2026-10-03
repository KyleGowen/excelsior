# Browser skill creation validation

Both repository-local skills were created with Skill Creator's initializer and passed its **actual `quick_validate.py` validator**. Each has `SKILL.md`, generated `agents/openai.yaml`, and supporting references. The host and bundled Python lacked PyYAML; installing PyYAML into a private temporary validator environment allowed the original validator to complete. Repository dependency manifests were unchanged; no validator installation path is embedded in the skills.

## Scope and inspected evidence

Inspected active root/frontend instructions, AgentOS cache/status, dead-code policy, startup helper, Ship contract, testing guide, M1 ledger, verification/API timing reports, catalog-backed fixture and export, compatibility tests, Jest/Supertest setup/helpers, integration isolation runner, Vite configuration, Storybook fixtures/mocks, original CUA action history, runtime troubleshooting logs, and screenshot contents/dimensions.

The demonstrated browser runner was CUA through `mcp__cua_repl` with documented locator/viewport/screenshot APIs. No existing checked-in standalone browser suite was found. Successful M1 calls were extracted into `tests/browser/milestone1.mjs`; shared evidence code lives in `tests/helpers/browserEvidence.mjs`. Account mutation and mobile profile cases remain documented M1 procedures beyond this packaged desktop subset. Six unchanged domain compatibility tests and M1 artifacts were preserved in their normal repository locations for stable references, without copying fixture credentials. Original M1 production evidence is historical; no live production request was made during this task.

## Checks actually executed

| Check | Result | Evidence/limit |
| --- | --- | --- |
| Skill Creator validator, local skill | Passed | Actual bundled `quick_validate.py` |
| Skill Creator validator, production skill | Passed | Actual bundled `quick_validate.py` |
| Target/selection guard tests | 3 passed | `node --test tests/unit/browser-workflow-guards.test.mjs`; stale SHA/migration, unsafe origins, credentials, unverified target and account/unknown production selection rejected |
| JavaScript syntax | Passed | `node --check` for shared scenarios, evidence helper and target helper |
| Relative documentation links | Passed after this report was added | Skills, supporting references, testing guide and shared browser guide |
| Scoped whitespace check | Passed | Existing edited registration/startup/release guide paths; unrelated work preserved |
| Start Excelsior helper | Passed readiness | Default API 8085/app 5173 reused; API/database OK, frontend HTTP 200; source `3075fba8`, migration 367; older primary checkout, not the M1 browser target |
| New target helper, isolated local mode | Passed | API 8086 and UI 5174 proxy both full `9f8685c3eae7d9261d061055074216f45e073c72`, database OK, V365, frontend HTTP 200 |
| New target helper, production dry-run | Passed dry-run | Only local Git reads; returned `verified: false`; no HTTP/browser validation or production fixture use |
| Shared browser local catalog case | Passed after correction | [Confirmed report](local-catalog-confirmed/report.json), DOM/screenshots below; live CUA automation against isolated data; initial incomplete capture retained |

## Representative local browser run

Environment: isolated M1 checkout and disposable PostgreSQL; UI `http://localhost:5174`, API `http://localhost:8086`. Full source/running SHA and fingerprint are in [the report](local-catalog-confirmed/report.json). Controlled API launch binds the run-owned `excelsior-frontend-preparation-baseline` database at local port 15437. It is separate from the older primary development database. Vite's existing isolated configuration points API, health and image proxies to that API.

Actor: existing fictional local account, no login or new fixture provisioning needed. Actual viewport **1200×833**, fixed dark. Selected scenario **`database-search-detail`**:

- Unmatched fictional query -> **No cards found**, [screenshot](local-catalog-confirmed/database-search-detail-empty.jpg) and [DOM](local-catalog-confirmed/database-search-detail-empty.txt).
- Lancelot search -> detail -> artwork complete, natural dimensions **1039×744**, [screenshot](local-catalog-confirmed/database-search-detail-detail.jpg) and [DOM](local-catalog-confirmed/database-search-detail-detail.txt).
- Escape dismissed the detail panel; awaited hidden dialog and verified matching catalog result, [screenshot](local-catalog-confirmed/database-search-detail-result.jpg) and [DOM](local-catalog-confirmed/database-search-detail-result.txt).
- Browser errors: **0**. No application-record writes, imports, saves or quantity changes.

Cleanup: temporary test tab closed, viewport override reset, existing preview retained for Kyle, no created records to delete. Existing M1 disposable fixtures and servers remain intentionally retained while preparation is paused. Preliminary unvalidated M2 edits were archived separately and only those runtime paths restored to M1 before the run. M2 remains paused.

The [first extracted run](local-catalog/report.json) initially reported pass for search/detail/art, but visual/DOM inspection still showed a detail panel and unintended profile menu after the unverified close click. That capture is preserved as incomplete evidence. The runner now refreshes observed state and verifies dialog dismissal; only this affected local case was rerun, and its final screenshots confirm the panel is closed. Reloading the edited module required resetting the CUA JavaScript session; a query-string filesystem import failed and was not used as a workaround. The retained preview also needed a refresh after its API had been restored; Home then loaded successfully.

This task added testing guidance/helpers, not product UI behavior. M1's unchanged account, mobile, deck and Storybook evidence was reused; the whole baseline was not rerun. New captures are separate from M1 baselines and were not approved as replacements. Screenshot inspection confirms the new empty/detail/results states; comparisons must match actual dimensions and selected inputs (the original catalog detail exercise used Carson, so it is not an identical Lancelot detail screenshot baseline).

Automated pass establishes a working representative local skill path. It is not a new Kyle spot-check acceptance and does not establish production validity of the newly packaged runner.

## Incorporated lessons and remaining gaps

The shared guide and skill references preserve target/source/database checks after the Supporter mismatch, correct **My Collection** locator, waits for destination controls, actual viewport checks after resizing the wrong tab, rendered image completion, maintained watcher recovery, unrestricted power-printing selection, distinct pre-placement/export/import counts, and bounded isolated integration setup recovery. API/integration recovery is explicitly separated from browser evidence.

M1 live production evidence supports Guest desktop Home/menu, Lancelot detail/art, a public read-only deck's draw/redraw/export, empty Guest collection, and shelved Supporter absence. The new packaged runner, production empty search/mobile/account persistence/foil Apply, real OAuth, production mutation/cleanup, light theme, external service access, and independent module/host harness remain unverified or unavailable. Account writes, real OAuth and module integration cannot inherit a production pass from local or mocked tests.

No commit, push, deployment, production test, production data mutation, or memory update was performed for skill creation. AgentOS's checked-in cache was reused; current upstream freshness could not be verified, and no refresh was needed according to available status.

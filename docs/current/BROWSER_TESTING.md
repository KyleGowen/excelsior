# Excelsior browser verification

Use [Test Local Browser](../../.agents/skills/test-local-browser/SKILL.md) for the running development app and [Verify Production Browser](../../.agents/skills/verify-production-browser/SKILL.md) for an explicitly selected deployed release. Neither skill grants Git, release, account, or production-write authority.

## Runner and evidence types

Milestone 1 used `mcp__cua_repl` with CUA accessibility snapshots and its documented Playwright locator facade, viewport capability, screenshots, read-only DOM evaluation, and browser error log. There was no checked-in standalone Playwright suite, browser CI job, or `npm run test:browser` command. This task extracts those successful calls into [the shared M1 scenarios](../../tests/browser/milestone1.mjs) with [evidence helpers](../../tests/helpers/browserEvidence.mjs). Import the scenarios inside the available CUA runtime; do not install another browser runner merely to invoke them.

| Evidence | What it establishes | What it does not establish |
| --- | --- | --- |
| CUA actions, awaited visible state, assertions, DOM/screenshot report | Automated behavior in the specified live app/session | Kyle's acceptance or unexecuted states |
| Kyle's local spot check | Human acceptance of the reviewed preview | Automated coverage or production behavior |
| `tests/unit/frontend-preparation/compatibility-baseline.test.ts` | Six domain compatibility examples, including mocked import failure | A live browser, HTTP persistence, or production |
| Jest/Supertest integration helpers in `tests/helpers/` | API/auth/ownership and persistence contracts | Rendered interactions, viewport, images, or navigation |
| Storybook screen automation using fictional MSW responses | Rendered isolated components, including read-only Export | Real backend end-to-end behavior |
| Builds, health, endpoint timings, Insomnia structure checks | Readiness, target identity, API behavior | Successful browser scenarios |

The [M1 ledger](FRONTEND_PREPARATION.md) and [verification report](../evidence/frontend-preparation/m1/verification.json) record the original coverage. Screenshots and fixture payloads remain in `docs/evidence/frontend-preparation/m1/`; new tests belong under `tests/`, not inside skills. The extracted runner is narrower than the original exploratory session: account writes and mobile profile workflows below remain procedures to automate deliberately, not a claim that every M1 case is packaged in the runner.

## Shared scenario selection

Select IDs explicitly. The checked-in [configuration example](../../tests/browser/milestone1.config.example.json) contains no credentials or production record IDs. Cases stop on the first failure and record later selections as blocked. Missing fixtures are blocked, not passes. The current runner uses desktop navigation; use the demonstrated mobile procedures below when the desktop locator is absent and record that separately. Do not force the desktop layout merely to make a mobile check pass.

| Scenario ID | Observable assertions | Local | Production M1 evidence |
| --- | --- | --- | --- |
| `home-guest` | Welcome heading, direct Guest entry, contextual Log In/Create Account/Google controls; no auth submission | Guest | Live Guest desktop; actual OAuth unverified |
| `database-search-detail` | Navigate Database, unmatched search -> No cards found, selected card -> detail, complete image with positive natural dimensions | Guest or isolated fictional account | Live Lancelot search/detail/art; empty search newly extracted from local M1 only |
| `collection-guest-read` | My Collection, Stored on this device, Owned only; optionally assert empty when fixture is known empty | Guest | Live empty Guest collection; no quantity mutation |
| `deck-readonly-draw-export` | Current same-origin public fixture, no Save/name textbox, draw/redraw count, selected export metrics | Read-only fixture | Live public tournament deck, eight-card draw, redraw and export; new fixture values must be verified |
| `supporter-retired` | `/supporter` -> `/home`, Welcome heading, no Supporter text/links | Both | Live redirect/absence; API 404 was a separate HTTP check |

Production's minimal proven subset for a catalog check is search/detail/art without an empty-search requirement. The shared database case includes local empty search; select `options.skipEmptySearch=true` in production until its empty state is intentionally verified there. Log that subcase as skipped. Production mobile, authenticated account pages, foil application, real OAuth, imports/saves, and independent-module integration were not verified by M1's production smoke.

## Invoke through CUA

Use the tool's documented first call to select/create the intended tab and read its returned documentation. After context compaction, call `await cua.rewriteDocumentation()` before continuing. Resolve the browser from the user's selection or current tool inventory; never hard-code a past tab/browser ID. Create a test-owned tab, keep it hidden unless Kyle requests visibility, and do not navigate a tab containing his unsaved work. A tab does not imply a fresh cookie/local-storage session; confirm the actor visibly.

Produce health evidence first (see the skills' environment references). The helper outputs sanitized fields only; it makes HTTP requests, not browser assertions:

```bash
node scripts/browser-test-target.mjs \
  --mode local --frontend http://localhost:5173 --api http://localhost:8085 \
  --expected-revision <full-source-sha> --expected-migration <expected-version> \
  --source-root <intended-checkout> > <private-evidence-dir>/target.json
```

In `cua_repl`, after binding `testTab` and reading browser capability documentation:

```javascript
let browserFs = await import('node:fs/promises');
let m1Suite = await import('/absolute/repository/tests/browser/milestone1.mjs');
let targetEvidence = JSON.parse(await browserFs.readFile('/absolute/evidence/target.json', 'utf8'));
let selectedCases = ['database-search-detail'];
let result = await m1Suite.runMilestone1({
  tab: testTab, target: targetEvidence, actor: 'fictional-account',
  scenarioIds: selectedCases, options: { cardName: 'Lancelot' },
  evidenceDir: '/absolute/fresh-evidence-directory',
});
let browserEvidenceHelpers = await import('/absolute/repository/tests/helpers/browserEvidence.mjs');
nodeRepl.write(browserEvidenceHelpers.summarizeBrowserReport(result));
```

Pass `actor: 'guest'` only after confirming Guest; `fictional-account` means an account confined to the selected disposable local database. It never authorizes an account login or mutation. For requested viewport runs, pass `dimensions` and the documented viewport capability handle; verify rendered dimensions. The suite resets that override in `finally`. Close the test-owned tab after inspecting the report. If Kyle needs the preview, explicitly mark the relevant tab for handoff and record the retained server/fixture lifetime.

When editing a runner already imported into CUA, reset its JavaScript session and follow the documented first-call setup before loading the changed module. Query-string filesystem imports were not supported in the skill-creation validation; do not depend on them to invalidate a cached import. The validation also added an explicit detail-dialog dismissal assertion: refreshed state plus Escape/hidden checks succeeded locally after visual review caught an unverified close click. This is local validation of the extracted runner, not a newly verified production procedure.

## M1 local cases beyond the packaged subset

These were live automated M1 interactions. Reuse the UI/API implementations and existing fixture payload; extend the normal shared suite when the change requires a reproducible assertion. Use [the local fixture reference](../../.agents/skills/test-local-browser/references/local-runs.md) before writes.

| Surface/state | Demonstrated procedure and invariant |
| --- | --- |
| Guest/account | Guest Home -> contextual Log In -> existing fictional local account -> account navigation; Log Out -> Guest. Mobile Profile opens the account sheet. Google control exists, but isolated OAuth configuration was absent. |
| Database | Empty/result search; Carson of Venus printing selector and foil Apply; collection action. Printing choice must retain the selected image/identity through collection reload. Do not interpret Apply as production-safe without reviewing its current side effects. |
| Account Collection | Add foil to fictional collection, Increase to quantity two, Owned only, reload, and observe quantity/printing. Guest quantity one/reload remains browser-local and separate. |
| Owned Deck Builder | Fixture name/reserve save -> Saved -> reload; KO/un-KO changes active stats but is simulation state; Draw Hand/redraw; card More -> Pre-Placed -> Save/reload; Export panel and Import Deck using that JSON. Limited off -> Not Legal; invalid draft Save was accepted. Record domain expectations separately. |
| Pre-placement | Catalog-backed [local payload](../evidence/frontend-preparation/m1/local-fixture-payload.json) deliberately uses Limited and three one-per-deck Sword and Shield copies to exercise counts, not legal deck construction. One flagged physical copy -> seven drawable copies; export includes eight physical copies and omits placement. Import therefore does not restore placement. |
| Desktop/mobile | Live Home/Database/Collection/Deck Editor captured at desktop and 390×844 mobile; mobile bottom navigation and Profile account sheet were used. Close unrelated temporary tabs before resizing if the override affects the wrong tab, then verify the current document's dimensions. |
| Theme | Fixed dark theme only. No light toggle or automatic light mode existed; light is unavailable/skipped, never a pass. When a real light theme exists, test both rather than renaming dark screenshots. |
| Storybook | Fictional Database/Collection/read-only Deck Editor stories; read-only Export opened, with no editable name or Save. `npm --prefix frontend run build:storybook` succeeded; static gallery inspection was separate from app automation. |

The synthetic unit fixture distinguishes editor reserve threat 71 vs backend legality threat 77, printed vs effective/KO grids, physical vs drawable counts, and the ninth event-triggered draw. Use the existing focused test command when those calculations change:

```bash
npm run test:unit -- --runTestsByPath tests/unit/frontend-preparation/compatibility-baseline.test.ts
```

This is unit evidence. M1's live local payload used catalog-backed IDs rather than synthetic unit IDs. Validate IDs, names, unrestricted power printing, and one-per-deck rules against the actual local catalog before seeding; do not transplant synthetic IDs into a database or silently alter rules to make fixtures pass.

## Compare before and after

Capture the failing behavior before editing when the target is available. Re-run the same selected surfaces, actor, fixture contents, flags, catalog/migration, viewports, and theme after editing. Record each source SHA and working-tree fingerprint; local health SHA identifies HEAD, not uncommitted code. If baseline input changes, report why it is incomparable and capture a new explicit candidate; do not overwrite the old baseline or label it accepted automatically.

Use separate directories for before/after; evidence helpers refuse overwrite. Compare visible results (counts, labels, disabled/editable controls, image/printing, route, save/reload state) and screenshots side by side. M1 has no demonstrated pixel-diff threshold, snapshot auto-approval, browser performance budget, or waterfall collector. Random draws, timestamps, mutable Home content, and card-art differences require explanation rather than blanket pixel equality.

M1 screenshot dimensions are mixed: Database/Collection/Deck Editor desktop images are **1200×833**, Home desktop **1440×1000**, mobile **390×844**, Storybook **1280×720**, and production Home **1280×720**. Match the actual artifact for visual comparison; the requested desktop size alone did not prove the rendered size. New explicit-size runs record DOM dimensions alongside screenshots.

## Report contract

For every run report: local/production/Storybook, URLs, checkout and source SHA/fingerprint, intended and observed deployed/API SHA, database/migration and fixture provenance, actor, actual viewport/theme, exact selected cases and subcases, passed/failed/skipped/blocked with reasons, evidence paths, browser errors, cleanup performed/pending, and gaps. Never include passwords, tokens, cookies, private account data, or raw credential-bearing logs.

Distinguish **automated pass**, **ready for Kyle's local spot check**, and **Kyle explicitly accepted**. Only record acceptance from Kyle's actual response to the identified preview. Browser smoke does not replace Ship's gates. After a shipped production failure, alert prominently, summarize the failed case and evidence, and offer a scoped rollback through Ship; do not roll back automatically or resurrect shelved Supporter.

## Future module harness

M1 has no independent Card Database/Deck Builder/Collection harness, external service identity, host-theme matrix, or verified native-host integration. Mark those blocked/unavailable. When it exists, inspect its checked-in entrypoint/configuration first, add host/mount/unmount/theme/asset-base/error/lifecycle cases to this shared suite, and run the same domain fixtures before/after. Keep those results separate from the SPA and from Storybook's mock responses.

## Compact execution and captures

Run selected scenarios together and consume `summarizeBrowserReport(report)` once. Full reports retain revision, fingerprint, outcomes/counts, duration, artifacts and cleanup. Default `capturePolicy: all` preserves captures; before/after work sets `comparison: true`, rejecting failure-only capture. Optional `capturePolicy: failure` is only for behavior smoke without requested visual comparison. No automatic baseline acceptance or pixel-diff tolerance is introduced. Startup `--verify-only` supplies process/proxy/local container-binding evidence; it is separate from browser assertions. See [Ship receipts](../../.agents/skills/ship/references/verification.md) for execution and model authority.

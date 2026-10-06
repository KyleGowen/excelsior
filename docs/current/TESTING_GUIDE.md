# Excelsior Deckbuilder Testing Guide

## Live browser verification

Use [Test Local Browser](../../.agents/skills/test-local-browser/SKILL.md) for the running local app and [Verify Production Browser](../../.agents/skills/verify-production-browser/SKILL.md) for selected production-safe smoke checks. [Browser testing](BROWSER_TESTING.md) records M1's demonstrated scenarios, fixtures, mixed screenshot dimensions, recovery lessons, and reporting contract.

The shared CUA runner is `tests/browser/milestone1.mjs`, with evidence helpers in `tests/helpers/browserEvidence.mjs` and an explicit selection example in `tests/browser/milestone1.config.example.json`. Import it inside the documented CUA browser runtime; it is not a Jest suite or standalone Playwright CLI, and there is no browser CI command. The read-only `scripts/browser-test-target.mjs` verifies the selected health/proxy target first; its `--dry-run` mode never makes HTTP requests.

Jest/Supertest and mocked Storybook tests remain separate evidence. A live browser pass is distinct from readiness for Kyle's local verification and his explicit acceptance. Production mutations require separate authorization and defined fixture cleanup. Missing access, data, credentials, theme support, or harness dependencies must be reported as skipped/blocked, not a pass.

For the new workflow's guard checks, run `node --test tests/unit/browser-workflow-guards.test.mjs`. These test target/selection safety, not rendered browser behavior. Reuse [the skill-creation validation report](../evidence/browser-skills-validation/validation.md) for the representative unchanged M1 inputs rather than rerunning the whole baseline.

## 🚀 Jest Integration Test Framework Setup Complete!

Your project now has a comprehensive Jest testing framework set up with the following features:

### ✅ What's Included

1. **Jest Configuration** (`jest.config.js`)
   - TypeScript support with ts-jest
   - Test environment setup
   - Coverage reporting
   - Separate test database

2. **Test Structure**
   ```
   tests/
   ├── integration/          # Full API workflow tests
   ├── unit/                 # Individual function tests
   ├── helpers/              # Test utilities (ApiClient)
   ├── config/               # Test configuration
   └── setup.ts             # Global setup/teardown
   ```

3. **Test Scripts** (in package.json)
   - `npm test` - Run all tests
   - `npm run test:watch` - Run tests in watch mode
   - `npm run test:coverage` - Run with coverage report
   - `npm run test:integration` - Run only integration tests
   - `npm run test:unit` - Run only unit tests

4. **Sample Tests Created**
   - Authentication scenarios
   - Deck management workflows
   - Read-only mode functionality

### 🧪 How to Use

#### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test deckManagement.test.ts

# Run with coverage
npm run test:coverage
```

#### Writing New Tests

**For Integration Tests:**
```typescript
describe('Your Feature', () => {
  let apiClient: ApiClient;
  
  beforeEach(async () => {
    apiClient = new ApiClient(app);
    await apiClient.login('username', 'password');
  });
  
  it('should do something', async () => {
    const response = await apiClient.createDeck({ name: 'Test Deck' });
    expect(response.body.success).toBe(true);
  });
});
```

**For Unit Tests:**
```typescript
import { validateDeck } from '../../src/utils/deckValidation';

describe('Deck Validation', () => {
  it('should validate a legal deck', () => {
    const deck = [/* test data */];
    const result = validateDeck(deck);
    expect(result.isValid).toBe(true);
  });
});
```

### 📝 Describing Test Scenarios

When you want me to write tests for specific scenarios, just describe them like this:

**Example 1:**
> "I want to test the deck sharing functionality. When a user shares a deck link with another user, that user should be able to view the deck in read-only mode. The viewer should see all deck contents but not be able to edit them. Also test what happens if the deck doesn't exist or if the user isn't logged in."

**Example 2:**
> "Test the card search functionality. When a user types in the search bar, it should find cards by name, type, and character. Test that special cards show up when searching for a character name. Also test the hover effects and the scrollbar visibility."

**Example 3:**
> "Test the save functionality. When a user makes changes to their deck and clicks save, it should persist the changes. Test that validation errors are shown for invalid decks. Test that the save button is disabled in read-only mode."

### Test configuration and categories

Unit and integration tests use separate Jest configs in `tests/config/`. CI automatically shards the complete integration suite; category commands are available for focused local debugging.

**Unit tests**

- Config: `tests/config/jest.unit.config.js`
- Match: `**/tests/unit/**/*.test.ts` (and `*.spec.ts`)
- Run: `npm run test:unit`
- **v2 SPA tests:** `tests/unit/frontend-v2/` — import directly from `frontend/src/` (deck export/import, card images, legality badge, progressive images, etc.). No jsdom loading of removed `public/js` scripts.

**Integration tests (all)**

- Config: `tests/config/jest.integration.config.js`
- Match: `**/tests/integration/**/*.test.ts` (no category exclusions)
- Run: `npm run test:integration`
- Legacy JSON user/session persistence is automatically redirected to a process-scoped temporary directory whenever `NODE_ENV=test`. Tests must not rewrite repository `data/users.json` or `data/sessions.json`. Set `USER_PERSISTENCE_DATA_DIR` only when a test needs an explicit isolated location.
- Run `npm run test:integration:isolated` for the complete suite against a disposable PostgreSQL database without touching the development database.
- Run `npm run test:integration:sharded` for the same complete suite split across two concurrent Jest processes. The runner starts and migrates one disposable PostgreSQL container per shard, assigns distinct server ports, Jest caches, and persistence directories, and verifies before execution that every test file occurs in exactly one shard.
- Run `npm run test:integration:shard-plan` to verify and print the two-shard test-file counts without Docker or database changes.
- A fresh Ship integration gate uses the guarded two-shard runner. The original `npm run test:integration` command remains available for compatibility and focused local debugging against a caller-provided database.

**Integration test categories** (each has its own config in `tests/config/`)

| Config | Pattern / files |
|--------|------------------|
| `jest.integration.security.config.js` | `role-based-restrictions.test.ts` |
| `jest.integration.deck-security-save.config.js` | `deck-save-security*.test.ts` |
| `jest.integration.deck-security-ownership.config.js` | `deck-ownership-security*.test.ts` |
| `jest.integration.deck-security-frontend.config.js` | `deck-save-frontend-validation.test.ts` |
| `jest.integration.game-logic-reserve.config.js` | `reserve-character*.test.ts`, `guest-reserve-character-integration.test.ts` |
| `jest.integration.reserve-core.config.js` | `reserve-character-integration.test.ts`, `reserve-character-loading-integration.test.ts`, `reserve-character-simple.test.ts` |
| `jest.integration.reserve-threat.config.js` | `reserve-character-threat-integration.test.ts`, `reserve-character-threat-persistence.test.ts`, `guest-reserve-character-integration.test.ts` |
| `jest.integration.game-logic-characters.config.js` | `character*.test.ts`, `special-character-threat-display.test.ts` |
| `jest.integration.game-logic-character-validation.config.js` | `characterLimitValidation.test.ts` |
| `jest.integration.game-logic-character-layout.config.js` | `character-column-layout.test.ts` |
| `jest.integration.game-logic-character-threat.config.js` | `special-character-threat-display.test.ts` |
| `jest.integration.game-logic-power-teamwork.config.js` | `power*.test.ts`, `teamwork*.test.ts`, `event-mission-filtering-integration.test.ts` |
| `jest.deckbuilding.config.js` | `deckBuilding.test.ts` |

**Run a single category**

```bash
npx jest -c tests/config/jest.integration.security.config.js
npx jest -c tests/config/jest.integration.deck-security-save.config.js
# etc.
```

**Frontend (v2) unit tests**

- Directory: `tests/unit/frontend-v2/`
- Run: `npm run test:unit -- frontend-v2` or `npm run test:unit -- importDeckFromJson.test.ts`
- Examples: `buildDeckExportJson.test.ts`, `importDeckFromJson.test.ts`, `draw-hand-v2.test.ts` (under `tests/unit/`), `deck-card-catalog.test.ts`, `simulate-ko.test.ts`

### Where to add new tests

- **Unit tests**: Add `*.test.ts` under `tests/unit/` (backend) or `tests/unit/frontend-v2/` (v2 SPA). Use `tests/helpers/apiClient.ts` for integration HTTP helpers. See [tests/helpers/README.md](../../tests/helpers/README.md).
- **Integration tests**: Add `*.test.ts` under `tests/integration/`. Match one of the category patterns above (e.g. `deck-save-security-*.test.ts` for deck save security) so the test runs in the right CI job. See `tests/integration/.cursorrules` for mandatory cleanup rules (track test users/decks, clean up in `finally`).

### v2 layout mode

Mobile/desktop layout in the v2 SPA is driven by `LayoutModeProvider` at the 900px breakpoint. Feature-level unit tests live under `frontend/src/` and `tests/unit/frontend-v2/`; live mobile checks use viewport ≤900px at `http://localhost:5173`. M1 automated 390×844 checks; verify actual DOM dimensions and reset overrides. M1 supported fixed dark only, so light-theme parity is unavailable rather than passed. See [the case matrix](BROWSER_TESTING.md#m1-local-cases-beyond-the-packaged-subset).

### 🔧 Test Configuration

The tests use a separate test database (`overpower_test`) to avoid affecting your development data. The test database is automatically:
- Created before tests run
- Migrated with your schema
- Cleaned up after tests complete

### 🎯 Current Test Status

✅ **All tests passing** (62+ integration tests across 9 parallel categories)
- **Security tests**: Deck ownership, save security, role-based restrictions
- **Authentication tests**: Login/logout, guest users, password security
- **Search & Filtering tests**: Card search, stat filtering, ally search
- **Deck Core tests**: Deck building, management, navigation, editing
- **Deck Security tests**: Save validation, API security, role access
- **Game Logic tests**: Character mechanics, power cards, teamwork
- **UI/UX tests**: Clickability, editability, layout, navigation
- **User Management tests**: User creation, cross-user interactions
- **Remaining tests**: Database views, alternate cards, bug fixes

### 🚀 Next Steps

1. **Uncomment the actual API calls** in the test files when you're ready to test against your real application
2. **Add your app import** to the test files: `import app from '../../src/index';`
3. **Describe specific scenarios** you want me to write tests for
4. **Run tests regularly** as you develop new features

### 💡 Pro Tips

- Use `npm run test:watch` during development for instant feedback
- Check `coverage/` folder for detailed coverage reports
- Use `console.log()` in tests for debugging
- Tests run in isolation - each test gets a clean database state
- Use the `ApiClient` helper for consistent API testing

---

**Ready to test!** 🎉 Just describe any scenario you want tested and I'll write comprehensive tests for it!

### Authoritative integration discovery

The main integration config now includes **every** integration test; the CI
workflow uses eight automatic shards instead of hand-maintained categories.
Category commands remain useful for focused debugging but do not define CI
coverage. `npm run test:integration:shard-plan` additionally rejects any test
file omitted by the Jest configuration. Build the production frontend before
running integration tests that serve app routes.

Security tests in `production-access-policy.test.ts` and the deck-save suites
use the production Express app, real login cookies/JWTs, and disposable data.
Do not use `x-test-user-id` as evidence of production authentication. React
markup must be tested through React; the API's HTML shell is not rendered deck
content. Integration fixtures must use `DATABASE_URL`, never a hardcoded local
port, and must use real current card IDs rather than made-up IDs or old art paths.

Fresh Flyway replay includes a guarded `beforeEachMigrate` repair at version 358:
V201's unordered alternate-art selection could give Van Helsing 529F prize-pack
art and make V359's catalog assertion fail. The callback fixes that foil's source
and map before V359, preserves the prize-pack base, and does nothing after V359.
Applied migration checksums remain unchanged. `legacy-foil-migration.test.ts`
covers the adverse fixture, idempotence, and the version guard; every fresh CI
shard also runs the full migration history.

## Reusable verification receipts

For changes to these helpers, use `node --test tests/unit/ship-verification-guards.test.mjs tests/unit/browser-workflow-guards.test.mjs`, focused `tests/unit/shipWorkflowScripts.test.ts`, and `python3 -B -m unittest discover -s tests/unit -p test_start_local_dev.py`. Offline fixtures test watcher/gate/shard/identity safety; they are not browser, API persistence or production evidence.

[Ship verification](../../.agents/skills/ship/references/verification.md) documents approved parallel batches, content/environment unit/integration receipts, frozen commit contents, offline Actions replay and compact browser reports. `node scripts/run-verification-gates.mjs --plan <private-plan.json> --dry-run` executes nothing. Changed inputs or green commands with no confirmed tests fail. Legacy bare hashes are ignored; unknown files stay inputs. Store evidence outside source; distinguish reused coverage from executed tests. Main-agent/Kyle coverage, recovery, acceptance and production-write authority are preserved.

## Optional application access (M2)

See [SERVICE_ACCESS.md](SERVICE_ACCESS.md) for private local service fixtures and production-off defaults. Focused unit checks are `tests/unit/api/service-access.test.ts`, `tests/unit/api/application-access-adapter.test.ts` and `tests/unit/frontend-v2/api-client-transport.test.ts`; preserve the existing API cache regression. The fixture helper guard is exercised with `node --test tests/unit/service-access-fixtures.test.mjs`. `tests/integration/service-auth-adapters.test.ts` runs against real PostgreSQL and the actual production composition root, through both confidential application adapters. Use the existing isolated integration runner; never point it at a production database or an AWS DB tunnel.

CUA live account checks live in `tests/browser/milestone2-account.mjs`, alongside shared M1 scenarios. Supply a private run-owned local account/deck fixture; it verifies login, deck metadata save/reload/restore, saved Collection, and logout-to-Guest Collection isolation. It records credentials only in memory, keeps evidence credential-free and retains the owned fixture only for Kyle's defined local spot-check lifetime. Select mobile scenarios from M1 after setting the actual viewport; mobile Profile opens the Account panel. These are live browser assertions, distinct from API integration checks or mocked Storybook screens. Real Google OAuth requires its own configured environment and remains unverified when the UI entry is disabled.

## M5 independent module checks

See [module host contract](../../frontend/src/modules/README.md). The development-only `/module-harness.html` uses the same production modules without the SPA router/AuthProvider. Verify local API/proxy health and the intended checkout first; use the normal localhost:5173 server or an explicitly recorded isolated preview. Its supplied local identity and read-only deck fixture must match the intended test.

Run `npx jest --config tests/config/jest.frontend-modules.config.js --runInBand` for fictional module isolation, composition, error/retry, cancellation and disposal. The root .test.ts unit suite does not discover these .test.tsx tests; CI runs them once in unit shard 1. These mocked component tests cannot substitute for live browser evidence. `tests/browser/milestone5-modules.mjs` captures selected local independent-module cases through the existing CUA/browser evidence runner. Close detail before host controls; no Save or quantity changes in its read-only subset.

Keep full failures and successful reruns in separate evidence directories. Normal route checks and Kyle's explicit acceptance remain separate. M6 containment/host integration and M7 packaging are not covered by merely mounting the source modules.

M6 host-root browser cases live in `tests/browser/milestone6-overlays.mjs` and reuse the shared evidence helper. They are local-only/read-only, require verified target health and the declared fictional fixture, and cover portal placement/art, Tab/Escape/trigger focus, open-panel unmount and read-only Draw/Export. Component tests for independent roots, root replacement and nonmodal behavior run through `tests/config/jest.frontend-modules.config.js`; these mocked jsdom checks are separate from live browser proof.

M6 container slice: `tests/browser/milestone6-containers.mjs` is a local read-only CUA runner with selected fixture inputs; reuse the dedicated module Jest configuration for `container-layout.test.tsx`. The live desktop container case requires a browser wider than1120px and changes the host width, not the browser. Separate actual-mobile overlay checks cover the viewport path. API8090 remains the verified identical backend at345e4865 while the5178UI uses366b23af plus uncommitted container source; record both revisions instead of pretending the API reports the UI commit.


#### M6 appearance coverage

`tests/browser/milestone6-appearance.mjs` extends the shared CUA browser helpers for an explicitly verified local harness: default/Paper/High contrast updates without losing search state, detail art/focus/bounds and inherited typography/spacing, read-only draw/export, Collection read, and portal disposal. Run selected desktop/mobile fixture cases after recording separate UI and reused API source identity. It grants no production/mutation authority. Retain comparable normal-route before/after screenshots, failures and cleanup; do not overwrite baselines.

The dedicated `jest.frontend-modules.config.js` additionally exercises omitted/default DOM, separate instance overrides, draft/focus preservation on theme updates and empty-map reset, portal ownership/disposal and invalid host configuration. It maps React and React DOM to the existing locked frontend runtime. These are mocked component tests; Storybook builds and fixture stories are not live browser results. Broader CSS containment, external roots, full light coverage and production-host theme remain unverified unless separately run.


M6 host card actions: `tests/browser/milestone6-actions.mjs` reuses the CUA/evidence helpers for explicitly verified local targets. `runCardActionCases(tab, { target, evidenceDir, deckId, hostActions, mobile })` checks all three module details, preserved defaults or fictional host callbacks, keyboard authentication requests, close/focus and portal disposal. The caller owns actual viewport sizing/reset and temporary tab cleanup. `hostActions:true` runs only receipt callbacks; it must not be described as a successful login or mutation workflow. Account/two-host/null/reset cases remain mocked component tests in the dedicated module runner. Keep before/after defaults and screenshots; do not approve changed baselines automatically. No production execution is authorized by this helper.

### M6 host brand/icon scenarios

Reuse `runCardActionCases` in `tests/browser/milestone6-actions.mjs` with explicitly selected `hostIcons:true` to check Database, Collection and read-only Deck defaults plus host header/detail icons. Omitted/false keeps the existing baseline. `runIconUpdateCase` in `tests/browser/milestone6-icons.mjs` checks removing/reapplying configuration with detail/search state, SVG fallback, portal/focus and unmount cleanup. Caller verifies local frontend/backend/database source ownership, sets actual desktop/mobile dimensions and closes only test-owned tabs/reset viewport. These are read-only fictional host fixtures, not real account writes/authentication or production customization evidence. Capture fresh reports and inspect screenshot changes caused by fixture controls before accepting comparisons. The dedicated frontend-module Jest configuration remains `tests/config/jest.frontend-modules.config.js`; named stories use mocked API responses and are separate evidence.

M6 save-feedback checks use dedicated fictional component tests plus selected live local Guest-copy saves. The fixture harness can delay metadata or reject a mutation before its call; report that simulated failure separately from real HTTP success. Mask session-derived Guest IDs and keep cleanup manifests private. Use disposable copies only, restore/delete only run-owned clones, and preserve the original local source deck. Stories compile separately; their mocked responses do not prove a live save.

M6 native route checks live in `tests/browser/milestone6-routes.mjs` and use the shared evidence helper. Select a verified isolated UI/backend and public fictional read-only deck; never put Guest session identifiers in a URL. They cover desktop/mobile links, nested reloads, route Back/Forward, detail Back/close and unchanged ordinary routes. Await observed host history state; retain failures from edited tabs and compare fresh current-code inputs before attributing them to product code.

`tests/browser/milestone6-unsaved.mjs` checks the live local opt-in host policy with exact privately tracked Guest copies. Apply the viewport after creating the tab and verify actual dimensions. Reset readonly/API fixture controls at case setup so a retained injected save failure cannot corrupt clone setup. Use shared browser evidence and preserve partial failures/cleanup; this is not production testing.

M7 preparation checks: `npm --prefix frontend run check:contracts`, `check:modules`, `build:modules`, `build:delivery-proof`, `check:delivery` and `verify:delivery`; negative architecture cases: `node --test tests/unit/module-boundaries.test.mjs`. Build the ordinary frontend before running HTML-route integration checks, and keep `frontend/dist/index.html` stable while integration is running. Concurrent builds can temporarily remove it. The guarded integration runner uses two independent databases and exact test discovery.

Shared live cases: `tests/browser/milestone7-delivery.mjs` tests the compiled consumer read-only; `milestone7-editor.mjs` requires an explicitly owned fictional local import and caller cleanup. Reuse M6 native containment/navigation cases and selected M1 ordinary-route cases, with the verified checkout/proxy/data receipt. Apply viewport overrides to the actual tab receiving them and confirm actual dimensions. Do not treat mocked component/Storybook, HTTP-only artifact hashes or local success as production browser validation. Full Jest currently retains existing handles; a declared `--forceExit` records terminal completion, while focused new-route tests exit cleanly with handle detection. The source of the broad retained handle remains unconfirmed.

## Final frontend preparation selections

M8's [evidence/audit](../evidence/frontend-preparation/m8/README.md) records the real local matrix and known limits. Reuse shared M1/M2/M3/M4/M5/M6/M7 runners with verified current targets and explicitly owned fictional fixtures. `tests/browser/milestone8-collection.mjs` covers owned empty Guest slow/failure/retry/remount/cleanup and saved Collection edit/reload/normal navigation; `runMissingImageFallback` in the built delivery suite covers a real local404 and emitted placeholder. Neither suite is a Jest CLI or production mutation workflow.

Create the test tab before setting its viewport, verify actual dimensions in that tab, then reset. If a drawer is still present after a close click, inspect it and use the demonstrated Escape/hidden wait before interacting with covered controls. Select the exact printing rather than an ambiguous name after debounced search settles. Saved fixtures with intentionally duplicated specials can be rejected by add validation; use a valid owned add fixture and retain that rejection separately.

Build the ordinary app before modules before the consumer: the app build clears their shared `frontend/dist`. Do not overlap these dependent outputs. Independent Storybook/backend checks can run concurrently. Run Node's architecture tests with `--test-reporter=tap` when collecting gate counts. Guest cleanup intervals no longer own process lifetime; root units exit naturally. The existing integration configuration still declares forceExit. Scoped Collection cleanup deletes owned cards while the parent exists, then owned history/collection/user; deleting only the user can trigger a history foreign-key failure. Preserve rollback/failure evidence and never widen cleanup beyond tracked IDs.

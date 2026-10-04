# Frontend preparation implementation ledger

Roadmap: ChatGPT Page `page_4dbc600954888191af3661eba3834f0b`, **Excelsior Frontend Preparation Plan**, October 3, 2026. This repository owns sanitized implementation evidence. Work remains inside Excelsior; no external copy, iframe, package publication, or infrastructure provisioning is authorized here.

Kyle's execution override is: implement one milestone, automate local browser checks, pause for his local approval, then use the Ship skill; verify production in a browser after deployment before advancing. Production failures require a prominent alert and a rollback choice. No milestone is accepted merely because tests pass.

## Milestone ledger

| Milestone | Status | Acceptance |
| --- | --- | --- |
| 1 Baseline and compatibility contract | Shipped and production verified at `9f8685c3` | Kyle approved locally on October 3, 2026; recorded candidate/main CI, health and production browser pass |
| 2 Service access and player identity | Kyle approved; release gates in progress | Explicit approval on October 3, 2026 refers to the earlier isolated M2 preview; not yet shipped |
| 3 Authoritative draft evaluation | Not started | — |
| 4 Catalog and domain workflows | Not started | — |
| 5 Independent modules | Not started | — |
| 6 Native host integration | Not started | — |
| 7 Frontend delivery boundaries | Not started | — |
| 8 Final readiness verification | Not started | — |

## Source reconciliation and isolation

GitHub main was verified at `200fe228f622db546895a19e10e228fb731c7afe`. The primary checkout was `3075fba84450919773845ff10159d454119c4132`, with unrelated changes and four local commits absent from remote main. The local `4fad73d8` Supporter shelving and `811d5df5` archive had not reached remote main. Thus starting from current remote main resurrected the shelved feature in the preview.

Kyle explicitly instructed **“reconcile it, that cannot end up on production.”** The release candidate applies the shelving intent to current main in isolated branch `codex/frontend-preparation`, resolving conflicts to preserve the later Guest-default authentication, post-auth navigation, current route layout, and Storybook work. The unrelated primary edits and additional local migrations are excluded.

The candidate removes Supporter invitations/pages/assets, provider/API client, checkout/portal/webhook routes, entitlement mutation and runtime repositories/services, Stripe dependency, and auth entitlement fields. Saved Database Views and enhanced Draw Hand return to ADMIN access as in the shelving commit. Historical database migrations and data remain intact. No new migration is required.

Retired API URLs return 404. `/supporter` can still receive the generic SPA shell from Express's fallback, but the React wildcard redirects it to Home; there is no Supporter page or billing handler. `tests/integration/supporter-retirement-v1.test.ts` guards the API boundary.

Local preview: UI `http://localhost:5174`, API `http://localhost:8086`, disposable PostgreSQL `excelsior-frontend-preparation-baseline` on port 15437, migration V365. Existing primary UI/API on 5173/8085 are preserved. Preview card art uses the existing public CDN. `/health` must report database OK; its commit identifies the base HEAD until the candidate is committed, not its uncommitted contents.

The fictional local fixture player is confined to the disposable database. Run-only authentication is supplied privately; credentials must never appear in repository documentation or reports. Destroy the disposable container when the preparation work is no longer needed.

## Three-module scope and present dependencies

| Module | Current consumer and shared presentation | HTTP contracts | Current coupling |
| --- | --- | --- | --- |
| Card Database | `DatabasePage`, numeric/function/power/mission filter rails, `CardTile`, `CatalogAllList`, `CardDetailPanel`, printing/foil controls, pagination | Public `/api/v1/catalog/*`, `/dbv/sets`, `/dbv/deck-backgrounds`; admin Saved Database Views | Auth/layout/query providers, document-wide styles, image configuration; Add-to-Deck/Collection overlays |
| Deck Builder | `DeckSelectionPage`, `DeckEditorPage`, `AddCardsPanel`, character/reserve/KO controls, `DeckListView`, mission rows, Draw Hand, Import/Export panels | `/api/v1/decks/*`, `/guest/decks/*`, `/decks/validate`; public catalog arrays | Router/user paths, Auth/query/layout providers, shared deck tiles, image helpers, browser calculations and storage |
| Collection | `CollectionPage`, `CatalogAllList`, `CardTile`, details, quantities, filters, pagination | `/api/v1/collections/me/*` plus catalog and sets | Auth/layout/query providers; browser-local Guest collection; printing identity by type/card ID/image path |

Cookie `/api/auth/*` is the present SPA session entry. V1 Bearer login/refresh/logout are available for direct HTTP. Public deck reads do not grant ownership. Persistent writes require the authenticated owner; Guest deck endpoints maintain session isolation.

## Complete domain inventory and destination

Paths below are relative to `frontend/src`. Files remain live until their replacement has parity evidence; M1 changes none of these rules.

| Current calculation or workflow | Source inventory | Later milestone |
| --- | --- | --- |
| Legality, Limited bypass, add constraints, live badge/errors | `lib/deck-usability/` (context/index, Any/Multi thresholds, named-character abilities, special/mission/homebase conditions), `lib/decks/validationErrors.ts`, `addCardsLimits.ts`, `deckCardControls.ts`, `features/deck-editor/addCardsTeamStats.ts`, `addCardsFilters.ts`, `addCardsCatalog.ts`; server `DeckValidationService`/rules and add validation | M3 legality/display evaluation; M4 usability/catalog |
| Threat, reserve exceptions, ordinary/effective grids, ability adjustments | `lib/decks/deckThreat.ts`, `reserveCharacter.ts`, `deckMaxStats.ts`, `simulateKo.ts`, `iconTotals.ts` | M3 display model; M4 KO/usability |
| Counts, physical copies, pre-placement, ordering/aggregation | `lib/decks/deckInstances.ts`, `prePlaced.ts`, `drawHand.ts`, `characterOrder.ts`, `deckEditorSectionOrder.ts`, `deckListView.ts` | M3 metrics; M4 draw; M5 presentation ordering |
| Draw, ninth event card, duplicates, Venture estimate | `lib/decks/drawHand.ts`, `drawHandAnalysis.ts`; `DrawHandPanel` | M4 stateless simulations; retain standard Guest/User draw and ADMIN analysis access |
| Export/import identity and round trip | `lib/decks/buildDeckExportJson.ts`, `extractCardsFromImportJson.ts`, `resolveImportCardIds.ts`, `importDeckFromJson.ts`, `importTypes.ts`, `importCatalogLoader.ts`; selection export input hook; server deck import/export service | M4 authoritative import/export with explicit compatibility |
| Search, aliases, filtering, sorting, catalog type/name mapping | `lib/catalog/catalogTypeMap.ts`, `allCatalogSort.ts`, `catalogSetSort.ts`, `setNames.ts`, `features/database/filters/`, `savedDatabaseViewState.ts`; shared search/sort helpers | M4 catalog/search; M5 filter UI |
| Defaults, grouped characters/missions, foil/alternate printings | `lib/catalog/defaultCatalogCards.ts`, `characterStacks.ts`, `missionSets.ts`, `cardPrintings.ts`, `foilCatalog.ts` | M4 stable canonical and printing identities |
| Catalog load/cache and deck card resolution | `lib/catalog/useAllCatalogCards.ts`, `lib/decks/deckCardCatalog.ts`; API client/catalog adapters | M2 access adapter; M4 catalog contract |
| Guest cloning, collection quantities/totals/printing keys, favorites | `lib/decks/guestCloneOnOpen.ts`, `favoritesQueryKey.ts`, `useFavoriteToggle.ts`, `lib/collection/guestCollection.ts`, `useCollection.ts` | M2 player identity; M4 persistence/ownership; M5 lifecycle |
| Card/deck preview and mission labels, images, tile slides | `lib/decks/deckPreviewImages.ts`, `deckTileArtSlides.ts`, `missionSetLabel.ts`, `features/deck-editor/deckEditorCardImage.ts`; `lib/images/`, style/layout/history providers | M5 display; M6 host/overlays; M7 declared assets |

Shared consumers include Home/community/tournament deck tiles, deck selection summaries, Card Detail, add-to-deck/collection overlays, and read-only deck links. Changing a shared metric or printing key must recheck these consumers.

## Fixtures and acceptance matrix

Use fictional data in tests and Storybook, and disposable local data for live flows. Existing tests supply complementary fixtures rather than copying production users or decks.

| Case | Reproducible fixture/evidence | Preserve |
| --- | --- | --- |
| Guest/default entry, account sign-in/logout and safe return | `frontend-v2/guest-default-auth.test.ts`, `post-auth-navigation.test.ts`; Storybook Profile Menu auth states; local fixture player | Home first; contextual credentials; fresh Guest session after logout |
| Owner/non-owner and Guest separation | Integration owned/guest deck and authorization suites; Deck Editor Editable/ReadOnly stories | Read-only controls, ownership enforcement, no Guest deck transfer |
| Limited and invalid drafts | `limitedDeckFunctionality.test.ts`, `frontend/deckLegalityBadge.test.ts`, `deckUsability.test.ts`, current add-rule tests; integration deck mutation/validation | Limited bypass and server-owned validity; preserve ability to save current invalid draft semantics |
| Reserve and ability stats | `reserve-character-v2.test.ts`, `simulate-ko.test.ts`; new compatibility fixture | Distinct editor reserve threat vs backend threat; ordinary vs effective stats |
| Any/Multi Power and exceptional usability | `deckUsability.test.ts`, `addCardsFilters.test.ts`, `glenn-inherent-ability.test.ts`, `michonne-inherent-ability.test.ts`, `alpha-inherent-ability.test.ts`; server add validation | Training any-primary cap vs Power/Teamwork max threshold |
| Pre-placement and physical copies | `draw-hand-v2.test.ts`; new compatibility fixture | Only one flagged physical copy per aggregate; exclude it from draw, retain it in icons/export lists |
| Foil/alternate printings and names | `cardPrintings.test.ts`, `foil-api-and-repository.test.ts`, printing/default catalog and alias tests | Variant IDs survive grouping; chosen printing owns collection image identity |
| KO / Draw Hand | `simulate-ko.test.ts`, `draw-hand-v2.test.ts`; seeded synthetic fixture | KO is simulation-only; redraw does not persist KO state; event can draw ninth card |
| Import/export | `frontend-v2/importDeckFromJson.test.ts`, server deck import/export tests; new compatibility fixture | Exact names/types and current failure outcomes; no implied atomicity |
| Guest / saved collection | `collectionService.test.ts`, collections HTTP/integration; browser owned foil save/reload | Browser-local Guest store; saved account quantities keyed to printing |

`tests/unit/frontend-preparation/compatibility-baseline.test.ts` establishes synthetic expected values:

| Meaning | Expected |
| --- | --- |
| Editor threat with synthetic Victory reserve / without reserve | 71 / 77 |
| Backend legality threat | 77, rejected over cap 76 |
| Ordinary printed maxima E/C/B/I | 7 / 7 / 6 / 8 |
| Effective KO maxima, no KO | 7 / 7 / 8 / 8 |
| Effective maxima after Victory + Time Traveler KO | 6 / 7 / 8 / 6 |
| Physical playable copies / one pre-placed / drawable | 8 / 1 / 7 |
| Combat icons / exported total physical cards / exported special list | 8 / 8 / 3 |
| Event-first deterministic hand / no-event hand | 9 / 8 |
| Import create succeeds then card save fails | Error returned; created empty deck remains; metadata update not called |

Do not collapse these different meanings into one total. The live catalog-backed fixture saves and reloads seven drawable cards but exports eight physical cards, with three Sword and Shield entries. `useDeckExportInput` uses `countPlayableCards`; the editor uses `countCardsInDeck`. The export does not encode pre-placement, and imports currently perform multiple non-atomic requests. These are baseline discrepancies, not permission to silently repair them.

Mutation payload example: `{ "cards": [{ "cardType": "special", "cardId": "baseline-sword", "quantity": 3, "exclude_from_draw": true }] }`. Validation payload uses `type` in place of `cardType`. KO IDs are simulation input and never saved in this payload. Client-supplied `is_valid` is not an authority.

## Proposed compatibility contracts

These are design contracts for later milestones, not implemented APIs in M1.

- **Draft/display:** input carries schema version, draft ID, monotonically increasing revision, typed card/printing IDs, quantities, per-copy placement, reserve, Limited, and optional simulation state. Response echoes revision and exposes separate `editorThreat`, `legalityThreat`, printed/effective/active grids, physical/drawable counts, icon totals, legal/errors, usability/reasons, and calculated export metrics. Consumers discard superseded responses and keep pending/failed validation distinct from legality.
- **Catalog:** opaque canonical identity and distinct printing identity; preserve existing IDs as aliases, type, set/checklist number, foil/alternate relationship, chosen image, search aliases and stable sort/display fields. Catalog version/ETag identifies the data used for evaluation. Host-configured asset base is separate from domain identity.
- **Identity/access:** authenticated service principal identifies the approved calling server; authenticated player principal identifies the existing Excelsior user and ownership. Neither substitutes for the other. Browser receives no service secret. Guest session identity and browser-local collection stay isolated. Future external-login mapping is explicit and not an assumed migration.
- **Modules:** independent Card Database/Deck Builder/Collection inputs declare catalog/access/evaluation adapters, identity capabilities, query lifecycle, host theme/asset/base-path, navigation/action callbacks and overlay root. Modules return actions/results rather than redirecting the host to Excelsior URLs. Loading, empty, error, retry and cleanup are local module responsibilities.

## Visual and interaction baseline

Evidence directory: `docs/evidence/frontend-preparation/m1/`. Desktop target 1440×1000, mobile 390×844. The current site and Storybook use one fixed dark token set; no user-selectable or automatic light theme exists. Light-theme parity cannot be claimed. Record this as a host-theme requirement for M6, without introducing a visual change during baseline work.

Local browser paths cover Guest Home and menu, signed-in Home, catalog empty search/Carson foil selection, saved foil quantity/reload, deck opening/editing/export/draw and mobile layout. Storybook screen fixtures cover Card Database, Collection, Editable/ReadOnly Deck Editor. Loading and error components and existing named examples are part of the gallery; a successful build alone is not an interaction test.

Google sign-in is disabled in the isolated preview because no Firebase service account/client configuration was copied. Its production code is retained; a real OAuth round trip remains unverified here. No populated credentials or private session data belongs in baseline artifacts.

## Insomnia and performance

Kyle has no previous Insomnia workflow. Root imports and [`INSOMNIA_API.md`](../../INSOMNIA_API.md) establish default local API 8085, production `https://excelsior.cards`, and isolated API 8086. Cookie and Bearer examples use existing identities. SSM forwards PostgreSQL only and is not an HTTP base URL.

Controlled API reads record endpoint count, response bytes and elapsed local HTTP time in `docs/evidence/frontend-preparation/m1/api-read-baseline.json`; these are cold/warm local samples, not production latency or a full browser request waterfall. Repeat under the same environment in M8. Browser request counts and stale/slow/error scenarios need explicit measurements when the new adapters are connected.

## Approval and release

Kyle approved the concrete local spot check and explicitly authorized dependency audit remediation followed by Ship on October 3, 2026. The audit now reports zero vulnerabilities: `@fastify/busboy` is 3.2.2; Jest/Babel-Jest/jsdom are 30.5.2 with compatible ts-jest 29.4.14 and Jest types 30; Knip is 6.39.0; `tsx watch` replaces ts-node-dev. These maintained tools remove every dependency path to unpatched `braces` rather than suppressing the advisory. The updated dead-code check, backend type check, and replacement development server health check pass.

The recorded baseline checks preceded that remediation: 3,729 unit tests, 1,003 integration tests across 112 files, lint/type/SOC2, both frontend builds, and the listed local browser paths passed. The final frozen candidate must pass the Ship gates again before commit. Candidate exact-SHA CI, main deployment, and cache-bypassed production health are required, followed by production Home/Database/Deck/Collection browser smoke checks and confirmation that Supporter is absent. On failure, alert prominently and offer a focused rollback. Do not advance to M2 until this release is verified.

Rollback is a scoped Git revert of the shipped milestone followed by the normal release gates and deployment verification. There is no database downgrade for this candidate. Kyle's explicit Supporter-shelving requirement must still govern any rollback: do not restore Supporter accidentally; use a focused corrective release if reverting the whole milestone would resurrect it.

## M1 release verification

Commit `9f8685c3eae7d9261d061055074216f45e073c72` passed candidate run [37148407444](https://github.com/KyleGowen/excelsior/actions/runs/37148407444), then main deployment run [37148744457](https://github.com/KyleGowen/excelsior/actions/runs/37148744457). Actual unit/integration test steps and Security Gate succeeded; all 29 main jobs succeeded. Final local gates passed 3,729 unit tests, 1,003 integration tests across 112 files, 45 SOC2 tests, lint/types, frontend/Storybook builds, Knip, and zero npm audit vulnerabilities. The Jest 30 update required replacing one removed spy type, without changing assertions. An isolated V359 fixture migration setup failed once and passed on its bounded retry.

Cache-bypassed production health confirmed the exact SHA, database OK, and V365. Browser smoke passed Guest Home and contextual sign-in controls, catalog search/Lancelot details and loaded artwork, public read-only deck with no Save control, eight-card draw/redraw, export parity (51 cards, threat 76, Black Samson reserve), and empty browser-local Guest collection. Retired `/supporter` redirected to Home with no Supporter text or links; the former status API returned 404; browser error log was empty. One Collection locator initially used the wrong heading; corrected `My Collection` and empty-owned checks passed. Kyle received an explicit test alert and focused rollback option. No application regression was found. Production account mutations and real Google OAuth were not exercised.

GitHub branch protection could not be confirmed with the available account; validation-first promotion was retained. Laptop AWS command-list permissions were unavailable, so deployment completion was followed through the exact GitHub run.

## Milestone 2 implementation and local handoff

### Scope and source

M2 is isolated in the managed `frontend-preparation-m2` worktree on `codex/frontend-preparation-m2`, based on `f49b28138b424ccf58de231c8350ea00aa4df064` (the approved skill-hygiene commit built on current main `68c7a469`). The primary dirty/stale checkout and its unrelated Supporter/API/card/AWS changes were preserved. Reconcile the approved hygiene branch and current main at the later Ship boundary; do not transplant primary-checkout changes. M2 is uncommitted. The [implementation manifest](../evidence/frontend-preparation/m2/implementation-manifest.json) identifies the frozen application/test inputs; browser reports retain their point-in-time tree fingerprints. Adding documentation/evidence changes the full-tree fingerprint without changing those code inputs.

Two distinct confidential development clients, `excelsior-web` and `lrg-web`, are usable through tested server adapters. Private generated files stay outside Git and the browser. Service identity has explicit scopes, issuer/audience/type, 30–300 second TTL, epoch/version revocation, overlap rotation, per-client process-local limits, an issuance IP limit, and credential-free audit. Verified client identity remains separate from player/session ownership. Scope-denied/throttled audit events retain a verified client ID; operations use scope rather than record IDs. Explicit service-bearing origin responses use no-store.

The ordinary Excelsior preview uses its same-origin server adapter with no login or UI changes. The second client is exercised through a separate local host adapter fixture and actual HTTP integration checks; there is no deployed LRG frontend or independent module harness yet. Browser transport now permits an explicit public origin/host prefix, player header provider, credentials policy and single-flight renewal without importing server secrets. Existing direct cookie/JWT callers remain compatible. Production flags and credentials were not provisioned. See [SERVICE_ACCESS.md](SERVICE_ACCESS.md).

### Preview and fixtures

- UI: `http://127.0.0.1:5175`; API: `http://127.0.0.1:8088`. The normal localhost:5173/8085 target and retained M1 preview were preserved. A pre-existing 8087 listener had a different checkout/revision; it was left untouched, and only M2's new processes were moved to 8088.
- Owned disposable Docker database: `excelsior-frontend-preparation-m2`, loopback port 15439, Flyway V365. Startup helper checks listener checkout, DB binding, API health and frontend proxy, rather than relying on port availability. Development service/adapter flags are enabled only in this preview.
- Fictional account plus catalog-backed Limited deck and one owned Collection card are retained for Kyle. The test restored the deck name after saving/reloading. Integration-created users were checked absent; Guest decks are deleted in finally blocks and test Guest sessions are deleted by exact token. Integration-runner containers are cleaned automatically. The [ownership manifest](../evidence/frontend-preparation/m2/fixture-ownership.json) contains only fictional fixture IDs, not credentials.
- The preview/container and private fixture files have a defined spot-check lifetime. Keep them until Kyle accepts/rejects M2; clean only their owned IDs/processes afterward. Do not replace existing servers or touch production/tunnel data.

### Automated browser evidence

M1's shared CUA suite is reused. Desktop: 1280×720; mobile: 390×844; fixed dark. Four desktop before/after cases passed: contextual Guest Home, card search/empty result/artwork/details dismissal, browser-local empty Guest Collection, and retired Supporter redirect/absence. Retained M1 code supplied two mobile baseline cases (Database and Guest Collection), both matching after results. Home and card-detail captures are pixel-identical at the measured tolerance; Guest Collection differs by 8 pixels (0.001%) and visual review found the same layout/content. No accepted screenshot was overwritten.

Thirteen selected M2 browser scenarios passed: those four desktop cases; password login, owned deck save/reload/restore, saved account Collection and logout-to-empty-Guest isolation; read-only deck Draw Hand/redraw/export on desktop; Database/Guest Collection/read-only deck on mobile; and mobile contextual Account controls. The [account suite](../../tests/browser/milestone2-account.mjs) reuses the normal evidence helpers. Google is visibly disabled in this local environment; account-creation entry is observed, but browser signup and actual Google OAuth are not claimed. Signup itself succeeded through the real local API adapter to create the fixture.

Browser scenarios and before/after screenshots are under [M2 evidence](../evidence/frontend-preparation/m2/). HTTP integration tests are separately identified as API tests; unit/component tests and Storybook build are not live browser validation. Light theme and M5 harness remain unavailable. The M2 fixture uses newly resolved catalog UUIDs and 8 drawable cards, rather than silently reusing M1's generated IDs or claiming its pre-placed 7-card fixture expectation.

### Recovery evidence and remaining acceptance

Initial evidence writes into the managed checkout were denied by the browser sandbox, so CUA captured in a private temporary directory and authorized file tools copied sanitized artifacts into the repository. An initial assignment error occurred after the baseline had already completed; its report was reused rather than rerun/overwritten. The account Collection is in list view, so its observed card button name differs from the Database grid's `View Lancelot`; the corrected test passed. A stale M1 catalog UUID failed fixture insertion; current local catalog identity lookup recovered it.

The first integration policy run incorrectly classified credential issuance as player-protected; its test now recognizes an authentication entry point and proves private configuration is still required. Disabled service configuration returns 503 for an explicit service token, even with a valid player cookie. A later run saw inconsistent compiler metadata because audit fields changed while it was active; it is not counted as a passing final run. Implementation/tests were then frozen and checked again.

Kyle must still spot-check local navigation/login/logout, owned deck saving and Collection, and the updated Insomnia service/player read/renewal requests. The SSM tunnel forwards PostgreSQL, not HTTP. M2's HTTP base is configured independently, and automated tests did not use the production database. Actual Insomnia desktop/tunnel coexistence acceptance remains Kyle's check. Production provisioning, CDN bypass/dedicated API-origin policy for service-bearing traffic, distributed limits, real LRG hosting and real Google OAuth remain separate future boundaries. No production browser tests or deployments were performed for M2. Automated success is readiness for Kyle, not his acceptance. Ship is paused until that explicit acceptance.

### Final M2 checks

[Verification report](../evidence/frontend-preparation/m2/verification.json): 3,779 unit assertions passed (18 established skips), 1,009 integration tests passed across 113 discovered suites in the frozen isolated run, 51 focused M2/cache unit checks and 66 final security integration checks passed. Typecheck, lint (0 errors; 421 existing warnings), 45 SOC2 assertions, frontend/Storybook builds, fixture-generator guards and zero-vulnerability npm audit passed. Production Knip dependency/duplicate gate passed; full Knip has existing findings and no new M2 findings versus the unchanged hygiene base. No React component, CSS or visual style was added/changed.

The ordinary full-unit invocation completed its assertions but retained eight existing GuestDeckPersistence cleanup timers from older unit tests that import the production root. Its terminal rerun used explicit `--detectOpenHandles --forceExit` and exited 0; the limitation is recorded rather than reported as a clean default-runner shutdown. Focused M2 units exited normally. The final frozen integration run passed and cleaned its containers. Two final live browser cases (Home/Database) also passed after the cache/audit changes with fresh startup/target identity proof.

Kyle's signed-in fictional deck is open at `http://127.0.0.1:5175/users/d005c30a-5857-4581-b4c9-ba3569d283a3/decks/6b96cbc2-f3d3-4a20-8b29-9ed4d96e3137`. Public root imports remain credential-free; the runtime full private local Insomnia import is `/private/tmp/excelsior-m2-private/insomnia-local-private.json` (0600), with separate client environments and the owned fictional account only. Select the named private M2 local environment, issue a service token, copy its response token privately, then verify catalog, cookie-owned decks, Bearer Collection and player refresh. API base is `http://127.0.0.1:8088`; do not use a PostgreSQL tunnel port as HTTP. Actual Insomnia import/client use remains a Kyle check. No credential values belong in this ledger or screenshots.

### Kyle acceptance and release scope

On October 3, 2026, Kyle said “milestone 2 looks good … ship it” and explicitly confirmed that his approval referred to the earlier Milestone 2 preview, rather than the subsequently restarted main checkout at localhost:5173. This is Kyle’s acceptance, separate from automated readiness. The earlier handoff paragraphs above record their point-in-time pending state. Actual Insomnia desktop execution is not independently evidenced.

The release retains the approved skill-hygiene ancestor `f49b28138b424ccf58de231c8350ea00aa4df064`, which Kyle previously authorized for main. Remote main remains `68c7a46980b4894172c445f28526b2a3a841878e`. Only the isolated M2 implementation, contracts, tests, and sanitized evidence are included in the new commit. The dirty primary checkout, its shelved Supporter changes, and local V366/V367 migrations remain excluded. Production service flags and credentials remain unprovisioned. Kyle subsequently requested stopping all local servers; the M2 preview is now stopped and the standard main checkout is running separately.

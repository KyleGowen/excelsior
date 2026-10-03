# Frontend preparation implementation ledger

Roadmap: ChatGPT Page `page_4dbc600954888191af3661eba3834f0b`, **Excelsior Frontend Preparation Plan**, October 3, 2026. This repository owns sanitized implementation evidence. Work remains inside Excelsior; no external copy, iframe, package publication, or infrastructure provisioning is authorized here.

Kyle's execution override is: implement one milestone, automate local browser checks, pause for his local approval, then use the Ship skill; verify production in a browser after deployment before advancing. Production failures require a prominent alert and a rollback choice. No milestone is accepted merely because tests pass.

## Milestone ledger

| Milestone | Status | Acceptance |
| --- | --- | --- |
| 1 Baseline and compatibility contract | Locally accepted; approved audit remediation applied; final release gates pending | Kyle approved the spot check and requested remediation then Ship on October 3, 2026 |
| 2 Service access and player identity | Not started | — |
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

The local-only fixture player is `preparation-player` / `Local-fixture-only-2026`, email `preparation-player@example.invalid`. It exists only in the disposable database. It is not an external identity, credential, or account migration. Destroy the disposable container when the preparation work is no longer needed.

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

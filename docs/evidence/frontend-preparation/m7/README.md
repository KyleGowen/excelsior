# M7 local verification

M7 is implemented and ready for Kyle's identified local spot check. It is based on `ec2af89558dfaf25faf0813944830ff6244f6944` plus the uncommitted M7 candidate. This is not a deployed revision. [Requirement audit](completion-audit.md), [aggregate verification](verification.json), [runtime input inventory](runtime-inputs.json) and [verified local target](target.json) identify the tested inputs.

## Preview and acceptance

- [Compiled frontend-only consumer](http://127.0.0.1:5187/delivery-proof/): imports emitted JavaScript and declarations, owns its base path, font and image contracts, and demonstrates two independent instances at 390/720/1120 widths.
- [Native host](http://127.0.0.1:5186/prepared-host/tools/cards): routing, Card Database, Collection and Deck Builder integration.
- [Ordinary app](http://127.0.0.1:5186/home): Guest/import/editor compatibility against isolated local API8091 and Docker15442/V365.

For Kyle's check, inspect fonts, images/icons, narrow/wide containers and the second instance; open card details, Draw Hand and Export; then check ordinary deck editing, pre-placement/KO and import if desired. Any edit should use a new disposable local copy. Automated success establishes readiness; Kyle approved M7 with ‘m7 approved, ship’. Candidate/main release gates and production confirmation remain pending. No M7 commit, push, deployment or production browser test has run. M6 was accepted and shipped separately.

[Handoff capture](handoff.jpg) shows the compiled consumer with resolved Lancelot art and its own host font.

## Selected real browser runs

All 32 final selected cases passed, with zero failures, skips or blocks. These are live CUA browser interactions with local services, distinct from mocked component tests and API-only tests. Reports retain individual steps, assertions and adjacent screenshots.

| Selected run | Passed | Evidence |
| --- | ---: | --- |
| Compiled consumer desktop | 4 | [Report](built-final-desktop/report.json) |
| Compiled consumer mobile | 4 | [Report](built-final-mobile/report.json) |
| Native desktop | 6 | [Report](native-desktop-final/report.json) |
| Native mobile | 6 | [Report](native-mobile-final/report.json) |
| Owned imported editor | 6 | [Report](atomic-editor-capability-final/report.json) |
| Ordinary Milestone 1 compatibility | 5 | [Report](ordinary-final/report.json) |
| Guest import/save/list summary | 1 | [Report](guest-summary-final/report.json) |

Coverage includes delivered fonts and host-font preservation, resolved images, detail modal/Escape/containment, two independent contracts, host widths/disposal, nested reload/Back/Forward, Collection, read-only public draw/export, real Guest atomic import, pre-placement, KO dimming, card removal/save/reload, candidate availability and correct Limited/threat list summaries. The fictional eight-card source exports eight cards/18 threat/Limited; removing two cards disables Draw Hand because six cannot draw eight. KO affects team/dimming without reducing playable count.

Two exact run-owned Guest imports were deleted and 404-verified; the original four-deck inventory and source fixture remain unchanged. See [editor cleanup](cleanup-import.json) and [summary cleanup](cleanup-summary.json). Production records were not changed.

## Gates and artifact binding

Final unit gate: 3,921 passed, 18 existing skipped; 334 passing suites and two skipped suites. The broad gate explicitly uses forceExit because of existing retained handles; focused new route/core tests exited cleanly, and the broad handle cause remains unresolved. The final private log digest is recorded in the aggregate receipt rather than committing raw auth-bearing logs.

Module tests: 87 passed in six suites. [Integration](integration.json): 1,028 passed in 118 suites with both disposable databases cleaned. [Architecture negatives](architecture.json): 10 passed. [Backend emitting build](backend-build.json), backend/frontend types, ordinary/module/consumer/Storybook builds, eleven-contract parity, SOC2 (45 cases), registered Knip and OpenAPI parse/131 references passed. Lint has zero errors and 423 existing warnings. Root/frontend dependency audits found zero vulnerabilities. Full Knip still has unrelated existing findings; only newly orphaned M7 helpers were removed or made private.

[Frontend-only delivery proof](delivery.json) records all 285 artifact paths with aggregate provenance; complete individual artifact hashes remain in private retained evidence and confirms the proof has no backend source or repository card-art tree. It reuses installed frontend dependencies and does not demonstrate a second clean installation. The compiled consumer has a 562KB chunk warning; no size optimization claim is made.

[Final artifact binding](artifact-browser-binding.json) confirms all 22 compiled runtime artifacts are byte-identical to those exercised in the browser. Browser evidence was reused after unused private helper/export, fixture, checker and documentation cleanup; declarations were rebuilt and independently typechecked. Integration evidence is reused after unused private export cleanup without HTTP behavior changes. All 690 recorded runtime source/asset/dependency inputs matched at packaging. Individual source hash evidence is retained privately, with the path inventory and aggregate provenance published to avoid the demonstrated M6 checksum false positives; scanner policy is unchanged.

The [original parallel gate receipt](parallel-gates.json) retains its failed overall status: Node's default spec reporter did not supply the expected TAP counts. The explicit-TAP final architecture receipt supersedes that reporting failure, without rewriting the original evidence.

## Comparisons and troubleshooting

[Ordinary screenshot comparison](ordinary-comparison.json) retains the M6 baseline: Database results/detail and Collection are pixel-identical. Home has eight pixels above a channel delta of 20; deck has 701. Viewed before/after captures preserve controls, layout, eight cards/Limited/18 threat, grids and icons; the small raster difference cause is unconfirmed. No baseline was overwritten. Random draw order is not a pixel baseline.

[Retained attempts](retained-attempts.json) distinguishes checkout/disk and startup configuration repairs, build/integration overlap, an actual Guest Limited/threat summary defect and its fix, viewport binding/navigation settling, incorrect new test assumptions, reporter formatting, unit listener timing and safe cleanup recovery. Raw logs and session-derived URLs remain private. Historical native runner text referring to future M7 proof is superseded by this actual M7 proof; it is retained as historical evidence rather than silently rewritten.

## Remaining gaps

Actual external host identity/OAuth, ADMIN analysis in a live browser, non-Latin fonts, a complete accessibility audit, native Chrome unload prompt presentation, production host fallback behavior, package size optimization and a second clean dependency installation remain unverified. Local success is not production validation. M8 and any real host launch/rebrand remain future work.

## Approved release attempt

Kyle approved M7. Initial Ship gate collection failed with local ENOSPC and strict lint found one unused type import. Regenerable Jest cache was removed; the import was removed and all 284 emitted backend JavaScript files match the browser-tested build. Strict lint, backend types, SOC2, root/frontend zero-vulnerability audits, contract parity and ten architecture negatives pass in the corrected batch. Required conditional unit/integration gates remain pending: local Docker availability probes timed out and its documented normal restart failed. Force-quit recovery awaits specific local approval; no M7 commit or push occurred. Original failed private logs and frozen candidates remain retained.

## Release outcome

The historical candidate evidence above is superseded for release status by [M7 verified release](release/README.md). Kyle approved the local candidate; ca6d811fd0872859c01e575295a79678442b76b0 passed exact CI/deployment/health and all five selected production browser cases. Post-release bookkeeping remains uncommitted.

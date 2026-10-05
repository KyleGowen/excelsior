# M6 final completion preview

Kyle approved the final preparation implementation on October 5, 2026 ("spot check approved proceed"). The approved preview is at [the native host preview](http://127.0.0.1:5185/prepared-host/tools/cards). It is an uncommitted candidate based on `7ddb972ea1a3165e6d17b4a17925ce00aa19be78`. This task did not commit, push, deploy or run production tests. Final acceptance is recorded; release gates, shipping and production confirmation follow under the milestone workflow.

The native React modules now have an opt-in isolated stylesheet/reset/token surface, local root-font units, container-based layout, contained overlays and shadow-aware focus. A deliberately conflicting fictional host exercises appearances, dimensions, brand/icons, card/auth callbacks, feature restrictions, routing and independent instances. Native Link/Back/Forward and explicit host navigation protect dirty/pending saves. Defaults retain the ordinary Excelsior presentation. This is preparation; no real rebrand, iframe, Supporter restoration, LRG copy or publication is included.

## Verified local target

UI 5185 runs the completion checkout. Its proxy uses the existing API 8090 at `345e486514ad8cc9b0f6a04fa3e849222bdda046`, with identical backend/migration/dependency inputs, Docker `excelsior-frontend-preparation-m4` on loopback 15442 and Flyway V365. API/database health and process/database ownership were verified using Start Excelsior's existing workflow. The primary checkout and other previews were preserved. [Target receipt](target.json) separates frontend and backend revision; [runtime inputs](runtime-inputs.json) identify uncommitted application inputs independently of later documentation packaging.

## Automated browser results

All 21 selected cases passed with zero new browser errors. These are live CUA browser runs, distinct from the mocked component and Storybook fixtures.

| Selection | Actual size | Passes | Evidence |
| --- | --- | --- | --- |
| Native read-only containment, root-font stress, 390→1120→720 container transitions/input retention, callback receipts, modal keyboard/bounds, independent themes/state/disposal, nested reload/Back/Forward, read-only Draw Hand, feature restrictions, route cleanup | 1280×720 | 6 | [Desktop report](native-desktop/report.json) |
| Same selected native read-only cases, bounded to available mobile space | 390×844 | 6 | [Mobile report](native-mobile/report.json) |
| Owned Guest draft Link/Back/Stay, Forward/Stay/discard, save-pending blocking, failed-save/external Stay, successful clean handoff save | Default 428×808 | 5 | [Guard report](native-guard/report.json) |
| Ordinary Home, Card Database/search/details, Guest Collection read, public read-only deck/Draw Hand/raw export | 1280×720 | 4 | [Ordinary report](ordinary-after/report.json) |

Readonly cases use real local API reads. Guest saves persist through the local API; the explicitly selected delay and rejection are injected by the shared fixture helper, not demonstrated backend outages. Callback receipts are fictional host delegation, not real authentication or third-party integration. Account behavior has component-fixture coverage; no real OAuth login is claimed.

The final readonly/ordinary runs precede only the last development-host discard-continuation correction. Their stylesheet, production-module, route and selected readonly inputs are unchanged. The guard suite was rerun after that correction and all builds. Reusing these results avoids repeating the entire M1 baseline.

[Before/after comparison](ordinary-comparison.json) preserves both captures rather than accepting new baselines. Database result/detail and Collection screenshots are pixel-identical. Home has 46 above-threshold changed pixels. The deck has 979 such pixels confined to raster stat icons; reviewed labels, positions, controls and 8-card/18-threat metrics agree. The raster difference's cause remains unconfirmed. [Deck comparison image](ordinary-deck-diff.png) makes it inspectable. Random Draw Hand image ordering is assessed by its eight-card behavior, not pixel equality. Raw export remains `legal:false`, matching the demonstrated baseline even while the public source shows its Limited badge.

## Gates and recovery evidence

[Verification receipt](verification.json) records terminal success: 3,875 unit tests/331 suites, 18 existing skips/2 skipped suites; 85 dedicated module tests/6 suites; lint, frontend build, Storybook build and registered Knip dependency checks. The broad unit command explicitly uses `--forceExit` because of existing open handles. Tests ran and their summaries passed; an unfinished process is never counted as successful.

[Retained attempts](retained-attempts.json) keeps failed browser attempts separately. Earlier fixture geometry checked an opening animation before an interactive control settled, and modal focus initially assumed the wrong last control. The successful procedure waits for a meaningful control and wraps Tab from the actual last Apply button. A wrapping host link's geometric center hit empty header space; giving that link an inline-block hit area made pointer activation reliable. Native Back tests now establish history inside the data router, not a previous document. Save-failure tests wait for the actual failure message and settled pending state. Error receipts count new runtime errors, preserving earlier hot-reload failures separately.

Root hook tests initially could not resolve JSX introduced through the shared host module; the new private surfaces use the repository's existing createElement-compatible `.ts` convention. The full final gate passed. Renaming files invalidated Vite's old module graph; a fresh owned preview resolved it. The preview uses the existing installed dependencies; its private launcher permits their real local font path and excludes generated Storybook/dist output from watching. Gallery output had caused a development reload that cleared the fixture's private mapping. Build first, then establish disposable editable fixtures. No temporary installation path is part of the supported host contract.

## Cleanup and Kyle's check

[Cleanup receipt](cleanup.json): five automated Guest copies were created, all five were deleted with 404 verification, four pre-existing session records were preserved, and the original public fixture retains its name/eight cards. The final clean `M6 Completion Handoff` copy was removed after Kyle accepted the preview. Its session-bearing ID appears in neither URL nor public evidence; exact prior session inventory is restored. The public deck remains the same 8-card/18-threat Limited fixture in the final ordinary browser read. Temporary test tabs are closed and viewport overrides reset; only the identified preview/server remains. Production is unchanged.

Kyle's final check should cover host widths/appearances and card callbacks, independent instances, and an editable deck's Stay/discard on normal navigation. In Chrome, also check native reload/tab-close confirmation while dirty. A tool-driven reload ultimately completed and cleared the private mapping; it is explicitly **not** a native-prompt pass. Component tests confirm the cancelable beforeunload listener and cleanup. Browsers may suppress prompts; forced close/crash is not draft recovery. A copied fixture's private route map is intentionally tab-local, so a completed reload cannot recover that mapping.

M6 acceptance is separate from automated success. With Kyle's approval of the final 5185 candidate, Ship's full exact-SHA CI/health contract and selected read-only production browser checks follow. Real host identity/assets, production history fallback, supported-browser/assistive-technology acceptance, M7 packaging/assets/backend-source import removal, M8 and retained M4 domain backlog remain future work. [Native host contract](../../../../../frontend/src/modules/README.md) and [host checklist](../../../../current/FRONTEND_HOST_CHECKLIST.md) define those boundaries.

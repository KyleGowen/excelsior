# Independent frontend modules (M5)

`index.ts` is the source entry point for Card Database, Deck Builder and Collection. Each existing route page is a thin adapter rendering this same implementation. Controllers own requests, query state, drafts and mutations; views receive display state/capabilities and callbacks. Detail actions and lazy panels keep their own small controllers under the declared host. No duplicate page implementation or embedded full SPA is used.

## Required host contract

Provide `QueryClientProvider`, `LayoutModeProvider`, shared `styles/appStyles`, and `ModuleHostProvider` with a stable `ModuleHost`:

- `api`: one `createModuleApi(transport)` client, or typed fictional operations. M2 transport retains origin/prefix validation, cookies/player headers, bounded renewal and server-secret protection. Binding a host never changes global API functions.
- `identity`: user/null plus explicit Guest/admin capabilities supplied by the host. Modules do not authenticate, bootstrap a Guest session or mount AuthProvider.
- `onOpenDeck`, `onBack`, `onHome`: callbacks; the host chooses URLs. Deck Builder takes `deckId` and optional `readonly` (default false). Standalone fixtures should explicitly start readonly.
- Optional `backLabel`, neutral detail-history navigation/state port and desktop/mobile chrome slots. Without history, detail closes locally; without chrome, Deck Builder uses one column.

Use one QueryClient per API/data environment and identity lifecycle. Modules in that same host may share catalog/collection/deck keys. Dispose or clear that client's queries when switching API origin or authenticated player; do not reuse cached account data across hosts/players. Identity capabilities are UI inputs, never server authorization. Public reads do not grant ownership; actual mutations still use existing backend ownership and transport policy.

Card Database browses independently of Deck/Collection pages. Opening its detail actions may request collection data; only opening Add to Deck requests available decks. Deck Builder requests its own catalogs directly. Collection uses catalog primitives and its supplied collection adapter, with the existing browser-local Guest store. These are declared feature dependencies, not another page mount.

## Lifecycle and fixture harness

`/module-harness.html` on a verified development server mounts no AuthProvider, router or AppShell. Its host reads the current local session/config without creating a session, supplies callbacks, and offers each module alone, together and unmounted. It displays Guest/account mode and starts decks read-only. Reload after changing the session in another tab. Use a named fictional/local deck; never substitute a real production account for a fixture. Close a module modal before using host controls covered by its backdrop. React fixture tests additionally unmount while a detail is open and verify disposal.

Catalog/deck reads consume cancellation signals. Detail/Guest collection listeners and debounced timers detach on unmount; session bootstrap ignores completion after disposal, and the Vite entry disposes its root/cache on hot reload. Module failures show retry without requiring a full host reload. Successful tests do not imply Kyle's acceptance.

## Current delivery limits

This is a source-level interface, not a distributable package. Existing global CSS/layout classes, image CDN initialization and browser-local Guest collection storage remain shared. Host theme/container/overlay/asset isolation is M6; package exports and removal of backend source imports are M7. M4 simulation/import/export/Collection domain contracts remain explicitly open. Do not claim native-host containment or complete backend-domain migration from this structural extraction.

Fixtures and named examples live in `frontend/src/stories/IndependentModules.stories.tsx` and ordinary Screen stories. Dedicated component tests: `npx jest --config tests/config/jest.frontend-modules.config.js --runInBand`; they are mocked jsdom cases, not browser tests. Shared live cases: `tests/browser/milestone5-modules.mjs`, using `tests/helpers/browserEvidence.mjs`. CI runs the dedicated suite once, after unit shard 1, against the locked frontend runtime.

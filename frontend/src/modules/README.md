# Independent frontend modules and native host contract

`index.ts` exports Card Database, Deck Builder and Collection plus their typed API and host contracts. The ordinary Excelsior routes render these same implementations with Excelsior adapters; no iframe, full-SPA embed, duplicated product implementation or LRG code copy is involved. This is source-level preparation. Package/asset delivery and removing backend source imports belong to M7.

## Host setup

Provide a `QueryClientProvider`, a stable `ModuleHost` and `ModuleHostProvider`. Modules never mount AuthProvider, create a Guest session or decide your login source. `api` supplies typed operations, normally from `createModuleApi(transport)`. The existing M2 transport and server access adapters retain secret, token, player and ownership boundaries. Keep service credentials on the server. Identity/capability inputs are presentation context, never authorization.

Use a distinct QueryClient for each API/data environment and identity lifecycle. Dispose/clear that client's queries when switching origin or player; do not reuse cached account records across hosts. Modules within the same environment/identity may share catalog and collection keys.

For the native style surface:

```tsx
<ModuleHostProvider host={{
  api,
  identity: { user, isGuest, isAdmin },
  onOpenDeck: id => hostRouter.openDeck(id),
  onBack: () => hostRouter.back(),
  onHome: () => hostRouter.home(),
  styles: { mode: 'isolated', height: 680 },
  layout: { mode: 'container', mobileMaxWidth: 900 },
  appearance: { colorScheme: 'dark', tokens: approvedVisualTokens },
}}>
  <CardDatabaseModule />
</ModuleHostProvider>
```

`styles` is opt-in. It renders the actual React module into its own open ShadowRoot, contains its stylesheet/reset/default tokens and owns an internal overlay root. No stylesheet is injected into the document by importing the reusable module graph. Shared component CSS stays beside its component and is assembled once by `moduleStyles.css`; the Excelsior site and Storybook explicitly load that same CSS through `styles/appStyles.ts`. Native hosts lazy-load the inline version inside the boundary; the ordinary site does not download that stylesheet payload as initial JavaScript. This remains a native React module, not an iframe.

The host owns surface width and positive finite pixel height (default 680). Container measurement selects mobile/desktop behavior; ResizeObserver reacts without resizing the window. Native CSS uses container dimensions instead of viewport sizing/media width checks and a local 16px root unit instead of document `rem`. Visual token overrides are local, including rem-valued overrides. Ordinary Excelsior omits `styles` and retains existing resets, DOM and viewport layout. Nonisolated hosts supply their own LayoutModeProvider/global styles or opt into `layout`.

Set boundary presence at mount. Adding/removing `styles`, container layout or appearance wrappers remounts children; apply your save/discard policy before doing so. Within a configured boundary, changing height, layout threshold, appearance values, icons or feature flags preserves mounted input state. Keep `appearance:{}` to clear overrides without removing its wrapper. Configured visual tokens are trusted CSS; unsupported token keys/invalid values fail before rendering. Presets in the fixture are fictional demonstrations, not certified accessibility palettes or LRG assets.

The isolated surface supplies its own overlay root inside the layout/appearance boundary. Do not combine it with an external `overlays.root`; this is rejected instead of letting panels silently escape. Nonisolated hosts may explicitly provide `overlays:{root,position:'absolute'|'fixed',modal}`. The host owns containing block/stacking and styles for external roots. Panels bound their geometry, wrap modal Tab/Shift-Tab, scope Escape to the focused panel, restore the actual shadow or ordinary trigger, and dispose on unmount. The mobile legality popover also uses the configured root. Neither provider alters document scroll/styles. Browser native controls and assistive technologies should be checked in the actual supported target browser.

## Navigation and unsaved edits

The host owns URLs, route/base path, open-deck/Back/Home callbacks and detail history. `history` is an optional neutral navigation/state adapter. Without it, a detail closes locally. Modules assume no Excelsior route or account migration. Current Excelsior adapters remain in the ordinary Database/Deck/Collection route pages; the complete production provider tree and chrome remain the compatibility default.

`editing.register({dirty,saving})` publishes only editable deck state and returns a disposer. Registrations are independent and cleaned on remount/unmount/permission changes. `createUnsavedNavigation()` supplies a pure guard for explicit host callbacks/config changes. Hosts must cover every navigation that can destroy a draft.

The development native fixture demonstrates a React Router data-router blocker for Link navigation, browser Back/Forward and host callbacks. Stay/Escape keeps the draft and current route; explicit discard clears/remounts it, and discard is disabled during a save. A failed save remains dirty. Successful current saves allow clean return; newer edits stay dirty. Same-path detail-history operations remain available. Full-document/external links use the explicit guard; `beforeunload` protects reload/tab departure when browsers honor it. Browsers can suppress native unload prompts (particularly mobile); do not promise recovery from a forced close or crash. Native prompt presentation/tab-close remains Kyle's Chrome spot check, distinct from the passing cancellation/lifecycle tests and explicit Link/Back/Forward browser checks.

`/fictional-host/tools/cards` retains the earlier neutral routed example. `/prepared-host/tools/cards` is the final isolated alternate host, with deliberately conflicting host CSS, root-font stress, widths, fictional appearances, callbacks, feature restrictions and a second independent module. These fallbacks are Vite-development-only; the host's actual production server must serve its own nested routes. No fixture is added to the production build/routes.

Both fixtures start decks read-only. Editing the public fictional local source creates a disposable Guest copy. Its session-bearing ID stays in memory, mapped to `/tools/decks/local-copy`; it never enters a URL/report. After a real clean reload that private map is unavailable, so reopen the public source. Only use verified disposable local data. `saveFixtureApi` is the shared development-only delayed/rejected save adapter; injected rejection is not a backend outage. Clean up exact run-owned clones; leave original/preexisting records and sessions intact.

## Host interactions and availability

- `cardActions.render(context)` replaces the selected card-detail action area in Database, Collection and Deck Builder. Context contains source, current card/type, Guest/read-only state, close, and explicit sign-in request when configured. `undefined` retains defaults; `null` suppresses the slot. A host can open its own card panel or implement add-to-deck/collection interactions here. Existing selected printing/pre-placement/grid controls retain their permissions.
- `cardActions.requestAuthentication` is called only on explicit activation with card/source/type and optional deck context. The host chooses sign-in, safe return and identity/cache lifecycle. Fixture receipts demonstrate callbacks; they perform no login or collection/deck write.
- `saveFeedback.render` is a pure result/pending slot with status/message/newer-edit state, no credentials, IDs, API or mutation helpers. Omission/undefined retains defaults; null suppresses configured feedback. Persistence is unchanged.
- `features` restricts `drawHand`, `simulateKo`, `exportDeck` and `addCards`. False hides/disables the corresponding feature, including current panel and mobile affordances. True/omission never grants ownership, fresh evaluation eligibility or server permission. Save/printing/quantity permissions remain server/owner governed.
- `icons.render` replaces decorative semantic UI symbols; undefined uses existing SVG, null hides decoration. Preserve accessible surrounding labels, keep replacements inert/nonfocusable, and distinguish card/game symbols and third-party assets. `chrome.brand`, desktop rail and mobile navigation are host-owned React nodes. Default Excelsior branding is unchanged.

All render slots are trusted presentation functions called during React rendering: keep them pure, do not call hooks directly, perform requests/navigation, or mutate records in render. Return a component for hooks/effects. Actual host write actions still require authenticated transport and backend ownership. Card Database, Collection and Deck Builder own their respective reads/controllers/drafts; no other page is mounted as a dependency.

## Verification and next delivery

Named Storybook fixtures include default/alternate appearances, icons/actions/save feedback, native nested routes and `IsolatedNativeSurface`, `IsolatedReadonlyDeck`, `IsolatedCollection`. The last variants exercise ModuleStyleBoundary, its private overlay surface and private route adapter. Dedicated module tests: `npx jest --config tests/config/jest.frontend-modules.config.js --runInBand`; these are mocked jsdom cases. Live shared suites remain in `tests/browser/`, including `milestone6-completion.mjs` and `milestone6-native-unsaved.mjs`; browser reports record source, actual viewport, cases, failures, cleanup and acceptance separately.

See [M6 completion evidence](../../../docs/evidence/frontend-preparation/m6/completion/README.md), the [implementation ledger](../../../docs/current/FRONTEND_PREPARATION.md), and [future host checklist](../../../docs/current/FRONTEND_HOST_CHECKLIST.md). Kyle accepted final M6 and its release/production verification completed at `ec2af895`. Real LRG asset/identity/production fallback acceptance remains later work. M7 delivery and the retained simulation/import/export rule retirement are implemented in the current candidate described below; Kyle accepted M7; its release remains pending. Collection presentation/count formatting remains browser display logic, using authoritative catalog grouping metadata.

## M7 private delivery contract

The frontend package stays private. Its `./modules` export resolves ESM and TypeScript declarations; `./modules/fonts` supplies optional Poppins Latin CSS. Run `npm --prefix frontend run build:modules`, then `build:delivery-proof` and `check:delivery`. `verify:delivery` copies only declared frontend inputs into an owned temporary workspace, builds/types-checks the consumer, checks export resolution and artifact hashes, and deletes that workspace. Installed frontend dependencies are reused; this does not prove a second clean dependency installation. No backend source tree, Node APIs, database, filesystem or repository card-art tree is available to that proof.

Only React 19, React DOM 19 and React Query 5.62+ are external peers. The host supplies one QueryClientProvider and immutable API/identity/navigation/asset contract per surface; it owns cache isolation across different identities/backends. Router/authentication providers are not package prerequisites. Set the base path on the real host and supply history/navigation deliberately. Host callbacks never grant API write privileges; real server authorization remains required.

`moduleAssets` declares bundled game/stat icons and a placeholder. URLs are emitted by Vite, without resource-directory URLs. Card artwork is API/host-owned: defaults accept absolute HTTP/data/blob URLs; relative catalog paths require `ModuleHost.assets` resolvers. An optional host reverse-image resolver supports legacy art naming; the portable module itself contains no named card path rule. Excelsior's application adapter retains its established CDN/resource conventions outside the delivery graph. Separate surfaces inherit only their supplied image contract.

The default typography is Inter with system fallback; a host must supply Inter if required. Optional Poppins Latin weights 400/500/600/700/800 are copied from the existing declared `@fontsource/poppins` dependency; its OFL license is included in the artifact. `fonts.css` has only optional font-face declarations, no document reset. Native isolated styles remain local, including modal overlays; declaring fonts does not change the host's body font.

All game calculations, identity/name resolution and import orchestration belong to the server. API capabilities include authoritative evaluation/candidates, draw/export and ADMIN hand analysis; export uses the saved deck snapshot, KO is temporary UI state, and pre-placement/save requires a fresh evaluation. Pending or failed server work preserves input and shows retry rather than substituting a client rule calculation. The application service adapter allows public stateless preview POSTs only as read operations. Import is one bounded atomic request, with no automatic uncertain-write retry.

The separately built consumer under `examples/module-delivery/` imports the emitted artifact, optional fonts and host contracts. Its `/delivery-proof/` base demonstrates real local read-only Card Database, Collection and Deck Builder, images, overlays, two distinct font/asset contracts and desktop/mobile widths. It is not part of the production app build. Storybook's BuiltModuleDelivery example links to that separately served proof; it does not import generated output into the ordinary build or count as a browser pass.

`check:modules` walks imports and CSS/assets, rejects backend/Node/repository resources, undeclared global configuration, computed imports, undeclared externals and retired rule functions. `check:contracts` compares eleven frontend transport copies with server sources. Negative boundary tests exercise these stops. Tests remain in `tests/unit/`, `tests/integration/` and `tests/browser/`; no rules are copied into consumer fixtures.

Remaining real-host acceptance: production nested-route fallback, real account/OAuth/service identity, host-specific accessibility/browser behavior, non-Latin font coverage and package installation/publication. The demonstration is not an LRG integration or rebrand. The compiled consumer currently emits a size warning; no optimized package size target is claimed.

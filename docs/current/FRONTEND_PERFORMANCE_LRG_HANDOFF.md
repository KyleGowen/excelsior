# Frontend loading changes for LRG

## Medium batch: compact catalog responses (#9)

The transport change is in `frontend/src/lib/api/catalog.ts`, the new `catalogPresentation.ts` decoder, and the mirrored `frontend/src/contracts/CompactCatalogPresentationDto.ts`. Include the matching contract-check entry in `frontend/scripts/check-module-contracts.mjs` when porting. No React component, visual layout, query key or ModuleHost method changes are required.

Both normal and forced-fresh presentation reads append `?compact=1`. A compatible backend returns versions once and defines each shared logical/printing group inline with its first card; later cards reference that group. The decoder rejects forward references and redefinitions, restores printingId from the unchanged raw row id, and reconstructs the same per-card presentation before the module sees it. Keeping definitions beside their first row avoids the gzip growth found with a separated header dictionary. It copies picker arrays per expanded row and performs no game-rule calculations. Bad formats/references fail with the existing metadata-unavailable error. Older backends that ignore the query and return the full array are accepted without an extra request.

Keep LRG's existing host transport, credentials, cancellation and no-store policy for fresh reads. Deploy support for the opt-in wire format to the backend for the byte reduction; frontend-only ports remain compatible but receive full data from older backends. Backend items #5 and #6 additionally precompute printing indexes and reuse content-validated, immutable catalog lookups across deck operations. Those changes need backend deployment and must not be reimplemented as browser rule caches. See `docs/current/CATALOG_PERFORMANCE.md` and `API_V1.md` for the scope and wire format.

These changes reduce image and catalog work in the shared Card Database and Deck Builder UI.
LRG can apply the same component changes without changing catalog APIs, deck rules,
authentication, image URL resolution, or host configuration.

## Database thumbnails

`CardTile` accepts an optional `progressive` boolean. Its default remains
`Boolean(catalogType)`, preserving existing consumers. `CardDatabaseModule` sets
`progressive={false}` for its browse grid. The tile passes `useThumbnail={!progressive}`
and `progressive={progressive}` to `CardImage`.

The database grid therefore requests the host-resolved thumbnail and does not start
the full-resolution upgrade pipeline. Opening a card still uses full-resolution art.
Missing thumbnails retain the existing full-art fallback. Type-aware framing,
printing identity, alternate art, reverse faces, foil behavior, and keyboard activation
continue through the existing components.

Apply these files together:

- `frontend/src/components/CardTile/CardTile.tsx`.
- `frontend/src/features/database/CardDatabaseModule.tsx`.
- `frontend/src/stories/CardTile.stories.tsx` includes `DatabaseThumbnail`.

In LRG, keep its own `ImageAssetsContext` or module-host resolver. Do not replace it
with Excelsior CDN paths. Collection and Add Cards continue using the default tile
behavior unless their product explicitly opts out.

## Deck grid viewport loading

`deckEditorCardImageLoadingProps(catalogType, loading = 'lazy')` now defaults to native
lazy loading. Existing deck-grid callers need no change. For progressive images,
`CardImage` already defers full-art upgrades with an `IntersectionObserver` using a
200-pixel margin. The default no longer makes every deck tile immediately eligible
for a full-resolution upgrade, including cards far below the viewport.

`DrawHandPanel` explicitly calls `deckEditorCardImageLoadingProps(catalogType, 'eager')`.
Its cards are already in an opened panel and should load promptly. Event cards in
Draw Hand keep their existing explicit `loading="eager"`. Location, Battleground,
and event deck-grid cards keep their existing full-art paths and framing, with the
native lazy-loading hint.

Apply these files together in LRG:

- `frontend/src/features/deck-editor/deckEditorCardImage.ts`.
- `frontend/src/features/deck-editor/DrawHandPanel.tsx`.

Keep the existing thumbnail/full-image layers, decode-before-reveal behavior,
image-session cache, host asset resolver, and data-saver behavior. Native lazy loading
is a browser hint; the browser may prefetch nearby cards. Do not hide card names,
change deck ordering, or wait for offscreen images before enabling deck actions.

## Hosting cache policy

The separate Excelsior server change gives content-hashed frontend `.js` and `.css`
files `Cache-Control: public, max-age=31536000, immutable`. Only the current frontend
build and retained old-bundle mounts opt in. HTML remains non-storable; stable
filenames and resource paths retain the short policy. Old hashed bundles remain
available for tabs opened before a deployment.

LRG can apply an equivalent policy in its own static-file host. This server change
does not require changes to the shared React modules, authentication, catalog APIs,
or image URL resolution.

## Regression checks

Verify database search, filters, paging, thumbnail fallback, card detail artwork,
alternate printings, reverse faces, and keyboard opening. The database tile should
have no progressive full-art layer; the detail image should retain positive natural
dimensions after loading.

For Deck Builder, verify that visible cards load, distant full-art layers have no
`src` until approached, scrolling loads later groups, and Draw Hand/redraw images
retain eager loading. Also check card/list switching, mobile type tabs, details, and
export. No new component or host API is required.

Run the full unit and integration suites after each behavior change before applying
the next one. Build the frontend and Storybook, then verify the running UI. Compare
production timings only after the same approved revision has deployed and its health
check reports a healthy application and database. The timing evidence distinguishes
normal-cache reloads from first visits; full-deck artwork is intentionally deferred
until scrolling brings it into view.

## Low–medium follow-up: card detail catalog reuse

In `frontend/src/features/database/CardDatabaseModule.tsx`, detail opens and printing
switches reuse the existing host-scoped `['catalog', type]` QueryClient entry for up
to one minute. They previously downloaded the whole type on every open/switch.
After that minute, or after explicit query invalidation, details refresh through
`host.api.fetchCatalogFresh` with its cancellation signal and existing `no-store`
transport. A printing advertised by presentation metadata but missing from the
cached array triggers one forced fresh read before selection. Failed refreshes
retain the already displayed data and do not manufacture a missing printing.

Apply this controller change to LRG with its existing ModuleHost and QueryClient.
There is no new host method or HTTP endpoint. The deliberate freshness tradeoff is
at most one minute of reuse after a successful read; this is not a server version
poll. Preserve the shorter detail freshness window rather than inheriting the
30-minute browsing policy. The backend independently keys its bounded presentation
cache by the full content version, including foil, errata and linked-character
inputs, and still authenticates every request through the existing adapters.

Component regressions cover repeated opens without another download, stale and
explicitly invalidated reads, and present/missing printing selection. Recheck the
ordinary Database route and an independent host, including full detail artwork,
printing switching, close/reopen, All, search and mobile behavior.


## Low–medium follow-up: defer lower Home sections

Excelsior's ordinary Home page now uses `DeferredHomeSection` around tournament
statistics and each of the three deck rails. It mounts a section once it enters a
120px viewport margin, retains it thereafter, and offers an explicit Load control.
Missing IntersectionObserver support loads everything. Observer cleanup ignores
queued notifications after unmount. Reserved placeholders prevent an empty initial
layout from immediately pulling all later sections into the viewport.

`HomePage.tsx` enables each feed query only after that rail is activated. The four
shared preview/mission catalogs are enabled when the first deck rail is activated.
TournamentStatsRail is imported lazily inside Suspense so its chart code and
catalog work start only when its section is approached. If that section is already
visible or near the viewport on a particular screen, it loads immediately. Its
existing expanded tournament route and its full-catalog selection are unchanged.

For an LRG Home equivalent, apply these together:

- `frontend/src/features/home/DeferredHomeSection.tsx`.
- `frontend/src/features/home/HomePage.tsx`.
- `frontend/src/features/home/HomePage.css` (placeholder and loading-state sizing).
- `frontend/src/stories/HomePage.stories.tsx` (`DeferredSections`).

This Home behavior is outside the independent Database/Deck Builder modules; LRG
only needs it if it has an equivalent landing page. Do not copy Excelsior's feed
routes or navigation into a differently structured LRG host. Keep LRG assets and
API transport host-scoped as before.

Verify initial Hero/Updates, scroll each rail into view, chart/card interactions,
View All links, deck opening, back navigation, narrow screens, fallback without
IntersectionObserver and observer disposal. A Home benchmark that previously waited
for every offscreen deck rail now needs to scroll or explicitly load those rails;
its result must be labeled separately from initial visible Home readiness.


## Follow-up: a shared session hit must reveal each image target

Production follow-up exposed an existing interaction between lazy deck artwork
and Draw Hand. A grid image can mount offscreen with no full-image `src`; Draw Hand
then reveals the same URL into the shared `deck-editor` session. When the grid
copy later approaches the viewport, treating that session entry as proof that the
grid element itself is loaded leaves it at thumbnail quality.

In `CardImage.tsx`'s progressive reveal effect, return early only for `fullLoaded`,
then preserve the existing `inView` guard. Let `preloadAndRevealFullRes` handle
session hits by attaching the cached URL to this target and decoding it. No new
preload is required on a session hit. The initial mount restoration remains, and
an offscreen card still has no full-image `src` just because another surface loaded
its URL.

Apply `frontend/src/components/CardImage/CardImage.tsx` with its context document.
The named Card Image `CachedElsewhereBeforeScroll` story shows an eager surface
above an already mounted offscreen copy. Component regressions cover the exact
post-mount cache interaction, continued offscreen deferral, and a URL cached before
mounting. For live verification, draw/redraw before scrolling and check a grid card
that was loaded into Draw Hand; it must upgrade when approached.

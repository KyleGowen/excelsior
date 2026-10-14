# Frontend image loading changes for LRG

These changes reduce image work in the shared Card Database and Deck Builder UI.
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

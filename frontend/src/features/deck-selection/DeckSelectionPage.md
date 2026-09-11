# Deck Selection — `/users/:userId/decks`

Grid of the user's decks (`DeckTile`, `full` variant) with create, search, and
per-deck actions. Titled "My Decks" (or "Guest Decks").

## Two modes (branch on `params.userId`)
- **Owner mode** (`params.userId === user.id`, or own decks): the editable view described below.
- **Read-only public profile** (`params.userId` is another user, including guests): fetches
  `GET /api/v1/users/:userId/public-decks` via `fetchPublicDecksForUser`, hides
  create/import/edit/delete and the search bar, renders tiles via `CommunityDeckGrid`
  (tiles open `?readonly=true`, show favorite hearts + clickable owner name), and shows a
  friendly empty state when the user has no public decks. Unlisted decks never appear in this
  view, even though their direct deck URL remains readable.

## Mobile tabs (owner mode only)
On `.layout-mobile`, five swipeable pill tabs — **My Decks / Favorites / Community /
Preconstructed / Tournament** (`DECK_SELECTION_TAB_ORDER`) — built with `useHorizontalSwipe` +
`stepCyclicalIndex` and `DECK_SELECTION_SWIPE_BLOCK_SELECTOR` (from
`frontend/src/lib/layout/useHorizontalSwipe.ts`). The bottom nav is **unchanged** (no new
buttons). Per-tab rules match desktop: My Decks editable; Favorites/Community/Preconstructed/
Tournament read-only with favorite hearts; the Community tab search matches deck titles,
usernames, characters, and locations. Preconstructed mirrors the Community page's newest-first
set groups: official tiles hide owner/date/legality, while featured upgrade recommendations show
regular deck metadata.

## Capabilities
- **New Deck**: opens a `SlideOutPanel` form (name + optional description + private/public visibility) → `createDeck` →
  navigates to the editor. `createDeck` returns a normalized `{ id, userId }` (the create
  API returns a flat deck row, not the `{ metadata }` list shape).
- **Import Deck**: ghost button between search and **New Deck** opens `ImportDeckPanel`
  (right `SlideOutPanel`, 480px). Paste v2.0 export JSON → client-side parse, card-name
  resolution against all catalog types → **creates a new deck** (`createDeck` + `replaceDeckCards` +
  optional `updateDeckMeta` for `limited` / `reserve_character`) → navigates to the editor. Unlike v1 deck-editor import,
  this does **not** merge into an open deck. Available to GUEST, USER, and ADMIN.
- **Search** decks by name (sorted alphabetically).
- **Actions** panel (kebab on a tile): Open/Edit, View (read-only `?readonly=true`), **Export deck**, and Delete (with confirm).
- Header shows deck count.

## Data
- `fetchDecksForUser(isGuest)` → user (`/api/v1/decks`) or guest (`/api/v1/guest/decks`).
- Characters catalog is fetched to compute each tile's max-stat line (`deckMaxStats`).
- **Export deck** (actions menu) uses `useDeckExportInput` → `fetchDeckFull` + catalog fetches (list tiles only carry preview cards) → reuses [`ExportDeckPanel`](../deck-editor/ExportDeckPanel.tsx) and `buildDeckExportJson`. Available to deck owners from selection (editor export remains read-only-only).

## Notes
- Guest decks (ids prefixed `guest_`) are session/local only; delete is allowed for guest's
  own session decks.
- **Mobile layout** (`.layout-mobile`): `.dsel__grid` uses `repeat(2, minmax(0, 1fr))` with
  `gap: var(--space-3)` — two `DeckTile` cards per row. Tile density is scaled via
  `.layout-mobile` rules in `DeckTile.css` (mission chip and updated date hidden; stats
  shrunk; 1-line name). See `DeckSelectionPage.css` and `STYLE_GUIDE_V2.md` § Mobile deck grid.
- Import logic lives in `frontend/src/lib/decks/` (`extractCardsFromImportJson`,
  `resolveImportCardIds`, `importDeckFromJson`, `importCatalogLoader`). Contract matches
  [`docs/current/DECK_IMPORT.md`](../../../docs/current/DECK_IMPORT.md) for parsing and
  name resolution; persistence uses existing deck HTTP APIs (no import endpoint).
- The page renders the bare component — `ShelledLayout`/`ProtectedRoute` are applied by the
  router, not here.

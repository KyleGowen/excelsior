# Card Database (DBV) — `/data`

Browse, search, filter, and sort the full modern OverPower catalog.

## Controls
- **Search** by card name, character name, or card text including inherent abilities
  (debounced, header bar; `cardMatchesSearchQuery` in `catalogTypeMap`).
- **Type tabs**: Characters, Special Cards, Power Cards, Locations, Missions, Events,
  Aspects, and the Universe types (Advanced/Teamwork/Ally/Training/Basic) — vocab via
  `catalogTypeMap`. **All** is the first tab (default selection remains Characters): text list across every type (no images).
- **Mobile swipe** (`.layout-mobile` only): swipe left/right on card grid, All list, or
  empty content cycles type tabs cyclically in `DBV_TAB_ORDER` (All → Characters → … → Basic → All).
  Same gesture model as deck editor card view (`useHorizontalSwipe`, 50px threshold). Swipe left
  = next tab; swipe right = previous tab. Disabled while `CardDetailPanel` is open. Gestures
  starting on `.db__types`, `.db__header`, `.dbv-filter-rail`, `.pagination`, or form controls
  are ignored (`DBV_SWIPE_BLOCK_SELECTOR`). On tab change: scroll page to top; active chip
  `scrollIntoView` in the type strip.
- **Mobile back / swipe-back** from card detail: `useCardDetailHistory` pushes one React Router
  history entry while `CardDetailPanel` is open so OS back closes the slide-out without leaving
  `/data` (tab, filters, pagination, and scroll preserved). Backdrop/Escape use the same `close`
  helper (`navigate(-1)` pops the dummy entry).
- **Set** dropdown inline with the header search bar (all tabs).
- **Filter rail** (`DbvFilterRail`) visible on per-type tabs only (hidden on **All**).
  Per-tab controls (numeric stat op/value rows, power-type icon strips, function icons,
  mission-set select) are config-driven via `filters/dbvFilterConfig.ts`. Advanced filters
  reset on tab change; search, set, **Has Foil**, **Hide Alts**, and rail state persist. Active constraints
  show as removable chips at the rail end with a **Clear** action (Clear does not reset Has
  Foil). Numeric inputs preserve the user's typed value instead of snapping to the configured
  min/max range while editing; the range remains available to native number controls. Optional
  **collapse** via left chevron. Desktop defaults expanded; its collapsed state is a thin
  rule with a left-aligned chevron-down. Mobile defaults to a one-row, horizontally scrollable
  collapsed rail with a chevron-down; expanding it opens a wrapping filter pane over the card
  results, with Escape and the chevron both closing it. Rail state persists across tab switches.
- **Has Foil** toggle (`.dbv-filter-rail__foil-toggle`, trailing end of filter rail): when
  checked, only exact printings with a foil variant per `foil_card_map` remain (base rows with a
  same-collector-number `F` counterpart or foil-only promos). Foil status never carries across
  alternate printings of the same logical card. Persists across type tab switches; off restores
  the full deduped catalog.
- **Hide Alts** toggle (`.dbv-filter-rail__hide-alts-toggle`, beside Has Foil): on by
  default. When checked, each logical card is represented by its canonical main printing using
  `dedupeToDefaultCatalogCards`; turning it off restores alternate-art and cross-set printing
  rows. Search and Set filtering happen before canonical-printing selection so a selected set
  keeps that set's main printing. Stat and Has Foil filters apply to that exact representative;
  a default printing without its own `F` collector does not inherit a hidden alternate's foil.
  The toggle persists across type tab switches and does not affect **All**.
- Per-type grid sorting depends on the Set dropdown:
  - **All Sets:** ignores set grouping. Characters sort by card name and then numeric collector
    number so the default/earliest printing leads same-name alternate art; Locations sort by name;
    Specials and Advanced Universe by linked character; Aspects by linked location; Missions and
    Events by mission-set name; Power/Ally/Basic/Training/Teamwork by OverPower type order then
    ascending requirement/value. Alphabetical card name is the stable tiebreaker.
  - **Specific set:** Characters retain the same card-name → numeric collector order as All Sets,
    keeping default art and alternate printings together. Other tabs retain checklist order by
    **set_number**, except Power Cards, which always use OverPower type order then ascending value.
  - **All** tab is intentionally unchanged: set → foil tier → set_number → name
    (`compareAllCatalogCards`). Collection sorting is also unaffected.

## Saved Views

- Temporarily rendered only for authenticated `ADMIN` users. The API independently applies the same rule through the replaceable Saved Views access policy; `USER` and `GUEST` retain the complete Card Database without Saved Views calls or restricted card information.
- **Save this view** captures the active tab (including All), raw search text, Set, the complete advanced filter state, Has Foil, and Hide Alts in schema version 1. It deliberately excludes page, selected card/detail, filter-rail collapse, and sidebar state.
- Naming is inline at the top of the unpinned list, never modal. Names are trimmed, may repeat, and are limited to 80 characters. Enter/check confirms, Escape/cancel removes the local draft, and failed saves preserve the typed name.
- Recalling restores the snapshot, starts on page 1, closes Card Detail, leaves the desktop sidebar open, and closes the mobile drawer. An unavailable set, mission set, or config-driven filter is cleared to its neutral value with a non-destructive status notice.
- The highlighted recalled row is informational only. Later filter edits do not update it, and **Save this view** always creates another row.
- Pinned and unpinned sections sort independently by creation time newest-first, with ID as the stable tie-breaker. Rename and pin update metadata only.
- Manage mode provides accessible checkboxes, select-all/clear, count, cancel, and confirmed bulk deletion. Single delete is also confirmed.
- At the server-provided 50-record limit, Save is disabled with a focus/hover tooltip. Successful deletion immediately reopens capacity; `SAVED_DATABASE_VIEW_LIMIT_REACHED` remains authoritative for stale tabs and races.
- Desktop uses a 340px docked, non-modal right sidebar that reduces the catalog width. Mobile uses the existing 900px `useLayoutMode` boundary for a full-width modal drawer with backdrop/Escape close, focus containment/restoration, safe-area padding, scrolling, and bottom-nav clearance.

## All tab
- Merges all 12 catalog slugs (`useAllCatalogCards`); foil dedup per slug like per-type tabs.
- Renders `CatalogAllList` (spread grid rows: `#`, name, type/set badges; 48 per page). Row
  click opens `CardDetailPanel` with the card's real catalog type. No inline deck/collection
  buttons on rows.

## Data flow
- Fetches the **full** array for the selected type (`GET /api/v1/catalog/:slug`) — the
  catalog endpoints don't paginate, so filtering, sorting, and pagination are **client
  side** (`Pagination` component).
- Grid uses `CardTile` with `catalogType` for orientation: Characters/Locations/Events are
  landscape (4 per row desktop); other types are portrait (6 per row desktop). Mobile uses
  one card per row for all types. Images use `contain` (no crop).
  Tile art uses **progressive** thumb → full-res loading (`CardImage` `progressive` prop).
  Set line shows code + number when available.
- Released Skybound alternate-art collectors 419–472 use their own landscape character images;
  collector 450 exposes its reverse face through the standard card flip control.
- Skybound character foil relationships follow all 53 `F`-marked source filenames. The filename
  marker is authoritative when the workbook collector-number cell omits the suffix (including
  alternate Angstrom Levy `#430F`); `#448` and `#450` have no foil source file.
- **Foil dedup:** `fetchFoilCardMap` hides foil rows when the base card is in the same tab;
  foil-only rows remain. Base (or foil-only) tiles show a silver ✦ (`has foil` tooltip) when a
  foil variant exists per the map. Grid tiles suppress the prismatic laminate (`showFoilEffect={false}` on `CardTile`).
- Clicking a tile opens `CardDetailPanel`. The detail slide-out shows the foil laminate for foil
  printings (default `showFoilEffect` on `CardDetailPanel`). If a newly mapped Skybound foil ID is
  present in `foil_card_map` while the browser still holds a pre-migration type-catalog payload,
  the printing list temporarily derives that foil row from the mapped base and its
  `set_number_foil`; selecting it behaves identically to a freshly fetched catalog row.
- Teamwork printing identity uses normalized `to_use`, `acts_as`, both attack bonuses, and an
  order-insensitive set of follow-up attack types. Thus `Combat + Brute Force` and
  `Brute Force + Combat` group together only when the rest of the card mechanics also match.
- Training printing identity uses an order-insensitive pair of power types plus `value_to_use`,
  bonus, and one-per-deck status, allowing differently named ERB and SKY art to share one slot.
- Basic Universe printing identity uses power type, `value_to_use`, bonus, and one-per-deck
  status, allowing differently named ERB and SKY art with identical mechanics to share one slot.
- Skybound `#112`, `#126`, `#131`, and `#242` are corrected by Flyway V314 from character
  Specials to Universe: Advanced cards while retaining their UUIDs and shared action-icon data.
  V315 extends the Advanced Universe model so `#112` also retains its first-action-only icon.

## Add to Deck
- The detail panel exposes an **Add to Deck** action for logged-in users (`addCardToDeck`).
- **GUEST**: the +Deck affordance is **disabled** (product rule — see root `.cursorrules`
  and `docs/current/GUEST_DECK_LESSONS_LEARNED.md`). Do not re-enable without a product
  decision.

## Notes
- Cards legitimately without art show the "No image" placeholder.
- Type tabs use short labels under `.layout-mobile`.
- Type tab strip (`.db__types`) scrolls horizontally inside the page; page-level sideways pan is blocked by mobile `overflow-x: clip` on the document/shell chain.
- **Mobile swipe between type tabs:** swipe left/right on the card grid, All list, or content area cycles tabs in `DBV_TAB_ORDER` (cyclical wrap). Swipe is disabled while card detail is open. See `useHorizontalSwipe` + `DBV_SWIPE_BLOCK_SELECTOR`.

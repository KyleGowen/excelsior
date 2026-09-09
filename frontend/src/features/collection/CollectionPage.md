# Collection — `/users/:userId/collection`

Track how many of each card you own. Same browse/filter chrome as the Database, plus
per-card quantity steppers and an "Owned only" toggle.

## Controls
- Search (debounced), type tabs (**All** first; default **All**), set dropdown, **Owned only** checkbox.
- **Mobile header** (`layout-mobile`): four rows — title + counts, full-width search, set filter (20% wider select, left-aligned) + Owned only, then type chips (see `CollectionPage.css` / `STYLE_GUIDE_V2.md`).
- **Mobile type-tab swipe** (`layout-mobile`): horizontal swipe on card grid, All list, or empty content cycles type tabs cyclically (`DBV_TAB_ORDER`: All → Characters → … → Basic → wrap). Uses shared `useHorizontalSwipe` (50px threshold, 12px axis lock): swipe left = next tab, swipe right = previous tab. `touch-action: pan-y` on `.col` preserves vertical page scroll. Blocked regions (`COLLECTION_SWIPE_BLOCK_SELECTOR`): `.col__types`, `.col__header`, `.pagination`, `.qty-stepper`, `input`/`textarea`/`select`. Disabled while `CardDetailPanel` is open. On tab change: `window.scrollTo(0,0)` and active `[data-col-tab]` chip `scrollIntoView` in `.col__types`.
- **Mobile back / swipe-back** from card detail: `useCardDetailHistory` pushes one React Router history entry while `CardDetailPanel` is open so OS back closes the slide-out without leaving Collection (tab, filters, pagination, and scroll preserved). Backdrop/Escape use the same `close` helper (`navigate(-1)` pops the dummy entry).
- Search uses `cardMatchesSearchQuery` (same as DBV), including card name, linked character,
  mission-set name, and card text. The keyword **`foil`** filters to foil printing rows only
  (`is_foil = true`); combine with name/text (e.g. `foil tarzan`). Distinct from DBV **Has Foil**
  checkbox (foil-capable base cards).
- Header shows `totalOwned` and `uniqueCards`.
- Per-type tabs: `CardTile` grid with footer `QuantityStepper`; unowned cards are dimmed.
  Checklist sort (`compareCollectionCatalogCards`): set code → non-foil before foil →
  set_number → name (only when both cards lack a set_number).
- **All** tab: `CatalogAllList` spread grid rows (set code, number, type, name, set badge, stepper).
  **Mobile:** **`catalog-all-list__scan-id`** sub-grid (4ch set + space + 4ch right-aligned number); type badge fixed width with compact abbreviations (`Spc`, `Chr`, …).
  **Desktop:** fixed-width `#` and type columns for aligned skimming. Special and Advanced Universe rows prefix the linked character on **desktop** only
  (`Anubis - Book of the Dead`); mobile uses the card name alone to save width.
  Same checklist sort (`compareCollectionCatalogCards`). Detail panel also exposes a stepper and
  **Is Foil** Yes/No (`card.is_foil` via `isFoilCard`).

## Data flow (`useCollection`)
Unifies two backends:
- **Logged-in**: server collection (`GET /api/v1/collections/me/cards`, Query-cached).
- **Guest**: `localStorage` via `guestCollection.ts` (re-renders on
  `guest-collection-change`).

### Add vs update (important)
The PUT endpoint (`/…/:cardId`) only updates a card **already** in the collection (404
otherwise). So `setQuantity`:
- **POSTs** (`addCollectionCard`) when the card isn't owned yet (`current <= 0`),
- **PUTs** (`setCollectionQuantity`) once it is — including quantity `0` to remove.

## Notes
- Per-type catalog is fetched per tab; **All** merges all 12 slugs client-side. Pagination
  is client-side (24 tiles per type tab, 48 list rows on All).

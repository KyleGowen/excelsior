/**
 * Horizontal-swipe block selectors.
 *
 * These CSS selector strings live in their own React-free module so they can be
 * imported by unit tests (run under the root Jest config, which does not resolve
 * `react`) without pulling in the `useHorizontalSwipe` hook's React imports.
 * The hook re-exports them, so existing call sites can keep importing from
 * `useHorizontalSwipe`.
 */

/** Regions where horizontal swipe must not steal taps (tabs, footer controls, header). */
export const DECK_EDITOR_SWIPE_BLOCK_SELECTOR =
  '.deck-editor__type-tabs, .deck-editor__card-footer, .deck-editor__card-reserve-wrap, .deck-editor__topbar, .deck-editor__actions, input, textarea, select';

/** Card Database — block header, type tabs, filter rail, and pagination controls. */
export const DBV_SWIPE_BLOCK_SELECTOR =
  '.db__types, .db__header, .dbv-filter-rail, .pagination, input, textarea, select';

/** Decks screen (mobile tabs) — block the tab strip, header/actions, and search. */
export const DECK_SELECTION_SWIPE_BLOCK_SELECTOR =
  '.dsel__tabs, .dsel__header, .dsel__actions, .dsel__search, .dsel__community-search, input, textarea, select';

/** Collection — block header, type tabs, pagination, and quantity steppers on tiles/rows. */
export const COLLECTION_SWIPE_BLOCK_SELECTOR =
  '.col__types, .col__header, .pagination, .qty-stepper, input, textarea, select';

/** Add Cards slide-out — block header, type tabs, search, filters, pagination, and footer. */
export const ADD_CARDS_SWIPE_BLOCK_SELECTOR =
  '.add-cards__types, .add-cards__search, .add-cards__filters, .add-cards__filter-rail, .add-cards__pagination, .add-cards__qty, .add-cards__add, .slideout__header, .slideout__footer, input, textarea, select';

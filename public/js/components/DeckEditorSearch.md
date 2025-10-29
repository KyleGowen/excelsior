DeckEditorSearch Component
==========================

A standalone, reusable search UI for the Deck Editor. It performs a debounced search across all card families using `CardSearchService`, shows a dropdown of results, and invokes a selection callback when a user clicks a result.

Why this exists
- Centralizes search behavior and API calls in one place.
- Prevents UI regressions with well-defined CSS rules and tests.
- Makes search embedding trivial anywhere in the deck editor UI.

File locations
- Component: `public/js/components/DeckEditorSearch.js`
- Service: `public/js/services/CardSearchService.js`
- Styles: `public/css/deck-editor-search.css`
- DOM in page: `public/index.html` (`#deckEditorSearchInput`, `#deckEditorSearchResults`)

Quick start
```html
<div class="deck-editor-search-container">
  <input id="deckEditorSearchInput" class="deck-editor-search-input" />
  <div id="deckEditorSearchResults" class="deck-editor-search-results"></div>
  <!-- Place within the card-selector pane -->
  <!-- Scripts/styles are already included in index.html -->
  <!-- See initializeDeckEditorSearch() wiring -->
```

```js
const component = new DeckEditorSearch({
  input: document.getElementById('deckEditorSearchInput'),
  results: document.getElementById('deckEditorSearchResults'),
  onSelect: ({ id, type, name }) => addCardToDeckFromSearch(id, type, name),
  debounceMs: 300,
  minChars: 2,
  maxResults: 20
});
component.mount();
```

API
- `new DeckEditorSearch(options)`
  - `input` (HTMLInputElement, required): input field the user types in
  - `results` (HTMLElement, required): container element for dropdown results
  - `onSelect` (function, optional): called with `{ id, type, name }` when an item is clicked
  - `minChars` (number, default 2): minimum characters before search runs
  - `debounceMs` (number, default 300): debounce delay
  - `maxResults` (number, default 20): maximum results shown
  - `searchService` (object, optional): must expose `search(term:string): Promise<Result[]>`

- Methods
  - `mount()`: attach listeners (idempotent)
  - `unmount()`: detach listeners
  - `clear()`: clear input and hide results
  - `render(results)`: render an array of normalized results

- Result shape
```ts
type Result = {
  id: string;
  name: string;
  type: string;          // 'character' | 'special' | 'mission' | ...
  image: string;         // URL path
  character?: string;    // optional character association
}
```

Styling and positioning
- The dropdown must overlay content and avoid clipping. We enforce this with:
  - `.deck-editor-search-results`: `position: absolute; top: 100%; left: 0; right: 0; z-index: 9999;`
  - Parents must not clip:
    - `.card-selector-pane { overflow: visible !important; }`
    - `.card-selector-pane .deck-editor-search-container { overflow: visible !important; }`
- See `public/css/deck-editor-search.css` for canonical rules and `tests/unit/deck-editor-search-css-rules.test.ts` for safeguards.

Service behavior
`CardSearchService` queries all relevant endpoints in parallel, normalizes them to a common shape, sorts alphabetically by name, filters empties, and caps to `maxResults`.

Endpoints searched
`/api/characters`, `/api/special-cards`, `/api/missions`, `/api/events`, `/api/aspects`, `/api/advanced-universe`, `/api/teamwork`, `/api/ally-universe`, `/api/training`, `/api/basic-universe`, `/api/power-cards`, `/api/locations`.

Debugging
- Component: input term, search start/end, injected item count, visibility toggles.
- Service: search start and final result count; errors include context.
- If results don’t appear but logs show items injected, check for CSS clipping (parent overflow). The CSS test will catch accidental removal of the safety rules.

Testing
- Unit: `tests/unit/deck-editor-search-component.test.ts` (rendering, visibility, selection)
- Unit: `tests/unit/card-search-service.test.ts` (normalization and limits)
- Unit: `tests/unit/deck-editor-search-css-rules.test.ts` (CSS invariants)
- Integration: `tests/integration/deck-editor-search-results-visible.test.ts` (assets and DOM hooks)

Future enhancements
- Keyboard navigation (↑/↓/Enter)
- Virtualized list when needed
- Portal/fixed-position fallback if future layouts introduce clipping contexts



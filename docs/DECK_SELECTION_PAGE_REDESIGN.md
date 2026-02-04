# Deck Selection Page Redesign (Deck List Tiles)

This document describes the redesign work for the **Deck Selection / Deck Builder tab** (the deck list tiles shown on the main dashboard), including how each feature is implemented and where to look in the code.

## Goals

- Make deck tiles **modern, compact, and information-dense** (less negative space).
- Show a true deck preview: **characters + selected location + first mission**.
- Replace three action buttons with a single **ellipsis dropdown**.
- Move deck stats into a consistent **right-side stats panel**.
- Support **deck background images** (same background selection used by the deck editor).
- Keep interaction consistent: the preview strip behaves like an **accordion** on hover.

## Key Files

- **Deck list wiring (script + CSS includes)**: `public/index.html`
- **Deck list UI + rendering**: `public/js/deck-selection/deckTilesRenderer.js` (and related modules under `public/js/deck-selection/`)
- **Deck list styling**: `public/css/deck-selection.css`
- **Deck backgrounds (editor selection + application)**: `public/js/deck-background.js`, `public/css/deck-background.css`
- **Deck list API route**: `src/routes/decks.routes.ts` (`GET /api/decks`)
- **Deck list API mapping**: `src/api/deckTransform.ts`
- **Deck list DB query + caching**: `src/database/PostgreSQLDeckRepository.ts` (`getDecksByUserId`)
- **UI documentation**: `docs/current/STYLE_GUIDE.md`

## Feature: Compact “tile” layout (two-column)

### What it does

Each deck in the list is rendered as a two-column tile:

- **Left**: title + card previews (characters, location, mission)
- **Right**: ellipsis action menu + legality badge + stats panel

### Implementation

- **HTML structure** (per deck tile) is generated in `public/js/deck-selection/deckTilesRenderer.js` inside `displayDecks(decks)`.
  - Root tile class: `.deck-card.deck-tile.deck-tile--compact`
  - Left: `.deck-tile-main`
  - Right: `.deck-tile-side`

- **CSS grid layout** in `public/css/deck-selection.css`:
  - `.deck-card.deck-tile.deck-tile--compact { display: grid; grid-template-columns: 1fr 220px; ... }`

## Feature: Preview “accordion” (characters + location + mission)

### What it does

- Characters render as a 4-card stacked row.
- Location and mission render as single preview cards.
- Hovering **lifts and enlarges** the hovered preview and slightly **recedes** the others for an “accordion” feel.

### Implementation

- **Characters**
  - Container: `.deck-character-display` → `.deck-character-cards-row`
  - Cards: `.deck-character-card-display`
  - Hover focus: `.deck-character-card-display:hover` (lift/scale)
  - Recede effect: `.deck-character-cards-row:hover .deck-character-card-display:not(:hover)`
  - Border-safe offset: `.deck-card.deck-tile--compact .deck-character-cards-row { padding-left: 26px; }`

- **Location + Mission**
  - Base class: `.deck-tile-preview-card`
  - Location: `.deck-tile-location-preview`
  - Mission: `.deck-tile-mission-preview`
  - Hover focus: `.deck-card.deck-tile--compact .deck-tile-preview-card:hover`
  - Recede effect: `.deck-card.deck-tile--compact .deck-tile-previews:hover .deck-tile-preview-card:not(:hover)`

## Feature: Card image resolution (robust paths)

### What it does

Deck list preview cards can come with either:

- A **prefixed** `defaultImage` path (e.g. `characters/foo.webp`), or
- A **bare filename** (e.g. `spartan_training_ground.webp`)

The deck list resolves these consistently for:

- Characters → `/src/resources/cards/images/characters/...`
- Locations → `/src/resources/cards/images/locations/...`
- Missions → `/src/resources/cards/images/missions/...`

### Implementation

- Function: `getDeckCardImagePath(card)` in `public/js/deck-selection/deckTileImages.js`
  - If `defaultImage` contains `/`, it’s treated as already prefixed.
  - Otherwise, the filename is prefixed based on `card.type`.
  - Fallback to snake_case name-based path when needed.

## Feature: First mission preview (real card art)

### What it does

The deck list shows the **first mission** in the deck as a real card preview (not a placeholder).

### Implementation (backend)

- Query work happens in `src/database/PostgreSQLDeckRepository.ts` → `getDecksByUserId()`
  - Uses a `LEFT JOIN LATERAL` to select one mission per deck.
  - Ordering chooses the “first” mission deterministically by `missions.set_number` (then name/id fallback).
  - Adds a pseudo-card to `deck.cards` with `type: 'mission'` so the frontend can render it like other preview cards.

## Feature: Ellipsis dropdown menu (Edit / View / Delete)

### What it does

Replaces three buttons with a single **ellipsis menu**.

- Clicking the ellipsis toggles the dropdown.
- Clicking outside or pressing Escape closes all menus.
- Delete is disabled for guests.

### Implementation

- **HTML**
  - Button: `.deck-tile-menu-button`
  - Dropdown container: `.deck-tile-menu-dropdown` (id: `deckTileMenu-${deckId}`)

- **JS**
  - `toggleDeckTileMenu(event, deckId)` in `public/js/deck-selection/deckTileMenu.js`
  - `closeAllDeckTileMenus()` in `public/js/deck-selection/deckTileMenu.js`
  - Document listeners:
    - close on outside click
    - close on Escape key

- **CSS / z-index**
  - Dropdown uses `z-index: 9999` to ensure it layers above tile content.

## Feature: Stats panel (right-side) + icons

### What it does

All deck stats are consolidated into the right-side panel:

- Threat
- Cards
- Updated
- Created

Icons are shown beside labels to improve scanability.

### Implementation

- Container: `.deck-tile-side-meta`
  - Dark “glass” background: `rgba(0, 0, 0, 0.44)`
- Rows: `.deck-tile-side-item`
  - Left: `.deck-tile-side-left` (icon + label)
  - Right: `.deck-tile-side-value`
- Icons:
  - Threat: `public/resources/images/icons/threat.png`
  - Cards: `public/resources/images/icons/cards.svg`
  - Updated: `public/resources/images/icons/updated.svg`
  - Created: `public/resources/images/icons/created.svg`
  - Shared size class: `.deck-tile-side-icon-img` (18×18)

## Feature: Legality badge moved into the stats area

### What it does

The “Legal / Not Legal / Limited” indicator is displayed above the stats rows inside the right panel.

### Implementation

- Container row: `.deck-tile-side-legality`
- Badge element: `.deck-validation-badge` (`.success`, `.error`, `.limited`)

## Feature: Timestamps show time if “today”

### What it does

If a deck’s Created/Updated timestamp is **today** (local time), show a time (e.g. `10:17 PM`) instead of a date.

### Implementation

- Function: `formatDeckTimestamp(value)` in `public/js/deck-selection/deckTileTimestamps.js`
  - Uses `toDateString()` comparison against `new Date()` for a local “today” check.
  - Returns time via `toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })`.
  - Otherwise returns `toLocaleDateString()`.

## Feature: Deck background as tile background (like deck editor tile view)

### What it does

If a deck has a selected background image, the deck tile displays that image behind its content, with a dark overlay for readability.

### Data flow

1. Deck editor background selection stores `background_image_path` on the deck.
2. Deck list endpoint (`GET /api/decks`) returns `metadata.background_image_path`.
3. Deck tile template sets:
   - `.deck-tile--has-bg` class when present
   - inline CSS custom property `--deck-tile-bg: url('...')`
4. CSS renders the image and overlay with pseudo-elements.

### Implementation (frontend)

- HTML (per tile): adds `.deck-tile--has-bg` and `style="--deck-tile-bg: url('...')"`
- CSS:
  - `::before` renders `background-image: var(--deck-tile-bg)`
  - `::after` applies the dim overlay (`rgba(0, 0, 0, 0.432)`)
  - Image framing: `background-position: center 25%` to bias slightly toward the top.

### Implementation (backend)

- `src/database/PostgreSQLDeckRepository.ts`:
  - `getDecksByUserId()` includes `background_image_path` in returned deck summary objects.
  - Cache bypass ensures older cached deck lists (missing the field) don’t hide backgrounds.

- `src/routes/decks.routes.ts` + `src/api/deckTransform.ts`:
  - `GET /api/decks` includes `background_image_path` in `metadata`.

## Troubleshooting

- **Backgrounds not appearing**:
  - Verify `metadata.background_image_path` exists in `/api/decks` response.
  - Ensure backend cache invalidation/bypass is active (older cache entries can hide newly added fields).
  - Confirm static serving supports `/<background_image_path>` (served via `/src/resources`).

- **Dropdown appears behind content**:
  - Ensure `.deck-tile-menu-dropdown` has `z-index: 9999` and the menu container is positioned within `.deck-tile-side` (which is `position: relative`).

## Notes on testing

- Deck list behaviors now live in dedicated modules under `public/js/deck-selection/`.
- Unit tests cover key deck list UI behaviors via a jsdom test in `tests/unit/deck-selection/deck-selection-modules.test.ts`.


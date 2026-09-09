# Excelsior Style Guide (v2)

Visual source of truth for the **v2 React SPA** under [`frontend/`](frontend/). This
guide describes the dark, neon, card-game-companion theme derived from the mocks in
`docs/mocks`.

> **Rule:** Whenever you change a visual pattern, token, or add a screen in `frontend/`,
> update this file. Tokens are defined in
> [`frontend/src/styles/tokens.css`](frontend/src/styles/tokens.css) — this doc and that
> file must always agree.

## Table of Contents
1. [Design Principles](#design-principles)
2. [Design Tokens](#design-tokens)
3. [Typography](#typography)
4. [Buttons & Controls](#buttons--controls)
5. [Layout & Navigation](#layout--navigation)
6. [Cards & Card Art](#cards--card-art)
7. [Stats, Badges & Status](#stats-badges--status)
8. [Panels & Overlays](#panels--overlays)
9. [Responsive (Mobile vs Desktop)](#responsive-mobile-vs-desktop)
10. [Motion](#motion)
11. [Per-Screen Notes](#per-screen-notes)
12. [Database Filter Rail](#database-filter-rail)
13. [Home Recent Updates](#home-recent-updates)
14. [Home — Regionals stats rail](#home--regionals-stats-rail)
15. [Database Saved Views](#database-saved-views)

---

## Design Principles
- **Dark, layered surfaces.** Deep navy base with progressively lighter "elevated"
  surfaces; never pure black, never light mode.
- **Neon cyan accent.** A single dominant accent (`--color-accent`) used for primary
  actions, active states, and glows. Use sparingly so it stays special.
- **Card art is the hero.** OverPower card images carry the visual weight. Chrome stays
  understated (muted text, thin borders) so art pops. Only ever render real card images
  shipped in the repo — never invent or hotlink art.
- **Calm density.** Generous spacing on a full-width layout with edge padding; grids breathe and scale with viewport width.

## Design Tokens
All tokens live in `:root` in `tokens.css`. Reference them via `var(--token)`; **never**
hardcode hex values in component CSS.

### Surfaces
| Token | Value | Use |
|---|---|---|
| `--color-bg-base` | `#070b16` | App background |
| `--color-bg-surface` | `#0d1526` | Cards, rows, default surface |
| `--color-bg-elevated` | `#141f35` | Raised tiles, hovered surfaces |
| `--color-bg-panel` | `#0f1928` | Slide-out panels |
| `--color-bg-input` | `#0a1220` | Inputs, selects |
| `--color-bg-hover` | `#18243d` | Hover fill |
| `--color-bg-scrim` | `rgba(4,7,14,.72)` | Modal/drawer scrim |

### Accent (neon cyan)
| Token | Value |
|---|---|
| `--color-accent` | `#00c8e8` |
| `--color-accent-bright` | `#00e5ff` |
| `--color-accent-dim` | `#1c7d92` |
| `--color-accent-soft` | `rgba(0,200,232,.14)` |
| `--color-accent-glow` | `rgba(0,229,255,.35)` |

### Text & Borders
| Token | Value |
|---|---|
| `--color-text` | `#e8edf7` |
| `--color-text-muted` | `#8aa0c2` |
| `--color-text-dim` | `#56678a` |
| `--color-text-on-accent` | `#021018` |
| `--color-border` | `#1d2c47` |
| `--color-border-strong` | `#2a3e63` |
| `--color-border-accent` | `rgba(0,200,232,.45)` |

### Semantic (KO simulation)
| Token | Value | Use |
|---|---|---|
| `--color-ko` | `#e85d6a` | Simulate KO toggle active fill |
| `--color-ko-soft` | `rgba(232,93,106,.16)` | KO button default background |
| `--color-ko-border` | `rgba(232,93,106,.38)` | KO button border |

### Radius / Shadows
- Radii: `--radius-sm 6px`, `--radius-md 10px`, `--radius-lg 14px`, `--radius-xl 20px`,
  `--radius-full 999px`.
- Shadows: `--shadow-card`, `--shadow-panel`, `--shadow-pop`, and `--shadow-glow`
  (accent ring + glow used on focus/active art).
- Spacing scale: `--space-1` (4px) … `--space-16` (64px), 4px-based.

## Typography
- Family: `--font-sans` = Inter, then system fallbacks (no remote webfont required).
- Scale: `--font-size-xs` (.6875rem) → `--font-size-4xl` (3rem).
- Weights: 400 / 500 / 600 / 700.
- Page titles use `--font-size-2xl`/`3xl`, semibold, with a leading icon in
  `--color-accent`. Body copy is `--font-size-base` in `--color-text`; secondary copy in
  `--color-text-muted`.

## Buttons & Controls
Defined in [`frontend/src/styles/global.css`](frontend/src/styles/global.css).

| Class | Look | Use |
|---|---|---|
| `.btn .btn-primary` | Cyan gradient fill, dark text, glow on hover | Primary action (Log In, New Deck, Save) |
| `.btn .btn-secondary` | Elevated surface, border, light text | Secondary actions |
| `.btn .btn-ghost` | Transparent, text only | Tertiary / inline |
| `.btn .btn-danger` | Red (`--color-danger`) | Destructive (Delete) |

- **Home hero CTA** (`.home__hero-cta`): accent-outline pill (`btn-ghost` + local overrides), not `btn-primary` gradient — compact chip sizing aligned with deck-editor header actions.
- **Home hero art** (`.home__hero-art-image`): explicit responsive 1×/2× pairs live in
  `src/resources/images/home/banners/`. The active Skybound Immortal banner is mirrored to keep
  the character on the visual right and copy readable on the left; the original Victory Harben
  pair remains available. Desktop and mobile both use a broad left-to-right panel fade plus soft
  bottom/radial shading so copy transitions into art without a hard edge. On desktop, hero art
  grows fluidly from `100%` to a hard `140%` height cap as the hero widens; it remains top- and
  right-anchored at its native aspect ratio so Immortal fills an ultrawide banner without clipping
  his head. Mobile stays at `100%` height. Do not restore a width-driven `cover` scale. Banner
  rotation/randomization is not enabled.
- **DBV detail slide-out actions** (`.db__detail-actions .btn`): same accent-outline pill family for Add to Deck / Collection under `CardDetailPanel` on `/data`.
- Disabled buttons drop to ~50% opacity and `cursor: not-allowed`; loading buttons show
  text like `Saving...` / `Creating...` and are disabled.
- Login authentication failures use the existing danger panel. Recoverable Google popup
  failures add one underlined inline action, **Continue with Google in this window**, which
  keeps the recovery path inside the alert instead of adding another persistent auth button.
- Inputs/selects/textareas use `--color-bg-input`, `--color-border`, `--radius-md`, and a
  cyan focus ring (`--color-border-accent`).

### Checkbox (`Checkbox` component)

Reusable stylized checkbox for filter toggles. Component:
[`frontend/src/components/Checkbox/`](frontend/src/components/Checkbox/). Native
`<input type="checkbox">` is sr-only; custom face is `.checkbox__control`.

| Element | Tokens / values |
|---|---|
| Root (`.checkbox`) | `inline-flex`, `gap: var(--space-2)`, `--font-size-sm`, `--color-text-muted`; checked (`.is-checked`) brightens label to `--color-text` |
| Control face (`.checkbox__control`) | **20×20px**, `--radius-sm`, `--color-bg-input` bg, `1px solid --color-border` |
| Hover (enabled) | `--color-bg-hover` bg, `--color-border-accent` border |
| Checked | `--color-accent-soft` bg, `--color-border-accent` border, `box-shadow: 0 0 0 1px var(--color-accent-glow)`; `IconCheck` at 12px in `--color-accent-bright` |
| Focus | `outline: 2px solid --color-border-accent; outline-offset: 2px` on control when input `:focus-visible` |
| Disabled (`.is-disabled`) | `opacity: 0.45`, `cursor: not-allowed` |
| Mobile (`.layout-mobile .checkbox`) | `min-height: 44px`, `padding-inline: var(--space-1)` for thumb-friendly tap rows |

**`labelPosition`:** default `'start'` (box before label) for filter toggles; `'end'` for
account-sheet row (`.account-sheet__toggle`) with `justify-content: space-between`.

**Usages:** Collection **Owned only** (`.col__owned-toggle`), DBV **Has Foil**
(`.dbv-filter-rail__foil-toggle`), deck editor Add Cards **Hide Unusables**
(`.add-cards__filters-toggle`), mobile account sheet **Use desktop layout**.

## Layout & Navigation
- Full-width layout: `--content-max-width: none`; page `*__inner` wrappers and `.top-nav__inner` span the viewport with horizontal padding (`--space-6` desktop, `--space-4` mobile) as side gutters. Deck editor uses the same full-bleed pattern with its own chrome (no AppShell wrapper); on mobile it still mounts the shared [`MobileBottomNav`](frontend/src/components/MobileBottomNav/MobileBottomNav.tsx).
- **`html.layout-desktop { scrollbar-gutter: stable; }`** reserves vertical scrollbar space so the centered
  top nav does not shift when shorter pages (e.g. Decks) hide the document scrollbar.
- **Mobile horizontal containment:** `html.layout-mobile`, `body`, `#root`, and `.app-shell` / `.app-shell__content` use `overflow-x: clip` and `max-width: 100%` so the page cannot pan sideways. Intentional horizontal scroll stays on inner regions (`.db__types`, `.col__types`, `.dbv-filter-rail__controls`, `.home__rail`) via `overflow-x: auto`, `min-width: 0`, and `overscroll-behavior-x: contain`.
- **Collection mobile header** (`layout-mobile`, [`CollectionPage.css`](frontend/src/features/collection/CollectionPage.css)): four stacked rows — (1) `.col__heading` flex row with `.col__title` left and `.col__stats` right on one line (`margin-top: 0` on stats); (2) `.col__search` full width (`flex: 1 1 100%`); (3) `.col__set` + `.col__owned-toggle` on the next line (set select `min-width: 173px` / `max-width: 230px`, left-aligned; toggle `margin-left: auto`); (4) `.col__types` horizontal chip scroll below the header. Desktop keeps the original side-by-side header band. **Mobile type-tab swipe** (`.layout-mobile .col`): horizontal swipe on card grid, All list, or empty content cycles type tabs cyclically (`DBV_TAB_ORDER`: All → Characters → … → Basic → wrap); `touch-action: pan-y` on `.col`; blocked regions in `COLLECTION_SWIPE_BLOCK_SELECTOR` (`.col__types`, `.col__header`, `.pagination`, `.qty-stepper`); disabled while `CardDetailPanel` is open; active `[data-col-tab]` chip centers on tab change.
- **Desktop** (`> 900px`): sticky **top nav** (`--top-nav-height: 60px`) with the logo,
  primary links (Home, Database, Decks, Collection), and the user menu on the right. The
  active link is cyan with a soft pill background.
- **Mobile** (`<= 900px`): a fixed **bottom nav** (`--bottom-nav-height: 66px`) with
  icon+label tabs ordered **Database, Decks, Home, Collection, Profile** (Home centered;
  `.bottom-nav__item--home .bottom-nav__icon` at `calc(1.4rem * 1.15)` vs `1.4rem` for other
  tabs). Top nav is hidden. Deck editor (outside AppShell) uses the same bottom nav on mobile;
  `.deck-editor__content` bottom padding clears the fixed bar (`--bottom-nav-height` + safe area).
- **Mobile login viewport:** `.login` uses `100dvh` with safe-area-aware block padding,
  `align-content: safe center`, and vertical scrolling. The mobile login wordmark renders at
  `250px` high. Google sign-in appears above the `OR` divider and username/password form on mobile;
  desktop retains username/password first. The responsive DOM order matches keyboard focus. The
  full auth stack stays centered when it fits, but short browser viewports anchor it below the
  visible top instead of clipping the logo.
- Nav, dropdowns, and tooltips sit at `--z-nav: 9999` so they always clear page content.

### Branding & favicon
- **In-app logo:** [`Logo`](frontend/src/components/Logo/Logo.tsx) `variant="emblem"` uses
  `/src/resources/images/logo/logo6.png` (textless triangle mark) in desktop top nav and deck
  editor rail; login uses `wordmark` (`logo5.png`).
- **Browser tab favicon:** [`frontend/index.html`](frontend/index.html) links
  `/src/resources/images/favicon.png` (32×32 PNG) and
  `/src/resources/images/apple-touch-icon.png` (180×180). Both are generated from `logo6.png`
  via `npm run generate:favicon` ([`src/scripts/generateFavicon.ts`](src/scripts/generateFavicon.ts)).
  Output PNGs use a **transparent** background (near-black keyed out from `logo6.png`). Generation
  trims padding and applies a slight zoom so the emblem fills more of the favicon canvas (browser
  tabs still render favicons at a fixed ~16px; this maximizes visual weight within that slot).
- **Regenerate** after changing `logo6.png`: `npm run generate:favicon` (or `--force`).

## Cards & Card Art
- Card art is rendered exclusively through the `CardImage` component, which resolves
  paths via [`frontend/src/lib/images/cardImages.ts`](frontend/src/lib/images/cardImages.ts)
  (CDN base + thumbnail rules). Never hardcode image URLs.
- Progressive thumbnail → full-resolution reveals must preserve the same painted framing;
  loading may improve sharpness but must not visibly scale, crop, or shift the card art.
- Two-faced cards expose a compact circular flip control at the lower-right of the
  detail image. The control uses the elevated/input surface, strong border, standard
  pop shadow, and accent focus ring; flipping changes art only and never mutates deck state.
- Released Skybound alternate art (collectors 419–472) renders its own non-foil source image
  through the standard landscape character frame and progressive image pipeline. Collector 450
  exposes the same compact flip control as collector 226 for its reverse face. Skybound
  printing-production foil images remain excluded; foil rows reuse their non-foil image and
  receive the existing sheen. Character tiles with the same alphabetic name use numeric collector
  order so the default/earliest art appears before alternates. The Database foil marker, Has Foil
  filter, and detail value are printing-specific: collector `N` is foil-capable only when its own
  `NF` mapping exists, never because a different alternate printing has a foil.
- Card tiles (`CardTile`) use a type-aware aspect frame (`catalogType` prop): portrait
  `5:7` by default; characters `380:280`; locations and events `236:151`. Tiles use
  `--radius-md` corners, subtle border, and a name row + set/rarity row beneath. The Database
  foil ✦ sits at the right of the name row; set/collector number and rarity stay paired on the
  row below. Owned/selected tiles
  get the accent glow; unowned tiles in the Collection are dimmed. Database and Collection
  grids use 4 columns for landscape types and 6 for portrait (1 on mobile).
- **All tab** (first tab on Database and Collection; Collection defaults to **All**): cross-type **text list** via
  `CatalogAllList` — no card images. **Database** rows: `#set_number`, card name, type badge, friendly set name,
  spacer, and (Collection only) trailing `QuantityStepper`. **Collection** All uses `typeBetweenNumberAndName`:
  `#` → type → name → set on desktop with fixed scan-band column widths and tabular `#` numerals;
  mobile row 1 is set code + `#` + compact type + name (single row, `compactTypeLabels`).
  Sort is fixed checklist
  order: set → non-foil before foil → set_number → name (`compareAllCatalogCards`). Selected
  row: accent left border + `--color-accent-soft` background. DBV All opens detail slideout on
  row click only (deck/collection actions in panel). Pagination uses 48 rows per page on All
  (24 on image grids). Search + set filter apply; DBV hides `DbvFilterRail` on All.
- **Catalog search copy and scope:** Database, Collection, and deck-editor Add Cards placeholders
  advertise mission-set search. Their shared search matches card name, linked character,
  mission-set name, and card text; Collection also advertises the `foil` keyword.
- **Database per-type grids with All Sets selected** ignore set/collector number: linked
  character/location or mission-set alphabetic order applies to named categories, while Power
  and Universe value cards use OverPower type order then ascending value. Selecting a specific
  set keeps Characters in that same name → numeric collector order so default and alternate art
  stay adjacent; other tabs restore collector-number order. Database All and every Collection view
  retain checklist order.
- Missing art shows a neutral "No image" placeholder frame (no broken-image icon).
- **Deck tiles (`DeckTile`)** use a feature-character art zone at landscape card ratio
  (`aspect-ratio: 380 / 280`): characters (and the location card when set) cycle on hover after a
  1s delay. Slides follow the saved deck-editor order: first four characters → location →
  battleground → repeat. Character slides use `object-fit: contain`; location and battleground slides use full-res art with
  `object-fit: cover` so the 236×151 location frame fills the hero slot without letterboxing. A bottom
  gradient scrim carries the deck **name** (`.deck-tile__name`: `calc(var(--font-size-lg) * 1.1)`;
  compact tiles use `calc(var(--font-size-base) * 1.1)`). The info panel opens with a single
  **meta bar**: 18×18 cards icon + count on the left, mission set chip centered (`full`,
  catalog `mission_set`), and `threat.png` + threat on the right. Max-stat bar follows on `full` tiles. A **footer** row
  shows the updated date (left) and optional legality badge lower-right (**Limited** or **Not Legal**
  only; legal decks show date only).
- **Community search** uses the standard search input and matches deck titles, owner usernames,
  character names, and location names with the same query. Its accent focus ring surrounds the
  outer search pill, keeping the icon and text aligned in one control.
- **Foil laminate (per screen):** The prismatic `FoilCard` overlay is controlled by `showFoilEffect`
  on `CardImage` / `CardTile` / `CardDetailPanel` (default `true`). Base cards that merely have a
  foil variant show a silver ✦ badge (`.card-tile__foil-badge`) instead of the laminate.

  | Screen | Laminate | Indicator |
  |---|---|---|
  | Database View — grid | Off | ✦ badge + **Has Foil** metadata |
  | Database View — detail slide-out | On for foil printings | **Has Foil** / **Is Foil** metadata |
  | Deck editor — Add Cards slideout | Off | Plain catalog art |
  | Deck editor — card grid, Draw Hand, detail | On when `is_foil` or foil printing selected | — |
  | Collection (grid + detail) | On for foil printings | — |
  | Deck tiles (selection / home / community) | On when deck entry `is_foil` on character slides | — |

## Stats, Badges & Status
OverPower stat colors (also exposed as `.stat-energy` etc. utility classes):

| Stat | Token | Color |
|---|---|---|
| Energy | `--color-stat-energy` | amber `#f6a623` |
| Combat | `--color-stat-combat` | red `#ef4d5a` |
| Brute Force | `--color-stat-brute-force` | green `#4bd07b` |
| Intelligence | `--color-stat-intelligence` | blue `#3aa0ff` |
| Total | `--color-stat-total` | violet `#b06bff` |

- Stat tiles show the value in the stat color over an elevated surface with a muted label.
- **Deck tile legality** (`DeckTile` footer): show **Limited** when `is_limited`; else **Not
  Legal** when `!is_valid`; else no badge. Never show Legal + Limited together.
- **Legality** (deck editor, etc.): `Legal` uses `--color-legal` (green), `Not Legal` uses
  `--color-not-legal` (red); `Limited` uses `--color-warning` (yellow `#f6a623`, `.badge-limited`).
- **Legality chip is interactive in the deck editor for the owner**: rendered as a clickable
  `<button>` (`.deck-editor__legality-toggle`, `cursor: pointer`). Clicking a Legal/Not-Legal chip
  toggles the deck to the yellow **Limited** chip (skips legality validation); clicking Limited
  reverts. Non-owners/read-only see a static chip. All other surfaces remain display-only.
- **Legality errors**: desktop keeps the hover/focus popover. Mobile keeps the header collapsed;
  pressing and holding **Not Legal** for 500ms opens a scrollable, half-viewport-height panel
  anchored directly below the chip and constrained to the visible screen. The panel dismisses by
  tapping outside, **Close**, or Escape, and the
  completed long press never activates the owner's Limited toggle.
- **Rarity** dots/labels use the `--color-rarity-*` ramp.
- Quantity badges (`x2`) overlay the top-right of a card tile in an accent pill.

## Panels & Overlays
- `SlideOutPanel` is the standard right-hand drawer for details and forms (card detail,
  create deck, deck actions, add cards). It uses `--color-bg-panel`, `--shadow-pop`, a
  scrim at `--z-drawer`, focus trapping, `Esc` to close, and slides in with `--ease-out`.
- The New Deck form presents unlisted/public Community-listing choices as a compact stacked radio
  group with readable supporting text; unlisted is selected by default, remains link-readable, and
  is persisted with the deck.
- **Help & feedback:** the profile menu places a question-mark action after account settings and
  before the divider above Log Out / Exit Guest. It closes the profile surface before opening a
  compact, top-right desktop inspector or mobile bottom sheet. Bug and feature/change rows use
  48px accent-soft icon tiles and open a focused text-entry modal; Email support uses a `mailto:` link,
  while Message on Discord shows `@GirlsGoneKyle` in its subtext and opens the OverPower invite in a
  new tab. Contact-card hover and keyboard-focus states use the accent background and border without
  underlining their text. The
  success confirmation uses 24px internal spacing so its icon and Done action remain clear of the
  dialog border.
  Successful API delivery replaces the form with
  a centered confirmation dialog. Feedback forms use the standard input surface, accent focus ring,
  explicit category label, 4,000-character count, disabled sending state, Escape/backdrop dismissal,
  and a stacked edge-to-edge sheet treatment below 560px.
- The card **detail panel** shows the full art, type/set chips, an action slot (e.g. Add to
  Deck / + Collection), the color-coded stat row, and a Details key/value list
  (Set, **Is Foil** on Collection, **Has Foil** on Database, Set Number, abilities when present). Default width **504px** (20% wider
  than the original 420px drawer). Character detail uses a landscape art frame (`380:280`);
  the fifth stat tile is gray **Threat** instead of purple **Total**.

## Responsive (Mobile vs Desktop)
- Single breakpoint: **900px** (`--layout-mobile-max`).
- Never branch on user-agent. The `<html>` element carries `.layout-mobile` /
  `.layout-desktop`, driven by `useLayoutMode()`
  ([`LayoutModeProvider`](frontend/src/lib/layout/LayoutModeProvider.tsx)) using
  `matchMedia`. An inline script in `index.html` sets the class before first paint to avoid
  FOUC, honoring a `localStorage.preferDesktopLayout` override.
- Write desktop styles as the default and scope mobile overrides under `.layout-mobile`.

## Motion
- Easing: `--ease-out` (`cubic-bezier(.16,1,.3,1)`).
- Durations: `--dur-fast 120ms` (hovers), `--dur-med 220ms` (panels), `--dur-slow 360ms`.
- Respect `prefers-reduced-motion`: transitions collapse to near-instant.

## Per-Screen Notes
Each screen has a companion doc in its feature folder:
- Login — [`frontend/src/features/login/LoginPage.md`](frontend/src/features/login/LoginPage.md)
- Home — [`frontend/src/features/home/HomePage.md`](frontend/src/features/home/HomePage.md)
- Home Recent Updates list — [`frontend/src/features/home/HomeUpdatesPage.md`](frontend/src/features/home/HomeUpdatesPage.md)
- Database (DBV) — [`frontend/src/features/database/DatabasePage.md`](frontend/src/features/database/DatabasePage.md)
- Collection — [`frontend/src/features/collection/CollectionPage.md`](frontend/src/features/collection/CollectionPage.md)
- Deck Selection — [`frontend/src/features/deck-selection/DeckSelectionPage.md`](frontend/src/features/deck-selection/DeckSelectionPage.md)
- Deck Editor (DEV) — [`frontend/src/features/deck-editor/DeckEditorPage.md`](frontend/src/features/deck-editor/DeckEditorPage.md)

### Deck Editor — Desktop header compaction
DTV topbar (`.deck-editor__topbar`) uses a 3-column grid on wide viewports: leading (name + meta) | stats panel | actions. When the main column is narrow (`@container deck-editor-main (max-width: 1700px)`, desktop only), it switches to a **two-row** layout in [`DeckEditorPage.css`](frontend/src/features/deck-editor/DeckEditorPage.css):

| Row | Content |
|---|---|
| Row 1 | Leading (back + name + meta chips on one line) \| actions (right-aligned) |
| Row 2 | Full-width stats panel (threat, character max, icon totals), centered, top border separator |

Row 1 keeps back, deck name, and meta chips (card count, legality, visibility) on a single line. Stat block labels stay visible on row 2 (short labels **Max** / **Total**, uppercase via CSS). Mobile `layout-mobile` unchanged.

**Header stat icons** (`.layout-desktop .deck-editor__header .stat-icon-badge--lg`): `StatIconBadge` `lg` scaled to **90%** (40px → 36px, value font 16px → 14.4px). Card-tile stat icons in the deck body remain full `lg` (40px).

**Stat tooltips** (concise, on hover):
- Threat: `Threat: {n}` (or `{n}/76` over cap) via `formatThreatTooltip`
- Max section: `Character max stats`; each icon: `Character max — {Stat}: {value}`
- Total section: `Deck icon totals`; each icon: `Icon total — {Stat}: {value}`

### Deck Editor — Simulate KO
| Element | Tokens / values |
|---|---|
| KO toggle (`.deck-editor__ko-btn`) | `--color-ko-soft` fill, `--color-ko` text, `--color-ko-border` border; `min-width: 36px`, `font-size-xs`, semibold |
| KO active (`.deck-editor__ko-btn.is-active`) | `--color-ko` fill, `--color-text-on-accent` label |
| KO-dimmed card (`.deck-editor__card--ko-dimmed .deck-editor__card-media`) | `filter: grayscale(0.7) brightness(0.55)` on art only — matches `CardTile` dimming; footer controls stay full contrast |

### Deck Editor — Pre-Placed
Owner-only toggle (eligible cards) that marks a card as placed at game start (`exclude_from_draw`). The active status is visible on public/read-only deck tiles and inspectors; only the owner can change it. Full spec: [`DeckEditorPage.md`](frontend/src/features/deck-editor/DeckEditorPage.md#pre-placed). Eligibility: [`prePlaced.ts`](frontend/src/lib/decks/prePlaced.ts).

Equivalent location effects share eligibility: Spartan Training Ground / Teen Team Headquarters enable non-OPD Training cards, and Dracula's Armory / The Sanctuary enable non-OPD Basic Universe cards. Character start-in-play specials use the same toggle for Lancelot / Sword and Shield, Immortal / I am Immortal, Mauler Twins / My Brother, and Ezekiel / Shiva.

| Element | Tokens / values |
|---|---|
| Toggle button (`.card-detail__preplaced-btn`) | Pill (`--radius-pill`); `--color-accent-bright` border/text, transparent fill; hover `--color-accent-soft`; `font-size-xs`, semibold. In `CardDetailPanel` slide-out |
| Toggle active (`.card-detail__preplaced-btn.is-active`) | `--color-accent-bright` fill, `--color-text-on-accent` label |
| Hint (`.card-detail__preplaced-hint`) | `--font-size-xs`, `--color-text-muted` |
| Tile chip (`.deck-editor__preplaced-chip`) | Subtle — matches Reserve button: `--color-bg-scrim` fill, `--color-text-dim` text, `--color-border` border, `--radius-sm`, `height: 26px`, `font-size: 10px`, medium weight; **center-aligned** in footer |
| Footer layout (`.deck-editor__card-footer`) | `display: grid; grid-template-columns: 1fr auto 1fr` — spacer / centered chip / right-aligned `.deck-editor__card-controls` |

### Deck Editor — Draw Hand
Top slide-out overlay ([`DrawHandPanel.css`](frontend/src/features/deck-editor/DrawHandPanel.css)). Full spec: [`docs/current/DRAW_HAND_FEATURE.md`](docs/current/DRAW_HAND_FEATURE.md). After draw/redraw, cards sort by deck section order then within-type deck sort (manual drag reorder still allowed until next draw).

| Element | Tokens / values |
|---|---|
| Trigger active (`.deck-editor__actions .btn-ghost.is-active`) | `--color-accent-bright` text, `--color-border-accent` border, `rgba(0, 200, 232, 0.08)` background |
| Panel (`.draw-hand-slideout`) | `SlideOutPanel` `side="top"`; `max-height: 70vh` desktop, `55vh` mobile |
| Card slot width | `--deck-editor-portrait-col`: **210px** desktop, **165px** mobile (`DeckEditorPage.css`) |
| Portrait card art | Same progressive thumb → full-res as deck grid (`deckEditorCardImage.ts`; events excepted — rotated landscape in `.draw-hand__event-rotate`) |
| Row gap | `var(--space-4)` between slots |
| Event rotation | `.draw-hand__event-rotate` — landscape art `rotate(-90deg)` in portrait slot |
| Missing art label (`.draw-hand__missing-art`) | `--font-size-xs`, `--color-text-muted`, ellipsis |
| Redraw (`.draw-hand__redraw`) | Centered footer; `min-width: 140px` |
| KO-dimmed drawn card | Same `.deck-editor__card--ko-dimmed` art filter as main grid |

### Deck Editor — Card detail Printings (owners)
Shown in [`CardDetailPanel`](frontend/src/components/CardDetailPanel/CardDetailPanel.tsx) when a deck tile has **more than one** catalog printing. Section sits **above Details** (after Ability/stats).

| Element | Tokens / values |
|---|---|
| Section title (`.card-detail__section-title`) | `--font-size-sm`, uppercase, `--color-text-muted` |
| Row (`.card-detail__printing-row`) | flex space-between; `--space-2` vertical padding; `border-bottom: 1px solid var(--color-border)` |
| Meta (`.card-detail__printing-meta`) | `--font-size-sm`, `--color-text` — `{friendly set name} · #{set_number}` |
| Apply (`.card-detail__printing-apply`) | `--color-accent` border/text; `--radius-sm`; hover fills accent |
| Current / disabled (`.card-detail__printing-apply--current`) | `opacity: 0.45`; `--color-border` border; `--color-text-muted` text; `cursor: not-allowed` |

### Card detail — More disclosure and official errata

The shared card-detail slide-out keeps commonly useful metadata visible. Secondary rules
metadata (One Per Deck, function-icon flags, and Banned) is collapsed by default beneath
a native **More** disclosure. Official errata always sits at the bottom of the drawer so
it follows the card's printed ability and catalog details.

On mobile, the card-detail drawer's scroll body reserves bottom space equal to
`--bottom-nav-height + env(safe-area-inset-bottom) + --space-5`. The final detail or errata
row must scroll completely above the fixed bottom navigation; this clearance is scoped to
`.card-detail-slideout` and does not alter other drawers.

| Element | Tokens / values |
|---|---|
| More summary (`.card-detail__more-summary`) | Native `<summary>` keyboard semantics; centered uppercase `font-size-xs` label with 16px chevron; `--color-border` horizontal rules on both sides; muted text, accent-bright hover/focus |
| Expanded state (`.card-detail__more[open]`) | Chevron rotates 180 degrees; secondary rows use the standard `.card-detail__field` treatment |
| Errata list / entry (`.card-detail__errata-list`, `.card-detail__errata-entry`) | Flat content using the slide panel background; standard `--color-border` horizontal separators; no nested card border, accent rail, radius, tint, or gradient; `--space-3`/`--space-4` vertical rhythm |
| Errata title/text | Title uses `font-size-sm`, semibold, `--color-text`; full plain text matches the slide's readable `--color-text` and 1.6 line-height while preserving paragraph breaks |
| Source link (`.card-detail__errata-link`) | `font-size-xs`, semibold, quieter `--color-accent`; underline on hover; visible 2px accent focus ring; opens canonical source in a new tab |
| Mobile scroll clearance (`.card-detail-slideout .slideout__body`) | Bottom padding and scroll padding reserve the fixed `--bottom-nav-height`, safe-area inset, and `--space-5` so the final row clears the nav |

### Deck Editor — Add Cards quantity overlay
Top-right overlay on Add Cards catalog tiles ([`AddCardsQtyOverlay.css`](frontend/src/features/deck-editor/AddCardsQtyOverlay.css)). Positioned via `.card-tile__overlay`.

| State | Class | Visual |
|---|---|---|
| Zero in deck | `.add-cards__add` | `--color-bg-scrim` fill, `--color-accent-bright` `+`, `1px solid var(--color-border-accent)`, `--radius-full`, `--font-size-xs`, bold; `padding: 2px 8px` (mobile: `4px 10px`) |
| One or more | `.add-cards__qty` | `--color-bg-scrim` fill, `1px solid rgba(54, 211, 153, 0.5)`, `--radius-full`, inline-flex, `gap: 2px`, `padding: 2px 4px` |
| − / + buttons | `.add-cards__qty-btn` | 20×20 desktop, 28×28 mobile; transparent bg, `--color-text`; hover: `rgba(255,255,255,0.12)` + `--color-accent-bright`; disabled: `opacity: 0.35` |
| Count | `.add-cards__qty-value` | `--font-size-xs`, bold, `--color-text`, read-only (no input) |

Mobile swipe: `.add-cards__qty` and `.add-cards__add` are in `ADD_CARDS_SWIPE_BLOCK_SELECTOR` so tab swipes do not fire when adjusting quantity.

### Deck Editor — Add Cards wide desktop context pane

On desktop viewports **above 1200px**, Add Cards expands the right `SlideOutPanel` from the normal **575px** drawer to `.add-cards-slideout { width: min(1060px, calc(100vw - 72px)) }`. Below 1200px, the drawer uses the existing single-pane layout and inline filters.

| Element | Tokens / values |
|---|---|
| Shell (`.add-cards-shell`) | Wide desktop `display: grid`; columns `minmax(360px, 1fr) 575px`; `gap: var(--space-4)` |
| Context pane (`.add-cards__context-pane`) | Wide desktop only; `grid-template-rows: max-content max-content minmax(0, 1fr)` with `gap: var(--space-2)` so Team and filters use only their intrinsic height while the preview receives all remaining space; right separator `1px solid var(--color-border)`; no self scrolling |
| Team heading (`.add-cards__pane-heading`) | `--font-size-xs`, uppercase, `--color-text-muted`, `letter-spacing: 0.05em`, `4px` bottom margin |
| Team rows (`.add-cards__team-row`) | `grid-template-columns: minmax(185px, 1fr) minmax(220px, auto)`; `min-height: 35px`; five rows total: four character slots plus one Location row; every slot row, including the fourth character and Location row, keeps the same bottom rule; team section has `4px` bottom padding before filters |
| Team stat icons (`.add-cards__team-stat-list .stat-icon-badge--md`) | Large readable generated `StatIconBadge` values; 38×38px in the context pane for Energy, Combat, Brute Force, Intelligence, and Threat Value. Grid-changing inherent abilities display their effective team value, such as Michonne Combat 8 with Rick Grimes and Alexandria present |
| Team threat heading (`.add-cards__team-threat`) | Replaces the old `4/4` count with `Threat: {total}`. Uses shared `TOURNAMENT_LEGAL_THREAT_LIMIT` (`76`); over-cap totals render only the total number in `--color-danger`, followed by `/ 76` |
| Location and Battleground row (`.add-cards__team-row--location`) | One structural row shows the selected Location and Battleground names joined with `&`; Location Threat Value remains right-aligned with character TV icons. Empty state reads `No Location or Battleground Set` |
| Compact filters (`.add-cards__filters`, `.add-cards__dynamic-filters`) | Set + Hide Unusables plus type-specific DBV-style controls; no top rule in the wide context pane; `4px` top buffer above the Set row keeps the filters visually attached to the Location row without crowding its divider; filter text/icons/controls are scaled about 10% larger than the compact baseline; controls wrap within their intrinsic context-pane row without horizontal scrolling; numeric stat filters use a compact 3-column grid so character stats fit in 2 rows, with `Clear` occupying the empty sixth cell when active; Location Threat Value uses a subtly larger single-filter treatment; Type and Function icon groups stack as rows with a fixed 76px label column so first icons align vertically; no active-filter summary chips in this compact pane. Mobile uses the shared `CatalogFilterRail` shell: the collapsed row scrolls horizontally, and its 44px chevron opens the same wrapping overlay behavior as Database. |
| Hover preview (`.add-cards__hover-preview`) | Bottom 65%; image-only `CardImage` preview; hidden overflow so the full-card image scales to fit the pane without detail text or buttons |
| Placeholder (`.add-cards__hover-placeholder`) | Centered muted text, `--font-size-sm`, top border separator |
| Slide-out header/footer (`.add-cards-slideout .slideout__header`, `.add-cards-slideout .slideout__footer`) | Add Cards uses compact chrome to preserve vertical working space: header padding `var(--space-2) var(--space-5)` and footer padding `var(--space-3) var(--space-5)` |
| Done (`.add-cards__done`) | Compact centered primary pill scaled down from the larger toolbar-chip treatment: `padding: 4px 9px`, `font-size: calc(var(--font-size-xs) * 0.9)`, icon `13×13px`, `gap: calc(var(--space-2) * 0.6)` |

**Behavior:** Hovering a result-pane card or filled team row populates the preview with the selected full-card image. Clicking a result card still adds it; the preview remains until the pointer leaves the hovered card/team row. Add Cards permits multiple Locations and Battlegrounds so builders can create an invalid draft and rely on deck legality feedback; explicit `one_per_deck` cards retain their one-copy ceiling. Add Cards includes an Add Cards-only `Any-Char` tab immediately after `Special`; it reuses the `special-cards` catalog/deck type and shows only specials linked to `Any Character`, while `Special` shows character-specific specials. Search, type tab, Set, Hide Unusables, current page, and dynamic filters persist while closing/reopening Add Cards in the same deck-editor session. Dynamic filters are cached per card type so tabbing away and back restores that type's selections; the cache resets when the deck editor unloads.

### Deck Editor — Instance tiles
Each physical copy is one deck tile (`instanceId` client-side). Owners remove via trash on every type; **Save** aggregates instances by `(type, cardId)` for the API.

In card view, the Special Cards grid keeps character-linked and Any Character specials in one section. When the deck contains at least one of each, a full-width `--color-border` divider (`.deck-editor__special-category-divider`) starts a fresh row before the first Any Character special; no divider appears when either category is absent.

| View | Control | Class |
|---|---|---|
| Card view | Trash in tile footer | `.deck-editor__card-remove` (26×26, scrim + border) |
| List view | Trash at row end | `.deck-editor__list-remove` (24×24 desktop, 44×44 mobile; icon-only default, danger tint on hover/focus) |

List rows aggregate duplicate `type + cardId` copies; each trash click removes one instance (last in `instanceIds`). Character list rows keep Reserve + KO left of trash.

### Deck Editor — Character preview order

Owners arrange the Characters card grid to set the carousel order shared by compact and full `DeckTile` variants. Desktop cards use grab/grabbing cursors, a subtle grip hint, drag target lift, and accent border; hover/focus also reveals accessible earlier/later buttons. Mobile press-and-hold reveals a scrim pill with 44px up/down controls, slot count, and Done. The active card gets the accent ring. Reordering is local/dirty until Save; read-only decks show no controls.

### Deck Editor — Mobile bottom nav
On `.layout-mobile`, the deck editor renders the shared `MobileBottomNav` (`--bottom-nav-height: 66px`,
`--z-nav: 9999`). Nav is hidden during Add Cards, Draw Hand, and Card Detail slide-outs. Content
scroll area: `padding-bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + var(--space-2))`.

### Deck Editor — Mobile card grids
On `.layout-mobile`, main deck body (`.deck-editor__cards`, `.deck-editor__cards--landscape`) and Add Cards grids (`.add-cards__grid--portrait`, `--landscape`, `--portrait-4`) use **one card per row**: `grid-template-columns: minmax(0, 1fr)`. Stacks tab character tile is full width. Draw Hand carousel is unchanged (horizontal snap). Add Cards pagination: **8** cards/page on mobile.

### Deck Editor — Mobile type tabs
Sticky `.deck-editor__type-tabs` below the header when the deck has **2+ types** on mobile. Chips use `.deck-editor__type` / `.deck-editor__type-count` (Add Cards pill style); labels are `shortLabel` from `CATALOG_TYPES`. Only types with cards in the deck appear. Swipe left/right on `.deck-editor__content` cycles types cyclically via native `touchstart`/`touchmove`/`touchend` listeners (`useHorizontalSwipe`); horizontal swipes work on card art; gestures starting on footer controls, tabs, or header are ignored. `touch-action: pan-y` on content preserves vertical scroll.

Architecture, data flow, and serving are documented in
[`docs/current/FRONTEND_V2.md`](docs/current/FRONTEND_V2.md).

## Database Filter Rail

Always-visible per-type filter rail on DBV (`/data`), inserted between `.db__types` and
`.db__grid`. Its responsive outer shell is shared with deck-editor Add Cards through
[`CatalogFilterRail`](frontend/src/features/database/components/CatalogFilterRail.tsx); Database-only
filter composition remains in `DbvFilterRail`. See
[`DbvFilterRail.css`](frontend/src/features/database/components/DbvFilterRail.css).

| Element | Tokens / values |
|---|---|
| Type tabs (`.db__type`) | Pill controls use 95% of the prior type-tab padding and font size: `calc(var(--space-2) * 0.95)` vertical, `calc(var(--space-4) * 0.95)` horizontal, and `calc(var(--font-size-sm) * 0.95)` text |
| Landscape catalog tiles (`.card-tile--locations`, `.card-tile--events`) | Locations, Battlegrounds, and Events use the shared `236:151` landscape frame with `contain` image fit |
| Rail (`.dbv-filter-rail`) | `--color-bg-elevated`, `--radius-md`, `--space-2` vertical / `--space-3` horizontal padding, `min-height: 40px`, `border: 1px solid var(--color-border)` |
| Group labels (`.dbv-filter-rail__label`) | `--font-size-xs`, `--color-text-dim` |
| Active icon toggles (`.dbv-power-strip__btn.is-active`, `.dbv-func-strip__btn.is-active`) | `--color-border-accent`, `box-shadow: 0 0 0 1px var(--color-accent-glow)` (matches `.db__type.is-active`) |
| Active stat cell (`.dbv-stat-cell.has-filter`) | `--color-border-accent`, `--color-accent-soft` |
| Chips (`.dbv-filter-rail__chip`) | `--color-accent-soft`, `--color-border-accent`, `--font-size-xs` |
| Clear (`.dbv-filter-rail__clear`) | `--color-accent-bright` |
| Has Foil (`.dbv-filter-rail__foil-toggle`) | Shared `Checkbox` component; label `--color-text`; persists across tab switches; hidden when rail collapsed |
| Hide Alts (`.dbv-filter-rail__hide-alts-toggle`) | Shared `Checkbox` component beside Has Foil; checked by default; keeps the canonical main printing for each logical card and restores all printings when unchecked |
| Stat op/value (`.dbv-stat-cell__op`, `.dbv-stat-cell__value`) | `width: calc(2.75rem * 1.15)`, `min-height: calc(1.5rem * 1.15)`, `font-size: calc(var(--font-size-xs) * 1.15)`; mobile `min-height: calc(36px * 1.15)`; numeric values do not auto-snap to configured min/max while the user types |
| Collapse toggle (`.dbv-filter-rail__toggle`) | Left-edge chevron; `28×28px` desktop, `44×44px` mobile; `--color-text-muted`, hover `--color-bg-hover` |
| Collapsed rail (`.dbv-filter-rail.is-collapsed`) | Desktop is transparent with a left chevron and `1px` rule. Mobile keeps the complete one-row rail visible and horizontally scrollable, with a chevron-down indicating that more space is available. |
| Expanded mobile pane (`.layout-mobile .dbv-filter-rail:not(.is-collapsed) .dbv-filter-rail__body`) | Drops below the rail over the card results, uses `--color-bg-panel`, `--color-border-strong`, and `--shadow-panel`, wraps every available filter group, sizes sections to their content so one-row panes stay compact, and caps height with contained vertical scrolling. |

**Layout:** On Database and Add Cards, the collapsed mobile row scrolls horizontally; expanding it
turns the same controls into a wrapping overlay pane so all available filters can be reached without
horizontal hunting. Mobile icon/stat tap targets are **44px** under `.layout-mobile`. Database
trailing chips + Clear sit at the rail end; Add Cards places Set + Hide Unusables there.

## Database Saved Views

Saved Views adds a quiet navy workflow surface to `/data` without restricting any catalog information.

| Element | Visual and behavior contract |
|---|---|
| Header actions (`.db__saved-controls`) | Accent-outline **Save this view** and **Saved views (N)** controls beside search/Set; wrap as a clean full-width row on mobile, never horizontal-overflow the header |
| Desktop panel (`.saved-views__panel--desktop`) | 340px docked right sidebar, `--color-bg-panel`, accent left border, no scrim, no modal semantics/focus trap; reflows the flexible database grid |
| Mobile drawer (`.saved-views__panel--mobile`) | Full viewport width at `useLayoutMode` mobile, `--color-bg-scrim` backdrop, `--z-modal`, Escape/backdrop close, contained/restored focus, vertical scroll, safe-area top/bottom padding, and fixed-bottom-nav clearance |
| Section hierarchy | Optional muted uppercase **Pinned** heading first, then **Views**; both sort newest-created first. Rows are full-width `--color-bg-surface` with restrained hover and an accent-soft active-recall state |
| Inline draft/rename (`.saved-views__row--editor`) | Row-level input on `--color-bg-input`, accent border, compact check/cancel buttons, inline danger validation; draft sits at the top of the unpinned list |
| Row actions | Quiet database icon, ellipsized name, and 36px desktop/44px mobile three-dot menu for Rename, Pin/Unpin, and confirmed Delete |
| Bulk management | Explicit Manage mode with accessible checkboxes, select-all/clear, selected count, Cancel, and danger-colored **Delete selected** confirmation |
| Quota disabled | Save uses `--color-text-dim`/`--color-border`, `cursor: not-allowed`, plus a separate focusable wrapper exposing a custom hover/focus tooltip; never rely only on `title` |
| Empty state | Bookmark icon and concise workflow guidance; no marketing, pricing, card art, or implication that database information is restricted |

Motion uses `--dur-med`/`--ease-out` for mobile entry and is removed under `prefers-reduced-motion`. Desktop is static because it is part of the page layout rather than an overlay.

## Home Recent Updates

News/announcement tiles on `/home` (rail) and `/home/updates` (full list). Shared styles in
[`recentUpdates.css`](frontend/src/features/home/recentUpdates.css); components
[`RecentUpdateTile.tsx`](frontend/src/features/home/RecentUpdateTile.tsx),
[`RecentUpdatesList.tsx`](frontend/src/features/home/RecentUpdatesList.tsx).

| Element | Tokens / values |
|---|---|
| Section View All (`.home__view-all`) | `--color-accent-bright`, `--font-size-sm`, semibold; matches deck rails |
| Tile (`.home__news-item`) | `--color-bg-panel` fill, `--color-border` border, `--radius-lg`, `134px` height on desktop rail |
| Open tile (`.home__news-item--open`) | `flex-grow: 2.4` (horizontal expand on desktop rail) |
| Thumbnail (`.home__news-thumb`) | `72×72px`, `--radius-md`, `object-position: center 22%` |
| Skybound launch thumbnail (`.home__news-thumb-image--skybound-launch`) | Invincible #003 art centered near the upper action pose with a `1.78×` crop, keeping the printed yellow name rail, card frame, and rules text outside the thumbnail |
| Skybound alternate-art reveal thumbnail (`.home__news-thumb-image--skybound-alt-art`) | Omni-Man #420 enlarged to `1.15×`, anchored at left center with matching `object-position` and `transform-origin` |
| Type badge (`.home__news-tag`) | `10px` bold caps; default accent soft; `.home__news-tag--feature` uses `--color-info` |
| Summary clamped (`.home__news-summary--clamped`) | `-webkit-line-clamp: 2` |
| Summary expanded (`.home__news-summary--expanded`) | `-webkit-line-clamp: 6` |
| Date (`.home__news-date`) | `--font-size-xs`, `--color-text-dim`; displays `updatedAt` |
| Stacked list (`.recent-updates-list--stacked`) | Full-width column, `height: auto`, vertical expand — used on `/home/updates` and mobile home rail |
| Updates page shell (`.home-updates__inner`) | `--content-max-width`, `--space-6` padding; pagination in `.home-updates__pagination` with `--space-4` top margin |

**Home rail:** shows 3 newest tiles; View All appears when total count exceeds 3.
**Updates page:** 10 tiles per page via shared `Pagination`; no global nav entry.

## Home — Regionals stats rail (Preview Data Tiles)

The newest tournament is featured on `/home` as a horizontal **rail** containing the event placard
plus all nine statistical infographic tiles from the full dashboard. **View All** opens
`/home/regionals?event=...`, a reusable **12-column dashboard** with a Tournament selector. The selector
is newest-first and keeps prior events available; the legacy Columbus URL redirects to its selected view.
Shell uses **shadcn/ui `Card`** via [`DashboardTile`](frontend/src/components/dashboard/DashboardTile.tsx) with **`.deck-tile` outer parity** (`--color-bg-panel`, `1px solid var(--color-border)`, `--radius-lg`, no default shadow). See
[`SHADCN_UI.md`](docs/current/SHADCN_UI.md), [`DashboardGrid.md`](frontend/src/components/dashboard/DashboardGrid.md),
and [`TournamentCharts.md`](frontend/src/components/TournamentCharts/TournamentCharts.md).

Components: [`TournamentStatsRail.tsx`](frontend/src/features/home/TournamentStatsRail.tsx),
[`TournamentCharts/`](frontend/src/components/TournamentCharts/), [`dashboard/`](frontend/src/components/dashboard/).

### Sizing contract

| Surface | Layout | Tile shell |
|---|---|---|
| Home rail | `DashboardRail` — `clamp(230px, 25%, 280px)` columns (deck-tile parity) | `DashboardTile` variant **`rail`**: art `aspect-ratio: 380/280`; body `min-height: 4.875rem` |
| View All dashboard | Shared regional dashboard — **12 columns** desktop with column stacks (`flex-col`) so tiles pack vertically without shared row-track dead space; current layout implementation remains in [`columbusDashboardLayout.ts`](frontend/src/lib/tournaments/columbusDashboardLayout.ts) | Variants `sm`–`wide`: fluid art `min-height` (280–480px); charts scale `maxRows` / pie radius |

### Desktop grid map (View All — 12×12 wireframe reference)

Rendered via **three column stacks** in one band (left 2-col, center 6-col, right 4-col). Tiles pack vertically within each column without shared row-track dead space. Logical wireframe positions:

| Tile ID | Label | Cols | Rows | Variant |
|---|---|---|---|---|
| `meta` | Event metadata (includes podium deck links on View All) | 1–2 | 1–4 | `sm` |
| `highestTop8Rate` | Highest Top 8 spotlight | 1–2 | 5–7 | `sm` |
| `characterAppearances` | Character Appearances | 3–8 | 1–6 | `wide` |
| `mostPlaysWithoutTop8` | Most Plays w/o Top 8 | 9–10 | 1–3 | `sm` |
| `newWinningCharacters` | New Winning Characters | 11–12 | 1–3 | `sm` |
| `top8Characters` | Top 8 Characters | 9–12 | 4–8 | `tall` |
| `topHomebases` | Top Homebases | 1–3 | 7–10 | `md` |
| `topReservists` | Top Reservists | 4–8 | 7–10 | `md` |
| `topCataclysms` | Top Cataclysms | 9–12 | 9–12 | `md` |
| `newTop8Characters` | New Top 8 Characters | 1–3 | 11–12 | `sm` |

Rows 11–12 cols 4–8 remain empty (no deck-size tile). Vertical gap between stacked tiles: **`gap-y-3`** (`12px` / `var(--space-3)`) on `.columbus-dashboard__column` (desktop and mobile); `gap-x-4` preserved between horizontal columns.

### Mobile View All tile order (`layout-mobile`, `/home/regionals`)

On mobile, `ColumbusDashboardGrid` uses `COLUMBUS_MOBILE_BANDS` — a single full-width column (no `pairFirstRow` side-by-side spotlights). Stacked tiles use **`gap-y-3`** (`12px` / `var(--space-3)`) on `.columbus-dashboard__column` so each tile is separated by a small buffer (same as desktop column stacks). Order:

1. `meta` — event placard with **podium deck link rows** in the placard footer (1st / 2nd / 3rd); badges `.tournament-podium-tile__badge`; 44px+ tap targets; navigates to `/users/{tournamentDecksUserId}/decks/{id}?readonly=true`. **Winner Name** section is omitted on View All (1st row replaces it).
2. `top8Characters`
3. `topHomebases`
4. `characterAppearances` (wide splash)
5. `topReservists`
6. `topCataclysms`
7. `highestTop8Rate`
8. `mostPlaysWithoutTop8`
9. `newWinningCharacters`
10. `newTop8Characters`

Desktop band layout is unchanged. The Home horizontal stats rail uses the complete dashboard tile order.
It shows **Winner Name** in the meta placard (no deck links, no tournament deck fetch).

**Placard footer classes:** `.preview-text-tile__footer` wraps `.tournament-podium-tile__list` inside `.tournament-placard-tile` on View All (desktop + mobile). `.preview-text-tile__content`, footer, and list all use **`width: 100%`** so percentage row widths resolve against the full placard (DashboardTile text layout uses `items-start`, which otherwise shrink-wraps the list). Podium rows use a **stair-step width** (left-aligned via `align-items: flex-start`): `--podium-row-width-1st` **calc(100% - var(--space-1))**, `--podium-row-width-2nd` **75%**, `--podium-row-width-3rd` **60%**; row buttons fill each item (`width: 100%`).

**Podium deck resolution:** the regional registry supplies podium names, optional production-stable deck
IDs, and the tournament label used for title-prefix fallback. Columbus retains its three stable IDs from
[`V309__Seed_columbus_podium_decks.sql`](migrations/V309__Seed_columbus_podium_decks.sql). Niagara has
stable links for 1st and 2nd place; its 3rd-place row remains visible and disabled until that deck is supplied.

**Tile chrome (match `DeckTile`):** `.dashboard-tile` — `background: var(--color-bg-panel)`; `border: 1px solid var(--color-border)`; `border-radius: var(--radius-lg)`; `box-shadow: none`. Art zone `.stats-chart-tile__art` uses `--color-bg-elevated` with **no** art/body divider. Body inherits panel background (same as `.deck-tile__body`).

**Home rail height:** `.home__rail--stats` uses `align-items: stretch`; `.home__rail-item--stats` is a flex column; child tiles `height: 100%` with chart body `flex: 1` and `stats-chart-tile__body--center` (`justify-content: flex-end`) so captions stay bottom-aligned when a row stretches to the tallest tile.

### Preview tile types

| Type | Component | Art zone | Body caption |
|---|---|---|---|
| Event metadata | `TournamentPlacardTile` / `PreviewTextTile` | Title hierarchy: H1 name, H2 season, then Location / Date / Players; **Winner Name** on Home rail only; View All adds podium link rows in `.preview-text-tile__footer` | Fluid `clamp()` type; unified content (no art/body split) |
| Bar chart | `StatsChartTile` + `TournamentBarChart` | Horizontal bars, `fillContainer`, max 5 rows on rail | Title + subtitle + footnote, **bottom-center** |
| Pie chart | `StatsChartTile` + `TournamentPieChart` | Donut fills art (42% outer when labeled); preview portion labels use **straight radial** leader lines to tile edge (~2.12× slice radius), `clamp()`/radius-scaled font; **2-slice pies** stagger labels top-right / bottom-left (~22° off vertical) | Title + subtitle, **bottom-center** |
| Card spotlight | `TournamentHighlightTile` | Card full-bleed (no text overlay) | Label (caps) + detail + name, **bottom-center** |
| Character newcomers | `TournamentCharacterListTile` | Home rail: one full-bleed artwork cycles on desktop hover or touch press-and-hold; View All: clickable full-roster artwork mosaic | Title + newcomer count **bottom-center** |

The newcomer tiles (`New Winning Characters` and `New Top 8 Characters`) deliberately use two
presentations. The constrained Home rail mirrors `DeckTile`: the visible character advances after a
1s desktop hover or 750ms touch hold, then every 1.5s; a quick click/tap opens the currently visible
card. The expanded Regionals dashboard replaces the cycle with an artwork mosaic: one newcomer fills
the full art width, two columns are used for 2–8 entries, and three columns are used above eight entries.
Multi-card vertical slices crop from each card's left edge and retain that anchor during hover zoom so
the character art is not clipped from the leading side. Every card remains clickable.

### Shared caption typography

| Class | Use |
|---|---|
| `.preview-tile__title` | `clamp(1rem, 9cqw, 1.35rem)`, bold |
| `.preview-tile__subtitle` | `clamp(0.75rem, 6.5cqw, 1rem)`, `--color-accent-bright` |
| `.preview-tile__detail` | Stat values, `clamp(0.875rem, 7cqw, 1.125rem)`, `--font-sans`, semibold |
| `.preview-tile__footnote` | `+N more…`, `--font-size-xs` dim |
| `.preview-tile__caption` | Body wrapper; `--center` or `--start` via `stats-chart-tile__body--*` |

### Text placard typography (`PreviewTextTile`)

| Class | Use |
|---|---|
| `.preview-text-tile__h1` | Tournament name — `clamp(1.125rem, 10cqw, 1.5rem)` |
| `.preview-text-tile__h2` | Season subtitle — `clamp(0.8125rem, 7cqw, 1.0625rem)` accent |
| `.preview-text-tile__section-label` | Field label (Location, Date, …) — uppercase dim |
| `.preview-text-tile__section-value` | Field value — `clamp(0.8125rem, 7.5cqw, 1rem)`; `--accent` for winner; `--wrap` for multi-line location |
| Section spacing | `0.5em` margin between each labeled section block |

### Chart styling

| Element | Tokens / values |
|---|---|
| Bar colors | `#00e5ff`, `#3aa0ff`, `#4bd07b`, `#f6a623`, `#b06bff`, `#ef4d5a`, `#1c7d92` |
| Axis tick labels | `#a8b8d8`; truncated single-line (no wrap) |
| Chart tooltip | `--color-bg-elevated`, `--color-border-strong`, `--shadow-panel` |
| View All dashboard | `DashboardGrid` 12-col; layout in `columbusDashboardLayout.ts` | Section icon `IconTrophy` in `.home__section-icon` |

### Admin user analytics (`/admin/user-analytics`)

- The route remains inside `AppShell`, preserving the desktop header and mobile bottom navigation, but is linked only from the ADMIN profile menu.
- The analytics panel uses the standard deep navy surfaces, cyan accent, stat-value type, rounded bordered KPI cards, and the textless Excelsior emblem.
- Desktop layout: six KPI cards in a three-column grid, then a wide rolling 12-month acquisition chart beside login-recency bars. Below 1050px KPI cards become two columns and chart sections stack; below 640px KPI cards become one column.
- A second full-width analytics band pairs two equal bordered cards: cumulative site-section API request-share bars for Home, Database, Decks, and Collection, and a 24-point Pacific-time login radar chart. The usage card must say it is request share rather than time, page views, or unique users. The radar shows all known tracked history and clearly states that the series is incomplete before telemetry began.
- The login radar is arranged as a clock: midnight starts at the top, hours progress clockwise, and major labels appear every three hours while all 24 hourly points remain plotted. Tracked history uses a single darker-blue line with a subtle translucent fill and no legend; hover details show the exact tracked count for the selected hour. Backend grouping uses the DST-aware `America/Los_Angeles` timezone.
- A strong full-width divider separates the user/account analytics from the final **Decks & collections** section. That section uses three deck-count KPI cards followed by two-up average-stat cards for deck depth and collection adoption; all cards stack on mobile.
- The deck section shows total, legal, and Limited deck counts; all-deck and legal-only averages per standard user; users with positive collection quantities; and average summed card quantities across those active collectors only.
- Acquisition bars use intelligence blue for earlier months and cyan for the rolling acquisition period. The y-axis scales to the observed maximum rounded to five, keeping low-volume months readable.
- The page displays aggregate data only. Utility USER accounts are excluded by the backend and no identifiers are exposed to the browser. Deck legality uses `decks.is_valid`; collection size sums quantities rather than unique card rows.

### Admin Biz Ops Dashboard (`/admin/biz-ops`)

- The ADMIN-only route stays inside `AppShell` and is linked from the ADMIN profile menu immediately after User Analytics. `AdminRoute` hides it from non-admin clients, while the `/api/v1/admin/biz-ops-dashboard` endpoint independently enforces authenticated ADMIN access.
- The page mirrors the AWS cost dashboard concept: deep navy background, cyan title icon, thin bordered shadcn `Card` surfaces without default shadows, three compact KPI cards, a finalized-versus-estimated cost trend, a ranked service-cost panel, and eight rolling twelve-month service-row trend cards arranged four per row on wide desktops.
- Final invoice data is cyan. The current incomplete month is always labeled estimated and uses the warning color plus a dashed trend segment. Finalized and estimated values must never be visually blended or summed twice.
- Desktop uses a wide trend panel beside the service breakdown, followed by a four-column service-trend grid. Below 1100px the main panels stack and service trends use two columns; below 760px the KPIs and service trends stack and the year-to-date card becomes a compact two-column summary.
- The monthly Recharts tooltip shows invoice status, amount, and month-over-month change. All monetary figures use two decimal places, including chart axes, KPI values, service rows, and hover details. Service bars expose keyboard- and pointer-accessible hover details with the full AWS service name, cost, and current-month share. Each service line chart tracks the dollar value of that individual invoice row across the current month and previous eleven finalized months; its pointer tooltip identifies the month and finalized-versus-estimated status. The rolling window advances with newly ingested months, and the trend cards do not display service-share percentages.
- The API response contains only chart-ready aggregates. Source record keys, hashes, email identifiers, and the raw ledger are never sent to the browser.

**Interaction:** Bar/pie segment or card click opens `CardDetailPanel`. Home rail bar charts show top 5 rows with `+N more` footnote when truncated.

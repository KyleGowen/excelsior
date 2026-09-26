# Agent orientation — `frontend/` (Excelsior v2 React SPA)

This is the **production frontend**: a React 19 + Vite 6 + TypeScript single-page app.

Read first: [`.cursorrules`](.cursorrules) (this dir), repo-root
[`STYLE_GUIDE_V2.md`](../STYLE_GUIDE_V2.md) (visual source of truth), and
[`docs/current/FRONTEND_V2.md`](../docs/current/FRONTEND_V2.md) (architecture/reference).

## Dev

- Open the app at **`http://localhost:5173`** (Vite). Requires the root `npm run dev`
  (Express API on `:8085`) running in parallel; Vite proxies `/api`, `/health`,
  `/src/resources` to it.
- `npm run build` → `dist/`, served in prod by Express ([`src/routes/spaIndexPath.ts`](../src/routes/spaIndexPath.ts)).
- `tsc -b` / `vite build` must pass before shipping (strict TS, `exactOptionalPropertyTypes`).
- `npm run storybook` opens the separate local gallery at `http://localhost:6006`; its stories directly import production components and styles. Add new global CSS imports to `src/styles/appStyles.ts`, shared by the site and Storybook. For every new React component in `src/`, add a named Storybook example under `src/stories/` in the same change, whether it is shared, feature-local, a route, layout, modal, or mobile component. If it only makes sense inside its parent or provider, add a named parent story variant that exercises it instead of exporting private internals solely for Storybook. For new pages or visual states, add or update a screen story using fictional fixtures and mocked API data. Existing stories pick up component and CSS changes automatically. Before finishing, check every newly added React component against the stories and run `npm run build:storybook`. See [`STORYBOOK.md`](STORYBOOK.md).

## Layout map

- `src/app/` — provider tree, router, `AuthProvider`/`useAuth`, `ProtectedRoute`. See
  [`src/app/.cursorrules`](src/app/.cursorrules).
- `src/components/` — reusable UI; one folder per component
  (`Component.tsx/.css/.md/index.ts`). See [`src/components/.cursorrules`](src/components/.cursorrules).
- `src/features/` — route-level pages (compose shared components). Each has a `*.md`:
  - [login](src/features/login/LoginPage.md), [home](src/features/home/HomePage.md)
    (+ [community](src/features/home/COMMUNITY_DECKS.md) / [tournament](src/features/home/TOURNAMENT_DECKS.md) rails),
    [database](src/features/database/DatabasePage.md), [collection](src/features/collection/CollectionPage.md),
    [deck-selection](src/features/deck-selection/DeckSelectionPage.md),
    [community](src/features/community/CommunityPage.md),
    [deck-editor](src/features/deck-editor/DeckEditorPage.md).
- `src/lib/` — non-UI logic:
  - `api/` — typed fetch client + endpoint modules ([`.cursorrules`](src/lib/api/.cursorrules)).
  - `layout/` — `useLayoutMode`, `useHorizontalSwipe`, card-detail history ([`.cursorrules`](src/lib/layout/.cursorrules)).
  - `decks/` — draw hand, Simulate KO, pre-placed, icon totals, import/export, validation ([`.cursorrules`](src/lib/decks/.cursorrules)).
  - `catalog/`, `collection/`, `deck-usability/`, `images/`, `icons/`, `visual/`
    ([`.cursorrules`](src/lib/visual/.cursorrules)), `auth/`, `validation/`.
- `src/styles/` — `tokens.css` (design tokens) + `global.css` (reset/base).

## Conventions (summary — full detail in the per-dir `.cursorrules`)

- Server state via **TanStack Query**; cross-cutting state via `useAuth()` / `useLayoutMode()`.
- Data calls go through the shared `lib/api` client (`/api/v1/*`, session cookies, v1 envelope
  unwrap, `ApiError`). Auth/session uses legacy `/api/auth/*`.
- Never branch on user-agent — use `useLayoutMode()` (900px) + `.layout-mobile`/`.layout-desktop`.
- Card images always via `CardImage` / `cardImages` helpers (CDN base + thumbnails).
- Feature docs: [`docs/current/DRAW_HAND_FEATURE.md`](../docs/current/DRAW_HAND_FEATURE.md),
  [`docs/current/SIMULATE_KO_FEATURE.md`](../docs/current/SIMULATE_KO_FEATURE.md).

## Tests

- Frontend-touching unit tests live in the repo-root suite under `tests/unit/` (including
  `tests/unit/frontend-v2/`). Run `npm run test:unit` from the repo root.
- Browser-verify UI changes at `:5173` per `.cursor/rules/browser-verification.mdc`
  (login as `kyle` / `test`).

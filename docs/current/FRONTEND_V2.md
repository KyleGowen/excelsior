# Frontend v2 — Architecture Reference

The **v2 frontend** is a React 19 + Vite 6 + TypeScript single-page app in
[`frontend/`](../../frontend/). It is the **only** production UI. Visual rules live in
[`STYLE_GUIDE_V2.md`](../../STYLE_GUIDE_V2.md); this doc covers architecture, data flow,
and serving.

## Stack
- **React 19** + **React Router** (`createBrowserRouter`, lazy routes).
- **Vite 6** dev server / bundler (TypeScript, hashed asset output to `dist/`).
- **TanStack Query** for all server state (caching, invalidation).
- **Tailwind CSS v4** + **shadcn/ui** (dashboard tiles, `src/components/ui/`). See [`SHADCN_UI.md`](SHADCN_UI.md).
- **Recharts** for tournament stat charts inside dashboard tiles.
- Session-cookie auth (no tokens in JS); **Firebase** only for Google sign-in popups.

## Directory map
```
frontend/src/
  app/        router.tsx, AuthProvider.tsx, ProtectedRoute.tsx
  components/ reusable UI (each: Component.tsx/.css/.md/index.ts)
  features/   route pages: login, home, database, collection,
              community, deck-selection, deck-editor
  lib/
    api/        client.ts, types.ts, auth.ts, catalog.ts, decks.ts, collection.ts
    images/     cardImages.ts (CDN + thumbnail resolution, assetUrl)
    catalog/    catalogTypeMap.ts (type vocab mapping + card helpers)
    collection/ guestCollection.ts, useCollection.ts
    layout/     LayoutModeProvider.tsx (mobile/desktop)
  lib/api/    recent-updates.ts (GET /api/v1/recent-updates)
  styles/     tokens.css, global.css
  main.tsx    provider tree + router mount
```

## Provider tree
`main.tsx` mounts: `QueryClientProvider` → `LayoutModeProvider` → `AuthProvider` →
`RouterProvider`. So every route has Query, layout mode, and auth in context.

## Routing
Defined in [`frontend/src/app/router.tsx`](../../frontend/src/app/router.tsx):
- `/login` — standalone (no shell).
- `ShelledLayout` (`ProtectedRoute` + `AppShell`) wraps:
  - `/` → redirects to `/home`
  - `/home`, `/home/updates`, `/data`, `/community`, `/users/:userId/decks`, `/users/:userId/collection`
- `/users/:userId/decks/:deckId` — Deck Editor, its **own** chrome (no AppShell) and
  **unguarded** so read-only/shared deck links work for signed-out visitors.
  **Simulate KO** (client-only character knockout simulation): see
  [`DeckEditorPage.md`](../../frontend/src/features/deck-editor/DeckEditorPage.md) and
  [`SIMULATE_KO_FEATURE.md`](SIMULATE_KO_FEATURE.md).
  **Draw Hand** (client-only random hand simulation): see
  [`DeckEditorPage.md`](../../frontend/src/features/deck-editor/DeckEditorPage.md) and
  [`DRAW_HAND_FEATURE.md`](DRAW_HAND_FEATURE.md).
- `*` → redirect to `/home`.

`ProtectedRoute` redirects unauthenticated users to `/login` and shows a loading state
while auth resolves.

## Authentication
[`AuthProvider`](../../frontend/src/app/AuthProvider.tsx) exposes
`{ user, isGuest, isLoading, login, signUp, loginAsGuest, signInWithGoogle, logout }`.

- Bootstraps by fetching app config (`GET /api/v1/config/app`, sets the CDN base) and the
  current user (`GET /api/auth/me`).
- **Response shape note (important):** `/api/auth/me` returns `{ id, name, email, role }`
  while `/api/auth/login` returns `{ userId, username, role }`. `normaliseUser` in
  [`lib/api/auth.ts`](../../frontend/src/lib/api/auth.ts) accepts **both** (`id || userId`,
  `username || name`).
- Guest sessions log in with the shared `guest`/`guest` credentials; `isGuest` is derived
  from the role.

## Data layer
All calls go through [`lib/api/client.ts`](../../frontend/src/lib/api/client.ts), which:
- always sends `credentials: 'include'`,
- unwraps the v1 envelope `{ data, meta, errors, success }` (use `raw: true` to opt out for
  legacy endpoints), and
- throws a typed `ApiError` on failure.

Data endpoints used:
- Catalog: `GET /api/v1/catalog/:slug` (including separate `locations` and `battlegrounds` catalogs; full arrays; pagination/sort/filter is **client
  side** — the catalog endpoints do not paginate).
  Linked card printings include an optional ordered `errata` array with the official plain
  text and canonical source deep link; the shared `CardDetailPanel` displays it.
- Decks: `GET/POST/PUT/DELETE /api/v1/decks*`, guest equivalents under
  `/api/v1/guest/decks*` (guest deck ids are prefixed `guest_`), `GET /api/v1/decks/community`,
  `GET /api/v1/decks/tournament`.
- Collection: `GET /api/v1/collections/me/cards`, `POST` to add, `PUT /…/:cardId` to update.

### Endpoint quirks captured in the client
- **Create deck** (`POST /api/v1/decks`) returns a **flat** deck row (`id`, `user_id`),
  whereas the list (`GET /api/v1/decks`) returns the `{ metadata, cards }` shape.
  `createDeck` normalises both to a `CreatedDeckRef { id, userId }` for navigation.
- **Collection update** (`PUT /…/:cardId`) only works for a card **already** in the
  collection (404 otherwise). `useCollection.setQuantity` therefore **POSTs** when the card
  is not yet owned and **PUTs** (incl. quantity `0` to remove) once it is.
- **Validate deck** (`POST /api/v1/decks/validate`) expects each card keyed by **`type`**
  (the server-side rules read `card.type`), unlike the deck *card mutation* endpoints which
  use `cardType`. Sending `cardType` makes the rules see `type === undefined` and 500;
  `validateDeck` sends `{ type, cardId, quantity }`.
- **`/decks/:id/full` cards** carry only `{ id, type, cardId, quantity }` — **no name/image**.
  The deck editor resolves art + names from the catalog (by deck-card `type` → catalog slug)
  so loaded decks render real card art instead of "No image" placeholders.

## Card images
[`lib/images/cardImages.ts`](../../frontend/src/lib/images/cardImages.ts) resolves all art:
- Applies the CDN base from app config (empty in local dev → served via Vite proxy /
  Express static from `src/resources`).
- Produces thumbnail URLs following the repo's `/thumb/` convention.
- `assetUrl()` resolves non-card UI assets (logo, icons) the same way.
- Components must use `CardImage` / these helpers — never hardcode paths. This keeps image
  paths working after the CDN cutover.

## Collection (guest vs user)
[`useCollection`](../../frontend/src/lib/collection/useCollection.ts) unifies both:
- **Logged-in:** server-backed via the collection API + Query cache.
- **Guest:** `localStorage` via
  [`guestCollection.ts`](../../frontend/src/lib/collection/guestCollection.ts), with a
  `guest-collection-change` event to re-render.
It exposes `quantityFor`, `setQuantity`, `totalOwned`, `uniqueCards`.

## Responsive / layout mode
[`LayoutModeProvider`](../../frontend/src/lib/layout/LayoutModeProvider.tsx) tracks the
900px breakpoint via `matchMedia`, supports a `localStorage.preferDesktopLayout` override,
and toggles `.layout-mobile` / `.layout-desktop` on `<html>`. `index.html` runs the same
logic inline pre-paint to avoid FOUC. Components read `useLayoutMode()` rather than
sniffing the user agent.

## Community decks
The Home "Community Decks" rail is backed by `GET /api/v1/decks/community`, which returns
the internal **`community_decks`** user's saved decks (`COMMUNITY_DECKS_USER_ID`, exposed as
`communityDecksUserId` in `/api/v1/config/app`), sorted by `updated_at` descending. Import
new community decks via `npm run import:community-deck` or the
`.cursor/skills/add-community-deck` skill. See
[`frontend/src/features/home/COMMUNITY_DECKS.md`](../../frontend/src/features/home/COMMUNITY_DECKS.md)
and `src/constants/communityDecksUser.ts`.

## Tournament decks
The Home "Tournament Winning Decks" rail is backed by `GET /api/v1/decks/tournament`, which
returns the internal **`tournament_decks`** user's saved decks (`TOURNAMENT_DECKS_USER_ID`,
exposed as `tournamentDecksUserId` in `/api/v1/config/app`), sorted by `updated_at`
descending. Initial seed: `npm run seed:tournament-decks` after migration V280. Import
additional decks via `npm run import:tournament-deck` or the
`.cursor/skills/add-tournament-deck` skill. See
[`frontend/src/features/home/TOURNAMENT_DECKS.md`](../../frontend/src/features/home/TOURNAMENT_DECKS.md)
and `src/constants/tournamentDecksUser.ts`.

## Preconstructed decks

The Community page's `#preconstructed` tab is backed by
`GET /api/v1/community/preconstructed-decks`. The response groups the official public Limited
decks by release set in newest-first order and preserves source-workbook order within each set.
Set headings use the canonical friendly set name rather than the stable abbreviated set code.
Skybound includes a nested **Featured Precon Upgrade Recommendations** row immediately below its
official decks, without a set divider. Its heading is two type-scale steps below the set heading;
the four linked public decks retain the same tile layout and favorite behavior, and show regular deck
metadata (selected mission set, owner name, updated date, and legality). Production uses the canonical
shared deck UUIDs, while local development uses browser-created stand-ins with matching names and
character lineups. Official preconstructed tiles support viewer favorites while intentionally hiding
the utility-account owner, updated timestamp, and Limited badge. Seed migrations register each deck in
`preconstructed_decks` so the page is not coupled to mutable card or deck IDs.

## Admin dashboards

- `/admin/user-analytics` and `/admin/biz-ops` are both wrapped in `AdminRoute` and linked only from the ADMIN profile menu.
- Client gating is presentation defense-in-depth only. Their data comes exclusively from `/api/v1/admin/user-analytics` and `/api/v1/admin/biz-ops-dashboard`, which independently require an authenticated ADMIN session.
- User Analytics includes six account KPIs, cumulative feature-area API request share for Home/Database/Decks/Collection, a clock-arranged Pacific login radar showing a subtly filled all-known-history series, acquisition and login-recency charts, and deck/collection inventory. Section usage is explicitly labeled as request share rather than time spent or unique users.
- Biz Ops renders eight individual service rows as rolling twelve-month line charts in a four-column desktop grid; chart hover details show the exact finalized invoice-row value, with the current Cost Explorer month clearly marked estimated. Each new ingested month advances the window automatically.

## Build & serving
- **Dev:** Run **both** processes — repo root `npm run dev` (Express API on **:8085**) and
  `frontend/npm run dev` (Vite on **:5173**). Browse **`http://localhost:5173`**; Vite
  proxies `/api`, `/health`, and `/src/resources` to the backend.
- **Build:** `npm run build` in `frontend/` type-checks then emits hashed assets to
  `frontend/dist/`.
- **Prod / single-port (Express):** Express serves the SPA only from **`frontend/dist/`**.
  [`src/routes/spaIndexPath.ts`](../../src/routes/spaIndexPath.ts) requires
  `frontend/dist/index.html` — if missing, app routes throw at startup (run
  `npm --prefix frontend run build` first).
  - `src/routes/static-health.routes.ts` mounts `express.static(spaDistDir())` when the
    build exists (hashed `/assets/*` before the shell).
  - `src/routes/pages.routes.ts` serves the shell via `sendAppShell()` for `/`, `/home`,
    `/login`, `/data`, `/users/:userId/decks`, `/users/:userId/collection`, and the deck
    editor route, with `no-store` HTML cache headers.
  - History-fallback `GET *` returns the same shell for non-API paths.

## QA notes
Verified end-to-end against the local backend + DB (browser automation): login (admin
`kyle`/`test`), Home (desktop + mobile bottom nav), Database + card detail/Add-to-Deck,
Deck Selection create flow, Deck Editor add-card/save/stats, and Collection add/increment/
remove. Two response-shape bugs were found and fixed (login `userId`, deck-create flat
shape, collection POST-vs-PUT) — see the "Endpoint quirks" section.

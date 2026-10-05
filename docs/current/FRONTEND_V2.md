# Frontend v2 — Architecture Reference

The **v2 frontend** is a React 19 + Vite 6 + TypeScript single-page app in
[`frontend/`](../../frontend/). It is the **only** production UI. Visual rules live in
[`STYLE_GUIDE_V2.md`](../../STYLE_GUIDE_V2.md); this doc covers architecture, data flow,
and serving.

## Stack
- **React 19** + **React Router** (`createBrowserRouter`, lazy routes).
- **Vite 6** dev server / bundler (TypeScript, hashed asset output to `dist/`).
- **Storybook** provides a separate local gallery of the same React components
  and styles at `:6006`; see [`frontend/STORYBOOK.md`](../../frontend/STORYBOOK.md).
- **TanStack Query** for all server state (caching, invalidation).
- **Tailwind CSS v4** + **shadcn/ui** (dashboard tiles, `src/components/ui/`). See [`SHADCN_UI.md`](SHADCN_UI.md).
- **Recharts** for tournament stat charts inside dashboard tiles.
- Session-cookie auth (no tokens in JS); **Firebase** only for Google sign-in popups.

## Directory map
```
frontend/src/
  app/        router.tsx, AuthProvider.tsx, ProtectedRoute.tsx
  components/ reusable UI (each: Component.tsx/.css/.md/index.ts)
  features/   route pages: home, database, collection,
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
- `/login` — compatibility redirect to `/home`; there is no separate sign-in screen.
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

`ProtectedRoute` shows a loading state while the existing or default Guest session resolves.
If session setup fails, it shows a retry action.

## Authentication
[`AuthProvider`](../../frontend/src/app/AuthProvider.tsx) exposes
`{ user, isGuest, isLoading, login, signUp, signInWithGoogle, logout, retryAuth }`.

- Bootstraps by fetching app config (`GET /api/v1/config/app`, sets the CDN base) and the
  current user (`GET /api/auth/me`). A 401 creates a Guest session before the app shell renders.
- **Response shape note (important):** `/api/auth/me` returns `{ id, name, email, role }`
  while `/api/auth/login` returns `{ userId, username, role }`. `normaliseUser` in
  [`lib/api/auth.ts`](../../frontend/src/lib/api/auth.ts) accepts **both** (`id || userId`,
  `username || name`).
- Guest sessions use the existing shared Guest account; `isGuest` is derived from the role.
  The desktop profile dropdown and mobile Profile sheet provide credential sign-in, account
  creation, and Google sign-in. Account changes preserve the current route and in-page view when
  accessible, while replacing own Decks/Collection URL ids with the new account id. Persistent
  decks remain open read-only after log out; Guest session decks return to the new account's Decks
  view because they do not transfer. Admin views return to Home after access is lost. Google
  redirect sign-in restores the saved route after returning to the app. Log out establishes a new
  Guest session. The Supporter page asks Guests to sign in through Profile while keeping their
  selected contribution amount.

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
  `GET /api/v1/decks/tournament`. Session-created Guest decks stay with the Guest session and
  are not moved into an account by credential or Google sign-in or account creation. New
  accounts still receive the existing shared `Sample:` starter deck.
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
  - During blue-green deploy, the previous build's hashed assets are copied to a
    host directory mounted read-only in the new container. Express serves these
    only when an asset is absent from the current build. Files older than 30 days
    are pruned at deploy time so tabs left open across releases can finish loading.
  - The root router error screen offers a refresh when a page bundle cannot load,
    including tabs older than the retained asset window or network failures.
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

## M5 source module boundary

Database, Deck Builder and Collection now use [the independent module source entry](../../frontend/src/modules/README.md). Existing page files adapt routes to the same controller/view implementation. `app/ExcelsiorModuleHost.tsx` supplies SPA identity, navigation, detail-history and chrome; independent modules use typed API operations and callbacks. `/module-harness.html` is a development entry outside AuthProvider/router/AppShell, not a production route or package. Global style/asset containment and packaging remain M6/M7.

M6's first local slice adds a typed `ModuleHost.overlays` root/position/modality contract. Shared SlideOutPanel portals only when explicitly configured; the ordinary Excelsior adapter omits it, retaining current placement. Configured keyboard/focus/cleanup is host-scoped. See the module guide. Global style containment, container responsiveness and remaining host configuration are not complete.

The opt-in module `layout:{mode:'container'}` port uses per-instance ResizeObserver context and local layout classes. Normal Excelsior routes omit the option and retain viewport behavior. It does not yet remove global reset/token/media-query dependencies; see the module README and M6 implementation ledger.


### Opt-in native-host appearance (M6)

Independent hosts can supply `ModuleHost.appearance` for reviewed color/typography/spacing/radius/shadow variables and local native-control color scheme. The ordinary Excelsior host omits it. Keep boundary presence stable over unsaved drafts; token changes and empty-map reset retain children, while adding/removing the boundary remounts them. Keep overlay roots inside the themed wrapper for inheritance. See [module host contract](../../frontend/src/modules/README.md#m6-third-slice-per-instance-appearance); source packaging, broad CSS containment and brand/icon/auth/action configuration remain separate open milestones.


### Optional host detail interactions (M6)

The three independent modules accept `ModuleHost.cardActions` for host-supplied detail action nodes and an explicit authentication-request callback. Presentation context contains source/catalog identity and optional deck read-only state; no transport, credential or account object is exposed. Excelsior's adapter omits this port, so existing UI/auth defaults remain. The development harness receipts do not authenticate or write data. See [module contract](../../frontend/src/modules/README.md#m6-fourth-slice-host-owned-card-detail-actions) and [future integration checklist](FRONTEND_HOST_CHECKLIST.md). Complete brand/core-icon/save-feedback/route/CSS containment remains open.

### Host-owned brand and decorative controls

`ModuleHost.icons` uses `ModuleIconOptions`/`UIIconContext` from the modules entrypoint. `ModuleHost.chrome.brand` accepts host-owned accessible content. The provider scopes icon context per instance, including React portals; ordinary hosts omit it. The shared SVG controls keep their unchanged fallback markup. Host nodes replace decoration only, preserve surrounding control labels/policies and must remain inert. Card/stat and third-party assets are not part of this port. See the module README and named Independent host brand/icon stories. Save feedback, nested host routes and broad CSS isolation remain separate M6 work.

The next M6 save-feedback slice adds optional pure host result presentation; it does not provide persistence callbacks or change authorization. Guest mutation metadata merges preserve full-read ownership fields unless explicitly replaced by server evidence. Development-only delayed/rejected modes test presentation; ordinary hosts retain current feedback. See `frontend/src/modules/saveFeedback.md`.

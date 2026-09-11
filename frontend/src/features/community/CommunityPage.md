# Community — `/community` (desktop)



Public deck discovery page. **Tabbed layout** (Moxfield-style): four pill tabs select one

collection at a time; only the active tab's deck grid is shown.



1. **Your Favorites** (`#favorites`) — logged-in users only; current user's favorites

   (`fetchFavoriteDecks`); hearts are filled and click-to-unfavorite (optimistically removes

   the tile).

2. **Community Decks** (`#community`) — `GET /api/v1/community/decks` (20 most-recent

   public/legal/non-limited). The **search bar** (`.community__search`, placeholder "Search

   decks, usernames, characters, or locations") appears in the toolbar when this tab is active; it calls

   `/community/decks?search=` and replaces the recent list with name matches across

   deck titles, owner usernames, characters (slots 1–4 + reserve), and location.

3. **Preconstructed** (`#preconstructed`) — official starter/preconstructed decks from

   `GET /api/v1/community/preconstructed-decks`, grouped into release-set rows newest first.

   The initial rows are Skybound, then Edgar Rice Burroughs and the World Legends. Set labels use
   the catalog's friendly set name in large teal type aligned to the deck-row edge with a half-line
   buffer below it, and subsequent rows have a

   horizontal separator. Its four-tile grid is 85% of the content width and centered. Tiles retain

   favorite hearts but omit owner, updated date, and Limited.

   Skybound has a second four-tile row titled **Featured Precon Upgrade Recommendations** directly

   below the official decks. It remains inside the Skybound section with no divider, uses a heading

   two type-scale steps smaller than the set label, preserves its curated order, and retains the

   same favorite interaction. Unlike the official preconstructed row, featured recommendations use

   regular deck metadata: selected mission set, owner name, updated date, and legality.

4. **Tournament Winning Decks** (`#tournament`) — `tournament_decks` account

   (`fetchTournamentDecks`).



Home "View All" links deep-link to `/community#tournament` and `/community#community`; the

hash selects the matching tab on arrival.



## Tiles

`CommunityDeckGrid` renders `DeckTile variant="full"` with max-stat icons (`deckMaxStats`)

and the owner's resolved display name (`ownerDisplayName`). Clicking the owner name routes

to `/users/:ownerId/decks` (read-only public profile). Favorite hearts are hidden for the

deck owner and for guests.



## Favorites consistency

- Community feed items carry `isFavorited` from the server; toggling patches the feed cache.

- **Tournament** items have no server `isFavorited`, so the page derives their heart state

  from the favorites query cache (`favoriteIds`) and the tournament toggle mutates that

  cache — keeping hearts correct after a reload.

- **Preconstructed** items carry viewer-specific `isFavorited` from their dedicated endpoint;

  toggling patches the matching item inside its release-set group.



## Nav / routing

- Desktop nav entry added via `NAV_ITEMS` (`IconUsers`) in

  `components/MobileBottomNav/navConfig.tsx` (desktop-only; not in `MOBILE_NAV_ORDER`).

- Route registered in `app/router.tsx` inside `ShelledLayout` at `/community`.



See also: `API_V1.md` (§ Community, favorites, and public profiles),

`STYLE_GUIDE_V2.md` (§ Community page).

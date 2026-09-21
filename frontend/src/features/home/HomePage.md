# Home screen (`/home`)

Landing page after login. Sections, top to bottom:

1. **Hero** — "Welcome to Excelsior" over dedicated landscape character art from `src/resources/images/home/banners/`, loaded via `assetUrl()` / `srcSet`. The active Skybound Immortal banner is mirrored so the character sits on the right, away from the copy; the retained Victory Harben pair remains available for an explicit future switch. Art scales fluidly in the right two-thirds until the hero tile reaches ~2000px wide (≈ 2048px viewport); wider viewports freeze art width and grow the left panel behind copy. Run `npm run generate:home-hero` after editing or adding a non-`-2x` banner master. Banner selection remains explicit—there is no randomization or cycling yet. CTA is a compact accent-outline pill (`btn btn-ghost home__hero-cta`), not a filled primary button.
2. **Supporter invitation** — after canonical status resolves, guests and persistent non-Supporters
   see a calm strip beneath the hero with **Keep Excelsior free. Support what comes next.**, the
   `$3+`/equal-benefits/cancel-anytime summary, and **Become a Supporter**. It remains expanded and
   links directly to the full `/supporter` page. It is hidden for Supporters and admins. Production
   also hides it while new checkout is disabled; local development keeps it visible for UI preview.
3. **Recent Updates** — news cards from
   `GET /api/v1/recent-updates` (`useRecentUpdates`; rows in `recent_updates` table).
   Shows the **3 newest** tiles (`HOME_RECENT_UPDATES_LIMIT`). When more than 3 exist,
   a **View All** link in the section header navigates to [`/home/updates`](./HomeUpdatesPage.md).
   The preconstructed-decks announcement uses a tightly cropped Skybound Training Any Power artwork
   thumbnail and credits Andrew Taylor for the featured Skybound precon upgrade recommendations.
   The Skybound alternate-art reveal is a distinct `new_cards` announcement using collector
   `#420` Omni-Man and directs users to turn off **Hide Alts** in Skybound Characters.
   The Niagara Regional announcement uses the default Sherlock Holmes character card thumbnail.
   The card-errata feature announcement uses the G.D.A. Any Character Damien Darkblood
   special (`sky/specials/374_damien_darkblood.png`) and explains the card-scoped ruling
   text plus canonical LRG source link. Its thumbnail uses a dedicated zoomed crop centered
   on Damien so the card's yellow frame stays outside the tile image.
   Tiles use shared `RecentUpdateTile` / `RecentUpdatesList` (`layout="rail"`). The cards
   form a single-open accordion: every card is a button (`aria-expanded`). On desktop the
   cards have a fixed height, so clicking a card expands it **horizontally only** (the flex
   tile grows, siblings shrink) to reveal its full title and summary — no card ever changes
   height. Opening a card collapses any previously open one. On mobile the row stacks into
   a full-width column and expansion is vertical instead. No modal or navigation from the tile.
4. **Seattle Weekend** stats rail — one horizontally scrolling rail with a single combined set of
   Regional + NAOL statistical tiles. The compact metadata placard switches between Regional and
   NAOL winner summaries; the two static JSON event datasets remain separate underneath the
   presentation. NAOL battleground and cataclysm values are excluded because their source coverage
   is unreliable, and the combined captions state the reliable denominator. **View All** →
   `/home/regionals?event=s1-seattle-weekend`. Its **Event recap** tab shows the combined masonry
   collage and separate Regional / NAOL deck lists. Its peer **Season 1 totals** tab contains the
   ongoing sortable character-performance tally.
5. **Community Decks** rail — horizontally scrolling `DeckTile`s backed by
   `GET /api/v1/community/decks` (user-shared public legal decks; first 12 from
   the feed). Same data as the Community page Community tab — see
   [`COMMUNITY_DECKS.md`](./COMMUNITY_DECKS.md). Tiles show the owner's display
   name in the footer lower-left (click → `/users/:userId/decks`); tile body
   click opens the deck readonly in the editor.
6. **Tournament Winning Decks** rail — horizontally scrolling `DeckTile`s backed by
   `GET /api/v1/decks/tournament` (the `tournament_decks` account's decks only; see
   [`TOURNAMENT_DECKS.md`](./TOURNAMENT_DECKS.md)).
7. **Preconstructed Decks** rail — the official decks from
   `GET /api/v1/community/preconstructed-decks`, flattened in the endpoint's newest-first
   release-set order (Skybound before Edgar Rice Burroughs and the World Legends). Featured
   upgrade recommendations are intentionally excluded. **View All** →
   `/community#preconstructed`. Tiles omit owner, updated date, and Limited badges, matching
   the official preconstructed tiles on Community.

## Data
- TanStack Query for recent updates (`useRecentUpdates`), community feed (`fetchCommunityFeed`,
  key `['decks', 'community-feed', '']`), tournament decks (`fetchTournamentDecks`), and
  preconstructed groups (`fetchPreconstructedDecks`, key `['decks', 'preconstructed']`).
- Tournament stats: static JSON registry + `useAllCatalogCards()` for card slideout resolution.
- Deck tiles use `compact` variant in the rail.

## Regenerating tournament stats
The committed datasets cover Columbus, Niagara, Seattle Regional, Seattle NAOL, and the Season One
character-performance summary. The builder reads the event blocks in `2026 Decks` from the default
Desktop workbook `OP Modern 2026 Results.xlsx`. When the legacy regional workbook is available, its
Season Zero sheets supply the historical comparison baseline:

```bash
npm run build:regional-stats
```

Use `--skip-validation` to skip DB catalog checks. Pass a custom workbook path as the first argument.

## Notes
- Responsive: hero and rails stack into a single column under `.layout-mobile`.

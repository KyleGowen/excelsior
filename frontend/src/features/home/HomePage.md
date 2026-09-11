# Home screen (`/home`)

Landing page after login. Sections, top to bottom:

1. **Hero** — "Welcome to Excelsior" over dedicated landscape character art from `src/resources/images/home/banners/`, loaded via `assetUrl()` / `srcSet`. The active Skybound Immortal banner is mirrored so the character sits on the right, away from the copy; the retained Victory Harben pair remains available for an explicit future switch. Art scales fluidly in the right two-thirds until the hero tile reaches ~2000px wide (≈ 2048px viewport); wider viewports freeze art width and grow the left panel behind copy. Run `npm run generate:home-hero` after editing or adding a non-`-2x` banner master. Banner selection remains explicit—there is no randomization or cycling yet. CTA is a compact accent-outline pill (`btn btn-ghost home__hero-cta`), not a filled primary button.
2. **Recent Updates** — news cards from
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
3. **Niagara Regional** stats rail — horizontally scrolling **preview data tiles**: the event
   placard followed by all nine statistical infographics from the full Regionals dashboard
   ([`TournamentCharts.md`](../../components/TournamentCharts/TournamentCharts.md)). Data comes
   from static JSON (`frontend/src/data/tournaments/s1-niagara.json`). Bar/pie/card spotlight
   tiles match deck-tile size. New-character lists use the deck-preview cycling interaction on the
   rail (desktop hover or touch hold); quick click/tap opens the visible card. **View All** →
   `/home/regionals?event=s1-niagara` (destination scrolls to top on entry). The Regionals page
   selector retains Columbus and is the archive entry point for future tournaments.
4. **Community Decks** rail — horizontally scrolling `DeckTile`s backed by
   `GET /api/v1/community/decks` (user-shared public legal decks; first 12 from
   the feed). Same data as the Community page Community tab — see
   [`COMMUNITY_DECKS.md`](./COMMUNITY_DECKS.md). Tiles show the owner's display
   name in the footer lower-left (click → `/users/:userId/decks`); tile body
   click opens the deck readonly in the editor.
5. **Tournament Winning Decks** rail — horizontally scrolling `DeckTile`s backed by
   `GET /api/v1/decks/tournament` (the `tournament_decks` account's decks only; see
   [`TOURNAMENT_DECKS.md`](./TOURNAMENT_DECKS.md)).

## Data
- TanStack Query for recent updates (`useRecentUpdates`), community feed (`fetchCommunityFeed`,
  key `['decks', 'community-feed', '']`), and tournament decks (`fetchTournamentDecks`).
- Regional stats: static JSON registry + `useAllCatalogCards()` for card slideout resolution.
- Deck tiles use `compact` variant in the rail.

## Regenerating regional stats
The committed datasets are `s1-columbus.json` and `s1-niagara.json`. The legacy Columbus workbook
builder remains available from repo root (Excel default path: Desktop
`OverPower Regionals Character Lists.xlsx`):

```bash
npm run build:regional-stats
```

Use `--skip-validation` to skip DB catalog checks. Pass a custom workbook path as the first argument.

## Notes
- Responsive: hero and rails stack into a single column under `.layout-mobile`.

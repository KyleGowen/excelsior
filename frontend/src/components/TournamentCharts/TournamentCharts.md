# TournamentCharts — Preview Data Tiles

Reusable tiles for tournament metagame stats. **Home rail** uses `DashboardTile` variant `rail`
(deck-tile dimensions: 380×280 art + compact body). **View All** (`/home/regionals`) uses
larger dashboard variants on a 12-column grid — see [`DashboardGrid.md`](../dashboard/DashboardGrid.md).

Shell: shadcn **Card** via [`DashboardTile`](../dashboard/DashboardTile.tsx). Setup: [`SHADCN_UI.md`](../../../../docs/current/SHADCN_UI.md).

Visual spec: [`STYLE_GUIDE_V2.md`](../../../../STYLE_GUIDE_V2.md) § Home — Regionals stats rail.

## Shell: `StatsChartTile` → `DashboardTile`

Chart-based tiles compose `DashboardTile` (`layout="chart"`):

- `dashboard-tile__art` — chart or card visual; `rail` = `aspect-ratio: 380/280`; dashboard variants use fluid `min-height`
- `dashboard-tile__body` — shadcn `CardFooter` caption (title, detail, subtitle, footnote badge)

Props: `title`, `subtitle?`, `footnote?`, `detail?`, `captionAlign?`, `variant?` (`rail` | `sm` | `md` | `lg` | `wide` | `tall`).

## Text tile: `PreviewTextTile`

Generic text-only preview tile (no chart art zone). Single content column with title hierarchy:

- `#` title (`h1`), `##` subtitle (`h2`), spacer, then labeled sections (`h3` label + value)
- Height matches deck tiles: `min-height: calc(100cqw * 280/380 + 4.875rem)`

## Tile types

| Type | Component | When to use |
|------|-----------|-------------|
| Event placard | `TournamentPlacardTile` (`TournamentSummaryTile` alias) | Tournament meta: name, season, location, date, players; winner on Home rail; View All adds podium deck links in placard footer |
| Bar chart | `StatsChartTile` + `TournamentBarChart` | Ranked counts (characters, homebases, reserves, …) |
| Pie chart | `StatsChartTile` + `TournamentPieChart` | Small categorical sets (cataclysms, ≤4 character groups) |
| Card spotlight | `TournamentHighlightTile` | Single highlighted card + stat label |
| Character newcomers | `TournamentCharacterListTile` | Artwork cycle on Home; clickable artwork mosaic on View All |

### `TournamentCharacterListTile` presentation

| Context | Preview |
|---------|---------|
| Empty list | Empty message in art |
| Home rail (`rail`) | One full-bleed character at a time; desktop hover or touch press-and-hold cycles through the list, matching deck-preview timing; quick click/tap opens the visible character |
| View All (`sm`/`md`/`lg`/`wide`/`tall`) | Full clickable artwork mosaic showing every newcomer at once; one newcomer fills the art width, while multi-card vertical slices crop from each card's left edge |

## Chart props (preview mode)

**`TournamentBarChart`:** pass `fillContainer`, `maxRows={5}` on rails; `compact` for smaller ticks.
Axis labels use `#a8b8d8`, truncated with ellipsis (no wrap).

**`TournamentPieChart`:** pass `fillContainer`, `showLegend={false}` on rails. Portion labels (small text + colored leader lines) render on slices by default when the legend is hidden; tooltips show full names on hover/click.

Bar and pie tooltips disable Recharts position animation. On first hover, the tooltip must appear at the active segment instead of transitioning from the chart origin; subsequent pointer tracking remains immediate.

## Example (new tournament rail)

```tsx
import {
  StatsChartTile,
  TournamentBarChart,
  TournamentSummaryTile,
  TournamentCharacterListTile,
} from '../../components/TournamentCharts';

<StatsChartTile title="Top Characters" footnote="+12 more">
  <TournamentBarChart
    data={stats.topCharacters}
    limit={5}
    compact
    fillContainer
    maxRows={5}
    onSegmentClick={openEntry}
    isClickable={isClickable}
  />
</StatsChartTile>
```

## Data

Regional events are registered in `regionalTournaments.ts` and use committed static JSON in
`frontend/src/data/tournaments/`. Card slideout resolution: `resolveTournamentCard` +
`useAllCatalogCards()`.

## Files

| File | Role |
|------|------|
| `PreviewTextTile.tsx` | Generic text-only preview tile |
| `TournamentPlacardTile.tsx` | Tournament event placard (optional podium link footer on View All) |
| `StatsChartTile.tsx` | Chart shell + caption |
| `TournamentSummaryTile.tsx` | Re-export alias of `TournamentPlacardTile` |
| `TournamentHighlightTile.tsx` | Single-card spotlight |
| `TournamentPodiumDeckRows.tsx` | 1st/2nd/3rd deck link rows (placard footer) |
| `TournamentPodiumDecksTile.tsx` | Standalone podium tile (legacy export; View All uses placard footer) |
| `TournamentCharacterListTile.tsx` | Selects rail cycle or dashboard mosaic presentation |
| `TournamentCharacterRosterTile.tsx` | Clickable artwork mosaic and deck-style cycling roster |
| `TournamentBarChart.tsx` / `TournamentPieChart.tsx` | Recharts previews |
| `TournamentCharts.css` | Layout + `.preview-tile__*` tokens |
| `chartTheme.ts` | Colors and axis tick theme |

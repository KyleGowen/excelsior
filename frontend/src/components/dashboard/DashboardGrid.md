# DashboardGrid — tournament data dashboards

Reusable dashboard primitives for full tournament stat pages (Datadog-style variable tile sizes). The current tournament page uses a measured **12-column masonry** so tiles fill the earliest compatible opening without changing their individual size. Home rails use **`DashboardRail`** instead (uniform deck-tile columns).

## Components

| Export | Role |
|--------|------|
| `DashboardGrid` | Places tiles on `lg:grid-cols-12`; mobile stacks `col-span-12` |
| `ColumbusDashboardGrid` | Measures intrinsic tile heights, densely packs the desktop 12-column collage, anchors metadata upper left, and uses an explicit mobile order |
| `DashboardRail` | Horizontal scroll; `grid-auto-columns: clamp(230px, 25%, 280px)` |
| `DashboardRailItem` | Single rail slot wrapper |
| `DashboardTile` | shadcn `Card` shell + art/body zones |
| `dashboardTileVariants` | CVA size tokens (`rail`, `sm`, `md`, `lg`, `wide`, `tall`) |

## Layout config pattern

The shared tournament layout file defines stable tile widths/variants plus a preferred desktop packing order, e.g. [`columbusDashboardLayout.ts`](../../lib/tournaments/columbusDashboardLayout.ts):

```ts
export const COLUMBUS_DASHBOARD_LAYOUT = [
  { id: 'meta', colSpan: 3, rowSpan: 1, tileVariant: 'sm' },
  { id: 'characterAppearances', colSpan: 5, rowSpan: 1, tileVariant: 'wide' },
  // ...
];
```

Desktop row spans are not authored. `ColumbusDashboardGrid` calculates them from the rendered height with `ResizeObserver`, then uses `grid-auto-flow: dense`. Only `meta` has an authored visual position (`column 1 / row 1`); the remaining tiles may move to keep the collage balanced. When an event hides an unsupported category, later tiles automatically fill the opening.

Tile **content** is built in [`buildColumbusStatsTiles.tsx`](../../lib/tournaments/buildColumbusStatsTiles.tsx) via `buildColumbusTileById(id, options)`.
Multi-event posts may combine reliable counts before rendering; this does not change the masonry widths or placement contract. Their metadata slot may use an internal event switcher while remaining the anchored upper-left tile.

## Wiring a new tournament page

1. Add static stats JSON under `frontend/src/data/tournaments/`.
2. Reuse the shared tile widths/variants and tune the preferred masonry order only when the event's available tiles require it.
3. Reuse `buildColumbusStatsTiles.tsx` or generalize the tile builder with your stats shape.
4. Add route + page component; render `ColumbusDashboardGrid` so the metadata tile stays upper left and all other tiles pack densely.
5. Home rail: reuse the same tile builder with `variant: 'rail'` and wrap in `DashboardRail`.

## Tile size variants

| Variant | Home rail | Dashboard use |
|---------|-----------|---------------|
| `rail` | Yes — fixed 380×280 art + 4.875rem body | — |
| `sm` | — | Spotlights, pies, placard |
| `md` | — | Standard charts |
| `lg` / `wide` / `tall` | — | Tall bar lists, wide meta charts |

Charts read `tileVariant` for `maxRows`, pie radius, and compact ticks.

## Docs

- shadcn setup: [`docs/current/SHADCN_UI.md`](../../../../docs/current/SHADCN_UI.md)
- Visual spec: [`STYLE_GUIDE_V2.md`](../../../../STYLE_GUIDE_V2.md) § Columbus Regional
- Chart tiles: [`TournamentCharts.md`](../TournamentCharts/TournamentCharts.md)

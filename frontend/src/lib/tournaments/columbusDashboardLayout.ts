import type { DashboardTileVariant } from '../../components/dashboard/dashboardTileSizing';

function joinLayoutClasses(...parts: Array<string | undefined>): string {
  return parts.filter((part): part is string => Boolean(part)).join(' ');
}

export type ColumbusDashboardTileId =
  | 'meta'
  | 'characterAppearances'
  | 'top8Characters'
  | 'mostPlaysWithoutTop8'
  | 'highestTop8Rate'
  | 'newWinningCharacters'
  | 'newTop8Characters'
  | 'topReservists'
  | 'topHomebases'
  | 'topBattlegrounds'
  | 'topCataclysms';

export interface DashboardLayoutPlacement {
  id: ColumbusDashboardTileId;
  colSpan: number;
  rowSpan: number;
  tileVariant: DashboardTileVariant;
  /** 1-based desktop grid column start (lg breakpoint). */
  colStart?: number;
  /** 1-based desktop grid row start (lg breakpoint). */
  rowStart?: number;
  /** Render inside another tile's grid cell (desktop dashboard only). */
  stackIn?: ColumbusDashboardTileId;
  /** When stacked, place beside the anchor on the top row instead of below it. */
  stackRole?: 'topRow' | 'below';
}

export interface ColumbusDashboardBandColumn {
  colSpan: number;
  tileIds: ColumbusDashboardTileId[];
}

export interface ColumbusDashboardBand {
  columns: ColumbusDashboardBandColumn[];
}

/**
 * Desktop masonry order. The metadata tile is first and explicitly anchored
 * upper-left; remaining tiles use dense placement to occupy the earliest gap
 * that can preserve their configured width.
 */
export const COLUMBUS_DESKTOP_MASONRY_ORDER: ColumbusDashboardTileId[] = [
  'meta',
  'characterAppearances',
  'top8Characters',
  'highestTop8Rate',
  'topReservists',
  'topCataclysms',
  'topHomebases',
  'newTop8Characters',
  'topBattlegrounds',
  'mostPlaysWithoutTop8',
  'newWinningCharacters',
];

/**
 * Mobile View All — single-column stack prioritizing high-impact stats.
 * Podium deck links render inside the meta placard. Trivia spotlights appear last.
 */
export const COLUMBUS_MOBILE_BANDS: ColumbusDashboardBand[] = [
  {
    columns: [
      {
        colSpan: 12,
        tileIds: [
          'meta',
          'top8Characters',
          'topHomebases',
          'topBattlegrounds',
          'characterAppearances',
          'topReservists',
          'topCataclysms',
          'highestTop8Rate',
          'mostPlaysWithoutTop8',
          'newWinningCharacters',
          'newTop8Characters',
        ],
      },
    ],
  },
];

export function getColumbusMobileTileOrder(): ColumbusDashboardTileId[] {
  return COLUMBUS_MOBILE_BANDS.flatMap((band) => band.columns.flatMap((column) => column.tileIds));
}

/** Tile widths and variants. Masonry calculates desktop row spans from rendered height. */
export const COLUMBUS_DASHBOARD_LAYOUT: DashboardLayoutPlacement[] = [
  { id: 'meta', colSpan: 3, rowSpan: 1, tileVariant: 'sm' },
  { id: 'highestTop8Rate', colSpan: 3, rowSpan: 1, tileVariant: 'sm' },
  { id: 'characterAppearances', colSpan: 5, rowSpan: 1, tileVariant: 'wide' },
  { id: 'mostPlaysWithoutTop8', colSpan: 2, rowSpan: 1, tileVariant: 'sm' },
  { id: 'newWinningCharacters', colSpan: 2, rowSpan: 1, tileVariant: 'sm' },
  { id: 'top8Characters', colSpan: 4, rowSpan: 1, tileVariant: 'tall' },
  { id: 'topHomebases', colSpan: 3, rowSpan: 1, tileVariant: 'md' },
  { id: 'topBattlegrounds', colSpan: 3, rowSpan: 1, tileVariant: 'md' },
  { id: 'topReservists', colSpan: 5, rowSpan: 1, tileVariant: 'md' },
  { id: 'topCataclysms', colSpan: 4, rowSpan: 1, tileVariant: 'md' },
  { id: 'newTop8Characters', colSpan: 3, rowSpan: 1, tileVariant: 'sm' },
];

const COL_SPAN_CLASS: Record<number, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  9: 'lg:col-span-9',
  10: 'lg:col-span-10',
  11: 'lg:col-span-11',
  12: 'lg:col-span-12',
};

const MASONRY_COL_SPAN_CLASS: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
};

const ROW_SPAN_CLASS: Record<number, string> = {
  1: '',
  2: 'lg:row-span-2',
  3: 'lg:row-span-3',
  4: 'lg:row-span-4',
  5: 'lg:row-span-5',
  6: 'lg:row-span-6',
  7: 'lg:row-span-7',
  8: 'lg:row-span-8',
  9: 'lg:row-span-9',
  10: 'lg:row-span-10',
  11: 'lg:row-span-11',
  12: 'lg:row-span-12',
};

const ROW_START_CLASS: Record<number, string> = {
  1: 'lg:row-start-1',
  2: 'lg:row-start-2',
  3: 'lg:row-start-3',
  4: 'lg:row-start-4',
  5: 'lg:row-start-5',
  6: 'lg:row-start-6',
  7: 'lg:row-start-7',
  8: 'lg:row-start-8',
  9: 'lg:row-start-9',
  10: 'lg:row-start-10',
  11: 'lg:row-start-11',
  12: 'lg:row-start-12',
  13: 'lg:row-start-13',
  14: 'lg:row-start-14',
  15: 'lg:row-start-15',
  16: 'lg:row-start-16',
};

const COL_START_CLASS: Record<number, string> = {
  1: 'lg:col-start-1',
  2: 'lg:col-start-2',
  3: 'lg:col-start-3',
  4: 'lg:col-start-4',
  5: 'lg:col-start-5',
  6: 'lg:col-start-6',
  7: 'lg:col-start-7',
  8: 'lg:col-start-8',
  9: 'lg:col-start-9',
  10: 'lg:col-start-10',
  11: 'lg:col-start-11',
  12: 'lg:col-start-12',
};

export function columbusMasonryColumnSpanClass(colSpan: number): string {
  return MASONRY_COL_SPAN_CLASS[colSpan] ?? 'col-span-12';
}

export function dashboardPlacementClass(
  colSpan: number,
  rowSpan: number,
  placement?: Pick<DashboardLayoutPlacement, 'colStart' | 'rowStart'>,
): string {
  return joinLayoutClasses(
    'col-span-12',
    COL_SPAN_CLASS[colSpan] ?? 'lg:col-span-12',
    ROW_SPAN_CLASS[rowSpan] ?? '',
    placement?.colStart !== undefined ? COL_START_CLASS[placement.colStart] : undefined,
    placement?.rowStart !== undefined ? ROW_START_CLASS[placement.rowStart] : undefined,
  );
}

export function getPlacementForTile(id: ColumbusDashboardTileId): DashboardLayoutPlacement {
  const placement = COLUMBUS_DASHBOARD_LAYOUT.find((p) => p.id === id);
  if (!placement) {
    throw new Error(`Unknown dashboard tile id: ${id}`);
  }
  return placement;
}

export const COLUMBUS_TILE_ORDER: ColumbusDashboardTileId[] = COLUMBUS_DASHBOARD_LAYOUT.map((p) => p.id);

export function getColumbusDashboardGridPlacements(): DashboardLayoutPlacement[] {
  return COLUMBUS_DASHBOARD_LAYOUT.filter((placement) => !placement.stackIn);
}

export function getStackedPlacements(
  parentId: ColumbusDashboardTileId,
): DashboardLayoutPlacement[] {
  return COLUMBUS_DASHBOARD_LAYOUT.filter((placement) => placement.stackIn === parentId);
}

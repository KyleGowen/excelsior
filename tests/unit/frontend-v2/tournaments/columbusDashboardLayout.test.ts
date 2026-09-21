import fs from 'fs';
import path from 'path';
import {
  COLUMBUS_DASHBOARD_LAYOUT,
  COLUMBUS_DESKTOP_MASONRY_ORDER,
  COLUMBUS_TILE_ORDER,
  columbusMasonryColumnSpanClass,
  dashboardPlacementClass,
  getColumbusDashboardGridPlacements,
  getColumbusMobileTileOrder,
  getPlacementForTile,
  getStackedPlacements,
} from '../../../../frontend/src/lib/tournaments/columbusDashboardLayout';

const repoRoot = path.join(__dirname, '../../../..');
const dashboardGrid = fs.readFileSync(
  path.join(repoRoot, 'frontend/src/components/dashboard/ColumbusDashboardGrid.tsx'),
  'utf8',
);

describe('columbusDashboardLayout', () => {
  it('defines 11 layout placements and 11 home-rail tiles', () => {
    expect(COLUMBUS_TILE_ORDER).toHaveLength(11);
    expect(COLUMBUS_DASHBOARD_LAYOUT).toHaveLength(11);
    expect(new Set(COLUMBUS_TILE_ORDER).size).toBe(11);
  });

  it('uses every tile once in desktop masonry and keeps metadata first', () => {
    expect(COLUMBUS_DESKTOP_MASONRY_ORDER).toHaveLength(11);
    expect(new Set(COLUMBUS_DESKTOP_MASONRY_ORDER).size).toBe(11);
    expect(new Set(COLUMBUS_DESKTOP_MASONRY_ORDER)).toEqual(new Set(COLUMBUS_TILE_ORDER));
    expect(COLUMBUS_DESKTOP_MASONRY_ORDER[0]).toBe('meta');
  });

  it('preserves the established desktop tile widths and variants', () => {
    expect(getPlacementForTile('meta')).toMatchObject({ colSpan: 3, tileVariant: 'sm' });
    expect(getPlacementForTile('characterAppearances')).toMatchObject({ colSpan: 5, tileVariant: 'wide' });
    expect(getPlacementForTile('top8Characters')).toMatchObject({ colSpan: 4, tileVariant: 'tall' });
    expect(getPlacementForTile('highestTop8Rate')).toMatchObject({ colSpan: 3, tileVariant: 'sm' });
    expect(getPlacementForTile('topReservists')).toMatchObject({ colSpan: 5, tileVariant: 'md' });
    expect(getPlacementForTile('topCataclysms')).toMatchObject({ colSpan: 4, tileVariant: 'md' });
    expect(getPlacementForTile('newTop8Characters')).toMatchObject({ colSpan: 3, tileVariant: 'sm' });
    expect(getPlacementForTile('mostPlaysWithoutTop8')).toMatchObject({ colSpan: 2, tileVariant: 'sm' });
    expect(getPlacementForTile('newWinningCharacters')).toMatchObject({ colSpan: 2, tileVariant: 'sm' });
  });

  it('leaves desktop positions fluid instead of assigning fixed rows and columns', () => {
    for (const placement of COLUMBUS_DASHBOARD_LAYOUT) {
      expect(placement.colStart).toBeUndefined();
      expect(placement.rowStart).toBeUndefined();
      expect(placement.stackIn).toBeUndefined();
      expect(placement.stackRole).toBeUndefined();
      expect(placement.rowSpan).toBe(1);
    }
    expect(getColumbusDashboardGridPlacements()).toHaveLength(11);
    expect(getStackedPlacements('meta')).toHaveLength(0);
  });

  it('measures dense rows and pins the metadata tile upper left', () => {
    expect(dashboardGrid).toContain("gridAutoFlow: 'dense'");
    expect(dashboardGrid).toContain("gridAutoRows: `${MASONRY_ROW_HEIGHT_PX}px`");
    expect(dashboardGrid).toContain('gridColumnStart: 1, gridRowStart: 1');
    expect(dashboardGrid).toContain('new ResizeObserver(scheduleMeasure)');
    expect(dashboardGrid).toContain('data-dashboard-masonry-item={id}');
  });

  it('keeps the deliberate mobile order in one full-width stack', () => {
    const mobileOrder = getColumbusMobileTileOrder();
    expect(mobileOrder).toHaveLength(11);
    expect(mobileOrder[0]).toBe('meta');
    expect(mobileOrder[1]).toBe('top8Characters');
    expect(mobileOrder[2]).toBe('topHomebases');
    expect(mobileOrder[3]).toBe('topBattlegrounds');
    expect(mobileOrder[4]).toBe('characterAppearances');
    expect(mobileOrder.slice(-4)).toEqual([
      'highestTop8Rate',
      'mostPlaysWithoutTop8',
      'newWinningCharacters',
      'newTop8Characters',
    ]);
  });

  it('provides fixed desktop width classes and full-width responsive fallbacks', () => {
    expect(columbusMasonryColumnSpanClass(3)).toBe('col-span-3');
    expect(columbusMasonryColumnSpanClass(5)).toBe('col-span-5');
    expect(dashboardPlacementClass(3, 1)).toContain('col-span-12');
  });
});

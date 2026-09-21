import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useLayoutMode } from '../../lib/layout/LayoutModeProvider';
import {
  COLUMBUS_DESKTOP_MASONRY_ORDER,
  columbusMasonryColumnSpanClass,
  getColumbusMobileTileOrder,
  getPlacementForTile,
  type ColumbusDashboardTileId,
} from '@/lib/tournaments/columbusDashboardLayout';

const MASONRY_ROW_HEIGHT_PX = 8;
const MASONRY_ROW_GAP_PX = 12;

const INITIAL_ROW_SPAN_BY_VARIANT = {
  sm: 19,
  md: 23,
  lg: 26,
  wide: 25,
  tall: 29,
  rail: 19,
} as const;

interface ColumbusDashboardGridProps {
  renderTile: (id: ColumbusDashboardTileId) => ReactNode;
  className?: string;
  hiddenTileIds?: ColumbusDashboardTileId[];
}

export function ColumbusDashboardGrid({
  renderTile,
  className,
  hiddenTileIds = [],
}: ColumbusDashboardGridProps) {
  const { isMobile } = useLayoutMode();
  const hiddenTiles = new Set(hiddenTileIds);
  const masonryRef = useRef<HTMLDivElement>(null);
  const mobileTileIds = getColumbusMobileTileOrder().filter((id) => !hiddenTiles.has(id));
  const desktopTileIds = COLUMBUS_DESKTOP_MASONRY_ORDER.filter((id) => !hiddenTiles.has(id));

  useEffect(() => {
    if (isMobile) return undefined;
    const grid = masonryRef.current;
    if (!grid || typeof ResizeObserver === 'undefined') return undefined;

    let animationFrame = 0;
    const measure = () => {
      animationFrame = 0;
      const styles = window.getComputedStyle(grid);
      const rowHeight = Number.parseFloat(styles.gridAutoRows) || MASONRY_ROW_HEIGHT_PX;
      const rowGap = Number.parseFloat(styles.rowGap) || MASONRY_ROW_GAP_PX;

      grid.querySelectorAll<HTMLElement>('[data-dashboard-masonry-item]').forEach((item) => {
        const tile = item.firstElementChild as HTMLElement | null;
        if (!tile) return;
        const tileHeight = Math.max(tile.scrollHeight, tile.getBoundingClientRect().height);
        const rowSpan = Math.max(1, Math.ceil((tileHeight + rowGap) / (rowHeight + rowGap)));
        const nextValue = `span ${rowSpan}`;
        if (item.style.gridRowEnd !== nextValue) item.style.gridRowEnd = nextValue;
      });
    };
    const scheduleMeasure = () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(measure);
    };
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(grid);
    grid.querySelectorAll<HTMLElement>('[data-dashboard-masonry-item]').forEach((item) => {
      const tile = item.firstElementChild;
      if (tile) resizeObserver.observe(tile);
    });
    scheduleMeasure();

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [desktopTileIds.join('|'), isMobile]);

  if (isMobile) {
    return (
      <div className={cn('columbus-dashboard flex flex-col gap-y-3', className)}>
        {mobileTileIds.map((id) => (
          <div key={id} className="min-h-0">
            {renderTile(id)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={masonryRef}
      className={cn(
        'columbus-dashboard columbus-dashboard__masonry grid grid-cols-12 items-start gap-x-4 gap-y-3',
        className,
      )}
      style={{
        gridAutoFlow: 'dense',
        gridAutoRows: `${MASONRY_ROW_HEIGHT_PX}px`,
      }}
    >
      {desktopTileIds.map((id) => {
        const placement = getPlacementForTile(id);
        const initialRowSpan = INITIAL_ROW_SPAN_BY_VARIANT[placement.tileVariant];
        const itemStyle: CSSProperties = {
          gridRowEnd: `span ${initialRowSpan}`,
          ...(id === 'meta' ? { gridColumnStart: 1, gridRowStart: 1 } : {}),
        };

        return (
          <div
            key={id}
            className={cn(
              'columbus-dashboard__masonry-item min-h-0',
              columbusMasonryColumnSpanClass(placement.colSpan),
            )}
            data-dashboard-masonry-item={id}
            style={itemStyle}
          >
            {renderTile(id)}
          </div>
        );
      })}
    </div>
  );
}

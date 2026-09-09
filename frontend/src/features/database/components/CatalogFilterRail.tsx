import { useEffect, useId, type ReactNode } from 'react';
import { IconChevronDown } from '../../../components/icons';
import { useLayoutMode } from '../../../lib/layout/LayoutModeProvider';

interface CatalogFilterRailProps {
  ariaLabel: string;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  controls: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

/**
 * Shared responsive shell for catalog filters.
 *
 * Mobile keeps the complete filter row horizontally scrollable while collapsed,
 * then presents the same controls in a wrapping overlay when expanded. Desktop
 * callers retain the compact inline/collapsed-rule treatment.
 */
export function CatalogFilterRail({
  ariaLabel,
  collapsed,
  onCollapsedChange,
  controls,
  trailing,
  className = '',
}: CatalogFilterRailProps) {
  const { isMobile } = useLayoutMode();
  const bodyId = useId();
  const showBody = isMobile || !collapsed;
  const showDesktopCollapsedRule = !isMobile && collapsed;

  useEffect(() => {
    if (!isMobile || collapsed) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCollapsedChange(true);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [collapsed, isMobile, onCollapsedChange]);

  return (
    <div
      className={`dbv-filter-rail${collapsed ? ' is-collapsed' : ''}${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={`dbv-filter-rail__toggle${showDesktopCollapsedRule ? ' dbv-filter-rail__toggle--collapsed-row' : ''}`}
        aria-expanded={!collapsed}
        aria-controls={showBody ? bodyId : undefined}
        aria-label={collapsed ? 'Expand filters' : 'Collapse filters'}
        onClick={() => onCollapsedChange(!collapsed)}
      >
        <span className="dbv-filter-rail__toggle-icon-wrap">
          <IconChevronDown
            className={`dbv-filter-rail__toggle-icon${collapsed ? '' : ' is-expanded'}`}
            aria-hidden
          />
        </span>
        {showDesktopCollapsedRule ? (
          <span className="dbv-filter-rail__toggle-line" aria-hidden="true" />
        ) : null}
      </button>

      {showBody ? (
        <div id={bodyId} className="dbv-filter-rail__body">
          <div className="dbv-filter-rail__scroll">
            <div className="dbv-filter-rail__controls">{controls}</div>
            {trailing ? <div className="dbv-filter-rail__trailing">{trailing}</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

import { useImageAssets } from '../../../lib/images/useImageAssets';
import { FUNCTION_ICON_DEFS } from '../filters/dbvFilterTypes';
import type { UseDbvFiltersReturn } from '../filters/useDbvFilters';

interface DbvFunctionIconStripProps {
  filters: UseDbvFiltersReturn;
  ariaLabel?: string;
}

export function DbvFunctionIconStrip({
  filters,
  ariaLabel = 'Filter by function icon',
}: DbvFunctionIconStripProps) {
  const { assetUrl } = useImageAssets();
  return (
    <div className="dbv-func-strip" role="group" aria-label={ariaLabel}>
      {FUNCTION_ICON_DEFS.map((def) => {
        const isActive = filters.state.functionIcons.includes(def.field);
        return (
          <button
            key={def.field}
            type="button"
            className={`dbv-func-strip__btn ${isActive ? 'is-active' : ''}`}
            aria-pressed={isActive}
            title={def.label}
            onClick={() => filters.toggleFunctionIcon(def.field)}
          >
            <img src={assetUrl(def.img)} alt="" />
            <span className="sr-only">{def.label}</span>
          </button>
        );
      })}
    </div>
  );
}

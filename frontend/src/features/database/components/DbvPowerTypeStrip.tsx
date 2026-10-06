import { moduleAssets } from '../../../modules/assetRegistry';
import { useImageAssets } from '../../../lib/images/useImageAssets';
import type { UseDbvFiltersReturn } from '../filters/useDbvFilters';

const POWER_TYPE_IMG: Record<string, string> = {
  Energy: moduleAssets['energy'],
  Combat: moduleAssets['combat'],
  'Brute Force': moduleAssets['brute_force'],
  Intelligence: moduleAssets['intelligence'],
  'Any-Power': moduleAssets['any-power'],
};

interface DbvPowerTypeStripProps {
  powerTypeKeys: string[];
  filters: UseDbvFiltersReturn;
  ariaLabel?: string;
}

export function DbvPowerTypeStrip({
  powerTypeKeys,
  filters,
  ariaLabel = 'Filter by power type',
}: DbvPowerTypeStripProps) {
  const { assetUrl } = useImageAssets();
  return (
    <div className="dbv-power-strip" role="group" aria-label={ariaLabel}>
      {powerTypeKeys.map((pt) => {
        const isActive = filters.state.powerTypes.includes(pt);
        const isMp = pt === 'Multi-Power';
        const img = POWER_TYPE_IMG[pt];
        return (
          <button
            key={pt}
            type="button"
            className={`dbv-power-strip__btn ${isActive ? 'is-active' : ''}`}
            aria-pressed={isActive}
            title={pt}
            onClick={() => filters.togglePowerType(pt)}
          >
            {isMp ? (
              <span className="dbv-power-strip__mp">MP</span>
            ) : img ? (
              <img src={assetUrl(img)} alt="" />
            ) : (
              <span>{pt}</span>
            )}
            <span className="sr-only">{pt}</span>
          </button>
        );
      })}
    </div>
  );
}

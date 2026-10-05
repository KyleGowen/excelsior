import { assetUrl } from '../../lib/images/cardImages';
import {
  STAT_ICON_PATHS,
  buildStatIconBadgeLabel,
  type StatIconType,
} from '../../lib/icons/statIconTypes';

export { buildStatIconBadgeLabel } from '../../lib/icons/statIconTypes';

export interface StatIconBadgeProps {
  type: StatIconType;
  value: number | string;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  className?: string;
}

const BADGE_PX: Record<NonNullable<StatIconBadgeProps['size']>, number> = {
  sm: 18,
  md: 32,
  lg: 40,
};

export function StatIconBadge({
  type,
  value,
  size = 'md',
  title,
  className,
}: StatIconBadgeProps) {
  const displayValue = String(value);
  const defaultLabel = buildStatIconBadgeLabel(type, value);
  const ariaLabel = title ?? defaultLabel;
  const tooltip = title ?? defaultLabel;
  const isWide = displayValue.length >= 2;

  return (
    <span
      className={['stat-icon-badge', `stat-icon-badge--${size}`, className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
      title={tooltip}
    >
      <img
        src={assetUrl(STAT_ICON_PATHS[type])}
        alt=""
        className="stat-icon-badge__icon"
        width={BADGE_PX[size]}
        height={BADGE_PX[size]}
      />
      <span
        className={[
          'stat-icon-badge__value',
          isWide ? 'stat-icon-badge__value--wide' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden="true"
      >
        {displayValue}
      </span>
    </span>
  );
}

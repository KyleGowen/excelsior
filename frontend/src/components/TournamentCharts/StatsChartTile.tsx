import type { ReactNode } from 'react';
import { DashboardTile, type DashboardTileVariant } from '../dashboard';

interface StatsChartTileProps {
  title: string;
  eventSubtitle?: string;
  subtitle?: string;
  footnote?: string;
  detail?: string;
  children: ReactNode;
  className?: string;
  captionAlign?: 'center' | 'start';
  variant?: DashboardTileVariant;
}

export function StatsChartTile({
  title,
  eventSubtitle,
  subtitle,
  footnote,
  detail,
  children,
  className = '',
  captionAlign = 'center',
  variant = 'rail',
}: StatsChartTileProps) {
  return (
    <DashboardTile
      variant={variant}
      layout="chart"
      title={title}
      eventSubtitle={eventSubtitle}
      subtitle={subtitle}
      footnote={footnote}
      detail={detail}
      captionAlign={captionAlign}
      className={`stats-chart-tile ${className}`.trim()}
    >
      {children}
    </DashboardTile>
  );
}

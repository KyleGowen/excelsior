import type { ReactNode } from 'react';
import { Card, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import './DashboardTile.css';
import {
  dashboardArtVariants,
  dashboardBodyVariants,
  dashboardTileVariants,
  type DashboardTileVariant,
} from './dashboardTileVariants';

export type { DashboardTileVariant };

interface DashboardTileProps {
  variant?: DashboardTileVariant;
  /** Chart tiles use art + footer; text tiles fill the card body. */
  layout?: 'chart' | 'text';
  title?: string;
  /** Optional event context shown directly below the title on combined Home rails. */
  eventSubtitle?: string;
  subtitle?: string;
  detail?: string;
  footnote?: string;
  captionAlign?: 'center' | 'start';
  /** Uppercase label style (spotlight tiles). */
  titleCaps?: boolean;
  className?: string;
  children: ReactNode;
}

export function DashboardTile({
  variant = 'rail',
  layout = 'chart',
  title,
  eventSubtitle,
  subtitle,
  detail,
  footnote,
  captionAlign = 'center',
  titleCaps = false,
  className,
  children,
}: DashboardTileProps) {
  if (layout === 'text') {
    return (
      <Card
        className={cn(dashboardTileVariants({ variant }), 'dashboard-tile shadow-none', className)}
      >
        <div
          className={cn(
            dashboardBodyVariants({ variant, align: 'start' }),
            'flex min-h-0 flex-1 flex-col',
          )}
        >
          {children}
        </div>
      </Card>
    );
  }

  const bodyAlign = captionAlign === 'start' ? 'start' : 'center';

  return (
    <Card
      className={cn(dashboardTileVariants({ variant }), 'dashboard-tile shadow-none', className)}
    >
      <div
        className={cn(
          dashboardArtVariants({ variant }),
          'dashboard-tile__art stats-chart-tile__art',
          variant === 'rail' ? 'dashboard-tile__art--rail' : 'dashboard-tile__art--fluid',
        )}
      >
        {children}
      </div>
      {(title || eventSubtitle || subtitle || detail || footnote) ? (
        <CardFooter
          className={cn(
            dashboardBodyVariants({ variant, align: bodyAlign }),
            'dashboard-tile__body stats-chart-tile__body mt-0 flex-1 border-0 p-0',
            bodyAlign === 'center'
              ? 'stats-chart-tile__body--center'
              : 'stats-chart-tile__body--start',
          )}
        >
          {title ? (
            <h3
              className={cn(
                'preview-tile__title stats-chart-tile__title w-full',
                titleCaps ? 'preview-tile__title--caps' : '',
              )}
            >
              {title}
            </h3>
          ) : null}
          {eventSubtitle ? (
            <p className="preview-tile__event-subtitle w-full">{eventSubtitle}</p>
          ) : null}
          {detail ? <p className="preview-tile__detail w-full">{detail}</p> : null}
          {subtitle ? (
            <p className="preview-tile__subtitle stats-chart-tile__subtitle w-full">{subtitle}</p>
          ) : null}
          {footnote ? (
            <Badge variant="muted" className="preview-tile__footnote mt-1 font-normal">
              {footnote}
            </Badge>
          ) : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}

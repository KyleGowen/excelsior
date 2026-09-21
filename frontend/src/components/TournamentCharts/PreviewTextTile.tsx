import type { ReactNode } from 'react';
import { DashboardTile, type DashboardTileVariant } from '../dashboard';
import './TournamentCharts.css';

export interface PreviewTextTileSection {
  label: string;
  value: string;
  variant?: 'default' | 'accent';
  /** Allow value to wrap (e.g. long location lines). */
  wrap?: boolean;
  /** Optional external destination for the complete value. */
  href?: string;
}

export interface PreviewTextTileProps {
  title: string;
  subtitle?: string;
  sections: PreviewTextTileSection[];
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  variant?: DashboardTileVariant;
}

export function PreviewTextTile({
  title,
  subtitle,
  sections,
  header,
  footer,
  className = '',
  variant = 'rail',
}: PreviewTextTileProps) {
  return (
    <DashboardTile
      variant={variant}
      layout="text"
      className={`stats-chart-tile preview-text-tile ${className}`.trim()}
    >
      <div className="preview-text-tile__content">
        {header}
        <h1 className="preview-text-tile__h1">{title}</h1>
        {subtitle ? <h2 className="preview-text-tile__h2">{subtitle}</h2> : null}
        <div className="preview-text-tile__divider" aria-hidden="true" />
        {sections.map((section, index) => (
          <div key={section.label}>
            {index > 0 ? <div className="preview-text-tile__section-divider" aria-hidden="true" /> : null}
            <div className="preview-text-tile__section">
              <h3 className="preview-text-tile__section-label">{section.label}</h3>
              <p
                className={[
                  'preview-text-tile__section-value',
                  section.variant === 'accent' ? 'preview-text-tile__section-value--accent' : '',
                  section.wrap ? 'preview-text-tile__section-value--wrap' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {section.href ? (
                  <a
                    className="preview-text-tile__section-link"
                    href={section.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {section.value}
                  </a>
                ) : section.value}
              </p>
            </div>
          </div>
        ))}
        {footer ? (
          <>
            <div className="preview-text-tile__section-divider" aria-hidden="true" />
            <div className="preview-text-tile__footer">{footer}</div>
          </>
        ) : null}
      </div>
    </DashboardTile>
  );
}

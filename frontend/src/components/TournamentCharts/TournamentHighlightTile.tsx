import { CardImage } from '../CardImage';
import type { CatalogCard, CatalogType } from '../../lib/api/types';
import { DashboardTile, type DashboardTileVariant } from '../dashboard';
import './TournamentCharts.css';

interface TournamentHighlightTileProps {
  label: string;
  eventSubtitle?: string;
  detail?: string;
  cardName: string;
  card: CatalogCard | null;
  catalogType: CatalogType;
  onClick?: () => void;
  variant?: DashboardTileVariant;
}

export function TournamentHighlightTile({
  label,
  eventSubtitle,
  detail,
  cardName,
  card,
  catalogType,
  onClick,
  variant = 'rail',
}: TournamentHighlightTileProps) {
  const clickable = Boolean(card && onClick);

  return (
    <DashboardTile
      variant={variant}
      layout="chart"
      title={label}
      titleCaps
      eventSubtitle={eventSubtitle}
      detail={detail}
      subtitle={cardName}
      className="stats-chart-tile tournament-highlight-tile"
    >
      {card ? (
        <button
          type="button"
          className="tournament-highlight-tile__art h-full w-full"
          onClick={onClick}
          disabled={!clickable}
          aria-label={`View ${cardName}`}
        >
          <CardImage
            imagePath={card.image_path ?? card.image}
            alt={cardName}
            catalogType={catalogType}
            useThumbnail
            loading="eager"
            showFlipControl={false}
          />
        </button>
      ) : (
        <div className="tournament-highlight-tile__placeholder">{cardName}</div>
      )}
    </DashboardTile>
  );
}

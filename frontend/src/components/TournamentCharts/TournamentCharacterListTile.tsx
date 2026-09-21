import type { CatalogCard } from '../../lib/api/types';
import type { CountEntry } from '../../lib/tournaments/types';
import type { DashboardTileVariant } from '../dashboard';
import { isDashboardRailVariant } from '../dashboard/dashboardTileVariants';
import { StatsChartTile } from './StatsChartTile';
import { TournamentCharacterRosterTile } from './TournamentCharacterRosterTile';
import './TournamentCharts.css';

interface TournamentCharacterListTileProps {
  title: string;
  eventSubtitle?: string;
  entries: CountEntry[];
  variant?: DashboardTileVariant;
  onEntryClick: (entry: CountEntry) => void;
  resolveCard: (entry: CountEntry) => CatalogCard | null;
  isClickable: (entry: CountEntry) => boolean;
}

export function TournamentCharacterListTile({
  title,
  eventSubtitle,
  entries,
  variant = 'rail',
  onEntryClick,
  resolveCard,
  isClickable,
}: TournamentCharacterListTileProps) {
  if (entries.length === 0) {
    return (
      <StatsChartTile variant={variant} title={title} eventSubtitle={eventSubtitle}>
        <p className="tournament-tile-empty">None this event</p>
      </StatsChartTile>
    );
  }

  return (
    <TournamentCharacterRosterTile
      title={title}
      eventSubtitle={eventSubtitle}
      entries={entries}
      variant={variant}
      mode={isDashboardRailVariant(variant) ? 'cycle' : 'mosaic'}
      onEntryClick={onEntryClick}
      resolveCard={resolveCard}
      isClickable={isClickable}
    />
  );
}

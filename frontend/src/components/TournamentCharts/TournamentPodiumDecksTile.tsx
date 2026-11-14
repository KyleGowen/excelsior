import { DashboardTile, type DashboardTileVariant } from '../dashboard';
import type { TournamentPodiumDeckEntry } from '../../lib/tournaments/tournamentPodiumDecks';
import { TournamentPodiumDeckRows } from './TournamentPodiumDeckRows';
import './TournamentCharts.css';

interface TournamentPodiumDecksTileProps {
  entries: TournamentPodiumDeckEntry[];
  deckReturnTo?: string;
  variant?: DashboardTileVariant;
}

/** Standalone podium tile — retained for export compatibility; View All uses placard footer instead. */
export function TournamentPodiumDecksTile({
  entries,
  deckReturnTo,
  variant = 'md',
}: TournamentPodiumDecksTileProps) {
  return (
    <DashboardTile
      variant={variant}
      layout="text"
      title="Podium Finishes"
      className="stats-chart-tile tournament-podium-tile"
    >
      <TournamentPodiumDeckRows entries={entries} deckReturnTo={deckReturnTo} />
    </DashboardTile>
  );
}

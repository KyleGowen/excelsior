import type { TournamentEventMeta } from '../../lib/tournaments/types';
import type { TournamentPodiumDeckEntry } from '../../lib/tournaments/tournamentPodiumDecks';
import { getTournamentPlacardSections } from '../../lib/tournaments/tournamentPlacardSections';
import type { DashboardTileVariant } from '../dashboard';
import { PreviewTextTile } from './PreviewTextTile';
import { TournamentPodiumDeckRows } from './TournamentPodiumDeckRows';
import './TournamentCharts.css';

interface TournamentPlacardTileProps {
  meta: TournamentEventMeta;
  variant?: DashboardTileVariant;
  podiumEntries?: TournamentPodiumDeckEntry[];
  onOpenPodiumDeck?: (deckId: string, userId: string) => void;
  showWinnerWithPodium?: boolean;
}

export function TournamentPlacardTile({
  meta,
  variant = 'rail',
  podiumEntries,
  onOpenPodiumDeck,
  showWinnerWithPodium = false,
}: TournamentPlacardTileProps) {
  const showPodium = Boolean(podiumEntries?.length && onOpenPodiumDeck);
  const sections = getTournamentPlacardSections(meta, showPodium, showWinnerWithPodium);

  return (
    <PreviewTextTile
      className="tournament-placard-tile"
      variant={variant}
      title={meta.title}
      subtitle={meta.seasonLabel}
      sections={sections}
      footer={
        showPodium && podiumEntries && onOpenPodiumDeck ? (
          <TournamentPodiumDeckRows entries={podiumEntries} onOpenDeck={onOpenPodiumDeck} />
        ) : undefined
      }
    />
  );
}

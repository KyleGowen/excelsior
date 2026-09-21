import { IconChevronRight } from '../icons';
import type { TournamentPodiumDeckEntry } from '../../lib/tournaments/tournamentPodiumDecks';
import type { TournamentDeckPlacement } from '../../lib/tournaments/types';
import './TournamentCharts.css';

const PODIUM_ITEM_CLASS: Partial<Record<TournamentDeckPlacement, string>> = {
  '1st': 'tournament-podium-tile__item--1st',
  '2nd': 'tournament-podium-tile__item--2nd',
  '3rd': 'tournament-podium-tile__item--3rd',
};

interface TournamentPodiumDeckRowsProps {
  entries: TournamentPodiumDeckEntry[];
  onOpenDeck: (deckId: string, userId: string) => void;
}

export function TournamentPodiumDeckRows({ entries, onOpenDeck }: TournamentPodiumDeckRowsProps) {
  return (
    <ul className="tournament-podium-tile__list">
      {entries.map(({ placement, playerName, deckId, userId }) => {
        const clickable = Boolean(deckId && userId);
        const itemClass = PODIUM_ITEM_CLASS[placement] ?? 'tournament-podium-tile__item--other';

        return (
          <li key={placement} className={`tournament-podium-tile__item ${itemClass}`.trim()}>
            {clickable && deckId && userId ? (
              <button
                type="button"
                className="tournament-podium-tile__row"
                onClick={() => onOpenDeck(deckId, userId)}
              >
                <span className="tournament-podium-tile__badge">{placement}</span>
                <span className="tournament-podium-tile__name">{playerName}</span>
                <IconChevronRight className="tournament-podium-tile__chevron" aria-hidden />
              </button>
            ) : (
              <div className="tournament-podium-tile__row tournament-podium-tile__row--disabled">
                <span className="tournament-podium-tile__badge">{placement}</span>
                <span className="tournament-podium-tile__name tournament-podium-tile__name--muted">
                  {playerName}
                </span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

import { Link } from 'react-router-dom';
import { IconChevronRight } from '../icons';
import { buildDeckEditorNavigateState, buildDeckEditorPath } from '../../lib/navigation/deckEditorReturn';
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
  deckReturnTo?: string;
}

export function TournamentPodiumDeckRows({ entries, deckReturnTo }: TournamentPodiumDeckRowsProps) {
  return (
    <ul className="tournament-podium-tile__list">
      {entries.map(({ placement, playerName, deckId, userId }) => {
        const itemClass = PODIUM_ITEM_CLASS[placement] ?? 'tournament-podium-tile__item--other';

        return (
          <li key={placement} className={`tournament-podium-tile__item ${itemClass}`.trim()}>
            {deckId && userId ? (
              <Link
                className="tournament-podium-tile__row"
                to={buildDeckEditorPath(userId, deckId, true)}
                state={deckReturnTo ? buildDeckEditorNavigateState(deckReturnTo) : undefined}
              >
                <span className="tournament-podium-tile__badge">{placement}</span>
                <span className="tournament-podium-tile__name">{playerName}</span>
                <IconChevronRight className="tournament-podium-tile__chevron" aria-hidden />
              </Link>
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

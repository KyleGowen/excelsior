import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import seasonPerformanceData from '../../data/tournaments/s1-2026-character-performance.json';
import { fetchTournamentDecks } from '../../lib/api/decks';
import { buildDeckEditorNavigateState } from '../../lib/navigation/deckEditorReturn';
import {
  buildRegionalEventPath,
  type RegionalTournamentDefinition,
  type TournamentPostDefinition,
} from '../../lib/tournaments/regionalTournaments';
import { resolveTournamentPodiumDecks } from '../../lib/tournaments/tournamentPodiumDecks';
import { compareAlphabetically } from '../../lib/sort/alphabetical';
import type {
  SeasonCharacterPerformance,
  SeasonCharacterPerformanceEntry,
  TournamentDeckPlacement,
} from '../../lib/tournaments/types';

export const seasonPerformance = seasonPerformanceData as SeasonCharacterPerformance;

type PerformanceSort = 'appearances' | 'win-rate' | 'name';

function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function sortPerformance(
  rows: SeasonCharacterPerformanceEntry[],
  sort: PerformanceSort,
): SeasonCharacterPerformanceEntry[] {
  return [...rows].sort((a, b) => {
    if (sort === 'name') return compareAlphabetically(a.name, b.name);
    if (sort === 'win-rate') {
      return b.gameWinRate - a.gameWinRate
        || b.appearances - a.appearances
        || compareAlphabetically(a.name, b.name);
    }
    return b.appearances - a.appearances
      || b.gameWinRate - a.gameWinRate
      || compareAlphabetically(a.name, b.name);
  });
}

function placementForRank(rank: number): TournamentDeckPlacement | null {
  if (rank === 1) return '1st';
  if (rank === 2) return '2nd';
  if (rank === 3) return '3rd';
  if (rank === 6) return '6th';
  if (rank === 8) return '8th';
  return null;
}

function eventTableLabel(event: RegionalTournamentDefinition): string {
  if (event.id === 's1-seattle-regional') return 'Regional';
  if (event.id === 's1-seattle-naol') return 'NAOL';
  return event.stats.meta.title;
}

interface TournamentDeckLineupsProps {
  post: TournamentPostDefinition;
}

export function TournamentDeckLineups({ post }: TournamentDeckLineupsProps) {
  const [selectedEventId, setSelectedEventId] = useState(post.events[0]?.id ?? '');
  const tournamentQuery = useQuery({
    queryKey: ['decks', 'tournament'],
    queryFn: () => fetchTournamentDecks(),
    staleTime: 10 * 60 * 1000,
  });
  const activeEvent = post.events.find((event) => event.id === selectedEventId) ?? post.events[0];
  const linkedDecks = useMemo(() => {
    const links = new Map<string, { deckId: string; userId: string }>();

    post.events.forEach((event) => {
      resolveTournamentPodiumDecks(tournamentQuery.data ?? [], event).forEach((entry) => {
        if (!entry.deckId || !entry.userId) return;
        links.set(`${event.id}:${entry.placement}:${entry.playerName}`, {
          deckId: entry.deckId,
          userId: entry.userId,
        });
      });
    });

    return links;
  }, [post.events, tournamentQuery.data]);

  if (!activeEvent) return null;
  const activeLabel = eventTableLabel(activeEvent);
  const showEventTabs = post.events.length > 1;

  return (
    <section className="tournament-data__section" aria-labelledby="tournament-lineups-title">
      <header className="tournament-data__section-head">
        <div>
          <p className="tournament-data__eyebrow">Complete field</p>
          <h2 id="tournament-lineups-title">
            {showEventTabs ? `${post.title} deck lists` : `${post.title} deck lineups`}
          </h2>
        </div>
        <p className="tournament-data__count">{activeEvent.stats.deckRows.length} decks</p>
      </header>
      <p className="tournament-data__description">
        Every reported character combination, record, homebase, battleground, cataclysm, mission,
        and event card. Regional and NAOL remain separate deck lists.
      </p>
      {showEventTabs ? (
        <div className="tournament-data__event-tabs" role="tablist" aria-label="Seattle deck lists">
          {post.events.map((event) => {
            const selected = event.id === activeEvent.id;
            return (
              <button
                key={event.id}
                id={`tournament-deck-tab-${event.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="tournament-deck-list-panel"
                className={selected ? 'is-active' : undefined}
                onClick={() => setSelectedEventId(event.id)}
              >
                <span>{eventTableLabel(event)}</span>
                <span>{event.stats.deckRows.length}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      <div
        id="tournament-deck-list-panel"
        role={showEventTabs ? 'tabpanel' : undefined}
        className="tournament-data__table-wrap"
        tabIndex={0}
        aria-labelledby={showEventTabs ? `tournament-deck-tab-${activeEvent.id}` : undefined}
        aria-label={`${activeLabel} deck list table`}
      >
        <table className="tournament-data__table tournament-data__table--decks">
          <thead>
            <tr>
              <th scope="col">Place</th>
              <th scope="col">Player</th>
              <th scope="col">Record</th>
              <th scope="col">Front line 1</th>
              <th scope="col">Front line 2</th>
              <th scope="col">Front line 3</th>
              <th scope="col">Reserve</th>
              <th scope="col">Homebase</th>
              <th scope="col">Battleground</th>
              <th scope="col">Cataclysm</th>
              <th scope="col">Mission</th>
              <th scope="col">Cards</th>
              <th scope="col">Event card</th>
            </tr>
          </thead>
          <tbody>
            {activeEvent.stats.deckRows.map((deck) => {
              const placement = placementForRank(deck.rank);
              const linkedDeck = placement
                ? linkedDecks.get(`${activeEvent.id}:${placement}:${deck.player}`)
                : undefined;

              return (
                <tr key={`${activeEvent.id}-${deck.rank}-${deck.player}`}>
                  <td className="tournament-data__number">{deck.rank}</td>
                  <th scope="row">
                    {linkedDeck ? (
                      <Link
                        className="tournament-data__deck-link"
                        to={`/users/${linkedDeck.userId}/decks/${linkedDeck.deckId}?readonly=true`}
                        state={buildDeckEditorNavigateState(buildRegionalEventPath(post.id))}
                      >
                        {deck.player}
                      </Link>
                    ) : deck.player}
                  </th>
                  <td className="tournament-data__record">{deck.wins}–{deck.losses}</td>
                  <td>{deck.frontLine1}</td>
                  <td>{deck.frontLine2}</td>
                  <td>{deck.frontLine3}</td>
                  <td>{deck.reserve}</td>
                  <td>{deck.homebase}</td>
                  <td>{deck.battleground}</td>
                  <td>{deck.cataclysm}</td>
                  <td>{deck.mission}</td>
                  <td className="tournament-data__number">{deck.cardCount ?? '—'}</td>
                  <td>{deck.event}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function SeasonCharacterPerformanceTable() {
  const [performanceSort, setPerformanceSort] = useState<PerformanceSort>('appearances');
  const performanceRows = useMemo(
    () => sortPerformance(seasonPerformance.characters, performanceSort),
    [performanceSort],
  );

  return (
    <section className="tournament-data__section" aria-labelledby="season-performance-title">
      <header className="tournament-data__section-head tournament-data__section-head--controls">
        <div>
          <p className="tournament-data__eyebrow">Season One through Seattle</p>
          <h2 id="season-performance-title">Season 1 Character Performance</h2>
        </div>
        <label className="tournament-data__sort">
          <span>Sort</span>
          <select
            value={performanceSort}
            onChange={(event) => setPerformanceSort(event.target.value as PerformanceSort)}
          >
            <option value="appearances">Appearances</option>
            <option value="win-rate">Game win rate</option>
            <option value="name">Character name</option>
          </select>
        </label>
      </header>
      <p className="tournament-data__description">
        {seasonPerformance.meta.deckCount} decks across {seasonPerformance.meta.eventCount} events.
        Each deck’s full tournament record is applied to every character in its lineup.
      </p>
      <p className="tournament-data__scope-note">Season 0 regionals are not included.</p>
      <div className="tournament-data__table-wrap" tabIndex={0} aria-label="Season One character performance table">
        <table className="tournament-data__table tournament-data__table--performance">
          <thead>
            <tr>
              <th scope="col">Character</th>
              <th scope="col">Appearances</th>
              <th scope="col">Game W–L</th>
              <th scope="col">Game win rate</th>
              <th scope="col">Top 8</th>
              <th scope="col">Top 3</th>
              <th scope="col">Event wins</th>
            </tr>
          </thead>
          <tbody>
            {performanceRows.map((character) => (
              <tr key={character.name}>
                <th scope="row">{character.name}</th>
                <td className="tournament-data__number">{character.appearances}</td>
                <td className="tournament-data__record">{character.gameWins}–{character.gameLosses}</td>
                <td className="tournament-data__number">{formatPercent(character.gameWinRate)}</td>
                <td className="tournament-data__number">{character.top8}</td>
                <td className="tournament-data__number">{character.top3}</td>
                <td className="tournament-data__number">{character.tournamentWins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

import { useSearchParams, Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { IconTrophy } from '../../components/icons';
import { useScrollToTopOnMount } from '../../lib/layout/useScrollToTopOnMount';
import {
  FEATURED_TOURNAMENT_ID,
  getTournamentPost,
  TOURNAMENT_POSTS,
} from '../../lib/tournaments/regionalTournaments';
import { TournamentStatsRail } from './TournamentStatsRail';
import {
  SeasonCharacterPerformanceTable,
  TournamentDeckLineups,
  seasonPerformance,
} from './TournamentDataTables';
import './TournamentStatsRail.css';

type TournamentDataView = 'event' | 'season';

export default function RegionalsPage() {
  useScrollToTopOnMount();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPost = getTournamentPost(
    searchParams.get('event') ?? FEATURED_TOURNAMENT_ID,
  );
  const selectedView: TournamentDataView = searchParams.get('view') === 'season'
    ? 'season'
    : 'event';

  const selectPost = (postId: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('event', postId);
    setSearchParams(nextParams);
  };

  const selectView = (view: TournamentDataView) => {
    const nextParams = new URLSearchParams(searchParams);
    if (view === 'season') nextParams.set('view', 'season');
    else nextParams.delete('view');
    setSearchParams(nextParams);
  };

  return (
    <div className="regionals-page">
      <div className="regionals-page__inner">
        <header className="regionals-page__head">
          <Link className="regionals-page__back" to="/home">
            ← Back to Home
          </Link>
          <div className="regionals-page__title-row">
            <h1 className="regionals-page__title">
              <span className="regionals-page__title-icon" aria-hidden="true">
                <IconTrophy />
              </span>
              Tournament Data
            </h1>
            {selectedView === 'event' ? (
              <label className="regionals-page__event-picker">
                <span>Tournament</span>
                <select
                  aria-label="Tournament"
                  value={selectedPost.id}
                  onChange={(event) => selectPost(event.target.value)}
                >
                  {TOURNAMENT_POSTS.map((post) => (
                    <option key={post.id} value={post.id}>
                      {post.selectorLabel}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <p className="regionals-page__subtitle">
            {selectedView === 'event'
              ? selectedPost.subtitle
              : `Season One through Seattle · ${seasonPerformance.meta.deckCount} decks across ${seasonPerformance.meta.eventCount} events`}
          </p>
          <p className="regionals-page__credit">
            2026 tournament data compiled by{' '}
            <a
              href="https://discord.com/users/443222543512633365"
              target="_blank"
              rel="noreferrer"
              title="Open Traveling Goof on Discord"
            >
              Traveling Goof on Discord
            </a>
          </p>
        </header>
        <div className="regionals-page__tabs" role="tablist" aria-label="Tournament data views">
          <button
            id="tournament-event-tab"
            type="button"
            role="tab"
            aria-selected={selectedView === 'event'}
            aria-controls="tournament-event-panel"
            className={selectedView === 'event' ? 'is-active' : undefined}
            onClick={() => selectView('event')}
          >
            Event recap
          </button>
          <button
            id="tournament-season-tab"
            type="button"
            role="tab"
            aria-selected={selectedView === 'season'}
            aria-controls="tournament-season-panel"
            className={selectedView === 'season' ? 'is-active' : undefined}
            onClick={() => selectView('season')}
          >
            Season 1 totals
          </button>
        </div>
        <Separator className="bg-border" />
        {selectedView === 'event' ? (
          <div
            id="tournament-event-panel"
            role="tabpanel"
            aria-labelledby="tournament-event-tab"
            className="regionals-page__tab-panel"
          >
            <TournamentStatsRail expanded tournamentId={selectedPost.id} />
            <div className="tournament-data">
              <TournamentDeckLineups post={selectedPost} />
            </div>
          </div>
        ) : (
          <div
            id="tournament-season-panel"
            role="tabpanel"
            aria-labelledby="tournament-season-tab"
            className="regionals-page__tab-panel tournament-data"
          >
            <SeasonCharacterPerformanceTable />
          </div>
        )}
      </div>
    </div>
  );
}

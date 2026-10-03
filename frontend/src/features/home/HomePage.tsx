import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../app/AuthProvider';
import { fetchTournamentDecks } from '../../lib/api/decks';
import { fetchCommunityFeed, fetchPreconstructedDecks } from '../../lib/api/favorites';
import { fetchCatalog } from '../../lib/api/catalog';
import { buildMissionSetByCardId, deckMissionSetName } from '../../lib/decks/missionSetLabel';
import {
  buildDeckPreviewCatalogImages,
  enrichDeckListPreviewImages,
} from '../../lib/decks/deckPreviewImages';
import { flattenOfficialPreconstructedDecks } from './preconstructedRail';
import { assetUrl } from '../../lib/images/cardImages';
import { DeckTile } from '../../components/DeckTile';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { RecentUpdatesList } from './RecentUpdatesList';
import { useRecentUpdates } from './useRecentUpdates';
import { TournamentStatsRail } from './TournamentStatsRail';
import {
  buildDeckEditorNavigateState,
  DECK_EDITOR_RETURN_HOME,
} from '../../lib/navigation/deckEditorReturn';
import {
  IconUsers,
  IconTrophy,
  IconSparkles,
  IconChevronRight,
  IconDecks,
  IconCards,
} from '../../components/icons';
import type { DeckListItem } from '../../lib/api/types';
import './HomePage.css';
import './recentUpdates.css';

const HOME_BANNERS = {
  victoryHarben: {
    src: '/src/resources/images/home/banners/victory-harben.png',
    src2x: '/src/resources/images/home/banners/victory-harben-2x.png',
    mirrored: false,
  },
  skyboundImmortal: {
    src: '/src/resources/images/home/banners/skybound-immortal.png',
    src2x: '/src/resources/images/home/banners/skybound-immortal-2x.png',
    mirrored: true,
  },
} as const;

// Keep selection explicit until banner rotation is intentionally designed and enabled.
const ACTIVE_HOME_BANNER = HOME_BANNERS.skyboundImmortal;
/** Max tiles in the Home community rail (feed returns up to 20). */
const HOME_COMMUNITY_RAIL_LIMIT = 12;
/** Max update tiles on the Home Recent Updates rail. */
const HOME_RECENT_UPDATES_LIMIT = 3;

const HOME_COMMUNITY_FEED_KEY = ['decks', 'community-feed', ''] as const;
const HOME_PRECONSTRUCTED_DECKS_KEY = ['decks', 'preconstructed'] as const;

export default function HomePage() {
  const { user, tournamentDecksUserId } = useAuth();
  const navigate = useNavigate();

  const communityQuery = useQuery({
    queryKey: HOME_COMMUNITY_FEED_KEY,
    queryFn: () => fetchCommunityFeed(),
    staleTime: 10 * 60 * 1000,
  });

  const communityDecks = (communityQuery.data ?? []).slice(0, HOME_COMMUNITY_RAIL_LIMIT);
  const tournamentQuery = useQuery({
    queryKey: ['decks', 'tournament'],
    queryFn: () => fetchTournamentDecks(),
    staleTime: 10 * 60 * 1000,
  });

  const tournamentDecks = (tournamentQuery.data ?? []).filter(
    (deck) => !tournamentDecksUserId || deck.metadata.userId === tournamentDecksUserId,
  );

  const preconstructedQuery = useQuery({
    queryKey: HOME_PRECONSTRUCTED_DECKS_KEY,
    queryFn: () => fetchPreconstructedDecks(),
    staleTime: 10 * 60 * 1000,
  });

  const preconstructedDecks = useMemo(
    () => flattenOfficialPreconstructedDecks(preconstructedQuery.data ?? []),
    [preconstructedQuery.data],
  );

  const missionsQuery = useQuery({
    queryKey: ['catalog', 'missions'],
    queryFn: () => fetchCatalog('missions'),
    staleTime: 30 * 60 * 1000,
  });

  const charactersQuery = useQuery({
    queryKey: ['catalog', 'characters'],
    queryFn: () => fetchCatalog('characters'),
    staleTime: 30 * 60 * 1000,
  });

  const locationsQuery = useQuery({
    queryKey: ['catalog', 'locations'],
    queryFn: () => fetchCatalog('locations'),
    staleTime: 30 * 60 * 1000,
  });
  const battlegroundsQuery = useQuery({
    queryKey: ['catalog', 'battlegrounds'],
    queryFn: () => fetchCatalog('battlegrounds'),
    staleTime: 30 * 60 * 1000,
  });

  const previewCatalogImages = useMemo(
    () => buildDeckPreviewCatalogImages(
      charactersQuery.data,
      locationsQuery.data,
      battlegroundsQuery.data,
    ),
    [charactersQuery.data, locationsQuery.data, battlegroundsQuery.data],
  );

  const enrichedCommunityDecks = useMemo(
    () => enrichDeckListPreviewImages(communityDecks, previewCatalogImages),
    [communityDecks, previewCatalogImages],
  );

  const enrichedTournamentDecks = useMemo(
    () => enrichDeckListPreviewImages(tournamentDecks, previewCatalogImages),
    [tournamentDecks, previewCatalogImages],
  );

  const enrichedPreconstructedDecks = useMemo(
    () => enrichDeckListPreviewImages(preconstructedDecks, previewCatalogImages),
    [preconstructedDecks, previewCatalogImages],
  );

  const missionSetByCardId = useMemo(
    () => buildMissionSetByCardId(missionsQuery.data ?? []),
    [missionsQuery.data],
  );

  const openDeck = (deck: DeckListItem) => {
    const m = deck.metadata;
    navigate(`/users/${m.userId}/decks/${m.id}?readonly=true`, {
      state: buildDeckEditorNavigateState(DECK_EDITOR_RETURN_HOME),
    });
  };

  const openProfile = (deck: DeckListItem) => {
    navigate(`/users/${deck.metadata.userId}/decks`);
  };

  return (
    <div className="home">
      <div className="home__inner">
        <section className="home__hero panel">
          <div className="home__hero-text">
            <h1 className="home__hero-title">Welcome to Excelsior</h1>
            <p className="home__hero-tagline">OverPower deck building and collection tracking companion.</p>
            <p className="home__hero-sub">
              Build decks, explore cards, track your collection, and share your decks with the community.
            </p>
            <button
              type="button"
              className="btn btn-ghost home__hero-cta"
              onClick={() => navigate(user ? `/users/${user.id}/decks` : '/data')}
            >
              <IconDecks /> Explore Decks
            </button>
          </div>
          <div className="home__hero-art" aria-hidden="true">
            <img
              className={`home__hero-art-image${ACTIVE_HOME_BANNER.mirrored ? ' home__hero-art-image--mirrored' : ''}`}
              src={assetUrl(ACTIVE_HOME_BANNER.src)}
              srcSet={`${assetUrl(ACTIVE_HOME_BANNER.src)} 1x, ${assetUrl(ACTIVE_HOME_BANNER.src2x)} 2x`}
              sizes="(min-width: 2000px) 1333px, 66vw"
              alt=""
            />
          </div>
        </section>

        <NewsSection />

        <TournamentStatsRail />

        <DeckRail
          icon={<IconUsers />}
          title="Community Decks"
          viewAllTo="/community#community"
          loading={communityQuery.isLoading}
          error={communityQuery.isError}
          decks={enrichedCommunityDecks}
          emptyMessage="Community decks will appear here as they are shared."
          missionSetByCardId={missionSetByCardId}
          onOpen={openDeck}
          onOwnerClick={openProfile}
        />

        <DeckRail
          icon={<IconTrophy />}
          title="Tournament Winning Decks"
          viewAllTo="/community#tournament"
          loading={tournamentQuery.isLoading}
          error={tournamentQuery.isError}
          decks={enrichedTournamentDecks}
          emptyMessage="Tournament-winning decks will appear here as they are added."
          missionSetByCardId={missionSetByCardId}
          onOpen={openDeck}
        />

        <DeckRail
          icon={<IconCards />}
          title="Preconstructed Decks"
          viewAllTo="/community#preconstructed"
          loading={preconstructedQuery.isLoading}
          error={preconstructedQuery.isError}
          decks={enrichedPreconstructedDecks}
          emptyMessage="Preconstructed decks will appear here as sets are added."
          missionSetByCardId={missionSetByCardId}
          onOpen={openDeck}
          showUpdated={false}
          showLegality={false}
        />

      </div>
    </div>
  );
}

interface DeckRailProps {
  icon: React.ReactNode;
  title: string;
  viewAllTo?: string;
  loading: boolean;
  error: boolean;
  decks: DeckListItem[];
  emptyMessage: string;
  missionSetByCardId: Map<string, string>;
  onOpen: (deck: DeckListItem) => void;
  onOwnerClick?: (deck: DeckListItem) => void;
  showUpdated?: boolean;
  showLegality?: boolean;
}

function DeckRail({
  icon,
  title,
  viewAllTo,
  loading,
  error,
  decks,
  emptyMessage,
  missionSetByCardId,
  onOpen,
  onOwnerClick,
  showUpdated,
  showLegality,
}: DeckRailProps) {
  return (
    <section className="home__section">
      <header className="home__section-head">
        <h2 className="home__section-title">
          <span className="home__section-icon">{icon}</span>
          {title}
        </h2>
        {decks.length > 0 && viewAllTo ? (
          <Link className="home__view-all" to={viewAllTo}>View All <IconChevronRight /></Link>
        ) : null}
      </header>

      {loading ? (
        <LoadingState label="Loading decks..." />
      ) : error || decks.length === 0 ? (
        <EmptyState title="Nothing here yet" message={emptyMessage} icon={icon} />
      ) : (
        <div className="home__rail">
          {decks.map((deck) => (
            <div className="home__rail-item" key={deck.metadata.id}>
              <DeckTile
                deck={deck}
                variant="compact"
                missionSetName={deckMissionSetName(deck, missionSetByCardId)}
                ownerName={onOwnerClick ? (deck.metadata.ownerDisplayName ?? null) : undefined}
                onOwnerClick={onOwnerClick ? () => onOwnerClick(deck) : undefined}
                onOpen={() => onOpen(deck)}
                showUpdated={showUpdated}
                showLegality={showLegality}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function NewsSection() {
  const updatesQuery = useRecentUpdates();
  const updates = updatesQuery.data ?? [];
  const railUpdates = updates.slice(0, HOME_RECENT_UPDATES_LIMIT);

  return (
    <section className="home__section">
      <header className="home__section-head">
        <h2 className="home__section-title">
          <span className="home__section-icon"><IconSparkles /></span>
          Recent Updates
        </h2>
        {updates.length > HOME_RECENT_UPDATES_LIMIT ? (
          <Link className="home__view-all" to="/home/updates">View All <IconChevronRight /></Link>
        ) : null}
      </header>

      {updatesQuery.isLoading ? (
        <LoadingState label="Loading updates..." />
      ) : updatesQuery.isError || updates.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          message="Recent updates will appear here."
          icon={<IconSparkles />}
        />
      ) : (
        <RecentUpdatesList updates={railUpdates} layout="rail" />
      )}
    </section>
  );
}

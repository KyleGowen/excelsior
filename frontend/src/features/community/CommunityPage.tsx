import { useEffect, useRef, useState, type FormEvent } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../../app/AuthProvider';

import { fetchTournamentDecks } from '../../lib/api/decks';

import {
  fetchCommunityFeed,
  fetchFavoriteDecks,
  fetchPreconstructedDecks,
} from '../../lib/api/favorites';

import { useFavoriteToggle } from '../../lib/decks/useFavoriteToggle';
import { favoritesQueryKey } from '../../lib/decks/favoritesQueryKey';

import { fetchCatalog } from '../../lib/api/catalog';

import { stepCyclicalIndex } from '../../lib/layout/cyclicalIndex';

import { useHorizontalSwipe } from '../../lib/layout/useHorizontalSwipe';
import { useScrollToTopOnMount } from '../../lib/layout/useScrollToTopOnMount';

import { CommunityDeckGrid } from './CommunityDeckGrid';

import { LoadingState } from '../../components/LoadingState';

import { EmptyState } from '../../components/EmptyState';

import { IconUsers, IconTrophy, IconHeart, IconSearch, IconCards } from '../../components/icons';

import type { DeckListItem, PreconstructedDeckGroup } from '../../lib/api/types';

import './CommunityPage.css';



const COMMUNITY_FEED_KEY = (search: string) => ['decks', 'community-feed', search] as const;

const PRECONSTRUCTED_DECKS_KEY = ['decks', 'preconstructed'] as const;



type CommunityTab = 'tournament' | 'community' | 'favorites' | 'preconstructed';



const COMMUNITY_TAB_ORDER: CommunityTab[] = [
  'favorites',
  'community',
  'preconstructed',
  'tournament',
];



const COMMUNITY_TAB_LABELS: Record<CommunityTab, string> = {

  tournament: 'Tournament Winning Decks',

  community: 'Community Decks',

  favorites: 'Your Favorites',

  preconstructed: 'Preconstructed',

};



const HASH_TO_TAB: Record<string, CommunityTab> = {

  tournament: 'tournament',

  community: 'community',

  favorites: 'favorites',

  preconstructed: 'preconstructed',

};



const COMMUNITY_SWIPE_BLOCK_SELECTOR =

  '.community__tabs, .community__toolbar, .community__search, input, textarea, select';



export default function CommunityPage() {
  useScrollToTopOnMount();

  const { user, isGuest, tournamentDecksUserId } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();

  const queryClient = useQueryClient();

  const swipeRef = useRef<HTMLDivElement>(null);

  const tabStripRef = useRef<HTMLDivElement>(null);



  const viewerId = user?.id ?? null;

  const canFavorite = Boolean(viewerId) && !isGuest;



  const visibleTabs = canFavorite

    ? COMMUNITY_TAB_ORDER

    : COMMUNITY_TAB_ORDER.filter((t) => t !== 'favorites');



  const [activeTab, setActiveTab] = useState<CommunityTab>('community');



  const [searchInput, setSearchInput] = useState('');

  const [search, setSearch] = useState('');



  // Debounce the search input so typing doesn't spam the feed endpoint.

  useEffect(() => {

    const t = setTimeout(() => setSearch(searchInput.trim()), 300);

    return () => clearTimeout(t);

  }, [searchInput]);



  const selectTab = (tab: CommunityTab) => {

    setActiveTab(tab);

    navigate({ hash: tab }, { replace: true });

    const chip = tabStripRef.current?.querySelector<HTMLElement>(`[data-community-tab="${tab}"]`);

    chip?.scrollIntoView({ inline: 'nearest', block: 'nearest' });

  };



  const stepTab = (delta: 1 | -1) => {

    const idx = visibleTabs.indexOf(activeTab);

    const next = visibleTabs[stepCyclicalIndex(idx >= 0 ? idx : 0, visibleTabs.length, delta)];

    selectTab(next);

  };



  useHorizontalSwipe({

    targetRef: swipeRef,

    enabled: true,

    blockSelector: COMMUNITY_SWIPE_BLOCK_SELECTOR,

    onSwipeLeft: () => stepTab(1),

    onSwipeRight: () => stepTab(-1),

  });



  // Deep-link from Home "View All" (#tournament, #community, #favorites).

  useEffect(() => {

    const id = location.hash.slice(1);

    if (!id || !HASH_TO_TAB[id]) return;

    if (id === 'favorites' && !canFavorite) return;

    setActiveTab(HASH_TO_TAB[id]);

  }, [location.hash, canFavorite]);



  const tournamentQuery = useQuery({

    queryKey: ['decks', 'tournament'],

    queryFn: () => fetchTournamentDecks(),

    enabled: activeTab === 'tournament',

    staleTime: 10 * 60 * 1000,

  });

  const tournamentDecks = (tournamentQuery.data ?? []).filter(

    (deck) => !tournamentDecksUserId || deck.metadata.userId === tournamentDecksUserId,

  );



  const communityQuery = useQuery({

    queryKey: COMMUNITY_FEED_KEY(search),

    queryFn: () => fetchCommunityFeed(search),

    enabled: activeTab === 'community',

    staleTime: 60 * 1000,

  });



  const favoritesQuery = useQuery({

    queryKey: favoritesQueryKey(viewerId),

    queryFn: () => fetchFavoriteDecks(),

    enabled: canFavorite && activeTab === 'favorites',

    staleTime: 60 * 1000,

  });

  const preconstructedQuery = useQuery({

    queryKey: PRECONSTRUCTED_DECKS_KEY,

    queryFn: () => fetchPreconstructedDecks(),

    enabled: activeTab === 'preconstructed',

    staleTime: 10 * 60 * 1000,

  });



  const charactersQuery = useQuery({

    queryKey: ['catalog', 'characters'],

    queryFn: () => fetchCatalog('characters'),

    staleTime: 30 * 60 * 1000,

  });

  const missionsQuery = useQuery({

    queryKey: ['catalog', 'missions'],

    queryFn: () => fetchCatalog('missions'),

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



  const favoriteToggle = useFavoriteToggle([PRECONSTRUCTED_DECKS_KEY]);



  const openDeck = (deck: DeckListItem) => {

    navigate(`/users/${deck.metadata.userId}/decks/${deck.metadata.id}?readonly=true`);

  };

  const openProfile = (deck: DeckListItem) => {

    navigate(`/users/${deck.metadata.userId}/decks`);

  };



  // Toggle a heart in the community feed: optimistically patch the current feed page.

  const toggleFeedFavorite = (deck: DeckListItem) => {

    const next = !deck.metadata.isFavorited;

    queryClient.setQueryData<DeckListItem[]>(COMMUNITY_FEED_KEY(search), (prev) =>

      (prev ?? []).map((d) =>

        d.metadata.id === deck.metadata.id

          ? { ...d, metadata: { ...d.metadata, isFavorited: next } }

          : d,

      ),

    );

    favoriteToggle.mutate({ deckId: deck.metadata.id, next });

  };



  // In the favorites section the heart is always filled; clicking unfavorites and

  // optimistically removes the tile from the list.

  const removeFromFavorites = (deck: DeckListItem) => {

    queryClient.setQueryData<DeckListItem[]>(favoritesQueryKey(viewerId), (prev) =>

      (prev ?? []).filter((d) => d.metadata.id !== deck.metadata.id),

    );

    favoriteToggle.mutate({ deckId: deck.metadata.id, next: false });

  };

  const togglePreconstructedFavorite = (deck: DeckListItem) => {

    const next = !deck.metadata.isFavorited;

    queryClient.setQueryData<PreconstructedDeckGroup[]>(PRECONSTRUCTED_DECKS_KEY, (prev) =>

      (prev ?? []).map((group) => ({

        ...group,

        decks: group.decks.map((item) =>

          item.metadata.id === deck.metadata.id

            ? { ...item, metadata: { ...item.metadata, isFavorited: next } }

            : item,

        ),

        featuredUpgradeRecommendations: group.featuredUpgradeRecommendations.map((item) =>

          item.metadata.id === deck.metadata.id

            ? { ...item, metadata: { ...item.metadata, isFavorited: next } }

            : item,

        ),

      })),

    );

    favoriteToggle.mutate({ deckId: deck.metadata.id, next });

  };



  // Tournament decks come from /decks/tournament (no isFavorited enrichment), so

  // derive their heart state from the favorites cache and toggle that cache.

  const favoriteIds = new Set((favoritesQuery.data ?? []).map((d) => d.metadata.id));

  const toggleTournamentFavorite = (deck: DeckListItem) => {

    const next = !favoriteIds.has(deck.metadata.id);

    queryClient.setQueryData<DeckListItem[]>(favoritesQueryKey(viewerId), (prev) => {

      const list = prev ?? [];

      if (next) {

        if (list.some((d) => d.metadata.id === deck.metadata.id)) return list;

        return [{ ...deck, metadata: { ...deck.metadata, isFavorited: true } }, ...list];

      }

      return list.filter((d) => d.metadata.id !== deck.metadata.id);

    });

    favoriteToggle.mutate({ deckId: deck.metadata.id, next });

  };



  const favoriteDecks = favoritesQuery.data ?? [];

  const characters = charactersQuery.data;

  const missions = missionsQuery.data;

  const locations = locationsQuery.data;

  const battlegrounds = battlegroundsQuery.data;

  const tournamentDecksWithFav = tournamentDecks.map((d) =>

    favoriteIds.has(d.metadata.id)

      ? { ...d, metadata: { ...d.metadata, isFavorited: true } }

      : d,

  );



  const gridProps = {

    characters,

    locations,

    battlegrounds,

    missions,

    viewerId,

    canFavorite,

    favoriteBusy: favoriteToggle.isPending,

    onOpen: openDeck,

    onOwnerClick: openProfile,

  };



  return (

    <div className="community" ref={swipeRef}>

      <div className="community__inner">

        <header className="community__page-head">

          <h1 className="community__page-title"><IconUsers /> Community</h1>

          <p className="community__page-sub">

            Explore tournament-winning decks, the latest public decks, and your favorites.

          </p>

        </header>



        <div className="community__toolbar">

          <div className="community__tabs" ref={tabStripRef} role="tablist" aria-label="Community deck collections">

            {visibleTabs.map((t) => (

              <button

                key={t}

                type="button"

                role="tab"

                aria-selected={activeTab === t}

                data-community-tab={t}

                className={`community__tab ${activeTab === t ? 'is-active' : ''}`}

                onClick={() => selectTab(t)}

              >

                {COMMUNITY_TAB_LABELS[t]}

              </button>

            ))}

          </div>

          {activeTab === 'community' ? (

            <form

              className="community__search"

              role="search"

              onSubmit={(e: FormEvent) => e.preventDefault()}

            >

              <IconSearch />

              <input

                type="search"

                placeholder="Search deck names, users, characters, or locations"

                value={searchInput}

                onChange={(e) => setSearchInput(e.target.value)}

                aria-label="Search community decks by deck name, user, character, or location"

              />

            </form>

          ) : null}

        </div>



        <div className="community__panel" role="tabpanel">

          {activeTab === 'tournament' ? (

            tournamentQuery.isLoading ? (

              <LoadingState label="Loading decks..." />

            ) : tournamentQuery.isError ? (

              <EmptyState variant="error" title="Couldn't load decks" message="Please try again." icon={<IconTrophy />} />

            ) : tournamentDecks.length === 0 ? (

              <EmptyState title="Nothing here yet" message="Tournament-winning decks will appear here as they are added." icon={<IconTrophy />} />

            ) : (

              <CommunityDeckGrid

                decks={tournamentDecksWithFav}

                {...gridProps}

                onToggleFavorite={toggleTournamentFavorite}

              />

            )

          ) : null}



          {activeTab === 'community' ? (

            communityQuery.isLoading ? (

              <LoadingState label="Loading decks..." />

            ) : communityQuery.isError ? (

              <EmptyState variant="error" title="Couldn't load decks" message="Please try again." icon={<IconUsers />} />

            ) : (communityQuery.data ?? []).length === 0 ? (

              <EmptyState

                title={search ? 'No decks match' : 'Nothing here yet'}

                message={

                  search

                    ? 'Try a different deck, username, character, or location.'

                    : 'Public decks will appear here as they are shared.'

                }

                icon={<IconUsers />}

              />

            ) : (

              <CommunityDeckGrid

                decks={communityQuery.data ?? []}

                {...gridProps}

                onToggleFavorite={toggleFeedFavorite}

              />

            )

          ) : null}



          {activeTab === 'favorites' && canFavorite ? (

            favoritesQuery.isLoading ? (

              <LoadingState label="Loading favorites..." />

            ) : favoritesQuery.isError ? (

              <EmptyState variant="error" title="Couldn't load favorites" message="Please try again." icon={<IconHeart />} />

            ) : favoriteDecks.length === 0 ? (

              <EmptyState

                title="No favorites yet"

                message="Tap the heart on any community deck to save it here."

                icon={<IconHeart />}

              />

            ) : (

              <CommunityDeckGrid

                decks={favoriteDecks}

                {...gridProps}

                onToggleFavorite={removeFromFavorites}

                favoriteFilled

              />

            )

          ) : null}

          {activeTab === 'preconstructed' ? (

            preconstructedQuery.isLoading ? (

              <LoadingState label="Loading preconstructed decks..." />

            ) : preconstructedQuery.isError ? (

              <EmptyState variant="error" title="Couldn't load decks" message="Please try again." icon={<IconCards />} />

            ) : (preconstructedQuery.data ?? []).length === 0 ? (

              <EmptyState title="Nothing here yet" message="Preconstructed decks will appear here as sets are added." icon={<IconCards />} />

            ) : (

              <div className="community__preconstructed">

                {(preconstructedQuery.data ?? []).map((group) => (

                  <section className="community__preconstructed-set" key={group.setCode}>

                    <h2 className="community__preconstructed-label">{group.setName}</h2>

                    <CommunityDeckGrid

                      decks={group.decks}

                      {...gridProps}

                      className="community__preconstructed-grid"

                      onToggleFavorite={togglePreconstructedFavorite}

                      showOwner={false}

                      showUpdated={false}

                      showLegality={false}

                    />

                    {group.featuredUpgradeRecommendations.length > 0 ? (

                      <div className="community__preconstructed-subsection">

                        <h3 className="community__preconstructed-subsection-label">

                          Featured Precon Upgrade Recommendations

                        </h3>

                        <CommunityDeckGrid

                          decks={group.featuredUpgradeRecommendations}

                          {...gridProps}

                          className="community__preconstructed-grid"

                          onToggleFavorite={togglePreconstructedFavorite}

                        />

                      </div>

                    ) : null}

                  </section>

                ))}

              </div>

            )

          ) : null}

        </div>

      </div>

    </div>

  );

}

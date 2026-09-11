import { useMemo, useRef, useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../app/AuthProvider';
import { fetchDecksForUser, createDeck, deleteDeck, fetchTournamentDecks } from '../../lib/api/decks';
import {
  fetchPublicDecksForUser,
  fetchFavoriteDecks,
  fetchCommunityFeed,
  fetchPreconstructedDecks,
} from '../../lib/api/favorites';
import { useFavoriteToggle } from '../../lib/decks/useFavoriteToggle';
import { favoritesQueryKey } from '../../lib/decks/favoritesQueryKey';
import { fetchCatalog } from '../../lib/api/catalog';
import { buildMissionSetByCardId, deckMissionSetName } from '../../lib/decks/missionSetLabel';
import { buildCharStatsById, deckMaxStats as computeDeckMaxStats } from '../../lib/decks/deckMaxStats';
import {
  buildDeckPreviewCatalogImages,
  enrichDeckListPreviewImages,
} from '../../lib/decks/deckPreviewImages';
import { useLayoutMode } from '../../lib/layout/LayoutModeProvider';
import { stepCyclicalIndex } from '../../lib/layout/cyclicalIndex';
import { DECK_SELECTION_SWIPE_BLOCK_SELECTOR, useHorizontalSwipe } from '../../lib/layout/useHorizontalSwipe';
import {
  buildDeckEditorNavigateState,
  buildDeckSelectionReturnPath,
} from '../../lib/navigation/deckEditorReturn';
import { DeckTile, type DeckStatLine } from '../../components/DeckTile';
import { CommunityDeckGrid } from '../community/CommunityDeckGrid';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { SlideOutPanel } from '../../components/SlideOutPanel';
import {
  IconPlus,
  IconDecks,
  IconEdit,
  IconTrash,
  IconPlay,
  IconImport,
  IconExport,
  IconHeart,
  IconUsers,
  IconTrophy,
  IconCards,
  IconSearch,
} from '../../components/icons';
import type { DeckListItem, PreconstructedDeckGroup } from '../../lib/api/types';
import { ExportDeckPanel } from '../deck-editor/ExportDeckPanel';
import { ImportDeckPanel } from './ImportDeckPanel';
import { useDeckExportInput, createStubDeckExportInput } from './useDeckExportInput';
import './DeckSelectionPage.css';

type DeckTab = 'mine' | 'favorites' | 'community' | 'preconstructed' | 'tournament';
const DECK_SELECTION_TAB_ORDER: DeckTab[] = [
  'mine',
  'favorites',
  'community',
  'preconstructed',
  'tournament',
];
const DECK_TAB_LABELS: Record<DeckTab, string> = {
  mine: 'My Decks',
  favorites: 'Favorites',
  community: 'Community',
  preconstructed: 'Preconstructed',
  tournament: 'Tournament',
};
const COMMUNITY_FEED_KEY = (search: string) => ['decks', 'community-feed', search] as const;
const PRECONSTRUCTED_DECKS_KEY = ['decks', 'preconstructed'] as const;
const TOURNAMENT_KEY = ['decks', 'tournament'] as const;

export default function DeckSelectionPage() {
  const { user, isGuest } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const viewerId = user?.id ?? null;
  const profileUserId = params.userId;
  // Read-only public profile: viewing another user's decks (not your own, not guest's own).
  const isReadOnlyProfile = Boolean(profileUserId) && profileUserId !== viewerId;
  const ownerId = viewerId ?? profileUserId ?? '';
  const deckSelectionReturnPath = buildDeckSelectionReturnPath(profileUserId ?? ownerId);

  const publicDecksKey = ['decks', 'public', profileUserId ?? ''] as const;

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setCreateOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const myDecksQuery = useQuery({
    queryKey: ['decks', 'mine', ownerId],
    queryFn: () => fetchDecksForUser(isGuest),
    enabled: !isReadOnlyProfile,
  });
  const profileDecksQuery = useQuery({
    queryKey: publicDecksKey,
    queryFn: () => fetchPublicDecksForUser(profileUserId as string),
    enabled: isReadOnlyProfile,
  });
  const decksQuery = isReadOnlyProfile ? profileDecksQuery : myDecksQuery;

  const favoriteToggle = useFavoriteToggle([[...publicDecksKey], PRECONSTRUCTED_DECKS_KEY]);

  // Optimistically flip the heart on the public-profile list before the refetch lands.
  const handleToggleFavorite = (deck: DeckListItem) => {
    const next = !deck.metadata.isFavorited;
    queryClient.setQueryData<DeckListItem[]>(publicDecksKey, (prev) =>
      (prev ?? []).map((d) =>
        d.metadata.id === deck.metadata.id
          ? { ...d, metadata: { ...d.metadata, isFavorited: next } }
          : d,
      ),
    );
    favoriteToggle.mutate({ deckId: deck.metadata.id, next });
  };

  // Owner display name for the profile header (from any returned deck).
  const profileOwnerName =
    (profileDecksQuery.data ?? []).find((d) => d.metadata.ownerDisplayName)?.metadata
      .ownerDisplayName ?? null;
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
  const missionsQuery = useQuery({
    queryKey: ['catalog', 'missions'],
    queryFn: () => fetchCatalog('missions'),
    staleTime: 30 * 60 * 1000,
  });

  // ---- Mobile-only tabs (My Decks / Favorites / Community / Preconstructed / Tournament) ----
  const { isMobile } = useLayoutMode();
  const [activeTab, setActiveTab] = useState<DeckTab>('mine');
  // Desktop always shows My Decks here; the desktop Community page lives at /community.
  const tab: DeckTab = isMobile && !isReadOnlyProfile ? activeTab : 'mine';
  const showTabs = isMobile && !isReadOnlyProfile;

  const swipeRef = useRef<HTMLDivElement>(null);
  const tabStripRef = useRef<HTMLDivElement>(null);
  const goToRelativeTab = (delta: 1 | -1) => {
    const idx = DECK_SELECTION_TAB_ORDER.indexOf(activeTab);
    setActiveTab(
      DECK_SELECTION_TAB_ORDER[
        stepCyclicalIndex(idx >= 0 ? idx : 0, DECK_SELECTION_TAB_ORDER.length, delta)
      ],
    );
  };
  useHorizontalSwipe({
    targetRef: swipeRef,
    enabled: showTabs,
    blockSelector: DECK_SELECTION_SWIPE_BLOCK_SELECTOR,
    onSwipeLeft: () => goToRelativeTab(1),
    onSwipeRight: () => goToRelativeTab(-1),
  });
  useEffect(() => {
    if (!showTabs || !tabStripRef.current) return;
    const el = tabStripRef.current.querySelector<HTMLElement>(`[data-dsel-tab="${tab}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [tab, showTabs]);

  const [communitySearchInput, setCommunitySearchInput] = useState('');
  const [communitySearch, setCommunitySearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setCommunitySearch(communitySearchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [communitySearchInput]);

  const favoritesQuery = useQuery({
    queryKey: favoritesQueryKey(viewerId),
    queryFn: () => fetchFavoriteDecks(),
    enabled: showTabs && tab === 'favorites',
    staleTime: 60 * 1000,
  });
  const communityFeedQuery = useQuery({
    queryKey: COMMUNITY_FEED_KEY(communitySearch),
    queryFn: () => fetchCommunityFeed(communitySearch),
    enabled: showTabs && tab === 'community',
    staleTime: 60 * 1000,
  });
  const tournamentQuery = useQuery({
    queryKey: TOURNAMENT_KEY,
    queryFn: () => fetchTournamentDecks(),
    enabled: showTabs && tab === 'tournament',
    staleTime: 10 * 60 * 1000,
  });
  const preconstructedQuery = useQuery({
    queryKey: PRECONSTRUCTED_DECKS_KEY,
    queryFn: () => fetchPreconstructedDecks(),
    enabled: showTabs && tab === 'preconstructed',
    staleTime: 10 * 60 * 1000,
  });

  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDeckPrivate, setNewDeckPrivate] = useState(true);
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [menuDeck, setMenuDeck] = useState<DeckListItem | null>(null);
  const [exportDeckId, setExportDeckId] = useState<string | null>(null);

  const openCreatePanel = () => {
    setNewDeckPrivate(true);
    setCreateError(null);
    setCreateOpen(true);
  };

  const { input: exportDeckInput, loading: exportLoading } = useDeckExportInput(
    exportDeckId,
    isGuest,
    Boolean(exportDeckId),
  );

  const charStatsById = useMemo(
    () => buildCharStatsById(charactersQuery.data),
    [charactersQuery.data],
  );

  const previewCatalogImages = useMemo(
    () => buildDeckPreviewCatalogImages(
      charactersQuery.data,
      locationsQuery.data,
      battlegroundsQuery.data,
    ),
    [charactersQuery.data, locationsQuery.data, battlegroundsQuery.data],
  );

  const missionSetByCardId = useMemo(
    () => buildMissionSetByCardId(missionsQuery.data ?? []),
    [missionsQuery.data],
  );

  const deckMissionSetLabel = (deck: DeckListItem): string | null =>
    deckMissionSetName(deck, missionSetByCardId);

  const deckMaxStats = (deck: DeckListItem): DeckStatLine | null =>
    computeDeckMaxStats(deck, charStatsById);

  const decks = decksQuery.data ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? decks.filter((d) => d.metadata.name.toLowerCase().includes(q)) : decks;
    const sorted = [...list].sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
    return enrichDeckListPreviewImages(sorted, previewCatalogImages);
  }, [decks, search, previewCatalogImages]);

  const openDeck = (deck: DeckListItem) => {
    const suffix = isReadOnlyProfile ? '?readonly=true' : '';
    navigate(`/users/${deck.metadata.userId}/decks/${deck.metadata.id}${suffix}`, {
      state: buildDeckEditorNavigateState(deckSelectionReturnPath),
    });
  };

  const canFavorite = Boolean(viewerId) && !isGuest;

  const openReadonly = (deck: DeckListItem) =>
    navigate(`/users/${deck.metadata.userId}/decks/${deck.metadata.id}?readonly=true`, {
      state: buildDeckEditorNavigateState(deckSelectionReturnPath),
    });
  const openProfile = (deck: DeckListItem) =>
    navigate(`/users/${deck.metadata.userId}/decks`);

  // Mobile community/tournament tab: optimistic heart on the active list.
  const toggleListFavorite = (deck: DeckListItem) => {
    const key = tab === 'tournament' ? TOURNAMENT_KEY : COMMUNITY_FEED_KEY(communitySearch);
    const next = !deck.metadata.isFavorited;
    queryClient.setQueryData<DeckListItem[]>(key, (prev) =>
      (prev ?? []).map((d) =>
        d.metadata.id === deck.metadata.id
          ? { ...d, metadata: { ...d.metadata, isFavorited: next } }
          : d,
      ),
    );
    favoriteToggle.mutate({ deckId: deck.metadata.id, next });
  };
  // Mobile favorites tab: unfavorite removes the tile.
  const removeListFavorite = (deck: DeckListItem) => {
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

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !newName.trim()) return;
    setBusy(true);
    setCreateError(null);
    try {
      const created = await createDeck(
        {
          name: newName.trim(),
          description: newDesc.trim() || undefined,
          ...(isGuest ? {} : { is_private: newDeckPrivate }),
        },
        isGuest,
      );
      await queryClient.invalidateQueries({ queryKey: ['decks', 'mine', ownerId] });
      const targetUser = created.userId || user?.id || ownerId;
      navigate(`/users/${targetUser}/decks/${created.id}`, {
        state: buildDeckEditorNavigateState(deckSelectionReturnPath),
      });
    } catch (err) {
      setCreateError((err as Error)?.message || 'Could not create deck');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (deck: DeckListItem) => {
    if (!window.confirm(`Delete "${deck.metadata.name}"? This cannot be undone.`)) return;
    try {
      await deleteDeck(deck.metadata.id, isGuest);
      setMenuDeck(null);
      await queryClient.invalidateQueries({ queryKey: ['decks', 'mine', ownerId] });
    } catch (err) {
      window.alert((err as Error)?.message || 'Could not delete deck');
    }
  };

  const handleImportSuccess = async (deckId: string, userId: string) => {
    setImportOpen(false);
    await queryClient.invalidateQueries({ queryKey: ['decks', 'mine', ownerId] });
    navigate(`/users/${userId}/decks/${deckId}`, {
      state: buildDeckEditorNavigateState(deckSelectionReturnPath),
    });
  };

  if (isReadOnlyProfile) {
    const profileTitle = profileOwnerName ? `${profileOwnerName}'s Decks` : 'Public Decks';
    return (
      <div className="dsel">
        <div className="dsel__inner">
          <header className="dsel__header">
            <div>
              <h1 className="dsel__title"><IconDecks /> {profileTitle}</h1>
              <div className="dsel__stats">
                <span><strong>{decks.length}</strong> public decks</span>
              </div>
            </div>
          </header>

          {decksQuery.isLoading ? (
            <LoadingState label="Loading decks..." />
          ) : decksQuery.isError ? (
            <EmptyState variant="error" title="Couldn't load decks" message="Please try again." icon={<IconDecks />} />
          ) : decks.length === 0 ? (
            <EmptyState
              title="No public decks yet"
              message="This user has no public decks yet."
              icon={<IconDecks />}
            />
          ) : (
            <div className="dsel__grid">
              {decks.map((deck) => (
                <DeckTile
                  key={deck.metadata.id}
                  deck={deck}
                  variant="full"
                  maxStats={deckMaxStats(deck)}
                  missionSetName={deckMissionSetLabel(deck)}
                  onOpen={() => openDeck(deck)}
                  onToggleFavorite={
                    canFavorite ? () => handleToggleFavorite(deck) : undefined
                  }
                  isFavorited={Boolean(deck.metadata.isFavorited)}
                  favoriteBusy={favoriteToggle.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const tabTitle =
    tab === 'mine' ? (
      <><IconDecks /> {isGuest ? 'Guest Decks' : 'My Decks'}</>
    ) : tab === 'favorites' ? (
      <><IconHeart filled /> Favorites</>
    ) : tab === 'community' ? (
      <><IconUsers /> Community</>
    ) : tab === 'preconstructed' ? (
      <><IconCards /> Preconstructed</>
    ) : (
      <><IconTrophy /> Tournament</>
    );

  const communityDecks = communityFeedQuery.data ?? [];
  const favoriteDecks = favoritesQuery.data ?? [];
  const preconstructedGroups = preconstructedQuery.data ?? [];
  const tournamentDecks = tournamentQuery.data ?? [];

  return (
    <div className="dsel" ref={swipeRef}>
      <div className="dsel__inner">
        <header className="dsel__header">
          <div>
            <h1 className="dsel__title">{tabTitle}</h1>
            {tab === 'mine' ? (
              <div className="dsel__stats">
                <span><strong>{decks.length}</strong> decks</span>
                {isGuest ? <span className="dsel__guest-note">Stored for this session</span> : null}
              </div>
            ) : null}
          </div>
          {tab === 'mine' ? (
            <div className="dsel__actions">
              <input
                type="search"
                className="dsel__search"
                placeholder="Search decks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search decks"
              />
              <div className="dsel__action-buttons">
                <button
                  type="button"
                  className={`btn btn-ghost${importOpen ? ' is-active' : ''}`}
                  onClick={() => setImportOpen(true)}
                >
                  <IconImport /> Import Deck
                </button>
                <button type="button" className="btn btn-primary" onClick={openCreatePanel}>
                  <IconPlus /> New Deck
                </button>
              </div>
            </div>
          ) : tab === 'community' ? (
            <form
              className="dsel__community-search"
              role="search"
              onSubmit={(e: FormEvent) => e.preventDefault()}
            >
              <IconSearch />
              <input
                type="search"
                placeholder="Search deck names, users, characters, or locations"
                value={communitySearchInput}
                onChange={(e) => setCommunitySearchInput(e.target.value)}
                aria-label="Search community decks by deck name, user, character, or location"
              />
            </form>
          ) : null}
        </header>

        {showTabs ? (
          <div className="dsel__tabs" ref={tabStripRef} role="tablist" aria-label="Deck collections">
            {DECK_SELECTION_TAB_ORDER.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                data-dsel-tab={t}
                className={`dsel__tab ${tab === t ? 'is-active' : ''}`}
                onClick={() => setActiveTab(t)}
              >
                {DECK_TAB_LABELS[t]}
              </button>
            ))}
          </div>
        ) : null}

        {tab === 'mine' ? (
          decksQuery.isLoading ? (
            <LoadingState label="Loading decks..." />
          ) : decksQuery.isError ? (
            <EmptyState variant="error" title="Couldn't load decks" message="Please try again." icon={<IconDecks />} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={search ? 'No decks match' : 'No decks yet'}
              message={search ? 'Try a different search.' : 'Create your first deck to get started.'}
              icon={<IconDecks />}
              action={
                !search ? (
                  <div className="dsel__empty-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => setImportOpen(true)}>
                      <IconImport /> Import Deck
                    </button>
                    <button type="button" className="btn btn-primary" onClick={openCreatePanel}>
                      <IconPlus /> New Deck
                    </button>
                  </div>
                ) : null
              }
            />
          ) : (
            <div className="dsel__grid">
              {filtered.map((deck) => (
                <DeckTile
                  key={deck.metadata.id}
                  deck={deck}
                  variant="full"
                  maxStats={deckMaxStats(deck)}
                  missionSetName={deckMissionSetLabel(deck)}
                  showVisibility={!isGuest}
                  onOpen={() => openDeck(deck)}
                  onMenu={() => setMenuDeck(deck)}
                />
              ))}
            </div>
          )
        ) : tab === 'favorites' ? (
          !canFavorite ? (
            <EmptyState title="Favorites" message="Log in to favorite community decks." icon={<IconHeart />} />
          ) : favoritesQuery.isLoading ? (
            <LoadingState label="Loading favorites..." />
          ) : favoritesQuery.isError ? (
            <EmptyState variant="error" title="Couldn't load favorites" message="Please try again." icon={<IconHeart />} />
          ) : favoriteDecks.length === 0 ? (
            <EmptyState title="No favorites yet" message="Tap the heart on any community deck to save it here." icon={<IconHeart />} />
          ) : (
            <CommunityDeckGrid
              className="dsel__grid"
              decks={favoriteDecks}
              characters={charactersQuery.data}
              locations={locationsQuery.data}
              battlegrounds={battlegroundsQuery.data}
              missions={missionsQuery.data}
              viewerId={viewerId}
              canFavorite={canFavorite}
              favoriteBusy={favoriteToggle.isPending}
              onToggleFavorite={removeListFavorite}
              favoriteFilled
              onOpen={openReadonly}
              onOwnerClick={openProfile}
            />
          )
        ) : tab === 'community' ? (
          communityFeedQuery.isLoading ? (
            <LoadingState label="Loading decks..." />
          ) : communityFeedQuery.isError ? (
            <EmptyState variant="error" title="Couldn't load decks" message="Please try again." icon={<IconUsers />} />
          ) : communityDecks.length === 0 ? (
            <EmptyState
              title={communitySearch ? 'No decks match' : 'Nothing here yet'}
              message={communitySearch ? 'Try a different deck, username, character, or location.' : 'Public decks will appear here as they are shared.'}
              icon={<IconUsers />}
            />
          ) : (
            <CommunityDeckGrid
              className="dsel__grid"
              decks={communityDecks}
              characters={charactersQuery.data}
              locations={locationsQuery.data}
              battlegrounds={battlegroundsQuery.data}
              missions={missionsQuery.data}
              viewerId={viewerId}
              canFavorite={canFavorite}
              favoriteBusy={favoriteToggle.isPending}
              onToggleFavorite={toggleListFavorite}
              onOpen={openReadonly}
              onOwnerClick={openProfile}
            />
          )
        ) : tab === 'preconstructed' ? (
          preconstructedQuery.isLoading ? (
            <LoadingState label="Loading preconstructed decks..." />
          ) : preconstructedQuery.isError ? (
            <EmptyState variant="error" title="Couldn't load decks" message="Please try again." icon={<IconCards />} />
          ) : preconstructedGroups.length === 0 ? (
            <EmptyState title="Nothing here yet" message="Preconstructed decks will appear here as sets are added." icon={<IconCards />} />
          ) : (
            <div className="dsel__preconstructed">
              {preconstructedGroups.map((group) => (
                <section className="dsel__preconstructed-set" key={group.setCode}>
                  <h2 className="dsel__preconstructed-label">{group.setName}</h2>
                  <CommunityDeckGrid
                    className="dsel__preconstructed-grid"
                    decks={group.decks}
                    characters={charactersQuery.data}
                    locations={locationsQuery.data}
                    battlegrounds={battlegroundsQuery.data}
                    missions={missionsQuery.data}
                    viewerId={viewerId}
                    canFavorite={canFavorite}
                    favoriteBusy={favoriteToggle.isPending}
                    onToggleFavorite={togglePreconstructedFavorite}
                    onOpen={openReadonly}
                    onOwnerClick={openProfile}
                    showOwner={false}
                    showUpdated={false}
                    showLegality={false}
                  />
                  {group.featuredUpgradeRecommendations.length > 0 ? (
                    <div className="dsel__preconstructed-subsection">
                      <h3 className="dsel__preconstructed-subsection-label">
                        Featured Precon Upgrade Recommendations
                      </h3>
                      <CommunityDeckGrid
                        className="dsel__preconstructed-grid"
                        decks={group.featuredUpgradeRecommendations}
                        characters={charactersQuery.data}
                        locations={locationsQuery.data}
                        battlegrounds={battlegroundsQuery.data}
                        missions={missionsQuery.data}
                        viewerId={viewerId}
                        canFavorite={canFavorite}
                        favoriteBusy={favoriteToggle.isPending}
                        onToggleFavorite={togglePreconstructedFavorite}
                        onOpen={openReadonly}
                        onOwnerClick={openProfile}
                      />
                    </div>
                  ) : null}
                </section>
              ))}
            </div>
          )
        ) : tournamentQuery.isLoading ? (
          <LoadingState label="Loading decks..." />
        ) : tournamentQuery.isError ? (
          <EmptyState variant="error" title="Couldn't load decks" message="Please try again." icon={<IconTrophy />} />
        ) : tournamentDecks.length === 0 ? (
          <EmptyState title="Nothing here yet" message="Tournament-winning decks will appear here as they are added." icon={<IconTrophy />} />
        ) : (
          <CommunityDeckGrid
            className="dsel__grid"
            decks={tournamentDecks}
            characters={charactersQuery.data}
            locations={locationsQuery.data}
            battlegrounds={battlegroundsQuery.data}
            missions={missionsQuery.data}
            viewerId={viewerId}
            canFavorite={canFavorite}
            favoriteBusy={favoriteToggle.isPending}
            onToggleFavorite={toggleListFavorite}
            onOpen={openReadonly}
            onOwnerClick={openProfile}
          />
        )}
      </div>

      {/* Create deck panel */}
      <SlideOutPanel open={createOpen} onClose={() => setCreateOpen(false)} title="New Deck" ariaLabel="Create a deck" width={400}>
        <form className="dsel__form" onSubmit={handleCreate}>
          <label className="dsel__field">
            <span>Deck name</span>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Cosmic Beatdown" maxLength={100} required autoFocus />
          </label>
          <label className="dsel__field">
            <span>Description (optional)</span>
            <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What's the game plan?" maxLength={500} rows={4} />
          </label>
          {!isGuest ? (
            <fieldset className="dsel__visibility-field">
              <legend>Visibility</legend>
              <div className="dsel__visibility-options">
                <label className={`dsel__visibility-option${newDeckPrivate ? ' is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="new-deck-visibility"
                    value="private"
                    checked={newDeckPrivate}
                    onChange={() => setNewDeckPrivate(true)}
                  />
                  <span>
                    <strong>Unlisted</strong>
                    <small>Hidden from Community. Anyone with its link can view it.</small>
                  </span>
                </label>
                <label className={`dsel__visibility-option${!newDeckPrivate ? ' is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="new-deck-visibility"
                    value="public"
                    checked={!newDeckPrivate}
                    onChange={() => setNewDeckPrivate(false)}
                  />
                  <span>
                    <strong>Public</strong>
                    <small>Eligible for Community when legal.</small>
                  </span>
                </label>
              </div>
            </fieldset>
          ) : null}
          {createError ? <div className="dsel__error" role="alert">{createError}</div> : null}
          <div className="dsel__form-footer">
            <button
              type="submit"
              className="btn btn-primary dsel__submit"
              disabled={busy || !newName.trim()}
            >
              {busy ? 'Creating...' : 'Create Deck'}
            </button>
          </div>
        </form>
      </SlideOutPanel>

      <ImportDeckPanel
        open={importOpen}
        isGuest={isGuest}
        onClose={() => setImportOpen(false)}
        onSuccess={handleImportSuccess}
      />

      {/* Deck actions panel */}
      <SlideOutPanel
        open={Boolean(menuDeck)}
        onClose={() => setMenuDeck(null)}
        title={menuDeck?.metadata.name}
        ariaLabel="Deck actions"
        width={360}
      >
        {menuDeck ? (
          <div className="dsel__menu">
            <button type="button" className="dsel__menu-item" onClick={() => openDeck(menuDeck)}>
              <IconEdit /> Open / Edit
            </button>
            <button type="button" className="dsel__menu-item" onClick={() => openReadonly(menuDeck)}>
              <IconPlay /> View (read-only)
            </button>
            <button
              type="button"
              className="dsel__menu-item"
              onClick={() => {
                setExportDeckId(menuDeck.metadata.id);
                setMenuDeck(null);
              }}
            >
              <IconExport /> Export deck
            </button>
            {!isGuest || menuDeck.metadata.id.startsWith('guest_') ? (
              <button type="button" className="dsel__menu-item dsel__menu-item--danger" onClick={() => handleDelete(menuDeck)}>
                <IconTrash /> Delete deck
              </button>
            ) : null}
          </div>
        ) : null}
      </SlideOutPanel>

      {exportDeckId ? (
        <ExportDeckPanel
          open
          input={exportDeckInput ?? createStubDeckExportInput(user?.username ?? 'Guest')}
          loading={exportLoading || !exportDeckInput}
          onClose={() => setExportDeckId(null)}
        />
      ) : null}
    </div>
  );
}

import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CardDetailPanel } from '../../components/CardDetailPanel';
import { ColumbusDashboardGrid, DashboardRail, DashboardRailItem } from '../../components/dashboard';
import { IconChevronRight, IconTrophy } from '../../components/icons';
import { TournamentHighlightTile } from '../../components/TournamentCharts';
import { fetchTournamentDecks } from '../../lib/api/decks';
import { fetchFoilCardMap } from '../../lib/api/catalog';
import type { CatalogCard, CatalogType } from '../../lib/api/types';
import { buildFoilCardMapLookup } from '../../lib/catalog/foilCatalog';
import { useAllCatalogCards } from '../../lib/catalog/useAllCatalogCards';
import { useCardDetailHistory } from '../../lib/layout/useCardDetailHistory';
import { buildDeckEditorNavigateState } from '../../lib/navigation/deckEditorReturn';
import { buildColumbusTileById, HOME_CHART_LIMIT } from '../../lib/tournaments/buildColumbusStatsTiles';
import {
  COLUMBUS_TILE_ORDER,
  getPlacementForTile,
  type ColumbusDashboardTileId,
} from '../../lib/tournaments/columbusDashboardLayout';
import {
  buildRegionalEventPath,
  FEATURED_TOURNAMENT_ID,
  getTournamentPost,
  type RegionalTournamentDefinition,
} from '../../lib/tournaments/regionalTournaments';
import { combineTournamentStats } from '../../lib/tournaments/combineTournamentStats';
import { resolveTournamentCard, isTournamentCardClickable } from '../../lib/tournaments/resolveTournamentCard';
import { resolveTournamentPodiumDecks } from '../../lib/tournaments/tournamentPodiumDecks';
import type { CountEntry, HomebaseCountEntry, SpotlightEntry } from '../../lib/tournaments/types';
import './TournamentStatsRail.css';

const HOME_TILE_ORDER: ColumbusDashboardTileId[] = COLUMBUS_TILE_ORDER;
interface TournamentStatsRailProps {
  /** When true, show full event dashboards on the 12-column grid. */
  expanded?: boolean;
  /** Tournament post ID. Home defaults to the combined Seattle Weekend post. */
  tournamentId?: string;
}

function getHiddenTileIds(tournament: RegionalTournamentDefinition): ColumbusDashboardTileId[] {
  return tournament.unavailableStats ?? [];
}

function getSeattleTilePrefix(tournament: RegionalTournamentDefinition): string | undefined {
  if (tournament.id === 's1-seattle-regional') return 'Regional';
  if (tournament.id === 's1-seattle-naol') return 'NAOL';
  return undefined;
}

export function TournamentStatsRail({
  expanded = false,
  tournamentId = FEATURED_TOURNAMENT_ID,
}: TournamentStatsRailProps) {
  const post = getTournamentPost(tournamentId);
  const navigate = useNavigate();
  const { cards: allCards } = useAllCatalogCards();
  const tournamentQuery = useQuery({
    queryKey: ['decks', 'tournament'],
    queryFn: () => fetchTournamentDecks(),
    staleTime: 10 * 60 * 1000,
    enabled: expanded,
  });
  const podiumEntriesByEvent = useMemo(
    () => new Map(
      post.events.map((event) => [
        event.id,
        resolveTournamentPodiumDecks(tournamentQuery.data ?? [], event),
      ]),
    ),
    [post.events, tournamentQuery.data],
  );
  const displayStats = useMemo(
    () => combineTournamentStats({
      id: post.id,
      title: post.title,
      subtitle: post.subtitle,
      events: post.events.map((event) => ({
        label: getSeattleTilePrefix(event) ?? event.stats.meta.title,
        stats: event.stats,
        ...(event.unavailableStats ? { unavailableStats: event.unavailableStats } : {}),
      })),
    }),
    [post],
  );
  const displayTournament = useMemo<RegionalTournamentDefinition>(
    () => ({
      ...post.events[0],
      id: post.id,
      selectorLabel: post.selectorLabel,
      deckNameLabel: post.title,
      stats: displayStats,
      podium: [],
      stableDeckIds: undefined,
      stableDeckUserId: undefined,
      unavailableStats: undefined,
    }),
    [displayStats, post],
  );
  const foilMapQuery = useQuery({
    queryKey: ['foil-card-map'],
    queryFn: () => fetchFoilCardMap(),
    staleTime: 60 * 60 * 1000,
  });
  const foilLookup = useMemo(
    () => buildFoilCardMapLookup(foilMapQuery.data ?? []),
    [foilMapQuery.data],
  );
  const [selected, setSelected] = useState<CatalogCard | null>(null);
  const [selectedCatalogType, setSelectedCatalogType] = useState<CatalogType>('characters');
  const { close: closeCardDetail } = useCardDetailHistory(Boolean(selected), () => setSelected(null));

  const openEntry = useCallback(
    (entry: { name: string; catalogType: CatalogType }) => {
      const hit = resolveTournamentCard(allCards, entry.name, entry.catalogType, { foilLookup });
      if (!hit) return;
      setSelected(hit.card);
      setSelectedCatalogType(hit.catalogType);
    },
    [allCards, foilLookup],
  );

  const isClickable = useCallback(
    (entry: CountEntry) => isTournamentCardClickable(allCards, entry.name, entry.catalogType),
    [allCards],
  );

  const resolveCard = useCallback(
    (entry: CountEntry) =>
      resolveTournamentCard(allCards, entry.name, entry.catalogType, { foilLookup })?.card ?? null,
    [allCards, foilLookup],
  );

  const openPodiumDeck = useCallback(
    (deckId: string, userId: string) => {
      navigate(`/users/${userId}/decks/${deckId}?readonly=true`, {
        state: buildDeckEditorNavigateState(buildRegionalEventPath(post.id)),
      });
    },
    [navigate, post.id],
  );

  const buildTileOptions = (
    tournament: RegionalTournamentDefinition,
    eventSubtitle?: string,
    summarySlides = post.events.length > 1
      ? post.events.map((event) => ({
          id: event.id,
          label: getSeattleTilePrefix(event) ?? event.stats.meta.title,
          meta: event.stats.meta,
          podiumEntries: expanded ? podiumEntriesByEvent.get(event.id) : undefined,
        }))
      : undefined,
  ) => {
    const stats = tournament.stats;
    const charFootnote = !expanded && stats.characterAppearances.length > HOME_CHART_LIMIT
      ? `+${stats.characterAppearances.length - HOME_CHART_LIMIT} more characters`
      : undefined;
    const homebaseTooltip = (entry: CountEntry) => {
      const homebase = stats.topHomebases.find((item: HomebaseCountEntry) => item.name === entry.name);
      return homebase
        ? [`Top 8: ${homebase.top8}`, `Top 3: ${homebase.top3}`, `Wins: ${homebase.wins}`]
        : undefined;
    };
    const renderSpotlight = (spot: SpotlightEntry | null, key: string) => {
      if (!spot) return null;
      const hit = resolveTournamentCard(allCards, spot.name, spot.catalogType, { foilLookup });
      const placement = expanded
        ? getPlacementForTile(key as typeof COLUMBUS_TILE_ORDER[number])
        : null;

      return (
        <TournamentHighlightTile
          key={`${tournament.id}-${key}`}
          variant={placement?.tileVariant ?? 'rail'}
          label={spot.label}
          eventSubtitle={eventSubtitle}
          detail={spot.detail}
          cardName={spot.name}
          card={hit?.card ?? null}
          catalogType={spot.catalogType}
          onClick={hit ? () => openEntry(spot) : undefined}
        />
      );
    };

    return {
      stats,
      expanded,
      charFootnote,
      homebaseTooltip,
      openEntry,
      isClickable,
      resolveCard,
      renderSpotlight,
      podiumEntries: expanded ? podiumEntriesByEvent.get(tournament.id) : undefined,
      summarySlides,
      onOpenPodiumDeck: expanded ? openPodiumDeck : undefined,
      eventSubtitle,
      showWinnerWithPodium: expanded,
    };
  };

  const cardPanel = (
    <CardDetailPanel
      card={selected}
      type={selected ? selectedCatalogType : null}
      open={Boolean(selected)}
      onClose={closeCardDetail}
    />
  );

  if (expanded) {
    const tileBuildOptions = buildTileOptions(displayTournament);
    return (
      <>
        <section
          className="tournament-event-dashboard"
          aria-labelledby={`${post.id}-dashboard-title`}
        >
          {post.events.length > 1 ? (
            <header className="tournament-event-dashboard__head">
              <p className="tournament-data__eyebrow">{post.title}</p>
              <h2 id={`${post.id}-dashboard-title`}>Combined Regional + NAOL</h2>
            </header>
          ) : (
            <h2 id={`${post.id}-dashboard-title`} className="sr-only">
              {displayTournament.stats.meta.title}
            </h2>
          )}
          <ColumbusDashboardGrid
            hiddenTileIds={getHiddenTileIds(displayTournament)}
            renderTile={(id) => {
              const placement = getPlacementForTile(id);
              return buildColumbusTileById(id, {
                ...tileBuildOptions,
                tileVariant: placement.tileVariant,
              });
            }}
          />
        </section>
        {cardPanel}
      </>
    );
  }

  const hiddenTiles = new Set(getHiddenTileIds(displayTournament));
  const tileBuildOptions = buildTileOptions(displayTournament);
  const railTiles = HOME_TILE_ORDER
    .filter((id) => !hiddenTiles.has(id))
    .map((id) => (
      <DashboardRailItem key={`${displayTournament.id}-${id}`}>
        {buildColumbusTileById(id, tileBuildOptions)}
      </DashboardRailItem>
    ));

  return (
    <section className="home__section">
      <header className="home__section-head">
        <h2 className="home__section-title">
          <span className="home__section-icon"><IconTrophy /></span>
          {post.title}
        </h2>
        <Link className="home__view-all" to={buildRegionalEventPath(post.id)}>
          View All <IconChevronRight />
        </Link>
      </header>
      <DashboardRail>{railTiles}</DashboardRail>
      {cardPanel}
    </section>
  );
}

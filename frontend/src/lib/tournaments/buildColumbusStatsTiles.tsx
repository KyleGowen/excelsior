import type { ReactNode } from 'react';
import type { CatalogCard } from '../../lib/api/types';
import type { CountEntry, SpotlightEntry, TournamentEventStats } from '../../lib/tournaments/types';
import type { DashboardTileVariant } from '../../components/dashboard';
import type { ColumbusDashboardTileId } from './columbusDashboardLayout';
import type { TournamentPodiumDeckEntry } from './tournamentPodiumDecks';
import {
  StatsChartTile,
  TournamentBarChart,
  TournamentCharacterListTile,
  TournamentPlacardCarouselTile,
  TournamentPieChart,
  TournamentSummaryTile,
  type TournamentPlacardSlide,
} from '../../components/TournamentCharts';

const HOME_CHART_LIMIT = 5;
const RAIL_BAR_MAX_ROWS = 5;

export interface BuildColumbusTilesOptions {
  stats: TournamentEventStats;
  expanded: boolean;
  tileVariant?: DashboardTileVariant;
  tileId?: ColumbusDashboardTileId;
  charFootnote?: string;
  homebaseTooltip: (entry: CountEntry) => string[] | undefined;
  openEntry: (entry: CountEntry) => void;
  isClickable: (entry: CountEntry) => boolean;
  resolveCard: (entry: CountEntry) => CatalogCard | null;
  renderSpotlight: (spot: SpotlightEntry | null, key: string) => ReactNode;
  podiumEntries?: TournamentPodiumDeckEntry[];
  summarySlides?: TournamentPlacardSlide[];
  onOpenPodiumDeck?: (deckId: string, userId: string) => void;
  eventSubtitle?: string;
  showWinnerWithPodium?: boolean;
}

function resolveVariant(
  expanded: boolean,
  tileVariant?: DashboardTileVariant,
): DashboardTileVariant {
  return tileVariant ?? (expanded ? 'md' : 'rail');
}

export function buildColumbusTileById(
  id: ColumbusDashboardTileId,
  options: BuildColumbusTilesOptions,
): ReactNode {
  const {
    stats,
    expanded,
    tileVariant,
    charFootnote,
    homebaseTooltip,
    openEntry,
    isClickable,
    resolveCard,
    renderSpotlight,
    podiumEntries,
    summarySlides,
    onOpenPodiumDeck,
    eventSubtitle,
    showWinnerWithPodium,
  } = options;

  const variant = resolveVariant(expanded, tileVariant);
  const limit = expanded ? undefined : HOME_CHART_LIMIT;
  const barMaxRows = expanded ? 12 : RAIL_BAR_MAX_ROWS;
  const chartCompact = variant === 'rail';
  switch (id) {
    case 'meta':
      if (summarySlides && summarySlides.length > 1) {
        return (
          <TournamentPlacardCarouselTile
            slides={summarySlides}
            variant={variant}
            onOpenPodiumDeck={onOpenPodiumDeck}
            showWinnerWithPodium={showWinnerWithPodium}
          />
        );
      }
      return (
        <TournamentSummaryTile
          meta={stats.meta}
          variant={variant}
          podiumEntries={podiumEntries}
          onOpenPodiumDeck={onOpenPodiumDeck}
          showWinnerWithPodium={showWinnerWithPodium}
        />
      );

    case 'characterAppearances':
      return (
        <StatsChartTile
          variant={variant}
          title="Character Appearances"
          eventSubtitle={eventSubtitle}
          subtitle="Front line + reserve"
          footnote={charFootnote}
        >
          <TournamentBarChart
            data={stats.characterAppearances}
            limit={limit}
            compact={chartCompact}
            fillContainer
            maxRows={barMaxRows}
            tileVariant={variant}
            onSegmentClick={openEntry}
            isClickable={isClickable}
          />
        </StatsChartTile>
      );

    case 'top8Characters':
      return (
        <StatsChartTile
          variant={variant}
          title="Top 8 Characters"
          eventSubtitle={eventSubtitle}
          subtitle="Finishing decks 1st–8th"
        >
          <TournamentBarChart
            data={stats.top8CharacterAppearances}
            limit={limit}
            compact={chartCompact}
            fillContainer
            maxRows={barMaxRows}
            tileVariant={variant}
            onSegmentClick={openEntry}
            isClickable={isClickable}
          />
        </StatsChartTile>
      );

    case 'mostPlaysWithoutTop8':
      return renderSpotlight(stats.mostPlaysWithoutTop8, 'mostPlaysWithoutTop8');

    case 'highestTop8Rate':
      return renderSpotlight(stats.highestTop8Rate, 'highestTop8Rate');

    case 'newWinningCharacters':
      return (
        <TournamentCharacterListTile
          variant={variant}
          title="New Winning Characters"
          eventSubtitle={eventSubtitle}
          entries={stats.newWinningCharacters}
          onEntryClick={openEntry}
          resolveCard={resolveCard}
          isClickable={isClickable}
        />
      );

    case 'newTop8Characters':
      return (
        <TournamentCharacterListTile
          variant={variant}
          title="New Top 8 Characters"
          eventSubtitle={eventSubtitle}
          entries={stats.newTop8Characters}
          onEntryClick={openEntry}
          resolveCard={resolveCard}
          isClickable={isClickable}
        />
      );

    case 'topReservists':
      return (
        <StatsChartTile variant={variant} title="Top Reservists" eventSubtitle={eventSubtitle}>
          <TournamentBarChart
            data={stats.topReserves}
            limit={limit}
            compact={chartCompact}
            fillContainer
            maxRows={barMaxRows}
            tileVariant={variant}
            onSegmentClick={openEntry}
            isClickable={isClickable}
          />
        </StatsChartTile>
      );

    case 'topHomebases':
      return (
        <StatsChartTile variant={variant} title="Top Homebases" eventSubtitle={eventSubtitle}>
          <TournamentBarChart
            data={stats.topHomebases}
            limit={expanded ? undefined : 5}
            compact={chartCompact}
            fillContainer
            maxRows={barMaxRows}
            tileVariant={variant}
            onSegmentClick={openEntry}
            isClickable={isClickable}
            tooltipExtra={homebaseTooltip}
          />
        </StatsChartTile>
      );

    case 'topBattlegrounds': {
      const data = stats.topBattlegrounds.map((entry) => ({
        ...entry,
        catalogType: 'characters' as const,
      }));
      return (
        <StatsChartTile
          variant={variant}
          title="Battlegrounds"
          eventSubtitle={eventSubtitle}
          subtitle={stats.battlegroundCoverageLabel ?? 'Includes unreported decks'}
        >
          <TournamentPieChart
            data={data}
            compact={chartCompact}
            fillContainer
            showLegend={expanded}
            tileVariant={variant}
            isClickable={() => false}
          />
        </StatsChartTile>
      );
    }

    case 'topCataclysms':
      return (
        <StatsChartTile
          variant={variant}
          title="Top Cataclysms"
          eventSubtitle={eventSubtitle}
          subtitle={`${stats.cataclysmReportedCount} of ${stats.meta.playerCount} decks reported`}
        >
          {stats.topCataclysms.length > 0 ? (
            <TournamentPieChart
              data={stats.topCataclysms}
              compact={chartCompact}
              fillContainer
              showLegend={expanded}
              tileVariant={variant}
              onSegmentClick={openEntry}
              isClickable={isClickable}
            />
          ) : (
            <div className="tournament-chart-empty" role="status">
              <strong className="tournament-chart-empty__title">No cataclysms reported</strong>
              <span className="tournament-chart-empty__detail">
                This event’s source lists every selection as unreported.
              </span>
            </div>
          )}
        </StatsChartTile>
      );

    default:
      return null;
  }
}

export { HOME_CHART_LIMIT, RAIL_BAR_MAX_ROWS };

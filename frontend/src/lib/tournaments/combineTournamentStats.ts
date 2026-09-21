import type {
  CountEntry,
  HomebaseCountEntry,
  SpotlightEntry,
  TournamentBreakdownEntry,
  TournamentEventLocation,
  TournamentEventStats,
  TournamentUnavailableStat,
} from './types';
import { compareAlphabetically } from '../sort/alphabetical';

interface TournamentStatsSource {
  label: string;
  stats: TournamentEventStats;
  unavailableStats?: TournamentUnavailableStat[];
}

interface CombineTournamentStatsOptions {
  id: string;
  title: string;
  subtitle: string;
  events: TournamentStatsSource[];
}

function sumCountEntries(
  sources: TournamentStatsSource[],
  select: (stats: TournamentEventStats) => CountEntry[],
): CountEntry[] {
  const totals = new Map<string, CountEntry>();

  sources.forEach(({ stats }) => {
    select(stats).forEach((entry) => {
      const existing = totals.get(entry.name);
      totals.set(entry.name, {
        name: entry.name,
        catalogType: existing?.catalogType ?? entry.catalogType,
        count: (existing?.count ?? 0) + entry.count,
      });
    });
  });

  return [...totals.values()].sort(
    (a, b) => b.count - a.count || compareAlphabetically(a.name, b.name),
  );
}

function unionCountEntries(
  sources: TournamentStatsSource[],
  select: (stats: TournamentEventStats) => CountEntry[],
): CountEntry[] {
  const entries = new Map<string, CountEntry>();
  sources.forEach(({ stats }) => {
    select(stats).forEach((entry) => {
      if (!entries.has(entry.name)) entries.set(entry.name, { ...entry, count: 1 });
    });
  });
  return [...entries.values()].sort((a, b) => compareAlphabetically(a.name, b.name));
}

function sumHomebases(sources: TournamentStatsSource[]): HomebaseCountEntry[] {
  const totals = new Map<string, HomebaseCountEntry>();
  sources.forEach(({ stats }) => {
    stats.topHomebases.forEach((entry) => {
      const existing = totals.get(entry.name);
      totals.set(entry.name, {
        name: entry.name,
        catalogType: existing?.catalogType ?? entry.catalogType,
        count: (existing?.count ?? 0) + entry.count,
        top8: (existing?.top8 ?? 0) + entry.top8,
        top3: (existing?.top3 ?? 0) + entry.top3,
        wins: (existing?.wins ?? 0) + entry.wins,
      });
    });
  });
  return [...totals.values()].sort(
    (a, b) => b.count - a.count || compareAlphabetically(a.name, b.name),
  );
}

function sumBreakdownEntries(entries: TournamentBreakdownEntry[][]): TournamentBreakdownEntry[] {
  const totals = new Map<string, number>();
  entries.flat().forEach((entry) => {
    totals.set(entry.name, (totals.get(entry.name) ?? 0) + entry.count);
  });
  return [...totals.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || compareAlphabetically(a.name, b.name));
}

function computeSpotlights(
  appearances: CountEntry[],
  top8Appearances: CountEntry[],
): Pick<TournamentEventStats, 'mostPlaysWithoutTop8' | 'highestTop8Rate'> {
  const top8ByName = new Map(top8Appearances.map((entry) => [entry.name, entry.count]));
  const withoutTop8 = appearances
    .filter((entry) => !top8ByName.get(entry.name))
    .sort((a, b) => b.count - a.count || compareAlphabetically(a.name, b.name))[0];
  const mostPlaysWithoutTop8: SpotlightEntry | null = withoutTop8
    ? {
        name: withoutTop8.name,
        catalogType: withoutTop8.catalogType,
        totalPlays: withoutTop8.count,
        top8Plays: 0,
        label: 'Most plays w/o Top 8',
        detail: String(withoutTop8.count),
      }
    : null;

  const highest = appearances
    .filter((entry) => entry.count >= 3)
    .map((entry) => ({
      entry,
      top8: top8ByName.get(entry.name) ?? 0,
      rate: (top8ByName.get(entry.name) ?? 0) / entry.count,
    }))
    .sort((a, b) => (
      b.rate - a.rate
      || b.entry.count - a.entry.count
      || compareAlphabetically(a.entry.name, b.entry.name)
    ))[0];
  const highestTop8Rate: SpotlightEntry | null = highest
    ? {
        name: highest.entry.name,
        catalogType: highest.entry.catalogType,
        totalPlays: highest.entry.count,
        top8Plays: highest.top8,
        label: 'Highest Top 8 %',
        detail: `${highest.top8} of ${highest.entry.count} (${(highest.rate * 100).toFixed(1)}%)`,
      }
    : null;

  return { mostPlaysWithoutTop8, highestTop8Rate };
}

function sharedLocation(sources: TournamentStatsSource[]): TournamentEventLocation | undefined {
  const first = sources[0]?.stats.meta.location;
  if (!first) return undefined;
  const shared = sources.every(({ stats }) => (
    stats.meta.location?.city === first.city
    && stats.meta.location?.region === first.region
    && stats.meta.location?.country === first.country
  ));
  return shared ? first : undefined;
}

export function combineTournamentStats({
  id,
  title,
  subtitle,
  events,
}: CombineTournamentStatsOptions): TournamentEventStats {
  if (events.length === 0) throw new Error('Cannot combine a tournament post without events.');
  if (events.length === 1) return events[0].stats;

  const characterAppearances = sumCountEntries(events, (stats) => stats.characterAppearances);
  const top8CharacterAppearances = sumCountEntries(events, (stats) => stats.top8CharacterAppearances);
  const spotlights = computeSpotlights(characterAppearances, top8CharacterAppearances);
  const playerCount = events.reduce((sum, event) => sum + event.stats.meta.playerCount, 0);
  const dates = events.map((event) => event.stats.meta.date).sort();
  const winners = [...new Set(events.map((event) => event.stats.meta.winnerName))];
  const battlegroundSources = events.filter(
    (event) => !event.unavailableStats?.includes('topBattlegrounds'),
  );
  const cataclysmSources = events.filter(
    (event) => !event.unavailableStats?.includes('topCataclysms'),
  );
  const battlegroundDeckCount = battlegroundSources.reduce(
    (sum, event) => sum + event.stats.meta.playerCount,
    0,
  );
  const battlegroundCoverageLabel = battlegroundSources.length < events.length
    ? `${battlegroundSources.map((event) => event.label).join(' + ')} only · ${battlegroundDeckCount} of ${playerCount} decks`
    : undefined;
  const location = sharedLocation(events);

  return {
    meta: {
      id,
      title,
      subtitle,
      date: dates.at(-1) ?? dates[0],
      playerCount,
      winnerName: winners.join(' + '),
      seasonLabel: 'Season One Weekend',
      ...(location ? { location } : {}),
    },
    characterAppearances,
    top8CharacterAppearances,
    ...spotlights,
    newWinningCharacters: unionCountEntries(events, (stats) => stats.newWinningCharacters),
    newTop8Characters: unionCountEntries(events, (stats) => stats.newTop8Characters),
    topReserves: sumCountEntries(events, (stats) => stats.topReserves),
    topHomebases: sumHomebases(events),
    topBattlegrounds: sumBreakdownEntries(
      battlegroundSources.map((event) => event.stats.topBattlegrounds),
    ),
    ...(battlegroundCoverageLabel ? { battlegroundCoverageLabel } : {}),
    topCataclysms: sumCountEntries(cataclysmSources, (stats) => stats.topCataclysms),
    cataclysmReportedCount: cataclysmSources.reduce(
      (sum, event) => sum + event.stats.cataclysmReportedCount,
      0,
    ),
    deckRows: events.flatMap((event) => event.stats.deckRows),
  };
}

import columbusStats from '../../data/tournaments/s1-columbus.json';
import niagaraStats from '../../data/tournaments/s1-niagara.json';
import seattleNaolStats from '../../data/tournaments/s1-seattle-naol.json';
import seattleRegionalStats from '../../data/tournaments/s1-seattle-regional.json';
import type {
  TournamentEventStats,
  TournamentPodiumResult,
  TournamentUnavailableStat,
} from './types';

export const FEATURED_TOURNAMENT_ID = 's1-seattle-weekend' as const;
export const REGIONAL_TOURNAMENT_DECKS_USER_ID = '00000000-0000-0000-0000-000000000003';

export const COLUMBUS_PODIUM_DECK_IDS = {
  '1st': '81d73769-e987-4c85-a9f8-6629980a1807',
  '2nd': 'a6df76ba-c073-4e65-bc68-2046ee3919b1',
  '3rd': 'bb9a2144-9c15-4cb3-9c38-851e66972c74',
} as const;

export const NIAGARA_PODIUM_DECK_IDS = {
  '1st': '6fbe94b4-1fc6-439a-a771-b16ff35875b5',
  '2nd': '6cfb8b38-fa5a-45a2-bb15-ea6d8f7ed1b0',
} as const;

export const SEATTLE_REGIONAL_DECK_IDS = {
  '1st': 'cbc62305-c766-4b1d-a849-653d6da791c3',
  '2nd': '0a59c1e6-d522-42f1-ac80-8bfb863ea5cb',
  '6th': 'e65b02c8-357c-4f8d-92b4-833559860943',
} as const;

export const SEATTLE_NAOL_DECK_IDS = {
  '1st': '81cba5c5-3299-45be-98f8-49476f305a5b',
  '2nd': '584673bb-d8d8-4ba1-9d67-f371389e2272',
  '8th': '84ad51c3-2177-4128-a202-a78f3ac8a62a',
} as const;

export interface RegionalTournamentDefinition {
  id: string;
  selectorLabel: string;
  deckNameLabel: string;
  deckTitleSeries?: string;
  stats: TournamentEventStats;
  podium: TournamentPodiumResult[];
  stableDeckIds?: Partial<Record<TournamentPodiumResult['placement'], string>>;
  stableDeckUserId?: string;
  unavailableStats?: TournamentUnavailableStat[];
}

export interface TournamentPostDefinition {
  id: string;
  selectorLabel: string;
  title: string;
  subtitle: string;
  events: RegionalTournamentDefinition[];
}

export const REGIONAL_TOURNAMENTS: RegionalTournamentDefinition[] = [
  {
    id: 's1-seattle-regional',
    selectorLabel: 'Seattle Regional — Sep 2026',
    deckNameLabel: 'Seattle',
    stats: seattleRegionalStats as TournamentEventStats,
    podium: [
      { placement: '1st', playerName: 'Andrew Taylor' },
      { placement: '2nd', playerName: 'Charlie Hanford' },
      { placement: '6th', playerName: 'Anthony Anzalone' },
    ],
    stableDeckIds: SEATTLE_REGIONAL_DECK_IDS,
    stableDeckUserId: REGIONAL_TOURNAMENT_DECKS_USER_ID,
  },
  {
    id: 's1-seattle-naol',
    selectorLabel: 'Seattle NAOL — Sep 2026',
    deckNameLabel: 'Seattle',
    deckTitleSeries: 'S1 NAOL Majors',
    stats: seattleNaolStats as TournamentEventStats,
    podium: [
      { placement: '1st', playerName: 'Andrew Taylor' },
      { placement: '2nd', playerName: 'Josh Alexander' },
      { placement: '8th', playerName: 'Charlie Hanford' },
    ],
    stableDeckIds: SEATTLE_NAOL_DECK_IDS,
    stableDeckUserId: REGIONAL_TOURNAMENT_DECKS_USER_ID,
    unavailableStats: ['topBattlegrounds', 'topCataclysms'],
  },
  {
    id: 's1-niagara',
    selectorLabel: 'Niagara Regional — Aug 2026',
    deckNameLabel: 'Niagara',
    stats: niagaraStats as TournamentEventStats,
    podium: [
      { placement: '1st', playerName: 'Jessica Simms' },
      { placement: '2nd', playerName: 'Justin Sadaie' },
      { placement: '3rd', playerName: 'Sean Ballantyne' },
    ],
    stableDeckIds: NIAGARA_PODIUM_DECK_IDS,
    stableDeckUserId: REGIONAL_TOURNAMENT_DECKS_USER_ID,
  },
  {
    id: 's1-columbus',
    selectorLabel: 'Columbus Regional — Jun 2026',
    deckNameLabel: 'Columbus',
    stats: columbusStats as TournamentEventStats,
    podium: [
      { placement: '1st', playerName: 'Justin Sadaie' },
      { placement: '2nd', playerName: 'Noor El-barrad' },
      { placement: '3rd', playerName: 'Charlie Hanford' },
    ],
    stableDeckIds: COLUMBUS_PODIUM_DECK_IDS,
    stableDeckUserId: REGIONAL_TOURNAMENT_DECKS_USER_ID,
  },
];

const seattleRegional = REGIONAL_TOURNAMENTS.find((event) => event.id === 's1-seattle-regional')!;
const seattleNaol = REGIONAL_TOURNAMENTS.find((event) => event.id === 's1-seattle-naol')!;
const niagara = REGIONAL_TOURNAMENTS.find((event) => event.id === 's1-niagara')!;
const columbus = REGIONAL_TOURNAMENTS.find((event) => event.id === 's1-columbus')!;

/** Selector entries are editorial posts. Seattle intentionally contains two distinct event datasets. */
export const TOURNAMENT_POSTS: TournamentPostDefinition[] = [
  {
    id: FEATURED_TOURNAMENT_ID,
    selectorLabel: 'Seattle Weekend — Sep 2026',
    title: 'Seattle Weekend',
    subtitle: 'September 5–6, 2026 · 68 decks across two events',
    events: [seattleRegional, seattleNaol],
  },
  {
    id: niagara.id,
    selectorLabel: niagara.selectorLabel,
    title: niagara.stats.meta.title,
    subtitle: `${niagara.stats.meta.subtitle} · ${niagara.stats.meta.playerCount} players`,
    events: [niagara],
  },
  {
    id: columbus.id,
    selectorLabel: columbus.selectorLabel,
    title: columbus.stats.meta.title,
    subtitle: `${columbus.stats.meta.subtitle} · ${columbus.stats.meta.playerCount} players`,
    events: [columbus],
  },
];

export function getRegionalTournament(id: string | null | undefined): RegionalTournamentDefinition {
  return REGIONAL_TOURNAMENTS.find((tournament) => tournament.id === id)
    ?? seattleNaol;
}

export function getTournamentPost(id: string | null | undefined): TournamentPostDefinition {
  const normalizedId = id === 's1-seattle-regional' || id === 's1-seattle-naol'
    ? FEATURED_TOURNAMENT_ID
    : id;

  return TOURNAMENT_POSTS.find((post) => post.id === normalizedId)
    ?? TOURNAMENT_POSTS[0];
}

export function buildRegionalEventPath(id: string): string {
  return `/home/regionals?event=${encodeURIComponent(id)}`;
}

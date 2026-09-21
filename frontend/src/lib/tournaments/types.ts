import type { CatalogType } from '../api/types';

/** Single ranked row in a regional decklist sheet. */
export interface RegionalDeckRow {
  rank: number;
  player: string;
  wins: number;
  losses: number;
  frontLine1: string;
  frontLine2: string;
  frontLine3: string;
  reserve: string;
  homebase: string;
  battleground: string;
  cataclysm: string;
  mission: string;
  cardCount: number | null;
  event: string;
}

export interface CountEntry {
  name: string;
  count: number;
  catalogType: CatalogType;
}

export interface HomebaseCountEntry extends CountEntry {
  top8: number;
  top3: number;
  wins: number;
}

export interface TournamentBreakdownEntry {
  name: string;
  count: number;
}

export interface SeasonCharacterPerformanceEntry extends CountEntry {
  appearances: number;
  gameWins: number;
  gameLosses: number;
  gameWinRate: number;
  top8: number;
  top3: number;
  tournamentWins: number;
}

export interface SeasonCharacterPerformance {
  meta: {
    title: string;
    throughDate: string;
    eventCount: number;
    deckCount: number;
  };
  characters: SeasonCharacterPerformanceEntry[];
}

export interface SpotlightEntry {
  name: string;
  catalogType: CatalogType;
  totalPlays: number;
  top8Plays: number;
  label: string;
  detail: string;
}

export interface TournamentEventLocation {
  venueName?: string;
  addressLine?: string;
  city: string;
  region: string;
  postalCode?: string;
  country?: string;
  mapUrl?: string;
}

export interface TournamentEventMeta {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  playerCount: number;
  winnerName: string;
  seasonLabel: string;
  location?: TournamentEventLocation;
}

export const TOURNAMENT_DECK_PLACEMENTS = ['1st', '2nd', '3rd', '6th', '8th'] as const;

export type TournamentDeckPlacement = (typeof TOURNAMENT_DECK_PLACEMENTS)[number];

export interface TournamentPodiumResult {
  placement: TournamentDeckPlacement;
  playerName: string;
}

export interface TournamentEventStats {
  meta: TournamentEventMeta;
  characterAppearances: CountEntry[];
  top8CharacterAppearances: CountEntry[];
  mostPlaysWithoutTop8: SpotlightEntry | null;
  highestTop8Rate: SpotlightEntry | null;
  newWinningCharacters: CountEntry[];
  newTop8Characters: CountEntry[];
  topReserves: CountEntry[];
  topHomebases: HomebaseCountEntry[];
  topBattlegrounds: TournamentBreakdownEntry[];
  /** Optional coverage note when a combined view has only partial battleground data. */
  battlegroundCoverageLabel?: string;
  topCataclysms: CountEntry[];
  cataclysmReportedCount: number;
  deckRows: RegionalDeckRow[];
}

export type TournamentUnavailableStat = 'topBattlegrounds' | 'topCataclysms';

export type TournamentCatalogType = 'characters' | 'locations' | 'special-cards';

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
  catalogType: TournamentCatalogType;
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
  catalogType: TournamentCatalogType;
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
  topCataclysms: CountEntry[];
  cataclysmReportedCount: number;
  deckRows: RegionalDeckRow[];
}

/**
 * Regional stats aggregation — Columbus S1 and shared helpers.
 */
import {
  aggregateRegionalStats,
  aggregateSeasonCharacterPerformance,
  parse2026DeckSectionRows,
  parseS1SheetRows,
} from '../../../scripts/lib/regional-stats/aggregateRegionalStats';
import type { RegionalDeckRow } from '../../../scripts/lib/regional-stats/types';

const TEST_META_LOCATION = { city: 'Test City', region: 'TS' };

function makeDeck(
  rank: number,
  frontLine: [string, string, string],
  reserve: string,
  homebase = 'Asclepieion',
  cataclysm = 'Fairy Protection',
): RegionalDeckRow {
  return {
    rank,
    player: `Player ${rank}`,
    wins: Math.max(0, 9 - rank),
    losses: rank,
    frontLine1: frontLine[0],
    frontLine2: frontLine[1],
    frontLine3: frontLine[2],
    reserve,
    homebase,
    battleground: 'ERB',
    cataclysm,
    mission: 'None',
    cardCount: 51,
    event: '',
  };
}

describe('aggregateRegionalStats', () => {
  it('counts character appearances across front line and reserve', () => {
    const decks: RegionalDeckRow[] = [
      makeDeck(1, ['Wicked Witch', 'Joan of Arc', 'Jane Porter'], 'Dr. Watson'),
      makeDeck(2, ['Wicked Witch', 'Sun Wukong', 'Mina Harker'], 'Billy the Kid'),
    ];

    const stats = aggregateRegionalStats({
      meta: {
        id: 'test',
        title: 'Test',
        subtitle: '',
        date: '2026-06-27',
        playerCount: 2,
        winnerName: 'Player 1',
        seasonLabel: '',
        location: TEST_META_LOCATION,
      },
      decks,
      priorEventDecks: [],
    });

    const witch = stats.characterAppearances.find((c) => c.name === 'Wicked Witch');
    expect(witch?.count).toBe(2);
  });

  it('limits top-8 character counts to ranks 1–8', () => {
    const decks: RegionalDeckRow[] = [
      makeDeck(1, ['Wicked Witch', 'Joan of Arc', 'Jane Porter'], 'Dr. Watson'),
      makeDeck(9, ['Sherlock Holmes', 'Sherlock Holmes', 'Sherlock Holmes'], 'Sherlock Holmes'),
    ];

    const stats = aggregateRegionalStats({
      meta: {
        id: 'test',
        title: 'Test',
        subtitle: '',
        date: '2026-06-27',
        playerCount: 2,
        winnerName: 'Player 1',
        seasonLabel: '',
        location: TEST_META_LOCATION,
      },
      decks,
      priorEventDecks: [],
    });

    expect(stats.top8CharacterAppearances.find((c) => c.name === 'Sherlock Holmes')).toBeUndefined();
    expect(stats.top8CharacterAppearances.find((c) => c.name === 'Wicked Witch')?.count).toBe(1);
  });

  it('normalizes Morgan Le Fay alias variants into one count', () => {
    const decks: RegionalDeckRow[] = [
      makeDeck(1, ['Morgan Le Fay', 'Wicked Witch', 'Joan of Arc'], 'Jane Porter'),
      makeDeck(2, ['Morgan le Fay', 'Sun Wukong', 'Mina Harker'], 'Billy the Kid'),
    ];

    const stats = aggregateRegionalStats({
      meta: {
        id: 'test',
        title: 'Test',
        subtitle: '',
        date: '2026-06-27',
        playerCount: 2,
        winnerName: 'Player 1',
        seasonLabel: '',
        location: TEST_META_LOCATION,
      },
      decks,
      priorEventDecks: [],
    });

    const morgan = stats.characterAppearances.filter((c) => c.name === 'Morgan le Fay');
    expect(morgan).toHaveLength(1);
    expect(morgan[0]?.count).toBe(2);
  });

  it('identifies most plays without top-8 finish', () => {
    const decks: RegionalDeckRow[] = [
      makeDeck(1, ['Wicked Witch', 'Joan of Arc', 'Jane Porter'], 'Dr. Watson'),
      makeDeck(9, ['Sherlock Holmes', 'Leonidas', 'Zorro'], 'Billy the Kid'),
      makeDeck(10, ['Sherlock Holmes', 'Ra', 'Zeus'], 'Billy the Kid'),
    ];
    for (let rank = 2; rank <= 8; rank += 1) {
      decks.push(makeDeck(rank, ['Sun Wukong', 'Mina Harker', 'Korak'], 'Jane Porter'));
    }

    const stats = aggregateRegionalStats({
      meta: {
        id: 'test',
        title: 'Test',
        subtitle: '',
        date: '2026-06-27',
        playerCount: decks.length,
        winnerName: 'Player 1',
        seasonLabel: '',
        location: TEST_META_LOCATION,
      },
      decks,
      priorEventDecks: [],
    });

    expect(stats.mostPlaysWithoutTop8?.name).toBe('Sherlock Holmes');
    expect(stats.mostPlaysWithoutTop8?.totalPlays).toBe(2);
  });

  it('counts missing battleground reports explicitly', () => {
    const reported = makeDeck(1, ['Wicked Witch', 'Joan of Arc', 'Jane Porter'], 'Dr. Watson');
    const missing = { ...makeDeck(2, ['The Flaxans', 'Black Samson', 'Glenn'], 'Maggie'), battleground: '' };

    const stats = aggregateRegionalStats({
      meta: {
        id: 'test',
        title: 'Test',
        subtitle: '',
        date: '2026-09-05',
        playerCount: 2,
        winnerName: 'Player 1',
        seasonLabel: '',
        location: TEST_META_LOCATION,
      },
      decks: [reported, missing],
      priorEventDecks: [],
    });

    expect(stats.topBattlegrounds).toEqual([
      { name: 'ERB', count: 1 },
      { name: 'Unreported', count: 1 },
    ]);
    expect(stats.deckRows[1]?.battleground).toBe('Unreported');
  });
});

describe('parseS1SheetRows', () => {
  it('skips header and parses rank and cataclysm column', () => {
    const rows = [
      ['Columbus', 'Player', 'FL1', 'FL2', 'FL3', 'Reserve', 'Homebase', 'BG', 'Cataclysm'],
      [1, 'Justin Sadaie', 'Wicked Witch', 'Joan of Arc', 'Jane Porter', 'Cthulhu', 'The Round Table', 'ERB', 'Fairy Protection'],
    ];
    const decks = parseS1SheetRows(rows);
    expect(decks).toHaveLength(1);
    expect(decks[0]?.rank).toBe(1);
    expect(decks[0]?.cataclysm).toBe('Fairy Protection');
  });
});

describe('parse2026DeckSectionRows', () => {
  it('parses a named event block with records and the complete lineup', () => {
    const rows = [
      ['Seattle', 'New Top 8er?', 'Player', 'Wins', 'Losses', 'Front Line 1', 'Front Line 2', 'Front Line 3', 'Reserve', 'Homebase', 'Battleground', 'Cataclysm', 'Mission', 'Card Count', 'Event'],
      [1, '', 'Andrew Taylor', 10, 0, 'The Flaxans', 'Wicked Witch', 'Joan of Arc', 'Black Samson', 'The Round Table', 'GDA', 'Green Ghost', 'None', 51, ''],
      ['', '', '', '', ''],
    ];

    const decks = parse2026DeckSectionRows(rows, 'Seattle');
    expect(decks).toHaveLength(1);
    expect(decks[0]).toMatchObject({
      player: 'Andrew Taylor',
      wins: 10,
      losses: 0,
      reserve: 'Black Samson',
      battleground: 'GDA',
      cardCount: 51,
    });
  });
});

describe('aggregateSeasonCharacterPerformance', () => {
  it('applies each deck record to every character in that lineup', () => {
    const first = makeDeck(1, ['The Flaxans', 'Wicked Witch', 'Joan of Arc'], 'Black Samson');
    const second = makeDeck(2, ['The Flaxans', 'Doc Seismic', 'Carson of Venus'], 'Glenn');
    const season = aggregateSeasonCharacterPerformance([[first, second]], '2026-09-05');
    const flaxans = season.characters.find((entry) => entry.name === 'The Flaxans');

    expect(flaxans).toMatchObject({
      appearances: 2,
      gameWins: first.wins + second.wins,
      gameLosses: first.losses + second.losses,
      top8: 2,
      top3: 2,
      tournamentWins: 1,
    });
    expect(flaxans?.gameWinRate).toBeCloseTo(
      (first.wins + second.wins) / (first.wins + second.wins + first.losses + second.losses),
    );
  });
});

describe('Columbus S1 committed stats snapshot', () => {
  it('matches known aggregates from the regional workbook', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const stats = require('../../../frontend/src/data/tournaments/s1-columbus.json');

    expect(stats.meta.playerCount).toBe(53);
    expect(stats.meta.winnerName).toBe('Justin Sadaie');
    expect(stats.meta.location).toMatchObject({
      venueName: 'Heroes and Games',
      city: 'Columbus',
      region: 'OH',
    });
    expect(stats.characterAppearances[0]).toMatchObject({ name: 'Wicked Witch', count: 22 });
    expect(stats.topCataclysms[0]).toMatchObject({ name: 'Fairy Protection', count: 37 });
    expect(stats.cataclysmReportedCount).toBe(42);
    expect(stats.mostPlaysWithoutTop8?.name).toBe('Sherlock Holmes');
    expect(stats.highestTop8Rate?.name).toBe('Sun Wukong');
  });
});

describe('Niagara S1 committed stats snapshot', () => {
  it('contains Niagara-only aggregates from all 42 decks', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const stats = require('../../../frontend/src/data/tournaments/s1-niagara.json');

    expect(stats.meta).toMatchObject({
      id: 's1-niagara',
      playerCount: 42,
      winnerName: 'Jessica Simms',
      date: '2026-08-01',
    });
    expect(stats.meta.location).toEqual({
      venueName: 'Mecha Games',
      city: 'St. Catharines',
      region: 'ON',
      country: 'Canada',
      mapUrl: 'https://maps.google.com/?q=370+Ontario+Street+St+Catharines',
    });
    expect(stats.characterAppearances[0]).toMatchObject({ name: 'Wicked Witch', count: 15 });
    expect(stats.top8CharacterAppearances[0]).toMatchObject({ name: 'Wicked Witch', count: 5 });
    expect(stats.mostPlaysWithoutTop8).toMatchObject({ name: 'Zorro', totalPlays: 8 });
    expect(stats.highestTop8Rate).toMatchObject({ name: 'Joan of Arc', top8Plays: 3 });
    expect(stats.topHomebases[0]).toMatchObject({ name: 'Asclepieion', count: 14, wins: 1 });
    expect(stats.cataclysmReportedCount).toBe(37);
  });
});

describe('Seattle weekend committed stats snapshots', () => {
  it('keeps the Regional and NAOL events separate', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const regional = require('../../../frontend/src/data/tournaments/s1-seattle-regional.json');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const naol = require('../../../frontend/src/data/tournaments/s1-seattle-naol.json');

    expect(regional.meta).toMatchObject({
      id: 's1-seattle-regional',
      playerCount: 32,
      winnerName: 'Andrew Taylor',
      date: '2026-09-05',
    });
    expect(naol.meta).toMatchObject({
      id: 's1-seattle-naol',
      playerCount: 36,
      winnerName: 'Andrew Taylor',
      date: '2026-09-06',
    });
    expect(regional.topBattlegrounds).toEqual([
      { name: 'GDA', count: 28 },
      { name: 'ERB', count: 2 },
      { name: 'Unreported', count: 2 },
    ]);
    expect(naol.topBattlegrounds).toEqual([
      { name: 'GDA', count: 35 },
      { name: 'ERB', count: 1 },
    ]);
    expect(naol.cataclysmReportedCount).toBe(0);
    expect(naol.topCataclysms).toEqual([]);
    expect(naol.deckRows.every((deck: { cataclysm: string }) => deck.cataclysm === 'Unreported')).toBe(true);
    expect(regional.deckRows).toHaveLength(32);
    expect(naol.deckRows).toHaveLength(36);
  });

  it('matches the season character performance controls from the workbook', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const season = require('../../../frontend/src/data/tournaments/s1-2026-character-performance.json');
    const witch = season.characters.find((entry: { name: string }) => entry.name === 'Wicked Witch');
    const flaxans = season.characters.find((entry: { name: string }) => entry.name === 'The Flaxans');

    expect(season.meta).toMatchObject({ eventCount: 4, deckCount: 163, throughDate: '2026-09-06' });
    expect(witch).toMatchObject({
      appearances: 56,
      gameWins: 227,
      gameLosses: 197,
      gameWinRate: 0.535377358490566,
    });
    expect(flaxans).toMatchObject({
      // The raw deck rows contain 18 Flaxans lineups. The workbook's cached
      // analysis appearance cell says 17, while its 80-56 record includes all 18.
      appearances: 18,
      gameWins: 80,
      gameLosses: 56,
      gameWinRate: 0.5882352941176471,
    });
  });
});

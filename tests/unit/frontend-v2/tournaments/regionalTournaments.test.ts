import {
  buildRegionalEventPath,
  FEATURED_TOURNAMENT_ID,
  getRegionalTournament,
  getTournamentPost,
  REGIONAL_TOURNAMENTS,
  TOURNAMENT_POSTS,
} from '../../../../frontend/src/lib/tournaments/regionalTournaments';
import { combineTournamentStats } from '../../../../frontend/src/lib/tournaments/combineTournamentStats';

describe('regionalTournaments', () => {
  it('features one Seattle Weekend post while retaining distinct event datasets', () => {
    expect(FEATURED_TOURNAMENT_ID).toBe('s1-seattle-weekend');
    expect(getRegionalTournament(undefined).stats.meta.title).toBe('Seattle NAOL');
    expect(REGIONAL_TOURNAMENTS.map((event) => event.id)).toEqual([
      's1-seattle-regional',
      's1-seattle-naol',
      's1-niagara',
      's1-columbus',
    ]);
    expect(TOURNAMENT_POSTS.map((post) => post.id)).toEqual([
      's1-seattle-weekend',
      's1-niagara',
      's1-columbus',
    ]);
    expect(getTournamentPost(undefined).events.map((event) => event.id)).toEqual([
      's1-seattle-regional',
      's1-seattle-naol',
    ]);
  });

  it('builds a shareable event URL and falls back to the featured tournament', () => {
    expect(buildRegionalEventPath('s1-columbus')).toBe('/home/regionals?event=s1-columbus');
    expect(getRegionalTournament('unknown').id).toBe('s1-seattle-naol');
    expect(getTournamentPost('s1-seattle-naol').id).toBe('s1-seattle-weekend');
    expect(getTournamentPost('s1-seattle-regional').id).toBe('s1-seattle-weekend');
  });

  it('keeps the Seattle weekend source events separate and exposes complete deck rows', () => {
    const regional = getRegionalTournament('s1-seattle-regional');
    const naol = getRegionalTournament('s1-seattle-naol');

    expect(regional.stats.meta).toMatchObject({ playerCount: 32, winnerName: 'Andrew Taylor' });
    expect(naol.stats.meta).toMatchObject({ playerCount: 36, winnerName: 'Andrew Taylor' });
    expect(regional.stats.deckRows).toHaveLength(32);
    expect(naol.stats.deckRows).toHaveLength(36);
    expect(naol.unavailableStats).toEqual(['topBattlegrounds', 'topCataclysms']);
    expect(regional.stats.topBattlegrounds).toContainEqual({ name: 'Unreported', count: 2 });
    expect(naol.stats.topBattlegrounds).not.toContainEqual(expect.objectContaining({ name: 'Unreported' }));
  });

  it('combines reliable Seattle metrics for the shared weekend presentation', () => {
    const post = getTournamentPost('s1-seattle-weekend');
    const stats = combineTournamentStats({
      id: post.id,
      title: post.title,
      subtitle: post.subtitle,
      events: post.events.map((event) => ({
        label: event.id === 's1-seattle-regional' ? 'Regional' : 'NAOL',
        stats: event.stats,
        ...(event.unavailableStats ? { unavailableStats: event.unavailableStats } : {}),
      })),
    });

    expect(stats.meta).toMatchObject({ id: 's1-seattle-weekend', playerCount: 68 });
    expect(stats.characterAppearances[0]).toMatchObject({ name: 'Wicked Witch', count: 19 });
    expect(stats.top8CharacterAppearances[0]).toMatchObject({ name: 'The Flaxans', count: 8 });
    expect(stats.topReserves[0]).toMatchObject({ name: 'Glenn', count: 9 });
    expect(stats.topHomebases[0]).toMatchObject({
      name: 'The Round Table',
      count: 26,
      top8: 5,
      top3: 2,
      wins: 1,
    });
    expect(stats.highestTop8Rate).toMatchObject({
      name: 'Morgan le Fay',
      top8Plays: 5,
      totalPlays: 7,
    });
    expect(stats.mostPlaysWithoutTop8).toMatchObject({ name: 'Alexandria', totalPlays: 5 });
    expect(stats.newWinningCharacters).toHaveLength(3);
    expect(stats.newTop8Characters).toHaveLength(15);
    expect(stats.topBattlegrounds).toEqual([
      { name: 'GDA', count: 28 },
      { name: 'ERB', count: 2 },
      { name: 'Unreported', count: 2 },
    ]);
    expect(stats.battlegroundCoverageLabel).toBe('Regional only · 32 of 68 decks');
    expect(stats.topCataclysms[0]).toMatchObject({ name: 'Green Ghost', count: 9 });
    expect(stats.cataclysmReportedCount).toBe(16);
    expect(stats.deckRows).toHaveLength(68);
  });

  it('uses the corrected Niagara historical comparison lists', () => {
    const niagara = getRegionalTournament('s1-niagara');

    expect(niagara.stats.newWinningCharacters.map((entry) => entry.name)).toEqual([
      'Mina Harker',
    ]);
    expect(niagara.stats.newTop8Characters.map((entry) => entry.name)).toEqual([
      'Lancelot',
      'Van Helsing',
    ]);
  });
});

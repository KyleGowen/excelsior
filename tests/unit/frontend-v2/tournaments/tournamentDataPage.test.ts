import fs from 'fs';
import path from 'path';

const repoRoot = path.join(__dirname, '../../../..');
const page = fs.readFileSync(
  path.join(repoRoot, 'frontend/src/features/home/RegionalsPage.tsx'),
  'utf8',
);
const tables = fs.readFileSync(
  path.join(repoRoot, 'frontend/src/features/home/TournamentDataTables.tsx'),
  'utf8',
);
const styles = fs.readFileSync(
  path.join(repoRoot, 'frontend/src/features/home/TournamentStatsRail.css'),
  'utf8',
);
const statsTiles = fs.readFileSync(
  path.join(repoRoot, 'frontend/src/lib/tournaments/buildColumbusStatsTiles.tsx'),
  'utf8',
);
const statsRail = fs.readFileSync(
  path.join(repoRoot, 'frontend/src/features/home/TournamentStatsRail.tsx'),
  'utf8',
);
const chartStyles = fs.readFileSync(
  path.join(repoRoot, 'frontend/src/components/TournamentCharts/TournamentCharts.css'),
  'utf8',
);
const highlightTile = fs.readFileSync(
  path.join(repoRoot, 'frontend/src/components/TournamentCharts/TournamentHighlightTile.tsx'),
  'utf8',
);
const carouselTile = fs.readFileSync(
  path.join(repoRoot, 'frontend/src/components/TournamentCharts/TournamentPlacardCarouselTile.tsx'),
  'utf8',
);
const regionalRegistry = fs.readFileSync(
  path.join(repoRoot, 'frontend/src/lib/tournaments/regionalTournaments.ts'),
  'utf8',
);

describe('Tournament Data page', () => {
  it('keeps the event recap and ongoing season tally on separate top-level tabs', () => {
    expect(page).toContain('<TournamentStatsRail expanded tournamentId={selectedPost.id} />');
    expect(page).toContain('<TournamentDeckLineups post={selectedPost} />');
    expect(page).toContain('<SeasonCharacterPerformanceTable />');
    expect(page).toContain('Event recap');
    expect(page).toContain('Season 1 totals');
    expect(page).toContain("searchParams.get('view') === 'season'");
  });

  it('prints separate Regional and NAOL deck lists within the event recap', () => {
    expect(tables).toContain('Every reported character combination');
    expect(tables).toContain('Regional and NAOL remain separate deck lists.');
    expect(tables).toContain('aria-label="Seattle deck lists"');
    expect(tables).toContain("event.id === 's1-seattle-regional'");
    expect(tables).not.toContain('<th scope="col">Event</th>');
    expect(tables).toContain('<th scope="col">Event card</th>');
    expect(tables).toContain('Front line 1');
    expect(tables).toContain('Battleground');
    expect(tables).toContain('Cataclysm');
    expect(tables).toContain('Mission');
  });

  it('shows season character records with transparent methodology and sorting', () => {
    expect(tables).toContain('Season 1 Character Performance');
    expect(tables).toContain("Each deck’s full tournament record is applied to every character in its lineup.");
    expect(tables).toContain('Season 0 regionals are not included.');
    expect(tables).toContain('<option value="appearances">Appearances</option>');
    expect(tables).toContain('<option value="win-rate">Game win rate</option>');
    expect(tables).toContain('<option value="name">Character name</option>');
  });

  it('credits the workbook author and keeps wide tables contained on mobile', () => {
    expect(page).toContain('Traveling Goof on Discord');
    expect(page).toContain('https://discord.com/users/443222543512633365');
    expect(styles).toContain('.tournament-data__table-wrap');
    expect(styles).toMatch(/\.tournament-data__table-wrap\s*\{[^}]*overflow:\s*auto;/s);
    expect(styles).toContain('.layout-mobile .tournament-data__table-wrap');
  });

  it('combines Seattle visualizations while retaining explicit partial-source coverage', () => {
    expect(statsTiles).toContain('stats.topCataclysms.length > 0');
    expect(statsTiles).toContain('No cataclysms reported');
    expect(statsTiles).toContain('This event’s source lists every selection as unreported.');
    expect(statsTiles).toContain("stats.battlegroundCoverageLabel ?? 'Includes unreported decks'");
    expect(chartStyles).toContain('.tournament-chart-empty');
    expect(statsRail).toContain('combineTournamentStats({');
    expect(statsRail).toContain('const railTiles = HOME_TILE_ORDER');
    expect(regionalRegistry).toContain("unavailableStats: ['topBattlegrounds', 'topCataclysms']");
  });

  it('uses two event slides for Seattle winners and keeps deck links on View All', () => {
    expect(statsRail).toContain("return 'Regional';");
    expect(statsRail).toContain("return 'NAOL';");
    expect(statsRail).toContain('summarySlides');
    expect(statsTiles).toContain('<TournamentPlacardCarouselTile');
    expect(carouselTile).toContain('aria-label="Seattle event summary"');
    expect(carouselTile).toContain('aria-pressed={slide.id === activeSlide.id}');
    expect(statsTiles).not.toContain('titlePrefix');
    expect(statsRail).toContain('enabled: expanded');
    expect(statsRail).toContain('onOpenPodiumDeck: expanded ? openPodiumDeck : undefined');
    expect(statsRail).toContain('showWinnerWithPodium: expanded');
    expect(tables).toContain('resolveTournamentPodiumDecks');
    expect(tables).toContain('className="tournament-data__deck-link"');
    expect(highlightTile).toContain('showFlipControl={false}');
  });
});

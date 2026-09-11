import fs from 'fs';
import path from 'path';
import type { PreconstructedDeckGroup } from '../../../frontend/src/lib/api/types';
import { flattenOfficialPreconstructedDecks } from '../../../frontend/src/features/home/preconstructedRail';

const homePage = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/features/home/HomePage.tsx'),
  'utf8',
);

const deck = (id: string) => ({ metadata: { id }, cards: [] });

describe('Home preconstructed deck rail', () => {
  it('keeps official decks in newest-first release-group order and excludes featured upgrades', () => {
    const groups = [
      {
        setCode: 'SKY',
        setName: 'Skybound',
        decks: [deck('sky-1'), deck('sky-2')],
        featuredUpgradeRecommendations: [deck('upgrade-1')],
      },
      {
        setCode: 'ERB',
        setName: 'Edgar Rice Burroughs and the World Legends',
        decks: [deck('erb-1'), deck('erb-2')],
        featuredUpgradeRecommendations: [],
      },
    ] as unknown as PreconstructedDeckGroup[];

    expect(flattenOfficialPreconstructedDecks(groups).map((item) => item.metadata.id)).toEqual([
      'sky-1',
      'sky-2',
      'erb-1',
      'erb-2',
    ]);
  });

  it('places the five home rails in the requested order', () => {
    const labels = [
      '<NewsSection />',
      '<TournamentStatsRail />',
      'title="Community Decks"',
      'title="Tournament Winning Decks"',
      'title="Preconstructed Decks"',
    ];
    const positions = labels.map((label) => homePage.indexOf(label));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
  });

  it('loads the shared preconstructed endpoint and deep-links View All without upgrade decks', () => {
    expect(homePage).toContain('queryFn: () => fetchPreconstructedDecks()');
    expect(homePage).toContain('flattenOfficialPreconstructedDecks(preconstructedQuery.data ?? [])');
    expect(homePage).toContain('viewAllTo="/community#preconstructed"');
    expect(homePage).toContain('decks={enrichedPreconstructedDecks}');
    expect(homePage).toContain('showUpdated={false}');
    expect(homePage).toContain('showLegality={false}');
    expect(homePage).not.toContain('featuredUpgradeRecommendations');
  });
});

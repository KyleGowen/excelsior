import * as fs from 'fs';
import * as path from 'path';

describe('Recent Updates thumbnail framing', () => {
  const tileSource = fs.readFileSync(
    path.join(__dirname, '../../../frontend/src/features/home/RecentUpdateTile.tsx'),
    'utf8',
  );
  const styles = fs.readFileSync(
    path.join(__dirname, '../../../frontend/src/features/home/recentUpdates.css'),
    'utf8',
  );

  it('enlarges the Skybound alternate-art reveal from the left middle', () => {
    expect(tileSource).toContain("item.id === 'a1000001-0000-4000-8000-000000000009'");
    expect(tileSource).toContain("'home__news-thumb-image--skybound-alt-art'");
    expect(styles).toMatch(
      /\.home__news-thumb img\.home__news-thumb-image--skybound-alt-art\s*\{[\s\S]*object-position: left center;[\s\S]*transform: scale\(1\.15\);[\s\S]*transform-origin: left center;[\s\S]*\}/,
    );
  });

  it('crops the errata feature artwork inside the yellow card frame', () => {
    expect(tileSource).toContain("item.id === 'a1000001-0000-4000-8000-000000000010'");
    expect(tileSource).toContain("'home__news-thumb-image--errata-feature'");
    expect(styles).toMatch(
      /\.home__news-thumb img\.home__news-thumb-image--errata-feature\s*\{[\s\S]*?object-position: 58% 24%;[\s\S]*?transform: translate\(-6%, -3%\) scale\(1\.5\);[\s\S]*?transform-origin: 58% 24%;[\s\S]*?\}/,
    );
  });

  it('zooms the preconstructed-decks artwork past the blue Training frame', () => {
    expect(tileSource).toContain("item.id === 'a1000001-0000-4000-8000-000000000011'");
    expect(tileSource).toContain("'home__news-thumb-image--preconstructed-decks'");
    expect(styles).toMatch(
      /\.home__news-thumb img\.home__news-thumb-image--preconstructed-decks\s*\{[\s\S]*?object-position: center 22%;[\s\S]*?transform: translateY\(-6%\) scale\(1\.73\);[\s\S]*?transform-origin: center 22%;[\s\S]*?\}/,
    );
  });
});

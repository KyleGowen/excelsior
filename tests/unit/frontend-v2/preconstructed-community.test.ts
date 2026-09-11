import fs from 'fs';
import path from 'path';

const communityPage = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/features/community/CommunityPage.tsx'),
  'utf8',
);
const communityStyles = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/features/community/CommunityPage.css'),
  'utf8',
);
const communityDeckGrid = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/features/community/CommunityDeckGrid.tsx'),
  'utf8',
);
const deckSelectionPage = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/features/deck-selection/DeckSelectionPage.tsx'),
  'utf8',
);
const deckSelectionStyles = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/features/deck-selection/DeckSelectionPage.css'),
  'utf8',
);
const favoritesApi = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/lib/api/favorites.ts'),
  'utf8',
);
const deckTile = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/components/DeckTile/DeckTile.tsx'),
  'utf8',
);

describe('Community preconstructed deck UI contract', () => {
  it('orders Favorites, Community, Preconstructed, then Tournament', () => {
    expect(communityPage).toMatch(
      /const COMMUNITY_TAB_ORDER: CommunityTab\[\] = \[\s*'favorites',\s*'community',\s*'preconstructed',\s*'tournament',\s*\]/,
    );
    expect(communityPage).toContain("preconstructed: 'Preconstructed'");
    expect(communityPage).toContain("preconstructed: 'preconstructed'");
    expect(favoritesApi).toContain("'/api/v1/community/preconstructed-decks'");
  });

  it('renders newest-first set groups as labeled four-deck rows with an in-style separator', () => {
    expect(communityPage).toContain('(preconstructedQuery.data ?? []).map((group) => (');
    expect(communityPage).toContain('{group.setName}');
    expect(communityPage).toContain('className="community__preconstructed-grid"');
    expect(communityStyles).toMatch(
      /\.community__preconstructed-set \+ \.community__preconstructed-set\s*\{[\s\S]*?border-top:/,
    );
    expect(communityStyles).toMatch(
      /\.community__preconstructed-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/,
    );
    expect(communityStyles).toMatch(
      /\.community__preconstructed-label\s*\{[\s\S]*?color:\s*var\(--color-accent\)[\s\S]*?font-size:\s*var\(--font-size-xl\)/,
    );
    expect(communityStyles).toMatch(
      /\.community__preconstructed-label\s*\{[\s\S]*?margin-bottom:\s*0\.5em/,
    );
    expect(communityStyles).toMatch(
      /\.community__preconstructed-grid\s*\{[\s\S]*?width:\s*85%[\s\S]*?margin-inline:\s*auto/,
    );
    expect(communityStyles).toMatch(
      /\.layout-mobile \.community__preconstructed-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
    );
  });

  it('renders the Skybound upgrade recommendations as a nested second row without a divider', () => {
    expect(communityPage).toContain('group.featuredUpgradeRecommendations.length > 0');
    expect(communityPage).toContain('decks={group.featuredUpgradeRecommendations}');
    expect(communityPage).toContain('Featured Precon Upgrade Recommendations');
    expect(communityPage).toContain(
      'featuredUpgradeRecommendations: group.featuredUpgradeRecommendations.map((item) =>',
    );
    expect(communityStyles).toMatch(
      /\.community__preconstructed-subsection-label\s*\{[\s\S]*?font-size:\s*var\(--font-size-md\)/,
    );
    expect(communityStyles).not.toMatch(
      /\.community__preconstructed-subsection\s*\{[\s\S]*?border-top:/,
    );
  });

  it('keeps official tiles simplified while featured recommendations use regular metadata', () => {
    expect(communityPage).toContain('onToggleFavorite={togglePreconstructedFavorite}');
    expect(communityPage).toContain('useFavoriteToggle([PRECONSTRUCTED_DECKS_KEY])');
    expect(communityPage.match(/showOwner=\{false\}/g)).toHaveLength(1);
    expect(communityPage.match(/showUpdated=\{false\}/g)).toHaveLength(1);
    expect(communityPage.match(/showLegality=\{false\}/g)).toHaveLength(1);
    expect(communityDeckGrid).toContain('missionSetName={deckMissionSetName(deck, missionSetByCardId)}');
    expect(communityDeckGrid).toContain('ownerName={showOwner ?');
    expect(communityStyles).toMatch(
      /\.layout-mobile \.community__preconstructed-subsection \.deck-tile__chip\s*\{[\s\S]*?display:\s*inline-flex/,
    );
    expect(communityStyles).toMatch(
      /\.layout-mobile \.community__preconstructed-subsection \.deck-tile__legality--footer\s*\{[\s\S]*?display:\s*inline-flex/,
    );
    expect(communityStyles).toMatch(
      /\.community__preconstructed-subsection \.deck-tile__updated\s*\{[\s\S]*?left:\s*50%[\s\S]*?translateX\(-50%\)/,
    );
    expect(deckTile).toContain('showUpdated = true');
    expect(deckTile).toContain('showLegality = true');
    expect(deckTile).toContain('const updatedLabel = showUpdated && meta.lastModified');
    expect(deckTile).toContain('{showLegality ? (');
  });

  it('includes the complete preconstructed collection in the mobile Decks tabs', () => {
    expect(deckSelectionPage).toMatch(
      /const DECK_SELECTION_TAB_ORDER: DeckTab\[\] = \[\s*'mine',\s*'favorites',\s*'community',\s*'preconstructed',\s*'tournament',\s*\]/,
    );
    expect(deckSelectionPage).toContain("preconstructed: 'Preconstructed'");
    expect(deckSelectionPage).toContain('queryFn: () => fetchPreconstructedDecks()');
    expect(deckSelectionPage).toContain('preconstructedGroups.map((group) => (');
    expect(deckSelectionPage).toContain('decks={group.featuredUpgradeRecommendations}');
    expect(deckSelectionPage).toContain('onToggleFavorite={togglePreconstructedFavorite}');
    expect(deckSelectionPage.match(/showOwner=\{false\}/g)).toHaveLength(1);
    expect(deckSelectionPage.match(/showUpdated=\{false\}/g)).toHaveLength(1);
    expect(deckSelectionPage.match(/showLegality=\{false\}/g)).toHaveLength(1);
    expect(deckSelectionStyles).toMatch(
      /\.dsel__preconstructed-grid\s*\{[\s\S]*?width:\s*85%[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
    );
    expect(deckSelectionStyles).toMatch(
      /\.dsel__preconstructed-set \+ \.dsel__preconstructed-set\s*\{[\s\S]*?border-top:/,
    );
    expect(deckSelectionStyles).toMatch(
      /\.layout-mobile \.dsel__preconstructed-subsection \.deck-tile__legality--footer\s*\{[\s\S]*?display:\s*inline-flex/,
    );
  });
});

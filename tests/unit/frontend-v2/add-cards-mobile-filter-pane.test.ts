import fs from 'fs';
import path from 'path';

const filterBar = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/features/deck-editor/AddCardsFilterBar.tsx'),
  'utf8',
);
const deckEditorStyles = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/features/deck-editor/DeckEditorPage.css'),
  'utf8',
);
const swipeSelectors = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/lib/layout/swipeBlockSelectors.ts'),
  'utf8',
);

describe('Add Cards mobile filter pane contract', () => {
  it('uses the shared catalog rail and starts mobile collapsed', () => {
    expect(filterBar).toContain("import { CatalogFilterRail } from '../database/components/CatalogFilterRail'");
    expect(filterBar).toContain(
      'const [mobileFilterPaneExpanded, setMobileFilterPaneExpanded] = useState(false)',
    );
    expect(filterBar).toContain('collapsed={!mobileFilterPaneExpanded}');
    expect(filterBar).toContain('trailing={setAndUsabilityControls}');
  });

  it('keeps the compact row unwrapped and wraps controls in the expanded pane', () => {
    expect(deckEditorStyles).toMatch(
      /\.layout-mobile \.add-cards__filter-rail\.is-collapsed \.add-cards__dynamic-filters,[\s\S]*?flex-wrap:\s*nowrap/,
    );
    expect(deckEditorStyles).toMatch(
      /\.add-cards__filter-rail:not\(\.is-collapsed\)[\s\S]*?\.add-cards__dynamic-filters\s*\{[\s\S]*?flex-direction:\s*column/,
    );
    expect(deckEditorStyles).toMatch(
      /\.add-cards__filter-rail:not\(\.is-collapsed\)[\s\S]*?\.add-cards__filters-row\s*\{[\s\S]*?flex-wrap:\s*wrap/,
    );
    expect(swipeSelectors).toContain('.add-cards__filter-rail');
  });
});

import fs from 'fs';
import path from 'path';

const databasePage = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/features/database/DatabasePage.tsx'),
  'utf8',
);
const filterRail = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/features/database/components/DbvFilterRail.tsx'),
  'utf8',
);
const catalogFilterRail = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/features/database/components/CatalogFilterRail.tsx'),
  'utf8',
);
const filterRailStyles = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/features/database/components/DbvFilterRail.css'),
  'utf8',
);

describe('Database mobile filter pane contract', () => {
  it('starts mobile in the collapsed one-row state without changing the desktop default', () => {
    expect(databasePage).toContain('const [filterRailCollapsed, setFilterRailCollapsed] = useState(false)');
    expect(databasePage).toContain('const [mobileFilterPaneExpanded, setMobileFilterPaneExpanded] = useState(false)');
    expect(databasePage).toContain('collapsed={isMobile ? !mobileFilterPaneExpanded : filterRailCollapsed}');
    expect(filterRail).toContain('<CatalogFilterRail');
    expect(catalogFilterRail).toContain('const showBody = isMobile || !collapsed');
    expect(catalogFilterRail).toContain(
      "aria-label={collapsed ? 'Expand filters' : 'Collapse filters'}",
    );
  });

  it('keeps collapsed mobile controls scrollable and expands them over the results', () => {
    expect(filterRailStyles).toMatch(
      /\.layout-mobile \.dbv-filter-rail\.is-collapsed \.dbv-filter-rail__scroll\s*\{[\s\S]*?overflow-x:\s*auto/,
    );
    expect(filterRailStyles).toMatch(
      /\.layout-mobile \.dbv-filter-rail:not\(\.is-collapsed\) \.dbv-filter-rail__body\s*\{[\s\S]*?position:\s*absolute[\s\S]*?overflow-y:\s*auto/,
    );
    expect(filterRailStyles).toContain('flex-wrap: wrap');
    expect(filterRailStyles).toMatch(
      /\.dbv-filter-rail:not\(\.is-collapsed\) \.dbv-filter-rail__controls\s*\{[\s\S]*?flex:\s*0 0 auto/,
    );
    expect(filterRailStyles).toMatch(
      /\.dbv-filter-rail:not\(\.is-collapsed\) \.dbv-filter-rail__scroll\s*\{[\s\S]*?gap:\s*0/,
    );
    expect(filterRailStyles).toContain('z-index: var(--z-sticky)');
    expect(catalogFilterRail).toContain("if (event.key === 'Escape') onCollapsedChange(true)");
  });
});

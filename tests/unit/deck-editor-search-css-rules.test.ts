import fs from 'fs';
import path from 'path';

describe('Deck Editor Search CSS safety rules', () => {
  const cssPath = path.resolve(__dirname, '../../public/css/deck-editor-search.css');

  test('results dropdown overlays content (position and z-index)', () => {
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toMatch(/\.deck-editor-search-results\s*\{/);
    expect(css).toMatch(/position:\s*absolute/);
    expect(css).toMatch(/z-index:\s*9999/);
    expect(css).toMatch(/top:\s*100%/);
  });

  test('prevents clipping by parent panes (overflow visible overrides)', () => {
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toMatch(/\.card-selector-pane\s*\{[^}]*overflow:\s*visible\s*!important/);
    expect(css).toMatch(/\.card-selector-pane\s*\.deck-editor-search-container|\.card-selector-pane\s*\.deck-editor-search-container\s*\{/);
  });
});



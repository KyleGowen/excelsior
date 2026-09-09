import fs from 'fs';
import path from 'path';

describe('mobile legality errors interaction contract', () => {
  const component = fs.readFileSync(
    path.join(
      process.cwd(),
      'frontend/src/components/LegalityErrorsPopover/LegalityErrorsPopover.tsx',
    ),
    'utf8',
  );
  const styles = fs.readFileSync(
    path.join(
      process.cwd(),
      'frontend/src/components/LegalityErrorsPopover/LegalityErrorsPopover.css',
    ),
    'utf8',
  );
  const deckEditor = fs.readFileSync(
    path.join(process.cwd(), 'frontend/src/features/deck-editor/DeckEditorPage.tsx'),
    'utf8',
  );

  it('keeps mobile errors collapsed behind a press-and-hold gesture', () => {
    expect(deckEditor).toContain('pressAndHold={isMobile}');
    expect(deckEditor).not.toContain('inline={isMobile}');
    expect(component).toContain('const LONG_PRESS_DURATION_MS = 500;');
    expect(component).toContain('onPointerDown={handlePointerDown}');
    expect(component).toContain('onPointerMove={handlePointerMove}');
    expect(component).toContain('suppressNextClickRef.current = true;');
    expect(component).toContain('onClickCapture={(event) => {');
  });

  it('renders the mobile errors in a bounded dismissible sheet', () => {
    expect(component).toContain("role={pressAndHold ? 'dialog' : 'tooltip'}");
    expect(component).toContain('Close deck validation errors');
    expect(component).toContain('createPortal(panel, document.body)');
    expect(component).toContain('const top = anchor.bottom + gap;');
    expect(styles).toMatch(
      /\.legality-errors-popover__panel--press-and-hold\s*\{[^}]*position:\s*fixed;/s,
    );
    expect(component).toContain('maxHeight: `min(50dvh, calc(100dvh - ${top}px');
    expect(styles).not.toContain('.legality-errors-popover--inline');
  });
});

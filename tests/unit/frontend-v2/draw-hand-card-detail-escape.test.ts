import fs from 'fs';
import path from 'path';

describe('Draw Hand card-detail Escape layering', () => {
  const slideOutPath = path.join(
    __dirname,
    '../../../frontend/src/components/SlideOutPanel/SlideOutPanel.tsx',
  );
  const drawHandPath = path.join(
    __dirname,
    '../../../frontend/src/features/deck-editor/DrawHandPanel.tsx',
  );
  const deckEditorPath = path.join(
    __dirname,
    '../../../frontend/src/features/deck-editor/DeckEditorPage.tsx',
  );

  it('lets a mounted parent panel yield Escape to a child overlay', () => {
    const slideOut = fs.readFileSync(slideOutPath, 'utf8');

    expect(slideOut).toContain('closeOnEscape = true');
    expect(slideOut).toContain('closeOnEscapeRef.current = closeOnEscape');
    expect(slideOut).toContain(
      "if (e.key === 'Escape' && closeOnEscapeRef.current) onCloseRef.current()",
    );
  });

  it('keeps Draw Hand open for the first Escape from card detail', () => {
    const drawHand = fs.readFileSync(drawHandPath, 'utf8');
    const deckEditor = fs.readFileSync(deckEditorPath, 'utf8');

    expect(drawHand).toContain('closeOnEscape={closeOnEscape}');
    expect(deckEditor).toContain('closeOnEscape={!selected}');
  });
});

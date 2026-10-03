import fs from 'fs';
import path from 'path';

const databasePage = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/features/database/DatabasePage.tsx'),
  'utf8',
);
const panel = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/features/database/components/SavedDatabaseViewsPanel.tsx'),
  'utf8',
);
const databaseStyles = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/features/database/DatabasePage.css'),
  'utf8',
);
const panelStyles = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/features/database/components/SavedDatabaseViewsPanel.css'),
  'utf8',
);

describe('Saved database views UI contract', () => {
  it('gates both endpoint access and controls behind the ADMIN role', () => {
    expect(databasePage).toContain('enabled: isAdmin');
    expect(databasePage).toContain('{isAdmin ? (');
    expect(databasePage).toContain('<SavedDatabaseViewsPanel');
  });

  it('uses an inline naming row and an accessible save quota wrapper instead of a naming modal', () => {
    expect(panel).toContain("kind: 'create'");
    expect(panel).toContain('Name saved view');
    expect(panel).toContain("if (event.key === 'Enter') void submitEditor()");
    expect(panel).toContain("if (event.key === 'Escape' && !isEditing) setEditor(null)");
    expect(panel).not.toContain('saved-views-name-dialog');
    expect(databasePage).toContain('tabIndex={savedViewsAtLimit ? 0 : undefined}');
    expect(databasePage).toContain('aria-describedby={savedViewsAtLimit ? savedViewsTooltipId : undefined}');
    expect(databasePage).toContain('role="tooltip"');
    expect(panel).not.toContain('Duplicate');
  });

  it('keeps desktop non-modal while making mobile and delete confirmations modal and focus-managed', () => {
    expect(panel).toContain("role={isMobile ? 'dialog' : 'complementary'}");
    expect(panel).toContain('aria-modal={isMobile ? true : undefined}');
    expect(panel).toContain('role="dialog" aria-modal="true"');
    expect(panel).toContain("event.key !== 'Tab'");
    expect(panel).toContain('previousFocusRef.current?.focus?.()');
    expect(panelStyles).toMatch(/saved-views__panel--desktop[\s\S]*flex:\s*0 0 340px/);
    expect(panelStyles).toMatch(/saved-views__panel--mobile[\s\S]*width:\s*100%/);
    expect(panelStyles).toContain('env(safe-area-inset-bottom)');
    expect(panelStyles).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('preserves the recall exclusions and exposes keyboard-safe management controls', () => {
    expect(databasePage).toContain('setPage(1)');
    expect(databasePage).toContain('if (selected) closeCardDetail(); else setSelected(null)');
    expect(databasePage).toContain('if (isMobile) setSavedViewsOpen(false)');
    expect(panel).toContain('role="menu"');
    expect(panel).toContain('Delete selected');
    expect(panel).toContain('Select all');
    expect(panel).toContain('Clear selection');
    expect(panelStyles).toContain('text-overflow: ellipsis');
    expect(databaseStyles).toContain('.db__save-view-wrap:focus-visible');
  });
});

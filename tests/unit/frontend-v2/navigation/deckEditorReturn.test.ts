import {
  buildDeckEditorNavigateState,
  buildDeckEditorPath,
  buildDeckSelectionReturnPath,
  DECK_EDITOR_RETURN_HOME,
  DECK_EDITOR_RETURN_REGIONALS,
  getDeckEditorBackAriaLabel,
  getDeckEditorReturnTo,
} from '../../../../frontend/src/lib/navigation/deckEditorReturn';

describe('deckEditorReturn', () => {
  it.each([
    ['user-123', 'deck-456', false, '/users/user-123/decks/deck-456'],
    ['guest-user', 'guest_789', false, '/users/guest-user/decks/guest_789'],
    ['user-123', 'deck-456', true, '/users/user-123/decks/deck-456?readonly=true'],
    ['user#1', 'deck?2', true, '/users/user%231/decks/deck%3F2?readonly=true'],
  ])('builds a direct deck link for %s / %s with read-only mode %s', (userId, deckId, readonly, path) => {
    expect(buildDeckEditorPath(userId, deckId, readonly)).toBe(path);
  });

  it('returns a validated internal path from location state', () => {
    expect(getDeckEditorReturnTo(buildDeckEditorNavigateState('/home/columbus-regional'))).toBe(
      '/home/columbus-regional',
    );
    expect(getDeckEditorReturnTo(buildDeckEditorNavigateState(DECK_EDITOR_RETURN_HOME))).toBe('/home');
  });

  it('builds deck selection return paths', () => {
    expect(buildDeckSelectionReturnPath('abc-123')).toBe('/users/abc-123/decks');
  });

  it('returns undefined for missing or invalid state', () => {
    expect(getDeckEditorReturnTo(undefined)).toBeUndefined();
    expect(getDeckEditorReturnTo(null)).toBeUndefined();
    expect(getDeckEditorReturnTo({})).toBeUndefined();
    expect(getDeckEditorReturnTo({ returnTo: 123 })).toBeUndefined();
    expect(getDeckEditorReturnTo({ returnTo: '' })).toBeUndefined();
  });

  it('rejects open-redirect style paths', () => {
    expect(getDeckEditorReturnTo({ returnTo: '//evil.com/phish' })).toBeUndefined();
    expect(getDeckEditorReturnTo({ returnTo: 'https://evil.com' })).toBeUndefined();
  });

  it('maps return paths to back button aria labels', () => {
    expect(getDeckEditorBackAriaLabel()).toBe('Back to decks');
    expect(getDeckEditorBackAriaLabel('/home')).toBe('Back to home');
    expect(getDeckEditorBackAriaLabel('/home/columbus-regional')).toBe('Back to tournament stats');
    expect(getDeckEditorBackAriaLabel(DECK_EDITOR_RETURN_REGIONALS)).toBe('Back to tournament stats');
    expect(getDeckEditorBackAriaLabel('/home/regionals?event=s1-niagara')).toBe('Back to tournament stats');
    expect(getDeckEditorBackAriaLabel('/users/u1/decks')).toBe('Back to decks');
  });
});

import { buildDeckShareUrl } from '../../../../frontend/src/lib/navigation/deckShareUrl';

describe('buildDeckShareUrl', () => {
  it('uses the saved deck owner and ID in the existing URL format', () => {
    expect(buildDeckShareUrl('https://excelsior.cards', { id: 'deck-123', userId: 'owner-456' }))
      .toBe('https://excelsior.cards/users/owner-456/decks/deck-123');
  });

  it('uses the running app origin and encodes route segments', () => {
    expect(buildDeckShareUrl('http://localhost:5174', { id: 'deck?123', userId: 'owner#456' }))
      .toBe('http://localhost:5174/users/owner%23456/decks/deck%3F123');
  });

  it('copies opaque Guest URLs in the same route format', () => {
    const id = 'guest_1ccc190f-37c5-4dd1-a226-b30c65ae04be';
    expect(buildDeckShareUrl('https://excelsior.cards', { id, userId: 'guest-account' }))
      .toBe(`https://excelsior.cards/users/guest-account/decks/${id}`);
  });

  it.each([
    { id: 'guest_legacy-fixture_123_random', userId: 'guest' },
    { id: '', userId: 'owner-456' },
    { id: 'deck-123', userId: '' },
  ])('omits links for legacy Guest IDs and incomplete deck references (%j)', (deck) => {
    expect(buildDeckShareUrl('https://excelsior.cards', deck)).toBeUndefined();
  });
});

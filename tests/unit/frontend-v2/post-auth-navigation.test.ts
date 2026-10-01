import {
  parseGoogleAuthReturn,
  postAuthPath,
  postAuthState,
} from '../../../frontend/src/lib/auth/postAuthNavigation';

const guest = { id: 'guest-id', role: 'GUEST' as const };
const member = { id: 'member-id', role: 'USER' as const };

describe('account changes keep the current view', () => {
  it('keeps shared pages, search, and hash fragments', () => {
    expect(postAuthPath('/data?set=Skybound#specials', guest.id, member))
      .toBe('/data?set=Skybound#specials');
    expect(postAuthPath('/community#tournament', member.id, guest))
      .toBe('/community#tournament');
  });

  it('switches the current account deck list and collection to the new identity', () => {
    expect(postAuthPath('/users/guest-id/decks?tab=preconstructed', guest.id, member))
      .toBe('/users/member-id/decks?tab=preconstructed');
    expect(postAuthPath('/users/member-id/collection#power', member.id, guest))
      .toBe('/users/guest-id/collection#power');
  });

  it('keeps a public profile instead of treating it as the current account', () => {
    expect(postAuthPath('/users/another-player/decks', guest.id, member))
      .toBe('/users/another-player/decks');
  });

  it('leaves a Guest session deck behind but keeps persistent decks readable after logout', () => {
    expect(postAuthPath('/users/guest-id/decks/guest_123', guest.id, member))
      .toBe('/users/member-id/decks');
    expect(postAuthPath('/users/member-id/decks/deck-123?view=list#cards', member.id, guest))
      .toBe('/users/member-id/decks/deck-123?view=list&readonly=true#cards');
  });

  it('restores edit access for the owner and updates the deck editor back link', () => {
    expect(postAuthPath('/users/member-id/decks/deck-123?readonly=true', guest.id, member))
      .toBe('/users/member-id/decks/deck-123');
    expect(postAuthState({ returnTo: '/users/member-id/decks' }, member.id, guest))
      .toEqual({ returnTo: '/users/guest-id/decks' });
  });

  it('leaves an admin view when the new role cannot access it', () => {
    expect(postAuthPath('/admin/user-analytics', 'admin-id', guest)).toBe('/home');
  });

  it('accepts only a same-site saved Google return path', () => {
    expect(parseGoogleAuthReturn(JSON.stringify({ path: '/users/guest-id/decks', previousUserId: guest.id })))
      .toEqual({ path: '/users/guest-id/decks', previousUserId: guest.id });
    expect(parseGoogleAuthReturn(JSON.stringify({ path: '//other.example', previousUserId: guest.id })))
      .toBeNull();
    expect(parseGoogleAuthReturn('not json')).toBeNull();
  });
});

import { fetchDeckFull, createDeck, replaceDeckCards } from '../../frontend/src/lib/api/decks';
import { clonePreloadedGuestDeck, guestNeedsCloneOnOpen } from '../../frontend/src/lib/decks/guestCloneOnOpen';

jest.mock('../../frontend/src/lib/api/decks', () => ({
  fetchDeckFull: jest.fn(),
  createDeck: jest.fn(),
  replaceDeckCards: jest.fn(),
  isGuestDeckId: (deckId: string) => deckId.startsWith('guest_'),
}));

describe('clonePreloadedGuestDeck', () => {
  beforeEach(() => jest.clearAllMocks());

  it('copies pre-placed flags into the guest session deck', async () => {
    (fetchDeckFull as jest.Mock).mockResolvedValue({
      metadata: { name: 'Guest sample deck', description: '', userId: 'guest-user' },
      cards: [
        { type: 'power', cardId: 'power-1', quantity: 2 },
        { type: 'training', cardId: 'training-1', quantity: 1, exclude_from_draw: true },
      ],
    });
    (createDeck as jest.Mock).mockResolvedValue({ id: 'guest-session-copy' });
    (replaceDeckCards as jest.Mock).mockResolvedValue({});

    await expect(clonePreloadedGuestDeck('source-deck', 'guest-user')).resolves.toBe('guest-session-copy');

    expect(fetchDeckFull).toHaveBeenCalledWith('source-deck', false);
    expect(replaceDeckCards).toHaveBeenCalledWith(
      'guest-session-copy',
      [
        { cardType: 'power', cardId: 'power-1', quantity: 2, exclude_from_draw: false },
        { cardType: 'training', cardId: 'training-1', quantity: 1, exclude_from_draw: true },
      ],
      true,
    );
  });

  it('rejects another owner\'s shared deck before creating or saving a guest deck', async () => {
    (fetchDeckFull as jest.Mock).mockResolvedValue({
      metadata: { name: 'Shared deck', userId: 'another-owner', isOwner: false },
      cards: [],
    });

    await expect(clonePreloadedGuestDeck('shared-deck', 'guest-user'))
      .rejects.toThrow('Only guest sample decks can be copied');
    expect(createDeck).not.toHaveBeenCalled();
    expect(replaceDeckCards).not.toHaveBeenCalled();
  });

  it('rejects an unknown guest identity before creating anything', async () => {
    (fetchDeckFull as jest.Mock).mockResolvedValue({ metadata: { userId: '' }, cards: [] });
    await expect(clonePreloadedGuestDeck('source-deck', '')).rejects.toThrow('Only guest sample decks can be copied');
    expect(createDeck).not.toHaveBeenCalled();
  });
});

describe('guestNeedsCloneOnOpen', () => {
  it.each([
    ['guest-owned sample', 'sample', true, false, 'guest-user', 'guest-user', true],
    ['shared deck without readonly flag', 'shared', true, false, 'another-owner', 'guest-user', false],
    ['shared deck with readonly flag', 'shared', true, true, 'another-owner', 'guest-user', false],
    ['guest sample forced read-only', 'sample', true, true, 'guest-user', 'guest-user', false],
    ['existing session deck', 'guest_session-copy', true, false, 'guest-user', 'guest-user', false],
    ['registered owner', 'owned', false, false, 'member', 'member', false],
    ['registered non-owner', 'shared', false, false, 'another-owner', 'member', false],
    ['unknown deck owner while loading', 'shared', true, false, undefined, 'guest-user', false],
    ['unknown guest while loading', 'shared', true, false, 'guest-user', undefined, false],
    ['missing identities', 'shared', true, false, undefined, undefined, false],
    ['missing deck', '', true, false, 'guest-user', 'guest-user', false],
  ] as const)('%s', (_name, id, isGuest, forceReadonly, ownerId, guestId, expected) => {
    expect(guestNeedsCloneOnOpen(id, isGuest, forceReadonly, ownerId, guestId)).toBe(expected);
  });
});

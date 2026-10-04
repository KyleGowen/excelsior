import { fetchDeckFull, createDeck, replaceDeckCards } from '../../frontend/src/lib/api/decks';
import { clonePreloadedGuestDeck } from '../../frontend/src/lib/decks/guestCloneOnOpen';

jest.mock('../../frontend/src/lib/api/decks', () => ({
  fetchDeckFull: jest.fn(),
  createDeck: jest.fn(),
  replaceDeckCards: jest.fn(),
  isGuestDeckId: (deckId: string) => deckId.startsWith('guest_'),
}));

describe('clonePreloadedGuestDeck', () => {
  it('copies pre-placed flags into the guest session deck', async () => {
    (fetchDeckFull as jest.Mock).mockResolvedValue({
      metadata: { name: 'Tournament deck', description: '' },
      cards: [
        { type: 'power', cardId: 'power-1', quantity: 2 },
        { type: 'training', cardId: 'training-1', quantity: 1, exclude_from_draw: true },
      ],
    });
    (createDeck as jest.Mock).mockResolvedValue({ id: 'guest-session-copy' });
    (replaceDeckCards as jest.Mock).mockResolvedValue({});

    await expect(clonePreloadedGuestDeck('source-deck')).resolves.toBe('guest-session-copy');

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
});

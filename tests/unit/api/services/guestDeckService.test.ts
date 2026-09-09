import { GuestDeckService } from '../../../../src/api/services/guestDeckService';
import { GuestDeckPersistenceService } from '../../../../src/services/guestDeckPersistence';

describe('GuestDeckService', () => {
  let persistence: GuestDeckPersistenceService;

  beforeEach(() => {
    persistence = new GuestDeckPersistenceService();
  });

  afterEach(() => {
    persistence.destroy();
  });

  it('preserves pre-placed cards while excluding them from the guest deck count', () => {
    const service = new GuestDeckService({
      guestDeckPersistence: persistence,
      deckRepository: { getDecksByUserId: jest.fn() },
      validateCardAddition: jest.fn(),
      checkIfCardIsOnePerDeck: jest.fn(),
      checkIfCardIsCataclysm: jest.fn(),
    });
    const created = service.createDeck('session-1', { name: 'Guest copy', description: '' });
    if (!created.ok) throw new Error(created.message);

    const result = service.replaceCards('session-1', created.data.id, [
      { cardType: 'character', cardId: 'character-1', quantity: 1 },
      { cardType: 'location', cardId: 'location-1', quantity: 1 },
      { cardType: 'power', cardId: 'power-1', quantity: 2 },
      { cardType: 'training', cardId: 'training-1', quantity: 1, exclude_from_draw: true },
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.data.metadata.cardCount).toBe(2);
    expect(result.data.cards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'training',
          cardId: 'training-1',
          exclude_from_draw: true,
        }),
      ]),
    );
  });

  it('excludes only one copy when a grouped guest card is pre-placed', () => {
    const service = new GuestDeckService({
      guestDeckPersistence: persistence,
      deckRepository: { getDecksByUserId: jest.fn() },
      validateCardAddition: jest.fn(),
      checkIfCardIsOnePerDeck: jest.fn(),
      checkIfCardIsCataclysm: jest.fn(),
    });
    const created = service.createDeck('session-1', { name: 'Guest duplicate', description: '' });
    if (!created.ok) throw new Error(created.message);

    const result = service.replaceCards('session-1', created.data.id, [
      { cardType: 'training', cardId: 'training-1', quantity: 2, exclude_from_draw: true },
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.data.metadata.cardCount).toBe(1);
  });

  it('preserves character display order in guest session decks', () => {
    const service = new GuestDeckService({
      guestDeckPersistence: persistence,
      deckRepository: { getDecksByUserId: jest.fn() },
      validateCardAddition: jest.fn(),
      checkIfCardIsOnePerDeck: jest.fn(),
      checkIfCardIsCataclysm: jest.fn(),
    });
    const created = service.createDeck('session-1', { name: 'Ordered team', description: '' });
    if (!created.ok) throw new Error(created.message);

    const result = service.replaceCards('session-1', created.data.id, [
      { cardType: 'character', cardId: 'character-2', quantity: 1, displayOrder: 0 },
      { cardType: 'character', cardId: 'character-1', quantity: 1, displayOrder: 1 },
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.data.cards.map((card) => [card.cardId, card.displayOrder])).toEqual([
      ['character-2', 0],
      ['character-1', 1],
    ]);
  });
});

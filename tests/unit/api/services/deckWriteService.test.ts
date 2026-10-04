import { DeckWriteService } from '../../../../src/api/services/deckWriteService';
import type { Deck, DeckCard } from '../../../../src/types';
import type { ValidationError } from '../../../../src/services/deckValidationService';

function makeDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: 'deck-1',
    user_id: 'user-1',
    name: 'New Deck',
    is_valid: false,
    ...overrides,
  } as Deck;
}

describe('DeckWriteService.createDeck — server-owned is_valid', () => {
  it('passes an explicit visibility choice to deck creation', async () => {
    const created = makeDeck({ is_private: false });
    const deckBusiness = {
      createDeck: jest.fn().mockResolvedValue(created),
      updateDeck: jest.fn().mockResolvedValue(created),
    };
    const deckValidation = { validateDeck: jest.fn().mockResolvedValue([{ rule: 'empty', message: 'not legal' }]) };

    const service = new DeckWriteService(deckBusiness, deckValidation);
    await service.createDeck('user-1', 'Public deck', undefined, undefined, false);

    expect(deckBusiness.createDeck).toHaveBeenCalledWith(
      'user-1',
      'Public deck',
      undefined,
      undefined,
      false,
    );
  });

  it('recomputes and persists is_valid for a freshly created deck', async () => {
    const created = makeDeck({ is_valid: false });
    const deckBusiness = {
      createDeck: jest.fn().mockResolvedValue(created),
      updateDeck: jest.fn().mockResolvedValue(created),
    };
    // A new deck (characters only) is never legal -> validation returns errors.
    const errors: ValidationError[] = [{ rule: 'mission_count', message: 'Deck must have exactly 7 mission cards (found 0)' }];
    const deckValidation = { validateDeck: jest.fn().mockResolvedValue(errors) };

    const service = new DeckWriteService(deckBusiness, deckValidation);
    const result = await service.createDeck('user-1', 'New Deck', undefined, ['char-1']);

    expect(deckValidation.validateDeck).toHaveBeenCalled();
    // is_valid stays false (matches DEFAULT) so no redundant write is issued.
    expect(deckBusiness.updateDeck).not.toHaveBeenCalled();
    expect(result.is_valid).toBe(false);
  });

  it('persists is_valid=true when the created deck validates clean', async () => {
    const created = makeDeck({ is_valid: false, cards: [{ id: '', type: 'character', cardId: 'c1', quantity: 1 }] as DeckCard[] });
    const deckBusiness = {
      createDeck: jest.fn().mockResolvedValue(created),
      updateDeck: jest.fn().mockResolvedValue(created),
    };
    const deckValidation = { validateDeck: jest.fn().mockResolvedValue([]) };

    const service = new DeckWriteService(deckBusiness, deckValidation);
    const result = await service.createDeck('user-1', 'New Deck', undefined, ['c1']);

    expect(deckBusiness.updateDeck).toHaveBeenCalledWith('deck-1', { is_valid: true });
    expect(result.is_valid).toBe(true);
  });

  it('does not report fresh successful creation when validation is unavailable', async () => {
    const created = makeDeck({ is_valid: false });
    const deckBusiness = {
      createDeck: jest.fn().mockResolvedValue(created),
      updateDeck: jest.fn(),
    };
    const deckValidation = { validateDeck: jest.fn().mockRejectedValue(new Error('boom')) };

    const service = new DeckWriteService(deckBusiness, deckValidation);
    await expect(service.createDeck('user-1', 'New Deck', undefined, ['c1'])).rejects.toThrow('boom');
    expect(created.is_valid).toBe(false);
    expect(deckBusiness.updateDeck).toHaveBeenCalledWith('deck-1', { is_valid: false });
  });
});

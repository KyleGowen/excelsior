/**
 * Unit tests for NewUserSampleDeckService
 * Tests that new users receive a copy of a random guest deck with "Sample: " prefix
 */

import { NewUserSampleDeckService } from '../../src/services/newUserSampleDeckService';
import { UserRepository } from '../../src/repository/UserRepository';
import { DeckRepository } from '../../src/repository/DeckRepository';

describe('NewUserSampleDeckService', () => {
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockDeckRepository: jest.Mocked<DeckRepository>;
  let service: NewUserSampleDeckService;

  beforeEach(() => {
    mockUserRepository = {
      getUserByUsername: jest.fn(),
    } as any;

    mockDeckRepository = {
      getDecksByUserId: jest.fn(),
      getDeckSummaryWithAllCards: jest.fn(),
      createDeck: jest.fn(),
      updateDeck: jest.fn(),
      getDeckCards: jest.fn(),
      replaceAllCardsInDeck: jest.fn(),
    } as any;

    service = new NewUserSampleDeckService(mockUserRepository, mockDeckRepository);
  });

  it('returns null when guest user does not exist', async () => {
    mockUserRepository.getUserByUsername!.mockResolvedValue(undefined);

    const result = await service.copyRandomGuestDeckForUser('new-user-123');

    expect(result).toBeNull();
    expect(mockUserRepository.getUserByUsername).toHaveBeenCalledWith('guest');
    expect(mockDeckRepository.getDecksByUserId).not.toHaveBeenCalled();
  });

  it('returns null when guest has no decks', async () => {
    mockUserRepository.getUserByUsername!.mockResolvedValue({
      id: 'guest-id',
      name: 'guest',
      email: 'guest@example.com',
      role: 'GUEST',
    });
    mockDeckRepository.getDecksByUserId!.mockResolvedValue([]);

    const result = await service.copyRandomGuestDeckForUser('new-user-123');

    expect(result).toBeNull();
    expect(mockDeckRepository.getDecksByUserId).toHaveBeenCalledWith('guest-id');
    expect(mockDeckRepository.createDeck).not.toHaveBeenCalled();
  });

  it('copies a random guest deck with "Sample: " prefix', async () => {
    const guestUser = {
      id: 'guest-id',
      name: 'guest',
      email: 'guest@example.com',
      role: 'GUEST' as const,
    };
    const guestDecks = [
      {
        id: 'deck-1',
        user_id: 'guest-id',
        name: 'Time Detectives',
        description: 'A sample deck',
      },
      {
        id: 'deck-2',
        user_id: 'guest-id',
        name: 'The Resistance',
        description: 'Another sample',
      },
    ];
    const fullDeck = {
      id: 'deck-1',
      user_id: 'guest-id',
      name: 'Time Detectives',
      description: 'A sample deck',
      ui_preferences: { viewMode: 'tile' },
      is_limited: true,
      reserve_character: null,
      display_mission_card_id: null,
      background_image_path: null,
      cards: [],
    };
    const deckCards = [
      { id: 'c1', type: 'character', cardId: 'char-1', quantity: 1, exclude_from_draw: false },
      { id: 'c2', type: 'ally_universe', cardId: 'ally-1', quantity: 2, exclude_from_draw: false },
    ];
    const newDeck = {
      id: 'new-deck-id',
      user_id: 'new-user-123',
      name: 'Sample: Time Detectives',
      description: 'A sample deck',
    };

    mockUserRepository.getUserByUsername!.mockResolvedValue(guestUser);
    mockDeckRepository.getDecksByUserId!.mockResolvedValue(guestDecks);
    mockDeckRepository.getDeckSummaryWithAllCards!.mockResolvedValue(fullDeck as any);
    mockDeckRepository.createDeck!.mockResolvedValue(newDeck as any);
    mockDeckRepository.getDeckCards!.mockResolvedValue(deckCards as any);
    mockDeckRepository.updateDeck!.mockResolvedValue(newDeck as any);
    mockDeckRepository.replaceAllCardsInDeck!.mockResolvedValue(undefined);

    const result = await service.copyRandomGuestDeckForUser('new-user-123');

    expect(result).toBe('new-deck-id');
    expect(mockDeckRepository.createDeck).toHaveBeenCalledWith(
      'new-user-123',
      'Sample: Time Detectives',
      'A sample deck'
    );
    expect(mockDeckRepository.updateDeck).toHaveBeenCalledWith('new-deck-id', {
      is_signup_starter_copy: true,
      ui_preferences: fullDeck.ui_preferences,
      is_limited: fullDeck.is_limited,
      reserve_character: fullDeck.reserve_character,
      display_mission_card_id: fullDeck.display_mission_card_id,
      background_image_path: fullDeck.background_image_path,
    });
    expect(mockDeckRepository.replaceAllCardsInDeck).toHaveBeenCalledWith('new-deck-id', [
      { cardType: 'character', cardId: 'char-1', quantity: 1, exclude_from_draw: false },
      { cardType: 'ally-universe', cardId: 'ally-1', quantity: 2, exclude_from_draw: false },
    ]);
  });

  it('recomputes and persists is_valid for the copied deck when a validator is provided', async () => {
    const guestUser = { id: 'guest-id', name: 'guest', email: 'guest@example.com', role: 'GUEST' as const };
    const fullDeck = {
      id: 'deck-1',
      user_id: 'guest-id',
      name: 'Legal Deck',
      description: '',
      cards: [],
    };
    const deckCards = [
      { id: 'c1', type: 'character', cardId: 'char-1', quantity: 1 },
      { id: 'm1', type: 'mission', cardId: 'mission-1', quantity: 7 },
    ];
    const newDeck = { id: 'new-deck-id', user_id: 'new-user-123', name: 'Sample: Legal Deck', description: '' };

    mockUserRepository.getUserByUsername!.mockResolvedValue(guestUser);
    mockDeckRepository.getDecksByUserId!.mockResolvedValue([
      { id: 'deck-1', user_id: 'guest-id', name: 'Legal Deck', description: '' },
    ]);
    mockDeckRepository.getDeckSummaryWithAllCards!.mockResolvedValue(fullDeck as any);
    mockDeckRepository.createDeck!.mockResolvedValue(newDeck as any);
    mockDeckRepository.getDeckCards!.mockResolvedValue(deckCards as any);
    mockDeckRepository.updateDeck!.mockResolvedValue(newDeck as any);
    mockDeckRepository.replaceAllCardsInDeck!.mockResolvedValue(undefined);

    const validateDeck = jest.fn().mockResolvedValue([]); // legal -> no errors
    const serviceWithValidation = new NewUserSampleDeckService(
      mockUserRepository,
      mockDeckRepository,
      { validateDeck },
    );

    const result = await serviceWithValidation.copyRandomGuestDeckForUser('new-user-123');

    expect(result).toBe('new-deck-id');
    expect(validateDeck).toHaveBeenCalled();
    expect(mockDeckRepository.updateDeck).toHaveBeenCalledWith('new-deck-id', { is_valid: true });
  });

  it('persists is_valid=false for the copied deck when it fails validation', async () => {
    const guestUser = { id: 'guest-id', name: 'guest', email: 'guest@example.com', role: 'GUEST' as const };
    mockUserRepository.getUserByUsername!.mockResolvedValue(guestUser);
    mockDeckRepository.getDecksByUserId!.mockResolvedValue([
      { id: 'deck-1', user_id: 'guest-id', name: 'Broken Deck', description: '' },
    ]);
    mockDeckRepository.getDeckSummaryWithAllCards!.mockResolvedValue({
      id: 'deck-1', user_id: 'guest-id', name: 'Broken Deck', description: '', cards: [],
    } as any);
    mockDeckRepository.createDeck!.mockResolvedValue({ id: 'new-id', user_id: 'u', name: 'Sample: Broken Deck', description: '' } as any);
    mockDeckRepository.getDeckCards!.mockResolvedValue([{ id: 'c1', type: 'character', cardId: 'char-1', quantity: 1 }] as any);
    mockDeckRepository.updateDeck!.mockResolvedValue({} as any);
    mockDeckRepository.replaceAllCardsInDeck!.mockResolvedValue(undefined);

    const validateDeck = jest.fn().mockResolvedValue([{ rule: 'deck_size', message: 'too small' }]);
    const serviceWithValidation = new NewUserSampleDeckService(
      mockUserRepository,
      mockDeckRepository,
      { validateDeck },
    );

    await serviceWithValidation.copyRandomGuestDeckForUser('new-user-123');

    expect(mockDeckRepository.updateDeck).toHaveBeenCalledWith('new-id', { is_valid: false });
  });

  it('returns null and does not throw when replaceAllCardsInDeck fails', async () => {
    mockUserRepository.getUserByUsername!.mockResolvedValue({
      id: 'guest-id',
      name: 'guest',
      email: 'guest@example.com',
      role: 'GUEST',
    });
    mockDeckRepository.getDecksByUserId!.mockResolvedValue([
      { id: 'deck-1', user_id: 'guest-id', name: 'Test Deck', description: '' },
    ]);
    mockDeckRepository.getDeckSummaryWithAllCards!.mockResolvedValue({
      id: 'deck-1',
      user_id: 'guest-id',
      name: 'Test Deck',
      description: '',
      cards: [],
    });
    mockDeckRepository.createDeck!.mockResolvedValue({
      id: 'new-id',
      user_id: 'new-user',
      name: 'Sample: Test Deck',
      description: '',
    });
    mockDeckRepository.getDeckCards!.mockResolvedValue([]);
    mockDeckRepository.updateDeck!.mockResolvedValue({} as any);
    mockDeckRepository.replaceAllCardsInDeck!.mockRejectedValue(new Error('DB error'));

    const result = await service.copyRandomGuestDeckForUser('new-user-123');

    expect(result).toBeNull();
  });
});

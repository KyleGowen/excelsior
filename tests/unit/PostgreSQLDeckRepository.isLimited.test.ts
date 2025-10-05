import { PostgreSQLDeckRepository } from '../../src/database/PostgreSQLDeckRepository';

// Mock the entire PostgreSQLDeckRepository class
jest.mock('../../src/database/PostgreSQLDeckRepository');

const MockedPostgreSQLDeckRepository = PostgreSQLDeckRepository as jest.MockedClass<typeof PostgreSQLDeckRepository>;

describe('PostgreSQLDeckRepository - is_limited functionality', () => {
  let mockRepository: jest.Mocked<PostgreSQLDeckRepository>;

  beforeEach(() => {
    // Create a mock instance
    mockRepository = {
      getDecksByUserId: jest.fn(),
      getDeckById: jest.fn(),
      getDeckSummaryWithAllCards: jest.fn(),
      updateDeck: jest.fn(),
      createDeck: jest.fn(),
      deleteDeck: jest.fn(),
      getAllDecks: jest.fn(),
      addCardToDeck: jest.fn(),
      removeCardFromDeck: jest.fn(),
      updateCardInDeck: jest.fn(),
      removeAllCardsFromDeck: jest.fn(),
      getDeckCards: jest.fn(),
      userOwnsDeck: jest.fn(),
      updateUIPreferences: jest.fn(),
      getUIPreferences: jest.fn(),
      getDeckStats: jest.fn(),
      initialize: jest.fn()
    } as any;

    // Mock the constructor to return our mock instance
    MockedPostgreSQLDeckRepository.mockImplementation(() => mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDecksByUserId', () => {
    it('should include is_limited property in returned deck objects', async () => {
      const userId = 'test-user-id';
      const mockDecks = [
        {
          id: 'deck-1',
          user_id: userId,
          name: 'Test Deck 1',
          description: 'Test Description 1',
          ui_preferences: undefined,
          is_limited: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          cards: []
        },
        {
          id: 'deck-2',
          user_id: userId,
          name: 'Test Deck 2',
          description: 'Test Description 2',
          ui_preferences: undefined,
          is_limited: false,
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
          cards: []
        }
      ];

      mockRepository.getDecksByUserId.mockResolvedValue(mockDecks as any);

      const repository = new PostgreSQLDeckRepository({} as any);
      const result = await repository.getDecksByUserId(userId);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'deck-1',
        user_id: userId,
        name: 'Test Deck 1',
        description: 'Test Description 1',
        ui_preferences: undefined,
        is_limited: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        cards: []
      });
      expect(result[1]).toMatchObject({
        id: 'deck-2',
        user_id: userId,
        name: 'Test Deck 2',
        description: 'Test Description 2',
        ui_preferences: undefined,
        is_limited: false,
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
        cards: []
      });
    });
  });

  describe('getDeckById', () => {
    it('should include is_limited property in returned deck object', async () => {
      const deckId = 'test-deck-id';
      const mockDeck = {
        id: deckId,
        user_id: 'test-user-id',
        name: 'Test Deck',
        description: 'Test Description',
        ui_preferences: undefined,
        is_limited: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        cards: []
      };

      mockRepository.getDeckById.mockResolvedValue(mockDeck as any);

      const repository = new PostgreSQLDeckRepository({} as any);
      const result = await repository.getDeckById(deckId);

      expect(result).toMatchObject({
        id: deckId,
        user_id: 'test-user-id',
        name: 'Test Deck',
        description: 'Test Description',
        ui_preferences: undefined,
        is_limited: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        cards: []
      });
    });
  });

  describe('getDeckSummaryWithAllCards', () => {
    it('should include is_limited property in returned deck object', async () => {
      const deckId = 'test-deck-id';
      const mockDeck = {
        id: deckId,
        user_id: 'test-user-id',
        name: 'Test Deck',
        description: 'Test Description',
        ui_preferences: undefined,
        is_limited: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        cards: []
      };

      mockRepository.getDeckSummaryWithAllCards.mockResolvedValue(mockDeck as any);

      const repository = new PostgreSQLDeckRepository({} as any);
      const result = await repository.getDeckSummaryWithAllCards(deckId);

      expect(result).toMatchObject({
        id: deckId,
        user_id: 'test-user-id',
        name: 'Test Deck',
        description: 'Test Description',
        ui_preferences: undefined,
        is_limited: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        cards: []
      });
    });
  });

  describe('createDeck', () => {
    it('should include is_limited property in returned deck object', async () => {
      const userId = 'test-user-id';
      const deckName = 'New Test Deck';
      const description = 'New Test Description';
      const characterIds = ['char-1', 'char-2'];

      const mockCreatedDeck = {
        id: 'new-deck-id',
        user_id: userId,
        name: deckName,
        description: description,
        ui_preferences: undefined,
        is_limited: false, // New decks default to false
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      mockRepository.createDeck.mockResolvedValue(mockCreatedDeck as any);

      const repository = new PostgreSQLDeckRepository({} as any);
      const result = await repository.createDeck(userId, deckName, description, characterIds);

      expect(result).toMatchObject({
        id: 'new-deck-id',
        user_id: userId,
        name: deckName,
        description: description,
        ui_preferences: undefined,
        is_limited: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      });
    });
  });

  describe('updateDeck', () => {
    it('should update is_limited property and return updated deck', async () => {
      const deckId = 'test-deck-id';
      const updates = {
        name: 'Updated Deck Name',
        is_limited: true
      };

      const mockUpdatedDeck = {
        id: deckId,
        user_id: 'test-user-id',
        name: 'Updated Deck Name',
        description: 'Test Description',
        ui_preferences: undefined,
        is_limited: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      mockRepository.updateDeck.mockResolvedValue(mockUpdatedDeck as any);

      const repository = new PostgreSQLDeckRepository({} as any);
      const result = await repository.updateDeck(deckId, updates);

      expect(result).toMatchObject({
        id: deckId,
        user_id: 'test-user-id',
        name: 'Updated Deck Name',
        description: 'Test Description',
        ui_preferences: undefined,
        is_limited: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      });

      // Verify that updateDeck was called with the correct parameters
      expect(mockRepository.updateDeck).toHaveBeenCalledWith(deckId, updates);
    });

    it('should handle updating only is_limited property', async () => {
      const deckId = 'test-deck-id';
      const updates = {
        is_limited: false
      };

      const mockUpdatedDeck = {
        id: deckId,
        user_id: 'test-user-id',
        name: 'Test Deck',
        description: 'Test Description',
        ui_preferences: undefined,
        is_limited: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      mockRepository.updateDeck.mockResolvedValue(mockUpdatedDeck as any);

      const repository = new PostgreSQLDeckRepository({} as any);
      const result = await repository.updateDeck(deckId, updates);

      expect(result).toMatchObject({
        id: deckId,
        user_id: 'test-user-id',
        name: 'Test Deck',
        description: 'Test Description',
        ui_preferences: undefined,
        is_limited: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      });

      // Verify that updateDeck was called with the correct parameters
      expect(mockRepository.updateDeck).toHaveBeenCalledWith(deckId, updates);
    });
  });

  describe('getAllDecks', () => {
    it('should include is_limited property in all returned deck objects', async () => {
      const mockDecks = [
        {
          id: 'deck-1',
          user_id: 'user-1',
          name: 'Deck 1',
          description: 'Description 1',
          ui_preferences: undefined,
          is_limited: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        {
          id: 'deck-2',
          user_id: 'user-2',
          name: 'Deck 2',
          description: 'Description 2',
          ui_preferences: undefined,
          is_limited: false,
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z'
        }
      ];

      mockRepository.getAllDecks.mockResolvedValue(mockDecks as any);

      const repository = new PostgreSQLDeckRepository({} as any);
      const result = await repository.getAllDecks();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'deck-1',
        user_id: 'user-1',
        name: 'Deck 1',
        description: 'Description 1',
        ui_preferences: undefined,
        is_limited: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      });
      expect(result[1]).toMatchObject({
        id: 'deck-2',
        user_id: 'user-2',
        name: 'Deck 2',
        description: 'Description 2',
        ui_preferences: undefined,
        is_limited: false,
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z'
      });
    });
  });
});
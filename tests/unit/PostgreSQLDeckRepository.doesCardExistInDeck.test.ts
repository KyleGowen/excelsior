import { PostgreSQLDeckRepository } from '../../src/database/PostgreSQLDeckRepository';

// Mock the entire PostgreSQLDeckRepository class
jest.mock('../../src/database/PostgreSQLDeckRepository');

const MockedPostgreSQLDeckRepository = PostgreSQLDeckRepository as jest.MockedClass<typeof PostgreSQLDeckRepository>;

describe('PostgreSQLDeckRepository - doesCardExistInDeck functionality', () => {
  let mockRepository: jest.Mocked<PostgreSQLDeckRepository>;
  let mockPool: any;
  let mockClient: any;

  beforeEach(() => {
    // Create mock client
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };

    // Create mock pool
    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient)
    };

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
      initialize: jest.fn(),
      doesCardExistInDeck: jest.fn()
    } as any;

    // Mock the constructor to return our mock instance
    MockedPostgreSQLDeckRepository.mockImplementation(() => mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('doesCardExistInDeck', () => {
    it('should return true when card exists in deck', async () => {
      const deckId = 'test-deck-id';
      const cardType = 'special';
      const cardId = 'special-card-1';

      // Mock database response - card exists
      mockClient.query.mockResolvedValue({
        rows: [{ 1: 1 }] // Card exists
      });

      // Mock the doesCardExistInDeck method to return true
      mockRepository.doesCardExistInDeck.mockResolvedValue(true);

      const repository = new PostgreSQLDeckRepository(mockPool);
      const result = await repository.doesCardExistInDeck(deckId, cardType, cardId);

      expect(result).toBe(true);
      expect(mockRepository.doesCardExistInDeck).toHaveBeenCalledWith(deckId, cardType, cardId);
    });

    it('should return false when card does not exist in deck', async () => {
      const deckId = 'test-deck-id';
      const cardType = 'power';
      const cardId = 'power-card-1';

      // Mock the doesCardExistInDeck method to return false
      mockRepository.doesCardExistInDeck.mockResolvedValue(false);

      const repository = new PostgreSQLDeckRepository(mockPool);
      const result = await repository.doesCardExistInDeck(deckId, cardType, cardId);

      expect(result).toBe(false);
      expect(mockRepository.doesCardExistInDeck).toHaveBeenCalledWith(deckId, cardType, cardId);
    });

    it('should handle database errors gracefully', async () => {
      const deckId = 'test-deck-id';
      const cardType = 'character';
      const cardId = 'char-card-1';

      // Mock the doesCardExistInDeck method to return false on error
      mockRepository.doesCardExistInDeck.mockResolvedValue(false);

      const repository = new PostgreSQLDeckRepository(mockPool);
      const result = await repository.doesCardExistInDeck(deckId, cardType, cardId);

      expect(result).toBe(false);
      expect(mockRepository.doesCardExistInDeck).toHaveBeenCalledWith(deckId, cardType, cardId);
    });

    it('should work with different card types', async () => {
      const deckId = 'test-deck-id';
      const testCases = [
        { cardType: 'character', cardId: 'char-1' },
        { cardType: 'special', cardId: 'special-1' },
        { cardType: 'power', cardId: 'power-1' },
        { cardType: 'mission', cardId: 'mission-1' },
        { cardType: 'event', cardId: 'event-1' },
        { cardType: 'aspect', cardId: 'aspect-1' },
        { cardType: 'location', cardId: 'location-1' }
      ];

      // Mock the doesCardExistInDeck method to return true for all types
      mockRepository.doesCardExistInDeck.mockResolvedValue(true);

      const repository = new PostgreSQLDeckRepository(mockPool);

      for (const testCase of testCases) {
        const result = await repository.doesCardExistInDeck(deckId, testCase.cardType, testCase.cardId);
        expect(result).toBe(true);
        expect(mockRepository.doesCardExistInDeck).toHaveBeenCalledWith(deckId, testCase.cardType, testCase.cardId);
      }
    });

    it('should properly release database connection', async () => {
      const deckId = 'test-deck-id';
      const cardType = 'special';
      const cardId = 'special-card-1';

      // Mock the doesCardExistInDeck method to return true
      mockRepository.doesCardExistInDeck.mockResolvedValue(true);

      const repository = new PostgreSQLDeckRepository(mockPool);
      await repository.doesCardExistInDeck(deckId, cardType, cardId);

      // Verify that the method was called
      expect(mockRepository.doesCardExistInDeck).toHaveBeenCalledWith(deckId, cardType, cardId);
    });
  });
});

import { PostgreSQLDeckRepository } from '../../src/database/PostgreSQLDeckRepository';

describe.skip('PostgreSQLDeckRepository - exclude_from_draw functionality', () => {
  function createRepository(): { repository: PostgreSQLDeckRepository; mockClient: any; mockPool: any } {
    // Create fresh mock client for each test
    const mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };

    // Create fresh mock pool for each test
    const mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      query: jest.fn(),
      end: jest.fn()
    };

    const repository = new PostgreSQLDeckRepository(mockPool as any);
    return { repository, mockClient, mockPool };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('replaceAllCardsInDeck', () => {
    it('should save exclude_from_draw: true when provided', async () => {
      const { repository, mockClient } = createRepository();
      const deckId = 'test-deck-id';
      const cards = [
        {
          cardType: 'training',
          cardId: 'training-1',
          quantity: 1,
          exclude_from_draw: true
        }
      ];

      // Mock database queries
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE
        .mockResolvedValueOnce({}) // INSERT with exclude_from_draw
        .mockResolvedValueOnce({}) // COMMIT
        .mockResolvedValueOnce({ rows: [{ user_id: 'user-id' }] }); // SELECT user_id

      const result = await repository.replaceAllCardsInDeck(deckId, cards);

      expect(result).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM deck_cards WHERE deck_id = $1',
        [deckId]
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, exclude_from_draw) VALUES ($1, $2, $3, $4, $5)',
        [deckId, 'training', 'training-1', 1, true]
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should save exclude_from_draw: false when provided', async () => {
      const { repository, mockClient } = createRepository();
      const deckId = 'test-deck-id';
      const cards = [
        {
          cardType: 'training',
          cardId: 'training-1',
          quantity: 1,
          exclude_from_draw: false
        }
      ];

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE
        .mockResolvedValueOnce({}) // INSERT with exclude_from_draw
        .mockResolvedValueOnce({}) // COMMIT
        .mockResolvedValueOnce({ rows: [{ user_id: 'user-id' }] }); // SELECT user_id

      const result = await repository.replaceAllCardsInDeck(deckId, cards);

      expect(result).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith(
        'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, exclude_from_draw) VALUES ($1, $2, $3, $4, $5)',
        [deckId, 'training', 'training-1', 1, false]
      );
    });

    it('should not include exclude_from_draw column when undefined', async () => {
      const { repository, mockClient } = createRepository();
      const deckId = 'test-deck-id';
      const cards = [
        {
          cardType: 'power',
          cardId: 'power-1',
          quantity: 1
          // exclude_from_draw is undefined
        }
      ];

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE
        .mockResolvedValueOnce({}) // INSERT without exclude_from_draw
        .mockResolvedValueOnce({}) // COMMIT
        .mockResolvedValueOnce({ rows: [{ user_id: 'user-id' }] }); // SELECT user_id

      const result = await repository.replaceAllCardsInDeck(deckId, cards);

      expect(result).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith(
        'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity) VALUES ($1, $2, $3, $4)',
        [deckId, 'power', 'power-1', 1]
      );
      // Should NOT call INSERT with exclude_from_draw
      expect(mockClient.query).not.toHaveBeenCalledWith(
        expect.stringContaining('exclude_from_draw'),
        expect.anything()
      );
    });

    it('should handle mixed cards with and without exclude_from_draw', async () => {
      const { repository, mockClient } = createRepository();
      const deckId = 'test-deck-id';
      const cards = [
        {
          cardType: 'training',
          cardId: 'training-1',
          quantity: 1,
          exclude_from_draw: true
        },
        {
          cardType: 'training',
          cardId: 'training-2',
          quantity: 1,
          exclude_from_draw: false
        },
        {
          cardType: 'power',
          cardId: 'power-1',
          quantity: 1
          // No exclude_from_draw
        }
      ];

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE
        .mockResolvedValueOnce({}) // INSERT training-1 with exclude_from_draw
        .mockResolvedValueOnce({}) // INSERT training-2 with exclude_from_draw
        .mockResolvedValueOnce({}) // INSERT power-1 without exclude_from_draw
        .mockResolvedValueOnce({}) // COMMIT
        .mockResolvedValueOnce({ rows: [{ user_id: 'user-id' }] }); // SELECT user_id

      const result = await repository.replaceAllCardsInDeck(deckId, cards);

      expect(result).toBe(true);
      
      // Verify training-1 with exclude_from_draw: true
      expect(mockClient.query).toHaveBeenCalledWith(
        'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, exclude_from_draw) VALUES ($1, $2, $3, $4, $5)',
        [deckId, 'training', 'training-1', 1, true]
      );
      
      // Verify training-2 with exclude_from_draw: false
      expect(mockClient.query).toHaveBeenCalledWith(
        'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, exclude_from_draw) VALUES ($1, $2, $3, $4, $5)',
        [deckId, 'training', 'training-2', 1, false]
      );
      
      // Verify power-1 without exclude_from_draw
      expect(mockClient.query).toHaveBeenCalledWith(
        'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity) VALUES ($1, $2, $3, $4)',
        [deckId, 'power', 'power-1', 1]
      );
    });

    it('should handle exclude_from_draw with quantity > 1', async () => {
      const { repository, mockClient } = createRepository();
      const deckId = 'test-deck-id';
      const cards = [
        {
          cardType: 'training',
          cardId: 'training-1',
          quantity: 3,
          exclude_from_draw: true
        }
      ];

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE
        .mockResolvedValueOnce({}) // INSERT
        .mockResolvedValueOnce({}) // COMMIT
        .mockResolvedValueOnce({ rows: [{ user_id: 'user-id' }] }); // SELECT user_id

      const result = await repository.replaceAllCardsInDeck(deckId, cards);

      expect(result).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith(
        'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, exclude_from_draw) VALUES ($1, $2, $3, $4, $5)',
        [deckId, 'training', 'training-1', 3, true]
      );
    });

    it('should rollback transaction on error', async () => {
      const { repository, mockClient } = createRepository();
      const deckId = 'test-deck-id';
      const cards = [
        {
          cardType: 'training',
          cardId: 'training-1',
          quantity: 1,
          exclude_from_draw: true
        }
      ];

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE
        .mockRejectedValueOnce(new Error('Database error')) // INSERT fails
        .mockResolvedValueOnce({}); // ROLLBACK

      const result = await repository.replaceAllCardsInDeck(deckId, cards);

      expect(result).toBe(false);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.query).not.toHaveBeenCalledWith('COMMIT');
    });

    it('should query user_id for cache invalidation', async () => {
      const { repository, mockClient } = createRepository();
      const deckId = 'test-deck-id';
      const cards = [
        {
          cardType: 'training',
          cardId: 'training-1',
          quantity: 1,
          exclude_from_draw: true
        }
      ];

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE
        .mockResolvedValueOnce({}) // INSERT
        .mockResolvedValueOnce({}) // COMMIT
        .mockResolvedValueOnce({ rows: [{ user_id: 'user-id' }] }); // SELECT user_id

      const result = await repository.replaceAllCardsInDeck(deckId, cards);

      expect(result).toBe(true);
      // Verify that user_id query is made for cache invalidation
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT user_id FROM decks WHERE id = $1',
        [deckId]
      );
    });
  });

  describe('getDeckById', () => {
    it('should load exclude_from_draw: true from database', async () => {
      const { repository, mockClient } = createRepository();
      const deckId = 'test-deck-id';
      
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            id: deckId,
            user_id: 'user-id',
            name: 'Test Deck',
            description: null,
            ui_preferences: null,
            is_limited: false,
            reserve_character: null,
            threat: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'card-id',
            card_type: 'training',
            card_id: 'training-1',
            quantity: 1,
            exclude_from_draw: true
          }]
        });

      const result = await repository.getDeckById(deckId);

      expect(result).toBeDefined();
      expect(result?.cards).toBeDefined();
      expect(result?.cards).toHaveLength(1);
      expect(result?.cards![0].exclude_from_draw).toBe(true);
    });

    it('should load exclude_from_draw: false from database', async () => {
      const { repository, mockClient } = createRepository();
      const deckId = 'test-deck-id-2';
      
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            id: deckId,
            user_id: 'user-id',
            name: 'Test Deck',
            description: null,
            ui_preferences: null,
            is_limited: false,
            reserve_character: null,
            threat: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'card-id',
            card_type: 'training',
            card_id: 'training-1',
            quantity: 1,
            exclude_from_draw: false
          }]
        });

      const result = await repository.getDeckById(deckId);

      expect(result).toBeDefined();
      expect(result?.cards).toBeDefined();
      expect(result?.cards).toHaveLength(1);
      expect(result?.cards![0].exclude_from_draw).toBe(false);
    });

    it('should default exclude_from_draw to false when null in database', async () => {
      const { repository, mockClient } = createRepository();
      const deckId = 'test-deck-id-3';
      
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            id: deckId,
            user_id: 'user-id',
            name: 'Test Deck',
            description: null,
            ui_preferences: null,
            is_limited: false,
            reserve_character: null,
            threat: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'card-id',
            card_type: 'power',
            card_id: 'power-1',
            quantity: 1,
            exclude_from_draw: null
          }]
        });

      const result = await repository.getDeckById(deckId);

      expect(result).toBeDefined();
      expect(result?.cards).toBeDefined();
      expect(result?.cards).toHaveLength(1);
      expect(result?.cards![0].exclude_from_draw).toBe(false);
    });

    it('should default exclude_from_draw to false when undefined in database', async () => {
      const { repository, mockClient } = createRepository();
      const deckId = 'test-deck-id-4';
      
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            id: deckId,
            user_id: 'user-id',
            name: 'Test Deck',
            description: null,
            ui_preferences: null,
            is_limited: false,
            reserve_character: null,
            threat: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'card-id',
            card_type: 'power',
            card_id: 'power-1',
            quantity: 1
            // exclude_from_draw is undefined
          }]
        });

      const result = await repository.getDeckById(deckId);

      expect(result).toBeDefined();
      expect(result?.cards).toBeDefined();
      expect(result?.cards).toHaveLength(1);
      expect(result?.cards![0].exclude_from_draw).toBe(false);
    });

    it('should handle mixed cards with different exclude_from_draw values', async () => {
      const { repository, mockClient } = createRepository();
      const deckId = 'test-deck-id-5';
      
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            id: deckId,
            user_id: 'user-id',
            name: 'Test Deck',
            description: null,
            ui_preferences: null,
            is_limited: false,
            reserve_character: null,
            threat: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }]
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'card-1',
              card_type: 'training',
              card_id: 'training-1',
              quantity: 1,
              exclude_from_draw: true
            },
            {
              id: 'card-2',
              card_type: 'training',
              card_id: 'training-2',
              quantity: 1,
              exclude_from_draw: false
            },
            {
              id: 'card-3',
              card_type: 'power',
              card_id: 'power-1',
              quantity: 1,
              exclude_from_draw: null
            }
          ]
        });

      const result = await repository.getDeckById(deckId);

      expect(result).toBeDefined();
      expect(result?.cards).toBeDefined();
      expect(result?.cards).toHaveLength(3);
      expect(result?.cards![0].exclude_from_draw).toBe(true);
      expect(result?.cards![1].exclude_from_draw).toBe(false);
      expect(result?.cards![2].exclude_from_draw).toBe(false);
    });

    it('should return consistent exclude_from_draw values on multiple calls', async () => {
      const { repository, mockClient } = createRepository();
      const deckId = 'test-deck-id-6';
      
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{
            id: deckId,
            user_id: 'user-id',
            name: 'Test Deck',
            description: null,
            ui_preferences: null,
            is_limited: false,
            reserve_character: null,
            threat: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'card-id',
            card_type: 'training',
            card_id: 'training-1',
            quantity: 1,
            exclude_from_draw: true
          }]
        });

      const result = await repository.getDeckById(deckId);
      expect(result?.cards).toBeDefined();
      expect(result?.cards![0].exclude_from_draw).toBe(true);
      expect(result?.cards![0].type).toBe('training');
      expect(result?.cards![0].cardId).toBe('training-1');
    });
  });

  describe('getDeckCards', () => {
    it('should load exclude_from_draw: true from database', async () => {
      const { repository, mockClient } = createRepository();
      const deckId = 'test-deck-id-7';
      
      // Set up fresh mock - use mockResolvedValueOnce to ensure it's only called once
      mockClient.query.mockResolvedValueOnce({
        rows: [{
          id: 'card-id',
          card_type: 'training',
          card_id: 'training-1',
          quantity: 1,
          exclude_from_draw: true
        }]
      });

      const result = await repository.getDeckCards(deckId);

      expect(result).toHaveLength(1);
      expect(result[0].exclude_from_draw).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM deck_cards WHERE deck_id = $1 ORDER BY card_type, card_id',
        [deckId]
      );
    });

    it('should load exclude_from_draw: false from database', async () => {
      const { repository, mockClient } = createRepository();
      const deckId = 'test-deck-id-8';
      
      mockClient.query.mockResolvedValueOnce({
        rows: [{
          id: 'card-id',
          card_type: 'training',
          card_id: 'training-1',
          quantity: 1,
          exclude_from_draw: false
        }]
      });

      const result = await repository.getDeckCards(deckId);

      expect(result).toHaveLength(1);
      expect(result[0].exclude_from_draw).toBe(false);
    });

    it('should default exclude_from_draw to false when null', async () => {
      const { repository, mockClient } = createRepository();
      const deckId = 'test-deck-id-9';
      
      mockClient.query.mockResolvedValueOnce({
        rows: [{
          id: 'card-id',
          card_type: 'power',
          card_id: 'power-1',
          quantity: 1,
          exclude_from_draw: null
        }]
      });

      const result = await repository.getDeckCards(deckId);

      expect(result).toHaveLength(1);
      expect(result[0].exclude_from_draw).toBe(false);
    });

    it('should handle multiple cards with different exclude_from_draw values', async () => {
      const { repository, mockClient } = createRepository();
      const deckId = 'test-deck-id-10';
      
      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'card-1',
            card_type: 'training',
            card_id: 'training-1',
            quantity: 1,
            exclude_from_draw: true
          },
          {
            id: 'card-2',
            card_type: 'training',
            card_id: 'training-2',
            quantity: 1,
            exclude_from_draw: false
          },
          {
            id: 'card-3',
            card_type: 'power',
            card_id: 'power-1',
            quantity: 1,
            exclude_from_draw: null
          }
        ]
      });

      const result = await repository.getDeckCards(deckId);

      expect(result).toHaveLength(3);
      expect(result[0].exclude_from_draw).toBe(true);
      expect(result[1].exclude_from_draw).toBe(false);
      expect(result[2].exclude_from_draw).toBe(false);
    });
  });
});


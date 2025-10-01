/**
 * Unit tests for PostgreSQLDeckRepository
 * Tests the actual repository code with mocked database connections
 */

import { Pool, PoolClient } from 'pg';
import { PostgreSQLDeckRepository } from '../../src/database/PostgreSQLDeckRepository';
import { Deck, UIPreferences, DeckCard } from '../../src/types';

// Mock the pg module
jest.mock('pg', () => ({
  Pool: jest.fn(),
  PoolClient: jest.fn()
}));

describe('PostgreSQLDeckRepository', () => {
  let repository: PostgreSQLDeckRepository;
  let mockPool: jest.Mocked<Pool>;
  let mockClient: jest.Mocked<PoolClient>;

  beforeEach(() => {
    // Create mock client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
      connect: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      setMaxListeners: jest.fn(),
      getMaxListeners: jest.fn(),
      listeners: jest.fn(),
      rawListeners: jest.fn(),
      emit: jest.fn(),
      listenerCount: jest.fn(),
      prependListener: jest.fn(),
      prependOnceListener: jest.fn(),
      eventNames: jest.fn()
    } as any;

    // Create mock pool
    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      end: jest.fn(),
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0
    } as any;

    repository = new PostgreSQLDeckRepository(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await repository.initialize();
      
      expect(consoleSpy).toHaveBeenCalledWith('✅ PostgreSQL DeckRepository initialized');
      
      consoleSpy.mockRestore();
    });
  });

  describe('createDeck', () => {
    it('should create a deck successfully without characters', async () => {
      const mockDeck = {
        id: 'deck-123',
        user_id: 'user-123',
        name: 'Test Deck',
        description: 'A test deck',
        ui_preferences: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'BEGIN', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockDeck], rowCount: 1, command: 'INSERT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'COMMIT', oid: 0, fields: [] });

      const result = await repository.createDeck('user-123', 'Test Deck', 'A test deck');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        'INSERT INTO decks (user_id, name, description) VALUES ($1, $2, $3) RETURNING *',
        ['user-123', 'Test Deck', 'A test deck']
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(result).toEqual({
        id: 'deck-123',
        user_id: 'user-123',
        name: 'Test Deck',
        description: 'A test deck',
        ui_preferences: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        cards: []
      });
    });

    it('should create a deck with character cards', async () => {
      const mockDeck = {
        id: 'deck-123',
        user_id: 'user-123',
        name: 'Test Deck',
        description: null,
        ui_preferences: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'BEGIN', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockDeck], rowCount: 1, command: 'INSERT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: 'INSERT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'COMMIT', oid: 0, fields: [] });

      const result = await repository.createDeck('user-123', 'Test Deck', undefined, ['char-1', 'char-2']);

      expect(mockClient.query).toHaveBeenCalledWith(
        'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity) VALUES ($1, $2, $3, $4)',
        ['deck-123', 'character', 'char-1', 1]
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity) VALUES ($1, $2, $3, $4)',
        ['deck-123', 'character', 'char-2', 1]
      );
      expect(result.cards).toEqual([]);
    });

    it('should handle transaction rollback on error', async () => {
      const error = new Error('Database error');
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'BEGIN', oid: 0, fields: [] })
        .mockRejectedValueOnce(error);

      await expect(repository.createDeck('user-123', 'Test Deck'))
        .rejects.toThrow('Database error');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDeckById', () => {
    it('should return a deck when found', async () => {
      const mockDeck = {
        id: 'deck-123',
        user_id: 'user-123',
        name: 'Test Deck',
        description: 'A test deck',
        ui_preferences: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockCards = [
        {
          id: 'card-1',
          deck_id: 'deck-123',
          card_type: 'character',
          card_id: 'char-1',
          quantity: 1,
          selected_alternate_image: null,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        }
      ];

      mockClient.query
        .mockResolvedValueOnce({ rows: [mockDeck], rowCount: 1, command: 'SELECT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockCards, rowCount: 1, command: 'SELECT', oid: 0, fields: [] });

      const result = await repository.getDeckById('deck-123');

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM decks WHERE id = $1',
        ['deck-123']
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM deck_cards WHERE deck_id = $1 ORDER BY created_at ASC',
        ['deck-123']
      );
      expect(result).toEqual({
        id: 'deck-123',
        user_id: 'user-123',
        name: 'Test Deck',
        description: 'A test deck',
        ui_preferences: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        cards: [{
          id: 'card-1',
          deck_id: 'deck-123',
          card_type: 'character',
          card_id: 'char-1',
          quantity: 1,
          selected_alternate_image: null,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        }]
      });
    });

    it('should return undefined when deck not found', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await repository.getDeckById('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('getDecksByUserId', () => {
    it('should return decks for a user', async () => {
      const mockDecks = [
        {
          id: 'deck-1',
          user_id: 'user-123',
          name: 'Deck 1',
          description: 'First deck',
          ui_preferences: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 'deck-2',
          user_id: 'user-123',
          name: 'Deck 2',
          description: 'Second deck',
          ui_preferences: [],
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z'
        }
      ];

      mockClient.query.mockResolvedValueOnce({
        rows: mockDecks,
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await repository.getDecksByUserId('user-123');

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM decks WHERE user_id = $1 ORDER BY updated_at DESC',
        ['user-123']
      );
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Deck 1');
      expect(result[1].name).toBe('Deck 2');
    });

    it('should return empty array when no decks found', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await repository.getDecksByUserId('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('updateDeck', () => {
    it('should update a deck successfully', async () => {
      const mockDeck = {
        id: 'deck-123',
        user_id: 'user-123',
        name: 'Updated Deck',
        description: 'Updated description',
        ui_preferences: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      mockClient.query.mockResolvedValueOnce({
        rows: [mockDeck],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const result = await repository.updateDeck('deck-123', {
        name: 'Updated Deck',
        description: 'Updated description'
      });

      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE decks SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        ['Updated Deck', 'Updated description', 'deck-123']
      );
      expect(result).toEqual({
        id: 'deck-123',
        user_id: 'user-123',
        name: 'Updated Deck',
        description: 'Updated description',
        ui_preferences: [],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        cards: []
      });
    });

    it('should return undefined when deck not found for update', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'UPDATE',
        oid: 0,
        fields: []
      });

      const result = await repository.updateDeck('nonexistent', {
        name: 'Updated Deck'
      });

      expect(result).toBeUndefined();
    });
  });

  describe('deleteDeck', () => {
    it('should delete a deck successfully', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: 'DELETE',
        oid: 0,
        fields: []
      });

      const result = await repository.deleteDeck('deck-123');

      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM decks WHERE id = $1',
        ['deck-123']
      );
      expect(result).toBe(true);
    });

    it('should return false when deck not found for deletion', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'DELETE',
        oid: 0,
        fields: []
      });

      const result = await repository.deleteDeck('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('addCardToDeck', () => {
    it('should add a card to deck successfully', async () => {
      const mockCard = {
        id: 'card-123',
        deck_id: 'deck-123',
        card_type: 'character',
        card_id: 'char-1',
        quantity: 1,
        selected_alternate_image: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'BEGIN', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockCard], rowCount: 1, command: 'INSERT', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'COMMIT', oid: 0, fields: [] });

      const result = await repository.addCardToDeck('deck-123', 'character', 'char-1', 1);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity) VALUES ($1, $2, $3, $4) RETURNING *',
        ['deck-123', 'character', 'char-1', 1]
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(result).toEqual({
        id: 'card-123',
        deck_id: 'deck-123',
        card_type: 'character',
        card_id: 'char-1',
        quantity: 1,
        selected_alternate_image: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });

    it('should handle duplicate card by updating quantity', async () => {
      const mockCard = {
        id: 'card-123',
        deck_id: 'deck-123',
        card_type: 'character',
        card_id: 'char-1',
        quantity: 2,
        selected_alternate_image: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'BEGIN', oid: 0, fields: [] })
        .mockRejectedValueOnce({ code: '23505' }) // Unique constraint violation
        .mockResolvedValueOnce({ rows: [mockCard], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'COMMIT', oid: 0, fields: [] });

      const result = await repository.addCardToDeck('deck-123', 'character', 'char-1', 1);

      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE deck_cards SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE deck_id = $2 AND card_type = $3 AND card_id = $4 RETURNING *',
        [1, 'deck-123', 'character', 'char-1']
      );
      expect(result.quantity).toBe(2);
    });
  });

  describe('removeCardFromDeck', () => {
    it('should remove a card from deck successfully', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'BEGIN', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 1, command: 'DELETE', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'COMMIT', oid: 0, fields: [] });

      const result = await repository.removeCardFromDeck('deck-123', 'character', 'char-1');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM deck_cards WHERE deck_id = $1 AND card_type = $2 AND card_id = $3',
        ['deck-123', 'character', 'char-1']
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(result).toBe(true);
    });

    it('should return false when card not found for removal', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'BEGIN', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'DELETE', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'COMMIT', oid: 0, fields: [] });

      const result = await repository.removeCardFromDeck('deck-123', 'character', 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('updateCardQuantity', () => {
    it('should update card quantity successfully', async () => {
      const mockCard = {
        id: 'card-123',
        deck_id: 'deck-123',
        card_type: 'character',
        card_id: 'char-1',
        quantity: 3,
        selected_alternate_image: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'BEGIN', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockCard], rowCount: 1, command: 'UPDATE', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'COMMIT', oid: 0, fields: [] });

      const result = await repository.updateCardQuantity('deck-123', 'character', 'char-1', 3);

      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE deck_cards SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE deck_id = $2 AND card_type = $3 AND card_id = $4 RETURNING *',
        [3, 'deck-123', 'character', 'char-1']
      );
      expect(result).toEqual(mockCard);
    });

    it('should return undefined when card not found for quantity update', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'BEGIN', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'UPDATE', oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'COMMIT', oid: 0, fields: [] });

      const result = await repository.updateCardQuantity('deck-123', 'character', 'nonexistent', 3);

      expect(result).toBeUndefined();
    });
  });

  describe('getDeckCards', () => {
    it('should return deck cards', async () => {
      const mockCards = [
        {
          id: 'card-1',
          deck_id: 'deck-123',
          card_type: 'character',
          card_id: 'char-1',
          quantity: 1,
          selected_alternate_image: null,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 'card-2',
          deck_id: 'deck-123',
          card_type: 'special',
          card_id: 'spec-1',
          quantity: 2,
          selected_alternate_image: null,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        }
      ];

      mockClient.query.mockResolvedValueOnce({
        rows: mockCards,
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await repository.getDeckCards('deck-123');

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM deck_cards WHERE deck_id = $1 ORDER BY created_at ASC',
        ['deck-123']
      );
      expect(result).toEqual(mockCards);
    });
  });

  describe('getDeckCount', () => {
    it('should return total deck count', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ count: '15' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await repository.getDeckCount();

      expect(mockClient.query).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM decks');
      expect(result).toBe(15);
    });
  });

  describe('getDeckCountByUserId', () => {
    it('should return deck count for user', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [{ count: '5' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await repository.getDeckCountByUserId('user-123');

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM decks WHERE user_id = $1',
        ['user-123']
      );
      expect(result).toBe(5);
    });
  });

  describe('searchDecks', () => {
    it('should search decks by query', async () => {
      const mockDecks = [
        {
          id: 'deck-1',
          user_id: 'user-123',
          name: 'Test Deck',
          description: 'A test deck',
          ui_preferences: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        }
      ];

      mockClient.query.mockResolvedValueOnce({
        rows: mockDecks,
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await repository.searchDecks('test');

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM decks WHERE name ILIKE $1 OR description ILIKE $1 ORDER BY updated_at DESC',
        ['%test%']
      );
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Deck');
    });
  });

  describe('getRecentDecks', () => {
    it('should return recent decks with limit', async () => {
      const mockDecks = [
        {
          id: 'deck-1',
          user_id: 'user-123',
          name: 'Recent Deck',
          description: 'A recent deck',
          ui_preferences: [],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        }
      ];

      mockClient.query.mockResolvedValueOnce({
        rows: mockDecks,
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const result = await repository.getRecentDecks(5);

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM decks ORDER BY updated_at DESC LIMIT $1',
        [5]
      );
      expect(result).toHaveLength(1);
    });

    it('should use default limit when not specified', async () => {
      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      await repository.getRecentDecks();

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM decks ORDER BY updated_at DESC LIMIT $1',
        [10]
      );
    });
  });

  describe('Error handling', () => {
    it('should always release client connection even on error', async () => {
      const error = new Error('Database error');
      mockClient.query.mockRejectedValueOnce(error);

      await expect(repository.createDeck('user-123', 'Test Deck'))
        .rejects.toThrow('Database error');

      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should handle pool connection errors', async () => {
      const error = new Error('Pool connection failed');
      mockPool.connect.mockRejectedValueOnce(error);

      await expect(repository.createDeck('user-123', 'Test Deck'))
        .rejects.toThrow('Pool connection failed');
    });
  });
});

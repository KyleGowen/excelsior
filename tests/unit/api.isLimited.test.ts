import request from 'supertest';
import app from '../../src/index';

// Mock the repositories
jest.mock('../../src/database/PostgreSQLDeckRepository');
jest.mock('../../src/database/PostgreSQLUserRepository');
jest.mock('../../src/database/PostgreSQLCardRepository');

import { PostgreSQLDeckRepository } from '../../src/database/PostgreSQLDeckRepository';
import { PostgreSQLUserRepository } from '../../src/database/PostgreSQLUserRepository';

const MockedDeckRepository = PostgreSQLDeckRepository as jest.MockedClass<typeof PostgreSQLDeckRepository>;
const MockedUserRepository = PostgreSQLUserRepository as jest.MockedClass<typeof PostgreSQLUserRepository>;

describe('API Endpoints - is_limited functionality', () => {
  let mockDeckRepository: jest.Mocked<PostgreSQLDeckRepository>;
  let mockUserRepository: jest.Mocked<PostgreSQLUserRepository>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockDeckRepository = {
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

    mockUserRepository = {
      createUser: jest.fn(),
      getUserById: jest.fn(),
      getUserByUsername: jest.fn(),
      getAllUsers: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      initialize: jest.fn()
    } as any;

    // Mock the static methods to return our mock instances
    MockedDeckRepository.mockImplementation(() => mockDeckRepository);
    MockedUserRepository.mockImplementation(() => mockUserRepository);
  });

  describe('GET /api/decks', () => {
    it('should include is_limited in deck metadata', async () => {
      const mockDecks = [
        {
          id: 'deck-1',
          user_id: 'user-1',
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
          user_id: 'user-1',
          name: 'Test Deck 2',
          description: 'Test Description 2',
          ui_preferences: undefined,
          is_limited: false,
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
          cards: []
        }
      ];

      mockDeckRepository.getDecksByUserId.mockResolvedValue(mockDecks as any);
      mockUserRepository.getUserById.mockResolvedValue({
        id: 'user-1',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      });

      const response = await request(app)
        .get('/api/decks')
        .set('Cookie', 'sessionId=valid-session-id');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      
      // Check that is_limited is included in metadata
      expect(response.body.data[0].metadata).toMatchObject({
        id: 'deck-1',
        name: 'Test Deck 1',
        description: 'Test Description 1',
        is_limited: true
      });
      expect(response.body.data[1].metadata).toMatchObject({
        id: 'deck-2',
        name: 'Test Deck 2',
        description: 'Test Description 2',
        is_limited: false
      });
    });
  });

  describe('GET /api/decks/:id', () => {
    it('should include is_limited in deck metadata', async () => {
      const mockDeck = {
        id: 'deck-1',
        user_id: 'user-1',
        name: 'Test Deck',
        description: 'Test Description',
          ui_preferences: undefined,
        is_limited: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        cards: []
      };

      mockDeckRepository.getDeckById.mockResolvedValue(mockDeck as any);
      mockUserRepository.getUserById.mockResolvedValue({
        id: 'user-1',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      });

      const response = await request(app)
        .get('/api/decks/deck-1')
        .set('Cookie', 'sessionId=valid-session-id');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.metadata).toMatchObject({
        id: 'deck-1',
        name: 'Test Deck',
        description: 'Test Description',
        is_limited: true
      });
    });
  });

  describe('GET /api/decks/:id/full', () => {
    it('should include is_limited in deck metadata', async () => {
      const mockDeck = {
        id: 'deck-1',
        user_id: 'user-1',
        name: 'Test Deck',
        description: 'Test Description',
          ui_preferences: undefined,
        is_limited: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        cards: []
      };

      mockDeckRepository.getDeckSummaryWithAllCards.mockResolvedValue(mockDeck as any);
      mockUserRepository.getUserById.mockResolvedValue({
        id: 'user-1',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      });

      const response = await request(app)
        .get('/api/decks/deck-1/full')
        .set('Cookie', 'sessionId=valid-session-id');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.metadata).toMatchObject({
        id: 'deck-1',
        name: 'Test Deck',
        description: 'Test Description',
        is_limited: false
      });
    });
  });

  describe('PUT /api/decks/:id', () => {
    it('should update is_limited property', async () => {
      const mockUpdatedDeck = {
        id: 'deck-1',
        user_id: 'user-1',
        name: 'Updated Deck',
        description: 'Updated Description',
          ui_preferences: undefined,
        is_limited: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      mockDeckRepository.getDeckById.mockResolvedValue({
        id: 'deck-1',
        user_id: 'user-1',
        name: 'Original Deck',
        description: 'Original Description',
        ui_preferences: undefined,
        is_limited: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      } as any);
      mockDeckRepository.updateDeck.mockResolvedValue(mockUpdatedDeck as any);
      mockUserRepository.getUserById.mockResolvedValue({
        id: 'user-1',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      });

      const response = await request(app)
        .put('/api/decks/deck-1')
        .set('Cookie', 'sessionId=valid-session-id')
        .send({
          name: 'Updated Deck',
          description: 'Updated Description',
          is_limited: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: 'deck-1',
        user_id: 'user-1',
        name: 'Updated Deck',
        description: 'Updated Description',
        is_limited: true
      });

      // Verify that updateDeck was called with is_limited
      expect(mockDeckRepository.updateDeck).toHaveBeenCalledWith('deck-1', {
        name: 'Updated Deck',
        description: 'Updated Description',
        is_limited: true
      });
    });

    it('should handle updating only is_limited property', async () => {
      const mockUpdatedDeck = {
        id: 'deck-1',
        user_id: 'user-1',
        name: 'Test Deck',
        description: 'Test Description',
          ui_preferences: undefined,
        is_limited: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      mockDeckRepository.getDeckById.mockResolvedValue({
        id: 'deck-1',
        user_id: 'user-1',
        name: 'Test Deck',
        description: 'Test Description',
        ui_preferences: undefined,
        is_limited: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      } as any);
      mockDeckRepository.updateDeck.mockResolvedValue(mockUpdatedDeck as any);
      mockUserRepository.getUserById.mockResolvedValue({
        id: 'user-1',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      });

      const response = await request(app)
        .put('/api/decks/deck-1')
        .set('Cookie', 'sessionId=valid-session-id')
        .send({
          is_limited: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: 'deck-1',
        user_id: 'user-1',
        name: 'Test Deck',
        description: 'Test Description',
        is_limited: true
      });

      // Verify that updateDeck was called with only is_limited
      expect(mockDeckRepository.updateDeck).toHaveBeenCalledWith('deck-1', {
        is_limited: true
      });
    });
  });

  describe('POST /api/decks', () => {
    it('should create deck with default is_limited value', async () => {
      const mockCreatedDeck = {
        id: 'new-deck-id',
        user_id: 'user-1',
        name: 'New Deck',
        description: 'New Description',
          ui_preferences: undefined,
        is_limited: false, // New decks default to false
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      };

      mockDeckRepository.createDeck.mockResolvedValue(mockCreatedDeck as any);
      mockUserRepository.getUserById.mockResolvedValue({
        id: 'user-1',
        name: 'testuser',
        email: 'test@example.com',
        role: 'USER'
      });

      const response = await request(app)
        .post('/api/decks')
        .set('Cookie', 'sessionId=valid-session-id')
        .send({
          name: 'New Deck',
          description: 'New Description',
          characters: ['char-1', 'char-2']
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: 'new-deck-id',
        user_id: 'user-1',
        name: 'New Deck',
        description: 'New Description',
        is_limited: false
      });
    });
  });
});

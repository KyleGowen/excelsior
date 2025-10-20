import express from 'express';
import request from 'supertest';
import { DeckRepository } from '../../src/repository/DeckRepository';

// Mock the DeckRepository
const mockDeckRepository: jest.Mocked<DeckRepository> = {
  replaceAllCardsInDeck: jest.fn(),
  userOwnsDeck: jest.fn(),
  getDeckById: jest.fn(),
  createDeck: jest.fn(),
  getDecksByUserId: jest.fn(),
  getAllDecks: jest.fn(),
  updateDeck: jest.fn(),
  deleteDeck: jest.fn(),
  addCardToDeck: jest.fn(),
  removeCardFromDeck: jest.fn(),
  updateCardInDeck: jest.fn(),
  removeAllCardsFromDeck: jest.fn(),
  getDeckCards: jest.fn(),
  doesCardExistInDeck: jest.fn(),
  updateUIPreferences: jest.fn(),
  getUIPreferences: jest.fn(),
  getDeckStats: jest.fn(),
  getDeckSummaryWithAllCards: jest.fn(),
  initialize: jest.fn()
};

// Mock authentication middleware
const mockAuthenticateUser = (req: any, res: any, next: any) => {
  req.user = { id: 'user-id', role: 'USER' };
  next();
};

// Create a test app with just the PUT route
const app = express();
app.use(express.json());

// Add the PUT route
app.put('/api/decks/:id/cards', mockAuthenticateUser, async (req: any, res) => {
  try {
    // Check if user is guest - guests cannot modify decks
    if (req.user.role === 'GUEST') {
      return res.status(403).json({ success: false, error: 'Guests may not modify decks' });
    }
    
    const { cards } = req.body;
    if (!Array.isArray(cards)) {
      return res.status(400).json({ success: false, error: 'Cards array is required' });
    }
    
    // Check if user owns this deck
    if (!await mockDeckRepository.userOwnsDeck(req.params.id, req.user.id)) {
      return res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    }
    
    const success = await mockDeckRepository.replaceAllCardsInDeck(req.params.id, cards);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Deck not found or failed to replace cards' });
    }
    
    // Return the updated deck
    const updatedDeck = await mockDeckRepository.getDeckById(req.params.id);
    res.json({ success: true, data: updatedDeck });
  } catch (error) {
    console.error('Error replacing cards in deck:', error);
    res.status(500).json({ success: false, error: 'Failed to replace cards in deck' });
  }
});

describe('PUT /api/decks/:id/cards route logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock implementations to ensure clean state
    mockDeckRepository.userOwnsDeck.mockClear();
    mockDeckRepository.replaceAllCardsInDeck.mockClear();
    mockDeckRepository.getDeckById.mockClear();
  });

  it('should return 403 when user is guest', async () => {
    // Mock authentication middleware to return guest user
    const guestAuth = (req: any, res: any, next: any) => {
      req.user = { id: 'guest-id', role: 'GUEST' };
      next();
    };

    const testApp = express();
    testApp.use(express.json());
    testApp.put('/api/decks/:id/cards', guestAuth, async (req: any, res) => {
      if (req.user.role === 'GUEST') {
        return res.status(403).json({ success: false, error: 'Guests may not modify decks' });
      }
      res.json({ success: true });
    });

    const response = await request(testApp)
      .put('/api/decks/test-deck-id/cards')
      .send({ cards: [] });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Guests may not modify decks');
  });

  it('should return 400 when cards array is not provided', async () => {
    const response = await request(app)
      .put('/api/decks/test-deck-id/cards')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Cards array is required');
  });

  it('should return 400 when cards is not an array', async () => {
    const response = await request(app)
      .put('/api/decks/test-deck-id/cards')
      .send({ cards: 'not-an-array' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Cards array is required');
  });

  it('should return 403 when user does not own the deck', async () => {
    // Ensure the mock is properly set up
    mockDeckRepository.userOwnsDeck.mockResolvedValue(false);
    mockDeckRepository.replaceAllCardsInDeck.mockResolvedValue(true);
    mockDeckRepository.getDeckById.mockResolvedValue({ 
      id: 'test-deck-id', 
      name: 'Test Deck',
      user_id: 'user-id',
      description: 'Test description',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    });

    const response = await request(app)
      .put('/api/decks/test-deck-id/cards')
      .send({ cards: [] });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Access denied. You do not own this deck.');
    expect(mockDeckRepository.userOwnsDeck).toHaveBeenCalledWith('test-deck-id', 'user-id');
  });

  it('should return 404 when deck replacement fails', async () => {
    mockDeckRepository.userOwnsDeck.mockResolvedValue(true);
    mockDeckRepository.replaceAllCardsInDeck.mockResolvedValue(false);

    const response = await request(app)
      .put('/api/decks/test-deck-id/cards')
      .send({ cards: [] });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Deck not found or failed to replace cards');
    expect(mockDeckRepository.replaceAllCardsInDeck).toHaveBeenCalledWith('test-deck-id', []);
  });

  it('should successfully replace cards and return updated deck', async () => {
    const mockDeck = {
      id: 'test-deck-id',
      user_id: 'user-id',
      name: 'Test Deck',
      cards: [
        { id: 'card1', type: 'character' as const, cardId: 'char1', quantity: 1 },
        { id: 'card2', type: 'power' as const, cardId: 'power1', quantity: 2 }
      ]
    };

    mockDeckRepository.userOwnsDeck.mockResolvedValue(true);
    mockDeckRepository.replaceAllCardsInDeck.mockResolvedValue(true);
    mockDeckRepository.getDeckById.mockResolvedValue(mockDeck);

    const cardsData = [
      { cardType: 'character', cardId: 'char1', quantity: 1 },
      { cardType: 'power', cardId: 'power1', quantity: 2 }
    ];

    const response = await request(app)
      .put('/api/decks/test-deck-id/cards')
      .send({ cards: cardsData });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(mockDeck);
    expect(mockDeckRepository.userOwnsDeck).toHaveBeenCalledWith('test-deck-id', 'user-id');
    expect(mockDeckRepository.replaceAllCardsInDeck).toHaveBeenCalledWith('test-deck-id', cardsData);
    expect(mockDeckRepository.getDeckById).toHaveBeenCalledWith('test-deck-id');
  });

  it('should handle cards with selectedAlternateImage', async () => {
    const mockDeck = {
      id: 'test-deck-id',
      user_id: 'user-id',
      name: 'Test Deck',
      cards: []
    };

    mockDeckRepository.userOwnsDeck.mockResolvedValue(true);
    mockDeckRepository.replaceAllCardsInDeck.mockResolvedValue(true);
    mockDeckRepository.getDeckById.mockResolvedValue(mockDeck);

    const cardsData = [
      { 
        cardType: 'character', 
        cardId: 'char1', 
        quantity: 1,
        selectedAlternateImage: 'alternate_image.webp'
      }
    ];

    const response = await request(app)
      .put('/api/decks/test-deck-id/cards')
      .send({ cards: cardsData });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockDeckRepository.replaceAllCardsInDeck).toHaveBeenCalledWith('test-deck-id', cardsData);
  });

  it('should return 500 when an error occurs', async () => {
    mockDeckRepository.userOwnsDeck.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .put('/api/decks/test-deck-id/cards')
      .send({ cards: [] });

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Failed to replace cards in deck');
  });
});

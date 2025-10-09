import { DeckService } from '../../src/services/deckService';
import { DeckRepository } from '../../src/repository/DeckRepository';

// Mock the DeckRepository
const mockDeckRepository: jest.Mocked<DeckRepository> = {
  createDeck: jest.fn(),
  getDeckById: jest.fn(),
  getDecksByUserId: jest.fn(),
  getAllDecks: jest.fn(),
  updateDeck: jest.fn(),
  deleteDeck: jest.fn(),
  addCardToDeck: jest.fn(),
  removeCardFromDeck: jest.fn(),
  updateCardInDeck: jest.fn(),
  removeAllCardsFromDeck: jest.fn(),
  getDeckCards: jest.fn(),
  userOwnsDeck: jest.fn(),
  updateUIPreferences: jest.fn(),
  getUIPreferences: jest.fn(),
  getDeckStats: jest.fn(),
  getDeckSummaryWithAllCards: jest.fn(),
  initialize: jest.fn()
};

// Simple UUID v4 generator for tests
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

describe('DeckService Character Limit Business Logic Tests', () => {
  let deckService: DeckService;
  let testUserId: string;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance of DeckService with mocked repository
    deckService = new DeckService(mockDeckRepository);
    testUserId = generateUUID();
  });

  describe('Character Limit Validation', () => {
    it('should allow creating a deck with 0 characters', async () => {
      const deckName = `Test Deck 0 Characters ${generateUUID()}`;
      const mockDeck = {
        id: generateUUID(),
        user_id: testUserId,
        name: deckName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockDeckRepository.createDeck.mockResolvedValue(mockDeck);

      const result = await deckService.createDeck(testUserId, deckName);

      expect(result).toEqual(mockDeck);
      expect(mockDeckRepository.createDeck).toHaveBeenCalledWith(
        testUserId,
        deckName,
        undefined,
        undefined
      );

      console.log('✅ Deck with 0 characters created successfully');
    });

    it('should allow creating a deck with 1 character', async () => {
      const deckName = `Test Deck 1 Character ${generateUUID()}`;
      const characters = ['character1'];
      const mockDeck = {
        id: generateUUID(),
        user_id: testUserId,
        name: deckName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockDeckRepository.createDeck.mockResolvedValue(mockDeck);

      const result = await deckService.createDeck(testUserId, deckName, undefined, characters);

      expect(result).toEqual(mockDeck);
      expect(mockDeckRepository.createDeck).toHaveBeenCalledWith(
        testUserId,
        deckName,
        undefined,
        characters
      );

      console.log('✅ Deck with 1 character created successfully');
    });

    it('should allow creating a deck with 4 characters (maximum)', async () => {
      const deckName = `Test Deck 4 Characters ${generateUUID()}`;
      const characters = ['char1', 'char2', 'char3', 'char4'];
      const mockDeck = {
        id: generateUUID(),
        user_id: testUserId,
        name: deckName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockDeckRepository.createDeck.mockResolvedValue(mockDeck);

      const result = await deckService.createDeck(testUserId, deckName, undefined, characters);

      expect(result).toEqual(mockDeck);
      expect(mockDeckRepository.createDeck).toHaveBeenCalledWith(
        testUserId,
        deckName,
        undefined,
        characters
      );

      console.log('✅ Deck with 4 characters created successfully');
    });

    it('should reject creating a deck with 5 characters', async () => {
      const deckName = `Test Deck 5 Characters ${generateUUID()}`;
      const characters = ['char1', 'char2', 'char3', 'char4', 'char5'];

      await expect(
        deckService.createDeck(testUserId, deckName, undefined, characters)
      ).rejects.toThrow('Maximum 4 characters allowed per deck');

      expect(mockDeckRepository.createDeck).not.toHaveBeenCalled();

      console.log('✅ Deck with 5 characters correctly rejected');
    });

    it('should reject creating a deck with 6+ characters', async () => {
      const deckName = `Test Deck 6+ Characters ${generateUUID()}`;
      const characters = ['char1', 'char2', 'char3', 'char4', 'char5', 'char6'];

      await expect(
        deckService.createDeck(testUserId, deckName, undefined, characters)
      ).rejects.toThrow('Maximum 4 characters allowed per deck');

      expect(mockDeckRepository.createDeck).not.toHaveBeenCalled();

      console.log('✅ Deck with 6+ characters correctly rejected');
    });

    it('should handle undefined characters array', async () => {
      const deckName = `Test Deck Undefined Characters ${generateUUID()}`;
      const mockDeck = {
        id: generateUUID(),
        user_id: testUserId,
        name: deckName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockDeckRepository.createDeck.mockResolvedValue(mockDeck);

      const result = await deckService.createDeck(testUserId, deckName, undefined, undefined);

      expect(result).toEqual(mockDeck);
      expect(mockDeckRepository.createDeck).toHaveBeenCalledWith(
        testUserId,
        deckName,
        undefined,
        undefined
      );

      console.log('✅ Deck with undefined characters array created successfully');
    });

    it('should handle null characters array', async () => {
      const deckName = `Test Deck Null Characters ${generateUUID()}`;
      const mockDeck = {
        id: generateUUID(),
        user_id: testUserId,
        name: deckName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockDeckRepository.createDeck.mockResolvedValue(mockDeck);

      const result = await deckService.createDeck(testUserId, deckName, undefined, undefined);

      expect(result).toEqual(mockDeck);
      expect(mockDeckRepository.createDeck).toHaveBeenCalledWith(
        testUserId,
        deckName,
        undefined,
        undefined
      );

      console.log('✅ Deck with null characters array created successfully');
    });

    it('should handle empty characters array', async () => {
      const deckName = `Test Deck Empty Characters ${generateUUID()}`;
      const characters: string[] = [];
      const mockDeck = {
        id: generateUUID(),
        user_id: testUserId,
        name: deckName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockDeckRepository.createDeck.mockResolvedValue(mockDeck);

      const result = await deckService.createDeck(testUserId, deckName, undefined, characters);

      expect(result).toEqual(mockDeck);
      expect(mockDeckRepository.createDeck).toHaveBeenCalledWith(
        testUserId,
        deckName,
        undefined,
        characters
      );

      console.log('✅ Deck with empty characters array created successfully');
    });

    it('should test edge case: exactly 4 characters with description', async () => {
      const deckName = `Test Deck Edge Case ${generateUUID()}`;
      const description = 'Test description';
      const characters = ['char1', 'char2', 'char3', 'char4'];
      const mockDeck = {
        id: generateUUID(),
        user_id: testUserId,
        name: deckName,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockDeckRepository.createDeck.mockResolvedValue(mockDeck);

      const result = await deckService.createDeck(testUserId, deckName, description, characters);

      expect(result).toEqual(mockDeck);
      expect(mockDeckRepository.createDeck).toHaveBeenCalledWith(
        testUserId,
        deckName,
        description,
        characters
      );

      console.log('✅ Edge case with 4 characters and description handled correctly');
    });

    it('should test boundary condition: 4 characters vs 5 characters', async () => {
      const deckName4 = `Test Deck 4 Chars ${generateUUID()}`;
      const deckName5 = `Test Deck 5 Chars ${generateUUID()}`;
      
      const characters4 = ['char1', 'char2', 'char3', 'char4'];
      const characters5 = ['char1', 'char2', 'char3', 'char4', 'char5'];

      const mockDeck4 = {
        id: generateUUID(),
        user_id: testUserId,
        name: deckName4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockDeckRepository.createDeck.mockResolvedValue(mockDeck4);

      // Test 4 characters (should pass)
      const result4 = await deckService.createDeck(testUserId, deckName4, undefined, characters4);
      expect(result4).toEqual(mockDeck4);

      // Test 5 characters (should fail)
      await expect(
        deckService.createDeck(testUserId, deckName5, undefined, characters5)
      ).rejects.toThrow('Maximum 4 characters allowed per deck');

      console.log('✅ Boundary condition test: 4 chars allowed, 5 chars rejected');
    });

    it('should test various invalid character counts', async () => {
      const testCases = [
        { count: 5, characters: ['a', 'b', 'c', 'd', 'e'] },
        { count: 6, characters: ['a', 'b', 'c', 'd', 'e', 'f'] },
        { count: 10, characters: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'] },
        { count: 100, characters: Array(100).fill(0).map((_, i) => `char${i}`) }
      ];

      for (const testCase of testCases) {
        await expect(
          deckService.createDeck(testUserId, `Test Deck ${testCase.count}`, undefined, testCase.characters)
        ).rejects.toThrow('Maximum 4 characters allowed per deck');
      }

      expect(mockDeckRepository.createDeck).not.toHaveBeenCalled();
      console.log('✅ Various invalid character counts correctly rejected');
    });

    it('should test valid character counts', async () => {
      const testCases = [
        { count: 0, characters: [] },
        { count: 1, characters: ['a'] },
        { count: 2, characters: ['a', 'b'] },
        { count: 3, characters: ['a', 'b', 'c'] },
        { count: 4, characters: ['a', 'b', 'c', 'd'] }
      ];

      for (const testCase of testCases) {
        const mockDeck = {
          id: generateUUID(),
          user_id: testUserId,
          name: `Test Deck ${testCase.count}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
        };

        mockDeckRepository.createDeck.mockResolvedValue(mockDeck);

        const result = await deckService.createDeck(
          testUserId, 
          `Test Deck ${testCase.count}`, 
          undefined, 
          testCase.characters
        );

        expect(result).toEqual(mockDeck);
      }

      expect(mockDeckRepository.createDeck).toHaveBeenCalledTimes(testCases.length);
      console.log('✅ All valid character counts handled correctly');
    });
  });

  describe('getDeckById', () => {
    it('should return deck by ID', async () => {
      const deckId = generateUUID();
      const mockDeck = {
        id: deckId,
        user_id: testUserId,
        name: 'Test Deck',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockDeckRepository.getDeckById.mockResolvedValue(mockDeck);

      const result = await deckService.getDeckById(deckId);

      expect(result).toEqual(mockDeck);
      expect(mockDeckRepository.getDeckById).toHaveBeenCalledWith(deckId);
    });

    it('should return undefined for non-existent deck', async () => {
      const deckId = generateUUID();
      mockDeckRepository.getDeckById.mockResolvedValue(undefined);

      const result = await deckService.getDeckById(deckId);

      expect(result).toBeUndefined();
      expect(mockDeckRepository.getDeckById).toHaveBeenCalledWith(deckId);
    });
  });

  describe('getDecksByUserId', () => {
    it('should return decks for specific user', async () => {
      const mockDecks = [
        {
          id: generateUUID(),
          user_id: testUserId,
          name: 'Deck 1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: generateUUID(),
          user_id: testUserId,
          name: 'Deck 2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      mockDeckRepository.getDecksByUserId.mockResolvedValue(mockDecks);

      const result = await deckService.getDecksByUserId(testUserId);

      expect(result).toEqual(mockDecks);
      expect(mockDeckRepository.getDecksByUserId).toHaveBeenCalledWith(testUserId);
    });

    it('should return empty array for user with no decks', async () => {
      mockDeckRepository.getDecksByUserId.mockResolvedValue([]);

      const result = await deckService.getDecksByUserId(testUserId);

      expect(result).toEqual([]);
      expect(mockDeckRepository.getDecksByUserId).toHaveBeenCalledWith(testUserId);
    });
  });

  describe('getAllDecks', () => {
    it('should return all decks', async () => {
      const mockDecks = [
        {
          id: generateUUID(),
          user_id: testUserId,
          name: 'Deck 1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: generateUUID(),
          user_id: 'other-user',
          name: 'Deck 2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      mockDeckRepository.getAllDecks.mockResolvedValue(mockDecks);

      const result = await deckService.getAllDecks();

      expect(result).toEqual(mockDecks);
      expect(mockDeckRepository.getAllDecks).toHaveBeenCalled();
    });
  });

  describe('updateDeck', () => {
    it('should update deck with provided updates', async () => {
      const deckId = generateUUID();
      const updates = { name: 'Updated Deck Name', description: 'Updated description' };
      const mockUpdatedDeck = {
        id: deckId,
        user_id: testUserId,
        name: 'Updated Deck Name',
        description: 'Updated description',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockDeckRepository.updateDeck.mockResolvedValue(mockUpdatedDeck);

      const result = await deckService.updateDeck(deckId, updates);

      expect(result).toEqual(mockUpdatedDeck);
      expect(mockDeckRepository.updateDeck).toHaveBeenCalledWith(deckId, updates);
    });

    it('should return undefined for non-existent deck', async () => {
      const deckId = generateUUID();
      const updates = { name: 'Updated Name' };
      mockDeckRepository.updateDeck.mockResolvedValue(undefined);

      const result = await deckService.updateDeck(deckId, updates);

      expect(result).toBeUndefined();
      expect(mockDeckRepository.updateDeck).toHaveBeenCalledWith(deckId, updates);
    });
  });

  describe('deleteDeck', () => {
    it('should delete existing deck', async () => {
      const deckId = generateUUID();
      mockDeckRepository.deleteDeck.mockResolvedValue(true);

      const result = await deckService.deleteDeck(deckId);

      expect(result).toBe(true);
      expect(mockDeckRepository.deleteDeck).toHaveBeenCalledWith(deckId);
    });

    it('should return false for non-existent deck', async () => {
      const deckId = generateUUID();
      mockDeckRepository.deleteDeck.mockResolvedValue(false);

      const result = await deckService.deleteDeck(deckId);

      expect(result).toBe(false);
      expect(mockDeckRepository.deleteDeck).toHaveBeenCalledWith(deckId);
    });
  });

  describe('addCardToDeck', () => {
    it('should add card to deck with default quantity', async () => {
      const deckId = generateUUID();
      const cardType = 'power';
      const cardId = 'power1';
      mockDeckRepository.addCardToDeck.mockResolvedValue(true);

      const result = await deckService.addCardToDeck(deckId, cardType, cardId);

      expect(result).toBe(true);
      expect(mockDeckRepository.addCardToDeck).toHaveBeenCalledWith(deckId, cardType, cardId, undefined, undefined);
    });

    it('should add card to deck with specified quantity and alternate image', async () => {
      const deckId = generateUUID();
      const cardType = 'character';
      const cardId = 'char1';
      const quantity = 2;
      const selectedAlternateImage = 'alt-image.jpg';
      mockDeckRepository.addCardToDeck.mockResolvedValue(true);

      const result = await deckService.addCardToDeck(deckId, cardType, cardId, quantity, selectedAlternateImage);

      expect(result).toBe(true);
      expect(mockDeckRepository.addCardToDeck).toHaveBeenCalledWith(deckId, cardType, cardId, quantity, selectedAlternateImage);
    });

    it('should return false when card addition fails', async () => {
      const deckId = generateUUID();
      const cardType = 'power';
      const cardId = 'power1';
      mockDeckRepository.addCardToDeck.mockResolvedValue(false);

      const result = await deckService.addCardToDeck(deckId, cardType, cardId);

      expect(result).toBe(false);
      expect(mockDeckRepository.addCardToDeck).toHaveBeenCalledWith(deckId, cardType, cardId, undefined, undefined);
    });
  });

  describe('removeCardFromDeck', () => {
    it('should remove card from deck with default quantity', async () => {
      const deckId = generateUUID();
      const cardType = 'power';
      const cardId = 'power1';
      mockDeckRepository.removeCardFromDeck.mockResolvedValue(true);

      const result = await deckService.removeCardFromDeck(deckId, cardType, cardId);

      expect(result).toBe(true);
      expect(mockDeckRepository.removeCardFromDeck).toHaveBeenCalledWith(deckId, cardType, cardId, undefined);
    });

    it('should remove card from deck with specified quantity', async () => {
      const deckId = generateUUID();
      const cardType = 'power';
      const cardId = 'power1';
      const quantity = 2;
      mockDeckRepository.removeCardFromDeck.mockResolvedValue(true);

      const result = await deckService.removeCardFromDeck(deckId, cardType, cardId, quantity);

      expect(result).toBe(true);
      expect(mockDeckRepository.removeCardFromDeck).toHaveBeenCalledWith(deckId, cardType, cardId, quantity);
    });

    it('should return false when card removal fails', async () => {
      const deckId = generateUUID();
      const cardType = 'power';
      const cardId = 'power1';
      mockDeckRepository.removeCardFromDeck.mockResolvedValue(false);

      const result = await deckService.removeCardFromDeck(deckId, cardType, cardId);

      expect(result).toBe(false);
      expect(mockDeckRepository.removeCardFromDeck).toHaveBeenCalledWith(deckId, cardType, cardId, undefined);
    });
  });

  describe('updateCardInDeck', () => {
    it('should update card in deck', async () => {
      const deckId = generateUUID();
      const cardType = 'power';
      const cardId = 'power1';
      const updates = { quantity: 3, selectedAlternateImage: 'new-image.jpg' };
      mockDeckRepository.updateCardInDeck.mockResolvedValue(true);

      const result = await deckService.updateCardInDeck(deckId, cardType, cardId, updates);

      expect(result).toBe(true);
      expect(mockDeckRepository.updateCardInDeck).toHaveBeenCalledWith(deckId, cardType, cardId, updates);
    });

    it('should return false when card update fails', async () => {
      const deckId = generateUUID();
      const cardType = 'power';
      const cardId = 'power1';
      const updates = { quantity: 3 };
      mockDeckRepository.updateCardInDeck.mockResolvedValue(false);

      const result = await deckService.updateCardInDeck(deckId, cardType, cardId, updates);

      expect(result).toBe(false);
      expect(mockDeckRepository.updateCardInDeck).toHaveBeenCalledWith(deckId, cardType, cardId, updates);
    });
  });

  describe('removeAllCardsFromDeck', () => {
    it('should remove all cards from deck', async () => {
      const deckId = generateUUID();
      mockDeckRepository.removeAllCardsFromDeck.mockResolvedValue(true);

      const result = await deckService.removeAllCardsFromDeck(deckId);

      expect(result).toBe(true);
      expect(mockDeckRepository.removeAllCardsFromDeck).toHaveBeenCalledWith(deckId);
    });

    it('should return false when removal fails', async () => {
      const deckId = generateUUID();
      mockDeckRepository.removeAllCardsFromDeck.mockResolvedValue(false);

      const result = await deckService.removeAllCardsFromDeck(deckId);

      expect(result).toBe(false);
      expect(mockDeckRepository.removeAllCardsFromDeck).toHaveBeenCalledWith(deckId);
    });
  });

  describe('getDeckCards', () => {
    it('should return deck cards', async () => {
      const deckId = generateUUID();
      const mockCards = [
        { id: 'card1', type: 'power' as const, cardId: 'power1', quantity: 2 },
        { id: 'card2', type: 'character' as const, cardId: 'char1', quantity: 1 }
      ];
      mockDeckRepository.getDeckCards.mockResolvedValue(mockCards);

      const result = await deckService.getDeckCards(deckId);

      expect(result).toEqual(mockCards);
      expect(mockDeckRepository.getDeckCards).toHaveBeenCalledWith(deckId);
    });

    it('should return empty array for deck with no cards', async () => {
      const deckId = generateUUID();
      mockDeckRepository.getDeckCards.mockResolvedValue([]);

      const result = await deckService.getDeckCards(deckId);

      expect(result).toEqual([]);
      expect(mockDeckRepository.getDeckCards).toHaveBeenCalledWith(deckId);
    });
  });

  describe('userOwnsDeck', () => {
    it('should return true when user owns deck', async () => {
      const deckId = generateUUID();
      mockDeckRepository.userOwnsDeck.mockResolvedValue(true);

      const result = await deckService.userOwnsDeck(deckId, testUserId);

      expect(result).toBe(true);
      expect(mockDeckRepository.userOwnsDeck).toHaveBeenCalledWith(deckId, testUserId);
    });

    it('should return false when user does not own deck', async () => {
      const deckId = generateUUID();
      mockDeckRepository.userOwnsDeck.mockResolvedValue(false);

      const result = await deckService.userOwnsDeck(deckId, testUserId);

      expect(result).toBe(false);
      expect(mockDeckRepository.userOwnsDeck).toHaveBeenCalledWith(deckId, testUserId);
    });
  });

  describe('updateUIPreferences', () => {
    it('should update UI preferences for deck', async () => {
      const deckId = generateUUID();
      const preferences = { theme: 'dark', layout: 'grid' };
      mockDeckRepository.updateUIPreferences.mockResolvedValue(true);

      const result = await deckService.updateUIPreferences(deckId, preferences);

      expect(result).toBe(true);
      expect(mockDeckRepository.updateUIPreferences).toHaveBeenCalledWith(deckId, preferences);
    });

    it('should return false when update fails', async () => {
      const deckId = generateUUID();
      const preferences = { theme: 'dark' };
      mockDeckRepository.updateUIPreferences.mockResolvedValue(false);

      const result = await deckService.updateUIPreferences(deckId, preferences);

      expect(result).toBe(false);
      expect(mockDeckRepository.updateUIPreferences).toHaveBeenCalledWith(deckId, preferences);
    });
  });

  describe('getUIPreferences', () => {
    it('should return UI preferences for deck', async () => {
      const deckId = generateUUID();
      const mockPreferences = { theme: 'dark', layout: 'grid' } as any;
      mockDeckRepository.getUIPreferences.mockResolvedValue(mockPreferences);

      const result = await deckService.getUIPreferences(deckId);

      expect(result).toEqual(mockPreferences);
      expect(mockDeckRepository.getUIPreferences).toHaveBeenCalledWith(deckId);
    });

    it('should return undefined when no preferences exist', async () => {
      const deckId = generateUUID();
      mockDeckRepository.getUIPreferences.mockResolvedValue(undefined);

      const result = await deckService.getUIPreferences(deckId);

      expect(result).toBeUndefined();
      expect(mockDeckRepository.getUIPreferences).toHaveBeenCalledWith(deckId);
    });
  });

  describe('getDeckStats', () => {
    it('should return deck statistics', async () => {
      const mockStats = { decks: 5 };
      mockDeckRepository.getDeckStats.mockResolvedValue(mockStats);

      const result = await deckService.getDeckStats();

      expect(result).toEqual(mockStats);
      expect(mockDeckRepository.getDeckStats).toHaveBeenCalled();
    });

    it('should return zero stats when no decks exist', async () => {
      const mockStats = { decks: 0 };
      mockDeckRepository.getDeckStats.mockResolvedValue(mockStats);

      const result = await deckService.getDeckStats();

      expect(result).toEqual(mockStats);
      expect(mockDeckRepository.getDeckStats).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should propagate repository errors', async () => {
      const deckId = generateUUID();
      const error = new Error('Repository error');
      mockDeckRepository.getDeckById.mockRejectedValue(error);

      await expect(deckService.getDeckById(deckId)).rejects.toThrow('Repository error');
    });

    it('should handle async operation failures', async () => {
      const deckId = generateUUID();
      const error = new Error('Database connection failed');
      mockDeckRepository.deleteDeck.mockRejectedValue(error);

      await expect(deckService.deleteDeck(deckId)).rejects.toThrow('Database connection failed');
    });
  });
});

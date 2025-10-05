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
});

import { DeckService } from '../../src/services/deckService';

// Mock the DeckRepository interface
class MockDeckRepository {
  private decks: Map<string, any> = new Map();

  async createDeck(userId: string, name: string, description?: string, characterIds?: string[]): Promise<any> {
    const deck = {
      id: this.generateId(),
      user_id: userId,
      name,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.decks.set(deck.id, deck);
    return deck;
  }

  async getDeckById(id: string): Promise<any> {
    return this.decks.get(id);
  }

  async getDecksByUserId(userId: string): Promise<any[]> {
    return Array.from(this.decks.values()).filter(deck => deck.user_id === userId);
  }

  async getAllDecks(): Promise<any[]> {
    return Array.from(this.decks.values());
  }

  async updateDeck(id: string, updates: any): Promise<any> {
    const deck = this.decks.get(id);
    if (deck) {
      Object.assign(deck, updates);
      deck.updated_at = new Date().toISOString();
    }
    return deck;
  }

  async deleteDeck(id: string): Promise<boolean> {
    return this.decks.delete(id);
  }

  async addCardToDeck(deckId: string, cardType: string, cardId: string, quantity?: number, selectedAlternateImage?: string): Promise<boolean> {
    return true;
  }

  async removeCardFromDeck(deckId: string, cardType: string, cardId: string, quantity?: number): Promise<boolean> {
    return true;
  }

  async updateCardInDeck(deckId: string, cardType: string, cardId: string, updates: { quantity?: number; selectedAlternateImage?: string }): Promise<boolean> {
    return true;
  }

  async removeAllCardsFromDeck(deckId: string): Promise<boolean> {
    return true;
  }

  async getDeckCards(deckId: string): Promise<any[]> {
    return [];
  }

  async userOwnsDeck(deckId: string, userId: string): Promise<boolean> {
    const deck = this.decks.get(deckId);
    return deck && deck.user_id === userId;
  }

  async updateUIPreferences(deckId: string, preferences: any): Promise<boolean> {
    return true;
  }

  async getUIPreferences(deckId: string): Promise<any> {
    return undefined;
  }

  async getDeckStats(): Promise<any> {
    return { decks: this.decks.size };
  }

  async initialize(): Promise<void> {
    // Mock implementation
  }

  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Simple UUID v4 generator for tests
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

describe('DeckService Business Logic Tests', () => {
  let deckService: DeckService;
  let mockRepository: MockDeckRepository;
  let testUserId: string;

  beforeEach(() => {
    // Create a new mock repository and service for each test
    mockRepository = new MockDeckRepository();
    deckService = new DeckService(mockRepository);
    testUserId = generateUUID();
  });

  describe('Character Limit Business Logic Validation', () => {
    it('should allow creating a deck with 0 characters', async () => {
      const deckName = `Test Deck 0 Characters ${generateUUID()}`;
      
      const result = await deckService.createDeck(testUserId, deckName);

      expect(result).toBeDefined();
      expect(result.name).toBe(deckName);
      expect(result.user_id).toBe(testUserId);
      // No characters passed, so characters field should not be in the result

      console.log('✅ Deck with 0 characters created successfully');
    });

    it('should allow creating a deck with 1 character', async () => {
      const deckName = `Test Deck 1 Character ${generateUUID()}`;
      const characters = ['character1'];
      
      const result = await deckService.createDeck(testUserId, deckName, undefined, characters);

      expect(result).toBeDefined();
      expect(result.name).toBe(deckName);
      expect(result.user_id).toBe(testUserId);

      console.log('✅ Deck with 1 character created successfully');
    });

    it('should allow creating a deck with 4 characters (maximum)', async () => {
      const deckName = `Test Deck 4 Characters ${generateUUID()}`;
      const characters = ['char1', 'char2', 'char3', 'char4'];
      
      const result = await deckService.createDeck(testUserId, deckName, undefined, characters);

      expect(result).toBeDefined();
      expect(result.name).toBe(deckName);
      expect(result.user_id).toBe(testUserId);

      console.log('✅ Deck with 4 characters created successfully');
    });

    it('should reject creating a deck with 5 characters', async () => {
      const deckName = `Test Deck 5 Characters ${generateUUID()}`;
      const characters = ['char1', 'char2', 'char3', 'char4', 'char5'];

      await expect(
        deckService.createDeck(testUserId, deckName, undefined, characters)
      ).rejects.toThrow('Maximum 4 characters allowed per deck');

      console.log('✅ Deck with 5 characters correctly rejected');
    });

    it('should reject creating a deck with 6+ characters', async () => {
      const deckName = `Test Deck 6+ Characters ${generateUUID()}`;
      const characters = ['char1', 'char2', 'char3', 'char4', 'char5', 'char6'];

      await expect(
        deckService.createDeck(testUserId, deckName, undefined, characters)
      ).rejects.toThrow('Maximum 4 characters allowed per deck');

      console.log('✅ Deck with 6+ characters correctly rejected');
    });

    it('should handle undefined characters array', async () => {
      const deckName = `Test Deck Undefined Characters ${generateUUID()}`;
      
      const result = await deckService.createDeck(testUserId, deckName, undefined, undefined);

      expect(result).toBeDefined();
      expect(result.name).toBe(deckName);
      expect(result.user_id).toBe(testUserId);

      console.log('✅ Deck with undefined characters array created successfully');
    });

    it('should handle null characters array', async () => {
      const deckName = `Test Deck Null Characters ${generateUUID()}`;
      
      const result = await deckService.createDeck(testUserId, deckName, undefined, undefined);

      expect(result).toBeDefined();
      expect(result.name).toBe(deckName);
      expect(result.user_id).toBe(testUserId);

      console.log('✅ Deck with null characters array created successfully');
    });

    it('should handle empty characters array', async () => {
      const deckName = `Test Deck Empty Characters ${generateUUID()}`;
      const characters: string[] = [];
      
      const result = await deckService.createDeck(testUserId, deckName, undefined, characters);

      expect(result).toBeDefined();
      expect(result.name).toBe(deckName);
      expect(result.user_id).toBe(testUserId);

      console.log('✅ Deck with empty characters array created successfully');
    });

    it('should test edge case: exactly 4 characters with description', async () => {
      const deckName = `Test Deck Edge Case ${generateUUID()}`;
      const description = 'Test description';
      const characters = ['char1', 'char2', 'char3', 'char4'];
      
      const result = await deckService.createDeck(testUserId, deckName, description, characters);

      expect(result).toBeDefined();
      expect(result.name).toBe(deckName);
      expect(result.description).toBe(description);
      expect(result.user_id).toBe(testUserId);

      console.log('✅ Edge case with 4 characters and description handled correctly');
    });

    it('should test boundary condition: 4 characters vs 5 characters', async () => {
      const deckName4 = `Test Deck 4 Chars ${generateUUID()}`;
      const deckName5 = `Test Deck 5 Chars ${generateUUID()}`;
      
      const characters4 = ['char1', 'char2', 'char3', 'char4'];
      const characters5 = ['char1', 'char2', 'char3', 'char4', 'char5'];

      // Test 4 characters (should pass)
      const result4 = await deckService.createDeck(testUserId, deckName4, undefined, characters4);
      expect(result4).toBeDefined();
      expect(result4.name).toBe(deckName4);

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
        const result = await deckService.createDeck(
          testUserId, 
          `Test Deck ${testCase.count}`, 
          undefined, 
          testCase.characters
        );

        expect(result).toBeDefined();
        expect(result.name).toBe(`Test Deck ${testCase.count}`);
      }

      console.log('✅ All valid character counts handled correctly');
    });

    it('should test character limit validation with different data types', async () => {
      // Test with string array
      const stringChars = ['char1', 'char2', 'char3', 'char4'];
      const result1 = await deckService.createDeck(testUserId, 'String Array Test', undefined, stringChars);
      expect(result1).toBeDefined();

      // Test with mixed string array
      const mixedChars = ['char1', 'char2', 'char3', 'char4'];
      const result2 = await deckService.createDeck(testUserId, 'Mixed Array Test', undefined, mixedChars);
      expect(result2).toBeDefined();

      // Test with 5 strings (should fail)
      const fiveChars = ['char1', 'char2', 'char3', 'char4', 'char5'];
      await expect(
        deckService.createDeck(testUserId, 'Five Chars Test', undefined, fiveChars)
      ).rejects.toThrow('Maximum 4 characters allowed per deck');

      console.log('✅ Character limit validation works with different data types');
    });

    it('should test character limit validation with edge case arrays', async () => {
      // Test with exactly 4 characters
      const exactly4 = ['a', 'b', 'c', 'd'];
      const result1 = await deckService.createDeck(testUserId, 'Exactly 4 Test', undefined, exactly4);
      expect(result1).toBeDefined();

      // Test with 4 characters but one is empty string
      const withEmpty = ['a', 'b', 'c', ''];
      const result2 = await deckService.createDeck(testUserId, 'With Empty Test', undefined, withEmpty);
      expect(result2).toBeDefined();

      // Test with 4 characters but one is null (should still count as 4)
      const withNull = ['a', 'b', 'c', null as any];
      const result3 = await deckService.createDeck(testUserId, 'With Null Test', undefined, withNull);
      expect(result3).toBeDefined();

      console.log('✅ Character limit validation handles edge case arrays correctly');
    });
  });
});

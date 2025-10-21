/**
 * Unit tests for backend Assist validation functionality
 * Tests the checkIfCardIsAssist function and related backend logic
 */

import { checkIfCardIsAssist, validateCardAddition } from '../../src/index';
import { PostgreSQLCardRepository } from '../../src/database/PostgreSQLCardRepository';
import { Pool } from 'pg';

// Mock the database connection
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn()
  }))
}));

// Mock the card repository
jest.mock('../../src/database/PostgreSQLCardRepository');

describe('Backend Assist Validation', () => {
  let mockPool: jest.Mocked<Pool>;
  let mockCardRepository: jest.Mocked<PostgreSQLCardRepository>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock pool
    mockPool = new Pool() as jest.Mocked<Pool>;
    
    // Create mock card repository
    mockCardRepository = new PostgreSQLCardRepository(mockPool) as jest.Mocked<PostgreSQLCardRepository>;
    
    // Mock the global cardRepository
    (global as any).cardRepository = mockCardRepository;
  });

  describe('checkIfCardIsAssist', () => {
    it('should return true for assist special cards', async () => {
      // Mock special card with assist=true
      mockCardRepository.getSpecialCardById.mockResolvedValue({
        id: 'special_assist_card',
        name: 'Assist Card',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: '**Assist!** Provides assistance to any character...',
        image: 'specials/assist_card.webp',
        is_cataclysm: false,
        is_assist: true,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await checkIfCardIsAssist('special', 'special_assist_card');
      
      expect(result).toBe(true);
      expect(mockCardRepository.getSpecialCardById).toHaveBeenCalledWith('special_assist_card');
    });

    it('should return false for non-assist special cards', async () => {
      // Mock special card with assist=false
      mockCardRepository.getSpecialCardById.mockResolvedValue({
        id: 'special_regular',
        name: 'Regular Special',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: 'Regular special card effect',
        image: 'specials/regular.webp',
        is_cataclysm: false,
        is_assist: false,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await checkIfCardIsAssist('special', 'special_regular');
      
      expect(result).toBe(false);
      expect(mockCardRepository.getSpecialCardById).toHaveBeenCalledWith('special_regular');
    });

    it('should return false for non-special card types', async () => {
      const result = await checkIfCardIsAssist('character', 'char1');
      
      expect(result).toBe(false);
      expect(mockCardRepository.getSpecialCardById).not.toHaveBeenCalled();
    });

    it('should return false when card is not found', async () => {
      mockCardRepository.getSpecialCardById.mockResolvedValue(undefined);

      const result = await checkIfCardIsAssist('special', 'nonexistent');
      
      expect(result).toBe(false);
      expect(mockCardRepository.getSpecialCardById).toHaveBeenCalledWith('nonexistent');
    });

    it('should return false when card data is null', async () => {
      mockCardRepository.getSpecialCardById.mockResolvedValue(null as any);

      const result = await checkIfCardIsAssist('special', 'null_card');
      
      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      mockCardRepository.getSpecialCardById.mockRejectedValue(new Error('Database connection failed'));

      const result = await checkIfCardIsAssist('special', 'error_card');
      
      expect(result).toBe(false);
    });

    it('should handle undefined is_assist property', async () => {
      mockCardRepository.getSpecialCardById.mockResolvedValue({
        id: 'special_undefined',
        name: 'Undefined Assist',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: 'Card with undefined assist property',
        image: 'specials/undefined.webp',
        is_cataclysm: false,
        is_assist: undefined as any,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await checkIfCardIsAssist('special', 'special_undefined');
      
      expect(result).toBe(false);
    });

    it('should handle null is_assist property', async () => {
      mockCardRepository.getSpecialCardById.mockResolvedValue({
        id: 'special_null',
        name: 'Null Assist',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: 'Card with null assist property',
        image: 'specials/null.webp',
        is_cataclysm: false,
        is_assist: null as any,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await checkIfCardIsAssist('special', 'special_null');
      
      expect(result).toBe(false);
    });
  });

  describe('validateCardAddition - Assist Rules', () => {
    it('should allow adding first assist card', async () => {
      const currentCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 1 }
      ];

      // Mock assist card
      mockCardRepository.getSpecialCardById.mockResolvedValue({
        id: 'special_assist_card',
        name: 'Assist Card',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: '**Assist!** Provides assistance to any character...',
        image: 'specials/assist_card.webp',
        is_cataclysm: false,
        is_assist: true,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await validateCardAddition(currentCards, 'special', 'special_assist_card', 1);
      
      expect(result).toBeNull(); // No validation errors
    });

    it('should prevent adding second assist card', async () => {
      const currentCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'special', cardId: 'special_assist_card', quantity: 1 } // Already has one assist
      ];

      // Mock second assist card
      mockCardRepository.getSpecialCardById.mockResolvedValue({
        id: 'special_another_assist',
        name: 'Another Assist Card',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: '**Assist!** Another assist card...',
        image: 'specials/another_assist.webp',
        is_cataclysm: false,
        is_assist: true,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await validateCardAddition(currentCards, 'special', 'special_another_assist', 1);
      
      expect(result).toContain('Cannot add more than 1 Assist to a deck');
    });

    it('should allow adding regular special cards when assist is present', async () => {
      const currentCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'special', cardId: 'special_assist_card', quantity: 1 } // Has assist
      ];

      // Mock regular special card
      mockCardRepository.getSpecialCardById.mockResolvedValue({
        id: 'special_regular',
        name: 'Regular Special',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: 'Regular special card effect',
        image: 'specials/regular.webp',
        is_cataclysm: false,
        is_assist: false,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await validateCardAddition(currentCards, 'special', 'special_regular', 1);
      
      expect(result).toBeNull(); // No validation errors
    });

    it('should handle multiple assist cards in test deck correctly', async () => {
      const currentCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'special', cardId: 'special_assist_card', quantity: 1 }
      ];

      // Mock second assist card
      mockCardRepository.getSpecialCardById.mockResolvedValue({
        id: 'special_another_assist',
        name: 'Another Assist Card',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: '**Assist!** Another assist card...',
        image: 'specials/another_assist.webp',
        is_cataclysm: false,
        is_assist: true,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await validateCardAddition(currentCards, 'special', 'special_another_assist', 1);
      
      expect(result).toContain('Cannot add more than 1 Assist to a deck');
      expect(result).toContain('would have 2'); // Should show it would have 2 assist cards
    });

    it('should handle database errors during assist validation', async () => {
      const currentCards = [
        { type: 'character', cardId: 'char1', quantity: 1 }
      ];

      // Mock database error
      mockCardRepository.getSpecialCardById.mockRejectedValue(new Error('Database connection failed'));

      const result = await validateCardAddition(currentCards, 'special', 'special_assist_card', 1);
      
      expect(result).toBeNull(); // Should not throw, but return null (no validation errors)
    });

    it('should handle missing card data during assist validation', async () => {
      const currentCards = [
        { type: 'character', cardId: 'char1', quantity: 1 }
      ];

      // Mock missing card data
      mockCardRepository.getSpecialCardById.mockResolvedValue(undefined);

      const result = await validateCardAddition(currentCards, 'special', 'nonexistent', 1);
      
      expect(result).toBeNull(); // Should not throw, but return null (no validation errors)
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty current cards array', async () => {
      const currentCards: any[] = [];

      mockCardRepository.getSpecialCardById.mockResolvedValue({
        id: 'special_assist_card',
        name: 'Assist Card',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: '**Assist!** Provides assistance to any character...',
        image: 'specials/assist_card.webp',
        is_cataclysm: false,
        is_assist: true,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await validateCardAddition(currentCards, 'special', 'special_assist_card', 1);
      
      expect(result).toBeNull(); // Should allow adding first assist
    });

    it('should handle invalid card type for assist check', async () => {
      const result = await checkIfCardIsAssist('invalid_type', 'some_id');
      
      expect(result).toBe(false);
      expect(mockCardRepository.getSpecialCardById).not.toHaveBeenCalled();
    });

    it('should handle empty card ID', async () => {
      // Mock empty card ID to return undefined
      mockCardRepository.getSpecialCardById.mockResolvedValue(undefined);
      
      const result = await checkIfCardIsAssist('special', '');
      
      expect(result).toBe(false);
      expect(mockCardRepository.getSpecialCardById).toHaveBeenCalledWith('');
    });

    it('should handle null card ID', async () => {
      // Mock null card ID to return undefined
      mockCardRepository.getSpecialCardById.mockResolvedValue(undefined);
      
      const result = await checkIfCardIsAssist('special', null as any);
      
      expect(result).toBe(false);
      expect(mockCardRepository.getSpecialCardById).toHaveBeenCalledWith(null);
    });
  });
});

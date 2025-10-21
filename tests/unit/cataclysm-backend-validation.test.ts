/**
 * Unit tests for backend Cataclysm validation functionality
 * Tests the checkIfCardIsCataclysm function and related backend logic
 */

import { checkIfCardIsCataclysm, validateCardAddition } from '../../src/index';
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

describe('Backend Cataclysm Validation', () => {
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

  describe('checkIfCardIsCataclysm', () => {
    it('should return true for cataclysm special cards', async () => {
      // Mock special card with cataclysm=true
      mockCardRepository.getSpecialCardById.mockResolvedValue({
        id: 'special_heimdall',
        name: 'Heimdall',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: '**Cataclysm!** Any Character may avoid 1 attack...',
        image: 'specials/heimdall.webp',
        is_cataclysm: true,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await checkIfCardIsCataclysm('special', 'special_heimdall');
      
      expect(result).toBe(true);
      expect(mockCardRepository.getSpecialCardById).toHaveBeenCalledWith('special_heimdall');
    });

    it('should return false for non-cataclysm special cards', async () => {
      // Mock special card with cataclysm=false
      mockCardRepository.getSpecialCardById.mockResolvedValue({
        id: 'special_regular',
        name: 'Regular Special',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: 'Regular special card effect',
        image: 'specials/regular.webp',
        is_cataclysm: false,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await checkIfCardIsCataclysm('special', 'special_regular');
      
      expect(result).toBe(false);
      expect(mockCardRepository.getSpecialCardById).toHaveBeenCalledWith('special_regular');
    });

    it('should return false for non-special card types', async () => {
      const result = await checkIfCardIsCataclysm('character', 'char1');
      
      expect(result).toBe(false);
      expect(mockCardRepository.getSpecialCardById).not.toHaveBeenCalled();
    });

    it('should return false when card is not found', async () => {
      mockCardRepository.getSpecialCardById.mockResolvedValue(undefined);

      const result = await checkIfCardIsCataclysm('special', 'nonexistent');
      
      expect(result).toBe(false);
      expect(mockCardRepository.getSpecialCardById).toHaveBeenCalledWith('nonexistent');
    });

    it('should return false when card data is null', async () => {
      mockCardRepository.getSpecialCardById.mockResolvedValue(null as any);

      const result = await checkIfCardIsCataclysm('special', 'null_card');
      
      expect(result).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      mockCardRepository.getSpecialCardById.mockRejectedValue(new Error('Database connection failed'));

      const result = await checkIfCardIsCataclysm('special', 'error_card');
      
      expect(result).toBe(false);
    });

    it('should handle undefined is_cataclysm property', async () => {
      mockCardRepository.getSpecialCardById.mockResolvedValue({
        id: 'special_undefined',
        name: 'Undefined Cataclysm',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: 'Card with undefined cataclysm property',
        image: 'specials/undefined.webp',
        is_cataclysm: undefined as any,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await checkIfCardIsCataclysm('special', 'special_undefined');
      
      expect(result).toBe(false);
    });

    it('should handle null is_cataclysm property', async () => {
      mockCardRepository.getSpecialCardById.mockResolvedValue({
        id: 'special_null',
        name: 'Null Cataclysm',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: 'Card with null cataclysm property',
        image: 'specials/null.webp',
        is_cataclysm: null as any,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await checkIfCardIsCataclysm('special', 'special_null');
      
      expect(result).toBe(false);
    });
  });

  describe('validateCardAddition - Cataclysm Rules', () => {
    it('should allow adding first cataclysm card', async () => {
      const currentCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'mission', cardId: 'mission1', quantity: 1 }
      ];

      // Mock cataclysm card
      mockCardRepository.getSpecialCardById.mockResolvedValue({
        id: 'special_heimdall',
        name: 'Heimdall',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: '**Cataclysm!** Any Character may avoid 1 attack...',
        image: 'specials/heimdall.webp',
        is_cataclysm: true,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await validateCardAddition(currentCards, 'special', 'special_heimdall', 1);
      
      expect(result).toBeNull(); // No validation errors
    });

    it('should prevent adding second cataclysm card', async () => {
      const currentCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'special', cardId: 'special_heimdall', quantity: 1 } // Already has one cataclysm
      ];

      // Mock second cataclysm card
      mockCardRepository.getSpecialCardById.mockResolvedValue({
        id: 'special_loki',
        name: 'Loki',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: '**Cataclysm!** Opponent is -3 to Venture Total...',
        image: 'specials/loki.webp',
        is_cataclysm: true,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await validateCardAddition(currentCards, 'special', 'special_loki', 1);
      
      expect(result).toContain('Cannot add more than 1 Cataclysm to a deck');
    });

    it('should allow adding regular special cards when cataclysm is present', async () => {
      const currentCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'special', cardId: 'special_heimdall', quantity: 1 } // Has cataclysm
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
        one_per_deck: false,
        alternateImages: []
      });

      const result = await validateCardAddition(currentCards, 'special', 'special_regular', 1);
      
      expect(result).toBeNull(); // No validation errors
    });

    it('should handle multiple cataclysm cards in test deck correctly', async () => {
      const currentCards = [
        { type: 'character', cardId: 'char1', quantity: 1 },
        { type: 'special', cardId: 'special_heimdall', quantity: 1 }
      ];

      // Mock second cataclysm card
      mockCardRepository.getSpecialCardById.mockResolvedValue({
        id: 'special_loki',
        name: 'Loki',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: '**Cataclysm!** Opponent is -3 to Venture Total...',
        image: 'specials/loki.webp',
        is_cataclysm: true,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await validateCardAddition(currentCards, 'special', 'special_loki', 1);
      
      expect(result).toContain('Cannot add more than 1 Cataclysm to a deck');
      expect(result).toContain('would have 2'); // Should show it would have 2 cataclysm cards
    });

    it('should handle database errors during cataclysm validation', async () => {
      const currentCards = [
        { type: 'character', cardId: 'char1', quantity: 1 }
      ];

      // Mock database error
      mockCardRepository.getSpecialCardById.mockRejectedValue(new Error('Database connection failed'));

      const result = await validateCardAddition(currentCards, 'special', 'special_heimdall', 1);
      
      expect(result).toBeNull(); // Should not throw, but return null (no validation errors)
    });

    it('should handle missing card data during cataclysm validation', async () => {
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
        id: 'special_heimdall',
        name: 'Heimdall',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: '**Cataclysm!** Any Character may avoid 1 attack...',
        image: 'specials/heimdall.webp',
        is_cataclysm: true,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await validateCardAddition(currentCards, 'special', 'special_heimdall', 1);
      
      expect(result).toBeNull(); // Should allow adding first cataclysm
    });

    it('should handle invalid card type for cataclysm check', async () => {
      const result = await checkIfCardIsCataclysm('invalid_type', 'some_id');
      
      expect(result).toBe(false);
      expect(mockCardRepository.getSpecialCardById).not.toHaveBeenCalled();
    });

    it('should handle empty card ID', async () => {
      // Mock empty card ID to return undefined
      mockCardRepository.getSpecialCardById.mockResolvedValue(undefined);
      
      const result = await checkIfCardIsCataclysm('special', '');
      
      expect(result).toBe(false);
      expect(mockCardRepository.getSpecialCardById).toHaveBeenCalledWith('');
    });

    it('should handle null card ID', async () => {
      // Mock null card ID to return undefined
      mockCardRepository.getSpecialCardById.mockResolvedValue(undefined);
      
      const result = await checkIfCardIsCataclysm('special', null as any);
      
      expect(result).toBe(false);
      expect(mockCardRepository.getSpecialCardById).toHaveBeenCalledWith(null);
    });
  });
});

/**
 * Unit tests for backend Ambush validation functionality
 * Tests the checkIfCardIsAmbush function and related backend logic
 */

import { checkIfCardIsAmbush, validateCardAddition } from '../../src/index';
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

describe('Backend Ambush Validation', () => {
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

  describe('checkIfCardIsAmbush', () => {
    it('should return true for ambush special cards', async () => {
      // Mock special card with ambush=true
      mockCardRepository.getSpecialCardById.mockResolvedValue({
        id: 'special_ambush_card',
        name: 'Ambush Card',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: '**Ambush!** Provides ambush capabilities...',
        image: 'specials/ambush_card.webp',
        is_cataclysm: false,
        is_assist: false,
        is_ambush: true,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await checkIfCardIsAmbush('special', 'special_ambush_card');
      
      expect(result).toBe(true);
      expect(mockCardRepository.getSpecialCardById).toHaveBeenCalledWith('special_ambush_card');
    });

    it('should return false for non-ambush special cards', async () => {
      // Mock special card with ambush=false
      mockCardRepository.getSpecialCardById.mockResolvedValue({
        id: 'special_regular_card',
        name: 'Regular Special Card',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: 'Regular special card effect...',
        image: 'specials/regular_card.webp',
        is_cataclysm: false,
        is_assist: false,
        is_ambush: false,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await checkIfCardIsAmbush('special', 'special_regular_card');
      
      expect(result).toBe(false);
      expect(mockCardRepository.getSpecialCardById).toHaveBeenCalledWith('special_regular_card');
    });

    it('should return false for non-special card types', async () => {
      const result = await checkIfCardIsAmbush('character', 'character_1');
      expect(result).toBe(false);
      expect(mockCardRepository.getSpecialCardById).not.toHaveBeenCalled();
    });

    it('should return false when card is not found', async () => {
      mockCardRepository.getSpecialCardById.mockResolvedValue(undefined);

      const result = await checkIfCardIsAmbush('special', 'nonexistent_card');
      
      expect(result).toBe(false);
      expect(mockCardRepository.getSpecialCardById).toHaveBeenCalledWith('nonexistent_card');
    });

    it('should return false when card data is null', async () => {
      mockCardRepository.getSpecialCardById.mockResolvedValue(null as any);

      const result = await checkIfCardIsAmbush('special', 'null_card');
      
      expect(result).toBe(false);
      expect(mockCardRepository.getSpecialCardById).toHaveBeenCalledWith('null_card');
    });

    it('should handle database errors gracefully', async () => {
      mockCardRepository.getSpecialCardById.mockRejectedValue(new Error('Database error'));

      const result = await checkIfCardIsAmbush('special', 'error_card');
      
      expect(result).toBe(false);
      expect(mockCardRepository.getSpecialCardById).toHaveBeenCalledWith('error_card');
    });

    it('should handle empty card ID', async () => {
      mockCardRepository.getSpecialCardById.mockResolvedValue(undefined);

      const result = await checkIfCardIsAmbush('special', '');
      
      expect(result).toBe(false);
      expect(mockCardRepository.getSpecialCardById).toHaveBeenCalledWith('');
    });

    it('should handle null card ID', async () => {
      mockCardRepository.getSpecialCardById.mockResolvedValue(undefined);

      const result = await checkIfCardIsAmbush('special', null as any);
      
      expect(result).toBe(false);
      expect(mockCardRepository.getSpecialCardById).toHaveBeenCalledWith(null);
    });
  });

  describe('validateCardAddition - Ambush Rules', () => {
    it('should allow adding first ambush card', async () => {
      const currentCards = [
        { id: 'deck-special-1', type: 'special', cardId: 'regular_special_1', name: 'Regular Special', quantity: 1 }
      ];

      // Mock the existing regular card (not ambush)
      mockCardRepository.getSpecialCardById.mockResolvedValueOnce({
        id: 'regular_special_1',
        name: 'Regular Special Card',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: 'Regular special card effect...',
        image: 'specials/regular_card.webp',
        is_cataclysm: false,
        is_assist: false,
        is_ambush: false,
        one_per_deck: false,
        alternateImages: []
      });

      // Mock the ambush card being added
      mockCardRepository.getSpecialCardById.mockResolvedValueOnce({
        id: 'special_ambush_card',
        name: 'Ambush Card',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: '**Ambush!** Provides ambush capabilities...',
        image: 'specials/ambush_card.webp',
        is_cataclysm: false,
        is_assist: false,
        is_ambush: true,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await validateCardAddition(currentCards, 'special', 'special_ambush_card', 1);
      
      expect(result).toBeNull(); // No validation errors
    });

    it('should prevent adding second ambush card', async () => {
      const currentCards = [
        { id: 'deck-special-1', type: 'special', cardId: 'ambush_special_1', name: 'Ambush Card 1', quantity: 1 }
      ];

      // Mock the second ambush card being added
      mockCardRepository.getSpecialCardById.mockResolvedValue({
        id: 'special_ambush_card_2',
        name: 'Ambush Card 2',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: '**Ambush!** Another ambush card...',
        image: 'specials/ambush_card_2.webp',
        is_cataclysm: false,
        is_assist: false,
        is_ambush: true,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await validateCardAddition(currentCards, 'special', 'special_ambush_card_2', 1);
      
      expect(result).toBe('Cannot add more than 1 Ambush to a deck (would have 2)');
    });

    it('should allow adding non-ambush cards when ambush is present', async () => {
      const currentCards = [
        { id: 'deck-special-1', type: 'special', cardId: 'ambush_special_1', name: 'Ambush Card 1', quantity: 1 }
      ];

      // Mock the regular special card being added
      mockCardRepository.getSpecialCardById.mockResolvedValue({
        id: 'special_regular_card',
        name: 'Regular Special Card',
        card_type: 'Special Card',
        character: 'Any Character',
        card_effect: 'Regular special card effect...',
        image: 'specials/regular_card.webp',
        is_cataclysm: false,
        is_assist: false,
        is_ambush: false,
        one_per_deck: false,
        alternateImages: []
      });

      const result = await validateCardAddition(currentCards, 'special', 'special_regular_card', 1);
      
      expect(result).toBeNull(); // No validation errors
    });

    it('should handle database errors during validation', async () => {
      const currentCards = [
        { id: 'deck-special-1', type: 'special', cardId: 'ambush_special_1', name: 'Ambush Card 1', quantity: 1 }
      ];

      mockCardRepository.getSpecialCardById.mockRejectedValue(new Error('Database error'));

      const result = await validateCardAddition(currentCards, 'special', 'ambush_special_2', 1);
      
      expect(result).toBeNull(); // Should not fail validation due to database error
    });
  });
});

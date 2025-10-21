/**
 * Unit tests for backend Fortification validation functionality
 * Tests the checkIfCardIsFortification function and related backend logic
 */

import { checkIfCardIsFortification, validateCardAddition } from '../../src/index';
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

describe('Backend Fortification Validation', () => {
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

  describe('checkIfCardIsFortification', () => {
    it('should return true for fortification aspect cards', async () => {
      // Mock aspect card with fortification=true
      mockCardRepository.getAspectById.mockResolvedValue({
        id: 'aspect_fortification_card',
        card_name: 'Fortification Card',
        card_type: 'Aspect',
        location: 'Test Location',
        card_effect: '**Fortification!** Provides defensive capabilities...',
        image: 'aspects/fortification_card.webp',
        is_fortification: true,
        is_one_per_deck: false
      });

      const result = await checkIfCardIsFortification('aspect', 'aspect_fortification_card');
      
      expect(result).toBe(true);
      expect(mockCardRepository.getAspectById).toHaveBeenCalledWith('aspect_fortification_card');
    });

    it('should return false for non-fortification aspect cards', async () => {
      // Mock aspect card with fortification=false
      mockCardRepository.getAspectById.mockResolvedValue({
        id: 'aspect_regular_card',
        card_name: 'Regular Aspect Card',
        card_type: 'Aspect',
        location: 'Test Location',
        card_effect: 'Regular aspect card effect...',
        image: 'aspects/regular_card.webp',
        is_fortification: false,
        is_one_per_deck: false
      });

      const result = await checkIfCardIsFortification('aspect', 'aspect_regular_card');
      
      expect(result).toBe(false);
      expect(mockCardRepository.getAspectById).toHaveBeenCalledWith('aspect_regular_card');
    });

    it('should return false for non-aspect card types', async () => {
      const result = await checkIfCardIsFortification('character', 'character_1');
      expect(result).toBe(false);
      expect(mockCardRepository.getAspectById).not.toHaveBeenCalled();
    });

    it('should return false when card is not found', async () => {
      mockCardRepository.getAspectById.mockResolvedValue(undefined);

      const result = await checkIfCardIsFortification('aspect', 'nonexistent_card');
      
      expect(result).toBe(false);
      expect(mockCardRepository.getAspectById).toHaveBeenCalledWith('nonexistent_card');
    });

    it('should return false when card data is null', async () => {
      mockCardRepository.getAspectById.mockResolvedValue(null as any);

      const result = await checkIfCardIsFortification('aspect', 'null_card');
      
      expect(result).toBe(false);
      expect(mockCardRepository.getAspectById).toHaveBeenCalledWith('null_card');
    });

    it('should handle database errors gracefully', async () => {
      mockCardRepository.getAspectById.mockRejectedValue(new Error('Database error'));

      const result = await checkIfCardIsFortification('aspect', 'error_card');
      
      expect(result).toBe(false);
      expect(mockCardRepository.getAspectById).toHaveBeenCalledWith('error_card');
    });

    it('should handle empty card ID', async () => {
      mockCardRepository.getAspectById.mockResolvedValue(undefined);

      const result = await checkIfCardIsFortification('aspect', '');
      
      expect(result).toBe(false);
      expect(mockCardRepository.getAspectById).toHaveBeenCalledWith('');
    });

    it('should handle null card ID', async () => {
      mockCardRepository.getAspectById.mockResolvedValue(undefined);

      const result = await checkIfCardIsFortification('aspect', null as any);
      
      expect(result).toBe(false);
      expect(mockCardRepository.getAspectById).toHaveBeenCalledWith(null);
    });
  });

  describe('validateCardAddition - Fortification Rules', () => {
    it('should allow adding first fortification card', async () => {
      const currentCards = [
        { id: 'deck-aspect-1', type: 'aspect', cardId: 'regular_aspect_1', name: 'Regular Aspect', quantity: 1 }
      ];

      // Mock the existing regular card (not fortification)
      mockCardRepository.getAspectById.mockResolvedValueOnce({
        id: 'regular_aspect_1',
        card_name: 'Regular Aspect Card',
        card_type: 'Aspect',
        location: 'Test Location',
        card_effect: 'Regular aspect card effect...',
        image: 'aspects/regular_card.webp',
        is_fortification: false,
        is_one_per_deck: false
      });

      // Mock the fortification card being added
      mockCardRepository.getAspectById.mockResolvedValueOnce({
        id: 'aspect_fortification_card',
        card_name: 'Fortification Card',
        card_type: 'Aspect',
        location: 'Test Location',
        card_effect: '**Fortification!** Provides defensive capabilities...',
        image: 'aspects/fortification_card.webp',
        is_fortification: true,
        is_one_per_deck: false
      });

      const result = await validateCardAddition(currentCards, 'aspect', 'aspect_fortification_card', 1);
      
      expect(result).toBeNull(); // No validation errors
    });

    it('should prevent adding second fortification card', async () => {
      const currentCards = [
        { id: 'deck-aspect-1', type: 'aspect', cardId: 'fortification_aspect_1', name: 'Fortification Card 1', quantity: 1 }
      ];

      // Mock the second fortification card being added
      mockCardRepository.getAspectById.mockResolvedValue({
        id: 'aspect_fortification_card_2',
        card_name: 'Fortification Card 2',
        card_type: 'Aspect',
        location: 'Test Location',
        card_effect: '**Fortification!** Another fortification card...',
        image: 'aspects/fortification_card_2.webp',
        is_fortification: true,
        is_one_per_deck: false
      });

      const result = await validateCardAddition(currentCards, 'aspect', 'aspect_fortification_card_2', 1);
      
      expect(result).toBe('Cannot add more than 1 Fortification to a deck (would have 2)');
    });

    it('should allow adding non-fortification cards when fortification is present', async () => {
      const currentCards = [
        { id: 'deck-aspect-1', type: 'aspect', cardId: 'fortification_aspect_1', name: 'Fortification Card 1', quantity: 1 }
      ];

      // Mock the regular aspect card being added
      mockCardRepository.getAspectById.mockResolvedValue({
        id: 'aspect_regular_card',
        card_name: 'Regular Aspect Card',
        card_type: 'Aspect',
        location: 'Test Location',
        card_effect: 'Regular aspect card effect...',
        image: 'aspects/regular_card.webp',
        is_fortification: false,
        is_one_per_deck: false
      });

      const result = await validateCardAddition(currentCards, 'aspect', 'aspect_regular_card', 1);
      
      expect(result).toBeNull(); // No validation errors
    });

    it('should handle database errors during validation', async () => {
      const currentCards = [
        { id: 'deck-aspect-1', type: 'aspect', cardId: 'fortification_aspect_1', name: 'Fortification Card 1', quantity: 1 }
      ];

      mockCardRepository.getAspectById.mockRejectedValue(new Error('Database error'));

      const result = await validateCardAddition(currentCards, 'aspect', 'fortification_aspect_2', 1);
      
      expect(result).toBeNull(); // Should not fail validation due to database error
    });
  });
});

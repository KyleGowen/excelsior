import { DeckCard } from '../types';

/**
 * Utility functions for deck operations
 */
export class DeckUtils {
  /**
   * Generate a UUID v4 string
   * @returns string - A UUID v4 string
   */
  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Calculate card count excluding mission, character, and location cards
   * @param cards - Array of deck cards
   * @returns number - Total count of non-mission/character/location cards
   */
  static calculateCardCount(cards: DeckCard[]): number {
    if (!Array.isArray(cards)) {
      return 0;
    }

    return cards
      .filter(card => !['mission', 'character', 'location'].includes(card.type))
      .reduce((total, card) => total + (card.quantity || 0), 0);
  }

  /**
   * Calculate total card count including all card types
   * @param cards - Array of deck cards
   * @returns number - Total count of all cards
   */
  static calculateTotalCardCount(cards: DeckCard[]): number {
    if (!Array.isArray(cards)) {
      return 0;
    }

    return cards.reduce((total, card) => total + (card.quantity || 0), 0);
  }

  /**
   * Calculate card count for specific card types
   * @param cards - Array of deck cards
   * @param types - Array of card types to include
   * @returns number - Total count of cards matching the specified types
   */
  static calculateCardCountByType(cards: DeckCard[], types: string[]): number {
    if (!Array.isArray(cards) || !Array.isArray(types)) {
      return 0;
    }

    return cards
      .filter(card => types.includes(card.type))
      .reduce((total, card) => total + (card.quantity || 0), 0);
  }

  /**
   * Get unique card types from a deck
   * @param cards - Array of deck cards
   * @returns string[] - Array of unique card types
   */
  static getUniqueCardTypes(cards: DeckCard[]): string[] {
    if (!Array.isArray(cards)) {
      return [];
    }

    return [...new Set(cards.map(card => card.type))];
  }

  /**
   * Check if a deck has any cards of a specific type
   * @param cards - Array of deck cards
   * @param type - Card type to check for
   * @returns boolean - True if deck contains cards of the specified type
   */
  static hasCardType(cards: DeckCard[], type: string): boolean {
    if (!Array.isArray(cards) || !type) {
      return false;
    }

    return cards.some(card => card.type === type);
  }

  /**
   * Get cards of a specific type from a deck
   * @param cards - Array of deck cards
   * @param type - Card type to filter by
   * @returns DeckCard[] - Array of cards matching the specified type
   */
  static getCardsByType(cards: DeckCard[], type: string): DeckCard[] {
    if (!Array.isArray(cards) || !type) {
      return [];
    }

    return cards.filter(card => card.type === type);
  }

  /**
   * Validate deck card data
   * @param card - Deck card to validate
   * @returns boolean - True if card is valid
   */
  static isValidDeckCard(card: any): card is DeckCard {
    if (!card || typeof card !== 'object') {
      return false;
    }

    return (
      typeof card.id === 'string' &&
      typeof card.type === 'string' &&
      typeof card.cardId === 'string' &&
      typeof card.quantity === 'number' &&
      card.quantity > 0
    );
  }

  /**
   * Validate deck cards array
   * @param cards - Array of deck cards to validate
   * @returns boolean - True if all cards are valid
   */
  static isValidDeckCardsArray(cards: any): cards is DeckCard[] {
    if (!Array.isArray(cards)) {
      return false;
    }

    return cards.every(card => DeckUtils.isValidDeckCard(card));
  }

  /**
   * Generate a unique card ID
   * @param cardType - Type of the card
   * @param cardId - Base card ID
   * @returns string - Unique card ID
   */
  static generateCardId(cardType: string, cardId: string): string {
    const timestamp = Date.now();
    return `${cardType}_${cardId}_${timestamp}`;
  }

  /**
   * Sort cards by type and then by card ID
   * @param cards - Array of deck cards to sort
   * @returns DeckCard[] - Sorted array of deck cards
   */
  static sortCardsByTypeAndId(cards: DeckCard[]): DeckCard[] {
    if (!Array.isArray(cards)) {
      return [];
    }

    return [...cards].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }
      return a.cardId.localeCompare(b.cardId);
    });
  }

  /**
   * Get deck statistics
   * @param cards - Array of deck cards
   * @returns object - Deck statistics
   */
  static getDeckStatistics(cards: DeckCard[]): {
    totalCards: number;
    cardCount: number;
    characterCount: number;
    missionCount: number;
    locationCount: number;
    otherCount: number;
    uniqueTypes: string[];
    typeBreakdown: Record<string, number>;
  } {
    if (!Array.isArray(cards)) {
      return {
        totalCards: 0,
        cardCount: 0,
        characterCount: 0,
        missionCount: 0,
        locationCount: 0,
        otherCount: 0,
        uniqueTypes: [],
        typeBreakdown: {}
      };
    }

    const totalCards = DeckUtils.calculateTotalCardCount(cards);
    const cardCount = DeckUtils.calculateCardCount(cards);
    const characterCount = DeckUtils.calculateCardCountByType(cards, ['character']);
    const missionCount = DeckUtils.calculateCardCountByType(cards, ['mission']);
    const locationCount = DeckUtils.calculateCardCountByType(cards, ['location']);
    const otherCount = cardCount;
    const uniqueTypes = DeckUtils.getUniqueCardTypes(cards);
    
    const typeBreakdown: Record<string, number> = {};
    uniqueTypes.forEach(type => {
      typeBreakdown[type] = DeckUtils.calculateCardCountByType(cards, [type]);
    });

    return {
      totalCards,
      cardCount,
      characterCount,
      missionCount,
      locationCount,
      otherCount,
      uniqueTypes,
      typeBreakdown
    };
  }
}

import { DeckRepository } from '../repository/DeckRepository';
import { Deck } from '../types';

export class DeckService {
  constructor(private deckRepository: DeckRepository) {}

  /**
   * Create a new deck with business logic validation
   */
  async createDeck(userId: string, name: string, description?: string, characterIds?: string[]): Promise<Deck> {
    // Business logic validation: Character limit (0-4 characters allowed)
    if (characterIds && characterIds.length > 4) {
      throw new Error('Maximum 4 characters allowed per deck');
    }

    // Delegate to repository for data persistence
    return await this.deckRepository.createDeck(userId, name, description, characterIds);
  }

  /**
   * Get deck by ID
   */
  async getDeckById(id: string): Promise<Deck | undefined> {
    return await this.deckRepository.getDeckById(id);
  }

  /**
   * Get decks by user ID
   */
  async getDecksByUserId(userId: string): Promise<Deck[]> {
    return await this.deckRepository.getDecksByUserId(userId);
  }

  /**
   * Get all decks
   */
  async getAllDecks(): Promise<Deck[]> {
    return await this.deckRepository.getAllDecks();
  }

  /**
   * Update deck
   */
  async updateDeck(id: string, updates: Partial<Deck>): Promise<Deck | undefined> {
    return await this.deckRepository.updateDeck(id, updates);
  }

  /**
   * Delete deck
   */
  async deleteDeck(id: string): Promise<boolean> {
    return await this.deckRepository.deleteDeck(id);
  }

  /**
   * Add card to deck
   */
  async addCardToDeck(deckId: string, cardType: string, cardId: string, quantity?: number, selectedAlternateImage?: string): Promise<boolean> {
    return await this.deckRepository.addCardToDeck(deckId, cardType, cardId, quantity, selectedAlternateImage);
  }

  /**
   * Remove card from deck
   */
  async removeCardFromDeck(deckId: string, cardType: string, cardId: string, quantity?: number): Promise<boolean> {
    return await this.deckRepository.removeCardFromDeck(deckId, cardType, cardId, quantity);
  }

  /**
   * Update card in deck
   */
  async updateCardInDeck(deckId: string, cardType: string, cardId: string, updates: { quantity?: number; selectedAlternateImage?: string }): Promise<boolean> {
    return await this.deckRepository.updateCardInDeck(deckId, cardType, cardId, updates);
  }

  /**
   * Remove all cards from deck
   */
  async removeAllCardsFromDeck(deckId: string): Promise<boolean> {
    return await this.deckRepository.removeAllCardsFromDeck(deckId);
  }

  /**
   * Get deck cards
   */
  async getDeckCards(deckId: string): Promise<any[]> {
    return await this.deckRepository.getDeckCards(deckId);
  }

  /**
   * Check if user owns deck
   */
  async userOwnsDeck(deckId: string, userId: string): Promise<boolean> {
    return await this.deckRepository.userOwnsDeck(deckId, userId);
  }

  /**
   * Update UI preferences
   */
  async updateUIPreferences(deckId: string, preferences: any): Promise<boolean> {
    return await this.deckRepository.updateUIPreferences(deckId, preferences);
  }

  /**
   * Get UI preferences
   */
  async getUIPreferences(deckId: string): Promise<any | undefined> {
    return await this.deckRepository.getUIPreferences(deckId);
  }

  /**
   * Get deck statistics
   */
  async getDeckStats(): Promise<{ decks: number }> {
    return await this.deckRepository.getDeckStats();
  }
}

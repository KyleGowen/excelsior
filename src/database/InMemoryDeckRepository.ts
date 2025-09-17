import { Deck, UIPreferences, DeckCard } from '../types';
import { DeckRepository } from '../repository/DeckRepository';

export class InMemoryDeckRepository implements DeckRepository {
  private decks: Map<string, Deck> = new Map();
  private nextDeckId = 1;

  async initialize(): Promise<void> {
    // Deck repository doesn't need to load any data from files
    // Decks are created dynamically
  }

  async createDeck(userId: string, name: string, description?: string): Promise<Deck> {
    const id = `deck_${this.nextDeckId++}`;
    const now = new Date().toISOString();
    const deck: Deck = { 
      id, 
      user_id: userId, 
      name, 
      ...(description && { description }),
      created_at: now,
      updated_at: now
    };
    this.decks.set(id, deck);
    return deck;
  }

  async getDeckById(id: string): Promise<Deck | undefined> {
    return this.decks.get(id);
  }

  async getDecksByUserId(userId: string): Promise<Deck[]> {
    return Array.from(this.decks.values()).filter(deck => deck.user_id === userId);
  }

  async getAllDecks(): Promise<Deck[]> {
    return Array.from(this.decks.values());
  }

  async updateDeck(id: string, updates: Partial<Deck>): Promise<Deck | undefined> {
    const deck = this.decks.get(id);
    if (!deck) return undefined;

    const updatedDeck = {
      ...deck,
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.decks.set(id, updatedDeck);
    return updatedDeck;
  }

  async deleteDeck(id: string): Promise<boolean> {
    return this.decks.delete(id);
  }

  async updateUIPreferences(deckId: string, preferences: UIPreferences): Promise<boolean> {
    const deck = this.decks.get(deckId);
    if (!deck) return false;

    const updatedDeck = {
      ...deck,
      ui_preferences: preferences,
      updated_at: new Date().toISOString()
    };
    this.decks.set(deckId, updatedDeck);
    return true;
  }

  async getUIPreferences(deckId: string): Promise<UIPreferences | undefined> {
    const deck = this.decks.get(deckId);
    return deck?.ui_preferences;
  }

  async getDeckStats(): Promise<{ decks: number }> {
    return {
      decks: this.decks.size
    };
  }

  // Deck card management methods (stub implementations for in-memory)
  async addCardToDeck(deckId: string, cardType: string, cardId: string, quantity: number = 1, selectedAlternateImage?: string): Promise<boolean> {
    const deck = this.decks.get(deckId);
    if (!deck) return false;

    // Initialize cards array if it doesn't exist
    if (!deck.cards) {
      deck.cards = [];
    }

    // Check if card already exists
    const existingCardIndex = deck.cards.findIndex(card => card.type === cardType && card.cardId === cardId);
    
    if (existingCardIndex >= 0) {
      // Update quantity
      deck.cards[existingCardIndex].quantity += quantity;
    } else {
      // Add new card
      const newCard: DeckCard = {
        id: `deck_card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: cardType as any,
        cardId,
        quantity,
        ...(selectedAlternateImage && { selectedAlternateImage })
      };
      deck.cards.push(newCard);
    }

    deck.updated_at = new Date().toISOString();
    this.decks.set(deckId, deck);
    return true;
  }

  async removeCardFromDeck(deckId: string, cardType: string, cardId: string, quantity: number = 1): Promise<boolean> {
    const deck = this.decks.get(deckId);
    if (!deck || !deck.cards) return false;

    const cardIndex = deck.cards.findIndex(card => card.type === cardType && card.cardId === cardId);
    if (cardIndex === -1) return false;

    const currentQuantity = deck.cards[cardIndex].quantity;
    const newQuantity = currentQuantity - quantity;

    if (newQuantity <= 0) {
      // Remove card completely
      deck.cards.splice(cardIndex, 1);
    } else {
      // Update quantity
      deck.cards[cardIndex].quantity = newQuantity;
    }

    deck.updated_at = new Date().toISOString();
    this.decks.set(deckId, deck);
    return true;
  }

  async updateCardInDeck(deckId: string, cardType: string, cardId: string, updates: { quantity?: number; selectedAlternateImage?: string }): Promise<boolean> {
    const deck = this.decks.get(deckId);
    if (!deck || !deck.cards) return false;

    const cardIndex = deck.cards.findIndex(card => card.type === cardType && card.cardId === cardId);
    if (cardIndex === -1) return false;

    if (updates.quantity !== undefined) {
      deck.cards[cardIndex].quantity = updates.quantity;
    }
    if (updates.selectedAlternateImage !== undefined) {
      deck.cards[cardIndex].selectedAlternateImage = updates.selectedAlternateImage;
    }

    deck.updated_at = new Date().toISOString();
    this.decks.set(deckId, deck);
    return true;
  }

  async removeAllCardsFromDeck(deckId: string): Promise<boolean> {
    const deck = this.decks.get(deckId);
    if (!deck) return false;

    deck.cards = [];
    deck.updated_at = new Date().toISOString();
    this.decks.set(deckId, deck);
    return true;
  }

  async getDeckCards(deckId: string): Promise<DeckCard[]> {
    const deck = this.decks.get(deckId);
    return deck?.cards || [];
  }

  async userOwnsDeck(deckId: string, userId: string): Promise<boolean> {
    const deck = this.decks.get(deckId);
    return deck ? deck.user_id === userId : false;
  }
}

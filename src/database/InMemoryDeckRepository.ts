import { Deck, UIPreferences } from '../types';
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
}

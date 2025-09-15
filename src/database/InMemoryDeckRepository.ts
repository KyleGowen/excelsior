import { Deck, UIPreferences } from '../types';
import { DeckRepository } from '../repository/DeckRepository';

export class InMemoryDeckRepository implements DeckRepository {
  private decks: Map<string, Deck> = new Map();
  private nextDeckId = 1;

  async initialize(): Promise<void> {
    // Deck repository doesn't need to load any data from files
    // Decks are created dynamically
  }

  createDeck(userId: string, name: string, description?: string): Deck {
    const id = `deck_${this.nextDeckId++}`;
    const now = new Date().toISOString();
    const deck: Deck = { 
      id, 
      user_id: userId, 
      name, 
      description,
      created_at: now,
      updated_at: now
    };
    this.decks.set(id, deck);
    return deck;
  }

  getDeckById(id: string): Deck | undefined {
    return this.decks.get(id);
  }

  getDecksByUserId(userId: string): Deck[] {
    return Array.from(this.decks.values()).filter(deck => deck.user_id === userId);
  }

  getAllDecks(): Deck[] {
    return Array.from(this.decks.values());
  }

  updateDeck(id: string, updates: Partial<Deck>): Deck | undefined {
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

  deleteDeck(id: string): boolean {
    return this.decks.delete(id);
  }

  updateUIPreferences(deckId: string, preferences: UIPreferences): boolean {
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

  getUIPreferences(deckId: string): UIPreferences | undefined {
    const deck = this.decks.get(deckId);
    return deck?.ui_preferences;
  }

  getDeckStats(): { decks: number } {
    return {
      decks: this.decks.size
    };
  }
}

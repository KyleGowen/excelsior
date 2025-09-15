import { Deck } from '../types';
import { DeckRepository } from '../repository/DeckRepository';

export class InMemoryDeckRepository implements DeckRepository {
  private decks: Map<string, Deck> = new Map();
  private nextDeckId = 1;

  async initialize(): Promise<void> {
    // Deck repository doesn't need to load any data from files
    // Decks are created dynamically
  }

  createDeck(userId: string, name: string): Deck {
    const id = `deck_${this.nextDeckId++}`;
    const deck: Deck = { id, user_id: userId, name };
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

  getDeckStats(): { decks: number } {
    return {
      decks: this.decks.size
    };
  }
}

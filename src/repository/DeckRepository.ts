import { Deck } from '../types';

export interface DeckRepository {
  // Initialization
  initialize(): Promise<void>;

  // Deck management
  createDeck(userId: string, name: string): Deck;
  getDeckById(id: string): Deck | undefined;
  getDecksByUserId(userId: string): Deck[];
  getAllDecks(): Deck[];

  // Statistics
  getDeckStats(): {
    decks: number;
  };
}

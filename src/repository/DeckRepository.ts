import { Deck, UIPreferences } from '../types';

export interface DeckRepository {
  // Initialization
  initialize(): Promise<void>;

  // Deck management
  createDeck(userId: string, name: string, description?: string): Deck;
  getDeckById(id: string): Deck | undefined;
  getDecksByUserId(userId: string): Deck[];
  getAllDecks(): Deck[];
  updateDeck(id: string, updates: Partial<Deck>): Deck | undefined;
  deleteDeck(id: string): boolean;

  // UI Preferences
  updateUIPreferences(deckId: string, preferences: UIPreferences): boolean;
  getUIPreferences(deckId: string): UIPreferences | undefined;

  // Statistics
  getDeckStats(): {
    decks: number;
  };
}

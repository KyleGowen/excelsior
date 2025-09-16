import { Deck, UIPreferences } from '../types';

export interface DeckRepository {
  // Initialization
  initialize(): Promise<void>;

  // Deck management
  createDeck(userId: string, name: string, description?: string): Promise<Deck>;
  getDeckById(id: string): Promise<Deck | undefined>;
  getDecksByUserId(userId: string): Promise<Deck[]>;
  getAllDecks(): Promise<Deck[]>;
  updateDeck(id: string, updates: Partial<Deck>): Promise<Deck | undefined>;
  deleteDeck(id: string): Promise<boolean>;

  // UI Preferences
  updateUIPreferences(deckId: string, preferences: UIPreferences): Promise<boolean>;
  getUIPreferences(deckId: string): Promise<UIPreferences | undefined>;

  // Statistics
  getDeckStats(): Promise<{
    decks: number;
  }>;
}

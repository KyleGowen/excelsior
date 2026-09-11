import { Deck, UIPreferences, DeckCard, PreconstructedDeckRecord } from '../types';

export interface DeckRepository {
  // Initialization
  initialize(): Promise<void>;

  // Deck management
  createDeck(userId: string, name: string, description?: string, characterIds?: string[], isPrivate?: boolean): Promise<Deck>;
  getDeckById(id: string): Promise<Deck | undefined>;
  getDecksByUserId(userId: string, orderBy?: 'created_at' | 'updated_at'): Promise<Deck[]>;
  getDeckSummaryWithAllCards(deckId: string): Promise<Deck | undefined>;
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

  // Deck card management
  addCardToDeck(deckId: string, cardType: string, cardId: string, quantity?: number, selectedAlternateImage?: string): Promise<boolean>;
  removeCardFromDeck(deckId: string, cardType: string, cardId: string, quantity?: number): Promise<boolean>;
  updateCardInDeck(deckId: string, cardType: string, cardId: string, updates: { quantity?: number; selectedAlternateImage?: string }): Promise<boolean>;
  removeAllCardsFromDeck(deckId: string): Promise<boolean>;
  replaceAllCardsInDeck(deckId: string, cards: Array<{cardType: string, cardId: string, quantity: number, displayOrder?: number, selectedAlternateImage?: string, exclude_from_draw?: boolean}>): Promise<void>;
  getDeckCards(deckId: string): Promise<DeckCard[]>;
  doesCardExistInDeck(deckId: string, cardType: string, cardId: string): Promise<boolean>;
  
  // Authorization
  userOwnsDeck(deckId: string, userId: string): Promise<boolean>;

  // Community feed / public profiles / favorites
  getCommunityFeedDecks(opts?: { limit?: number; excludeUserIds?: string[] }): Promise<Deck[]>;
  searchCommunityDecks(opts: { search: string; limit?: number; excludeUserIds?: string[] }): Promise<Deck[]>;
  getPublicDecksByUserId(userId: string): Promise<Deck[]>;
  getPublicDecksByIds(ids: string[]): Promise<Deck[]>;
  getPublicLegalDecksByUserId(userId: string, orderBy?: 'created_at' | 'updated_at'): Promise<Deck[]>;
  getPreconstructedDecks(): Promise<PreconstructedDeckRecord[]>;
  getFavoriteDecksForUser(userId: string): Promise<Deck[]>;
  addDeckFavorite(userId: string, deckId: string): Promise<boolean>;
  removeDeckFavorite(userId: string, deckId: string): Promise<boolean>;
  getFavoritedDeckIds(userId: string, deckIds: string[]): Promise<Set<string>>;

  /** Optional: in-memory cache clear (e.g. PostgreSQL implementation; admin debug). */
  clearCache?(): void;
}

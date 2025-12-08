import { Deck, UIPreferences, DeckCard } from '../types';

export interface DeckRepository {
  // Initialization
  initialize(): Promise<void>;

  // Deck management
  createDeck(userId: string, name: string, description?: string, characterIds?: string[]): Promise<Deck>;
  getDeckById(id: string): Promise<Deck | undefined>;
  getDecksByUserId(userId: string): Promise<Deck[]>;
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
  replaceAllCardsInDeck(deckId: string, cards: Array<{cardType: string, cardId: string, quantity: number, selectedAlternateImage?: string, exclude_from_draw?: boolean}>): Promise<boolean>;
  getDeckCards(deckId: string): Promise<DeckCard[]>;
  doesCardExistInDeck(deckId: string, cardType: string, cardId: string): Promise<boolean>;
  
  // Authorization
  userOwnsDeck(deckId: string, userId: string): Promise<boolean>;
  
}

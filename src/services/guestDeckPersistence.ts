import { DeckData, DeckCard } from '../types';

interface GuestDeck {
  id: string;
  sessionId: string;
  deckData: DeckData;
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt: Date;
}

export class GuestDeckPersistenceService {
  private guestDecks: Map<string, GuestDeck> = new Map();
  private sessionToDecks: Map<string, Set<string>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval to run every 30 seconds
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredDecks();
    }, 30000); // Run every 30 seconds
  }

  private cleanupExpiredDecks(): void {
    const now = new Date();
    const expiredDeckIds: string[] = [];

    for (const [deckId, deck] of this.guestDecks.entries()) {
      if (now > deck.expiresAt) {
        expiredDeckIds.push(deckId);
      }
    }

    // Remove expired decks
    expiredDeckIds.forEach(deckId => {
      const deck = this.guestDecks.get(deckId);
      if (deck) {
        // Remove from session mapping
        const sessionDecks = this.sessionToDecks.get(deck.sessionId);
        if (sessionDecks) {
          sessionDecks.delete(deckId);
          if (sessionDecks.size === 0) {
            this.sessionToDecks.delete(deck.sessionId);
          }
        }
        // Remove from main storage
        this.guestDecks.delete(deckId);
      }
    });

    if (expiredDeckIds.length > 0) {
      console.log(`🧹 Cleaned up ${expiredDeckIds.length} expired guest decks`);
    }
  }

  createDeck(sessionId: string, deckData: DeckData): string {
    const deckId = `guest_${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes from now

    const guestDeck: GuestDeck = {
      id: deckId,
      sessionId,
      deckData: {
        ...deckData,
        metadata: {
          ...deckData.metadata,
          id: deckId,
          userId: sessionId // Use sessionId as userId for guest decks
        }
      },
      createdAt: now,
      lastAccessedAt: now,
      expiresAt
    };

    this.guestDecks.set(deckId, guestDeck);

    // Add to session mapping
    if (!this.sessionToDecks.has(sessionId)) {
      this.sessionToDecks.set(sessionId, new Set());
    }
    this.sessionToDecks.get(sessionId)!.add(deckId);

    console.log(`✅ Created guest deck ${deckId} for session ${sessionId}`);
    return deckId;
  }

  updateDeck(sessionId: string, deckId: string, deckData: DeckData): boolean {
    const deck = this.guestDecks.get(deckId);
    
    if (!deck || deck.sessionId !== sessionId) {
      return false; // Deck doesn't exist or doesn't belong to this session
    }

    // Update the deck data and extend expiration
    const now = new Date();
    deck.deckData = {
      ...deckData,
      metadata: {
        ...deckData.metadata,
        id: deckId,
        userId: sessionId
      }
    };
    deck.lastAccessedAt = now;
    deck.expiresAt = new Date(now.getTime() + 2 * 60 * 1000); // Extend by 2 minutes

    this.guestDecks.set(deckId, deck);
    return true;
  }

  getDeck(sessionId: string, deckId: string): DeckData | null {
    const deck = this.guestDecks.get(deckId);
    
    if (!deck || deck.sessionId !== sessionId) {
      return null; // Deck doesn't exist or doesn't belong to this session
    }

    // Update last accessed time and extend expiration
    const now = new Date();
    deck.lastAccessedAt = now;
    deck.expiresAt = new Date(now.getTime() + 2 * 60 * 1000); // Extend by 2 minutes

    this.guestDecks.set(deckId, deck);
    return deck.deckData;
  }

  getAllDecksForSession(sessionId: string): DeckData[] {
    const sessionDecks = this.sessionToDecks.get(sessionId);
    if (!sessionDecks) {
      return [];
    }

    const decks: DeckData[] = [];
    for (const deckId of sessionDecks) {
      const deck = this.guestDecks.get(deckId);
      if (deck) {
        // Update last accessed time and extend expiration
        const now = new Date();
        deck.lastAccessedAt = now;
        deck.expiresAt = new Date(now.getTime() + 2 * 60 * 1000); // Extend by 2 minutes
        this.guestDecks.set(deckId, deck);
        
        decks.push(deck.deckData);
      }
    }

    return decks;
  }

  deleteDeck(sessionId: string, deckId: string): boolean {
    const deck = this.guestDecks.get(deckId);
    
    if (!deck || deck.sessionId !== sessionId) {
      return false; // Deck doesn't exist or doesn't belong to this session
    }

    // Remove from session mapping
    const sessionDecks = this.sessionToDecks.get(sessionId);
    if (sessionDecks) {
      sessionDecks.delete(deckId);
      if (sessionDecks.size === 0) {
        this.sessionToDecks.delete(sessionId);
      }
    }

    // Remove from main storage
    this.guestDecks.delete(deckId);
    console.log(`🗑️ Deleted guest deck ${deckId} for session ${sessionId}`);
    return true;
  }

  // Clean up all decks for a specific session (when session ends)
  cleanupSessionDecks(sessionId: string): number {
    const sessionDecks = this.sessionToDecks.get(sessionId);
    if (!sessionDecks) {
      return 0;
    }

    let cleanedCount = 0;
    for (const deckId of sessionDecks) {
      if (this.guestDecks.delete(deckId)) {
        cleanedCount++;
      }
    }

    this.sessionToDecks.delete(sessionId);
    console.log(`🧹 Cleaned up ${cleanedCount} decks for session ${sessionId}`);
    return cleanedCount;
  }

  // Get statistics
  getStats(): { totalGuestDecks: number; activeSessions: number } {
    return {
      totalGuestDecks: this.guestDecks.size,
      activeSessions: this.sessionToDecks.size
    };
  }

  // Cleanup on service destruction
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

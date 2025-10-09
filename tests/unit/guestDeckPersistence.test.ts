import { GuestDeckPersistenceService } from '../../src/services/guestDeckPersistence';
import { DeckData } from '../../src/types';

// Mock console methods
const originalConsoleLog = console.log;

let mockConsoleLog: jest.SpyInstance;

// Mock timers
jest.useFakeTimers();

describe('GuestDeckPersistenceService', () => {
  let service: GuestDeckPersistenceService;
  const mockSessionId = 'session123';
  const mockDeckData: DeckData = {
    metadata: {
      id: 'deck123',
      name: 'Test Deck',
      description: 'Test Description',
      created: '2023-01-01T00:00:00.000Z',
      lastModified: '2023-01-01T00:00:00.000Z',
      cardCount: 0,
      userId: 'user123'
    },
    cards: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    service = new GuestDeckPersistenceService();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    service.destroy();
    jest.clearAllTimers();
  });

  describe('constructor', () => {
    it('should initialize with empty guest decks and session mappings', () => {
      expect((service as any).guestDecks.size).toBe(0);
      expect((service as any).sessionToDecks.size).toBe(0);
    });

    it('should start cleanup interval', () => {
      expect((service as any).cleanupInterval).toBeDefined();
    });
  });

  describe('createDeck', () => {
    it('should create a new guest deck', () => {
      const deckId = service.createDeck(mockSessionId, mockDeckData);

      expect(deckId).toMatch(/^guest_session123_\d+_[a-z0-9]+$/);
      expect((service as any).guestDecks.has(deckId)).toBe(true);
    });

    it('should set correct deck data with session ID as userId', () => {
      const deckId = service.createDeck(mockSessionId, mockDeckData);
      const guestDeck = (service as any).guestDecks.get(deckId);

      expect(guestDeck.deckData.metadata.id).toBe(deckId);
      expect(guestDeck.deckData.metadata.userId).toBe(mockSessionId);
      expect(guestDeck.sessionId).toBe(mockSessionId);
    });

    it('should set expiration time to 2 minutes from now', () => {
      const now = new Date();
      const deckId = service.createDeck(mockSessionId, mockDeckData);
      const guestDeck = (service as any).guestDecks.get(deckId);

      const expectedExpiration = new Date(now.getTime() + 2 * 60 * 1000);
      expect(guestDeck.expiresAt.getTime()).toBeCloseTo(expectedExpiration.getTime(), -2);
    });

    it('should add deck to session mapping', () => {
      const deckId = service.createDeck(mockSessionId, mockDeckData);
      const sessionDecks = (service as any).sessionToDecks.get(mockSessionId);

      expect(sessionDecks).toBeDefined();
      expect(sessionDecks.has(deckId)).toBe(true);
    });

    it('should log deck creation', () => {
      const deckId = service.createDeck(mockSessionId, mockDeckData);

      expect(mockConsoleLog).toHaveBeenCalledWith(`✅ Created guest deck ${deckId} for session ${mockSessionId}`);
    });

    it('should handle multiple decks for same session', () => {
      const deckId1 = service.createDeck(mockSessionId, mockDeckData);
      const deckId2 = service.createDeck(mockSessionId, mockDeckData);
      const sessionDecks = (service as any).sessionToDecks.get(mockSessionId);

      expect(sessionDecks.size).toBe(2);
      expect(sessionDecks.has(deckId1)).toBe(true);
      expect(sessionDecks.has(deckId2)).toBe(true);
    });
  });

  describe('updateDeck', () => {
    it('should update existing deck data', () => {
      const deckId = service.createDeck(mockSessionId, mockDeckData);
      const updatedDeckData = {
        ...mockDeckData,
        metadata: {
          ...mockDeckData.metadata,
          name: 'Updated Deck Name'
        }
      };

      const result = service.updateDeck(mockSessionId, deckId, updatedDeckData);

      expect(result).toBe(true);
      const guestDeck = (service as any).guestDecks.get(deckId);
      expect(guestDeck.deckData.metadata.name).toBe('Updated Deck Name');
      expect(guestDeck.deckData.metadata.id).toBe(deckId);
      expect(guestDeck.deckData.metadata.userId).toBe(mockSessionId);
    });

    it('should extend expiration time on update', () => {
      const deckId = service.createDeck(mockSessionId, mockDeckData);
      const originalExpiration = (service as any).guestDecks.get(deckId).expiresAt;

      // Fast forward time by 1 minute
      jest.advanceTimersByTime(60 * 1000);

      service.updateDeck(mockSessionId, deckId, mockDeckData);
      const updatedExpiration = (service as any).guestDecks.get(deckId).expiresAt;

      expect(updatedExpiration.getTime()).toBeGreaterThan(originalExpiration.getTime());
    });

    it('should update lastAccessedAt on update', () => {
      const deckId = service.createDeck(mockSessionId, mockDeckData);
      const originalLastAccessed = (service as any).guestDecks.get(deckId).lastAccessedAt;

      // Fast forward time by 1 minute
      jest.advanceTimersByTime(60 * 1000);

      service.updateDeck(mockSessionId, deckId, mockDeckData);
      const updatedLastAccessed = (service as any).guestDecks.get(deckId).lastAccessedAt;

      expect(updatedLastAccessed.getTime()).toBeGreaterThan(originalLastAccessed.getTime());
    });

    it('should return false for non-existent deck', () => {
      const result = service.updateDeck(mockSessionId, 'nonexistent', mockDeckData);
      expect(result).toBe(false);
    });

    it('should return false for deck belonging to different session', () => {
      const deckId = service.createDeck(mockSessionId, mockDeckData);
      const result = service.updateDeck('different-session', deckId, mockDeckData);
      expect(result).toBe(false);
    });
  });

  describe('getDeck', () => {
    it('should return deck data for existing deck', () => {
      const deckId = service.createDeck(mockSessionId, mockDeckData);
      const result = service.getDeck(mockSessionId, deckId);

      expect(result).toBeDefined();
      expect(result?.metadata.id).toBe(deckId);
      expect(result?.metadata.userId).toBe(mockSessionId);
    });

    it('should extend expiration time on access', () => {
      const deckId = service.createDeck(mockSessionId, mockDeckData);
      const originalExpiration = (service as any).guestDecks.get(deckId).expiresAt;

      // Fast forward time by 1 minute
      jest.advanceTimersByTime(60 * 1000);

      service.getDeck(mockSessionId, deckId);
      const updatedExpiration = (service as any).guestDecks.get(deckId).expiresAt;

      expect(updatedExpiration.getTime()).toBeGreaterThan(originalExpiration.getTime());
    });

    it('should update lastAccessedAt on access', () => {
      const deckId = service.createDeck(mockSessionId, mockDeckData);
      const originalLastAccessed = (service as any).guestDecks.get(deckId).lastAccessedAt;

      // Fast forward time by 1 minute
      jest.advanceTimersByTime(60 * 1000);

      service.getDeck(mockSessionId, deckId);
      const updatedLastAccessed = (service as any).guestDecks.get(deckId).lastAccessedAt;

      expect(updatedLastAccessed.getTime()).toBeGreaterThan(originalLastAccessed.getTime());
    });

    it('should return null for non-existent deck', () => {
      const result = service.getDeck(mockSessionId, 'nonexistent');
      expect(result).toBeNull();
    });

    it('should return null for deck belonging to different session', () => {
      const deckId = service.createDeck(mockSessionId, mockDeckData);
      const result = service.getDeck('different-session', deckId);
      expect(result).toBeNull();
    });
  });

  describe('getAllDecksForSession', () => {
    it('should return all decks for a session', () => {
      const deckId1 = service.createDeck(mockSessionId, mockDeckData);
      const deckId2 = service.createDeck(mockSessionId, mockDeckData);

      const decks = service.getAllDecksForSession(mockSessionId);

      expect(decks).toHaveLength(2);
      expect(decks.some(deck => deck.metadata.id === deckId1)).toBe(true);
      expect(decks.some(deck => deck.metadata.id === deckId2)).toBe(true);
    });

    it('should return empty array for session with no decks', () => {
      const decks = service.getAllDecksForSession('empty-session');
      expect(decks).toEqual([]);
    });

    it('should extend expiration time for all accessed decks', () => {
      const deckId = service.createDeck(mockSessionId, mockDeckData);
      const originalExpiration = (service as any).guestDecks.get(deckId).expiresAt;

      // Fast forward time by 1 minute
      jest.advanceTimersByTime(60 * 1000);

      service.getAllDecksForSession(mockSessionId);
      const updatedExpiration = (service as any).guestDecks.get(deckId).expiresAt;

      expect(updatedExpiration.getTime()).toBeGreaterThan(originalExpiration.getTime());
    });
  });

  describe('deleteDeck', () => {
    it('should delete existing deck', () => {
      const deckId = service.createDeck(mockSessionId, mockDeckData);
      const result = service.deleteDeck(mockSessionId, deckId);

      expect(result).toBe(true);
      expect((service as any).guestDecks.has(deckId)).toBe(false);
      expect((service as any).sessionToDecks.has(mockSessionId)).toBe(false);
    });

    it('should remove session mapping when no decks remain', () => {
      const deckId = service.createDeck(mockSessionId, mockDeckData);
      service.deleteDeck(mockSessionId, deckId);

      expect((service as any).sessionToDecks.has(mockSessionId)).toBe(false);
    });

    it('should keep session mapping when other decks remain', () => {
      const deckId1 = service.createDeck(mockSessionId, mockDeckData);
      const deckId2 = service.createDeck(mockSessionId, mockDeckData);
      
      service.deleteDeck(mockSessionId, deckId1);

      expect((service as any).sessionToDecks.has(mockSessionId)).toBe(true);
      expect((service as any).sessionToDecks.get(mockSessionId).has(deckId2)).toBe(true);
    });

    it('should log deck deletion', () => {
      const deckId = service.createDeck(mockSessionId, mockDeckData);
      service.deleteDeck(mockSessionId, deckId);

      expect(mockConsoleLog).toHaveBeenCalledWith(`🗑️ Deleted guest deck ${deckId} for session ${mockSessionId}`);
    });

    it('should return false for non-existent deck', () => {
      const result = service.deleteDeck(mockSessionId, 'nonexistent');
      expect(result).toBe(false);
    });

    it('should return false for deck belonging to different session', () => {
      const deckId = service.createDeck(mockSessionId, mockDeckData);
      const result = service.deleteDeck('different-session', deckId);
      expect(result).toBe(false);
    });
  });

  describe('cleanupSessionDecks', () => {
    it('should clean up all decks for a session', () => {
      const deckId1 = service.createDeck(mockSessionId, mockDeckData);
      const deckId2 = service.createDeck(mockSessionId, mockDeckData);

      const cleanedCount = service.cleanupSessionDecks(mockSessionId);

      expect(cleanedCount).toBe(2);
      expect((service as any).guestDecks.has(deckId1)).toBe(false);
      expect((service as any).guestDecks.has(deckId2)).toBe(false);
      expect((service as any).sessionToDecks.has(mockSessionId)).toBe(false);
    });

    it('should return 0 for session with no decks', () => {
      const cleanedCount = service.cleanupSessionDecks('empty-session');
      expect(cleanedCount).toBe(0);
    });

    it('should log cleanup count', () => {
      service.createDeck(mockSessionId, mockDeckData);
      service.createDeck(mockSessionId, mockDeckData);

      service.cleanupSessionDecks(mockSessionId);

      expect(mockConsoleLog).toHaveBeenCalledWith(`🧹 Cleaned up 2 decks for session ${mockSessionId}`);
    });
  });

  describe('cleanupExpiredDecks', () => {
    it('should clean up expired decks', () => {
      const deckId = service.createDeck(mockSessionId, mockDeckData);
      
      // Fast forward time by 3 minutes (past 2-minute expiration)
      jest.advanceTimersByTime(3 * 60 * 1000);

      // Trigger cleanup
      (service as any).cleanupExpiredDecks();

      expect((service as any).guestDecks.has(deckId)).toBe(false);
      expect((service as any).sessionToDecks.has(mockSessionId)).toBe(false);
    });

    it('should not clean up non-expired decks', () => {
      const deckId = service.createDeck(mockSessionId, mockDeckData);
      
      // Fast forward time by 1 minute (before 2-minute expiration)
      jest.advanceTimersByTime(60 * 1000);

      // Trigger cleanup
      (service as any).cleanupExpiredDecks();

      expect((service as any).guestDecks.has(deckId)).toBe(true);
      expect((service as any).sessionToDecks.has(mockSessionId)).toBe(true);
    });

    it('should log cleanup count', () => {
      service.createDeck(mockSessionId, mockDeckData);
      
      // Fast forward time by 3 minutes
      jest.advanceTimersByTime(3 * 60 * 1000);

      // Trigger cleanup
      (service as any).cleanupExpiredDecks();

      expect(mockConsoleLog).toHaveBeenCalledWith('🧹 Cleaned up 1 expired guest decks');
    });

    it('should not log when no decks are cleaned up', () => {
      service.createDeck(mockSessionId, mockDeckData);
      
      // Fast forward time by 1 minute
      jest.advanceTimersByTime(60 * 1000);

      // Trigger cleanup
      (service as any).cleanupExpiredDecks();

      expect(mockConsoleLog).not.toHaveBeenCalledWith(expect.stringContaining('🧹 Cleaned up'));
    });
  });

  describe('cleanup interval', () => {
    it('should run cleanup every 30 seconds', () => {
      const cleanupSpy = jest.spyOn(service as any, 'cleanupExpiredDecks');
      
      // Fast forward time by 30 seconds
      jest.advanceTimersByTime(30 * 1000);

      expect(cleanupSpy).toHaveBeenCalledTimes(1);
    });

    it('should run cleanup multiple times', () => {
      const cleanupSpy = jest.spyOn(service as any, 'cleanupExpiredDecks');
      
      // Fast forward time by 90 seconds (3 intervals)
      jest.advanceTimersByTime(90 * 1000);

      expect(cleanupSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      service.createDeck('session1', mockDeckData);
      service.createDeck('session1', mockDeckData);
      service.createDeck('session2', mockDeckData);

      const stats = service.getStats();

      expect(stats.totalGuestDecks).toBe(3);
      expect(stats.activeSessions).toBe(2);
    });

    it('should return zero stats when no decks exist', () => {
      const stats = service.getStats();

      expect(stats.totalGuestDecks).toBe(0);
      expect(stats.activeSessions).toBe(0);
    });
  });

  describe('destroy', () => {
    it('should clear cleanup interval', () => {
      const service = new GuestDeckPersistenceService();
      const intervalId = (service as any).cleanupInterval;
      
      service.destroy();

      expect((service as any).cleanupInterval).toBeNull();
    });

    it('should handle destroy when no interval exists', () => {
      const service = new GuestDeckPersistenceService();
      (service as any).cleanupInterval = null;
      
      expect(() => service.destroy()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle deck access after expiration', () => {
      const deckId = service.createDeck(mockSessionId, mockDeckData);
      
      // Fast forward time by 3 minutes
      jest.advanceTimersByTime(3 * 60 * 1000);

      // Trigger cleanup
      (service as any).cleanupExpiredDecks();

      const result = service.getDeck(mockSessionId, deckId);
      expect(result).toBeNull();
    });

    it('should handle multiple sessions independently', () => {
      const session1 = 'session1';
      const session2 = 'session2';
      
      const deckId1 = service.createDeck(session1, mockDeckData);
      const deckId2 = service.createDeck(session2, mockDeckData);

      expect(service.getDeck(session1, deckId1)).toBeDefined();
      expect(service.getDeck(session2, deckId2)).toBeDefined();
      expect(service.getDeck(session1, deckId2)).toBeNull();
      expect(service.getDeck(session2, deckId1)).toBeNull();
    });

    it('should handle rapid deck creation and deletion', () => {
      const deckIds: string[] = [];
      
      // Create 10 decks rapidly
      for (let i = 0; i < 10; i++) {
        deckIds.push(service.createDeck(mockSessionId, mockDeckData));
      }

      expect((service as any).guestDecks.size).toBe(10);
      expect((service as any).sessionToDecks.get(mockSessionId)?.size).toBe(10);

      // Delete all decks
      deckIds.forEach(deckId => {
        service.deleteDeck(mockSessionId, deckId);
      });

      expect((service as any).guestDecks.size).toBe(0);
      expect((service as any).sessionToDecks.has(mockSessionId)).toBe(false);
    });
  });
});

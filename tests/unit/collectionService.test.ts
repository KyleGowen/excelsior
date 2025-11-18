import { CollectionService } from '../../src/services/collectionService';
import { CollectionsRepository, CollectionCardWithDetails, CollectionCard } from '../../src/database/collectionsRepository';

// Mock the CollectionsRepository
class MockCollectionsRepository {
  private collections: Map<string, string> = new Map(); // userId -> collectionId
  private collectionCards: Map<string, CollectionCardWithDetails[]> = new Map(); // collectionId -> cards
  private cardExistsMap: Map<string, boolean> = new Map(); // cardId-cardType -> exists

  async getOrCreateCollection(userId: string): Promise<string> {
    if (this.collections.has(userId)) {
      return this.collections.get(userId)!;
    }
    const collectionId = `collection-${userId}`;
    this.collections.set(userId, collectionId);
    this.collectionCards.set(collectionId, []);
    return collectionId;
  }

  async getCollectionCards(collectionId: string): Promise<CollectionCardWithDetails[]> {
    return this.collectionCards.get(collectionId) || [];
  }

  async addCardToCollection(
    collectionId: string,
    cardId: string,
    cardType: string,
    quantity: number = 1,
    imagePath?: string
  ): Promise<CollectionCard> {
    const cards = this.collectionCards.get(collectionId) || [];
    const existingCard = cards.find(
      c => c.card_id === cardId && c.card_type === cardType && c.image_path === (imagePath || `/images/${cardId}.webp`)
    );

    if (existingCard) {
      existingCard.quantity += quantity;
      existingCard.updated_at = new Date();
      return {
        id: existingCard.id,
        collection_id: existingCard.collection_id,
        card_id: existingCard.card_id,
        card_type: existingCard.card_type,
        quantity: existingCard.quantity,
        image_path: existingCard.image_path,
        created_at: existingCard.created_at,
        updated_at: existingCard.updated_at
      };
    }

    const newCard: CollectionCardWithDetails = {
      id: `cc-${Date.now()}-${Math.random()}`,
      collection_id: collectionId,
      card_id: cardId,
      card_type: cardType,
      quantity,
      image_path: imagePath || `/images/${cardId}.webp`,
      created_at: new Date(),
      updated_at: new Date(),
      card_name: `Card ${cardId}`,
      set: 'ERB'
    };

    cards.push(newCard);
    this.collectionCards.set(collectionId, cards);

    return {
      id: newCard.id,
      collection_id: newCard.collection_id,
      card_id: newCard.card_id,
      card_type: newCard.card_type,
      quantity: newCard.quantity,
      image_path: newCard.image_path,
      created_at: newCard.created_at,
      updated_at: newCard.updated_at
    };
  }

  async updateCardQuantity(
    collectionId: string,
    cardId: string,
    cardType: string,
    quantity: number,
    imagePath: string
  ): Promise<CollectionCard | null> {
    const cards = this.collectionCards.get(collectionId) || [];
    const card = cards.find(
      c => c.card_id === cardId && c.card_type === cardType && c.image_path === imagePath
    );

    if (!card) {
      return null;
    }

    if (quantity === 0) {
      const index = cards.indexOf(card);
      cards.splice(index, 1);
      this.collectionCards.set(collectionId, cards);
      return null;
    }

    card.quantity = quantity;
    card.updated_at = new Date();
    return {
      id: card.id,
      collection_id: card.collection_id,
      card_id: card.card_id,
      card_type: card.card_type,
      quantity: card.quantity,
      image_path: card.image_path,
      created_at: card.created_at,
      updated_at: card.updated_at
    };
  }

  async removeCardFromCollection(
    collectionId: string,
    cardId: string,
    cardType: string
  ): Promise<boolean> {
    const cards = this.collectionCards.get(collectionId) || [];
    const initialLength = cards.length;
    const filtered = cards.filter(c => !(c.card_id === cardId && c.card_type === cardType));
    this.collectionCards.set(collectionId, filtered);
    return filtered.length < initialLength;
  }

  async verifyCardExists(cardId: string, cardType: string): Promise<boolean> {
    const key = `${cardId}-${cardType}`;
    return this.cardExistsMap.get(key) ?? true; // Default to true for convenience
  }

  // Helper methods for testing
  setCardExists(cardId: string, cardType: string, exists: boolean): void {
    this.cardExistsMap.set(`${cardId}-${cardType}`, exists);
  }

  addCardToMockCollection(collectionId: string, card: CollectionCardWithDetails): void {
    const cards = this.collectionCards.get(collectionId) || [];
    cards.push(card);
    this.collectionCards.set(collectionId, cards);
  }
}

describe('CollectionService', () => {
  let collectionService: CollectionService;
  let mockRepository: MockCollectionsRepository;

  beforeEach(() => {
    mockRepository = new MockCollectionsRepository();
    collectionService = new CollectionService(mockRepository as any);
  });

  describe('translateSet', () => {
    it('should return default set name when setCode is null', () => {
      const result = collectionService.translateSet(null);
      expect(result).toBe('Edgar Rice Burroughs and the World Legends');
    });

    it('should return default set name when setCode is undefined', () => {
      const result = collectionService.translateSet(undefined);
      expect(result).toBe('Edgar Rice Burroughs and the World Legends');
    });

    it('should return default set name when setCode is empty string', () => {
      const result = collectionService.translateSet('');
      expect(result).toBe('Edgar Rice Burroughs and the World Legends');
    });

    it('should translate ERB to full set name', () => {
      const result = collectionService.translateSet('ERB');
      expect(result).toBe('Edgar Rice Burroughs and the World Legends');
    });

    it('should translate erb (lowercase) to full set name', () => {
      const result = collectionService.translateSet('erb');
      expect(result).toBe('Edgar Rice Burroughs and the World Legends');
    });

    it('should translate ERB (uppercase) to full set name', () => {
      const result = collectionService.translateSet('ERB');
      expect(result).toBe('Edgar Rice Burroughs and the World Legends');
    });

    it('should return original code for unknown set codes', () => {
      const result = collectionService.translateSet('UNKNOWN');
      expect(result).toBe('UNKNOWN');
    });

    it('should handle mixed case set codes', () => {
      const result = collectionService.translateSet('ErB');
      expect(result).toBe('Edgar Rice Burroughs and the World Legends');
    });
  });

  describe('getOrCreateCollection', () => {
    it('should get existing collection for user', async () => {
      const userId = 'user-123';
      const collectionId1 = await collectionService.getOrCreateCollection(userId);
      const collectionId2 = await collectionService.getOrCreateCollection(userId);
      
      expect(collectionId1).toBe(collectionId2);
      expect(collectionId1).toBeDefined();
    });

    it('should create new collection for new user', async () => {
      const userId = 'user-456';
      const collectionId = await collectionService.getOrCreateCollection(userId);
      
      expect(collectionId).toBeDefined();
      expect(collectionId).toContain('collection-');
    });

    it('should create different collections for different users', async () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';
      const collectionId1 = await collectionService.getOrCreateCollection(userId1);
      const collectionId2 = await collectionService.getOrCreateCollection(userId2);
      
      expect(collectionId1).not.toBe(collectionId2);
    });
  });

  describe('getCollectionCards', () => {
    it('should return empty array for empty collection', async () => {
      const collectionId = 'collection-123';
      const cards = await collectionService.getCollectionCards(collectionId);
      
      expect(cards).toEqual([]);
    });

    it('should return cards with translated set names', async () => {
      const collectionId = 'collection-123';
      const card: CollectionCardWithDetails = {
        id: 'cc-1',
        collection_id: collectionId,
        card_id: 'card-1',
        card_type: 'character',
        quantity: 1,
        image_path: '/images/card-1.webp',
        created_at: new Date(),
        updated_at: new Date(),
        card_name: 'Test Card',
        set: 'ERB'
      };
      mockRepository.addCardToMockCollection(collectionId, card);

      const cards = await collectionService.getCollectionCards(collectionId);
      
      expect(cards).toHaveLength(1);
      expect(cards[0].set).toBe('Edgar Rice Burroughs and the World Legends');
    });

    it('should translate multiple cards with ERB set', async () => {
      const collectionId = 'collection-123';
      const card1: CollectionCardWithDetails = {
        id: 'cc-1',
        collection_id: collectionId,
        card_id: 'card-1',
        card_type: 'character',
        quantity: 1,
        image_path: '/images/card-1.webp',
        created_at: new Date(),
        updated_at: new Date(),
        card_name: 'Card 1',
        set: 'ERB'
      };
      const card2: CollectionCardWithDetails = {
        id: 'cc-2',
        collection_id: collectionId,
        card_id: 'card-2',
        card_type: 'power',
        quantity: 2,
        image_path: '/images/card-2.webp',
        created_at: new Date(),
        updated_at: new Date(),
        card_name: 'Card 2',
        set: 'ERB'
      };
      mockRepository.addCardToMockCollection(collectionId, card1);
      mockRepository.addCardToMockCollection(collectionId, card2);

      const cards = await collectionService.getCollectionCards(collectionId);
      
      expect(cards).toHaveLength(2);
      expect(cards[0].set).toBe('Edgar Rice Burroughs and the World Legends');
      expect(cards[1].set).toBe('Edgar Rice Burroughs and the World Legends');
    });

    it('should preserve other set codes', async () => {
      const collectionId = 'collection-123';
      const card: CollectionCardWithDetails = {
        id: 'cc-1',
        collection_id: collectionId,
        card_id: 'card-1',
        card_type: 'character',
        quantity: 1,
        image_path: '/images/card-1.webp',
        created_at: new Date(),
        updated_at: new Date(),
        card_name: 'Test Card',
        set: 'UNKNOWN'
      };
      mockRepository.addCardToMockCollection(collectionId, card);

      const cards = await collectionService.getCollectionCards(collectionId);
      
      expect(cards).toHaveLength(1);
      expect(cards[0].set).toBe('UNKNOWN');
    });

    it('should handle null set codes', async () => {
      const collectionId = 'collection-123';
      const card: CollectionCardWithDetails = {
        id: 'cc-1',
        collection_id: collectionId,
        card_id: 'card-1',
        card_type: 'character',
        quantity: 1,
        image_path: '/images/card-1.webp',
        created_at: new Date(),
        updated_at: new Date(),
        card_name: 'Test Card',
        set: null as any
      };
      mockRepository.addCardToMockCollection(collectionId, card);

      const cards = await collectionService.getCollectionCards(collectionId);
      
      expect(cards).toHaveLength(1);
      expect(cards[0].set).toBe('Edgar Rice Burroughs and the World Legends');
    });
  });

  describe('addCardToCollection', () => {
    it('should add card to collection successfully', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';
      
      mockRepository.setCardExists(cardId, cardType, true);

      const result = await collectionService.addCardToCollection(
        collectionId,
        cardId,
        cardType,
        1
      );

      expect(result).toBeDefined();
      expect(result.card_id).toBe(cardId);
      expect(result.card_type).toBe(cardType);
      expect(result.quantity).toBe(1);
    });

    it('should throw error when card does not exist', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';
      
      mockRepository.setCardExists(cardId, cardType, false);

      await expect(
        collectionService.addCardToCollection(collectionId, cardId, cardType, 1)
      ).rejects.toThrow(`Card with ID ${cardId} does not exist in table ${cardType}`);
    });

    it('should throw error when quantity is less than 1', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';
      
      mockRepository.setCardExists(cardId, cardType, true);

      await expect(
        collectionService.addCardToCollection(collectionId, cardId, cardType, 0)
      ).rejects.toThrow('Quantity must be at least 1');
    });

    it('should throw error when quantity is negative', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';
      
      mockRepository.setCardExists(cardId, cardType, true);

      await expect(
        collectionService.addCardToCollection(collectionId, cardId, cardType, -1)
      ).rejects.toThrow('Quantity must be at least 1');
    });

    it('should use default quantity of 1 when not provided', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';
      
      mockRepository.setCardExists(cardId, cardType, true);

      const result = await collectionService.addCardToCollection(
        collectionId,
        cardId,
        cardType
      );

      expect(result.quantity).toBe(1);
    });

    it('should add card with custom quantity', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';
      
      mockRepository.setCardExists(cardId, cardType, true);

      const result = await collectionService.addCardToCollection(
        collectionId,
        cardId,
        cardType,
        5
      );

      expect(result.quantity).toBe(5);
    });

    it('should add card with image path', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';
      const imagePath = '/custom/path/image.webp';
      
      mockRepository.setCardExists(cardId, cardType, true);

      const result = await collectionService.addCardToCollection(
        collectionId,
        cardId,
        cardType,
        1,
        imagePath
      );

      expect(result.image_path).toBe(imagePath);
    });

    it('should find card by ID after adding', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';
      
      mockRepository.setCardExists(cardId, cardType, true);

      const result = await collectionService.addCardToCollection(
        collectionId,
        cardId,
        cardType,
        1
      );

      // Verify card is in collection
      const cards = await collectionService.getCollectionCards(collectionId);
      const foundCard = cards.find(c => c.id === result.id);
      
      expect(foundCard).toBeDefined();
      expect(foundCard?.card_id).toBe(cardId);
    });

    it('should find card by fallback search when ID match fails', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';
      const imagePath = '/custom/path/image.webp';
      
      mockRepository.setCardExists(cardId, cardType, true);
      
      // Manually add a card with different ID but same card_id, card_type, image_path
      const existingCard: CollectionCardWithDetails = {
        id: 'different-id',
        collection_id: collectionId,
        card_id: cardId,
        card_type: cardType,
        quantity: 1,
        image_path: imagePath,
        created_at: new Date(),
        updated_at: new Date(),
        card_name: 'Test Card',
        set: 'ERB'
      };
      mockRepository.addCardToMockCollection(collectionId, existingCard);

      // Mock addCardToCollection to return a card with non-matching ID
      // and getCollectionCards to return the existing card (not the newly added one)
      const originalAddCard = mockRepository.addCardToCollection.bind(mockRepository);
      const originalGetCards = mockRepository.getCollectionCards.bind(mockRepository);
      
      mockRepository.addCardToCollection = async function(...args) {
        // Don't actually add, just return a fake result with non-matching ID
        return {
          id: 'non-matching-id',
          collection_id: collectionId,
          card_id: cardId,
          card_type: cardType,
          quantity: 1,
          image_path: imagePath, // Same image_path as existing card
          created_at: new Date(),
          updated_at: new Date()
        };
      };
      
      // getCollectionCards returns the existing card (matching image_path but different ID)
      mockRepository.getCollectionCards = async function() {
        return [existingCard];
      };

      const result = await collectionService.addCardToCollection(
        collectionId,
        cardId,
        cardType,
        1,
        imagePath
      );

      expect(result).toBeDefined();
      expect(result.card_id).toBe(cardId);
      expect(result.image_path).toBe(imagePath); // Should match by image_path fallback
      expect(result.id).toBe('different-id'); // Should be the existing card
      
      // Restore original methods
      mockRepository.addCardToCollection = originalAddCard;
      mockRepository.getCollectionCards = originalGetCards;
    });

    it('should increment quantity when adding duplicate card', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';
      const imagePath = '/images/card-1.webp';
      
      mockRepository.setCardExists(cardId, cardType, true);

      await collectionService.addCardToCollection(
        collectionId,
        cardId,
        cardType,
        2,
        imagePath
      );

      const result = await collectionService.addCardToCollection(
        collectionId,
        cardId,
        cardType,
        3,
        imagePath
      );

      expect(result.quantity).toBe(5); // 2 + 3
    });

    it('should find card by most recent match when ID and image_path fallback fail', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';
      const imagePath = '/images/card-1.webp';
      
      mockRepository.setCardExists(cardId, cardType, true);
      
      // Manually add cards with different IDs and image paths but same card_id/card_type
      const olderCard: CollectionCardWithDetails = {
        id: 'old-id',
        collection_id: collectionId,
        card_id: cardId,
        card_type: cardType,
        quantity: 1,
        image_path: '/different/path.webp',
        created_at: new Date('2020-01-01'),
        updated_at: new Date('2020-01-01'),
        card_name: 'Old Card',
        set: 'ERB'
      };
      const newerCard: CollectionCardWithDetails = {
        id: 'new-id',
        collection_id: collectionId,
        card_id: cardId,
        card_type: cardType,
        quantity: 1,
        image_path: imagePath,
        created_at: new Date('2021-01-01'),
        updated_at: new Date('2021-01-01'),
        card_name: 'New Card',
        set: 'ERB'
      };
      mockRepository.addCardToMockCollection(collectionId, olderCard);
      mockRepository.addCardToMockCollection(collectionId, newerCard);

      // Mock addCardToCollection to return a card with non-matching ID
      // and getCollectionCards to return the manually added cards (not the newly added one)
      const originalAddCard = mockRepository.addCardToCollection.bind(mockRepository);
      const originalGetCards = mockRepository.getCollectionCards.bind(mockRepository);
      
      mockRepository.addCardToCollection = async function(...args) {
        // Don't actually add to collection, just return a fake result
        return {
          id: 'non-matching-id',
          collection_id: collectionId,
          card_id: cardId,
          card_type: cardType,
          quantity: 1,
          image_path: '/completely/different/path.webp', // Different from both cards
          created_at: new Date(),
          updated_at: new Date()
        };
      };
      
      // getCollectionCards returns the manually added cards (not matching the returned ID or image_path)
      mockRepository.getCollectionCards = async function() {
        return originalGetCards.call(this, collectionId);
      };

      const result = await collectionService.addCardToCollection(
        collectionId,
        cardId,
        cardType,
        1,
        imagePath
      );

      // Should find the most recent card (newerCard) by card_id/card_type match
      expect(result).toBeDefined();
      expect(result.card_id).toBe(cardId);
      expect(result.id).toBe('new-id'); // Should be the newer card
      
      // Restore original methods
      mockRepository.addCardToCollection = originalAddCard;
      mockRepository.getCollectionCards = originalGetCards;
    });

    it('should throw error when card cannot be found after adding', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';
      const imagePath = '/images/card-1.webp';
      
      mockRepository.setCardExists(cardId, cardType, true);

      // Mock getCollectionCards to return empty array (simulating card not found)
      const originalGetCards = mockRepository.getCollectionCards.bind(mockRepository);
      mockRepository.getCollectionCards = async function() {
        return [];
      };

      await expect(
        collectionService.addCardToCollection(
          collectionId,
          cardId,
          cardType,
          1,
          imagePath
        )
      ).rejects.toThrow('Failed to retrieve card details after adding to collection');
      
      // Restore original method
      mockRepository.getCollectionCards = originalGetCards;
    });
  });

  describe('updateCardQuantity', () => {
    it('should update card quantity successfully', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';
      const imagePath = '/images/card-1.webp';
      
      mockRepository.setCardExists(cardId, cardType, true);
      
      // Add card first
      await collectionService.addCardToCollection(
        collectionId,
        cardId,
        cardType,
        1,
        imagePath
      );

      const result = await collectionService.updateCardQuantity(
        collectionId,
        cardId,
        cardType,
        5,
        imagePath
      );

      expect(result).toBeDefined();
      expect(result?.quantity).toBe(5);
    });

    it('should return null when quantity is set to 0', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';
      const imagePath = '/images/card-1.webp';
      
      mockRepository.setCardExists(cardId, cardType, true);
      
      // Add card first
      await collectionService.addCardToCollection(
        collectionId,
        cardId,
        cardType,
        1,
        imagePath
      );

      const result = await collectionService.updateCardQuantity(
        collectionId,
        cardId,
        cardType,
        0,
        imagePath
      );

      expect(result).toBeNull();
    });

    it('should throw error when quantity is negative', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';
      const imagePath = '/images/card-1.webp';

      await expect(
        collectionService.updateCardQuantity(
          collectionId,
          cardId,
          cardType,
          -1,
          imagePath
        )
      ).rejects.toThrow('Quantity cannot be negative');
    });

    it('should return null when card is not found', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';
      const imagePath = '/images/card-1.webp';

      const result = await collectionService.updateCardQuantity(
        collectionId,
        cardId,
        cardType,
        5,
        imagePath
      );

      expect(result).toBeNull();
    });

    it('should update quantity to 1', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';
      const imagePath = '/images/card-1.webp';
      
      mockRepository.setCardExists(cardId, cardType, true);
      
      // Add card with quantity 5
      await collectionService.addCardToCollection(
        collectionId,
        cardId,
        cardType,
        5,
        imagePath
      );

      const result = await collectionService.updateCardQuantity(
        collectionId,
        cardId,
        cardType,
        1,
        imagePath
      );

      expect(result?.quantity).toBe(1);
    });
  });

  describe('removeCardFromCollection', () => {
    it('should remove card from collection successfully', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';
      
      mockRepository.setCardExists(cardId, cardType, true);
      
      // Add card first
      await collectionService.addCardToCollection(
        collectionId,
        cardId,
        cardType,
        1
      );

      const result = await collectionService.removeCardFromCollection(
        collectionId,
        cardId,
        cardType
      );

      expect(result).toBe(true);
      
      // Verify card is removed
      const cards = await collectionService.getCollectionCards(collectionId);
      expect(cards.find(c => c.card_id === cardId && c.card_type === cardType)).toBeUndefined();
    });

    it('should return false when card does not exist', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';

      const result = await collectionService.removeCardFromCollection(
        collectionId,
        cardId,
        cardType
      );

      expect(result).toBe(false);
    });

    it('should remove all instances of card type', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';
      
      mockRepository.setCardExists(cardId, cardType, true);
      
      // Add multiple cards with same card_id but different image paths
      await collectionService.addCardToCollection(
        collectionId,
        cardId,
        cardType,
        1,
        '/images/card-1-v1.webp'
      );
      await collectionService.addCardToCollection(
        collectionId,
        cardId,
        cardType,
        1,
        '/images/card-1-v2.webp'
      );

      const result = await collectionService.removeCardFromCollection(
        collectionId,
        cardId,
        cardType
      );

      expect(result).toBe(true);
      
      // Verify all instances are removed
      const cards = await collectionService.getCollectionCards(collectionId);
      expect(cards.filter(c => c.card_id === cardId && c.card_type === cardType)).toHaveLength(0);
    });
  });

  describe('verifyCardExists', () => {
    it('should return true when card exists', async () => {
      const cardId = 'card-1';
      const cardType = 'character';
      
      mockRepository.setCardExists(cardId, cardType, true);

      const result = await collectionService.verifyCardExists(cardId, cardType);

      expect(result).toBe(true);
    });

    it('should return false when card does not exist', async () => {
      const cardId = 'card-1';
      const cardType = 'character';
      
      mockRepository.setCardExists(cardId, cardType, false);

      const result = await collectionService.verifyCardExists(cardId, cardType);

      expect(result).toBe(false);
    });

    it('should verify different card types independently', async () => {
      const cardId = 'card-1';
      
      mockRepository.setCardExists(cardId, 'character', true);
      mockRepository.setCardExists(cardId, 'power', false);

      const characterExists = await collectionService.verifyCardExists(cardId, 'character');
      const powerExists = await collectionService.verifyCardExists(cardId, 'power');

      expect(characterExists).toBe(true);
      expect(powerExists).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete workflow: add, update, remove', async () => {
      const collectionId = 'collection-123';
      const cardId = 'card-1';
      const cardType = 'character';
      const imagePath = '/images/card-1.webp';
      
      mockRepository.setCardExists(cardId, cardType, true);

      // Add card
      const addedCard = await collectionService.addCardToCollection(
        collectionId,
        cardId,
        cardType,
        1,
        imagePath
      );
      expect(addedCard.quantity).toBe(1);

      // Update quantity
      const updatedCard = await collectionService.updateCardQuantity(
        collectionId,
        cardId,
        cardType,
        5,
        imagePath
      );
      expect(updatedCard?.quantity).toBe(5);

      // Remove card
      const removed = await collectionService.removeCardFromCollection(
        collectionId,
        cardId,
        cardType
      );
      expect(removed).toBe(true);

      // Verify collection is empty
      const cards = await collectionService.getCollectionCards(collectionId);
      expect(cards).toHaveLength(0);
    });

    it('should handle multiple cards in collection', async () => {
      const collectionId = 'collection-123';
      
      mockRepository.setCardExists('card-1', 'character', true);
      mockRepository.setCardExists('card-2', 'power', true);
      mockRepository.setCardExists('card-3', 'special', true);

      await collectionService.addCardToCollection(collectionId, 'card-1', 'character', 1);
      await collectionService.addCardToCollection(collectionId, 'card-2', 'power', 2);
      await collectionService.addCardToCollection(collectionId, 'card-3', 'special', 3);

      const cards = await collectionService.getCollectionCards(collectionId);
      expect(cards).toHaveLength(3);
      expect(cards.find(c => c.card_id === 'card-1')?.quantity).toBe(1);
      expect(cards.find(c => c.card_id === 'card-2')?.quantity).toBe(2);
      expect(cards.find(c => c.card_id === 'card-3')?.quantity).toBe(3);
    });
  });
});


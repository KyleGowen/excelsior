import { evaluateCollection } from './collection-evaluation/evaluateCollection';
import type { CollectionViewDto } from '../api/dto/v1/CollectionViewDto';
import { CollectionsRepository, CollectionCardWithDetails, CollectionHistory } from '../database/collectionsRepository';

export class CollectionService {
  constructor(private collectionsRepository: CollectionsRepository) {}

  async getCollectionView(userId: string): Promise<CollectionViewDto> {
    const collectionId = await this.getOrCreateCollection(userId);
    const cards = await this.getCollectionCards(collectionId);
    return { cards, evaluation: evaluateCollection(cards.map(card => ({ cardId: card.card_id, cardType: card.card_type, imagePath: card.image_path, quantity: card.quantity })), 'account', true) };
  }

  /**
   * Translate set code to display name
   */
  translateSet(setCode: string | null | undefined): string {
    if (!setCode) {
      return 'Edgar Rice Burroughs and the World Legends';
    }

    switch (setCode.toUpperCase()) {
      case 'ERB':
        return 'Edgar Rice Burroughs and the World Legends';
      case 'ERBP':
        return 'Edgar Rice Burroughs and the World Legends - Promos';
      case 'SKY':
        return 'Skybound';
      case 'SKYP':
        return 'Skybound - Promos';
      case 'TFCP':
        return 'The Few and the Cursed - Promos';
      default:
        return setCode;
    }
  }

  /**
   * Get or create collection for a user
   */
  async getOrCreateCollection(userId: string): Promise<string> {
    return await this.collectionsRepository.getOrCreateCollection(userId);
  }

  /**
   * Get all cards in user's collection (set field is display name from `sets.name` via repository)
   */
  async getCollectionCards(collectionId: string): Promise<CollectionCardWithDetails[]> {
    return await this.collectionsRepository.getCollectionCards(collectionId);
  }

  /**
   * Add card to collection with validation
   */
  async addCardToCollection(
    collectionId: string,
    cardId: string,
    cardType: string,
    quantity: number = 1,
    imagePath?: string
  ): Promise<CollectionCardWithDetails> {
    // Validate card exists
    const cardExists = await this.collectionsRepository.verifyCardExists(cardId, cardType);
    if (!cardExists) {
      throw new Error(`Card with ID ${cardId} does not exist in table ${cardType}`);
    }

    // Validate quantity
    if (quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    // Add card to collection
    const collectionCard = await this.collectionsRepository.addCardToCollection(
      collectionId,
      cardId,
      cardType,
      quantity,
      imagePath
    );

    // Fetch full card details using the collection card ID we just got back
    const cards = await this.getCollectionCards(collectionId);

    // Find the card by the ID we just inserted/updated
    let cardWithDetails = cards.find(c => c.id === collectionCard.id);

    if (!cardWithDetails) {
      // Fallback: find by card_id, card_type, and image_path
      cardWithDetails = cards.find(
        c => c.card_id === cardId &&
             c.card_type === cardType &&
             c.image_path === collectionCard.image_path
      );
    }

    if (!cardWithDetails) {
      // Last resort: most recently added card of this type
      const matchingCards = cards
        .filter(c => c.card_id === cardId && c.card_type === cardType)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      cardWithDetails = matchingCards[0];
    }

    if (!cardWithDetails) {
      throw new Error('Failed to retrieve card details after adding to collection');
    }

    return cardWithDetails;
  }

  /**
   * Update card quantity with validation
   */
  async updateCardQuantity(
    collectionId: string,
    cardId: string,
    cardType: string,
    quantity: number,
    imagePath: string,
    oldImagePath?: string
  ): Promise<CollectionCardWithDetails | null> {
    // Validate quantity
    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    // Update quantity (will remove if quantity is 0)
    const updatedCard = await this.collectionsRepository.updateCardQuantity(
      collectionId,
      cardId,
      cardType,
      quantity,
      imagePath,
      oldImagePath
    );

    if (!updatedCard) {
      return null; // Card was removed
    }

    // Fetch full card details
    const cards = await this.getCollectionCards(collectionId);
    const cardWithDetails = cards.find(
      c =>
        c.card_id === cardId &&
        c.card_type === cardType &&
        c.image_path === imagePath
    );

    return cardWithDetails || null;
  }

  /**
   * Remove one copy of a card variant (cardId, cardType, imagePath) from the collection.
   * Respects foil/alternate art via imagePath. Returns the updated card or null if last copy removed.
   * Throws if card not in collection or quantity already 0.
   */
  async removeOneFromCollection(
    collectionId: string,
    cardId: string,
    cardType: string,
    imagePath: string
  ): Promise<CollectionCardWithDetails | null> {
    const quantity = await this.collectionsRepository.getQuantity(
      collectionId,
      cardId,
      cardType,
      imagePath
    );
    if (quantity < 1) {
      throw new Error('Card not found in collection or quantity already 0');
    }
    const newQuantity = quantity - 1;
    return this.updateCardQuantity(
      collectionId,
      cardId,
      cardType,
      newQuantity,
      imagePath
    );
  }

  /**
   * Remove card from collection (all copies for cardId+cardType)
   */
  async removeCardFromCollection(
    collectionId: string,
    cardId: string,
    cardType: string
  ): Promise<boolean> {
    return await this.collectionsRepository.removeCardFromCollection(
      collectionId,
      cardId,
      cardType
    );
  }

  /**
   * Verify card exists in database
   */
  async verifyCardExists(cardId: string, cardType: string): Promise<boolean> {
    return await this.collectionsRepository.verifyCardExists(cardId, cardType);
  }

  /**
   * Get collection history for a collection
   * Returns history entries ordered by created_at DESC (most recent first)
   */
  async getCollectionHistory(collectionId: string, limit?: number): Promise<CollectionHistory[]> {
    return await this.collectionsRepository.getCollectionHistory(collectionId, limit);
  }
}


import { CollectionsRepository, CollectionCardWithDetails } from '../database/collectionsRepository';

export class CollectionService {
  constructor(private collectionsRepository: CollectionsRepository) {}

  /**
   * Translate universe code to display name
   */
  translateUniverse(universeCode: string | null | undefined): string {
    if (!universeCode) {
      return 'Edgar Rice Burroughs and the World Legends';
    }

    switch (universeCode.toUpperCase()) {
      case 'ERB':
        return 'Edgar Rice Burroughs and the World Legends';
      default:
        return universeCode;
    }
  }

  /**
   * Get or create collection for a user
   */
  async getOrCreateCollection(userId: string): Promise<string> {
    return await this.collectionsRepository.getOrCreateCollection(userId);
  }

  /**
   * Get all cards in user's collection with translated universe names
   */
  async getCollectionCards(collectionId: string): Promise<CollectionCardWithDetails[]> {
    const cards = await this.collectionsRepository.getCollectionCards(collectionId);
    
    // Translate universe codes to display names
    return cards.map(card => ({
      ...card,
      universe: this.translateUniverse(card.universe)
    }));
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
    console.log('🟡 [Service] addCardToCollection called with:', {
      collectionId,
      cardId,
      cardType,
      quantity,
      imagePath,
      imagePathType: typeof imagePath
    });
    
    // Validate card exists
    console.log('🟡 [Service] Verifying card exists...');
    const cardExists = await this.collectionsRepository.verifyCardExists(cardId, cardType);
    if (!cardExists) {
      console.error('🟡 [Service] Card does not exist:', { cardId, cardType });
      throw new Error(`Card with ID ${cardId} does not exist in table ${cardType}`);
    }
    console.log('🟡 [Service] Card exists, proceeding...');

    // Validate quantity
    if (quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    // Add card to collection
    console.log('🟡 [Service] Calling repository.addCardToCollection...');
    const collectionCard = await this.collectionsRepository.addCardToCollection(
      collectionId,
      cardId,
      cardType,
      quantity,
      imagePath
    );
    console.log('🟡 [Service] Repository returned:', {
      id: collectionCard.id,
      card_id: collectionCard.card_id,
      card_type: collectionCard.card_type,
      image_path: collectionCard.image_path,
      quantity: collectionCard.quantity
    });

    // Fetch full card details using the collection card ID we just got back
    console.log('🟡 [Service] Fetching collection cards to get details...');
    const cards = await this.getCollectionCards(collectionId);
    console.log('🟡 [Service] Retrieved', cards.length, 'total cards from collection');
    
    // Find the card by the ID we just inserted/updated
    let cardWithDetails = cards.find(c => c.id === collectionCard.id);
    
    if (cardWithDetails) {
      console.log('🟡 [Service] Found card by ID:', {
        id: cardWithDetails.id,
        card_id: cardWithDetails.card_id,
        card_type: cardWithDetails.card_type,
        image_path: cardWithDetails.image_path
      });
    } else {
      // Fallback: try to find by card_id, card_type, and image_path
      console.log('🟡 [Service] Card not found by ID, trying fallback search...');
      
      // Find the card by image_path
      cardWithDetails = cards.find(
        c => c.card_id === cardId && 
             c.card_type === cardType && 
             c.image_path === collectionCard.image_path
      );
      
      if (cardWithDetails) {
        console.log('🟡 [Service] Found card by fallback search:', {
          id: cardWithDetails.id,
          card_id: cardWithDetails.card_id,
          image_path: cardWithDetails.image_path
        });
      } else {
        // Last resort: find most recently added card of this type
        const matchingCards = cards.filter(
          c => c.card_id === cardId && c.card_type === cardType
        );
        
        console.log('🟡 [Service] Found', matchingCards.length, 'matching cards by card_id/card_type');
        
        if (matchingCards.length > 0) {
          // Sort by created_at descending and take the most recent
          matchingCards.sort((a, b) => {
            const aTime = new Date(a.created_at).getTime();
            const bTime = new Date(b.created_at).getTime();
            return bTime - aTime;
          });
          cardWithDetails = matchingCards[0];
          
          console.log('🟡 [Service] Using most recent matching card:', {
            id: cardWithDetails.id,
            image_path: cardWithDetails.image_path,
            created_at: cardWithDetails.created_at
          });
        }
      }
    }

    if (!cardWithDetails) {
      // Log for debugging
      console.error('🟡 [Service] ERROR: Failed to find card after adding:', {
        collectionCardId: collectionCard.id,
        cardId,
        cardType,
        imagePath,
        image_path: collectionCard.image_path,
        totalCards: cards.length,
        allMatchingCards: cards.filter(c => c.card_id === cardId && c.card_type === cardType).map(c => ({
          id: c.id,
          image_path: c.image_path,
          created_at: c.created_at
        }))
      });
      throw new Error('Failed to retrieve card details after adding to collection');
    }

    console.log('🟡 [Service] Successfully returning card with details');
    console.log('🟡 [Service] Card with details:', {
      id: cardWithDetails.id,
      card_id: cardWithDetails.card_id,
      card_type: cardWithDetails.card_type,
      image_path: cardWithDetails.image_path,
      quantity: cardWithDetails.quantity
    });
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
    imagePath: string
  ): Promise<CollectionCardWithDetails | null> {
    // Validate quantity
    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    // Update quantity (will remove if quantity is 0)
    console.log('🟡 [Service] updateCardQuantity -> repository call', {
      collectionId,
      cardId,
      cardType,
      quantity,
      imagePath
    });
    const updatedCard = await this.collectionsRepository.updateCardQuantity(
      collectionId,
      cardId,
      cardType,
      quantity,
      imagePath
    );
    console.log('🟡 [Service] updateCardQuantity repository result:', updatedCard);

    if (!updatedCard) {
      return null; // Card was removed
    }

    // Fetch full card details
    const cards = await this.getCollectionCards(collectionId);
    console.log('🟡 [Service] Cards after update:', cards.length);
    const cardWithDetails = cards.find(
      c =>
        c.card_id === cardId &&
        c.card_type === cardType &&
        c.image_path === imagePath
    );

    return cardWithDetails || null;
  }

  /**
   * Remove card from collection
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
}


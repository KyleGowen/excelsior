import { Pool, PoolClient } from 'pg';

export interface Collection {
  id: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface CollectionCard {
  id: string;
  collection_id: string;
  card_id: string;
  card_type: string;
  quantity: number;
  image_path: string;
  created_at: Date;
  updated_at: Date;
}

export interface CollectionCardWithDetails extends CollectionCard {
  card_name?: string;
  card_data?: any;
  universe?: string;
}

export class CollectionsRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Construct image path from card data and optional alternate image
   */
  private async constructImagePath(
    client: PoolClient,
    cardId: string,
    cardType: string,
    alternateImage?: string
  ): Promise<string> {
    // If alternate image is provided, construct path from it
    if (alternateImage && alternateImage.trim() !== '') {
      const altPath = alternateImage.trim();
      
      // If already a full path, use it
      if (altPath.startsWith('/src/resources/cards/images/')) {
        return altPath;
      }
      
      // Construct full path based on format
      if (cardType === 'character' && altPath.startsWith('characters/alternate/')) {
        const filename = altPath.replace('characters/alternate/', '');
        return `/src/resources/cards/images/characters/alternate/${filename}`;
      }
      
      if (cardType === 'character' && altPath.startsWith('alternate/')) {
        const filename = altPath.replace('alternate/', '');
        return `/src/resources/cards/images/characters/alternate/${filename}`;
      }
      
      if (cardType === 'special' && altPath.includes('/alternate/')) {
        const filename = altPath.split('/alternate/').pop();
        return `/src/resources/cards/images/specials/alternate/${filename}`;
      }
      
      if (cardType === 'power' && altPath.includes('/alternate/')) {
        const filename = altPath.split('/alternate/').pop();
        return `/src/resources/cards/images/power-cards/alternate/${filename}`;
      }
      
      // Try to construct based on card type
      if (cardType === 'character') {
        return `/src/resources/cards/images/characters/alternate/${altPath}`;
      } else if (cardType === 'special') {
        return `/src/resources/cards/images/specials/alternate/${altPath}`;
      } else if (cardType === 'power') {
        return `/src/resources/cards/images/power-cards/alternate/${altPath}`;
      }
      
      // Fallback
      return `/src/resources/cards/images/${altPath}`;
    }
    
    // Otherwise, get the card's regular image and construct path
    let cardImage: string | null = null;
    
    try {
      switch (cardType) {
        case 'character':
          const charResult = await client.query('SELECT image, image_path FROM characters WHERE id = $1', [cardId]);
          if (charResult.rows.length > 0) {
            cardImage = charResult.rows[0].image || charResult.rows[0].image_path;
          }
          break;
        case 'special':
          const specialResult = await client.query('SELECT image, image_path FROM special_cards WHERE id = $1', [cardId]);
          if (specialResult.rows.length > 0) {
            cardImage = specialResult.rows[0].image || specialResult.rows[0].image_path;
          }
          break;
        case 'power':
          const powerResult = await client.query('SELECT image, image_path FROM power_cards WHERE id = $1', [cardId]);
          if (powerResult.rows.length > 0) {
            cardImage = powerResult.rows[0].image || powerResult.rows[0].image_path;
          }
          break;
        case 'location':
          const locationResult = await client.query('SELECT image, image_path FROM locations WHERE id = $1', [cardId]);
          if (locationResult.rows.length > 0) {
            cardImage = locationResult.rows[0].image || locationResult.rows[0].image_path;
          }
          break;
        case 'mission':
          const missionResult = await client.query('SELECT image, image_path FROM missions WHERE id = $1', [cardId]);
          if (missionResult.rows.length > 0) {
            cardImage = missionResult.rows[0].image || missionResult.rows[0].image_path;
          }
          break;
        case 'event':
          const eventResult = await client.query('SELECT image, image_path FROM events WHERE id = $1', [cardId]);
          if (eventResult.rows.length > 0) {
            cardImage = eventResult.rows[0].image || eventResult.rows[0].image_path;
          }
          break;
        case 'aspect':
          const aspectResult = await client.query('SELECT image, image_path FROM aspects WHERE id = $1', [cardId]);
          if (aspectResult.rows.length > 0) {
            cardImage = aspectResult.rows[0].image || aspectResult.rows[0].image_path;
          }
          break;
        case 'advanced_universe':
          const advUniResult = await client.query('SELECT image, image_path FROM advanced_universe_cards WHERE id = $1', [cardId]);
          if (advUniResult.rows.length > 0) {
            cardImage = advUniResult.rows[0].image || advUniResult.rows[0].image_path;
          }
          break;
        case 'teamwork':
          const teamworkResult = await client.query('SELECT image, image_path FROM teamwork_cards WHERE id = $1', [cardId]);
          if (teamworkResult.rows.length > 0) {
            cardImage = teamworkResult.rows[0].image || teamworkResult.rows[0].image_path;
          }
          break;
        case 'ally_universe':
          const allyResult = await client.query('SELECT image, image_path FROM ally_universe_cards WHERE id = $1', [cardId]);
          if (allyResult.rows.length > 0) {
            cardImage = allyResult.rows[0].image || allyResult.rows[0].image_path;
          }
          break;
        case 'training':
          const trainingResult = await client.query('SELECT image, image_path FROM training_cards WHERE id = $1', [cardId]);
          if (trainingResult.rows.length > 0) {
            cardImage = trainingResult.rows[0].image || trainingResult.rows[0].image_path;
          }
          break;
        case 'basic_universe':
          const basicResult = await client.query('SELECT image, image_path FROM basic_universe_cards WHERE id = $1', [cardId]);
          if (basicResult.rows.length > 0) {
            cardImage = basicResult.rows[0].image || basicResult.rows[0].image_path;
          }
          break;
      }
    } catch (error) {
      console.error(`Error fetching card image for ${cardType} ${cardId}:`, error);
    }
    
    // Construct path from card image
    if (cardImage && cardImage.trim() !== '') {
      // Extract filename (remove directory prefix if present)
      const filename = cardImage.split('/').pop() || cardImage;
      
      // Construct full path based on card type
      switch (cardType) {
        case 'character':
          return `/src/resources/cards/images/characters/${filename}`;
        case 'special':
          return `/src/resources/cards/images/specials/${filename}`;
        case 'power':
          return `/src/resources/cards/images/power-cards/${filename}`;
        case 'location':
          return `/src/resources/cards/images/locations/${filename}`;
        case 'mission':
          return `/src/resources/cards/images/missions/${filename}`;
        case 'event':
          return `/src/resources/cards/images/events/${filename}`;
        case 'aspect':
          return `/src/resources/cards/images/aspects/${filename}`;
        case 'advanced_universe':
          return `/src/resources/cards/images/advanced-universe/${filename}`;
        case 'teamwork':
          return `/src/resources/cards/images/teamwork-universe/${filename}`;
        case 'ally_universe':
          return `/src/resources/cards/images/ally-universe/${filename}`;
        case 'training':
          return `/src/resources/cards/images/training-universe/${filename}`;
        case 'basic_universe':
          return `/src/resources/cards/images/basic-universe/${filename}`;
        default:
          return '/src/resources/cards/images/placeholder.webp';
      }
    }
    
    // Fallback to placeholder
    return '/src/resources/cards/images/placeholder.webp';
  }

  /**
   * Get or create a collection for a user
   * Returns the collection ID
   */
  async getOrCreateCollection(userId: string): Promise<string> {
    const client = await this.pool.connect();
    try {
      // Try to get existing collection
      const existingResult = await client.query(
        'SELECT id FROM collections WHERE user_id = $1',
        [userId]
      );

      if (existingResult.rows.length > 0) {
        return existingResult.rows[0].id;
      }

      // Create new collection
      const createResult = await client.query(
        'INSERT INTO collections (user_id) VALUES ($1) RETURNING id',
        [userId]
      );

      return createResult.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * Get all cards in a collection with full card data
   */
  async getCollectionCards(collectionId: string): Promise<CollectionCardWithDetails[]> {
    console.log('🟠 [Repo] getCollectionCards called:', { collectionId });
    const client = await this.pool.connect();
    try {
      // Get all collection cards
      const collectionCardsResult = await client.query(
        'SELECT * FROM collection_cards WHERE collection_id = $1 ORDER BY card_type, created_at',
        [collectionId]
      );
      console.log('🟠 [Repo] collection_cards rows fetched:', collectionCardsResult.rows.length);

      const collectionCards = collectionCardsResult.rows;
      const cardsWithDetails: CollectionCardWithDetails[] = [];

      // Fetch full card data for each collection card
      for (const cc of collectionCards) {
        console.log('🟠 [Repo] Processing collection card:', {
          id: cc.id,
          card_id: cc.card_id,
          card_type: cc.card_type,
          image_path: cc.image_path
        });
        
        let cardData: any = null;
        let cardName: string = '';
        let universe: string = '';

        try {
          switch (cc.card_type) {
            case 'character':
              const charResult = await client.query('SELECT * FROM characters WHERE id = $1', [cc.card_id]);
              if (charResult.rows.length > 0) {
                cardData = charResult.rows[0];
                cardName = cardData.name;
                universe = cardData.universe || 'ERB';
              }
              break;
            case 'special':
              const specialResult = await client.query('SELECT * FROM special_cards WHERE id = $1', [cc.card_id]);
              if (specialResult.rows.length > 0) {
                cardData = specialResult.rows[0];
                cardName = cardData.name;
                universe = cardData.universe || 'ERB';
              }
              break;
            case 'power':
              const powerResult = await client.query('SELECT * FROM power_cards WHERE id = $1', [cc.card_id]);
              if (powerResult.rows.length > 0) {
                cardData = powerResult.rows[0];
                cardName = `${cardData.value} - ${cardData.power_type}`;
                universe = cardData.universe || 'ERB';
              }
              break;
            case 'location':
              const locationResult = await client.query('SELECT * FROM locations WHERE id = $1', [cc.card_id]);
              if (locationResult.rows.length > 0) {
                cardData = locationResult.rows[0];
                cardName = locationResult.rows[0].name;
                universe = cardData.universe || 'ERB';
              }
              break;
            case 'mission':
              const missionResult = await client.query('SELECT * FROM missions WHERE id = $1', [cc.card_id]);
              if (missionResult.rows.length > 0) {
                cardData = missionResult.rows[0];
                cardName = cardData.card_name || cardData.name;
                universe = cardData.universe || 'ERB';
              }
              break;
            case 'event':
              const eventResult = await client.query('SELECT * FROM events WHERE id = $1', [cc.card_id]);
              if (eventResult.rows.length > 0) {
                cardData = eventResult.rows[0];
                cardName = cardData.name;
                universe = cardData.universe || 'ERB';
              }
              break;
            case 'aspect':
              const aspectResult = await client.query('SELECT * FROM aspects WHERE id = $1', [cc.card_id]);
              if (aspectResult.rows.length > 0) {
                cardData = aspectResult.rows[0];
                cardName = cardData.card_name || cardData.name;
                universe = cardData.universe || 'ERB';
              }
              break;
            case 'advanced_universe':
              const advUniResult = await client.query('SELECT * FROM advanced_universe_cards WHERE id = $1', [cc.card_id]);
              if (advUniResult.rows.length > 0) {
                cardData = advUniResult.rows[0];
                cardName = cardData.card_name || cardData.name;
                universe = cardData.universe || 'ERB';
              }
              break;
            case 'teamwork':
              const teamworkResult = await client.query('SELECT * FROM teamwork_cards WHERE id = $1', [cc.card_id]);
              if (teamworkResult.rows.length > 0) {
                cardData = teamworkResult.rows[0];
                cardName = cardData.card_type || cardData.name;
                universe = cardData.universe || 'ERB';
              }
              break;
            case 'ally_universe':
              const allyResult = await client.query('SELECT * FROM ally_universe_cards WHERE id = $1', [cc.card_id]);
              if (allyResult.rows.length > 0) {
                cardData = allyResult.rows[0];
                cardName = cardData.card_name || cardData.name;
                universe = cardData.universe || 'ERB';
              }
              break;
            case 'training':
              const trainingResult = await client.query('SELECT * FROM training_cards WHERE id = $1', [cc.card_id]);
              if (trainingResult.rows.length > 0) {
                cardData = trainingResult.rows[0];
                cardName = cardData.card_name || cardData.name;
                universe = cardData.universe || 'ERB';
              }
              break;
            case 'basic_universe':
              const basicResult = await client.query('SELECT * FROM basic_universe_cards WHERE id = $1', [cc.card_id]);
              if (basicResult.rows.length > 0) {
                cardData = basicResult.rows[0];
                cardName = cardData.card_name || cardData.name;
                universe = cardData.universe || 'ERB';
              }
              break;
          }
        } catch (error) {
          console.error(`Error fetching card data for ${cc.card_type} ${cc.card_id}:`, error);
        }
        
        cardsWithDetails.push({
          id: cc.id,
          collection_id: cc.collection_id,
          card_id: cc.card_id,
          card_type: cc.card_type,
          quantity: cc.quantity,
          image_path: cc.image_path,
          created_at: cc.created_at,
          updated_at: cc.updated_at,
          card_name: cardName,
          card_data: cardData,
          universe: universe
        });
        
        console.log('🟠 [Repo] Pushed card with details:', {
          card_id: cc.card_id,
          card_type: cc.card_type,
          card_name: cardName,
          image_path_from_db: cc.image_path,
          image_path_type: typeof cc.image_path,
          image_path_length: cc.image_path ? cc.image_path.length : 0,
          image_path_starts_with_slash: cc.image_path ? cc.image_path.startsWith('/') : false,
          has_card_data: !!cardData,
          card_data_image_path: cardData ? (cardData.image_path || cardData.image || 'N/A') : 'N/A'
        });
      }

      return cardsWithDetails;
    } finally {
      client.release();
    }
  }

  /**
   * Add a card to collection or increment quantity if it already exists
   */
  async addCardToCollection(
    collectionId: string,
    cardId: string,
    cardType: string,
    quantity: number = 1,
    alternateImage?: string
  ): Promise<CollectionCard> {
    console.log('🟠 [Repo] addCardToCollection called:', {
      collectionId,
      cardId,
      cardType,
      quantity,
      alternateImage
    });

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Construct the image path
      const imagePath = await this.constructImagePath(client, cardId, cardType, alternateImage);
      console.log('🟠 [Repo] Constructed image_path:', imagePath);

      // Use ON CONFLICT with the unique constraint
      const insertResult = await client.query<CollectionCard>(
        `INSERT INTO collection_cards (
            collection_id,
            card_id,
            card_type,
            quantity,
            image_path
          )
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT ON CONSTRAINT collection_cards_unique
          DO UPDATE SET
            quantity = collection_cards.quantity + EXCLUDED.quantity,
            updated_at = NOW()
          RETURNING *`,
        [collectionId, cardId, cardType, quantity, imagePath]
      );

      await client.query('COMMIT');
      console.log('🟠 [Repo] Final inserted/updated row:', insertResult.rows[0]);
      return insertResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('🟠 [Repo] Error in addCardToCollection, rolling back:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update card quantity in collection
   */
  async updateCardQuantity(
    collectionId: string,
    cardId: string,
    cardType: string,
    quantity: number,
    imagePath: string
  ): Promise<CollectionCard | null> {
    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    console.log('🟠 [Repo] updateCardQuantity called:', {
      collectionId,
      cardId,
      cardType,
      quantity,
      imagePath
    });

    const client = await this.pool.connect();
    try {
      if (quantity === 0) {
        // Remove card if quantity is 0
        const deleteResult = await client.query(
          'DELETE FROM collection_cards WHERE collection_id = $1 AND card_id = $2 AND card_type = $3 AND image_path = $4',
          [collectionId, cardId, cardType, imagePath]
        );
        console.log('🟠 [Repo] Removed card because quantity set to 0, rows deleted:', deleteResult.rowCount);
        return null;
      }

      const result = await client.query(
        'UPDATE collection_cards SET quantity = $1, updated_at = NOW() WHERE collection_id = $2 AND card_id = $3 AND card_type = $4 AND image_path = $5 RETURNING *',
        [quantity, collectionId, cardId, cardType, imagePath]
      );

      if (result.rows.length === 0) {
        console.warn('🟠 [Repo] updateCardQuantity found no rows to update. Query params:', {
          collectionId,
          cardId,
          cardType,
          imagePath
        });
        return null;
      }

      console.log('🟠 [Repo] updateCardQuantity result:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('🟠 [Repo] Error in updateCardQuantity:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove card from collection
   */
  async removeCardFromCollection(
    collectionId: string,
    cardId: string,
    cardType: string
  ): Promise<boolean> {
    console.log('🟠 [Repo] removeCardFromCollection called:', {
      collectionId,
      cardId,
      cardType
    });
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM collection_cards WHERE collection_id = $1 AND card_id = $2 AND card_type = $3',
        [collectionId, cardId, cardType]
      );
      console.log('🟠 [Repo] removeCardFromCollection deleted rows:', result.rowCount);
      return result.rowCount !== null && result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  /**
   * Verify that a card exists in the specified table
   */
  async verifyCardExists(cardId: string, cardType: string): Promise<boolean> {
    console.log('🟠 [Repo] verifyCardExists called:', { cardId, cardType });
    const client = await this.pool.connect();
    try {
      let tableName = '';
      switch (cardType) {
        case 'character':
          tableName = 'characters';
          break;
        case 'special':
          tableName = 'special_cards';
          break;
        case 'power':
          tableName = 'power_cards';
          break;
        case 'location':
          tableName = 'locations';
          break;
        case 'mission':
          tableName = 'missions';
          break;
        case 'event':
          tableName = 'events';
          break;
        case 'aspect':
          tableName = 'aspects';
          break;
        case 'advanced_universe':
          tableName = 'advanced_universe_cards';
          break;
        case 'teamwork':
          tableName = 'teamwork_cards';
          break;
        case 'ally_universe':
          tableName = 'ally_universe_cards';
          break;
        case 'training':
          tableName = 'training_cards';
          break;
        case 'basic_universe':
          tableName = 'basic_universe_cards';
          break;
        default:
          return false;
      }

      const result = await client.query(
        `SELECT 1 FROM ${tableName} WHERE id = $1`,
        [cardId]
      );

      const exists = result.rows.length > 0;
      console.log('🟠 [Repo] verifyCardExists result:', { tableName, exists });

      return exists;
    } finally {
      client.release();
    }
  }
}

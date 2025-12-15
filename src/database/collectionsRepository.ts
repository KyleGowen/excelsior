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
  set?: string; // Renamed from universe
}

export interface CollectionHistory {
  id: string;
  collection_id: string;
  card_id: string;
  action: 'ADD' | 'REMOVE';
  new_quantity: number;
  created_at: Date;
}

export class CollectionsRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Get image path from card data
   * After migration, alternate cards are separate cards, so we just get the card's image_path
   */
  private async getCardImagePath(
    client: PoolClient,
    cardId: string,
    cardType: string
  ): Promise<string> {
    let cardImagePath: string | null = null;
    
    try {
      switch (cardType) {
        case 'character':
          const charResult = await client.query('SELECT image_path FROM characters WHERE id = $1', [cardId]);
          if (charResult.rows.length > 0) {
            cardImagePath = charResult.rows[0].image_path;
          }
          break;
        case 'special':
          const specialResult = await client.query('SELECT image_path FROM special_cards WHERE id = $1', [cardId]);
          if (specialResult.rows.length > 0) {
            cardImagePath = specialResult.rows[0].image_path;
          }
          break;
        case 'power':
          const powerResult = await client.query('SELECT image_path FROM power_cards WHERE id = $1', [cardId]);
          if (powerResult.rows.length > 0) {
            cardImagePath = powerResult.rows[0].image_path;
          }
          break;
        case 'location':
          const locationResult = await client.query('SELECT image_path FROM locations WHERE id = $1', [cardId]);
          if (locationResult.rows.length > 0) {
            cardImagePath = locationResult.rows[0].image_path;
          }
          break;
        case 'mission':
          const missionResult = await client.query('SELECT image_path FROM missions WHERE id = $1', [cardId]);
          if (missionResult.rows.length > 0) {
            cardImagePath = missionResult.rows[0].image_path;
          }
          break;
        case 'event':
          const eventResult = await client.query('SELECT image_path FROM events WHERE id = $1', [cardId]);
          if (eventResult.rows.length > 0) {
            cardImagePath = eventResult.rows[0].image_path;
          }
          break;
        case 'aspect':
          const aspectResult = await client.query('SELECT image_path FROM aspects WHERE id = $1', [cardId]);
          if (aspectResult.rows.length > 0) {
            cardImagePath = aspectResult.rows[0].image_path;
          }
          break;
        case 'advanced_universe':
          const advUniResult = await client.query('SELECT image_path FROM advanced_universe_cards WHERE id = $1', [cardId]);
          if (advUniResult.rows.length > 0) {
            cardImagePath = advUniResult.rows[0].image_path;
          }
          break;
        case 'teamwork':
          const teamworkResult = await client.query('SELECT image_path FROM teamwork_cards WHERE id = $1', [cardId]);
          if (teamworkResult.rows.length > 0) {
            cardImagePath = teamworkResult.rows[0].image_path;
          }
          break;
        case 'ally_universe':
          const allyResult = await client.query('SELECT image_path FROM ally_universe_cards WHERE id = $1', [cardId]);
          if (allyResult.rows.length > 0) {
            cardImagePath = allyResult.rows[0].image_path;
          }
          break;
        case 'training':
          const trainingResult = await client.query('SELECT image_path FROM training_cards WHERE id = $1', [cardId]);
          if (trainingResult.rows.length > 0) {
            cardImagePath = trainingResult.rows[0].image_path;
          }
          break;
        case 'basic_universe':
          const basicResult = await client.query('SELECT image_path FROM basic_universe_cards WHERE id = $1', [cardId]);
          if (basicResult.rows.length > 0) {
            cardImagePath = basicResult.rows[0].image_path;
          }
          break;
      }
    } catch (error) {
      console.error(`Error fetching card image_path for ${cardType} ${cardId}:`, error);
    }
    
    // Construct full path from image_path
    if (cardImagePath && cardImagePath.trim() !== '') {
      const path = cardImagePath.trim();
      
      // If already a full path, use it
      if (path.startsWith('/src/resources/cards/images/')) {
        return path;
      }
      
      // Otherwise, construct full path
      return `/src/resources/cards/images/${path}`;
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
        let set: string = '';

        try {
          switch (cc.card_type) {
            case 'character':
              const charResult = await client.query('SELECT * FROM characters WHERE id = $1', [cc.card_id]);
              if (charResult.rows.length > 0) {
                cardData = charResult.rows[0];
                cardName = cardData.name;
                set = cardData.set || 'ERB';
              }
              break;
            case 'special':
              const specialResult = await client.query('SELECT * FROM special_cards WHERE id = $1', [cc.card_id]);
              if (specialResult.rows.length > 0) {
                cardData = specialResult.rows[0];
                cardName = cardData.name;
                set = cardData.set || 'ERB';
              }
              break;
            case 'power':
              const powerResult = await client.query('SELECT * FROM power_cards WHERE id = $1', [cc.card_id]);
              if (powerResult.rows.length > 0) {
                cardData = powerResult.rows[0];
                cardName = `${cardData.value} - ${cardData.power_type}`;
                set = cardData.set || 'ERB';
              }
              break;
            case 'location':
              const locationResult = await client.query('SELECT * FROM locations WHERE id = $1', [cc.card_id]);
              if (locationResult.rows.length > 0) {
                cardData = locationResult.rows[0];
                cardName = locationResult.rows[0].name;
                set = cardData.set || 'ERB';
              }
              break;
            case 'mission':
              const missionResult = await client.query('SELECT * FROM missions WHERE id = $1', [cc.card_id]);
              if (missionResult.rows.length > 0) {
                cardData = missionResult.rows[0];
                cardName = cardData.card_name || cardData.name;
                set = cardData.set || 'ERB';
              }
              break;
            case 'event':
              const eventResult = await client.query('SELECT * FROM events WHERE id = $1', [cc.card_id]);
              if (eventResult.rows.length > 0) {
                cardData = eventResult.rows[0];
                cardName = cardData.name;
                set = cardData.set || 'ERB';
              }
              break;
            case 'aspect':
              const aspectResult = await client.query('SELECT * FROM aspects WHERE id = $1', [cc.card_id]);
              if (aspectResult.rows.length > 0) {
                cardData = aspectResult.rows[0];
                cardName = cardData.card_name || cardData.name;
                set = cardData.set || 'ERB';
              }
              break;
            case 'advanced_universe':
              const advUniResult = await client.query('SELECT * FROM advanced_universe_cards WHERE id = $1', [cc.card_id]);
              if (advUniResult.rows.length > 0) {
                cardData = advUniResult.rows[0];
                cardName = cardData.card_name || cardData.name;
                set = cardData.set || 'ERB';
              }
              break;
            case 'teamwork':
              const teamworkResult = await client.query('SELECT * FROM teamwork_cards WHERE id = $1', [cc.card_id]);
              if (teamworkResult.rows.length > 0) {
                cardData = teamworkResult.rows[0];
                cardName = cardData.card_type || cardData.name;
                set = cardData.set || 'ERB';
              }
              break;
            case 'ally_universe':
              const allyResult = await client.query('SELECT * FROM ally_universe_cards WHERE id = $1', [cc.card_id]);
              if (allyResult.rows.length > 0) {
                cardData = allyResult.rows[0];
                cardName = cardData.card_name || cardData.name;
                set = cardData.set || 'ERB';
              }
              break;
            case 'training':
              const trainingResult = await client.query('SELECT * FROM training_cards WHERE id = $1', [cc.card_id]);
              if (trainingResult.rows.length > 0) {
                cardData = trainingResult.rows[0];
                cardName = cardData.card_name || cardData.name;
                set = cardData.set || 'ERB';
              }
              break;
            case 'basic_universe':
              const basicResult = await client.query('SELECT * FROM basic_universe_cards WHERE id = $1', [cc.card_id]);
              if (basicResult.rows.length > 0) {
                cardData = basicResult.rows[0];
                cardName = cardData.card_name || cardData.name;
                set = cardData.set || 'ERB';
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
          set: set
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
    imagePath?: string
  ): Promise<CollectionCard> {
    console.log('🟠 [Repo] addCardToCollection called:', {
      collectionId,
      cardId,
      cardType,
      quantity,
      imagePath
    });

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get the image path from the card if not provided
      let finalImagePath = imagePath;
      if (!finalImagePath) {
        finalImagePath = await this.getCardImagePath(client, cardId, cardType);
      }
      console.log('🟠 [Repo] Using image_path:', finalImagePath);

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
        [collectionId, cardId, cardType, quantity, finalImagePath]
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
   * Get collection history for a collection
   * Returns history entries ordered by created_at DESC (most recent first)
   */
  async getCollectionHistory(collectionId: string, limit?: number): Promise<CollectionHistory[]> {
    const client = await this.pool.connect();
    try {
      let query = `
        SELECT id, collection_id, card_id, action, new_quantity, created_at
        FROM collection_history
        WHERE collection_id = $1
        ORDER BY created_at DESC
      `;
      
      const params: any[] = [collectionId];
      
      if (limit && limit > 0) {
        query += ' LIMIT $2';
        params.push(limit);
      }
      
      const result = await client.query<CollectionHistory>(query, params);
      return result.rows;
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

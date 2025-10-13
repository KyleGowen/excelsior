import { Pool, PoolClient } from 'pg';
import { Deck, UIPreferences, DeckCard } from '../types';
import { DeckRepository } from '../repository/DeckRepository';

export class PostgreSQLDeckRepository implements DeckRepository {
  private pool: Pool;
  
  // Caching for frequently accessed deck data
  private deckCache: Map<string, { deck: Deck; timestamp: number }> = new Map();
  private readonly DECK_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  constructor(pool: Pool) {
    this.pool = pool;
  }


  async initialize(): Promise<void> {
    // PostgreSQL DeckRepository doesn't need to load data from files
    // Data is already in the database from migrations
    console.log('✅ PostgreSQL DeckRepository initialized');
  }

  async createDeck(userId: string, name: string, description?: string, characterIds?: string[]): Promise<Deck> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create the deck
      const result = await client.query(
        'INSERT INTO decks (user_id, name, description) VALUES ($1, $2, $3) RETURNING *',
        [userId, name, description || null]
      );
      
      const deck = result.rows[0];
      const deckId = deck.id;
      
      // Add character cards if provided
      if (characterIds && characterIds.length > 0) {
        for (const characterId of characterIds) {
          await client.query(
            'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity) VALUES ($1, $2, $3, $4)',
            [deckId, 'character', characterId, 1]
          );
        }
      }
      
      await client.query('COMMIT');
      
      // Fetch the updated deck data after triggers have updated threat values
      const updatedDeckResult = await client.query(
        'SELECT * FROM decks WHERE id = $1',
        [deckId]
      );
      
      const updatedDeck = updatedDeckResult.rows[0];
      
      const newDeck = {
        id: updatedDeck.id,
        user_id: updatedDeck.user_id,
        name: updatedDeck.name,
        description: updatedDeck.description,
        ui_preferences: updatedDeck.ui_preferences,
        is_limited: updatedDeck.is_limited,
        reserve_character: updatedDeck.reserve_character,
        threat: updatedDeck.threat,
        created_at: updatedDeck.created_at,
        updated_at: updatedDeck.updated_at
      };
      
      // Cache the new deck and invalidate user's deck list cache
      this.deckCache.set(deck.id, { deck: newDeck, timestamp: Date.now() });
      this.deckCache.delete(`user_decks_${userId}`);
      
      return newDeck;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ PostgreSQLDeckRepository.createDeck error:', error);
      console.error('❌ CreateDeck error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown',
        userId,
        deckName: name,
        description,
        characterIds
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async getDeckById(id: string): Promise<Deck | undefined> {
    // Validate UUID format first
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return undefined;
    }

    // Check cache first
    const cached = this.deckCache.get(id);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < this.DECK_CACHE_TTL) {
      return cached.deck;
    }

    const client = await this.pool.connect();
    try {
      const deckResult = await client.query(
        'SELECT * FROM decks WHERE id = $1',
        [id]
      );
      
      if (deckResult.rows.length === 0) {
        return undefined;
      }
      
      const deck = deckResult.rows[0];
      
      // Fetch the cards for this deck
      const cardsResult = await client.query(
        'SELECT * FROM deck_cards WHERE deck_id = $1',
        [id]
      );
      
      const cards = cardsResult.rows.map(card => ({
        id: card.id,
        type: card.card_type,
        cardId: card.card_id,
        quantity: card.quantity,
        selectedAlternateImage: card.selected_alternate_image
      }));
      
      const fullDeck = {
        id: deck.id,
        user_id: deck.user_id,
        name: deck.name,
        description: deck.description,
        ui_preferences: deck.ui_preferences,
        is_limited: deck.is_limited,
        reserve_character: deck.reserve_character,
        threat: deck.threat,
        created_at: deck.created_at,
        updated_at: deck.updated_at,
        cards: cards
      };
      
      // Cache the result
      this.deckCache.set(id, { deck: fullDeck, timestamp: now });
      
      return fullDeck;
    } finally {
      client.release();
    }
  }

  async getDecksByUserId(userId: string): Promise<Deck[]> {
    // Check cache first
    const cacheKey = `user_decks_${userId}`;
    const cached = this.deckCache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < this.DECK_CACHE_TTL) {
      return cached.deck as unknown as Deck[];
    }

    const client = await this.pool.connect();
    try {
      // Get deck metadata with character and location information using joins
      const deckResult = await client.query(`
        SELECT 
          d.*,
          c1.name as character_1_name,
          c1.image_path as character_1_default_image,
          c2.name as character_2_name,
          c2.image_path as character_2_default_image,
          c3.name as character_3_name,
          c3.image_path as character_3_default_image,
          c4.name as character_4_name,
          c4.image_path as character_4_default_image,
          l.name as location_name,
          l.image_path as location_default_image
        FROM decks d
        LEFT JOIN characters c1 ON d.character_1_id = c1.id
        LEFT JOIN characters c2 ON d.character_2_id = c2.id
        LEFT JOIN characters c3 ON d.character_3_id = c3.id
        LEFT JOIN characters c4 ON d.character_4_id = c4.id
        LEFT JOIN locations l ON d.location_id = l.id
        WHERE d.user_id = $1 
        ORDER BY d.created_at DESC
      `, [userId]);
      
      if (deckResult.rows.length === 0) {
        return [];
      }
      
      // Build character and location cards from metadata
      const decks = deckResult.rows.map(deck => {
        const cards: any[] = [];
        
        // Add character cards from metadata
        if (deck.character_1_id) {
          cards.push({
            id: `char1_${deck.id}`,
            type: 'character',
            cardId: deck.character_1_id,
            quantity: 1,
            selectedAlternateImage: deck.character_1_image,
            defaultImage: deck.character_1_default_image,
            name: deck.character_1_name
          });
        }
        if (deck.character_2_id) {
          cards.push({
            id: `char2_${deck.id}`,
            type: 'character',
            cardId: deck.character_2_id,
            quantity: 1,
            selectedAlternateImage: deck.character_2_image,
            defaultImage: deck.character_2_default_image,
            name: deck.character_2_name
          });
        }
        if (deck.character_3_id) {
          cards.push({
            id: `char3_${deck.id}`,
            type: 'character',
            cardId: deck.character_3_id,
            quantity: 1,
            selectedAlternateImage: deck.character_3_image,
            defaultImage: deck.character_3_default_image,
            name: deck.character_3_name
          });
        }
        if (deck.character_4_id) {
          cards.push({
            id: `char4_${deck.id}`,
            type: 'character',
            cardId: deck.character_4_id,
            quantity: 1,
            selectedAlternateImage: deck.character_4_image,
            defaultImage: deck.character_4_default_image,
            name: deck.character_4_name
          });
        }
        
        // Add location card from metadata
        if (deck.location_id) {
          cards.push({
            id: `loc_${deck.id}`,
            type: 'location',
            cardId: deck.location_id,
            quantity: 1,
            selectedAlternateImage: null, // Locations don't have alternate images
            name: deck.location_name
          });
        }
        
        return {
          id: deck.id,
          user_id: deck.user_id,
          name: deck.name,
          description: deck.description,
          ui_preferences: deck.ui_preferences,
          is_limited: deck.is_limited,
          is_valid: deck.is_valid,
          card_count: deck.card_count,
          threat: deck.threat,
          reserve_character: deck.reserve_character,
          created_at: deck.created_at,
          updated_at: deck.updated_at,
          cards: cards
        };
      });
      
      // Cache the result
      this.deckCache.set(cacheKey, { deck: decks as any, timestamp: now });
      
      return decks;
    } finally {
      client.release();
    }
  }

  async getDeckSummaryWithAllCards(deckId: string): Promise<Deck | undefined> {
    // This method loads a deck with ALL cards (including non-character/location cards)
    // Used for background loading after initial page load
    const client = await this.pool.connect();
    try {
      const deckResult = await client.query(
        'SELECT * FROM decks WHERE id = $1',
        [deckId]
      );
      
      if (deckResult.rows.length === 0) {
        return undefined;
      }
      
      const deck = deckResult.rows[0];
      
      // Fetch ALL cards for this deck
      const cardsResult = await client.query(
        'SELECT * FROM deck_cards WHERE deck_id = $1',
        [deckId]
      );
      
      const cards = cardsResult.rows.map(card => ({
        id: card.id,
        type: card.card_type,
        cardId: card.card_id,
        quantity: card.quantity,
        selectedAlternateImage: card.selected_alternate_image
      }));
      
      const fullDeck = {
        id: deck.id,
        user_id: deck.user_id,
        name: deck.name,
        description: deck.description,
        ui_preferences: deck.ui_preferences,
        is_limited: deck.is_limited,
        reserve_character: deck.reserve_character,
        threat: deck.threat,
        created_at: deck.created_at,
        updated_at: deck.updated_at,
        cards: cards
      };
      
      // Update cache with full deck data
      this.deckCache.set(deckId, { deck: fullDeck, timestamp: Date.now() });
      
      return fullDeck;
    } finally {
      client.release();
    }
  }

  async getAllDecks(): Promise<Deck[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM decks ORDER BY created_at');
      
      return result.rows.map(deck => ({
        id: deck.id,
        user_id: deck.user_id,
        name: deck.name,
        description: deck.description,
        ui_preferences: deck.ui_preferences,
        is_limited: deck.is_limited,
        reserve_character: deck.reserve_character,
        threat: deck.threat,
        created_at: deck.created_at,
        updated_at: deck.updated_at
      }));
    } finally {
      client.release();
    }
  }

  async updateDeck(id: string, updates: Partial<Deck>): Promise<Deck | undefined> {
    const client = await this.pool.connect();
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;

      if (updates.name !== undefined) {
        setClause.push(`name = $${paramCount++}`);
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        setClause.push(`description = $${paramCount++}`);
        values.push(updates.description);
      }
      if (updates.ui_preferences !== undefined) {
        setClause.push(`ui_preferences = $${paramCount++}`);
        values.push(JSON.stringify(updates.ui_preferences));
      }
      if (updates.is_limited !== undefined) {
        setClause.push(`is_limited = $${paramCount++}`);
        values.push(updates.is_limited);
      }
      if (updates.is_valid !== undefined) {
        setClause.push(`is_valid = $${paramCount++}`);
        values.push(updates.is_valid);
      }
      if (updates.reserve_character !== undefined) {
        setClause.push(`reserve_character = $${paramCount++}`);
        values.push(updates.reserve_character);
      }

      if (setClause.length === 0) {
        return this.getDeckById(id);
      }

      setClause.push(`updated_at = NOW()`);
      values.push(id);

      const result = await client.query(
        `UPDATE decks SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return undefined;
      }

      const deck = result.rows[0];
      const updatedDeck = {
        id: deck.id,
        user_id: deck.user_id,
        name: deck.name,
        description: deck.description,
        ui_preferences: deck.ui_preferences,
        is_limited: deck.is_limited,
        is_valid: deck.is_valid,
        card_count: deck.card_count,
        threat: deck.threat,
        reserve_character: deck.reserve_character,
        created_at: deck.created_at,
        updated_at: deck.updated_at
      };
      
      // Invalidate cache for this deck and user's deck list
      this.deckCache.delete(id);
      this.deckCache.delete(`user_decks_${deck.user_id}`);
      
      return updatedDeck;
    } finally {
      client.release();
    }
  }

  async deleteDeck(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      // First get the user_id before deleting
      const userResult = await client.query('SELECT user_id FROM decks WHERE id = $1', [id]);
      const userId = userResult.rows[0]?.user_id;
      
      const result = await client.query('DELETE FROM decks WHERE id = $1', [id]);
      const success = (result.rowCount || 0) > 0;
      
      if (success) {
        // Invalidate cache for this deck and user's deck list
        this.deckCache.delete(id);
        if (userId) {
          this.deckCache.delete(`user_decks_${userId}`);
        }
      }
      
      return success;
    } finally {
      client.release();
    }
  }

  async updateUIPreferences(deckId: string, preferences: UIPreferences): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      // First get the user_id before updating
      const userResult = await client.query('SELECT user_id FROM decks WHERE id = $1', [deckId]);
      const userId = userResult.rows[0]?.user_id;
      
      const result = await client.query(
        'UPDATE decks SET ui_preferences = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(preferences), deckId]
      );
      
      // Invalidate cache for this deck and user's deck list
      this.deckCache.delete(deckId);
      if (userId) {
        this.deckCache.delete(`user_decks_${userId}`);
      }
      
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }

  async getUIPreferences(deckId: string): Promise<UIPreferences | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT ui_preferences FROM decks WHERE id = $1',
        [deckId]
      );
      
      if (result.rows.length === 0 || !result.rows[0].ui_preferences) {
        return undefined;
      }
      
      return result.rows[0].ui_preferences;
    } finally {
      client.release();
    }
  }

  async getDeckStats(): Promise<{ decks: number }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) as count FROM decks');
      return {
        decks: parseInt(result.rows[0].count)
      };
    } finally {
      client.release();
    }
  }

  // Deck card management methods
  async addCardToDeck(deckId: string, cardType: string, cardId: string, quantity: number = 1, selectedAlternateImage?: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      // Check if card already exists in deck
      const existingCard = await client.query(
        'SELECT * FROM deck_cards WHERE deck_id = $1 AND card_type = $2 AND card_id = $3',
        [deckId, cardType, cardId]
      );

      if (existingCard.rows.length > 0) {
        // Update quantity if card already exists
        await client.query(
          'UPDATE deck_cards SET quantity = quantity + $1, updated_at = NOW() WHERE deck_id = $2 AND card_type = $3 AND card_id = $4',
          [quantity, deckId, cardType, cardId]
        );
      } else {
        // Add new card to deck
        await client.query(
          'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image) VALUES ($1, $2, $3, $4, $5)',
          [deckId, cardType, cardId, quantity, selectedAlternateImage || null]
        );
      }
      
      // Invalidate cache for this deck and user's deck list
      this.deckCache.delete(deckId);
      // Get user_id to invalidate user's deck list cache
      const userResult = await client.query('SELECT user_id FROM decks WHERE id = $1', [deckId]);
      const userId = userResult.rows[0]?.user_id;
      if (userId) {
        this.deckCache.delete(`user_decks_${userId}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error adding card to deck:', error);
      return false;
    } finally {
      client.release();
    }
  }

  async removeCardFromDeck(deckId: string, cardType: string, cardId: string, quantity: number = 1): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      // Check current quantity
      const currentCard = await client.query(
        'SELECT quantity FROM deck_cards WHERE deck_id = $1 AND card_type = $2 AND card_id = $3',
        [deckId, cardType, cardId]
      );

      if (currentCard.rows.length === 0) {
        return false; // Card not found
      }

      const currentQuantity = currentCard.rows[0].quantity;
      const newQuantity = currentQuantity - quantity;

      if (newQuantity <= 0) {
        // Remove card completely
        await client.query(
          'DELETE FROM deck_cards WHERE deck_id = $1 AND card_type = $2 AND card_id = $3',
          [deckId, cardType, cardId]
        );
      } else {
        // Update quantity
        await client.query(
          'UPDATE deck_cards SET quantity = $1, updated_at = NOW() WHERE deck_id = $2 AND card_type = $3 AND card_id = $4',
          [newQuantity, deckId, cardType, cardId]
        );
      }
      
      // Invalidate cache for this deck and user's deck list
      this.deckCache.delete(deckId);
      // Get user_id to invalidate user's deck list cache
      const userResult = await client.query('SELECT user_id FROM decks WHERE id = $1', [deckId]);
      const userId = userResult.rows[0]?.user_id;
      if (userId) {
        this.deckCache.delete(`user_decks_${userId}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error removing card from deck:', error);
      return false;
    } finally {
      client.release();
    }
  }

  async updateCardInDeck(deckId: string, cardType: string, cardId: string, updates: { quantity?: number; selectedAlternateImage?: string }): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;

      if (updates.quantity !== undefined) {
        setClause.push(`quantity = $${paramCount++}`);
        values.push(updates.quantity);
      }
      if (updates.selectedAlternateImage !== undefined) {
        setClause.push(`selected_alternate_image = $${paramCount++}`);
        values.push(updates.selectedAlternateImage);
      }

      if (setClause.length === 0) {
        return true; // No updates needed
      }

      setClause.push(`updated_at = NOW()`);
      values.push(deckId, cardType, cardId);

      const result = await client.query(
        `UPDATE deck_cards SET ${setClause.join(', ')} WHERE deck_id = $${paramCount} AND card_type = $${paramCount + 1} AND card_id = $${paramCount + 2}`,
        values
      );

      const success = (result.rowCount || 0) > 0;
      
      if (success) {
        // Invalidate cache for this deck and user's deck list
        this.deckCache.delete(deckId);
        // Get user_id to invalidate user's deck list cache
        const userResult = await client.query('SELECT user_id FROM decks WHERE id = $1', [deckId]);
        const userId = userResult.rows[0]?.user_id;
        if (userId) {
          this.deckCache.delete(`user_decks_${userId}`);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Error updating card in deck:', error);
      return false;
    } finally {
      client.release();
    }
  }

  async removeAllCardsFromDeck(deckId: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM deck_cards WHERE deck_id = $1', [deckId]);
      
      // Invalidate cache for this deck and user's deck list
      this.deckCache.delete(deckId);
      // Get user_id to invalidate user's deck list cache
      const userResult = await client.query('SELECT user_id FROM decks WHERE id = $1', [deckId]);
      const userId = userResult.rows[0]?.user_id;
      if (userId) {
        this.deckCache.delete(`user_decks_${userId}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error removing all cards from deck:', error);
      return false;
    } finally {
      client.release();
    }
  }

  // Bulk replace all cards in a deck (used for save operations)
  async replaceAllCardsInDeck(deckId: string, cards: Array<{cardType: string, cardId: string, quantity: number, selectedAlternateImage?: string}>): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      // Start a transaction to ensure atomicity
      await client.query('BEGIN');
      
      // Clear all existing cards
      await client.query('DELETE FROM deck_cards WHERE deck_id = $1', [deckId]);
      
      // Insert all new cards
      for (const card of cards) {
        await client.query(
          'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity, selected_alternate_image) VALUES ($1, $2, $3, $4, $5)',
          [deckId, card.cardType, card.cardId, card.quantity, card.selectedAlternateImage || null]
        );
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      
      // Invalidate cache for this deck and user's deck list
      this.deckCache.delete(deckId);
      // Get user_id to invalidate user's deck list cache
      const userResult = await client.query('SELECT user_id FROM decks WHERE id = $1', [deckId]);
      const userId = userResult.rows[0]?.user_id;
      if (userId) {
        this.deckCache.delete(`user_decks_${userId}`);
      }
      
      return true;
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error('Error replacing all cards in deck:', error);
      return false;
    } finally {
      client.release();
    }
  }

  async getDeckCards(deckId: string): Promise<DeckCard[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM deck_cards WHERE deck_id = $1 ORDER BY card_type, card_id',
        [deckId]
      );

      return result.rows.map(card => ({
        id: card.id,
        type: card.card_type,
        cardId: card.card_id,
        quantity: card.quantity,
        selectedAlternateImage: card.selected_alternate_image
      }));
    } finally {
      client.release();
    }
  }

  async userOwnsDeck(deckId: string, userId: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT user_id FROM decks WHERE id = $1',
        [deckId]
      );
      
      if (result.rows.length === 0) {
        return false; // Deck doesn't exist
      }
      
      return result.rows[0].user_id === userId;
    } finally {
      client.release();
    }
  }
}

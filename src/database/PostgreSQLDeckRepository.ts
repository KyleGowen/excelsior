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
      
      const newDeck = {
        id: deck.id,
        user_id: deck.user_id,
        name: deck.name,
        description: deck.description,
        ui_preferences: deck.ui_preferences,
        is_limited: deck.is_limited,
        created_at: deck.created_at,
        updated_at: deck.updated_at
      };
      
      // Cache the new deck and invalidate user's deck list cache
      this.deckCache.set(deck.id, { deck: newDeck, timestamp: Date.now() });
      this.deckCache.delete(`user_decks_${userId}`);
      
      return newDeck;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getDeckById(id: string): Promise<Deck | undefined> {
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
      // Get deck metadata first
      const deckResult = await client.query(`
        SELECT * FROM decks 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [userId]);
      
      if (deckResult.rows.length === 0) {
        return [];
      }
      
      const deckIds = deckResult.rows.map(deck => deck.id);
      
      // Load only character and location cards for deck summaries
      const cardsResult = await client.query(`
        SELECT * FROM deck_cards 
        WHERE deck_id = ANY($1) 
        AND card_type IN ('character', 'location')
        ORDER BY deck_id, card_type, card_id
      `, [deckIds]);
      
      // Group cards by deck_id
      const cardsByDeck = new Map<string, any[]>();
      cardsResult.rows.forEach(card => {
        if (!cardsByDeck.has(card.deck_id)) {
          cardsByDeck.set(card.deck_id, []);
        }
        cardsByDeck.get(card.deck_id)!.push({
          id: card.id,
          type: card.card_type,
          cardId: card.card_id,
          quantity: card.quantity,
          selectedAlternateImage: card.selected_alternate_image
        });
      });
      
      const decks = deckResult.rows.map(deck => ({
        id: deck.id,
        user_id: deck.user_id,
        name: deck.name,
        description: deck.description,
        ui_preferences: deck.ui_preferences,
        is_limited: deck.is_limited,
        created_at: deck.created_at,
        updated_at: deck.updated_at,
        cards: cardsByDeck.get(deck.id) || [] // Only character and location cards
      }));
      
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

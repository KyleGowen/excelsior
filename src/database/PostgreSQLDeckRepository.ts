import { Pool, PoolClient } from 'pg';
import { Deck, UIPreferences, DeckCard } from '../types';
import { DeckRepository } from '../repository/DeckRepository';

export class PostgreSQLDeckRepository implements DeckRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async initialize(): Promise<void> {
    // PostgreSQL DeckRepository doesn't need to load data from files
    // Data is already in the database from migrations
    console.log('✅ PostgreSQL DeckRepository initialized');
  }

  async createDeck(userId: string, name: string, description?: string): Promise<Deck> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO decks (user_id, name, description) VALUES ($1, $2, $3) RETURNING *',
        [userId, name, description || null]
      );
      
      const deck = result.rows[0];
      return {
        id: deck.id,
        user_id: deck.user_id,
        name: deck.name,
        description: deck.description,
        ui_preferences: deck.ui_preferences,
        created_at: deck.created_at,
        updated_at: deck.updated_at
      };
    } finally {
      client.release();
    }
  }

  async getDeckById(id: string): Promise<Deck | undefined> {
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
      
      return {
        id: deck.id,
        user_id: deck.user_id,
        name: deck.name,
        description: deck.description,
        ui_preferences: deck.ui_preferences,
        created_at: deck.created_at,
        updated_at: deck.updated_at,
        cards: cards
      };
    } finally {
      client.release();
    }
  }

  async getDecksByUserId(userId: string): Promise<Deck[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM decks WHERE user_id = $1 ORDER BY created_at',
        [userId]
      );
      
      return result.rows.map(deck => ({
        id: deck.id,
        user_id: deck.user_id,
        name: deck.name,
        description: deck.description,
        ui_preferences: deck.ui_preferences,
        created_at: deck.created_at,
        updated_at: deck.updated_at
      }));
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
      return {
        id: deck.id,
        user_id: deck.user_id,
        name: deck.name,
        description: deck.description,
        ui_preferences: deck.ui_preferences,
        created_at: deck.created_at,
        updated_at: deck.updated_at
      };
    } finally {
      client.release();
    }
  }

  async deleteDeck(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('DELETE FROM decks WHERE id = $1', [id]);
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }

  async updateUIPreferences(deckId: string, preferences: UIPreferences): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'UPDATE decks SET ui_preferences = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(preferences), deckId]
      );
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

      return (result.rowCount || 0) > 0;
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
}

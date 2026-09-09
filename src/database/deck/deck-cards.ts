import { PoolClient } from 'pg';
import { catalogCardExistsInTable } from '../collection/card-lookup';
import { DeckCard } from '../../types';
import type { DeckRepositoryContext } from './context';
import { refreshDeckPreviewMetadata } from './deck-metadata';

async function touchDeckUpdatedAt(client: PoolClient, deckId: string): Promise<void> {
  await client.query('UPDATE decks SET updated_at = NOW() WHERE id = $1', [deckId]);
}

/**
 * Check if a card exists in the appropriate card table for the given type.
 * @param allowUnknown - If true, unknown card types are treated as valid (for bulk replace). If false, returns false and logs error.
 */
export async function cardExistsInCardTable(
  client: PoolClient,
  cardType: string,
  cardId: string,
  allowUnknown = false
): Promise<boolean> {
  const exists = await catalogCardExistsInTable(client, cardType, cardId);
  if (exists === null) {
    if (allowUnknown) {
      console.warn(`Unknown card type: ${cardType}, skipping validation`);
      return true;
    }
    console.error(`Unknown card type: ${cardType}`);
    return false;
  }
  return exists;
}

export async function addCardToDeck(
  ctx: DeckRepositoryContext,
  deckId: string,
  cardType: string,
  cardId: string,
  quantity = 1,
  _selectedAlternateImage?: string
): Promise<boolean> {
  const client = await ctx.pool.connect();
  try {
    const cardExists = await cardExistsInCardTable(client, cardType, cardId, false);
    if (!cardExists) {
      console.error(
        `Card with ID ${cardId} (type: ${typeof cardId}) does not exist in ${cardType} table`
      );
      if (cardType === 'character') {
        const debugResult = await client.query(
          'SELECT id::text, name FROM characters LIMIT 5'
        );
        console.error(
          `Sample character IDs: ${debugResult.rows.map((r: { id: string }) => r.id).join(', ')}`
        );
      }
      return false;
    }

    const existingCard = await client.query(
      'SELECT * FROM deck_cards WHERE deck_id = $1 AND card_type = $2 AND card_id = $3',
      [deckId, cardType, cardId]
    );

    if (existingCard.rows.length > 0) {
      await client.query(
        'UPDATE deck_cards SET quantity = quantity + $1, updated_at = NOW() WHERE deck_id = $2 AND card_type = $3 AND card_id = $4',
        [quantity, deckId, cardType, cardId]
      );
    } else {
      await client.query(
        'INSERT INTO deck_cards (deck_id, card_type, card_id, quantity) VALUES ($1, $2, $3, $4)',
        [deckId, cardType, cardId, quantity]
      );
    }

    await touchDeckUpdatedAt(client, deckId);
    await ctx.invalidateDeck(deckId);
    return true;
  } catch (error) {
    console.error('Error adding card to deck:', error);
    return false;
  } finally {
    client.release();
  }
}

export async function doesCardExistInDeck(
  ctx: DeckRepositoryContext,
  deckId: string,
  cardType: string,
  cardId: string
): Promise<boolean> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(
      'SELECT 1 FROM deck_cards WHERE deck_id = $1 AND card_type = $2 AND card_id = $3 LIMIT 1',
      [deckId, cardType, cardId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking if card exists in deck:', error);
    return false;
  } finally {
    client.release();
  }
}

export async function removeCardFromDeck(
  ctx: DeckRepositoryContext,
  deckId: string,
  cardType: string,
  cardId: string,
  quantity = 1
): Promise<boolean> {
  const client = await ctx.pool.connect();
  try {
    const currentCard = await client.query(
      'SELECT quantity FROM deck_cards WHERE deck_id = $1 AND card_type = $2 AND card_id = $3',
      [deckId, cardType, cardId]
    );

    if (currentCard.rows.length === 0) {
      return false;
    }

    const currentQuantity = currentCard.rows[0].quantity;
    const newQuantity = currentQuantity - quantity;

    if (newQuantity <= 0) {
      await client.query(
        'DELETE FROM deck_cards WHERE deck_id = $1 AND card_type = $2 AND card_id = $3',
        [deckId, cardType, cardId]
      );
    } else {
      await client.query(
        'UPDATE deck_cards SET quantity = $1, updated_at = NOW() WHERE deck_id = $2 AND card_type = $3 AND card_id = $4',
        [newQuantity, deckId, cardType, cardId]
      );
    }

    await touchDeckUpdatedAt(client, deckId);
    await ctx.invalidateDeck(deckId);
    return true;
  } catch (error) {
    console.error('Error removing card from deck:', error);
    return false;
  } finally {
    client.release();
  }
}

export async function updateCardInDeck(
  ctx: DeckRepositoryContext,
  deckId: string,
  cardType: string,
  cardId: string,
  updates: { quantity?: number }
): Promise<boolean> {
  const client = await ctx.pool.connect();
  try {
    const setClause: string[] = [];
    const values: (number | string)[] = [];
    let paramCount = 1;

    if (updates.quantity !== undefined) {
      setClause.push(`quantity = $${paramCount++}`);
      values.push(updates.quantity);
    }

    if (setClause.length === 0) {
      return true;
    }

    setClause.push('updated_at = NOW()');
    values.push(deckId, cardType, cardId);

    // setClause is from a fixed whitelist; values are parameterized.
    const result = await client.query( // nosemgrep: pg-sql-template-interpolation
      `UPDATE deck_cards SET ${setClause.join(', ')} WHERE deck_id = $${paramCount} AND card_type = $${paramCount + 1} AND card_id = $${paramCount + 2}`,
      values
    );

    const success = (result.rowCount || 0) > 0;
    if (success) {
      await touchDeckUpdatedAt(client, deckId);
      await ctx.invalidateDeck(deckId);
    }
    return success;
  } catch (error) {
    console.error('Error updating card in deck:', error);
    return false;
  } finally {
    client.release();
  }
}

export async function removeAllCardsFromDeck(
  ctx: DeckRepositoryContext,
  deckId: string
): Promise<boolean> {
  const client = await ctx.pool.connect();
  try {
    await client.query('DELETE FROM deck_cards WHERE deck_id = $1', [deckId]);
    await touchDeckUpdatedAt(client, deckId);
    await ctx.invalidateDeck(deckId);
    return true;
  } catch (error) {
    console.error('Error removing all cards from deck:', error);
    return false;
  } finally {
    client.release();
  }
}

export type ReplaceCardInput = {
  cardType: string;
  cardId: string;
  quantity: number;
  displayOrder?: number;
  exclude_from_draw?: boolean;
};

export async function replaceAllCardsInDeck(
  ctx: DeckRepositoryContext,
  deckId: string,
  cards: ReplaceCardInput[]
): Promise<void> {
  const client = await ctx.pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM deck_cards WHERE deck_id = $1', [deckId]);

    const cardMap = new Map<
      string,
      { cardType: string; cardId: string; quantity: number; displayOrder?: number; exclude_from_draw?: boolean }
    >();
    for (const card of cards) {
      const key = `${card.cardType}:${card.cardId}`;
      const existing = cardMap.get(key);
      if (existing) {
        existing.quantity += card.quantity;
        if (card.displayOrder !== undefined) {
          existing.displayOrder = existing.displayOrder === undefined
            ? card.displayOrder
            : Math.min(existing.displayOrder, card.displayOrder);
        }
        if (card.exclude_from_draw !== undefined) {
          existing.exclude_from_draw = existing.exclude_from_draw || card.exclude_from_draw;
        }
      } else {
        cardMap.set(key, { ...card });
      }
    }

    for (const card of Array.from(cardMap.values())) {
      let cardExists = false;
      try {
        cardExists = await cardExistsInCardTable(
          client,
          card.cardType,
          card.cardId,
          true
        );
      } catch (validationError: unknown) {
        console.error(
          `Error validating card ${card.cardId} of type ${card.cardType}:`,
          validationError
        );
      }

      if (!cardExists) {
        const errorMsg = `Card ${card.cardId} of type ${card.cardType} does not exist in database`;
        console.error(errorMsg);
        console.error('Card details:', JSON.stringify(card, null, 2));
        throw new Error(errorMsg);
      }

      await client.query(
        `INSERT INTO deck_cards
          (deck_id, card_type, card_id, quantity, display_order, exclude_from_draw)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          deckId,
          card.cardType,
          card.cardId,
          card.quantity,
          card.displayOrder ?? null,
          card.exclude_from_draw ?? false,
        ]
      );
    }

    const cardCountResult = await client.query<{ card_count: number }>(
      `
        SELECT COALESCE(SUM(
          GREATEST(quantity - CASE WHEN exclude_from_draw IS TRUE THEN 1 ELSE 0 END, 0)
        ), 0)::int AS card_count
        FROM deck_cards
        WHERE deck_id = $1
          AND card_type NOT IN ('character', 'location', 'battleground', 'mission')
      `,
      [deckId]
    );
    const cardCount = cardCountResult.rows[0]?.card_count ?? 0;
    await client.query('UPDATE decks SET card_count = $1, updated_at = NOW() WHERE id = $2', [
      cardCount,
      deckId,
    ]);

    await refreshDeckPreviewMetadata(ctx, deckId, client);
    await touchDeckUpdatedAt(client, deckId);
    await client.query('COMMIT');
    await ctx.invalidateDeck(deckId);
  } catch (error: unknown) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error rolling back transaction:', rollbackError);
    }
    const err = error as {
      message?: string;
      code?: string;
      detail?: string;
      constraint?: string;
      stack?: string;
    };
    console.error('Error replacing all cards in deck:', error);
    console.error('Error message:', err?.message);
    console.error('Error code:', err?.code);
    console.error('Error detail:', err?.detail);
    console.error('Error constraint:', err?.constraint);
    console.error('Error stack:', err?.stack);
    console.error('Deck ID:', deckId);
    console.error('Cards being inserted:', JSON.stringify(cards, null, 2));
    if (cards.length > 0) {
      console.error(
        'First 5 cards:',
        JSON.stringify(cards.slice(0, 5), null, 2)
      );
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function getDeckCards(
  ctx: DeckRepositoryContext,
  deckId: string
): Promise<DeckCard[]> {
  const client = await ctx.pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM deck_cards
       WHERE deck_id = $1
       ORDER BY display_order ASC NULLS LAST, card_type, card_id`,
      [deckId]
    );
    const rows = result.rows as {
      id: string;
      card_type: string;
      card_id: string;
      quantity: number;
      display_order?: number | null;
      exclude_from_draw?: boolean;
    }[];
    return rows.map((card) => ({
      id: card.id,
      type: card.card_type as DeckCard['type'],
      cardId: card.card_id,
      quantity: card.quantity,
      ...(card.display_order !== undefined && card.display_order !== null && {
        displayOrder: card.display_order,
      }),
      exclude_from_draw: card.exclude_from_draw ?? false,
    }));
  } finally {
    client.release();
  }
}

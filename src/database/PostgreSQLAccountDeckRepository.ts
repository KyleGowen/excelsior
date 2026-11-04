import { createHash, randomUUID } from 'crypto';
import type { Pool, PoolClient } from 'pg';
import { AccountDeckError, type AccountDeckPersistence, type AccountDeckView } from '../api/services/accountDeckService';
import type { AccountDeckSnapshotInput } from '../api/http/models/decks/AccountDeckSnapshotRequestBody';
import { cardExistsInCardTable } from './deck/deck-cards';
import { createDeckRepositoryContext } from './deck/context';
import { refreshDeckPreviewMetadata } from './deck/deck-metadata';

/** Atomic metadata/cards/receipt writes. Runtime roles only need DML on the migrated tables. */
export class PostgreSQLAccountDeckRepository implements AccountDeckPersistence {
  constructor(private readonly pool: Pool, private readonly invalidate: () => Promise<void>) {}
  async list(userId: string) {
    const result = await this.pool.query('SELECT id, name, card_count AS "cardCount" FROM decks WHERE user_id=$1 ORDER BY updated_at DESC, id', [userId]);
    return result.rows;
  }
  private async snapshot(client: PoolClient, id: string, viewerId: string): Promise<AccountDeckView | null> {
    const result = await client.query(`SELECT *, to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') || 'Z' AS revision_token FROM decks WHERE id=$1`, [id]);
    const row = result.rows[0];
    if (!row) return null;
    const cards = await client.query('SELECT id, card_type AS type, card_id AS "cardId", quantity, exclude_from_draw, display_order AS "displayOrder" FROM deck_cards WHERE deck_id=$1 ORDER BY display_order NULLS LAST, id', [id]);
    return { metadata: { id, name: row.name, userId: row.user_id, isOwner: row.user_id === viewerId, cardCount: row.card_count, is_limited: row.is_limited, reserve_character: row.reserve_character, updatedAt: row.revision_token }, cards: cards.rows, updatedAt: row.revision_token };
  }
  async load(id: string, viewerId: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const result = await this.snapshot(client, id, viewerId);
      await client.query('COMMIT');
      return result;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  async save(userId: string, input: AccountDeckSnapshotInput, metrics: { valid: boolean; cardCount: number; threat: number }) {
    const hash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    const client = await this.pool.connect();
    let saved: AccountDeckView;
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [userId + ':' + input.operationId]);
      const receipt = await client.query('SELECT request_hash, response FROM external_deck_save_receipts WHERE user_id=$1 AND operation_id=$2', [userId, input.operationId]);
      if (receipt.rows[0]) {
        if (receipt.rows[0].request_hash !== hash) throw new AccountDeckError(409, 'DECK_SAVE_CONFLICT');
        saved = receipt.rows[0].response as AccountDeckView;
      } else {
        const id = input.deckId ?? randomUUID();
        if (input.deckId) {
          const current = await client.query(`SELECT user_id, to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') || 'Z' AS revision_token FROM decks WHERE id=$1 FOR UPDATE`, [id]);
          if (!current.rows[0]) throw new AccountDeckError(404, 'DECK_NOT_FOUND');
          if (current.rows[0].user_id !== userId) throw new AccountDeckError(403, 'DECK_ACCESS_DENIED');
          if (current.rows[0].revision_token !== input.expectedUpdatedAt) throw new AccountDeckError(409, 'DECK_SAVE_CONFLICT');
          await client.query('UPDATE decks SET name=$1,is_limited=$2,reserve_character=$3,is_valid=$4,card_count=$5,threat=$6,updated_at=clock_timestamp() WHERE id=$7', [input.name, input.limited, input.reserveCharacterId, metrics.valid, metrics.cardCount, metrics.threat, id]);
          await client.query('DELETE FROM deck_cards WHERE deck_id=$1', [id]);
        } else {
          await client.query('INSERT INTO decks (id,user_id,name,is_limited,reserve_character,is_valid,card_count,threat) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [id, userId, input.name, input.limited, input.reserveCharacterId, metrics.valid, metrics.cardCount, metrics.threat]);
        }
        for (const card of input.cards) {
          if (!(await cardExistsInCardTable(client, card.type.replace(/_/g, '-'), card.cardId, false))) throw new AccountDeckError(400, 'INVALID_DECK_CARD');
        }
        const rows = input.cards.map((card, displayOrder) => ({ type: card.type.replace(/_/g, '-'), cardId: card.cardId, quantity: card.quantity, exclude: card.exclude_from_draw === true, displayOrder }));
        await client.query(`INSERT INTO deck_cards(deck_id,card_type,card_id,quantity,exclude_from_draw,display_order)
          SELECT $1,r.type,r."cardId",r.quantity,r.exclude,r."displayOrder" FROM jsonb_to_recordset($2::jsonb) AS r(type text,"cardId" text,quantity int,exclude boolean,"displayOrder" int)`, [id, JSON.stringify(rows)]);
        await refreshDeckPreviewMetadata(createDeckRepositoryContext(this.pool, new Map(), 0), id, client);
        saved = (await this.snapshot(client, id, userId))!;
        await client.query('INSERT INTO external_deck_save_receipts(user_id,operation_id,request_hash,deck_id,response) VALUES ($1,$2,$3,$4,$5::jsonb)', [userId, input.operationId, hash, id, JSON.stringify(saved)]);
      }
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
    await this.invalidate();
    return saved;
  }
}

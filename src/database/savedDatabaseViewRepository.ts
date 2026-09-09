import type { Pool, PoolClient } from 'pg';
import type { SavedDatabaseViewDto } from '../api/dto/v1/SavedDatabaseViewDto';
import type {
  SavedDatabaseViewCreateResult,
  SavedDatabaseViewRepository
} from '../repository/SavedDatabaseViewRepository';
import type { SavedDatabaseViewStateV1 } from '../savedDatabaseViews/savedDatabaseViewState';

type SavedDatabaseViewRow = {
  id: string;
  name: string;
  view_state: SavedDatabaseViewStateV1;
  is_pinned: boolean;
  created_at: Date | string;
  updated_at: Date | string;
};

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapRow(row: SavedDatabaseViewRow): SavedDatabaseViewDto {
  return {
    id: row.id,
    name: row.name,
    viewState: row.view_state,
    isPinned: row.is_pinned,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

async function lockUserAndCount(client: PoolClient, userId: string): Promise<number> {
  await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);
  const countResult = await client.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM saved_database_views WHERE user_id = $1',
    [userId]
  );
  return Number(countResult.rows[0]?.count ?? 0);
}

export class PostgreSQLSavedDatabaseViewRepository implements SavedDatabaseViewRepository {
  constructor(private readonly pool: Pool) {}

  async listForUser(userId: string): Promise<SavedDatabaseViewDto[]> {
    const result = await this.pool.query<SavedDatabaseViewRow>(
      `SELECT id, name, view_state, is_pinned, created_at, updated_at
       FROM saved_database_views
       WHERE user_id = $1
       ORDER BY is_pinned DESC, created_at DESC, id DESC`,
      [userId]
    );
    return result.rows.map(mapRow);
  }

  async countForUser(userId: string): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM saved_database_views WHERE user_id = $1',
      [userId]
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  async createForUser(
    userId: string,
    name: string,
    viewState: SavedDatabaseViewStateV1,
    max: number
  ): Promise<SavedDatabaseViewCreateResult> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const count = await lockUserAndCount(client, userId);
      if (count >= max) {
        await client.query('ROLLBACK');
        return { kind: 'limit', count };
      }
      const result = await client.query<SavedDatabaseViewRow>(
        `INSERT INTO saved_database_views (user_id, name, view_state)
         VALUES ($1, $2, $3::jsonb)
         RETURNING id, name, view_state, is_pinned, created_at, updated_at`,
        [userId, name, JSON.stringify(viewState)]
      );
      await client.query('COMMIT');
      return { kind: 'created', view: mapRow(result.rows[0]), count: count + 1 };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateMetadataForUser(
    userId: string,
    id: string,
    updates: { name?: string; isPinned?: boolean }
  ): Promise<SavedDatabaseViewDto | null> {
    const updateName = updates.name !== undefined;
    const updatePinned = updates.isPinned !== undefined;
    const result = await this.pool.query<SavedDatabaseViewRow>(
      `UPDATE saved_database_views
       SET name = CASE WHEN $3 THEN $4 ELSE name END,
           is_pinned = CASE WHEN $5 THEN $6 ELSE is_pinned END,
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, name, view_state, is_pinned, created_at, updated_at`,
      [id, userId, updateName, updates.name ?? '', updatePinned, updates.isPinned ?? false]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async deleteForUser(userId: string, id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM saved_database_views WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async bulkDeleteForUser(userId: string, ids: string[]): Promise<number> {
    const result = await this.pool.query(
      'DELETE FROM saved_database_views WHERE user_id = $1 AND id = ANY($2::uuid[])',
      [userId, ids]
    );
    return result.rowCount ?? 0;
  }
}

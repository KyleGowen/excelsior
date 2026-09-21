import type { Pool, PoolClient } from 'pg';
import type {
  RevokeSupporterEntitlementSourceInput,
  SetSupporterEntitlementSourceInput,
  SupporterEntitlementRepository,
  SupporterEntitlementSource,
  SupporterEntitlementStatus
} from '../repository/SupporterEntitlementRepository';

type ActiveSourceRow = {
  user_id: string;
  source: SupporterEntitlementSource;
  expires_at: Date | string | null;
};

async function auditGrant(client: PoolClient, sourceId: string, input: SetSupporterEntitlementSourceInput) {
  await client.query(
    `INSERT INTO supporter_entitlement_audit
       (entitlement_source_id, user_id, action, source, source_reference, starts_at, expires_at, reason, actor_user_id)
     VALUES ($1, $2, 'GRANTED', $3, $4, $5, $6, $7, $8)`,
    [
      sourceId,
      input.userId,
      input.source,
      input.sourceReference,
      input.startsAt,
      input.expiresAt,
      input.reason,
      input.actorUserId
    ]
  );
}

export class PostgreSQLSupporterEntitlementRepository implements SupporterEntitlementRepository {
  constructor(private readonly pool: Pool) {}

  async getStatuses(userIds: string[], asOf: Date): Promise<Map<string, SupporterEntitlementStatus>> {
    const statuses = new Map<string, SupporterEntitlementStatus>();
    for (const userId of userIds) {
      statuses.set(userId, { isSupporter: false, sources: [], complimentaryExpiresAt: null });
    }
    if (userIds.length === 0) return statuses;

    const result = await this.pool.query<ActiveSourceRow>(
      `SELECT user_id, source, expires_at
       FROM supporter_entitlement_sources
       WHERE user_id = ANY($1::uuid[])
         AND revoked_at IS NULL
         AND starts_at <= $2
         AND (expires_at IS NULL OR expires_at > $2)
       ORDER BY user_id, source`,
      [userIds, asOf]
    );

    for (const row of result.rows) {
      const status = statuses.get(row.user_id) ?? {
        isSupporter: false,
        sources: [],
        complimentaryExpiresAt: null
      };
      status.isSupporter = true;
      if (!status.sources.includes(row.source)) status.sources.push(row.source);
      if (row.source === 'COMPLIMENTARY') {
        status.complimentaryExpiresAt = row.expires_at ? new Date(row.expires_at) : null;
      }
      statuses.set(row.user_id, status);
    }
    return statuses;
  }

  async setSource(input: SetSupporterEntitlementSourceInput): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<{ id: string }>(
        `INSERT INTO supporter_entitlement_sources
           (user_id, source, source_reference, starts_at, expires_at, revoked_at, reason, created_by_user_id)
         VALUES ($1, $2, $3, $4, $5, NULL, $6, $7)
         ON CONFLICT (user_id, source, source_reference)
         DO UPDATE SET starts_at = EXCLUDED.starts_at,
                       expires_at = EXCLUDED.expires_at,
                       revoked_at = NULL,
                       reason = EXCLUDED.reason,
                       created_by_user_id = EXCLUDED.created_by_user_id,
                       updated_at = NOW()
         RETURNING id`,
        [
          input.userId,
          input.source,
          input.sourceReference,
          input.startsAt,
          input.expiresAt,
          input.reason,
          input.actorUserId
        ]
      );
      await auditGrant(client, result.rows[0].id, input);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async revokeSource(input: RevokeSupporterEntitlementSourceInput): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<{
        id: string;
        starts_at: Date | string;
        expires_at: Date | string | null;
      }>(
        `UPDATE supporter_entitlement_sources
         SET revoked_at = $4, updated_at = NOW()
         WHERE user_id = $1 AND source = $2 AND source_reference = $3 AND revoked_at IS NULL
         RETURNING id, starts_at, expires_at`,
        [input.userId, input.source, input.sourceReference, input.revokedAt]
      );
      const row = result.rows[0];
      if (!row) {
        await client.query('ROLLBACK');
        return false;
      }
      await client.query(
        `INSERT INTO supporter_entitlement_audit
           (entitlement_source_id, user_id, action, source, source_reference, starts_at, expires_at, reason, actor_user_id)
         VALUES ($1, $2, 'REVOKED', $3, $4, $5, $6, $7, $8)`,
        [
          row.id,
          input.userId,
          input.source,
          input.sourceReference,
          row.starts_at,
          row.expires_at,
          input.reason,
          input.actorUserId
        ]
      );
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}


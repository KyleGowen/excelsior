import { Pool } from 'pg';
import { User, UserRole } from '../types';
import {
  UserRepository,
  type UserAnalyticsCounts,
  type UserAnalyticsQuery
} from '../repository/UserRepository';
import { PasswordUtils } from '../utils/passwordUtils';
import { USER_ANALYTICS_UTILITY_USERNAMES } from '../constants/userAnalytics';

function isUndefinedTableError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code: string }).code === '42P01';
}

export class PostgreSQLUserRepository implements UserRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async initialize(): Promise<void> {
    // PostgreSQL UserRepository doesn't need to load data from files
    // Data is already in the database from migrations
    console.log('✅ PostgreSQL UserRepository initialized');
  }

  async createUser(name: string, email: string, password: string, role: UserRole = 'USER'): Promise<User> {
    const client = await this.pool.connect();
    try {
      // Hash the password before storing it
      const passwordHash = await PasswordUtils.hashPassword(password);
      
      const result = await client.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, email, passwordHash, role]
      );
      
      const user = result.rows[0];
      return this.mapRowToUser(user);
    } finally {
      client.release();
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const user = result.rows[0];
      return this.mapRowToUser(user);
    } finally {
      client.release();
    }
  }

  async getUserAuthMeta(id: string): Promise<{ auth_provider: string | null } | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT auth_provider FROM users WHERE id = $1',
        [id]
      );
      if (result.rows.length === 0) {
        return undefined;
      }
      const row = result.rows[0];
      return { auth_provider: (row.auth_provider as string | null) ?? null };
    } finally {
      client.release();
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const user = result.rows[0];
      return this.mapRowToUser(user);
    } finally {
      client.release();
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      return this.mapRowToUser(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE firebase_uid = $1',
        [firebaseUid]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      return this.mapRowToUser(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async createGoogleUser(email: string, name: string, firebaseUid: string): Promise<User> {
    const client = await this.pool.connect();
    try {
      let username = name || email.split('@')[0] || 'Google User';
      username = username.trim() || 'Google User';

      let finalUsername = username;
      let suffix = 2;
      for (;;) {
        const existing = await client.query(
          'SELECT id FROM users WHERE username = $1',
          [finalUsername]
        );
        if (existing.rows.length === 0) break;
        finalUsername = `${username}${suffix}`;
        suffix++;
      }

      const result = await client.query(
        `INSERT INTO users (username, email, password_hash, role, auth_provider, firebase_uid)
         VALUES ($1, $2, NULL, 'USER', 'google', $3)
         RETURNING *`,
        [finalUsername, email, firebaseUid]
      );

      return this.mapRowToUser(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async linkGoogleToUser(userId: string, firebaseUid: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        'UPDATE users SET firebase_uid = $1, auth_provider = $2, updated_at = NOW() WHERE id = $3',
        [firebaseUid, 'google', userId]
      );
    } finally {
      client.release();
    }
  }

  private normalizeAuthProvider(value: unknown): string {
    return typeof value === 'string' && value.length > 0 ? value : 'password';
  }

  private mapRowToUser(user: Record<string, unknown>): User {
    return {
      id: user.id as string,
      name: user.username as string,
      email: user.email as string,
      role: user.role as UserRole,
      lastLoginAt: user.last_login_at ? new Date(user.last_login_at as string) : null,
      authProvider: this.normalizeAuthProvider(user.auth_provider),
      displayName: (user.display_name as string | null) ?? null
    };
  }

  async authenticateUser(username: string, password: string): Promise<User | undefined> {
    const client = await this.pool.connect();
    try {
      // First, get the user by username to retrieve the stored hash
      const result = await client.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const user = result.rows[0];

      // Google/OAuth users have no password_hash
      if (!user.password_hash) return undefined;
      
      // Compare the provided password with the stored hash using bcrypt
      const isPasswordValid = await PasswordUtils.comparePassword(password, user.password_hash);
      
      if (!isPasswordValid) {
        return undefined;
      }
      
      return this.mapRowToUser(user);
    } finally {
      client.release();
    }
  }

  async getAllUsers(): Promise<User[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM users ORDER BY created_at');
      
      return result.rows.map((user) => this.mapRowToUser(user));
    } finally {
      client.release();
    }
  }

  async getUsersByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM users WHERE id = ANY($1::uuid[])', [ids]);
      return result.rows.map((user) => this.mapRowToUser(user));
    } finally {
      client.release();
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const client = await this.pool.connect();
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;

      if (updates.name !== undefined) {
        setClause.push(`username = $${paramCount++}`);
        values.push(updates.name);
      }
      if (updates.email !== undefined) {
        setClause.push(`email = $${paramCount++}`);
        values.push(updates.email);
      }
      if (updates.role !== undefined) {
        setClause.push(`role = $${paramCount++}`);
        values.push(updates.role);
      }
      if (updates.displayName !== undefined) {
        setClause.push(`display_name = $${paramCount++}`);
        values.push(updates.displayName);
      }

      if (setClause.length === 0) {
        return this.getUserById(id);
      }

      setClause.push(`updated_at = NOW()`);
      values.push(id);

      // setClause is built from a fixed whitelist of column assignments; values remain parameterized.
      const result = await client.query( // nosemgrep: pg-sql-template-interpolation
        `UPDATE users SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return undefined;
      }

      return this.mapRowToUser(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('DELETE FROM users WHERE id = $1', [id]);
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }

  async updateUserPassword(id: string, newPlainPassword: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const passwordHash = await PasswordUtils.hashPassword(newPlainPassword);
      const result = await client.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [passwordHash, id]
      );
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }

  async updateLastLoginAt(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1', [id]);
      try {
        await client.query(
          `INSERT INTO standard_user_login_hourly_counts (hour_start, login_count)
           SELECT
             TO_TIMESTAMP(FLOOR(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) / 3600) * 3600),
             1
           FROM users
           WHERE id = $1
             AND role = 'USER'
             AND NOT (LOWER(username) = ANY($2::text[]))
           ON CONFLICT (hour_start)
           DO UPDATE SET login_count = standard_user_login_hourly_counts.login_count + 1`,
          [id, [...USER_ANALYTICS_UTILITY_USERNAMES]]
        );
      } catch (error) {
        if (!isUndefinedTableError(error)) {
          throw error;
        }
        console.warn('standard_user_login_hourly_counts table missing; login telemetry was not recorded.');
      }
    } finally {
      client.release();
    }
  }

  async getUserStats(): Promise<{ users: number }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) as count FROM users');
      return {
        users: parseInt(result.rows[0].count)
      };
    } finally {
      client.release();
    }
  }

  async getUserAnalytics(query: UserAnalyticsQuery): Promise<UserAnalyticsCounts> {
    const client = await this.pool.connect();
    const excludedUsernames = [...query.excludedUsernames];
    try {
      const [
        summaryResult,
        monthlyResult,
        recencyResult,
        deckResult,
        collectionResult,
        endpointHitsResult,
        loginTimeResult
      ] = await Promise.all([
        client.query(
          `SELECT
             COUNT(*)::int AS standard_user_accounts,
             COUNT(*) FILTER (WHERE created_at >= $2::timestamp AND created_at < $1::timestamp)::int AS new_standard_accounts,
             COUNT(*) FILTER (WHERE last_login_at >= $1::timestamp - INTERVAL '24 hours' AND last_login_at <= $1::timestamp)::int AS logged_in_last_24_hours,
             COUNT(*) FILTER (WHERE last_login_at >= $1::timestamp - INTERVAL '30 days' AND last_login_at <= $1::timestamp)::int AS logged_in_last_30_days,
             COUNT(*) FILTER (WHERE last_login_at IS NULL OR last_login_at < $1::timestamp - INTERVAL '30 days')::int AS inactive_over_30_days,
             COUNT(*) FILTER (WHERE LOWER(COALESCE(auth_provider, 'password')) = 'google')::int AS google_auth_users,
             COUNT(*) FILTER (WHERE last_login_at IS NOT NULL)::int AS recorded_login_users
           FROM users
           WHERE role = 'USER'
             AND NOT (LOWER(username) = ANY($3::text[]))`,
          [query.asOf, query.acquisitionStart, excludedUsernames]
        ),
        client.query(
          `WITH months AS (
             SELECT generate_series($2::timestamptz, $3::timestamptz - INTERVAL '1 month', INTERVAL '1 month') AS month_start
           ), eligible_users AS (
             SELECT created_at
             FROM users
             WHERE role = 'USER'
               AND NOT (LOWER(username) = ANY($4::text[]))
               AND created_at >= $2
               AND created_at < $3
               AND created_at <= $1::timestamp
           )
           SELECT TO_CHAR(months.month_start AT TIME ZONE 'UTC', 'YYYY-MM') AS month,
                  COUNT(eligible_users.created_at)::int AS count
           FROM months
           LEFT JOIN eligible_users
             ON eligible_users.created_at >= months.month_start
            AND eligible_users.created_at < months.month_start + INTERVAL '1 month'
           GROUP BY months.month_start
           ORDER BY months.month_start`,
          [query.asOf, query.signupChartStart, query.signupChartEnd, excludedUsernames]
        ),
        client.query(
          `SELECT
             COUNT(*) FILTER (WHERE last_login_at >= $1::timestamp - INTERVAL '7 days' AND last_login_at <= $1::timestamp)::int AS days_0_to_7,
             COUNT(*) FILTER (WHERE last_login_at < $1::timestamp - INTERVAL '7 days' AND last_login_at >= $1::timestamp - INTERVAL '30 days')::int AS days_8_to_30,
             COUNT(*) FILTER (WHERE last_login_at < $1::timestamp - INTERVAL '30 days' AND last_login_at >= $1::timestamp - INTERVAL '60 days')::int AS days_31_to_60,
             COUNT(*) FILTER (WHERE last_login_at < $1::timestamp - INTERVAL '60 days' AND last_login_at >= $1::timestamp - INTERVAL '90 days')::int AS days_61_to_90,
             COUNT(*) FILTER (WHERE last_login_at < $1::timestamp - INTERVAL '90 days')::int AS days_90_plus
           FROM users
           WHERE role = 'USER'
             AND NOT (LOWER(username) = ANY($2::text[]))`,
          [query.asOf, excludedUsernames]
        ),
        client.query(
          `SELECT
             COUNT(*)::int AS total_decks,
             COUNT(*) FILTER (WHERE decks.is_valid = TRUE)::int AS legal_decks,
             COUNT(*) FILTER (WHERE decks.is_limited = TRUE)::int AS limited_decks,
             COUNT(*) FILTER (WHERE decks.is_signup_starter_copy = FALSE)::int AS non_starter_decks,
             COUNT(*) FILTER (
               WHERE decks.is_signup_starter_copy = FALSE AND decks.is_valid = TRUE
             )::int AS non_starter_legal_decks
           FROM decks
           INNER JOIN users ON users.id = decks.user_id
           WHERE users.role = 'USER'
             AND NOT (LOWER(users.username) = ANY($1::text[]))`,
          [excludedUsernames]
        ),
        client.query(
          `WITH owned_by_user AS (
             SELECT users.id,
                    COALESCE(SUM(collection_cards.quantity), 0)::bigint AS owned_cards
             FROM users
             LEFT JOIN collections ON collections.user_id = users.id
             LEFT JOIN collection_cards ON collection_cards.collection_id = collections.id
             WHERE users.role = 'USER'
               AND NOT (LOWER(users.username) = ANY($1::text[]))
             GROUP BY users.id
           )
           SELECT
             COUNT(*) FILTER (WHERE owned_cards > 0)::int AS users_with_non_zero_collections,
             COALESCE(SUM(owned_cards), 0)::bigint AS total_owned_cards
           FROM owned_by_user`,
          [excludedUsernames]
        ),
        client.query(
          `SELECT endpoint_key, hit_count
           FROM endpoint_hit_counts
           WHERE hit_count > 0
           ORDER BY endpoint_key`
        ),
        client.query(
          `WITH hours AS (
             SELECT generate_series(0, 23)::int AS hour
           ), counts_by_hour AS (
             SELECT
               EXTRACT(HOUR FROM hour_start AT TIME ZONE 'America/Los_Angeles')::int AS hour,
               COALESCE(
                 SUM(login_count) FILTER (
                   WHERE hour_start >= $1::timestamptz - INTERVAL '24 hours'
                 ),
                 0
               )::bigint AS login_count,
               SUM(login_count)::bigint AS all_time_login_count
             FROM standard_user_login_hourly_counts
             WHERE hour_start <= $1::timestamptz
             GROUP BY EXTRACT(HOUR FROM hour_start AT TIME ZONE 'America/Los_Angeles')
           )
           SELECT
             hours.hour,
             COALESCE(counts_by_hour.login_count, 0)::bigint AS login_count,
             COALESCE(counts_by_hour.all_time_login_count, 0)::bigint AS all_time_login_count
           FROM hours
           LEFT JOIN counts_by_hour USING (hour)
           ORDER BY hours.hour`,
          [query.asOf]
        )
      ]);

      const summary = summaryResult.rows[0] as Record<string, number>;
      const recency = recencyResult.rows[0] as Record<string, number>;
      const deckStatistics = deckResult.rows[0] as Record<string, number>;
      const collectionStatistics = collectionResult.rows[0] as Record<string, number | string>;
      return {
        standardUserAccounts: summary.standard_user_accounts ?? 0,
        newStandardAccounts: summary.new_standard_accounts ?? 0,
        loggedInLast24Hours: summary.logged_in_last_24_hours ?? 0,
        loggedInLast30Days: summary.logged_in_last_30_days ?? 0,
        inactiveOver30Days: summary.inactive_over_30_days ?? 0,
        googleAuthUsers: summary.google_auth_users ?? 0,
        recordedLoginUsers: summary.recorded_login_users ?? 0,
        signupMonths: monthlyResult.rows.map((row: { month: string; count: number }) => ({
          month: row.month,
          count: row.count
        })),
        loginRecency: {
          days0To7: recency.days_0_to_7 ?? 0,
          days8To30: recency.days_8_to_30 ?? 0,
          days31To60: recency.days_31_to_60 ?? 0,
          days61To90: recency.days_61_to_90 ?? 0,
          days90Plus: recency.days_90_plus ?? 0
        },
        deckStatistics: {
          totalDecks: deckStatistics.total_decks ?? 0,
          legalDecks: deckStatistics.legal_decks ?? 0,
          limitedDecks: deckStatistics.limited_decks ?? 0,
          nonStarterDecks: deckStatistics.non_starter_decks ?? 0,
          nonStarterLegalDecks: deckStatistics.non_starter_legal_decks ?? 0
        },
        collectionStatistics: {
          usersWithNonZeroCollections: Number(collectionStatistics.users_with_non_zero_collections ?? 0),
          totalOwnedCards: Number(collectionStatistics.total_owned_cards ?? 0)
        },
        endpointHits: endpointHitsResult.rows.map((row: { endpoint_key: string; hit_count: number | string }) => ({
          endpointKey: row.endpoint_key,
          hitCount: Number(row.hit_count)
        })),
        loginTimeDistribution: {
          hours: loginTimeResult.rows.map((row: {
            hour: number;
            login_count: number | string;
            all_time_login_count: number | string;
          }) => ({
            hour: Number(row.hour),
            count: Number(row.login_count),
            allTimeCount: Number(row.all_time_login_count)
          }))
        }
      };
    } finally {
      client.release();
    }
  }
}

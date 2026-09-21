import type { Pool } from 'pg';
import type {
  StripeSupporterLifecycleState,
  StripeSupporterSubscriptionRecord,
  SupporterBillingRepository,
  SupporterCheckoutAttempt
} from '../repository/SupporterBillingRepository';

type AttemptRow = {
  token: string;
  user_id: string;
  monthly_contribution_usd: number;
  stripe_customer_id: string | null;
  stripe_checkout_session_id: string | null;
  expires_at: Date | string;
  consumed_at: Date | string | null;
};

type SubscriptionRow = {
  stripe_subscription_id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_price_id: string;
  stripe_product_id: string;
  provider_status: string;
  lifecycle_state: StripeSupporterLifecycleState;
  monthly_contribution_usd: number;
  current_period_end: Date | string | null;
  next_renewal_at: Date | string | null;
  cancel_at_period_end: boolean;
  recovery_grace_expires_at: Date | string | null;
  paid_through: Date | string | null;
  last_paid_at: Date | string | null;
  last_provider_event_created_at: Date | string;
  last_provider_event_priority: number;
  last_provider_event_id: string;
};

function toDate(value: Date | string | null): Date | null {
  return value ? new Date(value) : null;
}

function mapAttempt(row: AttemptRow): SupporterCheckoutAttempt {
  return {
    token: row.token,
    userId: row.user_id,
    monthlyContributionUsd: row.monthly_contribution_usd,
    stripeCustomerId: row.stripe_customer_id,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    expiresAt: new Date(row.expires_at),
    consumedAt: toDate(row.consumed_at)
  };
}

function mapSubscription(row: SubscriptionRow): StripeSupporterSubscriptionRecord {
  return {
    subscriptionId: row.stripe_subscription_id,
    userId: row.user_id,
    customerId: row.stripe_customer_id,
    priceId: row.stripe_price_id,
    productId: row.stripe_product_id,
    providerStatus: row.provider_status,
    lifecycleState: row.lifecycle_state,
    monthlyContributionUsd: row.monthly_contribution_usd,
    currentPeriodEnd: toDate(row.current_period_end),
    nextRenewalAt: toDate(row.next_renewal_at),
    cancelAtPeriodEnd: row.cancel_at_period_end,
    recoveryGraceExpiresAt: toDate(row.recovery_grace_expires_at),
    paidThrough: toDate(row.paid_through),
    lastPaidAt: toDate(row.last_paid_at),
    lastProviderEventCreatedAt: new Date(row.last_provider_event_created_at),
    lastProviderEventPriority: row.last_provider_event_priority,
    lastProviderEventId: row.last_provider_event_id
  };
}

export class PostgreSQLSupporterBillingRepository implements SupporterBillingRepository {
  constructor(private readonly pool: Pool) {}

  async getStripeCustomerId(userId: string): Promise<string | null> {
    const result = await this.pool.query<{ stripe_customer_id: string }>(
      'SELECT stripe_customer_id FROM stripe_supporter_customers WHERE user_id = $1',
      [userId]
    );
    return result.rows[0]?.stripe_customer_id ?? null;
  }

  async setStripeCustomer(userId: string, customerId: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO stripe_supporter_customers (user_id, stripe_customer_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET stripe_customer_id = EXCLUDED.stripe_customer_id, updated_at = NOW()`,
      [userId, customerId]
    );
  }

  async createOrReuseCheckoutAttempt(input: {
    userId: string;
    monthlyContributionUsd: number;
    now: Date;
    expiresAt: Date;
  }): Promise<SupporterCheckoutAttempt> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [input.userId]);
      const existing = await client.query<AttemptRow>(
        `SELECT token, user_id, monthly_contribution_usd, stripe_customer_id,
                stripe_checkout_session_id, expires_at, consumed_at
         FROM supporter_checkout_attempts
         WHERE user_id = $1
           AND monthly_contribution_usd = $2
           AND consumed_at IS NULL
           AND expires_at > $3
         ORDER BY created_at DESC
         LIMIT 1`,
        [input.userId, input.monthlyContributionUsd, input.now]
      );
      if (existing.rows[0]) {
        await client.query('COMMIT');
        return mapAttempt(existing.rows[0]);
      }
      const created = await client.query<AttemptRow>(
        `INSERT INTO supporter_checkout_attempts
           (user_id, monthly_contribution_usd, expires_at)
         VALUES ($1, $2, $3)
         RETURNING token, user_id, monthly_contribution_usd, stripe_customer_id,
                   stripe_checkout_session_id, expires_at, consumed_at`,
        [input.userId, input.monthlyContributionUsd, input.expiresAt]
      );
      await client.query('COMMIT');
      return mapAttempt(created.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async attachCheckoutSession(input: {
    token: string;
    customerId: string;
    checkoutSessionId: string;
  }): Promise<void> {
    await this.pool.query(
      `UPDATE supporter_checkout_attempts
       SET stripe_customer_id = $2, stripe_checkout_session_id = $3, updated_at = NOW()
       WHERE token = $1 AND consumed_at IS NULL`,
      [input.token, input.customerId, input.checkoutSessionId]
    );
  }

  async getCheckoutAttempt(token: string): Promise<SupporterCheckoutAttempt | null> {
    const result = await this.pool.query<AttemptRow>(
      `SELECT token, user_id, monthly_contribution_usd, stripe_customer_id,
              stripe_checkout_session_id, expires_at, consumed_at
       FROM supporter_checkout_attempts WHERE token = $1`,
      [token]
    );
    return result.rows[0] ? mapAttempt(result.rows[0]) : null;
  }

  async consumeCheckoutAttempt(token: string, consumedAt: Date): Promise<void> {
    await this.pool.query(
      `UPDATE supporter_checkout_attempts
       SET consumed_at = COALESCE(consumed_at, $2), updated_at = NOW()
       WHERE token = $1`,
      [token, consumedAt]
    );
  }

  async getPaidSubscription(userId: string): Promise<StripeSupporterSubscriptionRecord | null> {
    const result = await this.pool.query<SubscriptionRow>(
      `SELECT * FROM stripe_supporter_subscriptions
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [userId]
    );
    return result.rows[0] ? mapSubscription(result.rows[0]) : null;
  }

  async getSubscriptionById(subscriptionId: string): Promise<StripeSupporterSubscriptionRecord | null> {
    const result = await this.pool.query<SubscriptionRow>(
      'SELECT * FROM stripe_supporter_subscriptions WHERE stripe_subscription_id = $1',
      [subscriptionId]
    );
    return result.rows[0] ? mapSubscription(result.rows[0]) : null;
  }

  async upsertSubscription(record: StripeSupporterSubscriptionRecord): Promise<boolean> {
    const result = await this.pool.query(
      `INSERT INTO stripe_supporter_subscriptions
         (stripe_subscription_id, user_id, stripe_customer_id, stripe_price_id,
          stripe_product_id, provider_status, lifecycle_state, monthly_contribution_usd,
          current_period_end, next_renewal_at, cancel_at_period_end,
          recovery_grace_expires_at, paid_through, last_paid_at,
          last_provider_event_created_at, last_provider_event_priority, last_provider_event_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (stripe_subscription_id)
       DO UPDATE SET user_id = EXCLUDED.user_id,
                     stripe_customer_id = EXCLUDED.stripe_customer_id,
                     stripe_price_id = EXCLUDED.stripe_price_id,
                     stripe_product_id = EXCLUDED.stripe_product_id,
                     provider_status = EXCLUDED.provider_status,
                     lifecycle_state = EXCLUDED.lifecycle_state,
                     monthly_contribution_usd = EXCLUDED.monthly_contribution_usd,
                     current_period_end = EXCLUDED.current_period_end,
                     next_renewal_at = EXCLUDED.next_renewal_at,
                     cancel_at_period_end = EXCLUDED.cancel_at_period_end,
                     recovery_grace_expires_at = EXCLUDED.recovery_grace_expires_at,
                     paid_through = EXCLUDED.paid_through,
                     last_paid_at = EXCLUDED.last_paid_at,
                     last_provider_event_created_at = EXCLUDED.last_provider_event_created_at,
                     last_provider_event_priority = EXCLUDED.last_provider_event_priority,
                     last_provider_event_id = EXCLUDED.last_provider_event_id,
                     updated_at = NOW()
       WHERE stripe_supporter_subscriptions.last_provider_event_created_at < EXCLUDED.last_provider_event_created_at
          OR (stripe_supporter_subscriptions.last_provider_event_created_at = EXCLUDED.last_provider_event_created_at
              AND stripe_supporter_subscriptions.last_provider_event_priority < EXCLUDED.last_provider_event_priority)
          OR (stripe_supporter_subscriptions.last_provider_event_created_at = EXCLUDED.last_provider_event_created_at
              AND stripe_supporter_subscriptions.last_provider_event_priority = EXCLUDED.last_provider_event_priority
              AND stripe_supporter_subscriptions.last_provider_event_id < EXCLUDED.last_provider_event_id)`,
      [
        record.subscriptionId,
        record.userId,
        record.customerId,
        record.priceId,
        record.productId,
        record.providerStatus,
        record.lifecycleState,
        record.monthlyContributionUsd,
        record.currentPeriodEnd,
        record.nextRenewalAt,
        record.cancelAtPeriodEnd,
        record.recoveryGraceExpiresAt,
        record.paidThrough,
        record.lastPaidAt,
        record.lastProviderEventCreatedAt,
        record.lastProviderEventPriority,
        record.lastProviderEventId
      ]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async claimWebhookEvent(input: {
    eventId: string;
    eventType: string;
    eventCreatedAt: Date;
  }): Promise<boolean> {
    const result = await this.pool.query(
      `INSERT INTO stripe_supporter_webhook_events
         (stripe_event_id, event_type, event_created_at, processing_status)
       VALUES ($1, $2, $3, 'PROCESSING')
       ON CONFLICT (stripe_event_id)
       DO UPDATE SET processing_status = 'PROCESSING', error_code = NULL, updated_at = NOW()
       WHERE stripe_supporter_webhook_events.processing_status = 'FAILED'
          OR (stripe_supporter_webhook_events.processing_status = 'PROCESSING'
              AND stripe_supporter_webhook_events.updated_at < NOW() - INTERVAL '5 minutes')`,
      [input.eventId, input.eventType, input.eventCreatedAt]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async completeWebhookEvent(eventId: string): Promise<void> {
    await this.pool.query(
      `UPDATE stripe_supporter_webhook_events
       SET processing_status = 'PROCESSED', processed_at = NOW(), updated_at = NOW()
       WHERE stripe_event_id = $1`,
      [eventId]
    );
  }

  async failWebhookEvent(eventId: string, errorCode: string): Promise<void> {
    await this.pool.query(
      `UPDATE stripe_supporter_webhook_events
       SET processing_status = 'FAILED', error_code = $2, updated_at = NOW()
       WHERE stripe_event_id = $1`,
      [eventId, errorCode.slice(0, 128)]
    );
  }
}

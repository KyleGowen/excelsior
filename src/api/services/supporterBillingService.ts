import { createHash, randomBytes } from 'crypto';
import type Stripe from 'stripe';
import {
  SUPPORTER_MIN_MONTHLY_USD,
  SUPPORTER_PRESET_MONTHLY_USD,
  SUPPORTER_RECOVERY_GRACE_DAYS,
  assertSupporterCheckoutConfigured,
  isSupporterCheckoutConfigured,
  type SupporterBillingConfig
} from '../config/supporterBillingConfig';
import type {
  StripeSupporterSubscriptionRecord,
  SupporterBillingRepository
} from '../../repository/SupporterBillingRepository';
import type { SupporterEntitlementService } from './supporterEntitlementService';
import type { StripeSupporterClient } from './stripeSupporterClient';

const CHECKOUT_ATTEMPT_TTL_MS = 30 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type SupporterBillingErrorCode =
  | 'SUPPORTER_BILLING_UNAVAILABLE'
  | 'SUPPORTER_CONTRIBUTION_INVALID'
  | 'SUPPORTER_ALREADY_PAID'
  | 'SUPPORTER_CHECKOUT_ERROR'
  | 'SUPPORTER_PORTAL_UNAVAILABLE'
  | 'SUPPORTER_WEBHOOK_INVALID';

export class SupporterBillingError extends Error {
  constructor(
    public readonly code: SupporterBillingErrorCode,
    message: string,
    public readonly httpStatus: number
  ) {
    super(message);
    this.name = 'SupporterBillingError';
  }
}

export interface SupporterBillingStatus {
  isSupporter: boolean;
  sources: Array<'COMPLIMENTARY' | 'STRIPE'>;
  complimentaryExpiresAt: string | null;
  billingAvailable: boolean;
  minimumMonthlyContributionUsd: number;
  maximumMonthlyContributionUsd: number;
  presetMonthlyContributionUsd: number[];
  paid: null | {
    state: StripeSupporterSubscriptionRecord['lifecycleState'];
    monthlyContributionUsd: number;
    currentPeriodEnd: string | null;
    nextRenewalAt: string | null;
    recoveryGraceExpiresAt: string | null;
  };
}

type ReconcileReason = 'PAID' | 'FAILED' | 'UPDATE' | 'FULL_REFUND' | 'PARTIAL_REFUND' | 'DISPUTE';

const RECONCILE_EVENT_PRIORITY: Record<ReconcileReason, number> = {
  UPDATE: 10,
  FAILED: 20,
  PAID: 30,
  PARTIAL_REFUND: 40,
  FULL_REFUND: 50,
  DISPUTE: 50
};

function objectId(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === 'string' ? id : null;
  }
  return null;
}

function unixDate(value: number | null | undefined): Date | null {
  return typeof value === 'number' ? new Date(value * 1000) : null;
}

function iso(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  if (invoice.parent?.type !== 'subscription_details') return null;
  return objectId(invoice.parent.subscription_details?.subscription);
}

function chargeInvoiceId(charge: Stripe.Charge): string | null {
  return objectId((charge as Stripe.Charge & { invoice?: unknown }).invoice);
}

export class SupporterBillingService {
  constructor(
    private readonly config: SupporterBillingConfig,
    private readonly repository: SupporterBillingRepository,
    private readonly entitlementService: SupporterEntitlementService,
    private readonly stripeClient: StripeSupporterClient | null,
    private readonly now: () => Date = () => new Date()
  ) {}

  isBillingAvailable(): boolean {
    return isSupporterCheckoutConfigured(this.config) && this.stripeClient !== null;
  }

  validateMonthlyContribution(value: unknown): number {
    if (
      typeof value !== 'number'
      || !Number.isSafeInteger(value)
      || value < SUPPORTER_MIN_MONTHLY_USD
      || value > this.config.maxMonthlyContributionUsd
    ) {
      throw new SupporterBillingError(
        'SUPPORTER_CONTRIBUTION_INVALID',
        `Monthly support must be a whole dollar amount from $${SUPPORTER_MIN_MONTHLY_USD} to $${this.config.maxMonthlyContributionUsd}.`,
        400
      );
    }
    return value;
  }

  async getStatus(userId: string | null): Promise<SupporterBillingStatus> {
    if (!userId) {
      return {
        isSupporter: false,
        sources: [],
        complimentaryExpiresAt: null,
        billingAvailable: this.isBillingAvailable(),
        minimumMonthlyContributionUsd: SUPPORTER_MIN_MONTHLY_USD,
        maximumMonthlyContributionUsd: this.config.maxMonthlyContributionUsd,
        presetMonthlyContributionUsd: [...SUPPORTER_PRESET_MONTHLY_USD],
        paid: null
      };
    }
    const [entitlement, paid] = await Promise.all([
      this.entitlementService.getStatus(userId),
      this.repository.getPaidSubscription(userId)
    ]);
    return {
      isSupporter: entitlement.isSupporter,
      sources: entitlement.sources,
      complimentaryExpiresAt: iso(entitlement.complimentaryExpiresAt),
      billingAvailable: this.isBillingAvailable(),
      minimumMonthlyContributionUsd: SUPPORTER_MIN_MONTHLY_USD,
      maximumMonthlyContributionUsd: this.config.maxMonthlyContributionUsd,
      presetMonthlyContributionUsd: [...SUPPORTER_PRESET_MONTHLY_USD],
      paid: paid
        ? {
            state: paid.lifecycleState,
            monthlyContributionUsd: paid.monthlyContributionUsd,
            currentPeriodEnd: iso(paid.currentPeriodEnd),
            nextRenewalAt: iso(paid.nextRenewalAt),
            recoveryGraceExpiresAt: iso(paid.recoveryGraceExpiresAt)
          }
        : null
    };
  }

  async createCheckout(userId: string, monthlyContribution: unknown): Promise<{
    url: string;
    expiresAt: string;
  }> {
    const monthlyContributionUsd = this.validateMonthlyContribution(monthlyContribution);
    if (!this.isBillingAvailable()) {
      throw new SupporterBillingError(
        'SUPPORTER_BILLING_UNAVAILABLE',
        'Supporter checkout is temporarily unavailable.',
        503
      );
    }
    assertSupporterCheckoutConfigured(this.config);
    const stripeClient = this.stripeClient;
    if (!stripeClient) throw new Error('Stripe client unavailable after availability check');

    const existing = await this.repository.getPaidSubscription(userId);
    if (existing && ['ACTIVE', 'SCHEDULED_CANCELLATION', 'RECOVERY'].includes(existing.lifecycleState)) {
      const accessUntil = existing.recoveryGraceExpiresAt ?? existing.paidThrough ?? existing.currentPeriodEnd;
      if (!accessUntil || accessUntil.getTime() > this.now().getTime()) {
        throw new SupporterBillingError(
          'SUPPORTER_ALREADY_PAID',
          'This account already has paid Supporter access. Manage the existing membership instead.',
          409
        );
      }
    }

    await this.validateConfiguredPrice();
    const now = this.now();
    const expiresAt = new Date(now.getTime() + CHECKOUT_ATTEMPT_TTL_MS);
    const attempt = await this.repository.createOrReuseCheckoutAttempt({
      userId,
      monthlyContributionUsd,
      now,
      expiresAt
    });

    if (attempt.stripeCheckoutSessionId) {
      throw new SupporterBillingError(
        'SUPPORTER_CHECKOUT_ERROR',
        'A checkout is already being prepared. Please try again in a moment.',
        409
      );
    }

    try {
      let customerId = await this.repository.getStripeCustomerId(userId);
      if (!customerId) {
        const customerKey = createHash('sha256').update(userId).digest('hex');
        const customer = await stripeClient.createCustomer(`supporter_customer_${customerKey}`);
        customerId = customer.id;
        await this.repository.setStripeCustomer(userId, customerId);
      }

      const session = await stripeClient.createCheckoutSession(
        {
          mode: 'subscription',
          customer: customerId,
          client_reference_id: attempt.token,
          integration_identifier: `excelsior_supporter_${randomBytes(12).toString('hex')}`,
          line_items: [
            {
              price: this.config.priceId,
              quantity: monthlyContributionUsd,
              adjustable_quantity: {
                enabled: true,
                minimum: SUPPORTER_MIN_MONTHLY_USD,
                maximum: this.config.maxMonthlyContributionUsd
              }
            }
          ],
          subscription_data: {
            metadata: { supporter_attempt: attempt.token }
          },
          automatic_tax: { enabled: false },
          success_url: `${this.config.appOrigin}/supporter?supporter=confirm`,
          cancel_url: `${this.config.appOrigin}/supporter?supporter=cancel`,
          expires_at: Math.floor(attempt.expiresAt.getTime() / 1000)
        },
        `supporter_checkout_${attempt.token}`
      );
      if (!session.url || new URL(session.url).protocol !== 'https:') {
        throw new Error('Stripe Checkout returned no secure URL');
      }
      await this.repository.attachCheckoutSession({
        token: attempt.token,
        customerId,
        checkoutSessionId: session.id
      });
      return { url: session.url, expiresAt: attempt.expiresAt.toISOString() };
    } catch {
      throw new SupporterBillingError(
        'SUPPORTER_CHECKOUT_ERROR',
        'Supporter checkout could not be started. Please try again.',
        502
      );
    }
  }

  async createPortalSession(userId: string): Promise<{ url: string }> {
    if (!this.isBillingAvailable()) {
      throw new SupporterBillingError(
        'SUPPORTER_BILLING_UNAVAILABLE',
        'Supporter billing is temporarily unavailable.',
        503
      );
    }
    assertSupporterCheckoutConfigured(this.config);
    const stripeClient = this.stripeClient;
    if (!stripeClient) throw new Error('Stripe client unavailable after availability check');
    const [customerId, paid] = await Promise.all([
      this.repository.getStripeCustomerId(userId),
      this.repository.getPaidSubscription(userId)
    ]);
    if (!customerId || !paid) {
      throw new SupporterBillingError(
        'SUPPORTER_PORTAL_UNAVAILABLE',
        'No paid Supporter membership is available to manage.',
        404
      );
    }
    try {
      const session = await stripeClient.createPortalSession({
        customer: customerId,
        configuration: this.config.portalConfigurationId,
        return_url: `${this.config.appOrigin}/supporter?supporter=return`
      });
      if (new URL(session.url).protocol !== 'https:') throw new Error('Insecure portal URL');
      return { url: session.url };
    } catch {
      throw new SupporterBillingError(
        'SUPPORTER_PORTAL_UNAVAILABLE',
        'Membership management is temporarily unavailable. Please try again.',
        502
      );
    }
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    if (!this.isBillingAvailable()) {
      throw new SupporterBillingError('SUPPORTER_BILLING_UNAVAILABLE', 'Billing unavailable', 503);
    }
    assertSupporterCheckoutConfigured(this.config);
    const stripeClient = this.stripeClient;
    if (!stripeClient) throw new Error('Stripe client unavailable after availability check');
    try {
      return stripeClient.constructWebhookEvent(rawBody, signature, this.config.webhookSecret);
    } catch {
      throw new SupporterBillingError('SUPPORTER_WEBHOOK_INVALID', 'Invalid webhook signature', 400);
    }
  }

  async processWebhook(event: Stripe.Event): Promise<void> {
    if (!this.stripeClient) {
      throw new SupporterBillingError('SUPPORTER_BILLING_UNAVAILABLE', 'Billing unavailable', 503);
    }
    const eventDate = new Date(event.created * 1000);
    const claimed = await this.repository.claimWebhookEvent({
      eventId: event.id,
      eventType: event.type,
      eventCreatedAt: eventDate
    });
    if (!claimed) return;

    try {
      if (event.type === 'checkout.session.completed') {
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, event);
      } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoiceSubscriptionId(invoice);
        if (subscriptionId) {
          await this.reconcileSubscription(
            subscriptionId,
            event,
            event.type === 'invoice.paid' ? 'PAID' : 'FAILED'
          );
        }
      } else if (
        event.type === 'customer.subscription.created'
        || event.type === 'customer.subscription.updated'
        || event.type === 'customer.subscription.deleted'
      ) {
        const subscription = event.data.object as Stripe.Subscription;
        await this.reconcileSubscription(subscription.id, event, 'UPDATE');
      } else if (event.type === 'charge.refunded') {
        const charge = event.data.object as Stripe.Charge;
        const invoiceId = chargeInvoiceId(charge);
        if (invoiceId) {
          const invoice = await this.stripeClient.retrieveInvoice(invoiceId);
          const subscriptionId = invoiceSubscriptionId(invoice);
          if (subscriptionId) {
            const reason = charge.amount_refunded >= charge.amount ? 'FULL_REFUND' : 'PARTIAL_REFUND';
            await this.reconcileSubscription(
              subscriptionId,
              event,
              reason
            );
            if (reason === 'FULL_REFUND') {
              await this.stripeClient.cancelSubscription(
                subscriptionId,
                `supporter_full_refund_${event.id}`
              );
            }
          }
        }
      } else if (
        event.type === 'charge.dispute.created'
        || event.type === 'charge.dispute.closed'
        || event.type === 'charge.dispute.funds_reinstated'
        || event.type === 'charge.dispute.funds_withdrawn'
      ) {
        await this.handleDispute(event.data.object as Stripe.Dispute, event);
      }
      await this.repository.completeWebhookEvent(event.id);
    } catch (error) {
      const code = error instanceof SupporterBillingError ? error.code : 'SUPPORTER_WEBHOOK_PROCESSING_ERROR';
      await this.repository.failWebhookEvent(event.id, code);
      throw error;
    }
  }

  private async validateConfiguredPrice(): Promise<void> {
    assertSupporterCheckoutConfigured(this.config);
    if (!this.stripeClient) throw new Error('Stripe client unavailable');
    const price = await this.stripeClient.retrievePrice(this.config.priceId);
    const productId = objectId(price.product);
    const valid = price.active
      && price.livemode === this.config.liveMode
      && price.type === 'recurring'
      && price.currency === 'usd'
      && price.unit_amount === 100
      && price.billing_scheme === 'per_unit'
      && price.recurring?.interval === 'month'
      && price.recurring.interval_count === 1
      && price.recurring.usage_type === 'licensed'
      && productId === this.config.productId
      && (!this.config.priceLookupKey || price.lookup_key === this.config.priceLookupKey);
    if (!valid) {
      throw new SupporterBillingError(
        'SUPPORTER_BILLING_UNAVAILABLE',
        'Supporter checkout is temporarily unavailable.',
        503
      );
    }
  }

  private async handleDispute(dispute: Stripe.Dispute, event: Stripe.Event): Promise<void> {
    if (!this.stripeClient) throw new Error('Stripe client unavailable');
    const chargeId = objectId(dispute.charge);
    if (!chargeId) return;
    const charge = await this.stripeClient.retrieveCharge(chargeId);
    const invoiceId = chargeInvoiceId(charge);
    if (!invoiceId) return;
    const invoice = await this.stripeClient.retrieveInvoice(invoiceId);
    const subscriptionId = invoiceSubscriptionId(invoice);
    if (!subscriptionId) return;
    const restored = event.type === 'charge.dispute.funds_reinstated'
      || (event.type === 'charge.dispute.closed' && dispute.status === 'won');
    await this.reconcileSubscription(subscriptionId, event, restored ? 'PAID' : 'DISPUTE');
  }

  private async handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
    event: Stripe.Event
  ): Promise<void> {
    if (session.mode !== 'subscription' || !session.client_reference_id) return;
    const attempt = await this.repository.getCheckoutAttempt(session.client_reference_id);
    const customerId = objectId(session.customer);
    const subscriptionId = objectId(session.subscription);
    if (!attempt || !customerId || !subscriptionId || attempt.consumedAt) return;
    if (
      attempt.stripeCheckoutSessionId !== session.id
      || attempt.stripeCustomerId !== customerId
    ) return;
    await this.repository.setStripeCustomer(attempt.userId, customerId);
    await this.repository.consumeCheckoutAttempt(attempt.token, new Date(event.created * 1000));
    await this.reconcileSubscription(subscriptionId, event, 'UPDATE');
  }

  private async reconcileSubscription(
    subscriptionId: string,
    event: Stripe.Event,
    reason: ReconcileReason
  ): Promise<void> {
    if (!this.stripeClient) throw new Error('Stripe client unavailable');
    assertSupporterCheckoutConfigured(this.config);
    const subscription = await this.stripeClient.retrieveSubscription(subscriptionId);
    const previous = await this.repository.getSubscriptionById(subscription.id);
    const attemptToken = subscription.metadata?.supporter_attempt;
    const attempt = attemptToken ? await this.repository.getCheckoutAttempt(attemptToken) : null;
    const userId = previous?.userId ?? attempt?.userId;
    if (!userId) return;

    const item = subscription.items.data[0];
    const productId = item ? objectId(item.price.product) : null;
    const quantity = item?.quantity;
    const configurationValid = subscription.livemode === this.config.liveMode
      && subscription.currency === 'usd'
      && subscription.items.data.length === 1
      && item?.price.id === this.config.priceId
      && item.price.currency === 'usd'
      && item.price.unit_amount === 100
      && item.price.recurring?.interval === 'month'
      && item.price.recurring.interval_count === 1
      && item.price.recurring.usage_type === 'licensed'
      && productId === this.config.productId
      && typeof quantity === 'number'
      && Number.isSafeInteger(quantity)
      && quantity >= SUPPORTER_MIN_MONTHLY_USD
      && quantity <= this.config.maxMonthlyContributionUsd;

    const eventDate = new Date(event.created * 1000);
    const currentPeriodEnd = unixDate(item?.current_period_end);
    const customerId = objectId(subscription.customer);
    if (!configurationValid || !currentPeriodEnd || !customerId || !item || !productId || !quantity) {
      await this.entitlementService.setStripeSubscription({
        userId,
        subscriptionId,
        active: false,
        reason: 'stripe_configuration_invalid'
      });
      return;
    }

    let paidThrough = previous?.paidThrough ?? null;
    let lastPaidAt = previous?.lastPaidAt ?? null;
    let recoveryGraceExpiresAt = previous?.recoveryGraceExpiresAt ?? null;
    let lifecycleState: StripeSupporterSubscriptionRecord['lifecycleState'] = 'PENDING';

    if (reason === 'PAID') {
      paidThrough = currentPeriodEnd;
      lastPaidAt = eventDate;
      recoveryGraceExpiresAt = null;
      lifecycleState = subscription.status === 'active'
        ? (subscription.cancel_at_period_end ? 'SCHEDULED_CANCELLATION' : 'ACTIVE')
        : 'INACTIVE';
    } else if (reason === 'FAILED') {
      recoveryGraceExpiresAt = previous?.lifecycleState === 'RECOVERY'
        && previous.recoveryGraceExpiresAt
        && previous.recoveryGraceExpiresAt.getTime() > eventDate.getTime()
        ? previous.recoveryGraceExpiresAt
        : new Date(eventDate.getTime() + SUPPORTER_RECOVERY_GRACE_DAYS * DAY_MS);
      lifecycleState = 'RECOVERY';
    } else if (reason === 'FULL_REFUND' || reason === 'DISPUTE') {
      lifecycleState = 'INACTIVE';
      paidThrough = eventDate;
      recoveryGraceExpiresAt = null;
    } else if (reason === 'PARTIAL_REFUND') {
      lifecycleState = 'MANUAL_REVIEW';
    } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
      lifecycleState = paidThrough && paidThrough.getTime() > eventDate.getTime()
        ? 'SCHEDULED_CANCELLATION'
        : 'INACTIVE';
    } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
      lifecycleState = recoveryGraceExpiresAt && recoveryGraceExpiresAt.getTime() > eventDate.getTime()
        ? 'RECOVERY'
        : 'INACTIVE';
    } else if (
      subscription.status === 'active'
      && paidThrough
      && paidThrough.getTime() > eventDate.getTime()
    ) {
      lifecycleState = subscription.cancel_at_period_end ? 'SCHEDULED_CANCELLATION' : 'ACTIVE';
    }

    const record: StripeSupporterSubscriptionRecord = {
      subscriptionId: subscription.id,
      userId,
      customerId,
      priceId: item.price.id,
      productId,
      providerStatus: subscription.status,
      lifecycleState,
      monthlyContributionUsd: quantity,
      currentPeriodEnd,
      nextRenewalAt: subscription.cancel_at_period_end ? null : currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      recoveryGraceExpiresAt,
      paidThrough,
      lastPaidAt,
      lastProviderEventCreatedAt: eventDate,
      lastProviderEventPriority: RECONCILE_EVENT_PRIORITY[reason],
      lastProviderEventId: event.id
    };
    const applied = await this.repository.upsertSubscription(record);
    if (!applied) return;

    const accessUntil = lifecycleState === 'RECOVERY'
      ? recoveryGraceExpiresAt
      : paidThrough;
    const active = ['ACTIVE', 'SCHEDULED_CANCELLATION', 'RECOVERY', 'MANUAL_REVIEW'].includes(lifecycleState)
      && Boolean(accessUntil && accessUntil.getTime() > this.now().getTime());
    await this.entitlementService.setStripeSubscription({
      userId,
      subscriptionId,
      active,
      currentPeriodEnd: active ? accessUntil : null,
      reason: `stripe_${reason.toLowerCase()}`
    });
  }
}

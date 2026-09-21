import type Stripe from 'stripe';
import { SupporterBillingService } from '../../../../src/api/services/supporterBillingService';
import type { SupporterBillingConfig } from '../../../../src/api/config/supporterBillingConfig';
import type { StripeSupporterClient } from '../../../../src/api/services/stripeSupporterClient';
import type { SupporterEntitlementService } from '../../../../src/api/services/supporterEntitlementService';
import type {
  StripeSupporterSubscriptionRecord,
  SupporterBillingRepository,
  SupporterCheckoutAttempt
} from '../../../../src/repository/SupporterBillingRepository';

const now = new Date('2026-09-16T12:00:00.000Z');

const config: SupporterBillingConfig = {
  enabled: true,
  liveMode: false,
  secretKey: 'rk_test_placeholder',
  webhookSecret: 'whsec_placeholder',
  productId: 'prod_supporter',
  priceId: 'price_supporter',
  priceLookupKey: 'supporter_monthly_unit',
  portalConfigurationId: 'bpc_supporter',
  appOrigin: 'http://localhost:5173',
  maxMonthlyContributionUsd: 1000
};

function checkoutAttempt(amount = 5): SupporterCheckoutAttempt {
  return {
    token: '11111111-1111-4111-8111-111111111111',
    userId: 'user-1',
    monthlyContributionUsd: amount,
    stripeCustomerId: null,
    stripeCheckoutSessionId: null,
    expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
    consumedAt: null
  };
}

function repository(): jest.Mocked<SupporterBillingRepository> {
  return {
    getStripeCustomerId: jest.fn(async () => null),
    setStripeCustomer: jest.fn(async () => undefined),
    createOrReuseCheckoutAttempt: jest.fn(async ({ monthlyContributionUsd }) => checkoutAttempt(monthlyContributionUsd)),
    attachCheckoutSession: jest.fn(async () => undefined),
    getCheckoutAttempt: jest.fn(async () => checkoutAttempt()),
    consumeCheckoutAttempt: jest.fn(async () => undefined),
    getPaidSubscription: jest.fn(async () => null),
    getSubscriptionById: jest.fn(async () => null),
    upsertSubscription: jest.fn(async () => true),
    claimWebhookEvent: jest.fn(async () => true),
    completeWebhookEvent: jest.fn(async () => undefined),
    failWebhookEvent: jest.fn(async () => undefined)
  } as unknown as jest.Mocked<SupporterBillingRepository>;
}

function stripeClient(): jest.Mocked<StripeSupporterClient> {
  return {
    retrievePrice: jest.fn(async () => ({
      id: 'price_supporter',
      active: true,
      livemode: false,
      type: 'recurring',
      currency: 'usd',
      unit_amount: 100,
      billing_scheme: 'per_unit',
      lookup_key: 'supporter_monthly_unit',
      product: 'prod_supporter',
      recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed' }
    } as unknown as Stripe.Price)),
    createCustomer: jest.fn(async () => ({ id: 'cus_supporter' } as Stripe.Customer)),
    createCheckoutSession: jest.fn(async () => ({
      id: 'cs_supporter',
      url: 'https://checkout.stripe.com/test/session'
    } as Stripe.Checkout.Session)),
    createPortalSession: jest.fn(async () => ({
      id: 'bps_supporter',
      url: 'https://billing.stripe.com/test/session'
    } as Stripe.BillingPortal.Session)),
    retrieveSubscription: jest.fn(),
    cancelSubscription: jest.fn(async () => subscription(5)),
    retrieveInvoice: jest.fn(),
    retrieveCharge: jest.fn(),
    constructWebhookEvent: jest.fn()
  } as unknown as jest.Mocked<StripeSupporterClient>;
}

function entitlementService() {
  return {
    getStatus: jest.fn(async () => ({
      isSupporter: false,
      sources: [],
      complimentaryExpiresAt: null
    })),
    setStripeSubscription: jest.fn(async () => ({
      isSupporter: true,
      sources: ['STRIPE'],
      complimentaryExpiresAt: null
    }))
  } as unknown as jest.Mocked<SupporterEntitlementService>;
}

function subscription(quantity: number): Stripe.Subscription {
  return {
    id: 'sub_supporter',
    livemode: false,
    currency: 'usd',
    customer: 'cus_supporter',
    status: 'active',
    cancel_at_period_end: false,
    metadata: { supporter_attempt: checkoutAttempt().token },
    items: {
      data: [{
        id: 'si_supporter',
        quantity,
        current_period_end: Math.floor(new Date('2026-10-16T12:00:00.000Z').getTime() / 1000),
        price: {
          id: 'price_supporter',
          product: 'prod_supporter',
          currency: 'usd',
          unit_amount: 100,
          recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed' }
        }
      }]
    }
  } as unknown as Stripe.Subscription;
}

function paidRecord(overrides: Partial<StripeSupporterSubscriptionRecord> = {}): StripeSupporterSubscriptionRecord {
  return {
    subscriptionId: 'sub_supporter',
    userId: 'user-1',
    customerId: 'cus_supporter',
    priceId: 'price_supporter',
    productId: 'prod_supporter',
    providerStatus: 'active',
    lifecycleState: 'ACTIVE',
    monthlyContributionUsd: 5,
    currentPeriodEnd: new Date('2026-10-16T12:00:00.000Z'),
    nextRenewalAt: new Date('2026-10-16T12:00:00.000Z'),
    cancelAtPeriodEnd: false,
    recoveryGraceExpiresAt: null,
    paidThrough: new Date('2026-10-16T12:00:00.000Z'),
    lastPaidAt: new Date('2026-09-16T12:00:00.000Z'),
    lastProviderEventCreatedAt: new Date('2026-09-16T12:00:00.000Z'),
    lastProviderEventPriority: 30,
    lastProviderEventId: 'evt_initial_paid',
    ...overrides
  };
}

describe('SupporterBillingService', () => {
  it.each([3, 5, 10, 999])('maps $%i to the same configured Price quantity', async (amount) => {
    const repo = repository();
    const stripe = stripeClient();
    const service = new SupporterBillingService(config, repo, entitlementService(), stripe, () => now);

    await expect(service.createCheckout('user-1', amount)).resolves.toEqual({
      url: 'https://checkout.stripe.com/test/session',
      expiresAt: checkoutAttempt(amount).expiresAt.toISOString()
    });

    expect(stripe.createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'subscription',
      customer: 'cus_supporter',
      line_items: [{
        price: 'price_supporter',
        quantity: amount,
        adjustable_quantity: { enabled: true, minimum: 3, maximum: 1000 }
      }],
      automatic_tax: { enabled: false },
      success_url: 'http://localhost:5173/supporter?supporter=confirm',
      cancel_url: 'http://localhost:5173/supporter?supporter=cancel'
    }), expect.stringContaining('supporter_checkout_'));
    const params = stripe.createCheckoutSession.mock.calls[0][0];
    expect(params).not.toHaveProperty('payment_method_types');
    expect(params.client_reference_id).toBe(checkoutAttempt().token);
    expect(params.subscription_data?.metadata).toEqual({ supporter_attempt: checkoutAttempt().token });
  });

  it.each([undefined, null, 2, 3.5, -5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])(
    'rejects an invalid contribution value %p before contacting Stripe',
    async (amount) => {
      const stripe = stripeClient();
      const service = new SupporterBillingService(config, repository(), entitlementService(), stripe, () => now);
      await expect(service.createCheckout('user-1', amount)).rejects.toMatchObject({
        code: 'SUPPORTER_CONTRIBUTION_INVALID',
        httpStatus: 400
      });
      expect(stripe.retrievePrice).not.toHaveBeenCalled();
    }
  );

  it('fails closed when the configured Stripe Price contract drifts', async () => {
    const stripe = stripeClient();
    stripe.retrievePrice.mockResolvedValue({
      ...await stripe.retrievePrice('price_supporter'),
      unit_amount: 300
    } as Stripe.Price);
    stripe.retrievePrice.mockClear();
    const service = new SupporterBillingService(config, repository(), entitlementService(), stripe, () => now);
    await expect(service.createCheckout('user-1', 5)).rejects.toMatchObject({
      code: 'SUPPORTER_BILLING_UNAVAILABLE',
      httpStatus: 503
    });
    expect(stripe.createCheckoutSession).not.toHaveBeenCalled();
  });

  it('refuses another checkout while paid access is active', async () => {
    const repo = repository();
    repo.getPaidSubscription.mockResolvedValue({
      lifecycleState: 'ACTIVE',
      currentPeriodEnd: new Date('2026-10-16T12:00:00.000Z'),
      paidThrough: new Date('2026-10-16T12:00:00.000Z'),
      recoveryGraceExpiresAt: null
    } as StripeSupporterSubscriptionRecord);
    const stripe = stripeClient();
    const service = new SupporterBillingService(config, repo, entitlementService(), stripe, () => now);
    await expect(service.createCheckout('user-1', 5)).rejects.toMatchObject({
      code: 'SUPPORTER_ALREADY_PAID',
      httpStatus: 409
    });
    expect(stripe.retrievePrice).not.toHaveBeenCalled();
  });

  it('creates a fresh portal Session for the server-owned Customer and explicit configuration', async () => {
    const repo = repository();
    repo.getStripeCustomerId.mockResolvedValue('cus_supporter');
    repo.getPaidSubscription.mockResolvedValue({ lifecycleState: 'ACTIVE' } as StripeSupporterSubscriptionRecord);
    const stripe = stripeClient();
    const service = new SupporterBillingService(config, repo, entitlementService(), stripe, () => now);
    await expect(service.createPortalSession('user-1')).resolves.toEqual({
      url: 'https://billing.stripe.com/test/session'
    });
    expect(stripe.createPortalSession).toHaveBeenCalledWith({
      customer: 'cus_supporter',
      configuration: 'bpc_supporter',
      return_url: 'http://localhost:5173/supporter?supporter=return'
    });
  });

  it.each([
    [2, false],
    [3, true],
    [5, true],
    [10, true],
    [100, true]
  ])('validates canonical quantity %i before changing the paid entitlement', async (quantity, active) => {
    const repo = repository();
    repo.getCheckoutAttempt.mockResolvedValue(checkoutAttempt(quantity));
    const stripe = stripeClient();
    stripe.retrieveSubscription.mockResolvedValue(subscription(quantity));
    const entitlement = entitlementService();
    const service = new SupporterBillingService(config, repo, entitlement, stripe, () => now);
    const event = {
      id: `evt_paid_${quantity}`,
      type: 'invoice.paid',
      created: Math.floor(now.getTime() / 1000),
      data: {
        object: {
          parent: {
            type: 'subscription_details',
            subscription_details: { subscription: 'sub_supporter' }
          }
        }
      }
    } as unknown as Stripe.Event;

    await service.processWebhook(event);

    expect(entitlement.setStripeSubscription).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      subscriptionId: 'sub_supporter',
      active
    }));
    if (active) {
      expect(repo.upsertSubscription).toHaveBeenCalledWith(expect.objectContaining({
        monthlyContributionUsd: quantity,
        lifecycleState: 'ACTIVE',
        lastProviderEventPriority: 30
      }));
    } else {
      expect(repo.upsertSubscription).not.toHaveBeenCalled();
    }
    expect(repo.completeWebhookEvent).toHaveBeenCalledWith(event.id);
  });

  it('deduplicates a webhook before any provider retrieval', async () => {
    const repo = repository();
    repo.claimWebhookEvent.mockResolvedValue(false);
    const stripe = stripeClient();
    const service = new SupporterBillingService(config, repo, entitlementService(), stripe, () => now);
    await service.processWebhook({
      id: 'evt_duplicate',
      type: 'invoice.paid',
      created: Math.floor(now.getTime() / 1000),
      data: { object: {} }
    } as unknown as Stripe.Event);
    expect(stripe.retrieveSubscription).not.toHaveBeenCalled();
    expect(repo.completeWebhookEvent).not.toHaveBeenCalled();
  });

  it('treats Checkout completion as reconciliation, not payment proof', async () => {
    const repo = repository();
    repo.getCheckoutAttempt.mockResolvedValue({
      ...checkoutAttempt(5),
      stripeCustomerId: 'cus_supporter',
      stripeCheckoutSessionId: 'cs_supporter'
    });
    const stripe = stripeClient();
    stripe.retrieveSubscription.mockResolvedValue(subscription(5));
    const entitlement = entitlementService();
    const service = new SupporterBillingService(config, repo, entitlement, stripe, () => now);
    await service.processWebhook({
      id: 'evt_checkout_completed',
      type: 'checkout.session.completed',
      created: Math.floor(now.getTime() / 1000),
      data: {
        object: {
          id: 'cs_supporter',
          mode: 'subscription',
          client_reference_id: checkoutAttempt().token,
          customer: 'cus_supporter',
          subscription: 'sub_supporter'
        }
      }
    } as unknown as Stripe.Event);
    expect(repo.consumeCheckoutAttempt).toHaveBeenCalled();
    expect(repo.upsertSubscription).toHaveBeenCalledWith(expect.objectContaining({
      lifecycleState: 'PENDING',
      lastProviderEventPriority: 10
    }));
    expect(entitlement.setStripeSubscription).toHaveBeenCalledWith(expect.objectContaining({ active: false }));
  });

  it.each([
    [1000, 1000, 'INACTIVE', false, true],
    [250, 1000, 'MANUAL_REVIEW', true, false]
  ] as const)(
    'handles a refund of %i/%i without conflating partial and full refunds',
    async (amountRefunded, amount, expectedState, active, canceled) => {
      const repo = repository();
      repo.getSubscriptionById.mockResolvedValue(paidRecord());
      const stripe = stripeClient();
      stripe.retrieveInvoice.mockResolvedValue({
        parent: {
          type: 'subscription_details',
          subscription_details: { subscription: 'sub_supporter' }
        }
      } as unknown as Stripe.Invoice);
      stripe.retrieveSubscription.mockResolvedValue(subscription(5));
      const entitlement = entitlementService();
      const service = new SupporterBillingService(config, repo, entitlement, stripe, () => now);
      await service.processWebhook({
        id: `evt_refund_${amountRefunded}`,
        type: 'charge.refunded',
        created: Math.floor(new Date('2026-09-17T12:00:00.000Z').getTime() / 1000),
        data: { object: { invoice: 'in_supporter', amount_refunded: amountRefunded, amount } }
      } as unknown as Stripe.Event);

      expect(repo.upsertSubscription).toHaveBeenCalledWith(expect.objectContaining({
        lifecycleState: expectedState
      }));
      expect(entitlement.setStripeSubscription).toHaveBeenCalledWith(expect.objectContaining({ active }));
      expect(stripe.cancelSubscription).toHaveBeenCalledTimes(canceled ? 1 : 0);
    }
  );

  it('revokes on dispute and restores only after Stripe reports won or reinstated funds', async () => {
    const repo = repository();
    repo.getSubscriptionById.mockResolvedValue(paidRecord());
    const stripe = stripeClient();
    stripe.retrieveCharge.mockResolvedValue({ invoice: 'in_supporter' } as unknown as Stripe.Charge);
    stripe.retrieveInvoice.mockResolvedValue({
      parent: {
        type: 'subscription_details',
        subscription_details: { subscription: 'sub_supporter' }
      }
    } as unknown as Stripe.Invoice);
    stripe.retrieveSubscription.mockResolvedValue(subscription(5));
    const entitlement = entitlementService();
    const service = new SupporterBillingService(config, repo, entitlement, stripe, () => now);

    await service.processWebhook({
      id: 'evt_dispute_created',
      type: 'charge.dispute.created',
      created: Math.floor(new Date('2026-09-17T12:00:00.000Z').getTime() / 1000),
      data: { object: { charge: 'ch_supporter', status: 'needs_response' } }
    } as unknown as Stripe.Event);
    expect(entitlement.setStripeSubscription).toHaveBeenLastCalledWith(expect.objectContaining({ active: false }));

    repo.getSubscriptionById.mockResolvedValue(paidRecord({ lifecycleState: 'INACTIVE' }));
    await service.processWebhook({
      id: 'evt_dispute_closed',
      type: 'charge.dispute.closed',
      created: Math.floor(new Date('2026-09-18T12:00:00.000Z').getTime() / 1000),
      data: { object: { charge: 'ch_supporter', status: 'won' } }
    } as unknown as Stripe.Event);
    expect(entitlement.setStripeSubscription).toHaveBeenLastCalledWith(expect.objectContaining({ active: true }));
  });

  it('does not extend an existing seven-day recovery window on repeated failures', async () => {
    const recoveryEnd = new Date('2026-09-23T12:00:00.000Z');
    const repo = repository();
    repo.getSubscriptionById.mockResolvedValue(paidRecord({
      lifecycleState: 'RECOVERY',
      recoveryGraceExpiresAt: recoveryEnd
    }));
    const stripe = stripeClient();
    stripe.retrieveSubscription.mockResolvedValue(subscription(5));
    const service = new SupporterBillingService(config, repo, entitlementService(), stripe, () => now);
    await service.processWebhook({
      id: 'evt_payment_failed_again',
      type: 'invoice.payment_failed',
      created: Math.floor(new Date('2026-09-17T12:00:00.000Z').getTime() / 1000),
      data: {
        object: {
          parent: {
            type: 'subscription_details',
            subscription_details: { subscription: 'sub_supporter' }
          }
        }
      }
    } as unknown as Stripe.Event);
    expect(repo.upsertSubscription).toHaveBeenCalledWith(expect.objectContaining({
      lifecycleState: 'RECOVERY',
      recoveryGraceExpiresAt: recoveryEnd
    }));
  });
});

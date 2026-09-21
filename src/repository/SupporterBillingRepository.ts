export type StripeSupporterLifecycleState =
  | 'PENDING'
  | 'ACTIVE'
  | 'SCHEDULED_CANCELLATION'
  | 'RECOVERY'
  | 'INACTIVE'
  | 'MANUAL_REVIEW';

export interface SupporterCheckoutAttempt {
  token: string;
  userId: string;
  monthlyContributionUsd: number;
  stripeCustomerId: string | null;
  stripeCheckoutSessionId: string | null;
  expiresAt: Date;
  consumedAt: Date | null;
}

export interface StripeSupporterSubscriptionRecord {
  subscriptionId: string;
  userId: string;
  customerId: string;
  priceId: string;
  productId: string;
  providerStatus: string;
  lifecycleState: StripeSupporterLifecycleState;
  monthlyContributionUsd: number;
  currentPeriodEnd: Date | null;
  nextRenewalAt: Date | null;
  cancelAtPeriodEnd: boolean;
  recoveryGraceExpiresAt: Date | null;
  paidThrough: Date | null;
  lastPaidAt: Date | null;
  lastProviderEventCreatedAt: Date;
  lastProviderEventPriority: number;
  lastProviderEventId: string;
}

export interface SupporterBillingRepository {
  getStripeCustomerId(userId: string): Promise<string | null>;
  setStripeCustomer(userId: string, customerId: string): Promise<void>;
  createOrReuseCheckoutAttempt(input: {
    userId: string;
    monthlyContributionUsd: number;
    now: Date;
    expiresAt: Date;
  }): Promise<SupporterCheckoutAttempt>;
  attachCheckoutSession(input: {
    token: string;
    customerId: string;
    checkoutSessionId: string;
  }): Promise<void>;
  getCheckoutAttempt(token: string): Promise<SupporterCheckoutAttempt | null>;
  consumeCheckoutAttempt(token: string, consumedAt: Date): Promise<void>;
  getPaidSubscription(userId: string): Promise<StripeSupporterSubscriptionRecord | null>;
  getSubscriptionById(subscriptionId: string): Promise<StripeSupporterSubscriptionRecord | null>;
  upsertSubscription(record: StripeSupporterSubscriptionRecord): Promise<boolean>;
  claimWebhookEvent(input: {
    eventId: string;
    eventType: string;
    eventCreatedAt: Date;
  }): Promise<boolean>;
  completeWebhookEvent(eventId: string): Promise<void>;
  failWebhookEvent(eventId: string, errorCode: string): Promise<void>;
}

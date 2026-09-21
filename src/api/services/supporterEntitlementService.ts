import type {
  SupporterEntitlementRepository,
  SupporterEntitlementStatus
} from '../../repository/SupporterEntitlementRepository';

export type ComplimentaryGrantDuration = '30_DAYS' | '90_DAYS' | '1_YEAR' | 'CUSTOM' | 'PERMANENT';

export interface ComplimentaryGrantInput {
  userId: string;
  actorUserId: string;
  duration: ComplimentaryGrantDuration;
  customExpiresAt?: Date;
  reason: string;
}

const COMPLIMENTARY_SOURCE_REFERENCE = 'manual';

function calculateExpiry(now: Date, duration: ComplimentaryGrantDuration, custom?: Date): Date | null {
  if (duration === 'PERMANENT') return null;
  if (duration === 'CUSTOM') {
    if (!custom || custom.getTime() <= now.getTime()) {
      throw new Error('Custom Supporter expiry must be in the future');
    }
    return custom;
  }
  const expiresAt = new Date(now);
  if (duration === '30_DAYS') expiresAt.setUTCDate(expiresAt.getUTCDate() + 30);
  if (duration === '90_DAYS') expiresAt.setUTCDate(expiresAt.getUTCDate() + 90);
  if (duration === '1_YEAR') expiresAt.setUTCFullYear(expiresAt.getUTCFullYear() + 1);
  return expiresAt;
}

export class SupporterEntitlementService {
  constructor(
    private readonly repository: SupporterEntitlementRepository,
    private readonly now: () => Date = () => new Date()
  ) {}

  async isSupporter(userId: string): Promise<boolean> {
    try {
      return (await this.getStatus(userId)).isSupporter;
    } catch {
      // Authentication must stay available during a migration or transient entitlement read failure.
      // Failing closed preserves premium authorization without blocking sign-in.
      return false;
    }
  }

  async getStatus(userId: string): Promise<SupporterEntitlementStatus> {
    const statuses = await this.repository.getStatuses([userId], this.now());
    return statuses.get(userId) ?? { isSupporter: false, sources: [], complimentaryExpiresAt: null };
  }

  getStatuses(userIds: string[]): Promise<Map<string, SupporterEntitlementStatus>> {
    return this.repository.getStatuses(userIds, this.now());
  }

  async grantComplimentary(input: ComplimentaryGrantInput): Promise<SupporterEntitlementStatus> {
    const startsAt = this.now();
    await this.repository.setSource({
      userId: input.userId,
      source: 'COMPLIMENTARY',
      sourceReference: COMPLIMENTARY_SOURCE_REFERENCE,
      startsAt,
      expiresAt: calculateExpiry(startsAt, input.duration, input.customExpiresAt),
      reason: input.reason,
      actorUserId: input.actorUserId
    });
    return this.getStatus(input.userId);
  }

  async revokeComplimentary(input: {
    userId: string;
    actorUserId: string;
    reason: string;
  }): Promise<SupporterEntitlementStatus> {
    await this.repository.revokeSource({
      userId: input.userId,
      source: 'COMPLIMENTARY',
      sourceReference: COMPLIMENTARY_SOURCE_REFERENCE,
      revokedAt: this.now(),
      reason: input.reason,
      actorUserId: input.actorUserId
    });
    return this.getStatus(input.userId);
  }

  /** Stripe webhooks can call this boundary after signature and event-order validation. */
  async setStripeSubscription(input: {
    userId: string;
    subscriptionId: string;
    active: boolean;
    currentPeriodEnd?: Date | null;
    reason: string;
  }): Promise<SupporterEntitlementStatus> {
    if (input.active) {
      const startsAt = this.now();
      await this.repository.setSource({
        userId: input.userId,
        source: 'STRIPE',
        sourceReference: input.subscriptionId,
        startsAt,
        expiresAt: input.currentPeriodEnd ?? null,
        reason: input.reason,
        actorUserId: null
      });
    } else {
      await this.repository.revokeSource({
        userId: input.userId,
        source: 'STRIPE',
        sourceReference: input.subscriptionId,
        revokedAt: this.now(),
        reason: input.reason,
        actorUserId: null
      });
    }
    return this.getStatus(input.userId);
  }
}

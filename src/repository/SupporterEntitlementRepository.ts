export type SupporterEntitlementSource = 'COMPLIMENTARY' | 'STRIPE';

export interface SupporterEntitlementStatus {
  isSupporter: boolean;
  sources: SupporterEntitlementSource[];
  complimentaryExpiresAt: Date | null;
}

export interface SetSupporterEntitlementSourceInput {
  userId: string;
  source: SupporterEntitlementSource;
  sourceReference: string;
  startsAt: Date;
  expiresAt: Date | null;
  reason: string;
  actorUserId: string | null;
}

export interface RevokeSupporterEntitlementSourceInput {
  userId: string;
  source: SupporterEntitlementSource;
  sourceReference: string;
  revokedAt: Date;
  reason: string;
  actorUserId: string | null;
}

export interface SupporterEntitlementRepository {
  getStatuses(userIds: string[], asOf: Date): Promise<Map<string, SupporterEntitlementStatus>>;
  setSource(input: SetSupporterEntitlementSourceInput): Promise<void>;
  revokeSource(input: RevokeSupporterEntitlementSourceInput): Promise<boolean>;
}


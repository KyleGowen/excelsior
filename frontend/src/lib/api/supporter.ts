import { api } from './client';

export type SupporterPaidState =
  | 'PENDING'
  | 'ACTIVE'
  | 'SCHEDULED_CANCELLATION'
  | 'RECOVERY'
  | 'INACTIVE'
  | 'MANUAL_REVIEW';

export interface SupporterStatus {
  isSupporter: boolean;
  sources: Array<'COMPLIMENTARY' | 'STRIPE'>;
  complimentaryExpiresAt: string | null;
  billingAvailable: boolean;
  minimumMonthlyContributionUsd: number;
  maximumMonthlyContributionUsd: number;
  presetMonthlyContributionUsd: number[];
  paid: null | {
    state: SupporterPaidState;
    monthlyContributionUsd: number;
    currentPeriodEnd: string | null;
    nextRenewalAt: string | null;
    recoveryGraceExpiresAt: string | null;
  };
}

export function fetchSupporterStatus(signal?: AbortSignal): Promise<SupporterStatus> {
  return api.getFresh<SupporterStatus>('/api/v1/supporter/status', signal);
}

export function createSupporterCheckout(monthlyContributionUsd: number): Promise<{
  url: string;
  expiresAt: string;
}> {
  return api.post('/api/v1/supporter/checkout', { monthlyContributionUsd });
}

export function createSupporterPortal(): Promise<{ url: string }> {
  return api.post('/api/v1/supporter/portal');
}

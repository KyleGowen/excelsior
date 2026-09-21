import { z } from 'zod';

export const SUPPORTER_MIN_MONTHLY_USD = 3;
export const SUPPORTER_DEFAULT_MONTHLY_USD = 3;
export const SUPPORTER_PRESET_MONTHLY_USD = [3, 5, 10] as const;
export const SUPPORTER_DEFAULT_MAX_MONTHLY_USD = 999_999;
export const SUPPORTER_RECOVERY_GRACE_DAYS = 7;

const PositiveSafeInteger = z.coerce.number().int().safe().positive()
  .max(SUPPORTER_DEFAULT_MAX_MONTHLY_USD);

export interface SupporterBillingConfig {
  enabled: boolean;
  liveMode: boolean;
  secretKey: string | null;
  webhookSecret: string | null;
  productId: string | null;
  priceId: string | null;
  priceLookupKey: string | null;
  portalConfigurationId: string | null;
  appOrigin: string | null;
  maxMonthlyContributionUsd: number;
}

function optionalTrimmed(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function resolveSupporterBillingConfig(
  env: NodeJS.ProcessEnv = process.env
): SupporterBillingConfig {
  const maxResult = PositiveSafeInteger.safeParse(
    env.SUPPORTER_MAX_MONTHLY_USD ?? SUPPORTER_DEFAULT_MAX_MONTHLY_USD
  );
  if (!maxResult.success) {
    throw new Error(`SUPPORTER_MAX_MONTHLY_USD must be a whole number from 3 to ${SUPPORTER_DEFAULT_MAX_MONTHLY_USD}`);
  }
  const maxMonthlyContributionUsd = maxResult.data;
  if (maxMonthlyContributionUsd < SUPPORTER_MIN_MONTHLY_USD) {
    throw new Error('SUPPORTER_MAX_MONTHLY_USD must be at least 3');
  }

  const configuredOrigin = optionalTrimmed(env.APP_ORIGIN);
  let appOrigin: string | null = null;
  if (configuredOrigin) {
    const parsed = new URL(configuredOrigin);
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
      throw new Error('APP_ORIGIN must use HTTPS outside localhost');
    }
    appOrigin = parsed.origin;
  }

  return {
    enabled: env.SUPPORTER_BILLING_ENABLED === '1' && env.DISABLE_SUPPORTER_BILLING !== '1',
    liveMode: env.STRIPE_SUPPORTER_LIVE_MODE === '1',
    secretKey: optionalTrimmed(env.STRIPE_SECRET_KEY),
    webhookSecret: optionalTrimmed(env.STRIPE_SUPPORTER_WEBHOOK_SECRET),
    productId: optionalTrimmed(env.STRIPE_SUPPORTER_PRODUCT_ID),
    priceId: optionalTrimmed(env.STRIPE_SUPPORTER_PRICE_ID),
    priceLookupKey: optionalTrimmed(env.STRIPE_SUPPORTER_PRICE_LOOKUP_KEY),
    portalConfigurationId: optionalTrimmed(env.STRIPE_SUPPORTER_PORTAL_CONFIGURATION_ID),
    appOrigin,
    maxMonthlyContributionUsd
  };
}

export function isSupporterCheckoutConfigured(config: SupporterBillingConfig): boolean {
  return Boolean(
    config.enabled
      && config.secretKey
      && config.webhookSecret
      && config.productId
      && config.priceId
      && config.portalConfigurationId
      && config.appOrigin
  );
}

export function assertSupporterCheckoutConfigured(
  config: SupporterBillingConfig
): asserts config is SupporterBillingConfig & {
  secretKey: string;
  webhookSecret: string;
  productId: string;
  priceId: string;
  portalConfigurationId: string;
  appOrigin: string;
} {
  if (!isSupporterCheckoutConfigured(config)) {
    throw new Error('Supporter billing is unavailable');
  }
}

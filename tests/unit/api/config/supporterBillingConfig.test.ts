import {
  isSupporterCheckoutConfigured,
  resolveSupporterBillingConfig
} from '../../../../src/api/config/supporterBillingConfig';

describe('supporter billing configuration', () => {
  const completeEnv = {
    SUPPORTER_BILLING_ENABLED: '1',
    STRIPE_SUPPORTER_LIVE_MODE: '0',
    STRIPE_SECRET_KEY: 'rk_test_placeholder',
    STRIPE_SUPPORTER_WEBHOOK_SECRET: 'whsec_placeholder',
    STRIPE_SUPPORTER_PRODUCT_ID: 'prod_test',
    STRIPE_SUPPORTER_PRICE_ID: 'price_test',
    STRIPE_SUPPORTER_PRICE_LOOKUP_KEY: 'supporter_monthly_unit',
    STRIPE_SUPPORTER_PORTAL_CONFIGURATION_ID: 'bpc_test',
    APP_ORIGIN: 'http://localhost:5173',
    SUPPORTER_MAX_MONTHLY_USD: '1000'
  } as NodeJS.ProcessEnv;

  it('is disabled by default and requires every server-side billing value', () => {
    expect(isSupporterCheckoutConfigured(resolveSupporterBillingConfig({}))).toBe(false);
    expect(isSupporterCheckoutConfigured(resolveSupporterBillingConfig(completeEnv))).toBe(true);
    expect(isSupporterCheckoutConfigured(resolveSupporterBillingConfig({
      ...completeEnv,
      DISABLE_SUPPORTER_BILLING: '1'
    }))).toBe(false);
  });

  it('rejects an insecure non-local return origin and a maximum below the floor', () => {
    expect(() => resolveSupporterBillingConfig({
      ...completeEnv,
      APP_ORIGIN: 'http://example.com'
    })).toThrow('HTTPS');
    expect(() => resolveSupporterBillingConfig({
      ...completeEnv,
      SUPPORTER_MAX_MONTHLY_USD: '2'
    })).toThrow('at least 3');
    expect(() => resolveSupporterBillingConfig({
      ...completeEnv,
      SUPPORTER_MAX_MONTHLY_USD: '1000000'
    })).toThrow('999999');
  });
});

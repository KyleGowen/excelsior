import fs from 'fs';
import path from 'path';

describe('V360 supporter entitlements migration', () => {
  const sql = fs.readFileSync(
    path.join(__dirname, '../../migrations/V360__Create_supporter_entitlements.sql'),
    'utf8',
  );

  it('keeps Stripe and complimentary sources independent with immutable audit history', () => {
    expect(sql).toMatch(/CREATE TABLE supporter_entitlement_sources/i);
    expect(sql).toMatch(/source IN \('COMPLIMENTARY', 'STRIPE'\)/i);
    expect(sql).toMatch(/UNIQUE \(user_id, source, source_reference\)/i);
    expect(sql).toMatch(/expires_at IS NULL OR expires_at > starts_at/i);
    expect(sql).toMatch(/CREATE TABLE supporter_entitlement_audit/i);
    expect(sql).toMatch(/reason VARCHAR\(500\) NOT NULL/i);
    expect(sql).toMatch(/BEFORE UPDATE OR DELETE ON supporter_entitlement_audit/i);
  });
});

describe('V361 supporter audit cleanup migration', () => {
  const sql = fs.readFileSync(
    path.join(__dirname, '../../migrations/V361__Allow_account_cleanup_through_supporter_audit.sql'),
    'utf8',
  );

  it('allows FK cascades while direct audit edits stay blocked', () => {
    expect(sql).toMatch(/ON DELETE CASCADE/i);
    expect(sql).toMatch(/pg_trigger_depth\(\) > 1/i);
    expect(sql).toMatch(/RAISE EXCEPTION 'supporter_entitlement_audit records are immutable'/i);
  });
});

describe('V362 Stripe Supporter billing migration', () => {
  const sql = fs.readFileSync(
    path.join(__dirname, '../../migrations/V362__Create_stripe_supporter_billing.sql'),
    'utf8',
  );

  it('stores only provider identifiers, canonical contribution state, attempts, and event receipts', () => {
    expect(sql).toMatch(/CREATE TABLE stripe_supporter_customers/i);
    expect(sql).toMatch(/CREATE TABLE supporter_checkout_attempts/i);
    expect(sql).toMatch(/monthly_contribution_usd INTEGER NOT NULL CHECK \(monthly_contribution_usd >= 3\)/i);
    expect(sql).toMatch(/CREATE TABLE stripe_supporter_subscriptions/i);
    expect(sql).toMatch(/CREATE TABLE stripe_supporter_webhook_events/i);
    expect(sql).not.toMatch(/card_number|payment_method_data|raw_payload|signature/i);
  });
});

describe('V363 Stripe Supporter billing hardening migration', () => {
  const sql = fs.readFileSync(
    path.join(__dirname, '../../migrations/V363__Harden_stripe_supporter_billing_ordering.sql'),
    'utf8',
  );

  it('caps contributions and makes same-second webhook ordering deterministic', () => {
    expect(sql).toMatch(/CHECK \(monthly_contribution_usd <= 999999\)/i);
    expect(sql).not.toMatch(/DROP CONSTRAINT/i);
    expect(sql).toMatch(/ADD COLUMN last_provider_event_priority SMALLINT NOT NULL DEFAULT 0/i);
    expect(sql).toMatch(/ALTER COLUMN last_provider_event_priority DROP DEFAULT/i);
  });
});

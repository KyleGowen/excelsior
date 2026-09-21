ALTER TABLE supporter_checkout_attempts
    ADD CONSTRAINT supporter_checkout_attempts_monthly_contribution_usd_max
        CHECK (monthly_contribution_usd <= 999999);

ALTER TABLE stripe_supporter_subscriptions
    ADD CONSTRAINT stripe_supporter_subscriptions_monthly_contribution_usd_max
        CHECK (monthly_contribution_usd <= 999999),
    ADD COLUMN last_provider_event_priority SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE stripe_supporter_subscriptions
    ALTER COLUMN last_provider_event_priority DROP DEFAULT;

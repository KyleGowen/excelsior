CREATE TABLE stripe_supporter_customers (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT stripe_supporter_customer_id_nonempty
        CHECK (CHAR_LENGTH(BTRIM(stripe_customer_id)) BETWEEN 1 AND 255)
);

CREATE TABLE supporter_checkout_attempts (
    token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    monthly_contribution_usd INTEGER NOT NULL CHECK (monthly_contribution_usd >= 3),
    stripe_customer_id VARCHAR(255),
    stripe_checkout_session_id VARCHAR(255) UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX supporter_checkout_attempt_user_idx
    ON supporter_checkout_attempts (user_id, created_at DESC);

CREATE TABLE stripe_supporter_subscriptions (
    stripe_subscription_id VARCHAR(255) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) NOT NULL,
    stripe_price_id VARCHAR(255) NOT NULL,
    stripe_product_id VARCHAR(255) NOT NULL,
    provider_status VARCHAR(64) NOT NULL,
    lifecycle_state VARCHAR(32) NOT NULL,
    monthly_contribution_usd INTEGER NOT NULL CHECK (monthly_contribution_usd >= 3),
    current_period_end TIMESTAMPTZ,
    next_renewal_at TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    recovery_grace_expires_at TIMESTAMPTZ,
    paid_through TIMESTAMPTZ,
    last_paid_at TIMESTAMPTZ,
    last_provider_event_created_at TIMESTAMPTZ NOT NULL,
    last_provider_event_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT stripe_supporter_lifecycle_state_allowed CHECK (
        lifecycle_state IN ('PENDING', 'ACTIVE', 'SCHEDULED_CANCELLATION', 'RECOVERY', 'INACTIVE', 'MANUAL_REVIEW')
    )
);

CREATE INDEX stripe_supporter_subscription_user_idx
    ON stripe_supporter_subscriptions (user_id, updated_at DESC);

CREATE TABLE stripe_supporter_webhook_events (
    stripe_event_id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(255) NOT NULL,
    event_created_at TIMESTAMPTZ NOT NULL,
    processing_status VARCHAR(16) NOT NULL DEFAULT 'PROCESSING',
    error_code VARCHAR(128),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT stripe_supporter_webhook_status_allowed
        CHECK (processing_status IN ('PROCESSING', 'PROCESSED', 'FAILED'))
);

CREATE INDEX stripe_supporter_webhook_created_idx
    ON stripe_supporter_webhook_events (event_created_at DESC);

CREATE TABLE supporter_entitlement_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source VARCHAR(32) NOT NULL,
    source_reference VARCHAR(255) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    reason VARCHAR(500) NOT NULL,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT supporter_entitlement_source_allowed
        CHECK (source IN ('COMPLIMENTARY', 'STRIPE')),
    CONSTRAINT supporter_entitlement_source_reference_nonempty
        CHECK (CHAR_LENGTH(BTRIM(source_reference)) BETWEEN 1 AND 255),
    CONSTRAINT supporter_entitlement_reason_nonempty
        CHECK (CHAR_LENGTH(BTRIM(reason)) BETWEEN 1 AND 500),
    CONSTRAINT supporter_entitlement_expiry_after_start
        CHECK (expires_at IS NULL OR expires_at > starts_at),
    CONSTRAINT supporter_entitlement_source_unique
        UNIQUE (user_id, source, source_reference)
);

CREATE INDEX supporter_entitlement_active_user_idx
    ON supporter_entitlement_sources (user_id, source, expires_at)
    WHERE revoked_at IS NULL;

CREATE TABLE supporter_entitlement_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entitlement_source_id UUID NOT NULL REFERENCES supporter_entitlement_sources(id),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(16) NOT NULL,
    source VARCHAR(32) NOT NULL,
    source_reference VARCHAR(255) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    reason VARCHAR(500) NOT NULL,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT supporter_entitlement_audit_action_allowed
        CHECK (action IN ('GRANTED', 'REVOKED')),
    CONSTRAINT supporter_entitlement_audit_source_allowed
        CHECK (source IN ('COMPLIMENTARY', 'STRIPE')),
    CONSTRAINT supporter_entitlement_audit_reason_nonempty
        CHECK (CHAR_LENGTH(BTRIM(reason)) BETWEEN 1 AND 500)
);

CREATE INDEX supporter_entitlement_audit_user_created_idx
    ON supporter_entitlement_audit (user_id, created_at DESC, id DESC);

CREATE FUNCTION prevent_supporter_entitlement_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'supporter_entitlement_audit records are immutable';
END;
$$;

CREATE TRIGGER supporter_entitlement_audit_immutable
BEFORE UPDATE OR DELETE ON supporter_entitlement_audit
FOR EACH ROW EXECUTE FUNCTION prevent_supporter_entitlement_audit_mutation();

ALTER TABLE supporter_entitlement_audit
    DROP CONSTRAINT supporter_entitlement_audit_entitlement_source_id_fkey,
    ADD CONSTRAINT supporter_entitlement_audit_entitlement_source_id_fkey
        FOREIGN KEY (entitlement_source_id)
        REFERENCES supporter_entitlement_sources(id)
        ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION prevent_supporter_entitlement_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Account deletion may cascade through the FK graph.  Direct audit edits remain blocked.
    IF pg_trigger_depth() > 1 THEN
        RETURN OLD;
    END IF;
    RAISE EXCEPTION 'supporter_entitlement_audit records are immutable';
END;
$$;


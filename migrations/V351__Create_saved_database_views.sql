CREATE TABLE saved_database_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(80) NOT NULL,
    view_state JSONB NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT saved_database_views_name_trimmed_nonempty
        CHECK (name = BTRIM(name) AND CHAR_LENGTH(name) BETWEEN 1 AND 80),
    CONSTRAINT saved_database_views_state_object
        CHECK (JSONB_TYPEOF(view_state) = 'object'),
    CONSTRAINT saved_database_views_state_version
        CHECK (view_state ->> 'schemaVersion' = '1')
);

CREATE INDEX saved_database_views_user_sort_idx
    ON saved_database_views (user_id, is_pinned DESC, created_at DESC, id DESC);

CREATE INDEX saved_database_views_user_created_idx
    ON saved_database_views (user_id, created_at DESC, id DESC);

-- Create collections table
-- Each user can have one collection to track their personal card inventory
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one collection per user
    UNIQUE(user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_collections_user_id ON collections(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


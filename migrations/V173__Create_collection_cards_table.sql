-- Create collection_cards table (junction table for cards in collections)
CREATE TABLE collection_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    card_id UUID NOT NULL,
    card_type VARCHAR(50) NOT NULL, -- character, special, power, mission, event, aspect, etc.
    quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique combination of collection, card type, and card ID
    UNIQUE(collection_id, card_type, card_id)
);

-- Create index on collection_id for faster lookups
CREATE INDEX idx_collection_cards_collection_id ON collection_cards(collection_id);

-- Create index on card_type for filtering
CREATE INDEX idx_collection_cards_type ON collection_cards(card_type);

-- Create index on card_id for lookups
CREATE INDEX idx_collection_cards_card_id ON collection_cards(card_id);

-- Create trigger for updated_at
CREATE TRIGGER update_collection_cards_updated_at BEFORE UPDATE ON collection_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


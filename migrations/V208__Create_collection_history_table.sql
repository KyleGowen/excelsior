-- Create collection_history table to track all add/remove operations on collection cards
CREATE TABLE collection_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    card_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('ADD', 'REMOVE')),
    new_quantity INTEGER NOT NULL CHECK (new_quantity >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX idx_collection_history_collection_id ON collection_history(collection_id);
CREATE INDEX idx_collection_history_card_id ON collection_history(card_id);
CREATE INDEX idx_collection_history_created_at ON collection_history(created_at);

-- Create trigger function to log collection history
CREATE OR REPLACE FUNCTION log_collection_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT: Always record ADD action
    IF TG_OP = 'INSERT' THEN
        INSERT INTO collection_history (collection_id, card_id, action, new_quantity)
        VALUES (NEW.collection_id, NEW.card_id, 'ADD', NEW.quantity);
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE: Compare old and new quantities
    IF TG_OP = 'UPDATE' THEN
        -- Only log if quantity actually changed
        IF NEW.quantity != OLD.quantity THEN
            IF NEW.quantity > OLD.quantity THEN
                -- Quantity increased: record ADD
                INSERT INTO collection_history (collection_id, card_id, action, new_quantity)
                VALUES (NEW.collection_id, NEW.card_id, 'ADD', NEW.quantity);
            ELSE
                -- Quantity decreased: record REMOVE
                INSERT INTO collection_history (collection_id, card_id, action, new_quantity)
                VALUES (NEW.collection_id, NEW.card_id, 'REMOVE', NEW.quantity);
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE: Always record REMOVE with quantity 0
    IF TG_OP = 'DELETE' THEN
        INSERT INTO collection_history (collection_id, card_id, action, new_quantity)
        VALUES (OLD.collection_id, OLD.card_id, 'REMOVE', 0);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on collection_cards table
CREATE TRIGGER trigger_log_collection_history_insert
    AFTER INSERT ON collection_cards
    FOR EACH ROW
    EXECUTE FUNCTION log_collection_history();

CREATE TRIGGER trigger_log_collection_history_update
    AFTER UPDATE ON collection_cards
    FOR EACH ROW
    EXECUTE FUNCTION log_collection_history();

CREATE TRIGGER trigger_log_collection_history_delete
    AFTER DELETE ON collection_cards
    FOR EACH ROW
    EXECUTE FUNCTION log_collection_history();


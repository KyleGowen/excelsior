-- Add missing columns to basic_universe_cards table
ALTER TABLE basic_universe_cards 
ADD COLUMN type VARCHAR(255),
ADD COLUMN value_to_use VARCHAR(255),
ADD COLUMN bonus VARCHAR(255);

-- Create indexes on new columns for faster searches
CREATE INDEX idx_basic_universe_type ON basic_universe_cards(type);
CREATE INDEX idx_basic_universe_value_to_use ON basic_universe_cards(value_to_use);

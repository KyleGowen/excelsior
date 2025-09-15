-- Add missing columns to ally_universe_cards table
ALTER TABLE ally_universe_cards 
ADD COLUMN stat_to_use VARCHAR(255),
ADD COLUMN stat_type_to_use VARCHAR(255),
ADD COLUMN attack_value INT,
ADD COLUMN attack_type VARCHAR(255),
ADD COLUMN card_text TEXT;

-- Create indexes on new columns for faster searches
CREATE INDEX idx_ally_universe_stat_to_use ON ally_universe_cards(stat_to_use);
CREATE INDEX idx_ally_universe_stat_type ON ally_universe_cards(stat_type_to_use);
CREATE INDEX idx_ally_universe_attack_type ON ally_universe_cards(attack_type);

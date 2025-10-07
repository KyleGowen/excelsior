-- Add metadata columns to decks table for improved load times
-- These columns store calculated values to avoid loading all cards for deck summaries

-- Add card count column
ALTER TABLE decks 
ADD COLUMN card_count INTEGER NOT NULL DEFAULT 0;

-- Add threat level column (sum of character and location threat levels)
ALTER TABLE decks 
ADD COLUMN threat INTEGER NOT NULL DEFAULT 0;

-- Add character columns (up to 4 characters per deck)
ALTER TABLE decks 
ADD COLUMN character_1_id UUID REFERENCES characters(id) ON DELETE SET NULL,
ADD COLUMN character_2_id UUID REFERENCES characters(id) ON DELETE SET NULL,
ADD COLUMN character_3_id UUID REFERENCES characters(id) ON DELETE SET NULL,
ADD COLUMN character_4_id UUID REFERENCES characters(id) ON DELETE SET NULL;

-- Add location column (one location per deck)
ALTER TABLE decks 
ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Add comments to document the column purposes
COMMENT ON COLUMN decks.card_count IS 'Total number of cards in the deck (excluding character, location, and mission cards)';
COMMENT ON COLUMN decks.threat IS 'Total threat level from character and location cards';
COMMENT ON COLUMN decks.character_1_id IS 'First character in the deck (by order added)';
COMMENT ON COLUMN decks.character_2_id IS 'Second character in the deck (by order added)';
COMMENT ON COLUMN decks.character_3_id IS 'Third character in the deck (by order added)';
COMMENT ON COLUMN decks.character_4_id IS 'Fourth character in the deck (by order added)';
COMMENT ON COLUMN decks.location_id IS 'Location card in the deck';

-- Create indexes for faster lookups
CREATE INDEX idx_decks_card_count ON decks(card_count);
CREATE INDEX idx_decks_threat ON decks(threat);
CREATE INDEX idx_decks_character_1_id ON decks(character_1_id);
CREATE INDEX idx_decks_character_2_id ON decks(character_2_id);
CREATE INDEX idx_decks_character_3_id ON decks(character_3_id);
CREATE INDEX idx_decks_character_4_id ON decks(character_4_id);
CREATE INDEX idx_decks_location_id ON decks(location_id);

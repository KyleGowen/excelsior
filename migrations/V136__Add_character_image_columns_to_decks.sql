-- Add character image columns to decks table
-- These columns store the selected_alternate_image from deck_cards for each character

-- Add character image columns (up to 4 characters per deck)
ALTER TABLE decks 
ADD COLUMN character_1_image VARCHAR(500),
ADD COLUMN character_2_image VARCHAR(500),
ADD COLUMN character_3_image VARCHAR(500),
ADD COLUMN character_4_image VARCHAR(500);

-- Add comments to document the column purposes
COMMENT ON COLUMN decks.character_1_image IS 'Selected alternate image path for the first character in the deck';
COMMENT ON COLUMN decks.character_2_image IS 'Selected alternate image path for the second character in the deck';
COMMENT ON COLUMN decks.character_3_image IS 'Selected alternate image path for the third character in the deck';
COMMENT ON COLUMN decks.character_4_image IS 'Selected alternate image path for the fourth character in the deck';

-- Create indexes for faster lookups (optional, but good for performance)
CREATE INDEX idx_decks_character_1_image ON decks(character_1_image);
CREATE INDEX idx_decks_character_2_image ON decks(character_2_image);
CREATE INDEX idx_decks_character_3_image ON decks(character_3_image);
CREATE INDEX idx_decks_character_4_image ON decks(character_4_image);

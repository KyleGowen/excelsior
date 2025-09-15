-- Add character column to advanced_universe_cards table
ALTER TABLE advanced_universe_cards 
ADD COLUMN character VARCHAR(255);

-- Update existing records with character data
UPDATE advanced_universe_cards 
SET character = 'Ra' 
WHERE universe = 'ERB';

-- Create index on character for faster searches
CREATE INDEX idx_advanced_universe_character ON advanced_universe_cards(character);

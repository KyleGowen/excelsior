-- Add universe column to power_cards table
-- All power cards belong to the Edgar Rice Burroughs universe
ALTER TABLE power_cards 
ADD COLUMN universe VARCHAR(255) NOT NULL DEFAULT 'ERB';

-- Update all existing records to ensure they have ERB
UPDATE power_cards 
SET universe = 'ERB'
WHERE universe IS NULL OR universe != 'ERB';

-- Create index on universe for filtering
CREATE INDEX idx_power_cards_universe ON power_cards(universe);


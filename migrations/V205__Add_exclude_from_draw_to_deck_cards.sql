-- Add exclude_from_draw column to deck_cards table
-- This column is used to mark cards (Training cards with Spartan Training Ground,
-- Basic Universe cards with Dracula's Armory) as "Pre-Placed" and exclude them from Draw Hand
ALTER TABLE deck_cards 
ADD COLUMN IF NOT EXISTS exclude_from_draw BOOLEAN DEFAULT FALSE;

-- Create index on exclude_from_draw for filtering
CREATE INDEX IF NOT EXISTS idx_deck_cards_exclude_from_draw ON deck_cards(exclude_from_draw);


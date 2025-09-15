-- Add ui_preferences column to decks table for storing user interface state
ALTER TABLE decks 
ADD COLUMN ui_preferences JSONB;

-- Create index on ui_preferences for efficient querying
CREATE INDEX idx_decks_ui_preferences ON decks USING GIN (ui_preferences);

-- Add comment to document the structure
COMMENT ON COLUMN decks.ui_preferences IS 'JSON object storing user interface preferences including divider position, expansion states, and sort modes';

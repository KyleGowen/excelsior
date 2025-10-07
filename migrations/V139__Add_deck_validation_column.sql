-- Add deck validation column to track if deck is valid
-- This column is updated by application code when saving decks, not by database triggers

ALTER TABLE decks 
ADD COLUMN is_valid BOOLEAN NOT NULL DEFAULT false;

-- Add comment to document that this column is managed by application code
COMMENT ON COLUMN decks.is_valid IS 'Indicates if the deck passes validation rules. Updated by application code when saving decks, not by database triggers.';

-- Add index for faster lookups on validation status
CREATE INDEX idx_decks_is_valid ON decks(is_valid);

-- Update existing decks to false (they will be updated when next saved)
-- No need to explicitly set to false since DEFAULT false handles this

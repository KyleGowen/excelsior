-- Add is_limited column to decks table
-- This column indicates whether a deck is a limited edition deck
-- Default value is false (0), non-null

ALTER TABLE decks 
ADD COLUMN is_limited BOOLEAN NOT NULL DEFAULT FALSE;

-- Add a comment to document the column purpose
COMMENT ON COLUMN decks.is_limited IS 'Indicates whether this deck is a limited edition deck';

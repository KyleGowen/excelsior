-- Add reserve_character column to decks table
-- This column will hold the ID of a character card that serves as the reserve character
-- The column is nullable to allow decks without a reserve character

ALTER TABLE decks ADD COLUMN reserve_character UUID;

-- Add a comment to document the column's purpose
COMMENT ON COLUMN decks.reserve_character IS 'ID of the character card that serves as the reserve character for this deck. Nullable to allow decks without a reserve character.';

-- Add a foreign key constraint to ensure the reserve_character references a valid character
-- This ensures data integrity by preventing invalid character IDs
ALTER TABLE decks ADD CONSTRAINT fk_decks_reserve_character 
    FOREIGN KEY (reserve_character) REFERENCES characters(id) ON DELETE SET NULL;

-- Log the changes
DO $$
DECLARE
    total_decks INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_decks FROM decks;
    RAISE NOTICE 'Added reserve_character column to decks table. Total decks: %', total_decks;
    RAISE NOTICE 'Column is nullable and has foreign key constraint to characters table';
END $$;

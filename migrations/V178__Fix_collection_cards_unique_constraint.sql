-- Fix collection_cards unique constraint to include alternate_image
-- This migration drops the old constraint and creates a new one that properly handles alternate images

-- Step 1: Drop the old unique constraint by name (if it exists)
DO $$
BEGIN
    -- Drop the old constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'collection_cards_collection_id_card_type_card_id_key'
    ) THEN
        ALTER TABLE collection_cards 
        DROP CONSTRAINT collection_cards_collection_id_card_type_card_id_key;
        RAISE NOTICE 'Dropped old constraint: collection_cards_collection_id_card_type_card_id_key';
    END IF;
END $$;

-- Step 2: Drop the unique index if it exists (from V176)
DROP INDEX IF EXISTS collection_cards_unique;

-- Step 3: Ensure alternate_image is never NULL (set to empty string for existing NULLs)
UPDATE collection_cards
SET alternate_image = ''
WHERE alternate_image IS NULL;

-- Step 4: Set default value for alternate_image to empty string (not NULL)
ALTER TABLE collection_cards
    ALTER COLUMN alternate_image SET DEFAULT '';

-- Step 5: Make alternate_image NOT NULL (since we're using empty string for "no alternate")
ALTER TABLE collection_cards
    ALTER COLUMN alternate_image SET NOT NULL;

-- Step 6: Create a proper unique constraint (not just an index) that includes alternate_image
-- This constraint can be used with ON CONFLICT in INSERT statements
ALTER TABLE collection_cards
    ADD CONSTRAINT collection_cards_unique 
    UNIQUE (collection_id, card_id, card_type, alternate_image);

-- Step 7: Create an index for faster lookups (separate from the unique constraint)
CREATE INDEX IF NOT EXISTS idx_collection_cards_lookup 
    ON collection_cards(collection_id, card_id, card_type, alternate_image);


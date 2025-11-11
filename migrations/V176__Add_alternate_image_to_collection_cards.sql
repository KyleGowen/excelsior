-- Add alternate_image column to collection_cards table
-- This allows tracking different alternate arts of the same card as separate collection items

-- Drop the existing unique constraint (PostgreSQL auto-generates constraint names)
-- Find and drop the constraint that enforces uniqueness on (collection_id, card_type, card_id)
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the constraint name
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'collection_cards'::regclass
      AND contype = 'u'
      AND array_length(conkey, 1) = 3
      AND conkey = (
          SELECT array_agg(attnum ORDER BY attnum)
          FROM pg_attribute
          WHERE attrelid = 'collection_cards'::regclass
            AND attname IN ('collection_id', 'card_type', 'card_id')
      );
    
    -- Drop the constraint if found
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE collection_cards DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;
END $$;

-- Add alternate_image column
ALTER TABLE collection_cards
ADD COLUMN IF NOT EXISTS alternate_image VARCHAR(500);

-- Create new unique constraint that includes alternate_image
-- This allows the same card with different alternate arts to be separate entries
-- Use a unique index with COALESCE to handle NULL values properly
-- NULL values are treated as distinct, so NULL and empty string are different
CREATE UNIQUE INDEX IF NOT EXISTS collection_cards_unique 
ON collection_cards(collection_id, card_id, card_type, COALESCE(alternate_image, ''));

-- Also create a unique constraint using a partial index approach for better NULL handling
-- This ensures that (card_id, card_type, NULL) and (card_id, card_type, 'alt1') are distinct
-- PostgreSQL's unique constraint with NULL treats each NULL as distinct, but we want all NULLs to be the same
-- So we use COALESCE to convert NULL to empty string for the constraint

-- Add index for faster lookups by alternate_image
CREATE INDEX IF NOT EXISTS idx_collection_cards_alternate_image ON collection_cards(alternate_image) WHERE alternate_image IS NOT NULL;


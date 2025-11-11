-- Consolidate alternate_image, alternate_image_original, and alternate_image_slug into a single image_path column
-- This simplifies the schema and makes it easier to work with collection cards

-- Step 1: Add the new image_path column
ALTER TABLE collection_cards
    ADD COLUMN IF NOT EXISTS image_path VARCHAR(500);

-- Step 2: Populate image_path for existing rows
-- For alternate arts: use alternate_image (constructing full path if needed)
-- For regular cards: construct path from card's image field based on card type
DO $$
DECLARE
    cc_record RECORD;
    card_image_path VARCHAR(500);
    constructed_path VARCHAR(500);
BEGIN
    FOR cc_record IN 
        SELECT id, card_id, card_type, alternate_image 
        FROM collection_cards 
        WHERE image_path IS NULL OR image_path = ''
    LOOP
        -- If this is an alternate art, use alternate_image
        IF cc_record.alternate_image IS NOT NULL AND cc_record.alternate_image != '' THEN
            -- Construct full path from alternate_image
            IF cc_record.alternate_image LIKE '/src/resources/cards/images/%' THEN
                -- Already a full path
                card_image_path := cc_record.alternate_image;
            ELSIF cc_record.alternate_image LIKE 'characters/alternate/%' THEN
                -- Format: characters/alternate/filename.png
                card_image_path := '/src/resources/cards/images/' || cc_record.alternate_image;
            ELSIF cc_record.alternate_image LIKE 'alternate/%' AND cc_record.card_type = 'character' THEN
                -- Format: alternate/filename.png for characters
                card_image_path := '/src/resources/cards/images/characters/' || cc_record.alternate_image;
            ELSIF cc_record.alternate_image LIKE '%/alternate/%' THEN
                -- Format: specials/alternate/filename.png or power-cards/alternate/filename.png
                card_image_path := '/src/resources/cards/images/' || cc_record.alternate_image;
            ELSIF cc_record.card_type = 'character' THEN
                -- Just filename, construct for character
                card_image_path := '/src/resources/cards/images/characters/alternate/' || cc_record.alternate_image;
            ELSIF cc_record.card_type = 'special' THEN
                -- Just filename, construct for special
                card_image_path := '/src/resources/cards/images/specials/alternate/' || cc_record.alternate_image;
            ELSIF cc_record.card_type = 'power' THEN
                -- Just filename, construct for power
                card_image_path := '/src/resources/cards/images/power-cards/alternate/' || cc_record.alternate_image;
            ELSE
                -- Fallback: try to use as-is
                card_image_path := '/src/resources/cards/images/' || cc_record.alternate_image;
            END IF;
        ELSE
            -- Regular card - need to get image from card table and construct path
            CASE cc_record.card_type
                WHEN 'character' THEN
                    SELECT COALESCE(image_path, '') INTO card_image_path
                    FROM characters WHERE id = cc_record.card_id;
                    IF card_image_path != '' THEN
                        -- Extract filename and construct full path
                        card_image_path := '/src/resources/cards/images/characters/' || 
                            regexp_replace(card_image_path, '^.*/', '');
                    END IF;
                WHEN 'special' THEN
                    SELECT COALESCE(image_path, '') INTO card_image_path
                    FROM special_cards WHERE id = cc_record.card_id;
                    IF card_image_path != '' THEN
                        card_image_path := '/src/resources/cards/images/specials/' || 
                            regexp_replace(card_image_path, '^.*/', '');
                    END IF;
                WHEN 'power' THEN
                    SELECT COALESCE(image_path, '') INTO card_image_path
                    FROM power_cards WHERE id = cc_record.card_id;
                    IF card_image_path != '' THEN
                        card_image_path := '/src/resources/cards/images/power-cards/' || 
                            regexp_replace(card_image_path, '^.*/', '');
                    END IF;
                WHEN 'location' THEN
                    SELECT COALESCE(image_path, '') INTO card_image_path
                    FROM locations WHERE id = cc_record.card_id;
                    IF card_image_path != '' THEN
                        card_image_path := '/src/resources/cards/images/locations/' || 
                            regexp_replace(card_image_path, '^.*/', '');
                    END IF;
                WHEN 'mission' THEN
                    SELECT COALESCE(image_path, '') INTO card_image_path
                    FROM missions WHERE id = cc_record.card_id;
                    IF card_image_path != '' THEN
                        card_image_path := '/src/resources/cards/images/missions/' || 
                            regexp_replace(card_image_path, '^.*/', '');
                    END IF;
                WHEN 'event' THEN
                    SELECT COALESCE(image_path, '') INTO card_image_path
                    FROM events WHERE id = cc_record.card_id;
                    IF card_image_path != '' THEN
                        card_image_path := '/src/resources/cards/images/events/' || 
                            regexp_replace(card_image_path, '^.*/', '');
                    END IF;
                WHEN 'aspect' THEN
                    SELECT COALESCE(image_path, '') INTO card_image_path
                    FROM aspects WHERE id = cc_record.card_id;
                    IF card_image_path != '' THEN
                        card_image_path := '/src/resources/cards/images/aspects/' || 
                            regexp_replace(card_image_path, '^.*/', '');
                    END IF;
                WHEN 'advanced_universe' THEN
                    SELECT COALESCE(image_path, '') INTO card_image_path
                    FROM advanced_universe_cards WHERE id = cc_record.card_id;
                    IF card_image_path != '' THEN
                        card_image_path := '/src/resources/cards/images/advanced-universe/' || 
                            regexp_replace(card_image_path, '^.*/', '');
                    END IF;
                WHEN 'teamwork' THEN
                    SELECT COALESCE(image_path, '') INTO card_image_path
                    FROM teamwork_cards WHERE id = cc_record.card_id;
                    IF card_image_path != '' THEN
                        card_image_path := '/src/resources/cards/images/teamwork-universe/' || 
                            regexp_replace(card_image_path, '^.*/', '');
                    END IF;
                WHEN 'ally_universe' THEN
                    SELECT COALESCE(image_path, '') INTO card_image_path
                    FROM ally_universe_cards WHERE id = cc_record.card_id;
                    IF card_image_path != '' THEN
                        card_image_path := '/src/resources/cards/images/ally-universe/' || 
                            regexp_replace(card_image_path, '^.*/', '');
                    END IF;
                WHEN 'training' THEN
                    SELECT COALESCE(image_path, '') INTO card_image_path
                    FROM training_cards WHERE id = cc_record.card_id;
                    IF card_image_path != '' THEN
                        card_image_path := '/src/resources/cards/images/training-universe/' || 
                            regexp_replace(card_image_path, '^.*/', '');
                    END IF;
                WHEN 'basic_universe' THEN
                    SELECT COALESCE(image_path, '') INTO card_image_path
                    FROM basic_universe_cards WHERE id = cc_record.card_id;
                    IF card_image_path != '' THEN
                        card_image_path := '/src/resources/cards/images/basic-universe/' || 
                            regexp_replace(card_image_path, '^.*/', '');
                    END IF;
                ELSE
                    card_image_path := '';
            END CASE;
        END IF;
        
        -- Update the row with the constructed image_path
        IF card_image_path IS NOT NULL AND card_image_path != '' THEN
            UPDATE collection_cards 
            SET image_path = card_image_path 
            WHERE id = cc_record.id;
        END IF;
    END LOOP;
END $$;

-- Step 3: Set image_path to NOT NULL with default (after populating)
UPDATE collection_cards
SET image_path = '/src/resources/cards/images/placeholder.webp'
WHERE image_path IS NULL OR image_path = '';

ALTER TABLE collection_cards
    ALTER COLUMN image_path SET NOT NULL,
    ALTER COLUMN image_path SET DEFAULT '/src/resources/cards/images/placeholder.webp';

-- Step 4: Drop the old unique constraint and create new one with image_path
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find and drop the old constraint
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'collection_cards'::regclass
      AND contype = 'u'
      AND conname = 'collection_cards_unique';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE collection_cards DROP CONSTRAINT ' || quote_ident(constraint_name);
        RAISE NOTICE 'Dropped old unique constraint: %', constraint_name;
    END IF;
END $$;

-- Create new unique constraint with image_path
ALTER TABLE collection_cards
    ADD CONSTRAINT collection_cards_unique UNIQUE (collection_id, card_id, card_type, image_path);

-- Step 5: Drop the old columns
ALTER TABLE collection_cards
    DROP COLUMN IF EXISTS alternate_image,
    DROP COLUMN IF EXISTS alternate_image_original,
    DROP COLUMN IF EXISTS alternate_image_slug;


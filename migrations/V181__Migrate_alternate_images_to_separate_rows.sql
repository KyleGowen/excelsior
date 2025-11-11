-- Migrate alternate images from array columns to separate card rows
-- This migration:
-- 1. Creates separate rows for each alternate image
-- 2. Updates deck_cards to reference new alternate card IDs
-- 3. Updates collection_cards to reference new alternate card IDs
-- 4. Removes alternate_images columns from all card tables
-- 5. Removes selected_alternate_image from deck_cards

-- Step 1: Create temporary mapping table to track alternate card creation
CREATE TEMP TABLE alternate_card_mappings (
    old_card_id VARCHAR(255) NOT NULL,
    new_card_id VARCHAR(255) NOT NULL,
    card_type VARCHAR(50) NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    PRIMARY KEY (old_card_id, image_path)
);

-- Step 2: Helper function to normalize image path for matching
-- This handles various formats: full paths, partial paths, just filenames
CREATE OR REPLACE FUNCTION normalize_alt_image_path(alt_path TEXT, card_type TEXT) 
RETURNS TEXT AS $$
DECLARE
    normalized TEXT;
BEGIN
    normalized := alt_path;
    
    -- Remove leading /src/resources/cards/images/ if present
    IF normalized LIKE '/src/resources/cards/images/%' THEN
        normalized := substring(normalized from length('/src/resources/cards/images/') + 1);
    END IF;
    
    -- Handle different card types and path formats
    IF card_type = 'character' THEN
        IF normalized LIKE 'alternate/%' THEN
            normalized := 'characters/' || normalized;
        ELSIF NOT normalized LIKE 'characters/%' THEN
            normalized := 'characters/alternate/' || normalized;
        END IF;
    ELSIF card_type = 'special' THEN
        IF normalized LIKE '%/alternate/%' THEN
            -- Already has path structure like specials/alternate/filename
            NULL;
        ELSIF NOT normalized LIKE 'specials/%' THEN
            normalized := 'specials/alternate/' || normalized;
        END IF;
    ELSIF card_type = 'power' THEN
        IF normalized LIKE '%/alternate/%' THEN
            -- Already has path structure like power-cards/alternate/filename
            NULL;
        ELSIF NOT normalized LIKE 'power-cards/%' THEN
            normalized := 'power-cards/alternate/' || normalized;
        END IF;
    ELSIF card_type = 'mission' THEN
        IF normalized LIKE '%/alternate/%' THEN
            NULL;
        ELSIF NOT normalized LIKE 'missions/%' THEN
            normalized := 'missions/alternate/' || normalized;
        END IF;
    ELSIF card_type = 'event' THEN
        IF normalized LIKE '%/alternate/%' THEN
            NULL;
        ELSIF NOT normalized LIKE 'events/%' THEN
            normalized := 'events/alternate/' || normalized;
        END IF;
    ELSIF card_type = 'aspect' THEN
        IF normalized LIKE '%/alternate/%' THEN
            NULL;
        ELSIF NOT normalized LIKE 'aspects/%' THEN
            normalized := 'aspects/alternate/' || normalized;
        END IF;
    ELSIF card_type = 'advanced_universe' THEN
        IF normalized LIKE '%/alternate/%' THEN
            NULL;
        ELSIF NOT normalized LIKE 'advanced-universe/%' THEN
            normalized := 'advanced-universe/alternate/' || normalized;
        END IF;
    ELSIF card_type = 'teamwork' THEN
        IF normalized LIKE '%/alternate/%' THEN
            NULL;
        ELSIF NOT normalized LIKE 'teamwork-universe/%' THEN
            normalized := 'teamwork-universe/alternate/' || normalized;
        END IF;
    ELSIF card_type = 'ally_universe' THEN
        IF normalized LIKE '%/alternate/%' THEN
            NULL;
        ELSIF NOT normalized LIKE 'ally-universe/%' THEN
            normalized := 'ally-universe/alternate/' || normalized;
        END IF;
    ELSIF card_type = 'training' THEN
        IF normalized LIKE '%/alternate/%' THEN
            NULL;
        ELSIF NOT normalized LIKE 'training-universe/%' THEN
            normalized := 'training-universe/alternate/' || normalized;
        END IF;
    ELSIF card_type = 'basic_universe' THEN
        IF normalized LIKE '%/alternate/%' THEN
            NULL;
        ELSIF NOT normalized LIKE 'basic-universe/%' THEN
            normalized := 'basic-universe/alternate/' || normalized;
        END IF;
    END IF;
    
    RETURN normalized;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Migrate characters table
DO $$
DECLARE
    char_record RECORD;
    alt_image TEXT;
    new_id VARCHAR(255);
    normalized_path TEXT;
BEGIN
    FOR char_record IN 
        SELECT * FROM characters WHERE alternate_images IS NOT NULL AND array_length(alternate_images, 1) > 0
    LOOP
        FOREACH alt_image IN ARRAY char_record.alternate_images
        LOOP
            -- Generate new UUID for alternate card
            new_id := gen_random_uuid()::text;
            
            -- Normalize the alternate image path
            normalized_path := normalize_alt_image_path(alt_image, 'character');
            
            -- Create new row for alternate card
            INSERT INTO characters (
                id, name, universe, description, energy, combat, brute_force, 
                intelligence, image_path, alternate_images, created_at, updated_at,
                threat_level, special_abilities
            )
            VALUES (
                new_id::uuid,
                char_record.name,
                char_record.universe,
                char_record.description,
                char_record.energy,
                char_record.combat,
                char_record.brute_force,
                char_record.intelligence,
                normalized_path,
                ARRAY[]::TEXT[], -- Clear alternate_images for new row
                char_record.created_at,
                NOW(),
                char_record.threat_level,
                char_record.special_abilities
            );
            
            -- Store mapping
            INSERT INTO alternate_card_mappings (old_card_id, new_card_id, card_type, image_path)
            VALUES (char_record.id, new_id, 'character', normalized_path)
            ON CONFLICT DO NOTHING;
        END LOOP;
        
        -- Clear alternate_images from original row
        UPDATE characters 
        SET alternate_images = ARRAY[]::TEXT[], updated_at = NOW()
        WHERE id = char_record.id;
    END LOOP;
END $$;

-- Step 4: Migrate special_cards table
DO $$
DECLARE
    card_record RECORD;
    alt_image TEXT;
    new_id VARCHAR(255);
    normalized_path TEXT;
BEGIN
    FOR card_record IN 
        SELECT * FROM special_cards WHERE alternate_images IS NOT NULL AND array_length(alternate_images, 1) > 0
    LOOP
        FOREACH alt_image IN ARRAY card_record.alternate_images
        LOOP
            new_id := gen_random_uuid()::text;
            normalized_path := normalize_alt_image_path(alt_image, 'special');
            
            INSERT INTO special_cards (
                id, name, character_name, universe, card_effect, image_path, 
                alternate_images, one_per_deck, cataclysm, ambush, assist, created_at, updated_at
            )
            VALUES (
                new_id::uuid,
                card_record.name,
                card_record.character_name,
                card_record.universe,
                card_record.card_effect,
                normalized_path,
                ARRAY[]::TEXT[],
                card_record.one_per_deck,
                card_record.cataclysm,
                card_record.ambush,
                card_record.assist,
                card_record.created_at,
                NOW()
            );
            
            INSERT INTO alternate_card_mappings (old_card_id, new_card_id, card_type, image_path)
            VALUES (card_record.id, new_id, 'special', normalized_path)
            ON CONFLICT DO NOTHING;
        END LOOP;
        
        UPDATE special_cards 
        SET alternate_images = ARRAY[]::TEXT[], updated_at = NOW()
        WHERE id = card_record.id;
    END LOOP;
END $$;

-- Step 5: Migrate power_cards table
DO $$
DECLARE
    card_record RECORD;
    alt_image TEXT;
    new_id VARCHAR(255);
    normalized_path TEXT;
BEGIN
    FOR card_record IN 
        SELECT * FROM power_cards WHERE alternate_images IS NOT NULL AND array_length(alternate_images, 1) > 0
    LOOP
        FOREACH alt_image IN ARRAY card_record.alternate_images
        LOOP
            new_id := gen_random_uuid()::text;
            normalized_path := normalize_alt_image_path(alt_image, 'power');
            
            INSERT INTO power_cards (
                id, name, power_type, value, image_path, alternate_images, 
                one_per_deck, created_at, updated_at
            )
            VALUES (
                new_id::uuid,
                card_record.name,
                card_record.power_type,
                card_record.value,
                normalized_path,
                ARRAY[]::TEXT[],
                card_record.one_per_deck,
                card_record.created_at,
                NOW()
            );
            
            INSERT INTO alternate_card_mappings (old_card_id, new_card_id, card_type, image_path)
            VALUES (card_record.id, new_id, 'power', normalized_path)
            ON CONFLICT DO NOTHING;
        END LOOP;
        
        UPDATE power_cards 
        SET alternate_images = ARRAY[]::TEXT[], updated_at = NOW()
        WHERE id = card_record.id;
    END LOOP;
END $$;

-- Step 6: Migrate missions table
DO $$
DECLARE
    card_record RECORD;
    alt_image TEXT;
    new_id VARCHAR(255);
    normalized_path TEXT;
BEGIN
    FOR card_record IN 
        SELECT * FROM missions WHERE alternate_images IS NOT NULL AND array_length(alternate_images, 1) > 0
    LOOP
        FOREACH alt_image IN ARRAY card_record.alternate_images
        LOOP
            new_id := gen_random_uuid()::text;
            normalized_path := normalize_alt_image_path(alt_image, 'mission');
            
            INSERT INTO missions (
                id, name, universe, mission_description, image_path, 
                alternate_images, created_at, updated_at
            )
            VALUES (
                new_id::uuid,
                card_record.name,
                card_record.universe,
                card_record.mission_description,
                normalized_path,
                ARRAY[]::TEXT[],
                card_record.created_at,
                NOW()
            );
            
            INSERT INTO alternate_card_mappings (old_card_id, new_card_id, card_type, image_path)
            VALUES (card_record.id, new_id, 'mission', normalized_path)
            ON CONFLICT DO NOTHING;
        END LOOP;
        
        UPDATE missions 
        SET alternate_images = ARRAY[]::TEXT[], updated_at = NOW()
        WHERE id = card_record.id;
    END LOOP;
END $$;

-- Step 7: Migrate events table
DO $$
DECLARE
    card_record RECORD;
    alt_image TEXT;
    new_id VARCHAR(255);
    normalized_path TEXT;
BEGIN
    FOR card_record IN 
        SELECT * FROM events WHERE alternate_images IS NOT NULL AND array_length(alternate_images, 1) > 0
    LOOP
        FOREACH alt_image IN ARRAY card_record.alternate_images
        LOOP
            new_id := gen_random_uuid()::text;
            normalized_path := normalize_alt_image_path(alt_image, 'event');
            
            INSERT INTO events (
                id, name, universe, event_description, image_path, alternate_images, 
                one_per_deck, created_at, updated_at
            )
            VALUES (
                new_id::uuid,
                card_record.name,
                card_record.universe,
                card_record.event_description,
                normalized_path,
                ARRAY[]::TEXT[],
                card_record.one_per_deck,
                card_record.created_at,
                NOW()
            );
            
            INSERT INTO alternate_card_mappings (old_card_id, new_card_id, card_type, image_path)
            VALUES (card_record.id, new_id, 'event', normalized_path)
            ON CONFLICT DO NOTHING;
        END LOOP;
        
        UPDATE events 
        SET alternate_images = ARRAY[]::TEXT[], updated_at = NOW()
        WHERE id = card_record.id;
    END LOOP;
END $$;

-- Step 8: Migrate aspects table
DO $$
DECLARE
    card_record RECORD;
    alt_image TEXT;
    new_id VARCHAR(255);
    normalized_path TEXT;
BEGIN
    FOR card_record IN 
        SELECT * FROM aspects WHERE alternate_images IS NOT NULL AND array_length(alternate_images, 1) > 0
    LOOP
        FOREACH alt_image IN ARRAY card_record.alternate_images
        LOOP
            new_id := gen_random_uuid()::text;
            normalized_path := normalize_alt_image_path(alt_image, 'aspect');
            
            INSERT INTO aspects (
                id, name, universe, aspect_description, image_path, alternate_images, 
                one_per_deck, fortifications, created_at, updated_at
            )
            VALUES (
                new_id::uuid,
                card_record.name,
                card_record.universe,
                card_record.aspect_description,
                normalized_path,
                ARRAY[]::TEXT[],
                card_record.one_per_deck,
                card_record.fortifications,
                card_record.created_at,
                NOW()
            );
            
            INSERT INTO alternate_card_mappings (old_card_id, new_card_id, card_type, image_path)
            VALUES (card_record.id, new_id, 'aspect', normalized_path)
            ON CONFLICT DO NOTHING;
        END LOOP;
        
        UPDATE aspects 
        SET alternate_images = ARRAY[]::TEXT[], updated_at = NOW()
        WHERE id = card_record.id;
    END LOOP;
END $$;

-- Step 9: Migrate advanced_universe_cards table
DO $$
DECLARE
    card_record RECORD;
    alt_image TEXT;
    new_id VARCHAR(255);
    normalized_path TEXT;
BEGIN
    FOR card_record IN 
        SELECT * FROM advanced_universe_cards WHERE alternate_images IS NOT NULL AND array_length(alternate_images, 1) > 0
    LOOP
        FOREACH alt_image IN ARRAY card_record.alternate_images
        LOOP
            new_id := gen_random_uuid()::text;
            normalized_path := normalize_alt_image_path(alt_image, 'advanced_universe');
            
            INSERT INTO advanced_universe_cards (
                id, name, universe, card_description, image_path, alternate_images, 
                one_per_deck, character, created_at, updated_at
            )
            VALUES (
                new_id::uuid,
                card_record.name,
                card_record.universe,
                card_record.card_description,
                normalized_path,
                ARRAY[]::TEXT[],
                card_record.one_per_deck,
                card_record.character,
                card_record.created_at,
                NOW()
            );
            
            INSERT INTO alternate_card_mappings (old_card_id, new_card_id, card_type, image_path)
            VALUES (card_record.id, new_id, 'advanced_universe', normalized_path)
            ON CONFLICT DO NOTHING;
        END LOOP;
        
        UPDATE advanced_universe_cards 
        SET alternate_images = ARRAY[]::TEXT[], updated_at = NOW()
        WHERE id = card_record.id;
    END LOOP;
END $$;

-- Step 10: Migrate teamwork_cards table
DO $$
DECLARE
    card_record RECORD;
    alt_image TEXT;
    new_id VARCHAR(255);
    normalized_path TEXT;
BEGIN
    FOR card_record IN 
        SELECT * FROM teamwork_cards WHERE alternate_images IS NOT NULL AND array_length(alternate_images, 1) > 0
    LOOP
        FOREACH alt_image IN ARRAY card_record.alternate_images
        LOOP
            new_id := gen_random_uuid()::text;
            normalized_path := normalize_alt_image_path(alt_image, 'teamwork');
            
            INSERT INTO teamwork_cards (
                id, name, universe, card_description, image_path, alternate_images, 
                one_per_deck, created_at, updated_at
            )
            VALUES (
                new_id::uuid,
                card_record.name,
                card_record.universe,
                card_record.card_description,
                normalized_path,
                ARRAY[]::TEXT[],
                card_record.one_per_deck,
                card_record.created_at,
                NOW()
            );
            
            INSERT INTO alternate_card_mappings (old_card_id, new_card_id, card_type, image_path)
            VALUES (card_record.id, new_id, 'teamwork', normalized_path)
            ON CONFLICT DO NOTHING;
        END LOOP;
        
        UPDATE teamwork_cards 
        SET alternate_images = ARRAY[]::TEXT[], updated_at = NOW()
        WHERE id = card_record.id;
    END LOOP;
END $$;

-- Step 11: Migrate ally_universe_cards table
DO $$
DECLARE
    card_record RECORD;
    alt_image TEXT;
    new_id VARCHAR(255);
    normalized_path TEXT;
BEGIN
    FOR card_record IN 
        SELECT * FROM ally_universe_cards WHERE alternate_images IS NOT NULL AND array_length(alternate_images, 1) > 0
    LOOP
        FOREACH alt_image IN ARRAY card_record.alternate_images
        LOOP
            new_id := gen_random_uuid()::text;
            normalized_path := normalize_alt_image_path(alt_image, 'ally_universe');
            
            INSERT INTO ally_universe_cards (
                id, name, universe, card_description, image_path, alternate_images, 
                one_per_deck, created_at, updated_at
            )
            VALUES (
                new_id::uuid,
                card_record.name,
                card_record.universe,
                card_record.card_description,
                normalized_path,
                ARRAY[]::TEXT[],
                card_record.one_per_deck,
                card_record.created_at,
                NOW()
            );
            
            INSERT INTO alternate_card_mappings (old_card_id, new_card_id, card_type, image_path)
            VALUES (card_record.id, new_id, 'ally_universe', normalized_path)
            ON CONFLICT DO NOTHING;
        END LOOP;
        
        UPDATE ally_universe_cards 
        SET alternate_images = ARRAY[]::TEXT[], updated_at = NOW()
        WHERE id = card_record.id;
    END LOOP;
END $$;

-- Step 12: Migrate training_cards table
DO $$
DECLARE
    card_record RECORD;
    alt_image TEXT;
    new_id VARCHAR(255);
    normalized_path TEXT;
BEGIN
    FOR card_record IN 
        SELECT * FROM training_cards WHERE alternate_images IS NOT NULL AND array_length(alternate_images, 1) > 0
    LOOP
        FOREACH alt_image IN ARRAY card_record.alternate_images
        LOOP
            new_id := gen_random_uuid()::text;
            normalized_path := normalize_alt_image_path(alt_image, 'training');
            
            INSERT INTO training_cards (
                id, name, universe, card_description, image_path, alternate_images, 
                one_per_deck, created_at, updated_at
            )
            VALUES (
                new_id::uuid,
                card_record.name,
                card_record.universe,
                card_record.card_description,
                normalized_path,
                ARRAY[]::TEXT[],
                card_record.one_per_deck,
                card_record.created_at,
                NOW()
            );
            
            INSERT INTO alternate_card_mappings (old_card_id, new_card_id, card_type, image_path)
            VALUES (card_record.id, new_id, 'training', normalized_path)
            ON CONFLICT DO NOTHING;
        END LOOP;
        
        UPDATE training_cards 
        SET alternate_images = ARRAY[]::TEXT[], updated_at = NOW()
        WHERE id = card_record.id;
    END LOOP;
END $$;

-- Step 13: Migrate basic_universe_cards table
DO $$
DECLARE
    card_record RECORD;
    alt_image TEXT;
    new_id VARCHAR(255);
    normalized_path TEXT;
BEGIN
    FOR card_record IN 
        SELECT * FROM basic_universe_cards WHERE alternate_images IS NOT NULL AND array_length(alternate_images, 1) > 0
    LOOP
        FOREACH alt_image IN ARRAY card_record.alternate_images
        LOOP
            new_id := gen_random_uuid()::text;
            normalized_path := normalize_alt_image_path(alt_image, 'basic_universe');
            
            INSERT INTO basic_universe_cards (
                id, name, universe, card_description, image_path, alternate_images, 
                one_per_deck, created_at, updated_at
            )
            VALUES (
                new_id::uuid,
                card_record.name,
                card_record.universe,
                card_record.card_description,
                normalized_path,
                ARRAY[]::TEXT[],
                card_record.one_per_deck,
                card_record.created_at,
                NOW()
            );
            
            INSERT INTO alternate_card_mappings (old_card_id, new_card_id, card_type, image_path)
            VALUES (card_record.id, new_id, 'basic_universe', normalized_path)
            ON CONFLICT DO NOTHING;
        END LOOP;
        
        UPDATE basic_universe_cards 
        SET alternate_images = ARRAY[]::TEXT[], updated_at = NOW()
        WHERE id = card_record.id;
    END LOOP;
END $$;

-- Step 14: Update deck_cards to reference new alternate card IDs
-- Match selected_alternate_image to the new alternate card's image_path
UPDATE deck_cards dc
SET card_id = acm.new_card_id::uuid
FROM alternate_card_mappings acm
WHERE dc.card_id::text = acm.old_card_id
  AND dc.card_type = acm.card_type
  AND dc.selected_alternate_image IS NOT NULL
  AND (
    -- Match various formats of selected_alternate_image to normalized image_path
    normalize_alt_image_path(dc.selected_alternate_image, dc.card_type) = acm.image_path
    OR dc.selected_alternate_image = acm.image_path
    OR dc.selected_alternate_image LIKE '%' || split_part(acm.image_path, '/', -1)
  );

-- Step 15: Update collection_cards to reference new alternate card IDs
-- Match image_path containing /alternate/ to the new alternate card's image_path
-- Note: collection_cards.card_id is UUID, so we need to cast the new_card_id (VARCHAR) to UUID
UPDATE collection_cards cc
SET card_id = acm.new_card_id::uuid
FROM alternate_card_mappings acm
WHERE cc.card_id::text = acm.old_card_id
  AND cc.card_type = acm.card_type
  AND cc.image_path LIKE '%/alternate/%'
  AND (
    -- Match collection card's image_path to alternate card's image_path
    -- Handle both full paths and relative paths
    cc.image_path LIKE '%' || split_part(acm.image_path, '/', -1)
    OR split_part(cc.image_path, '/', -1) = split_part(acm.image_path, '/', -1)
    OR normalize_alt_image_path(cc.image_path, cc.card_type) = acm.image_path
  );

-- Step 16: Drop alternate_images columns from all card tables
ALTER TABLE characters DROP COLUMN IF EXISTS alternate_images;
ALTER TABLE special_cards DROP COLUMN IF EXISTS alternate_images;
ALTER TABLE power_cards DROP COLUMN IF EXISTS alternate_images;
ALTER TABLE missions DROP COLUMN IF EXISTS alternate_images;
ALTER TABLE events DROP COLUMN IF EXISTS alternate_images;
ALTER TABLE aspects DROP COLUMN IF EXISTS alternate_images;
ALTER TABLE advanced_universe_cards DROP COLUMN IF EXISTS alternate_images;
ALTER TABLE teamwork_cards DROP COLUMN IF EXISTS alternate_images;
ALTER TABLE ally_universe_cards DROP COLUMN IF EXISTS alternate_images;
ALTER TABLE training_cards DROP COLUMN IF EXISTS alternate_images;
ALTER TABLE basic_universe_cards DROP COLUMN IF EXISTS alternate_images;

-- Step 17: Drop selected_alternate_image from deck_cards
ALTER TABLE deck_cards DROP COLUMN IF EXISTS selected_alternate_image;

-- Step 18: Clean up helper function
DROP FUNCTION IF EXISTS normalize_alt_image_path(TEXT, TEXT);

-- Note: The temporary mapping table will be automatically dropped at the end of the transaction


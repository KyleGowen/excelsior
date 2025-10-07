-- Update the trigger functions to populate character image columns
-- This addresses the need to store selected_alternate_image for each character

-- Drop and recreate the update_deck_character_location_refs function with character image support
DROP TRIGGER IF EXISTS trigger_update_deck_character_location_refs ON deck_cards;
DROP FUNCTION IF EXISTS update_deck_character_location_refs();

CREATE OR REPLACE FUNCTION update_deck_character_location_refs()
RETURNS TRIGGER AS $$
DECLARE
    char_count INTEGER := 0;
    char1_id UUID := NULL;
    char2_id UUID := NULL;
    char3_id UUID := NULL;
    char4_id UUID := NULL;
    char1_image VARCHAR(500) := NULL;
    char2_image VARCHAR(500) := NULL;
    char3_image VARCHAR(500) := NULL;
    char4_image VARCHAR(500) := NULL;
    loc_id UUID := NULL;
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        -- Update character references if this is a character card
        IF NEW.card_type = 'character' THEN
            -- Get the first 4 character IDs and their images (only valid UUIDs)
            SELECT 
                MAX(CASE WHEN row_num = 1 THEN card_id END),
                MAX(CASE WHEN row_num = 2 THEN card_id END),
                MAX(CASE WHEN row_num = 3 THEN card_id END),
                MAX(CASE WHEN row_num = 4 THEN card_id END),
                MAX(CASE WHEN row_num = 1 THEN selected_alternate_image END),
                MAX(CASE WHEN row_num = 2 THEN selected_alternate_image END),
                MAX(CASE WHEN row_num = 3 THEN selected_alternate_image END),
                MAX(CASE WHEN row_num = 4 THEN selected_alternate_image END)
            INTO char1_id, char2_id, char3_id, char4_id, char1_image, char2_image, char3_image, char4_image
            FROM (
                SELECT card_id, selected_alternate_image, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
                FROM deck_cards 
                WHERE deck_id = NEW.deck_id AND card_type = 'character'
                AND card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            ) ranked_chars;
            
            UPDATE decks 
            SET character_1_id = char1_id::UUID,
                character_2_id = char2_id::UUID,
                character_3_id = char3_id::UUID,
                character_4_id = char4_id::UUID,
                character_1_image = char1_image,
                character_2_image = char2_image,
                character_3_image = char3_image,
                character_4_image = char4_image,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.deck_id;
        END IF;
        
        -- Update location reference if this is a location card
        IF NEW.card_type = 'location' THEN
            -- Get the location card for this deck (only valid UUIDs)
            SELECT card_id INTO loc_id
            FROM deck_cards 
            WHERE deck_id = NEW.deck_id AND card_type = 'location'
            AND card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            LIMIT 1;
            
            UPDATE decks 
            SET location_id = loc_id::UUID,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.deck_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- Update character references if this is a character card
        IF NEW.card_type = 'character' THEN
            -- Get the first 4 character IDs and their images (only valid UUIDs)
            SELECT 
                MAX(CASE WHEN row_num = 1 THEN card_id END),
                MAX(CASE WHEN row_num = 2 THEN card_id END),
                MAX(CASE WHEN row_num = 3 THEN card_id END),
                MAX(CASE WHEN row_num = 4 THEN card_id END),
                MAX(CASE WHEN row_num = 1 THEN selected_alternate_image END),
                MAX(CASE WHEN row_num = 2 THEN selected_alternate_image END),
                MAX(CASE WHEN row_num = 3 THEN selected_alternate_image END),
                MAX(CASE WHEN row_num = 4 THEN selected_alternate_image END)
            INTO char1_id, char2_id, char3_id, char4_id, char1_image, char2_image, char3_image, char4_image
            FROM (
                SELECT card_id, selected_alternate_image, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
                FROM deck_cards 
                WHERE deck_id = NEW.deck_id AND card_type = 'character'
                AND card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            ) ranked_chars;
            
            UPDATE decks 
            SET character_1_id = char1_id::UUID,
                character_2_id = char2_id::UUID,
                character_3_id = char3_id::UUID,
                character_4_id = char4_id::UUID,
                character_1_image = char1_image,
                character_2_image = char2_image,
                character_3_image = char3_image,
                character_4_image = char4_image,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.deck_id;
        END IF;
        
        -- Update location reference if this is a location card
        IF NEW.card_type = 'location' THEN
            -- Get the location card for this deck (only valid UUIDs)
            SELECT card_id INTO loc_id
            FROM deck_cards 
            WHERE deck_id = NEW.deck_id AND card_type = 'location'
            AND card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            LIMIT 1;
            
            UPDATE decks 
            SET location_id = loc_id::UUID,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.deck_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        -- Update character references if this was a character card
        IF OLD.card_type = 'character' THEN
            -- Get the first 4 character IDs and their images (only valid UUIDs)
            SELECT 
                MAX(CASE WHEN row_num = 1 THEN card_id END),
                MAX(CASE WHEN row_num = 2 THEN card_id END),
                MAX(CASE WHEN row_num = 3 THEN card_id END),
                MAX(CASE WHEN row_num = 4 THEN card_id END),
                MAX(CASE WHEN row_num = 1 THEN selected_alternate_image END),
                MAX(CASE WHEN row_num = 2 THEN selected_alternate_image END),
                MAX(CASE WHEN row_num = 3 THEN selected_alternate_image END),
                MAX(CASE WHEN row_num = 4 THEN selected_alternate_image END)
            INTO char1_id, char2_id, char3_id, char4_id, char1_image, char2_image, char3_image, char4_image
            FROM (
                SELECT card_id, selected_alternate_image, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
                FROM deck_cards 
                WHERE deck_id = OLD.deck_id AND card_type = 'character'
                AND card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            ) ranked_chars;
            
            UPDATE decks 
            SET character_1_id = char1_id::UUID,
                character_2_id = char2_id::UUID,
                character_3_id = char3_id::UUID,
                character_4_id = char4_id::UUID,
                character_1_image = char1_image,
                character_2_image = char2_image,
                character_3_image = char3_image,
                character_4_image = char4_image,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.deck_id;
        END IF;
        
        -- Update location reference if this was a location card
        IF OLD.card_type = 'location' THEN
            -- Get the location card for this deck (only valid UUIDs)
            SELECT card_id INTO loc_id
            FROM deck_cards 
            WHERE deck_id = OLD.deck_id AND card_type = 'location'
            AND card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            LIMIT 1;
            
            UPDATE decks 
            SET location_id = loc_id::UUID,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.deck_id;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_update_deck_character_location_refs
    AFTER INSERT OR UPDATE OR DELETE ON deck_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_deck_character_location_refs();

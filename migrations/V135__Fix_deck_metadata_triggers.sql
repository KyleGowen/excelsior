-- Fix the trigger functions to handle type casting and invalid UUIDs properly
-- This addresses the "operator does not exist: uuid = character varying" error

-- Drop the triggers first
DROP TRIGGER IF EXISTS trigger_update_deck_threat ON deck_cards;
DROP TRIGGER IF EXISTS trigger_update_deck_character_location_refs ON deck_cards;

-- Drop and recreate the update_deck_threat function with proper type casting
DROP FUNCTION IF EXISTS update_deck_threat();

CREATE OR REPLACE FUNCTION update_deck_threat()
RETURNS TRIGGER AS $$
DECLARE
    character_threat INTEGER := 0;
    location_threat INTEGER := 0;
    total_threat INTEGER := 0;
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        -- Only update threat for character and location cards
        IF NEW.card_type IN ('character', 'location') THEN
            -- Calculate total threat for this deck
            SELECT COALESCE(SUM(c.threat_level * dc.quantity), 0) INTO character_threat
            FROM deck_cards dc
            JOIN characters c ON c.id::VARCHAR(255) = dc.card_id
            WHERE dc.deck_id = NEW.deck_id AND dc.card_type = 'character'
            AND dc.card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
            
            SELECT COALESCE(SUM(l.threat_level * dc.quantity), 0) INTO location_threat
            FROM deck_cards dc
            JOIN locations l ON l.id::VARCHAR(255) = dc.card_id
            WHERE dc.deck_id = NEW.deck_id AND dc.card_type = 'location'
            AND dc.card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
            
            total_threat := character_threat + location_threat;
            
            UPDATE decks 
            SET threat = total_threat,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.deck_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- Update threat if character or location card quantity changed
        IF NEW.card_type IN ('character', 'location') THEN
            -- Calculate total threat for this deck
            SELECT COALESCE(SUM(c.threat_level * dc.quantity), 0) INTO character_threat
            FROM deck_cards dc
            JOIN characters c ON c.id::VARCHAR(255) = dc.card_id
            WHERE dc.deck_id = NEW.deck_id AND dc.card_type = 'character'
            AND dc.card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
            
            SELECT COALESCE(SUM(l.threat_level * dc.quantity), 0) INTO location_threat
            FROM deck_cards dc
            JOIN locations l ON l.id::VARCHAR(255) = dc.card_id
            WHERE dc.deck_id = NEW.deck_id AND dc.card_type = 'location'
            AND dc.card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
            
            total_threat := character_threat + location_threat;
            
            UPDATE decks 
            SET threat = total_threat,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.deck_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        -- Only update threat for character and location cards
        IF OLD.card_type IN ('character', 'location') THEN
            -- Calculate total threat for this deck
            SELECT COALESCE(SUM(c.threat_level * dc.quantity), 0) INTO character_threat
            FROM deck_cards dc
            JOIN characters c ON c.id::VARCHAR(255) = dc.card_id
            WHERE dc.deck_id = OLD.deck_id AND dc.card_type = 'character'
            AND dc.card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
            
            SELECT COALESCE(SUM(l.threat_level * dc.quantity), 0) INTO location_threat
            FROM deck_cards dc
            JOIN locations l ON l.id::VARCHAR(255) = dc.card_id
            WHERE dc.deck_id = OLD.deck_id AND dc.card_type = 'location'
            AND dc.card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
            
            total_threat := character_threat + location_threat;
            
            UPDATE decks 
            SET threat = total_threat,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.deck_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the update_deck_character_location_refs function with proper type casting
DROP FUNCTION IF EXISTS update_deck_character_location_refs();

CREATE OR REPLACE FUNCTION update_deck_character_location_refs()
RETURNS TRIGGER AS $$
DECLARE
    char_count INTEGER := 0;
    char1_id UUID := NULL;
    char2_id UUID := NULL;
    char3_id UUID := NULL;
    char4_id UUID := NULL;
    loc_id UUID := NULL;
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        -- Update character references if this is a character card
        IF NEW.card_type = 'character' THEN
            -- Get the first 4 character IDs (only valid UUIDs)
            SELECT 
                MAX(CASE WHEN row_num = 1 THEN card_id END),
                MAX(CASE WHEN row_num = 2 THEN card_id END),
                MAX(CASE WHEN row_num = 3 THEN card_id END),
                MAX(CASE WHEN row_num = 4 THEN card_id END)
            INTO char1_id, char2_id, char3_id, char4_id
            FROM (
                SELECT card_id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
                FROM deck_cards 
                WHERE deck_id = NEW.deck_id AND card_type = 'character'
                AND card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            ) ranked_chars;
            
            UPDATE decks 
            SET character_1_id = char1_id::UUID,
                character_2_id = char2_id::UUID,
                character_3_id = char3_id::UUID,
                character_4_id = char4_id::UUID,
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
            -- Get the first 4 character IDs (only valid UUIDs)
            SELECT 
                MAX(CASE WHEN row_num = 1 THEN card_id END),
                MAX(CASE WHEN row_num = 2 THEN card_id END),
                MAX(CASE WHEN row_num = 3 THEN card_id END),
                MAX(CASE WHEN row_num = 4 THEN card_id END)
            INTO char1_id, char2_id, char3_id, char4_id
            FROM (
                SELECT card_id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
                FROM deck_cards 
                WHERE deck_id = NEW.deck_id AND card_type = 'character'
                AND card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            ) ranked_chars;
            
            UPDATE decks 
            SET character_1_id = char1_id::UUID,
                character_2_id = char2_id::UUID,
                character_3_id = char3_id::UUID,
                character_4_id = char4_id::UUID,
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
            -- Get the first 4 character IDs (only valid UUIDs)
            SELECT 
                MAX(CASE WHEN row_num = 1 THEN card_id END),
                MAX(CASE WHEN row_num = 2 THEN card_id END),
                MAX(CASE WHEN row_num = 3 THEN card_id END),
                MAX(CASE WHEN row_num = 4 THEN card_id END)
            INTO char1_id, char2_id, char3_id, char4_id
            FROM (
                SELECT card_id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
                FROM deck_cards 
                WHERE deck_id = OLD.deck_id AND card_type = 'character'
                AND card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            ) ranked_chars;
            
            UPDATE decks 
            SET character_1_id = char1_id::UUID,
                character_2_id = char2_id::UUID,
                character_3_id = char3_id::UUID,
                character_4_id = char4_id::UUID,
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

-- Recreate the triggers
CREATE TRIGGER trigger_update_deck_threat
    AFTER INSERT OR UPDATE OR DELETE ON deck_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_deck_threat();

CREATE TRIGGER trigger_update_deck_character_location_refs
    AFTER INSERT OR UPDATE OR DELETE ON deck_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_deck_character_location_refs();

-- Create trigger functions and triggers to automatically update deck metadata
-- This ensures card_count, threat, and character/location columns stay in sync

-- Function to update deck card count
CREATE OR REPLACE FUNCTION update_deck_card_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        -- Only count non-character, non-location, non-mission cards
        IF NEW.card_type NOT IN ('character', 'location', 'mission') THEN
            UPDATE decks 
            SET card_count = card_count + NEW.quantity,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.deck_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- Handle quantity changes for non-character, non-location, non-mission cards
        IF NEW.card_type NOT IN ('character', 'location', 'mission') THEN
            UPDATE decks 
            SET card_count = card_count - OLD.quantity + NEW.quantity,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.deck_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        -- Only count non-character, non-location, non-mission cards
        IF OLD.card_type NOT IN ('character', 'location', 'mission') THEN
            UPDATE decks 
            SET card_count = card_count - OLD.quantity,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.deck_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update deck threat level
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
            WHERE dc.deck_id = NEW.deck_id AND dc.card_type = 'character';
            
            SELECT COALESCE(SUM(l.threat_level * dc.quantity), 0) INTO location_threat
            FROM deck_cards dc
            JOIN locations l ON l.id::VARCHAR(255) = dc.card_id
            WHERE dc.deck_id = NEW.deck_id AND dc.card_type = 'location';
            
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
            WHERE dc.deck_id = NEW.deck_id AND dc.card_type = 'character';
            
            SELECT COALESCE(SUM(l.threat_level * dc.quantity), 0) INTO location_threat
            FROM deck_cards dc
            JOIN locations l ON l.id::VARCHAR(255) = dc.card_id
            WHERE dc.deck_id = NEW.deck_id AND dc.card_type = 'location';
            
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
            WHERE dc.deck_id = OLD.deck_id AND dc.card_type = 'character';
            
            SELECT COALESCE(SUM(l.threat_level * dc.quantity), 0) INTO location_threat
            FROM deck_cards dc
            JOIN locations l ON l.id::VARCHAR(255) = dc.card_id
            WHERE dc.deck_id = OLD.deck_id AND dc.card_type = 'location';
            
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

-- Function to update deck character and location references
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
            -- Get character cards for this deck, ordered by creation time
            SELECT COUNT(*) INTO char_count
            FROM deck_cards 
            WHERE deck_id = NEW.deck_id AND card_type = 'character';
            
            -- Get the first 4 character IDs
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
            -- Get the location card for this deck
            SELECT card_id INTO loc_id
            FROM deck_cards 
            WHERE deck_id = NEW.deck_id AND card_type = 'location'
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
            -- Get the first 4 character IDs
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
            -- Get the location card for this deck
            SELECT card_id INTO loc_id
            FROM deck_cards 
            WHERE deck_id = NEW.deck_id AND card_type = 'location'
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
            -- Get the first 4 character IDs
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
            -- Get the location card for this deck
            SELECT card_id INTO loc_id
            FROM deck_cards 
            WHERE deck_id = OLD.deck_id AND card_type = 'location'
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

-- Create triggers
CREATE TRIGGER trigger_update_deck_card_count
    AFTER INSERT OR UPDATE OR DELETE ON deck_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_deck_card_count();

CREATE TRIGGER trigger_update_deck_threat
    AFTER INSERT OR UPDATE OR DELETE ON deck_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_deck_threat();

CREATE TRIGGER trigger_update_deck_character_location_refs
    AFTER INSERT OR UPDATE OR DELETE ON deck_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_deck_character_location_refs();

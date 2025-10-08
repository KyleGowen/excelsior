-- Update threat calculation to account for reserve character adjustments
-- Carson of Venus: 18 -> 19 when reserve
-- Morgan le Fay: 19 -> 20 when reserve  
-- Victory Harben: 18 -> 20 when reserve

-- Drop the existing trigger
DROP TRIGGER IF EXISTS trigger_update_deck_threat ON deck_cards;

-- Drop and recreate the update_deck_threat function with reserve character logic
DROP FUNCTION IF EXISTS update_deck_threat();

CREATE OR REPLACE FUNCTION update_deck_threat()
RETURNS TRIGGER AS $$
DECLARE
    character_threat INTEGER := 0;
    location_threat INTEGER := 0;
    total_threat INTEGER := 0;
    reserve_character_id UUID;
    character_threat_level INTEGER;
BEGIN
    -- Get the reserve character for this deck
    SELECT d.reserve_character INTO reserve_character_id
    FROM decks d
    WHERE d.id = NEW.deck_id;
    
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        -- Only update threat for character and location cards
        IF NEW.card_type IN ('character', 'location') THEN
            -- Calculate total threat for this deck
            SELECT COALESCE(SUM(
                CASE 
                    -- Carson of Venus: 18 -> 19 when reserve
                    WHEN c.name = 'Carson of Venus' AND c.id = reserve_character_id THEN 19
                    -- Morgan le Fay: 19 -> 20 when reserve
                    WHEN c.name = 'Morgan le Fay' AND c.id = reserve_character_id THEN 20
                    -- Victory Harben: 18 -> 20 when reserve
                    WHEN c.name = 'Victory Harben' AND c.id = reserve_character_id THEN 20
                    -- All other characters use their normal threat level
                    ELSE c.threat_level
                END * dc.quantity
            ), 0) INTO character_threat
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
            SELECT COALESCE(SUM(
                CASE 
                    -- Carson of Venus: 18 -> 19 when reserve
                    WHEN c.name = 'Carson of Venus' AND c.id = reserve_character_id THEN 19
                    -- Morgan le Fay: 19 -> 20 when reserve
                    WHEN c.name = 'Morgan le Fay' AND c.id = reserve_character_id THEN 20
                    -- Victory Harben: 18 -> 20 when reserve
                    WHEN c.name = 'Victory Harben' AND c.id = reserve_character_id THEN 20
                    -- All other characters use their normal threat level
                    ELSE c.threat_level
                END * dc.quantity
            ), 0) INTO character_threat
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
            SELECT COALESCE(SUM(
                CASE 
                    -- Carson of Venus: 18 -> 19 when reserve
                    WHEN c.name = 'Carson of Venus' AND c.id = reserve_character_id THEN 19
                    -- Morgan le Fay: 19 -> 20 when reserve
                    WHEN c.name = 'Morgan le Fay' AND c.id = reserve_character_id THEN 20
                    -- Victory Harben: 18 -> 20 when reserve
                    WHEN c.name = 'Victory Harben' AND c.id = reserve_character_id THEN 20
                    -- All other characters use their normal threat level
                    ELSE c.threat_level
                END * dc.quantity
            ), 0) INTO character_threat
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

-- Recreate the trigger
CREATE TRIGGER trigger_update_deck_threat
    AFTER INSERT OR UPDATE OR DELETE ON deck_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_deck_threat();

-- Also create a trigger to update threat when reserve_character changes
CREATE OR REPLACE FUNCTION update_deck_threat_on_reserve_change()
RETURNS TRIGGER AS $$
DECLARE
    character_threat INTEGER := 0;
    location_threat INTEGER := 0;
    total_threat INTEGER := 0;
BEGIN
    -- Only update if reserve_character changed
    IF OLD.reserve_character IS DISTINCT FROM NEW.reserve_character THEN
        -- Calculate total threat for this deck
        SELECT COALESCE(SUM(
            CASE 
                -- Carson of Venus: 18 -> 19 when reserve
                WHEN c.name = 'Carson of Venus' AND c.id = NEW.reserve_character THEN 19
                -- Morgan le Fay: 19 -> 20 when reserve
                WHEN c.name = 'Morgan le Fay' AND c.id = NEW.reserve_character THEN 20
                -- Victory Harben: 18 -> 20 when reserve
                WHEN c.name = 'Victory Harben' AND c.id = NEW.reserve_character THEN 20
                -- All other characters use their normal threat level
                ELSE c.threat_level
            END * dc.quantity
        ), 0) INTO character_threat
        FROM deck_cards dc
        JOIN characters c ON c.id::VARCHAR(255) = dc.card_id
        WHERE dc.deck_id = NEW.id AND dc.card_type = 'character'
        AND dc.card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        SELECT COALESCE(SUM(l.threat_level * dc.quantity), 0) INTO location_threat
        FROM deck_cards dc
        JOIN locations l ON l.id::VARCHAR(255) = dc.card_id
        WHERE dc.deck_id = NEW.id AND dc.card_type = 'location'
        AND dc.card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        total_threat := character_threat + location_threat;
        
        UPDATE decks 
        SET threat = total_threat,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then create trigger for reserve character changes
DROP TRIGGER IF EXISTS trigger_update_deck_threat_on_reserve_change ON decks;
CREATE TRIGGER trigger_update_deck_threat_on_reserve_change
    AFTER UPDATE ON decks
    FOR EACH ROW
    EXECUTE FUNCTION update_deck_threat_on_reserve_change();

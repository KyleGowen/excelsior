-- Populate existing decks with their current metadata values
-- This ensures all existing decks have correct card_count, threat, and character/location references

-- Update card_count for all existing decks
UPDATE decks 
SET card_count = (
    SELECT COALESCE(SUM(quantity), 0)
    FROM deck_cards 
    WHERE deck_cards.deck_id = decks.id 
    AND card_type NOT IN ('character', 'location', 'mission')
);

-- Update threat for all existing decks
UPDATE decks 
SET threat = (
    SELECT COALESCE(
        (SELECT COALESCE(SUM(c.threat_level * dc.quantity), 0)
         FROM deck_cards dc
         JOIN characters c ON c.id::VARCHAR(255) = dc.card_id
         WHERE dc.deck_id = decks.id AND dc.card_type = 'character'
         AND dc.card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') +
        (SELECT COALESCE(SUM(l.threat_level * dc.quantity), 0)
         FROM deck_cards dc
         JOIN locations l ON l.id::VARCHAR(255) = dc.card_id
         WHERE dc.deck_id = decks.id AND dc.card_type = 'location'
         AND dc.card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
        0
    )
);

-- Update character references for all existing decks
UPDATE decks 
SET 
    character_1_id = char_refs.char1_id::UUID,
    character_2_id = char_refs.char2_id::UUID,
    character_3_id = char_refs.char3_id::UUID,
    character_4_id = char_refs.char4_id::UUID
FROM (
    SELECT 
        deck_id,
        MAX(CASE WHEN row_num = 1 THEN card_id END) as char1_id,
        MAX(CASE WHEN row_num = 2 THEN card_id END) as char2_id,
        MAX(CASE WHEN row_num = 3 THEN card_id END) as char3_id,
        MAX(CASE WHEN row_num = 4 THEN card_id END) as char4_id
    FROM (
        SELECT 
            deck_id,
            card_id,
            ROW_NUMBER() OVER (PARTITION BY deck_id ORDER BY created_at) as row_num
        FROM deck_cards 
        WHERE card_type = 'character'
        AND card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' -- Only valid UUIDs
    ) ranked_chars
    GROUP BY deck_id
) char_refs
WHERE decks.id = char_refs.deck_id;

-- Update location references for all existing decks
UPDATE decks 
SET location_id = loc_refs.location_id::UUID
FROM (
    SELECT 
        deck_id,
        card_id as location_id
    FROM deck_cards 
    WHERE card_type = 'location'
    AND card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' -- Only valid UUIDs
) loc_refs
WHERE decks.id = loc_refs.deck_id;

-- Update the updated_at timestamp for all decks that were modified
UPDATE decks 
SET updated_at = CURRENT_TIMESTAMP
WHERE card_count > 0 OR threat > 0 OR character_1_id IS NOT NULL OR location_id IS NOT NULL;

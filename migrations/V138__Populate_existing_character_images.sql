-- Populate existing decks with their current character image values
-- This ensures all existing decks have correct character image references

-- Update character image references for all existing decks
UPDATE decks 
SET 
    character_1_image = char_refs.char1_image,
    character_2_image = char_refs.char2_image,
    character_3_image = char_refs.char3_image,
    character_4_image = char_refs.char4_image
FROM (
    SELECT 
        deck_id,
        MAX(CASE WHEN row_num = 1 THEN selected_alternate_image END) as char1_image,
        MAX(CASE WHEN row_num = 2 THEN selected_alternate_image END) as char2_image,
        MAX(CASE WHEN row_num = 3 THEN selected_alternate_image END) as char3_image,
        MAX(CASE WHEN row_num = 4 THEN selected_alternate_image END) as char4_image
    FROM (
        SELECT 
            deck_id,
            selected_alternate_image,
            ROW_NUMBER() OVER (PARTITION BY deck_id ORDER BY created_at) as row_num
        FROM deck_cards 
        WHERE card_type = 'character'
        AND card_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    ) ranked_chars
    GROUP BY deck_id
) char_refs
WHERE decks.id = char_refs.deck_id;

-- Update the updated_at timestamp for all decks that were modified
UPDATE decks 
SET updated_at = CURRENT_TIMESTAMP
WHERE character_1_image IS NOT NULL OR character_2_image IS NOT NULL OR character_3_image IS NOT NULL OR character_4_image IS NOT NULL;

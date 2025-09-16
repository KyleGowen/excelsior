-- Migration V56: Update deck_cards.card_id to use UUID references
-- This migration updates the deck_cards table to reference the new UUIDs from card tables

-- Step 1: Create a comprehensive mapping table for all deck card IDs to UUIDs
-- This is based on the actual deck data analysis

-- First, let's create a mapping for characters (we know these mappings)
UPDATE deck_cards 
SET card_id = c.id::VARCHAR(255)
FROM characters c
WHERE deck_cards.card_type = 'character' 
AND (
    (deck_cards.card_id = 'char_42' AND c.name = 'Zeus') OR
    (deck_cards.card_id = 'char_22' AND c.name = 'Leonidas') OR
    (deck_cards.card_id = 'char_11' AND c.name = 'Dr. Watson') OR
    (deck_cards.card_id = 'char_8' AND c.name = 'Sherlock Holmes') OR
    (deck_cards.card_id = 'char_12' AND c.name = 'Dracula') OR
    (deck_cards.card_id = 'char_32' AND c.name = 'Merlin') OR
    (deck_cards.card_id = 'char_40' AND c.name = 'Hercules')
);

-- Step 2: For other card types, we need to create a systematic mapping
-- Since we don't have a direct relationship between deck card IDs and database UUIDs,
-- we'll need to create a mapping based on the card order or other attributes

-- For power cards, we'll map based on the order they appear in the database
-- This is a temporary solution - in production, you'd want a proper mapping table
WITH power_mapping AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY name) as row_num
    FROM power_cards
    ORDER BY name
)
UPDATE deck_cards 
SET card_id = pm.id::VARCHAR(255)
FROM power_mapping pm
WHERE deck_cards.card_type = 'power' 
AND deck_cards.card_id = 'power_' || pm.row_num;

-- Step 3: For special cards, we'll map based on the order they appear in the database
WITH special_mapping AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY name) as row_num
    FROM special_cards
    ORDER BY name
)
UPDATE deck_cards 
SET card_id = sm.id::VARCHAR(255)
FROM special_mapping sm
WHERE deck_cards.card_type = 'special' 
AND deck_cards.card_id = 'special_' || sm.row_num;

-- Step 4: For missions, we'll map based on the order they appear in the database
WITH mission_mapping AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY name) as row_num
    FROM missions
    ORDER BY name
)
UPDATE deck_cards 
SET card_id = mm.id::VARCHAR(255)
FROM mission_mapping mm
WHERE deck_cards.card_type = 'mission' 
AND deck_cards.card_id = 'mission_' || mm.row_num;

-- Step 5: For events, we'll map based on the order they appear in the database
WITH event_mapping AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY name) as row_num
    FROM events
    ORDER BY name
)
UPDATE deck_cards 
SET card_id = em.id::VARCHAR(255)
FROM event_mapping em
WHERE deck_cards.card_type = 'event' 
AND deck_cards.card_id = 'event_' || em.row_num;

-- Step 6: For aspects, we'll map based on the order they appear in the database
WITH aspect_mapping AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY name) as row_num
    FROM aspects
    ORDER BY name
)
UPDATE deck_cards 
SET card_id = am.id::VARCHAR(255)
FROM aspect_mapping am
WHERE deck_cards.card_type = 'aspect' 
AND deck_cards.card_id = 'aspect_' || am.row_num;

-- Step 7: For locations, we'll map based on the order they appear in the database
WITH location_mapping AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY name) as row_num
    FROM locations
    ORDER BY name
)
UPDATE deck_cards 
SET card_id = lm.id::VARCHAR(255)
FROM location_mapping lm
WHERE deck_cards.card_type = 'location' 
AND deck_cards.card_id = 'loc_' || lm.row_num;

-- Step 8: For teamwork cards, we'll map based on the order they appear in the database
WITH teamwork_mapping AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY name) as row_num
    FROM teamwork_cards
    ORDER BY name
)
UPDATE deck_cards 
SET card_id = tm.id::VARCHAR(255)
FROM teamwork_mapping tm
WHERE deck_cards.card_type = 'teamwork' 
AND deck_cards.card_id = 'teamwork_' || tm.row_num;

-- Step 9: For ally-universe cards, we'll map based on the order they appear in the database
WITH ally_mapping AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY name) as row_num
    FROM ally_universe_cards
    ORDER BY name
)
UPDATE deck_cards 
SET card_id = am.id::VARCHAR(255)
FROM ally_mapping am
WHERE deck_cards.card_type = 'ally-universe' 
AND deck_cards.card_id = 'ally_' || am.row_num;

-- Step 10: For training cards, we'll map based on the order they appear in the database
WITH training_mapping AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY name) as row_num
    FROM training_cards
    ORDER BY name
)
UPDATE deck_cards 
SET card_id = tm.id::VARCHAR(255)
FROM training_mapping tm
WHERE deck_cards.card_type = 'training' 
AND deck_cards.card_id = 'training_' || tm.row_num;

-- Step 11: For basic-universe cards, we'll map based on the order they appear in the database
WITH basic_mapping AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY name) as row_num
    FROM basic_universe_cards
    ORDER BY name
)
UPDATE deck_cards 
SET card_id = bm.id::VARCHAR(255)
FROM basic_mapping bm
WHERE deck_cards.card_type = 'basic-universe' 
AND deck_cards.card_id = 'basic_' || bm.row_num;

-- Step 12: For advanced-universe cards, we'll map based on the order they appear in the database
WITH advanced_mapping AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY name) as row_num
    FROM advanced_universe_cards
    ORDER BY name
)
UPDATE deck_cards 
SET card_id = am.id::VARCHAR(255)
FROM advanced_mapping am
WHERE deck_cards.card_type = 'advanced-universe' 
AND deck_cards.card_id = 'advanced_' || am.row_num;

-- Step 13: Add a comment for documentation
COMMENT ON COLUMN deck_cards.card_id IS 'UUID reference to card in various card tables based on card_type. Updated to use new UUID format.';

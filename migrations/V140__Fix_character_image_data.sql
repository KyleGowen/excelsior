-- Fix character image data inconsistencies
-- This migration ensures that character image columns are properly populated
-- and handles cases where selected_alternate_image is NULL

-- First, let's check and fix any decks where character image columns are inconsistent
-- with the actual deck_cards data

-- Update character_1_image based on deck_cards data
UPDATE decks 
SET character_1_image = dc.selected_alternate_image
FROM deck_cards dc
WHERE decks.character_1_id::VARCHAR(255) = dc.card_id 
  AND dc.deck_id = decks.id 
  AND dc.card_type = 'character'
  AND dc.selected_alternate_image IS NOT NULL 
  AND dc.selected_alternate_image != '';

-- Update character_2_image based on deck_cards data
UPDATE decks 
SET character_2_image = dc.selected_alternate_image
FROM deck_cards dc
WHERE decks.character_2_id::VARCHAR(255) = dc.card_id 
  AND dc.deck_id = decks.id 
  AND dc.card_type = 'character'
  AND dc.selected_alternate_image IS NOT NULL 
  AND dc.selected_alternate_image != '';

-- Update character_3_image based on deck_cards data
UPDATE decks 
SET character_3_image = dc.selected_alternate_image
FROM deck_cards dc
WHERE decks.character_3_id::VARCHAR(255) = dc.card_id 
  AND dc.deck_id = decks.id 
  AND dc.card_type = 'character'
  AND dc.selected_alternate_image IS NOT NULL 
  AND dc.selected_alternate_image != '';

-- Update character_4_image based on deck_cards data
UPDATE decks 
SET character_4_image = dc.selected_alternate_image
FROM deck_cards dc
WHERE decks.character_4_id::VARCHAR(255) = dc.card_id 
  AND dc.deck_id = decks.id 
  AND dc.card_type = 'character'
  AND dc.selected_alternate_image IS NOT NULL 
  AND dc.selected_alternate_image != '';

-- Set character image columns to NULL where no alternate image is selected
-- This ensures proper fallback to default images in the frontend

UPDATE decks 
SET character_1_image = NULL
FROM deck_cards dc
WHERE decks.character_1_id::VARCHAR(255) = dc.card_id 
  AND dc.deck_id = decks.id 
  AND dc.card_type = 'character'
  AND (dc.selected_alternate_image IS NULL OR dc.selected_alternate_image = '');

UPDATE decks 
SET character_2_image = NULL
FROM deck_cards dc
WHERE decks.character_2_id::VARCHAR(255) = dc.card_id 
  AND dc.deck_id = decks.id 
  AND dc.card_type = 'character'
  AND (dc.selected_alternate_image IS NULL OR dc.selected_alternate_image = '');

UPDATE decks 
SET character_3_image = NULL
FROM deck_cards dc
WHERE decks.character_3_id::VARCHAR(255) = dc.card_id 
  AND dc.deck_id = decks.id 
  AND dc.card_type = 'character'
  AND (dc.selected_alternate_image IS NULL OR dc.selected_alternate_image = '');

UPDATE decks 
SET character_4_image = NULL
FROM deck_cards dc
WHERE decks.character_4_id::VARCHAR(255) = dc.card_id 
  AND dc.deck_id = decks.id 
  AND dc.card_type = 'character'
  AND (dc.selected_alternate_image IS NULL OR dc.selected_alternate_image = '');

-- Add a comment to document this fix
COMMENT ON COLUMN decks.character_1_image IS 'Selected alternate image path for the first character card in the deck. NULL means use default image from characters.image_path';
COMMENT ON COLUMN decks.character_2_image IS 'Selected alternate image path for the second character card in the deck. NULL means use default image from characters.image_path';
COMMENT ON COLUMN decks.character_3_image IS 'Selected alternate image path for the third character card in the deck. NULL means use default image from characters.image_path';
COMMENT ON COLUMN decks.character_4_image IS 'Selected alternate image path for the fourth character card in the deck. NULL means use default image from characters.image_path';

-- Fix remaining character image references after PNG migration
-- This migration ensures all character image references are updated from deck_cards
-- and fixes any inconsistencies between deck_cards and decks tables

-- First, ensure deck_cards.selected_alternate_image is updated for all affected characters
-- Update any remaining .webp references in deck_cards
UPDATE deck_cards
SET selected_alternate_image = REPLACE(selected_alternate_image, '.webp', '.png')
WHERE selected_alternate_image LIKE '%.webp%'
  AND selected_alternate_image NOT LIKE '%dracula2.webp%'
  AND selected_alternate_image NOT LIKE '%tars_tarkas2.webp%';

-- Handle specific cases that remain .webp (only the second alternate for some characters)
-- These are intentional and should remain .webp

-- Now sync all character image columns in decks from deck_cards
-- This ensures consistency between the two tables
UPDATE decks 
SET character_1_image = dc.selected_alternate_image
FROM deck_cards dc
WHERE decks.character_1_id::VARCHAR(255) = dc.card_id 
  AND dc.deck_id = decks.id 
  AND dc.card_type = 'character'
  AND dc.selected_alternate_image IS NOT NULL 
  AND dc.selected_alternate_image != ''
  AND (
    decks.character_1_image IS NULL 
    OR decks.character_1_image != dc.selected_alternate_image
  );

UPDATE decks 
SET character_2_image = dc.selected_alternate_image
FROM deck_cards dc
WHERE decks.character_2_id::VARCHAR(255) = dc.card_id 
  AND dc.deck_id = decks.id 
  AND dc.card_type = 'character'
  AND dc.selected_alternate_image IS NOT NULL 
  AND dc.selected_alternate_image != ''
  AND (
    decks.character_2_image IS NULL 
    OR decks.character_2_image != dc.selected_alternate_image
  );

UPDATE decks 
SET character_3_image = dc.selected_alternate_image
FROM deck_cards dc
WHERE decks.character_3_id::VARCHAR(255) = dc.card_id 
  AND dc.deck_id = decks.id 
  AND dc.card_type = 'character'
  AND dc.selected_alternate_image IS NOT NULL 
  AND dc.selected_alternate_image != ''
  AND (
    decks.character_3_image IS NULL 
    OR decks.character_3_image != dc.selected_alternate_image
  );

UPDATE decks 
SET character_4_image = dc.selected_alternate_image
FROM deck_cards dc
WHERE decks.character_4_id::VARCHAR(255) = dc.card_id 
  AND dc.deck_id = decks.id 
  AND dc.card_type = 'character'
  AND dc.selected_alternate_image IS NOT NULL 
  AND dc.selected_alternate_image != ''
  AND (
    decks.character_4_image IS NULL 
    OR decks.character_4_image != dc.selected_alternate_image
  );

-- Also update any .webp references that might still exist in decks.character_N_image columns
UPDATE decks 
SET character_1_image = REPLACE(character_1_image, '.webp', '.png')
WHERE character_1_image LIKE '%.webp%'
  AND character_1_image NOT LIKE '%dracula2.webp%'
  AND character_1_image NOT LIKE '%tars_tarkas2.webp%';

UPDATE decks 
SET character_2_image = REPLACE(character_2_image, '.webp', '.png')
WHERE character_2_image LIKE '%.webp%'
  AND character_2_image NOT LIKE '%dracula2.webp%'
  AND character_2_image NOT LIKE '%tars_tarkas2.webp%';

UPDATE decks 
SET character_3_image = REPLACE(character_3_image, '.webp', '.png')
WHERE character_3_image LIKE '%.webp%'
  AND character_3_image NOT LIKE '%dracula2.webp%'
  AND character_3_image NOT LIKE '%tars_tarkas2.webp%';

UPDATE decks 
SET character_4_image = REPLACE(character_4_image, '.webp', '.png')
WHERE character_4_image LIKE '%.webp%'
  AND character_4_image NOT LIKE '%dracula2.webp%'
  AND character_4_image NOT LIKE '%tars_tarkas2.webp%';

-- Touch updated_at timestamp for all modified decks
UPDATE decks
SET updated_at = NOW()
WHERE character_1_image LIKE '%.png%' 
   OR character_2_image LIKE '%.png%' 
   OR character_3_image LIKE '%.png%' 
   OR character_4_image LIKE '%.png%';


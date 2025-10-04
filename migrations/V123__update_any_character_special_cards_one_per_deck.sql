-- Update all "Any Character" special cards to one_per_deck=true except "Preternatural Healing"
-- This migration fixes the database data to match the expected behavior

UPDATE special_cards 
SET one_per_deck = true 
WHERE character_name = 'Any Character' 
  AND name != 'Preternatural Healing';

-- Verify the update
-- All "Any Character" cards should now have one_per_deck=true except "Preternatural Healing"
SELECT name, character_name, one_per_deck 
FROM special_cards 
WHERE character_name = 'Any Character' 
ORDER BY name;

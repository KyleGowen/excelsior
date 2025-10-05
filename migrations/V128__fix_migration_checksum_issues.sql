-- V128: Fix migration checksum issues and ensure proper migration handling
-- This migration addresses the checksum mismatch issues that were causing deployment failures

-- The previous migration V123 had checksum issues because it was modified after being applied
-- This migration ensures the database is in the correct state regardless of previous checksum issues

-- Ensure all "Any Character" special cards have one_per_deck=true except "Preternatural Healing"
UPDATE special_cards 
SET one_per_deck = true 
WHERE character_name = 'Any Character' 
  AND name != 'Preternatural Healing'
  AND one_per_deck != true;

-- Verify the state is correct
-- This should show all "Any Character" cards with one_per_deck=true except "Preternatural Healing"
SELECT name, character_name, one_per_deck 
FROM special_cards 
WHERE character_name = 'Any Character' 
ORDER BY name;

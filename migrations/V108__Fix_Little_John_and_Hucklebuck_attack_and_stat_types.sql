-- Fix swapped Attack Type and Stat Type fields for Little John and Hucklebuck
-- Little John should have Brute Force for both attack and stat types
-- Hucklebuck should have Combat for both attack and stat types

-- First, let's check the current state
-- Little John currently has: Combat (should be Brute Force)
-- Hucklebuck currently has: Brute Force (should be Combat)

-- Update Little John's attack type from Combat to Brute Force
UPDATE ally_universe_cards 
SET attack_type = 'Brute Force'
WHERE name = 'Little John' AND attack_type = 'Combat';

-- Update Little John's stat type from Combat to Brute Force  
UPDATE ally_universe_cards 
SET stat_type_to_use = 'Brute Force'
WHERE name = 'Little John' AND stat_type_to_use = 'Combat';

-- Update Hucklebuck's attack type from Brute Force to Combat
UPDATE ally_universe_cards 
SET attack_type = 'Combat'
WHERE name = 'Hucklebuck' AND attack_type = 'Brute Force';

-- Update Hucklebuck's stat type from Brute Force to Combat
UPDATE ally_universe_cards 
SET stat_type_to_use = 'Combat'
WHERE name = 'Hucklebuck' AND stat_type_to_use = 'Brute Force';

-- Verify the changes
-- Little John should now have: Brute Force for both attack and stat types
-- Hucklebuck should now have: Combat for both attack and stat types

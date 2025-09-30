-- Fix flipped image paths for Little John and Hucklebuck
-- Also correct the name from "Huckleblock" to "Hucklebuck"

-- First, let's check what we're working with
-- Little John should have: ally-universe/5_brute_force.webp
-- Hucklebuck should have: ally-universe/5_combat.webp

-- Update Little John's image path from combat to brute_force
UPDATE ally_universe_cards 
SET image_path = 'ally-universe/5_brute_force.webp'
WHERE name = 'Little John' AND image_path = 'ally-universe/5_combat.webp';

-- Update Hucklebuck's image path from brute_force to combat
UPDATE ally_universe_cards 
SET image_path = 'ally-universe/5_combat.webp'
WHERE name = 'Huckleblock' AND image_path = 'ally-universe/5_brute_force.webp';

-- Fix the name from "Huckleblock" to "Hucklebuck"
UPDATE ally_universe_cards 
SET name = 'Hucklebuck'
WHERE name = 'Huckleblock';

-- Verify the changes
-- Little John should now have: ally-universe/5_brute_force.webp
-- Hucklebuck should now have: ally-universe/5_combat.webp

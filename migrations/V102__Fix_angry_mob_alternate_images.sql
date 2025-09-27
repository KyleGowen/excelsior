-- Fix Angry Mob alternate images - each variant should only see their own specific alternate art
-- This corrects the V101 migration where all Angry Mob variants were getting all three alternate images

-- Angry Mob variants - each gets only their specific alternate image
UPDATE characters SET alternate_images = ARRAY['characters/alternate/angry_mob_industrial_age.webp'] WHERE name = 'Angry Mob (Industrial Age)';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/angry_mob_middle_ages.jpg'] WHERE name = 'Angry Mob (Middle Ages)';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/angry_mob_modern_age.webp'] WHERE name = 'Angry Mob (Modern Age)';

-- Verify the fix
SELECT name, alternate_images FROM characters WHERE name LIKE 'Angry Mob%' ORDER BY name;

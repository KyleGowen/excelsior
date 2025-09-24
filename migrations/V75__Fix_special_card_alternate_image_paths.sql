-- Fix special card alternate image paths to match corrected file names
UPDATE special_cards 
SET alternate_images = ARRAY['specials/alternate/preternatural_healing.jpg']::TEXT[]
WHERE name = 'Preternatural Healing';

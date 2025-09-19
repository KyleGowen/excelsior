-- Fix Preternatural Healing alternate image path to match corrected file name
UPDATE special_cards 
SET alternate_images = ARRAY['specials/alternate/preternatural_healing.jpg']
WHERE name = 'Preternatural Healing' 
AND alternate_images = ARRAY['specials/alternate/preturnatural_healing.jpg'];

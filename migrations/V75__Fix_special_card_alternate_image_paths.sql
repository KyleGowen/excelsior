-- Fix special card alternate image paths to match corrected file names
UPDATE special_cards 
SET alternate_images = '["specials/alternate/preternatural_healing.jpg"]'
WHERE name = 'Preternatural Healing';

-- Fix Transmogrification special card image path to use the correct file
-- The correct file is now transmogrification.webp (not transformation_trickery.webp)
UPDATE special_cards SET image_path = 'specials/transmogrification.webp' WHERE name = 'Transmogrification';

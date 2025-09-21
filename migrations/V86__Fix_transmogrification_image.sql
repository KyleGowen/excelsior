-- Fix Transmogrification special card image path
-- The file exists as transformation_trickery.webp but the database has transmogrification.webp
UPDATE special_cards SET image_path = 'specials/transformation_trickery.webp' WHERE name = 'Transmogrification';

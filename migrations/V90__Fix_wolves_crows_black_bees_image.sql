-- Fix Wolves, Crows, & Black Bees special card image path
-- The file is now wolves_crows_and_black_bees.webp (with "and" instead of underscore)
UPDATE special_cards SET image_path = 'specials/wolves_crows_and_black_bees.webp' WHERE name = 'Wolves, Crows, & Black Bees';

-- Fix Barsoomian Warrior & Statesman special card image path
-- The file is now barsoomian_warrior_and_statesman.webp (with "and" instead of underscore)
UPDATE special_cards SET image_path = 'specials/barsoomian_warrior_and_statesman.webp' WHERE name = 'Barsoomian Warrior & Statesman';

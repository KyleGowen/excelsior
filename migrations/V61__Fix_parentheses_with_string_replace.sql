-- Fix parentheses removal using string replacement
-- Pattern: filename_(text).webp -> filename_text.webp

-- Update characters table
UPDATE characters 
SET image_path = REPLACE(REPLACE(image_path, '(', '_'), ')', '')
WHERE image_path LIKE '%(%';

-- Update ally_universe_cards table
UPDATE ally_universe_cards 
SET image_path = REPLACE(REPLACE(image_path, '(', '_'), ')', '')
WHERE image_path LIKE '%(%';

-- Update aspects table
UPDATE aspects 
SET image_path = REPLACE(REPLACE(image_path, '(', '_'), ')', '')
WHERE image_path LIKE '%(%';

-- Update basic_universe_cards table
UPDATE basic_universe_cards 
SET image_path = REPLACE(REPLACE(image_path, '(', '_'), ')', '')
WHERE image_path LIKE '%(%';

-- Update events table
UPDATE events 
SET image_path = REPLACE(REPLACE(image_path, '(', '_'), ')', '')
WHERE image_path LIKE '%(%';

-- Update power_cards table
UPDATE power_cards 
SET image_path = REPLACE(REPLACE(image_path, '(', '_'), ')', '')
WHERE image_path LIKE '%(%';

-- Update teamwork_cards table
UPDATE teamwork_cards 
SET image_path = REPLACE(REPLACE(image_path, '(', '_'), ')', '')
WHERE image_path LIKE '%(%';

-- Update training_cards table
UPDATE training_cards 
SET image_path = REPLACE(REPLACE(image_path, '(', '_'), ')', '')
WHERE image_path LIKE '%(%';

-- Update special_cards table
UPDATE special_cards 
SET image_path = REPLACE(REPLACE(image_path, '(', '_'), ')', '')
WHERE image_path LIKE '%(%';

-- Update missions table
UPDATE missions 
SET image_path = REPLACE(REPLACE(image_path, '(', '_'), ')', '')
WHERE image_path LIKE '%(%';

-- Update locations table
UPDATE locations 
SET image_path = REPLACE(REPLACE(image_path, '(', '_'), ')', '')
WHERE image_path LIKE '%(%';

-- Update advanced_universe_cards table
UPDATE advanced_universe_cards 
SET image_path = REPLACE(REPLACE(image_path, '(', '_'), ')', '')
WHERE image_path LIKE '%(%';

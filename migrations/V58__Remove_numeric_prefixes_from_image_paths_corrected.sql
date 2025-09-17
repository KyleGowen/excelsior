-- Remove numeric prefixes from image_path columns (corrected pattern)
-- Pattern: directory/###_filename.webp -> directory/filename.webp

-- Update ally_universe_cards
UPDATE ally_universe_cards 
SET image_path = REGEXP_REPLACE(image_path, '/([0-9]+_)', '/')
WHERE image_path ~ '/[0-9]+_';

-- Update aspects
UPDATE aspects 
SET image_path = REGEXP_REPLACE(image_path, '/([0-9]+_)', '/')
WHERE image_path ~ '/[0-9]+_';

-- Update basic_universe_cards
UPDATE basic_universe_cards 
SET image_path = REGEXP_REPLACE(image_path, '/([0-9]+_)', '/')
WHERE image_path ~ '/[0-9]+_';

-- Update events
UPDATE events 
SET image_path = REGEXP_REPLACE(image_path, '/([0-9]+_)', '/')
WHERE image_path ~ '/[0-9]+_';

-- Update power_cards
UPDATE power_cards 
SET image_path = REGEXP_REPLACE(image_path, '/([0-9]+_)', '/')
WHERE image_path ~ '/[0-9]+_';

-- Update teamwork_cards
UPDATE teamwork_cards 
SET image_path = REGEXP_REPLACE(image_path, '/([0-9]+_)', '/')
WHERE image_path ~ '/[0-9]+_';

-- Update training_cards
UPDATE training_cards 
SET image_path = REGEXP_REPLACE(image_path, '/([0-9]+_)', '/')
WHERE image_path ~ '/[0-9]+_';

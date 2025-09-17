-- Remove parentheses from image_path columns
-- Pattern: filename_(text).webp -> filename_text.webp

-- Update characters table
UPDATE characters 
SET image_path = REGEXP_REPLACE(image_path, '\(([^)]+)\)', '_$1')
WHERE image_path ~ '\([^)]+\)';

-- Update ally_universe_cards table
UPDATE ally_universe_cards 
SET image_path = REGEXP_REPLACE(image_path, '\(([^)]+)\)', '_$1')
WHERE image_path ~ '\([^)]+\)';

-- Update aspects table
UPDATE aspects 
SET image_path = REGEXP_REPLACE(image_path, '\(([^)]+)\)', '_$1')
WHERE image_path ~ '\([^)]+\)';

-- Update basic_universe_cards table
UPDATE basic_universe_cards 
SET image_path = REGEXP_REPLACE(image_path, '\(([^)]+)\)', '_$1')
WHERE image_path ~ '\([^)]+\)';

-- Update events table
UPDATE events 
SET image_path = REGEXP_REPLACE(image_path, '\(([^)]+)\)', '_$1')
WHERE image_path ~ '\([^)]+\)';

-- Update power_cards table
UPDATE power_cards 
SET image_path = REGEXP_REPLACE(image_path, '\(([^)]+)\)', '_$1')
WHERE image_path ~ '\([^)]+\)';

-- Update teamwork_cards table
UPDATE teamwork_cards 
SET image_path = REGEXP_REPLACE(image_path, '\(([^)]+)\)', '_$1')
WHERE image_path ~ '\([^)]+\)';

-- Update training_cards table
UPDATE training_cards 
SET image_path = REGEXP_REPLACE(image_path, '\(([^)]+)\)', '_$1')
WHERE image_path ~ '\([^)]+\)';

-- Update special_cards table
UPDATE special_cards 
SET image_path = REGEXP_REPLACE(image_path, '\(([^)]+)\)', '_$1')
WHERE image_path ~ '\([^)]+\)';

-- Update missions table
UPDATE missions 
SET image_path = REGEXP_REPLACE(image_path, '\(([^)]+)\)', '_$1')
WHERE image_path ~ '\([^)]+\)';

-- Update locations table
UPDATE locations 
SET image_path = REGEXP_REPLACE(image_path, '\(([^)]+)\)', '_$1')
WHERE image_path ~ '\([^)]+\)';

-- Update advanced_universe_cards table
UPDATE advanced_universe_cards 
SET image_path = REGEXP_REPLACE(image_path, '\(([^)]+)\)', '_$1')
WHERE image_path ~ '\([^)]+\)';

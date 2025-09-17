-- Fix specific angry mob image paths that got corrupted

-- Fix angry mob characters
UPDATE characters 
SET image_path = 'characters/angry_mob_middle_ages.webp'
WHERE name = 'Angry Mob (Middle Ages)';

UPDATE characters 
SET image_path = 'characters/angry_mob_industrial_age.webp'
WHERE name = 'Angry Mob (Industrial Age)';

UPDATE characters 
SET image_path = 'characters/angry_mob_modern_age.webp'
WHERE name = 'Angry Mob (Modern Age)';

-- Fix any other characters with parentheses in their names
UPDATE characters 
SET image_path = 'characters/dr_watson.webp'
WHERE name = 'Dr. Watson';

-- Fix any other tables that might have similar issues
UPDATE special_cards 
SET image_path = REPLACE(REPLACE(image_path, '(', '_'), ')', '')
WHERE image_path LIKE '%(%';

UPDATE missions 
SET image_path = REPLACE(REPLACE(image_path, '(', '_'), ')', '')
WHERE image_path LIKE '%(%';

UPDATE events 
SET image_path = REPLACE(REPLACE(image_path, '(', '_'), ')', '')
WHERE image_path LIKE '%(%';

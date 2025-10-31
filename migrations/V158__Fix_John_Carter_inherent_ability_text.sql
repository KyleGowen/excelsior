-- Fix John Carter inherent ability text to use level 8 Brute Force
-- Updates characters.special_abilities where it still references level 7

UPDATE characters
SET special_abilities = REPLACE(special_abilities, 'level 7 Brute Force', 'level 8 Brute Force'),
    updated_at = NOW()
WHERE LOWER(name) IN ('john carter of mars', 'john carter')
  AND special_abilities ILIKE '%level 7 Brute Force%';

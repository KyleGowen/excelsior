-- V217__characters_alts_to_png.sql

UPDATE characters
SET image_path = regexp_replace(image_path, '\.jpg$', '.png')
WHERE image_path LIKE 'characters/alternate/%'
  AND image_path ~* '\.jpg$';

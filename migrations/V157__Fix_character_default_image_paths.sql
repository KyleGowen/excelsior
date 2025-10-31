-- Fix character default image_path values to use .webp extensions
-- Default character images should always be .webp, not .png
-- This migration corrects any .png extensions in characters.image_path back to .webp

UPDATE characters
SET image_path = REPLACE(image_path, '.png', '.webp')
WHERE image_path LIKE 'characters/%.png'
  AND image_path NOT LIKE '%alternate%';

-- Verify: Default images should all be .webp
-- SELECT name, image_path FROM characters WHERE image_path LIKE '%.png' AND image_path NOT LIKE '%alternate%';


-- Normalize character default image paths to actual asset format
-- 1) Convert any .png defaults to .webp (assets are .webp)
-- 2) Ensure image_path includes the 'characters/' prefix

-- Case A: values like 'characters/name.png' -> 'characters/name.webp'
UPDATE characters
SET image_path = REPLACE(image_path, '.png', '.webp'),
    updated_at = NOW()
WHERE image_path LIKE 'characters/%.png';

-- Case B: values like 'name.png' -> 'characters/name.webp'
UPDATE characters
SET image_path = 'characters/' || REPLACE(image_path, '.png', '.webp'),
    updated_at = NOW()
WHERE image_path LIKE '%.png' AND image_path NOT LIKE 'characters/%';

-- Optional hardening: ensure bare .webp filenames are prefixed with characters/
UPDATE characters
SET image_path = 'characters/' || image_path,
    updated_at = NOW()
WHERE image_path LIKE '%.webp' AND image_path NOT LIKE 'characters/%';

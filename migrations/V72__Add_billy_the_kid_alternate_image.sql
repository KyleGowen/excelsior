-- Add Billy the Kid alternate image

-- Update Billy the Kid with alternate image
UPDATE characters
SET alternate_images = ARRAY['characters/alternate/billy_the_kid.webp']
WHERE name = 'Billy the Kid';

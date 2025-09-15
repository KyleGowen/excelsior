-- Populate character alternate images based on files in characters/alternate directory
-- Files found: dr. watson.png, dracula.webp, dracula2.webp, Leonidas.webp, Merlin.png, Sherlock Holmes.webp, Zeus.webp

-- Clear existing alternate images first
UPDATE characters SET alternate_images = NULL;

-- Add alternate images for Dr. Watson
UPDATE characters 
SET alternate_images = ARRAY['characters/alternate/dr. watson.png']
WHERE name = 'Dr. Watson';

-- Add alternate images for Dracula (2 images)
UPDATE characters 
SET alternate_images = ARRAY['characters/alternate/dracula.webp', 'characters/alternate/dracula2.webp']
WHERE name = 'Dracula';

-- Add alternate images for Leonidas
UPDATE characters 
SET alternate_images = ARRAY['characters/alternate/Leonidas.webp']
WHERE name = 'Leonidas';

-- Add alternate images for Merlin
UPDATE characters 
SET alternate_images = ARRAY['characters/alternate/Merlin.png']
WHERE name = 'Merlin';

-- Add alternate images for Sherlock Holmes
UPDATE characters 
SET alternate_images = ARRAY['characters/alternate/Sherlock Holmes.webp']
WHERE name = 'Sherlock Holmes';

-- Add alternate images for Zeus
UPDATE characters 
SET alternate_images = ARRAY['characters/alternate/Zeus.webp']
WHERE name = 'Zeus';

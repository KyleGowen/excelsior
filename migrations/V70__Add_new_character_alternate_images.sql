-- Add new character alternate images for King Arthur and Lancelot

-- Update King Arthur with alternate image
UPDATE characters 
SET alternate_images = ARRAY['characters/alternate/king_arthur.png']
WHERE name = 'King Arthur';

-- Update Lancelot with alternate image  
UPDATE characters 
SET alternate_images = ARRAY['characters/alternate/lancelot.webp']
WHERE name = 'Lancelot';

-- Fix Lancelot's alternate image file extension from .webp to .jpg

UPDATE characters 
SET alternate_images = ARRAY['characters/alternate/lancelot.jpg']
WHERE name = 'Lancelot';

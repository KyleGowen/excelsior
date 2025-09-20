-- Fix Sherlock Holmes alternate image filename
-- The file exists as 'sherlock_holmes.webp' but database has 'Sherlock Holmes.webp'

UPDATE characters 
SET alternate_images = ARRAY['characters/alternate/sherlock_holmes.webp']
WHERE name = 'Sherlock Holmes' 
AND 'characters/alternate/Sherlock Holmes.webp' = ANY(alternate_images);

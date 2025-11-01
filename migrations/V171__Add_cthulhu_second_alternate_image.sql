-- Add second alternate image (cthulhu2.webp) to Cthulhu character
-- This migration adds cthulhu2.webp to the alternate_images array for Cthulhu

UPDATE characters 
SET alternate_images = ARRAY['characters/alternate/cthulhu.webp', 'characters/alternate/cthulhu2.webp'],
    updated_at = NOW()
WHERE name = 'Cthulhu';


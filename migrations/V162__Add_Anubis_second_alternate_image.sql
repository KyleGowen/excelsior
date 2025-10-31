-- Add second alternate image (anubis2.png) to Anubis character
-- This migration adds anubis2.png to the alternate_images array for Anubis

UPDATE characters 
SET alternate_images = ARRAY['characters/alternate/anubis.png', 'characters/alternate/anubis2.png'],
    updated_at = NOW()
WHERE name = 'Anubis';


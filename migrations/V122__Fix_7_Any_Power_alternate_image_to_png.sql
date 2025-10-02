-- Fix 7 - Any-Power alternate image to use PNG instead of WEBP
-- Replace 'power-cards/alternate/7_anypower.webp' with 'power-cards/alternate/7_anypower.png'

-- Remove the old WEBP entry if present
UPDATE power_cards
SET alternate_images = array_remove(COALESCE(alternate_images, '{}'), 'power-cards/alternate/7_anypower.webp')
WHERE name = '7 - Any-Power';

-- Add the PNG entry if not already present
UPDATE power_cards
SET alternate_images = CASE
  WHEN NOT ('power-cards/alternate/7_anypower.png' = ANY(alternate_images))
    THEN array_append(COALESCE(alternate_images, '{}'), 'power-cards/alternate/7_anypower.png')
  ELSE alternate_images
END
WHERE name = '7 - Any-Power';



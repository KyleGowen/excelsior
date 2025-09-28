-- Fix 7 - Any-Power alternate image assignment
-- Move 7_anypower.webp from 8 - Any-Power to 7 - Any-Power

-- First, remove the 7_anypower.webp from 8 - Any-Power
UPDATE power_cards 
SET alternate_images = array_remove(alternate_images, 'power-cards/alternate/7_anypower.webp')
WHERE name = '8 - Any-Power';

-- Then add 7_anypower.webp to 7 - Any-Power
UPDATE power_cards 
SET alternate_images = array_append(COALESCE(alternate_images, '{}'), 'power-cards/alternate/7_anypower.webp')
WHERE name = '7 - Any-Power';

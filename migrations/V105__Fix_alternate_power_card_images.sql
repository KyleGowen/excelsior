-- V105__Fix_alternate_power_card_images.sql
-- Fix alternate images for power cards with correct targeting

-- Add alternate image for 7 - Combat (7_combat.png)
UPDATE power_cards
SET alternate_images = array_append(alternate_images, 'power-cards/alternate/7_combat.png')
WHERE name = '7 - Combat'
  AND NOT ('power-cards/alternate/7_combat.png' = ANY(alternate_images));

-- Add alternate image for 8 - Brute Force (8_brute_force.webp)
UPDATE power_cards
SET alternate_images = array_append(alternate_images, 'power-cards/alternate/8_brute_force.webp')
WHERE name = '8 - Brute Force'
  AND NOT ('power-cards/alternate/8_brute_force.webp' = ANY(alternate_images));

-- Add alternate image for 8 - Combat (8_combat.webp)
UPDATE power_cards
SET alternate_images = array_append(alternate_images, 'power-cards/alternate/8_combat.webp')
WHERE name = '8 - Combat'
  AND NOT ('power-cards/alternate/8_combat.webp' = ANY(alternate_images));

-- Add alternate image for 8 - Energy (8_energy.webp)
UPDATE power_cards
SET alternate_images = array_append(alternate_images, 'power-cards/alternate/8_energy.webp')
WHERE name = '8 - Energy'
  AND NOT ('power-cards/alternate/8_energy.webp' = ANY(alternate_images));

-- Fix 8 - Intelligence alternate image path (remove incorrect path and add correct one)
UPDATE power_cards
SET alternate_images = array_remove(alternate_images, '8_intelligence.webp')
WHERE name = '8 - Intelligence';

UPDATE power_cards
SET alternate_images = array_append(alternate_images, 'power-cards/alternate/8_intelligence.webp')
WHERE name = '8 - Intelligence'
  AND NOT ('power-cards/alternate/8_intelligence.webp' = ANY(alternate_images));

-- V102__Add_alternate_power_card_images.sql
-- Add alternate images for power cards

-- Add alternate image for Any-Power (7_anypower.webp)
UPDATE power_cards
SET alternate_images = array_append(alternate_images, 'power-cards/alternate/7_anypower.webp')
WHERE id = '8960fc31-667a-4767-81bf-ef309a3e03a9'
  AND NOT ('power-cards/alternate/7_anypower.webp' = ANY(alternate_images));

-- Add alternate image for Multipower (5_multipower.webp)
UPDATE power_cards
SET alternate_images = array_append(alternate_images, 'power-cards/alternate/5_multipower.webp')
WHERE name = 'Multipower'
  AND NOT ('power-cards/alternate/5_multipower.webp' = ANY(alternate_images));

-- Add alternate image for Combat (7_combat.png)
UPDATE power_cards
SET alternate_images = array_append(alternate_images, 'power-cards/alternate/7_combat.png')
WHERE name = 'Combat'
  AND NOT ('power-cards/alternate/7_combat.png' = ANY(alternate_images));

-- Add alternate image for Brute Force (8_brute_force.webp)
UPDATE power_cards
SET alternate_images = array_append(alternate_images, 'power-cards/alternate/8_brute_force.webp')
WHERE name = 'Brute Force'
  AND NOT ('power-cards/alternate/8_brute_force.webp' = ANY(alternate_images));

-- Add alternate image for Combat (8_combat.webp) - second Combat alternate
UPDATE power_cards
SET alternate_images = array_append(alternate_images, 'power-cards/alternate/8_combat.webp')
WHERE name = 'Combat'
  AND NOT ('power-cards/alternate/8_combat.webp' = ANY(alternate_images));

-- Add alternate image for Energy (8_energy.webp)
UPDATE power_cards
SET alternate_images = array_append(alternate_images, 'power-cards/alternate/8_energy.webp')
WHERE name = 'Energy'
  AND NOT ('power-cards/alternate/8_energy.webp' = ANY(alternate_images));

-- Add alternate image for Intelligence (8_intelligence.webp)
UPDATE power_cards
SET alternate_images = array_append(alternate_images, 'power-cards/alternate/8_intelligence.webp')
WHERE name = 'Intelligence'
  AND NOT ('power-cards/alternate/8_intelligence.webp' = ANY(alternate_images));

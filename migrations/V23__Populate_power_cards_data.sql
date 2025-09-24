-- Populate power cards data from ERB power cards markdown file
-- This migration inserts all 39 power cards from the overpower-erb-powercards.md file

INSERT INTO power_cards (id, name, power_type, value, one_per_deck, image_path, alternate_images) VALUES
-- Energy Power Cards (1-8)
('power_energy_1', '1 - Energy', 'Energy', 1, false, 'power-cards/1_energy.webp', ARRAY[]::TEXT[]),
('power_energy_2', '2 - Energy', 'Energy', 2, false, 'power-cards/2_energy.webp', ARRAY[]::TEXT[]),
('power_energy_3', '3 - Energy', 'Energy', 3, false, 'power-cards/3_energy.webp', ARRAY[]::TEXT[]),
('power_energy_4', '4 - Energy', 'Energy', 4, false, 'power-cards/4_energy.webp', ARRAY[]::TEXT[]),
('power_energy_5', '5 - Energy', 'Energy', 5, false, 'power-cards/5_energy.webp', ARRAY[]::TEXT[]),
('power_energy_6', '6 - Energy', 'Energy', 6, false, 'power-cards/6_energy.webp', ARRAY[]::TEXT[]),
('power_energy_7', '7 - Energy', 'Energy', 7, false, 'power-cards/7_energy.webp', ARRAY[]::TEXT[]),
('power_energy_8', '8 - Energy', 'Energy', 8, false, 'power-cards/8_energy.webp', ARRAY[]::TEXT[]),

-- Combat Power Cards (1-8)
('power_combat_1', '1 - Combat', 'Combat', 1, false, 'power-cards/1_combat.webp', ARRAY[]::TEXT[]),
('power_combat_2', '2 - Combat', 'Combat', 2, false, 'power-cards/2_combat.webp', ARRAY[]::TEXT[]),
('power_combat_3', '3 - Combat', 'Combat', 3, false, 'power-cards/3_combat.webp', ARRAY[]::TEXT[]),
('power_combat_4', '4 - Combat', 'Combat', 4, false, 'power-cards/4_combat.webp', ARRAY[]::TEXT[]),
('power_combat_5', '5 - Combat', 'Combat', 5, false, 'power-cards/5_combat.webp', ARRAY[]::TEXT[]),
('power_combat_6', '6 - Combat', 'Combat', 6, false, 'power-cards/6_combat.webp', ARRAY[]::TEXT[]),
('power_combat_7', '7 - Combat', 'Combat', 7, false, 'power-cards/7_combat.webp', ARRAY[]::TEXT[]),
('power_combat_8', '8 - Combat', 'Combat', 8, false, 'power-cards/8_combat.webp', ARRAY[]::TEXT[]),

-- Brute Force Power Cards (1-8)
('power_brute_force_1', '1 - Brute Force', 'Brute Force', 1, false, 'power-cards/1_brute_force.webp', ARRAY[]::TEXT[]),
('power_brute_force_2', '2 - Brute Force', 'Brute Force', 2, false, 'power-cards/2_brute_force.webp', ARRAY[]::TEXT[]),
('power_brute_force_3', '3 - Brute Force', 'Brute Force', 3, false, 'power-cards/3_brute_force.webp', ARRAY[]::TEXT[]),
('power_brute_force_4', '4 - Brute Force', 'Brute Force', 4, false, 'power-cards/4_brute_force.webp', ARRAY[]::TEXT[]),
('power_brute_force_5', '5 - Brute Force', 'Brute Force', 5, false, 'power-cards/5_brute_force.webp', ARRAY[]::TEXT[]),
('power_brute_force_6', '6 - Brute Force', 'Brute Force', 6, false, 'power-cards/6_brute_force.webp', ARRAY[]::TEXT[]),
('power_brute_force_7', '7 - Brute Force', 'Brute Force', 7, false, 'power-cards/7_brute_force.webp', ARRAY[]::TEXT[]),
('power_brute_force_8', '8 - Brute Force', 'Brute Force', 8, false, 'power-cards/8_brute_force.webp', ARRAY[]::TEXT[]),

-- Intelligence Power Cards (1-8)
('power_intelligence_1', '1 - Intelligence', 'Intelligence', 1, false, 'power-cards/1_intelligence.webp', ARRAY[]::TEXT[]),
('power_intelligence_2', '2 - Intelligence', 'Intelligence', 2, false, 'power-cards/2_intelligence.webp', ARRAY[]::TEXT[]),
('power_intelligence_3', '3 - Intelligence', 'Intelligence', 3, false, 'power-cards/3_intelligence.webp', ARRAY[]::TEXT[]),
('power_intelligence_4', '4 - Intelligence', 'Intelligence', 4, false, 'power-cards/4_intelligence.webp', ARRAY[]::TEXT[]),
('power_intelligence_5', '5 - Intelligence', 'Intelligence', 5, false, 'power-cards/5_intelligence.webp', ARRAY[]::TEXT[]),
('power_intelligence_6', '6 - Intelligence', 'Intelligence', 6, false, 'power-cards/6_intelligence.webp', ARRAY[]::TEXT[]),
('power_intelligence_7', '7 - Intelligence', 'Intelligence', 7, false, 'power-cards/7_intelligence.webp', ARRAY[]::TEXT[]),
('power_intelligence_8', '8 - Intelligence', 'Intelligence', 8, false, 'power-cards/8_intelligence.webp', ARRAY['8_intelligence.webp']::TEXT[]),

-- Any-Power Power Cards (5-8)
('power_any_power_5', '5 - Any-Power', 'Any-Power', 5, true, 'power-cards/5_any-power.webp', ARRAY[]::TEXT[]),
('power_any_power_6', '6 - Any-Power', 'Any-Power', 6, true, 'power-cards/6_any-power.webp', ARRAY[]::TEXT[]),
('power_any_power_7', '7 - Any-Power', 'Any-Power', 7, true, 'power-cards/7_any-power.webp', ARRAY[]::TEXT[]),
('power_any_power_8', '8 - Any-Power', 'Any-Power', 8, true, 'power-cards/8_any-power.webp', ARRAY[]::TEXT[]),

-- Multi-Power Power Cards (3-5)
('power_multi_power_3', '3 - Multi-Power', 'Multi-Power', 3, true, 'power-cards/3_multi-power.webp', ARRAY[]::TEXT[]),
('power_multi_power_4', '4 - Multi-Power', 'Multi-Power', 4, true, 'power-cards/4_multi-power.webp', ARRAY[]::TEXT[]),
('power_multi_power_5', '5 - Multi-Power', 'Multi-Power', 5, true, 'power-cards/5_multi-power.webp', ARRAY[]::TEXT[])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  power_type = EXCLUDED.power_type,
  value = EXCLUDED.value,
  one_per_deck = EXCLUDED.one_per_deck,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;
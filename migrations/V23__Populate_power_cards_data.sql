-- Populate power cards data from ERB power cards markdown file
-- This migration inserts all 39 power cards from the overpower-erb-powercards.md file

INSERT INTO power_cards (id, name, universe, description, power_type, value, one_per_deck, image_path, alternate_images) VALUES
-- Energy Power Cards (1-8)
('power_energy_1', '1 - Energy', 'OverPower', '1 - Energy Power Card', 'Energy', 1, false, 'power-cards/1_energy.webp', '[]'::jsonb),
('power_energy_2', '2 - Energy', 'OverPower', '2 - Energy Power Card', 'Energy', 2, false, 'power-cards/2_energy.webp', '[]'::jsonb),
('power_energy_3', '3 - Energy', 'OverPower', '3 - Energy Power Card', 'Energy', 3, false, 'power-cards/3_energy.webp', '[]'::jsonb),
('power_energy_4', '4 - Energy', 'OverPower', '4 - Energy Power Card', 'Energy', 4, false, 'power-cards/4_energy.webp', '[]'::jsonb),
('power_energy_5', '5 - Energy', 'OverPower', '5 - Energy Power Card', 'Energy', 5, false, 'power-cards/5_energy.webp', '[]'::jsonb),
('power_energy_6', '6 - Energy', 'OverPower', '6 - Energy Power Card', 'Energy', 6, false, 'power-cards/6_energy.webp', '[]'::jsonb),
('power_energy_7', '7 - Energy', 'OverPower', '7 - Energy Power Card', 'Energy', 7, false, 'power-cards/7_energy.webp', '[]'::jsonb),
('power_energy_8', '8 - Energy', 'OverPower', '8 - Energy Power Card', 'Energy', 8, false, 'power-cards/8_energy.webp', '[]'::jsonb),

-- Combat Power Cards (1-8)
('power_combat_1', '1 - Combat', 'OverPower', '1 - Combat Power Card', 'Combat', 1, false, 'power-cards/1_combat.webp', '[]'::jsonb),
('power_combat_2', '2 - Combat', 'OverPower', '2 - Combat Power Card', 'Combat', 2, false, 'power-cards/2_combat.webp', '[]'::jsonb),
('power_combat_3', '3 - Combat', 'OverPower', '3 - Combat Power Card', 'Combat', 3, false, 'power-cards/3_combat.webp', '[]'::jsonb),
('power_combat_4', '4 - Combat', 'OverPower', '4 - Combat Power Card', 'Combat', 4, false, 'power-cards/4_combat.webp', '[]'::jsonb),
('power_combat_5', '5 - Combat', 'OverPower', '5 - Combat Power Card', 'Combat', 5, false, 'power-cards/5_combat.webp', '[]'::jsonb),
('power_combat_6', '6 - Combat', 'OverPower', '6 - Combat Power Card', 'Combat', 6, false, 'power-cards/6_combat.webp', '[]'::jsonb),
('power_combat_7', '7 - Combat', 'OverPower', '7 - Combat Power Card', 'Combat', 7, false, 'power-cards/7_combat.webp', '[]'::jsonb),
('power_combat_8', '8 - Combat', 'OverPower', '8 - Combat Power Card', 'Combat', 8, false, 'power-cards/8_combat.webp', '[]'::jsonb),

-- Brute Force Power Cards (1-8)
('power_brute_force_1', '1 - Brute Force', 'OverPower', '1 - Brute Force Power Card', 'Brute Force', 1, false, 'power-cards/1_brute_force.webp', '[]'::jsonb),
('power_brute_force_2', '2 - Brute Force', 'OverPower', '2 - Brute Force Power Card', 'Brute Force', 2, false, 'power-cards/2_brute_force.webp', '[]'::jsonb),
('power_brute_force_3', '3 - Brute Force', 'OverPower', '3 - Brute Force Power Card', 'Brute Force', 3, false, 'power-cards/3_brute_force.webp', '[]'::jsonb),
('power_brute_force_4', '4 - Brute Force', 'OverPower', '4 - Brute Force Power Card', 'Brute Force', 4, false, 'power-cards/4_brute_force.webp', '[]'::jsonb),
('power_brute_force_5', '5 - Brute Force', 'OverPower', '5 - Brute Force Power Card', 'Brute Force', 5, false, 'power-cards/5_brute_force.webp', '[]'::jsonb),
('power_brute_force_6', '6 - Brute Force', 'OverPower', '6 - Brute Force Power Card', 'Brute Force', 6, false, 'power-cards/6_brute_force.webp', '[]'::jsonb),
('power_brute_force_7', '7 - Brute Force', 'OverPower', '7 - Brute Force Power Card', 'Brute Force', 7, false, 'power-cards/7_brute_force.webp', '[]'::jsonb),
('power_brute_force_8', '8 - Brute Force', 'OverPower', '8 - Brute Force Power Card', 'Brute Force', 8, false, 'power-cards/8_brute_force.webp', '[]'::jsonb),

-- Intelligence Power Cards (1-8)
('power_intelligence_1', '1 - Intelligence', 'OverPower', '1 - Intelligence Power Card', 'Intelligence', 1, false, 'power-cards/1_intelligence.webp', '[]'::jsonb),
('power_intelligence_2', '2 - Intelligence', 'OverPower', '2 - Intelligence Power Card', 'Intelligence', 2, false, 'power-cards/2_intelligence.webp', '[]'::jsonb),
('power_intelligence_3', '3 - Intelligence', 'OverPower', '3 - Intelligence Power Card', 'Intelligence', 3, false, 'power-cards/3_intelligence.webp', '[]'::jsonb),
('power_intelligence_4', '4 - Intelligence', 'OverPower', '4 - Intelligence Power Card', 'Intelligence', 4, false, 'power-cards/4_intelligence.webp', '[]'::jsonb),
('power_intelligence_5', '5 - Intelligence', 'OverPower', '5 - Intelligence Power Card', 'Intelligence', 5, false, 'power-cards/5_intelligence.webp', '[]'::jsonb),
('power_intelligence_6', '6 - Intelligence', 'OverPower', '6 - Intelligence Power Card', 'Intelligence', 6, false, 'power-cards/6_intelligence.webp', '[]'::jsonb),
('power_intelligence_7', '7 - Intelligence', 'OverPower', '7 - Intelligence Power Card', 'Intelligence', 7, false, 'power-cards/7_intelligence.webp', '[]'::jsonb),
('power_intelligence_8', '8 - Intelligence', 'OverPower', '8 - Intelligence Power Card', 'Intelligence', 8, false, 'power-cards/8_intelligence.webp', '["8_intelligence.webp"]'::jsonb),

-- Any-Power Power Cards (5-8)
('power_any_power_5', '5 - Any-Power', 'OverPower', '5 - Any-Power Power Card', 'Any-Power', 5, true, 'power-cards/5_any-power.webp', '[]'::jsonb),
('power_any_power_6', '6 - Any-Power', 'OverPower', '6 - Any-Power Power Card', 'Any-Power', 6, true, 'power-cards/6_any-power.webp', '[]'::jsonb),
('power_any_power_7', '7 - Any-Power', 'OverPower', '7 - Any-Power Power Card', 'Any-Power', 7, true, 'power-cards/7_any-power.webp', '[]'::jsonb),
('power_any_power_8', '8 - Any-Power', 'OverPower', '8 - Any-Power Power Card', 'Any-Power', 8, true, 'power-cards/8_any-power.webp', '[]'::jsonb),

-- Multi-Power Power Cards (3-5)
('power_multi_power_3', '3 - Multi-Power', 'OverPower', '3 - Multi-Power Power Card', 'Multi-Power', 3, true, 'power-cards/3_multi-power.webp', '[]'::jsonb),
('power_multi_power_4', '4 - Multi-Power', 'OverPower', '4 - Multi-Power Power Card', 'Multi-Power', 4, true, 'power-cards/4_multi-power.webp', '[]'::jsonb),
('power_multi_power_5', '5 - Multi-Power', 'OverPower', '5 - Multi-Power Power Card', 'Multi-Power', 5, true, 'power-cards/5_multi-power.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  description = EXCLUDED.description,
  power_type = EXCLUDED.power_type,
  value = EXCLUDED.value,
  one_per_deck = EXCLUDED.one_per_deck,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;
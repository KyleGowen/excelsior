-- Populate power cards data from markdown file
-- This reads from the power cards markdown file and inserts into the database

-- Energy Power Cards
INSERT INTO power_cards (id, name, power_type, value, image_path, alternate_images, one_per_deck) VALUES
('power_energy_1', '1 - Energy', 'Energy', 1, 'power-cards/1_energy.webp', ARRAY[]::text[], false),
('power_energy_2', '2 - Energy', 'Energy', 2, 'power-cards/2_energy.webp', ARRAY[]::text[], false),
('power_energy_3', '3 - Energy', 'Energy', 3, 'power-cards/3_energy.webp', ARRAY[]::text[], false),
('power_energy_4', '4 - Energy', 'Energy', 4, 'power-cards/4_energy.webp', ARRAY[]::text[], false),
('power_energy_5', '5 - Energy', 'Energy', 5, 'power-cards/5_energy.webp', ARRAY[]::text[], false),
('power_energy_6', '6 - Energy', 'Energy', 6, 'power-cards/6_energy.webp', ARRAY[]::text[], false),
('power_energy_7', '7 - Energy', 'Energy', 7, 'power-cards/7_energy.webp', ARRAY[]::text[], false),
('power_energy_8', '8 - Energy', 'Energy', 8, 'power-cards/8_energy.webp', ARRAY[]::text[], false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  power_type = EXCLUDED.power_type,
  value = EXCLUDED.value,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images,
  one_per_deck = EXCLUDED.one_per_deck;

-- Combat Power Cards
INSERT INTO power_cards (id, name, power_type, value, image_path, alternate_images, one_per_deck) VALUES
('power_combat_1', '1 - Combat', 'Combat', 1, 'power-cards/1_combat.webp', ARRAY[]::text[], false),
('power_combat_2', '2 - Combat', 'Combat', 2, 'power-cards/2_combat.webp', ARRAY[]::text[], false),
('power_combat_3', '3 - Combat', 'Combat', 3, 'power-cards/3_combat.webp', ARRAY[]::text[], false),
('power_combat_4', '4 - Combat', 'Combat', 4, 'power-cards/4_combat.webp', ARRAY[]::text[], false),
('power_combat_5', '5 - Combat', 'Combat', 5, 'power-cards/5_combat.webp', ARRAY[]::text[], false),
('power_combat_6', '6 - Combat', 'Combat', 6, 'power-cards/6_combat.webp', ARRAY[]::text[], false),
('power_combat_7', '7 - Combat', 'Combat', 7, 'power-cards/7_combat.webp', ARRAY[]::text[], false),
('power_combat_8', '8 - Combat', 'Combat', 8, 'power-cards/8_combat.webp', ARRAY[]::text[], false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  power_type = EXCLUDED.power_type,
  value = EXCLUDED.value,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images,
  one_per_deck = EXCLUDED.one_per_deck;

-- Brute Force Power Cards
INSERT INTO power_cards (id, name, power_type, value, image_path, alternate_images, one_per_deck) VALUES
('power_brute_force_1', '1 - Brute Force', 'Brute Force', 1, 'power-cards/1_brute_force.webp', ARRAY[]::text[], false),
('power_brute_force_2', '2 - Brute Force', 'Brute Force', 2, 'power-cards/2_brute_force.webp', ARRAY[]::text[], false),
('power_brute_force_3', '3 - Brute Force', 'Brute Force', 3, 'power-cards/3_brute_force.webp', ARRAY[]::text[], false),
('power_brute_force_4', '4 - Brute Force', 'Brute Force', 4, 'power-cards/4_brute_force.webp', ARRAY[]::text[], false),
('power_brute_force_5', '5 - Brute Force', 'Brute Force', 5, 'power-cards/5_brute_force.webp', ARRAY[]::text[], false),
('power_brute_force_6', '6 - Brute Force', 'Brute Force', 6, 'power-cards/6_brute_force.webp', ARRAY[]::text[], false),
('power_brute_force_7', '7 - Brute Force', 'Brute Force', 7, 'power-cards/7_brute_force.webp', ARRAY[]::text[], false),
('power_brute_force_8', '8 - Brute Force', 'Brute Force', 8, 'power-cards/8_brute_force.webp', ARRAY[]::text[], false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  power_type = EXCLUDED.power_type,
  value = EXCLUDED.value,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images,
  one_per_deck = EXCLUDED.one_per_deck;

-- Intelligence Power Cards
INSERT INTO power_cards (id, name, power_type, value, image_path, alternate_images, one_per_deck) VALUES
('power_intelligence_1', '1 - Intelligence', 'Intelligence', 1, 'power-cards/1_intelligence.webp', ARRAY[]::text[], false),
('power_intelligence_2', '2 - Intelligence', 'Intelligence', 2, 'power-cards/2_intelligence.webp', ARRAY[]::text[], false),
('power_intelligence_3', '3 - Intelligence', 'Intelligence', 3, 'power-cards/3_intelligence.webp', ARRAY[]::text[], false),
('power_intelligence_4', '4 - Intelligence', 'Intelligence', 4, 'power-cards/4_intelligence.webp', ARRAY[]::text[], false),
('power_intelligence_5', '5 - Intelligence', 'Intelligence', 5, 'power-cards/5_intelligence.webp', ARRAY[]::text[], false),
('power_intelligence_6', '6 - Intelligence', 'Intelligence', 6, 'power-cards/6_intelligence.webp', ARRAY[]::text[], false),
('power_intelligence_7', '7 - Intelligence', 'Intelligence', 7, 'power-cards/7_intelligence.webp', ARRAY[]::text[], false),
('power_intelligence_8', '8 - Intelligence', 'Intelligence', 8, 'power-cards/8_intelligence.webp', ARRAY['8_intelligence.webp']::text[], false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  power_type = EXCLUDED.power_type,
  value = EXCLUDED.value,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images,
  one_per_deck = EXCLUDED.one_per_deck;

-- Any-Power Cards
INSERT INTO power_cards (id, name, power_type, value, image_path, alternate_images, one_per_deck) VALUES
('power_any_power_6', '6 - Any-Power', 'Any-Power', 6, 'power-cards/6_any_power.webp', ARRAY[]::text[], true),
('power_any_power_7', '7 - Any-Power', 'Any-Power', 7, 'power-cards/7_any_power.webp', ARRAY[]::text[], true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  power_type = EXCLUDED.power_type,
  value = EXCLUDED.value,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images,
  one_per_deck = EXCLUDED.one_per_deck;

-- Multi-Power Cards
INSERT INTO power_cards (id, name, power_type, value, image_path, alternate_images, one_per_deck) VALUES
('power_multi_power_6', '6 - Multi-Power', 'Multi-Power', 6, 'power-cards/6_multi_power.webp', ARRAY[]::text[], true),
('power_multi_power_7', '7 - Multi-Power', 'Multi-Power', 7, 'power-cards/7_multi_power.webp', ARRAY[]::text[], true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  power_type = EXCLUDED.power_type,
  value = EXCLUDED.value,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images,
  one_per_deck = EXCLUDED.one_per_deck;

-- Fix remaining image path issues
-- This migration fixes the remaining image path mismatches

-- Fix training cards directory path (should be training-universe, not training)
UPDATE training_cards SET image_path = 'training-universe/5_any_power_5_sekhmet.webp' WHERE name = 'Sekhmet';
UPDATE training_cards SET image_path = 'training-universe/344_5_energy_5_combat_4.webp' WHERE name = 'Joan of Arc';
UPDATE training_cards SET image_path = 'training-universe/345_5_energy_5_brute_force_4.webp' WHERE name = 'Lancelot';
UPDATE training_cards SET image_path = 'training-universe/346_5_energy_5_intelligence_4.webp' WHERE name = 'Leonidas';
UPDATE training_cards SET image_path = 'training-universe/347_5_combat_5_brute_force_4.webp' WHERE name = 'Merlin';
UPDATE training_cards SET image_path = 'training-universe/348_5_combat_5_intelligence_4.webp' WHERE name = 'Robin Hood';
UPDATE training_cards SET image_path = 'training-universe/349_5_brute_force_5_intelligence_4.webp' WHERE name = 'Cultists';

-- Fix multi-power cards missing numeric prefixes
UPDATE power_cards SET image_path = 'power-cards/479_6_multipower.webp' WHERE power_type = 'Multi-Power' AND value = 6;
UPDATE power_cards SET image_path = 'power-cards/480_7_multipower.webp' WHERE power_type = 'Multi-Power' AND value = 7;

-- Fix basic universe cards with different names
UPDATE basic_universe_cards SET image_path = 'basic-universe/334_7_energy_3.webp' WHERE name = 'Hydes Serum';
UPDATE basic_universe_cards SET image_path = 'basic-universe/337_7_combat_3.webp' WHERE name = 'Merlins Wand';

-- For ally universe cards, since the directory doesn't exist, we'll use placeholder images
-- or map them to existing character images if they exist
UPDATE ally_universe_cards SET image_path = 'characters/181_professor_moriarty.webp' WHERE name = 'Professor Porter';
UPDATE ally_universe_cards SET image_path = 'specials/282_hera.webp' WHERE name = 'Hera';

-- For the remaining ally universe cards that don't have corresponding images,
-- we'll use a placeholder or the closest match
UPDATE ally_universe_cards SET image_path = 'characters/195_robin_hood.webp' WHERE name = 'Little John';
UPDATE ally_universe_cards SET image_path = 'characters/132_lancelot.webp' WHERE name = 'Lancelot';
UPDATE ally_universe_cards SET image_path = 'characters/118_king_arthur.webp' WHERE name = 'Queen Guinevere';
UPDATE ally_universe_cards SET image_path = 'characters/132_lancelot.webp' WHERE name = 'Sir Galahad';

-- For Allan Quatermain, Guy of Gisborne, and Huckleblock, we'll use generic character images
UPDATE ally_universe_cards SET image_path = 'characters/209_sherlock_holmes.webp' WHERE name = 'Allan Quatermain';
UPDATE ally_universe_cards SET image_path = 'characters/202_sheriff_of_nottingham.webp' WHERE name = 'Guy of Gisborne';
UPDATE ally_universe_cards SET image_path = 'characters/195_robin_hood.webp' WHERE name = 'Huckleblock';


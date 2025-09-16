-- Fix training cards image paths to use correct directory and file names
UPDATE training_cards SET image_path = 'training-universe/5_any_power_5_sekhmet.webp' WHERE name = 'Training (Sekhmet)';
UPDATE training_cards SET image_path = 'training-universe/344_5_energy_5_combat_4.webp' WHERE name = 'Training (Joan of Arc)';
UPDATE training_cards SET image_path = 'training-universe/345_5_energy_5_brute_force_4.webp' WHERE name = 'Training (Lancelot)';
UPDATE training_cards SET image_path = 'training-universe/346_5_energy_5_intelligence_4.webp' WHERE name = 'Training (Leonidas)';
UPDATE training_cards SET image_path = 'training-universe/347_5_combat_5_brute_force_4.webp' WHERE name = 'Training (Merlin)';
UPDATE training_cards SET image_path = 'training-universe/348_5_combat_5_intelligence_4.webp' WHERE name = 'Training (Robin Hood)';
UPDATE training_cards SET image_path = 'training-universe/349_5_brute_force_5_intelligence_4.webp' WHERE name = 'Training (Cultists)';


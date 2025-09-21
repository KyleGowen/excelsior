-- Fix training card image paths to match correct filenames
UPDATE training_cards SET image_path = 'training-universe/5_brute_force_5_intelligence_4.webp' WHERE name = 'Training (Lancelot)';
UPDATE training_cards SET image_path = 'training-universe/5_energy_5_intelligence_4.webp' WHERE name = 'Training (Cultists)';
UPDATE training_cards SET image_path = 'training-universe/5_energy_5_combat_4.webp' WHERE name = 'Training (Merlin)';
UPDATE training_cards SET image_path = 'training-universe/5_combat_5_intelligence_4.webp' WHERE name = 'Training (Leonidas)';
UPDATE training_cards SET image_path = 'training-universe/5_combat_5_brute_force_4.webp' WHERE name = 'Training (Robin Hood)';
UPDATE training_cards SET image_path = 'training-universe/5_energy_5_brute_force_4.webp' WHERE name = 'Training (Joan of Arc)';

-- Fix basic universe cards image paths that still have old file names
UPDATE basic_universe_cards SET image_path = 'basic-universe/334_7_energy_3.webp' WHERE name = 'Hyde''s Serum';
UPDATE basic_universe_cards SET image_path = 'basic-universe/337_7_combat_3.webp' WHERE name = 'Merlin''s Wand';


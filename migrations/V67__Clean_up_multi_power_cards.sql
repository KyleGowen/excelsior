-- Clean up Multi Power cards: remove all duplicates and invalid values
-- Keep only values 3, 4, and 5 with consistent naming

-- Remove all existing Multi Power cards (both naming conventions)
DELETE FROM power_cards WHERE power_type LIKE '%Multi%';

-- Insert only the correct Multi Power cards (values 3, 4, 5)
INSERT INTO power_cards (id, name, power_type, value, image_path, alternate_images, one_per_deck, created_at, updated_at) VALUES
(gen_random_uuid(), '3 - Multi Power', 'Multi Power', 3, 'power-cards/3_multipower.webp', '{}', false, NOW(), NOW()),
(gen_random_uuid(), '4 - Multi Power', 'Multi Power', 4, 'power-cards/4_multipower.webp', '{}', false, NOW(), NOW()),
(gen_random_uuid(), '5 - Multi Power', 'Multi Power', 5, 'power-cards/5_multipower.webp', '{}', false, NOW(), NOW());

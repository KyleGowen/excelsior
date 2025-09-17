-- Fix power_cards table: remove duplicates, fix naming, add missing cards

-- First, remove all existing Any-Power and Multi Power cards
DELETE FROM power_cards WHERE name LIKE '%Any-Power%' OR name LIKE '%Multi Power%';

-- Insert correct Multi Power cards (values 3, 4, 5)
INSERT INTO power_cards (id, name, power_type, value, image_path, alternate_images, one_per_deck, created_at, updated_at) VALUES
(gen_random_uuid(), '3 - Multi Power', 'Multi Power', 3, 'power-cards/3_multipower.webp', '{}', false, NOW(), NOW()),
(gen_random_uuid(), '4 - Multi Power', 'Multi Power', 4, 'power-cards/4_multipower.webp', '{}', false, NOW(), NOW()),
(gen_random_uuid(), '5 - Multi Power', 'Multi Power', 5, 'power-cards/5_multipower.webp', '{}', false, NOW(), NOW());

-- Insert correct Any Power cards (values 5, 6, 7, 8)
-- Note: 5_any-power.webp should be renamed to 5_anypower.webp to match the pattern
INSERT INTO power_cards (id, name, power_type, value, image_path, alternate_images, one_per_deck, created_at, updated_at) VALUES
(gen_random_uuid(), '5 - Any-Power', 'Any-Power', 5, 'power-cards/5_anypower.webp', '{}', false, NOW(), NOW()),
(gen_random_uuid(), '6 - Any-Power', 'Any-Power', 6, 'power-cards/6_anypower.webp', '{}', false, NOW(), NOW()),
(gen_random_uuid(), '7 - Any-Power', 'Any-Power', 7, 'power-cards/7_anypower.webp', '{}', false, NOW(), NOW()),
(gen_random_uuid(), '8 - Any-Power', 'Any-Power', 8, 'power-cards/8_anypower.webp', '{}', false, NOW(), NOW());

-- Update missions table to align with new image file organization
-- This migration updates image paths, names, and mission sets to match the reorganized directory structure

-- First, clear existing mission data to avoid conflicts
DELETE FROM missions;

-- Insert missions based on the new directory structure
-- King of the Jungle missions
INSERT INTO missions (id, name, universe, mission_set, mission_description, image_path) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Beasts of Tarzan', 'ERB', 'King of the Jungle', 'Beasts of Tarzan mission card', 'missions/king-of-the-jungle/beasts_of_tarzan.webp'),
('550e8400-e29b-41d4-a716-446655440002', 'Tarzan and the Castaways', 'ERB', 'King of the Jungle', 'Tarzan and the Castaways mission card', 'missions/king-of-the-jungle/tarzan_and_the_castaways.webp'),
('550e8400-e29b-41d4-a716-446655440003', 'Tarzan and the City of Gold', 'ERB', 'King of the Jungle', 'Tarzan and the City of Gold mission card', 'missions/king-of-the-jungle/tarzan_and_the_city_of_gold.webp'),
('550e8400-e29b-41d4-a716-446655440004', 'Tarzan and the Golden Lion', 'ERB', 'King of the Jungle', 'Tarzan and the Golden Lion mission card', 'missions/king-of-the-jungle/tarzan_and_the_golden_lion.webp'),
('550e8400-e29b-41d4-a716-446655440005', 'Tarzan at the Earth''s Core', 'ERB', 'King of the Jungle', 'Tarzan at the Earth''s Core mission card', 'missions/king-of-the-jungle/tarzan_at_the_earths_core.webp'),
('550e8400-e29b-41d4-a716-446655440006', 'Tarzan of the Apes', 'ERB', 'King of the Jungle', 'Tarzan of the Apes mission card', 'missions/king-of-the-jungle/tarzan_of_the_apes.webp'),
('550e8400-e29b-41d4-a716-446655440007', 'Tarzan''s Quest', 'ERB', 'King of the Jungle', 'Tarzan''s Quest mission card', 'missions/king-of-the-jungle/tarzans_quest.webp'),

-- The Call of Cthulhu missions
('550e8400-e29b-41d4-a716-446655440008', 'Gone Too Far', 'ERB', 'The Call of Cthulhu', 'Gone Too Far mission card', 'missions/the-call-of-cthulhu/gone_too_far.webp'),
('550e8400-e29b-41d4-a716-446655440009', 'Johansen''s Widow', 'ERB', 'The Call of Cthulhu', 'Johansen''s Widow mission card', 'missions/the-call-of-cthulhu/johansens_widow.webp'),
('550e8400-e29b-41d4-a716-446655440010', 'New Orleans, 1908', 'ERB', 'The Call of Cthulhu', 'New Orleans, 1908 mission card', 'missions/the-call-of-cthulhu/new_orleans_1908.webp'),
('550e8400-e29b-41d4-a716-446655440011', 'Professor Angell''s Investigation', 'ERB', 'The Call of Cthulhu', 'Professor Angell''s Investigation mission card', 'missions/the-call-of-cthulhu/professor_angells_investigation.webp'),
('550e8400-e29b-41d4-a716-446655440012', 'The Alert', 'ERB', 'The Call of Cthulhu', 'The Alert mission card', 'missions/the-call-of-cthulhu/the_alert.webp'),
('550e8400-e29b-41d4-a716-446655440013', 'The Dreams of Men', 'ERB', 'The Call of Cthulhu', 'The Dreams of Men mission card', 'missions/the-call-of-cthulhu/the_dreams_of_men.webp'),
('550e8400-e29b-41d4-a716-446655440014', 'Worshipping the Great Old One', 'ERB', 'The Call of Cthulhu', 'Worshipping the Great Old One mission card', 'missions/the-call-of-cthulhu/worshipping_the_great_old_one.webp'),

-- The Warlord of Mars missions
('550e8400-e29b-41d4-a716-446655440015', 'A Fighting Man of Mars', 'ERB', 'The Warlord of Mars', 'A Fighting Man of Mars mission card', 'missions/the-warlord-of-mars/a_fighting_man_of_mars.webp'),
('550e8400-e29b-41d4-a716-446655440016', 'Swords of Mars', 'ERB', 'The Warlord of Mars', 'Swords of Mars mission card', 'missions/the-warlord-of-mars/swords_of_mars.webp'),
('550e8400-e29b-41d4-a716-446655440017', 'The Battle of Kings', 'ERB', 'The Warlord of Mars', 'The Battle of Kings mission card', 'missions/the-warlord-of-mars/the_battle_of_kings.webp'),
('550e8400-e29b-41d4-a716-446655440018', 'The Face of Death', 'ERB', 'The Warlord of Mars', 'The Face of Death mission card', 'missions/the-warlord-of-mars/the_face_of_death.webp'),
('550e8400-e29b-41d4-a716-446655440019', 'The Invisible Men', 'ERB', 'The Warlord of Mars', 'The Invisible Men mission card', 'missions/the-warlord-of-mars/the_invisible_men.webp'),
('550e8400-e29b-41d4-a716-446655440020', 'The Loyalty of Woola', 'ERB', 'The Warlord of Mars', 'The Loyalty of Woola mission card', 'missions/the-warlord-of-mars/the_loyalty_of_woola.webp'),
('550e8400-e29b-41d4-a716-446655440021', 'Under the Moons of Mars', 'ERB', 'The Warlord of Mars', 'Under the Moons of Mars mission card', 'missions/the-warlord-of-mars/under_the_moons_of_mars.webp'),

-- Time Wars: Rise of the Gods missions
('550e8400-e29b-41d4-a716-446655440022', 'Battle at Olympus', 'ERB', 'Time Wars: Rise of the Gods', 'Battle at Olympus mission card', 'missions/time-wars-rise-of-the-gods/battle_at_olympus.webp'),
('550e8400-e29b-41d4-a716-446655440023', 'Divine Retribution', 'ERB', 'Time Wars: Rise of the Gods', 'Divine Retribution mission card', 'missions/time-wars-rise-of-the-gods/divine_retribution.webp'),
('550e8400-e29b-41d4-a716-446655440024', 'Supernatural Allies', 'ERB', 'Time Wars: Rise of the Gods', 'Supernatural Allies mission card', 'missions/time-wars-rise-of-the-gods/supernatural_allies.webp'),
('550e8400-e29b-41d4-a716-446655440025', 'The Gods Return', 'ERB', 'Time Wars: Rise of the Gods', 'The Gods Return mission card', 'missions/time-wars-rise-of-the-gods/the_gods_return.webp'),
('550e8400-e29b-41d4-a716-446655440026', 'Tide Begins to Turn', 'ERB', 'Time Wars: Rise of the Gods', 'Tide Begins to Turn mission card', 'missions/time-wars-rise-of-the-gods/tide_begins_to_turn.webp'),
('550e8400-e29b-41d4-a716-446655440027', 'Traveler''s Warning', 'ERB', 'Time Wars: Rise of the Gods', 'Traveler''s Warning mission card', 'missions/time-wars-rise-of-the-gods/travelers_warning.webp'),
('550e8400-e29b-41d4-a716-446655440028', 'Warriors from Across Time', 'ERB', 'Time Wars: Rise of the Gods', 'Warriors from Across Time mission card', 'missions/time-wars-rise-of-the-gods/warriors_from_across_time.webp');

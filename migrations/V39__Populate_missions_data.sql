-- Populate missions data from markdown file
-- This migration inserts all mission cards from the overpower-erb-missions.md file

INSERT INTO missions (id, name, universe, mission_set, mission_description, image_path) VALUES
-- The Call of Cthulhu missions
('mission_the_dreams_of_men', 'The Dreams of Men', 'ERB', 'The Call of Cthulhu', 'The Dreams of Men mission card', 'missions/the_dreams_of_men.webp'),
('mission_professor_angells_investigation', 'Professor Angell''s Investigation', 'ERB', 'The Call of Cthulhu', 'Professor Angell''s Investigation mission card', 'missions/professor_angells_investigation.webp'),
('mission_new_orleans_1918', 'New Orleans, 1918', 'ERB', 'The Call of Cthulhu', 'New Orleans, 1918 mission card', 'missions/new_orleans_1918.webp'),
('mission_worshipping_the_great_old_one', 'Worshipping the Great Old One', 'ERB', 'The Call of Cthulhu', 'Worshipping the Great Old One mission card', 'missions/worshipping_the_great_old_one.webp'),
('mission_the_alert', 'The Alert', 'ERB', 'The Call of Cthulhu', 'The Alert mission card', 'missions/the_alert.webp'),
('mission_johansens_window', 'Johansen''s Window', 'ERB', 'The Call of Cthulhu', 'Johansen''s Window mission card', 'missions/johansens_window.webp'),
('mission_gone_too_far', 'Gone Too Far', 'ERB', 'The Call of Cthulhu', 'Gone Too Far mission card', 'missions/gone_too_far.webp'),

-- King of the Jungle missions
('mission_tarzan_of_the_apes', 'Tarzan of the Apes', 'ERB', 'King of the Jungle', 'Tarzan of the Apes mission card', 'missions/tarzan_of_the_apes.webp'),
('mission_beasts_of_tarzan', 'Beasts of Tarzan', 'ERB', 'King of the Jungle', 'Beasts of Tarzan mission card', 'missions/beasts_of_tarzan.webp'),
('mission_tarzan_and_the_golden_lion', 'Tarzan and the Golden Lion', 'ERB', 'King of the Jungle', 'Tarzan and the Golden Lion mission card', 'missions/tarzan_and_the_golden_lion.webp'),
('mission_tarzan_at_the_earths_core', 'Tarzan at the Earth''s Core', 'ERB', 'King of the Jungle', 'Tarzan at the Earth''s Core mission card', 'missions/tarzan_at_the_earths_core.webp'),
('mission_tarzan_and_the_city_of_gold', 'Tarzan and the City of Gold', 'ERB', 'King of the Jungle', 'Tarzan and the City of Gold mission card', 'missions/tarzan_and_the_city_of_gold.webp'),
('mission_tarzans_quest', 'Tarzan''s Quest', 'ERB', 'King of the Jungle', 'Tarzan''s Quest mission card', 'missions/tarzans_quest.webp'),
('mission_tarzan_and_the_castaways', 'Tarzan and the Castaways', 'ERB', 'King of the Jungle', 'Tarzan and the Castaways mission card', 'missions/tarzan_and_the_castaways.webp'),

-- Warlord of Mars missions
('mission_the_face_of_deception', 'The Face of Deception', 'ERB', 'Warlord of Mars', 'The Face of Deception mission card', 'missions/the_face_of_deception.webp'),
('mission_the_battle_of_kings', 'The Battle of Kings', 'ERB', 'Warlord of Mars', 'The Battle of Kings mission card', 'missions/the_battle_of_kings.webp'),
('mission_a_fighting_man_of_mars', 'A Fighting Man of Mars', 'ERB', 'Warlord of Mars', 'A Fighting Man of Mars mission card', 'missions/a_fighting_man_of_mars.webp'),
('mission_swords_of_mars', 'Swords of Mars', 'ERB', 'Warlord of Mars', 'Swords of Mars mission card', 'missions/swords_of_mars.webp'),
('mission_the_invisible_men', 'The Invisible Men', 'ERB', 'Warlord of Mars', 'The Invisible Men mission card', 'missions/the_invisible_men.webp'),
('mission_the_laughter_of_thuvia', 'The Laughter of Thuvia', 'ERB', 'Warlord of Mars', 'The Laughter of Thuvia mission card', 'missions/the_laughter_of_thuvia.webp'),
('mission_under_the_moons_of_mars', 'Under the Moons of Mars', 'ERB', 'Warlord of Mars', 'Under the Moons of Mars mission card', 'missions/under_the_moons_of_mars.webp'),

-- Time Wars: Rise of the Gods missions
('mission_the_gods_return', 'The Gods Return', 'ERB', 'Time Wars: Rise of the Gods', 'The Gods Return mission card', 'missions/the_gods_return.webp'),
('mission_divine_retribution', 'Divine Retribution', 'ERB', 'Time Wars: Rise of the Gods', 'Divine Retribution mission card', 'missions/divine_retribution.webp'),
('mission_travelers_warning', 'Traveler''s Warning', 'ERB', 'Time Wars: Rise of the Gods', 'Traveler''s Warning mission card', 'missions/travelers_warning.webp'),
('mission_warriors_from_across_time', 'Warriors from Across Time', 'ERB', 'Time Wars: Rise of the Gods', 'Warriors from Across Time mission card', 'missions/warriors_from_across_time.webp'),
('mission_tide_begins_to_turn', 'Tide Begins to Turn', 'ERB', 'Time Wars: Rise of the Gods', 'Tide Begins to Turn mission card', 'missions/tide_begins_to_turn.webp'),
('mission_supernatural_allies', 'Supernatural Allies', 'ERB', 'Time Wars: Rise of the Gods', 'Supernatural Allies mission card', 'missions/supernatural_allies.webp'),
('mission_battle_at_olympus', 'Battle at Olympus', 'ERB', 'Time Wars: Rise of the Gods', 'Battle at Olympus mission card', 'missions/battle_at_olympus.webp')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  mission_set = EXCLUDED.mission_set,
  mission_description = EXCLUDED.mission_description,
  image_path = EXCLUDED.image_path;

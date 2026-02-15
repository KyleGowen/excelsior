-- Add alternate location rows (each with unique id) for BMG Print alternates
-- Mirrors the character alternate-art approach - each alternate is a separate row
-- Persistence uses deck_cards.card_id and decks.location_id (populated by trigger)

-- 221-B Baker St. alternate
INSERT INTO locations (id, name, set, image_path, threat_level, special_ability, set_number)
SELECT gen_random_uuid(), name, set, 'alternate/221_b_baker_st.png', threat_level, special_ability, set_number
FROM locations WHERE name = '221-B Baker St.' LIMIT 1;

-- Asclepieion alternate
INSERT INTO locations (id, name, set, image_path, threat_level, special_ability, set_number)
SELECT gen_random_uuid(), name, set, 'alternate/asclepieion.png', threat_level, special_ability, set_number
FROM locations WHERE name = 'Asclepieion' LIMIT 1;

-- Dracula's Armory alternate
INSERT INTO locations (id, name, set, image_path, threat_level, special_ability, set_number)
SELECT gen_random_uuid(), name, set, 'alternate/draculas_armory.png', threat_level, special_ability, set_number
FROM locations WHERE name = 'Dracula''s Armory' LIMIT 1;

-- Spartan Training Ground alternate
INSERT INTO locations (id, name, set, image_path, threat_level, special_ability, set_number)
SELECT gen_random_uuid(), name, set, 'alternate/spartan_training_ground.png', threat_level, special_ability, set_number
FROM locations WHERE name = 'Spartan Training Ground' LIMIT 1;

-- Fix mission image paths to match actual files
-- Map database mission names to actual numbered files

-- Call of Cthulhu series (7 files)
UPDATE missions 
SET image_path = 'missions/call_of_cthulu_1.webp'
WHERE name = 'The Dreams of Men';

UPDATE missions 
SET image_path = 'missions/call_of_cthulu_2.webp'
WHERE name = 'Worshipping the Great Old One';

UPDATE missions 
SET image_path = 'missions/call_of_cthulu_3.webp'
WHERE name = 'Professor Angell''s Investigation';

UPDATE missions 
SET image_path = 'missions/call_of_cthulu_4.webp'
WHERE name = 'The Invisible Men';

UPDATE missions 
SET image_path = 'missions/call_of_cthulu_5.webp'
WHERE name = 'Gone Too Far';

UPDATE missions 
SET image_path = 'missions/call_of_cthulu_6.webp'
WHERE name = 'Johansen''s Window';

UPDATE missions 
SET image_path = 'missions/call_of_cthulu_7.webp'
WHERE name = 'New Orleans, 1918';

-- Chronicles of Mars series (7 files)
UPDATE missions 
SET image_path = 'missions/chronicles_of_mars_1.webp'
WHERE name = 'A Fighting Man of Mars';

UPDATE missions 
SET image_path = 'missions/chronicles_of_mars_2.webp'
WHERE name = 'Swords of Mars';

UPDATE missions 
SET image_path = 'missions/chronicles_of_mars_3.webp'
WHERE name = 'Under the Moons of Mars';

UPDATE missions 
SET image_path = 'missions/chronicles_of_mars_4.webp'
WHERE name = 'The Laughter of Thuvia';

UPDATE missions 
SET image_path = 'missions/chronicles_of_mars_5.webp'
WHERE name = 'The Gods Return';

UPDATE missions 
SET image_path = 'missions/chronicles_of_mars_6.webp'
WHERE name = 'Warriors from Across Time';

UPDATE missions 
SET image_path = 'missions/chronicles_of_mars_7.webp'
WHERE name = 'Tide Begins to Turn';

-- Tarzan King of the Jungle series (7 files)
UPDATE missions 
SET image_path = 'missions/tarzan_king_of_the_jungle_1.webp'
WHERE name = 'Tarzan of the Apes';

UPDATE missions 
SET image_path = 'missions/tarzan_king_of_the_jungle_2.webp'
WHERE name = 'Beasts of Tarzan';

UPDATE missions 
SET image_path = 'missions/tarzan_king_of_the_jungle_3.webp'
WHERE name = 'Tarzan and the Castaways';

UPDATE missions 
SET image_path = 'missions/tarzan_king_of_the_jungle_4.webp'
WHERE name = 'Tarzan and the City of Gold';

UPDATE missions 
SET image_path = 'missions/tarzan_king_of_the_jungle_5.webp'
WHERE name = 'Tarzan and the Golden Lion';

UPDATE missions 
SET image_path = 'missions/tarzan_king_of_the_jungle_6.webp'
WHERE name = 'Tarzan at the Earth''s Core';

UPDATE missions 
SET image_path = 'missions/tarzan_king_of_the_jungle_7.webp'
WHERE name = 'Tarzan''s Quest';

-- World Legends series (7 files)
UPDATE missions 
SET image_path = 'missions/world_legends_1.webp'
WHERE name = 'Battle at Olympus';

UPDATE missions 
SET image_path = 'missions/world_legends_2.webp'
WHERE name = 'Divine Retribution';

UPDATE missions 
SET image_path = 'missions/world_legends_3.webp'
WHERE name = 'Supernatural Allies';

UPDATE missions 
SET image_path = 'missions/world_legends_4.webp'
WHERE name = 'The Alert';

UPDATE missions 
SET image_path = 'missions/world_legends_5.webp'
WHERE name = 'The Battle of Kings';

UPDATE missions 
SET image_path = 'missions/world_legends_6.webp'
WHERE name = 'The Face of Deception';

UPDATE missions 
SET image_path = 'missions/world_legends_7.webp'
WHERE name = 'Traveler''s Warning';

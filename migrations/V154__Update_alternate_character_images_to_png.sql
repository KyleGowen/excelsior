-- Update alternate character image file extensions to match current assets
-- This migration updates characters.alternate_images to reflect new .png/.jpg files
-- Source of truth: files under src/resources/cards/images/characters/alternate

-- Single-image characters switched to .png
UPDATE characters SET alternate_images = ARRAY['characters/alternate/anubis.png'], updated_at = NOW()
WHERE name = 'Anubis';

UPDATE characters SET alternate_images = ARRAY['characters/alternate/leonidas.png'], updated_at = NOW()
WHERE name = 'Leonidas';

UPDATE characters SET alternate_images = ARRAY['characters/alternate/poseidon.png'], updated_at = NOW()
WHERE name = 'Poseidon';

UPDATE characters SET alternate_images = ARRAY['characters/alternate/professor_moriarty.png'], updated_at = NOW()
WHERE name = 'Professor Moriarty';

UPDATE characters SET alternate_images = ARRAY['characters/alternate/sheriff_of_nottingham.png'], updated_at = NOW()
WHERE name = 'Sheriff of Nottingham';

UPDATE characters SET alternate_images = ARRAY['characters/alternate/sun_wukong.png'], updated_at = NOW()
WHERE name = 'Sun Wukong';

UPDATE characters SET alternate_images = ARRAY['characters/alternate/three_musketeers.png'], updated_at = NOW()
WHERE name = 'Three Musketeers';

UPDATE characters SET alternate_images = ARRAY['characters/alternate/zeus.png'], updated_at = NOW()
WHERE name = 'Zeus';

UPDATE characters SET alternate_images = ARRAY['characters/alternate/zorro.png'], updated_at = NOW()
WHERE name = 'Zorro';

-- Characters with two alternates
-- Dracula now has one .png and one remaining .webp
UPDATE characters SET alternate_images = ARRAY['characters/alternate/dracula.png', 'characters/alternate/dracula2.webp'], updated_at = NOW()
WHERE name = 'Dracula';

-- Hercules now both .png
UPDATE characters SET alternate_images = ARRAY['characters/alternate/hercules.png', 'characters/alternate/hercules2.png'], updated_at = NOW()
WHERE name = 'Hercules';

-- Mina Harker now both .png
UPDATE characters SET alternate_images = ARRAY['characters/alternate/mina_harker.png', 'characters/alternate/mina_harker2.png'], updated_at = NOW()
WHERE name = 'Mina Harker';

-- Robin Hood now both .png
UPDATE characters SET alternate_images = ARRAY['characters/alternate/robin_hood.png', 'characters/alternate/robin_hood2.png'], updated_at = NOW()
WHERE name = 'Robin Hood';

-- Tars Tarkas: first switched to .png, second remains .webp
UPDATE characters SET alternate_images = ARRAY['characters/alternate/tars_tarkas.png', 'characters/alternate/tars_tarkas2.webp'], updated_at = NOW()
WHERE name = 'Tars Tarkas';

-- Time Traveler now both .png
UPDATE characters SET alternate_images = ARRAY['characters/alternate/time_traveler.png', 'characters/alternate/time_traveler2.png'], updated_at = NOW()
WHERE name = 'Time Traveler';

-- Van Helsing now both .png
UPDATE characters SET alternate_images = ARRAY['characters/alternate/van_helsing.png', 'characters/alternate/van_helsing2.png'], updated_at = NOW()
WHERE name = 'Van Helsing';

-- Characters with existing non-webp alternates (kept for completeness; extensions unchanged)
-- Merlin remains .png, Lancelot and The Mummy remain .jpg
UPDATE characters SET alternate_images = ARRAY['characters/alternate/merlin.png'], updated_at = NOW()
WHERE name = 'Merlin';

UPDATE characters SET alternate_images = ARRAY['characters/alternate/lancelot.jpg'], updated_at = NOW()
WHERE name = 'Lancelot';

UPDATE characters SET alternate_images = ARRAY['characters/alternate/the_mummy.jpg'], updated_at = NOW()
WHERE name = 'The Mummy';

-- Robin Hood, Mina Harker, Hercules, Time Traveler, Van Helsing, Tars Tarkas handled above

-- Verification query (no-op in migration execution, but helpful when running manually)
-- SELECT name, alternate_images FROM characters 
-- WHERE name IN (
--   'Anubis','Dracula','Hercules','Leonidas','Merlin','Mina Harker','Poseidon','Professor Moriarty',
--   'Robin Hood','Sheriff of Nottingham','Sun Wukong','Tars Tarkas','The Mummy','Three Musketeers',
--   'Time Traveler','Van Helsing','Zeus','Zorro'
-- ) ORDER BY name;


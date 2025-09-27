-- Add all remaining alternate character images to the characters table
-- This migration maps the actual alternate image files to their corresponding characters

-- Angry Mob variants - each gets all three alternate images
UPDATE characters SET alternate_images = ARRAY['characters/alternate/angry_mob_industrial_age.webp', 'characters/alternate/angry_mob_middle_ages.jpg', 'characters/alternate/angry_mob_modern_age.webp'] WHERE name = 'Angry Mob (Industrial Age)';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/angry_mob_industrial_age.webp', 'characters/alternate/angry_mob_middle_ages.jpg', 'characters/alternate/angry_mob_modern_age.webp'] WHERE name = 'Angry Mob (Middle Ages)';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/angry_mob_industrial_age.webp', 'characters/alternate/angry_mob_middle_ages.jpg', 'characters/alternate/angry_mob_modern_age.webp'] WHERE name = 'Angry Mob (Modern Age)';

-- Single alternate images
UPDATE characters SET alternate_images = ARRAY['characters/alternate/anubis.webp'] WHERE name = 'Anubis';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/billy_the_kid.webp'] WHERE name = 'Billy the Kid';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/carson_of_venus.webp'] WHERE name = 'Carson of Venus';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/count_of_monte_cristo.webp'] WHERE name = 'Count of Monte Cristo';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/cthulhu.webp'] WHERE name = 'Cthulhu';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/headless_horsman.webp'] WHERE name = 'Headless Horseman';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/joan_of_arc.webp'] WHERE name = 'Joan of Arc';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/john_carter_of_mars.webp'] WHERE name = 'John Carter of Mars';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/mr_hyde.webp'] WHERE name = 'Mr. Hyde';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/poseidon.webp'] WHERE name = 'Poseidon';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/professor_moriarty.webp'] WHERE name = 'Professor Moriarty';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/ra.webp'] WHERE name = 'Ra';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/sheriff_of_nottingham.webp'] WHERE name = 'Sheriff of Nottingham';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/sun_wukong.webp'] WHERE name = 'Sun Wukong';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/the_mummy.jpg'] WHERE name = 'The Mummy';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/three_musketeers.webp'] WHERE name = 'Three Musketeers';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/wicked_witch.webp'] WHERE name = 'Wicked Witch';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/zorro.webp'] WHERE name = 'Zorro';

-- Characters with 2 alternate images
UPDATE characters SET alternate_images = ARRAY['characters/alternate/dejah_thoris.jpg', 'characters/alternate/dejah_thoris2.webp'] WHERE name = 'Dejah Thoris';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/dracula.webp', 'characters/alternate/dracula2.webp'] WHERE name = 'Dracula';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/hercules.webp', 'characters/alternate/hercules2.webp'] WHERE name = 'Hercules';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/jane_porter.webp', 'characters/alternate/jane_porter2.webp'] WHERE name = 'Jane Porter';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/korak.webp', 'characters/alternate/korak2.webp'] WHERE name = 'Korak';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/mina_harker.webp', 'characters/alternate/mina_harker2.webp'] WHERE name = 'Mina Harker';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/morgan_le_fay.webp', 'characters/alternate/morgan_le_fay2webp.webp'] WHERE name = 'Morgan le Fay';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/robin_hood.webp', 'characters/alternate/robin_hood2.webp'] WHERE name = 'Robin Hood';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/tars_tarkas.webp', 'characters/alternate/tars_tarkas2.webp'] WHERE name = 'Tars Tarkas';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/time_traveler.webp', 'characters/alternate/time_traveler2.webp'] WHERE name = 'Time Traveler';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/van_helsing.webp', 'characters/alternate/van_helsing2.webp'] WHERE name = 'Van Helsing';
UPDATE characters SET alternate_images = ARRAY['characters/alternate/victory_harben.webp', 'characters/alternate/victory_harben2.webp'] WHERE name = 'Victory Harben';

-- Characters with 3 alternate images
UPDATE characters SET alternate_images = ARRAY['characters/alternate/tarzan.webp', 'characters/alternate/tarzan2.webp', 'characters/alternate/tarzan3.webp'] WHERE name = 'Tarzan';

-- Characters that already have alternate images (keep existing + add new if any)
-- Dr. Watson already has: 'characters/alternate/dr. watson.png'
-- King Arthur already has: 'characters/alternate/king_arthur.png'  
-- Lancelot already has: 'characters/alternate/lancelot.jpg'
-- Leonidas already has: 'characters/alternate/leonidas.webp'
-- Merlin already has: 'characters/alternate/merlin.png'
-- Sherlock Holmes already has: 'characters/alternate/sherlock_holmes.webp'
-- Zeus already has: 'characters/alternate/zeus.webp'

-- Verify the update
SELECT name, alternate_images FROM characters WHERE alternate_images IS NOT NULL ORDER BY name;

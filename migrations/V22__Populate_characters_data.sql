-- Populate characters data from markdown file
-- Generated automatically from overpower-erb-characters.md

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_name', 'Name', 'Energy', 0, 0, 0, 0, 'characters/name.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_angry_mob_(middle_ages)', 'Angry Mob (Middle Ages)', '6', 4, 6, 1, 16, 'characters/angry_mob_(middle_ages).webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_angry_mob_(industrial_age)', 'Angry Mob (Industrial Age)', '4', 5, 7, 3, 18, 'characters/angry_mob_(industrial_age).webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_angry_mob_(modern_age)', 'Angry Mob (Modern Age)', '5', 1, 8, 5, 20, 'characters/angry_mob_(modern_age).webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_anubis', 'Anubis', '6', 2, 7, 5, 18, 'characters/anubis.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_billy_the_kid', 'Billy the Kid', '4', 7, 3, 4, 17, 'characters/billy_the_kid.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_captain_nemo', 'Captain Nemo', '3', 6, 3, 7, 20, 'characters/captain_nemo.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_carson_of_venus', 'Carson of Venus', '7', 5, 4, 7, 20, 'characters/carson_of_venus.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_count_of_monte_cristo', 'Count of Monte Cristo', '1', 6, 3, 7, 20, 'characters/count_of_monte_cristo.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_cthulhu', 'Cthulhu', '6', 1, 8, 7, 22, 'characters/cthulhu.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_dejah_thoris', 'Dejah Thoris', '6', 6, 2, 3, 18, 'characters/dejah_thoris.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_dr._watson', 'Dr. Watson', '2', 6, 3, 5, 16, 'characters/dr._watson.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_dracula', 'Dracula', '4', 4, 6, 8, 22, 'characters/dracula.webp', '["characters/alternate/dracula.webp", "characters/alternate/dracula2.webp"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_headless_horseman', 'Headless Horseman', '6', 4, 7, 2, 18, 'characters/headless_horseman.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_hercules', 'Hercules', '3', 6, 8, 4, 22, 'characters/hercules.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_invisible_man', 'Invisible Man', '2', 5, 3, 6, 17, 'characters/invisible_man.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_jane_porter', 'Jane Porter', '3', 4, 3, 6, 16, 'characters/jane_porter.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_joan_of_arc', 'Joan of Arc', '2', 5, 2, 7, 18, 'characters/joan_of_arc.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_john_carter_of_mars', 'John Carter of Mars', '2', 6, 7, 5, 19, 'characters/john_carter_of_mars.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_king_arthur', 'King Arthur', '3', 7, 4, 6, 20, 'characters/king_arthur.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_korak', 'Korak', '2', 6, 5, 6, 17, 'characters/korak.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_lancelot', 'Lancelot', '2', 7, 5, 4, 18, 'characters/lancelot.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_leonidas', 'Leonidas', '1', 8, 5, 4, 21, 'characters/leonidas.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_merlin', 'Merlin', '7', 2, 2, 6, 21, 'characters/merlin.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_mina_harker', 'Mina Harker', '6', 2, 6, 2, 18, 'characters/mina_harker.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_morgan_le_fay', 'Morgan le Fay', '7', 2, 3, 5, 19, 'characters/morgan_le_fay.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_mr._hyde', 'Mr. Hyde', '3', 5, 6, 6, 16, 'characters/mr._hyde.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_poseidon', 'Poseidon', '7', 2, 7, 5, 19, 'characters/poseidon.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_professor_moriarty', 'Professor Moriarty', '3', 5, 4, 8, 20, 'characters/professor_moriarty.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_ra', 'Ra', '8', 2, 5, 5, 20, 'characters/ra.webp', '["characters/alternate/dracula.webp", "characters/alternate/dracula2.webp"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_robin_hood', 'Robin Hood', '2', 7, 4, 5, 18, 'characters/robin_hood.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_sheriff_of_nottingham', 'Sheriff of Nottingham', '2', 5, 7, 3, 18, 'characters/sheriff_of_nottingham.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_sherlock_holmes', 'Sherlock Holmes', '2', 5, 3, 8, 19, 'characters/sherlock_holmes.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_sun_wukong', 'Sun Wukong', '5', 8, 6, 3, 22, 'characters/sun_wukong.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_tars_tarkas', 'Tars Tarkas', '2', 7, 6, 3, 20, 'characters/tars_tarkas.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_tarzan', 'Tarzan', '1', 7, 5, 4, 19, 'characters/tarzan.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_the_mummy', 'The Mummy', '6', 2, 7, 2, 18, 'characters/the_mummy.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_the_three_musketeers', 'The Three Musketeers', '2', 7, 5, 5, 20, 'characters/the_three_musketeers.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_time_traveler', 'Time Traveler', '5', 3, 2, 6, 18, 'characters/time_traveler.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_van_helsing', 'Van Helsing', '3', 7, 4, 5, 20, 'characters/van_helsing.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_victory_harben', 'Victory Harben', '5', 5, 3, 7, 18, 'characters/victory_harben.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_wicked_witch', 'Wicked Witch', '8', 3, 2, 5, 19, 'characters/wicked_witch.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_zeus', 'Zeus', '8', 3, 6, 5, 23, 'characters/zeus.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;

INSERT INTO characters (id, name, universe, energy, combat, brute_force, intelligence, image_path, alternate_images) VALUES
('character_zorro', 'Zorro', '1', 8, 4, 5, 20, 'characters/zorro.webp', '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  universe = EXCLUDED.universe,
  energy = EXCLUDED.energy,
  combat = EXCLUDED.combat,
  brute_force = EXCLUDED.brute_force,
  intelligence = EXCLUDED.intelligence,
  image_path = EXCLUDED.image_path,
  alternate_images = EXCLUDED.alternate_images;
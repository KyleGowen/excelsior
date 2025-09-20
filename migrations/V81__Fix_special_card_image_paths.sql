-- Fix special card image paths to match actual filenames
-- Migration V81: Fix special card image paths

-- Update special cards with correct image paths
UPDATE special_cards
SET image_path = 'specials/disrupt_supply_lines.webp'
WHERE name = 'Disrupting Supply Lines';

UPDATE special_cards
SET image_path = 'specials/syphon_strike.webp'
WHERE name = 'Siphon Strike';

UPDATE special_cards
SET image_path = 'specials/_weighing_ofthe_heart.webp'
WHERE name = 'Weighing of the Heart';

UPDATE special_cards
SET image_path = 'specials/tray_guns.webp'
WHERE name = 'T-Ray Gun';

UPDATE special_cards
SET image_path = 'specials/vissage_of_terror.webp'
WHERE name = 'Visage of Terror';

UPDATE special_cards
SET image_path = 'specials/ive_murderd_before.webp'
WHERE name = 'I''ve Murdered Before';

UPDATE special_cards
SET image_path = 'specials/ethnoarchiology.webp'
WHERE name = 'Ethnoarchaeology';

UPDATE special_cards
SET image_path = 'specials/tenacious_persuit.webp'
WHERE name = 'Tenacious Pursuit';

UPDATE special_cards
SET image_path = 'specials/jungle_survival_en_108.webp'
WHERE name = 'Jungle Survival';

UPDATE special_cards
SET image_path = 'specials/fortell_the_future.webp'
WHERE name = 'Foretell the Future';

UPDATE special_cards
SET image_path = 'specials/dracluas_telepathic_connection.webp'
WHERE name = 'Dracula''s Telepathic Connection';

UPDATE special_cards
SET image_path = 'specials/john_harker_solicitor.webp'
WHERE name = 'Jonathan Harker, Solicitor';

UPDATE special_cards
SET image_path = 'specials/enchantress__guile.webp'
WHERE name = 'Enchantress Guile';

UPDATE special_cards
SET image_path = 'specials/reclaim_the_water.webp'
WHERE name = 'Reclaim the Waters';

UPDATE special_cards
SET image_path = 'specials/clut_of_mnevis_bull.webp'
WHERE name = 'Cult of Menevis Bull';

UPDATE special_cards
SET image_path = 'specials/robin_hood_master_thief.webp'
WHERE name = 'Master Thief';

UPDATE special_cards
SET image_path = 'specials/barsoom_warrior_and_statesman.webp'
WHERE name = 'Barsoomian Warrior Statesman';

UPDATE special_cards
SET image_path = 'specials/four_armed_warrior.webp'
WHERE name = 'Four-Armed Warrior';

UPDATE special_cards
SET image_path = 'specials/deceptive_manuver.webp'
WHERE name = 'Deceptive Maneuver';

UPDATE special_cards
SET image_path = 'specials/the_eternal_jouney.webp'
WHERE name = 'The Eternal Journey';

UPDATE special_cards
SET image_path = 'specials/valient_charge.webp'
WHERE name = 'Valiant Charge';

UPDATE special_cards
SET image_path = 'specials/sacred_wafers_of_amsterdam.webp'
WHERE name = 'Sacred Wafers from Amsterdam';

UPDATE special_cards
SET image_path = 'specials/wolves_crows_black_birds_en_237.webp'
WHERE name = 'Wolves, Crows & Black Bees';

UPDATE special_cards
SET image_path = 'specials/ancestial_rapier.webp'
WHERE name = 'Ancestral Rapier';

UPDATE special_cards
SET image_path = 'specials/feard_by_all_witches.webp'
WHERE name = 'Feared by All Witches';

UPDATE special_cards
SET image_path = 'specials/world_renowned_doctor.webp'
WHERE name = 'World-Renowned Doctor';

UPDATE special_cards
SET image_path = 'specials/riposte.webp'
WHERE name = 'Riposte';

-- Fix character image paths
UPDATE characters
SET image_path = 'characters/mr_hyde.webp'
WHERE name = 'Mr. Hyde';

UPDATE characters
SET image_path = 'characters/three_musketeers.webp'
WHERE name = 'The Three Musketeers';

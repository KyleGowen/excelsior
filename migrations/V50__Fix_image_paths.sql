-- Fix image paths to match actual file names with numeric prefixes
-- This migration updates image paths in all card tables to match the actual file structure

-- Fix aspects image paths
UPDATE aspects SET image_path = 'aspects/434_amaru_dragon_legend.webp' WHERE name = 'Amaru: Dragon Legend';
UPDATE aspects SET image_path = 'aspects/435_mallku.webp' WHERE name = 'Mallku';
UPDATE aspects SET image_path = 'aspects/436_supay.webp' WHERE name = 'Supay';
UPDATE aspects SET image_path = 'aspects/437_cheshire_cat.webp' WHERE name = 'Cheshire Cat';
UPDATE aspects SET image_path = 'aspects/438_isis.webp' WHERE name = 'Isis';

-- Fix events image paths (mix of webp and jpg files)
UPDATE events SET image_path = 'events/357_a_desperate_gamble.webp' WHERE name = 'Desperate Gamble';
UPDATE events SET image_path = 'events/358_the_cost_of_knowledge_is_sanity.webp' WHERE name = 'The Cost of Knowledge is Sanity';
UPDATE events SET image_path = 'events/359_stars_align.webp' WHERE name = 'Stars Align';
UPDATE events SET image_path = 'events/369_the_lost_city_of_opar.webp' WHERE name = 'The Lost City of Opar';
UPDATE events SET image_path = 'events/370_tarzan_the_terrible.webp' WHERE name = 'Tarzan the Terrible';
UPDATE events SET image_path = 'events/371_the_power_of_gonfal.webp' WHERE name = 'The Power of Gonfal';
UPDATE events SET image_path = 'events/381_giant_man_of_mars.webp' WHERE name = 'The Giant Man of Mars';
UPDATE events SET image_path = 'events/382_the_battle_with_zod.webp' WHERE name = 'The Battle with Zad';
UPDATE events SET image_path = 'events/383_eyes_in_the_dark.webp' WHERE name = 'Eyes in the Dark';
UPDATE events SET image_path = 'events/393_rally_our_allies.webp' WHERE name = 'Rally Our Allies';
UPDATE events SET image_path = 'events/394_second_chances.webp' WHERE name = 'Second Chances';
UPDATE events SET image_path = 'events/395_heroes_we_need.webp' WHERE name = 'Heroes We Need';
UPDATE events SET image_path = 'events/a_captive_no_more.jpg' WHERE name = 'A Captive no More';
UPDATE events SET image_path = 'events/a_venemous_threat.jpg' WHERE name = 'A Venomous Threat';
UPDATE events SET image_path = 'events/getting_our_hands_dirty.jpg' WHERE name = 'Getting Our Hands Dirty';
UPDATE events SET image_path = 'events/healed_by_a_dark_power.jpg' WHERE name = 'Healed by a Dark Power';
UPDATE events SET image_path = 'events/ready_for_war.jpg' WHERE name = 'Ready for War';
UPDATE events SET image_path = 'events/the_chamber_of_reptiles.jpg' WHERE name = 'The Chamber of Reptiles';
UPDATE events SET image_path = 'events/who_can_you_trust.jpg' WHERE name = 'Who Can You Trust';

-- Fix power cards image paths (add numeric prefixes)
UPDATE power_cards SET image_path = 'power-cards/299_1_energy.webp' WHERE power_type = 'Energy' AND value = 1;
UPDATE power_cards SET image_path = 'power-cards/298_2_energy.webp' WHERE power_type = 'Energy' AND value = 2;
UPDATE power_cards SET image_path = 'power-cards/297_3_energy.webp' WHERE power_type = 'Energy' AND value = 3;
UPDATE power_cards SET image_path = 'power-cards/296_4_energy.webp' WHERE power_type = 'Energy' AND value = 4;
UPDATE power_cards SET image_path = 'power-cards/295_5_energy.webp' WHERE power_type = 'Energy' AND value = 5;
UPDATE power_cards SET image_path = 'power-cards/294_6_energy.webp' WHERE power_type = 'Energy' AND value = 6;
UPDATE power_cards SET image_path = 'power-cards/293_7_energy.webp' WHERE power_type = 'Energy' AND value = 7;
UPDATE power_cards SET image_path = 'power-cards/292_8_energy.webp' WHERE power_type = 'Energy' AND value = 8;

UPDATE power_cards SET image_path = 'power-cards/307_1_combat.webp' WHERE power_type = 'Combat' AND value = 1;
UPDATE power_cards SET image_path = 'power-cards/306_2_combat.webp' WHERE power_type = 'Combat' AND value = 2;
UPDATE power_cards SET image_path = 'power-cards/305_3_combat.webp' WHERE power_type = 'Combat' AND value = 3;
UPDATE power_cards SET image_path = 'power-cards/304_4_combat.webp' WHERE power_type = 'Combat' AND value = 4;
UPDATE power_cards SET image_path = 'power-cards/303_5_combat.webp' WHERE power_type = 'Combat' AND value = 5;
UPDATE power_cards SET image_path = 'power-cards/302_6_combat.webp' WHERE power_type = 'Combat' AND value = 6;
UPDATE power_cards SET image_path = 'power-cards/301_7_combat.webp' WHERE power_type = 'Combat' AND value = 7;
UPDATE power_cards SET image_path = 'power-cards/300_8_combat.webp' WHERE power_type = 'Combat' AND value = 8;

UPDATE power_cards SET image_path = 'power-cards/315_1_brute_force.webp' WHERE power_type = 'Brute Force' AND value = 1;
UPDATE power_cards SET image_path = 'power-cards/314_2_brute_force.webp' WHERE power_type = 'Brute Force' AND value = 2;
UPDATE power_cards SET image_path = 'power-cards/313_3_brute_force.webp' WHERE power_type = 'Brute Force' AND value = 3;
UPDATE power_cards SET image_path = 'power-cards/312_4_brute_force.webp' WHERE power_type = 'Brute Force' AND value = 4;
UPDATE power_cards SET image_path = 'power-cards/311_5_brute_force.webp' WHERE power_type = 'Brute Force' AND value = 5;
UPDATE power_cards SET image_path = 'power-cards/310_6_brute_force.webp' WHERE power_type = 'Brute Force' AND value = 6;
UPDATE power_cards SET image_path = 'power-cards/309_7_brute_force.webp' WHERE power_type = 'Brute Force' AND value = 7;
UPDATE power_cards SET image_path = 'power-cards/308_8_brute_force.webp' WHERE power_type = 'Brute Force' AND value = 8;

UPDATE power_cards SET image_path = 'power-cards/323_1_intelligence.webp' WHERE power_type = 'Intelligence' AND value = 1;
UPDATE power_cards SET image_path = 'power-cards/322_2_intelligence.webp' WHERE power_type = 'Intelligence' AND value = 2;
UPDATE power_cards SET image_path = 'power-cards/321_3_intelligence.webp' WHERE power_type = 'Intelligence' AND value = 3;
UPDATE power_cards SET image_path = 'power-cards/320_4_intelligence.webp' WHERE power_type = 'Intelligence' AND value = 4;
UPDATE power_cards SET image_path = 'power-cards/319_5_intelligence.webp' WHERE power_type = 'Intelligence' AND value = 5;
UPDATE power_cards SET image_path = 'power-cards/318_6_intelligence.webp' WHERE power_type = 'Intelligence' AND value = 6;
UPDATE power_cards SET image_path = 'power-cards/317_7_intelligence.webp' WHERE power_type = 'Intelligence' AND value = 7;
UPDATE power_cards SET image_path = 'power-cards/316_8_intelligence.webp' WHERE power_type = 'Intelligence' AND value = 8;

-- Fix Any-Power cards
UPDATE power_cards SET image_path = 'power-cards/473_5_any-power.webp' WHERE power_type = 'Any-Power' AND value = 5;
UPDATE power_cards SET image_path = 'power-cards/474_6_anypower.webp' WHERE power_type = 'Any-Power' AND value = 6;
UPDATE power_cards SET image_path = 'power-cards/475_7_anypower.webp' WHERE power_type = 'Any-Power' AND value = 7;
UPDATE power_cards SET image_path = 'power-cards/476_8_anypower.webp' WHERE power_type = 'Any-Power' AND value = 8;

-- Fix Multi-Power cards
UPDATE power_cards SET image_path = 'power-cards/477_3_multipower.webp' WHERE power_type = 'Multi-Power' AND value = 3;
UPDATE power_cards SET image_path = 'power-cards/478_4_multipower.webp' WHERE power_type = 'Multi-Power' AND value = 4;
UPDATE power_cards SET image_path = 'power-cards/479_5_multipower.webp' WHERE power_type = 'Multi-Power' AND value = 5;

-- Fix training cards image paths
UPDATE training_cards SET image_path = 'training-universe/5_any_power_5_sekhmet.webp' WHERE name = 'Sekhmet';
UPDATE training_cards SET image_path = 'training-universe/344_5_energy_5_combat_4.webp' WHERE name = 'Joan of Arc';
UPDATE training_cards SET image_path = 'training-universe/345_5_energy_5_brute_force_4.webp' WHERE name = 'Lancelot';
UPDATE training_cards SET image_path = 'training-universe/346_5_energy_5_intelligence_4.webp' WHERE name = 'Leonidas';
UPDATE training_cards SET image_path = 'training-universe/347_5_combat_5_brute_force_4.webp' WHERE name = 'Merlin';
UPDATE training_cards SET image_path = 'training-universe/348_5_combat_5_intelligence_4.webp' WHERE name = 'Robin Hood';
UPDATE training_cards SET image_path = 'training-universe/349_5_brute_force_5_intelligence_4.webp' WHERE name = 'Cultists';

-- Fix ally universe cards image paths
UPDATE ally_universe_cards SET image_path = 'ally-universe/allan_quatermain.webp' WHERE name = 'Allan Quatermain';
UPDATE ally_universe_cards SET image_path = 'ally-universe/guy_of_gisborne.webp' WHERE name = 'Guy of Gisborne';
UPDATE ally_universe_cards SET image_path = 'ally-universe/hera.webp' WHERE name = 'Hera';
UPDATE ally_universe_cards SET image_path = 'ally-universe/huckleblock.webp' WHERE name = 'Huckleblock';
UPDATE ally_universe_cards SET image_path = 'ally-universe/little_john.webp' WHERE name = 'Little John';
UPDATE ally_universe_cards SET image_path = 'ally-universe/professor_porter.webp' WHERE name = 'Professor Porter';
UPDATE ally_universe_cards SET image_path = 'ally-universe/queen_guinevere.webp' WHERE name = 'Queen Guinevere';
UPDATE ally_universe_cards SET image_path = 'ally-universe/sir_galahad.webp' WHERE name = 'Sir Galahad';

-- Fix basic universe cards image paths
UPDATE basic_universe_cards SET image_path = 'basic-universe/332_6_energy_2.webp' WHERE name = 'Advanced Technology';
UPDATE basic_universe_cards SET image_path = 'basic-universe/333_6_energy_3.webp' WHERE name = 'Flintlock';
UPDATE basic_universe_cards SET image_path = 'basic-universe/334_7_energy_3.webp' WHERE name = 'Hydes Serum';
UPDATE basic_universe_cards SET image_path = 'basic-universe/335_6_combat_2.webp' WHERE name = 'Lightning Bolt';
UPDATE basic_universe_cards SET image_path = 'basic-universe/336_6_combat_3.webp' WHERE name = 'Longbow';
UPDATE basic_universe_cards SET image_path = 'basic-universe/337_7_combat_3.webp' WHERE name = 'Magic Spell';
UPDATE basic_universe_cards SET image_path = 'basic-universe/338_6_brute_force_2.webp' WHERE name = 'Merlins Wand';
UPDATE basic_universe_cards SET image_path = 'basic-universe/339_6_brute_force_3.webp' WHERE name = 'Rapier';
UPDATE basic_universe_cards SET image_path = 'basic-universe/340_7_brute_force_3.webp' WHERE name = 'Ray Gun';
UPDATE basic_universe_cards SET image_path = 'basic-universe/341_6_intelligence_2.webp' WHERE name = 'Secret Identity';
UPDATE basic_universe_cards SET image_path = 'basic-universe/342_6_intelligence_3.webp' WHERE name = 'Tribuchet';
UPDATE basic_universe_cards SET image_path = 'basic-universe/343_7_intelligence_3.webp' WHERE name = 'Trident';


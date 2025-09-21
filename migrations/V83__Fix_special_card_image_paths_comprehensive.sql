-- Fix special card image paths - comprehensive update
-- This migration updates all special card image paths to match actual file names

-- Cthulhu special cards
UPDATE special_cards SET image_path = 'specials/ancient_one.webp' WHERE name = 'Ancient One';
UPDATE special_cards SET image_path = 'specials/devoted_follower.webp' WHERE name = 'Devoted Follower';
UPDATE special_cards SET image_path = 'specials/distracting_intervention.webp' WHERE name = 'Distracting Intervention';
UPDATE special_cards SET image_path = 'specials/network_of_fanatics.webp' WHERE name = 'Network of Fanatics';
UPDATE special_cards SET image_path = 'specials/call_of_cthulhu.webp' WHERE name = 'The Call of Cthulhu';
UPDATE special_cards SET image_path = 'specials/the_sleeper_awakens.webp' WHERE name = 'The Sleeper Awakens';

-- Carson of Venus special cards
UPDATE special_cards SET image_path = 'specials/janjong_duare_mintep.webp' WHERE name = 'Janjong Duare Mintep';
UPDATE special_cards SET image_path = 'specials/on_a_razors_edge.webp' WHERE name = 'On the Razor''s Edge';
UPDATE special_cards SET image_path = 'specials/telepathic_resistance.webp' WHERE name = 'Telepathic Resistance';
UPDATE special_cards SET image_path = 'specials/sometimes_piracy_is_the_best_option.webp' WHERE name = 'Sometimes Piracy is the Best Option';
UPDATE special_cards SET image_path = 'specials/tray_guns.webp' WHERE name = 'T-Ray Gun';
UPDATE special_cards SET image_path = 'specials/telepathic_training.webp' WHERE name = 'Telepathic Training';

-- Any Character special cards
UPDATE special_cards SET image_path = 'specials/heimdall.webp' WHERE name = 'Heimdall';
UPDATE special_cards SET image_path = 'specials/lady_of_the_lake.webp' WHERE name = 'Lady of the Lake';
UPDATE special_cards SET image_path = 'specials/robin_hood_master_thief.webp' WHERE name = 'Robin Hood: Master Thief';
UPDATE special_cards SET image_path = 'specials/tunupa_mountain_god.webp' WHERE name = 'Tunupa: Mountain God';
UPDATE special_cards SET image_path = 'specials/fairy_protection.webp' WHERE name = 'Fairy Protection';
UPDATE special_cards SET image_path = 'specials/loki.webp' WHERE name = 'Loki';
UPDATE special_cards SET image_path = 'specials/wrath_of_ra.webp' WHERE name = 'Wrath of Ra';
UPDATE special_cards SET image_path = 'specials/valkyrie_skeggjold.webp' WHERE name = 'Valkyrie: Skeggjold';
UPDATE special_cards SET image_path = 'specials/oni_and_succubus.webp' WHERE name = 'Oni and Succubus';
UPDATE special_cards SET image_path = 'specials/bodhisattava_enlightened_one.webp' WHERE name = 'Bodhisattva: Enlightened One';
UPDATE special_cards SET image_path = 'specials/mystical_energy.webp' WHERE name = 'Mystical Energy';
UPDATE special_cards SET image_path = 'specials/charge_into_battle.webp' WHERE name = 'Charge into Battle';
UPDATE special_cards SET image_path = 'specials/subjugate_the_meek.webp' WHERE name = 'Subjugate the Meek';
UPDATE special_cards SET image_path = 'specials/draconic_leadership.webp' WHERE name = 'Draconic Leadership';
UPDATE special_cards SET image_path = 'specials/liliths_swarm.webp' WHERE name = 'Lilith''s Swarm';
UPDATE special_cards SET image_path = 'specials/disorient_opponent.webp' WHERE name = 'Disorient Opponent';
UPDATE special_cards SET image_path = 'specials/freya_goddess_of_protection.webp' WHERE name = 'Freya: Goddess of Protection';
UPDATE special_cards SET image_path = 'specials/grim_reaper.webp' WHERE name = 'Grim Reaper';
UPDATE special_cards SET image_path = 'specials/gunnr.webp' WHERE name = 'Gunnr: Battle Valkyrie';
UPDATE special_cards SET image_path = 'specials/hades_lord_of_the_underworld.webp' WHERE name = 'Hades: Lord of the Underworld';
UPDATE special_cards SET image_path = 'specials/legendary_escape.webp' WHERE name = 'Legendary Escape';
UPDATE special_cards SET image_path = 'specials/merlins_magic.webp' WHERE name = 'Merlin''s Magic';
UPDATE special_cards SET image_path = 'specials/preternatural_healing.webp' WHERE name = 'Preternatural Healing';
UPDATE special_cards SET image_path = 'specials/princess_and_the_pea.webp' WHERE name = 'Princess and the Pea';
UPDATE special_cards SET image_path = 'specials/the_gemini.webp' WHERE name = 'The Gemini';
UPDATE special_cards SET image_path = 'specials/valkyrie_hildr_select_the_slain.webp' WHERE name = 'Valkyrie: Hildr Select the Slain';

-- Victory Harben special cards
UPDATE special_cards SET image_path = 'specials/abner_perrys_lab_assistant.webp' WHERE name = 'Abner Perry''s Lab Assistant';
UPDATE special_cards SET image_path = 'specials/archery_knives_and_jiu_jitsu.webp' WHERE name = 'Archery Knives and Jiu Jitsu';
UPDATE special_cards SET image_path = 'specials/chamston-hedding_estate.webp' WHERE name = 'Chamston-Hedding Estate';

-- Count of Monte Cristo special cards
UPDATE special_cards SET image_path = 'specials/friend_or_foe.webp' WHERE name = 'Friend to Foe';
UPDATE special_cards SET image_path = 'specials/jacopo.webp' WHERE name = 'Jacopo';
UPDATE special_cards SET image_path = 'specials/network_of_theives.webp' WHERE name = 'Network of Thieves';
UPDATE special_cards SET image_path = 'specials/suprise_swordsman.webp' WHERE name = 'Surprise Swordsman';
UPDATE special_cards SET image_path = 'specials/unlimited_resources.webp' WHERE name = 'Unlimited Resources';

-- Professor Moriarty special cards
UPDATE special_cards SET image_path = 'specials/mathematical_genius.webp' WHERE name = 'Mathematical Genius';

-- Additional missing special cards
UPDATE special_cards SET image_path = 'specials/disrupt_supply_lines.webp' WHERE name = 'Disrupting Supply Lines';
UPDATE special_cards SET image_path = 'specials/syphon_strike.webp' WHERE name = 'Siphon Strike';
UPDATE special_cards SET image_path = 'specials/_weighing_ofthe_heart.webp' WHERE name = 'Weighing of the Heart';
UPDATE special_cards SET image_path = 'specials/tray_guns.webp' WHERE name = 'Tray Gun';
UPDATE special_cards SET image_path = 'specials/vissage_of_terror.webp' WHERE name = 'Visage of Terror';
UPDATE special_cards SET image_path = 'specials/ive_murderd_before.webp' WHERE name = 'I''ve Murdered Before';
UPDATE special_cards SET image_path = 'specials/ethnoarchiology.webp' WHERE name = 'Ethnoarchaeology';
UPDATE special_cards SET image_path = 'specials/tenacious_persuit.webp' WHERE name = 'Tenacious Pursuit';
UPDATE special_cards SET image_path = 'specials/jungle_survival_en_108.webp' WHERE name = 'Jungle Survival';
UPDATE special_cards SET image_path = 'specials/fortell_the_future.webp' WHERE name = 'Foretell the Future';
UPDATE special_cards SET image_path = 'specials/dracluas_telepathic_connection.webp' WHERE name = 'Dracula''s Telepathic Connection';
UPDATE special_cards SET image_path = 'specials/john_harker_solicitor.webp' WHERE name = 'Jonathan Harker: Solicitor';
UPDATE special_cards SET image_path = 'specials/enchantress__guile.webp' WHERE name = 'Enchantress Guile';
UPDATE special_cards SET image_path = 'specials/reclaim_the_water.webp' WHERE name = 'Reclaim the Waters';
UPDATE special_cards SET image_path = 'specials/clut_of_mnevis_bull.webp' WHERE name = 'Cult of Menevis Bull';
UPDATE special_cards SET image_path = 'specials/robin_hood_master_thief.webp' WHERE name = 'Master Thief';
UPDATE special_cards SET image_path = 'specials/barsoom_warrior_and_statesman.webp' WHERE name = 'Barsoomian Warrior Statesman';
UPDATE special_cards SET image_path = 'specials/four_armed_warrior.webp' WHERE name = 'Four-Armed Warrior';
UPDATE special_cards SET image_path = 'specials/deceptive_manuver.webp' WHERE name = 'Deceptive Maneuver';
UPDATE special_cards SET image_path = 'specials/the_eternal_jouney.webp' WHERE name = 'The Eternal Journey';
UPDATE special_cards SET image_path = 'specials/valient_charge.webp' WHERE name = 'Valiant Charge';
UPDATE special_cards SET image_path = 'specials/sacred_wafers_of_amsterdam.webp' WHERE name = 'Sacred Wafers from Amsterdam';
UPDATE special_cards SET image_path = 'specials/wolves_crows_black_birds_en_237.webp' WHERE name = 'Wolves, Crows, Black Bees';
UPDATE special_cards SET image_path = 'specials/ancestial_rapier.webp' WHERE name = 'Ancestral Rapier';
UPDATE special_cards SET image_path = 'specials/feard_by_all_witches.webp' WHERE name = 'Feared by All Witches';
UPDATE special_cards SET image_path = 'specials/world_renowned_doctor.webp' WHERE name = 'World-Renowned Doctor';

-- Sources: ERB_Fullset_Data.xls and Skybound - Full Set - Data.xls, Cards sheets.
-- These artist cells were blank. The printed credit was transcribed in the
-- extraction notes or misclassified in another field. Each credit was checked
-- against the numbered card image. Foil rows below use the same credited art.

UPDATE ally_universe_cards AS card
SET artist = credit.artist
FROM (VALUES
  ('ERB', '324', 'erb/ally/324_allan_quatermain.png', 'MAIA')
) AS credit(set_code, collector_number, image_path, artist)
WHERE card.set = credit.set_code
  AND card.set_number = credit.collector_number
  AND card.image_path = credit.image_path
  AND card.artist IS NULL;

UPDATE basic_universe_cards AS card
SET artist = credit.artist
FROM (VALUES
  ('ERB', '340', 'erb/basic-universe/340_tribuchet.png', 'BRILHA')
) AS credit(set_code, collector_number, image_path, artist)
WHERE card.set = credit.set_code
  AND card.set_number = credit.collector_number
  AND card.image_path = credit.image_path
  AND card.artist IS NULL;

UPDATE characters AS card
SET artist = credit.artist
FROM (VALUES
  ('ERB', '055', 'erb/characters/055_dejah_thoris.png', 'TAN'),
  ('ERB', '055F', 'erb/characters/055_dejah_thoris.png', 'TAN'),
  ('ERB', '076', 'erb/characters/076_headless_horseman.png', 'BAAL'),
  ('ERB', '090', 'erb/characters/090_invisible_man.png', 'MAIA'),
  ('ERB', '097', 'erb/characters/097_jane_porter.png', 'FLOWERS'),
  ('ERB', '097F', 'erb/characters/097_jane_porter.png', 'FLOWERS'),
  ('ERB', '181', 'erb/characters/181_professor_moriarty.png', 'BRILHA'),
  ('ERB', '181F', 'erb/characters/181_professor_moriarty.png', 'BRILHA'),
  ('ERB', '485', 'erb/characters/485_anubis.png', 'GAY'),
  ('ERB', '485F', 'erb/characters/485_anubis.png', 'GAY'),
  ('ERB', '498', 'erb/characters/498_invisible_man.png', 'BAAL'),
  ('ERB', '498F', 'erb/characters/498_invisible_man.png', 'BAAL'),
  ('ERB', '504', 'erb/characters/504_king_arthur.png', 'GAY'),
  ('ERB', '504F', 'erb/characters/504_king_arthur.png', 'GAY'),
  ('ERB', '508', 'erb/characters/508_leonidas.png', 'GAY'),
  ('ERB', '508F', 'erb/characters/508_leonidas.png', 'GAY'),
  ('ERB', '511', 'erb/characters/511_morgan_le_fay.png', 'GAY'),
  ('ERB', '511F', 'erb/characters/511_morgan_le_fay.png', 'GAY'),
  ('ERB', '518', 'erb/characters/518_sheriff_of_nottingham.png', 'GAY'),
  ('ERB', '518F', 'erb/characters/518_sheriff_of_nottingham.png', 'GAY'),
  ('ERB', '521', 'erb/characters/521_tars_tarkas.png', 'GAY'),
  ('ERB', '521F', 'erb/characters/521_tars_tarkas.png', 'GAY'),
  ('ERB', '523', 'erb/characters/523_merlin.png', 'TAN'),
  ('ERB', '523F', 'erb/characters/523_merlin.png', 'TAN'),
  ('ERB', '534', 'erb/characters/534_zorro.png', 'TAN'),
  ('ERB', '534F', 'erb/characters/534_zorro.png', 'TAN'),
  ('SKY', '128', 'sky/characters/128_rick_grimes.png', 'AKA'),
  ('SKY', '149', 'sky/characters/149_negan.png', 'MANNA'),
  ('SKY', '432', 'sky/characters/432_machine_head_and_his_gang.png', 'MANNA'),
  ('SKY', '432F', 'sky/characters/432_machine_head_and_his_gang.png', 'MANNA'),
  ('SKY', '442', 'sky/characters/442_glenn.png', 'MANNA'),
  ('SKY', '442F', 'sky/characters/442_glenn.png', 'MANNA'),
  ('SKY', '445', 'sky/characters/445_the_hilltop.png', 'LATINA'),
  ('SKY', '445F', 'sky/characters/445_the_hilltop.png', 'LATINA'),
  ('SKY', '449', 'sky/characters/449_abraham_rosita_and_eugene.png', 'LATINA'),
  ('SKY', '449F', 'sky/characters/449_abraham_rosita_and_eugene.png', 'LATINA'),
  ('SKY', '454', 'sky/characters/454_negan.png', 'BAAL'),
  ('SKY', '454F', 'sky/characters/454_negan.png', 'BAAL')
) AS credit(set_code, collector_number, image_path, artist)
WHERE card.set = credit.set_code
  AND card.set_number = credit.collector_number
  AND card.image_path = credit.image_path
  AND card.artist IS NULL;

UPDATE events AS card
SET artist = credit.artist
FROM (VALUES
  ('SKY', '404', 'sky/events/404_the_world_mourns.png', 'WALKER')
) AS credit(set_code, collector_number, image_path, artist)
WHERE card.set = credit.set_code
  AND card.set_number = credit.collector_number
  AND card.image_path = credit.image_path
  AND card.artist IS NULL;

UPDATE locations AS card
SET artist = credit.artist
FROM (VALUES
  ('SKY', '380', 'sky/locations/380_teen_team_headquarters.png', 'WALKER')
) AS credit(set_code, collector_number, image_path, artist)
WHERE card.set = credit.set_code
  AND card.set_number = credit.collector_number
  AND card.image_path = credit.image_path
  AND card.artist IS NULL;

UPDATE power_cards AS card
SET artist = credit.artist
FROM (VALUES
  ('ERB', '293', 'erb/power/293_7_energy.png', 'ABDIAS'),
  ('ERB', '294', 'erb/power/294_6_energy.png', 'ABDIAS'),
  ('ERB', '314', 'erb/power/314_2_brute_force.png', 'BAAL'),
  ('SKY', '282', 'sky/power/282_5_intelligence.png', 'WALKER')
) AS credit(set_code, collector_number, image_path, artist)
WHERE card.set = credit.set_code
  AND card.set_number = credit.collector_number
  AND card.image_path = credit.image_path
  AND card.artist IS NULL;

UPDATE special_cards AS card
SET artist = credit.artist
FROM (VALUES
  ('ERB', '015', 'erb/specials/015_book_of_the_dead.png', 'BAAL'),
  ('ERB', '016', 'erb/specials/016_lord_of_the_sacred_land.png', 'BAAL'),
  ('ERB', '018', 'erb/specials/018_siphon_strike.png', 'BAAL'),
  ('ERB', '019', 'erb/specials/019_weighing_of_the_heart.png', 'BAAL'),
  ('ERB', '020', 'erb/specials/020_wither.png', 'BAAL'),
  ('ERB', '044', 'erb/specials/044_jacopo.png', 'BAAL'),
  ('ERB', '044F', 'erb/specials/044_jacopo.png', 'BAAL'),
  ('ERB', '049', 'erb/specials/049_ancient_one.png', 'BAAL'),
  ('ERB', '049F', 'erb/specials/049_ancient_one.png', 'BAAL'),
  ('ERB', '050', 'erb/specials/050_devoted_follower.png', 'BAAL'),
  ('ERB', '050F', 'erb/specials/050_devoted_follower.png', 'BAAL'),
  ('ERB', '051', 'erb/specials/051_distracting_intervention.png', 'BAAL'),
  ('ERB', '051F', 'erb/specials/051_distracting_intervention.png', 'BAAL'),
  ('ERB', '052', 'erb/specials/052_network_of_fanatics.png', 'BAAL'),
  ('ERB', '052F', 'erb/specials/052_network_of_fanatics.png', 'BAAL'),
  ('ERB', '053', 'erb/specials/053_the_call_of_cthulhu.png', 'BAAL'),
  ('ERB', '053F', 'erb/specials/053_the_call_of_cthulhu.png', 'BAAL'),
  ('ERB', '054', 'erb/specials/054_the_sleeper_awakens.png', 'BAAL'),
  ('ERB', '056', 'erb/specials/056_warrior_of_helium.png', 'TAN'),
  ('ERB', '056F', 'erb/specials/056_warrior_of_helium.png', 'TAN'),
  ('ERB', '057', 'erb/specials/057_diplomat_to_all_martians.png', 'ABDIAS'),
  ('ERB', '057F', 'erb/specials/057_diplomat_to_all_martians.png', 'ABDIAS'),
  ('ERB', '060', 'erb/specials/060_protector_of_barsoom.png', 'TAN'),
  ('ERB', '060F', 'erb/specials/060_protector_of_barsoom.png', 'TAN'),
  ('ERB', '065', 'erb/specials/065_british_army_surgeon.png', 'ABDIAS'),
  ('ERB', '070', 'erb/specials/070_crimson_restoration.png', 'BAAL'),
  ('ERB', '071', 'erb/specials/071_veil_of_deceit.png', 'BAAL'),
  ('ERB', '077', 'erb/specials/077_decapitate.png', 'BAAL'),
  ('ERB', '078', 'erb/specials/078_human_spine_whip.png', 'BAAL'),
  ('ERB', '079', 'erb/specials/079_mark_of_the_headless.png', 'BAAL'),
  ('ERB', '080', 'erb/specials/080_pumpkin_head.png', 'BAAL'),
  ('ERB', '081', 'erb/specials/081_relentless_hessian.png', 'BAAL'),
  ('ERB', '082', 'erb/specials/082_visage_of_terror.png', 'BAAL'),
  ('ERB', '110', 'erb/specials/110_protection_of_saint_michael.png', 'MAIA'),
  ('ERB', '117', 'erb/specials/117_virginia_fighting_man.png', 'Tan'),
  ('ERB', '117F', 'erb/specials/117_virginia_fighting_man.png', 'Tan'),
  ('ERB', '121', 'erb/specials/121_knights_of_the_round_table.png', 'BAAL'),
  ('ERB', '121F', 'erb/specials/121_knights_of_the_round_table.png', 'BAAL'),
  ('ERB', '122', 'erb/specials/122_legendary_partnership.png', 'GUARA'),
  ('ERB', '147', 'erb/specials/147_archimedes.png', 'BAAL'),
  ('ERB', '147F', 'erb/specials/147_archimedes.png', 'BAAL'),
  ('ERB', '150', 'erb/specials/150_foretell_the_future.png', 'BAAL'),
  ('ERB', '150F', 'erb/specials/150_foretell_the_future.png', 'BAAL'),
  ('ERB', '168', 'erb/specials/168_overdose.png', 'BAAL'),
  ('ERB', '169', 'erb/specials/169_sadistic_tendencies.png', 'BAAL'),
  ('ERB', '170', 'erb/specials/170_set_loose.png', 'BAAL'),
  ('ERB', '172', 'erb/specials/172_trample.png', 'BAAL'),
  ('ERB', '173', 'erb/specials/173_victorian_sophisticant.png', 'BAAL'),
  ('ERB', '182', 'erb/specials/182_complex_criminal_scheme.png', 'BRILHA'),
  ('ERB', '182F', 'erb/specials/182_complex_criminal_scheme.png', 'BRILHA'),
  ('ERB', '184', 'erb/specials/184_future_plans.png', 'BRILHA'),
  ('ERB', '184F', 'erb/specials/184_future_plans.png', 'BRILHA'),
  ('ERB', '185', 'erb/specials/185_mathematical_genius.png', 'BRILHA'),
  ('ERB', '185F', 'erb/specials/185_mathematical_genius.png', 'BRILHA'),
  ('ERB', '186', 'erb/specials/186_napoleon_of_crime.png', 'BRILHA'),
  ('ERB', '186F', 'erb/specials/186_napoleon_of_crime.png', 'BRILHA'),
  ('ERB', '187', 'erb/specials/187_tactical_fighter.png', 'BRILHA'),
  ('ERB', '187F', 'erb/specials/187_tactical_fighter.png', 'BRILHA'),
  ('ERB', '190', 'erb/specials/190_eye_of_sekhmet.png', 'BAAL'),
  ('ERB', '218', 'erb/specials/218_godly_strength.png', 'BRILHA'),
  ('ERB', '218F', 'erb/specials/218_godly_strength.png', 'BRILHA'),
  ('ERB', '238', 'erb/specials/238_ancient_wisdom.png', 'BAAL'),
  ('ERB', '238F', 'erb/specials/238_ancient_wisdom.png', 'BAAL'),
  ('ERB', '239', 'erb/specials/239_fury_of_the_desert.png', 'BAAL'),
  ('ERB', '239F', 'erb/specials/239_fury_of_the_desert.png', 'BAAL'),
  ('ERB', '241', 'erb/specials/241_reinvigorated_by_fresh_organs.png', 'BAAL'),
  ('ERB', '242', 'erb/specials/242_relentless_pursuit.png', 'BAAL'),
  ('ERB', '242F', 'erb/specials/242_relentless_pursuit.png', 'BAAL'),
  ('ERB', '243', 'erb/specials/243_the_eternal_journey.png', 'BAAL'),
  ('ERB', '243F', 'erb/specials/243_the_eternal_journey.png', 'BAAL'),
  ('ERB', '253', 'erb/specials/253_futuristic_phaser.png', 'BRILHA'),
  ('ERB', '253F', 'erb/specials/253_futuristic_phaser.png', 'BRILHA'),
  ('ERB', '255', 'erb/specials/255_knowledge_of_tomorrow.png', 'BRILHA'),
  ('ERB', '257', 'erb/specials/257_the_tomorrow_doctor.png', 'BRILHA'),
  ('ERB', '257F', 'erb/specials/257_the_tomorrow_doctor.png', 'BRILHA'),
  ('ERB', '282', 'erb/specials/282_hera.png', 'GUARA'),
  ('ERB', '282F', 'erb/specials/282_hera.png', 'GUARA'),
  ('SKY', '012', 'sky/specials/012_viltrumite_physiology.png', 'BRILHA'),
  ('SKY', '136', 'sky/specials/136_relocate.png', 'DAN HDR'),
  ('SKY', '150', 'sky/specials/150_new_world_order.png', 'BAAL'),
  ('SKY', '154', 'sky/specials/154_lucille.png', 'BAAL'),
  ('SKY', '155', 'sky/specials/155_sadistic_charm.png', 'BAAL'),
  ('SKY', '167', 'sky/specials/167_triage.png', 'DAN HDR'),
  ('SKY', '174', 'sky/specials/174_dystopian_scavenger.png', 'DAN HDR'),
  ('SKY', '208', 'sky/specials/208_this_is_all_negan_s.png', 'BAAL'),
  ('SKY', '209', 'sky/specials/209_tainted_weapons.png', 'BAAL'),
  ('SKY', '210', 'sky/specials/210_all_out_war.png', 'BAAL'),
  ('SKY', '211', 'sky/specials/211_dwight_s_torn_allegiance.png', 'BAAL'),
  ('SKY', '228', 'sky/specials/228_caught_off_guard.png', 'BAAL'),
  ('SKY', '229', 'sky/specials/229_overrun.png', 'BAAL'),
  ('SKY', '230', 'sky/specials/230_feeding_frenzy.png', 'BAAL'),
  ('SKY', '231', 'sky/specials/231_bitten.png', 'BAAL'),
  ('SKY', '232', 'sky/specials/232_there_s_too_many.png', 'BAAL'),
  ('SKY', '233', 'sky/specials/233_unsafe_getaway.png', 'BAAL')
) AS credit(set_code, collector_number, image_path, artist)
WHERE card.set = credit.set_code
  AND card.set_number = credit.collector_number
  AND card.image_path = credit.image_path
  AND card.artist IS NULL;

UPDATE teamwork_cards AS card
SET artist = credit.artist
FROM (VALUES
  ('ERB', '399', 'erb/teamwork/399_6_energy.png', 'GUARA'),
  ('ERB', '401', 'erb/teamwork/401_7_energy.png', 'BAAL'),
  ('ERB', '402', 'erb/teamwork/402_7_energy.png', 'ABDIAS'),
  ('ERB', '404', 'erb/teamwork/404_8_energy.png', 'BAAL'),
  ('ERB', '414', 'erb/teamwork/414_8_combat.png', 'BAAL'),
  ('ERB', '418', 'erb/teamwork/418_6_brute_force.png', 'ABDIAS'),
  ('ERB', '419', 'erb/teamwork/419_7_brute_force.png', 'BAAL'),
  ('ERB', '422', 'erb/teamwork/422_8_brute_force.png', 'ABDIAS'),
  ('ERB', '431', 'erb/teamwork/431_8_intelligence.png', 'BAAL')
) AS credit(set_code, collector_number, image_path, artist)
WHERE card.set = credit.set_code
  AND card.set_number = credit.collector_number
  AND card.image_path = credit.image_path
  AND card.artist IS NULL;

UPDATE training_cards AS card
SET artist = credit.artist
FROM (VALUES
  ('ERB', '344', 'erb/training/344_training_merlin.png', 'ABDIAS'),
  ('ERB', '346', 'erb/training/346_training_cultists.png', 'BAAL'),
  ('ERB', '348', 'erb/training/348_training_leonidas.png', 'PANSICA')
) AS credit(set_code, collector_number, image_path, artist)
WHERE card.set = credit.set_code
  AND card.set_number = credit.collector_number
  AND card.image_path = credit.image_path
  AND card.artist IS NULL;

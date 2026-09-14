-- Replace ERB World Legends catalog art with the trimmed LRG source set.
-- The audited source map and explicit exceptions live in scripts/erb/lrg-erb-manifest.json.

-- Correct two legacy alternate-art printings that previously reused their base collector numbers.
UPDATE characters
SET set_number = CASE
      WHEN is_foil THEN '504F'
      ELSE '504'
    END,
    set_number_foil = CASE WHEN is_foil THEN NULL ELSE '504F' END,
    rarity = 'Ultra Rare',
    updated_at = NOW()
WHERE set = 'ERB'
  AND image_path = 'characters/alternate/KingArthur-UR_Alt.png'
  AND set_number IN ('118', '118F');

UPDATE characters
SET set_number = CASE
      WHEN is_foil THEN '526F'
      ELSE '526'
    END,
    set_number_foil = CASE WHEN is_foil THEN NULL ELSE '526F' END,
    rarity = 'Rare',
    updated_at = NOW()
WHERE set = 'ERB'
  AND image_path = 'characters/alternate/ThreeMusketeers-Alt.png'
  AND set_number IN ('244', '244F');

WITH art (old_image_path, is_foil, new_image_path) AS (
VALUES
  ('characters/angry_mob_middle_ages.webp', FALSE, 'erb/characters/001_angry_mob_middle_ages.png'),
  ('characters/angry_mob_industrial_age.webp', FALSE, 'erb/characters/008_angry_mob_industrial_age.png'),
  ('characters/angry_mob_modern_age.webp', FALSE, 'erb/characters/011_angry_mob_modern_age.png'),
  ('characters/anubis.webp', FALSE, 'erb/characters/014_anubis.png'),
  ('characters/billy_the_kid.webp', FALSE, 'erb/characters/021_billy_the_kid.png'),
  ('characters/captain_nemo.webp', FALSE, 'erb/characters/028_captain_nemo.png'),
  ('characters/carson_of_venus.webp', FALSE, 'erb/characters/035_carson_of_venus.png'),
  ('characters/carson_of_venus.webp', TRUE, 'erb/characters/035_carson_of_venus.png'),
  ('characters/count_of_monte_cristo.webp', FALSE, 'erb/characters/042_count_of_monte_cristo.png'),
  ('characters/count_of_monte_cristo.webp', TRUE, 'erb/characters/042_count_of_monte_cristo.png'),
  ('characters/cthulhu.webp', FALSE, 'erb/characters/048_cthulhu.png'),
  ('characters/cthulhu.webp', TRUE, 'erb/characters/048_cthulhu.png'),
  ('characters/dejah_thoris.webp', FALSE, 'erb/characters/055_dejah_thoris.png'),
  ('characters/dejah_thoris.webp', TRUE, 'erb/characters/055_dejah_thoris.png'),
  ('characters/dr_watson.webp', FALSE, 'erb/characters/062_dr_watson.png'),
  ('characters/dracula.webp', FALSE, 'erb/characters/069_dracula.png'),
  ('characters/headless_horseman.webp', FALSE, 'erb/characters/076_headless_horseman.png'),
  ('characters/hercules.webp', FALSE, 'erb/characters/083_hercules.png'),
  ('characters/invisible_man.webp', FALSE, 'erb/characters/090_invisible_man.png'),
  ('characters/jane_porter.webp', FALSE, 'erb/characters/097_jane_porter.png'),
  ('characters/jane_porter.webp', TRUE, 'erb/characters/097_jane_porter.png'),
  ('characters/joan_of_arc.webp', FALSE, 'erb/characters/104_joan_of_arc.png'),
  ('characters/john_carter_of_mars.webp', FALSE, 'erb/characters/111_john_carter_of_mars.png'),
  ('characters/john_carter_of_mars.webp', TRUE, 'erb/characters/111_john_carter_of_mars.png'),
  ('characters/king_arthur.webp', FALSE, 'erb/characters/118_king_arthur.png'),
  ('characters/king_arthur.webp', TRUE, 'erb/characters/118_king_arthur.png'),
  ('characters/korak.webp', FALSE, 'erb/characters/125_korak.png'),
  ('characters/korak.webp', TRUE, 'erb/characters/125_korak.png'),
  ('characters/lancelot.webp', FALSE, 'erb/characters/132_lancelot.png'),
  ('characters/leonidas.webp', FALSE, 'erb/characters/139_leonidas.png'),
  ('characters/merlin.webp', FALSE, 'erb/characters/146_merlin.png'),
  ('characters/merlin.webp', TRUE, 'erb/characters/146_merlin.png'),
  ('characters/mina_harker.webp', FALSE, 'erb/characters/153_mina_harker.png'),
  ('characters/mina_harker.webp', TRUE, 'erb/characters/153_mina_harker.png'),
  ('characters/morgan_le_fay.webp', FALSE, 'erb/characters/160_morgan_le_fay.png'),
  ('characters/mr_hyde.webp', FALSE, 'erb/characters/167_mr_hyde.png'),
  ('characters/poseidon.webp', FALSE, 'erb/characters/174_poseidon.png'),
  ('characters/professor_moriarty.webp', FALSE, 'erb/characters/181_professor_moriarty.png'),
  ('characters/professor_moriarty.webp', TRUE, 'erb/characters/181_professor_moriarty.png'),
  ('characters/ra.webp', FALSE, 'erb/characters/188_ra.png'),
  ('characters/robin_hood.webp', FALSE, 'erb/characters/195_robin_hood.png'),
  ('characters/sheriff_of_nottingham.webp', FALSE, 'erb/characters/202_sheriff_of_nottingham.png'),
  ('characters/sherlock_holmes.webp', FALSE, 'erb/characters/209_sherlock_holmes.png'),
  ('characters/sun_wukong.webp', FALSE, 'erb/characters/216_sun_wukong.png'),
  ('characters/sun_wukong.webp', TRUE, 'erb/characters/216_sun_wukong.png'),
  ('characters/tars_tarkas.webp', FALSE, 'erb/characters/223_tars_tarkas.png'),
  ('characters/tars_tarkas.webp', TRUE, 'erb/characters/223_tars_tarkas.png'),
  ('characters/tarzan.webp', FALSE, 'erb/characters/230_tarzan.png'),
  ('characters/tarzan.webp', TRUE, 'erb/characters/230_tarzan.png'),
  ('characters/the_mummy.webp', FALSE, 'erb/characters/237_the_mummy.png'),
  ('characters/the_mummy.webp', TRUE, 'erb/characters/237_the_mummy.png'),
  ('characters/three_musketeers.webp', FALSE, 'erb/characters/244_the_three_musketeers.png'),
  ('characters/three_musketeers.webp', TRUE, 'erb/characters/244_the_three_musketeers.png'),
  ('characters/time_traveler.webp', FALSE, 'erb/characters/251_time_traveler.png'),
  ('characters/time_traveler.webp', TRUE, 'erb/characters/251_time_traveler.png'),
  ('characters/van_helsing.webp', FALSE, 'erb/characters/258_van_helsing.png'),
  ('characters/victory_harben.webp', FALSE, 'erb/characters/265_victory_harben.png'),
  ('characters/victory_harben.webp', TRUE, 'erb/characters/265_victory_harben.png'),
  ('characters/wicked_witch.webp', FALSE, 'erb/characters/272_wicked_witch.png'),
  ('characters/zeus.webp', FALSE, 'erb/characters/279_zeus.png'),
  ('characters/zeus.webp', TRUE, 'erb/characters/279_zeus.png'),
  ('characters/zorro.webp', FALSE, 'erb/characters/285_zorro.png'),
  ('characters/zorro.webp', TRUE, 'erb/characters/285_zorro.png'),
  ('characters/alternate/AngryMobMiddleAge-Alt.png', FALSE, 'erb/characters/482_angry_mob_middle_ages.png'),
  ('characters/alternate/AngryMobMiddleAge-Alt.png', TRUE, 'erb/characters/482_angry_mob_middle_ages.png'),
  ('characters/alternate/AngryMobIndustrialAge-Alt.png', FALSE, 'erb/characters/483_angry_mob_industrial_age.png'),
  ('characters/alternate/AngryMobIndustrialAge-Alt.png', TRUE, 'erb/characters/483_angry_mob_industrial_age.png'),
  ('characters/alternate/AngryMobModernAge-UR_Alt.png', FALSE, 'erb/characters/484_angry_mob_modern_age.png'),
  ('characters/alternate/AngryMobModernAge-UR_Alt.png', TRUE, 'erb/characters/484_angry_mob_modern_age.png'),
  ('characters/alternate/Anubis-Alt.png', FALSE, 'erb/characters/485_anubis.png'),
  ('characters/alternate/Anubis-Alt.png', TRUE, 'erb/characters/485_anubis.png'),
  ('characters/alternate/Billy the Kid-Alt.png', FALSE, 'erb/characters/486_billy_the_kid.png'),
  ('characters/alternate/Billy the Kid-Alt.png', TRUE, 'erb/characters/486_billy_the_kid.png'),
  ('characters/alternate/Carson of Venus-Alt.png', FALSE, 'erb/characters/487_carson_of_venus.png'),
  ('characters/alternate/Carson of Venus-Alt.png', TRUE, 'erb/characters/487_carson_of_venus.png'),
  ('characters/alternate/Count of Monte Critso-Alt.png', FALSE, 'erb/characters/488_count_of_monte_cristo.png'),
  ('characters/alternate/Count of Monte Critso-Alt.png', TRUE, 'erb/characters/488_count_of_monte_cristo.png'),
  ('characters/alternate/Cthulhu-Alt.png', FALSE, 'erb/characters/489_cthulhu.png'),
  ('characters/alternate/Cthulhu-Alt.png', TRUE, 'erb/characters/489_cthulhu.png'),
  ('characters/alternate/Cthulhu-UR_Alt.png', FALSE, 'erb/characters/490_cthulhu.png'),
  ('characters/alternate/Cthulhu-UR_Alt.png', TRUE, 'erb/characters/490_cthulhu.png'),
  ('characters/alternate/Dejah Thoris-Alt.png', FALSE, 'erb/characters/491_dejah_thoris.png'),
  ('characters/alternate/DejahThoris-UR_Alt.png', TRUE, 'erb/characters/491_dejah_thoris.png'),
  ('characters/alternate/DejahThoris-UR_Alt.png', FALSE, 'erb/characters/492_dejah_thoris.png'),
  ('characters/alternate/Dejah Thoris-Alt.png', TRUE, 'erb/characters/492_dejah_thoris.png'),
  ('characters/alternate/DrWatson-UR_Alt.png', FALSE, 'erb/characters/493_dr_watson.png'),
  ('characters/alternate/DrWatson-UR_Alt.png', TRUE, 'erb/characters/493_dr_watson.png'),
  ('characters/alternate/Dracula-Alt.png', FALSE, 'erb/characters/494_dracula.png'),
  ('characters/alternate/Dracula-Alt.png', TRUE, 'erb/characters/494_dracula.png'),
  ('characters/alternate/HeadlessHorseman-UR_Alt.png', FALSE, 'erb/characters/495_headless_horseman.png'),
  ('characters/alternate/HeadlessHorseman-UR_Alt.png', TRUE, 'erb/characters/495_headless_horseman.png'),
  ('characters/alternate/Hercules-Alt_02.png', FALSE, 'erb/characters/496_hercules.png'),
  ('characters/alternate/Hercules-Alt_02.png', TRUE, 'erb/characters/496_hercules.png'),
  ('characters/alternate/Hercules-Alt_01.png', FALSE, 'erb/characters/497_hercules.png'),
  ('characters/alternate/Hercules-Alt_01.png', TRUE, 'erb/characters/497_hercules.png'),
  ('characters/alternate/InvisibleMan-Alt.png', FALSE, 'erb/characters/498_invisible_man.png'),
  ('characters/alternate/InvisibleMan-Alt.png', TRUE, 'erb/characters/498_invisible_man.png'),
  ('characters/alternate/JanePorter-Alt.png', FALSE, 'erb/characters/499_jane_porter.png'),
  ('characters/alternate/JanePorter-Alt.png', TRUE, 'erb/characters/499_jane_porter.png'),
  ('characters/alternate/JanePorter-UR_Alt.png', FALSE, 'erb/characters/500_jane_porter.png'),
  ('characters/alternate/JanePorter-UR_Alt.png', TRUE, 'erb/characters/500_jane_porter.png'),
  ('characters/alternate/JoanofArc-Alt.png', FALSE, 'erb/characters/501_joan_of_arc.png'),
  ('characters/alternate/JoanofArc-Alt.png', TRUE, 'erb/characters/501_joan_of_arc.png'),
  ('characters/alternate/JohnCarterofMars-Alt.png', FALSE, 'erb/characters/502_john_carter_of_mars.png'),
  ('characters/alternate/JohnCarterofMars-Alt.png', TRUE, 'erb/characters/502_john_carter_of_mars.png'),
  ('characters/alternate/KingArthur-Alt.png', FALSE, 'erb/characters/503_king_arthur.png'),
  ('characters/alternate/KingArthur-Alt.png', TRUE, 'erb/characters/503_king_arthur.png'),
  ('characters/alternate/KingArthur-UR_Alt.png', FALSE, 'erb/characters/504_king_arthur.png'),
  ('characters/alternate/KingArthur-UR_Alt.png', TRUE, 'erb/characters/504_king_arthur.png'),
  ('characters/alternate/Korak-Alt_01.png', FALSE, 'erb/characters/505_korak.png'),
  ('characters/alternate/Korak-Alt_01.png', TRUE, 'erb/characters/505_korak.png'),
  ('characters/alternate/Korak-Alt_02.png', FALSE, 'erb/characters/506_korak.png'),
  ('characters/alternate/Korak-Alt_02.png', TRUE, 'erb/characters/506_korak.png'),
  ('characters/alternate/Lancelot-UR_Alt.png', FALSE, 'erb/characters/507_lancelot.png'),
  ('characters/alternate/Lancelot-UR_Alt.png', TRUE, 'erb/characters/507_lancelot.png'),
  ('characters/alternate/Leonidas-Alt.png', FALSE, 'erb/characters/508_leonidas.png'),
  ('characters/alternate/Leonidas-Alt.png', TRUE, 'erb/characters/508_leonidas.png'),
  ('characters/alternate/MinaHarker-Alt.png', FALSE, 'erb/characters/509_mina_harker.png'),
  ('characters/alternate/MinaHarker-Alt.png', TRUE, 'erb/characters/509_mina_harker.png'),
  ('characters/alternate/MinaHarker-UR_Alt.png', FALSE, 'erb/characters/510_mina_harker.png'),
  ('characters/alternate/MinaHarker-UR_Alt.png', TRUE, 'erb/characters/510_mina_harker.png'),
  ('characters/alternate/MorganleFay-Alt_01.png', FALSE, 'erb/characters/511_morgan_le_fay.png'),
  ('characters/alternate/MorganleFay-Alt_01.png', TRUE, 'erb/characters/511_morgan_le_fay.png'),
  ('characters/alternate/MorganleFay-Alt_02.png', FALSE, 'erb/characters/512_morgan_le_fay.png'),
  ('characters/alternate/MorganleFay-Alt_02.png', TRUE, 'erb/characters/512_morgan_le_fay.png'),
  ('characters/alternate/MrHyde-UR_Alt.png', FALSE, 'erb/characters/513_mr_hyde.png'),
  ('characters/alternate/MrHyde-UR_Alt.png', TRUE, 'erb/characters/513_mr_hyde.png'),
  ('characters/alternate/Poseidon-UR_Alt.png', FALSE, 'erb/characters/514_poseidon.png'),
  ('characters/alternate/Poseidon-UR_Alt.png', TRUE, 'erb/characters/514_poseidon.png'),
  ('characters/alternate/ProfessorMoriarty-Alt.png', FALSE, 'erb/characters/515_professor_moriarty.png'),
  ('characters/alternate/ProfessorMoriarty-Alt.png', TRUE, 'erb/characters/515_professor_moriarty.png'),
  ('characters/alternate/ra.webp', FALSE, 'erb/characters/516_ra.png'),
  ('characters/alternate/ra.webp', TRUE, 'erb/characters/516_ra.png'),
  ('characters/alternate/RobinHood-Alt.png', FALSE, 'erb/characters/517_robin_hood.png'),
  ('characters/alternate/RobinHood-Alt.png', TRUE, 'erb/characters/517_robin_hood.png'),
  ('characters/alternate/RobinHood-PrizePack_Alt.png', TRUE, 'erb/characters/517_robin_hood.png'),
  ('characters/alternate/SheriffofNottingham-Alt.png', FALSE, 'erb/characters/518_sheriff_of_nottingham.png'),
  ('characters/alternate/SheriffofNottingham-Alt.png', TRUE, 'erb/characters/518_sheriff_of_nottingham.png'),
  ('characters/alternate/SherlockHolmes-Alt.png', FALSE, 'erb/characters/519_sherlock_holmes.png'),
  ('characters/alternate/SherlockHolmes-Alt.png', TRUE, 'erb/characters/519_sherlock_holmes.png'),
  ('characters/alternate/SunWukong-UR_Alt.png', FALSE, 'erb/characters/520_sun_wukong.png'),
  ('characters/alternate/SunWukong-UR_Alt.png', TRUE, 'erb/characters/520_sun_wukong.png'),
  ('characters/alternate/TarsTarkas-Alt.png', FALSE, 'erb/characters/521_tars_tarkas.png'),
  ('characters/alternate/TarsTarkas-Alt.png', TRUE, 'erb/characters/521_tars_tarkas.png'),
  ('characters/alternate/Tarzan-Alt_01.png', FALSE, 'erb/characters/522_tarzan.png'),
  ('characters/alternate/Tarzan-Alt_01.png', TRUE, 'erb/characters/522_tarzan.png'),
  ('characters/alternate/Merlin-Alt.png', FALSE, 'erb/characters/523_merlin.png'),
  ('characters/alternate/Merlin-Alt.png', TRUE, 'erb/characters/523_merlin.png'),
  ('characters/alternate/Tarzan-Alt_02.png', FALSE, 'erb/characters/524_tarzan.png'),
  ('characters/alternate/Tarzan-Alt_02.png', TRUE, 'erb/characters/524_tarzan.png'),
  ('characters/alternate/Mummy-Alt.png', FALSE, 'erb/characters/525_the_mummy.png'),
  ('characters/alternate/Mummy-Alt.png', TRUE, 'erb/characters/525_the_mummy.png'),
  ('characters/alternate/ThreeMusketeers-Alt.png', FALSE, 'erb/characters/526_the_three_musketeers.png'),
  ('characters/alternate/ThreeMusketeers-Alt.png', TRUE, 'erb/characters/526_the_three_musketeers.png'),
  ('characters/alternate/TimeTraveler-Alt_01.png', FALSE, 'erb/characters/527_time_traveler.png'),
  ('characters/alternate/TimeTraveler-Alt_01.png', TRUE, 'erb/characters/527_time_traveler.png'),
  ('characters/alternate/TimeTraveler-Alt_02.png', FALSE, 'erb/characters/528_time_traveler.png'),
  ('characters/alternate/TimeTraveler-Alt_02.png', TRUE, 'erb/characters/528_time_traveler.png'),
  ('characters/alternate/VanHelsing-Alt.png', FALSE, 'erb/characters/529_van_helsing.png'),
  ('characters/alternate/VanHelsing-Alt.png', TRUE, 'erb/characters/529_van_helsing.png'),
  ('characters/alternate/VictoryHarben-Alt_01.png', FALSE, 'erb/characters/530_victory_harben.png'),
  ('characters/alternate/VictoryHarben-Alt_01.png', TRUE, 'erb/characters/530_victory_harben.png'),
  ('characters/alternate/VictoryHarben-Alt_02.png', FALSE, 'erb/characters/531_victory_harben.png'),
  ('characters/alternate/VictoryHarben-Alt_02.png', TRUE, 'erb/characters/531_victory_harben.png'),
  ('characters/alternate/WickedWitch-Alt.png', FALSE, 'erb/characters/532_wicked_witch.png'),
  ('characters/alternate/Zeus-UR_Alt.png', FALSE, 'erb/characters/533_zeus.png'),
  ('characters/alternate/Zeus-UR_Alt.png', TRUE, 'erb/characters/533_zeus.png'),
  ('characters/alternate/Zorro-UR_Alt.png', FALSE, 'erb/characters/534_zorro.png'),
  ('characters/alternate/Zorro-UR_Alt.png', TRUE, 'erb/characters/534_zorro.png'),
  ('characters/alternate/Zorro-Alt.png', FALSE, 'erb/characters/535_zorro.png'),
  ('characters/alternate/Zorro-Alt.png', TRUE, 'erb/characters/535_zorro.png')
)
UPDATE characters target
SET image_path = art.new_image_path,
    updated_at = NOW()
FROM art
WHERE target.set = 'ERB'
  AND target.image_path = art.old_image_path
  AND target.is_foil = art.is_foil;

WITH art (old_image_path, is_foil, new_image_path) AS (
VALUES
  ('specials/dont_let_it_get_away.webp', FALSE, 'erb/specials/002_don_t_let_it_get_away.png'),
  ('specials/mob_mentality.webp', FALSE, 'erb/specials/003_mob_mentality.png'),
  ('specials/strength_in_numbers.webp', FALSE, 'erb/specials/004_strength_in_numbers.png'),
  ('specials/swarm_them.webp', FALSE, 'erb/specials/005_swarm_them.png'),
  ('specials/pitchforks_and_torches.webp', FALSE, 'erb/specials/006_pitchforks_and_torches.png'),
  ('specials/regent_of_the_crown.webp', FALSE, 'erb/specials/007_regent_of_the_crown.png'),
  ('specials/disrupt_supply_lines.webp', FALSE, 'erb/specials/009_disrupting_supply_lines.png'),
  ('specials/union_power.webp', FALSE, 'erb/specials/010_union_power.png'),
  ('specials/online_cyber_attack.webp', FALSE, 'erb/specials/012_online_cyber_attack.png'),
  ('specials/ransom_your_secrets.webp', FALSE, 'erb/specials/013_ransom_your_secrets.png'),
  ('specials/book_of_the_dead.webp', FALSE, 'erb/specials/015_book_of_the_dead.png'),
  ('specials/lord_of_the_sacred_land.webp', FALSE, 'erb/specials/016_lord_of_the_sacred_land.png'),
  ('specials/shepherd_of_the_damned.webp', FALSE, 'erb/specials/017_shepherd_of_the_damned.png'),
  ('specials/syphon_strike.webp', FALSE, 'erb/specials/018_siphon_strike.png'),
  ('specials/_weighing_ofthe_heart.webp', FALSE, 'erb/specials/019_weighing_of_the_heart.png'),
  ('specials/wither.webp', FALSE, 'erb/specials/020_wither.png'),
  ('specials/head_for_mexico.webp', FALSE, 'erb/specials/022_head_for_mexico.png'),
  ('specials/ill_make_you_famous.webp', FALSE, 'erb/specials/023_i_ll_make_you_famous.png'),
  ('specials/pals.webp', FALSE, 'erb/specials/024_pals.png'),
  ('specials/quick_draw.webp', FALSE, 'erb/specials/025_quick_draw.png'),
  ('specials/reap_the_whirlwind.webp', FALSE, 'erb/specials/026_reap_the_whirlwind.png'),
  ('specials/regulators.webp', FALSE, 'erb/specials/027_regulators.png'),
  ('specials/ethnologist.webp', FALSE, 'erb/specials/029_ethnologist.png'),
  ('specials/never_set_foot_on_dry_land.webp', FALSE, 'erb/specials/030_never_set_foot_on_dry_land.png'),
  ('specials/silent_running.webp', FALSE, 'erb/specials/031_silent_running.png'),
  ('specials/ruthless_plunderer.webp', FALSE, 'erb/specials/032_ruthless_plunderer.png'),
  ('specials/the_nautilus.webp', FALSE, 'erb/specials/033_the_nautilus.png'),
  ('specials/weapons_of_wrath_and_hatred.webp', FALSE, 'erb/specials/034_weapons_of_wrath_and_hatred.png'),
  ('specials/janjong_duare_mintep.webp', FALSE, 'erb/specials/036_janjong_duare_mintep.png'),
  ('specials/janjong_duare_mintep.webp', TRUE, 'erb/specials/036_janjong_duare_mintep.png'),
  ('specials/on_a_razors_edge.webp', FALSE, 'erb/specials/037_on_the_razor_s_edge.png'),
  ('specials/on_a_razors_edge.webp', TRUE, 'erb/specials/037_on_the_razor_s_edge.png'),
  ('specials/telepathic_resistance.webp', FALSE, 'erb/specials/038_telepathic_resistance.png'),
  ('specials/telepathic_resistance.webp', TRUE, 'erb/specials/038_telepathic_resistance.png'),
  ('specials/sometimes_piracy_is_the_best_option.webp', FALSE, 'erb/specials/039_sometimes_piracy_is_the_best_option.png'),
  ('specials/sometimes_piracy_is_the_best_option.webp', TRUE, 'erb/specials/039_sometimes_piracy_is_the_best_option.png'),
  ('specials/tray_guns.webp', FALSE, 'erb/specials/040_t_ray_gun.png'),
  ('specials/tray_guns.webp', TRUE, 'erb/specials/040_t_ray_gun.png'),
  ('specials/telepathic_training.webp', FALSE, 'erb/specials/041_telepathic_training.png'),
  ('specials/friend_or_foe.webp', FALSE, 'erb/specials/043_friend_to_foe.png'),
  ('specials/friend_or_foe.webp', TRUE, 'erb/specials/043_friend_to_foe.png'),
  ('specials/jacopo.webp', FALSE, 'erb/specials/044_jacopo.png'),
  ('specials/jacopo.webp', TRUE, 'erb/specials/044_jacopo.png'),
  ('specials/network_of_theives.webp', FALSE, 'erb/specials/045_network_of_thieves.png'),
  ('specials/network_of_theives.webp', TRUE, 'erb/specials/045_network_of_thieves.png'),
  ('specials/suprise_swordsman.webp', FALSE, 'erb/specials/046_surprise_swordsman.png'),
  ('specials/suprise_swordsman.webp', TRUE, 'erb/specials/046_surprise_swordsman.png'),
  ('specials/unlimited_resources.webp', FALSE, 'erb/specials/047_unlimited_resources.png'),
  ('specials/unlimited_resources.webp', TRUE, 'erb/specials/047_unlimited_resources.png'),
  ('specials/ancient_one.webp', FALSE, 'erb/specials/049_ancient_one.png'),
  ('specials/ancient_one.webp', TRUE, 'erb/specials/049_ancient_one.png'),
  ('specials/devoted_follower.webp', FALSE, 'erb/specials/050_devoted_follower.png'),
  ('specials/devoted_follower.webp', TRUE, 'erb/specials/050_devoted_follower.png'),
  ('specials/distracting_intervention.webp', FALSE, 'erb/specials/051_distracting_intervention.png'),
  ('specials/distracting_intervention.webp', TRUE, 'erb/specials/051_distracting_intervention.png'),
  ('specials/network_of_fanatics.webp', FALSE, 'erb/specials/052_network_of_fanatics.png'),
  ('specials/network_of_fanatics.webp', TRUE, 'erb/specials/052_network_of_fanatics.png'),
  ('specials/call_of_cthulhu.webp', FALSE, 'erb/specials/053_the_call_of_cthulhu.png'),
  ('specials/call_of_cthulhu.webp', TRUE, 'erb/specials/053_the_call_of_cthulhu.png'),
  ('specials/the_sleeper_awakens.webp', FALSE, 'erb/specials/054_the_sleeper_awakens.png'),
  ('specials/warrior_of_helium.webp', FALSE, 'erb/specials/056_warrior_of_helium.png'),
  ('specials/warrior_of_helium.webp', TRUE, 'erb/specials/056_warrior_of_helium.png'),
  ('specials/diplomat_to_all_martians.webp', FALSE, 'erb/specials/057_diplomat_to_all_martians.png'),
  ('specials/diplomat_to_all_martians.webp', TRUE, 'erb/specials/057_diplomat_to_all_martians.png'),
  ('specials/fortune_of_helium.webp', FALSE, 'erb/specials/058_fortune_of_helium.png'),
  ('specials/head_of_martian_science.webp', FALSE, 'erb/specials/059_head_of_martian_science.png'),
  ('specials/head_of_martian_science.webp', TRUE, 'erb/specials/059_head_of_martian_science.png'),
  ('specials/protector_of_barsoom.webp', FALSE, 'erb/specials/060_protector_of_barsoom.png'),
  ('specials/protector_of_barsoom.webp', TRUE, 'erb/specials/060_protector_of_barsoom.png'),
  ('specials/champions_of_barsoom.webp', FALSE, 'erb/specials/061_champions_of_barsoom.png'),
  ('specials/champions_of_barsoom.webp', TRUE, 'erb/specials/061_champions_of_barsoom.png'),
  ('specials/all_chips_on_the_table.webp', FALSE, 'erb/specials/063_all_chips_on_the_table.png'),
  ('specials/blackheath_rugby_star.webp', FALSE, 'erb/specials/064_blackheath_rugby_star.png'),
  ('specials/british_army_surgeon.webp', FALSE, 'erb/specials/065_british_army_surgeon.png'),
  ('specials/english_gentleman.webp', FALSE, 'erb/specials/066_english_gentleman.png'),
  ('specials/not_a_bad_detective.webp', FALSE, 'erb/specials/067_not_a_bad_detective.png'),
  ('specials/always_there_for_a_friend.webp', FALSE, 'erb/specials/068_always_there_for_a_friend.png'),
  ('specials/crimson_restoration.webp', FALSE, 'erb/specials/070_crimson_restoration.png'),
  ('specials/veil_of_deceit.webp', FALSE, 'erb/specials/071_veil_of_deceit.png'),
  ('specials/lord_of_the_vampires.webp', FALSE, 'erb/specials/072_lord_of_the_vampires.png'),
  ('specials/paralyzing_gaze.webp', FALSE, 'erb/specials/073_paralyzing_gaze.png'),
  ('specials/to_the_last_man.webp', FALSE, 'erb/specials/074_to_the_last_man.png'),
  ('specials/undead_flesh.webp', FALSE, 'erb/specials/075_undead_flesh.png'),
  ('specials/decapitate.webp', FALSE, 'erb/specials/077_decapitate.png'),
  ('specials/human_spine_whip.webp', FALSE, 'erb/specials/078_human_spine_whip.png'),
  ('specials/mark_of_the_headless.webp', FALSE, 'erb/specials/079_mark_of_the_headless.png'),
  ('specials/pumpkin_head.webp', FALSE, 'erb/specials/080_pumpkin_head.png'),
  ('specials/relentless_hessian.webp', FALSE, 'erb/specials/081_relentless_hessian.png'),
  ('specials/vissage_of_terror.webp', FALSE, 'erb/specials/082_visage_of_terror.png'),
  ('specials/sowing_chaos.webp', FALSE, 'erb/specials/084_sowing_chaos.png'),
  ('specials/great_club.webp', FALSE, 'erb/specials/085_great_club.png'),
  ('specials/lion_skin_cloak.webp', FALSE, 'erb/specials/086_lion_skin_cloak.png'),
  ('specials/godly_prowess.webp', FALSE, 'erb/specials/087_godly_prowess.png'),
  ('specials/protector_of_mankind.webp', FALSE, 'erb/specials/088_protector_of_mankind.png'),
  ('specials/slaying_the_hydra.webp', FALSE, 'erb/specials/089_slaying_the_hydra.png'),
  ('specials/didnt_see_it_coming.webp', FALSE, 'erb/specials/091_didn_t_see_it_coming.png'),
  ('specials/hidden_sociopath.webp', FALSE, 'erb/specials/092_hidden_sociopath.png'),
  ('specials/im_in_your_house.webp', FALSE, 'erb/specials/093_i_m_in_your_house.png'),
  ('specials/ive_murderd_before.webp', FALSE, 'erb/specials/094_i_ve_murdered_before.png'),
  ('specials/one_at_a_time.webp', FALSE, 'erb/specials/095_one_at_a_time.png'),
  ('specials/run_and_hide.webp', FALSE, 'erb/specials/096_run_and_hide.png'),
  ('specials/archimedes_q_porter.webp', FALSE, 'erb/specials/098_archimedes_q_porter.png'),
  ('specials/archimedes_q_porter.webp', TRUE, 'erb/specials/098_archimedes_q_porter.png'),
  ('specials/ethnoarchiology.webp', FALSE, 'erb/specials/099_ethnoarchaeology.png'),
  ('specials/tenacious_persuit.webp', FALSE, 'erb/specials/100_tenacious_pursuit.png'),
  ('specials/tenacious_persuit.webp', TRUE, 'erb/specials/100_tenacious_pursuit.png'),
  ('specials/lady_of_the_jungle.webp', FALSE, 'erb/specials/101_lady_of_the_jungle.png'),
  ('specials/lady_of_the_jungle.webp', TRUE, 'erb/specials/101_lady_of_the_jungle.png'),
  ('specials/not_without_my_friends.webp', FALSE, 'erb/specials/102_not_without_my_friends.png'),
  ('specials/not_without_my_friends.webp', TRUE, 'erb/specials/102_not_without_my_friends.png'),
  ('specials/not_a_damsel_in_distress.webp', FALSE, 'erb/specials/103_not_a_damsel_in_distress.png'),
  ('specials/not_a_damsel_in_distress.webp', TRUE, 'erb/specials/103_not_a_damsel_in_distress.png'),
  ('specials/angelic_visions.webp', FALSE, 'erb/specials/105_angelic_visions.png'),
  ('specials/burned_at_the_stake.webp', FALSE, 'erb/specials/106_burned_at_the_stake.png'),
  ('specials/early_feminist_leader.webp', FALSE, 'erb/specials/107_early_feminist_leader.png'),
  ('specials/inspirational_leadership.webp', FALSE, 'erb/specials/108_inspirational_leadership.png'),
  ('specials/patron_saint_of_france.webp', FALSE, 'erb/specials/109_patron_saint_of_france.png'),
  ('specials/protection_of_saint_michael.webp', FALSE, 'erb/specials/110_protection_of_saint_michael.png'),
  ('specials/dotar_sojat.webp', FALSE, 'erb/specials/112_dotar_sojat.png'),
  ('specials/dotar_sojat.webp', TRUE, 'erb/specials/112_dotar_sojat.png'),
  ('specials/immortality.webp', FALSE, 'erb/specials/113_immortality.png'),
  ('specials/leap_into_the_fray.webp', FALSE, 'erb/specials/114_leap_into_the_fray.png'),
  ('specials/leap_into_the_fray.webp', TRUE, 'erb/specials/114_leap_into_the_fray.png'),
  ('specials/lower_gravity.webp', FALSE, 'erb/specials/115_lower_gravity.png'),
  ('specials/lower_gravity.webp', TRUE, 'erb/specials/115_lower_gravity.png'),
  ('specials/superhuman_endurance.webp', FALSE, 'erb/specials/116_superhuman_endurance.png'),
  ('specials/superhuman_endurance.webp', TRUE, 'erb/specials/116_superhuman_endurance.png'),
  ('specials/virginia_fighting_man.webp', FALSE, 'erb/specials/117_virginia_fighting_man.png'),
  ('specials/virginia_fighting_man.webp', TRUE, 'erb/specials/117_virginia_fighting_man.png'),
  ('specials/excalibur.webp', FALSE, 'erb/specials/119_excalibur.png'),
  ('specials/excalibur.webp', TRUE, 'erb/specials/119_excalibur.png'),
  ('specials/king_of_camelot.webp', FALSE, 'erb/specials/120_king_of_camelot.png'),
  ('specials/king_of_camelot.webp', TRUE, 'erb/specials/120_king_of_camelot.png'),
  ('specials/knights_of_the_round_table.webp', FALSE, 'erb/specials/121_knights_of_the_round_table.png'),
  ('specials/knights_of_the_round_table.webp', TRUE, 'erb/specials/121_knights_of_the_round_table.png'),
  ('specials/legendary_partnership.webp', FALSE, 'erb/specials/122_legendary_partnership.png'),
  ('specials/heavy_is_the_head.webp', FALSE, 'erb/specials/123_heavy_is_the_head.png'),
  ('specials/heavy_is_the_head.webp', TRUE, 'erb/specials/123_heavy_is_the_head.png'),
  ('specials/lead_from_the_front.webp', FALSE, 'erb/specials/124_lead_from_the_front.png'),
  ('specials/john_clayton_lll.webp', FALSE, 'erb/specials/126_john_clayton_iii.png'),
  ('specials/john_clayton_lll.webp', TRUE, 'erb/specials/126_john_clayton_iii.png'),
  ('specials/jungle_survival_en_108.webp', FALSE, 'erb/specials/127_jungle_survival.png'),
  ('specials/jungle_survival_en_108.webp', TRUE, 'erb/specials/127_jungle_survival.png'),
  ('specials/like_father_like_son.webp', FALSE, 'erb/specials/128_like_father_like_son.png'),
  ('specials/meriem_and_jackie_clayton.webp', FALSE, 'erb/specials/129_meriem_and_jackie_clayton.png'),
  ('specials/meriem_and_jackie_clayton.webp', TRUE, 'erb/specials/129_meriem_and_jackie_clayton.png'),
  ('specials/son_of_the_jungle.webp', FALSE, 'erb/specials/130_son_of_the_jungle.png'),
  ('specials/son_of_the_jungle.webp', TRUE, 'erb/specials/130_son_of_the_jungle.png'),
  ('specials/to_the_death.webp', FALSE, 'erb/specials/131_to_the_death.png'),
  ('specials/chivalrous_protector.webp', FALSE, 'erb/specials/133_chivalrous_protector.png'),
  ('specials/for_guineveres_love.webp', FALSE, 'erb/specials/134_for_guinevere_s_love.png'),
  ('specials/for_the_queen.webp', FALSE, 'erb/specials/135_for_the_queen.png'),
  ('specials/knight_of_the_round_table.webp', FALSE, 'erb/specials/136_knight_of_the_round_table.png'),
  ('specials/sword_and_shield.webp', FALSE, 'erb/specials/137_sword_and_shield.png'),
  ('specials/true_strike.webp', FALSE, 'erb/specials/138_true_strike.png'),
  ('specials/300.webp', FALSE, 'erb/specials/140_300.png'),
  ('specials/baptized_in_combat.webp', FALSE, 'erb/specials/141_baptized_in_combat.png'),
  ('specials/for_sparta.webp', FALSE, 'erb/specials/142_for_sparta.png'),
  ('specials/give_them_nothing.webp', FALSE, 'erb/specials/143_give_them_nothing.png'),
  ('specials/greatest_soldiers_in_history.webp', FALSE, 'erb/specials/144_greatest_soldiers_in_history.png'),
  ('specials/shield_phalanx.webp', FALSE, 'erb/specials/145_shield_phalanx.png'),
  ('specials/archimedes.webp', FALSE, 'erb/specials/147_archimedes.png'),
  ('specials/archimedes.webp', TRUE, 'erb/specials/147_archimedes.png'),
  ('specials/ascendant_mage.webp', FALSE, 'erb/specials/148_ascendant_mage.png'),
  ('specials/ascendant_mage.webp', TRUE, 'erb/specials/148_ascendant_mage.png'),
  ('specials/for_camelot.webp', FALSE, 'erb/specials/149_for_camelot.png'),
  ('specials/for_camelot.webp', TRUE, 'erb/specials/149_for_camelot.png'),
  ('specials/fortell_the_future.webp', FALSE, 'erb/specials/150_foretell_the_future.png'),
  ('specials/fortell_the_future.webp', TRUE, 'erb/specials/150_foretell_the_future.png'),
  ('specials/transmogrification.webp', FALSE, 'erb/specials/151_transmogrification.png'),
  ('specials/summon_the_elements.webp', FALSE, 'erb/specials/152_summon_the_elements.png'),
  ('specials/summon_the_elements.webp', TRUE, 'erb/specials/152_summon_the_elements.png'),
  ('specials/dracluas_telepathic_connection.webp', FALSE, 'erb/specials/154_dracula_s_telepathic_connection.png'),
  ('specials/dracluas_telepathic_connection.webp', TRUE, 'erb/specials/154_dracula_s_telepathic_connection.png'),
  ('specials/john_harker_solicitor.webp', FALSE, 'erb/specials/155_jonathan_harker_solicitor.png'),
  ('specials/john_harker_solicitor.webp', TRUE, 'erb/specials/155_jonathan_harker_solicitor.png'),
  ('specials/nocturnal_hunter.webp', FALSE, 'erb/specials/156_nocturnal_hunter.png'),
  ('specials/nocturnal_hunter.webp', TRUE, 'erb/specials/156_nocturnal_hunter.png'),
  ('specials/the_hunger.webp', FALSE, 'erb/specials/157_the_hunger.png'),
  ('specials/tracking_movements.webp', FALSE, 'erb/specials/158_tracking_movements.png'),
  ('specials/tracking_movements.webp', TRUE, 'erb/specials/158_tracking_movements.png'),
  ('specials/vampiric_celerity.webp', FALSE, 'erb/specials/159_vampiric_celerity.png'),
  ('specials/vampiric_celerity.webp', TRUE, 'erb/specials/159_vampiric_celerity.png'),
  ('specials/apprentice_of_merlin.webp', FALSE, 'erb/specials/161_apprentice_of_merlin.png'),
  ('specials/avalons_warmth.webp', FALSE, 'erb/specials/162_avalon_s_warmth.png'),
  ('specials/duality.webp', FALSE, 'erb/specials/163_duality.png'),
  ('specials/enchantress_guile.webp', FALSE, 'erb/specials/164_enchantress_guile.png'),
  ('specials/shapeshifters_guise.webp', FALSE, 'erb/specials/165_shapeshifter_s_guise.png'),
  ('specials/teleportation_circle.webp', FALSE, 'erb/specials/166_teleportation_circle.png'),
  ('specials/overdose.webp', FALSE, 'erb/specials/168_overdose.png'),
  ('specials/sadistic_tendencies.webp', FALSE, 'erb/specials/169_sadistic_tendencies.png'),
  ('specials/set_loose.webp', FALSE, 'erb/specials/170_set_loose.png'),
  ('specials/the_serum.webp', FALSE, 'erb/specials/171_the_serum.png'),
  ('specials/trample.webp', FALSE, 'erb/specials/172_trample.png'),
  ('specials/victorian_sophisticant.webp', FALSE, 'erb/specials/173_victorian_sophisticant.png'),
  ('specials/reclaim_the_water.webp', FALSE, 'erb/specials/175_reclaim_the_waters.png'),
  ('specials/form_of_water.webp', FALSE, 'erb/specials/176_form_of_water.png'),
  ('specials/poseidons_might.webp', FALSE, 'erb/specials/177_poseidon_s_might.png'),
  ('specials/rising_tides.webp', FALSE, 'erb/specials/178_rising_tides.png'),
  ('specials/trident.webp', FALSE, 'erb/specials/179_trident.png'),
  ('specials/tsunami.webp', FALSE, 'erb/specials/180_tsunami.png'),
  ('specials/complex_criminal_scheme.webp', FALSE, 'erb/specials/182_complex_criminal_scheme.png'),
  ('specials/complex_criminal_scheme.webp', TRUE, 'erb/specials/182_complex_criminal_scheme.png'),
  ('specials/criminal_mastermind.webp', FALSE, 'erb/specials/183_criminal_mastermind.png'),
  ('specials/future_plans.webp', FALSE, 'erb/specials/184_future_plans.png'),
  ('specials/future_plans.webp', TRUE, 'erb/specials/184_future_plans.png'),
  ('specials/mathematical_genius.webp', FALSE, 'erb/specials/185_mathematical_genius.png'),
  ('specials/mathematical_genius.webp', TRUE, 'erb/specials/185_mathematical_genius.png'),
  ('specials/napoleon_of_crime.webp', FALSE, 'erb/specials/186_napoleon_of_crime.png'),
  ('specials/napoleon_of_crime.webp', TRUE, 'erb/specials/186_napoleon_of_crime.png'),
  ('specials/tactical_fighter.webp', FALSE, 'erb/specials/187_tactical_fighter.png'),
  ('specials/tactical_fighter.webp', TRUE, 'erb/specials/187_tactical_fighter.png'),
  ('specials/clut_of_mnevis_bull.webp', FALSE, 'erb/specials/189_cult_of_menevis_bull.png'),
  ('specials/eye_of_sekhmet.webp', FALSE, 'erb/specials/190_eye_of_sekhmet.png'),
  ('specials/healing_waters_of_the_nile.webp', FALSE, 'erb/specials/191_healing_waters_of_the_nile.png'),
  ('specials/band_of_merry_men.webp', FALSE, 'erb/specials/196_band_of_merry_men.png'),
  ('specials/defender_of_the_people.webp', FALSE, 'erb/specials/197_defender_of_the_people.png'),
  ('specials/hero_of_nottingham.webp', FALSE, 'erb/specials/198_hero_of_nottingham.png'),
  ('specials/master_archer.webp', FALSE, 'erb/specials/199_master_archer.png'),
  ('specials/master_theif.webp', FALSE, 'erb/specials/200_master_thief.png'),
  ('specials/steal_from_the_rich.webp', FALSE, 'erb/specials/201_steal_from_the_rich.png'),
  ('specials/flaming_arrows.webp', FALSE, 'erb/specials/203_flaming_arrows.png'),
  ('specials/i_command_an_army.webp', FALSE, 'erb/specials/204_i_command_an_army.png'),
  ('specials/rule_by_fear.webp', FALSE, 'erb/specials/206_rule_by_fear.png'),
  ('specials/squeeze_the_commoners.webp', FALSE, 'erb/specials/207_squeeze_the_commoners.png'),
  ('specials/taxes.webp', FALSE, 'erb/specials/208_taxes.png'),
  ('specials/battle_of_wits.webp', FALSE, 'erb/specials/210_battle_of_wits.png'),
  ('specials/brilliant_deduction.webp', FALSE, 'erb/specials/211_brilliant_deduction.png'),
  ('specials/irene_adler.webp', FALSE, 'erb/specials/212_irene_adler.png'),
  ('specials/logical_reasoning.webp', FALSE, 'erb/specials/213_logical_reasoning.png'),
  ('specials/probability_evaluation.webp', FALSE, 'erb/specials/214_probability_evaluation.png'),
  ('specials/unpredictable_mind.webp', FALSE, 'erb/specials/215_unpredictable_mind.png'),
  ('specials/cloud_surfing.webp', FALSE, 'erb/specials/217_cloud_surfing.png'),
  ('specials/cloud_surfing.webp', TRUE, 'erb/specials/217_cloud_surfing.png'),
  ('specials/godly_strength.webp', FALSE, 'erb/specials/218_godly_strength.png'),
  ('specials/godly_strength.webp', TRUE, 'erb/specials/218_godly_strength.png'),
  ('specials/grasp_of_the_five_elements.webp', FALSE, 'erb/specials/219_grasp_of_the_five_elements.png'),
  ('specials/staff_of_the_monkey_king.webp', FALSE, 'erb/specials/220_staff_of_the_monkey_king.png'),
  ('specials/staff_of_the_monkey_king.webp', TRUE, 'erb/specials/220_staff_of_the_monkey_king.png'),
  ('specials/stone_skin.webp', FALSE, 'erb/specials/221_stone_skin.png'),
  ('specials/stone_skin.webp', TRUE, 'erb/specials/221_stone_skin.png'),
  ('specials/transformation_trickery.webp', FALSE, 'erb/specials/222_transformation_trickery.png'),
  ('specials/transformation_trickery.webp', TRUE, 'erb/specials/222_transformation_trickery.png'),
  ('specials/avenging_my_love.webp', FALSE, 'erb/specials/224_avenging_my_love.png'),
  ('specials/barsoomian_warrior_and_statesman.webp', FALSE, 'erb/specials/225_barsoomian_warrior_and_statesman.png'),
  ('specials/barsoomian_warrior_and_statesman.webp', TRUE, 'erb/specials/225_barsoomian_warrior_and_statesman.png'),
  ('specials/four_armed_warrior.webp', FALSE, 'erb/specials/226_four_armed_warrior.png'),
  ('specials/four_armed_warrior.webp', TRUE, 'erb/specials/226_four_armed_warrior.png'),
  ('specials/jeddak_of_thark.webp', FALSE, 'erb/specials/227_jeddak_of_thark.png'),
  ('specials/jeddak_of_thark.webp', TRUE, 'erb/specials/227_jeddak_of_thark.png'),
  ('specials/protector_of_the_incubator.webp', FALSE, 'erb/specials/228_protector_of_the_incubator.png'),
  ('specials/protector_of_the_incubator.webp', TRUE, 'erb/specials/228_protector_of_the_incubator.png'),
  ('specials/sola.webp', FALSE, 'erb/specials/229_sola.png'),
  ('specials/sola.webp', TRUE, 'erb/specials/229_sola.png'),
  ('specials/emotional_senses.webp', FALSE, 'erb/specials/231_emotional_senses.png'),
  ('specials/emotional_senses.webp', TRUE, 'erb/specials/231_emotional_senses.png'),
  ('specials/jungle_tactics.webp', FALSE, 'erb/specials/232_jungle_tactics.png'),
  ('specials/jungle_tactics.webp', TRUE, 'erb/specials/232_jungle_tactics.png'),
  ('specials/lord_of_the_jungle.webp', FALSE, 'erb/specials/233_lord_of_the_jungle.png'),
  ('specials/my_feet_are_like_hands.webp', FALSE, 'erb/specials/234_my_feet_are_like_hands.png'),
  ('specials/my_feet_are_like_hands.webp', TRUE, 'erb/specials/234_my_feet_are_like_hands.png'),
  ('specials/raised_by_mangani_apes.webp', FALSE, 'erb/specials/235_raised_by_mangani_apes.png'),
  ('specials/raised_by_mangani_apes.webp', TRUE, 'erb/specials/235_raised_by_mangani_apes.png'),
  ('specials/deceptive_manuver.webp', FALSE, 'erb/specials/236_deceptive_maneuver.png'),
  ('specials/deceptive_manuver.webp', TRUE, 'erb/specials/236_deceptive_maneuver.png'),
  ('specials/ancient_wisdom.webp', FALSE, 'erb/specials/238_ancient_wisdom.png'),
  ('specials/ancient_wisdom.webp', TRUE, 'erb/specials/238_ancient_wisdom.png'),
  ('specials/fury_of_the_desert.webp', FALSE, 'erb/specials/239_fury_of_the_desert.png'),
  ('specials/fury_of_the_desert.webp', TRUE, 'erb/specials/239_fury_of_the_desert.png'),
  ('specials/pharaoh_of_the_fourth_dynasty.webp', FALSE, 'erb/specials/240_pharaoh_of_the_fourth_dynasty.png'),
  ('specials/reinvigorated_by_fresh_organs.webp', FALSE, 'erb/specials/241_reinvigorated_by_fresh_organs.png'),
  ('specials/relentless_pursuit.webp', FALSE, 'erb/specials/242_relentless_pursuit.png'),
  ('specials/relentless_pursuit.webp', TRUE, 'erb/specials/242_relentless_pursuit.png'),
  ('specials/the_eternal_jouney.webp', FALSE, 'erb/specials/243_the_eternal_journey.png'),
  ('specials/the_eternal_jouney.webp', TRUE, 'erb/specials/243_the_eternal_journey.png'),
  ('specials/all_for_one.webp', FALSE, 'erb/specials/245_all_for_one.png'),
  ('specials/aramis.webp', FALSE, 'erb/specials/246_aramis.png'),
  ('specials/aramis.webp', TRUE, 'erb/specials/246_aramis.png'),
  ('specials/athos.webp', FALSE, 'erb/specials/247_athos.png'),
  ('specials/athos.webp', TRUE, 'erb/specials/247_athos.png'),
  ('specials/dartagnan.webp', FALSE, 'erb/specials/248_d_artagnan.png'),
  ('specials/dartagnan.webp', TRUE, 'erb/specials/248_d_artagnan.png'),
  ('specials/porthos.webp', FALSE, 'erb/specials/249_porthos.png'),
  ('specials/porthos.webp', TRUE, 'erb/specials/249_porthos.png'),
  ('specials/valient_charge.webp', FALSE, 'erb/specials/250_valiant_charge.png'),
  ('specials/valient_charge.webp', TRUE, 'erb/specials/250_valiant_charge.png'),
  ('specials/from_a_mile_away.webp', FALSE, 'erb/specials/252_from_a_mile_away.png'),
  ('specials/from_a_mile_away.webp', TRUE, 'erb/specials/252_from_a_mile_away.png'),
  ('specials/futuristic_phaser.webp', FALSE, 'erb/specials/253_futuristic_phaser.png'),
  ('specials/futuristic_phaser.webp', TRUE, 'erb/specials/253_futuristic_phaser.png'),
  ('specials/ill_already_be_gone.webp', FALSE, 'erb/specials/254_i_ll_already_be_gone.png'),
  ('specials/ill_already_be_gone.webp', TRUE, 'erb/specials/254_i_ll_already_be_gone.png'),
  ('specials/knowledge_of_tomorrow.webp', FALSE, 'erb/specials/255_knowledge_of_tomorrow.png'),
  ('specials/harbingers_warning.webp', FALSE, 'erb/specials/256_harbinger_s_warning.png'),
  ('specials/harbingers_warning.webp', TRUE, 'erb/specials/256_harbinger_s_warning.png'),
  ('specials/the_tomorrow_doctor.webp', FALSE, 'erb/specials/257_the_tomorrow_doctor.png'),
  ('specials/the_tomorrow_doctor.webp', TRUE, 'erb/specials/257_the_tomorrow_doctor.png'),
  ('specials/doctor_profesor_lawyer_scientist.webp', FALSE, 'erb/specials/259_doctor_professor_lawyer_scientist.png'),
  ('specials/monster_hunting_expert.webp', FALSE, 'erb/specials/260_monster_hunting_expert.png'),
  ('specials/crossbow_expert.webp', FALSE, 'erb/specials/261_crossbow_expert.png'),
  ('specials/right_tools_for_the_job.webp', FALSE, 'erb/specials/262_right_tools_for_the_job.png'),
  ('specials/sacred_wafers_of_amsterdam.webp', FALSE, 'erb/specials/263_sacred_wafers_from_amsterdam.png'),
  ('specials/world_renowned_doctor.webp', FALSE, 'erb/specials/264_world_renowned_doctor.png'),
  ('specials/abner_perrys_lab_assistant.webp', FALSE, 'erb/specials/266_abner_perry_s_lab_assistant.png'),
  ('specials/abner_perrys_lab_assistant.webp', TRUE, 'erb/specials/266_abner_perry_s_lab_assistant.png'),
  ('specials/archery_knives_and_jiu_jitsu.webp', FALSE, 'erb/specials/267_archery_knives_and_jiu_jitsu.png'),
  ('specials/chamston-hedding_estate.webp', FALSE, 'erb/specials/268_chamston_hedding_estate.png'),
  ('specials/chamston-hedding_estate.webp', TRUE, 'erb/specials/268_chamston_hedding_estate.png'),
  ('specials/department_of_theoretical_physics.webp', FALSE, 'erb/specials/269_department_of_theoretical_physics.png'),
  ('specials/department_of_theoretical_physics.webp', TRUE, 'erb/specials/269_department_of_theoretical_physics.png'),
  ('specials/fires_of_halos.webp', FALSE, 'erb/specials/270_fires_of_halos.png'),
  ('specials/practical_physics.webp', FALSE, 'erb/specials/271_practical_physics.png'),
  ('specials/practical_physics.webp', TRUE, 'erb/specials/271_practical_physics.png'),
  ('specials/aquaphobic.webp', FALSE, 'erb/specials/273_aquaphobic.png'),
  ('specials/feard_by_all_witches.webp', FALSE, 'erb/specials/274_feared_by_all_witches.png'),
  ('specials/i_will_have_those_silver_shoes.webp', FALSE, 'erb/specials/275_i_will_have_those_silver_shoes.png'),
  ('specials/one_eye.webp', FALSE, 'erb/specials/276_one_eye.png'),
  ('specials/harness_the_wind.webp', FALSE, 'erb/specials/277_harness_the_wind.png'),
  ('specials/wolves_crows_and_black_bees.webp', FALSE, 'erb/specials/278_wolves_crows_and_black_bees.png'),
  ('specials/a_jealous_god.webp', FALSE, 'erb/specials/280_a_jealous_god.png'),
  ('specials/a_jealous_god.webp', TRUE, 'erb/specials/280_a_jealous_god.png'),
  ('specials/banishment.webp', FALSE, 'erb/specials/281_banishment.png'),
  ('specials/banishment.webp', TRUE, 'erb/specials/281_banishment.png'),
  ('specials/hera.webp', FALSE, 'erb/specials/282_hera.png'),
  ('specials/hera.webp', TRUE, 'erb/specials/282_hera.png'),
  ('specials/law_and_order.webp', FALSE, 'erb/specials/283_law_and_order.png'),
  ('specials/law_and_order.webp', TRUE, 'erb/specials/283_law_and_order.png'),
  ('specials/thunderbolt.webp', FALSE, 'erb/specials/284_thunderbolt.png'),
  ('specials/thunderbolt.webp', TRUE, 'erb/specials/284_thunderbolt.png'),
  ('specials/3_quick_strokes.webp', FALSE, 'erb/specials/286_3_quick_strokes.png'),
  ('specials/elite_swordsmanship.webp', FALSE, 'erb/specials/287_elite_swordsmanship.png'),
  ('specials/elite_swordsmanship.webp', TRUE, 'erb/specials/287_elite_swordsmanship.png'),
  ('specials/master_of_escape.webp', FALSE, 'erb/specials/288_master_of_escape.png'),
  ('specials/master_of_escape.webp', TRUE, 'erb/specials/288_master_of_escape.png'),
  ('specials/ancestial_rapier.webp', FALSE, 'erb/specials/289_ancestral_rapier.png'),
  ('specials/ancestial_rapier.webp', TRUE, 'erb/specials/289_ancestral_rapier.png'),
  ('specials/riches_of_don_diego_de_la_vega.webp', FALSE, 'erb/specials/290_riches_of_don_diego_de_la_vega.png'),
  ('specials/riches_of_don_diego_de_la_vega.webp', TRUE, 'erb/specials/290_riches_of_don_diego_de_la_vega.png'),
  ('specials/riposte.webp', FALSE, 'erb/specials/291_riposte.png'),
  ('specials/riposte.webp', TRUE, 'erb/specials/291_riposte.png'),
  ('specials/heimdall.webp', FALSE, 'erb/specials/439_heimdell.png'),
  ('specials/lady_of_the_lake.webp', FALSE, 'erb/specials/440_lady_of_the_lake.png'),
  ('specials/robin_hood_master_thief.webp', FALSE, 'erb/specials/441_robin_hood_master_thief.png'),
  ('specials/tunupa_mountain_god.webp', FALSE, 'erb/specials/442_tunupa_mountain_god.png'),
  ('specials/fairy_protection.webp', FALSE, 'erb/specials/443_fairy_protection.png'),
  ('specials/loki.webp', FALSE, 'erb/specials/444_loki.png'),
  ('specials/wrath_of_ra.webp', FALSE, 'erb/specials/445_wrath_of_ra.png'),
  ('specials/valkyrie_skeggjold.webp', FALSE, 'erb/specials/446_valkyrie_skeggjold.png'),
  ('specials/oni_and_succubus.webp', FALSE, 'erb/specials/447_oni_and_succubus.png'),
  ('specials/bodhisattava_enlightened_one.webp', FALSE, 'erb/specials/448_bodhisattva_enlightened_one.png'),
  ('specials/mystical_energy.webp', FALSE, 'erb/specials/449_mystical_energy.png'),
  ('specials/charge_into_battle.webp', FALSE, 'erb/specials/450_charge_into_battle.png'),
  ('specials/subjugate_the_meek.webp', FALSE, 'erb/specials/451_subjugate_the_meek.png'),
  ('specials/draconic_leadership.webp', FALSE, 'erb/specials/452_draconic_leadership.png'),
  ('specials/liliths_swarm.webp', FALSE, 'erb/specials/453_lilith_s_swarm.png'),
  ('specials/disorient_opponent.webp', FALSE, 'erb/specials/454_disorient_opponent.png'),
  ('specials/freya_goddess_of_protection.webp', FALSE, 'erb/specials/455_freya_goddess_of_protection.png'),
  ('specials/grim_reaper.webp', FALSE, 'erb/specials/456_grim_reaper.png'),
  ('specials/gunnr.webp', FALSE, 'erb/specials/457_gunnr_battle_valkyrie.png'),
  ('specials/hades_lord_of_the_underworld.webp', FALSE, 'erb/specials/458_hades_lord_of_the_underworld.png'),
  ('specials/legendary_escape.webp', FALSE, 'erb/specials/459_legendary_escape.png'),
  ('specials/merlins_magic.webp', FALSE, 'erb/specials/460_merlin_s_magic.png'),
  ('specials/preternatural_healing.webp', FALSE, 'erb/specials/461_preternatural_healing.png'),
  ('specials/princess_and_the_pea.webp', FALSE, 'erb/specials/462_princess_and_the_pea.png'),
  ('specials/the_gemini.webp', FALSE, 'erb/specials/463_the_gemini.png'),
  ('specials/valkyrie_hildr_select_the_slain.webp', FALSE, 'erb/specials/464_valkyrie_hildr_select_the_slain.png')
)
UPDATE special_cards target
SET image_path = art.new_image_path,
    updated_at = NOW()
FROM art
WHERE target.set = 'ERB'
  AND target.image_path = art.old_image_path
  AND target.is_foil = art.is_foil;

WITH art (old_image_path, is_foil, new_image_path) AS (
VALUES
  ('advanced-universe/shards_of_the_staff.webp', FALSE, 'erb/advanced-universe/192_shards_of_the_staff.png'),
  ('advanced-universe/staff_fragments.webp', FALSE, 'erb/advanced-universe/193_staff_fragments.png'),
  ('advanced-universe/staff_head.webp', FALSE, 'erb/advanced-universe/194_staff_head.png')
)
UPDATE advanced_universe_cards target
SET image_path = art.new_image_path,
    updated_at = NOW()
FROM art
WHERE target.set = 'ERB'
  AND target.image_path = art.old_image_path
  AND target.is_foil = art.is_foil;

WITH art (old_image_path, is_foil, new_image_path) AS (
VALUES
  ('power-cards/8_energy.webp', FALSE, 'erb/power/292_8_energy.png'),
  ('power-cards/7_energy.webp', FALSE, 'erb/power/293_7_energy.png'),
  ('power-cards/6_energy.webp', FALSE, 'erb/power/294_6_energy.png'),
  ('power-cards/5_energy.webp', FALSE, 'erb/power/295_5_energy.png'),
  ('power-cards/4_energy.webp', FALSE, 'erb/power/296_4_energy.png'),
  ('power-cards/3_energy.webp', FALSE, 'erb/power/297_3_energy.png'),
  ('power-cards/2_energy.webp', FALSE, 'erb/power/298_2_energy.png'),
  ('power-cards/1_energy.webp', FALSE, 'erb/power/299_1_energy.png'),
  ('power-cards/8_combat.webp', FALSE, 'erb/power/300_8_combat.png'),
  ('power-cards/7_combat.webp', FALSE, 'erb/power/301_7_combat.png'),
  ('power-cards/6_combat.webp', FALSE, 'erb/power/302_6_combat.png'),
  ('power-cards/5_combat.webp', FALSE, 'erb/power/303_5_combat.png'),
  ('power-cards/4_combat.webp', FALSE, 'erb/power/304_4_combat.png'),
  ('power-cards/3_combat.webp', FALSE, 'erb/power/305_3_combat.png'),
  ('power-cards/2_combat.webp', FALSE, 'erb/power/306_2_combat.png'),
  ('power-cards/1_combat.webp', FALSE, 'erb/power/307_1_combat.png'),
  ('power-cards/8_brute_force.webp', FALSE, 'erb/power/308_8_brute_force.png'),
  ('power-cards/7_brute_force.webp', FALSE, 'erb/power/309_7_brute_force.png'),
  ('power-cards/6_brute_force.webp', FALSE, 'erb/power/310_6_brute_force.png'),
  ('power-cards/5_brute_force.webp', FALSE, 'erb/power/311_5_brute_force.png'),
  ('power-cards/4_brute_force.webp', FALSE, 'erb/power/312_4_brute_force.png'),
  ('power-cards/3_brute_force.webp', FALSE, 'erb/power/313_3_brute_force.png'),
  ('power-cards/2_brute_force.webp', FALSE, 'erb/power/314_2_brute_force.png'),
  ('power-cards/1_brute_force.webp', FALSE, 'erb/power/315_1_brute_force.png'),
  ('power-cards/8_intelligence.webp', FALSE, 'erb/power/316_8_intelligence.png'),
  ('power-cards/7_intelligence.webp', FALSE, 'erb/power/317_7_intelligence.png'),
  ('power-cards/6_intelligence.webp', FALSE, 'erb/power/318_6_intelligence.png'),
  ('power-cards/5_intelligence.webp', FALSE, 'erb/power/319_5_intelligence.png'),
  ('power-cards/4_intelligence.webp', FALSE, 'erb/power/320_4_intelligence.png'),
  ('power-cards/3_intelligence.webp', FALSE, 'erb/power/321_3_intelligence.png'),
  ('power-cards/2_intelligence.webp', FALSE, 'erb/power/322_2_intelligence.png'),
  ('power-cards/1_intelligence.webp', FALSE, 'erb/power/323_1_intelligence.png'),
  ('power-cards/5_anypower.webp', FALSE, 'erb/power/473_5_any_power.png'),
  ('power-cards/5_anypower.webp', TRUE, 'erb/power/473_5_any_power.png'),
  ('power-cards/6_anypower.webp', FALSE, 'erb/power/474_6_any_power.png'),
  ('power-cards/6_anypower.webp', TRUE, 'erb/power/474_6_any_power.png'),
  ('power-cards/7_anypower.webp', FALSE, 'erb/power/475_7_any_power.png'),
  ('power-cards/7_anypower.webp', TRUE, 'erb/power/475_7_any_power.png'),
  ('power-cards/8_anypower.webp', FALSE, 'erb/power/476_8_any_power.png'),
  ('power-cards/8_anypower.webp', TRUE, 'erb/power/476_8_any_power.png'),
  ('power-cards/3_multipower.webp', FALSE, 'erb/power/477_3_multi_power.png'),
  ('power-cards/3_multipower.webp', TRUE, 'erb/power/477_3_multi_power.png'),
  ('power-cards/4_multipower.webp', FALSE, 'erb/power/478_4_multi_power.png'),
  ('power-cards/4_multipower.webp', TRUE, 'erb/power/478_4_multi_power.png'),
  ('power-cards/5_multipower.webp', FALSE, 'erb/power/479_5_multi_power.png'),
  ('power-cards/5_multipower.webp', TRUE, 'erb/power/479_5_multi_power.png')
)
UPDATE power_cards target
SET image_path = art.new_image_path,
    updated_at = NOW()
FROM art
WHERE target.set = 'ERB'
  AND target.image_path = art.old_image_path
  AND target.is_foil = art.is_foil;

WITH art (old_image_path, is_foil, new_image_path) AS (
VALUES
  ('ally-universe/5_energy.webp', FALSE, 'erb/ally/324_allan_quatermain.png'),
  ('ally-universe/7_energy.webp', FALSE, 'erb/ally/325_hera.png'),
  ('ally-universe/5_combat.webp', FALSE, 'erb/ally/326_hucklebuck.png'),
  ('ally-universe/7_combat.webp', FALSE, 'erb/ally/327_sir_galahad.png'),
  ('ally-universe/5_brute_force.webp', FALSE, 'erb/ally/328_little_john.png'),
  ('ally-universe/7_brute_force.webp', FALSE, 'erb/ally/329_guy_of_gisborne.png'),
  ('ally-universe/5_intelligence.webp', FALSE, 'erb/ally/330_professor_porter.png'),
  ('ally-universe/7_intelligence.webp', FALSE, 'erb/ally/331_queen_guinevere.png')
)
UPDATE ally_universe_cards target
SET image_path = art.new_image_path,
    updated_at = NOW()
FROM art
WHERE target.set = 'ERB'
  AND target.image_path = art.old_image_path
  AND target.is_foil = art.is_foil;

WITH art (old_image_path, is_foil, new_image_path) AS (
VALUES
  ('basic-universe/6_energy_2.webp', FALSE, 'erb/basic-universe/332_ray_gun.png'),
  ('basic-universe/6_energy_3.webp', FALSE, 'erb/basic-universe/333_merlin_s_wand.png'),
  ('basic-universe/7_energy_3.webp', FALSE, 'erb/basic-universe/334_lightning_bolt.png'),
  ('basic-universe/6_combat_2.webp', FALSE, 'erb/basic-universe/335_flintlock.png'),
  ('basic-universe/6_combat_3.webp', FALSE, 'erb/basic-universe/336_rapier.png'),
  ('basic-universe/7_combat_3.webp', FALSE, 'erb/basic-universe/337_longbow.png'),
  ('basic-universe/6_brute_force_2.webp', FALSE, 'erb/basic-universe/338_hyde_s_serum.png'),
  ('basic-universe/6_brute_force_3.webp', FALSE, 'erb/basic-universe/339_trident.png'),
  ('basic-universe/7_brute_force_3.webp', FALSE, 'erb/basic-universe/340_tribuchet.png'),
  ('basic-universe/6_intelligence_2.webp', FALSE, 'erb/basic-universe/341_secret_identity.png'),
  ('basic-universe/6_intelligence_3.webp', FALSE, 'erb/basic-universe/342_advanced_technology.png'),
  ('basic-universe/7_intelligence_3.webp', FALSE, 'erb/basic-universe/343_magic_spell.png')
)
UPDATE basic_universe_cards target
SET image_path = art.new_image_path,
    updated_at = NOW()
FROM art
WHERE target.set = 'ERB'
  AND target.image_path = art.old_image_path
  AND target.is_foil = art.is_foil;

WITH art (old_image_path, is_foil, new_image_path) AS (
VALUES
  ('training-universe/5_energy_5_combat_4.webp', FALSE, 'erb/training/344_training_merlin.png'),
  ('training-universe/5_energy_5_brute_force_4.webp', FALSE, 'erb/training/345_training_joan_of_arc.png'),
  ('training-universe/5_energy_5_intelligence_4.webp', FALSE, 'erb/training/346_training_cultists.png'),
  ('training-universe/5_combat_5_brute_force_4.webp', FALSE, 'erb/training/347_training_robin_hood.png'),
  ('training-universe/5_combat_5_intelligence_4.webp', FALSE, 'erb/training/348_training_leonidas.png'),
  ('training-universe/5_brute_force_5_intelligence_4.webp', FALSE, 'erb/training/349_training_lancelot.png')
)
UPDATE training_cards target
SET image_path = art.new_image_path,
    updated_at = NOW()
FROM art
WHERE target.set = 'ERB'
  AND target.image_path = art.old_image_path
  AND target.is_foil = art.is_foil;

WITH art (old_image_path, is_foil, new_image_path) AS (
VALUES
  ('missions/the-call-of-cthulhu/the_dreams_of_men.webp', FALSE, 'erb/missions/350_the_dreams_of_men.png'),
  ('missions/the-call-of-cthulhu/professor_angells_investigation.webp', FALSE, 'erb/missions/351_professor_angell_s_investigation.png'),
  ('missions/the-call-of-cthulhu/new_orleans_1908.webp', FALSE, 'erb/missions/352_new_orleans_1908.png'),
  ('missions/the-call-of-cthulhu/worshipping_the_great_old_one.webp', FALSE, 'erb/missions/353_worshipping_the_great_old_one.png'),
  ('missions/the-call-of-cthulhu/the_alert.webp', FALSE, 'erb/missions/354_the_alert.png'),
  ('missions/the-call-of-cthulhu/johansens_widow.webp', FALSE, 'erb/missions/355_johansen_s_widow.png'),
  ('missions/the-call-of-cthulhu/gone_too_far.webp', FALSE, 'erb/missions/356_gone_too_far.png'),
  ('missions/king-of-the-jungle/tarzan_of_the_apes.webp', FALSE, 'erb/missions/362_tarzan_of_the_apes.png'),
  ('missions/king-of-the-jungle/beasts_of_tarzan.webp', FALSE, 'erb/missions/363_beasts_of_tarzan.png'),
  ('missions/king-of-the-jungle/tarzan_and_the_golden_lion.webp', FALSE, 'erb/missions/364_tarzan_and_the_golden_lion.png'),
  ('missions/king-of-the-jungle/tarzan_at_the_earths_core.webp', FALSE, 'erb/missions/365_tarzan_at_the_earth_s_core.png'),
  ('missions/king-of-the-jungle/tarzan_and_the_city_of_gold.webp', FALSE, 'erb/missions/366_tarzan_and_the_city_of_gold.png'),
  ('missions/king-of-the-jungle/tarzans_quest.webp', FALSE, 'erb/missions/367_tarzan_s_quest.png'),
  ('missions/king-of-the-jungle/tarzan_and_the_castaways.webp', FALSE, 'erb/missions/368_tarzan_and_the_castaways.png'),
  ('missions/the-warlord-of-mars/the_face_of_death.webp', FALSE, 'erb/missions/374_the_face_of_death.png'),
  ('missions/the-warlord-of-mars/the_battle_of_kings.webp', FALSE, 'erb/missions/375_the_battle_of_kings.png'),
  ('missions/the-warlord-of-mars/a_fighting_man_of_mars.webp', FALSE, 'erb/missions/376_a_fighting_man_of_mars.png'),
  ('missions/the-warlord-of-mars/swords_of_mars.webp', FALSE, 'erb/missions/377_swords_of_mars.png'),
  ('missions/the-warlord-of-mars/the_invisible_men.webp', FALSE, 'erb/missions/378_the_invisible_men.png'),
  ('missions/the-warlord-of-mars/the_loyalty_of_woola.webp', FALSE, 'erb/missions/379_the_loyalty_of_woola.png'),
  ('missions/the-warlord-of-mars/under_the_moons_of_mars.webp', FALSE, 'erb/missions/380_under_the_moons_of_mars.png'),
  ('missions/time-wars-rise-of-the-gods/the_gods_return.webp', FALSE, 'erb/missions/386_the_gods_return.png'),
  ('missions/time-wars-rise-of-the-gods/divine_retribution.webp', FALSE, 'erb/missions/387_divine_retribution.png'),
  ('missions/time-wars-rise-of-the-gods/travelers_warning.webp', FALSE, 'erb/missions/388_traveler_s_warning.png'),
  ('missions/time-wars-rise-of-the-gods/warriors_from_across_time.webp', FALSE, 'erb/missions/389_warriors_from_across_time.png'),
  ('missions/time-wars-rise-of-the-gods/tide_begins_to_turn.webp', FALSE, 'erb/missions/390_tide_begins_to_turn.png'),
  ('missions/time-wars-rise-of-the-gods/supernatural_allies.webp', FALSE, 'erb/missions/391_supernatural_allies.png'),
  ('missions/time-wars-rise-of-the-gods/battle_at_olympus.webp', FALSE, 'erb/missions/392_battle_at_olympus.png')
)
UPDATE missions target
SET image_path = art.new_image_path,
    updated_at = NOW()
FROM art
WHERE target.set = 'ERB'
  AND target.image_path = art.old_image_path
  AND target.is_foil = art.is_foil;

WITH art (old_image_path, is_foil, new_image_path) AS (
VALUES
  ('events/a_desperate_gamble.webp', FALSE, 'erb/events/357_desperate_gamble.png'),
  ('events/the_cost_of_knowledge_is_sanity.webp', FALSE, 'erb/events/358_the_cost_of_knowledge_is_sanity.png'),
  ('events/stars_align.webp', FALSE, 'erb/events/359_stars_align.png'),
  ('events/who_can_you_trust.jpg', FALSE, 'erb/events/360_who_can_you_trust.png'),
  ('events/healed_by_a_dark_power.jpg', FALSE, 'erb/events/361_healed_by_a_dark_power.png'),
  ('events/the_lost_city_of_opar.webp', FALSE, 'erb/events/369_the_lost_city_of_opar.png'),
  ('events/tarzan_the_terrible.webp', FALSE, 'erb/events/370_tarzan_the_terrible.png'),
  ('events/the_power_of_gonfal.webp', FALSE, 'erb/events/371_the_power_of_gonfal.png'),
  ('events/jane.png', FALSE, 'erb/events/372_jane.png'),
  ('events/a_captive_no_more.jpg', FALSE, 'erb/events/373_a_captive_no_more.png'),
  ('events/giant_man_of_mars.webp', FALSE, 'erb/events/381_the_giant_man_of_mars.png'),
  ('events/the_battle_with_zod.webp', FALSE, 'erb/events/382_the_battle_with_zad.png'),
  ('events/eyes_in_the_dark.webp', FALSE, 'erb/events/383_eyes_in_the_dark.png'),
  ('events/a_venemous_threat.jpg', FALSE, 'erb/events/384_a_venomous_threat.png'),
  ('events/the_chamber_of_reptiles.jpg', FALSE, 'erb/events/385_the_chamber_of_reptiles.png'),
  ('events/rally_our_allies.webp', FALSE, 'erb/events/393_rally_our_allies.png'),
  ('events/second_chances.webp', FALSE, 'erb/events/394_second_chances.png'),
  ('events/heroes_we_need.webp', FALSE, 'erb/events/395_heroes_we_need.png'),
  ('events/ready_for_war.jpg', FALSE, 'erb/events/396_ready_for_war.png'),
  ('events/getting_our_hands_dirty.jpg', FALSE, 'erb/events/397_getting_our_hands_dirty.png')
)
UPDATE events target
SET image_path = art.new_image_path,
    updated_at = NOW()
FROM art
WHERE target.set = 'ERB'
  AND target.image_path = art.old_image_path
  AND target.is_foil = art.is_foil;

WITH art (old_image_path, is_foil, new_image_path) AS (
VALUES
  ('teamwork-universe/6_energy_0b_1i.webp', FALSE, 'erb/teamwork/398_6_energy.png'),
  ('teamwork-universe/6_energy_0c_1bf.webp', FALSE, 'erb/teamwork/399_6_energy.png'),
  ('teamwork-universe/6_energy_0c_1i.webp', FALSE, 'erb/teamwork/400_6_energy.png'),
  ('teamwork-universe/7_energy_1c_1i.webp', FALSE, 'erb/teamwork/401_7_energy.png'),
  ('teamwork-universe/7_energy_1c_1bf.webp', FALSE, 'erb/teamwork/402_7_energy.png'),
  ('teamwork-universe/7_energy_1bf_1i.webp', FALSE, 'erb/teamwork/403_7_energy.png'),
  ('teamwork-universe/8_energy_1c_2bf.webp', FALSE, 'erb/teamwork/404_8_energy.png'),
  ('teamwork-universe/8_energy_1bf_2i.webp', FALSE, 'erb/teamwork/405_8_energy.png'),
  ('teamwork-universe/8_energy_1c_2i.webp', FALSE, 'erb/teamwork/406_8_energy.png'),
  ('teamwork-universe/6_combat_0e_1bf.webp', FALSE, 'erb/teamwork/407_6_combat.png'),
  ('teamwork-universe/6_combat_0bf_1i.webp', FALSE, 'erb/teamwork/408_6_combat.png'),
  ('teamwork-universe/6_combat_0e_1i.webp', FALSE, 'erb/teamwork/409_6_combat.png'),
  ('teamwork-universe/7_combat_1bf_1i.webp', FALSE, 'erb/teamwork/410_7_combat.png'),
  ('teamwork-universe/7_combat_1e_1i.webp', FALSE, 'erb/teamwork/411_7_combat.png'),
  ('teamwork-universe/7_combat_1e_1bf.webp', FALSE, 'erb/teamwork/412_7_combat.png'),
  ('teamwork-universe/8_combat_1e_2i.webp', FALSE, 'erb/teamwork/413_8_combat.png'),
  ('teamwork-universe/8_combat_1bf_2i.webp', FALSE, 'erb/teamwork/414_8_combat.png'),
  ('teamwork-universe/8_combat_1e_2bf.webp', FALSE, 'erb/teamwork/415_8_combat.png'),
  ('teamwork-universe/6_brute_force_0e_1c.webp', FALSE, 'erb/teamwork/416_6_brute_force.png'),
  ('teamwork-universe/6_brute_force_0e_1i.webp', FALSE, 'erb/teamwork/417_6_brute_force.png'),
  ('teamwork-universe/6_brute_force_0c_1i.webp', FALSE, 'erb/teamwork/418_6_brute_force.png'),
  ('teamwork-universe/7_brute_force_1e_1i.webp', FALSE, 'erb/teamwork/419_7_brute_force.png'),
  ('teamwork-universe/7_brute_force_1e_1c.webp', FALSE, 'erb/teamwork/420_7_brute_force.png'),
  ('teamwork-universe/7_brute_force_1c_1i.webp', FALSE, 'erb/teamwork/421_7_brute_force.png'),
  ('teamwork-universe/8_brute_force_1c_2i.webp', FALSE, 'erb/teamwork/422_8_brute_force.png'),
  ('teamwork-universe/8_brute_force_1e_2i.webp', FALSE, 'erb/teamwork/423_8_brute_force.png'),
  ('teamwork-universe/8_brute_force_1e_2c.webp', FALSE, 'erb/teamwork/424_8_brute_force.png'),
  ('teamwork-universe/6_intelligence_0c_1bf.webp', FALSE, 'erb/teamwork/425_6_intelligence.png'),
  ('teamwork-universe/6_intelligence_0e_1bf.webp', FALSE, 'erb/teamwork/426_6_intelligence.png'),
  ('teamwork-universe/6_intelligence_0e_1c.webp', FALSE, 'erb/teamwork/427_6_intelligence.png'),
  ('teamwork-universe/7_intelligence_1c_1bf.webp', FALSE, 'erb/teamwork/428_7_intelligence.png'),
  ('teamwork-universe/7_intelligence_1e_1bf.webp', FALSE, 'erb/teamwork/429_7_intelligence.png'),
  ('teamwork-universe/7_intelligence_1e_1c.webp', FALSE, 'erb/teamwork/430_7_intelligence.png'),
  ('teamwork-universe/8_intelligence_1c_2bf.webp', FALSE, 'erb/teamwork/431_8_intelligence.png'),
  ('teamwork-universe/8_intelligence_1e_2c.webp', FALSE, 'erb/teamwork/432_8_intelligence.png'),
  ('teamwork-universe/8_intelligence_1e_2bf.webp', FALSE, 'erb/teamwork/433_8_intelligence.png'),
  ('teamwork-universe/6_anypower.webp', FALSE, 'erb/teamwork/480_6_any_power.png'),
  ('teamwork-universe/7_anypower.webp', FALSE, 'erb/teamwork/481_7_any_power.png')
)
UPDATE teamwork_cards target
SET image_path = art.new_image_path,
    updated_at = NOW()
FROM art
WHERE target.set = 'ERB'
  AND target.image_path = art.old_image_path
  AND target.is_foil = art.is_foil;

WITH art (old_image_path, is_foil, new_image_path) AS (
VALUES
  ('aspects/amaru_dragon_legend.webp', FALSE, 'erb/aspects/434_amaru_dragon_legend.png'),
  ('aspects/mallku.webp', FALSE, 'erb/aspects/435_mallku.png'),
  ('aspects/supay.webp', FALSE, 'erb/aspects/436_supay.png'),
  ('aspects/cheshire_cat.webp', FALSE, 'erb/aspects/437_cheshire_cat.png'),
  ('aspects/isis.webp', FALSE, 'erb/aspects/438_isis.png')
)
UPDATE aspects target
SET image_path = art.new_image_path,
    updated_at = NOW()
FROM art
WHERE target.set = 'ERB'
  AND target.image_path = art.old_image_path
  AND target.is_foil = art.is_foil;

WITH art (old_image_path, is_foil, new_image_path) AS (
VALUES
  ('draculas_armory.webp', FALSE, 'erb/locations/465_dracula_s_armory.png'),
  ('spartan_training_ground.webp', FALSE, 'erb/locations/466_spartan_training_ground.png'),
  ('the_round_table.webp', FALSE, 'erb/locations/467_the_round_table.png'),
  ('barsoom.webp', FALSE, 'erb/locations/468_barsoom.png'),
  ('asclepieion.webp', FALSE, 'erb/locations/469_asclepieion.png'),
  ('221_b_baker_st.webp', FALSE, 'erb/locations/470_221_b_baker_st.png'),
  ('event_horizon_the_future.webp', FALSE, 'erb/locations/471_event_horizon_the_future.png'),
  ('the_land_that_time_forgot.webp', FALSE, 'erb/locations/472_the_land_that_time_forgot.png')
)
UPDATE locations target
SET image_path = art.new_image_path,
    updated_at = NOW()
FROM art
WHERE target.set = 'ERB'
  AND target.image_path = art.old_image_path
  AND target.is_foil = art.is_foil;

DO $$
DECLARE
  imported_rows INTEGER;
  imported_base_rows INTEGER;
  imported_foil_rows INTEGER;
  imported_assets INTEGER;
  optional_dracula_foil_rows INTEGER;
  read_the_bones_rows INTEGER;
  king_arthur_rows INTEGER;
  musketeers_rows INTEGER;
  preserved_legacy_alts INTEGER;
BEGIN
  WITH erb_rows AS (
  SELECT image_path, is_foil FROM characters WHERE set = 'ERB'
  UNION ALL
  SELECT image_path, is_foil FROM special_cards WHERE set = 'ERB'
  UNION ALL
  SELECT image_path, is_foil FROM advanced_universe_cards WHERE set = 'ERB'
  UNION ALL
  SELECT image_path, is_foil FROM power_cards WHERE set = 'ERB'
  UNION ALL
  SELECT image_path, is_foil FROM ally_universe_cards WHERE set = 'ERB'
  UNION ALL
  SELECT image_path, is_foil FROM basic_universe_cards WHERE set = 'ERB'
  UNION ALL
  SELECT image_path, is_foil FROM training_cards WHERE set = 'ERB'
  UNION ALL
  SELECT image_path, is_foil FROM missions WHERE set = 'ERB'
  UNION ALL
  SELECT image_path, is_foil FROM events WHERE set = 'ERB'
  UNION ALL
  SELECT image_path, is_foil FROM teamwork_cards WHERE set = 'ERB'
  UNION ALL
  SELECT image_path, is_foil FROM aspects WHERE set = 'ERB'
  UNION ALL
  SELECT image_path, is_foil FROM locations WHERE set = 'ERB'
  )
  SELECT
    COUNT(*) FILTER (WHERE image_path LIKE 'erb/%'),
    COUNT(*) FILTER (WHERE image_path LIKE 'erb/%' AND is_foil = FALSE),
    COUNT(*) FILTER (WHERE image_path LIKE 'erb/%' AND is_foil = TRUE),
    COUNT(DISTINCT image_path) FILTER (WHERE image_path LIKE 'erb/%')
  INTO imported_rows, imported_base_rows, imported_foil_rows, imported_assets
  FROM erb_rows;

  -- Some long-lived local databases contain a Dracula 494F row that was never created by the
  -- canonical Flyway history. Update it when present, but do not require it on a fresh database.
  SELECT COUNT(*) INTO optional_dracula_foil_rows
  FROM characters
  WHERE set = 'ERB'
    AND set_number = '494F'
    AND is_foil = TRUE
    AND image_path = 'erb/characters/494_dracula.png';

  IF optional_dracula_foil_rows > 1 THEN
    RAISE EXCEPTION 'ERB LRG art expected at most one optional Dracula 494F row, found %',
      optional_dracula_foil_rows;
  END IF;

  IF imported_rows <> 709 + optional_dracula_foil_rows
    OR imported_base_rows <> 534
    OR imported_foil_rows <> 175 + optional_dracula_foil_rows THEN
    RAISE EXCEPTION 'ERB LRG art expected 709 canonical rows plus % optional Dracula foil row(s), found % rows (% base, % foil)',
      optional_dracula_foil_rows, imported_rows, imported_base_rows, imported_foil_rows;
  END IF;

  IF imported_assets <> 534 THEN
    RAISE EXCEPTION 'ERB LRG art expected 534 distinct image paths, found %', imported_assets;
  END IF;

  SELECT COUNT(*) INTO read_the_bones_rows
  FROM special_cards
  WHERE set = 'ERB'
    AND set_number = '205'
    AND is_foil = FALSE
    AND image_path = 'specials/read_the_bones.webp';

  IF read_the_bones_rows <> 1 THEN
    RAISE EXCEPTION 'ERB collector 205 must retain specials/read_the_bones.webp; found % matching rows', read_the_bones_rows;
  END IF;

  SELECT COUNT(*) INTO king_arthur_rows
  FROM characters
  WHERE set = 'ERB'
    AND ((set_number = '504' AND is_foil = FALSE) OR (set_number = '504F' AND is_foil = TRUE))
    AND image_path = 'erb/characters/504_king_arthur.png';

  IF king_arthur_rows <> 2 THEN
    RAISE EXCEPTION 'ERB King Arthur alternate expected collectors 504/504F, found % rows', king_arthur_rows;
  END IF;

  SELECT COUNT(*) INTO musketeers_rows
  FROM characters
  WHERE set = 'ERB'
    AND ((set_number = '526' AND is_foil = FALSE) OR (set_number = '526F' AND is_foil = TRUE))
    AND image_path = 'erb/characters/526_the_three_musketeers.png';

  IF musketeers_rows <> 2 THEN
    RAISE EXCEPTION 'ERB Three Musketeers alternate expected collectors 526/526F, found % rows', musketeers_rows;
  END IF;

  SELECT COUNT(*) INTO preserved_legacy_alts
  FROM special_cards
  WHERE set = 'ERB'
    AND ((set_number = '461' AND image_path = 'specials/alternate/preternatural_healing.jpg')
      OR (set_number = '463' AND image_path = 'specials/alternate/the_gemini.webp'));

  IF preserved_legacy_alts <> 2 THEN
    RAISE EXCEPTION 'ERB collectors 461/463 must retain two unmatched legacy alternate-art rows; found %', preserved_legacy_alts;
  END IF;
END $$;

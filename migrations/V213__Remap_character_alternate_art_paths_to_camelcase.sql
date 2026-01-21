-- Remap character alternate art image_path values to new CamelCase filenames
--
-- Goal: preserve existing user selections by updating paths in-place:
-- - characters.image_path (alternate character rows)
-- - decks.character_1_image..character_4_image (selected alternate paths)
-- - collection_cards.image_path
--
-- Notes:
-- - Alternate character art is represented as separate rows in `characters`
--   with `image_path` under `characters/alternate/...`.
-- - Per request, keep using these legacy filenames (no remap):
--   - characters/alternate/ra.webp
--   - characters/alternate/dracula2.jpg
--   - characters/alternate/tarzan3.webp

-- 1) Update existing alternate rows in-place (preserve selections)
UPDATE characters SET image_path = 'characters/alternate/AngryMobIndustrialAge-Alt.jpg', updated_at = NOW()
WHERE name = 'Angry Mob (Industrial Age)' AND set = 'ERB' AND image_path = 'characters/alternate/angry_mob_industrial_age.webp';

UPDATE characters SET image_path = 'characters/alternate/AngryMobMiddleAge-Alt.jpg', updated_at = NOW()
WHERE name = 'Angry Mob (Middle Ages)' AND set = 'ERB' AND image_path = 'characters/alternate/angry_mob_middle_ages.jpg';

UPDATE characters SET image_path = 'characters/alternate/AngryMobModernAge-UR_Alt.jpg', updated_at = NOW()
WHERE name = 'Angry Mob (Modern Age)' AND set = 'ERB' AND image_path = 'characters/alternate/angry_mob_modern_age.webp';

UPDATE characters SET image_path = 'characters/alternate/Anubis-Alt.jpg', updated_at = NOW()
WHERE name = 'Anubis' AND set = 'ERB' AND image_path = 'characters/alternate/anubis.png';

UPDATE characters SET image_path = 'characters/alternate/Anubis-PrizePack_Alt.jpg', updated_at = NOW()
WHERE name = 'Anubis' AND set = 'ERB' AND image_path = 'characters/alternate/anubis2.png';

UPDATE characters SET image_path = 'characters/alternate/Billy the Kid-Alt.jpg', updated_at = NOW()
WHERE name = 'Billy the Kid' AND set = 'ERB' AND image_path = 'characters/alternate/billy_the_kid.webp';

UPDATE characters SET image_path = 'characters/alternate/CaptainNemo-PrizePack_Alt.jpg', updated_at = NOW()
WHERE name = 'Captain Nemo' AND set = 'ERB' AND image_path = 'characters/alternate/captain_nemo.jpg';

UPDATE characters SET image_path = 'characters/alternate/Carson of Venus-Alt.jpg', updated_at = NOW()
WHERE name = 'Carson of Venus' AND set = 'ERB' AND image_path = 'characters/alternate/carson_of_venus.webp';

UPDATE characters SET image_path = 'characters/alternate/Count of Monte Critso-Alt.jpg', updated_at = NOW()
WHERE name = 'Count of Monte Cristo' AND set = 'ERB' AND image_path = 'characters/alternate/count_of_monte_cristo.webp';

UPDATE characters SET image_path = 'characters/alternate/Cthulhu-Alt.jpg', updated_at = NOW()
WHERE name = 'Cthulhu' AND set = 'ERB' AND image_path = 'characters/alternate/cthulhu.webp';

UPDATE characters SET image_path = 'characters/alternate/Cthulhu-UR_Alt.jpg', updated_at = NOW()
WHERE name = 'Cthulhu' AND set = 'ERB' AND image_path = 'characters/alternate/cthulhu2.webp';

UPDATE characters SET image_path = 'characters/alternate/Dejah Thoris-Alt.jpg', updated_at = NOW()
WHERE name = 'Dejah Thoris' AND set = 'ERB' AND image_path = 'characters/alternate/dejah_thoris.jpg';

UPDATE characters SET image_path = 'characters/alternate/DejahThoris-UR_Alt.jpg', updated_at = NOW()
WHERE name = 'Dejah Thoris' AND set = 'ERB' AND image_path = 'characters/alternate/dejah_thoris2.webp';

UPDATE characters SET image_path = 'characters/alternate/DrWatson-UR_Alt.jpg', updated_at = NOW()
WHERE name = 'Dr. Watson' AND set = 'ERB' AND image_path = 'characters/alternate/dr. watson.png';

UPDATE characters SET image_path = 'characters/alternate/Dracula-Alt.jpg', updated_at = NOW()
WHERE name = 'Dracula' AND set = 'ERB' AND image_path = 'characters/alternate/dracula.png';

UPDATE characters SET image_path = 'characters/alternate/HeadlessHorseman-UR_Alt.jpg', updated_at = NOW()
WHERE name = 'Headless Horseman' AND set = 'ERB' AND image_path = 'characters/alternate/headless_horsman.webp';

UPDATE characters SET image_path = 'characters/alternate/Hercules-Alt_01.jpg', updated_at = NOW()
WHERE name = 'Hercules' AND set = 'ERB' AND image_path = 'characters/alternate/hercules.png';

UPDATE characters SET image_path = 'characters/alternate/Hercules-Alt_02.jpg', updated_at = NOW()
WHERE name = 'Hercules' AND set = 'ERB' AND image_path = 'characters/alternate/hercules2.png';

UPDATE characters SET image_path = 'characters/alternate/JanePorter-Alt.jpg', updated_at = NOW()
WHERE name = 'Jane Porter' AND set = 'ERB' AND image_path = 'characters/alternate/jane_porter.webp';

UPDATE characters SET image_path = 'characters/alternate/JanePorter-UR_Alt.jpg', updated_at = NOW()
WHERE name = 'Jane Porter' AND set = 'ERB' AND image_path = 'characters/alternate/jane_porter2.webp';

UPDATE characters SET image_path = 'characters/alternate/JoanofArc-Alt.jpg', updated_at = NOW()
WHERE name = 'Joan of Arc' AND set = 'ERB' AND image_path = 'characters/alternate/joan_of_arc.webp';

UPDATE characters SET image_path = 'characters/alternate/JohnCarterofMars-Alt.jpg', updated_at = NOW()
WHERE name = 'John Carter of Mars' AND set = 'ERB' AND image_path = 'characters/alternate/john_carter_of_mars.webp';

UPDATE characters SET image_path = 'characters/alternate/KingArthur-Alt.jpg', updated_at = NOW()
WHERE name = 'King Arthur' AND set = 'ERB' AND image_path = 'characters/alternate/king_arthur.png';

UPDATE characters SET image_path = 'characters/alternate/KingArthur-UR_Alt.jpg', updated_at = NOW()
WHERE name = 'King Arthur' AND set = 'ERB' AND image_path = 'characters/alternate/king_arthur2.png';

UPDATE characters SET image_path = 'characters/alternate/Korak-Alt_01.jpg', updated_at = NOW()
WHERE name = 'Korak' AND set = 'ERB' AND image_path = 'characters/alternate/korak.webp';

UPDATE characters SET image_path = 'characters/alternate/Korak-Alt_02.jpg', updated_at = NOW()
WHERE name = 'Korak' AND set = 'ERB' AND image_path = 'characters/alternate/korak2.webp';

UPDATE characters SET image_path = 'characters/alternate/Lancelot-UR_Alt.jpg', updated_at = NOW()
WHERE name = 'Lancelot' AND set = 'ERB' AND image_path = 'characters/alternate/lancelot.jpg';

UPDATE characters SET image_path = 'characters/alternate/Leonidas-Alt.jpg', updated_at = NOW()
WHERE name = 'Leonidas' AND set = 'ERB' AND image_path = 'characters/alternate/leonidas.png';

UPDATE characters SET image_path = 'characters/alternate/Merlin-Alt.jpg', updated_at = NOW()
WHERE name = 'Merlin' AND set = 'ERB' AND image_path = 'characters/alternate/merlin.png';

UPDATE characters SET image_path = 'characters/alternate/MinaHarker-Alt.jpg', updated_at = NOW()
WHERE name = 'Mina Harker' AND set = 'ERB' AND image_path = 'characters/alternate/mina_harker.png';

UPDATE characters SET image_path = 'characters/alternate/MinaHarker-UR_Alt.jpg', updated_at = NOW()
WHERE name = 'Mina Harker' AND set = 'ERB' AND image_path = 'characters/alternate/mina_harker2.png';

UPDATE characters SET image_path = 'characters/alternate/MorganleFay-Alt_01.jpg', updated_at = NOW()
WHERE name = 'Morgan le Fay' AND set = 'ERB' AND image_path = 'characters/alternate/morgan_le_fay.webp';

UPDATE characters SET image_path = 'characters/alternate/MorganleFay-Alt_02.jpg', updated_at = NOW()
WHERE name = 'Morgan le Fay' AND set = 'ERB' AND image_path = 'characters/alternate/morgan_le_fay2webp.webp';

UPDATE characters SET image_path = 'characters/alternate/MrHyde-UR_Alt.jpg', updated_at = NOW()
WHERE name = 'Mr. Hyde' AND set = 'ERB' AND image_path = 'characters/alternate/mr_hyde.jpg';

UPDATE characters SET image_path = 'characters/alternate/Poseidon-UR_Alt.jpg', updated_at = NOW()
WHERE name = 'Poseidon' AND set = 'ERB' AND image_path = 'characters/alternate/poseidon.png';

UPDATE characters SET image_path = 'characters/alternate/ProfessorMoriarty-Alt.jpg', updated_at = NOW()
WHERE name = 'Professor Moriarty' AND set = 'ERB' AND image_path = 'characters/alternate/professor_moriarty.png';

UPDATE characters SET image_path = 'characters/alternate/RobinHood-Alt.jpg', updated_at = NOW()
WHERE name = 'Robin Hood' AND set = 'ERB' AND image_path = 'characters/alternate/robin_hood.png';

UPDATE characters SET image_path = 'characters/alternate/RobinHood-PrizePack_Alt.jpg', updated_at = NOW()
WHERE name = 'Robin Hood' AND set = 'ERB' AND image_path = 'characters/alternate/robin_hood2.png';

UPDATE characters SET image_path = 'characters/alternate/SheriffofNottingham-Alt.jpg', updated_at = NOW()
WHERE name = 'Sheriff of Nottingham' AND set = 'ERB' AND image_path = 'characters/alternate/sheriff_of_nottingham.png';

UPDATE characters SET image_path = 'characters/alternate/SherlockHolmes-Alt.jpg', updated_at = NOW()
WHERE name = 'Sherlock Holmes' AND set = 'ERB' AND image_path = 'characters/alternate/sherlock_holmes.webp';

UPDATE characters SET image_path = 'characters/alternate/Sherlock-PrizePack_Alt.jpg', updated_at = NOW()
WHERE name = 'Sherlock Holmes' AND set = 'ERB' AND image_path = 'characters/alternate/sherlock_holmes2.jpg';

UPDATE characters SET image_path = 'characters/alternate/SunWukong-UR_Alt.jpg', updated_at = NOW()
WHERE name = 'Sun Wukong' AND set = 'ERB' AND image_path = 'characters/alternate/sun_wukong.png';

UPDATE characters SET image_path = 'characters/alternate/TarsTarkas-Alt.jpg', updated_at = NOW()
WHERE name = 'Tars Tarkas' AND set = 'ERB' AND image_path = 'characters/alternate/tars_tarkas.png';

UPDATE characters SET image_path = 'characters/alternate/TarsTarkas-PrizePack_Alt.jpg', updated_at = NOW()
WHERE name = 'Tars Tarkas' AND set = 'ERB' AND image_path = 'characters/alternate/tars_tarkas2.webp';

UPDATE characters SET image_path = 'characters/alternate/Tarzan-Alt_01.jpg', updated_at = NOW()
WHERE name = 'Tarzan' AND set = 'ERB' AND image_path = 'characters/alternate/tarzan.webp';

UPDATE characters SET image_path = 'characters/alternate/Tarzan-Alt_02.jpg', updated_at = NOW()
WHERE name = 'Tarzan' AND set = 'ERB' AND image_path = 'characters/alternate/tarzan2.webp';

UPDATE characters SET image_path = 'characters/alternate/Mummy-Alt.jpg', updated_at = NOW()
WHERE name = 'The Mummy' AND set = 'ERB' AND image_path = 'characters/alternate/the_mummy.jpg';

UPDATE characters SET image_path = 'characters/alternate/ThreeMusketeers-Alt.jpg', updated_at = NOW()
WHERE name = 'The Three Musketeers' AND set = 'ERB' AND image_path = 'characters/alternate/three_musketeers.jpg';

UPDATE characters SET image_path = 'characters/alternate/ThreeMusketeers-PrizePack_Alt.jpg', updated_at = NOW()
WHERE name = 'The Three Musketeers' AND set = 'ERB' AND image_path = 'characters/alternate/three_musketeers2.jpg';

UPDATE characters SET image_path = 'characters/alternate/TimeTraveler-Alt_01.jpg', updated_at = NOW()
WHERE name = 'Time Traveler' AND set = 'ERB' AND image_path = 'characters/alternate/time_traveler.png';

UPDATE characters SET image_path = 'characters/alternate/TimeTraveler-Alt_02.jpg', updated_at = NOW()
WHERE name = 'Time Traveler' AND set = 'ERB' AND image_path = 'characters/alternate/time_traveler2.png';

UPDATE characters SET image_path = 'characters/alternate/VanHelsing-Alt.jpg', updated_at = NOW()
WHERE name = 'Van Helsing' AND set = 'ERB' AND image_path = 'characters/alternate/van_helsing.png';

UPDATE characters SET image_path = 'characters/alternate/VanHelsing-PrizePack_Alt.jpg', updated_at = NOW()
WHERE name = 'Van Helsing' AND set = 'ERB' AND image_path = 'characters/alternate/van_helsing2.png';

UPDATE characters SET image_path = 'characters/alternate/VictoryHarben-Alt_01.jpg', updated_at = NOW()
WHERE name = 'Victory Harben' AND set = 'ERB' AND image_path = 'characters/alternate/victory_harben.webp';

UPDATE characters SET image_path = 'characters/alternate/VictoryHarben-Alt_02.jpg', updated_at = NOW()
WHERE name = 'Victory Harben' AND set = 'ERB' AND image_path = 'characters/alternate/victory_harben2.webp';

UPDATE characters SET image_path = 'characters/alternate/WickedWitch-Alt.jpg', updated_at = NOW()
WHERE name = 'Wicked Witch' AND set = 'ERB' AND image_path = 'characters/alternate/wicked_witch.webp';

UPDATE characters SET image_path = 'characters/alternate/Zeus-UR_Alt.jpg', updated_at = NOW()
WHERE name = 'Zeus' AND set = 'ERB' AND image_path = 'characters/alternate/zeus.png';

UPDATE characters SET image_path = 'characters/alternate/Zorro-UR_Alt.jpg', updated_at = NOW()
WHERE name = 'Zorro' AND set = 'ERB' AND image_path = 'characters/alternate/zorro.png';

-- 2) Update stored deck/collection image_path references (where present)
DO $$
DECLARE
  col TEXT;
  cols TEXT[] := ARRAY['character_1_image','character_2_image','character_3_image','character_4_image'];
BEGIN
  FOREACH col IN ARRAY cols LOOP
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/angry_mob_industrial_age.webp',
      'characters/alternate/AngryMobIndustrialAge-Alt.jpg',
      '%%characters/alternate/angry_mob_industrial_age.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/angry_mob_middle_ages.jpg',
      'characters/alternate/AngryMobMiddleAge-Alt.jpg',
      '%%characters/alternate/angry_mob_middle_ages.jpg%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/angry_mob_modern_age.webp',
      'characters/alternate/AngryMobModernAge-UR_Alt.jpg',
      '%%characters/alternate/angry_mob_modern_age.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/anubis.png',
      'characters/alternate/Anubis-Alt.jpg',
      '%%characters/alternate/anubis.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/anubis2.png',
      'characters/alternate/Anubis-PrizePack_Alt.jpg',
      '%%characters/alternate/anubis2.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/billy_the_kid.webp',
      'characters/alternate/Billy the Kid-Alt.jpg',
      '%%characters/alternate/billy_the_kid.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/captain_nemo.jpg',
      'characters/alternate/CaptainNemo-PrizePack_Alt.jpg',
      '%%characters/alternate/captain_nemo.jpg%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/carson_of_venus.webp',
      'characters/alternate/Carson of Venus-Alt.jpg',
      '%%characters/alternate/carson_of_venus.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/count_of_monte_cristo.webp',
      'characters/alternate/Count of Monte Critso-Alt.jpg',
      '%%characters/alternate/count_of_monte_cristo.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/cthulhu.webp',
      'characters/alternate/Cthulhu-Alt.jpg',
      '%%characters/alternate/cthulhu.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/cthulhu2.webp',
      'characters/alternate/Cthulhu-UR_Alt.jpg',
      '%%characters/alternate/cthulhu2.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/dejah_thoris.jpg',
      'characters/alternate/Dejah Thoris-Alt.jpg',
      '%%characters/alternate/dejah_thoris.jpg%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/dejah_thoris2.webp',
      'characters/alternate/DejahThoris-UR_Alt.jpg',
      '%%characters/alternate/dejah_thoris2.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/dr. watson.png',
      'characters/alternate/DrWatson-UR_Alt.jpg',
      '%%characters/alternate/dr. watson.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/dracula.png',
      'characters/alternate/Dracula-Alt.jpg',
      '%%characters/alternate/dracula.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/headless_horsman.webp',
      'characters/alternate/HeadlessHorseman-UR_Alt.jpg',
      '%%characters/alternate/headless_horsman.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/hercules.png',
      'characters/alternate/Hercules-Alt_01.jpg',
      '%%characters/alternate/hercules.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/hercules2.png',
      'characters/alternate/Hercules-Alt_02.jpg',
      '%%characters/alternate/hercules2.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/jane_porter.webp',
      'characters/alternate/JanePorter-Alt.jpg',
      '%%characters/alternate/jane_porter.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/jane_porter2.webp',
      'characters/alternate/JanePorter-UR_Alt.jpg',
      '%%characters/alternate/jane_porter2.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/joan_of_arc.webp',
      'characters/alternate/JoanofArc-Alt.jpg',
      '%%characters/alternate/joan_of_arc.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/john_carter_of_mars.webp',
      'characters/alternate/JohnCarterofMars-Alt.jpg',
      '%%characters/alternate/john_carter_of_mars.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/king_arthur.png',
      'characters/alternate/KingArthur-Alt.jpg',
      '%%characters/alternate/king_arthur.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/king_arthur2.png',
      'characters/alternate/KingArthur-UR_Alt.jpg',
      '%%characters/alternate/king_arthur2.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/korak.webp',
      'characters/alternate/Korak-Alt_01.jpg',
      '%%characters/alternate/korak.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/korak2.webp',
      'characters/alternate/Korak-Alt_02.jpg',
      '%%characters/alternate/korak2.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/lancelot.jpg',
      'characters/alternate/Lancelot-UR_Alt.jpg',
      '%%characters/alternate/lancelot.jpg%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/leonidas.png',
      'characters/alternate/Leonidas-Alt.jpg',
      '%%characters/alternate/leonidas.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/merlin.png',
      'characters/alternate/Merlin-Alt.jpg',
      '%%characters/alternate/merlin.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/mina_harker.png',
      'characters/alternate/MinaHarker-Alt.jpg',
      '%%characters/alternate/mina_harker.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/mina_harker2.png',
      'characters/alternate/MinaHarker-UR_Alt.jpg',
      '%%characters/alternate/mina_harker2.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/morgan_le_fay.webp',
      'characters/alternate/MorganleFay-Alt_01.jpg',
      '%%characters/alternate/morgan_le_fay.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/morgan_le_fay2webp.webp',
      'characters/alternate/MorganleFay-Alt_02.jpg',
      '%%characters/alternate/morgan_le_fay2webp.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/mr_hyde.jpg',
      'characters/alternate/MrHyde-UR_Alt.jpg',
      '%%characters/alternate/mr_hyde.jpg%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/poseidon.png',
      'characters/alternate/Poseidon-UR_Alt.jpg',
      '%%characters/alternate/poseidon.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/professor_moriarty.png',
      'characters/alternate/ProfessorMoriarty-Alt.jpg',
      '%%characters/alternate/professor_moriarty.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/robin_hood.png',
      'characters/alternate/RobinHood-Alt.jpg',
      '%%characters/alternate/robin_hood.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/robin_hood2.png',
      'characters/alternate/RobinHood-PrizePack_Alt.jpg',
      '%%characters/alternate/robin_hood2.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/sheriff_of_nottingham.png',
      'characters/alternate/SheriffofNottingham-Alt.jpg',
      '%%characters/alternate/sheriff_of_nottingham.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/sherlock_holmes.webp',
      'characters/alternate/SherlockHolmes-Alt.jpg',
      '%%characters/alternate/sherlock_holmes.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/sherlock_holmes2.jpg',
      'characters/alternate/Sherlock-PrizePack_Alt.jpg',
      '%%characters/alternate/sherlock_holmes2.jpg%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/sun_wukong.png',
      'characters/alternate/SunWukong-UR_Alt.jpg',
      '%%characters/alternate/sun_wukong.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/tars_tarkas.png',
      'characters/alternate/TarsTarkas-Alt.jpg',
      '%%characters/alternate/tars_tarkas.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/tars_tarkas2.webp',
      'characters/alternate/TarsTarkas-PrizePack_Alt.jpg',
      '%%characters/alternate/tars_tarkas2.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/tarzan.webp',
      'characters/alternate/Tarzan-Alt_01.jpg',
      '%%characters/alternate/tarzan.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/tarzan2.webp',
      'characters/alternate/Tarzan-Alt_02.jpg',
      '%%characters/alternate/tarzan2.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/the_mummy.jpg',
      'characters/alternate/Mummy-Alt.jpg',
      '%%characters/alternate/the_mummy.jpg%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/three_musketeers.jpg',
      'characters/alternate/ThreeMusketeers-Alt.jpg',
      '%%characters/alternate/three_musketeers.jpg%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/three_musketeers2.jpg',
      'characters/alternate/ThreeMusketeers-PrizePack_Alt.jpg',
      '%%characters/alternate/three_musketeers2.jpg%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/time_traveler.png',
      'characters/alternate/TimeTraveler-Alt_01.jpg',
      '%%characters/alternate/time_traveler.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/time_traveler2.png',
      'characters/alternate/TimeTraveler-Alt_02.jpg',
      '%%characters/alternate/time_traveler2.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/van_helsing.png',
      'characters/alternate/VanHelsing-Alt.jpg',
      '%%characters/alternate/van_helsing.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/van_helsing2.png',
      'characters/alternate/VanHelsing-PrizePack_Alt.jpg',
      '%%characters/alternate/van_helsing2.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/victory_harben.webp',
      'characters/alternate/VictoryHarben-Alt_01.jpg',
      '%%characters/alternate/victory_harben.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/victory_harben2.webp',
      'characters/alternate/VictoryHarben-Alt_02.jpg',
      '%%characters/alternate/victory_harben2.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/wicked_witch.webp',
      'characters/alternate/WickedWitch-Alt.jpg',
      '%%characters/alternate/wicked_witch.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/zeus.png',
      'characters/alternate/Zeus-UR_Alt.jpg',
      '%%characters/alternate/zeus.png%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/zorro.png',
      'characters/alternate/Zorro-UR_Alt.jpg',
      '%%characters/alternate/zorro.png%%'
    );
  END LOOP;
END $$;

UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/angry_mob_industrial_age.webp', 'characters/alternate/AngryMobIndustrialAge-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/angry_mob_industrial_age.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/angry_mob_middle_ages.jpg', 'characters/alternate/AngryMobMiddleAge-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/angry_mob_middle_ages.jpg%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/angry_mob_modern_age.webp', 'characters/alternate/AngryMobModernAge-UR_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/angry_mob_modern_age.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/anubis.png', 'characters/alternate/Anubis-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/anubis.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/anubis2.png', 'characters/alternate/Anubis-PrizePack_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/anubis2.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/billy_the_kid.webp', 'characters/alternate/Billy the Kid-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/billy_the_kid.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/captain_nemo.jpg', 'characters/alternate/CaptainNemo-PrizePack_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/captain_nemo.jpg%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/carson_of_venus.webp', 'characters/alternate/Carson of Venus-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/carson_of_venus.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/count_of_monte_cristo.webp', 'characters/alternate/Count of Monte Critso-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/count_of_monte_cristo.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/cthulhu.webp', 'characters/alternate/Cthulhu-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/cthulhu.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/cthulhu2.webp', 'characters/alternate/Cthulhu-UR_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/cthulhu2.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/dejah_thoris.jpg', 'characters/alternate/Dejah Thoris-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/dejah_thoris.jpg%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/dejah_thoris2.webp', 'characters/alternate/DejahThoris-UR_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/dejah_thoris2.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/dr. watson.png', 'characters/alternate/DrWatson-UR_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/dr. watson.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/dracula.png', 'characters/alternate/Dracula-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/dracula.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/headless_horsman.webp', 'characters/alternate/HeadlessHorseman-UR_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/headless_horsman.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/hercules.png', 'characters/alternate/Hercules-Alt_01.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/hercules.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/hercules2.png', 'characters/alternate/Hercules-Alt_02.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/hercules2.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/jane_porter.webp', 'characters/alternate/JanePorter-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/jane_porter.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/jane_porter2.webp', 'characters/alternate/JanePorter-UR_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/jane_porter2.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/joan_of_arc.webp', 'characters/alternate/JoanofArc-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/joan_of_arc.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/john_carter_of_mars.webp', 'characters/alternate/JohnCarterofMars-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/john_carter_of_mars.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/king_arthur.png', 'characters/alternate/KingArthur-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/king_arthur.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/king_arthur2.png', 'characters/alternate/KingArthur-UR_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/king_arthur2.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/korak.webp', 'characters/alternate/Korak-Alt_01.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/korak.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/korak2.webp', 'characters/alternate/Korak-Alt_02.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/korak2.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/lancelot.jpg', 'characters/alternate/Lancelot-UR_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/lancelot.jpg%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/leonidas.png', 'characters/alternate/Leonidas-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/leonidas.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/merlin.png', 'characters/alternate/Merlin-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/merlin.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/mina_harker.png', 'characters/alternate/MinaHarker-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/mina_harker.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/mina_harker2.png', 'characters/alternate/MinaHarker-UR_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/mina_harker2.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/morgan_le_fay.webp', 'characters/alternate/MorganleFay-Alt_01.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/morgan_le_fay.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/morgan_le_fay2webp.webp', 'characters/alternate/MorganleFay-Alt_02.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/morgan_le_fay2webp.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/mr_hyde.jpg', 'characters/alternate/MrHyde-UR_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/mr_hyde.jpg%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/poseidon.png', 'characters/alternate/Poseidon-UR_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/poseidon.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/professor_moriarty.png', 'characters/alternate/ProfessorMoriarty-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/professor_moriarty.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/robin_hood.png', 'characters/alternate/RobinHood-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/robin_hood.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/robin_hood2.png', 'characters/alternate/RobinHood-PrizePack_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/robin_hood2.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/sheriff_of_nottingham.png', 'characters/alternate/SheriffofNottingham-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/sheriff_of_nottingham.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/sherlock_holmes.webp', 'characters/alternate/SherlockHolmes-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/sherlock_holmes.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/sherlock_holmes2.jpg', 'characters/alternate/Sherlock-PrizePack_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/sherlock_holmes2.jpg%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/sun_wukong.png', 'characters/alternate/SunWukong-UR_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/sun_wukong.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/tars_tarkas.png', 'characters/alternate/TarsTarkas-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/tars_tarkas.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/tars_tarkas2.webp', 'characters/alternate/TarsTarkas-PrizePack_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/tars_tarkas2.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/tarzan.webp', 'characters/alternate/Tarzan-Alt_01.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/tarzan.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/tarzan2.webp', 'characters/alternate/Tarzan-Alt_02.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/tarzan2.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/the_mummy.jpg', 'characters/alternate/Mummy-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/the_mummy.jpg%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/three_musketeers.jpg', 'characters/alternate/ThreeMusketeers-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/three_musketeers.jpg%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/three_musketeers2.jpg', 'characters/alternate/ThreeMusketeers-PrizePack_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/three_musketeers2.jpg%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/time_traveler.png', 'characters/alternate/TimeTraveler-Alt_01.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/time_traveler.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/time_traveler2.png', 'characters/alternate/TimeTraveler-Alt_02.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/time_traveler2.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/van_helsing.png', 'characters/alternate/VanHelsing-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/van_helsing.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/van_helsing2.png', 'characters/alternate/VanHelsing-PrizePack_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/van_helsing2.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/victory_harben.webp', 'characters/alternate/VictoryHarben-Alt_01.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/victory_harben.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/victory_harben2.webp', 'characters/alternate/VictoryHarben-Alt_02.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/victory_harben2.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/wicked_witch.webp', 'characters/alternate/WickedWitch-Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/wicked_witch.webp%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/zeus.png', 'characters/alternate/Zeus-UR_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/zeus.png%';
UPDATE collection_cards SET image_path = REPLACE(image_path, 'characters/alternate/zorro.png', 'characters/alternate/Zorro-UR_Alt.jpg'), updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/zorro.png%';

-- 3) Safety: ensure we no longer reference deleted filenames (for the remapped set)
DO $$
DECLARE
  remaining INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining FROM characters WHERE image_path IN (
    'characters/alternate/angry_mob_industrial_age.webp',
    'characters/alternate/angry_mob_middle_ages.jpg',
    'characters/alternate/angry_mob_modern_age.webp',
    'characters/alternate/anubis.png',
    'characters/alternate/anubis2.png',
    'characters/alternate/billy_the_kid.webp',
    'characters/alternate/captain_nemo.jpg',
    'characters/alternate/carson_of_venus.webp',
    'characters/alternate/count_of_monte_cristo.webp',
    'characters/alternate/cthulhu.webp',
    'characters/alternate/cthulhu2.webp',
    'characters/alternate/dejah_thoris.jpg',
    'characters/alternate/dejah_thoris2.webp',
    'characters/alternate/dr. watson.png',
    'characters/alternate/dracula.png',
    'characters/alternate/headless_horsman.webp',
    'characters/alternate/hercules.png',
    'characters/alternate/hercules2.png',
    'characters/alternate/jane_porter.webp',
    'characters/alternate/jane_porter2.webp',
    'characters/alternate/joan_of_arc.webp',
    'characters/alternate/john_carter_of_mars.webp',
    'characters/alternate/king_arthur.png',
    'characters/alternate/king_arthur2.png',
    'characters/alternate/korak.webp',
    'characters/alternate/korak2.webp',
    'characters/alternate/lancelot.jpg',
    'characters/alternate/leonidas.png',
    'characters/alternate/merlin.png',
    'characters/alternate/mina_harker.png',
    'characters/alternate/mina_harker2.png',
    'characters/alternate/morgan_le_fay.webp',
    'characters/alternate/morgan_le_fay2webp.webp',
    'characters/alternate/mr_hyde.jpg',
    'characters/alternate/poseidon.png',
    'characters/alternate/professor_moriarty.png',
    'characters/alternate/robin_hood.png',
    'characters/alternate/robin_hood2.png',
    'characters/alternate/sheriff_of_nottingham.png',
    'characters/alternate/sherlock_holmes.webp',
    'characters/alternate/sherlock_holmes2.jpg',
    'characters/alternate/sun_wukong.png',
    'characters/alternate/tars_tarkas.png',
    'characters/alternate/tars_tarkas2.webp',
    'characters/alternate/tarzan.webp',
    'characters/alternate/tarzan2.webp',
    'characters/alternate/the_mummy.jpg',
    'characters/alternate/three_musketeers.jpg',
    'characters/alternate/three_musketeers2.jpg',
    'characters/alternate/time_traveler.png',
    'characters/alternate/time_traveler2.png',
    'characters/alternate/van_helsing.png',
    'characters/alternate/van_helsing2.png',
    'characters/alternate/victory_harben.webp',
    'characters/alternate/victory_harben2.webp',
    'characters/alternate/wicked_witch.webp',
    'characters/alternate/zeus.png',
    'characters/alternate/zorro.png'
  );
  IF remaining <> 0 THEN
    RAISE EXCEPTION 'Found % character rows still referencing old alternate image filenames', remaining;
  END IF;

  SELECT COUNT(*) INTO remaining FROM decks
  WHERE (character_1_image LIKE '%characters/alternate/angry_mob_industrial_age.webp%' OR character_2_image LIKE '%characters/alternate/angry_mob_industrial_age.webp%' OR character_3_image LIKE '%characters/alternate/angry_mob_industrial_age.webp%' OR character_4_image LIKE '%characters/alternate/angry_mob_industrial_age.webp%')
     OR (character_1_image LIKE '%characters/alternate/angry_mob_middle_ages.jpg%' OR character_2_image LIKE '%characters/alternate/angry_mob_middle_ages.jpg%' OR character_3_image LIKE '%characters/alternate/angry_mob_middle_ages.jpg%' OR character_4_image LIKE '%characters/alternate/angry_mob_middle_ages.jpg%')
     OR (character_1_image LIKE '%characters/alternate/angry_mob_modern_age.webp%' OR character_2_image LIKE '%characters/alternate/angry_mob_modern_age.webp%' OR character_3_image LIKE '%characters/alternate/angry_mob_modern_age.webp%' OR character_4_image LIKE '%characters/alternate/angry_mob_modern_age.webp%')
     OR (character_1_image LIKE '%characters/alternate/anubis.png%' OR character_2_image LIKE '%characters/alternate/anubis.png%' OR character_3_image LIKE '%characters/alternate/anubis.png%' OR character_4_image LIKE '%characters/alternate/anubis.png%')
     OR (character_1_image LIKE '%characters/alternate/anubis2.png%' OR character_2_image LIKE '%characters/alternate/anubis2.png%' OR character_3_image LIKE '%characters/alternate/anubis2.png%' OR character_4_image LIKE '%characters/alternate/anubis2.png%')
     OR (character_1_image LIKE '%characters/alternate/billy_the_kid.webp%' OR character_2_image LIKE '%characters/alternate/billy_the_kid.webp%' OR character_3_image LIKE '%characters/alternate/billy_the_kid.webp%' OR character_4_image LIKE '%characters/alternate/billy_the_kid.webp%')
     OR (character_1_image LIKE '%characters/alternate/captain_nemo.jpg%' OR character_2_image LIKE '%characters/alternate/captain_nemo.jpg%' OR character_3_image LIKE '%characters/alternate/captain_nemo.jpg%' OR character_4_image LIKE '%characters/alternate/captain_nemo.jpg%')
     OR (character_1_image LIKE '%characters/alternate/carson_of_venus.webp%' OR character_2_image LIKE '%characters/alternate/carson_of_venus.webp%' OR character_3_image LIKE '%characters/alternate/carson_of_venus.webp%' OR character_4_image LIKE '%characters/alternate/carson_of_venus.webp%')
     OR (character_1_image LIKE '%characters/alternate/count_of_monte_cristo.webp%' OR character_2_image LIKE '%characters/alternate/count_of_monte_cristo.webp%' OR character_3_image LIKE '%characters/alternate/count_of_monte_cristo.webp%' OR character_4_image LIKE '%characters/alternate/count_of_monte_cristo.webp%')
     OR (character_1_image LIKE '%characters/alternate/cthulhu.webp%' OR character_2_image LIKE '%characters/alternate/cthulhu.webp%' OR character_3_image LIKE '%characters/alternate/cthulhu.webp%' OR character_4_image LIKE '%characters/alternate/cthulhu.webp%')
     OR (character_1_image LIKE '%characters/alternate/cthulhu2.webp%' OR character_2_image LIKE '%characters/alternate/cthulhu2.webp%' OR character_3_image LIKE '%characters/alternate/cthulhu2.webp%' OR character_4_image LIKE '%characters/alternate/cthulhu2.webp%')
     OR (character_1_image LIKE '%characters/alternate/dejah_thoris.jpg%' OR character_2_image LIKE '%characters/alternate/dejah_thoris.jpg%' OR character_3_image LIKE '%characters/alternate/dejah_thoris.jpg%' OR character_4_image LIKE '%characters/alternate/dejah_thoris.jpg%')
     OR (character_1_image LIKE '%characters/alternate/dejah_thoris2.webp%' OR character_2_image LIKE '%characters/alternate/dejah_thoris2.webp%' OR character_3_image LIKE '%characters/alternate/dejah_thoris2.webp%' OR character_4_image LIKE '%characters/alternate/dejah_thoris2.webp%')
     OR (character_1_image LIKE '%characters/alternate/dr. watson.png%' OR character_2_image LIKE '%characters/alternate/dr. watson.png%' OR character_3_image LIKE '%characters/alternate/dr. watson.png%' OR character_4_image LIKE '%characters/alternate/dr. watson.png%')
     OR (character_1_image LIKE '%characters/alternate/dracula.png%' OR character_2_image LIKE '%characters/alternate/dracula.png%' OR character_3_image LIKE '%characters/alternate/dracula.png%' OR character_4_image LIKE '%characters/alternate/dracula.png%')
     OR (character_1_image LIKE '%characters/alternate/headless_horsman.webp%' OR character_2_image LIKE '%characters/alternate/headless_horsman.webp%' OR character_3_image LIKE '%characters/alternate/headless_horsman.webp%' OR character_4_image LIKE '%characters/alternate/headless_horsman.webp%')
     OR (character_1_image LIKE '%characters/alternate/hercules.png%' OR character_2_image LIKE '%characters/alternate/hercules.png%' OR character_3_image LIKE '%characters/alternate/hercules.png%' OR character_4_image LIKE '%characters/alternate/hercules.png%')
     OR (character_1_image LIKE '%characters/alternate/hercules2.png%' OR character_2_image LIKE '%characters/alternate/hercules2.png%' OR character_3_image LIKE '%characters/alternate/hercules2.png%' OR character_4_image LIKE '%characters/alternate/hercules2.png%')
     OR (character_1_image LIKE '%characters/alternate/jane_porter.webp%' OR character_2_image LIKE '%characters/alternate/jane_porter.webp%' OR character_3_image LIKE '%characters/alternate/jane_porter.webp%' OR character_4_image LIKE '%characters/alternate/jane_porter.webp%')
     OR (character_1_image LIKE '%characters/alternate/jane_porter2.webp%' OR character_2_image LIKE '%characters/alternate/jane_porter2.webp%' OR character_3_image LIKE '%characters/alternate/jane_porter2.webp%' OR character_4_image LIKE '%characters/alternate/jane_porter2.webp%')
     OR (character_1_image LIKE '%characters/alternate/joan_of_arc.webp%' OR character_2_image LIKE '%characters/alternate/joan_of_arc.webp%' OR character_3_image LIKE '%characters/alternate/joan_of_arc.webp%' OR character_4_image LIKE '%characters/alternate/joan_of_arc.webp%')
     OR (character_1_image LIKE '%characters/alternate/john_carter_of_mars.webp%' OR character_2_image LIKE '%characters/alternate/john_carter_of_mars.webp%' OR character_3_image LIKE '%characters/alternate/john_carter_of_mars.webp%' OR character_4_image LIKE '%characters/alternate/john_carter_of_mars.webp%')
     OR (character_1_image LIKE '%characters/alternate/king_arthur.png%' OR character_2_image LIKE '%characters/alternate/king_arthur.png%' OR character_3_image LIKE '%characters/alternate/king_arthur.png%' OR character_4_image LIKE '%characters/alternate/king_arthur.png%')
     OR (character_1_image LIKE '%characters/alternate/king_arthur2.png%' OR character_2_image LIKE '%characters/alternate/king_arthur2.png%' OR character_3_image LIKE '%characters/alternate/king_arthur2.png%' OR character_4_image LIKE '%characters/alternate/king_arthur2.png%')
     OR (character_1_image LIKE '%characters/alternate/korak.webp%' OR character_2_image LIKE '%characters/alternate/korak.webp%' OR character_3_image LIKE '%characters/alternate/korak.webp%' OR character_4_image LIKE '%characters/alternate/korak.webp%')
     OR (character_1_image LIKE '%characters/alternate/korak2.webp%' OR character_2_image LIKE '%characters/alternate/korak2.webp%' OR character_3_image LIKE '%characters/alternate/korak2.webp%' OR character_4_image LIKE '%characters/alternate/korak2.webp%')
     OR (character_1_image LIKE '%characters/alternate/lancelot.jpg%' OR character_2_image LIKE '%characters/alternate/lancelot.jpg%' OR character_3_image LIKE '%characters/alternate/lancelot.jpg%' OR character_4_image LIKE '%characters/alternate/lancelot.jpg%')
     OR (character_1_image LIKE '%characters/alternate/leonidas.png%' OR character_2_image LIKE '%characters/alternate/leonidas.png%' OR character_3_image LIKE '%characters/alternate/leonidas.png%' OR character_4_image LIKE '%characters/alternate/leonidas.png%')
     OR (character_1_image LIKE '%characters/alternate/merlin.png%' OR character_2_image LIKE '%characters/alternate/merlin.png%' OR character_3_image LIKE '%characters/alternate/merlin.png%' OR character_4_image LIKE '%characters/alternate/merlin.png%')
     OR (character_1_image LIKE '%characters/alternate/mina_harker.png%' OR character_2_image LIKE '%characters/alternate/mina_harker.png%' OR character_3_image LIKE '%characters/alternate/mina_harker.png%' OR character_4_image LIKE '%characters/alternate/mina_harker.png%')
     OR (character_1_image LIKE '%characters/alternate/mina_harker2.png%' OR character_2_image LIKE '%characters/alternate/mina_harker2.png%' OR character_3_image LIKE '%characters/alternate/mina_harker2.png%' OR character_4_image LIKE '%characters/alternate/mina_harker2.png%')
     OR (character_1_image LIKE '%characters/alternate/morgan_le_fay.webp%' OR character_2_image LIKE '%characters/alternate/morgan_le_fay.webp%' OR character_3_image LIKE '%characters/alternate/morgan_le_fay.webp%' OR character_4_image LIKE '%characters/alternate/morgan_le_fay.webp%')
     OR (character_1_image LIKE '%characters/alternate/morgan_le_fay2webp.webp%' OR character_2_image LIKE '%characters/alternate/morgan_le_fay2webp.webp%' OR character_3_image LIKE '%characters/alternate/morgan_le_fay2webp.webp%' OR character_4_image LIKE '%characters/alternate/morgan_le_fay2webp.webp%')
     OR (character_1_image LIKE '%characters/alternate/mr_hyde.jpg%' OR character_2_image LIKE '%characters/alternate/mr_hyde.jpg%' OR character_3_image LIKE '%characters/alternate/mr_hyde.jpg%' OR character_4_image LIKE '%characters/alternate/mr_hyde.jpg%')
     OR (character_1_image LIKE '%characters/alternate/poseidon.png%' OR character_2_image LIKE '%characters/alternate/poseidon.png%' OR character_3_image LIKE '%characters/alternate/poseidon.png%' OR character_4_image LIKE '%characters/alternate/poseidon.png%')
     OR (character_1_image LIKE '%characters/alternate/professor_moriarty.png%' OR character_2_image LIKE '%characters/alternate/professor_moriarty.png%' OR character_3_image LIKE '%characters/alternate/professor_moriarty.png%' OR character_4_image LIKE '%characters/alternate/professor_moriarty.png%')
     OR (character_1_image LIKE '%characters/alternate/robin_hood.png%' OR character_2_image LIKE '%characters/alternate/robin_hood.png%' OR character_3_image LIKE '%characters/alternate/robin_hood.png%' OR character_4_image LIKE '%characters/alternate/robin_hood.png%')
     OR (character_1_image LIKE '%characters/alternate/robin_hood2.png%' OR character_2_image LIKE '%characters/alternate/robin_hood2.png%' OR character_3_image LIKE '%characters/alternate/robin_hood2.png%' OR character_4_image LIKE '%characters/alternate/robin_hood2.png%')
     OR (character_1_image LIKE '%characters/alternate/sheriff_of_nottingham.png%' OR character_2_image LIKE '%characters/alternate/sheriff_of_nottingham.png%' OR character_3_image LIKE '%characters/alternate/sheriff_of_nottingham.png%' OR character_4_image LIKE '%characters/alternate/sheriff_of_nottingham.png%')
     OR (character_1_image LIKE '%characters/alternate/sherlock_holmes.webp%' OR character_2_image LIKE '%characters/alternate/sherlock_holmes.webp%' OR character_3_image LIKE '%characters/alternate/sherlock_holmes.webp%' OR character_4_image LIKE '%characters/alternate/sherlock_holmes.webp%')
     OR (character_1_image LIKE '%characters/alternate/sherlock_holmes2.jpg%' OR character_2_image LIKE '%characters/alternate/sherlock_holmes2.jpg%' OR character_3_image LIKE '%characters/alternate/sherlock_holmes2.jpg%' OR character_4_image LIKE '%characters/alternate/sherlock_holmes2.jpg%')
     OR (character_1_image LIKE '%characters/alternate/sun_wukong.png%' OR character_2_image LIKE '%characters/alternate/sun_wukong.png%' OR character_3_image LIKE '%characters/alternate/sun_wukong.png%' OR character_4_image LIKE '%characters/alternate/sun_wukong.png%')
     OR (character_1_image LIKE '%characters/alternate/tars_tarkas.png%' OR character_2_image LIKE '%characters/alternate/tars_tarkas.png%' OR character_3_image LIKE '%characters/alternate/tars_tarkas.png%' OR character_4_image LIKE '%characters/alternate/tars_tarkas.png%')
     OR (character_1_image LIKE '%characters/alternate/tars_tarkas2.webp%' OR character_2_image LIKE '%characters/alternate/tars_tarkas2.webp%' OR character_3_image LIKE '%characters/alternate/tars_tarkas2.webp%' OR character_4_image LIKE '%characters/alternate/tars_tarkas2.webp%')
     OR (character_1_image LIKE '%characters/alternate/tarzan.webp%' OR character_2_image LIKE '%characters/alternate/tarzan.webp%' OR character_3_image LIKE '%characters/alternate/tarzan.webp%' OR character_4_image LIKE '%characters/alternate/tarzan.webp%')
     OR (character_1_image LIKE '%characters/alternate/tarzan2.webp%' OR character_2_image LIKE '%characters/alternate/tarzan2.webp%' OR character_3_image LIKE '%characters/alternate/tarzan2.webp%' OR character_4_image LIKE '%characters/alternate/tarzan2.webp%')
     OR (character_1_image LIKE '%characters/alternate/the_mummy.jpg%' OR character_2_image LIKE '%characters/alternate/the_mummy.jpg%' OR character_3_image LIKE '%characters/alternate/the_mummy.jpg%' OR character_4_image LIKE '%characters/alternate/the_mummy.jpg%')
     OR (character_1_image LIKE '%characters/alternate/three_musketeers.jpg%' OR character_2_image LIKE '%characters/alternate/three_musketeers.jpg%' OR character_3_image LIKE '%characters/alternate/three_musketeers.jpg%' OR character_4_image LIKE '%characters/alternate/three_musketeers.jpg%')
     OR (character_1_image LIKE '%characters/alternate/three_musketeers2.jpg%' OR character_2_image LIKE '%characters/alternate/three_musketeers2.jpg%' OR character_3_image LIKE '%characters/alternate/three_musketeers2.jpg%' OR character_4_image LIKE '%characters/alternate/three_musketeers2.jpg%')
     OR (character_1_image LIKE '%characters/alternate/time_traveler.png%' OR character_2_image LIKE '%characters/alternate/time_traveler.png%' OR character_3_image LIKE '%characters/alternate/time_traveler.png%' OR character_4_image LIKE '%characters/alternate/time_traveler.png%')
     OR (character_1_image LIKE '%characters/alternate/time_traveler2.png%' OR character_2_image LIKE '%characters/alternate/time_traveler2.png%' OR character_3_image LIKE '%characters/alternate/time_traveler2.png%' OR character_4_image LIKE '%characters/alternate/time_traveler2.png%')
     OR (character_1_image LIKE '%characters/alternate/van_helsing.png%' OR character_2_image LIKE '%characters/alternate/van_helsing.png%' OR character_3_image LIKE '%characters/alternate/van_helsing.png%' OR character_4_image LIKE '%characters/alternate/van_helsing.png%')
     OR (character_1_image LIKE '%characters/alternate/van_helsing2.png%' OR character_2_image LIKE '%characters/alternate/van_helsing2.png%' OR character_3_image LIKE '%characters/alternate/van_helsing2.png%' OR character_4_image LIKE '%characters/alternate/van_helsing2.png%')
     OR (character_1_image LIKE '%characters/alternate/victory_harben.webp%' OR character_2_image LIKE '%characters/alternate/victory_harben.webp%' OR character_3_image LIKE '%characters/alternate/victory_harben.webp%' OR character_4_image LIKE '%characters/alternate/victory_harben.webp%')
     OR (character_1_image LIKE '%characters/alternate/victory_harben2.webp%' OR character_2_image LIKE '%characters/alternate/victory_harben2.webp%' OR character_3_image LIKE '%characters/alternate/victory_harben2.webp%' OR character_4_image LIKE '%characters/alternate/victory_harben2.webp%')
     OR (character_1_image LIKE '%characters/alternate/wicked_witch.webp%' OR character_2_image LIKE '%characters/alternate/wicked_witch.webp%' OR character_3_image LIKE '%characters/alternate/wicked_witch.webp%' OR character_4_image LIKE '%characters/alternate/wicked_witch.webp%')
     OR (character_1_image LIKE '%characters/alternate/zeus.png%' OR character_2_image LIKE '%characters/alternate/zeus.png%' OR character_3_image LIKE '%characters/alternate/zeus.png%' OR character_4_image LIKE '%characters/alternate/zeus.png%')
     OR (character_1_image LIKE '%characters/alternate/zorro.png%' OR character_2_image LIKE '%characters/alternate/zorro.png%' OR character_3_image LIKE '%characters/alternate/zorro.png%' OR character_4_image LIKE '%characters/alternate/zorro.png%');
  IF remaining <> 0 THEN
    RAISE EXCEPTION 'Found % decks still referencing old alternate image filenames', remaining;
  END IF;

  SELECT COUNT(*) INTO remaining FROM collection_cards
  WHERE image_path LIKE '%characters/alternate/angry_mob_industrial_age.webp%'
     OR image_path LIKE '%characters/alternate/angry_mob_middle_ages.jpg%'
     OR image_path LIKE '%characters/alternate/angry_mob_modern_age.webp%'
     OR image_path LIKE '%characters/alternate/anubis.png%'
     OR image_path LIKE '%characters/alternate/anubis2.png%'
     OR image_path LIKE '%characters/alternate/billy_the_kid.webp%'
     OR image_path LIKE '%characters/alternate/captain_nemo.jpg%'
     OR image_path LIKE '%characters/alternate/carson_of_venus.webp%'
     OR image_path LIKE '%characters/alternate/count_of_monte_cristo.webp%'
     OR image_path LIKE '%characters/alternate/cthulhu.webp%'
     OR image_path LIKE '%characters/alternate/cthulhu2.webp%'
     OR image_path LIKE '%characters/alternate/dejah_thoris.jpg%'
     OR image_path LIKE '%characters/alternate/dejah_thoris2.webp%'
     OR image_path LIKE '%characters/alternate/dr. watson.png%'
     OR image_path LIKE '%characters/alternate/dracula.png%'
     OR image_path LIKE '%characters/alternate/headless_horsman.webp%'
     OR image_path LIKE '%characters/alternate/hercules.png%'
     OR image_path LIKE '%characters/alternate/hercules2.png%'
     OR image_path LIKE '%characters/alternate/jane_porter.webp%'
     OR image_path LIKE '%characters/alternate/jane_porter2.webp%'
     OR image_path LIKE '%characters/alternate/joan_of_arc.webp%'
     OR image_path LIKE '%characters/alternate/john_carter_of_mars.webp%'
     OR image_path LIKE '%characters/alternate/king_arthur.png%'
     OR image_path LIKE '%characters/alternate/king_arthur2.png%'
     OR image_path LIKE '%characters/alternate/korak.webp%'
     OR image_path LIKE '%characters/alternate/korak2.webp%'
     OR image_path LIKE '%characters/alternate/lancelot.jpg%'
     OR image_path LIKE '%characters/alternate/leonidas.png%'
     OR image_path LIKE '%characters/alternate/merlin.png%'
     OR image_path LIKE '%characters/alternate/mina_harker.png%'
     OR image_path LIKE '%characters/alternate/mina_harker2.png%'
     OR image_path LIKE '%characters/alternate/morgan_le_fay.webp%'
     OR image_path LIKE '%characters/alternate/morgan_le_fay2webp.webp%'
     OR image_path LIKE '%characters/alternate/mr_hyde.jpg%'
     OR image_path LIKE '%characters/alternate/poseidon.png%'
     OR image_path LIKE '%characters/alternate/professor_moriarty.png%'
     OR image_path LIKE '%characters/alternate/robin_hood.png%'
     OR image_path LIKE '%characters/alternate/robin_hood2.png%'
     OR image_path LIKE '%characters/alternate/sheriff_of_nottingham.png%'
     OR image_path LIKE '%characters/alternate/sherlock_holmes.webp%'
     OR image_path LIKE '%characters/alternate/sherlock_holmes2.jpg%'
     OR image_path LIKE '%characters/alternate/sun_wukong.png%'
     OR image_path LIKE '%characters/alternate/tars_tarkas.png%'
     OR image_path LIKE '%characters/alternate/tars_tarkas2.webp%'
     OR image_path LIKE '%characters/alternate/tarzan.webp%'
     OR image_path LIKE '%characters/alternate/tarzan2.webp%'
     OR image_path LIKE '%characters/alternate/the_mummy.jpg%'
     OR image_path LIKE '%characters/alternate/three_musketeers.jpg%'
     OR image_path LIKE '%characters/alternate/three_musketeers2.jpg%'
     OR image_path LIKE '%characters/alternate/time_traveler.png%'
     OR image_path LIKE '%characters/alternate/time_traveler2.png%'
     OR image_path LIKE '%characters/alternate/van_helsing.png%'
     OR image_path LIKE '%characters/alternate/van_helsing2.png%'
     OR image_path LIKE '%characters/alternate/victory_harben.webp%'
     OR image_path LIKE '%characters/alternate/victory_harben2.webp%'
     OR image_path LIKE '%characters/alternate/wicked_witch.webp%'
     OR image_path LIKE '%characters/alternate/zeus.png%'
     OR image_path LIKE '%characters/alternate/zorro.png%';
  IF remaining <> 0 THEN
    RAISE EXCEPTION 'Found % collection_cards still referencing old alternate image filenames', remaining;
  END IF;
END $$;


-- Update deck_cards.selected_alternate_image and decks.character_*_image
-- to match new PNG/JPG filenames for alternate character images

-- Helper: update selected_alternate_image in deck_cards
UPDATE deck_cards
SET selected_alternate_image = REPLACE(selected_alternate_image, 'dracula.webp', 'dracula.png')
WHERE selected_alternate_image LIKE '%dracula.webp';

UPDATE deck_cards SET selected_alternate_image = REPLACE(selected_alternate_image, 'hercules.webp', 'hercules.png') WHERE selected_alternate_image LIKE '%hercules.webp';
UPDATE deck_cards SET selected_alternate_image = REPLACE(selected_alternate_image, 'hercules2.webp', 'hercules2.png') WHERE selected_alternate_image LIKE '%hercules2.webp';
UPDATE deck_cards SET selected_alternate_image = REPLACE(selected_alternate_image, 'leonidas.webp', 'leonidas.png') WHERE selected_alternate_image LIKE '%leonidas.webp';
UPDATE deck_cards SET selected_alternate_image = REPLACE(selected_alternate_image, 'mina_harker.webp', 'mina_harker.png') WHERE selected_alternate_image LIKE '%mina_harker.webp';
UPDATE deck_cards SET selected_alternate_image = REPLACE(selected_alternate_image, 'mina_harker2.webp', 'mina_harker2.png') WHERE selected_alternate_image LIKE '%mina_harker2.webp';
UPDATE deck_cards SET selected_alternate_image = REPLACE(selected_alternate_image, 'poseidon.webp', 'poseidon.png') WHERE selected_alternate_image LIKE '%poseidon.webp';
UPDATE deck_cards SET selected_alternate_image = REPLACE(selected_alternate_image, 'professor_moriarty.webp', 'professor_moriarty.png') WHERE selected_alternate_image LIKE '%professor_moriarty.webp';
UPDATE deck_cards SET selected_alternate_image = REPLACE(selected_alternate_image, 'robin_hood.webp', 'robin_hood.png') WHERE selected_alternate_image LIKE '%robin_hood.webp';
UPDATE deck_cards SET selected_alternate_image = REPLACE(selected_alternate_image, 'robin_hood2.webp', 'robin_hood2.png') WHERE selected_alternate_image LIKE '%robin_hood2.webp';
UPDATE deck_cards SET selected_alternate_image = REPLACE(selected_alternate_image, 'sheriff_of_nottingham.webp', 'sheriff_of_nottingham.png') WHERE selected_alternate_image LIKE '%sheriff_of_nottingham.webp';
UPDATE deck_cards SET selected_alternate_image = REPLACE(selected_alternate_image, 'sun_wukong.webp', 'sun_wukong.png') WHERE selected_alternate_image LIKE '%sun_wukong.webp';
UPDATE deck_cards SET selected_alternate_image = REPLACE(selected_alternate_image, 'tars_tarkas.webp', 'tars_tarkas.png') WHERE selected_alternate_image LIKE '%tars_tarkas.webp';
UPDATE deck_cards SET selected_alternate_image = REPLACE(selected_alternate_image, 'three_musketeers.webp', 'three_musketeers.png') WHERE selected_alternate_image LIKE '%three_musketeers.webp';
UPDATE deck_cards SET selected_alternate_image = REPLACE(selected_alternate_image, 'time_traveler.webp', 'time_traveler.png') WHERE selected_alternate_image LIKE '%time_traveler.webp';
UPDATE deck_cards SET selected_alternate_image = REPLACE(selected_alternate_image, 'time_traveler2.webp', 'time_traveler2.png') WHERE selected_alternate_image LIKE '%time_traveler2.webp';
UPDATE deck_cards SET selected_alternate_image = REPLACE(selected_alternate_image, 'van_helsing.webp', 'van_helsing.png') WHERE selected_alternate_image LIKE '%van_helsing.webp';
UPDATE deck_cards SET selected_alternate_image = REPLACE(selected_alternate_image, 'van_helsing2.webp', 'van_helsing2.png') WHERE selected_alternate_image LIKE '%van_helsing2.webp';
UPDATE deck_cards SET selected_alternate_image = REPLACE(selected_alternate_image, 'zeus.webp', 'zeus.png') WHERE selected_alternate_image LIKE '%zeus.webp';
UPDATE deck_cards SET selected_alternate_image = REPLACE(selected_alternate_image, 'zorro.webp', 'zorro.png') WHERE selected_alternate_image LIKE '%zorro.webp';
UPDATE deck_cards SET selected_alternate_image = REPLACE(selected_alternate_image, 'anubis.webp', 'anubis.png') WHERE selected_alternate_image LIKE '%anubis.webp';

-- Mirror updates in decks.character_N_image columns
UPDATE decks SET character_1_image = REPLACE(character_1_image, 'dracula.webp', 'dracula.png') WHERE character_1_image LIKE '%dracula.webp';
UPDATE decks SET character_2_image = REPLACE(character_2_image, 'dracula.webp', 'dracula.png') WHERE character_2_image LIKE '%dracula.webp';
UPDATE decks SET character_3_image = REPLACE(character_3_image, 'dracula.webp', 'dracula.png') WHERE character_3_image LIKE '%dracula.webp';
UPDATE decks SET character_4_image = REPLACE(character_4_image, 'dracula.webp', 'dracula.png') WHERE character_4_image LIKE '%dracula.webp';

-- Bulk replacements for each affected basename across all four columns
DO $$
DECLARE col TEXT;
BEGIN
  FOR col IN SELECT unnest(ARRAY['character_1_image','character_2_image','character_3_image','character_4_image']) LOOP
    EXECUTE format('UPDATE decks SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', col, col, 'hercules.webp', 'hercules.png', col, '%%hercules.webp');
    EXECUTE format('UPDATE decks SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', col, col, 'hercules2.webp', 'hercules2.png', col, '%%hercules2.webp');
    EXECUTE format('UPDATE decks SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', col, col, 'leonidas.webp', 'leonidas.png', col, '%%leonidas.webp');
    EXECUTE format('UPDATE decks SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', col, col, 'mina_harker.webp', 'mina_harker.png', col, '%%mina_harker.webp');
    EXECUTE format('UPDATE decks SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', col, col, 'mina_harker2.webp', 'mina_harker2.png', col, '%%mina_harker2.webp');
    EXECUTE format('UPDATE decks SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', col, col, 'poseidon.webp', 'poseidon.png', col, '%%poseidon.webp');
    EXECUTE format('UPDATE decks SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', col, col, 'professor_moriarty.webp', 'professor_moriarty.png', col, '%%professor_moriarty.webp');
    EXECUTE format('UPDATE decks SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', col, col, 'robin_hood.webp', 'robin_hood.png', col, '%%robin_hood.webp');
    EXECUTE format('UPDATE decks SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', col, col, 'robin_hood2.webp', 'robin_hood2.png', col, '%%robin_hood2.webp');
    EXECUTE format('UPDATE decks SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', col, col, 'sheriff_of_nottingham.webp', 'sheriff_of_nottingham.png', col, '%%sheriff_of_nottingham.webp');
    EXECUTE format('UPDATE decks SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', col, col, 'sun_wukong.webp', 'sun_wukong.png', col, '%%sun_wukong.webp');
    EXECUTE format('UPDATE decks SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', col, col, 'tars_tarkas.webp', 'tars_tarkas.png', col, '%%tars_tarkas.webp');
    EXECUTE format('UPDATE decks SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', col, col, 'three_musketeers.webp', 'three_musketeers.png', col, '%%three_musketeers.webp');
    EXECUTE format('UPDATE decks SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', col, col, 'time_traveler.webp', 'time_traveler.png', col, '%%time_traveler.webp');
    EXECUTE format('UPDATE decks SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', col, col, 'time_traveler2.webp', 'time_traveler2.png', col, '%%time_traveler2.webp');
    EXECUTE format('UPDATE decks SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', col, col, 'van_helsing.webp', 'van_helsing.png', col, '%%van_helsing.webp');
    EXECUTE format('UPDATE decks SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', col, col, 'van_helsing2.webp', 'van_helsing2.png', col, '%%van_helsing2.webp');
    EXECUTE format('UPDATE decks SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', col, col, 'zeus.webp', 'zeus.png', col, '%%zeus.webp');
    EXECUTE format('UPDATE decks SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', col, col, 'zorro.webp', 'zorro.png', col, '%%zorro.webp');
    EXECUTE format('UPDATE decks SET %I = REPLACE(%I, %L, %L) WHERE %I LIKE %L', col, col, 'anubis.webp', 'anubis.png', col, '%%anubis.webp');
  END LOOP;
END$$;

-- Touch decks updated_at when any image columns change
UPDATE decks
SET updated_at = NOW()
WHERE character_1_image LIKE '%.png' OR character_2_image LIKE '%.png' OR character_3_image LIKE '%.png' OR character_4_image LIKE '%.png';


-- Add / update character alternate art images (ERB)
--
-- Alternate character art is represented as separate rows in `characters`
-- with `image_path` under `characters/alternate/...`.
-- This migration:
-- 1) Updates existing alternate rows in-place to preserve deck/collection selections
-- 2) Inserts new alternate rows for newly added assets (copying base character stats)
-- 3) Updates any stored deck/collection image_path references to renamed files
-- 4) Fails loudly if expected base rows are missing or if old filenames remain referenced

DO $$
DECLARE
  missing_base_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_base_count
  FROM (
    VALUES
      ('Captain Nemo'::text, 'ERB'::text),
      ('Dracula'::text, 'ERB'::text),
      ('Mr. Hyde'::text, 'ERB'::text),
      ('Sherlock Holmes'::text, 'ERB'::text),
      ('The Three Musketeers'::text, 'ERB'::text)
  ) AS expected(name, set)
  WHERE NOT EXISTS (
    SELECT 1
    FROM characters c
    WHERE c.name = expected.name
      AND c.set = expected.set
      AND (c.image_path NOT LIKE '%/alternate/%' OR c.image_path IS NULL)
  );

  IF missing_base_count <> 0 THEN
    RAISE EXCEPTION 'Missing base character rows for % expected characters in ERB', missing_base_count;
  END IF;
END $$;

-- 1) Update existing alternate rows in-place (preserve selections)
UPDATE characters
SET image_path = 'characters/alternate/dracula2.jpg',
    updated_at = NOW()
WHERE name = 'Dracula'
  AND set = 'ERB'
  AND image_path = 'characters/alternate/dracula2.webp';

UPDATE characters
SET image_path = 'characters/alternate/mr_hyde.jpg',
    updated_at = NOW()
WHERE name = 'Mr. Hyde'
  AND set = 'ERB'
  AND image_path = 'characters/alternate/mr_hyde.webp';

-- Some environments may still have the older Three Musketeers alternate as .png
UPDATE characters
SET image_path = 'characters/alternate/three_musketeers.jpg',
    updated_at = NOW()
WHERE name = 'The Three Musketeers'
  AND set = 'ERB'
  AND image_path = 'characters/alternate/three_musketeers.png';

-- 2) Insert new alternate rows (copy base character stats)
-- Captain Nemo: add one new alternate
INSERT INTO characters (
  id, name, set, description, energy, combat, brute_force, intelligence,
  image_path, created_at, updated_at, threat_level, special_abilities, set_number, set_number_foil
)
SELECT
  gen_random_uuid(),
  c.name, c.set, c.description, c.energy, c.combat, c.brute_force, c.intelligence,
  'characters/alternate/captain_nemo.jpg',
  c.created_at,
  NOW(),
  c.threat_level,
  c.special_abilities,
  c.set_number,
  c.set_number_foil
FROM characters c
WHERE c.name = 'Captain Nemo'
  AND c.set = 'ERB'
  AND (c.image_path NOT LIKE '%/alternate/%' OR c.image_path IS NULL)
  AND NOT EXISTS (
    SELECT 1 FROM characters x
    WHERE x.name = c.name AND x.set = c.set AND x.image_path = 'characters/alternate/captain_nemo.jpg'
  )
LIMIT 1;

-- Sherlock Holmes: add second alternate
INSERT INTO characters (
  id, name, set, description, energy, combat, brute_force, intelligence,
  image_path, created_at, updated_at, threat_level, special_abilities, set_number, set_number_foil
)
SELECT
  gen_random_uuid(),
  c.name, c.set, c.description, c.energy, c.combat, c.brute_force, c.intelligence,
  'characters/alternate/sherlock_holmes2.jpg',
  c.created_at,
  NOW(),
  c.threat_level,
  c.special_abilities,
  c.set_number,
  c.set_number_foil
FROM characters c
WHERE c.name = 'Sherlock Holmes'
  AND c.set = 'ERB'
  AND (c.image_path NOT LIKE '%/alternate/%' OR c.image_path IS NULL)
  AND NOT EXISTS (
    SELECT 1 FROM characters x
    WHERE x.name = c.name AND x.set = c.set AND x.image_path = 'characters/alternate/sherlock_holmes2.jpg'
  )
LIMIT 1;

-- The Three Musketeers: add two alternates (first and second)
INSERT INTO characters (
  id, name, set, description, energy, combat, brute_force, intelligence,
  image_path, created_at, updated_at, threat_level, special_abilities, set_number, set_number_foil
)
SELECT
  gen_random_uuid(),
  c.name, c.set, c.description, c.energy, c.combat, c.brute_force, c.intelligence,
  'characters/alternate/three_musketeers.jpg',
  c.created_at,
  NOW(),
  c.threat_level,
  c.special_abilities,
  c.set_number,
  c.set_number_foil
FROM characters c
WHERE c.name = 'The Three Musketeers'
  AND c.set = 'ERB'
  AND (c.image_path NOT LIKE '%/alternate/%' OR c.image_path IS NULL)
  AND NOT EXISTS (
    SELECT 1 FROM characters x
    WHERE x.name = c.name AND x.set = c.set AND x.image_path = 'characters/alternate/three_musketeers.jpg'
  )
LIMIT 1;

INSERT INTO characters (
  id, name, set, description, energy, combat, brute_force, intelligence,
  image_path, created_at, updated_at, threat_level, special_abilities, set_number, set_number_foil
)
SELECT
  gen_random_uuid(),
  c.name, c.set, c.description, c.energy, c.combat, c.brute_force, c.intelligence,
  'characters/alternate/three_musketeers2.jpg',
  c.created_at,
  NOW(),
  c.threat_level,
  c.special_abilities,
  c.set_number,
  c.set_number_foil
FROM characters c
WHERE c.name = 'The Three Musketeers'
  AND c.set = 'ERB'
  AND (c.image_path NOT LIKE '%/alternate/%' OR c.image_path IS NULL)
  AND NOT EXISTS (
    SELECT 1 FROM characters x
    WHERE x.name = c.name AND x.set = c.set AND x.image_path = 'characters/alternate/three_musketeers2.jpg'
  )
LIMIT 1;

-- 3) Update stored deck/collection image_path references (where present)
DO $$
DECLARE
  col TEXT;
  cols TEXT[] := ARRAY['character_1_image','character_2_image','character_3_image','character_4_image'];
BEGIN
  FOREACH col IN ARRAY cols LOOP
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/dracula2.webp',
      'characters/alternate/dracula2.jpg',
      '%%characters/alternate/dracula2.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/mr_hyde.webp',
      'characters/alternate/mr_hyde.jpg',
      '%%characters/alternate/mr_hyde.webp%%'
    );
    EXECUTE format(
      'UPDATE decks SET %1$I = REPLACE(%1$I, %2$L, %3$L) WHERE %1$I LIKE %4$L',
      col,
      'characters/alternate/three_musketeers.png',
      'characters/alternate/three_musketeers.jpg',
      '%%characters/alternate/three_musketeers.png%%'
    );
  END LOOP;
END $$;

UPDATE collection_cards
SET image_path = REPLACE(image_path, 'characters/alternate/dracula2.webp', 'characters/alternate/dracula2.jpg'),
    updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/dracula2.webp%';

UPDATE collection_cards
SET image_path = REPLACE(image_path, 'characters/alternate/mr_hyde.webp', 'characters/alternate/mr_hyde.jpg'),
    updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/mr_hyde.webp%';

UPDATE collection_cards
SET image_path = REPLACE(image_path, 'characters/alternate/three_musketeers.png', 'characters/alternate/three_musketeers.jpg'),
    updated_at = NOW()
WHERE image_path LIKE '%characters/alternate/three_musketeers.png%';

-- 4) Safety: ensure we no longer reference deleted filenames
DO $$
DECLARE
  remaining INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining FROM characters WHERE image_path IN (
    'characters/alternate/dracula2.webp',
    'characters/alternate/mr_hyde.webp',
    'characters/alternate/three_musketeers.png'
  );
  IF remaining <> 0 THEN
    RAISE EXCEPTION 'Found % character rows still referencing deleted alternate image filenames', remaining;
  END IF;

  SELECT COUNT(*) INTO remaining FROM decks
  WHERE (character_1_image LIKE '%characters/alternate/dracula2.webp%' OR character_2_image LIKE '%characters/alternate/dracula2.webp%' OR character_3_image LIKE '%characters/alternate/dracula2.webp%' OR character_4_image LIKE '%characters/alternate/dracula2.webp%')
     OR (character_1_image LIKE '%characters/alternate/mr_hyde.webp%' OR character_2_image LIKE '%characters/alternate/mr_hyde.webp%' OR character_3_image LIKE '%characters/alternate/mr_hyde.webp%' OR character_4_image LIKE '%characters/alternate/mr_hyde.webp%')
     OR (character_1_image LIKE '%characters/alternate/three_musketeers.png%' OR character_2_image LIKE '%characters/alternate/three_musketeers.png%' OR character_3_image LIKE '%characters/alternate/three_musketeers.png%' OR character_4_image LIKE '%characters/alternate/three_musketeers.png%');
  IF remaining <> 0 THEN
    RAISE EXCEPTION 'Found % decks still referencing deleted alternate image filenames', remaining;
  END IF;

  SELECT COUNT(*) INTO remaining FROM collection_cards
  WHERE image_path LIKE '%characters/alternate/dracula2.webp%'
     OR image_path LIKE '%characters/alternate/mr_hyde.webp%'
     OR image_path LIKE '%characters/alternate/three_musketeers.png%';
  IF remaining <> 0 THEN
    RAISE EXCEPTION 'Found % collection_cards still referencing deleted alternate image filenames', remaining;
  END IF;
END $$;


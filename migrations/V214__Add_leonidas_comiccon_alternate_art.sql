-- Add Leonidas ComicCon exclusive alternate art (ERB)
-- Alternate character art is represented as separate rows in `characters`
-- with `image_path` under `characters/alternate/...`.

DO $$
DECLARE
  base_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO base_count
  FROM characters
  WHERE name = 'Leonidas'
    AND set = 'ERB'
    AND (image_path NOT LIKE '%/alternate/%' OR image_path IS NULL);

  IF base_count <> 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 base character row for Leonidas (ERB), found %', base_count;
  END IF;
END $$;

INSERT INTO characters (
  id, name, set, description, energy, combat, brute_force, intelligence,
  image_path, created_at, updated_at, threat_level, special_abilities, set_number, set_number_foil
)
SELECT
  gen_random_uuid(),
  c.name, c.set, c.description, c.energy, c.combat, c.brute_force, c.intelligence,
  'characters/alternate/Leonidas-ComicConExclusive.jpg',
  c.created_at,
  NOW(),
  c.threat_level,
  c.special_abilities,
  c.set_number,
  c.set_number_foil
FROM characters c
WHERE c.name = 'Leonidas'
  AND c.set = 'ERB'
  AND (c.image_path NOT LIKE '%/alternate/%' OR c.image_path IS NULL)
  AND NOT EXISTS (
    SELECT 1 FROM characters x
    WHERE x.name = c.name AND x.set = c.set AND x.image_path = 'characters/alternate/Leonidas-ComicConExclusive.jpg'
  )
LIMIT 1;


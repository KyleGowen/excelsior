-- V165/V166 intended to populate this card, but their generated apostrophe
-- escaping did not match the persisted name. Restore the printed level and icon
-- so catalog consumers do not have to infer them from the effect text.

DO $$
DECLARE
  target_rows INTEGER;
BEGIN
  SELECT COUNT(*) INTO target_rows
  FROM special_cards
  WHERE set = 'ERB'
    AND set_number = '453'
    AND character_name = 'Any Character'
    AND name = 'Lilith''s Swarm'
    AND is_foil = FALSE;

  IF target_rows <> 1 THEN
    RAISE EXCEPTION 'Lilith''s Swarm metadata migration expected 1 target printing, found %', target_rows;
  END IF;
END $$;

UPDATE special_cards
SET icons = ARRAY['Any-Power'],
    value = 5,
    updated_at = NOW()
WHERE set = 'ERB'
  AND set_number = '453'
  AND character_name = 'Any Character'
  AND name = 'Lilith''s Swarm'
  AND is_foil = FALSE
  AND (
    icons IS DISTINCT FROM ARRAY['Any-Power']::text[]
    OR value IS DISTINCT FROM 5
  );

DO $$
DECLARE
  repaired_rows INTEGER;
BEGIN
  SELECT COUNT(*) INTO repaired_rows
  FROM special_cards
  WHERE set = 'ERB'
    AND set_number = '453'
    AND character_name = 'Any Character'
    AND name = 'Lilith''s Swarm'
    AND is_foil = FALSE
    AND icons = ARRAY['Any-Power']::text[]
    AND value = 5;

  IF repaired_rows <> 1 THEN
    RAISE EXCEPTION 'Lilith''s Swarm metadata migration expected 1 repaired printing, found %', repaired_rows;
  END IF;
END $$;

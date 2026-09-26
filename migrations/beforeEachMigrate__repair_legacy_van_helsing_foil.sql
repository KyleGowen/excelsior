-- Fresh-history repair before V359 without changing any applied migration checksum.
-- V201 uses LIMIT 1 without an art discriminator for Van Helsing's 529F marker;
-- V230 can therefore copy the prize-pack art into the 529F row. V359 requires
-- the canonical 529 art. Only act at the exact pre-V359 boundary. Databases
-- already at V359 or later (including production) are untouched.
DO $$
DECLARE
  current_version TEXT;
  canonical_id UUID;
BEGIN
  SELECT version INTO current_version
  FROM flyway_schema_history WHERE success AND version IS NOT NULL
  ORDER BY installed_rank DESC LIMIT 1;
  IF current_version IS DISTINCT FROM '358' THEN RETURN; END IF;

  SELECT id INTO canonical_id FROM characters
  WHERE name = 'Van Helsing' AND set = 'ERB' AND NOT is_foil
    AND image_path = 'characters/alternate/VanHelsing-Alt.png';
  IF canonical_id IS NULL THEN
    RAISE EXCEPTION 'Missing canonical Van Helsing 529 before V359';
  END IF;

  UPDATE characters SET image_path = 'characters/alternate/VanHelsing-Alt.png', updated_at = NOW()
  WHERE name = 'Van Helsing' AND set = 'ERB' AND is_foil AND set_number = '529F'
    AND image_path = 'characters/alternate/VanHelsing-PrizePack_Alt.png';

  UPDATE characters SET set_number_foil = '529F'
  WHERE id = canonical_id AND set_number_foil IS DISTINCT FROM '529F';
  UPDATE characters SET set_number_foil = NULL
  WHERE name = 'Van Helsing' AND set = 'ERB' AND NOT is_foil
    AND image_path = 'characters/alternate/VanHelsing-PrizePack_Alt.png'
    AND set_number_foil = '529F';

  INSERT INTO foil_card_map (foil_card_id, base_card_id, card_type)
  SELECT id::text, canonical_id::text, 'character' FROM characters
  WHERE name = 'Van Helsing' AND set = 'ERB' AND is_foil AND set_number = '529F'
    AND image_path = 'characters/alternate/VanHelsing-Alt.png'
  ON CONFLICT (foil_card_id) DO UPDATE SET base_card_id = EXCLUDED.base_card_id;
END $$;

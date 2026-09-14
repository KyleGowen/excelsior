-- Keep the unreleased TFCP 7 - Intelligence NAOL promo printing face down.
-- This is deliberately scoped to tfacp/power/7_intelligence_naol.png; every other
-- 7 - Intelligence printing, including tfacp/power/7_intelligence.png, retains its face art.

DO $$
DECLARE
  target_rows INTEGER;
BEGIN
  SELECT COUNT(*) INTO target_rows
  FROM power_cards
  WHERE set = 'TFCP'
    AND name = '7 - Intelligence'
    AND power_type = 'Intelligence'
    AND value = 7
    AND image_path = 'tfacp/power/7_intelligence_naol.png'
    AND is_foil = FALSE;

  IF target_rows <> 1 THEN
    RAISE EXCEPTION 'TFCP 7 - Intelligence face-down migration expected 1 target printing, found %', target_rows;
  END IF;
END $$;

UPDATE collection_cards
SET image_path = REPLACE(
      image_path,
      'tfacp/power/7_intelligence_naol.png',
      'sky/card-back/overpowerback.png'
    ),
    updated_at = NOW()
WHERE image_path LIKE '%tfacp/power/7_intelligence_naol.png';

UPDATE power_cards
SET image_path = 'sky/card-back/overpowerback.png',
    updated_at = NOW()
WHERE set = 'TFCP'
  AND name = '7 - Intelligence'
  AND power_type = 'Intelligence'
  AND value = 7
  AND image_path = 'tfacp/power/7_intelligence_naol.png'
  AND is_foil = FALSE;

DO $$
DECLARE
  hidden_rows INTEGER;
  visible_rows INTEGER;
BEGIN
  SELECT COUNT(*) INTO hidden_rows
  FROM power_cards
  WHERE set = 'TFCP'
    AND name = '7 - Intelligence'
    AND power_type = 'Intelligence'
    AND value = 7
    AND image_path = 'sky/card-back/overpowerback.png'
    AND is_foil = FALSE;

  IF hidden_rows <> 1 THEN
    RAISE EXCEPTION 'TFCP 7 - Intelligence face-down migration expected 1 hidden printing, found %', hidden_rows;
  END IF;

  SELECT COUNT(*) INTO visible_rows
  FROM power_cards
  WHERE set = 'TFCP'
    AND name = '7 - Intelligence'
    AND image_path = 'tfacp/power/7_intelligence.png'
    AND is_foil = FALSE;

  IF visible_rows <> 1 THEN
    RAISE EXCEPTION 'TFCP 7 - Intelligence face-down migration altered or lost the visible printing';
  END IF;
END $$;

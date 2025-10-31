-- Fix remaining .png extensions in decks.character_N_image columns
-- These override defaultImage when present, causing 404 errors
-- Convert any remaining .png to .webp in deck character image columns

UPDATE decks
SET character_1_image = REPLACE(character_1_image, '.png', '.webp'),
    updated_at = NOW()
WHERE character_1_image LIKE '%.png'
  AND character_1_image NOT LIKE '%dracula2.webp%'
  AND character_1_image NOT LIKE '%tars_tarkas2.webp%';

UPDATE decks
SET character_2_image = REPLACE(character_2_image, '.png', '.webp'),
    updated_at = NOW()
WHERE character_2_image LIKE '%.png'
  AND character_2_image NOT LIKE '%dracula2.webp%'
  AND character_2_image NOT LIKE '%tars_tarkas2.webp%';

UPDATE decks
SET character_3_image = REPLACE(character_3_image, '.png', '.webp'),
    updated_at = NOW()
WHERE character_3_image LIKE '%.png'
  AND character_3_image NOT LIKE '%dracula2.webp%'
  AND character_3_image NOT LIKE '%tars_tarkas2.webp%';

UPDATE decks
SET character_4_image = REPLACE(character_4_image, '.png', '.webp'),
    updated_at = NOW()
WHERE character_4_image LIKE '%.png'
  AND character_4_image NOT LIKE '%dracula2.webp%'
  AND character_4_image NOT LIKE '%tars_tarkas2.webp%';


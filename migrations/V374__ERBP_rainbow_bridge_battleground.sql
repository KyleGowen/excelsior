-- ERB promo Battleground. The printed set symbol is transcribed as ERB.
INSERT INTO sets (code, name) VALUES ('ERBP', 'Edgar Rice Burroughs - Promos')
ON CONFLICT (code) DO NOTHING;

INSERT INTO battlegrounds (
    id, name, set, image_path, special_ability, is_foil,
    set_number, set_number_foil, rarity, created_at, updated_at
)
SELECT gen_random_uuid(), 'Rainbow Bridge', 'ERBP',
    'erbp/battlegrounds/rainbow_bridge.png',
    'The Rainbow Bridge team may include Any Character Special cards from the ERB set in their deck.',
    FALSE, NULL, NULL, NULL, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM battlegrounds
    WHERE image_path = 'erbp/battlegrounds/rainbow_bridge.png'
      AND set = 'ERBP' AND is_foil = FALSE
);

UPDATE battlegrounds
SET name = 'Rainbow Bridge',
    special_ability = 'The Rainbow Bridge team may include Any Character Special cards from the ERB set in their deck.',
    set_number = NULL, set_number_foil = NULL, rarity = NULL, updated_at = NOW()
WHERE image_path = 'erbp/battlegrounds/rainbow_bridge.png'
  AND set = 'ERBP' AND is_foil = FALSE
  AND (
    name IS DISTINCT FROM 'Rainbow Bridge'
    OR special_ability IS DISTINCT FROM 'The Rainbow Bridge team may include Any Character Special cards from the ERB set in their deck.'
    OR set_number IS NOT NULL OR set_number_foil IS NOT NULL OR rarity IS NOT NULL
  );

-- Refresh stale legality badges without changing saved deck contents. ERBP
-- alternate/foil printings belong to the same ERB Any Character card pool.
UPDATE decks d
SET is_valid = FALSE, updated_at = CURRENT_TIMESTAMP
WHERE d.is_valid = TRUE
  AND EXISTS (
    SELECT 1 FROM deck_cards dc
    JOIN special_cards sc ON sc.id::text = dc.card_id
    WHERE dc.deck_id = d.id AND dc.card_type = 'special' AND dc.quantity > 0
      AND LOWER(BTRIM(sc.character_name)) = 'any character'
      AND UPPER(BTRIM(sc.set)) IN ('ERB', 'ERBP')
  )
  AND NOT EXISTS (
    SELECT 1 FROM deck_cards dc
    JOIN battlegrounds b ON b.id::text = dc.card_id
    WHERE dc.deck_id = d.id AND dc.card_type = 'battleground' AND dc.quantity > 0
      AND BTRIM(b.name) = 'Rainbow Bridge'
  );

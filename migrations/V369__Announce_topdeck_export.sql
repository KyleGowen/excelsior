-- Announce TopDeck decklist export on Home Recent Updates.

INSERT INTO recent_updates (id, title, type, description, card_image_url, created_at, updated_at) VALUES
    (
        'a1000001-0000-4000-8000-000000000013',
        'Export decks to TopDeck',
        'update',
        'Your decks can now be exported in TopDeck format! Open a deck, choose Export, select TopDeck, and copy the decklist for your Modern OverPower event.',
        'sky/specials/083_paltry_attempts.png',
        '2026-10-11 12:00:00',
        '2026-10-11 12:00:00'
    )
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM recent_updates
    WHERE id = 'a1000001-0000-4000-8000-000000000013'
      AND title = 'Export decks to TopDeck'
      AND type = 'update'
      AND description = 'Your decks can now be exported in TopDeck format! Open a deck, choose Export, select TopDeck, and copy the decklist for your Modern OverPower event.'
      AND card_image_url = 'sky/specials/083_paltry_attempts.png'
      AND created_at = '2026-10-11 12:00:00'
      AND updated_at = '2026-10-11 12:00:00'
  ) THEN
    RAISE EXCEPTION 'TopDeck export recent update was not applied';
  END IF;
END $$;

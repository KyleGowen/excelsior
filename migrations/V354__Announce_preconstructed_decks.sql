-- Announce preconstructed decks and Skybound upgrade recommendations on Home Recent Updates.

INSERT INTO recent_updates (id, title, type, description, card_image_url, created_at, updated_at) VALUES
    (
        'a1000001-0000-4000-8000-000000000011',
        'Preconstructed decks are here!',
        'update',
        'The Community section now includes official preconstructed decks, plus featured Skybound precon upgrade recommendations from Andrew Taylor.',
        'sky/training/394_training_any_power.png',
        '2026-09-11 00:00:00',
        '2026-09-11 00:00:00'
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    type = EXCLUDED.type,
    description = EXCLUDED.description,
    card_image_url = EXCLUDED.card_image_url,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM recent_updates
    WHERE id = 'a1000001-0000-4000-8000-000000000011'
      AND title = 'Preconstructed decks are here!'
      AND type = 'update'
      AND card_image_url = 'sky/training/394_training_any_power.png'
      AND description LIKE '%Community section%'
      AND description LIKE '%Andrew Taylor%'
  ) THEN
    RAISE EXCEPTION 'Preconstructed decks recent update was not applied';
  END IF;
END $$;

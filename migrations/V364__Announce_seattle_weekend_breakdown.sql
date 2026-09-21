-- Announce the combined Seattle Regional and NAOL tournament breakdown on Home Recent Updates.

INSERT INTO recent_updates (id, title, type, description, card_image_url, created_at, updated_at) VALUES
    (
        'a1000001-0000-4000-8000-000000000012',
        'The Seattle Weekend Breakdown',
        'update',
        'Skybound is here, and Seattle''s doubleheader is in the books! What decks did players come up with in the week from release? Come take a look!',
        'sky/specials/053_advanced_alien_arsenal.png',
        '2026-09-21 00:00:00',
        '2026-09-21 00:00:00'
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
    WHERE id = 'a1000001-0000-4000-8000-000000000012'
      AND title = 'The Seattle Weekend Breakdown'
      AND type = 'update'
      AND description = 'Skybound is here, and Seattle''s doubleheader is in the books! What decks did players come up with in the week from release? Come take a look!'
      AND card_image_url = 'sky/specials/053_advanced_alien_arsenal.png'
      AND created_at = '2026-09-21 00:00:00'
      AND updated_at = '2026-09-21 00:00:00'
  ) THEN
    RAISE EXCEPTION 'Seattle Weekend recent update was not applied';
  END IF;
END $$;

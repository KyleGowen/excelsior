-- Use the approved title for the preconstructed-decks Recent Updates announcement.

UPDATE recent_updates
SET title = 'Preconstructed deck lists available'
WHERE id = 'a1000001-0000-4000-8000-000000000011';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM recent_updates
    WHERE id = 'a1000001-0000-4000-8000-000000000011'
      AND title = 'Preconstructed deck lists available'
  ) THEN
    RAISE EXCEPTION 'Preconstructed decks recent update title was not applied';
  END IF;
END $$;

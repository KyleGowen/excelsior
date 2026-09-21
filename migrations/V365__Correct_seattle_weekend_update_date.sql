-- Keep the Seattle Weekend announcement on September 21 in North American time zones.

ALTER TABLE recent_updates DISABLE TRIGGER update_recent_updates_updated_at;

UPDATE recent_updates
SET created_at = '2026-09-21 12:00:00',
    updated_at = '2026-09-21 12:00:00'
WHERE id = 'a1000001-0000-4000-8000-000000000012';

ALTER TABLE recent_updates ENABLE TRIGGER update_recent_updates_updated_at;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM recent_updates
    WHERE id = 'a1000001-0000-4000-8000-000000000012'
      AND created_at = '2026-09-21 12:00:00'
      AND updated_at = '2026-09-21 12:00:00'
  ) THEN
    RAISE EXCEPTION 'Seattle Weekend recent update date was not corrected';
  END IF;
END $$;

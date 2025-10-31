-- Add icons and value columns to aspects table
-- icons: list of icon types (Energy, Combat, Brute Force, Intelligence, Any-Power)
-- value: numeric level associated with the typed attack (nullable)

ALTER TABLE aspects
    ADD COLUMN IF NOT EXISTS icons TEXT[] NULL,
    ADD COLUMN IF NOT EXISTS value INTEGER NULL;

COMMENT ON COLUMN aspects.icons IS 'Array of icon types for the aspect card (Energy, Combat, Brute Force, Intelligence, Any-Power). Nullable.';
COMMENT ON COLUMN aspects.value IS 'Attack level associated with the aspect icons when applicable. Nullable.';



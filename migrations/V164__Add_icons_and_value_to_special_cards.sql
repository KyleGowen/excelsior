-- Add icons and value columns to special_cards table
-- icons: list of icon types (e.g., Energy, Combat, Brute Force, Intelligence, Any-Power)
-- value: numeric value associated with the icon(s) when applicable

ALTER TABLE special_cards
    ADD COLUMN IF NOT EXISTS icons TEXT[] NULL,
    ADD COLUMN IF NOT EXISTS value INTEGER NULL;

-- Documentation
COMMENT ON COLUMN special_cards.icons IS 'Array of icon types for the special card (e.g., Energy, Combat, Brute Force, Intelligence, Any-Power). Nullable.';
COMMENT ON COLUMN special_cards.value IS 'Attack value associated with the special card icon(s) when the effect acts as an attack. Nullable.';



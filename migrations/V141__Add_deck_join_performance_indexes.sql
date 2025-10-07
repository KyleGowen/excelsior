-- V141: Add indexes to optimize deck JOIN queries for better performance
-- These indexes specifically target the complex JOIN query in getDecksByUserId

-- Add indexes for character foreign key columns in decks table
-- These are used in the LEFT JOINs: d.character_1_id = c1.id, etc.
CREATE INDEX IF NOT EXISTS idx_decks_character_1_id ON decks(character_1_id) WHERE character_1_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_decks_character_2_id ON decks(character_2_id) WHERE character_2_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_decks_character_3_id ON decks(character_3_id) WHERE character_3_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_decks_character_4_id ON decks(character_4_id) WHERE character_4_id IS NOT NULL;

-- Add index for location foreign key column in decks table
-- This is used in the LEFT JOIN: d.location_id = l.id
CREATE INDEX IF NOT EXISTS idx_decks_location_id ON decks(location_id) WHERE location_id IS NOT NULL;

-- Add composite index for the main query pattern (user_id + ordering)
-- This is already covered by idx_decks_user_created, but let's ensure it's optimal
-- The existing index should handle: WHERE d.user_id = $1 ORDER BY d.created_at DESC

-- Add indexes on characters.id and locations.id if they don't exist
-- These are the primary keys, but let's ensure they're indexed for JOIN performance
CREATE INDEX IF NOT EXISTS idx_characters_id ON characters(id);
CREATE INDEX IF NOT EXISTS idx_locations_id ON locations(id);

-- Add indexes for the specific columns being selected in the JOIN
-- These help with covering index optimization
CREATE INDEX IF NOT EXISTS idx_characters_id_name_image ON characters(id, name, image_path);
CREATE INDEX IF NOT EXISTS idx_locations_id_name_image ON locations(id, name, image_path);

-- Add comments to document the purpose of these indexes
COMMENT ON INDEX idx_decks_character_1_id IS 'Optimizes LEFT JOIN for character_1_id in deck queries';
COMMENT ON INDEX idx_decks_character_2_id IS 'Optimizes LEFT JOIN for character_2_id in deck queries';
COMMENT ON INDEX idx_decks_character_3_id IS 'Optimizes LEFT JOIN for character_3_id in deck queries';
COMMENT ON INDEX idx_decks_character_4_id IS 'Optimizes LEFT JOIN for character_4_id in deck queries';
COMMENT ON INDEX idx_decks_location_id IS 'Optimizes LEFT JOIN for location_id in deck queries';
COMMENT ON INDEX idx_characters_id_name_image IS 'Covering index for character JOINs (id, name, image_path)';
COMMENT ON INDEX idx_locations_id_name_image IS 'Covering index for location JOINs (id, name, image_path)';

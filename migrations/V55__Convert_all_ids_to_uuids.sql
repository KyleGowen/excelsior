-- Migration V55: Convert all ID columns to UUIDs
-- This migration converts all VARCHAR(255) ID columns to UUIDs and updates all foreign key relationships

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Create temporary mapping tables to store old ID -> new UUID mappings
CREATE TEMPORARY TABLE id_mappings (
    table_name VARCHAR(50),
    old_id VARCHAR(255),
    new_id UUID
);

-- Step 2: Generate new UUIDs for all existing records and store mappings
INSERT INTO id_mappings (table_name, old_id, new_id)
SELECT 'characters', id, gen_random_uuid() FROM characters;

INSERT INTO id_mappings (table_name, old_id, new_id)
SELECT 'special_cards', id, gen_random_uuid() FROM special_cards;

INSERT INTO id_mappings (table_name, old_id, new_id)
SELECT 'power_cards', id, gen_random_uuid() FROM power_cards;

INSERT INTO id_mappings (table_name, old_id, new_id)
SELECT 'locations', id, gen_random_uuid() FROM locations;

INSERT INTO id_mappings (table_name, old_id, new_id)
SELECT 'missions', id, gen_random_uuid() FROM missions;

INSERT INTO id_mappings (table_name, old_id, new_id)
SELECT 'events', id, gen_random_uuid() FROM events;

INSERT INTO id_mappings (table_name, old_id, new_id)
SELECT 'aspects', id, gen_random_uuid() FROM aspects;

INSERT INTO id_mappings (table_name, old_id, new_id)
SELECT 'teamwork_cards', id, gen_random_uuid() FROM teamwork_cards;

INSERT INTO id_mappings (table_name, old_id, new_id)
SELECT 'ally_universe_cards', id, gen_random_uuid() FROM ally_universe_cards;

INSERT INTO id_mappings (table_name, old_id, new_id)
SELECT 'training_cards', id, gen_random_uuid() FROM training_cards;

INSERT INTO id_mappings (table_name, old_id, new_id)
SELECT 'basic_universe_cards', id, gen_random_uuid() FROM basic_universe_cards;

INSERT INTO id_mappings (table_name, old_id, new_id)
SELECT 'advanced_universe_cards', id, gen_random_uuid() FROM advanced_universe_cards;

-- Step 3: Update deck_cards table to use new UUIDs
-- First, update character references
UPDATE deck_cards 
SET card_id = m.new_id::VARCHAR(255)
FROM id_mappings m 
WHERE deck_cards.card_type = 'character' 
AND deck_cards.card_id = m.old_id 
AND m.table_name = 'characters';

-- Update special card references
UPDATE deck_cards 
SET card_id = m.new_id::VARCHAR(255)
FROM id_mappings m 
WHERE deck_cards.card_type = 'special' 
AND deck_cards.card_id = m.old_id 
AND m.table_name = 'special_cards';

-- Update power card references
UPDATE deck_cards 
SET card_id = m.new_id::VARCHAR(255)
FROM id_mappings m 
WHERE deck_cards.card_type = 'power' 
AND deck_cards.card_id = m.old_id 
AND m.table_name = 'power_cards';

-- Update location references
UPDATE deck_cards 
SET card_id = m.new_id::VARCHAR(255)
FROM id_mappings m 
WHERE deck_cards.card_type = 'location' 
AND deck_cards.card_id = m.old_id 
AND m.table_name = 'locations';

-- Update mission references
UPDATE deck_cards 
SET card_id = m.new_id::VARCHAR(255)
FROM id_mappings m 
WHERE deck_cards.card_type = 'mission' 
AND deck_cards.card_id = m.old_id 
AND m.table_name = 'missions';

-- Update event references
UPDATE deck_cards 
SET card_id = m.new_id::VARCHAR(255)
FROM id_mappings m 
WHERE deck_cards.card_type = 'event' 
AND deck_cards.card_id = m.old_id 
AND m.table_name = 'events';

-- Update aspect references
UPDATE deck_cards 
SET card_id = m.new_id::VARCHAR(255)
FROM id_mappings m 
WHERE deck_cards.card_type = 'aspect' 
AND deck_cards.card_id = m.old_id 
AND m.table_name = 'aspects';

-- Update teamwork references
UPDATE deck_cards 
SET card_id = m.new_id::VARCHAR(255)
FROM id_mappings m 
WHERE deck_cards.card_type = 'teamwork' 
AND deck_cards.card_id = m.old_id 
AND m.table_name = 'teamwork_cards';

-- Update ally-universe references
UPDATE deck_cards 
SET card_id = m.new_id::VARCHAR(255)
FROM id_mappings m 
WHERE deck_cards.card_type = 'ally-universe' 
AND deck_cards.card_id = m.old_id 
AND m.table_name = 'ally_universe_cards';

-- Update training references
UPDATE deck_cards 
SET card_id = m.new_id::VARCHAR(255)
FROM id_mappings m 
WHERE deck_cards.card_type = 'training' 
AND deck_cards.card_id = m.old_id 
AND m.table_name = 'training_cards';

-- Update basic-universe references
UPDATE deck_cards 
SET card_id = m.new_id::VARCHAR(255)
FROM id_mappings m 
WHERE deck_cards.card_type = 'basic-universe' 
AND deck_cards.card_id = m.old_id 
AND m.table_name = 'basic_universe_cards';

-- Update advanced-universe references
UPDATE deck_cards 
SET card_id = m.new_id::VARCHAR(255)
FROM id_mappings m 
WHERE deck_cards.card_type = 'advanced-universe' 
AND deck_cards.card_id = m.old_id 
AND m.table_name = 'advanced_universe_cards';

-- Step 4: Update any other foreign key references
-- Update advanced_universe_cards character references
UPDATE advanced_universe_cards 
SET character = m.new_id::VARCHAR(255)
FROM id_mappings m 
WHERE advanced_universe_cards.character = m.old_id 
AND m.table_name = 'characters';

-- Update aspects location references
UPDATE aspects 
SET location = m.new_id::VARCHAR(255)
FROM id_mappings m 
WHERE aspects.location = m.old_id 
AND m.table_name = 'locations';

-- Step 5: Drop existing primary key constraints and indexes
ALTER TABLE characters DROP CONSTRAINT characters_pkey;
ALTER TABLE special_cards DROP CONSTRAINT special_cards_pkey;
ALTER TABLE power_cards DROP CONSTRAINT power_cards_pkey;
ALTER TABLE locations DROP CONSTRAINT locations_pkey;
ALTER TABLE missions DROP CONSTRAINT missions_pkey;
ALTER TABLE events DROP CONSTRAINT events_pkey;
ALTER TABLE aspects DROP CONSTRAINT aspects_pkey;
ALTER TABLE teamwork_cards DROP CONSTRAINT teamwork_cards_pkey;
ALTER TABLE ally_universe_cards DROP CONSTRAINT ally_universe_cards_pkey;
ALTER TABLE training_cards DROP CONSTRAINT training_cards_pkey;
ALTER TABLE basic_universe_cards DROP CONSTRAINT basic_universe_cards_pkey;
ALTER TABLE advanced_universe_cards DROP CONSTRAINT advanced_universe_cards_pkey;

-- Step 6: Add new UUID columns
ALTER TABLE characters ADD COLUMN new_id UUID;
ALTER TABLE special_cards ADD COLUMN new_id UUID;
ALTER TABLE power_cards ADD COLUMN new_id UUID;
ALTER TABLE locations ADD COLUMN new_id UUID;
ALTER TABLE missions ADD COLUMN new_id UUID;
ALTER TABLE events ADD COLUMN new_id UUID;
ALTER TABLE aspects ADD COLUMN new_id UUID;
ALTER TABLE teamwork_cards ADD COLUMN new_id UUID;
ALTER TABLE ally_universe_cards ADD COLUMN new_id UUID;
ALTER TABLE training_cards ADD COLUMN new_id UUID;
ALTER TABLE basic_universe_cards ADD COLUMN new_id UUID;
ALTER TABLE advanced_universe_cards ADD COLUMN new_id UUID;

-- Step 7: Populate new UUID columns with mapped values
UPDATE characters 
SET new_id = m.new_id
FROM id_mappings m 
WHERE characters.id = m.old_id 
AND m.table_name = 'characters';

UPDATE special_cards 
SET new_id = m.new_id
FROM id_mappings m 
WHERE special_cards.id = m.old_id 
AND m.table_name = 'special_cards';

UPDATE power_cards 
SET new_id = m.new_id
FROM id_mappings m 
WHERE power_cards.id = m.old_id 
AND m.table_name = 'power_cards';

UPDATE locations 
SET new_id = m.new_id
FROM id_mappings m 
WHERE locations.id = m.old_id 
AND m.table_name = 'locations';

UPDATE missions 
SET new_id = m.new_id
FROM id_mappings m 
WHERE missions.id = m.old_id 
AND m.table_name = 'missions';

UPDATE events 
SET new_id = m.new_id
FROM id_mappings m 
WHERE events.id = m.old_id 
AND m.table_name = 'events';

UPDATE aspects 
SET new_id = m.new_id
FROM id_mappings m 
WHERE aspects.id = m.old_id 
AND m.table_name = 'aspects';

UPDATE teamwork_cards 
SET new_id = m.new_id
FROM id_mappings m 
WHERE teamwork_cards.id = m.old_id 
AND m.table_name = 'teamwork_cards';

UPDATE ally_universe_cards 
SET new_id = m.new_id
FROM id_mappings m 
WHERE ally_universe_cards.id = m.old_id 
AND m.table_name = 'ally_universe_cards';

UPDATE training_cards 
SET new_id = m.new_id
FROM id_mappings m 
WHERE training_cards.id = m.old_id 
AND m.table_name = 'training_cards';

UPDATE basic_universe_cards 
SET new_id = m.new_id
FROM id_mappings m 
WHERE basic_universe_cards.id = m.old_id 
AND m.table_name = 'basic_universe_cards';

UPDATE advanced_universe_cards 
SET new_id = m.new_id
FROM id_mappings m 
WHERE advanced_universe_cards.id = m.old_id 
AND m.table_name = 'advanced_universe_cards';

-- Step 8: Drop old ID columns and rename new_id to id
ALTER TABLE characters DROP COLUMN id;
ALTER TABLE characters RENAME COLUMN new_id TO id;
ALTER TABLE characters ALTER COLUMN id SET NOT NULL;

ALTER TABLE special_cards DROP COLUMN id;
ALTER TABLE special_cards RENAME COLUMN new_id TO id;
ALTER TABLE special_cards ALTER COLUMN id SET NOT NULL;

ALTER TABLE power_cards DROP COLUMN id;
ALTER TABLE power_cards RENAME COLUMN new_id TO id;
ALTER TABLE power_cards ALTER COLUMN id SET NOT NULL;

ALTER TABLE locations DROP COLUMN id;
ALTER TABLE locations RENAME COLUMN new_id TO id;
ALTER TABLE locations ALTER COLUMN id SET NOT NULL;

ALTER TABLE missions DROP COLUMN id;
ALTER TABLE missions RENAME COLUMN new_id TO id;
ALTER TABLE missions ALTER COLUMN id SET NOT NULL;

ALTER TABLE events DROP COLUMN id;
ALTER TABLE events RENAME COLUMN new_id TO id;
ALTER TABLE events ALTER COLUMN id SET NOT NULL;

ALTER TABLE aspects DROP COLUMN id;
ALTER TABLE aspects RENAME COLUMN new_id TO id;
ALTER TABLE aspects ALTER COLUMN id SET NOT NULL;

ALTER TABLE teamwork_cards DROP COLUMN id;
ALTER TABLE teamwork_cards RENAME COLUMN new_id TO id;
ALTER TABLE teamwork_cards ALTER COLUMN id SET NOT NULL;

ALTER TABLE ally_universe_cards DROP COLUMN id;
ALTER TABLE ally_universe_cards RENAME COLUMN new_id TO id;
ALTER TABLE ally_universe_cards ALTER COLUMN id SET NOT NULL;

ALTER TABLE training_cards DROP COLUMN id;
ALTER TABLE training_cards RENAME COLUMN new_id TO id;
ALTER TABLE training_cards ALTER COLUMN id SET NOT NULL;

ALTER TABLE basic_universe_cards DROP COLUMN id;
ALTER TABLE basic_universe_cards RENAME COLUMN new_id TO id;
ALTER TABLE basic_universe_cards ALTER COLUMN id SET NOT NULL;

ALTER TABLE advanced_universe_cards DROP COLUMN id;
ALTER TABLE advanced_universe_cards RENAME COLUMN new_id TO id;
ALTER TABLE advanced_universe_cards ALTER COLUMN id SET NOT NULL;

-- Step 9: Recreate primary key constraints
ALTER TABLE characters ADD PRIMARY KEY (id);
ALTER TABLE special_cards ADD PRIMARY KEY (id);
ALTER TABLE power_cards ADD PRIMARY KEY (id);
ALTER TABLE locations ADD PRIMARY KEY (id);
ALTER TABLE missions ADD PRIMARY KEY (id);
ALTER TABLE events ADD PRIMARY KEY (id);
ALTER TABLE aspects ADD PRIMARY KEY (id);
ALTER TABLE teamwork_cards ADD PRIMARY KEY (id);
ALTER TABLE ally_universe_cards ADD PRIMARY KEY (id);
ALTER TABLE training_cards ADD PRIMARY KEY (id);
ALTER TABLE basic_universe_cards ADD PRIMARY KEY (id);
ALTER TABLE advanced_universe_cards ADD PRIMARY KEY (id);

-- Step 10: Recreate indexes (using IF NOT EXISTS to avoid conflicts)
CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(name);
CREATE INDEX IF NOT EXISTS idx_characters_universe ON characters(universe);

CREATE INDEX IF NOT EXISTS idx_special_cards_name ON special_cards(name);
CREATE INDEX IF NOT EXISTS idx_special_cards_character ON special_cards(character_name);
CREATE INDEX IF NOT EXISTS idx_special_cards_universe ON special_cards(universe);
CREATE INDEX IF NOT EXISTS idx_special_cards_one_per_deck ON special_cards(one_per_deck);

CREATE INDEX IF NOT EXISTS idx_power_cards_name ON power_cards(name);
CREATE INDEX IF NOT EXISTS idx_power_cards_type ON power_cards(power_type);
CREATE INDEX IF NOT EXISTS idx_power_cards_value ON power_cards(value);
CREATE INDEX IF NOT EXISTS idx_power_cards_one_per_deck ON power_cards(one_per_deck);

CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);
CREATE INDEX IF NOT EXISTS idx_locations_universe ON locations(universe);

CREATE INDEX IF NOT EXISTS idx_missions_name ON missions(name);
CREATE INDEX IF NOT EXISTS idx_missions_universe ON missions(universe);

CREATE INDEX IF NOT EXISTS idx_events_name ON events(name);
CREATE INDEX IF NOT EXISTS idx_events_universe ON events(universe);
CREATE INDEX IF NOT EXISTS idx_events_one_per_deck ON events(one_per_deck);

CREATE INDEX IF NOT EXISTS idx_aspects_name ON aspects(name);
CREATE INDEX IF NOT EXISTS idx_aspects_universe ON aspects(universe);

CREATE INDEX IF NOT EXISTS idx_teamwork_cards_name ON teamwork_cards(name);
CREATE INDEX IF NOT EXISTS idx_teamwork_cards_universe ON teamwork_cards(universe);

CREATE INDEX IF NOT EXISTS idx_ally_universe_cards_name ON ally_universe_cards(name);
CREATE INDEX IF NOT EXISTS idx_ally_universe_cards_universe ON ally_universe_cards(universe);

CREATE INDEX IF NOT EXISTS idx_training_cards_name ON training_cards(name);
CREATE INDEX IF NOT EXISTS idx_training_cards_universe ON training_cards(universe);

CREATE INDEX IF NOT EXISTS idx_basic_universe_cards_name ON basic_universe_cards(name);
CREATE INDEX IF NOT EXISTS idx_basic_universe_cards_universe ON basic_universe_cards(universe);

CREATE INDEX IF NOT EXISTS idx_advanced_universe_cards_name ON advanced_universe_cards(name);
CREATE INDEX IF NOT EXISTS idx_advanced_universe_cards_universe ON advanced_universe_cards(universe);

-- Step 11: Update deck_cards card_id column to reference new UUIDs
-- Note: deck_cards.card_id remains VARCHAR(255) as it references different tables
-- based on card_type. The values have already been updated to use the new UUIDs
-- from the main card tables in the previous steps.

-- Step 12: Add foreign key constraints for deck_cards
-- Note: We'll add these as separate constraints since the card_id now references different tables
-- based on card_type. PostgreSQL doesn't support conditional foreign keys directly.

-- Step 13: Clean up temporary table
DROP TABLE id_mappings;

-- Step 14: Add comments for documentation
COMMENT ON COLUMN characters.id IS 'UUID primary key for characters table';
COMMENT ON COLUMN special_cards.id IS 'UUID primary key for special_cards table';
COMMENT ON COLUMN power_cards.id IS 'UUID primary key for power_cards table';
COMMENT ON COLUMN locations.id IS 'UUID primary key for locations table';
COMMENT ON COLUMN missions.id IS 'UUID primary key for missions table';
COMMENT ON COLUMN events.id IS 'UUID primary key for events table';
COMMENT ON COLUMN aspects.id IS 'UUID primary key for aspects table';
COMMENT ON COLUMN teamwork_cards.id IS 'UUID primary key for teamwork_cards table';
COMMENT ON COLUMN ally_universe_cards.id IS 'UUID primary key for ally_universe_cards table';
COMMENT ON COLUMN training_cards.id IS 'UUID primary key for training_cards table';
COMMENT ON COLUMN basic_universe_cards.id IS 'UUID primary key for basic_universe_cards table';
COMMENT ON COLUMN advanced_universe_cards.id IS 'UUID primary key for advanced_universe_cards table';
COMMENT ON COLUMN deck_cards.card_id IS 'UUID reference to card in various card tables based on card_type';

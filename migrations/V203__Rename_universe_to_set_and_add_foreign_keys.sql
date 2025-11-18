-- Rename universe column to set and add foreign key constraints to sets table
-- This migration updates all card tables that have a universe column

-- Step 1: Ensure all existing universe values exist in sets table
-- Insert any missing set codes (this handles edge cases where universe values don't match set codes)
INSERT INTO sets (code, name)
SELECT DISTINCT universe, universe
FROM (
    SELECT universe FROM characters WHERE universe IS NOT NULL
    UNION
    SELECT universe FROM special_cards WHERE universe IS NOT NULL
    UNION
    SELECT universe FROM power_cards WHERE universe IS NOT NULL
    UNION
    SELECT universe FROM locations WHERE universe IS NOT NULL
    UNION
    SELECT universe FROM missions WHERE universe IS NOT NULL
    UNION
    SELECT universe FROM events WHERE universe IS NOT NULL
    UNION
    SELECT universe FROM aspects WHERE universe IS NOT NULL
    UNION
    SELECT universe FROM advanced_universe_cards WHERE universe IS NOT NULL
    UNION
    SELECT universe FROM teamwork_cards WHERE universe IS NOT NULL
    UNION
    SELECT universe FROM ally_universe_cards WHERE universe IS NOT NULL
    UNION
    SELECT universe FROM training_cards WHERE universe IS NOT NULL
    UNION
    SELECT universe FROM basic_universe_cards WHERE universe IS NOT NULL
) AS all_universes
WHERE universe NOT IN (SELECT code FROM sets)
ON CONFLICT (code) DO NOTHING;

-- Step 2: Drop existing indexes on universe columns (will recreate on set column)
DROP INDEX IF EXISTS idx_characters_universe;
DROP INDEX IF EXISTS idx_special_cards_universe;
DROP INDEX IF EXISTS idx_power_cards_universe;
DROP INDEX IF EXISTS idx_locations_universe;
DROP INDEX IF EXISTS idx_missions_universe;
DROP INDEX IF EXISTS idx_events_universe;
DROP INDEX IF EXISTS idx_aspects_universe;
DROP INDEX IF EXISTS idx_advanced_universe_universe;
DROP INDEX IF EXISTS idx_teamwork_universe;
DROP INDEX IF EXISTS idx_ally_universe_universe;
DROP INDEX IF EXISTS idx_training_universe;
DROP INDEX IF EXISTS idx_basic_universe_universe;

-- Step 3: Rename universe column to set and change type to VARCHAR(10) for each table
-- Characters
ALTER TABLE characters 
    RENAME COLUMN universe TO set;
ALTER TABLE characters 
    ALTER COLUMN set TYPE VARCHAR(10) USING set::VARCHAR(10);
ALTER TABLE characters 
    ALTER COLUMN set SET NOT NULL;
ALTER TABLE characters 
    ADD CONSTRAINT fk_characters_set FOREIGN KEY (set) REFERENCES sets(code);

-- Special cards
ALTER TABLE special_cards 
    RENAME COLUMN universe TO set;
ALTER TABLE special_cards 
    ALTER COLUMN set TYPE VARCHAR(10) USING set::VARCHAR(10);
ALTER TABLE special_cards 
    ALTER COLUMN set SET NOT NULL;
ALTER TABLE special_cards 
    ADD CONSTRAINT fk_special_cards_set FOREIGN KEY (set) REFERENCES sets(code);

-- Power cards
ALTER TABLE power_cards 
    RENAME COLUMN universe TO set;
ALTER TABLE power_cards 
    ALTER COLUMN set TYPE VARCHAR(10) USING set::VARCHAR(10);
ALTER TABLE power_cards 
    ALTER COLUMN set SET NOT NULL;
ALTER TABLE power_cards 
    ADD CONSTRAINT fk_power_cards_set FOREIGN KEY (set) REFERENCES sets(code);

-- Locations
ALTER TABLE locations 
    RENAME COLUMN universe TO set;
ALTER TABLE locations 
    ALTER COLUMN set TYPE VARCHAR(10) USING set::VARCHAR(10);
ALTER TABLE locations 
    ALTER COLUMN set SET NOT NULL;
ALTER TABLE locations 
    ADD CONSTRAINT fk_locations_set FOREIGN KEY (set) REFERENCES sets(code);

-- Missions
ALTER TABLE missions 
    RENAME COLUMN universe TO set;
ALTER TABLE missions 
    ALTER COLUMN set TYPE VARCHAR(10) USING set::VARCHAR(10);
ALTER TABLE missions 
    ALTER COLUMN set SET NOT NULL;
ALTER TABLE missions 
    ADD CONSTRAINT fk_missions_set FOREIGN KEY (set) REFERENCES sets(code);

-- Events
ALTER TABLE events 
    RENAME COLUMN universe TO set;
ALTER TABLE events 
    ALTER COLUMN set TYPE VARCHAR(10) USING set::VARCHAR(10);
ALTER TABLE events 
    ALTER COLUMN set SET NOT NULL;
ALTER TABLE events 
    ADD CONSTRAINT fk_events_set FOREIGN KEY (set) REFERENCES sets(code);

-- Aspects
ALTER TABLE aspects 
    RENAME COLUMN universe TO set;
ALTER TABLE aspects 
    ALTER COLUMN set TYPE VARCHAR(10) USING set::VARCHAR(10);
ALTER TABLE aspects 
    ALTER COLUMN set SET NOT NULL;
ALTER TABLE aspects 
    ADD CONSTRAINT fk_aspects_set FOREIGN KEY (set) REFERENCES sets(code);

-- Advanced universe cards
ALTER TABLE advanced_universe_cards 
    RENAME COLUMN universe TO set;
ALTER TABLE advanced_universe_cards 
    ALTER COLUMN set TYPE VARCHAR(10) USING set::VARCHAR(10);
ALTER TABLE advanced_universe_cards 
    ALTER COLUMN set SET NOT NULL;
ALTER TABLE advanced_universe_cards 
    ADD CONSTRAINT fk_advanced_universe_cards_set FOREIGN KEY (set) REFERENCES sets(code);

-- Teamwork cards
ALTER TABLE teamwork_cards 
    RENAME COLUMN universe TO set;
ALTER TABLE teamwork_cards 
    ALTER COLUMN set TYPE VARCHAR(10) USING set::VARCHAR(10);
ALTER TABLE teamwork_cards 
    ALTER COLUMN set SET NOT NULL;
ALTER TABLE teamwork_cards 
    ADD CONSTRAINT fk_teamwork_cards_set FOREIGN KEY (set) REFERENCES sets(code);

-- Ally universe cards
ALTER TABLE ally_universe_cards 
    RENAME COLUMN universe TO set;
ALTER TABLE ally_universe_cards 
    ALTER COLUMN set TYPE VARCHAR(10) USING set::VARCHAR(10);
ALTER TABLE ally_universe_cards 
    ALTER COLUMN set SET NOT NULL;
ALTER TABLE ally_universe_cards 
    ADD CONSTRAINT fk_ally_universe_cards_set FOREIGN KEY (set) REFERENCES sets(code);

-- Training cards
ALTER TABLE training_cards 
    RENAME COLUMN universe TO set;
ALTER TABLE training_cards 
    ALTER COLUMN set TYPE VARCHAR(10) USING set::VARCHAR(10);
ALTER TABLE training_cards 
    ALTER COLUMN set SET NOT NULL;
ALTER TABLE training_cards 
    ADD CONSTRAINT fk_training_cards_set FOREIGN KEY (set) REFERENCES sets(code);

-- Basic universe cards
ALTER TABLE basic_universe_cards 
    RENAME COLUMN universe TO set;
ALTER TABLE basic_universe_cards 
    ALTER COLUMN set TYPE VARCHAR(10) USING set::VARCHAR(10);
ALTER TABLE basic_universe_cards 
    ALTER COLUMN set SET NOT NULL;
ALTER TABLE basic_universe_cards 
    ADD CONSTRAINT fk_basic_universe_cards_set FOREIGN KEY (set) REFERENCES sets(code);

-- Step 4: Recreate indexes on the renamed set column
CREATE INDEX idx_characters_set ON characters(set);
CREATE INDEX idx_special_cards_set ON special_cards(set);
CREATE INDEX idx_power_cards_set ON power_cards(set);
CREATE INDEX idx_locations_set ON locations(set);
CREATE INDEX idx_missions_set ON missions(set);
CREATE INDEX idx_events_set ON events(set);
CREATE INDEX idx_aspects_set ON aspects(set);
CREATE INDEX idx_advanced_universe_set ON advanced_universe_cards(set);
CREATE INDEX idx_teamwork_set ON teamwork_cards(set);
CREATE INDEX idx_ally_universe_set ON ally_universe_cards(set);
CREATE INDEX idx_training_set ON training_cards(set);
CREATE INDEX idx_basic_universe_set ON basic_universe_cards(set);


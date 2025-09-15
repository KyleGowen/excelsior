-- Add missing columns to events table
ALTER TABLE events 
ADD COLUMN mission_set VARCHAR(255),
ADD COLUMN game_effect TEXT,
ADD COLUMN flavor_text TEXT;

-- Create indexes on new columns for faster searches
CREATE INDEX idx_events_mission_set ON events(mission_set);

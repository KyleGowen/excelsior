-- Add mission_set column to missions table
ALTER TABLE missions
ADD COLUMN mission_set VARCHAR(255);

-- Create index on mission_set for filtering
CREATE INDEX idx_missions_mission_set ON missions(mission_set);

-- Add missing columns to locations table
ALTER TABLE locations
ADD COLUMN threat_level INT,
ADD COLUMN special_ability TEXT;

-- Create index on threat_level for filtering
CREATE INDEX idx_locations_threat_level ON locations(threat_level);

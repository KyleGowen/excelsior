-- Add location column to aspects table
ALTER TABLE aspects 
ADD COLUMN location VARCHAR(255);

-- Create index on location for faster searches
CREATE INDEX idx_aspects_location ON aspects(location);

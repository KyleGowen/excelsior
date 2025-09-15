-- Create missions table
CREATE TABLE missions (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    universe VARCHAR(255) NOT NULL,
    mission_description TEXT NOT NULL,
    image_path VARCHAR(500),
    alternate_images TEXT[], -- Array of alternate image paths
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster searches
CREATE INDEX idx_missions_name ON missions(name);

-- Create index on universe for filtering
CREATE INDEX idx_missions_universe ON missions(universe);

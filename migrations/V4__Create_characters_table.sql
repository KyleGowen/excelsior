-- Create characters table
CREATE TABLE characters (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    universe VARCHAR(255) NOT NULL,
    energy INTEGER NOT NULL,
    combat INTEGER NOT NULL,
    brute_force INTEGER NOT NULL,
    intelligence INTEGER NOT NULL,
    image_path VARCHAR(500),
    alternate_images TEXT[], -- Array of alternate image paths
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster searches
CREATE INDEX idx_characters_name ON characters(name);

-- Create index on universe for filtering
CREATE INDEX idx_characters_universe ON characters(universe);

-- Create aspects table
CREATE TABLE aspects (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    universe VARCHAR(255) NOT NULL,
    aspect_description TEXT NOT NULL,
    image_path VARCHAR(500),
    alternate_images TEXT[], -- Array of alternate image paths
    one_per_deck BOOLEAN DEFAULT FALSE,
    fortifications BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster searches
CREATE INDEX idx_aspects_name ON aspects(name);

-- Create index on universe for filtering
CREATE INDEX idx_aspects_universe ON aspects(universe);

-- Create index on one_per_deck for filtering
CREATE INDEX idx_aspects_one_per_deck ON aspects(one_per_deck);

-- Create index on fortifications for filtering
CREATE INDEX idx_aspects_fortifications ON aspects(fortifications);

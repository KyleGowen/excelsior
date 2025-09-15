-- Create events table
CREATE TABLE events (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    universe VARCHAR(255) NOT NULL,
    event_description TEXT NOT NULL,
    image_path VARCHAR(500),
    alternate_images TEXT[], -- Array of alternate image paths
    one_per_deck BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster searches
CREATE INDEX idx_events_name ON events(name);

-- Create index on universe for filtering
CREATE INDEX idx_events_universe ON events(universe);

-- Create index on one_per_deck for filtering
CREATE INDEX idx_events_one_per_deck ON events(one_per_deck);

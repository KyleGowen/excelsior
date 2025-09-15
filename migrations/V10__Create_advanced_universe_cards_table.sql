-- Create advanced_universe_cards table
CREATE TABLE advanced_universe_cards (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    universe VARCHAR(255) NOT NULL,
    card_description TEXT NOT NULL,
    image_path VARCHAR(500),
    alternate_images TEXT[], -- Array of alternate image paths
    one_per_deck BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster searches
CREATE INDEX idx_advanced_universe_name ON advanced_universe_cards(name);

-- Create index on universe for filtering
CREATE INDEX idx_advanced_universe_universe ON advanced_universe_cards(universe);

-- Create index on one_per_deck for filtering
CREATE INDEX idx_advanced_universe_one_per_deck ON advanced_universe_cards(one_per_deck);

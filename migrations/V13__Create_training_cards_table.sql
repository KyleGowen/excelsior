-- Create training_cards table
CREATE TABLE training_cards (
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
CREATE INDEX idx_training_name ON training_cards(name);

-- Create index on universe for filtering
CREATE INDEX idx_training_universe ON training_cards(universe);

-- Create index on one_per_deck for filtering
CREATE INDEX idx_training_one_per_deck ON training_cards(one_per_deck);

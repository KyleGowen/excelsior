-- Create special_cards table
CREATE TABLE special_cards (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    character_name VARCHAR(255) NOT NULL,
    universe VARCHAR(255) NOT NULL,
    card_effect TEXT NOT NULL,
    image_path VARCHAR(500),
    alternate_images TEXT[], -- Array of alternate image paths
    one_per_deck BOOLEAN DEFAULT FALSE,
    cataclysm BOOLEAN DEFAULT FALSE,
    ambush BOOLEAN DEFAULT FALSE,
    assist BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster searches
CREATE INDEX idx_special_cards_name ON special_cards(name);

-- Create index on character_name for filtering
CREATE INDEX idx_special_cards_character ON special_cards(character_name);

-- Create index on universe for filtering
CREATE INDEX idx_special_cards_universe ON special_cards(universe);

-- Create index on one_per_deck for filtering
CREATE INDEX idx_special_cards_one_per_deck ON special_cards(one_per_deck);

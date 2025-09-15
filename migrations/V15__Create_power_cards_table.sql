-- Create power_cards table
CREATE TABLE power_cards (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    power_type VARCHAR(50) NOT NULL, -- Energy, Combat, Brute Force, Intelligence, Any-Power, Multi-Power
    value INTEGER NOT NULL,
    image_path VARCHAR(500),
    alternate_images TEXT[], -- Array of alternate image paths
    one_per_deck BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster searches
CREATE INDEX idx_power_cards_name ON power_cards(name);

-- Create index on power_type for filtering
CREATE INDEX idx_power_cards_type ON power_cards(power_type);

-- Create index on value for sorting
CREATE INDEX idx_power_cards_value ON power_cards(value);

-- Create index on one_per_deck for filtering
CREATE INDEX idx_power_cards_one_per_deck ON power_cards(one_per_deck);
